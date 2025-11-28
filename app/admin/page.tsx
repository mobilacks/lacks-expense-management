import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, 
  Building2, 
  Tags, 
  FileText, 
  TrendingUp,
  DollarSign 
} from 'lucide-react';

export default async function AdminDashboard() {
  const session = await getServerSession();
  
  if (!session) {
    redirect('/auth/signin');
  }

  // TODO: Add role check - only allow admin role
  // if (session.user.role !== 'admin') {
  //   redirect('/dashboard');
  // }

  const adminCards = [
    {
      title: 'User Management',
      description: 'Add, edit, and manage user accounts',
      icon: Users,
      href: '/admin/users',
      color: 'bg-blue-500 dark:bg-blue-600',
    },
    {
      title: 'Departments',
      description: 'Manage organizational departments',
      icon: Building2,
      href: '/admin/departments',
      color: 'bg-green-500 dark:bg-green-600',
    },
    {
      title: 'Categories',
      description: 'Manage expense categories',
      icon: Tags,
      href: '/admin/categories',
      color: 'bg-purple-500 dark:bg-purple-600',
    },
    {
      title: 'All Reports',
      description: 'View all expense reports across organization',
      icon: FileText,
      href: '/admin/reports',
      color: 'bg-orange-500 dark:bg-orange-600',
    },
    {
      title: 'Analytics',
      description: 'Spending trends and analytics',
      icon: TrendingUp,
      href: '/admin/analytics',
      color: 'bg-pink-500 dark:bg-pink-600',
    },
    {
      title: 'Budget Overview',
      description: 'Department budgets and spending',
      icon: DollarSign,
      href: '/admin/budgets',
      color: 'bg-indigo-500 dark:bg-indigo-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage users, departments, categories, and view system-wide reports
          </p>
        </div>

        {/* Admin Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminCards.map((card) => {
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
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Users</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">--</div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">Connect to database</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Departments</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">--</div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">Connect to database</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Expense Categories</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">--</div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">Connect to database</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending Reports</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">--</div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">Connect to database</div>
          </div>
        </div>
      </div>
    </div>
  );
}
