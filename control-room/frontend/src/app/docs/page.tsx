'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import {
    Code,
    Copy,
    Check,
    ExternalLink,
    Key,
    CreditCard,
    ArrowUpDown,
    Webhook,
    Shield
} from 'lucide-react'
import { toast } from 'sonner'

interface ApiEndpoint {
    method: string
    path: string
    description: string
    parameters?: Array<{
        name: string
        type: string
        required: boolean
        description: string
    }>
    example?: {
        request?: any
        response?: any
        url?: string
        description?: string
    } | string
}

interface ApiCategory {
    category: string
    description: string
    endpoints: ApiEndpoint[]
}

const apiEndpoints: ApiCategory[] = [
    {
        category: 'Authentication',
        description: 'API key authentication for all requests',
        endpoints: [
            {
                method: 'Header',
                path: 'Authorization: Bearer <api_key>',
                description: 'Include your API key in the Authorization header',
                example: 'Authorization: Bearer ck_live_CLIENT_001_1642234567_abc123.cs_live_def456ghi789jkl012mno345pqr678st'
            },
            {
                method: 'Header',
                path: 'x-api-key: <api_key>',
                description: 'Alternative header for API key',
                example: 'x-api-key: ck_live_CLIENT_001_1642234567_abc123.cs_live_def456ghi789jkl012mno345pqr678st'
            }
        ]
    },
    {
        category: 'Payments',
        description: 'Payment processing endpoints',
        endpoints: [
            {
                method: 'POST',
                path: '/payments/initialize',
                description: 'Initialize a new payment',
                parameters: [
                    { name: 'email', type: 'string', required: true, description: 'Customer email address' },
                    { name: 'amount', type: 'number', required: true, description: 'Amount in kobo (NGN)' },
                    { name: 'currency', type: 'string', required: false, description: 'Currency code (default: NGN)' },
                    { name: 'reference', type: 'string', required: false, description: 'Your unique reference' },
                    { name: 'callback_url', type: 'string', required: false, description: 'Callback URL for payment completion' },
                    { name: 'metadata', type: 'object', required: false, description: 'Additional metadata' }
                ],
                example: {
                    request: {
                        email: 'customer@example.com',
                        amount: 5000,
                        currency: 'NGN',
                        reference: 'order_123',
                        callback_url: 'https://yoursite.com/callback',
                        metadata: {
                            order_id: '12345',
                            product: 'Premium Plan'
                        }
                    },
                    response: {
                        success: true,
                        data: {
                            payment_url: 'https://checkout.paystack.com/...',
                            reference: 'CLIENT_001_1642234567_abc123',
                            amount: 5000,
                            currency: 'NGN'
                        },
                        meta: {
                            request_id: 'req_123456',
                            processing_time_ms: 245
                        }
                    }
                }
            },
            {
                method: 'GET',
                path: '/payments/verify/{reference}',
                description: 'Verify payment status',
                parameters: [
                    { name: 'reference', type: 'string', required: true, description: 'Payment reference' }
                ],
                example: {
                    request: 'GET /payments/verify/CLIENT_001_1642234567_abc123',
                    response: {
                        success: true,
                        data: {
                            reference: 'CLIENT_001_1642234567_abc123',
                            status: 'success',
                            amount: 5000,
                            currency: 'NGN',
                            customer_email: 'customer@example.com',
                            transaction_date: '2024-01-15T10:30:00Z',
                            completed_at: '2024-01-15T10:30:15Z'
                        }
                    }
                }
            },
            {
                method: 'GET',
                path: '/payments/transactions',
                description: 'List payment transactions',
                parameters: [
                    { name: 'page', type: 'number', required: false, description: 'Page number (default: 1)' },
                    { name: 'limit', type: 'number', required: false, description: 'Items per page (default: 50, max: 100)' },
                    { name: 'status', type: 'string', required: false, description: 'Filter by status (success, pending, failed)' }
                ],
                example: {
                    request: 'GET /payments/transactions?page=1&limit=20&status=success',
                    response: {
                        success: true,
                        data: [
                            {
                                client_reference: 'CLIENT_001_1642234567_abc123',
                                amount: 5000,
                                currency: 'NGN',
                                customer_email: 'customer@example.com',
                                status: 'success',
                                created_at: '2024-01-15T10:30:00Z',
                                completed_at: '2024-01-15T10:30:15Z'
                            }
                        ],
                        pagination: {
                            page: 1,
                            limit: 20,
                            total: 1
                        }
                    }
                }
            }
        ]
    },
    {
        category: 'Transfers',
        description: 'Money transfer endpoints',
        endpoints: [
            {
                method: 'POST',
                path: '/transfers/send',
                description: 'Send money transfer',
                parameters: [
                    { name: 'amount', type: 'number', required: true, description: 'Amount in kobo (NGN)' },
                    { name: 'account_number', type: 'string', required: true, description: 'Recipient account number' },
                    { name: 'bank_code', type: 'string', required: true, description: 'Bank code' },
                    { name: 'account_name', type: 'string', required: true, description: 'Recipient account name' },
                    { name: 'reference', type: 'string', required: false, description: 'Your unique reference' },
                    { name: 'narration', type: 'string', required: false, description: 'Transfer narration' },
                    { name: 'currency', type: 'string', required: false, description: 'Currency code (default: NGN)' }
                ],
                example: {
                    request: {
                        amount: 10000,
                        account_number: '0123456789',
                        bank_code: '044',
                        account_name: 'John Doe',
                        reference: 'transfer_123',
                        narration: 'Payment for services',
                        currency: 'NGN'
                    },
                    response: {
                        success: true,
                        data: {
                            reference: 'CLIENT_001_TXF_1642234567_abc123',
                            status: 'pending',
                            amount: 10000,
                            recipient_account: '0123456789',
                            recipient_bank_code: '044',
                            recipient_name: 'John Doe'
                        }
                    }
                }
            },
            {
                method: 'GET',
                path: '/transfers/verify/{reference}',
                description: 'Verify transfer status',
                parameters: [
                    { name: 'reference', type: 'string', required: true, description: 'Transfer reference' }
                ],
                example: {
                    request: 'GET /transfers/verify/CLIENT_001_TXF_1642234567_abc123',
                    response: {
                        success: true,
                        data: {
                            reference: 'CLIENT_001_TXF_1642234567_abc123',
                            status: 'success',
                            amount: 10000,
                            currency: 'NGN',
                            recipient_account: '0123456789',
                            recipient_bank_code: '044',
                            recipient_name: 'John Doe',
                            created_at: '2024-01-15T10:30:00Z',
                            completed_at: '2024-01-15T10:35:00Z'
                        }
                    }
                }
            },
            {
                method: 'GET',
                path: '/transfers/banks',
                description: 'Get list of supported banks',
                example: {
                    request: 'GET /transfers/banks',
                    response: {
                        success: true,
                        data: [
                            {
                                code: '044',
                                name: 'Access Bank',
                                country: 'NG'
                            },
                            {
                                code: '058',
                                name: 'GTBank',
                                country: 'NG'
                            }
                        ]
                    }
                }
            }
        ]
    },
    {
        category: 'Account',
        description: 'Account and usage information',
        endpoints: [
            {
                method: 'GET',
                path: '/account/usage',
                description: 'Get usage statistics',
                parameters: [
                    { name: 'start_date', type: 'string', required: false, description: 'Start date (ISO 8601)' },
                    { name: 'end_date', type: 'string', required: false, description: 'End date (ISO 8601)' }
                ],
                example: {
                    request: 'GET /account/usage?start_date=2024-01-01&end_date=2024-01-31',
                    response: {
                        success: true,
                        data: {
                            period: {
                                start_date: '2024-01-01T00:00:00Z',
                                end_date: '2024-01-31T23:59:59Z'
                            },
                            usage: {
                                total_requests: 1500,
                                successful_requests: 1440,
                                failed_requests: 60,
                                payment_requests: 900,
                                transfer_requests: 600,
                                avg_response_time_ms: 245,
                                total_cost: 15.00
                            },
                            account: {
                                organization_name: 'Your Company',
                                subscription_tier: 'professional',
                                monthly_quota: 50000
                            }
                        }
                    }
                }
            },
            {
                method: 'GET',
                path: '/health',
                description: 'Health check endpoint',
                example: {
                    request: 'GET /health',
                    response: {
                        status: 'healthy',
                        service: 'Fixer Initiative Client API',
                        version: '1.0.0',
                        timestamp: '2024-01-15T10:30:00Z',
                        endpoints: {
                            payments: 'Available',
                            transfers: 'Available',
                            webhooks: 'Available'
                        }
                    }
                }
            }
        ]
    },
    {
        category: 'Webhooks',
        description: 'Webhook endpoints for real-time notifications',
        endpoints: [
            {
                method: 'POST',
                path: '/webhook/payment',
                description: 'Payment webhook notifications',
                example: {
                    description: 'Configure this URL in your Paystack dashboard for payment notifications',
                    url: 'https://lanonasis.supabase.co/functions/v1/client-api/webhook/payment'
                }
            },
            {
                method: 'POST',
                path: '/webhook/transfer',
                description: 'Transfer webhook notifications',
                example: {
                    description: 'Configure this URL in your Sayswitch dashboard for transfer notifications',
                    url: 'https://lanonasis.supabase.co/functions/v1/client-api/webhook/transfer'
                }
            }
        ]
    }
]

