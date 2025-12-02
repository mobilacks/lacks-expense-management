import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch receipts with expenses and expense_reports data
    const { data: receipts, error } = await supabase
      .from('receipts')
      .select(`
        *,
        expenses (*),
        expense_reports (
          id,
          title,
          status
        )
      `)
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return Response.json({ error: 'Failed to fetch receipts' }, { status: 500 });
    }

    return Response.json({ receipts: receipts || [] });
  } catch (error) {
    console.error('Error in GET /api/receipts:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
