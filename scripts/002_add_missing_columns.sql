-- Add missing columns to links table
alter table public.links
  add column if not exists title text,
  add column if not exists is_active boolean not null default true;
