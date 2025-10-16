'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/StackAuthContext'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Database, Server, Activity, ExternalLink, Users, TrendingUp } from 'lucide-react'
import { getEcosystemMetrics, getTopPerformingApps, getRecentActivity } from '@/lib/ecosystem-data'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [metrics, setMetrics] = useState(() => getEcosystemMetrics())
  const [topApps, setTopApps] = useState(() => getTopPerformingApps(3))
  const [recentActivity, setRecentActivity] = useState(() => getRecentActivity())

  useEffect(() => {
    // Simulate real-time updates every 30 seconds
    const interval = setInterval(() => {
      setMetrics(getEcosystemMetrics())
      setTopApps(getTopPerformingApps(3))
      setRecentActivity(getRecentActivity())
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Activity className="animate-spin h-8 w-8 text-indigo-600" />
        </div>
      </DashboardLayout>
    )
  }

  if (!user) {
    router.push('/auth/signin')
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900">
              Control Room Dashboard
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage your multi-database architecture
            </p>
          </div>
        </div>

        {/* Ecosystem Metrics Overview */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                    <dd className="text-lg font-medium text-gray-900">{metrics.totalUsers.toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Apps</dt>
                    <dd className="text-lg font-medium text-gray-900">{metrics.activeApps}/{metrics.totalApps}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                    <dd className="text-lg font-medium text-gray-900">${metrics.totalRevenue.toLocaleString()}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Server className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Health Status</dt>
                    <dd className="text-lg font-medium text-green-600">{metrics.healthPercentage}%</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Database Management Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <Database className="h-6 w-6 text-green-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Supabase</h3>
                  <p className="text-sm text-gray-500">Production Database</p>
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => router.push('/databases/supabase')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Manage
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <Server className="h-6 w-6 text-blue-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Neon</h3>
                  <p className="text-sm text-gray-500">Enhanced Database</p>
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => router.push('/databases/neon')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Manage
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Top Performing Apps */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Top Performing Apps</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {topApps.map((app) => (
                <div key={app.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{app.name}</h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      app.health_status === 'healthy' ? 'bg-green-100 text-green-800' : 
                      app.health_status === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {app.health_status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{app.description}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Users:</span>
                      <div className="font-medium">{app.metrics.users.toLocaleString()}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Revenue:</span>
                      <div className="font-medium">${app.metrics.revenue.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Recent System Activity</h3>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${
                      activity.status === 'healthy' ? 'bg-green-500' : 
                      activity.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{activity.name}</div>
                      <div className="text-xs text-gray-500">Health check completed</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">{activity.responseTime}ms</div>
                    <div className="text-xs text-gray-400">{new Date(activity.time).toLocaleTimeString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
