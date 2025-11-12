'use client'

import React from 'react'
import { Activity, WifiOff } from 'lucide-react'

interface RealtimeIndicatorProps {
  isConnected: boolean
  label?: string
  showLabel?: boolean
}

export function RealtimeIndicator({ 
  isConnected, 
  label = 'Real-time', 
  showLabel = true 
}: RealtimeIndicatorProps) {
  return (
    <div className="inline-flex items-center gap-2">
      {isConnected ? (
        <>
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </div>
          {showLabel && (
            <span className="text-xs font-medium text-green-700 flex items-center gap-1">
              <Activity className="h-3 w-3" />
              {label} Active
            </span>
          )}
        </>
      ) : (
        <>
          <div className="h-2 w-2 rounded-full bg-gray-400"></div>
          {showLabel && (
            <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
              <WifiOff className="h-3 w-3" />
              {label} Offline
            </span>
          )}
        </>
      )}
    </div>
  )
}

export function RealtimeStatus({ 
  isConnected, 
  tableName 
}: { 
  isConnected: boolean
  tableName: string 
}) {
  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
      isConnected 
        ? 'bg-green-50 text-green-700 border border-green-200'
        : 'bg-gray-50 text-gray-600 border border-gray-200'
    }`}>
      <div className={`h-1.5 w-1.5 rounded-full mr-1.5 ${
        isConnected ? 'bg-green-500' : 'bg-gray-400'
      }`} />
      {isConnected ? `Live: ${tableName}` : `Offline`}
    </div>
  )
}
