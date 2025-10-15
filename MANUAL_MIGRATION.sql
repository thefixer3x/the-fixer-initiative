-- The Fixer Initiative: Initial Control Room Setup

-- Control Room schema for monitoring and management
CREATE SCHEMA IF NOT EXISTS control_room;
COMMENT ON SCHEMA control_room IS 'The Fixer Initiative Control Room - Central monitoring and management';

-- App isolation schemas
CREATE SCHEMA IF NOT EXISTS app_vortexcore;
CREATE SCHEMA IF NOT EXISTS app_seftec;
CREATE SCHEMA IF NOT EXISTS app_saas;
CREATE SCHEMA IF NOT EXISTS app_apple;

-- Grant permissions
GRANT USAGE ON SCHEMA control_room TO authenticated;
GRANT USAGE ON SCHEMA app_vortexcore TO authenticated;
GRANT USAGE ON SCHEMA app_seftec TO authenticated;
GRANT USAGE ON SCHEMA app_saas TO authenticated;
GRANT USAGE ON SCHEMA app_apple TO authenticated;

-- Control Room apps registry with CHECK constraints
CREATE TABLE IF NOT EXISTS control_room.apps (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  schema_name TEXT NOT NULL,
  original_project_ref TEXT,
  migration_status TEXT DEFAULT 'pending' CHECK (migration_status IN ('pending', 'in_progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Initial apps registration
INSERT INTO control_room.apps (id, name, description, schema_name, original_project_ref) VALUES
  ('vortexcore', 'Vortexcore.app', 'Main aggregation platform', 'app_vortexcore', 'muyhurqfcsjqtnbozyir'),
  ('seftec', 'SEFTEC Store', 'E-commerce platform', 'app_seftec', 'ptnrwrgzrsbocgxlpvhd'),
  ('saas', 'SaaS Platform', 'Software as a Service platform', 'app_saas', 'nbmomsntbamfthxfdnme'),
  ('apple', 'Apple Store Lekki', 'Retail store management', 'app_apple', 'rsabczhfeehazuyajarx');

-- Monitoring tables
CREATE TABLE IF NOT EXISTS control_room.metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app_id TEXT REFERENCES control_room.apps(id),
  metric_type TEXT NOT NULL,
  metric_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_metrics_app_id ON control_room.metrics(app_id);
CREATE INDEX IF NOT EXISTS idx_metrics_created_at ON control_room.metrics(created_at);

-- User app access tracking
CREATE TABLE IF NOT EXISTS control_room.user_app_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  app_id TEXT REFERENCES control_room.apps(id) NOT NULL,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('viewer', 'developer', 'admin')),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  granted_by UUID REFERENCES auth.users,
  UNIQUE(user_id, app_id)
);

-- Audit log for tracking changes
CREATE TABLE IF NOT EXISTS control_room.audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app_id TEXT REFERENCES control_room.apps(id),
  user_id UUID REFERENCES auth.users,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE control_room.apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_room.metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_room.user_app_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_room.audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view apps they have access to" ON control_room.apps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM control_room.user_app_access
      WHERE app_id = apps.id 
      AND user_id = auth.uid()
    )
    OR 
    EXISTS (
      SELECT 1 FROM control_room.user_app_access
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Users can view their own access" ON control_room.user_app_access
  FOR SELECT USING (user_id = auth.uid());

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION control_room.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_apps_updated_at BEFORE UPDATE ON control_room.apps
  FOR EACH ROW EXECUTE FUNCTION control_room.update_updated_at_column();

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
    client_org_id UUID NOT NULL REFERENCES public.client_organizations(id) ON DELETE CASCADE,
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
    client_org_id UUID NOT NULL REFERENCES public.client_organizations(id) ON DELETE CASCADE,
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
    client_org_id UUID NOT NULL REFERENCES public.client_organizations(id) ON DELETE CASCADE,
    api_key_id UUID REFERENCES public.client_api_keys(id) ON DELETE SET NULL,
    
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
    client_org_id UUID NOT NULL REFERENCES public.client_organizations(id) ON DELETE CASCADE,
    
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
CREATE INDEX IF NOT EXISTS idx_client_organizations_client_code ON public.client_organizations(client_code);
CREATE INDEX IF NOT EXISTS idx_client_api_keys_key_id ON public.client_api_keys(key_id);
CREATE INDEX IF NOT EXISTS idx_client_transactions_client_org_id ON public.client_transactions(client_org_id);
CREATE INDEX IF NOT EXISTS idx_client_transactions_client_reference ON public.client_transactions(client_reference);
CREATE INDEX IF NOT EXISTS idx_client_transactions_status ON public.client_transactions(status);
CREATE INDEX IF NOT EXISTS idx_client_transactions_service_type ON public.client_transactions(service_type);
CREATE INDEX IF NOT EXISTS idx_client_usage_logs_client_org_id ON public.client_usage_logs(client_org_id);
CREATE INDEX IF NOT EXISTS idx_client_usage_logs_created_at ON public.client_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_client_billing_records_client_org_id ON public.client_billing_records(client_org_id);
CREATE INDEX IF NOT EXISTS idx_client_billing_records_billing_period ON public.client_billing_records(billing_period_start, billing_period_end);

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

-- Create storage buckets for SEFTEC Hub
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('system', 'system', false),
  ('logs', 'logs', false),
  ('exports', 'exports', true)
ON CONFLICT (id) DO NOTHING;

-- Set up bucket policies
CREATE POLICY "System files for admins only" ON storage.objects
  FOR ALL USING (
    bucket_id = 'system' AND 
    EXISTS (
      SELECT 1 FROM control_room.user_app_access
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Logs viewable by authenticated users" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'logs' AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Exports are public" ON storage.objects
  FOR SELECT USING (bucket_id = 'exports');

-- MIGRATION: 004_add_app_id_to_profiles.sql

-- Step 1: Add the app_id column to the profiles table.
-- It is nullable for now so we can backfill the data without breaking existing inserts.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS app_id TEXT;

-- Step 2: Create the central apps registry table in the control_room schema if it doesn't exist.
-- This will be the single source of truth for all applications in the ecosystem.
CREATE TABLE IF NOT EXISTS control_room.apps (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  schema_name TEXT,
  original_project_ref TEXT,
  migration_status TEXT DEFAULT 'pending' CHECK (migration_status IN ('pending', 'in_progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Step 3: Add a foreign key constraint from profiles.app_id to control_room.apps.id.
-- This is commented out for now. We will enable it after backfilling the data.
-- ALTER TABLE public.profiles
-- ADD CONSTRAINT fk_profiles_app_id FOREIGN KEY (app_id) REFERENCES control_room.apps(id);

-- Step 4: Populate the control_room.apps table with the known applications.
-- This is based on the schemas and projects I have identified.
INSERT INTO control_room.apps (id, name, description, schema_name) VALUES
  ('the-fixer-initiative', 'The Fixer Initiative', 'Central operations hub for new movement', 'app_the_fixer_initiative'),
  ('vibe-frontend', 'vibe-frontend', 'Universal API MCP Frontend with multiple tools', 'app_vibe_frontend'),
  ('vortexcore', 'vortexcore', '', 'app_vortexcore'),
  ('lanonasis-maas', 'lanonasis-maas', '', 'app_lanonasis_maas'),
  ('onasis-gateway', 'onasis-gateway', 'Comprehensive API service warehouse with MCP interfaces', 'app_onasis_gateway'),
  ('onasis-core', 'Onasis-CORE', 'Privacy-First Infrastructure for Lan Onasis ecosystem', 'app_onasis_core'),
  ('sub-pro', 'SUB-PRO', '', 'app_sub_pro'),
  ('seftec-store', 'seftec-store', 'SEFTEC B2B TRADE HUB', 'app_seftec_store'),
  ('cua-exp-prototype', 'cua-exp-prototype', '', 'app_cua_exp_prototype'),
  ('credit-as-a-service', 'credit-as-a-service', 'Enterprise microservices for fintech', 'app_credit_as_a_service'),
  ('expo_bank_app', 'expo_bank_app', '', 'app_expo_bank_app'),
  ('maple-movement-hub', 'maple-movement-hub', '', 'app_maple_movement_hub'),
  ('seftechub-verification-service', 'seftechub-verification-service', 'Unified Identity, Business, Biometric & Background Checks', 'app_seftechub_verification_service'),
  ('mcp-monorepo', 'mcp-monorepo', '', 'app_mcp_monorepo'),
  ('micro-services', 'micro-services', 'GitHub-ClickUp automation microservice', 'app_micro_services'),
  ('vortexcore-saas', 'vortexcore-saas', '', 'app_vortexcore_saas'),
  ('doyen-autos', 'doyen-autos', '', 'app_doyen_autos'),
  ('personal-subscription-manager', 'Personal-subscription-manager', '', 'app_personal_subscription_manager'),
  ('lanonasisindex', 'LanOnasisIndex', 'Lan Onasis Landing page', 'app_lanonasisindex'),
  ('sd-ghost-protocol', 'sd-ghost-protocol', '', 'app_sd_ghost_protocol'),
  ('enterprise-context-xx', 'enterprise-context-xx', '', 'app_enterprise_context_xx'),
  ('agent-banks', 'agent-banks', 'AI automation assistant', 'app_agent_banks'),
  ('seftechub-mobile', 'seftechub-mobile', '', 'app_seftechub_mobile'),
  ('nexus-edge', 'nexus-edge', '', 'app_nexus_edge'),
  ('social-connect', 'social-connect', '', 'app_social_connect'),
  ('ai-brainbox', 'ai-brainbox', '', 'app_ai_brainbox'),
  ('logistics-platform', 'logistics-platform', '', 'app_logistics_platform'),
  ('plannerai', 'plannerai', '', 'app_plannerai'),
  ('network-sync', 'network-sync', '', 'app_network_sync'),
  ('seftechub-saas', 'seftechub-saas', '', 'app_seftechub_saas'),
  ('saas-lanonasis', 'saas-lanonasis', '', 'app_saas_lanonasis'),
  ('mega-meal', 'mega-meal', '', 'app_mega_meal'),
  ('gold-pulser', 'gold-pulser', '', 'app_gold_pulser'),
  ('sync-plan-flow', 'sync-plan-flow', '', 'app_sync_plan_flow'),
  ('chy-bic-luxe', 'chy-bic-luxe', 'Repository for BIC Luxe', 'app_chy_bic_luxe'),
  ('seftec-bank-insights', 'seftec-bank-insights', '', 'app_seftec_bank_insights'),
  ('apple-store-lekki', 'apple-store-lekki', '', 'app_apple_store_lekki'),
  ('nxtgen-api-saas-platform', 'nxtgen-api-saas-platform', '', 'app_nxtgen_api_saas_platform'),
  ('business-services', 'business-services', '', 'app_business_services'),
  ('grizzen-rev', 'Grizzen-Rev', 'Created with StackBlitz', 'app_grizzen_rev'),
  ('nixieai-by-samara', 'NixieAI-by-Samara', 'Learning Platform', 'app_nixieai_by_samara')
ON CONFLICT (id) DO NOTHING;
