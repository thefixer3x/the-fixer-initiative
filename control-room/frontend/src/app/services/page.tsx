'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/StackAuthContext'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {
    CheckCircle,
    XCircle,
    Clock,
    RefreshCw,
    Settings,
    AlertTriangle,
    Server,
    Database,
    Zap
} from 'lucide-react'

const serviceStatus = {
    paystack: {
        name: 'Paystack Integration',
        status: 'operational',
        uptime: '99.9%',
        responseTime: '245ms',
        lastCheck: '2024-01-20T15:30:00Z',
        description: 'Payment processing service',
        endpoints: [
            { name: 'Initialize Payment', status: 'operational', responseTime: '230ms' },
            { name: 'Verify Payment', status: 'operational', responseTime: '180ms' },
            { name: 'List Transactions', status: 'operational', responseTime: '195ms' }
        ]
    },
    sayswitch: {
        name: 'Sayswitch Integration',
        status: 'operational',
        uptime: '99.7%',
        responseTime: '320ms',
        lastCheck: '2024-01-20T15:30:00Z',
        description: 'Money transfer service',
        endpoints: [
            { name: 'Send Transfer', status: 'operational', responseTime: '350ms' },
            { name: 'Verify Transfer', status: 'operational', responseTime: '280ms' },
            { name: 'List Banks', status: 'operational', responseTime: '150ms' },
            { name: 'List Transfers', status: 'operational', responseTime: '200ms' }
        ]
    },
    database: {
        name: 'Database',
        status: 'operational',
        uptime: '99.95%',
        responseTime: '45ms',
        lastCheck: '2024-01-20T15:30:00Z',
        description: 'PostgreSQL database',
        endpoints: [
            { name: 'Client Data', status: 'operational', responseTime: '35ms' },
            { name: 'Transaction Logs', status: 'operational', responseTime: '50ms' },
            { name: 'Usage Analytics', status: 'operational', responseTime: '40ms' }
        ]
    },
    api: {
        name: 'Client API Gateway',
        status: 'operational',
        uptime: '99.8%',
        responseTime: '120ms',
        lastCheck: '2024-01-20T15:30:00Z',
        description: 'Main API gateway',
        endpoints: [
            { name: 'Authentication', status: 'operational', responseTime: '80ms' },
            { name: 'Rate Limiting', status: 'operational', responseTime: '10ms' },
            { name: 'Request Routing', status: 'operational', responseTime: '30ms' }
        ]
    }
}

const recentIncidents = [
    {
        id: '1',
        title: 'Paystack API Rate Limiting',
        status: 'resolved',
        severity: 'minor',
        description: 'Temporary rate limiting due to high volume',
        startTime: '2024-01-19T14:30:00Z',
        endTime: '2024-01-19T15:15:00Z',
        duration: '45 minutes'
    },
    {
        id: '2',
        title: 'Database Connection Pool Exhaustion',
        status: 'resolved',
        severity: 'major',
        description: 'High concurrent requests caused connection pool exhaustion',
        startTime: '2024-01-18T09:15:00Z',
        endTime: '2024-01-18T10:30:00Z',
        duration: '1 hour 15 minutes'
    },
    {
        id: '3',
        title: 'Sayswitch Service Maintenance',
        status: 'scheduled',
        severity: 'maintenance',
        description: 'Planned maintenance window for system updates',
        startTime: '2024-01-21T02:00:00Z',
        endTime: '2024-01-21T04:00:00Z',
        duration: '2 hours'
    }
]

export default function ServicesPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [refreshing, setRefreshing] = useState(false)

    useEffect(() => {
        if (!loading && !user) {
            router.push('/handler/sign-in')
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

    const handleRefresh = async () => {
        setRefreshing(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        setRefreshing(false)
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'operational':
                return <CheckCircle className="h-5 w-5 text-green-500" />
            case 'degraded':
                return <AlertTriangle className="h-5 w-5 text-yellow-500" />
            case 'outage':
                return <XCircle className="h-5 w-5 text-red-500" />
            case 'maintenance':
                return <Settings className="h-5 w-5 text-blue-500" />
            default:
                return <Clock className="h-5 w-5 text-gray-500" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'operational':
                return 'bg-green-100 text-green-800'
            case 'degraded':
                return 'bg-yellow-100 text-yellow-800'
            case 'outage':
                return 'bg-red-100 text-red-800'
            case 'maintenance':
                return 'bg-blue-100 text-blue-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical':
                return 'bg-red-100 text-red-800'
            case 'major':
                return 'bg-orange-100 text-orange-800'
            case 'minor':
                return 'bg-yellow-100 text-yellow-800'
            case 'maintenance':
                return 'bg-blue-100 text-blue-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Service Status</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Monitor the health and performance of all services
                        </p>
                    </div>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>

                {/* Overall Status */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                        <div className="flex items-center">
                            <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">All Systems Operational</h3>
                                <p className="text-sm text-gray-500">
                                    All services are running normally. Last updated: {new Date().toLocaleTimeString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Service Status Grid */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
                    {Object.entries(serviceStatus).map(([key, service]) => (
                        <div key={key} className="bg-white shadow rounded-lg">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        {getStatusIcon(service.status)}
                                        <h3 className="ml-2 text-lg font-medium text-gray-900">{service.name}</h3>
                                    </div>
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(service.status)}`}>
                                        {service.status}
                                    </span>
                                </div>
                                <p className="mt-1 text-sm text-gray-500">{service.description}</p>
                            </div>

                            <div className="px-6 py-4">
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Uptime</dt>
                                        <dd className="text-lg font-semibold text-gray-900">{service.uptime}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Response Time</dt>
                                        <dd className="text-lg font-semibold text-gray-900">{service.responseTime}</dd>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-gray-700">Endpoints</h4>
                                    {service.endpoints.map((endpoint, index) => (
                                        <div key={index} className="flex items-center justify-between py-1">
                                            <span className="text-sm text-gray-600">{endpoint.name}</span>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-xs text-gray-500">{endpoint.responseTime}</span>
                                                {getStatusIcon(endpoint.status)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Recent Incidents */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-900">Recent Incidents</h3>
                        <p className="mt-1 text-sm text-gray-500">Service disruptions and maintenance windows</p>
                    </div>

                    <div className="divide-y divide-gray-200">
                        {recentIncidents.map((incident) => (
                            <div key={incident.id} className="px-6 py-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                            <h4 className="text-sm font-medium text-gray-900">{incident.title}</h4>
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(incident.severity)}`}>
                                                {incident.severity}
                                            </span>
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(incident.status)}`}>
                                                {incident.status}
                                            </span>
                                        </div>
                                        <p className="mt-1 text-sm text-gray-600">{incident.description}</p>
                                        <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                                            <span>Started: {new Date(incident.startTime).toLocaleString()}</span>
                                            {incident.endTime && (
                                                <span>Ended: {new Date(incident.endTime).toLocaleString()}</span>
                                            )}
                                            <span>Duration: {incident.duration}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* System Metrics */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Server className="h-6 w-6 text-blue-600" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">API Requests/min</dt>
                                        <dd className="text-2xl font-semibold text-gray-900">1,247</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Database className="h-6 w-6 text-green-600" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Database Connections</dt>
                                        <dd className="text-2xl font-semibold text-gray-900">45/100</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Zap className="h-6 w-6 text-yellow-600" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Avg Response Time</dt>
                                        <dd className="text-2xl font-semibold text-gray-900">245ms</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