export default function APIDocumentation() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [copiedCode, setCopiedCode] = useState<string | null>(null)

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

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text)
        setCopiedCode(id)
        toast.success('Code copied to clipboard')
        setTimeout(() => setCopiedCode(null), 2000)
    }

    const getMethodColor = (method: string) => {
        switch (method) {
            case 'POST': return 'bg-green-100 text-green-800'
            case 'GET': return 'bg-blue-100 text-blue-800'
            case 'PUT': return 'bg-yellow-100 text-yellow-800'
            case 'DELETE': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'Authentication': return <Key className="h-5 w-5" />
            case 'Payments': return <CreditCard className="h-5 w-5" />
            case 'Transfers': return <ArrowUpDown className="h-5 w-5" />
            case 'Account': return <Shield className="h-5 w-5" />
            case 'Webhooks': return <Webhook className="h-5 w-5" />
            default: return <Code className="h-5 w-5" />
        }
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">API Documentation</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Complete API reference for the Fixer Initiative Client API
                    </p>
                </div>

                {/* Base URL */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center">
                        <Code className="h-5 w-5 text-blue-600 mr-2" />
                        <span className="text-sm font-medium text-blue-900">Base URL:</span>
                        <code className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                            https://lanonasis.supabase.co/functions/v1/client-api
                        </code>
                    </div>
                </div>

                {/* API Categories */}
                {apiEndpoints.map((category, categoryIndex) => (
                    <div key={categoryIndex} className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center">
                                {getCategoryIcon(category.category)}
                                <h2 className="ml-2 text-lg font-medium text-gray-900">{category.category}</h2>
                            </div>
                            <p className="mt-1 text-sm text-gray-500">{category.description}</p>
                        </div>

                        <div className="divide-y divide-gray-200">
                            {category.endpoints.map((endpoint, endpointIndex) => (
                                <div key={endpointIndex} className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${getMethodColor(endpoint.method)}`}>
                                                    {endpoint.method}
                                                </span>
                                                <code className="text-sm font-mono text-gray-900">{endpoint.path}</code>
                                            </div>
                                            <p className="mt-2 text-sm text-gray-600">{endpoint.description}</p>

                                            {/* Parameters */}
                                            {endpoint.parameters && Array.isArray(endpoint.parameters) && (
                                                <div className="mt-4">
                                                    <h4 className="text-sm font-medium text-gray-900 mb-2">Parameters</h4>
                                                    <div className="overflow-x-auto">
                                                        <table className="min-w-full divide-y divide-gray-200">
                                                            <thead className="bg-gray-50">
                                                                <tr>
                                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Required</th>
                                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="bg-white divide-y divide-gray-200">
                                                                {endpoint.parameters.map((param: any, paramIndex: number) => (
                                                                    <tr key={paramIndex}>
                                                                        <td className="px-3 py-2 text-sm font-mono text-gray-900">{param.name}</td>
                                                                        <td className="px-3 py-2 text-sm text-gray-500">{param.type}</td>
                                                                        <td className="px-3 py-2 text-sm text-gray-500">
                                                                            {param.required ? (
                                                                                <span className="text-red-600">Yes</span>
                                                                            ) : (
                                                                                <span className="text-gray-400">No</span>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-3 py-2 text-sm text-gray-500">{param.description}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Example */}
                                            {endpoint.example && (
                                                <div className="mt-4">
                                                    <h4 className="text-sm font-medium text-gray-900 mb-2">Example</h4>
                                                    <div className="space-y-4">
                                                        {typeof endpoint.example === 'object' && endpoint.example && 'request' in endpoint.example && endpoint.example.request && (
                                                            <div>
                                                                <h5 className="text-xs font-medium text-gray-700 mb-1">Request</h5>
                                                                <div className="relative">
                                                                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                                                                        <code>
                                                                            {typeof (endpoint.example as any).request === 'string'
                                                                                ? (endpoint.example as any).request
                                                                                : JSON.stringify((endpoint.example as any).request, null, 2)
                                                                            }
                                                                        </code>
                                                                    </pre>
                                                                    <button
                                                                        onClick={() => copyToClipboard(
                                                                            typeof (endpoint.example as any).request === 'string'
                                                                                ? (endpoint.example as any).request
                                                                                : JSON.stringify((endpoint.example as any).request, null, 2),
                                                                            `request-${categoryIndex}-${endpointIndex}`
                                                                        )}
                                                                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-200"
                                                                    >
                                                                        {copiedCode === `request-${categoryIndex}-${endpointIndex}` ? (
                                                                            <Check className="h-4 w-4" />
                                                                        ) : (
                                                                            <Copy className="h-4 w-4" />
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {typeof endpoint.example === 'object' && endpoint.example && 'response' in endpoint.example && endpoint.example.response && (
                                                            <div>
                                                                <h5 className="text-xs font-medium text-gray-700 mb-1">Response</h5>
                                                                <div className="relative">
                                                                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                                                                        <code>
                                                                            {typeof (endpoint.example as any).response === 'string'
                                                                                ? (endpoint.example as any).response
                                                                                : JSON.stringify((endpoint.example as any).response, null, 2)
                                                                            }
                                                                        </code>
                                                                    </pre>
                                                                    <button
                                                                        onClick={() => copyToClipboard(
                                                                            typeof (endpoint.example as any).response === 'string'
                                                                                ? (endpoint.example as any).response
                                                                                : JSON.stringify((endpoint.example as any).response, null, 2),
                                                                            `response-${categoryIndex}-${endpointIndex}`
                                                                        )}
                                                                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-200"
                                                                    >
                                                                        {copiedCode === `response-${categoryIndex}-${endpointIndex}` ? (
                                                                            <Check className="h-4 w-4" />
                                                                        ) : (
                                                                            <Copy className="h-4 w-4" />
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {typeof endpoint.example === 'object' && endpoint.example && 'url' in endpoint.example && endpoint.example.url && (
                                                            <div>
                                                                <h5 className="text-xs font-medium text-gray-700 mb-1">Webhook URL</h5>
                                                                <div className="relative">
                                                                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                                                                        <code>{(endpoint.example as any).url}</code>
                                                                    </pre>
                                                                    <button
                                                                        onClick={() => copyToClipboard((endpoint.example as any).url, `url-${categoryIndex}-${endpointIndex}`)}
                                                                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-200"
                                                                    >
                                                                        {copiedCode === `url-${categoryIndex}-${endpointIndex}` ? (
                                                                            <Check className="h-4 w-4" />
                                                                        ) : (
                                                                            <Copy className="h-4 w-4" />
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {typeof endpoint.example === 'string' && (
                                                            <div>
                                                                <h5 className="text-xs font-medium text-gray-700 mb-1">Example</h5>
                                                                <div className="relative">
                                                                    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                                                                        <code>{endpoint.example}</code>
                                                                    </pre>
                                                                    <button
                                                                        onClick={() => copyToClipboard(endpoint.example as string, `example-${categoryIndex}-${endpointIndex}`)}
                                                                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-200"
                                                                    >
                                                                        {copiedCode === `example-${categoryIndex}-${endpointIndex}` ? (
                                                                            <Check className="h-4 w-4" />
                                                                        ) : (
                                                                            <Copy className="h-4 w-4" />
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Error Codes */}
                <div className="bg-white shadow rounded-lg">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-medium text-gray-900">Error Codes</h2>
                        <p className="mt-1 text-sm text-gray-500">Common error responses and their meanings</p>
                    </div>
                    <div className="p-6">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    <tr>
                                        <td className="px-6 py-4 text-sm font-mono text-gray-900">AUTH_REQUIRED</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">401</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">Missing or invalid API key</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-4 text-sm font-mono text-gray-900">INVALID_KEY_FORMAT</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">401</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">Malformed API key</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-4 text-sm font-mono text-gray-900">MISSING_REQUIRED_FIELDS</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">400</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">Required parameters missing</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-4 text-sm font-mono text-gray-900">TRANSACTION_NOT_FOUND</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">404</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">Transaction reference not found</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-4 text-sm font-mono text-gray-900">RATE_LIMIT_EXCEEDED</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">429</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">Too many requests</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-4 text-sm font-mono text-gray-900">INTERNAL_ERROR</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">500</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">Internal server error</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
