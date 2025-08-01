-- Client Separation Migration
-- Separates client operations from internal vendor operations

-- Client Organizations Table
CREATE TABLE IF NOT EXISTS public.client_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_code VARCHAR(50) UNIQUE NOT NULL,
    organization_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(100) DEFAULT 'startup',
    subscription_tier VARCHAR(50) DEFAULT 'starter',
    monthly_quota INTEGER DEFAULT 10000,
    webhook_url VARCHAR(500),
    callback_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Client API Keys Table
CREATE TABLE IF NOT EXISTS public.client_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_org_id UUID NOT NULL REFERENCES client_organizations(id) ON DELETE CASCADE,
    key_id VARCHAR(100) UNIQUE NOT NULL,
    key_secret_hash VARCHAR(256) NOT NULL,
    key_name VARCHAR(255) NOT NULL DEFAULT 'Default Key',
    environment VARCHAR(20) NOT NULL DEFAULT 'live',
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Client Transactions Table (separate from internal vendor transactions)
CREATE TABLE IF NOT EXISTS public.client_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_org_id UUID NOT NULL REFERENCES client_organizations(id) ON DELETE CASCADE,
    client_reference VARCHAR(255) NOT NULL,
    internal_reference VARCHAR(255) NOT NULL,
    service_type VARCHAR(50) NOT NULL, -- 'payment' or 'transfer'
    service_provider VARCHAR(50) NOT NULL, -- 'paystack' or 'sayswitch'
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'NGN',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    
    -- Payment specific fields
    customer_email VARCHAR(255),
    
    -- Transfer specific fields
    recipient_account VARCHAR(20),
    recipient_bank_code VARCHAR(10),
    recipient_name VARCHAR(255),
    
    -- Metadata and tracking
    metadata JSONB,
    client_ip VARCHAR(45),
    user_agent TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Indexes
    UNIQUE(client_org_id, client_reference)
);

-- Client Usage Logs (separate from vendor usage logs)
CREATE TABLE IF NOT EXISTS public.client_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_org_id UUID NOT NULL REFERENCES client_organizations(id) ON DELETE CASCADE,
    api_key_id UUID REFERENCES client_api_keys(id) ON DELETE SET NULL,
    
    -- Request details
    request_id UUID NOT NULL DEFAULT gen_random_uuid(),
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    
    -- Response details
    status_code INTEGER NOT NULL,
    processing_time_ms INTEGER NOT NULL,
    response_size_bytes INTEGER DEFAULT 0,
    
    -- Client context
    client_ip VARCHAR(45),
    user_agent TEXT,
    
    -- Billing
    billable_units INTEGER DEFAULT 1,
    cost_per_unit DECIMAL(10,4) DEFAULT 0.001,
    total_cost DECIMAL(10,4) GENERATED ALWAYS AS (billable_units * cost_per_unit) STORED,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Client Billing Records (separate from vendor billing)
CREATE TABLE IF NOT EXISTS public.client_billing_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_org_id UUID NOT NULL REFERENCES client_organizations(id) ON DELETE CASCADE,
    
    -- Billing period
    billing_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    billing_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Usage summary
    total_requests INTEGER NOT NULL DEFAULT 0,
    total_successful_requests INTEGER NOT NULL DEFAULT 0,
    total_failed_requests INTEGER NOT NULL DEFAULT 0,
    
    -- Service breakdown
    payment_requests INTEGER NOT NULL DEFAULT 0,
    transfer_requests INTEGER NOT NULL DEFAULT 0,
    
    -- Financial
    total_billable_units INTEGER NOT NULL DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    
    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    paid_at TIMESTAMP WITH TIME ZONE,
    invoice_url VARCHAR(500),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies for Client Tables
ALTER TABLE public.client_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_billing_records ENABLE ROW LEVEL SECURITY;

-- Client Organization Policies
CREATE POLICY "Client organizations are viewable by service role" ON public.client_organizations
    FOR ALL USING (auth.role() = 'service_role');

