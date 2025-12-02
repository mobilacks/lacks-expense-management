'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface Expense {
  vendor_name: string;
  amount: number;
  currency: string;
  expense_date: string;
  is_edited: boolean;
}

interface ExpenseReport {
  id: string;
  title: string;
  status: string;
}

interface Receipt {
  id: string;
  image_url: string;
  status: string;
  uploaded_at: string;
  expense_report_id: string | null;
  expenses: Expense | Expense[] | null;
  expense_reports: ExpenseReport | null;
}

export default function ReceiptsListPage() {
  const router = useRouter();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      const res = await fetch('/api/receipts');
      if (!res.ok) throw new Error('Failed to fetch receipts');
      
      const data = await res.json();
      setReceipts(data.receipts || []);
    } catch (err) {
      console.error('Error fetching receipts:', err);
      setError('Failed to load receipts');
    } finally {
      setLoading(false);
    }
  };

  // Helper to get expense (handle both object and array from Supabase)
  const getExpense = (expenses: Expense | Expense[] | null): Expense | null => {
    if (!expenses) return null;
    if (Array.isArray(expenses)) return expenses[0] || null;
    return expenses;
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: // draft
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Check if receipt is editable
  const isEditable = (status: string) => {
    return status === 'draft';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading receipts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header - NO UPLOAD BUTTON */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Receipts
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            View all your uploaded receipts and their expense report assignments
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Receipts Grid */}
        {receipts.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No receipts yet
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Create an expense report to start uploading receipts
            </p>
            <Link
              href="/dashboard"
              className="mt-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {receipts.map((receipt) => {
              const expense = getExpense(receipt.expenses);
              const canEdit = isEditable(receipt.status);

              return (
                <Link
                  key={receipt.id}
                  href={`/receipts/${receipt.id}`}
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all ${
                    canEdit
                      ? 'hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer'
                      : 'opacity-75 cursor-default'
                  }`}
                >
                  {/* Receipt Image */}
                  <div className="relative h-48 bg-gray-100 dark:bg-gray-700">
                    {receipt.image_url ? (
                      <Image
                        src={receipt.image_url}
                        alt="Receipt"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <svg
                          className="h-12 w-12 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Receipt Details */}
                  <div className="p-4">
                    {/* Vendor & Amount */}
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                        {expense?.vendor_name || 'Unknown Vendor'}
                      </h3>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                        {expense?.currency || 'USD'} ${expense?.amount?.toFixed(2) || '0.00'}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(receipt.status)}`}>
                        {receipt.status.toUpperCase()}
                      </span>
                      
                      {expense?.is_edited && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                          ✏️ EDITED
                        </span>
                      )}

                      {!canEdit && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                          🔒 LOCKED
                        </span>
                      )}
                    </div>

                    {/* Expense Report Info */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                      <div className="flex items-start gap-2">
                        <svg
                          className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            Report:
                          </p>
                          {receipt.expense_reports ? (
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {receipt.expense_reports.title}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                              Unassigned
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Upload Date */}
                    <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                      Uploaded: {new Date(receipt.uploaded_at).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
