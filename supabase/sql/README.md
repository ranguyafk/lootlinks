# Supabase SQL Scripts

This directory contains SQL scripts for managing your Supabase database schema and configuration.

## Scripts Overview

### 1. `create_reload_function.sql`
Creates an RPC function that allows the application to programmatically reload PostgREST's schema cache.

**Purpose**: Resolve PGRST204 errors (schema cache synchronization issues) by sending a NOTIFY signal to PostgREST.

**Usage**:
1. Run this script **once** in your Supabase SQL Editor
2. After installation, your app can call it programmatically:
   ```typescript
   await supabase.rpc('reload_schema_cache')
   ```

**When to use**: 
- Initial setup (run once)
- After schema changes
- When encountering PGRST204 errors

---

### 2. `reload_schema.sql`
Manually reloads PostgREST's schema cache using a NOTIFY command.

**Purpose**: Quick manual fix for schema cache issues without creating the RPC function.

**Usage**:
1. Run this script in your Supabase SQL Editor whenever you need to reload the schema cache
2. You'll see a success message after running
3. PostgREST will reload its cache within a few seconds

**When to use**:
- After making schema changes (adding columns, tables, etc.)
- When encountering PGRST204 errors
- As an alternative to using the RPC function

---

### 3. `alter_links_defaults.sql`
Sets appropriate default values and NOT NULL constraints on the `links` table.

**Purpose**: Prevent insertion errors by ensuring columns have sensible defaults.

**What it does**:
- Sets `views` default to `0` and enforces NOT NULL
- Sets `completions` default to `0` and enforces NOT NULL
- Sets `is_active` default to `true` and enforces NOT NULL
- Sets `ads_required` default to `3` and enforces NOT NULL

**Usage**:
1. **IMPORTANT**: Review your existing data first!
2. If you have existing rows with NULL values in these columns, update them first:
   ```sql
   UPDATE public.links 
   SET views = 0 
   WHERE views IS NULL;
   
   UPDATE public.links 
   SET completions = 0 
   WHERE completions IS NULL;
   
   UPDATE public.links 
   SET is_active = true 
   WHERE is_active IS NULL;
   
   UPDATE public.links 
   SET ads_required = 3 
   WHERE ads_required IS NULL;
   ```
3. Then run the `alter_links_defaults.sql` script
4. Optionally reload the schema cache after running:
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```

**When to use**:
- Initial setup (run once)
- When setting up a new environment
- To align your database schema with application expectations

---

## Recommended Setup Order

For a new Supabase project, run these scripts in this order:

1. **`alter_links_defaults.sql`** - Set up table defaults first
2. **`create_reload_function.sql`** - Install the reload function
3. **`reload_schema.sql`** - Reload the schema cache to recognize changes
4. Review and apply policies from `../policies/links.sql` if not already configured

---

## Troubleshooting

### PGRST204 Errors
If you encounter "PGRST204" errors in your application:

1. Run `reload_schema.sql` in the SQL Editor, OR
2. Call the RPC from your app: `await supabase.rpc('reload_schema_cache')`
3. Wait a few seconds for PostgREST to reload

### Column Defaults Not Working
If links are still failing to insert with default values:

1. Verify the `alter_links_defaults.sql` script ran successfully
2. Run `reload_schema.sql` to refresh PostgREST's cache
3. Check if there are existing NULL values that need to be fixed first

### Permission Errors
If you get permission errors when running these scripts:

- Ensure you're running them as a Supabase admin/owner
- Check that your database user has sufficient privileges
- For the RPC function, ensure GRANT statements executed successfully

---

## Additional Resources

- [Supabase SQL Editor Documentation](https://supabase.com/docs/guides/database/overview)
- [PostgREST Schema Cache Documentation](https://postgrest.org/en/stable/schema_cache.html)
- [Row Level Security (RLS) Policies](../policies/links.sql)

---

## Notes

- The `create_reload_function.sql` script is safe to run multiple times (it uses `CREATE OR REPLACE`)
- The `alter_links_defaults.sql` script should only be run once per environment - running it multiple times may cause errors if constraints already exist
- Always test schema changes in a development environment first
- Back up your data before making significant schema changes
- The `reload_schema_cache` RPC function requires authentication and can be called programmatically for auto-recovery from PGRST204 errors
