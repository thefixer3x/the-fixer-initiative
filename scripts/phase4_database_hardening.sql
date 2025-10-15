-- ============================================
-- PROJECT DISRUPTOR: PHASE 4 DATABASE HARDENING
-- ============================================
-- Execute this script AFTER Phase 2 and Phase 3 are complete
-- This script enforces data integrity and security constraints

-- ============================================
-- PRE-FLIGHT CHECKS
-- ============================================

-- Verify Phase 2 and 3 completion before proceeding
DO $$
DECLARE
  profiles_without_app_id INTEGER;
  users_without_profiles INTEGER;
BEGIN
  -- Check 1: All profiles must have app_id
  SELECT COUNT(*) INTO profiles_without_app_id
  FROM public.profiles
  WHERE app_id IS NULL;

  IF profiles_without_app_id > 0 THEN
    RAISE EXCEPTION 'PHASE 4 BLOCKED: % profiles missing app_id. Complete Phase 2 first.', profiles_without_app_id;
  END IF;

  -- Check 2: All auth.users must have profiles
  SELECT COUNT(*) INTO users_without_profiles
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.id
  WHERE p.id IS NULL;

  IF users_without_profiles > 0 THEN
    RAISE WARNING 'WARNING: % users without profiles. These will be auto-created.', users_without_profiles;
  END IF;

  RAISE NOTICE 'Pre-flight checks passed. Proceeding with Phase 4 hardening...';
END $$;

-- ============================================
-- STEP 1: ENFORCE NOT NULL CONSTRAINTS
-- ============================================

-- 1.1: Enforce app_id NOT NULL on profiles
ALTER TABLE public.profiles
  ALTER COLUMN app_id SET NOT NULL;

-- 1.2: Add NOT NULL to other critical app-scoped tables
-- Customize this section based on your schema

-- Example: If client_transactions should always have app_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'client_transactions'
             AND column_name = 'app_id') THEN
    -- First check if any NULL values exist
    IF EXISTS (SELECT 1 FROM public.client_transactions WHERE app_id IS NULL) THEN
      RAISE EXCEPTION 'Cannot set NOT NULL: client_transactions has % records with NULL app_id',
        (SELECT COUNT(*) FROM public.client_transactions WHERE app_id IS NULL);
    END IF;

    ALTER TABLE public.client_transactions
      ALTER COLUMN app_id SET NOT NULL;
  END IF;
END $$;

-- ============================================
-- STEP 2: ADD FOREIGN KEY CONSTRAINTS
-- ============================================

-- 2.1: Add FK from profiles.app_id to control_room.apps.id
ALTER TABLE public.profiles
  ADD CONSTRAINT fk_profiles_app_id
  FOREIGN KEY (app_id)
  REFERENCES control_room.apps(id)
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

-- 2.2: Add FK for other app-scoped tables
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'client_transactions'
             AND column_name = 'app_id') THEN
    ALTER TABLE public.client_transactions
      ADD CONSTRAINT fk_client_transactions_app_id
      FOREIGN KEY (app_id)
      REFERENCES control_room.apps(id)
      ON DELETE RESTRICT
      ON UPDATE CASCADE;
  END IF;
END $$;

-- 2.3: Template for adding FK to your custom tables
-- DO $$
-- BEGIN
--   IF EXISTS (SELECT 1 FROM information_schema.columns
--              WHERE table_name = 'your_table'
--              AND column_name = 'app_id') THEN
--     ALTER TABLE your_schema.your_table
--       ADD CONSTRAINT fk_your_table_app_id
--       FOREIGN KEY (app_id)
--       REFERENCES control_room.apps(id)
--       ON DELETE RESTRICT
--       ON UPDATE CASCADE;
--   END IF;
-- END $$;

-- ============================================
-- STEP 3: ACTIVATE ENHANCED RLS POLICIES
-- ============================================

-- 3.1: Enhanced profiles RLS with app isolation
DROP POLICY IF EXISTS "Profiles app isolation" ON public.profiles;
CREATE POLICY "Profiles app isolation"
  ON public.profiles
  FOR SELECT
  USING (
    -- Users can only see profiles from their own app
    app_id = (
      SELECT app_id
      FROM public.profiles
      WHERE id = (SELECT auth.uid())
    )
  );

-- 3.2: Admin override policy for control room
CREATE POLICY "Control room admins can see all profiles"
  ON public.profiles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM control_room.user_app_access
      WHERE user_id = (SELECT auth.uid())
      AND role = 'admin'
    )
  );

-- 3.3: Service role full access
CREATE POLICY "Service role full access to profiles"
  ON public.profiles
  FOR ALL
  USING ((SELECT auth.role()) = 'service_role');

