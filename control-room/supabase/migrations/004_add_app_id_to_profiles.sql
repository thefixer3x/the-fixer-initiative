
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
INSERT INTO control_room.apps (id, name, description, schema_name, original_project_ref) VALUES
  ('vortexcore', 'Vortexcore.app', 'Main aggregation platform', 'app_vortexcore', 'muyhurqfcsjqtnbozyir'),
  ('seftec-store', 'SEFTEC Store', 'E-commerce platform', 'app_seftec', 'ptnrwrgzrsbocgxlpvhd'),
  ('saas-platform', 'SaaS Platform', 'Software as a Service platform', 'app_saas', 'nbmomsntbamfthxfdnme'),
  ('apple-store', 'Apple Store Lekki', 'Retail store management', 'app_apple', 'rsabczhfeehazuyajarx'),
  ('credit-as-a-service', 'Credit-as-a-Service', 'CaaS Platform', 'credit', NULL),
  ('mega-meal', 'Mega Meal Platform', 'Payment and Savings Platform', 'client_services', NULL),
  ('onasis-core', 'Onasis Core', 'Core infrastructure and user management', 'public', NULL)
ON CONFLICT (id) DO NOTHING;
