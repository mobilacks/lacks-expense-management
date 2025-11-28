// app/dashboard/page.tsx

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/api/auth/signin');
  }

  const userRole = session.user?.role || 'user';
  const isAdmin = userRole === 'admin';
  const isAccounting = userRole === 'accounting';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Welcome back, {session.user?.name}!
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                isAdmin 
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                  : isAccounting
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
              }`}>
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </span>
              <Link
                href="/api/auth/signout"
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Sign Out
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* DEBUG INFO - TEMPORARY */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            🔍 Debug Info (Remove this after fixing):
          </h3>
          <pre className="text-xs text-yellow-900 dark:text-yellow-100 overflow-auto">
            {JSON.stringify({
              email: session.user?.email,
              name: session.user?.name,
              role: session.user?.role,
              id: session.user?.id,
              department_id: session.user?.department_id,
            }, null, 2)}
          </pre>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Upload Receipt */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Upload Receipt
              </h3>
              <svg
                className="w-8 h-8 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Upload a new receipt and extract data with AI
            </p>
            <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              Upload Receipt
            </button>
          </div>

          {/* My Reports */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 d
