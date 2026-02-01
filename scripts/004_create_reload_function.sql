-- Create a function to reload PostgREST schema cache
-- This allows the application to programmatically trigger a schema cache reload

create or replace function public.reload_schema_cache()
returns void
language plpgsql
security definer
as $$
begin
  -- Send notification to PostgREST to reload its schema cache
  perform pg_notify('pgrst', 'reload schema');
  
  -- Log the operation
  raise notice 'Schema cache reload notification sent at %', now();
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function public.reload_schema_cache() to authenticated;

-- Grant execute permission to service role (for API routes)
grant execute on function public.reload_schema_cache() to service_role;
