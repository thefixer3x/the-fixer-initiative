'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react'
import Link from 'next/link'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to error reporting service
    console.error('Admin section error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Error Icon */}
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          
          {/* Error Message */}
          <h1 className="mt-6 text-center text-2xl font-bold text-gray-900">
            Admin Panel Error
          </h1>
          
          <p className="mt-4 text-center text-gray-600">
            An error occurred in the admin control room. This might be due to a database connection issue or data loading problem.
          </p>

          {/* Development Error Details */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-4 bg-gray-100 rounded-lg">
              <p className="text-sm font-semibold text-gray-700 mb-2">Error Details:</p>
              <div className="max-h-40 overflow-y-auto">
                <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap break-words">
                  {error.message}
                </pre>
              </div>
              {error.digest && (
                <p className="text-xs text-gray-600 mt-2">
                  Digest: {error.digest}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 space-y-3">
            <button
              onClick={reset}
              className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </button>
            
            <Link
              href="/admin/dashboard"
              className="w-full inline-flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </div>

          {/* Support Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Troubleshooting Tips:</strong>
            </p>
            <ul className="mt-2 text-xs text-blue-700 space-y-1 list-disc list-inside">
              <li>Check your database connection</li>
              <li>Verify your environment variables</li>
              <li>Ensure you have proper permissions</li>
              <li>Try refreshing the page</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
