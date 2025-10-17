-- ============================================
-- PROJECT DISRUPTOR: PHASE 2 DATA RESTORATION TOOLKIT
-- ============================================
-- This file contains all SQL scripts needed for Phase 2 execution
-- Execute each section in order after backup restoration

-- ============================================
-- STEP 1: VERIFY BACKUP RESTORATION
-- ============================================

-- Run this query after importing the backup to verify data
SELECT
  'BACKUP RESTORATION VERIFICATION' as check_type,
  '---' as table_name,
  '---' as record_count;

-- Check auth.users
SELECT
  'AUTH' as check_type,
  'auth.users' as table_name,
  COUNT(*)::text as record_count
FROM auth.users
UNION ALL
SELECT
  'PROFILE',
  'public.profiles',
  COUNT(*)::text
FROM public.profiles;

-- If the backup had old table structures, check those
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
    RAISE NOTICE 'Legacy public.users table found with % records', (SELECT COUNT(*) FROM public.users);
  END IF;
END $$;

-- ============================================
-- STEP 2: USER IDENTITY CONSOLIDATION
-- ============================================

-- This script consolidates users from multiple sources into auth.users and public.profiles
-- IMPORTANT: Review and customize based on your actual backup structure

-- 2.1: If backup contains public.users, migrate to profiles
DO $$
DECLARE
  user_record RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
    -- Loop through legacy users and ensure they exist in auth.users and profiles
    FOR user_record IN SELECT * FROM public.users LOOP
      -- Check if user exists in auth.users
      IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = user_record.email) THEN
        RAISE NOTICE 'User % not in auth.users - manual intervention required', user_record.email;
      ELSE
        -- Update or insert profile
        INSERT INTO public.profiles (
          id,
          email,
          first_name,
          last_name,
          company_name,
          created_at,
          updated_at
        )
        SELECT
          au.id,
          user_record.email,
          user_record.first_name,
          user_record.last_name,
          user_record.company_name,
          user_record.created_at,
          NOW()
        FROM auth.users au
        WHERE au.email = user_record.email
        ON CONFLICT (id) DO UPDATE SET
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          company_name = EXCLUDED.company_name,
          updated_at = NOW();
      END IF;
    END LOOP;
  END IF;
END $$;

-- 2.2: Consolidate client_services.users if exists
DO $$
DECLARE
  cs_user_record RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'client_services') THEN
    FOR cs_user_record IN SELECT * FROM client_services.users LOOP
      -- Merge into profiles
      INSERT INTO public.profiles (
        id,
        email,
        first_name,
        last_name,
        created_at,
        updated_at,
        app_id
      )
      SELECT
        au.id,
        cs_user_record.email,
        cs_user_record.first_name,
        cs_user_record.last_name,
        cs_user_record.created_at,
        NOW(),
        'mega-meal' -- Default app_id for client_services users
      FROM auth.users au
      WHERE au.email = cs_user_record.email
      ON CONFLICT (id) DO UPDATE SET
        first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
        last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
        app_id = COALESCE(profiles.app_id, 'mega-meal'),
        updated_at = NOW();
    END LOOP;
  END IF;
END $$;

-- ============================================
-- STEP 3: BACKFILL app_id ON PROFILES
-- ============================================

-- 3.1: Assign app_id based on email domain
UPDATE public.profiles
SET app_id = 'vortexcore'
WHERE app_id IS NULL
  AND (
    email ILIKE '%@vortexcore%'
    OR email ILIKE '%vortex%'
  );

UPDATE public.profiles
SET app_id = 'seftec'
WHERE app_id IS NULL
  AND (
    email ILIKE '%@seftec%'
    OR company_name ILIKE '%seftec%'
  );

UPDATE public.profiles
SET app_id = 'saas'
WHERE app_id IS NULL
  AND company_name ILIKE '%saas%';

UPDATE public.profiles
SET app_id = 'apple'
WHERE app_id IS NULL
  AND (
    company_name ILIKE '%apple%'
    OR company_name ILIKE '%lekki%'
  );

-- 3.2: Handle Credit-as-a-Service users
UPDATE public.profiles
SET app_id = 'credit-as-a-service'
WHERE app_id IS NULL
  AND (
    company_name ILIKE '%credit%'
    OR email ILIKE '%caas%'
  );

-- 3.3: Default remaining users to onasis-core
UPDATE public.profiles
SET app_id = 'onasis-core'
WHERE app_id IS NULL;

-- 3.4: Verify all profiles have app_id
SELECT
  'PROFILES app_id VERIFICATION' as check,
  COUNT(*) as total_profiles,
  COUNT(app_id) as profiles_with_app_id,
  COUNT(*) - COUNT(app_id) as profiles_missing_app_id
FROM public.profiles;

-- ============================================
-- STEP 4: BACKFILL app_id ON CORE TABLES
-- ============================================

-- 4.1: Backfill client_transactions (if exists in backup)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'client_transactions'
             AND column_name = 'user_id') THEN

    -- Add app_id column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'client_transactions'
                   AND column_name = 'app_id') THEN
      ALTER TABLE public.client_transactions ADD COLUMN app_id TEXT;
    END IF;

    -- Backfill based on user's app_id
    UPDATE public.client_transactions ct
    SET app_id = p.app_id
    FROM public.profiles p
    WHERE ct.user_id = p.id
      AND ct.app_id IS NULL;

  END IF;
END $$;

-- 4.2: Template for other tables (customize based on your schema)
-- Example: orders table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'orders' AND column_name = 'app_id') THEN
      ALTER TABLE public.orders ADD COLUMN app_id TEXT;
    END IF;

    UPDATE public.orders o
    SET app_id = p.app_id
    FROM public.profiles p
    WHERE o.user_id = p.id
      AND o.app_id IS NULL;
  END IF;
