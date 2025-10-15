# Database Onboarding Guide
## Adding New Applications to the DISRUPTOR Ecosystem

**Version:** 1.0
**Last Updated:** October 15, 2025
**Supabase Project:** hjplkyeuycajchayuylw (DISRUPTOR)

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Step-by-Step Integration](#step-by-step-integration)
4. [Code Examples](#code-examples)
5. [Security & RLS](#security--rls)
6. [Testing & Verification](#testing--verification)
7. [Troubleshooting](#troubleshooting)

---

## Overview

The DISRUPTOR ecosystem uses a **multi-tenant, app-scoped architecture** where:
- All applications share a single Supabase project
- Data is isolated by `app_id` column
- Authentication is centralized through Supabase Auth
- Row Level Security (RLS) enforces data boundaries

### Architecture Benefits:
- ✅ Single source of truth for user identities
- ✅ Reduced infrastructure costs (one project vs many)
- ✅ Easier cross-app analytics and reporting
- ✅ Centralized security management
- ✅ Simplified billing and user management

---

## Prerequisites

Before adding a new application, ensure you have:

1. **Access to Supabase Project**
   - Project ID: `hjplkyeuycajchayuylw`
   - Admin or service role access
   - Database connection credentials

2. **Application Requirements**
   - Unique application identifier (slug format: `my-app`)
   - Application name
   - Description
   - Schema name (optional, defaults to `app_[slug]`)

3. **Development Environment**
   - Node.js v18+ with npm/pnpm
   - Supabase CLI installed
   - Git access to application repository

---

## Step-by-Step Integration

### Step 1: Register Your Application

First, register your application in the control room:

```sql
-- Connect to Supabase and run this SQL
INSERT INTO control_room.apps (
  id,
  name,
  description,
  schema_name,
  status,
  migration_status
) VALUES (
  'my-new-app',                    -- Unique app ID (slug format)
  'My New Application',             -- Display name
  'Description of your app',        -- Brief description
  'app_my_new_app',                -- Optional: dedicated schema
  'active',                         -- Status: active | inactive | maintenance
  'pending'                         -- Migration status
);
```

**Verify registration:**
```sql
SELECT * FROM control_room.apps WHERE id = 'my-new-app';
```

### Step 2: Create Application Schema (Optional)

If your app needs isolated tables (recommended for complex apps):

```sql
-- Create dedicated schema
CREATE SCHEMA IF NOT EXISTS app_my_new_app;

-- Grant permissions
GRANT USAGE ON SCHEMA app_my_new_app TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA app_my_new_app TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA app_my_new_app TO authenticated;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA app_my_new_app
  GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA app_my_new_app
  GRANT ALL ON SEQUENCES TO authenticated;
```

### Step 3: Set Up Environment Variables

In your application's `.env` or environment config:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://hjplkyeuycajchayuylw.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Your App Configuration
VITE_APP_ID=my-new-app
VITE_APP_NAME=My New Application
```

### Step 4: Initialize Supabase Client

Create a Supabase client file in your project:

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const APP_ID = import.meta.env.VITE_APP_ID

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Helper to get current app ID
export function getCurrentAppId() {
  return APP_ID
}
```

### Step 5: Create Application Tables

Create tables with `app_id` column for multi-tenancy:

```sql
-- Example: Create a tasks table for your app
CREATE TABLE IF NOT EXISTS app_my_new_app.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id TEXT NOT NULL REFERENCES control_room.apps(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_tasks_app_id ON app_my_new_app.tasks(app_id);
CREATE INDEX idx_tasks_user_id ON app_my_new_app.tasks(user_id);
CREATE INDEX idx_tasks_status ON app_my_new_app.tasks(status);

-- Enable RLS
ALTER TABLE app_my_new_app.tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (see Step 6)
```

### Step 6: Implement Row Level Security

**CRITICAL:** Always scope data by app_id and user_id:

```sql
-- Policy 1: Users can view their own tasks in their app
CREATE POLICY "Users can view own tasks"
  ON app_my_new_app.tasks
  FOR SELECT
  USING (
    app_id = 'my-new-app'
    AND user_id = (SELECT auth.uid())
  );

-- Policy 2: Users can insert tasks in their app
CREATE POLICY "Users can insert own tasks"
  ON app_my_new_app.tasks
  FOR INSERT
  WITH CHECK (
    app_id = 'my-new-app'
    AND user_id = (SELECT auth.uid())
  );

-- Policy 3: Users can update their own tasks
CREATE POLICY "Users can update own tasks"
  ON app_my_new_app.tasks
  FOR UPDATE
  USING (
    app_id = 'my-new-app'
    AND user_id = (SELECT auth.uid())
  )
  WITH CHECK (
    app_id = 'my-new-app'
    AND user_id = (SELECT auth.uid())
  );

-- Policy 4: Users can delete their own tasks
CREATE POLICY "Users can delete own tasks"
  ON app_my_new_app.tasks
  FOR DELETE
  USING (
    app_id = 'my-new-app'
    AND user_id = (SELECT auth.uid())
  );
```

### Step 7: Implement Authentication

Use centralized Supabase authentication:

```typescript
// src/lib/auth.ts
import { supabase, APP_ID } from './supabase'

export async function signUp(email: string, password: string, userData?: any) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        app_id: APP_ID,
        ...userData,
      },
    },
  })

  if (error) throw error

  // Profile will be auto-created by trigger
  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error

  // Verify user belongs to this app
  const { data: profile } = await supabase
    .from('profiles')
    .select('app_id')
    .eq('id', data.user.id)
    .single()

  if (profile?.app_id !== APP_ID) {
    await supabase.auth.signOut()
    throw new Error('User does not belong to this application')
  }

  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}
```

### Step 8: Implement Data Access Patterns

**Always scope queries by app_id:**

```typescript
// src/lib/database.ts
import { supabase, APP_ID } from './supabase'

// Example: Get user's tasks
export async function getUserTasks(userId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('app_id', APP_ID)  // CRITICAL: Always filter by app_id
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Example: Create a task
export async function createTask(userId: string, taskData: any) {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      app_id: APP_ID,  // CRITICAL: Always set app_id
      user_id: userId,
      ...taskData,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Example: Update a task
export async function updateTask(taskId: string, updates: any) {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .eq('app_id', APP_ID)  // CRITICAL: Verify app_id
    .select()
    .single()

  if (error) throw error
  return data
}

// Example: Delete a task
export async function deleteTask(taskId: string) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('app_id', APP_ID)  // CRITICAL: Verify app_id

  if (error) throw error
}
```

---

## Code Examples

### React Authentication Hook

```typescript
// src/hooks/useAuth.ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}
```

### Protected Route Component

```typescript
// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
```

### Profile Management

```typescript
// src/lib/profile.ts
import { supabase } from './supabase'

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}

export async function updateProfile(userId: string, updates: any) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}
```

---

## Security & RLS

### Best Practices

1. **Always Enable RLS**
   ```sql
   ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
   ```

2. **Always Scope by app_id**
   ```sql
   WHERE app_id = 'your-app-id'
   ```

3. **Use SELECT wrapper for auth functions**
   ```sql
   -- Good
   WHERE user_id = (SELECT auth.uid())

   -- Bad (re-evaluates on every row)
   WHERE user_id = auth.uid()
   ```

4. **Test RLS Policies**
   ```sql
   -- Set test user context
   SET LOCAL role = 'authenticated';
   SET LOCAL request.jwt.claims = '{"sub": "user-id-here"}';

   -- Run your queries
   SELECT * FROM your_table;
   ```

5. **Separate Policies by Operation**
   - Don't use `FOR ALL` - split into SELECT, INSERT, UPDATE, DELETE

### RLS Policy Template

```sql
-- Template for app-scoped table
CREATE POLICY "policy_name"
  ON schema.table_name
  FOR SELECT | INSERT | UPDATE | DELETE
  USING (
    app_id = 'your-app-id'
    AND user_id = (SELECT auth.uid())
    -- Add additional conditions here
  )
  WITH CHECK (  -- For INSERT and UPDATE only
    app_id = 'your-app-id'
    AND user_id = (SELECT auth.uid())
    -- Add additional conditions here
  );
```

---

## Testing & Verification

### Pre-Deployment Checklist

- [ ] App registered in `control_room.apps`
- [ ] Environment variables configured
- [ ] Database schema created (if needed)
- [ ] All tables have `app_id` column
- [ ] RLS enabled on all tables
- [ ] RLS policies created and tested
- [ ] Auth flow implemented and tested
- [ ] Data access patterns include `app_id` filter
- [ ] No hardcoded app IDs in code
- [ ] User profile creation works
- [ ] Cross-app data isolation verified

### Verification Queries

```sql
-- 1. Verify app registration
SELECT * FROM control_room.apps WHERE id = 'my-new-app';

-- 2. Check RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'app_my_new_app'
AND rowsecurity = false;  -- Should return no rows

-- 3. List all policies
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'app_my_new_app'
ORDER BY tablename, cmd;

-- 4. Verify indexes exist
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'app_my_new_app'
AND indexname LIKE '%app_id%';

-- 5. Check for users in your app
SELECT COUNT(*) as user_count
FROM public.profiles
WHERE app_id = 'my-new-app';
```

### Testing Data Isolation

```typescript
// Test cross-app data isolation
async function testDataIsolation() {
  // Create test user and data
  const { data: user1 } = await supabase.auth.signUp({
    email: 'test1@app1.com',
    password: 'password123',
  })

  // Try to access data from different app
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('app_id', 'different-app')  // Should be blocked by RLS

  console.assert(data.length === 0, 'Cross-app data leak detected!')
}
```

---

## Troubleshooting

### Common Issues

#### Issue 1: "Row Level Security Policy Violation"

**Cause:** Missing or incorrect RLS policy

**Solution:**
```sql
-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Verify app_id matches
SELECT app_id FROM your_table WHERE id = 'record-id';
```

#### Issue 2: "User does not exist in profiles"

**Cause:** Profile creation trigger not working

**Solution:**
```sql
-- Manually create profile
INSERT INTO public.profiles (id, app_id, email)
VALUES ('user-id', 'your-app-id', 'user@email.com');

-- Verify trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

#### Issue 3: "Cannot read data from other apps"

**Cause:** This is expected behavior! Data is isolated by app_id.

**Solution:** If you need cross-app access, use service role queries or create specific policies.

#### Issue 4: "Slow query performance"

**Cause:** Missing indexes on app_id or user_id

**Solution:**
```sql
-- Add indexes
CREATE INDEX IF NOT EXISTS idx_table_app_id ON your_schema.your_table(app_id);
CREATE INDEX IF NOT EXISTS idx_table_user_id ON your_schema.your_table(user_id);
```

#### Issue 5: "Auth state not persisting"

**Cause:** Supabase client not configured for session persistence

**Solution:**
```typescript
export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,  // Enable this
    autoRefreshToken: true,
  },
})
```

---

## Support & Resources

### Documentation
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Project DISRUPTOR Status](./PROJECT_DISRUPTOR_EXECUTION_STATUS.md)

### Getting Help
1. Check this guide first
2. Review existing app implementations
3. Check Supabase documentation
4. Contact DevOps team

### Maintenance
- Review RLS policies quarterly
- Monitor query performance
- Update indexes as data grows
- Keep Supabase client libraries updated

---

**Document Version:** 1.0
**Last Updated:** October 15, 2025
**Maintained By:** DevOps Team
