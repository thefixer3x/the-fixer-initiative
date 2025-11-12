'use client'

import React, { useState } from 'react'
import { GitCompare, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { useCrossDatabase, useMultiDatabaseHealth } from '@/hooks/useCrossDatabase'
import { useDatabase } from '@/contexts/DatabaseContext'

export function DatabaseHealthMonitor() {
  const { availableProviders } = useDatabase()
  const { health, checking, checkAllConnections } = useMultiDatabaseHealth()

  const handleCheck = async () => {
    await checkAllConnections()
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <GitCompare className="h-5 w-5 text-gray-600" />
          Database Health Monitor
        </h3>
        <button
          onClick={handleCheck}
          disabled={checking}
          className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
          Check All
        </button>
      </div>

      <div className="space-y-3">
        {availableProviders.map((provider) => {
          const isHealthy = health[provider.id]
          const isChecked = health.hasOwnProperty(provider.id)

          return (
            <div
              key={provider.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                {isChecked ? (
                  isHealthy ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )
                ) : (
                  <AlertTriangle className="h-5 w-5 text-gray-400" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">{provider.name}</p>
                  <p className="text-xs text-gray-500">{provider.type}</p>
                </div>
              </div>

              <div>
                {isChecked ? (
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      isHealthy
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {isHealthy ? 'Healthy' : 'Down'}
                  </span>
                ) : (
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                    Not Checked
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {Object.keys(health).length === 0 && !checking && (
        <p className="text-sm text-gray-500 text-center py-4">
          Click &quot;Check All&quot; to test database connections
        </p>
      )}
    </div>
  )
}

export function DataComparisonTool() {
  const { availableProviders } = useDatabase()
  const { compareData, loading } = useCrossDatabase()
  const [provider1, setProvider1] = useState('')
  const [provider2, setProvider2] = useState('')
  const [query, setQuery] = useState('SELECT COUNT(*) as count FROM apps')
  const [result, setResult] = useState<any>(null)

  const handleCompare = async () => {
    if (!provider1 || !provider2 || !query) return

    try {
      const comparison = await compareData(provider1, provider2, query)
      setResult(comparison)
    } catch (err) {
      console.error('Comparison failed:', err)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
        <GitCompare className="h-5 w-5 text-gray-600" />
        Cross-Database Comparison
      </h3>

      <div className="space-y-4">
        {/* Provider Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Provider 1
            </label>
            <select
              value={provider1}
              onChange={(e) => setProvider1(e.target.value)}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select provider...</option>
              {availableProviders.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Provider 2
            </label>
            <select
              value={provider2}
              onChange={(e) => setProvider2(e.target.value)}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select provider...</option>
              {availableProviders.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Query Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Query (SQL)
          </label>
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            rows={3}
            className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm font-mono focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Compare Button */}
        <button
          onClick={handleCompare}
          disabled={loading || !provider1 || !provider2}
          className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Comparing...
            </>
          ) : (
            <>
              <GitCompare className="h-4 w-4 mr-2" />
              Compare Data
            </>
          )}
        </button>

        {/* Results */}
        {result && (
          <div className="mt-4 space-y-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-medium text-gray-500 mb-1">
                {availableProviders.find((p) => p.id === provider1)?.name}
              </p>
              <pre className="text-xs font-mono text-gray-900 overflow-auto">
                {JSON.stringify(result.provider1.result, null, 2)}
              </pre>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs font-medium text-gray-500 mb-1">
                {availableProviders.find((p) => p.id === provider2)?.name}
              </p>
              <pre className="text-xs font-mono text-gray-900 overflow-auto">
                {JSON.stringify(result.provider2.result, null, 2)}
              </pre>
            </div>

            {result.differences.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs font-medium text-yellow-800 mb-1">
                  Differences Detected
                </p>
                <ul className="text-xs text-yellow-700 space-y-1">
                  {result.differences.map((diff, i) => (
                    <li key={i}>• {diff}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