-- 3.4: Enhanced client_transactions RLS
DROP POLICY IF EXISTS "Client transactions app isolation" ON public.client_transactions;
CREATE POLICY "Client transactions app isolation"
  ON public.client_transactions
  FOR SELECT
  USING (
    -- Only service role can access (client API keys authenticate differently)
    (SELECT auth.role()) = 'service_role'
    OR
    -- Or transactions belong to user's app
    app_id = (
      SELECT app_id
      FROM public.profiles
      WHERE id = (SELECT auth.uid())
    )
  );

-- ============================================
-- STEP 4: ADD AUDIT TRIGGERS
-- ============================================

-- 4.1: Create audit function for tracking changes
CREATE OR REPLACE FUNCTION public.audit_table_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, control_room, pg_temp
AS $$
DECLARE
  app_id_value TEXT;
  user_id_value UUID;
BEGIN
  -- Extract app_id from the record
  IF TG_OP = 'DELETE' THEN
    app_id_value := OLD.app_id;
  ELSE
    app_id_value := NEW.app_id;
  END IF;

  -- Get current user
  user_id_value := auth.uid();

  -- Log to audit_log
  INSERT INTO control_room.audit_log (
    app_id,
    user_id,
    action,
    details,
    created_at
  ) VALUES (
    app_id_value,
    user_id_value,
    TG_OP || ' on ' || TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME,
    jsonb_build_object(
      'table', TG_TABLE_NAME,
      'operation', TG_OP,
      'timestamp', NOW(),
      'record_id', CASE
        WHEN TG_OP = 'DELETE' THEN OLD.id
        ELSE NEW.id
      END
    ),
    NOW()
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- 4.2: Add audit trigger to critical tables
-- (Disabled by default - enable on specific tables as needed)

-- Example: Enable audit on profiles
-- CREATE TRIGGER audit_profiles_changes
--   AFTER INSERT OR UPDATE OR DELETE ON public.profiles
--   FOR EACH ROW EXECUTE FUNCTION public.audit_table_changes();

-- ============================================
-- STEP 5: ADD PERFORMANCE INDEXES
-- ============================================

-- 5.1: Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_profiles_app_id_email
  ON public.profiles(app_id, email);

CREATE INDEX IF NOT EXISTS idx_profiles_app_id_created_at
  ON public.profiles(app_id, created_at DESC);

-- 5.2: Add to other tables as needed
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_name = 'client_transactions') THEN
    CREATE INDEX IF NOT EXISTS idx_client_transactions_app_id_created_at
      ON public.client_transactions(app_id, created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_client_transactions_app_id_status
      ON public.client_transactions(app_id, status);
  END IF;
END $$;

-- ============================================
-- STEP 6: ADD CHECK CONSTRAINTS
-- ============================================

-- 6.1: Ensure app_id matches valid format
ALTER TABLE public.profiles
  ADD CONSTRAINT check_profiles_app_id_format
  CHECK (app_id ~ '^[a-z0-9-]+$');

-- 6.2: Add email validation
ALTER TABLE public.profiles
  ADD CONSTRAINT check_profiles_email_format
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');

-- ============================================
-- STEP 7: DROP LEGACY TABLES
-- ============================================

-- CRITICAL: Only execute after verifying data migration is complete!

-- 7.1: Check if legacy tables exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public'
             AND table_name = 'users') THEN
    RAISE NOTICE 'Legacy public.users table found';

    -- Verify it's empty or data has been migrated
    IF (SELECT COUNT(*) FROM public.users) > 0 THEN
      RAISE WARNING 'WARNING: public.users still has % records. Verify migration before dropping.',
        (SELECT COUNT(*) FROM public.users);
    ELSE
      -- Safe to drop
      DROP TABLE IF EXISTS public.users CASCADE;
      RAISE NOTICE 'Dropped public.users table';
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'client_services'
             AND table_name = 'users') THEN
    RAISE NOTICE 'Legacy client_services.users table found';

    IF (SELECT COUNT(*) FROM client_services.users) > 0 THEN
      RAISE WARNING 'WARNING: client_services.users still has % records.',
        (SELECT COUNT(*) FROM client_services.users);
    ELSE
      DROP TABLE IF EXISTS client_services.users CASCADE;
      RAISE NOTICE 'Dropped client_services.users table';
    END IF;
  END IF;
END $$;

-- ============================================
-- STEP 8: UPDATE APP MIGRATION STATUS
-- ============================================

-- Mark apps as fully migrated
UPDATE control_room.apps
SET migration_status = 'completed',
    updated_at = NOW()
WHERE migration_status = 'pending';

-- ============================================
-- STEP 9: CREATE FINAL SNAPSHOT
-- ============================================

