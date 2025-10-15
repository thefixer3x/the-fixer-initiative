-- Database Schema Separation Migration
-- This script separates the mixed project data into dedicated schemas

-- Phase 1: Create dedicated schemas
CREATE SCHEMA IF NOT EXISTS ecommerce;
CREATE SCHEMA IF NOT EXISTS saas_platform;
CREATE SCHEMA IF NOT EXISTS banking_services;
CREATE SCHEMA IF NOT EXISTS ai_services;
CREATE SCHEMA IF NOT EXISTS shared_services;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA ecommerce TO authenticated, anon;
GRANT USAGE ON SCHEMA saas_platform TO authenticated, anon;
GRANT USAGE ON SCHEMA banking_services TO authenticated, anon;
GRANT USAGE ON SCHEMA ai_services TO authenticated, anon;
GRANT USAGE ON SCHEMA shared_services TO authenticated, anon;

-- Phase 2: Move E-commerce Tables
ALTER TABLE public.orders SET SCHEMA ecommerce;
ALTER TABLE public.order_items SET SCHEMA ecommerce;
ALTER TABLE public.products SET SCHEMA ecommerce;
ALTER TABLE public.product_embeddings SET SCHEMA ecommerce;
ALTER TABLE public.marketplace_transactions SET SCHEMA ecommerce;
ALTER TABLE public.payment_items SET SCHEMA ecommerce;
ALTER TABLE public.payment_audit SET SCHEMA ecommerce;
ALTER TABLE public.user_payments SET SCHEMA ecommerce;
ALTER TABLE public.say_orders SET SCHEMA ecommerce;
ALTER TABLE public.say_bills SET SCHEMA ecommerce;
ALTER TABLE public.say_transfers SET SCHEMA ecommerce;
ALTER TABLE public.stripe_connect_accounts SET SCHEMA ecommerce;
ALTER TABLE public.subscriptions SET SCHEMA ecommerce;
ALTER TABLE public.virtual_cards SET SCHEMA ecommerce;

-- Phase 3: Move SaaS Platform Tables
ALTER TABLE public.company_projects SET SCHEMA saas_platform;
ALTER TABLE public.company_services SET SCHEMA saas_platform;
ALTER TABLE public.company_endpoints SET SCHEMA saas_platform;
ALTER TABLE public.company_usage_logs SET SCHEMA saas_platform;
ALTER TABLE public.api_keys SET SCHEMA saas_platform;
ALTER TABLE public.vendor_api_keys SET SCHEMA saas_platform;
ALTER TABLE public.vendor_key_audit_log SET SCHEMA saas_platform;
ALTER TABLE public.organizations SET SCHEMA saas_platform;
ALTER TABLE public.users SET SCHEMA saas_platform;
ALTER TABLE public.profiles SET SCHEMA saas_platform;
ALTER TABLE public.user_roles SET SCHEMA saas_platform;
ALTER TABLE public.user_sessions SET SCHEMA saas_platform;
ALTER TABLE public.user_tiers SET SCHEMA saas_platform;
ALTER TABLE public.user_preferences SET SCHEMA saas_platform;
ALTER TABLE public.user_activity_logs SET SCHEMA saas_platform;
ALTER TABLE public.notification_settings SET SCHEMA saas_platform;
ALTER TABLE public.notifications SET SCHEMA saas_platform;
ALTER TABLE public.sessions SET SCHEMA saas_platform;
ALTER TABLE public.oauth_sessions SET SCHEMA saas_platform;
ALTER TABLE public.webhook_logs SET SCHEMA saas_platform;
ALTER TABLE public.system_error_logs SET SCHEMA saas_platform;
ALTER TABLE public.usage_tracking SET SCHEMA saas_platform;

-- Phase 4: Move Banking Services Tables
ALTER TABLE public.beneficiaries SET SCHEMA banking_services;
ALTER TABLE public.bulk_payments SET SCHEMA banking_services;
ALTER TABLE public.business_financial_insights SET SCHEMA banking_services;
ALTER TABLE public.business_profiles SET SCHEMA banking_services;
ALTER TABLE public.edoc_consents SET SCHEMA banking_services;
ALTER TABLE public.edoc_financial_analysis SET SCHEMA banking_services;
ALTER TABLE public.edoc_transactions SET SCHEMA banking_services;
ALTER TABLE public.edoc_usage_logs SET SCHEMA banking_services;
ALTER TABLE public.risk_analysis SET SCHEMA banking_services;
ALTER TABLE public.user_consents SET SCHEMA banking_services;
ALTER TABLE public.agent_banks_memories SET SCHEMA banking_services;
ALTER TABLE public.agent_banks_memory_search_logs SET SCHEMA banking_services;
ALTER TABLE public.agent_banks_sessions SET SCHEMA banking_services;

