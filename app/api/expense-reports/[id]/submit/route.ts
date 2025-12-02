import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Submit expense report to accounting
export async function POST(
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

    // Fetch report with receipts count
    const { data: report, error: fetchError } = await supabase
      .from('expense_reports')
      .select(`
        *,
        receipts(id)
      `)
      .eq('id', reportId)
      .single();

    if (fetchError || !report) {
      return Response.json({ error: 'Expense report not found' }, { status: 404 });
    }

    // Check ownership
    if (report.user_id !== userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Can only submit draft reports
    if (report.status !== 'draft') {
      return Response.json({ error: 'Report has already been submitted' }, { status: 400 });
    }

    // Must have at least 1 receipt
    const receiptCount = Array.isArray(report.receipts) ? report.receipts.length : 0;
    if (receiptCount === 0) {
      return Response.json({ error: 'Cannot submit report without receipts' }, { status: 400 });
    }

    // Update report status to submitted
    const { data: updatedReport, error: updateError } = await supabase
      .from('expense_reports')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', reportId)
      .select()
      .single();

    if (updateError) {
      console.error('Supabase error updating report:', updateError);
      return Response.json({ error: 'Failed to submit expense report' }, { status: 500 });
    }

    // Update all receipts in this report to submitted
    const { error: receiptsError } = await supabase
      .from('receipts')
      .update({ status: 'submitted' })
      .eq('expense_report_id', reportId)
      .eq('status', 'draft'); // Only update draft receipts

    if (receiptsError) {
      console.error('Supabase error updating receipts:', receiptsError);
      // Rollback report status
      await supabase
        .from('expense_reports')
        .update({ status: 'draft', submitted_at: null })
        .eq('id', reportId);
      
      return Response.json({ error: 'Failed to submit receipts' }, { status: 500 });
    }

    // Create audit log entry
    await supabase.from('audit_log').insert({
      entity_type: 'expense_report',
      entity_id: reportId,
      action: 'submitted',
      user_id: userId,
      changes: {
        before: { status: 'draft' },
        after: { status: 'submitted', submitted_at: updatedReport.submitted_at },
      },
    });

    return Response.json({ 
      report: updatedReport,
      message: 'Expense report submitted successfully'
    });
  } catch (error) {
    console.error('Error in POST /api/expense-reports/[id]/submit:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
