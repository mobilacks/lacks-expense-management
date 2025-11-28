import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Receipt, 
  FileText, 
  TrendingUp, 
  Settings,
  DollarSign,
  Calendar
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

  const dashboardCards = [
    {
      title: 'Upload Receipt',
      description: 'Snap a photo or upload a receipt image',
      icon: Receipt,
      href: '/receipts/upload',
      color: 'bg-blue-500 dark:bg-blue-600',
    },
    {
      title: 'My Reports',
      description: 'View and manage your expense reports',
      icon: FileText,
      href: '/reports',
      color: 'bg-green-500 dark:bg-green-600',
    },
    {
      title: 'Analytics',
      description: 'Track your spending trends',
      icon: TrendingUp,
      href: '/analytics',
      color: 'bg-purple-500 dark:bg-purple-600',
    },
  ];

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
                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}>
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </span>
          </div>
        </div>

        {/* Admin/Accounting Quick Access */}
        {(isAdmin || isAccounting) && (
          <div className="mb-8 flex flex-wrap gap-4">
            {isAdmin && (
              <Link
                href="/admin"
                className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Settings className="w-5 h-5 mr-2" />
                Admin Panel
              </Link>
            )}
            {isAccounting && (
              <Link
                href="/accounting"
                className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
              >
                <FileText className="w-5 h-5 mr-2" />
                Review Reports
              </Link>
            )}
          </div>
        )}

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {dashboardCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                <div className="p-6">
                  <div className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {card.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {card.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending Reports</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">--</div>
              </div>
              <FileText className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">Connect to view data</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">This Month</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">$--</div>
              </div>
              <DollarSign className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">Total expenses</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Last Submission</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">--</div>
              </div>
              <Calendar className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">Days ago</div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Recent Activity
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              No recent activity. Upload your first receipt to get started!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
