'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/SimpleAuthContext'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {
    TrendingUp,
    TrendingDown,
    Clock,
    DollarSign,
    Activity
} from 'lucide-react'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell
} from 'recharts'
// import { format, subDays, startOfDay, endOfDay } from 'date-fns'

const mockUsageData = {
    dailyUsage: [
        { date: '2024-01-01', requests: 1200, payments: 800, transfers: 400, revenue: 2400 },
        { date: '2024-01-02', requests: 1350, payments: 900, transfers: 450, revenue: 2700 },
        { date: '2024-01-03', requests: 1100, payments: 750, transfers: 350, revenue: 2200 },
        { date: '2024-01-04', requests: 1450, payments: 950, transfers: 500, revenue: 2900 },
        { date: '2024-01-05', requests: 1600, payments: 1000, transfers: 600, revenue: 3200 },
        { date: '2024-01-06', requests: 1300, payments: 850, transfers: 450, revenue: 2600 },
        { date: '2024-01-07', requests: 1400, payments: 920, transfers: 480, revenue: 2800 }
    ],
    clientUsage: [
        { client: 'VortexCore', requests: 4500, revenue: 12000, growth: 15.2 },
        { client: 'Memory-as-a-Service', requests: 3200, revenue: 15000, growth: 18.4 },
        { client: 'Onasis Core', requests: 2800, revenue: 8500, growth: 12.1 },
        { client: 'Credit-as-a-Service', requests: 1800, revenue: 7200, growth: 25.3 },
        { client: 'SEFTEC Store', requests: 2100, revenue: 4500, growth: 8.8 }
    ],
    serviceBreakdown: [
        { name: 'Payments', value: 65, color: '#3B82F6' },
        { name: 'Transfers', value: 35, color: '#10B981' }
    ],
    responseTimeData: [
        { time: '00:00', avgTime: 245 },
        { time: '04:00', avgTime: 198 },
        { time: '08:00', avgTime: 312 },
        { time: '12:00', avgTime: 289 },
        { time: '16:00', avgTime: 267 },
        { time: '20:00', avgTime: 234 }
    ],
    errorRates: [
        { service: 'Payments', success: 96.2, errors: 3.8 },
        { service: 'Transfers', success: 94.5, errors: 5.5 },
        { service: 'API Gateway', success: 99.1, errors: 0.9 }
    ]
}

export default function UsageAnalytics() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [timeRange, setTimeRange] = useState('7d')
    const [selectedClient, setSelectedClient] = useState('all')

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login')
        }
    }, [user, loading, router])

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

    const totalRequests = mockUsageData.dailyUsage.reduce((sum, day) => sum + day.requests, 0)
    const totalRevenue = mockUsageData.dailyUsage.reduce((sum, day) => sum + day.revenue, 0)
    const avgResponseTime = 267
    const successRate = 96.8

    const StatCard = ({ title, value, change, icon: Icon, color = 'blue' }: {
        title: string
        value: string | number
        change?: string
        icon: React.ElementType
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
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Usage Analytics</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Monitor API usage, performance metrics, and client analytics
                        </p>
                    </div>
                    <div className="flex space-x-3">
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="24h">Last 24 hours</option>
                            <option value="7d">Last 7 days</option>
                            <option value="30d">Last 30 days</option>
                            <option value="90d">Last 90 days</option>
                        </select>
                        <select
                            value={selectedClient}
                            onChange={(e) => setSelectedClient(e.target.value)}
                            className="block px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                            <option value="all">All Apps</option>
                            <option value="vortexcore">VortexCore</option>
                            <option value="memory-service">Memory-as-a-Service</option>
                            <option value="onasis-core">Onasis Core</option>
                            <option value="credit-service">Credit-as-a-Service</option>
                            <option value="seftec-store">SEFTEC Store</option>
                        </select>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Requests"
                        value={totalRequests.toLocaleString()}
                        change="+12.5%"
                        icon={Activity}
                        color="blue"
                    />
                    <StatCard
                        title="Total Revenue"
                        value={`$${totalRevenue.toLocaleString()}`}
                        change="+8.2%"
                        icon={DollarSign}
                        color="green"
                    />
                    <StatCard
                        title="Success Rate"
                        value={`${successRate}%`}
                        change="+0.3%"
                        icon={TrendingUp}
                        color="purple"
                    />
                    <StatCard
                        title="Avg Response Time"
                        value={`${avgResponseTime}ms`}
                        change="-5.2%"
                        icon={Clock}
                        color="yellow"
                    />
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Usage Trend */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">API Usage Trend</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={mockUsageData.dailyUsage}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Area type="monotone" dataKey="requests" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                                <Area type="monotone" dataKey="payments" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                                <Area type="monotone" dataKey="transfers" stackId="3" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Service Breakdown */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Service Usage Distribution</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={mockUsageData.serviceBreakdown}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {mockUsageData.serviceBreakdown.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="mt-4 flex justify-center space-x-6">
                            {mockUsageData.serviceBreakdown.map((item) => (
                                <div key={item.name} className="flex items-center">
                                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                                    <span className="text-sm text-gray-600">{item.name} ({item.value}%)</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Charts Row 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Response Time */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Response Time by Hour</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={mockUsageData.responseTimeData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="time" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="avgTime" stroke="#3B82F6" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Error Rates */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Service Success Rates</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={mockUsageData.errorRates}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="service" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="success" fill="#10B981" />
                                <Bar dataKey="errors" fill="#EF4444" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Client Usage Table */}
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Client Usage Summary
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Client
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Requests
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Revenue
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Growth
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {mockUsageData.clientUsage.map((client, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                                                        <span className="text-sm font-medium text-white">
                                                            {client.client.charAt(0)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {client.client}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {client.requests.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            ${client.revenue.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                {client.growth > 0 ? (
                                                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                                                ) : (
                                                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                                                )}
                                                <span className={`text-sm ${client.growth > 0 ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                    {client.growth > 0 ? '+' : ''}{client.growth}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                Active
                                            </span>
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
