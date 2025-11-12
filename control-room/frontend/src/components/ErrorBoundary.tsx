'use client'

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    console.error('Error Boundary caught an error:', error, errorInfo)
    
    // TODO: Log to error reporting service (Sentry, etc.)
    // logErrorToService(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              
              <h2 className="mt-4 text-center text-2xl font-bold text-gray-900">
                Something went wrong
              </h2>
              
              <p className="mt-2 text-center text-sm text-gray-600">
                We&apos;re sorry, but something unexpected happened. Please try refreshing the page.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mt-4 p-4 bg-gray-100 rounded-md">
                  <p className="text-xs font-mono text-gray-800 break-words">
                    {this.state.error.toString()}
                  </p>
                </div>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Page
                </button>
                
                <button
                  onClick={() => window.location.href = '/'}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Go Home
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Simple Error Display Component
 * For displaying errors in specific sections
 */
export function ErrorDisplay({ 
  error, 
  onRetry 
}: { 
  error: Error | string
  onRetry?: () => void 
}) {
  const errorMessage = typeof error === 'string' ? error : error.message

  return (
    <div className="rounded-md bg-red-50 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-red-400" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">Error</h3>
          <p className="mt-2 text-sm text-red-700">{errorMessage}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 text-sm font-medium text-red-800 hover:text-red-900"
            >
              Try again →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
