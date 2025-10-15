// CaaS Neon Database Configuration (Backup/Alternative)
// Deploy this for Neon integration

const { Pool } = require('pg');
const { neon, neonConfig } = require('@neondatabase/serverless');

// Neon Database Configuration
const NEON_CONFIG = {
    // Replace with your Neon connection string
    connectionString: 'postgresql://[user]:[password]@[project-id].neon.tech/[database]?sslmode=require',
    
    // Alternative: Component-based config
    host: '[project-id].neon.tech',
    database: 'credit_services', // Or your preferred database name
    user: 'your_neon_user',
    password: 'your_neon_password',
    port: 5432,
    ssl: true
};

// Configure Neon for serverless/edge environments
neonConfig.fetchConnectionCache = true;

// Create connection pool
const neonPool = new Pool({
    connectionString: NEON_CONFIG.connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

// Neon-specific query function
async function neonQuery(query, params = []) {
    const client = await neonPool.connect();
    try {
        const result = await client.query(query, params);
        return result;
    } catch (error) {
        console.error('Neon query error:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Deploy CaaS schema to Neon
async function deployNeonSchema() {
    const schemaSQL = `
        -- Create credit schema in Neon
        CREATE SCHEMA IF NOT EXISTS credit;
        
        -- Same schema as Supabase
        -- (Full schema from 001_add_credit_schema.sql)
    `;
    
    try {
        await neonQuery(schemaSQL);
        console.log('CaaS schema deployed to Neon successfully');
    } catch (error) {
        console.error('Failed to deploy schema to Neon:', error);
    }
}

// Neon CaaS Operations (matching Supabase interface)
const neonCreditOperations = {
    async submitApplication(applicationData) {
        const query = `
            INSERT INTO credit.applications 
            (user_id, business_id, amount_requested, currency, purpose, 
             loan_term_months, status, metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
        
        const values = [
            applicationData.user_id,
            applicationData.business_id,
            applicationData.amount_requested,
            applicationData.currency || 'NGN',
            applicationData.purpose,
            applicationData.loan_term_months,
            'pending',
            JSON.stringify(applicationData.metadata || {})
        ];
        
        const result = await neonQuery(query, values);
        return result.rows[0];
    },
    
    async getApplications(filters = {}) {
        let query = 'SELECT * FROM credit.applications WHERE 1=1';
        const params = [];
        let paramIndex = 1;
        
        if (filters.user_id) {
            query += ` AND user_id = $${paramIndex++}`;
            params.push(filters.user_id);
        }
        
        if (filters.status) {
            query += ` AND status = $${paramIndex++}`;
            params.push(filters.status);
        }
        
        query += ' ORDER BY created_at DESC';
        
        const result = await neonQuery(query, params);
        return result.rows;
    },
    
    async registerProvider(providerData) {
        const query = `
            INSERT INTO credit.providers 
            (provider_code, company_name, registration_number, contact_email,
             contact_phone, address, minimum_loan_amount, maximum_loan_amount,
             supported_currencies, interest_rate_range, processing_fee_percentage,
             api_endpoint, webhook_url, status, metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING *
        `;
        
        const values = [
            providerData.provider_code,
            providerData.company_name,
            providerData.registration_number,
            providerData.contact_email,
            providerData.contact_phone,
            JSON.stringify(providerData.address),
            providerData.minimum_loan_amount,
            providerData.maximum_loan_amount,
            providerData.supported_currencies || ['NGN'],
            JSON.stringify(providerData.interest_rate_range),
            providerData.processing_fee_percentage,
            providerData.api_endpoint,
            providerData.webhook_url,
            'pending_verification',
            JSON.stringify(providerData.metadata || {})
        ];
        
        const result = await neonQuery(query, values);
        return result.rows[0];
    },
    
    // Sync data between Supabase and Neon
    async syncFromSupabase(supabaseData, tableName) {
        // Implement sync logic
        console.log(`Syncing ${tableName} from Supabase to Neon`);
        // Add your sync implementation
    }
};

// Dual-write helper (write to both Supabase and Neon)
async function dualWrite(operation, data) {
    const results = {
        supabase: null,
        neon: null,
        errors: []
    };
    
    try {
        // Write to Supabase (primary)
        const { creditOperations } = require('./caas-supabase-config');
        results.supabase = await creditOperations[operation](data);
    } catch (error) {
        results.errors.push({ database: 'supabase', error: error.message });
    }
    
    try {
        // Write to Neon (backup)
        results.neon = await neonCreditOperations[operation](data);
    } catch (error) {
        results.errors.push({ database: 'neon', error: error.message });
    }
    
    return results;
}

module.exports = {
    neonPool,
    neonQuery,
    neonCreditOperations,
    deployNeonSchema,
    dualWrite,
    NEON_CONFIG
};