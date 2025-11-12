'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { multiDB } from '@/lib/multi-database'
import type { DatabaseProvider, DatabaseMetrics } from '@/lib/types'

interface DatabaseContextValue {
  activeProvider: string
  availableProviders: DatabaseProvider[]
  databaseMetrics: DatabaseMetrics[]
  switchDatabase: (providerId: string) => Promise<void>
  refreshMetrics: () => Promise<void>
  isLoading: boolean
  error: Error | null
}

const DatabaseContext = createContext<DatabaseContextValue | null>(null)

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [activeProvider, setActiveProvider] = useState<string>('supabase')
  const [availableProviders, setAvailableProviders] = useState<DatabaseProvider[]>([])
  const [databaseMetrics, setDatabaseMetrics] = useState<DatabaseMetrics[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Load available providers on mount
  useEffect(() => {
    const providers = multiDB.getAvailableProviders()
    setAvailableProviders(providers)
    
    // Set first available provider as active
    if (providers.length > 0 && !activeProvider) {
      setActiveProvider(providers[0].id)
    }
  }, [activeProvider])

  // Fetch database metrics
  const refreshMetrics = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const metrics = await multiDB.getAllDatabaseMetrics()
      setDatabaseMetrics(metrics)
    } catch (err) {
      setError(err as Error)
      console.error('Failed to fetch database metrics:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Initial metrics fetch
  useEffect(() => {
    refreshMetrics()
  }, [refreshMetrics])

  // Switch database provider
  const switchDatabase = useCallback(async (providerId: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Test connection before switching
      const isHealthy = await multiDB.testConnection(providerId)
      
      if (!isHealthy) {
        throw new Error(`Database ${providerId} is not healthy`)
      }
      
      setActiveProvider(providerId)
      await refreshMetrics()
      
      // Store preference in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('activeDatabase', providerId)
      }
    } catch (err) {
      setError(err as Error)
      console.error('Failed to switch database:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [refreshMetrics])

  // Load saved preference on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('activeDatabase')
      if (saved && availableProviders.some(p => p.id === saved)) {
        setActiveProvider(saved)
      }
    }
  }, [availableProviders])

  const value: DatabaseContextValue = {
    activeProvider,
    availableProviders,
    databaseMetrics,
    switchDatabase,
    refreshMetrics,
    isLoading,
    error,
  }

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  )
}

export function useDatabase() {
  const context = useContext(DatabaseContext)
  if (!context) {
    throw new Error('useDatabase must be used within DatabaseProvider')
  }
  return context
}
