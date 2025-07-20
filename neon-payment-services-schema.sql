-- Payment Services Backup Table for Neon Database
-- This table stores all payment gateway interactions for audit/backup

CREATE TABLE payment_services (
    id SERIAL PRIMARY KEY,
    
    -- Transaction Identifiers
    internal_reference VARCHAR(255) NOT NULL UNIQUE,
    client_reference VARCHAR(255),
    gateway_reference VARCHAR(255),
    
    -- Client Information
    client_org_id UUID,
    client_code VARCHAR(50),
    
    -- Payment Gateway Details
    gateway_provider VARCHAR(50) NOT NULL CHECK (gateway_provider IN ('paystack', 'sayswitch')),
    gateway_environment VARCHAR(10) NOT NULL CHECK (gateway_environment IN ('test', 'live')),
    
    -- Transaction Details
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('payment', 'transfer', 'refund')),
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'NGN',
    
    -- Status Tracking
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    gateway_status VARCHAR(50),
    
    -- Request/Response Data
    request_payload JSONB,
    response_payload JSONB,
    webhook_payload JSONB,
    
    -- Customer Information
    customer_email VARCHAR(255),
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Audit Fields
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    
    -- Indexes for performance
    INDEX idx_payment_services_internal_ref (internal_reference),
    INDEX idx_payment_services_client_ref (client_reference),
    INDEX idx_payment_services_gateway_ref (gateway_reference),
    INDEX idx_payment_services_client_org (client_org_id),
    INDEX idx_payment_services_gateway (gateway_provider, gateway_environment),
    INDEX idx_payment_services_status (status),
    INDEX idx_payment_services_created (created_at),
    INDEX idx_payment_services_amount (amount)
);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER payment_services_updated_at
    BEFORE UPDATE ON payment_services
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_services_updated_at();

-- Gateway configurations table
CREATE TABLE gateway_configurations (
    id SERIAL PRIMARY KEY,
    gateway_provider VARCHAR(50) NOT NULL,
    environment VARCHAR(10) NOT NULL,
    
    -- API Configuration
    api_base_url VARCHAR(255) NOT NULL,
    public_key VARCHAR(255),
    secret_key_encrypted TEXT, -- Encrypted storage
    webhook_secret_encrypted TEXT, -- Encrypted storage
    
    -- Settings
    is_active BOOLEAN DEFAULT true,
    rate_limit_per_minute INTEGER DEFAULT 100,
    timeout_seconds INTEGER DEFAULT 30,
    
    -- Metadata
    configuration_metadata JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(gateway_provider, environment)
);

-- Insert default configurations
INSERT INTO gateway_configurations (gateway_provider, environment, api_base_url, is_active) VALUES
('paystack', 'test', 'https://api.paystack.co', true),
('paystack', 'live', 'https://api.paystack.co', true),
('sayswitch', 'test', 'https://api.sayswitch.com', true),
('sayswitch', 'live', 'https://api.sayswitch.com', true);

-- Payment service logs for debugging
CREATE TABLE payment_service_logs (
    id SERIAL PRIMARY KEY,
    payment_service_id INTEGER REFERENCES payment_services(id),
    
    log_level VARCHAR(20) NOT NULL CHECK (log_level IN ('info', 'warn', 'error', 'debug')),
    log_message TEXT NOT NULL,
    log_data JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_payment_service_logs_payment_id (payment_service_id),
    INDEX idx_payment_service_logs_level (log_level),
    INDEX idx_payment_service_logs_created (created_at)
);

-- View for easy querying
CREATE VIEW payment_services_summary AS
SELECT 
    ps.internal_reference,
    ps.client_reference,
    ps.gateway_provider,
    ps.gateway_environment,
    ps.transaction_type,
    ps.amount,
    ps.currency,
    ps.status,
    ps.customer_email,
    ps.created_at,
    ps.completed_at,
    ps.client_org_id,
    CASE 
        WHEN ps.completed_at IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (ps.completed_at - ps.created_at)) 
        ELSE NULL 
    END as processing_time_seconds
FROM payment_services ps;

-- Backup and sync functions
CREATE OR REPLACE FUNCTION sync_payment_to_backup(
    p_internal_reference VARCHAR(255),
    p_client_reference VARCHAR(255),
    p_gateway_provider VARCHAR(50),
    p_transaction_type VARCHAR(50),
    p_amount DECIMAL(15, 2),
    p_status VARCHAR(50),
    p_payload JSONB DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    service_id INTEGER;
BEGIN
    INSERT INTO payment_services (
        internal_reference,
        client_reference,
        gateway_provider,
        gateway_environment,
        transaction_type,
        amount,
        status,
        request_payload
    ) VALUES (
        p_internal_reference,
        p_client_reference,
        p_gateway_provider,
        'live', -- Default to live, can be parameterized
        p_transaction_type,
        p_amount,
        p_status,
        p_payload
    )
    ON CONFLICT (internal_reference) DO UPDATE SET
        status = EXCLUDED.status,
        response_payload = EXCLUDED.request_payload,
        updated_at = NOW()
    RETURNING id INTO service_id;
    
    RETURN service_id;
END;
$$ LANGUAGE plpgsql;