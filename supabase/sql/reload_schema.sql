-- Manual Schema Cache Reload
-- 
-- Use this SQL command to manually reload PostgREST's schema cache.
-- This is useful when you encounter PGRST204 errors or after making schema changes.
-- 
-- To apply:
-- 1. Go to your Supabase Dashboard → SQL Editor
-- 2. Copy and paste this SQL
-- 3. Click "Run" to execute
-- 
-- This will immediately notify PostgREST to refresh its cache.

-- Send notification to PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

-- Note: You should see a success message after running this.
-- PostgREST will reload its cache within a few seconds.
