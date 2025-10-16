'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/StackAuthContext'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Key, 
  Eye, 
  EyeOff,
  Edit,
  Trash2,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { ClientOrganization, ClientApiKey } from '@/lib/types'
import { toast } from 'sonner'

const mockClients: ClientOrganization[] = [
  {
    id: '1',
    vendor_code: 'VENDOR_001',
    client_code: 'ACME_001',
    name: 'Acme Corporation',
    organization_name: 'Acme Corporation',
    contact_email: 'admin@acme.com',
    contact_name: 'John Doe',
    business_type: 'fintech',
    status: 'active',
    billing_tier: 'professional',
    subscription_tier: 'professional',
    monthly_quota: 50000,
    webhook_url: 'https://acme.com/webhook',
    callback_url: 'https://acme.com/callback',
    is_active: true,
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    vendor_code: 'VENDOR_002',
    client_code: 'TECH_002',
    name: 'TechStart Inc',
    organization_name: 'TechStart Inc',
    contact_email: 'dev@techstart.com',
    contact_name: 'Jane Smith',
    business_type: 'startup',
    status: 'active',
    billing_tier: 'starter',
    subscription_tier: 'starter',
    monthly_quota: 10000,
    is_active: true,
    created_at: '2024-01-10T14:20:00Z',
    updated_at: '2024-01-10T14:20:00Z'
  },
  {
    id: '3',
    vendor_code: 'VENDOR_003',
    client_code: 'GLOBAL_003',
    name: 'Global Enterprises',
    organization_name: 'Global Enterprises',
    contact_email: 'finance@global.com',
    contact_name: 'Mike Johnson',
    business_type: 'enterprise',
    status: 'inactive',
    billing_tier: 'enterprise',
    subscription_tier: 'enterprise',
    monthly_quota: 200000,
    webhook_url: 'https://global.com/webhook',
    is_active: false,
    created_at: '2024-01-05T09:15:00Z',
    updated_at: '2024-01-20T16:45:00Z'
  }
]

const mockApiKeys: ClientApiKey[] = [
  {
    id: '1',
    client_org_id: '1',
    key_id: 'ck_live_ACME_001_1642234567_abc123',
    key_name: 'Production API Key',
    environment: 'live',
    is_active: true,
    last_used_at: '2024-01-20T15:30:00Z',
    created_at: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    client_org_id: '1',
    key_id: 'ck_test_ACME_001_1642234567_def456',
    key_name: 'Test API Key',
    environment: 'test',
    is_active: true,
    created_at: '2024-01-15T10:30:00Z'
  },
  {
    id: '3',
    client_org_id: '2',
    key_id: 'ck_live_TECH_002_1642234567_ghi789',
    key_name: 'Main API Key',
    environment: 'live',
    is_active: true,
    last_used_at: '2024-01-20T12:15:00Z',
    created_at: '2024-01-10T14:20:00Z'
  }
]

export default function ClientManagement() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [clients, setClients] = useState<ClientOrganization[]>(mockClients)
  const [apiKeys, setApiKeys] = useState<ClientApiKey[]>(mockApiKeys)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClient, setSelectedClient] = useState<ClientOrganization | null>(null)
  const [showApiKeys, setShowApiKeys] = useState(false)
  const [showCreateClient, setShowCreateClient] = useState(false)

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

  const filteredClients = clients.filter(client =>
    client.organization_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.client_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.contact_email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getSubscriptionBadgeColor = (tier: string) => {
    switch (tier) {
      case 'starter': return 'bg-gray-100 text-gray-800'
      case 'professional': return 'bg-blue-100 text-blue-800'
      case 'enterprise': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getEnvironmentBadgeColor = (env: string) => {
    return env === 'live' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
  }

  const handleToggleClientStatus = (clientId: string) => {
    setClients(clients.map(client => 
      client.id === clientId 
        ? { ...client, is_active: !client.is_active }
        : client
    ))
    toast.success('Client status updated')
  }

  const handleCreateApiKey = (clientId: string) => {
    const newKey: ClientApiKey = {
      id: Date.now().toString(),
      client_org_id: clientId,
      key_id: `ck_live_NEW_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
      key_name: 'New API Key',
      environment: 'live',
      is_active: true,
      created_at: new Date().toISOString()
    }
    setApiKeys([...apiKeys, newKey])
    toast.success('API key created successfully')
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage client organizations and their API access
            </p>
          </div>
          <button
            onClick={() => setShowCreateClient(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Client
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </button>
        </div>

        {/* Clients Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Client Organizations ({filteredClients.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscription
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {client.organization_name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {client.organization_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {client.client_code}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{client.contact_name}</div>
                      <div className="text-sm text-gray-500">{client.contact_email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSubscriptionBadgeColor(client.subscription_tier)}`}>
                        {client.subscription_tier}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {client.monthly_quota.toLocaleString()} requests/month
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {client.is_active ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 mr-2" />
                        )}
                        <span className={`text-sm ${client.is_active ? 'text-green-600' : 'text-red-600'}`}>
                          {client.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(client.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedClient(client)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Key className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleClientStatus(client.id)}
                          className={`${client.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                        >
                          {client.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </button>
                        <button className="text-gray-600 hover:text-gray-900">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* API Keys Modal */}
        {selectedClient && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  API Keys - {selectedClient.organization_name}
                </h3>
                <button
                  onClick={() => setSelectedClient(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {apiKeys.filter(key => key.client_org_id === selectedClient.id).length} API keys
                  </span>
                  <button
                    onClick={() => handleCreateApiKey(selectedClient.id)}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Key
                  </button>
                </div>

                <div className="space-y-2">
                  {apiKeys
                    .filter(key => key.client_org_id === selectedClient.id)
                    .map((key) => (
                      <div key={key.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">{key.key_name}</span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEnvironmentBadgeColor(key.environment)}`}>
                              {key.environment}
                            </span>
                            {key.is_active ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-1 font-mono">
                            {key.key_id}
                          </div>
                          {key.last_used_at && (
                            <div className="text-xs text-gray-400 mt-1">
                              Last used: {new Date(key.last_used_at).toLocaleString()}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="text-gray-400 hover:text-gray-600">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="text-gray-400 hover:text-gray-600">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button className="text-red-400 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
