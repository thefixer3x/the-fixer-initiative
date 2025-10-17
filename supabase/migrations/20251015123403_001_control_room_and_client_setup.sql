/*
  # The Fixer Initiative: Complete Database Recovery
  
  This migration restores the complete Control Room and Client Separation architecture.
  
  1. Schemas Created
    - `control_room` - Central monitoring and management
    - `app_vortexcore` - VortexCore app isolation
    - `app_seftec` - SEFTEC Store isolation
    - `app_saas` - SaaS Platform isolation
    - `app_apple` - Apple Store isolation
  
  2. Control Room Tables
    - `control_room.apps` - Application registry with status tracking
    - `control_room.metrics` - Performance and usage metrics
    - `control_room.user_app_access` - User permissions per app
    - `control_room.audit_log` - Change tracking and audit trail
  
  3. Client Management Tables (Public Schema)
    - `client_organizations` - Client company/organization records
    - `client_api_keys` - API authentication keys with hashing
    - `client_transactions` - Payment and transfer transaction logs
    - `client_usage_logs` - API usage tracking for billing
    - `client_billing_records` - Billing periods and invoices
  
  4. Security Features
    - Row Level Security enabled on all tables
    - Service role policies for client tables
    - Admin and user-based access policies for control room
    - Password hashing with bcrypt for API keys
  
  5. Functions
    - `validate_client_api_key()` - Secure API key validation
    - `log_client_usage()` - Usage tracking for billing
    - `generate_client_api_key()` - Secure key generation
    - `get_client_usage_summary()` - Usage analytics
    - `update_updated_at_column()` - Auto-update timestamps
  
  6. Initial Data
    - 4 core apps registered (VortexCore, SEFTEC, SaaS, Apple Store)
    - 3 additional apps (Credit-as-a-Service, Mega Meal, Onasis Core)
    - Test client organization for development
    - Storage buckets (system, logs, exports)
  
  This migration includes IF NOT EXISTS and ON CONFLICT clauses for safe re-execution.
*/

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
  ('apple', 'Apple Store Lekki', 'Retail store management', 'app_apple', 'rsabczhfeehazuyajarx')
ON CONFLICT (id) DO NOTHING;

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
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'apps' AND policyname = 'Users can view apps they have access to'
  ) THEN
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
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_app_access' AND policyname = 'Users can view their own access'
  ) THEN
    CREATE POLICY "Users can view their own access" ON control_room.user_app_access
      FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION control_room.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_apps_updated_at ON control_room.apps;
CREATE TRIGGER update_apps_updated_at BEFORE UPDATE ON control_room.apps
  FOR EACH ROW EXECUTE FUNCTION control_room.update_updated_at_column();

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

-- Client Transactions Table
CREATE TABLE IF NOT EXISTS public.client_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_org_id UUID NOT NULL REFERENCES public.client_organizations(id) ON DELETE CASCADE,
    client_reference VARCHAR(255) NOT NULL,
    internal_reference VARCHAR(255) NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    service_provider VARCHAR(50) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'NGN',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    customer_email VARCHAR(255),
    recipient_account VARCHAR(20),
    recipient_bank_code VARCHAR(10),
    recipient_name VARCHAR(255),
    metadata JSONB,
    client_ip VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(client_org_id, client_reference)
);

-- Client Usage Logs
CREATE TABLE IF NOT EXISTS public.client_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_org_id UUID NOT NULL REFERENCES public.client_organizations(id) ON DELETE CASCADE,
    api_key_id UUID REFERENCES public.client_api_keys(id) ON DELETE SET NULL,
    request_id UUID NOT NULL DEFAULT gen_random_uuid(),
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    status_code INTEGER NOT NULL,
    processing_time_ms INTEGER NOT NULL,
    response_size_bytes INTEGER DEFAULT 0,
    client_ip VARCHAR(45),
    user_agent TEXT,
    billable_units INTEGER DEFAULT 1,
    cost_per_unit DECIMAL(10,4) DEFAULT 0.001,
    total_cost DECIMAL(10,4) GENERATED ALWAYS AS (billable_units * cost_per_unit) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Client Billing Records
CREATE TABLE IF NOT EXISTS public.client_billing_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_org_id UUID NOT NULL REFERENCES public.client_organizations(id) ON DELETE CASCADE,
    billing_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    billing_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    total_requests INTEGER NOT NULL DEFAULT 0,
    total_successful_requests INTEGER NOT NULL DEFAULT 0,
    total_failed_requests INTEGER NOT NULL DEFAULT 0,
    payment_requests INTEGER NOT NULL DEFAULT 0,
    transfer_requests INTEGER NOT NULL DEFAULT 0,
    total_billable_units INTEGER NOT NULL DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    paid_at TIMESTAMP WITH TIME ZONE,
    invoice_url VARCHAR(500),
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
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'client_organizations' AND policyname = 'Client organizations are viewable by service role'
  ) THEN
    CREATE POLICY "Client organizations are viewable by service role" ON public.client_organizations
        FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'client_api_keys' AND policyname = 'Client API keys are viewable by service role'
  ) THEN
    CREATE POLICY "Client API keys are viewable by service role" ON public.client_api_keys
        FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'client_transactions' AND policyname = 'Client transactions are viewable by service role'
  ) THEN
    CREATE POLICY "Client transactions are viewable by service role" ON public.client_transactions
        FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'client_usage_logs' AND policyname = 'Client usage logs are viewable by service role'
  ) THEN
    CREATE POLICY "Client usage logs are viewable by service role" ON public.client_usage_logs
        FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'client_billing_records' AND policyname = 'Client billing records are viewable by service role'
  ) THEN
    CREATE POLICY "Client billing records are viewable by service role" ON public.client_billing_records
        FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

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
    SELECT client_code INTO v_client_code
    FROM public.client_organizations
    WHERE id = p_client_org_id;
    
    IF v_client_code IS NULL THEN
        RAISE EXCEPTION 'Invalid client organization ID';
    END IF;
    
    v_key_id := 'ck_' || p_environment || '_' || v_client_code || '_' || 
                EXTRACT(epoch FROM NOW())::TEXT || '_' || 
                substr(md5(random()::text), 1, 8);
    
    v_key_secret := 'cs_' || p_environment || '_' || substr(md5(random()::text), 1, 32);
    v_key_secret_hash := crypt(v_key_secret, gen_salt('bf'));
    
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

-- Add additional apps to registry
INSERT INTO control_room.apps (id, name, description, schema_name, original_project_ref) VALUES
  ('seftec-store', 'SEFTEC Store', 'E-commerce platform', 'app_seftec', 'ptnrwrgzrsbocgxlpvhd'),
  ('saas-platform', 'SaaS Platform', 'Software as a Service platform', 'app_saas', 'nbmomsntbamfthxfdnme'),
  ('apple-store', 'Apple Store Lekki', 'Retail store management', 'app_apple', 'rsabczhfeehazuyajarx'),
  ('credit-as-a-service', 'Credit-as-a-Service', 'CaaS Platform', 'credit', NULL),
  ('mega-meal', 'Mega Meal Platform', 'Payment and Savings Platform', 'client_services', NULL),
  ('onasis-core', 'Onasis Core', 'Core infrastructure and user management', 'public', NULL)
ON CONFLICT (id) DO NOTHING;