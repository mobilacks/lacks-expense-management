// app/(authenticated)/receipts/[id]/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface Expense {
  id: string;
  vendor_name: string;
  amount: number;
  currency: string;
  expense_date: string;
  description: string | null;
  category_id: string | null;
  department_code_id: string | null;
  is_edited: boolean;
  extracted_data: any;
}

interface Receipt {
  id: string;
  image_url: string;
  status: string;
  uploaded_at: string;
  expenses: Expense[];
}

interface Category {
  id: string;
  name: string;
  description: string;
}

interface Department {
  id: string;
  code: string;
  name: string;
}

export default function ReceiptDetailPage() {
  const router = useRouter();
  const params = useParams();
  const receiptId = params.id as string;

  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    vendor_name: '',
    amount: '',
    currency: 'USD',
    expense_date: '',
    description: '',
    category_id: '',
    department_code_id: ''
  });

  // Fetch receipt data
  useEffect(() => {
    fetchReceipt();
    fetchCategories();
    fetchDepartments();
  }, [receiptId]);

  const fetchReceipt = async (retryCount = 0) => {
    try {
      const res = await fetch(`/api/receipts/${receiptId}`);
      if (!res.ok) throw new Error('Failed to fetch receipt');
      
      const data = await res.json();
      setReceipt(data.receipt);
  
      // If we have a receipt but no expense data, and we haven't retried too many times
      if (data.receipt && (!data.receipt.expenses || data.receipt.expenses.length === 0) && retryCount < 3) {
        console.log(`No expense data yet, retrying in 1 second... (attempt ${retryCount + 1}/3)`);
        setTimeout(() => fetchReceipt(retryCount + 1), 1000); // Retry after 1 second
        return; // Don't set loading to false yet
      }
  
      // Populate form with existing data
      if (data.receipt.expenses && data.receipt.expenses[0]) {
        const expense = data.receipt.expenses[0];
        setFormData({
          vendor_name: expense.vendor_name || '',
          amount: expense.amount?.toString() || '',
          currency: expense.currency || 'USD',
          expense_date: expense.expense_date || '',
          description: expense.description || '',
          category_id: expense.category_id || '',
          department_code_id: expense.department_code_id || ''
        });
      }
    } catch (err) {
      console.error('Error fetching receipt:', err);
      setError('Failed to load receipt');
    } finally {
      // Only set loading to false if we're not retrying
      if (!retryCount || retryCount >= 3) {
        setLoading(false);
      }
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments');
      if (!res.ok) throw new Error('Failed to fetch departments');
      const data = await res.json();
      setDepartments(data.departments || []);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      // Validation
      if (!formData.vendor_name.trim()) {
        setError('Vendor name is required');
        return;
      }
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        setError('Valid amount is required');
        return;
      }
      if (!formData.expense_date) {
        setError('Expense date is required');
        return;
      }
      if (!formData.category_id) {
        setError('Please select a category');
        return;
      }
      if (!formData.department_code_id) {
        setError('Please select a department');
        return;
      }

      const res = await fetch(`/api/receipts/${receiptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor_name: formData.vendor_name,
          amount: parseFloat(formData.amount),
          currency: formData.currency,
          expense_date: formData.expense_date,
          description: formData.description,
          category_id: formData.category_id || null,
          department_code_id: formData.department_code_id || null
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save changes');
      }

      const data = await res.json();
      
      if (data.changes_made) {
        setSuccessMessage('Changes saved successfully! All edits have been logged.');
      } else {
        setSuccessMessage('No changes detected.');
      }

      // Refresh receipt data
      await fetchReceipt();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);

    } catch (err: any) {
      console.error('Error saving changes:', err);
      setError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this receipt? This action cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/receipts/${receiptId}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete receipt');
      }

      // Redirect to receipts list
      router.push('/receipts');
    } catch (err: any) {
      console.error('Error deleting receipt:', err);
      setError(err.message || 'Failed to delete receipt');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading receipt...</p>
        </div>
      </div>
    );
  }

  if (error && !receipt) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
          <p className="text-red-800 dark:text-red-200">{error}</p>
          <Link
            href="/receipts"
            className="mt-4 inline-block text-blue-600 hover:text-blue-700 dark:text-blue-400"
          >
            ← Back to Receipts
          </Link>
        </div>
      </div>
    );
  }

  const expense = receipt?.expenses?.[0];
  const imageUrl = receipt?.image_url
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/receipts/${receipt.image_url}`
    : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/receipts"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-2 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Receipts
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Edit Receipt
          </h1>
          {expense?.is_edited && (
            <p className="mt-2 text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              This receipt has been manually edited
            </p>
          )}
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-green-800 dark:text-green-200">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Receipt Image */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Receipt Image
            </h2>
            {imageUrl ? (
              <div className="relative w-full aspect-[3/4] bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                <Image
                  src={imageUrl}
                  alt="Receipt"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-full aspect-[3/4] bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <p className="text-gray-500 dark:text-gray-400">No image available</p>
              </div>
            )}
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              <p>Uploaded: {receipt?.uploaded_at ? new Date(receipt.uploaded_at).toLocaleDateString() : 'N/A'}</p>
              <p>Status: <span className="capitalize">{receipt?.status || 'draft'}</span></p>
            </div>
          </div>

          {/* Edit Form */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Expense Details
            </h2>

            {expense ? (
              <div className="space-y-4">
                {/* Vendor Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Vendor Name *
                  </label>
                  <input
                    type="text"
                    name="vendor_name"
                    value={formData.vendor_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Amazon, Starbucks"
                  />
                </div>

                {/* Amount and Currency */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Amount *
                    </label>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Currency
                    </label>
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="CAD">CAD</option>
                    </select>
                  </div>
                </div>

                {/* Expense Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Expense Date *
                  </label>
                  <input
                    type="date"
                    name="expense_date"
                    value={formData.expense_date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category *
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a category...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Department *
                  </label>
                  <select
                    name="department_code_id"
                    value={formData.department_code_id}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a department...</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.code} - {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description / Notes
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Dinner with client John, Office supplies for Q4"
                  />
                </div>

                {/* Line Items (Read-only display) */}
                {expense.extracted_data?.line_items && expense.extracted_data.line_items.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Line Items (AI Extracted)
                    </label>
                    <div className="space-y-2">
                      {expense.extracted_data.line_items.map((item: any, index: number) => (
                        <div
                          key={index}
                          className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded text-sm"
                        >
                          <span className="text-gray-900 dark:text-white">
                            {item.description}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            ${item.amount?.toFixed(2) || '0.00'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Save Changes
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={saving}
                    className="px-6 py-3 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  * Required fields • All changes are tracked in audit log
                </p>
              </div>
            ) : (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-yellow-800 dark:text-yellow-200">
                  No expense data found. The AI extraction may still be in progress.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
