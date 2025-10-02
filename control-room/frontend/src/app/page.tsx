'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {
  Users,
  CreditCard,
  DollarSign,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { ecosystemAPI, type AggregatedMetrics } from '@/lib/ecosystem-api'

interface DashboardMetrics {
  totalClients: number
  activeClients: number
  totalTransactions: number
  totalRevenue: number
  successRate: number
  avgResponseTime: number
  monthlyGrowth: number
}

const mockData = {
  metrics: {
    totalClients: 24,
    activeClients: 18,
    totalTransactions: 1247,
    totalRevenue: 45680.50,
    successRate: 94.2,
    avgResponseTime: 245,
    monthlyGrowth: 12.5
  },
  transactionTrend: [
    { date: '2024-01-01', payments: 45, transfers: 23 },
    { date: '2024-01-02', payments: 52, transfers: 31 },
    { date: '2024-01-03', payments: 38, transfers: 19 },
    { date: '2024-01-04', payments: 61, transfers: 42 },
    { date: '2024-01-05', payments: 47, transfers: 28 },
    { date: '2024-01-06', payments: 55, transfers: 35 },
    { date: '2024-01-07', payments: 43, transfers: 27 }
  ],
  serviceBreakdown: [
    { name: 'Payments', value: 65, color: '#3B82F6' },
    { name: 'Transfers', value: 35, color: '#10B981' }
  ],
  clientUsage: [
    { client: 'Acme Corporation', requests: 4500, revenue: 12000, growth: 15.2 },
    { client: 'TechStart Inc', requests: 3200, revenue: 8500, growth: 8.7 },
    { client: 'Global Enterprises', requests: 2800, revenue: 15000, growth: -2.1 },
    { client: 'StartupXYZ', requests: 1800, revenue: 4200, growth: 25.3 },
    { client: 'FinanceCorp', requests: 2100, revenue: 6800, growth: 12.8 }
  ],
  recentTransactions: [
    { id: '1', client: 'Acme Corp', type: 'Payment', amount: 2500, status: 'success', time: '2 min ago' },
    { id: '2', client: 'TechStart', type: 'Transfer', amount: 5000, status: 'pending', time: '5 min ago' },
    { id: '3', client: 'Global Inc', type: 'Payment', amount: 1200, status: 'success', time: '8 min ago' },
    { id: '4', client: 'StartupXYZ', type: 'Transfer', amount: 7500, status: 'failed', time: '12 min ago' }
  ]
}

export default function Dashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [metrics, setMetrics] = useState<AggregatedMetrics | null>(null)
  const [loadingMetrics, setLoadingMetrics] = useState(true)
  const [transactionTrend, setTransactionTrend] = useState(mockData.transactionTrend)
  const [clientUsage, setClientUsage] = useState(mockData.clientUsage)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    const loadLiveData = async () => {
      try {
        setLoadingMetrics(true)
        const [aggregatedMetrics, trendData, usageData] = await Promise.all([
          ecosystemAPI.getAggregatedMetrics(),
          ecosystemAPI.getTransactionTrend(7),
          ecosystemAPI.getClientUsage()
        ])

        setMetrics(aggregatedMetrics)
        setTransactionTrend(trendData)
        setClientUsage(usageData)
      } catch (error) {
        console.error('Failed to load live data:', error)
        // Fallback to mock data
        setMetrics(mockData.metrics as any)
      } finally {
        setLoadingMetrics(false)
      }
    }

    if (user) {
      loadLiveData()
      // Refresh data every 30 seconds
      const interval = setInterval(loadLiveData, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const StatCard = ({ title, value, change, icon: Icon, color = 'blue' }: {
    title: string
    value: string | number
    change?: string
    icon: any
    color?: string
  }) => (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <Icon className={`h-6 w-6 text-${color}-600`} />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{value}</div>
                {change && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {change}
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor your payment gateway and transfer services performance
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Clients"
            value={loadingMetrics ? '...' : metrics?.totalClients || 0}
            change="+2 this month"
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Active Clients"
            value={loadingMetrics ? '...' : metrics?.activeClients || 0}
            change="+1 this week"
            icon={Activity}
            color="green"
          />
          <StatCard
            title="Total Transactions"
            value={loadingMetrics ? '...' : (metrics?.totalTransactions || 0).toLocaleString()}
            change="+12.5%"
            icon={CreditCard}
            color="purple"
          />
          <StatCard
            title="Total Revenue"
            value={loadingMetrics ? '...' : `$${(metrics?.totalRevenue || 0).toLocaleString()}`}
            change="+8.2%"
            icon={DollarSign}
            color="yellow"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transaction Trend */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction Trend (7 days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={transactionTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="payments" stroke="#3B82F6" strokeWidth={2} name="Payments" />
                <Line type="monotone" dataKey="transfers" stroke="#10B981" strokeWidth={2} name="Transfers" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Service Breakdown */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Service Usage</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mockData.serviceBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {mockData.serviceBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 flex justify-center space-x-6">
              {mockData.serviceBreakdown.map((item) => (
                <div key={item.name} className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-gray-600">{item.name} ({item.value}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Success Rate</h3>
                <p className="text-3xl font-bold text-green-600">
                  {loadingMetrics ? '...' : `${(metrics?.successRate || 0).toFixed(1)}%`}
                </p>
                <p className="text-sm text-gray-500">Last 30 days</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Avg Response Time</h3>
                <p className="text-3xl font-bold text-blue-600">
                  {loadingMetrics ? '...' : `${Math.round(metrics?.avgResponseTime || 0)}ms`}
                </p>
                <p className="text-sm text-gray-500">API response time</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Monthly Growth</h3>
                <p className="text-3xl font-bold text-purple-600">
                  {loadingMetrics ? '...' : `+${(metrics?.monthlyGrowth || 0).toFixed(1)}%`}
                </p>
                <p className="text-sm text-gray-500">vs last month</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
          </div>
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mockData.recentTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {transaction.client}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${transaction.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${transaction.status === 'success'
                        ? 'bg-green-100 text-green-800'
                        : transaction.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                        }`}>
                        {transaction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
