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
CREATE TABLE control_room.apps (
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
CREATE TABLE control_room.metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  app_id TEXT REFERENCES control_room.apps(id),
  metric_type TEXT NOT NULL,
  metric_value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_metrics_app_id ON control_room.metrics(app_id);
CREATE INDEX idx_metrics_created_at ON control_room.metrics(created_at);

-- User app access tracking
CREATE TABLE control_room.user_app_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  app_id TEXT REFERENCES control_room.apps(id) NOT NULL,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('viewer', 'developer', 'admin')),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  granted_by UUID REFERENCES auth.users,
  UNIQUE(user_id, app_id)
);

-- Audit log for tracking changes
CREATE TABLE control_room.audit_log (
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
