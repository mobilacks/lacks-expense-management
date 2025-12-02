import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  PlusCircle,
  FileText, 
  Receipt,
  TrendingUp, 
  Settings,
  ClipboardList
} from 'lucide-react';

export default async function Dashboard() {
  const session = await getServerSession();
  
  if (!session) {
    redirect('/auth/signin');
  }

  // Get user role from session (now properly set by NextAuth)
  const userRole = session.user?.role || 'user';
  const isAdmin = userRole === 'admin';
  const isAccounting = userRole === 'accounting' || userRole === 'admin';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Welcome back, {session.user?.name || 'User'}!
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your expenses and track your spending
          </p>
          {/* Show role badge */}
          <div className="mt-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              userRole === 'admin'
                ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                : userRole === 'accounting'
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
            }`}>
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </span>
          </div>
        </div>

        {/* PRIMARY ACTION - Create Expense Report */}
        <div className="mb-8">
          <Link
            href="/reports/new"
            className="group relative block w-full sm:w-auto"
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 p-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
              {/* Background pattern */}
              <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]" />
              
              <div className="relative flex flex-col sm:flex-row items-center gap-6">
                {/* Icon */}
                <div className="flex-shrink-0 p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
                  <PlusCircle className="w-12 h-12 text-white" strokeWidth={2.5} />
                </div>
                
                {/* Content */}
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Create Expense Report
                  </h2>
                  <p className="text-blue-100 text-lg">
                    Start a new expense report and upload receipts
                  </p>
                </div>
                
                {/* Arrow */}
                <div className="flex-shrink-0 hidden sm:block">
                  <svg
                    className="w-6 h-6 text-white transform group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Quick Actions Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* My Reports */}
            <Link
              href="/reports"
              className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                    My Reports
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    View and manage your expense reports
                  </p>
                </div>
              </div>
            </Link>

            {/* My Receipts */}
            <Link
              href="/receipts"
              className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Receipt className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    My Receipts
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    View all your uploaded receipts
                  </p>
                </div>
              </div>
            </Link>

            {/* Analytics */}
            <Link
              href="/analytics"
              className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all p-6 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    Analytics
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Track your spending trends
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Role-Specific Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Accounting Portal */}
          {isAccounting && (
            <Link
              href="/accounting"
              className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all p-6 border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <ClipboardList className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Review Reports
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Review and approve submitted expense reports
                  </p>
                </div>
                <svg
                  className="w-5 h-5 text-blue-600 dark:text-blue-400 transform group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          )}

          {/* Admin Panel */}
          {isAdmin && (
            <Link
              href="/admin"
              className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all p-6 border-2 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Settings className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    Admin Panel
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Manage users, departments, and categories
                  </p>
                </div>
                <svg
                  className="w-5 h-5 text-purple-600 dark:text-purple-400 transform group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          )}
        </div>

        {/* Quick Stats (Placeholder - will be dynamic later) */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Receipts</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">0</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending Reports</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">0</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Spent</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">$0.00</p>
          </div>
        </div>
      </div>
    </div>
  );
}

