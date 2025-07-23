// CaaS Direct Database Access Configuration
// This allows clients to connect directly to databases when VPS is down

const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

// Database Configurations
const DATABASES = {
    supabase: {
        url: process.env.SUPABASE_URL || 'https://your-project.supabase.co',
        anonKey: process.env.SUPABASE_ANON_KEY || 'your-anon-key',
        // Direct PostgreSQL connection for fallback
        pgConfig: {
            host: process.env.SUPABASE_DB_HOST || 'your-supabase-db-host',
            port: 5432,
            database: 'postgres',
            user: 'postgres',
            password: process.env.SUPABASE_DB_PASSWORD,
            ssl: { rejectUnauthorized: false }
        }
    },
    neon: {
        // Add your Neon connection details here
        connectionString: process.env.NEON_DATABASE_URL || 'postgresql://user:pass@project.neon.tech/neondb?sslmode=require',
        pgConfig: {
            connectionString: process.env.NEON_DATABASE_URL,
            ssl: true
        }
    }
};

// Failover Client Class
class CreditServiceFailoverClient {
    constructor() {
        this.primaryClient = null;
        this.backupClient = null;
        this.vpsBaseUrl = 'https://api.connectionpoint.tech';
        this.initializeClients();
    }

    initializeClients() {
        // Initialize Supabase client
        this.supabaseClient = createClient(
            DATABASES.supabase.url,
            DATABASES.supabase.anonKey,
            {
                auth: { persistSession: false },
                db: { schema: 'credit' }
            }
        );

        // Initialize PostgreSQL pools
        this.supabasePgPool = new Pool(DATABASES.supabase.pgConfig);
        this.neonPgPool = new Pool(DATABASES.neon.pgConfig);
    }

    // Main method that tries VPS first, then falls back to direct DB
    async executeOperation(operation, params) {
        // 1. Try VPS API first (fastest, includes business logic)
        try {
            return await this.callVpsApi(operation, params);
        } catch (vpsError) {
            console.warn('VPS failed, falling back to direct database:', vpsError.message);
            
            // 2. Try Supabase direct (primary database)
            try {
                return await this.callSupabaseDirect(operation, params);
            } catch (supabaseError) {
                console.warn('Supabase failed, falling back to Neon:', supabaseError.message);
                
                // 3. Try Neon direct (backup database)
                try {
                    return await this.callNeonDirect(operation, params);
                } catch (neonError) {
                    console.error('All services failed:', {
                        vps: vpsError.message,
                        supabase: supabaseError.message,
                        neon: neonError.message
                    });
                    throw new Error('All services unavailable');
                }
            }
        }
    }

