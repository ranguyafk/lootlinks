-- Force PostgREST schema cache reload
--
-- This migration addresses schema cache synchronization issues where PostgREST's
-- internal cache may not reflect the current database schema, leading to errors
-- like "Could not find the 'column_name' column of 'table_name' in the schema cache"
--
-- What this does:
-- 1. Verifies that required columns exist in the links table
-- 2. Forces PostgREST to reload its schema cache using the NOTIFY command
-- 3. Provides diagnostic output to confirm the operation
--
-- When to use:
-- - After schema changes (new tables, columns, or modifications)
-- - When experiencing "column not found in schema cache" errors
-- - When the API returns errors about missing columns that actually exist
-- - After restoring from a database backup
--
-- How it works:
-- PostgREST listens on the 'pgrst' channel for reload commands. When it receives
-- a 'reload schema' notification, it discards its cached schema and reloads it
-- from the database, ensuring all recent schema changes are recognized.
--
-- This script is idempotent and safe to run multiple times.

-- Step 1: Verify the title column exists
-- This will fail with a clear error if the column is missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'links' 
      AND column_name = 'title'
  ) THEN
    RAISE EXCEPTION 'Column "title" does not exist in public.links table. Run migration 002_add_missing_columns.sql first.';
  END IF;
  
  RAISE NOTICE 'Verification passed: title column exists in public.links';
END $$;

-- Step 2: Verify other critical columns exist
DO $$
DECLARE
  missing_columns text[] := ARRAY[]::text[];
  col text;
BEGIN
  -- Check for all expected columns
  FOREACH col IN ARRAY ARRAY['id', 'user_id', 'slug', 'dest_url', 'title', 'ads_required', 'views', 'completions', 'is_active', 'created_at']
  LOOP
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'links' 
        AND column_name = col
    ) THEN
      missing_columns := array_append(missing_columns, col);
    END IF;
  END LOOP;
  
  IF array_length(missing_columns, 1) > 0 THEN
    RAISE EXCEPTION 'Missing columns in public.links: %', array_to_string(missing_columns, ', ');
  END IF;
  
  RAISE NOTICE 'Verification passed: all required columns exist in public.links';
END $$;

-- Step 3: Force PostgREST schema cache reload
-- This sends a notification to PostgREST telling it to reload its schema cache
-- PostgREST must be configured to listen on the 'pgrst' channel (this is the default)
NOTIFY pgrst, 'reload schema';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'Schema cache reload notification sent successfully!';
  RAISE NOTICE 'PostgREST will reload its schema cache momentarily.';
  RAISE NOTICE 'This should resolve "column not found in schema cache" errors.';
  RAISE NOTICE '=================================================================';
END $$;
