'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {
    Search,
    Filter,
    Download,
    RefreshCw,
    CheckCircle,
    XCircle,
    Clock,
    CreditCard,
    ArrowUpDown
} from 'lucide-react'
import { ClientTransaction } from '@/lib/types'
import { format } from 'date-fns'

const mockTransactions: ClientTransaction[] = [
    {
        id: '1',
        client_org_id: '1',
        client_reference: 'ACME_001_1642234567_abc123',
        internal_reference: 'paystack_ref_xyz789',
        service_type: 'payment',
        service_provider: 'paystack',
        amount: 2500.00,
        currency: 'NGN',
        status: 'success',
        customer_email: 'customer@acme.com',
        metadata: { product: 'Premium Plan' },
        client_ip: '192.168.1.1',
        user_agent: 'Mozilla/5.0...',
        created_at: '2024-01-20T15:30:00Z',
        updated_at: '2024-01-20T15:30:00Z',
        completed_at: '2024-01-20T15:30:15Z'
    },
    {
        id: '2',
        client_org_id: '2',
        client_reference: 'TECH_002_TXF_1642234567_def456',
        internal_reference: 'sayswitch_ref_abc123',
        service_type: 'transfer',
        service_provider: 'sayswitch',
        amount: 5000.00,
        currency: 'NGN',
        status: 'pending',
        recipient_account: '0123456789',
        recipient_bank_code: '044',
        recipient_name: 'John Doe',
        metadata: { narration: 'Salary payment' },
        client_ip: '192.168.1.2',
        user_agent: 'Mozilla/5.0...',
        created_at: '2024-01-20T14:15:00Z',
        updated_at: '2024-01-20T14:15:00Z'
    },
    {
        id: '3',
        client_org_id: '1',
        client_reference: 'ACME_001_1642234567_ghi789',
        internal_reference: 'paystack_ref_def456',
        service_type: 'payment',
        service_provider: 'paystack',
        amount: 1200.00,
        currency: 'NGN',
        status: 'failed',
        customer_email: 'user@acme.com',
        metadata: { product: 'Basic Plan' },
        client_ip: '192.168.1.3',
        user_agent: 'Mozilla/5.0...',
        created_at: '2024-01-20T13:45:00Z',
        updated_at: '2024-01-20T13:45:30Z'
    },
    {
        id: '4',
        client_org_id: '3',
        client_reference: 'GLOBAL_003_TXF_1642234567_jkl012',
        internal_reference: 'sayswitch_ref_ghi789',
        service_type: 'transfer',
        service_provider: 'sayswitch',
        amount: 15000.00,
        currency: 'NGN',
        status: 'success',
        recipient_account: '9876543210',
        recipient_bank_code: '058',
        recipient_name: 'Jane Smith',
        metadata: { narration: 'Vendor payment' },
        client_ip: '192.168.1.4',
        user_agent: 'Mozilla/5.0...',
        created_at: '2024-01-20T12:30:00Z',
        updated_at: '2024-01-20T12:30:00Z',
        completed_at: '2024-01-20T12:30:45Z'
    }
]

const clientNames: Record<string, string> = {
    '1': 'Acme Corporation',
    '2': 'TechStart Inc',
    '3': 'Global Enterprises'
}

export default function TransactionsPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [transactions, setTransactions] = useState<ClientTransaction[]>(mockTransactions)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [typeFilter, setTypeFilter] = useState('all')
    const [dateRange, setDateRange] = useState('7d')

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

    const filteredTransactions = transactions.filter(transaction => {
        const matchesSearch =
            transaction.client_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transaction.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transaction.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            clientNames[transaction.client_org_id]?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter
        const matchesType = typeFilter === 'all' || transaction.service_type === typeFilter

        return matchesSearch && matchesStatus && matchesType
    })

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success':
                return <CheckCircle className="h-4 w-4 text-green-500" />
            case 'failed':
                return <XCircle className="h-4 w-4 text-red-500" />
            case 'pending':
                return <Clock className="h-4 w-4 text-yellow-500" />
            default:
                return <Clock className="h-4 w-4 text-gray-500" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success':
                return 'bg-green-100 text-green-800'
            case 'failed':
                return 'bg-red-100 text-red-800'
            case 'pending':
                return 'bg-yellow-100 text-yellow-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const getServiceIcon = (type: string) => {
        return type === 'payment' ? <CreditCard className="h-4 w-4" /> : <ArrowUpDown className="h-4 w-4" />
    }

    const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0)
    const successCount = filteredTransactions.filter(t => t.status === 'success').length
    const successRate = filteredTransactions.length > 0 ? (successCount / filteredTransactions.length) * 100 : 0

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Transaction Monitoring</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Monitor and track all payment and transfer transactions
                        </p>
                    </div>
                    <div className="flex space-x-3">
                        <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </button>
                        <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <CreditCard className="h-6 w-6 text-blue-600" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Total Transactions</dt>
                                        <dd className="text-2xl font-semibold text-gray-900">{filteredTransactions.length}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <CheckCircle className="h-6 w-6 text-green-600" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Success Rate</dt>
                                        <dd className="text-2xl font-semibold text-gray-900">{successRate.toFixed(1)}%</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <ArrowUpDown className="h-6 w-6 text-purple-600" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Total Volume</dt>
                                        <dd className="text-2xl font-semibold text-gray-900">₦{totalAmount.toLocaleString()}</dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Clock className="h-6 w-6 text-yellow-600" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Pending</dt>
                                        <dd className="text-2xl font-semibold text-gray-900">
                                            {filteredTransactions.filter(t => t.status === 'pending').length}
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-lg shadow">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search transactions..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                                <option value="all">All Status</option>
                                <option value="success">Success</option>
                                <option value="pending">Pending</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                                <option value="all">All Types</option>
                                <option value="payment">Payments</option>
                                <option value="transfer">Transfers</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                            <select
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            >
                                <option value="1d">Last 24 hours</option>
                                <option value="7d">Last 7 days</option>
                                <option value="30d">Last 30 days</option>
                                <option value="90d">Last 90 days</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Transactions Table */}
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                            Transactions ({filteredTransactions.length})
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Transaction
                                    </th>
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
                                        Date
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredTransactions.map((transaction) => (
                                    <tr key={transaction.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                {getServiceIcon(transaction.service_type)}
                                                <div className="ml-3">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {transaction.client_reference}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {transaction.service_provider}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {clientNames[transaction.client_org_id] || 'Unknown Client'}
                                            </div>
                                            {transaction.customer_email && (
                                                <div className="text-sm text-gray-500">{transaction.customer_email}</div>
                                            )}
                                            {transaction.recipient_name && (
                                                <div className="text-sm text-gray-500">{transaction.recipient_name}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {transaction.service_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            ₦{transaction.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                {getStatusIcon(transaction.status)}
                                                <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                                                    {transaction.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div>{format(new Date(transaction.created_at), 'MMM dd, yyyy')}</div>
                                            <div className="text-xs">{format(new Date(transaction.created_at), 'HH:mm:ss')}</div>
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
