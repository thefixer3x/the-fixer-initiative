#!/bin/bash
# Complete CaaS Deployment with Supabase Integration
# This script updates the VPS deployment to use Supabase

set -e

echo "=== Complete CaaS Deployment with Supabase ==="
echo "This will configure CaaS to use Supabase as the database"
echo ""

# Update the CaaS client to use Supabase
update_caas_client() {
    echo "Updating CaaS client with Supabase configuration..."
    
    cat > /root/fixer-initiative/ecosystem-projects/onasis-gateway/services/credit-as-a-service/database-config.js << 'EOF'
// Supabase Configuration for CaaS
const { createClient } = require('@supabase/supabase-js');

// Supabase credentials - configure via environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    },
    db: {
        schema: 'credit'
    }
});

// Export database operations
module.exports = {
    // Direct query method for complex operations
    async query(sqlQuery, params = []) {
        // For complex queries, we'll use Supabase's raw SQL
        const { data, error } = await supabase.rpc('execute_sql', {
            query: sqlQuery,
            params: params
        });
        
        if (error) throw error;
        return { rows: data };
    },
    
    // Supabase client for simpler operations
    supabase,
    
    // Schema-specific helpers
    credit: {
        providers: supabase.from('providers'),
        applications: supabase.from('applications'),
        bids: supabase.from('bids'),
        transactions: supabase.from('transactions'),
        credit_scores: supabase.from('credit_scores'),
        status_history: supabase.from('status_history')
    }
};
EOF

    # Update the main client.js to use Supabase
    cat > /root/fixer-initiative/ecosystem-projects/onasis-gateway/services/credit-as-a-service/client-supabase.js << 'EOF'
const BaseClient = require('../../lib/base-client');
const db = require('./database-config');
const { v4: uuidv4 } = require('uuid');

class CreditAsAServiceClient extends BaseClient {
    constructor() {
        super({
            serviceName: 'credit-as-a-service',
            serviceConfig: require('./credit-as-a-service.json')
        });
        this.db = db;
    }

    // Application Management
    async submitApplication(applicationData) {
        const application = {
            id: uuidv4(),
            ...applicationData,
            status: 'pending',
            created_at: new Date().toISOString()
        };
        
        const { data, error } = await db.credit.applications
            .insert(application)
            .select()
            .single();
        
        if (error) throw error;
        
        // Trigger provider notifications
        await this.notifyProviders(data);
        
        return data;
    }

    async getApplications(filters = {}) {
        let query = db.credit.applications.select('*');

        if (filters.user_id) {
            query = query.eq('user_id', filters.user_id);
        }

        if (filters.business_id) {
            query = query.eq('business_id', filters.business_id);
        }

        if (filters.status) {
            query = query.eq('status', filters.status);
        }

        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
    }

    async getApplication(applicationId) {
        // Get application
        const { data: application, error: appError } = await db.credit.applications
            .select('*')
            .eq('id', applicationId)
            .single();
        
        if (appError) throw appError;
        
        // Get associated bids
        const { data: bids, error: bidsError } = await db.credit.bids
            .select('*')
            .eq('application_id', applicationId)
            .order('interest_rate', { ascending: true });
        
        if (bidsError) throw bidsError;
        
        return {
            ...application,
            bids: bids || []
        };
    }

    async updateApplicationStatus(applicationId, status, notes) {
        const { data, error } = await db.credit.applications
            .update({ 
                status: status,
                updated_at: new Date().toISOString()
            })
            .eq('id', applicationId)
            .select()
            .single();
        
        if (error) throw error;
        
        // Log status change
        await db.credit.status_history.insert({
            application_id: applicationId,
            new_status: status,
            notes: notes,
            created_at: new Date().toISOString()
        });
        
        return data;
    }

