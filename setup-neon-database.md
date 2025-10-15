# Neon Database Setup for CaaS Backup

## Step 1: Create Neon Account & Project

1. Go to https://neon.tech
2. Sign up or login
3. Click "Create Project"
4. Configure:
   - **Project name**: `credit-services-backup`
   - **Region**: Choose closest to your users
   - **Postgres version**: 16 (latest)
   - Click "Create Project"

## Step 2: Get Connection Details

After creation, you'll see:
```
Host: [project-name].neon.tech
Database: neondb
Username: [your-username]
Password: [auto-generated]
```

Copy the connection string that looks like:
```
postgresql://[username]:[password]@[project-name].neon.tech/neondb?sslmode=require
```

## Step 3: Deploy CaaS Schema to Neon

Save this script as `deploy-caas-to-neon.sql`:

```sql
-- Credit-as-a-Service Schema for Neon
-- This creates the same schema as Supabase for backup/failover

-- Create credit schema
CREATE SCHEMA IF NOT EXISTS credit;

-- Set search path
SET search_path TO credit, public;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
    interest_rate_range JSONB NOT NULL,
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
    interest_rate DECIMAL(5, 2) NOT NULL,
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

-- Status history table
CREATE TABLE credit.status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES credit.applications(id),
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
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

-- Create update timestamp function
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

-- Grant permissions (adjust based on your Neon user setup)
-- GRANT ALL ON SCHEMA credit TO your_app_user;
-- GRANT ALL ON ALL TABLES IN SCHEMA credit TO your_app_user;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA credit TO your_app_user;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'CaaS schema created successfully in Neon!';
END $$;
```

## Step 4: Execute Schema in Neon

### Option A: Using Neon SQL Editor (Easiest)
1. Go to your Neon dashboard
2. Click on "SQL Editor"
3. Paste the entire SQL script above
4. Click "Run"

### Option B: Using psql CLI
```bash
# Save your connection string
export NEON_DATABASE_URL="postgresql://[username]:[password]@[project-name].neon.tech/neondb?sslmode=require"

# Run the schema
psql $NEON_DATABASE_URL -f deploy-caas-to-neon.sql
```

### Option C: Using Node.js Script
```javascript
// save as deploy-neon.js
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
    connectionString: 'YOUR_NEON_CONNECTION_STRING',
    ssl: { rejectUnauthorized: false }
});

async function deploySchema() {
    const sql = fs.readFileSync('deploy-caas-to-neon.sql', 'utf8');
    
    try {
        await pool.query(sql);
        console.log('✅ CaaS schema deployed to Neon successfully!');
    } catch (error) {
        console.error('❌ Deployment failed:', error);
    } finally {
        await pool.end();
    }
}

deploySchema();
```

## Step 5: Update Your Application

Add Neon connection to your environment variables:
```bash
# .env file
SUPABASE_URL=https://mxtsdgkwzjzlttpotole.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEON_DATABASE_URL=postgresql://[username]:[password]@[project-name].neon.tech/neondb?sslmode=require
```

## Step 6: Test Neon Connection

```javascript
// test-neon.js
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function testNeon() {
    try {
        // Test connection
        const { rows } = await pool.query('SELECT NOW()');
        console.log('✅ Neon connected:', rows[0].now);
        
        // Test schema
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'credit'
        `);
        console.log('✅ Credit tables:', tables.rows.map(r => r.table_name));
        
        // Insert test provider
        const provider = await pool.query(`
            INSERT INTO credit.providers (
                provider_code, company_name, contact_email,
                address, minimum_loan_amount, maximum_loan_amount,
                interest_rate_range, processing_fee_percentage
            ) VALUES (
                'NEON_TEST_001', 'Neon Test Bank', 'test@neon.tech',
                '{"city": "Lagos"}'::jsonb, 100000, 5000000,
                '{"min": 15, "max": 25}'::jsonb, 2.5
            ) RETURNING *
        `);
        console.log('✅ Test provider created:', provider.rows[0].id);
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await pool.end();
    }
}

testNeon();
```

## Step 7: Enable Automatic Failover

Update your application to use the `caas-neon-direct-access.js` configuration:

```javascript
// In your app
const CreditServiceFailoverClient = require('./caas-neon-direct-access');

const creditService = new CreditServiceFailoverClient();

// This will automatically failover: VPS → Supabase → Neon
const result = await creditService.executeOperation('getProviders', {
    active_only: true
});
```

## Monitoring Dashboard

Create a simple status page:
```javascript
// status.js
app.get('/status', async (req, res) => {
    const creditService = new CreditServiceFailoverClient();
    const health = await creditService.checkAllServices();
    
    res.json({
        timestamp: new Date().toISOString(),
        services: health,
        recommendation: getRecommendation(health)
    });
});

function getRecommendation(health) {
    if (health.vps.status === 'healthy') {
        return 'All systems operational - using VPS';
    } else if (health.supabase.status === 'healthy') {
        return 'VPS down - using Supabase direct connection';
    } else if (health.neon.status === 'healthy') {
        return 'VPS and Supabase down - using Neon backup';
    } else {
        return 'CRITICAL: All services down!';
    }
}
```

## Done! 🎉

Your Neon backup is now ready. The system will automatically:
1. Try VPS first (fastest, includes business logic)
2. Failover to Supabase if VPS is down
3. Failover to Neon if both VPS and Supabase are down

This ensures 99.99% uptime for your Credit-as-a-Service platform!