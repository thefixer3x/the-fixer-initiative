'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/StackAuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Database, CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SupabaseMetrics {
  totalTables: number
  totalUsers: number
  connectionStatus: 'healthy' | 'error'
  responseTime: number
  lastChecked: string
}

export default function SupabasePage() {
  const { user } = useAuth()
  const router = useRouter()
  const [metrics] = useState<SupabaseMetrics>({
    totalTables: 15,
    totalUsers: 1247,
    connectionStatus: 'healthy',
    responseTime: 120,
    lastChecked: new Date().toISOString()
  })
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<{ timestamp: string; status: string; message: string; responseTime?: number }[]>([])

  const testConnection = async () => {
    setIsLoading(true)
    try {
      // Mock test - replace with actual Supabase connection test
      await new Promise(resolve => setTimeout(resolve, 1000))
      const newResult = {
        timestamp: new Date().toISOString(),
        status: 'success',
        responseTime: Math.floor(Math.random() * 200) + 50,
        message: 'Connection successful'
      }
      setTestResults(prev => [newResult, ...prev.slice(0, 4)])
    } catch {
      const newResult = {
        timestamp: new Date().toISOString(),
        status: 'error',
        responseTime: 0,
        message: 'Connection failed'
      }
      setTestResults(prev => [newResult, ...prev.slice(0, 4)])
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Authentication Required
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Please sign in to access the Supabase management dashboard.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to Dashboard
          </button>
        </div>

        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 flex items-center">
              <Database className="h-8 w-8 text-green-600 mr-3" />
              Supabase Database Management
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Original production database with authentication and core business logic
            </p>
          </div>
        </div>

        {/* Connection Status */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Connection Status</h3>
              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                metrics.connectionStatus === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {metrics.connectionStatus === 'healthy' ? (
                  <CheckCircle className="h-4 w-4 mr-1" />
                ) : (
                  <XCircle className="h-4 w-4 mr-1" />
                )}
                {metrics.connectionStatus}
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Tables</dt>
                <dd className="text-2xl font-semibold text-gray-900">{metrics.totalTables}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Users</dt>
                <dd className="text-2xl font-semibold text-gray-900">{metrics.totalUsers}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Response Time</dt>
                <dd className="text-2xl font-semibold text-gray-900">{metrics.responseTime}ms</dd>
              </div>
            </div>
          </div>
        </div>

        {/* Connection Testing */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Connection Testing</h3>
              <button
                onClick={testConnection}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Clock className="animate-spin h-4 w-4 mr-2" />
                    Testing...
                  </>
                ) : (
                  'Test Connection'
                )}
              </button>
            </div>

            {testResults.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Tests</h4>
                <div className="space-y-2">
                  {testResults.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        {result.status === 'success' ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500 mr-2" />
                        )}
                        <span className="text-sm text-gray-900">{result.message}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(result.timestamp).toLocaleTimeString()}
                        {result.responseTime && result.responseTime > 0 && ` | ${result.responseTime}ms`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Database Schema Overview */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Database Schema</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-md p-4">
                <h4 className="font-medium text-gray-900">auth schema</h4>
                <p className="text-sm text-gray-500 mt-1">User authentication and session management</p>
                <div className="mt-2 text-xs text-gray-400">Tables: users, sessions, refresh_tokens</div>
              </div>
              <div className="border rounded-md p-4">
                <h4 className="font-medium text-gray-900">public schema</h4>
                <p className="text-sm text-gray-500 mt-1">Core application data and business logic</p>
                <div className="mt-2 text-xs text-gray-400">Tables: profiles, organizations, apps</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
