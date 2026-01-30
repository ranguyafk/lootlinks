-- Add missing columns to links table
alter table public.links
  add column if not exists title text,
  add column if not exists is_active boolean not null default true;

-- Update existing records to have is_active = true if not already set
update public.links set is_active = true where is_active is null;
