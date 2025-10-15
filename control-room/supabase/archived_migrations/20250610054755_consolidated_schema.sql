-- Consolidated migration script for The Fixer Initiative
-- This script creates the complete database structure needed for the consolidated project

-- ====== Control Room Tables ======

-- Projects table to track all consolidated projects
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL, -- 'aggregation', 'ecommerce', 'saas', 'retail', etc.
    api_key UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Services table for tracking various services across projects
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Endpoints table for tracking various API endpoints
CREATE TABLE IF NOT EXISTS endpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE SET NULL,
    endpoint_id UUID REFERENCES endpoints(id) ON DELETE SET NULL,
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

-- ====== Create the safe query execution function ======
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION execute_safe_query TO authenticated;

-- ====== Enable realtime for monitoring tables ======
-- Note: This is commented out as it may not work in local Docker setup
-- ALTER PUBLICATION supabase_realtime ADD TABLE services, endpoints, usage_logs;
-- 
-- -- Ensure these tables have full replica identity for realtime
-- ALTER TABLE services REPLICA IDENTITY FULL;
-- ALTER TABLE endpoints REPLICA IDENTITY FULL;
-- ALTER TABLE usage_logs REPLICA IDENTITY FULL;

-- ====== Update triggers for timestamps ======
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables with updated_at columns
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON services
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_endpoints_updated_at
BEFORE UPDATE ON endpoints
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ====== Indexes for better performance ======
CREATE INDEX IF NOT EXISTS idx_usage_logs_project_id ON usage_logs (project_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_timestamp ON usage_logs (timestamp);
CREATE INDEX IF NOT EXISTS idx_services_project_id ON services (project_id);
CREATE INDEX IF NOT EXISTS idx_endpoints_service_id ON endpoints (service_id);

-- ====== Sample data for testing ======
-- Insert sample projects
INSERT INTO projects (id, name, description, type) VALUES
    (gen_random_uuid(), 'Vortexcore.app', 'Main aggregation platform', 'aggregation'),
    (gen_random_uuid(), 'SEFTEC Store', 'E-commerce platform', 'ecommerce'),
    (gen_random_uuid(), 'SaaS Platform', 'Software as a Service', 'saas'),
    (gen_random_uuid(), 'Apple Store Lekki', 'Retail management', 'retail')
ON CONFLICT (id) DO NOTHING;
