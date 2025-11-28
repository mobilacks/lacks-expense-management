// app/(authenticated)/receipts/[id]/page.tsx

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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Review Receipt
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Review and edit the extracted data from your receipt
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Receipt Image */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Receipt Image
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
            <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900">
              <Image
                src={imageUrl}
                alt="Receipt"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <p><span className="font-medium">Uploaded:</span> {new Date(receipt.uploaded_at).toLocaleString()}</p>
              <p><span className="font-medium">Source:</span> {receipt.upload_source}</p>
              <p><span className="font-medium">Status:</span> <span className="capitalize">{receipt.status}</span></p>
            </div>
          </div>
        </div>

        {/* Right: Extracted Data */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Extracted Data
          </h2>
          
          {expense ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6 space-y-6">
              {/* Vendor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Vendor / Merchant
                </label>
                <input
                  type="text"
                  defaultValue={expense.vendor_name}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  readOnly
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  defaultValue={expense.expense_date}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  readOnly
                />
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={expense.amount}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    readOnly
                  />
                  <input
                    type="text"
                    defaultValue={expense.currency}
                    className="w-24 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    readOnly
                  />
                </div>
              </div>

              {/* AI Confidence */}
              {expense.extracted_data?.confidence !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    AI Confidence
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${expense.extracted_data.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {Math.round(expense.extracted_data.confidence * 100)}%
                    </span>
                  </div>
                </div>
              )}

              {/* Line Items */}
              {expense.extracted_data?.line_items && expense.extracted_data.line_items.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Line Items
                  </label>
                  <div className="space-y-2">
                    {expense.extracted_data.line_items.map((item: any, index: number) => (
                      <div
                        key={index}
                        className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded"
                      >
                        <span className="text-sm text-gray-900 dark:text-white">
                          {item.description}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          ${item.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw Extracted Data (Debug) */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300">
                    View Raw Data
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded text-xs overflow-auto">
                    {JSON.stringify(expense.extracted_data, null, 2)}
                  </pre>
                </details>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
                  Edit Details
                </button>
                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium">
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-yellow-800 dark:text-yellow-200">
                Data extraction is still in progress... Please refresh the page.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
