// CaaS Supabase Configuration
// Deploy this to: /root/fixer-initiative/ecosystem-projects/onasis-gateway/config/database.js

const { createClient } = require('@supabase/supabase-js');

// Supabase connection details for the-fixer-initiative project
const SUPABASE_URL = 'https://mxtsdgkwzjzlttpotole.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY'; // Get from Supabase dashboard
const SUPABASE_SERVICE_KEY = 'YOUR_SERVICE_KEY'; // For server-side operations

// Database connection for direct PostgreSQL access
const DATABASE_CONFIG = {
    host: 'db.mxtsdgkwzjzlttpotole.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'YOUR_DB_PASSWORD', // Get from Supabase dashboard
    ssl: { rejectUnauthorized: false }
};

// Create Supabase client for CaaS operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Helper function for credit schema queries
async function creditQuery(query, params = []) {
    try {
        // For complex queries, use direct PostgreSQL connection
        const { Pool } = require('pg');
        const pool = new Pool(DATABASE_CONFIG);
        
        const result = await pool.query(query, params);
        await pool.end();
        
        return result;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

// Supabase helper for credit operations
const creditOperations = {
    // Submit application
    async submitApplication(applicationData) {
        const { data, error } = await supabase
            .from('applications')
            .insert(applicationData)
            .select()
            .single();
            
        if (error) throw error;
        return data;
    },
    
    // Get applications
    async getApplications(filters = {}) {
        let query = supabase
            .from('applications')
            .select('*');
            
        if (filters.user_id) {
            query = query.eq('user_id', filters.user_id);
        }
        
        if (filters.status) {
            query = query.eq('status', filters.status);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    },
    
    // Register provider
    async registerProvider(providerData) {
        const { data, error } = await supabase
            .from('providers')
            .insert(providerData)
            .select()
            .single();
            
        if (error) throw error;
        return data;
    },
    
    // Submit bid
    async submitBid(bidData) {
        const { data, error } = await supabase
            .from('bids')
            .insert(bidData)
            .select()
            .single();
            
        if (error) throw error;
        return data;
    },
    
    // Process transaction
    async processTransaction(transactionData) {
        const { data, error } = await supabase
            .from('transactions')
            .insert(transactionData)
            .select()
            .single();
            
        if (error) throw error;
        return data;
    },
    
    // Get analytics
    async getAnalytics(startDate, endDate) {
        // Use RPC function or complex query
        const { data, error } = await supabase
            .rpc('get_credit_analytics', {
                start_date: startDate,
                end_date: endDate
            });
            
        if (error) throw error;
        return data;
    }
};

module.exports = {
    supabase,
    creditQuery,
    creditOperations,
    DATABASE_CONFIG
};