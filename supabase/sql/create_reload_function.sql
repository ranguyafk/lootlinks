-- Create reload_schema_cache RPC function
-- 
-- This function allows the application to programmatically reload PostgREST's
-- schema cache, which can help resolve PGRST204 errors (schema cache synchronization issues).
-- 
-- To apply this function:
-- 1. Go to your Supabase Dashboard → SQL Editor
-- 2. Copy and paste this SQL
-- 3. Click "Run" to execute
-- 
-- After running this once, your application can call this RPC to reload the schema cache:
-- await supabase.rpc('reload_schema_cache')

-- Create the function to reload PostgREST schema cache
CREATE OR REPLACE FUNCTION public.reload_schema_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Send a notification to PostgREST to reload its schema cache
  NOTIFY pgrst, 'reload schema';
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.reload_schema_cache() TO authenticated;

-- Grant execute permission to anonymous users (needed for public access scenarios)
GRANT EXECUTE ON FUNCTION public.reload_schema_cache() TO anon;

-- Add a comment to document the function
COMMENT ON FUNCTION public.reload_schema_cache() IS 
'Sends a NOTIFY signal to PostgREST to reload its schema cache. Use this after schema changes or when encountering PGRST204 errors.';
