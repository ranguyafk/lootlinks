-- Create links table for storing gated links
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

-- Policy: Users can view their own links
create policy "Users can view their own links" on public.links
  for select using (auth.uid() = user_id);

-- Policy: Users can insert their own links
create policy "Users can insert their own links" on public.links
  for insert with check (auth.uid() = user_id);

-- Policy: Users can update their own links
create policy "Users can update their own links" on public.links
  for update using (auth.uid() = user_id);

-- Policy: Users can delete their own links
create policy "Users can delete their own links" on public.links
  for delete using (auth.uid() = user_id);

-- Policy: Anyone can view links by slug (for the gate page)
create policy "Anyone can view links by slug" on public.links
  for select using (true);
