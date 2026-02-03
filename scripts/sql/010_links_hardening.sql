-- Function: generate unique slug
-- Note: There's a small race condition window between the uniqueness check and return.
-- The unique constraint on links.slug will catch any collisions at insert time,
-- and the application layer has retry logic to handle 23505 (unique violation) errors.
create or replace function public.generate_unique_slug(len int default 8)
returns text
language plpgsql
as $$
declare
  chars constant text := 'abcdefghijklmnopqrstuvwxyz0123456789';
  v_slug text;
begin
  loop
    select string_agg(substr(chars, 1 + floor(random() * length(chars))::int, 1), '')
      into v_slug
    from generate_series(1, len);
    exit when not exists (select 1 from public.links where slug = v_slug);
  end loop;
  return v_slug;
end;
$$;

-- Ensure constraints/defaults on links
alter table public.links
  alter column slug set not null,
  alter column dest_url set not null,
  alter column ads_required set default 3,
  alter column views set default 0,
  alter column completions set default 0,
  alter column is_active set default true,
  alter column created_at set default timezone('utc', now());

-- Ads must be between 1 and 5
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'links_ads_required_range_chk'
  ) then
    alter table public.links
      add constraint links_ads_required_range_chk
      check (ads_required between 1 and 5);
  end if;
end$$;

-- Slug uniqueness index (if not already present)
do $$
begin
  if not exists (
    select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where c.relkind = 'i' and c.relname = 'links_slug_key'
  ) then
    alter table public.links add constraint links_slug_key unique (slug);
  end if;
end$$;

-- Use DB-generated slug by default
alter table public.links
  alter column slug set default public.generate_unique_slug(8);
