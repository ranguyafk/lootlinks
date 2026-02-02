-- Alter Links Table: Set Defaults and Enforce NOT NULL
-- 
-- This SQL script sets appropriate default values for the links table columns
-- and enforces NOT NULL constraints where appropriate. This helps prevent
-- insertion errors when columns are not explicitly provided.
-- 
-- To apply:
-- 1. Go to your Supabase Dashboard → SQL Editor
-- 2. Copy and paste this SQL
-- 3. Click "Run" to execute
-- 
-- IMPORTANT: Review your existing data before running this. If you have
-- existing rows with NULL values in these columns, you may need to update
-- them first or adjust the NOT NULL constraints accordingly.

-- Set default value for views column
ALTER TABLE public.links 
ALTER COLUMN views SET DEFAULT 0;

-- Set NOT NULL constraint for views (assuming no existing NULL values)
ALTER TABLE public.links 
ALTER COLUMN views SET NOT NULL;

-- Set default value for completions column
ALTER TABLE public.links 
ALTER COLUMN completions SET DEFAULT 0;

-- Set NOT NULL constraint for completions (assuming no existing NULL values)
ALTER TABLE public.links 
ALTER COLUMN completions SET NOT NULL;

-- Set default value for is_active column
ALTER TABLE public.links 
ALTER COLUMN is_active SET DEFAULT true;

-- Set NOT NULL constraint for is_active (assuming no existing NULL values)
ALTER TABLE public.links 
ALTER COLUMN is_active SET NOT NULL;

-- Set default value for ads_required column (if not already set)
ALTER TABLE public.links 
ALTER COLUMN ads_required SET DEFAULT 3;

-- Set NOT NULL constraint for ads_required (assuming no existing NULL values)
ALTER TABLE public.links 
ALTER COLUMN ads_required SET NOT NULL;

-- Add comment documenting the defaults
COMMENT ON COLUMN public.links.views IS 
'Number of times this link has been viewed. Defaults to 0.';

COMMENT ON COLUMN public.links.completions IS 
'Number of times users have completed the ad gate. Defaults to 0.';

COMMENT ON COLUMN public.links.is_active IS 
'Whether this link is active and accessible. Defaults to true.';

COMMENT ON COLUMN public.links.ads_required IS 
'Number of ads required to unlock the link. Defaults to 3.';

-- After running this, you may want to reload the PostgREST schema cache:
-- NOTIFY pgrst, 'reload schema';
