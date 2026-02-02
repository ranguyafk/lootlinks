-- Creates an RPC function to force PostgREST schema cache reload via supabase.rpc('reload_schema_cache')

create or replace function public.reload_schema_cache()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  perform pg_notify('pgrst', 'reload schema');
  return true;
end;
$$;

-- Allow authenticated users to call this RPC
grant execute on function public.reload_schema_cache() to authenticated;

comment on function public.reload_schema_cache() is
  'RPC to trigger PostgREST schema cache reload. Called by the API on PGRST204 errors.';
