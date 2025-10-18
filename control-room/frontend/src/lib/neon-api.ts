// Multi-Database API Service
// Supports both original Supabase and enhanced Neon architectures
import { supabase } from './supabase'
import { multiDB } from './multi-database'
import { ControlRoomApp, ClientOrganization, UserProfile } from './types'

// IMPORTANT: Do not import supabaseAdmin at the top level to avoid bundling it to the client.
// Dynamically import it inside server-only logic when needed.

export class MultiDatabaseAPI {

    // Control Room Apps Management
    static async getControlRoomApps(): Promise<ControlRoomApp[]> {
        const { data, error } = await supabase
            .from('apps')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error
        return data || []
    }

    static async getAppById(id: string): Promise<ControlRoomApp | null> {
        const { data, error } = await supabase
            .from('apps')
            .select('*')
            .eq('id', id)
            .single()

        if (error) throw error
        return data
    }

    // Client Services Organizations
    static async getClientOrganizations(): Promise<ClientOrganization[]> {
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error
        return data || []
    }

    static async getActiveClientOrganizations(): Promise<ClientOrganization[]> {
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('status', 'active')
            .order('created_at', { ascending: false })

        if (error) throw error
        return data || []
    }

    // User Profile Management with App Association
    static async getUserProfiles(): Promise<UserProfile[]> {
        const { data, error } = await supabase
            .from('profiles')
            .select(`
        *,
        apps:app_id (
          id,
          name,
          description
        )
      `)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data || []
    }

    static async getProfilesByApp(appId: string): Promise<UserProfile[]> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('app_id', appId)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data || []
    }

    // Cross-Schema Analytics
    static async getDashboardMetrics() {
        // Use supabaseAdmin only on the server
        let authUsersCount = 0
        if (typeof window === 'undefined') {
            const { supabaseAdmin } = await import('./supabase-admin')
            const { data: authUsersData, error: authErr } = await supabaseAdmin.from('users').select('id')
            if (!authErr) {
                authUsersCount = authUsersData?.length || 0
            }
        }

        const [
            appsResult,
            orgsResult,
            profilesResult,
        ] = await Promise.all([
            supabase.from('apps').select('id, status').eq('status', 'active'),
            supabase.from('organizations').select('id, status').eq('status', 'active'),
            supabase.from('profiles').select('id'),
        ])

        return {
            totalApps: appsResult.data?.length || 0,
            activeApps: appsResult.data?.filter((app: { status: string }) => app.status === 'active').length || 0,
            totalOrganizations: orgsResult.data?.length || 0,
            activeOrganizations: orgsResult.data?.filter((org: { status: string }) => org.status === 'active').length || 0,
            totalProfiles: profilesResult.data?.length || 0,
            totalAuthUsers: authUsersCount, // server-only metric
        }
    }

    // Vendor API Keys Management
    static async getVendorAPIKeys() {
        const { data, error } = await supabase
            .from('vendor_api_keys')
            .select(`
        *,
        vendor_organizations:vendor_org_id (
          id,
          name,
          vendor_code,
          status
        )
      `)
            .eq('is_active', true)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data || []
    }

    // Usage Analytics
    static async getUsageLogs(limit = 100) {
        const { data, error } = await supabase
            .from('vendor_usage_logs')
            .select(`
        *,
        vendor_organizations:vendor_org_id (
          name,
          vendor_code
        )
      `)
            .order('timestamp', { ascending: false })
            .limit(limit)

        if (error) throw error
        return data || []
    }

    // Billing Records
    static async getBillingRecords() {
        const { data, error } = await supabase
            .from('vendor_billing_records')
            .select(`
        *,
        vendor_organizations:vendor_org_id (
          name,
          vendor_code
        )
      `)
            .order('billing_period_end', { ascending: false })

        if (error) throw error
        return data || []
    }

    // Real-time Subscriptions
    static subscribeToApps(callback: (payload: unknown) => void) {
        return supabase
            .channel('control_room_apps')
            .on('postgres_changes',
                { event: '*', schema: 'control_room', table: 'apps' },
                callback
            )
            .subscribe()
    }

    static subscribeToOrganizations(callback: (payload: unknown) => void) {
        return supabase
            .channel('client_organizations')
            .on('postgres_changes',
                { event: '*', schema: 'client_services', table: 'organizations' },
                callback
            )
            .subscribe()
    }

    // Legacy Supabase Operations (for backward compatibility)
    static async getSupabaseTables() {
        const { data, error } = await supabase
            .from('information_schema.tables')
            .select('table_name, table_schema')
            .not('table_schema', 'in', '(information_schema,pg_catalog)')
            .order('table_schema', { ascending: true })

        if (error) throw error
        return data || []
    }

    static async getSupabaseUsers() {
        if (typeof window === 'undefined') {
            const { supabaseAdmin } = await import('./supabase-admin')
            const { data, error } = await supabaseAdmin.auth.admin.listUsers()
            if (error) throw error
            return data.users || []
        }
        return []
    }

    // Cross-Database Analytics
    static async getUnifiedDashboardMetrics() {
        try {
            // Get metrics from both databases
            const [neonMetrics, supabaseUsers, databaseMetrics] = await Promise.all([
                this.getDashboardMetrics(), // Neon metrics
                this.getSupabaseUsers(),     // Supabase users
                multiDB.getAllDatabaseMetrics() // All database health
            ])

            return {
                ...neonMetrics,
                supabaseUsers: supabaseUsers.length,
                databaseProviders: databaseMetrics,
                crossDatabaseSync: true,
                lastSynced: new Date().toISOString()
            }
        } catch (error) {
            console.error('Error fetching unified metrics:', error)
            return {
                totalApps: 0,
                activeApps: 0,
                totalOrganizations: 0,
                activeOrganizations: 0,
                totalProfiles: 0,
                totalUsers: 0,
                supabaseUsers: 0,
                databaseProviders: [],
                crossDatabaseSync: false,
                lastSynced: new Date().toISOString()
            }
        }
    }

    // Database Provider Management
    static async addNewProvider(config: {
        name: string
        type: 'postgres' | 'mysql' | 'mongodb'
        connectionString: string
    }) {
        return await multiDB.addProvider({
            id: `custom-${Date.now()}`,
            ...config
        })
    }

    static async testAllConnections() {
        return await multiDB.getAllDatabaseMetrics()
    }
}

// Export for use in components
export default MultiDatabaseAPI