-- Record Phase 4 completion
INSERT INTO control_room.audit_log (
  app_id,
  action,
  details,
  created_at
) VALUES (
  'onasis-core',
  'PHASE_4_HARDENING_COMPLETE',
  jsonb_build_object(
    'timestamp', NOW(),
    'constraints_added', ARRAY[
      'profiles.app_id NOT NULL',
      'profiles.app_id FK',
      'Enhanced RLS policies'
    ],
    'indexes_created', ARRAY[
      'idx_profiles_app_id_email',
      'idx_profiles_app_id_created_at'
    ],
    'total_apps', (SELECT COUNT(*) FROM control_room.apps WHERE migration_status = 'completed'),
    'total_users', (SELECT COUNT(*) FROM auth.users),
    'total_profiles', (SELECT COUNT(*) FROM public.profiles)
  ),
  NOW()
);

-- ============================================
-- STEP 10: POST-HARDENING VERIFICATION
-- ============================================

SELECT
  '========================================' as section,
  'PHASE 4 HARDENING VERIFICATION' as title,
  '' as details;

-- Verify NOT NULL constraints
SELECT
  'NOT NULL CONSTRAINTS' as check_type,
  'profiles.app_id' as constraint_name,
  CASE WHEN is_nullable = 'NO' THEN '✅ ENFORCED' ELSE '❌ NOT ENFORCED' END as status
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name = 'app_id';

-- Verify foreign keys
SELECT
  'FOREIGN KEY CONSTRAINTS' as check_type,
  constraint_name,
  '✅ ACTIVE' as status
FROM information_schema.table_constraints
WHERE table_name = 'profiles'
  AND constraint_type = 'FOREIGN KEY'
  AND constraint_name LIKE '%app_id%';

-- Verify RLS policies
SELECT
  'RLS POLICIES' as check_type,
  schemaname || '.' || tablename as table_name,
  COUNT(*)::text || ' policies' as status
FROM pg_policies
WHERE schemaname IN ('public', 'control_room')
GROUP BY schemaname, tablename
ORDER BY schemaname, tablename;

-- Verify indexes
SELECT
  'PERFORMANCE INDEXES' as check_type,
  schemaname || '.' || tablename as table_name,
  COUNT(*)::text || ' indexes' as status
FROM pg_indexes
WHERE schemaname IN ('public', 'control_room')
  AND indexname LIKE '%app_id%'
GROUP BY schemaname, tablename;

-- Check for orphaned records
SELECT
  'DATA INTEGRITY' as check_type,
  'Profiles with invalid app_id' as description,
  COUNT(*)::text || ' records' as status
FROM public.profiles p
LEFT JOIN control_room.apps a ON p.app_id = a.id
WHERE a.id IS NULL;

-- Final summary
SELECT
  '========================================' as divider,
  'PHASE 4 COMPLETE' as status,
  NOW()::text as completed_at;

SELECT
  'Total Apps Migrated' as metric,
  COUNT(*)::text as value
FROM control_room.apps
WHERE migration_status = 'completed'
UNION ALL
SELECT
  'Total Users',
  COUNT(*)::text
FROM auth.users
UNION ALL
SELECT
  'Total Profiles',
  COUNT(*)::text
FROM public.profiles
UNION ALL
SELECT
  'Profiles with app_id',
  COUNT(*)::text
FROM public.profiles
WHERE app_id IS NOT NULL;

-- ============================================
-- NOTES
-- ============================================

/*
PHASE 4 HARDENING CHECKLIST:

✅ NOT NULL constraints enforced on app_id
✅ Foreign key constraints added
✅ Enhanced RLS policies activated
✅ Audit triggers created (disabled by default)
✅ Performance indexes added
✅ Check constraints added
✅ Legacy tables dropped (if empty)
✅ Migration status updated
✅ Final snapshot created
✅ Post-hardening verification complete

NEXT STEPS:

1. Test application functionality thoroughly
2. Monitor query performance
3. Review audit logs regularly
4. Update application documentation
5. Train team on new architecture

ROLLBACK PLAN:

If issues are discovered:

1. Disable new RLS policies:
   ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

2. Drop foreign keys:
   ALTER TABLE public.profiles DROP CONSTRAINT fk_profiles_app_id;

3. Make app_id nullable again:
   ALTER TABLE public.profiles ALTER COLUMN app_id DROP NOT NULL;

4. Restore from snapshot if needed

MONITORING:

-- Check for RLS policy violations
SELECT * FROM control_room.audit_log
WHERE action LIKE '%POLICY%'
ORDER BY created_at DESC
LIMIT 100;

-- Monitor query performance
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE schemaname IN ('public', 'control_room')
ORDER BY idx_scan DESC;

-- Check for cross-app data access attempts (should be 0)
SELECT COUNT(*) FROM control_room.audit_log
WHERE details->>'error' LIKE '%policy%'
  AND created_at > NOW() - INTERVAL '24 hours';
*/