-- Phase 5: Move AI Services Tables
ALTER TABLE public.memory_entries SET SCHEMA ai_services;
ALTER TABLE public.memory_access_patterns SET SCHEMA ai_services;
ALTER TABLE public.memory_search_analytics SET SCHEMA ai_services;
ALTER TABLE public.ai_recommendations SET SCHEMA ai_services;
ALTER TABLE public.ai_response_cache SET SCHEMA ai_services;
ALTER TABLE public.ai_usage_logs SET SCHEMA ai_services;
ALTER TABLE public.chat_conversations SET SCHEMA ai_services;
ALTER TABLE public.chat_messages SET SCHEMA ai_services;
ALTER TABLE public.imported_data SET SCHEMA ai_services;
ALTER TABLE public.search_history SET SCHEMA ai_services;
ALTER TABLE public.query_classifications SET SCHEMA ai_services;
ALTER TABLE public.recommendations SET SCHEMA ai_services;
ALTER TABLE public.pricing_insights SET SCHEMA ai_services;
ALTER TABLE public.topics SET SCHEMA ai_services;

-- Phase 6: Move Shared Services Tables
ALTER TABLE public.feature_flags SET SCHEMA shared_services;
ALTER TABLE public.simple_users SET SCHEMA shared_services;

-- Phase 7: Update Foreign Key References
-- Note: These will need to be updated based on actual foreign key relationships
-- Example updates (you'll need to identify all actual foreign keys):

-- Update orders to reference saas_platform.users
ALTER TABLE ecommerce.orders 
DROP CONSTRAINT IF EXISTS orders_user_id_fkey,
ADD CONSTRAINT orders_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES saas_platform.users(id);

-- Update order_items to reference ecommerce.orders
ALTER TABLE ecommerce.order_items 
DROP CONSTRAINT IF EXISTS order_items_order_id_fkey,
ADD CONSTRAINT order_items_order_id_fkey 
FOREIGN KEY (order_id) REFERENCES ecommerce.orders(id);

-- Update company_services to reference saas_platform.company_projects
ALTER TABLE saas_platform.company_services 
DROP CONSTRAINT IF EXISTS company_services_project_id_fkey,
ADD CONSTRAINT company_services_project_id_fkey 
FOREIGN KEY (project_id) REFERENCES saas_platform.company_projects(id);

-- Phase 8: Update RLS Policies for New Schemas
-- Enable RLS on all moved tables
ALTER TABLE ecommerce.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_platform.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_platform.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE banking_services.beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_services.memory_entries ENABLE ROW LEVEL SECURITY;

-- Create new RLS policies for each schema
-- E-commerce policies
CREATE POLICY "Users can view their own orders" ON ecommerce.orders
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view their own order items" ON ecommerce.order_items
FOR SELECT USING (order_id IN (
    SELECT id FROM ecommerce.orders WHERE user_id = auth.uid()
));

-- SaaS Platform policies
CREATE POLICY "Users can view their own profiles" ON saas_platform.profiles
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view their own organizations" ON saas_platform.organizations
FOR SELECT USING (id IN (
    SELECT organization_id FROM saas_platform.users WHERE user_id = auth.uid()
));

-- Banking Services policies
CREATE POLICY "Users can view their own beneficiaries" ON banking_services.beneficiaries
FOR SELECT USING (user_id = auth.uid());

-- AI Services policies
CREATE POLICY "Users can view their own memories" ON ai_services.memory_entries
FOR SELECT USING (user_id = auth.uid());

-- Phase 9: Create Views for Backward Compatibility (Optional)
-- Create views in public schema that reference the new schema locations
CREATE VIEW public.orders AS SELECT * FROM ecommerce.orders;
CREATE VIEW public.products AS SELECT * FROM ecommerce.products;
CREATE VIEW public.users AS SELECT * FROM saas_platform.users;
CREATE VIEW public.organizations AS SELECT * FROM saas_platform.organizations;
CREATE VIEW public.beneficiaries AS SELECT * FROM banking_services.beneficiaries;
CREATE VIEW public.memory_entries AS SELECT * FROM ai_services.memory_entries;

-- Phase 10: Update Application Code References
-- Note: After running this migration, you'll need to update your application code
-- to reference the new schema locations:
-- - ecommerce.orders instead of public.orders
-- - saas_platform.users instead of public.users
-- - banking_services.beneficiaries instead of public.beneficiaries
-- - ai_services.memory_entries instead of public.memory_entries
