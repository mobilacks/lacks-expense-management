// app/(authenticated)/receipts/[id]/page.tsx
// Change the supabase client at the top to use service role for reading

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import Image from 'next/image';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export default async function ReceiptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/api/auth/signin');
  }

  // Fetch receipt data
  const { data: receipt, error: receiptError } = await supabaseAdmin
    .from('receipts')
    .select('*')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single();

  if (receiptError || !receipt) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">
            Receipt not found or you don't have permission to view it.
          </p>
        </div>
      </div>
    );
  }

  // Fetch expense data (extracted data)
  const { data: expense } = await supabaseAdmin
    .from('expenses')
    .select('*')
    .eq('receipt_id', id)
    .single();

  // Get image URL
  const { data: imageUrlData } = supabaseAdmin
    .storage
    .from('receipts')
    .getPublicUrl(receipt.image_url);

  const imageUrl = imageUrlData.publicUrl;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ... rest of the component stays the same ... */}
      {/* (keep all the existing JSX from the previous version) */}
    </div>
  );
}
