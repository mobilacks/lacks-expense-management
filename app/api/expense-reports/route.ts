import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Create new expense report
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title } = body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return Response.json({ error: 'Title is required' }, { status: 400 });
    }

    const userId = session.user.id;

    // Create expense report
    const { data: report, error } = await supabase
      .from('expense_reports')
      .insert({
        user_id: userId,
        title: title.trim(),
        status: 'draft',
        total_amount: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating report:', error);
      return Response.json({ error: 'Failed to create expense report' }, { status: 500 });
    }

    // Create audit log entry
    await supabase.from('audit_log').insert({
      entity_type: 'expense_report',
      entity_id: report.id,
      action: 'created',
      user_id: userId,
      changes: {
        after: {
          title: report.title,
          status: report.status,
        },
      },
    });

    return Response.json({ report }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/expense-reports:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - List all user's expense reports
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');

    // Build query
    let query = supabase
      .from('expense_reports')
      .select(`
        *,
        receipts(id)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Apply status filter if provided
    if (statusFilter && ['draft', 'submitted', 'approved', 'rejected'].includes(statusFilter)) {
      query = query.eq('status', statusFilter);
    }

    const { data: reports, error } = await query;

    if (error) {
      console.error('Supabase error fetching reports:', error);
      return Response.json({ error: 'Failed to fetch expense reports' }, { status: 500 });
    }

    // Transform data to include receipt count
    const reportsWithCount = (reports || []).map((report) => ({
      id: report.id,
      title: report.title,
      status: report.status,
      total_amount: report.total_amount,
      receipt_count: Array.isArray(report.receipts) ? report.receipts.length : 0,
      submitted_at: report.submitted_at,
      reviewed_at: report.reviewed_at,
      reviewed_by: report.reviewed_by,
      rejection_note: report.rejection_note,
      created_at: report.created_at,
      updated_at: report.updated_at,
    }));

    return Response.json({ reports: reportsWithCount });
  } catch (error) {
    console.error('Error in GET /api/expense-reports:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
