-- Supabase RLS Policies for Links Table
-- 
-- This file contains reference policies that can be applied to the links table
-- in your Supabase project to secure data access.
-- 
-- IMPORTANT: These policies do NOT automatically execute. You must manually
-- run this SQL in your Supabase SQL Editor (or via migration scripts).
-- 
-- To apply these policies:
-- 1. Go to your Supabase Dashboard → SQL Editor
-- 2. Copy and paste the desired policies below
-- 3. Click "Run" to execute

-- ============================================================================
-- Enable Row Level Security (RLS) on the links table
-- ============================================================================

ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Policy: Allow authenticated users to insert their own links
-- ============================================================================
-- Users can only create links where the user_id matches their auth.uid()

CREATE POLICY "links_insert_own"
ON public.links
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- Policy: Allow users to update their own links
-- ============================================================================
-- Users can only update links they own (both for reading and writing)

CREATE POLICY "links_update_own"
ON public.links
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- Policy: Allow users to select their own links
-- ============================================================================
-- Users can only view links they created

CREATE POLICY "links_select_own"
ON public.links
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- ============================================================================
-- Policy: Allow public read access to active links by slug
-- ============================================================================
-- Anyone can view active links when accessing them via the gate page
-- This is needed for the /l/[slug] route to work for visitors

CREATE POLICY "links_select_active_public"
ON public.links
FOR SELECT
TO anon, authenticated
USING (is_active = true);

-- ============================================================================
-- Policy: Allow users to delete their own links
-- ============================================================================

CREATE POLICY "links_delete_own"
ON public.links
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- ============================================================================
-- Notes:
-- ============================================================================
-- 
-- 1. The "links_select_active_public" policy allows anyone (authenticated or not)
--    to read active links. This is necessary for the gate page to work when
--    visitors click on shared links.
-- 
-- 2. The view and completion increments happen server-side via API routes that
--    use the service role, so they bypass RLS. This is intentional and secure
--    as long as the API routes properly validate the link exists.
-- 
-- 3. If you want to restrict certain columns from being updated by users,
--    you can modify the update policy or add additional CHECK constraints
--    on the table itself.
-- 
-- 4. Consider adding additional policies if you implement features like:
--    - Admin users who can view all links
--    - Team/organization-level sharing
--    - Link analytics access by third parties