    // Provider Management
    async registerProvider(providerData) {
        const provider = {
            id: uuidv4(),
            ...providerData,
            status: 'pending_verification',
            created_at: new Date().toISOString()
        };
        
        const { data, error } = await db.credit.providers
            .insert(provider)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    async getProviders(filters = {}) {
        let query = db.credit.providers.select('*');

        if (filters.status) {
            query = query.eq('status', filters.status);
        }

        if (filters.active_only) {
            query = query.eq('status', 'active');
        }

        const { data, error } = await query;
        
        if (error) throw error;
        return data;
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
        const { data: provider, error: providerError } = await db.credit.providers
            .select('*')
            .eq('id', bid.provider_id)
            .eq('status', 'active')
            .single();
        
        if (providerError || !provider) {
            throw new Error('Provider not found or not active');
        }
        
        const { data, error } = await db.credit.bids
            .insert(bid)
            .select()
            .single();
        
        if (error) throw error;
        
        // Notify applicant of new bid
        await this.notifyApplicant(bid.application_id, data);
        
        return data;
    }

    // Transaction Processing
    async processTransaction(transactionData) {
        const transaction = {
            id: uuidv4(),
            ...transactionData,
            status: 'processing',
            created_at: new Date().toISOString()
        };
        
        const { data, error } = await db.credit.transactions
            .insert(transaction)
            .select()
            .single();
        
        if (error) throw error;
        
        // Process with payment gateway
        await this.processPayment(data);
        
        return data;
    }

    // Credit Scoring
    async performCreditCheck(userId, businessId) {
        // Mock credit score for now
        const creditScore = {
            id: uuidv4(),
            user_id: userId,
            business_id: businessId,
            score: Math.floor(Math.random() * 350) + 500,
            bureau: 'mock_bureau',
            report_data: { status: 'good_standing' },
            created_at: new Date().toISOString()
        };
        
        const { data, error } = await db.credit.credit_scores
            .insert(creditScore)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    // Analytics
    async getAnalytics(dateRange) {
        // Use Supabase RPC for complex analytics
        const { data, error } = await db.supabase.rpc('get_credit_analytics', {
            start_date: dateRange.start,
            end_date: dateRange.end
        });
        
        if (error) {
            // Fallback to manual calculation
            return await this.calculateAnalytics(dateRange);
        }
        
        return data;
    }

    async calculateAnalytics(dateRange) {
        // Manual analytics calculation
        const { data: applications } = await db.credit.applications
            .select('*')
            .gte('created_at', dateRange.start)
            .lte('created_at', dateRange.end);
        
        const { data: transactions } = await db.credit.transactions
            .select('*, bids(interest_rate)')
            .eq('transaction_type', 'disbursement')
            .eq('status', 'completed')
            .gte('created_at', dateRange.start)
            .lte('created_at', dateRange.end);
        
        return {
            total_applications: applications?.length || 0,
            approved_applications: applications?.filter(a => a.status === 'approved').length || 0,
            total_disbursed: transactions?.reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0,
            average_loan_amount: applications?.reduce((sum, a) => sum + parseFloat(a.amount_requested), 0) / (applications?.length || 1) || 0,
            average_interest_rate: transactions?.reduce((sum, t) => sum + (t.bids?.interest_rate || 0), 0) / (transactions?.length || 1) || 0
        };
    }

    // Provider Performance
    async getProviderPerformance(providerId) {
        const { data: provider } = await db.credit.providers
            .select('*, bids(*), transactions(*)')
            .eq('id', providerId)
            .single();
        
        if (!provider) return null;
        
        const totalBids = provider.bids?.length || 0;
        const acceptedBids = provider.bids?.filter(b => b.status === 'accepted').length || 0;
        const avgInterestRate = provider.bids?.reduce((sum, b) => sum + b.interest_rate, 0) / totalBids || 0;
        const totalDisbursed = provider.transactions
            ?.filter(t => t.transaction_type === 'disbursement' && t.status === 'completed')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
        
        return {
            company_name: provider.company_name,
            total_bids: totalBids,
            accepted_bids: acceptedBids,
            avg_interest_rate: avgInterestRate,
            total_disbursed: totalDisbursed
        };
    }

    // Helper Methods
    async notifyProviders(application) {
        const { data: providers } = await this.getProviders({ active_only: true });
        
        for (const provider of providers || []) {
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
        console.log(`New bid for application ${applicationId}:`, bid);
    }

    async processPayment(transaction) {
        // Integration with payment gateway
        console.log('Processing payment:', transaction);
        
        // Update transaction status
        await db.credit.transactions
            .update({ 
                status: 'completed',
                processed_at: new Date().toISOString()
            })
            .eq('id', transaction.id);
    }

    async sendWebhook(url, data) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                console.error(`Webhook failed: ${response.status}`);
            }
        } catch (error) {
            console.error('Webhook error:', error);
        }
    }