END $$;

-- 4.3: Example: memory_entries table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'memory_entries') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'memory_entries' AND column_name = 'app_id') THEN
      ALTER TABLE public.memory_entries ADD COLUMN app_id TEXT;
    END IF;

    UPDATE public.memory_entries me
    SET app_id = p.app_id
    FROM public.profiles p
    WHERE me.user_id = p.id
      AND me.app_id IS NULL;
  END IF;
END $$;

-- ============================================
-- STEP 5: DATA INTEGRITY VERIFICATION
-- ============================================

-- 5.1: Check for orphaned records (records with invalid app_id)
SELECT
  'ORPHANED RECORDS CHECK' as check_type,
  'profiles with invalid app_id' as description,
  COUNT(*) as count
FROM public.profiles p
LEFT JOIN control_room.apps a ON p.app_id = a.id
WHERE p.app_id IS NOT NULL AND a.id IS NULL;

-- 5.2: Check for users without profiles
SELECT
  'ORPHANED RECORDS CHECK' as check_type,
  'auth.users without profiles' as description,
  COUNT(*) as count
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 5.3: Check for NULL app_id (should be zero if backfill completed)
SELECT
  'NULL app_id CHECK' as check_type,
  table_name,
  COUNT(*) as records_with_null_app_id
FROM (
  SELECT 'profiles' as table_name FROM public.profiles WHERE app_id IS NULL
  UNION ALL
  SELECT 'client_transactions' FROM public.client_transactions WHERE app_id IS NULL
  -- Add more tables as needed
) subq
GROUP BY table_name;

-- 5.4: Verify app_id distribution
SELECT
  'APP DISTRIBUTION' as check_type,
  p.app_id,
  a.name as app_name,
  COUNT(*) as user_count
FROM public.profiles p
JOIN control_room.apps a ON p.app_id = a.id
GROUP BY p.app_id, a.name
ORDER BY user_count DESC;

-- ============================================
-- STEP 6: CREATE AUDIT SNAPSHOT
-- ============================================

-- Create a snapshot of the migration for audit purposes
INSERT INTO control_room.audit_log (
  app_id,
  action,
  details,
  created_at
) VALUES (
  'onasis-core',
  'PHASE_2_DATA_RESTORATION_COMPLETE',
  jsonb_build_object(
    'timestamp', NOW(),
    'total_users', (SELECT COUNT(*) FROM auth.users),
    'total_profiles', (SELECT COUNT(*) FROM public.profiles),
    'profiles_with_app_id', (SELECT COUNT(*) FROM public.profiles WHERE app_id IS NOT NULL),
    'app_distribution', (
      SELECT jsonb_object_agg(app_id, user_count)
      FROM (
        SELECT app_id, COUNT(*) as user_count
        FROM public.profiles
        GROUP BY app_id
      ) dist
    )
  ),
  NOW()
);

-- ============================================
-- STEP 7: GENERATE DATA RESTORATION REPORT
-- ============================================

SELECT
  '========================================' as report_section,
  'PHASE 2 DATA RESTORATION COMPLETE' as status,
  NOW()::text as completed_at;

SELECT
  'USER METRICS' as category,
  'Total auth.users' as metric,
  COUNT(*)::text as value
FROM auth.users
UNION ALL
SELECT
  'USER METRICS',
  'Total profiles',
  COUNT(*)::text
FROM public.profiles
UNION ALL
SELECT
  'USER METRICS',
  'Profiles with app_id',
  COUNT(*)::text
FROM public.profiles WHERE app_id IS NOT NULL
UNION ALL
SELECT
  'DATA INTEGRITY',
  'Orphaned auth.users',
  COUNT(*)::text
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
UNION ALL
SELECT
  'DATA INTEGRITY',
  'Invalid app_id references',
  COUNT(*)::text
FROM public.profiles p
LEFT JOIN control_room.apps a ON p.app_id = a.id
WHERE p.app_id IS NOT NULL AND a.id IS NULL;

-- Show app distribution
SELECT
  '========================================' as divider,
  'APP DISTRIBUTION BY USER COUNT' as report,
  '' as blank
UNION ALL
SELECT
  app_id,
  a.name,
  COUNT(*)::text || ' users'
FROM public.profiles p
JOIN control_room.apps a ON p.app_id = a.id
GROUP BY app_id, a.name
ORDER BY COUNT(*) DESC;

-- ============================================
-- NOTES FOR EXECUTION
-- ============================================

/*
EXECUTION INSTRUCTIONS:

1. Import your backup file first:
   psql "$DATABASE_URL" < db_cluster-14-10-2025@02-26-55.backup

2. Run each section of this script in order:
   - STEP 1: Verify backup
   - STEP 2: Consolidate users
   - STEP 3: Backfill profiles.app_id
   - STEP 4: Backfill other tables
   - STEP 5: Verify integrity
   - STEP 6: Create audit record
   - STEP 7: Generate report

3. Review the final report and ensure:
   - No orphaned users
   - All profiles have valid app_id
   - App distribution looks correct
   - No integrity violations

4. If issues found, DO NOT proceed to Phase 3
   - Investigate and fix data issues first
   - Re-run verification queries

5. Save the final report for documentation

TROUBLESHOOTING:

If profiles missing app_id:
  - Review email patterns
  - Check company_name values
  - Manually assign app_id if needed

If orphaned users:
  - Create profiles manually
  - Investigate why profile creation failed

If invalid app_id:
  - Check control_room.apps for valid IDs
  - Update profiles to valid app_id
*/
