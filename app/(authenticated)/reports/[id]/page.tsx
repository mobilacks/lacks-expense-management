'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Upload, 
  FileText, 
  ArrowLeft, 
  Trash2, 
  Edit2,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface Expense {
  vendor_name: string;
  amount: number;
  currency: string;
  expense_date: string;
  is_edited: boolean;
}

interface Receipt {
  id: string;
  image_url: string;
  status: string;
  uploaded_at: string;
  expenses: Expense | Expense[] | null;
}

interface Report {
  id: string;
  title: string;
  status: string;
  total_amount: number;
  submitted_at: string | null;
  created_at: string;
  receipts: Receipt[];
}

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const reportId = resolvedParams.id;
  const router = useRouter();

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const fetchReport = async () => {
    try {
      const res = await fetch(`/api/expense-reports/${reportId}`);
      if (!res.ok) throw new Error('Failed to fetch report');
      
      const data = await res.json();
      setReport(data.report);
      setNewTitle(data.report.title);
    } catch (err) {
      console.error('Error fetching report:', err);
      setError('Failed to load expense report');
    } finally {
      setLoading(false);
    }
  };

  const handleTitleUpdate = async () => {
    if (!newTitle.trim() || newTitle === report?.title) {
      setEditingTitle(false);
      return;
    }

    try {
      const res = await fetch(`/api/expense-reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() }),
      });

      if (!res.ok) throw new Error('Failed to update title');

      const data = await res.json();
      setReport({ ...report!, title: data.report.title });
      setEditingTitle(false);
      showSuccess('Title updated successfully');
    } catch (err) {
      console.error('Error updating title:', err);
      setError('Failed to update title');
    }
  };

  const handleSubmitReport = async () => {
    if (!report || report.receipts.length === 0) {
      setError('Cannot submit report without receipts');
      return;
    }

    if (!confirm('Submit this expense report for review? You will not be able to edit it after submission.')) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/expense-reports/${reportId}/submit`, {
        method: 'POST',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to submit report');
      }

      showSuccess('Report submitted successfully!');
      
      // Redirect to reports list after 2 seconds
      setTimeout(() => {
        router.push('/reports');
      }, 2000);
    } catch (err) {
      console.error('Error submitting report:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit report');
      setSubmitting(false);
    }
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const getExpense = (expenses: Expense | Expense[] | null): Expense | null => {
    if (!expenses) return null;
    if (Array.isArray(expenses)) return expenses[0] || null;
    return expenses;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const isDraft = report?.status === 'draft';
  const receiptCount = report?.receipts?.length || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <Link
            href="/reports"
            className="mt-4 inline-block text-blue-600 hover:text-blue-700"
          >
            Back to Reports
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/reports"
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Reports
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              {editingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onBlur={handleTitleUpdate}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleTitleUpdate();
                      if (e.key === 'Escape') {
                        setNewTitle(report?.title || '');
                        setEditingTitle(false);
                      }
                    }}
                    className="text-3xl font-bold bg-white dark:bg-gray-800 border border-blue-500 rounded px-2 py-1 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {report?.title}
                  </h1>
                  {isDraft && (
                    <button
                      onClick={() => setEditingTitle(true)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}
              <div className="flex items-center gap-3 mt-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(report?.status || '')}`}>
                  {report?.status?.toUpperCase()}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {receiptCount} {receiptCount === 1 ? 'receipt' : 'receipts'}
                </span>
              </div>
            </div>

            {/* Total Amount */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Amount</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                ${report?.total_amount?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <p className="text-green-800 dark:text-green-200">{successMessage}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Upload Receipt Button (if draft) */}
        {isDraft && (
          <div className="mb-6">
            <Link
              href={`/reports/${reportId}/upload`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <Upload className="w-5 h-5" />
              Upload Receipt
            </Link>
          </div>
        )}

        {/* Receipts Grid */}
        {receiptCount === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No receipts yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Upload your first receipt to get started
            </p>
            {isDraft && (
              <Link
                href={`/reports/${reportId}/upload`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <Upload className="w-5 h-5" />
                Upload First Receipt
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {report?.receipts?.map((receipt) => {
              const expense = getExpense(receipt.expenses);
              return (
                <Link
                  key={receipt.id}
                  href={`/receipts/${receipt.id}`}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all"
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
                        <FileText className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Receipt Details */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {expense?.vendor_name || 'Unknown Vendor'}
                    </h3>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                      {expense?.currency || 'USD'} ${expense?.amount?.toFixed(2) || '0.00'}
                    </p>
                    {expense?.is_edited && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 mt-2">
                        ✏️ Edited
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Submit Button */}
        {isDraft && receiptCount > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Ready to submit?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  This report has {receiptCount} {receiptCount === 1 ? 'receipt' : 'receipts'} totaling ${report?.total_amount?.toFixed(2)}
                </p>
              </div>
              <button
                onClick={handleSubmitReport}
                disabled={submitting}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Submit Report
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
