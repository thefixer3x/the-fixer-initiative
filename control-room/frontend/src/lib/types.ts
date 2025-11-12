// Enhanced Neon Database Types

// Control Room App Management
export interface ControlRoomApp {
  id: string
  name: string
  description?: string
  owner_id: string
  status: 'active' | 'inactive' | 'maintenance'
  created_at: string
  updated_at: string
}

// Client Services Organization (Enhanced)
export interface ClientOrganization {
  id: string
  vendor_code: string
  client_code: string
  name: string
  organization_name: string
  contact_email: string
  contact_name: string
  business_type: string
  status: 'active' | 'inactive' | 'pending' | 'suspended'
  is_active: boolean
  billing_tier: 'starter' | 'professional' | 'enterprise'
  subscription_tier: 'starter' | 'professional' | 'enterprise'
  monthly_quota: number
  webhook_url?: string
  callback_url?: string
  created_at: string
  updated_at: string
}

// User Profile with App Association
export interface UserProfile {
  id: string
  user_id?: string
  app_id: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface ClientApiKey {
  id: string
  client_org_id: string
  key_id: string
  key_name: string
  environment: 'test' | 'live'
  is_active: boolean
  last_used_at?: string
  created_at: string
  expires_at?: string
}

export interface ClientTransaction {
  id: string
  client_org_id: string
  client_reference: string
  internal_reference: string
  service_type: 'payment' | 'transfer'
  service_provider: 'paystack' | 'sayswitch'
  amount: number
  currency: string
  status: 'pending' | 'success' | 'failed' | 'cancelled'
  customer_email?: string
  recipient_account?: string
  recipient_bank_code?: string
  recipient_name?: string
  metadata?: Record<string, unknown>
  client_ip?: string
  user_agent?: string
  created_at: string
  updated_at: string
  completed_at?: string
}

export interface ClientUsageLog {
  id: string
  client_org_id: string
  api_key_id?: string
  request_id: string
  endpoint: string
  method: string
  service_type: string
  status_code: number
  processing_time_ms: number
  response_size_bytes: number
  client_ip?: string
  user_agent?: string
  billable_units: number
  cost_per_unit: number
  total_cost: number
  created_at: string
}

export interface ClientBillingRecord {
  id: string
  client_org_id: string
  billing_period_start: string
  billing_period_end: string
  total_requests: number
  total_successful_requests: number
  total_failed_requests: number
  payment_requests: number
  transfer_requests: number
  total_billable_units: number
  total_amount: number
  currency: string
  status: 'pending' | 'paid' | 'overdue'
  paid_at?: string
  invoice_url?: string
  created_at: string
  updated_at: string
}

export interface UsageSummary {
  total_requests: number
  successful_requests: number
  failed_requests: number
  payment_requests: number
  transfer_requests: number
  avg_response_time_ms: number
  total_cost: number
}

export interface DashboardMetrics {
  totalClients: number
  activeClients: number
  totalTransactions: number
  totalRevenue: number
  successRate: number
  avgResponseTime: number
  monthlyGrowth: number
}

export interface ChartDataPoint {
  date: string
  value: number
  label?: string
}

export interface TransactionStats {
  total: number
  successful: number
  failed: number
  pending: number
  revenue: number
}

// ============================================================================
// CONSOLIDATED TYPES - Gradually migrating to single source of truth
// ============================================================================
// Import additional types from consolidated file
export type {
  Project,
  Client,
  Vendor,
  BillingRecord,
  DatabaseProvider,
  DatabaseMetrics,
  VendorAPIKey,
  VendorUsageLog,
  VendorBillingRecord,
  EcosystemApp,
  RealtimeSubscription,
  RealtimePayload,
  ApiResponse,
  PaginatedResponse,
  EcosystemProject,
  AggregatedMetrics,
  AuthUser,
  Permission,
  Session,
  ProjectFormData,
  ClientFormData,
  VendorFormData,
  BillingFormData,
  FilterOptions,
  SearchParams,
  AsyncData,
  TableAction,
  TableColumn,
} from './types-consolidated'
