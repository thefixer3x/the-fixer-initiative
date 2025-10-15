# 🏗️ Database Project Separation Implementation Guide

## Overview

This guide will help you separate your mixed database into distinct schemas for each project type:
- **E-commerce** (`ecommerce` schema)
- **SaaS Platform** (`saas_platform` schema) 
- **Banking Services** (`banking_services` schema)
- **AI Services** (`ai_services` schema)
- **Shared Services** (`shared_services` schema)

## Current Problem

You have **69 tables** all mixed in the `public` schema, making it impossible to distinguish between:
- E-commerce project data (orders, products, payments)
- SaaS platform data (user management, subscriptions, API keys)
- Banking services data (financial transactions, credit, savings)

## Solution: Schema-Based Separation

### Phase 1: Pre-Migration Analysis

Before running the migration, analyze your current foreign key relationships:

```sql
-- Get all foreign key relationships
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public';
```

### Phase 2: Backup and Test

1. **Create a full backup**:
   ```bash
   supabase db dump --file backup_before_separation.sql
   ```

2. **Test in staging environment** first

3. **Notify users** of maintenance window

### Phase 3: Execute Migration

Run the migration script:
```bash
supabase db push --file schema_separation_migration.sql
```

### Phase 4: Update Application Code

After migration, update your application code to reference new schema locations:

#### Before (Mixed in public schema):
```javascript
// Old references
const orders = await supabase.from('orders').select('*');
const users = await supabase.from('users').select('*');
const beneficiaries = await supabase.from('beneficiaries').select('*');
```

#### After (Separated schemas):
```javascript
// New references
const orders = await supabase.from('ecommerce.orders').select('*');
const users = await supabase.from('saas_platform.users').select('*');
const beneficiaries = await supabase.from('banking_services.beneficiaries').select('*');
```

### Phase 5: Update RLS Policies

The migration script includes RLS policy updates, but you may need to customize them:

```sql
-- Example: E-commerce specific policies
CREATE POLICY "E-commerce users can view their orders" ON ecommerce.orders
FOR SELECT USING (user_id = auth.uid());

-- Example: SaaS platform specific policies  
CREATE POLICY "SaaS users can view their profiles" ON saas_platform.profiles
FOR SELECT USING (user_id = auth.uid());

-- Example: Banking services specific policies
CREATE POLICY "Banking users can view their beneficiaries" ON banking_services.beneficiaries
FOR SELECT USING (user_id = auth.uid());
```

## Schema Organization

### 🛒 E-commerce Schema (`ecommerce`)
**Purpose**: Handle all e-commerce related functionality

**Tables**:
- `orders`, `order_items` - Order management
- `products`, `product_embeddings` - Product catalog
- `marketplace_transactions` - Marketplace transactions
- `payment_items`, `payment_audit`, `user_payments` - Payment processing
- `say_orders`, `say_bills`, `say_transfers` - Say payment system
- `stripe_connect_accounts`, `subscriptions`, `virtual_cards` - Payment providers

### 🏢 SaaS Platform Schema (`saas_platform`)
**Purpose**: Handle multi-tenant SaaS platform functionality

**Tables**:
- `company_projects`, `company_services`, `company_endpoints`, `company_usage_logs` - Company management
- `api_keys`, `vendor_api_keys`, `vendor_key_audit_log` - API management
- `organizations`, `users`, `profiles` - User and organization management
- `user_roles`, `user_sessions`, `user_tiers` - User access control
- `notification_settings`, `notifications` - Notification system
- `sessions`, `oauth_sessions` - Authentication
- `webhook_logs`, `system_error_logs`, `usage_tracking` - System monitoring

### 🏦 Banking Services Schema (`banking_services`)
**Purpose**: Handle financial and banking services

**Tables**:
- `beneficiaries`, `bulk_payments` - Payment management
- `business_financial_insights`, `business_profiles` - Business analytics
- `edoc_consents`, `edoc_financial_analysis`, `edoc_transactions`, `edoc_usage_logs` - E-document services
- `risk_analysis` - Risk assessment
- `user_consents` - User consent management
- `agent_banks_memories`, `agent_banks_memory_search_logs`, `agent_banks_sessions` - AI banking services

### 🤖 AI Services Schema (`ai_services`)
**Purpose**: Handle AI-powered features and services

**Tables**:
- `memory_entries`, `memory_access_patterns`, `memory_search_analytics` - Memory system
- `ai_recommendations`, `ai_response_cache`, `ai_usage_logs` - AI services
- `chat_conversations`, `chat_messages` - Chat system
- `imported_data`, `search_history` - Data management
- `query_classifications`, `recommendations`, `pricing_insights` - AI insights
- `topics` - Topic management

### 🔧 Shared Services Schema (`shared_services`)
**Purpose**: Handle shared functionality across all projects

**Tables**:
- `feature_flags` - Feature toggles
- `simple_users` - Basic user management

## Benefits of This Separation

### 1. **Clear Project Boundaries**
- Each project has its own dedicated schema
- No more confusion about which tables belong to which project
- Easy to identify and manage project-specific data

### 2. **Improved Security**
- Schema-level access control
- Project-specific RLS policies
- Better data isolation

### 3. **Better Performance**
- Schema-specific indexing strategies
- Reduced cross-project queries
- Better query optimization

### 4. **Easier Maintenance**
- Clear separation of concerns
- Easier to backup/restore specific projects
- Simplified development and testing

### 5. **Scalability**
- Each schema can be optimized independently
- Easier to implement project-specific features
- Better resource allocation

## Migration Checklist

- [ ] **Backup current database**
- [ ] **Test migration in staging environment**
- [ ] **Identify all foreign key relationships**
- [ ] **Update application code references**
- [ ] **Test all functionality after migration**
- [ ] **Update documentation**
- [ ] **Train team on new schema structure**

## Rollback Plan

If issues arise, you can rollback by:

1. **Restore from backup**:
   ```bash
   supabase db reset --file backup_before_separation.sql
   ```

2. **Revert application code** to use `public` schema references

3. **Notify users** of extended maintenance

## Post-Migration Tasks

1. **Update all application code** to reference new schemas
2. **Update API endpoints** to use new schema references
3. **Update documentation** with new schema structure
4. **Train development team** on new organization
5. **Monitor performance** and optimize as needed
6. **Update CI/CD pipelines** if they reference specific tables

## Next Steps

1. **Review the migration script** (`schema_separation_migration.sql`)
2. **Test in staging environment** first
3. **Schedule maintenance window** for production migration
4. **Execute migration** following the checklist above
5. **Update application code** to use new schema references

This separation will give you clear project boundaries and make it much easier to manage your different business lines!
