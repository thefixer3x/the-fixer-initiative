'use client'

import React from 'react'

export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="animate-pulse">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-6 py-3">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4">
                  <div className="h-4 bg-gray-200 rounded"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
      <div className="px-4 py-5 sm:p-6">
        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded w-16"></div>
      </div>
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
      <div className="h-64 bg-gray-100 rounded"></div>
    </div>
  )
}

export function ListSkeleton({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg p-6">
        <TableSkeleton rows={5} columns={4} />
      </div>
    </div>
  )
}
