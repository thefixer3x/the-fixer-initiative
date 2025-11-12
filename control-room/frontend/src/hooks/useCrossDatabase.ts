'use client'

import { useState, useCallback } from 'react'
import { multiDB } from '@/lib/multi-database'
import { useDatabase } from '@/contexts/DatabaseContext'

interface CrossQueryResult {
  providerId: string
  result: unknown
  success: boolean
  error?: string
}

/**
 * Hook for executing queries across multiple databases
 * Useful for comparing data or aggregating results from multiple sources
 */
export function useCrossDatabase() {
  const { activeProvider } = useDatabase()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Execute the same query across all databases
   */
  const executeAcrossAll = useCallback(
    async (query: string, params?: unknown[]) => {
      setLoading(true)
      setError(null)

      try {
        const providers = multiDB.getAvailableProviders()
        const queries = providers.map((provider) => ({
          providerId: provider.id,
          query,
          params,
        }))

        const results = await multiDB.executeCrossQuery(queries)
        return results
      } catch (err) {
        setError(err as Error)
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  /**
   * Execute different queries on different databases
   */
  const executeCustomQueries = useCallback(
    async (
      queries: Array<{
        providerId: string
        query: string
        params?: unknown[]
      }>
    ) => {
      setLoading(true)
      setError(null)

      try {
        const results = await multiDB.executeCrossQuery(queries)
        return results
      } catch (err) {
        setError(err as Error)
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  /**
   * Execute query on active database only
   */
  const executeOnActive = useCallback(
    async (query: string, params?: unknown[]) => {
      setLoading(true)
      setError(null)

      try {
        const result = await multiDB.executeQuery(activeProvider, query, params)
        return result
      } catch (err) {
        setError(err as Error)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [activeProvider]
  )

  /**
   * Compare data between two databases
   */
  const compareData = useCallback(
    async (
      provider1: string,
      provider2: string,
      query: string,
      params?: unknown[]
    ): Promise<{
      provider1: CrossQueryResult
      provider2: CrossQueryResult
      differences: string[]
    }> => {
      setLoading(true)
      setError(null)

      try {
        const results = await multiDB.executeCrossQuery([
          { providerId: provider1, query, params },
          { providerId: provider2, query, params },
        ])

        const result1 = results[0]
        const result2 = results[1]

        // Simple comparison - could be enhanced
        const differences: string[] = []
        if (JSON.stringify(result1.result) !== JSON.stringify(result2.result)) {
          differences.push('Data mismatch between databases')
        }

        return {
          provider1: result1,
          provider2: result2,
          differences,
        }
      } catch (err) {
        setError(err as Error)
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  /**
   * Aggregate results from multiple databases
   */
  const aggregateResults = useCallback(
    async <T = any>(
      query: string,
      aggregator: (results: CrossQueryResult[]) => T
    ): Promise<T> => {
      setLoading(true)
      setError(null)

      try {
        const providers = multiDB.getAvailableProviders()
        const queries = providers.map((provider) => ({
          providerId: provider.id,
          query,
        }))

        const results = await multiDB.executeCrossQuery(queries)
        return aggregator(results)
      } catch (err) {
        setError(err as Error)
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return {
    executeAcrossAll,
    executeCustomQueries,
    executeOnActive,
    compareData,
    aggregateResults,
    loading,
    error,
  }
}

/**
 * Utility hook for database health checks across all providers
 */
export function useMultiDatabaseHealth() {
  const [health, setHealth] = useState<Record<string, boolean>>({})
  const [checking, setChecking] = useState(false)

  const checkAllConnections = useCallback(async () => {
    setChecking(true)
    const providers = multiDB.getAvailableProviders()
    const healthStatus: Record<string, boolean> = {}

    for (const provider of providers) {
      const isHealthy = await multiDB.testConnection(provider.id)
      healthStatus[provider.id] = isHealthy
    }

    setHealth(healthStatus)
    setChecking(false)
    return healthStatus
  }, [])

  return {
    health,
    checking,
    checkAllConnections,
  }
}
