-- =================================================================
-- Supabase Row Level Security (RLS) Policies for links table
-- =================================================================
-- This file contains reference RLS policies for the links table.
-- These policies ensure that:
-- - Only authenticated users can insert links
-- - Users can only insert links with their own user_id
-- - Users can only update their own links
-- - Users can only select/view their own links
--
-- IMPORTANT: These policies do NOT execute automatically.
-- You must run this script manually in the Supabase SQL Editor.
-- =================================================================

-- =================================================================
-- Database Functions (for atomic operations)
-- =================================================================

-- Function: Atomically increment link completion count
-- This function ensures race-condition-free increments
CREATE OR REPLACE FUNCTION increment_link_completion(link_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.links
  SET completions = completions + 1
  WHERE id = link_id;
END;
$$;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION increment_link_completion(uuid) TO anon, authenticated;

-- =================================================================
-- Row Level Security Policies
-- =================================================================

-- Enable RLS on the links table
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to insert rows for themselves
-- This ensures users can only create links associated with their own user_id
CREATE POLICY "links_insert_own"
ON public.links
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy: Allow users to update their own rows
-- This ensures users can only modify links they own
CREATE POLICY "links_update_own"
ON public.links
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Policy: Allow users to select their own rows
-- This ensures users can only view links they own
CREATE POLICY "links_select_own"
ON public.links
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy: Allow public access to links by slug (for the gate page)
-- This allows unauthenticated users to view a link when they visit /l/[slug]
-- Note: This only allows reading, not modifying
CREATE POLICY "links_select_by_slug_public"
ON public.links
FOR SELECT
TO anon, authenticated
USING (true);

-- =================================================================
-- Usage Instructions:
-- =================================================================
-- 1. Copy the entire contents of this file
-- 2. Go to your Supabase Dashboard
-- 3. Navigate to: SQL Editor
-- 4. Paste the SQL and click "Run"
-- 5. Verify the policies were created successfully
--
-- To verify policies:
-- SELECT * FROM pg_policies WHERE tablename = 'links';
--
-- To verify the function was created:
-- SELECT * FROM pg_proc WHERE proname = 'increment_link_completion';
-- =================================================================

-- =================================================================
-- Additional Notes:
-- =================================================================
-- - The "links_select_by_slug_public" policy allows anyone to view
--   links, which is necessary for the ad-gating functionality to work.
-- - If you want more restrictive access, you can modify or remove
--   this policy, but note that unauthenticated users won't be able
--   to access the gate page.
-- - The increment_link_completion function uses SECURITY DEFINER to
--   bypass RLS policies, allowing atomic updates without race conditions.
-- - For more information on RLS, see:
--   https://supabase.com/docs/guides/auth/row-level-security
-- =================================================================
