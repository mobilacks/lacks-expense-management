import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Get single expense report with all receipts
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const reportId = params.id;
    const userId = session.user.id;
    const userRole = session.user.role || 'user';

    // Fetch report with receipts and expenses
    const { data: report, error } = await supabase
      .from('expense_reports')
      .select(`
        *,
        receipts (
          *,
          expenses (*)
        )
      `)
      .eq('id', reportId)
      .single();

    if (error) {
      console.error('Supabase error fetching report:', error);
      return Response.json({ error: 'Expense report not found' }, { status: 404 });
    }

    // Check authorization (user can only see their own reports, unless admin/accounting)
    if (report.user_id !== userId && userRole !== 'admin' && userRole !== 'accounting') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Generate signed URLs for receipt images
    if (report.receipts && Array.isArray(report.receipts)) {
      report.receipts = await Promise.all(
        report.receipts.map(async (receipt: any) => {
          if (receipt.image_url) {
            let imagePath = receipt.image_url;

            // Remove 'receipts/' prefix if present
            if (imagePath.startsWith('receipts/')) {
              imagePath = imagePath.replace('receipts/', '');
            }

            // Generate signed URL (valid for 1 hour)
            const { data: signedUrlData } = await supabase.storage
              .from('receipts')
              .createSignedUrl(imagePath, 3600);

            if (signedUrlData?.signedUrl) {
              receipt.image_url = signedUrlData.signedUrl;
            }
          }

          return receipt;
        })
      );
    }

    return Response.json({ report });
  } catch (error) {
    console.error('Error in GET /api/expense-reports/[id]:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update expense report (title only, if draft)
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const reportId = params.id;
    const userId = session.user.id;

    const body = await request.json();
    const { title } = body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return Response.json({ error: 'Title is required' }, { status: 400 });
    }

    // Check if report exists and user owns it
    const { data: existingReport, error: fetchError } = await supabase
      .from('expense_reports')
      .select('id, title, status, user_id')
      .eq('id', reportId)
      .single();

    if (fetchError || !existingReport) {
      return Response.json({ error: 'Expense report not found' }, { status: 404 });
    }

    if (existingReport.user_id !== userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Can only edit title if status is draft
    if (existingReport.status !== 'draft') {
      return Response.json({ error: 'Cannot edit submitted report' }, { status: 400 });
    }

    // Update report title
    const { data: updatedReport, error: updateError } = await supabase
      .from('expense_reports')
      .update({ title: title.trim() })
      .eq('id', reportId)
      .select()
      .single();

    if (updateError) {
      console.error('Supabase error updating report:', updateError);
      return Response.json({ error: 'Failed to update expense report' }, { status: 500 });
    }

    // Create audit log entry
    await supabase.from('audit_log').insert({
      entity_type: 'expense_report',
      entity_id: reportId,
      action: 'updated',
      user_id: userId,
      changes: {
        before: { title: existingReport.title },
        after: { title: updatedReport.title },
      },
    });

    return Response.json({ report: updatedReport });
  } catch (error) {
    console.error('Error in PATCH /api/expense-reports/[id]:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete draft expense report
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const reportId = params.id;
    const userId = session.user.id;

    // Check if report exists and user owns it
    const { data: existingReport, error: fetchError } = await supabase
      .from('expense_reports')
      .select('id, status, user_id')
      .eq('id', reportId)
      .single();

    if (fetchError || !existingReport) {
      return Response.json({ error: 'Expense report not found' }, { status: 404 });
    }

    if (existingReport.user_id !== userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Can only delete draft reports
    if (existingReport.status !== 'draft') {
      return Response.json({ error: 'Cannot delete submitted report' }, { status: 400 });
    }

    // Get all receipts in this report to delete their images
    const { data: receipts } = await supabase
      .from('receipts')
      .select('id, image_url')
      .eq('expense_report_id', reportId);

    // Delete images from storage
    if (receipts && receipts.length > 0) {
      const imagePaths = receipts
        .map((r) => r.image_url)
        .filter((url) => url)
        .map((url) => url.replace('receipts/', ''));

      if (imagePaths.length > 0) {
        await supabase.storage.from('receipts').remove(imagePaths);
      }
    }

    // Delete report (cascade will delete receipts and expenses)
    const { error: deleteError } = await supabase
      .from('expense_reports')
      .delete()
      .eq('id', reportId);

    if (deleteError) {
      console.error('Supabase error deleting report:', deleteError);
      return Response.json({ error: 'Failed to delete expense report' }, { status: 500 });
    }

    // Create audit log entry
    await supabase.from('audit_log').insert({
      entity_type: 'expense_report',
      entity_id: reportId,
      action: 'deleted',
      user_id: userId,
      changes: {},
    });

    return Response.json({ message: 'Expense report deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/expense-reports/[id]:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
