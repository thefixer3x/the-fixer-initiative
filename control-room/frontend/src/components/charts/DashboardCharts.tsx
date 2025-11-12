'use client'

import React from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  indigo: '#6366F1',
}

// Revenue Trend Chart
export function RevenueTrendChart({ data }: { data: Array<{ date: string; revenue: number }> }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            stroke="#9CA3AF"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="#9CA3AF"
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '0.375rem',
            }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke={COLORS.primary}
            fill={COLORS.primary}
            fillOpacity={0.2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// System Performance Chart
export function SystemPerformanceChart({ 
  data 
}: { 
  data: Array<{ time: string; cpu: number; memory: number; requests: number }> 
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">System Performance</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="time" 
            tick={{ fontSize: 12 }}
            stroke="#9CA3AF"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="#9CA3AF"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '0.375rem',
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="cpu"
            stroke={COLORS.primary}
            strokeWidth={2}
            dot={{ r: 3 }}
            name="CPU %"
          />
          <Line
            type="monotone"
            dataKey="memory"
            stroke={COLORS.success}
            strokeWidth={2}
            dot={{ r: 3 }}
            name="Memory %"
          />
          <Line
            type="monotone"
            dataKey="requests"
            stroke={COLORS.purple}
            strokeWidth={2}
            dot={{ r: 3 }}
            name="Requests"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// Project Distribution Chart
export function ProjectDistributionChart({ 
  data 
}: { 
  data: Array<{ name: string; value: number }> 
}) {
  const CHART_COLORS = [
    COLORS.primary,
    COLORS.success,
    COLORS.warning,
    COLORS.danger,
    COLORS.purple,
    COLORS.indigo,
  ]

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Project Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

// User Growth Chart
export function UserGrowthChart({ 
  data 
}: { 
  data: Array<{ month: string; users: number; clients: number }> 
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">User Growth</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="month" 
            tick={{ fontSize: 12 }}
            stroke="#9CA3AF"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="#9CA3AF"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '0.375rem',
            }}
          />
          <Legend />
          <Bar dataKey="users" fill={COLORS.primary} name="Users" />
          <Bar dataKey="clients" fill={COLORS.success} name="Clients" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// Transaction Stats Chart
export function TransactionStatsChart({ 
  data 
}: { 
  data: Array<{ date: string; successful: number; failed: number; pending: number }> 
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction Status</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            stroke="#9CA3AF"
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            stroke="#9CA3AF"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '0.375rem',
            }}
          />
          <Legend />
          <Bar dataKey="successful" stackId="a" fill={COLORS.success} name="Successful" />
          <Bar dataKey="pending" stackId="a" fill={COLORS.warning} name="Pending" />
          <Bar dataKey="failed" stackId="a" fill={COLORS.danger} name="Failed" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