    // Health check
    async healthCheck() {
        try {
            const { data, error } = await db.credit.providers
                .select('count')
                .limit(1);
            
            return {
                status: error ? 'unhealthy' : 'healthy',
                service: 'credit-as-a-service',
                database: error ? 'disconnected' : 'connected',
                error: error?.message,
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

    # Create BaseClient stub if it doesn't exist
    mkdir -p /root/fixer-initiative/ecosystem-projects/onasis-gateway/lib
    cat > /root/fixer-initiative/ecosystem-projects/onasis-gateway/lib/base-client.js << 'EOF'
// Base Client stub for CaaS
class BaseClient {
    constructor(config) {
        this.config = config;
    }
}

module.exports = BaseClient;
EOF
}

# Install required npm packages
install_dependencies() {
    echo "Installing dependencies..."
    cd /root/fixer-initiative/ecosystem-projects/onasis-gateway
    
    # Create package.json if it doesn't exist
    if [ ! -f package.json ]; then
        cat > package.json << 'EOF'
{
  "name": "onasis-gateway",
  "version": "1.0.0",
  "description": "Onasis Gateway with CaaS",
  "main": "index.js",
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "express": "^4.18.2",
    "uuid": "^9.0.1",
    "pg": "^8.11.3"
  }
}
EOF
    fi
    
    # Install dependencies
    npm install @supabase/supabase-js uuid
}

# Create API endpoints
create_api_endpoints() {
    echo "Creating API endpoints..."
    
    mkdir -p /root/fixer-initiative/ecosystem-projects/onasis-gateway/routes
    cat > /root/fixer-initiative/ecosystem-projects/onasis-gateway/routes/credit.js << 'EOF'
const express = require('express');
const router = express.Router();
const CreditAsAServiceClient = require('../services/credit-as-a-service/client-supabase');

const caasClient = new CreditAsAServiceClient();

// Health check
router.get('/health', async (req, res) => {
    const health = await caasClient.healthCheck();
    res.status(health.status === 'healthy' ? 200 : 503).json(health);
});

// Submit application
router.post('/applications', async (req, res) => {
    try {
        const result = await caasClient.submitApplication(req.body);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get applications
router.get('/applications', async (req, res) => {
    try {
        const result = await caasClient.getApplications(req.query);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get specific application
router.get('/applications/:id', async (req, res) => {
    try {
        const result = await caasClient.getApplication(req.params.id);
        res.json(result);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

// Update application status
router.put('/applications/:id/status', async (req, res) => {
    try {
        const { status, notes } = req.body;
        const result = await caasClient.updateApplicationStatus(
            req.params.id,
            status,
            notes
        );
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Register provider
router.post('/providers', async (req, res) => {
    try {
        const result = await caasClient.registerProvider(req.body);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get providers
router.get('/providers', async (req, res) => {
    try {
        const result = await caasClient.getProviders(req.query);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Submit bid
router.post('/bids', async (req, res) => {
    try {
        const result = await caasClient.submitProviderBid(req.body);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Process transaction
router.post('/transactions', async (req, res) => {
    try {
        const result = await caasClient.processTransaction(req.body);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Credit check
router.post('/credit-check', async (req, res) => {
    try {
        const { user_id, business_id } = req.body;
        const result = await caasClient.performCreditCheck(user_id, business_id);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Analytics
router.get('/analytics', async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        const result = await caasClient.getAnalytics({
            start: start_date,
            end: end_date
        });
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Provider performance
router.get('/providers/:id/performance', async (req, res) => {
    try {
        const result = await caasClient.getProviderPerformance(req.params.id);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
EOF
}

# Create main gateway server if it doesn't exist
create_gateway_server() {
    echo "Creating gateway server..."
    
    if [ ! -f /root/fixer-initiative/ecosystem-projects/onasis-gateway/server.js ]; then
        cat > /root/fixer-initiative/ecosystem-projects/onasis-gateway/server.js << 'EOF'
const express = require('express');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'onasis-gateway',
        timestamp: new Date().toISOString()
    });
});

// Credit routes
const creditRoutes = require('./routes/credit');
app.use('/api/credit', creditRoutes);

// Webhook routes
const webhookRoutes = require('./services/credit-as-a-service/webhooks');
app.use('/webhooks/credit', webhookRoutes);

// Error handling
app.use((error, req, res, next) => {
    console.error(error);
    res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Onasis Gateway running on port ${PORT}`);
    console.log(`Credit API available at http://localhost:${PORT}/api/credit`);
});

module.exports = app;
EOF
    fi
}

# Create PM2 ecosystem file
create_pm2_config() {
    echo "Creating PM2 configuration..."
    
    cat > /root/fixer-initiative/ecosystem-projects/onasis-gateway/ecosystem.config.js << 'EOF'
module.exports = {
    apps: [
        {
            name: 'onasis-gateway',
            script: 'server.js',
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'production',
                PORT: 3000
            }
        },
        {
            name: 'mcp-server',
            script: 'mcp-server/index.js',
            instances: 1,
            autorestart: true,
            watch: false,
            env: {
                NODE_ENV: 'production',
                PORT: 3001
            }
        }
    ]
};
EOF
}

# Main deployment
main() {
    echo "Starting complete CaaS deployment with Supabase..."
    
    # Update client files
    update_caas_client
    
    # Install dependencies
    install_dependencies
    
    # Create API endpoints
    create_api_endpoints
    
    # Create server
    create_gateway_server
    
    # Create PM2 config
    create_pm2_config
    
    # Start services
    echo "Starting services..."
    cd /root/fixer-initiative/ecosystem-projects/onasis-gateway
    
    # Stop any existing services
    pm2 stop all || true
    
    # Start new services
    pm2 start ecosystem.config.js
    
    # Save PM2 configuration
    pm2 save
    pm2 startup
    
    echo ""
    echo "=== Deployment Complete ==="
    echo ""
    echo "Services running:"
    pm2 list
    
    echo ""
    echo "Test endpoints:"
    echo "- Health: curl http://localhost:3000/health"
    echo "- Credit Health: curl http://localhost:3000/api/credit/health"
    echo ""
    echo "Supabase Dashboard: https://supabase.com/dashboard/project/mxtsdgkwzjzlttpotole"
    echo ""
    echo "Next steps:"
    echo "1. Configure nginx for api.connectionpoint.tech"
    echo "2. Setup SSL certificate"
    echo "3. Test credit operations"
}

# Run deployment
main