-- Client API Keys Policies
CREATE POLICY "Client API keys are viewable by service role" ON public.client_api_keys
    FOR ALL USING (auth.role() = 'service_role');

-- Client Transactions Policies
CREATE POLICY "Client transactions are viewable by service role" ON public.client_transactions
    FOR ALL USING (auth.role() = 'service_role');

-- Client Usage Logs Policies
CREATE POLICY "Client usage logs are viewable by service role" ON public.client_usage_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Client Billing Records Policies
CREATE POLICY "Client billing records are viewable by service role" ON public.client_billing_records
    FOR ALL USING (auth.role() = 'service_role');

-- Indexes for better performance
CREATE INDEX idx_client_organizations_client_code ON public.client_organizations(client_code);
CREATE INDEX idx_client_api_keys_key_id ON public.client_api_keys(key_id);
CREATE INDEX idx_client_transactions_client_org_id ON public.client_transactions(client_org_id);
CREATE INDEX idx_client_transactions_client_reference ON public.client_transactions(client_reference);
CREATE INDEX idx_client_transactions_status ON public.client_transactions(status);
CREATE INDEX idx_client_transactions_service_type ON public.client_transactions(service_type);
CREATE INDEX idx_client_usage_logs_client_org_id ON public.client_usage_logs(client_org_id);
CREATE INDEX idx_client_usage_logs_created_at ON public.client_usage_logs(created_at);
CREATE INDEX idx_client_billing_records_client_org_id ON public.client_billing_records(client_org_id);
CREATE INDEX idx_client_billing_records_billing_period ON public.client_billing_records(billing_period_start, billing_period_end);

-- Functions for Client Operations

-- Validate Client API Key
CREATE OR REPLACE FUNCTION validate_client_api_key(
    p_key_id TEXT,
    p_key_secret TEXT
) RETURNS TABLE(
    is_valid BOOLEAN,
    client_org_id UUID,
    client_code TEXT,
    organization_name TEXT,
    subscription_tier TEXT,
    monthly_quota INTEGER,
    api_key_id UUID
) 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN ck.id IS NOT NULL AND ck.is_active = true AND co.is_active = true
            THEN true 
            ELSE false 
        END as is_valid,
        co.id as client_org_id,
        co.client_code,
        co.organization_name,
        co.subscription_tier,
        co.monthly_quota,
        ck.id as api_key_id
    FROM public.client_api_keys ck
    JOIN public.client_organizations co ON ck.client_org_id = co.id
    WHERE ck.key_id = p_key_id 
    AND ck.key_secret_hash = crypt(p_key_secret, ck.key_secret_hash)
    AND (ck.expires_at IS NULL OR ck.expires_at > NOW())
    LIMIT 1;
END;
$$;

