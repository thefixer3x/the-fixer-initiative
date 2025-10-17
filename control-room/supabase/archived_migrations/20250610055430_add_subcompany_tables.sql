-- Migration to add sub-company tables WITHOUT modifying existing structures
-- This script only adds new tables for the sub-company integration
-- Existing tables (chat_conversations, chat_messages) remain untouched

-- ====== Sub-Company Tables ======

-- Projects table to track all consolidated projects under this sub-company
CREATE TABLE IF NOT EXISTS company_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL, -- 'aggregation', 'ecommerce', 'saas', 'retail', etc.
    api_key UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Services table for tracking various services across projects
CREATE TABLE IF NOT EXISTS company_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES company_projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Endpoints table for tracking various API endpoints
CREATE TABLE IF NOT EXISTS company_endpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES company_services(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    method TEXT NOT NULL,
    description TEXT,
    auth_required BOOLEAN NOT NULL DEFAULT true,
    rate_limit INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (service_id, path, method)
);

-- Usage logs for monitoring and billing
CREATE TABLE IF NOT EXISTS company_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES company_projects(id) ON DELETE CASCADE,
    service_id UUID REFERENCES company_services(id) ON DELETE SET NULL,
    endpoint_id UUID REFERENCES company_endpoints(id) ON DELETE SET NULL,
    user_id UUID,
    request_method TEXT,
    request_path TEXT,
    response_status INTEGER,
    execution_time_ms INTEGER,
    request_size_bytes INTEGER,
    response_size_bytes INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ====== Create the safe query execution function if it doesn't exist ======
-- Using CREATE OR REPLACE ensures we only add it if it doesn't exist
-- or update it if needed without causing errors
CREATE OR REPLACE FUNCTION execute_safe_query(query_text TEXT, query_params JSONB DEFAULT '[]')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  query_result RECORD;
  results JSONB[] := '{}';
BEGIN
  -- Only allow SELECT statements for safety
  IF NOT (TRIM(UPPER(query_text)) LIKE 'SELECT%') THEN
    RETURN jsonb_build_object('error', 'Only SELECT statements are allowed');
  END IF;
  
  -- Execute the query and collect results
  FOR query_result IN EXECUTE query_text
  LOOP
    results := array_append(results, to_jsonb(query_result));
  END LOOP;
  
  RETURN jsonb_build_object('data', to_jsonb(results));
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM);
END;
$$;

-- Grant execute permission to authenticated users if function was created
GRANT EXECUTE ON FUNCTION execute_safe_query TO authenticated;

-- ====== Update trigger function for timestamps if it doesn't exist ======
CREATE OR REPLACE FUNCTION update_company_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all new tables with updated_at columns
CREATE TRIGGER update_company_projects_updated_at
BEFORE UPDATE ON company_projects
FOR EACH ROW
EXECUTE FUNCTION update_company_updated_at_column();

CREATE TRIGGER update_company_services_updated_at
BEFORE UPDATE ON company_services
FOR EACH ROW
EXECUTE FUNCTION update_company_updated_at_column();

CREATE TRIGGER update_company_endpoints_updated_at
BEFORE UPDATE ON company_endpoints
FOR EACH ROW
EXECUTE FUNCTION update_company_updated_at_column();

-- ====== Indexes for better performance ======
CREATE INDEX IF NOT EXISTS idx_company_usage_logs_project_id ON company_usage_logs (project_id);
CREATE INDEX IF NOT EXISTS idx_company_usage_logs_timestamp ON company_usage_logs (timestamp);
CREATE INDEX IF NOT EXISTS idx_company_services_project_id ON company_services (project_id);
CREATE INDEX IF NOT EXISTS idx_company_endpoints_service_id ON company_endpoints (service_id);

-- ====== Sample data for testing ======
-- Insert sample projects (will not create duplicates due to ON CONFLICT)
INSERT INTO company_projects (name, description, type) VALUES
    ('Vortexcore.app', 'Main aggregation platform', 'aggregation'),
    ('SEFTEC Store', 'E-commerce platform', 'ecommerce'),
    ('SaaS Platform', 'Software as a Service', 'saas'),
    ('Apple Store Lekki', 'Retail management', 'retail')
ON CONFLICT (id) DO NOTHING;
