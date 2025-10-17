#!/bin/bash
# Complete CaaS Deployment Package
# Run this script on your VPS after SSH access is established

set -e

echo "=== CaaS Complete Deployment Package ==="
echo "This script will deploy all CaaS components to Onasis Gateway"
echo ""

# Function to create directories
create_directories() {
    echo "Creating directory structure..."
    mkdir -p /root/onasis-gateway/services/credit-as-a-service
    mkdir -p /root/onasis-gateway/mcp-server/tools/credit
    mkdir -p /root/onasis-gateway/mcp-server/types
    mkdir -p /root/onasis-gateway/database/migrations
}

# Function to deploy CaaS service files
deploy_caas_service() {
    echo "Deploying CaaS service files..."
    
    # Create client.js
    cat > /root/onasis-gateway/services/credit-as-a-service/client.js << 'EOF'
const BaseClient = require('../../lib/base-client');
const { v4: uuidv4 } = require('uuid');

class CreditAsAServiceClient extends BaseClient {
    constructor() {
        super({
            serviceName: 'credit-as-a-service',
            serviceConfig: require('./credit-as-a-service.json')
        });
    }

    // Application Management
    async submitApplication(applicationData) {
        const application = {
            id: uuidv4(),
            ...applicationData,
            status: 'pending',
            created_at: new Date().toISOString()
        };
        
        const result = await this.db.query(
            `INSERT INTO credit.applications 
             (id, user_id, business_id, amount_requested, currency, purpose, 
              loan_term_months, status, metadata, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING *`,
            [application.id, application.user_id, application.business_id, 
             application.amount_requested, application.currency || 'NGN', 
             application.purpose, application.loan_term_months, 
             application.status, JSON.stringify(application.metadata || {}), 
             application.created_at]
        );
        
        // Trigger provider notifications
        await this.notifyProviders(result.rows[0]);
        
        return result.rows[0];
    }

    async getApplications(filters = {}) {
        let query = 'SELECT * FROM credit.applications WHERE 1=1';
        const params = [];
        let paramCount = 0;

        if (filters.user_id) {
            query += ` AND user_id = $${++paramCount}`;
            params.push(filters.user_id);
        }

        if (filters.business_id) {
            query += ` AND business_id = $${++paramCount}`;
            params.push(filters.business_id);
        }

        if (filters.status) {
            query += ` AND status = $${++paramCount}`;
            params.push(filters.status);
        }

        query += ' ORDER BY created_at DESC';

        const result = await this.db.query(query, params);
        return result.rows;
    }

    async getApplication(applicationId) {
        const result = await this.db.query(
            'SELECT * FROM credit.applications WHERE id = $1',
            [applicationId]
        );
        
        if (result.rows.length === 0) {
            throw new Error('Application not found');
        }
        
        // Get associated bids
        const bids = await this.db.query(
            'SELECT * FROM credit.bids WHERE application_id = $1 ORDER BY interest_rate ASC',
            [applicationId]
        );
        
        return {
            ...result.rows[0],
            bids: bids.rows
        };
    }

    async updateApplicationStatus(applicationId, status, notes) {
        const result = await this.db.query(
            `UPDATE credit.applications 
             SET status = $1, updated_at = NOW()
             WHERE id = $2
             RETURNING *`,
            [status, applicationId]
        );
        
        if (result.rows.length === 0) {
            throw new Error('Application not found');
        }
        
        // Log status change
        await this.db.query(
            `INSERT INTO credit.status_history 
             (application_id, status, notes, created_at)
             VALUES ($1, $2, $3, NOW())`,
            [applicationId, status, notes]
        );
        
        return result.rows[0];
    }

    // Provider Management
    async registerProvider(providerData) {
        const provider = {
            id: uuidv4(),
            ...providerData,
            status: 'pending_verification',
            created_at: new Date().toISOString()
        };
        
        const result = await this.db.query(
            `INSERT INTO credit.providers 
             (id, provider_code, company_name, registration_number, 
              contact_email, contact_phone, address, 
              minimum_loan_amount, maximum_loan_amount, 
              supported_currencies, interest_rate_range, 
              processing_fee_percentage, api_endpoint, 
              webhook_url, status, metadata, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 
                     $11, $12, $13, $14, $15, $16, $17)
             RETURNING *`,
            [provider.id, provider.provider_code, provider.company_name,
             provider.registration_number, provider.contact_email,
             provider.contact_phone, JSON.stringify(provider.address),
             provider.minimum_loan_amount, provider.maximum_loan_amount,
             provider.supported_currencies || ['NGN'],
             JSON.stringify(provider.interest_rate_range),
             provider.processing_fee_percentage,
             provider.api_endpoint, provider.webhook_url,
             provider.status, JSON.stringify(provider.metadata || {}),
             provider.created_at]
        );
        
        return result.rows[0];
    }

    async getProviders(filters = {}) {
        let query = 'SELECT * FROM credit.providers WHERE 1=1';
        const params = [];
        let paramCount = 0;

        if (filters.status) {
            query += ` AND status = $${++paramCount}`;
            params.push(filters.status);
        }

        if (filters.active_only) {
            query += ` AND status = 'active'`;
        }

        const result = await this.db.query(query, params);
        return result.rows;
    }

    // Bidding System
    async submitProviderBid(bidData) {
        const bid = {
            id: uuidv4(),
            ...bidData,
            status: 'pending',
            created_at: new Date().toISOString()
        };
        
        // Verify provider is active
        const provider = await this.db.query(
            'SELECT * FROM credit.providers WHERE id = $1 AND status = $2',
            [bid.provider_id, 'active']
        );
        
        if (provider.rows.length === 0) {
            throw new Error('Provider not found or not active');
        }
        
        const result = await this.db.query(
            `INSERT INTO credit.bids 
             (id, application_id, provider_id, offered_amount, 
              interest_rate, loan_term_months, processing_fee, 
              total_repayment, monthly_repayment, special_conditions, 
              valid_until, status, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
             RETURNING *`,
            [bid.id, bid.application_id, bid.provider_id,
             bid.offered_amount, bid.interest_rate, bid.loan_term_months,
             bid.processing_fee, bid.total_repayment, bid.monthly_repayment,
             JSON.stringify(bid.special_conditions || {}),
             bid.valid_until, bid.status, bid.created_at]
        );
        
        // Notify applicant of new bid
        await this.notifyApplicant(bid.application_id, result.rows[0]);
        
        return result.rows[0];
    }

    // Transaction Processing
    async processTransaction(transactionData) {
        const transaction = {
            id: uuidv4(),
            ...transactionData,
            status: 'processing',
            created_at: new Date().toISOString()
        };
        
        const result = await this.db.query(
            `INSERT INTO credit.transactions 
             (id, bid_id, application_id, provider_id, 
              transaction_type, amount, currency, 
              payment_method, reference_number, status, 
              metadata, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             RETURNING *`,
            [transaction.id, transaction.bid_id, transaction.application_id,
             transaction.provider_id, transaction.transaction_type,
             transaction.amount, transaction.currency || 'NGN',
             transaction.payment_method, transaction.reference_number,
             transaction.status, JSON.stringify(transaction.metadata || {}),
             transaction.created_at]
        );
        
        // Process with payment gateway
        await this.processPayment(result.rows[0]);
        
        return result.rows[0];
    }

    // Credit Scoring
    async performCreditCheck(userId, businessId) {
        // Integrate with credit bureaus
        const creditScore = await this.getCreditScore(userId, businessId);
        
        // Store result
        const result = await this.db.query(
            `INSERT INTO credit.credit_scores 
             (id, user_id, business_id, score, bureau, 
              report_data, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())
             RETURNING *`,
            [uuidv4(), userId, businessId, creditScore.score,
             creditScore.bureau, JSON.stringify(creditScore.report)]
        );
        
        return result.rows[0];
    }

    // Analytics
    async getAnalytics(dateRange) {
        const analytics = {
            total_applications: 0,
            approved_applications: 0,
            total_disbursed: 0,
            average_loan_amount: 0,
            average_interest_rate: 0,
            provider_performance: []
        };
        
        // Get application stats
        const appStats = await this.db.query(
            `SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved,
                AVG(amount_requested) as avg_amount
             FROM credit.applications
             WHERE created_at BETWEEN $1 AND $2`,
            [dateRange.start, dateRange.end]
        );
        
        analytics.total_applications = appStats.rows[0].total;
        analytics.approved_applications = appStats.rows[0].approved;
        analytics.average_loan_amount = appStats.rows[0].avg_amount;
        
        // Get disbursement stats
        const disbursements = await this.db.query(
            `SELECT 
                SUM(amount) as total_disbursed,
                AVG(b.interest_rate) as avg_interest_rate
             FROM credit.transactions t
             JOIN credit.bids b ON t.bid_id = b.id
             WHERE t.transaction_type = 'disbursement'
             AND t.status = 'completed'
             AND t.created_at BETWEEN $1 AND $2`,
            [dateRange.start, dateRange.end]
        );
        
        analytics.total_disbursed = disbursements.rows[0].total_disbursed || 0;
        analytics.average_interest_rate = disbursements.rows[0].avg_interest_rate || 0;
        
        return analytics;
    }

    // Provider Performance
    async getProviderPerformance(providerId) {
        const performance = await this.db.query(
            `SELECT 
                p.company_name,
                COUNT(DISTINCT b.id) as total_bids,
                COUNT(DISTINCT CASE WHEN b.status = 'accepted' THEN b.id END) as accepted_bids,
                AVG(b.interest_rate) as avg_interest_rate,
                AVG(b.offered_amount) as avg_loan_amount,
                SUM(CASE WHEN t.transaction_type = 'disbursement' THEN t.amount ELSE 0 END) as total_disbursed
             FROM credit.providers p
             LEFT JOIN credit.bids b ON p.id = b.provider_id
             LEFT JOIN credit.transactions t ON b.id = t.bid_id
             WHERE p.id = $1
             GROUP BY p.id, p.company_name`,
            [providerId]
        );
        
        return performance.rows[0];
    }

    // Helper Methods
    async notifyProviders(application) {
        const providers = await this.getProviders({ active_only: true });
        
        for (const provider of providers) {
            if (provider.webhook_url) {
                // Send webhook notification
                await this.sendWebhook(provider.webhook_url, {
                    event: 'new_application',
                    application: application
                });
            }
        }
    }

    async notifyApplicant(applicationId, bid) {
        // Implementation for notifying applicant about new bid
        // Could integrate with notification service
    }

    async processPayment(transaction) {
        // Integration with payment gateway
        // Implementation depends on chosen payment provider
    }

    async getCreditScore(userId, businessId) {
        // Mock implementation - replace with actual credit bureau integration
        return {
            score: Math.floor(Math.random() * 350) + 500,
            bureau: 'mock_bureau',
            report: { status: 'good_standing' }
        };
    }

    // Health check
    async healthCheck() {
        try {
            const result = await this.db.query('SELECT 1');
            return {
                status: 'healthy',
                service: 'credit-as-a-service',
                database: 'connected',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                service: 'credit-as-a-service',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = CreditAsAServiceClient;
EOF

    # Create credit-as-a-service.json
    cat > /root/onasis-gateway/services/credit-as-a-service/credit-as-a-service.json << 'EOF'
{
    "name": "Credit-as-a-Service",
    "code": "CAAS",
    "description": "B2B credit facility management platform enabling competitive credit provider bidding and SME loan processing",
    "version": "1.0.0",
    "status": "active",
    "endpoints": {
        "submit_application": {
            "method": "POST",
            "path": "/api/credit/applications",
            "description": "Submit a new credit application"
        },
        "get_applications": {
            "method": "GET",
            "path": "/api/credit/applications",
            "description": "Get credit applications with filters"
        },
        "get_application": {
            "method": "GET",
            "path": "/api/credit/applications/:id",
            "description": "Get specific application details with bids"
        },
        "update_application_status": {
            "method": "PUT",
            "path": "/api/credit/applications/:id/status",
            "description": "Update application status"
        },
        "register_provider": {
            "method": "POST",
            "path": "/api/credit/providers",
            "description": "Register a new credit provider"
        },
        "get_providers": {
            "method": "GET",
            "path": "/api/credit/providers",
            "description": "Get list of credit providers"
        },
        "submit_bid": {
            "method": "POST",
            "path": "/api/credit/bids",
            "description": "Submit a provider bid for an application"
        },
        "process_transaction": {
            "method": "POST",
            "path": "/api/credit/transactions",
            "description": "Process a credit transaction"
        },
        "credit_check": {
            "method": "POST",
            "path": "/api/credit/credit-check",
            "description": "Perform credit score check"
        },
        "analytics": {
            "method": "GET",
            "path": "/api/credit/analytics",
            "description": "Get credit analytics"
        },
        "provider_performance": {
            "method": "GET",
            "path": "/api/credit/providers/:id/performance",
            "description": "Get provider performance metrics"
        }
    },
    "features": [
        "Multi-provider competitive bidding",
        "Automated credit scoring integration",
        "Real-time application processing",
        "Provider webhook notifications",
        "Transaction tracking and reconciliation",
        "Analytics and reporting",
        "Flexible loan terms configuration",
        "Multi-currency support",
        "API-first integration approach"
    ],
    "dependencies": {
        "database": "PostgreSQL",
        "schema": "credit"
    },
    "webhooks": {
        "application_submitted": "Triggered when new application is submitted",
        "bid_received": "Triggered when provider submits a bid",
        "application_approved": "Triggered when application is approved",
        "disbursement_completed": "Triggered when loan is disbursed",
        "payment_received": "Triggered when repayment is received"
    }
}
EOF

    # Create webhooks.js
    cat > /root/onasis-gateway/services/credit-as-a-service/webhooks.js << 'EOF'
const express = require('express');
const router = express.Router();
const CreditAsAServiceClient = require('./client');

const caasClient = new CreditAsAServiceClient();

// Provider webhook endpoint
router.post('/webhooks/credit/provider/:providerId', async (req, res) => {
    try {
        const { providerId } = req.params;
        const { event, data } = req.body;
        
        // Verify provider exists
        const providers = await caasClient.getProviders({ provider_id: providerId });
        if (providers.length === 0) {
            return res.status(404).json({ error: 'Provider not found' });
        }
        
        // Handle different webhook events
        switch (event) {
            case 'bid_accepted':
                // Update bid status
                await caasClient.db.query(
                    'UPDATE credit.bids SET status = $1 WHERE id = $2',
                    ['accepted', data.bid_id]
                );
                break;
                
            case 'disbursement_ready':
                // Create disbursement transaction
                await caasClient.processTransaction({
                    bid_id: data.bid_id,
                    application_id: data.application_id,
                    provider_id: providerId,
                    transaction_type: 'disbursement',
                    amount: data.amount,
                    payment_method: data.payment_method,
                    reference_number: data.reference
                });
                break;
                
            case 'payment_received':
                // Record repayment
                await caasClient.processTransaction({
                    bid_id: data.bid_id,
                    application_id: data.application_id,
                    provider_id: providerId,
                    transaction_type: 'repayment',
                    amount: data.amount,
                    payment_method: data.payment_method,
                    reference_number: data.reference
                });
                break;
                
            default:
                console.log(`Unhandled webhook event: ${event}`);
        }
        
        res.json({ status: 'received' });
    } catch (error) {
        console.error('Webhook processing error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Application status webhook (for external systems)
router.post('/webhooks/credit/application/:applicationId', async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { status, notes } = req.body;
        
        // Update application status
        await caasClient.updateApplicationStatus(applicationId, status, notes);
        
        res.json({ status: 'updated' });
    } catch (error) {
        console.error('Application webhook error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
EOF

    # Create test.js
    cat > /root/onasis-gateway/services/credit-as-a-service/test.js << 'EOF'
const CreditAsAServiceClient = require('./client');

async function testCreditService() {
    const client = new CreditAsAServiceClient();
    
    console.log('Testing Credit-as-a-Service...');
    
    try {
        // Test health check
        const health = await client.healthCheck();
        console.log('Health check:', health);
        
        // Test application submission
        const application = await client.submitApplication({
            user_id: 'test-user-123',
            business_id: 'test-business-456',
            amount_requested: 1000000,
            currency: 'NGN',
            purpose: 'Working capital',
            loan_term_months: 12,
            metadata: {
                business_type: 'retail',
                annual_revenue: 50000000
            }
        });
        console.log('Application submitted:', application);
        
        // Test provider registration
        const provider = await client.registerProvider({
            provider_code: 'TEST_PROVIDER',
            company_name: 'Test Credit Provider Ltd',
            registration_number: 'RC123456',
            contact_email: 'test@provider.com',
            contact_phone: '+2341234567890',
            address: {
                street: '123 Test Street',
                city: 'Lagos',
                state: 'Lagos',
                country: 'Nigeria'
            },
            minimum_loan_amount: 100000,
            maximum_loan_amount: 10000000,
            interest_rate_range: {
                min: 15,
                max: 25
            },
            processing_fee_percentage: 2.5,
            webhook_url: 'https://test-provider.com/webhooks'
        });
        console.log('Provider registered:', provider);
        
        console.log('All tests passed!');
    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Run tests if called directly
if (require.main === module) {
    testCreditService();
}

module.exports = testCreditService;
EOF
}

# Function to deploy MCP tools
deploy_mcp_tools() {
    echo "Deploying MCP tools..."
    
    cat > /root/onasis-gateway/mcp-server/tools/credit/index.js << 'EOF'
const CreditAsAServiceClient = require('../../../services/credit-as-a-service/client');

const creditClient = new CreditAsAServiceClient();

module.exports = {
    // Application Management Tools
    credit_submit_application: {
        description: 'Submit a new credit application for SME financing',
        parameters: {
            user_id: { type: 'string', required: true },
            business_id: { type: 'string', required: true },
            amount_requested: { type: 'number', required: true },
            currency: { type: 'string', default: 'NGN' },
            purpose: { type: 'string', required: true },
            loan_term_months: { type: 'number', required: true },
            metadata: { type: 'object' }
        },
        handler: async (params) => {
            return await creditClient.submitApplication(params);
        }
    },
    
    credit_get_applications: {
        description: 'Get credit applications with optional filters',
        parameters: {
            user_id: { type: 'string' },
            business_id: { type: 'string' },
            status: { type: 'string' }
        },
        handler: async (params) => {
            return await creditClient.getApplications(params);
        }
    },
    
    credit_get_application: {
        description: 'Get specific credit application details including bids',
        parameters: {
            application_id: { type: 'string', required: true }
        },
        handler: async (params) => {
            return await creditClient.getApplication(params.application_id);
        }
    },
    
    credit_update_application_status: {
        description: 'Update the status of a credit application',
        parameters: {
            application_id: { type: 'string', required: true },
            status: { type: 'string', required: true },
            notes: { type: 'string' }
        },
        handler: async (params) => {
            return await creditClient.updateApplicationStatus(
                params.application_id,
                params.status,
                params.notes
            );
        }
    },
    
    // Provider Management Tools
    credit_register_provider: {
        description: 'Register a new credit provider in the platform',
        parameters: {
            provider_code: { type: 'string', required: true },
            company_name: { type: 'string', required: true },
            registration_number: { type: 'string', required: true },
            contact_email: { type: 'string', required: true },
            contact_phone: { type: 'string', required: true },
            address: { type: 'object', required: true },
            minimum_loan_amount: { type: 'number', required: true },
            maximum_loan_amount: { type: 'number', required: true },
            interest_rate_range: { type: 'object', required: true },
            processing_fee_percentage: { type: 'number', required: true },
            webhook_url: { type: 'string' },
            api_endpoint: { type: 'string' }
        },
        handler: async (params) => {
            return await creditClient.registerProvider(params);
        }
    },
    
    credit_get_providers: {
        description: 'Get list of registered credit providers',
        parameters: {
            status: { type: 'string' },
            active_only: { type: 'boolean' }
        },
        handler: async (params) => {
            return await creditClient.getProviders(params);
        }
    },
    
    credit_submit_provider_bid: {
        description: 'Submit a credit provider bid for an application',
        parameters: {
            application_id: { type: 'string', required: true },
            provider_id: { type: 'string', required: true },
            offered_amount: { type: 'number', required: true },
            interest_rate: { type: 'number', required: true },
            loan_term_months: { type: 'number', required: true },
            processing_fee: { type: 'number', required: true },
            special_conditions: { type: 'object' },
            valid_until: { type: 'string', required: true }
        },
        handler: async (params) => {
            // Calculate repayment details
            const principal = params.offered_amount;
            const monthlyRate = params.interest_rate / 12 / 100;
            const months = params.loan_term_months;
            
            const monthlyPayment = principal * 
                (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                (Math.pow(1 + monthlyRate, months) - 1);
            
            const totalRepayment = monthlyPayment * months;
            
            return await creditClient.submitProviderBid({
                ...params,
                total_repayment: totalRepayment,
                monthly_repayment: monthlyPayment
            });
        }
    },
    
    // Transaction Processing
    credit_process_transaction: {
        description: 'Process a credit transaction (disbursement or repayment)',
        parameters: {
            bid_id: { type: 'string', required: true },
            application_id: { type: 'string', required: true },
            provider_id: { type: 'string', required: true },
            transaction_type: { type: 'string', required: true },
            amount: { type: 'number', required: true },
            currency: { type: 'string', default: 'NGN' },
            payment_method: { type: 'string', required: true },
            reference_number: { type: 'string', required: true },
            metadata: { type: 'object' }
        },
        handler: async (params) => {
            return await creditClient.processTransaction(params);
        }
    },
    
    // Credit Scoring & Analytics
    credit_perform_credit_check: {
        description: 'Perform credit score check for a user or business',
        parameters: {
            user_id: { type: 'string' },
            business_id: { type: 'string' }
        },
        handler: async (params) => {
            return await creditClient.performCreditCheck(
                params.user_id,
                params.business_id
            );
        }
    },
    
    credit_get_analytics: {
        description: 'Get credit platform analytics for a date range',
        parameters: {
            start_date: { type: 'string', required: true },
            end_date: { type: 'string', required: true }
        },
        handler: async (params) => {
            return await creditClient.getAnalytics({
                start: params.start_date,
                end: params.end_date
            });
        }
    },
    
    credit_provider_performance: {
        description: 'Get performance metrics for a specific credit provider',
        parameters: {
            provider_id: { type: 'string', required: true }
        },
        handler: async (params) => {
            return await creditClient.getProviderPerformance(params.provider_id);
        }
    },
    
    // Health Check
    credit_health_check: {
        description: 'Check health status of the credit service',
        parameters: {},
        handler: async () => {
            return await creditClient.healthCheck();
        }
    }
};
EOF
}

# Function to deploy TypeScript definitions
deploy_types() {
    echo "Deploying TypeScript definitions..."
    
    cat > /root/onasis-gateway/mcp-server/types/credit.d.ts << 'EOF'
// Credit-as-a-Service Type Definitions

export interface CreditApplication {
    id: string;
    user_id: string;
    business_id: string;
    amount_requested: number;
    currency: string;
    purpose: string;
    loan_term_months: number;
    status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'disbursed' | 'completed';
    metadata?: Record<string, any>;
    created_at: string;
    updated_at?: string;
}

export interface CreditProvider {
    id: string;
    provider_code: string;
    company_name: string;
    registration_number: string;
    contact_email: string;
    contact_phone: string;
    address: Address;
    minimum_loan_amount: number;
    maximum_loan_amount: number;
    supported_currencies: string[];
    interest_rate_range: {
        min: number;
        max: number;
    };
    processing_fee_percentage: number;
    api_endpoint?: string;
    webhook_url?: string;
    status: 'pending_verification' | 'active' | 'suspended' | 'inactive';
    metadata?: Record<string, any>;
    created_at: string;
    updated_at?: string;
}

export interface CreditBid {
    id: string;
    application_id: string;
    provider_id: string;
    offered_amount: number;
    interest_rate: number;
    loan_term_months: number;
    processing_fee: number;
    total_repayment: number;
    monthly_repayment: number;
    special_conditions?: Record<string, any>;
    valid_until: string;
    status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'withdrawn';
    created_at: string;
    updated_at?: string;
}

export interface CreditTransaction {
    id: string;
    bid_id: string;
    application_id: string;
    provider_id: string;
    transaction_type: 'disbursement' | 'repayment' | 'fee' | 'penalty' | 'refund';
    amount: number;
    currency: string;
    payment_method: string;
    reference_number: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'reversed';
    metadata?: Record<string, any>;
    created_at: string;
    processed_at?: string;
}

export interface Address {
    street: string;
    city: string;
    state: string;
    postal_code?: string;
    country: string;
}

export interface CreditScore {
    id: string;
    user_id?: string;
    business_id?: string;
    score: number;
    bureau: string;
    report_data: Record<string, any>;
    created_at: string;
}

export interface CreditAnalytics {
    total_applications: number;
    approved_applications: number;
    total_disbursed: number;
    average_loan_amount: number;
    average_interest_rate: number;
    provider_performance: ProviderPerformance[];
}

export interface ProviderPerformance {
    provider_id: string;
    company_name: string;
    total_bids: number;
    accepted_bids: number;
    avg_interest_rate: number;
    avg_loan_amount: number;
    total_disbursed: number;
}

// MCP Tool Definitions
export interface CreditTools {
    credit_submit_application: (params: {
        user_id: string;
        business_id: string;
        amount_requested: number;
        currency?: string;
        purpose: string;
        loan_term_months: number;
        metadata?: Record<string, any>;
    }) => Promise<CreditApplication>;
    
    credit_get_applications: (params?: {
        user_id?: string;
        business_id?: string;
        status?: string;
    }) => Promise<CreditApplication[]>;
    
    credit_get_application: (params: {
        application_id: string;
    }) => Promise<CreditApplication & { bids: CreditBid[] }>;
    
    credit_update_application_status: (params: {
        application_id: string;
        status: string;
        notes?: string;
    }) => Promise<CreditApplication>;
    
    credit_register_provider: (params: Omit<CreditProvider, 'id' | 'created_at' | 'updated_at' | 'status'>) => Promise<CreditProvider>;
    
    credit_get_providers: (params?: {
        status?: string;
        active_only?: boolean;
    }) => Promise<CreditProvider[]>;
    
    credit_submit_provider_bid: (params: {
        application_id: string;
        provider_id: string;
        offered_amount: number;
        interest_rate: number;
        loan_term_months: number;
        processing_fee: number;
        special_conditions?: Record<string, any>;
        valid_until: string;
    }) => Promise<CreditBid>;
    
    credit_process_transaction: (params: Omit<CreditTransaction, 'id' | 'created_at' | 'processed_at' | 'status'> & {
        status?: string;
    }) => Promise<CreditTransaction>;
    
    credit_perform_credit_check: (params: {
        user_id?: string;
        business_id?: string;
    }) => Promise<CreditScore>;
    
    credit_get_analytics: (params: {
        start_date: string;
        end_date: string;
    }) => Promise<CreditAnalytics>;
    
    credit_provider_performance: (params: {
        provider_id: string;
    }) => Promise<ProviderPerformance>;
    
    credit_health_check: () => Promise<{
        status: string;
        service: string;
        database: string;
        timestamp: string;
    }>;
}
EOF
}

# Function to deploy database migration
deploy_database() {
    echo "Deploying database migration..."
    
    cat > /root/onasis-gateway/database/migrations/001_add_credit_schema.sql << 'EOF'
-- Credit-as-a-Service Schema Migration
-- This migration adds the credit schema to the Onasis Gateway database

-- Create credit schema
CREATE SCHEMA IF NOT EXISTS credit;

-- Set search path
SET search_path TO credit, onasis, public;

-- Credit providers table
CREATE TABLE credit.providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_code VARCHAR(50) UNIQUE NOT NULL,
    company_name VARCHAR(200) NOT NULL,
    registration_number VARCHAR(100),
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50),
    address JSONB NOT NULL,
    minimum_loan_amount DECIMAL(15, 2) NOT NULL,
    maximum_loan_amount DECIMAL(15, 2) NOT NULL,
    supported_currencies TEXT[] DEFAULT ARRAY['NGN'],
    interest_rate_range JSONB NOT NULL, -- {min: 15, max: 25}
    processing_fee_percentage DECIMAL(5, 2) NOT NULL,
    api_endpoint VARCHAR(500),
    webhook_url VARCHAR(500),
    status VARCHAR(50) NOT NULL DEFAULT 'pending_verification',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT check_loan_amounts CHECK (maximum_loan_amount > minimum_loan_amount),
    CONSTRAINT check_status CHECK (status IN ('pending_verification', 'active', 'suspended', 'inactive'))
);

-- Credit applications table
CREATE TABLE credit.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    business_id UUID,
    amount_requested DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'NGN',
    purpose TEXT NOT NULL,
    loan_term_months INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT check_amount CHECK (amount_requested > 0),
    CONSTRAINT check_term CHECK (loan_term_months > 0),
    CONSTRAINT check_app_status CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'disbursed', 'completed'))
);

-- Provider bids table
CREATE TABLE credit.bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES credit.applications(id),
    provider_id UUID NOT NULL REFERENCES credit.providers(id),
    offered_amount DECIMAL(15, 2) NOT NULL,
    interest_rate DECIMAL(5, 2) NOT NULL, -- Annual percentage rate
    loan_term_months INTEGER NOT NULL,
    processing_fee DECIMAL(15, 2) NOT NULL,
    total_repayment DECIMAL(15, 2) NOT NULL,
    monthly_repayment DECIMAL(15, 2) NOT NULL,
    special_conditions JSONB DEFAULT '{}',
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT check_bid_amount CHECK (offered_amount > 0),
    CONSTRAINT check_interest CHECK (interest_rate >= 0),
    CONSTRAINT check_bid_status CHECK (status IN ('pending', 'accepted', 'rejected', 'expired', 'withdrawn'))
);

-- Credit transactions table
CREATE TABLE credit.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bid_id UUID REFERENCES credit.bids(id),
    application_id UUID NOT NULL REFERENCES credit.applications(id),
    provider_id UUID NOT NULL REFERENCES credit.providers(id),
    transaction_type VARCHAR(50) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'NGN',
    payment_method VARCHAR(100),
    reference_number VARCHAR(200) UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT check_trans_amount CHECK (amount > 0),
    CONSTRAINT check_trans_type CHECK (transaction_type IN ('disbursement', 'repayment', 'fee', 'penalty', 'refund')),
    CONSTRAINT check_trans_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'reversed'))
);

-- Credit scores table
CREATE TABLE credit.credit_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    business_id UUID,
    score INTEGER NOT NULL,
    bureau VARCHAR(100) NOT NULL,
    report_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT check_score CHECK (score >= 0 AND score <= 1000),
    CONSTRAINT check_entity CHECK (user_id IS NOT NULL OR business_id IS NOT NULL)
);

-- Status history table for audit trail
CREATE TABLE credit.status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES credit.applications(id),
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_providers_status ON credit.providers(status);
CREATE INDEX idx_providers_code ON credit.providers(provider_code);
CREATE INDEX idx_applications_user ON credit.applications(user_id);
CREATE INDEX idx_applications_business ON credit.applications(business_id);
CREATE INDEX idx_applications_status ON credit.applications(status);
CREATE INDEX idx_applications_created ON credit.applications(created_at DESC);
CREATE INDEX idx_bids_application ON credit.bids(application_id);
CREATE INDEX idx_bids_provider ON credit.bids(provider_id);
CREATE INDEX idx_bids_status ON credit.bids(status);
CREATE INDEX idx_transactions_application ON credit.transactions(application_id);
CREATE INDEX idx_transactions_provider ON credit.transactions(provider_id);
CREATE INDEX idx_transactions_reference ON credit.transactions(reference_number);
CREATE INDEX idx_transactions_status ON credit.transactions(status);
CREATE INDEX idx_credit_scores_user ON credit.credit_scores(user_id);
CREATE INDEX idx_credit_scores_business ON credit.credit_scores(business_id);

-- Create update timestamp trigger
CREATE OR REPLACE FUNCTION credit.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_providers_updated_at BEFORE UPDATE ON credit.providers
    FOR EACH ROW EXECUTE FUNCTION credit.update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON credit.applications
    FOR EACH ROW EXECUTE FUNCTION credit.update_updated_at_column();

CREATE TRIGGER update_bids_updated_at BEFORE UPDATE ON credit.bids
    FOR EACH ROW EXECUTE FUNCTION credit.update_updated_at_column();

-- Add row level security policies
ALTER TABLE credit.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit.credit_scores ENABLE ROW LEVEL SECURITY;

-- Insert adapter record in Onasis adapters table
INSERT INTO onasis.adapters (
    adapter_code,
    adapter_name,
    adapter_type,
    description,
    configuration,
    status,
    created_at
) VALUES (
    'CAAS',
    'Credit-as-a-Service',
    'financial_service',
    'B2B credit facility management with multi-provider bidding system',
    '{
        "version": "1.0.0",
        "schema": "credit",
        "features": [
            "multi_provider_bidding",
            "credit_scoring",
            "transaction_processing",
            "webhook_notifications"
        ],
        "endpoints": {
            "base": "/api/credit",
            "webhooks": "/webhooks/credit"
        }
    }'::jsonb,
    'active',
    NOW()
) ON CONFLICT (adapter_code) DO UPDATE SET
    adapter_name = EXCLUDED.adapter_name,
    description = EXCLUDED.description,
    configuration = EXCLUDED.configuration,
    status = EXCLUDED.status,
    updated_at = NOW();

-- Grant permissions
GRANT USAGE ON SCHEMA credit TO onasis_app;
GRANT ALL ON ALL TABLES IN SCHEMA credit TO onasis_app;
GRANT ALL ON ALL SEQUENCES IN SCHEMA credit TO onasis_app;

-- Add comments for documentation
COMMENT ON SCHEMA credit IS 'Credit-as-a-Service platform schema for B2B lending';
COMMENT ON TABLE credit.providers IS 'Registered credit providers offering loans';
COMMENT ON TABLE credit.applications IS 'Credit applications submitted by users/businesses';
COMMENT ON TABLE credit.bids IS 'Provider bids on credit applications';
COMMENT ON TABLE credit.transactions IS 'Financial transactions for loans';
COMMENT ON TABLE credit.credit_scores IS 'Credit bureau scores and reports';
EOF
}

# Function to update MCP server registration
update_mcp_registration() {
    echo "Updating MCP server tool registration..."
    
    # Check if main MCP tools file exists
    if [ -f "/root/onasis-gateway/mcp-server/tools/index.js" ]; then
        # Backup existing file
        cp /root/onasis-gateway/mcp-server/tools/index.js /root/onasis-gateway/mcp-server/tools/index.js.bak
        
        # Add credit tools registration
        cat >> /root/onasis-gateway/mcp-server/tools/index.js << 'EOF'

// Credit-as-a-Service Tools
const creditTools = require('./credit');
Object.keys(creditTools).forEach(toolName => {
    module.exports[toolName] = creditTools[toolName];
});
EOF
    else
        echo "Warning: MCP tools index.js not found. You'll need to manually register credit tools."
    fi
}

# Function to apply database migration
apply_migration() {
    echo "Applying database migration..."
    
    # Try to find psql and database credentials
    if command -v psql &> /dev/null; then
        echo "Found psql. Attempting to apply migration..."
        
        # Try common database names and users
        for db in onasis_gateway onasis gateway; do
            for user in postgres onasis_app onasis; do
                if psql -U $user -d $db -c "SELECT 1;" &>/dev/null 2>&1; then
                    echo "Found working connection: user=$user, database=$db"
                    psql -U $user -d $db -f /root/onasis-gateway/database/migrations/001_add_credit_schema.sql
                    echo "Migration applied successfully"
                    return 0
                fi
            done
        done
        
        echo "Could not connect to database. Manual migration required."
        echo "Run: psql -U [username] -d [database] -f /root/onasis-gateway/database/migrations/001_add_credit_schema.sql"
    else
        echo "psql not found. Manual migration required."
    fi
}

# Function to restart services
restart_services() {
    echo "Attempting to restart services..."
    
    if command -v pm2 &> /dev/null; then
        echo "Restarting PM2 services..."
        pm2 restart all
        pm2 list
    else
        echo "PM2 not found. Manual service restart required."
    fi
    
    if systemctl is-active --quiet nginx; then
        echo "Reloading nginx..."
        nginx -t && systemctl reload nginx
    fi
}

# Main deployment
main() {
    echo "Starting CaaS deployment..."
    echo ""
    
    # Create directories
    create_directories
    
    # Deploy files
    deploy_caas_service
    deploy_mcp_tools
    deploy_types
    deploy_database
    
    # Update MCP registration
    update_mcp_registration
    
    # Apply migration
    apply_migration
    
    # Restart services
    restart_services
    
    echo ""
    echo "=== Deployment Complete ==="
    echo ""
    echo "Next steps:"
    echo "1. Verify database migration was applied"
    echo "2. Check service status with: pm2 list"
    echo "3. Test endpoints:"
    echo "   curl http://localhost:3000/api/credit/health"
    echo "4. Check MCP tools are registered"
    echo ""
    echo "Files deployed to:"
    echo "- /root/onasis-gateway/services/credit-as-a-service/"
    echo "- /root/onasis-gateway/mcp-server/tools/credit/"
    echo "- /root/onasis-gateway/mcp-server/types/credit.d.ts"
    echo "- /root/onasis-gateway/database/migrations/001_add_credit_schema.sql"
}

# Run deployment
main