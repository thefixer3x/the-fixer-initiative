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
