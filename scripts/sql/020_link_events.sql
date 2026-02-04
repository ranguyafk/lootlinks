create table if not exists public.link_events (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references public.links(id) on delete cascade,
  slug text not null,
  ip text not null,
  user_agent text not null,
  country text not null default 'ZZ',
  is_bot boolean not null default false,
  valid boolean not null default false,
  cpm_usd numeric(6,2) not null default 0.00,
  created_at timestamptz not null default now()
);

create unique index if not exists link_events_dedupe_idx
on public.link_events (link_id, ip, user_agent, date(created_at));

create or replace function public.increment_link_completion(p_link_id uuid)
returns public.links
language plpgsql
as $$
declare
  v_link public.links;
begin
  update public.links
  set completions = completions + 1,
      views = views + 1
  where id = p_link_id
  returning * into v_link;

  return v_link;
end;
$$;