    // VPS API calls
    async callVpsApi(operation, params) {
        const endpoints = {
            submitApplication: { method: 'POST', path: '/api/credit/applications' },
            getApplications: { method: 'GET', path: '/api/credit/applications' },
            getApplication: { method: 'GET', path: `/api/credit/applications/${params.id}` },
            registerProvider: { method: 'POST', path: '/api/credit/providers' },
            getProviders: { method: 'GET', path: '/api/credit/providers' },
            submitBid: { method: 'POST', path: '/api/credit/bids' },
            healthCheck: { method: 'GET', path: '/api/credit/health' }
        };

        const endpoint = endpoints[operation];
        if (!endpoint) throw new Error(`Unknown operation: ${operation}`);

        const url = `${this.vpsBaseUrl}${endpoint.path}`;
        const options = {
            method: endpoint.method,
            headers: {
                'Content-Type': 'application/json',
                'X-Client-Version': '1.0.0'
            }
        };

        if (endpoint.method !== 'GET' && params) {
            options.body = JSON.stringify(params);
        }

        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`VPS API error: ${response.status}`);
        }

        return await response.json();
    }

    // Supabase direct database calls
    async callSupabaseDirect(operation, params) {
        const operations = {
            submitApplication: async (data) => {
                const { data: result, error } = await this.supabaseClient
                    .from('applications')
                    .insert({
                        ...data,
                        id: crypto.randomUUID(),
                        status: 'pending',
                        created_at: new Date().toISOString()
                    })
                    .select()
                    .single();
                
                if (error) throw error;
                return result;
            },

            getApplications: async (filters = {}) => {
                let query = this.supabaseClient
                    .from('applications')
                    .select('*');
                
                if (filters.user_id) query = query.eq('user_id', filters.user_id);
                if (filters.status) query = query.eq('status', filters.status);
                
                const { data, error } = await query.order('created_at', { ascending: false });
                if (error) throw error;
                return data;
            },

            getApplication: async ({ id }) => {
                const { data: application, error: appError } = await this.supabaseClient
                    .from('applications')
                    .select('*')
                    .eq('id', id)
                    .single();
                
                if (appError) throw appError;
                
                const { data: bids, error: bidsError } = await this.supabaseClient
                    .from('bids')
                    .select('*')
                    .eq('application_id', id);
                
                if (bidsError) throw bidsError;
                
                return { ...application, bids };
            },

            registerProvider: async (data) => {
                const { data: result, error } = await this.supabaseClient
                    .from('providers')
                    .insert({
                        ...data,
                        id: crypto.randomUUID(),
                        status: 'pending_verification',
                        created_at: new Date().toISOString()
                    })
                    .select()
                    .single();
                
                if (error) throw error;
                return result;
            },

            getProviders: async (filters = {}) => {
                let query = this.supabaseClient
                    .from('providers')
                    .select('*');
                
                if (filters.status) query = query.eq('status', filters.status);
                if (filters.active_only) query = query.eq('status', 'active');
                
                const { data, error } = await query;
                if (error) throw error;
                return data;
            },

            submitBid: async (data) => {
                // Calculate repayment details
                const principal = data.offered_amount;
                const monthlyRate = data.interest_rate / 12 / 100;
                const months = data.loan_term_months;
                
                const monthlyPayment = principal * 
                    (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                    (Math.pow(1 + monthlyRate, months) - 1);
                
                const totalRepayment = monthlyPayment * months;
                
                const { data: result, error } = await this.supabaseClient
                    .from('bids')
                    .insert({
                        ...data,
                        id: crypto.randomUUID(),
                        total_repayment: totalRepayment,
                        monthly_repayment: monthlyPayment,
                        status: 'pending',
                        created_at: new Date().toISOString()
                    })
                    .select()
                    .single();
                
                if (error) throw error;
                return result;
            },

            healthCheck: async () => {
                const { count, error } = await this.supabaseClient
                    .from('providers')
                    .select('*', { count: 'exact', head: true });
                
                return {
                    status: error ? 'unhealthy' : 'healthy',
                    database: 'supabase',
                    direct: true,
                    timestamp: new Date().toISOString()
                };
            }
        };

        const fn = operations[operation];
        if (!fn) throw new Error(`Operation ${operation} not implemented for direct access`);
        
        return await fn(params);
    }

    // Neon direct database calls (using raw SQL)
    async callNeonDirect(operation, params) {
        const queries = {
            submitApplication: {
                sql: `INSERT INTO credit.applications 
                      (id, user_id, business_id, amount_requested, currency, purpose, 
                       loan_term_months, status, metadata, created_at)
                      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                      RETURNING *`,
                values: (data) => [
                    crypto.randomUUID(),
                    data.user_id,
                    data.business_id,
                    data.amount_requested,
                    data.currency || 'NGN',
                    data.purpose,
                    data.loan_term_months,
                    'pending',
                    JSON.stringify(data.metadata || {}),
                    new Date().toISOString()
                ]
            },

            getApplications: {
                sql: `SELECT * FROM credit.applications 
                      WHERE ($1::uuid IS NULL OR user_id = $1)
                      AND ($2::text IS NULL OR status = $2)
                      ORDER BY created_at DESC`,
                values: (filters) => [
                    filters?.user_id || null,
                    filters?.status || null
                ]
            },

            getProviders: {
                sql: `SELECT * FROM credit.providers 
                      WHERE ($1::text IS NULL OR status = $1)
                      ORDER BY created_at DESC`,
                values: (filters) => [
                    filters?.active_only ? 'active' : (filters?.status || null)
                ]
            },

            healthCheck: {
                sql: `SELECT COUNT(*) FROM credit.providers`,
                values: () => []
            }
        };

        const query = queries[operation];
        if (!query) throw new Error(`Operation ${operation} not implemented for Neon`);

        const client = await this.neonPgPool.connect();
        try {
            const result = await client.query(query.sql, query.values(params));
            
            if (operation === 'healthCheck') {
                return {
                    status: 'healthy',
                    database: 'neon',
                    direct: true,
                    count: result.rows[0].count,
                    timestamp: new Date().toISOString()
                };
            }
            
            return operation.startsWith('get') ? result.rows : result.rows[0];
        } finally {
            client.release();
        }
    }

    // Utility method to check all services
    async checkAllServices() {
        const results = {
            vps: { status: 'unknown', latency: null },
            supabase: { status: 'unknown', latency: null },
            neon: { status: 'unknown', latency: null }
        };

        // Check VPS
        try {
            const start = Date.now();
            await this.callVpsApi('healthCheck', {});
            results.vps = { 
                status: 'healthy', 
                latency: Date.now() - start 
            };
        } catch (error) {
            results.vps = { 
                status: 'unhealthy', 
                error: error.message 
            };
        }

        // Check Supabase
        try {
            const start = Date.now();
            await this.callSupabaseDirect('healthCheck', {});
            results.supabase = { 
                status: 'healthy', 
                latency: Date.now() - start 
            };
        } catch (error) {
            results.supabase = { 
                status: 'unhealthy', 
                error: error.message 
            };
        }

        // Check Neon
        try {
            const start = Date.now();
            await this.callNeonDirect('healthCheck', {});
            results.neon = { 
                status: 'healthy', 
                latency: Date.now() - start 
            };
        } catch (error) {
            results.neon = { 
                status: 'unhealthy', 
                error: error.message 
            };
        }

        return results;
    }
}

// Export for use in applications
module.exports = CreditServiceFailoverClient;

// Example usage:
/*
const creditService = new CreditServiceFailoverClient();

// Submit application (will try VPS → Supabase → Neon)
const application = await creditService.executeOperation('submitApplication', {
    user_id: 'user-123',
    business_id: 'business-456',
    amount_requested: 1000000,
    purpose: 'Working capital',
    loan_term_months: 12
});

// Check all services health
const health = await creditService.checkAllServices();
console.log('Service health:', health);
*/