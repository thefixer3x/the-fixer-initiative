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
