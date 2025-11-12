'use client'

import React, { useState, useEffect } from 'react'
import { Database, Server, Key, Bell, Shield, Save, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { multiDB } from '@/lib/multi-database'
import type { DatabaseMetrics } from '@/lib/types'
import { ErrorDisplay } from '@/components/ErrorBoundary'
import { DatabaseHealthMonitor, DataComparisonTool } from '@/components/DatabaseComparison'

export default function SettingsPage() {
  const [dbMetrics, setDbMetrics] = useState<DatabaseMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [testingConnection, setTestingConnection] = useState<string | null>(null)

  // Fetch database metrics
  const fetchDatabaseMetrics = async () => {
    try {
      setLoading(true)
      setError(null)
      const metrics = await multiDB.getAllDatabaseMetrics()
      setDbMetrics(metrics)
    } catch (err) {
      setError(err as Error)
      console.error('Failed to fetch database metrics:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDatabaseMetrics()
  }, [])

  // Test database connection
  const testConnection = async (providerId: string) => {
    setTestingConnection(providerId)
    try {
      await multiDB.getAllDatabaseMetrics()
      // Refresh metrics after test
      await fetchDatabaseMetrics()
    } catch (err) {
      console.error('Connection test failed:', err)
    } finally {
      setTestingConnection(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage system configuration, database connections, and preferences
          </p>
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </button>
      </div>

      {/* Database Connections Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                <Database className="h-5 w-5 mr-2 text-gray-400" />
                Database Connections
              </h3>
              <p className="mt-1 text-sm text-gray-500">Manage and monitor database provider connections</p>
            </div>
            <button
              onClick={fetchDatabaseMetrics}
              disabled={loading}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="px-4 py-4">
            <ErrorDisplay error={error} onRetry={fetchDatabaseMetrics} />
          </div>
        )}

        {/* Database Providers List */}
        <div className="divide-y divide-gray-200">
          {loading && dbMetrics.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <RefreshCw className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-2" />
              <p className="text-gray-500">Loading database connections...</p>
            </div>
          ) : dbMetrics.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p>No database connections configured</p>
            </div>
          ) : (
            dbMetrics.map((db) => (
              <div key={db.providerId} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <Server className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{db.providerName}</h4>
                        <p className="text-xs text-gray-500">Provider ID: {db.providerId}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    {/* Connection Status */}
                    <div className="text-right">
                      <div className="flex items-center">
                        {db.connectionStatus === 'healthy' ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                        )}
                        <span className={`text-sm font-medium ${
                          db.connectionStatus === 'healthy' 
                            ? 'text-green-700'
                            : db.connectionStatus === 'degraded'
                            ? 'text-yellow-700'
                            : 'text-red-700'
                        }`}>
                          {db.connectionStatus}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Response: {db.responseTime}ms</p>
                    </div>

                    {/* Metrics */}
                    <div className="text-right">
                      <p className="text-sm text-gray-900">{db.tableCount} tables</p>
                      <p className="text-xs text-gray-500">{db.schemaCount} schemas</p>
                    </div>

                    {/* Actions */}
                    <button
                      onClick={() => testConnection(db.providerId)}
                      disabled={testingConnection === db.providerId}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      {testingConnection === db.providerId ? (
                        <>
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        'Test Connection'
                      )}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {db.errorMessage && (
                  <div className="mt-3 p-3 bg-red-50 rounded-md">
                    <p className="text-xs text-red-700">{db.errorMessage}</p>
                  </div>
                )}

                {/* Last Checked */}
                <div className="mt-2 text-xs text-gray-500">
                  Last checked: {new Date(db.lastChecked).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* API Configuration Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
            <Key className="h-5 w-5 mr-2 text-gray-400" />
            API Configuration
          </h3>
          <p className="mt-1 text-sm text-gray-500">Configure API keys and access credentials</p>
        </div>
        <div className="px-6 py-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Supabase URL</label>
              <input
                type="text"
                disabled
                value={process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not configured'}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Neon Database URL</label>
              <input
                type="password"
                disabled
                value={process.env.NEON_DATABASE_URL ? '••••••••••••••••' : 'Not configured'}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-500 sm:text-sm"
              />
            </div>
            <div className="pt-4">
              <p className="text-xs text-gray-500">
                <Shield className="h-4 w-4 inline mr-1" />
                Environment variables are securely managed. Update via .env.local or deployment settings.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
            <Bell className="h-5 w-5 mr-2 text-gray-400" />
            Notifications
          </h3>
          <p className="mt-1 text-sm text-gray-500">Configure notification preferences</p>
        </div>
        <div className="px-6 py-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                <p className="text-xs text-gray-500">Receive alerts via email</p>
              </div>
              <button
                type="button"
                className="bg-blue-600 relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200"></span>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Database Alerts</p>
                <p className="text-xs text-gray-500">Get notified of connection issues</p>
              </div>
              <button
                type="button"
                className="bg-blue-600 relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200"></span>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Billing Alerts</p>
                <p className="text-xs text-gray-500">Notifications for billing events</p>
              </div>
              <button
                type="button"
                className="bg-gray-200 relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <span className="translate-x-0 pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200"></span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cross-Database Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DatabaseHealthMonitor />
        <DataComparisonTool />
      </div>

      {/* System Information */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">System Information</h3>
        </div>
        <div className="px-6 py-4">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Version</dt>
              <dd className="mt-1 text-sm text-gray-900">2.0.0</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Environment</dt>
              <dd className="mt-1 text-sm text-gray-900">{process.env.NODE_ENV || 'development'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Next.js Version</dt>
              <dd className="mt-1 text-sm text-gray-900">15.3.2</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd className="mt-1 text-sm text-gray-900">Nov 12, 2025</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
