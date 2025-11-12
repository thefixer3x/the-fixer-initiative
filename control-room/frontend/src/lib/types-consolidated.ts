/**
 * CONSOLIDATED TYPE DEFINITIONS
 * The Fixer Initiative Control Room
 * 
 * Single source of truth for all TypeScript interfaces and types
 * Last Updated: Nov 12, 2025
 */

// ============================================================================
// CORE ENTITIES
// ============================================================================

export interface Project {
  id: string
  name: string
  description: string
  status: 'active' | 'inactive' | 'development' | 'maintenance'
  clientId: string
  schema_name?: string
  type?: 'saas' | 'infrastructure' | 'gateway' | 'frontend' | 'service'
  createdAt: string
  updatedAt: string
  metadata?: Record<string, unknown>
}

export interface Client {
  id: string
  name: string
  email: string
  company: string
  isActive: boolean
  createdAt: string
  updatedAt?: string
  metadata?: {
    industry?: string
    size?: string
    location?: string
  }
}

export interface Vendor {
  id: string
  name: string
  service: string
  status: 'active' | 'inactive' | 'maintenance'
  contactEmail: string
  apiKeyId?: string
  createdAt?: string
  metadata?: {
    website?: string
    documentation?: string
    supportUrl?: string
  }
}

export interface BillingRecord {
  id: string
  clientId: string
  amount: number
  currency?: string
  status: 'paid' | 'pending' | 'overdue' | 'cancelled'
  dueDate: string
  paidDate?: string
  description: string
  invoiceUrl?: string
  metadata?: Record<string, unknown>
}

// ============================================================================
// MULTI-DATABASE SYSTEM
// ============================================================================

export interface DatabaseProvider {
  id: string
  name: string
  type: 'supabase' | 'neon' | 'postgres' | 'mysql' | 'mongodb'
  status: 'connected' | 'disconnected' | 'error'
  connection: unknown
  schemas?: string[]
  lastSync?: string
  metrics?: {
    responseTime?: number
    uptime?: number
    queries?: number
  }
}

export interface DatabaseMetrics {
  providerId: string
  providerName: string
  connectionStatus: 'healthy' | 'degraded' | 'down'
  responseTime: number
  tableCount: number
  recordCount: number
  schemaCount: number
  lastChecked: string
  errorMessage?: string
}

export interface DatabaseConnection {
  execute: (query: string, params?: unknown[]) => Promise<unknown>
  query: (query: string, params?: unknown[]) => Promise<unknown[]>
  close?: () => Promise<void>
}

// ============================================================================
// CONTROL ROOM APPS (Multi-Schema)
// ============================================================================

export interface ControlRoomApp {
  id: string
  name: string
  description: string
  status: 'active' | 'inactive' | 'maintenance'
  schema_name: string
  api_url?: string
  health_endpoint?: string
  created_at: string
  updated_at: string
  metadata?: Record<string, unknown>
}

export interface ClientOrganization {
  id: string
  name: string
  code: string
  status: 'active' | 'inactive' | 'suspended'
  tier: 'free' | 'basic' | 'premium' | 'enterprise'
  created_at: string
  updated_at: string
  contact_email?: string
  metadata?: Record<string, unknown>
}

export interface UserProfile {
  id: string
  user_id: string
  app_id?: string
  role: 'admin' | 'user' | 'viewer'
  permissions?: string[]
  created_at: string
  updated_at: string
  metadata?: Record<string, unknown>
  apps?: {
    id: string
    name: string
    description: string
  }
}

// ============================================================================
// VENDOR & USAGE TRACKING
// ============================================================================

export interface VendorAPIKey {
  id: string
  vendor_org_id: string
  key_name: string
  key_prefix: string
  is_active: boolean
  created_at: string
  last_used_at?: string
  expires_at?: string
  vendor_organizations?: {
    id: string
    name: string
    vendor_code: string
    status: string
  }
}

export interface VendorUsageLog {
  id: string
  vendor_org_id: string
  api_key_id?: string
  endpoint: string
  method: string
  status_code: number
  response_time_ms: number
  timestamp: string
  metadata?: Record<string, unknown>
  vendor_organizations?: {
    name: string
    vendor_code: string
  }
}

