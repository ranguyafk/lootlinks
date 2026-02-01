-- Create links table for storing gated links
-- 
-- NOTE: Link creation happens via the server-side API route (/api/links/create)
-- which uses the authenticated user session to insert links.
-- The RLS policies below are simplified to allow all authenticated users full access.
create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text unique not null,
  dest_url text not null,
  title text,
  ads_required integer not null default 3,
  views integer not null default 0,
  completions integer not null default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone default now()
);

-- Create index for faster slug lookups
create index if not exists links_slug_idx on public.links(slug);
create index if not exists links_user_id_idx on public.links(user_id);

-- Enable Row Level Security
alter table public.links enable row level security;

-- SIMPLIFIED POLICIES - Allow authenticated users to do everything
create policy "Allow all for authenticated users" on public.links
  for all 
  to authenticated
  using (true)
  with check (true);

-- Allow anonymous users to read links by slug (for the gate page)
create policy "Allow anonymous read by slug" on public.links
  for select
  to anon
  using (true);
