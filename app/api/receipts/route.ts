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

    // Generate signed URLs for receipt images
    const receiptsWithSignedUrls = await Promise.all(
      (receipts || []).map(async (receipt) => {
        if (receipt.image_url) {
          // Extract the path from the full URL if it's a full URL
          let imagePath = receipt.image_url;
          
          // If it's already a full URL, extract just the path
          if (imagePath.includes('supabase.co')) {
            const urlParts = imagePath.split('/storage/v1/object/public/receipts/');
            imagePath = urlParts[1] || imagePath;
          }
          
          // If it doesn't start with receipts/, add it
          if (!imagePath.startsWith('receipts/')) {
            imagePath = imagePath;
          } else {
            // Remove 'receipts/' prefix if present since we specify bucket name
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

    return Response.json({ receipts: receiptsWithSignedUrls || [] });
  } catch (error) {
    console.error('Error in GET /api/receipts:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