export interface VendorBillingRecord {
  id: string
  vendor_org_id: string
  billing_period_start: string
  billing_period_end: string
  total_requests: number
  total_cost: number
  currency: string
  status: 'pending' | 'paid' | 'overdue'
  created_at: string
  vendor_organizations?: {
    name: string
    vendor_code: string
  }
}

// ============================================================================
// DASHBOARD & ANALYTICS
// ============================================================================

export interface DashboardMetrics {
  totalClients: number
  activeClients: number
  totalTransactions: number
  totalRevenue: number
  successRate: number
  avgResponseTime: number
  monthlyGrowth: number
  // Multi-DB specific
  totalApps?: number
  activeApps?: number
  totalOrganizations?: number
  activeOrganizations?: number
  totalProfiles?: number
  totalAuthUsers?: number
}

export interface EcosystemApp {
  id: string
  name: string
  description: string
  status: 'active' | 'inactive' | 'maintenance'
  schema_name: string
  type: 'saas' | 'infrastructure' | 'gateway' | 'frontend' | 'service'
  health_status: 'healthy' | 'degraded' | 'down'
  response_time: number
  last_checked: string
  metrics: {
    users: number
    transactions: number
    revenue: number
    uptime: number
  }
}

export interface ChartDataPoint {
  date: string
  value: number
  label?: string
  category?: string
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

// ============================================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================================

export interface RealtimeSubscription {
  id: string
  channel: string
  table: string
  schema: string
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
  callback: (payload: RealtimePayload) => void
}

export interface RealtimePayload {
  schema: string
  table: string
  commit_timestamp: string
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: Record<string, unknown>
  old: Record<string, unknown>
  errors: string[] | null
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
    details?: unknown
  }
  meta?: {
    page?: number
    limit?: number
    total?: number
    timestamp?: string
  }
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ============================================================================
// ECOSYSTEM INTEGRATION
// ============================================================================

export interface EcosystemProject {
  id: string
  name: string
  status: 'active' | 'inactive' | 'maintenance'
  lastDeployment: string
  healthStatus: 'healthy' | 'degraded' | 'down'
  metrics: {
    requests: number
    revenue: number
    users: number
    uptime: number
  }
}

export interface AggregatedMetrics {
  totalClients: number
  activeClients: number
  totalTransactions: number
  totalRevenue: number
  successRate: number
  avgResponseTime: number
  monthlyGrowth: number
  ecosystemProjects: EcosystemProject[]
}

// ============================================================================
// AUTHENTICATION & AUTHORIZATION
// ============================================================================

export interface AuthUser {
  id: string
  email: string
  role: 'admin' | 'user' | 'viewer'
  permissions: Permission[]
  metadata?: Record<string, unknown>
}

export interface Permission {
  resource: string
  actions: ('create' | 'read' | 'update' | 'delete')[]
}

export interface Session {
  user: AuthUser
  accessToken: string
  refreshToken?: string
  expiresAt: string
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface ProjectFormData {
  name: string
  description: string
  status: Project['status']
  clientId: string
  schema_name?: string
  type?: Project['type']
}

export interface ClientFormData {
  name: string
  email: string
  company: string
  isActive: boolean
  metadata?: Client['metadata']
}

export interface VendorFormData {
  name: string
  service: string
  status: Vendor['status']
  contactEmail: string
}

export interface BillingFormData {
  clientId: string
  amount: number
  currency?: string
  status: BillingRecord['status']
  dueDate: string
  description: string
}

// ============================================================================
// FILTER & SEARCH
// ============================================================================

export interface FilterOptions {
  status?: string[]
  dateRange?: {
    from: string
    to: string
  }
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface SearchParams {
  query: string
  filters?: FilterOptions
  page?: number
  limit?: number
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type Nullable<T> = T | null
export type Optional<T> = T | undefined
export type AsyncData<T> = {
  data: T | null
  loading: boolean
  error: Error | null
}

export type TableAction = 'create' | 'edit' | 'delete' | 'view'

export interface TableColumn<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  render?: (value: unknown, row: T) => React.ReactNode
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export type {
  // Re-export for convenience
  DatabaseProvider as DB,
  EcosystemApp as App,
  ControlRoomApp as CRApp,
}
