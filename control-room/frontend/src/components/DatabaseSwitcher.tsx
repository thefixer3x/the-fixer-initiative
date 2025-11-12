'use client'

import React, { useState } from 'react'
import { Database, ChevronDown, Check, AlertCircle, Loader2 } from 'lucide-react'
import { useDatabase } from '@/contexts/DatabaseContext'

export function DatabaseSwitcher() {
  const [isOpen, setIsOpen] = useState(false)
  const { 
    activeProvider, 
    availableProviders, 
    databaseMetrics,
    switchDatabase, 
    isLoading 
  } = useDatabase()

  const handleSwitch = async (providerId: string) => {
    if (providerId === activeProvider) {
      setIsOpen(false)
      return
    }

    try {
      await switchDatabase(providerId)
      setIsOpen(false)
    } catch (err) {
      console.error('Failed to switch database:', err)
      // Error is handled in context
    }
  }

  const activeProviderData = availableProviders.find(p => p.id === activeProvider)
  const activeMetrics = databaseMetrics.find(m => m.providerId === activeProvider)

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        <Database className="h-4 w-4 text-gray-600" />
        
        <div className="flex items-center gap-2">
          {/* Status Indicator */}
          <div className={`w-2 h-2 rounded-full ${
            activeMetrics?.connectionStatus === 'healthy'
              ? 'bg-green-500'
              : activeMetrics?.connectionStatus === 'degraded'
              ? 'bg-yellow-500'
              : 'bg-red-500'
          }`} />
          
          <span className="text-sm font-medium text-gray-700">
            {activeProviderData?.name || 'Select Database'}
          </span>
        </div>

        {isLoading ? (
          <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
        ) : (
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`} />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Database Providers
              </div>
              
              {availableProviders.map((provider) => {
                const metrics = databaseMetrics.find(m => m.providerId === provider.id)
                const isActive = provider.id === activeProvider
                
                return (
                  <button
                    key={provider.id}
                    onClick={() => handleSwitch(provider.id)}
                    disabled={isLoading}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      isActive 
                        ? 'bg-blue-50 text-blue-700'
                        : 'hover:bg-gray-50 text-gray-700'
                    } disabled:opacity-50`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Status Indicator */}
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          metrics?.connectionStatus === 'healthy'
                            ? 'bg-green-500'
                            : metrics?.connectionStatus === 'degraded'
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`} />
                        
                        {/* Provider Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">
                              {provider.name}
                            </span>
                            {isActive && (
                              <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            )}
                          </div>
                          
                          {metrics ? (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">
                                {metrics.responseTime}ms
                              </span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500">
                                {metrics.tableCount} tables
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Loading...</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Error Message */}
                    {metrics?.errorMessage && (
                      <div className="mt-2 flex items-start gap-2 p-2 bg-red-50 rounded text-xs text-red-700">
                        <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span className="flex-1">{metrics.errorMessage}</span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-3 py-2 bg-gray-50 rounded-b-lg">
              <div className="text-xs text-gray-500">
                Active: <span className="font-medium text-gray-700">{activeProviderData?.name}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
