'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Database, Server, Activity, ExternalLink, Users, TrendingUp, RefreshCw, AlertCircle, FileText } from 'lucide-react'
import { realDataService, type RealTimeMetrics, type TopApp, type RealTimeActivity } from '@/lib/real-data-service'
import { toast } from 'sonner'

export default function HomePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [metrics, setMetrics] = useState<RealTimeMetrics | null>(null)
  const [topApps, setTopApps] = useState<TopApp[]>([])
  const [recentActivity, setRecentActivity] = useState<RealTimeActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!loading && !user) {
      console.log('[Dashboard] No user, redirecting to login')
      router.push('/login')
    }
  }, [user, loading, router])

  // Load real data
  const loadRealData = async () => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      const [metricsData, topAppsData, activityData] = await Promise.all([
        realDataService.getRealTimeMetrics(),
        realDataService.getTopPerformingApps(3),
        realDataService.getRecentActivity(),
      ])

      setMetrics(metricsData)
      setTopApps(topAppsData)
      setRecentActivity(activityData)
      setLastRefresh(new Date())
    } catch (err) {
      console.error('Error loading real data:', err)
      setError('Failed to load dashboard data. Please try refreshing.')
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Only set up updates if user is authenticated
    if (!user) return

    // Load data immediately
    loadRealData()

    // Set up real-time updates every 30 seconds
    const interval = setInterval(loadRealData, 30000)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

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
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Activity className="animate-spin h-8 w-8 text-indigo-600" />
        </div>
      </DashboardLayout>
    )
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
              Real-time monitoring and management of your ecosystem
            </p>
            {lastRefresh && (
              <p className="mt-1 text-xs text-gray-400">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="mt-4 md:mt-0">
            <button
              onClick={loadRealData}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading data</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Ecosystem Metrics Overview */}
        {isLoading && !metrics ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
                <div className="p-5">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : metrics ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
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

            <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Activity className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Active Apps</dt>
                      <dd className="text-lg font-medium text-gray-900">{metrics.activeApps}/{metrics.totalApps}</dd>
                      <dd className="text-xs text-gray-400 mt-1">Uptime: {metrics.avgUptime}%</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                      <dd className="text-lg font-medium text-gray-900">${metrics.totalRevenue.toLocaleString()}</dd>
                      <dd className="text-xs text-gray-400 mt-1">{metrics.totalTransactions.toLocaleString()} transactions</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Server className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Health Status</dt>
                      <dd className={`text-lg font-medium ${
                        metrics.healthPercentage >= 90 ? 'text-green-600' :
                        metrics.healthPercentage >= 70 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {metrics.healthPercentage}%
                      </dd>
                      <dd className="text-xs text-gray-400 mt-1">Avg: {metrics.avgResponseTime}ms</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
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

          <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
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

          <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
            <div className="p-5">
              <div className="flex items-center">
                <FileText className="h-6 w-6 text-purple-600" />
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">GitHub Projects</h3>
                  <p className="text-sm text-gray-500">Manage Issues & Onboarding</p>
                </div>
              </div>
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => router.push('/projects/issues')}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                >
                  Issues
                </button>
                <button
                  onClick={() => router.push('/projects/onboard')}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Onboard
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Top Performing Apps */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Top Performing Apps</h3>
            {isLoading && topApps.length === 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border rounded-lg p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-3"></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-8 bg-gray-200 rounded"></div>
                      <div className="h-8 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : topApps.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {topApps.map((app) => (
                  <div key={app.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/services`)}>
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
            ) : (
              <p className="text-sm text-gray-500">No app data available</p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Recent System Activity</h3>
            {isLoading && recentActivity.length === 0 ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-md animate-pulse">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-3 bg-gray-200"></div>
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        activity.status === 'healthy' ? 'bg-green-500' : 
                        activity.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{activity.name}</div>
                        <div className="text-xs text-gray-500">{activity.type.replace('_', ' ')}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">{activity.responseTime}ms</div>
                      <div className="text-xs text-gray-400">{new Date(activity.time).toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
