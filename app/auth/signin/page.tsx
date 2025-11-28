'use client'

import { signIn } from 'next-auth/react'

export default function SignIn() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-10 shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Lacks Expense Management
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in with your Office 365 account
          </p>
        </div>
        
        <div className="mt-8">
          <button
            onClick={() => signIn('azure-ad', { callbackUrl: '/dashboard' })}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z"/>
            </svg>
            Sign in with Microsoft
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-gray-500">
          Only authorized users can access this system.<br />
          Contact your administrator if you need access.
        </p>
      </div>
    </div>
  )
}
