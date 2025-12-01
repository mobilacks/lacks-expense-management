import { getServerSession } from 'next-auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's receipts with expense data
    const { data: receipts, error } = await supabase
      .from('receipts')
      .select(`
        id,
        image_url,
        status,
        uploaded_at,
        expenses (
          vendor_name,
          amount,
          currency,
          expense_date,
          is_edited
        )
      `)
      .eq('user_id', user.id)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;

    return Response.json({ receipts });
  } catch (error) {
    console.error('Error fetching receipts:', error);
    return Response.json(
      { error: 'Failed to fetch receipts' },
      { status: 500 }
    );
  }
}
