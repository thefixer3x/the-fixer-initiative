# Database Reorganization Guide
## DISRUPTOR Ecosystem - Supabase Database Restructuring

**Version:** 1.0
**Created:** December 22, 2025
**Status:** Planning Phase
**Project ID:** hjplkyeuycajchayuylw (Supabase)
**Reference:** Neon DB structure at `ep-snowy-surf-adqqsawd-pooler.c-2.us-east-1.aws.neon.tech`

---

## Executive Summary

This guide outlines the phased approach to reorganize the Supabase database from a flat `public` schema (95+ tables) into a professional, domain-driven schema architecture. The reorganization uses **facade views** to maintain backward compatibility with all existing platforms (MCP, REST API, SDK, CLI, IDE extensions, web applications).

### Key Principles

1. **Zero Breaking Changes** - All existing `public.table_name` queries continue to work
2. **Gradual Migration** - Move one domain at a time over weeks/months
3. **Facade Pattern** - Views in `public` redirect to organized schemas
4. **Professional Structure** - Mirror the Neon database organization

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Target Architecture](#target-architecture)
3. [Migration Strategy](#migration-strategy)
4. [Phase 1: Schema Creation](#phase-1-schema-creation)
5. [Phase 2: Security Service Migration](#phase-2-security-service-migration)
6. [Phase 3: Memory Service Migration](#phase-3-memory-service-migration)
7. [Phase 4: Auth Gateway Migration](#phase-4-auth-gateway-migration)
8. [Phase 5: Remaining Domains](#phase-5-remaining-domains)
9. [Facade View Implementation](#facade-view-implementation)
10. [RLS Policy Migration](#rls-policy-migration)
11. [Testing & Validation](#testing--validation)
12. [Rollback Procedures](#rollback-procedures)
13. [GitHub Issues Tracking](#github-issues-tracking)

---

## Current State Analysis

### Problem Statement

The current Supabase database has grown organically with:
- **95+ tables** dumped in `public` schema
- **Duplicate tables** (e.g., `api_keys`, `stored_api_keys`, `vendor_api_keys`, `vendor_api_keys_v2`)
- **Mixed concerns** (memory, payments, auth, analytics all co-located)
- **Unclear ownership** (which tables belong to which service?)
- **Difficult maintenance** (hard to reason about dependencies)

### Current Table Distribution

| Domain | Table Count | Location | Issues |
|--------|-------------|----------|--------|
| API Keys & Secrets | 14 | `public`, `maas` | 4 different API key tables, fragmented |
| Memory/Knowledge | 10 | `public`, `maas` | Duplicated across schemas |
| Auth & Identity | 9 | `public`, `maas` | Multiple user tables |
| Analytics & Logs | 9 | `public`, `maas`, `core` | Scattered everywhere |
| Payments & Billing | 9 | `public` | Mixed with vendor billing |
| Business/Finance | 7 | `public` | `edoc_*` and `business_*` mixed |
| User Settings | 8 | `public` | Reasonable |
| Marketplace | 7 | `public` | Clean domain |
| MCP Tools | 6 | `public` | Part of API keys domain |
| Vendor Management | 4 | `public` | Needs isolation |

### Existing Facade Pattern (Already Working)

The database already has a working facade pattern for API keys:

```sql
-- Facade view in public
CREATE VIEW public.api_keys_compat AS
SELECT
    id,
    created_by AS user_id,
    name,
    NULL::text AS key,
    'all'::text AS service,
    (status::text = 'active'::text) AS is_active,
    created_at,
    expires_at,
    access_level,
    organization_id,
    project_id
FROM stored_api_keys k;
```

This pattern will be extended to all migrated tables.

---

## Target Architecture

### Schema Structure (Aligned with Neon)

```
supabase/
├── auth                        # Supabase managed (DO NOT TOUCH)
├── storage                     # Supabase managed (DO NOT TOUCH)
├── realtime                    # Supabase managed (DO NOT TOUCH)
│
├── public                      # FACADE LAYER - Views only (eventually)
│   ├── memory_entries          # → VIEW to security_service.memory_entries
│   ├── memory_chunks           # → VIEW to security_service.memory_chunks
│   ├── api_keys                # → VIEW to security_service.api_keys
│   ├── users                   # → VIEW to auth_gateway.user_accounts
│   └── ...                     # All tables become views
│
├── security_service            # API Keys, Secrets, MCP Tools
│   ├── api_keys                # Consolidated API key table
│   ├── api_key_projects
│   ├── key_rotation_policies
│   ├── key_security_events
│   ├── key_usage_analytics
│   ├── stored_api_keys         # Third-party API keys
│   ├── mcp_key_tools
│   ├── mcp_key_sessions
│   ├── mcp_key_access_requests
│   ├── mcp_key_audit_log
│   ├── mcp_proxy_tokens
│   ├── memory_entries          # Memory with embeddings
│   ├── memory_chunks
│   ├── memory_versions
│   ├── organizations
│   ├── topics
│   └── users                   # Synced from auth.users
│
├── auth_gateway                # Authentication & Authorization
│   ├── user_accounts           # Primary user table
│   ├── sessions
│   ├── oauth_sessions
│   ├── oauth_clients
│   ├── oauth_tokens
│   ├── oauth_authorization_codes
│   ├── auth_events             # Event sourcing
│   ├── auth_codes
│   ├── audit_log
│   ├── admin_sessions
│   ├── admin_access_log
│   └── outbox                  # Event outbox pattern
│
├── shared_services             # Cross-cutting concerns
│   ├── profiles                # User profiles (public-facing)
│   ├── settings                # User settings
│   └── users                   # Minimal user reference
│
├── analytics                   # All logging & metrics
│   ├── usage_tracking
│   ├── user_activity_logs
│   ├── ai_usage_logs
│   ├── system_error_logs
│   ├── webhook_logs
│   ├── search_analytics
│   └── company_usage_logs
│
├── billing                     # Payments & Subscriptions
│   ├── subscriptions
│   ├── stripe_connect_accounts
│   ├── bulk_payments
│   ├── payment_items
│   ├── payment_audit
│   ├── beneficiaries
│   ├── user_payments
│   └── vendor_billing_records
│
├── vendors                     # Vendor/Platform Management
│   ├── organizations
│   ├── api_keys                # Vendor-specific keys
│   ├── platform_sessions
│   ├── usage_logs
│   └── billing_records
│
├── marketplace                 # E-commerce Features
│   ├── products
│   ├── orders
│   ├── order_items
│   ├── transactions
│   ├── pricing_insights
│   ├── recommendations
│   └── product_embeddings
│
├── client_services             # Client/Customer Management
│   ├── organizations
│   ├── api_keys
│   ├── transactions
│   ├── usage_logs
│   └── billing_records
│
├── control_room                # Admin Cockpit
│   ├── apps                    # Registered applications
│   ├── project_stages
│   ├── project_audit_log
│   └── system_health
│
└── app_*                       # Per-application schemas
    ├── app_the_fixer_initiative
    ├── app_onasis_core
    ├── app_lanonasis_maas
    ├── app_seftec
    ├── app_seftechub
    └── ...
```

---

## Migration Strategy

### The Facade Approach

Instead of updating all client applications, we:

1. **Move the table** to the proper schema
2. **Create a view** in `public` with the original name
3. **Add INSTEAD OF triggers** for write operations
4. **Migrate RLS policies** to the new location

```
BEFORE:
Client → public.memory_entries (TABLE)

AFTER:
Client → public.memory_entries (VIEW) → security_service.memory_entries (TABLE)
         [Transparent redirect]          [Actual data storage]
```

### Benefits

- **Zero client-side changes** - All existing queries work unchanged
- **Gradual migration** - Move one table at a time
- **Easy rollback** - Just drop the view and rename the table back
- **Clear separation** - New code can use the proper schema directly

---

## Phase 1: Schema Creation

**Priority:** High
**Risk:** None
**Duration:** 1 day
**Dependencies:** None

### Objective

Create all target schemas without moving any data.

### SQL Migration

```sql
-- Phase 1: Create Schema Structure
-- This is safe and non-breaking

-- Core service schemas
CREATE SCHEMA IF NOT EXISTS security_service;
CREATE SCHEMA IF NOT EXISTS auth_gateway;
CREATE SCHEMA IF NOT EXISTS shared_services;
CREATE SCHEMA IF NOT EXISTS control_room;
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS billing;
CREATE SCHEMA IF NOT EXISTS vendors;
CREATE SCHEMA IF NOT EXISTS client_services;
CREATE SCHEMA IF NOT EXISTS marketplace;

-- Application-specific schemas
CREATE SCHEMA IF NOT EXISTS app_the_fixer_initiative;
CREATE SCHEMA IF NOT EXISTS app_onasis_core;
CREATE SCHEMA IF NOT EXISTS app_lanonasis_maas;
CREATE SCHEMA IF NOT EXISTS app_seftec;
CREATE SCHEMA IF NOT EXISTS app_seftechub;
CREATE SCHEMA IF NOT EXISTS app_vortexcore;
CREATE SCHEMA IF NOT EXISTS app_mcp_monorepo;

-- Grant permissions to authenticated users
DO $$
DECLARE
    schema_name TEXT;
BEGIN
    FOR schema_name IN
        SELECT unnest(ARRAY[
            'security_service', 'auth_gateway', 'shared_services',
            'control_room', 'analytics', 'billing', 'vendors',
            'client_services', 'marketplace'
        ])
    LOOP
        EXECUTE format('GRANT USAGE ON SCHEMA %I TO authenticated', schema_name);
        EXECUTE format('GRANT USAGE ON SCHEMA %I TO service_role', schema_name);
        EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT ALL ON TABLES TO authenticated', schema_name);
        EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT ALL ON SEQUENCES TO authenticated', schema_name);
    END LOOP;
END $$;

-- Add comment for documentation
COMMENT ON SCHEMA security_service IS 'API keys, secrets, memory service, MCP tools';
COMMENT ON SCHEMA auth_gateway IS 'Authentication, authorization, OAuth, sessions';
COMMENT ON SCHEMA shared_services IS 'Cross-cutting: profiles, settings';
COMMENT ON SCHEMA control_room IS 'Admin cockpit, app registry, system health';
COMMENT ON SCHEMA analytics IS 'Usage tracking, logs, metrics';
COMMENT ON SCHEMA billing IS 'Payments, subscriptions, invoicing';
COMMENT ON SCHEMA vendors IS 'Vendor/platform management';
COMMENT ON SCHEMA client_services IS 'Client organizations and their resources';
COMMENT ON SCHEMA marketplace IS 'E-commerce: products, orders, transactions';
```

### Verification

```sql
-- Verify schemas created
SELECT nspname, pg_catalog.obj_description(oid, 'pg_namespace') as description
FROM pg_namespace
WHERE nspname NOT LIKE 'pg_%'
  AND nspname NOT IN ('information_schema', 'auth', 'storage', 'realtime', 'graphql', 'graphql_public', 'supabase_migrations', 'supabase_functions', 'extensions', 'vault', 'pgsodium', 'pgsodium_masks')
ORDER BY nspname;
```

---

## Phase 2: Security Service Migration

**Priority:** High
**Risk:** Medium
**Duration:** 3-5 days
**Dependencies:** Phase 1

### Objective

Migrate all API key and memory-related tables to `security_service` schema.

### Tables to Migrate

| Current Location | Target Location | Has Data? |
|-----------------|-----------------|-----------|
| `public.stored_api_keys` | `security_service.stored_api_keys` | Yes |
| `public.api_key_projects` | `security_service.api_key_projects` | No |
| `public.key_rotation_policies` | `security_service.key_rotation_policies` | No |
| `public.key_security_events` | `security_service.key_security_events` | No |
| `public.key_usage_analytics` | `security_service.key_usage_analytics` | No |
| `public.mcp_key_tools` | `security_service.mcp_key_tools` | No |
| `public.mcp_key_sessions` | `security_service.mcp_key_sessions` | No |
| `public.mcp_key_access_requests` | `security_service.mcp_key_access_requests` | No |
| `public.mcp_key_audit_log` | `security_service.mcp_key_audit_log` | No |
| `public.mcp_proxy_tokens` | `security_service.mcp_proxy_tokens` | No |
| `public.memory_entries` | `security_service.memory_entries` | Yes (95 rows) |
| `public.memory_chunks` | `security_service.memory_chunks` | Yes |
| `public.memory_versions` | `security_service.memory_versions` | Yes |
| `public.memory_access_patterns` | `security_service.memory_access_patterns` | No |
| `public.memory_search_analytics` | `security_service.memory_search_analytics` | No |

### Migration Template per Table

```sql
-- Template: Migrate table with facade view
-- Replace {table_name} with actual table name

-- Step 1: Move table to new schema
ALTER TABLE public.{table_name} SET SCHEMA security_service;

-- Step 2: Create facade view in public
CREATE OR REPLACE VIEW public.{table_name} AS
SELECT * FROM security_service.{table_name};

-- Step 3: Create INSTEAD OF trigger for INSERT
CREATE OR REPLACE FUNCTION public.{table_name}_insert_redirect()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'pg_catalog', 'security_service', 'public'
AS $$
BEGIN
    INSERT INTO security_service.{table_name}
    VALUES (NEW.*);
    RETURN NEW;
END;
$$;

CREATE TRIGGER {table_name}_insert_trigger
    INSTEAD OF INSERT ON public.{table_name}
    FOR EACH ROW
    EXECUTE FUNCTION public.{table_name}_insert_redirect();

-- Step 4: Create INSTEAD OF trigger for UPDATE
CREATE OR REPLACE FUNCTION public.{table_name}_update_redirect()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'pg_catalog', 'security_service', 'public'
AS $$
BEGIN
    UPDATE security_service.{table_name}
    SET -- list all columns = NEW.column
    WHERE id = OLD.id;
    RETURN NEW;
END;
$$;

CREATE TRIGGER {table_name}_update_trigger
    INSTEAD OF UPDATE ON public.{table_name}
    FOR EACH ROW
    EXECUTE FUNCTION public.{table_name}_update_redirect();

-- Step 5: Create INSTEAD OF trigger for DELETE
CREATE OR REPLACE FUNCTION public.{table_name}_delete_redirect()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'pg_catalog', 'security_service', 'public'
AS $$
BEGIN
    DELETE FROM security_service.{table_name}
    WHERE id = OLD.id;
    RETURN OLD;
END;
$$;

CREATE TRIGGER {table_name}_delete_trigger
    INSTEAD OF DELETE ON public.{table_name}
    FOR EACH ROW
    EXECUTE FUNCTION public.{table_name}_delete_redirect();

-- Step 6: Migrate RLS policies (see RLS section)
```

### Consolidate Duplicate API Key Tables

Before migrating, consolidate the duplicate tables:

| Keep | Deprecate | Reason |
|------|-----------|--------|
| `stored_api_keys` | `api_keys` | `stored_api_keys` has richer schema |
| `vendor_api_keys_v2` | `vendor_api_keys` | v2 is the updated version |

```sql
-- Create unified view for legacy api_keys queries
CREATE OR REPLACE VIEW public.api_keys AS
SELECT
    id,
    created_by AS user_id,
    name,
    encrypted_value AS key,  -- Note: Consider security implications
    key_type AS service,
    (status = 'active') AS is_active,
    created_at,
    expires_at,
    NULL::text AS key_hash,
    NULL::timestamptz AS last_used_at
FROM security_service.stored_api_keys;
```

---

## Phase 3: Memory Service Migration

**Priority:** Critical
**Risk:** High (Production Data)
**Duration:** 2-3 days
**Dependencies:** Phase 2

### Special Considerations

The memory service is used by multiple platforms:
- MCP Server
- REST API
- SDK (`@lanonasis/memory-client`)
- CLI (`@lanonasis/cli`)
- IDE Extensions (Cursor, Windsurf)
- Web Dashboard
- Enterprise VPS

**All must continue working without changes.**

### Migration Steps

```sql
-- Step 1: Create backup
CREATE TABLE security_service.memory_entries_backup AS
SELECT * FROM public.memory_entries;

-- Step 2: Move table
ALTER TABLE public.memory_entries SET SCHEMA security_service;

-- Step 3: Create facade view with all columns
CREATE OR REPLACE VIEW public.memory_entries AS
SELECT
    id,
    title,
    content,
    memory_type,
    tags,
    topic_id,
    user_id,
    organization_id,
    embedding,
    metadata,
    created_at,
    updated_at,
    last_accessed,
    access_count,
    type
FROM security_service.memory_entries;

-- Step 4: Create comprehensive INSERT trigger
CREATE OR REPLACE FUNCTION public.memory_entries_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'pg_catalog', 'security_service', 'public', 'extensions'
AS $$
BEGIN
    INSERT INTO security_service.memory_entries (
        id, title, content, memory_type, tags, topic_id,
        user_id, organization_id, embedding, metadata,
        created_at, updated_at, last_accessed, access_count, type
    ) VALUES (
        COALESCE(NEW.id, extensions.uuid_generate_v4()),
        NEW.title,
        NEW.content,
        COALESCE(NEW.memory_type, 'context'),
        COALESCE(NEW.tags, '{}'),
        NEW.topic_id,
        NEW.user_id,
        NEW.organization_id,
        NEW.embedding,
        COALESCE(NEW.metadata, '{}'),
        COALESCE(NEW.created_at, now()),
        COALESCE(NEW.updated_at, now()),
        NEW.last_accessed,
        COALESCE(NEW.access_count, 0),
        COALESCE(NEW.type, 'context')
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER memory_entries_insert_trigger
    INSTEAD OF INSERT ON public.memory_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.memory_entries_insert();

-- Step 5: Create UPDATE trigger
CREATE OR REPLACE FUNCTION public.memory_entries_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'pg_catalog', 'security_service', 'public'
AS $$
BEGIN
    UPDATE security_service.memory_entries SET
        title = NEW.title,
        content = NEW.content,
        memory_type = NEW.memory_type,
        tags = NEW.tags,
        topic_id = NEW.topic_id,
        user_id = NEW.user_id,
        organization_id = NEW.organization_id,
        embedding = NEW.embedding,
        metadata = NEW.metadata,
        updated_at = now(),
        last_accessed = NEW.last_accessed,
        access_count = NEW.access_count,
        type = NEW.type
    WHERE id = OLD.id;
    RETURN NEW;
END;
$$;

CREATE TRIGGER memory_entries_update_trigger
    INSTEAD OF UPDATE ON public.memory_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.memory_entries_update();

-- Step 6: Create DELETE trigger
CREATE OR REPLACE FUNCTION public.memory_entries_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'pg_catalog', 'security_service', 'public'
AS $$
BEGIN
    DELETE FROM security_service.memory_entries WHERE id = OLD.id;
    RETURN OLD;
END;
$$;

CREATE TRIGGER memory_entries_delete_trigger
    INSTEAD OF DELETE ON public.memory_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.memory_entries_delete();
```

### Migrate Vector Search Functions

```sql
-- Update match_memories to use new schema
CREATE OR REPLACE FUNCTION public.match_memories(
    query_embedding vector,
    match_threshold double precision DEFAULT 0.8,
    match_count integer DEFAULT 10,
    filter_user_id uuid DEFAULT NULL,
    distance_metric text DEFAULT 'cosine'
)
RETURNS TABLE (
    id uuid,
    title varchar,
    content text,
    memory_type memory_type,
    similarity double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'pg_catalog', 'security_service', 'public', 'extensions'
AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id,
        m.title,
        m.content,
        m.memory_type,
        1 - (m.embedding <=> query_embedding) as similarity
    FROM security_service.memory_entries m
    WHERE
        (filter_user_id IS NULL OR m.user_id = filter_user_id)
        AND 1 - (m.embedding <=> query_embedding) > match_threshold
    ORDER BY m.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
```

---

## Phase 4: Auth Gateway Migration

**Priority:** High
**Risk:** High
**Duration:** 3-5 days
**Dependencies:** Phase 1

### Tables to Migrate

| Current Location | Target Location |
|-----------------|-----------------|
| `public.auth_events` | `auth_gateway.events` |
| `public.sessions` | `auth_gateway.sessions` |
| `public.oauth_sessions` | `auth_gateway.oauth_sessions` |
| `public.user_roles` | `auth_gateway.user_roles` |
| `public.user_sessions` | `auth_gateway.user_sessions` |

### Special Handling for auth_events

The `auth_events` table uses event sourcing and has views dependent on it:

```sql
-- Views that depend on auth_events:
-- - public.auth_sessions_view
-- - public.auth_audit_view
-- - public.auth_api_keys_view
-- - public.auth_users_view

-- These views must be recreated after moving auth_events
```

---

## Phase 5: Remaining Domains

### 5.1 Analytics Migration

```sql
-- Tables to move to analytics schema
ALTER TABLE public.usage_tracking SET SCHEMA analytics;
ALTER TABLE public.user_activity_logs SET SCHEMA analytics;
ALTER TABLE public.ai_usage_logs SET SCHEMA analytics;
ALTER TABLE public.system_error_logs SET SCHEMA analytics;
ALTER TABLE public.webhook_logs SET SCHEMA analytics;
ALTER TABLE public.company_usage_logs SET SCHEMA analytics;

-- Create facade views (follow template)
```

### 5.2 Billing Migration

```sql
-- Tables to move to billing schema
ALTER TABLE public.subscriptions SET SCHEMA billing;
ALTER TABLE public.stripe_connect_accounts SET SCHEMA billing;
ALTER TABLE public.bulk_payments SET SCHEMA billing;
ALTER TABLE public.payment_items SET SCHEMA billing;
ALTER TABLE public.payment_audit SET SCHEMA billing;
ALTER TABLE public.beneficiaries SET SCHEMA billing;
ALTER TABLE public.user_payments SET SCHEMA billing;
ALTER TABLE public.vendor_billing_records SET SCHEMA billing;

-- Create facade views (follow template)
```

### 5.3 Marketplace Migration

```sql
-- Tables to move to marketplace schema
ALTER TABLE public.products SET SCHEMA marketplace;
ALTER TABLE public.orders SET SCHEMA marketplace;
ALTER TABLE public.order_items SET SCHEMA marketplace;
ALTER TABLE public.marketplace_transactions SET SCHEMA marketplace;
ALTER TABLE public.pricing_insights SET SCHEMA marketplace;
ALTER TABLE public.recommendations SET SCHEMA marketplace;
ALTER TABLE public.product_embeddings SET SCHEMA marketplace;

-- Create facade views (follow template)
```

---

## Facade View Implementation

### Complete Example: memory_entries

```sql
-- Full implementation for memory_entries facade

-- 1. The actual table (after migration)
-- Location: security_service.memory_entries

-- 2. The facade view
CREATE OR REPLACE VIEW public.memory_entries
WITH (security_invoker = on)
AS SELECT * FROM security_service.memory_entries;

-- 3. Make it writable with INSTEAD OF triggers
-- (See Phase 3 for complete triggers)

-- 4. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.memory_entries TO authenticated;
GRANT ALL ON public.memory_entries TO service_role;

-- 5. Add helpful comment
COMMENT ON VIEW public.memory_entries IS
'Facade view for backward compatibility. Actual table: security_service.memory_entries';
```

### Facade View Rules

1. **Always use `security_invoker = on`** for views (respects caller's RLS)
2. **INSTEAD OF triggers must be SECURITY DEFINER** to write to the target table
3. **Set explicit search_path** in all trigger functions
4. **Handle all columns** including defaults and NULLs
5. **Test all CRUD operations** before deploying

---

## RLS Policy Migration

When moving tables, RLS policies must be recreated on the new location.

### Template

```sql
-- Step 1: Document existing policies
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'memory_entries' AND schemaname = 'public';

-- Step 2: After moving table, recreate policies
CREATE POLICY "policy_name"
    ON security_service.memory_entries
    FOR SELECT
    TO authenticated
    USING (user_id = (SELECT auth.uid()));

-- Step 3: Drop old policies (they're gone with the table move)
-- No action needed - policies move with the table
```

### Important: Views Don't Have RLS

Views themselves don't have RLS policies. With `security_invoker = on`, the RLS of the underlying table is enforced for the calling user.

---

## Testing & Validation

### Pre-Migration Checklist

- [ ] Backup all tables being migrated
- [ ] Document current row counts
- [ ] List all dependent views and functions
- [ ] Identify all client applications using the table
- [ ] Prepare rollback scripts

### Post-Migration Validation

```sql
-- 1. Verify row counts match
SELECT
    'Before' as state,
    (SELECT COUNT(*) FROM security_service.memory_entries_backup) as count
UNION ALL
SELECT
    'After' as state,
    (SELECT COUNT(*) FROM security_service.memory_entries) as count;

-- 2. Test SELECT through facade
SELECT * FROM public.memory_entries LIMIT 5;

-- 3. Test INSERT through facade
INSERT INTO public.memory_entries (title, content, user_id, organization_id, type)
VALUES ('Test', 'Test content', auth.uid(), 'org-id', 'context')
RETURNING *;

-- 4. Test UPDATE through facade
UPDATE public.memory_entries SET title = 'Updated' WHERE id = 'test-id';

-- 5. Test DELETE through facade
DELETE FROM public.memory_entries WHERE id = 'test-id';

-- 6. Test vector search still works
SELECT * FROM public.match_memories(
    '[0.1, 0.2, ...]'::vector,
    0.7,
    5
);
```

### Platform-Specific Testing

| Platform | Test Method |
|----------|-------------|
| MCP Server | Run `memory_search` tool |
| REST API | `curl` to `/rest/v1/memory_entries` |
| SDK | Run unit tests |
| CLI | `lanonasis memory search "test"` |
| Web Dashboard | Manual CRUD operations |
| IDE Extension | Create/search memory |

---

## Rollback Procedures

### Quick Rollback (Per Table)

```sql
-- If something goes wrong, rollback immediately:

-- 1. Drop the facade view
DROP VIEW IF EXISTS public.memory_entries CASCADE;

-- 2. Move table back to public
ALTER TABLE security_service.memory_entries SET SCHEMA public;

-- 3. Recreate any dropped dependent objects
-- (This is why we document them first)
```

### Full Phase Rollback

```sql
-- Rollback entire phase using backup tables
DROP VIEW IF EXISTS public.memory_entries CASCADE;
DROP TABLE IF EXISTS security_service.memory_entries;
ALTER TABLE security_service.memory_entries_backup
    RENAME TO memory_entries;
ALTER TABLE security_service.memory_entries SET SCHEMA public;
```

---

## GitHub Issues Tracking

Create the following GitHub issues to track implementation:

### Epic: Database Reorganization

**Issue #1: Phase 1 - Create Schema Structure**
```markdown
## Objective
Create all target schemas without moving data.

## Tasks
- [ ] Create `security_service` schema
- [ ] Create `auth_gateway` schema
- [ ] Create `shared_services` schema
- [ ] Create `control_room` schema
- [ ] Create `analytics` schema
- [ ] Create `billing` schema
- [ ] Create `vendors` schema
- [ ] Create `client_services` schema
- [ ] Create `marketplace` schema
- [ ] Create `app_*` schemas
- [ ] Grant permissions
- [ ] Add schema comments
- [ ] Verify all schemas exist

## Acceptance Criteria
- All schemas created
- Permissions granted to `authenticated` and `service_role`
- No data moved
- All existing queries still work
```

**Issue #2: Phase 2 - Security Service Migration**
```markdown
## Objective
Migrate API key and memory tables to security_service schema.

## Tables
- [ ] stored_api_keys
- [ ] api_key_projects
- [ ] key_rotation_policies
- [ ] key_security_events
- [ ] key_usage_analytics
- [ ] mcp_key_* tables
- [ ] memory_entries
- [ ] memory_chunks
- [ ] memory_versions

## Tasks per Table
- [ ] Create backup
- [ ] Move table to security_service
- [ ] Create facade view in public
- [ ] Create INSTEAD OF triggers
- [ ] Test CRUD operations
- [ ] Verify RLS works

## Acceptance Criteria
- All tables moved
- All facade views created
- All platforms tested and working
```

**Issue #3: Phase 3 - Memory Service Validation**
```markdown
## Objective
Ensure memory service works across all platforms.

## Platforms to Test
- [ ] MCP Server
- [ ] REST API
- [ ] SDK (@lanonasis/memory-client)
- [ ] CLI (@lanonasis/cli)
- [ ] IDE Extensions
- [ ] Web Dashboard
- [ ] Enterprise VPS

## Tests per Platform
- [ ] Create memory
- [ ] Search memories (vector)
- [ ] Update memory
- [ ] Delete memory
- [ ] List memories

## Acceptance Criteria
- Zero failures across all platforms
- Performance within acceptable limits
- No client-side changes required
```

**Issue #4: Phase 4 - Auth Gateway Migration**
```markdown
## Objective
Migrate authentication tables to auth_gateway schema.

## Tables
- [ ] auth_events
- [ ] sessions
- [ ] oauth_sessions
- [ ] oauth_* tables
- [ ] user_roles
- [ ] user_sessions

## Dependent Views
- [ ] auth_sessions_view
- [ ] auth_audit_view
- [ ] auth_api_keys_view
- [ ] auth_users_view

## Tasks
- [ ] Move tables
- [ ] Recreate dependent views
- [ ] Create facade views
- [ ] Test authentication flow

## Acceptance Criteria
- Login/logout works
- Session management works
- OAuth flows work
- API key authentication works
```

**Issue #5: Phase 5 - Remaining Domains**
```markdown
## Objective
Migrate remaining tables to organized schemas.

## Domains
- [ ] Analytics (9 tables)
- [ ] Billing (8 tables)
- [ ] Marketplace (7 tables)
- [ ] Vendors (4 tables)
- [ ] Client Services (5 tables)
- [ ] User Settings (8 tables)

## Acceptance Criteria
- All tables migrated
- All facades created
- All tests passing
```

**Issue #6: Cleanup & Documentation**
```markdown
## Objective
Final cleanup and documentation update.

## Tasks
- [ ] Remove backup tables
- [ ] Update DATABASE_ONBOARDING_GUIDE.md
- [ ] Update ACCESS_PATTERNS_ARCHITECTURE.md
- [ ] Document new schema structure
- [ ] Update client SDKs documentation
- [ ] Archive old migration scripts

## Acceptance Criteria
- No orphaned objects
- All documentation updated
- Team trained on new structure
```

---

## Appendix A: Table Inventory

### Full List of Tables to Migrate

<details>
<summary>Click to expand full table list</summary>

| # | Table | Current Schema | Target Schema | Priority |
|---|-------|---------------|---------------|----------|
| 1 | memory_entries | public | security_service | P1 |
| 2 | memory_chunks | public | security_service | P1 |
| 3 | memory_versions | public | security_service | P1 |
| 4 | stored_api_keys | public | security_service | P1 |
| 5 | api_key_projects | public | security_service | P1 |
| 6 | key_rotation_policies | public | security_service | P1 |
| 7 | key_security_events | public | security_service | P1 |
| 8 | key_usage_analytics | public | security_service | P1 |
| 9 | mcp_key_tools | public | security_service | P1 |
| 10 | mcp_key_sessions | public | security_service | P1 |
| 11 | mcp_key_access_requests | public | security_service | P1 |
| 12 | mcp_key_audit_log | public | security_service | P1 |
| 13 | mcp_proxy_tokens | public | security_service | P1 |
| 14 | auth_events | public | auth_gateway | P2 |
| 15 | sessions | public | auth_gateway | P2 |
| 16 | oauth_sessions | public | auth_gateway | P2 |
| 17 | user_roles | public | auth_gateway | P2 |
| 18 | user_sessions | public | auth_gateway | P2 |
| 19 | subscriptions | public | billing | P3 |
| 20 | bulk_payments | public | billing | P3 |
| ... | ... | ... | ... | ... |

</details>

---

## Appendix B: Quick Reference

### Schema Lookup

```sql
-- Find where a table should go
SELECT
    CASE
        WHEN tablename LIKE '%memory%' THEN 'security_service'
        WHEN tablename LIKE '%api_key%' OR tablename LIKE '%key_%' THEN 'security_service'
        WHEN tablename LIKE '%mcp_%' THEN 'security_service'
        WHEN tablename LIKE '%auth%' OR tablename LIKE '%session%' OR tablename LIKE '%oauth%' THEN 'auth_gateway'
        WHEN tablename LIKE '%payment%' OR tablename LIKE '%billing%' OR tablename = 'subscriptions' THEN 'billing'
        WHEN tablename LIKE '%log%' OR tablename LIKE '%analytics%' OR tablename LIKE '%tracking%' THEN 'analytics'
        WHEN tablename LIKE '%product%' OR tablename LIKE '%order%' OR tablename = 'recommendations' THEN 'marketplace'
        WHEN tablename LIKE '%vendor%' THEN 'vendors'
        WHEN tablename LIKE '%client%' THEN 'client_services'
        WHEN tablename IN ('profiles', 'settings') THEN 'shared_services'
        ELSE 'review_needed'
    END as target_schema,
    tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY target_schema, tablename;
```

### Check Migration Status

```sql
-- See which tables have been migrated (have facade views)
SELECT
    v.viewname as facade_view,
    pg_get_viewdef(c.oid, true) as points_to
FROM pg_views v
JOIN pg_class c ON c.relname = v.viewname
WHERE v.schemaname = 'public'
  AND pg_get_viewdef(c.oid, true) LIKE '%security_service%'
     OR pg_get_viewdef(c.oid, true) LIKE '%auth_gateway%'
     OR pg_get_viewdef(c.oid, true) LIKE '%billing%';
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-22 | Claude + Onasis | Initial draft |

---

**Next Steps:**
1. Review this guide
2. Create GitHub issues for tracking
3. Schedule Phase 1 implementation
4. Begin with schema creation (safe, non-breaking)
