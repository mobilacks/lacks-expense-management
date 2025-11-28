'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Lacks Expense Management
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{session.user?.name}</p>
              <p className="text-xs text-gray-500">{session.user?.role}</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-2xl font-semibold mb-4">Welcome back, {session.user?.name}!</h2>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mt-8">
            {/* Quick Stats */}
            <div className="rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Expenses</h3>
              <p className="mt-2 text-3xl font-semibold text-gray-900">$0.00</p>
            </div>
            
            <div className="rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-500">Pending Reports</h3>
              <p className="mt-2 text-3xl font-semibold text-gray-900">0</p>
            </div>
            
            <div className="rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-500">This Month</h3>
              <p className="mt-2 text-3xl font-semibold text-gray-900">$0.00</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <button className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-blue-500 hover:bg-blue-50">
                <p className="font-medium text-gray-900">Upload Receipt</p>
              </button>
              
              <button className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-blue-500 hover:bg-blue-50">
                <p className="font-medium text-gray-900">New Expense Report</p>
              </button>
              
              <button className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-blue-500 hover:bg-blue-50">
                <p className="font-medium text-gray-900">View Reports</p>
              </button>
              
              {session.user?.role === 'admin' && (
                <button className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center hover:border-blue-500 hover:bg-blue-50">
                  <p className="font-medium text-gray-900">Admin Panel</p>
                </button>
              )}
            </div>
          </div>

          {/* Coming Soon */}
          <div className="mt-8 rounded-lg bg-blue-50 p-6">
            <h3 className="text-lg font-semibold text-blue-900">🚧 Under Construction</h3>
            <p className="mt-2 text-sm text-blue-700">
              We're building out the expense management features. Check back soon!
            </p>
            <ul className="mt-4 space-y-2 text-sm text-blue-700">
              <li>✅ Office 365 SSO Authentication</li>
              <li>✅ User Dashboard</li>
              <li>🔨 Receipt Upload & AI Extraction</li>
              <li>🔨 Expense Report Creation</li>
              <li>🔨 Accounting Review Portal</li>
              <li>🔨 Admin Panel</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