-- Log Client Usage
CREATE OR REPLACE FUNCTION log_client_usage(
    p_client_org_id UUID,
    p_api_key_id UUID,
    p_request_id UUID,
    p_endpoint TEXT,
    p_method TEXT,
    p_service_type TEXT,
    p_status_code INTEGER,
    p_processing_time_ms INTEGER,
    p_response_size_bytes INTEGER DEFAULT 0,
    p_client_ip TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    usage_log_id UUID;
BEGIN
    INSERT INTO public.client_usage_logs (
        client_org_id,
        api_key_id,
        request_id,
        endpoint,
        method,
        service_type,
        status_code,
        processing_time_ms,
        response_size_bytes,
        client_ip,
        user_agent
    ) VALUES (
        p_client_org_id,
        p_api_key_id,
        p_request_id,
        p_endpoint,
        p_method,
        p_service_type,
        p_status_code,
        p_processing_time_ms,
        p_response_size_bytes,
        p_client_ip,
        p_user_agent
    ) RETURNING id INTO usage_log_id;
    
    RETURN usage_log_id;
END;
$$;

-- Generate Client API Key
CREATE OR REPLACE FUNCTION generate_client_api_key(
    p_client_org_id UUID,
    p_key_name TEXT,
    p_environment TEXT DEFAULT 'live'
) RETURNS TABLE(
    api_key_id UUID,
    key_id TEXT,
    key_secret TEXT,
    full_api_key TEXT
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_client_code TEXT;
    v_key_id TEXT;
    v_key_secret TEXT;
    v_key_secret_hash TEXT;
    v_api_key_id UUID;
BEGIN
    -- Get client code
    SELECT client_code INTO v_client_code
    FROM public.client_organizations
    WHERE id = p_client_org_id;
    
    IF v_client_code IS NULL THEN
        RAISE EXCEPTION 'Invalid client organization ID';
    END IF;
    
    -- Generate key components
    v_key_id := 'ck_' || p_environment || '_' || v_client_code || '_' || 
                EXTRACT(epoch FROM NOW())::TEXT || '_' || 
                substr(md5(random()::text), 1, 8);
    
    v_key_secret := 'cs_' || p_environment || '_' || substr(md5(random()::text), 1, 32);
    v_key_secret_hash := crypt(v_key_secret, gen_salt('bf'));
    
    -- Insert the key
    INSERT INTO public.client_api_keys (
        client_org_id,
        key_id,
        key_secret_hash,
        key_name,
        environment
    ) VALUES (
        p_client_org_id,
        v_key_id,
        v_key_secret_hash,
        p_key_name,
        p_environment
    ) RETURNING id INTO v_api_key_id;
    
    RETURN QUERY SELECT
        v_api_key_id,
        v_key_id,
        v_key_secret,
        v_key_id || '.' || v_key_secret as full_api_key;
END;
$$;

-- Client Usage Summary
CREATE OR REPLACE FUNCTION get_client_usage_summary(
    p_client_org_id UUID,
    p_start_date TIMESTAMP WITH TIME ZONE,
    p_end_date TIMESTAMP WITH TIME ZONE
) RETURNS TABLE(
    total_requests INTEGER,
    successful_requests INTEGER,
    failed_requests INTEGER,
    payment_requests INTEGER,
    transfer_requests INTEGER,
    avg_response_time_ms NUMERIC,
    total_cost NUMERIC
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_requests,
        COUNT(CASE WHEN status_code < 400 THEN 1 END)::INTEGER as successful_requests,
        COUNT(CASE WHEN status_code >= 400 THEN 1 END)::INTEGER as failed_requests,
        COUNT(CASE WHEN service_type = 'payment' THEN 1 END)::INTEGER as payment_requests,
        COUNT(CASE WHEN service_type = 'transfer' THEN 1 END)::INTEGER as transfer_requests,
        AVG(processing_time_ms)::NUMERIC as avg_response_time_ms,
        SUM(total_cost)::NUMERIC as total_cost
    FROM public.client_usage_logs
    WHERE client_org_id = p_client_org_id
    AND created_at BETWEEN p_start_date AND p_end_date;
END;
$$;

-- Create default client organization for testing
INSERT INTO public.client_organizations (
    client_code,
    organization_name,
    contact_email,
    contact_name,
    business_type,
    subscription_tier,
    monthly_quota
) VALUES (
    'TEST_CLIENT',
    'Test Client Organization',
    'test@example.com',
    'Test User',
    'testing',
    'developer',
    100000
) ON CONFLICT (client_code) DO NOTHING;

COMMENT ON TABLE public.client_organizations IS 'Client organizations using the Fixer Initiative API';
COMMENT ON TABLE public.client_api_keys IS 'API keys for client authentication';
COMMENT ON TABLE public.client_transactions IS 'Client transaction records (separate from internal vendor transactions)';
COMMENT ON TABLE public.client_usage_logs IS 'Client API usage logs for billing and analytics';
COMMENT ON TABLE public.client_billing_records IS 'Client billing records and invoices';