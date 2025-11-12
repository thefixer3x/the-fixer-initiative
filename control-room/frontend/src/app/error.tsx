'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Error Icon */}
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          
          {/* Error Message */}
          <h1 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Oops! Something went wrong
          </h1>
          
          <p className="mt-4 text-center text-gray-600">
            We apologize for the inconvenience. An unexpected error occurred while loading this page.
          </p>

          {/* Development Error Details */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-4 bg-gray-100 rounded-md">
              <p className="text-sm font-semibold text-gray-700 mb-2">Error Details:</p>
              <p className="text-xs font-mono text-gray-800 break-words">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-gray-600 mt-2">
                  Digest: {error.digest}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              onClick={reset}
              className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </button>
            
            <button
              onClick={() => window.location.href = '/'}
              className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </button>
          </div>

          {/* Support Info */}
          <p className="mt-6 text-center text-sm text-gray-500">
            If this problem persists, please contact support.
          </p>
        </div>
      </div>
    </div>
  )
}
