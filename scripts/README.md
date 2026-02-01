# Database Migration Scripts

This directory contains SQL migration scripts for setting up and maintaining the LootLinks database schema.

## Overview

The database uses Supabase (PostgreSQL) and requires proper schema setup for the application to function correctly.

## Migration Scripts

### Initial Schema

- **`001_create_links_table.sql`** - Creates the initial `links` table with all required columns
  - Creates the `links` table with columns: `id`, `user_id`, `slug`, `dest_url`, `title`, `ads_required`, `views`, `completions`, `is_active`, `created_at`
  - Sets up indexes for performance optimization
  - Configures Row Level Security (RLS) policies
  - **This script is safe to run multiple times** (uses `create table if not exists`)

### Migration Scripts

- **`002_add_missing_columns.sql`** - Adds `title` and `is_active` columns (for backward compatibility)
  - This migration is for existing databases that were created before these columns were added to the initial schema
  - Uses `add column if not exists` to safely add columns without errors if they already exist
  - **This script is safe to run multiple times**

- **`003_reload_schema_cache.sql`** - Forces PostgREST schema cache reload
  - Verifies all required columns exist in the `links` table
  - Sends `NOTIFY pgrst, 'reload schema'` command to force cache refresh
  - Resolves "column not found in schema cache" errors
  - Should be run after schema changes or when experiencing cache-related errors
  - **This script is safe to run multiple times**

## Setup Instructions

### For New Databases

If you're setting up a fresh LootLinks database:

1. Run the initial schema script:
   ```sql
   -- In your Supabase SQL Editor, run:
   scripts/001_create_links_table.sql
   ```

2. That's it! The initial schema includes all necessary columns.

### For Existing Databases

If you have an existing LootLinks database that was created before the schema updates:

1. First, ensure the initial schema is applied:
   ```sql
   -- In your Supabase SQL Editor, run:
   scripts/001_create_links_table.sql
   ```

2. Then run the migration script to add any missing columns:
   ```sql
   -- In your Supabase SQL Editor, run:
   scripts/002_add_missing_columns.sql
   ```

3. Finally, reload the schema cache to ensure PostgREST recognizes all columns:
   ```sql
   -- In your Supabase SQL Editor, run:
   scripts/003_reload_schema_cache.sql
   ```

## Running Migrations in Supabase

### Using the Supabase Dashboard

1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the contents of the migration script
6. Click **Run** or press `Ctrl+Enter` (Windows/Linux) or `Cmd+Enter` (Mac)
7. Verify the script executed successfully (check for success message)

### Using the Supabase CLI

If you have the Supabase CLI installed:

```bash
# Run a specific migration
supabase db execute --file scripts/001_create_links_table.sql

# Run all migrations in order
supabase db execute --file scripts/001_create_links_table.sql
supabase db execute --file scripts/002_add_missing_columns.sql
supabase db execute --file scripts/003_reload_schema_cache.sql
```

## Troubleshooting

### Schema Cache Issues

If you see errors like:
- `500 Internal Server Error` when creating links
- `Could not find the 'title' column of 'links' in the schema cache`
- `Column not found in schema cache`

This indicates that PostgREST's schema cache is out of sync with the actual database schema.

**Solution:** 
1. First, ensure all migrations are applied:
   ```sql
   -- Run in order:
   scripts/001_create_links_table.sql
   scripts/002_add_missing_columns.sql
   ```

2. Then force a schema cache reload:
   ```sql
   scripts/003_reload_schema_cache.sql
   ```

**Understanding Schema Cache:**
- PostgREST caches the database schema in memory for performance
- When you make schema changes (add tables, columns, etc.), the cache may not automatically update
- The `NOTIFY pgrst, 'reload schema'` command forces PostgREST to refresh its cache
- This is necessary after any database schema modifications

**When to reload the schema cache:**
- After running any schema migration scripts
- After manually adding/removing columns or tables
- When the API returns "column not found in schema cache" errors
- After restoring from a database backup
- When switching between different database environments

### "Column does not exist" errors

If you see errors like:
- `400 Bad Request` when creating links
- `column "title" does not exist` (in database, not cache)
- `column "is_active" does not exist`

**Solution:** Run the migration scripts as described above. Make sure to run them in order:
1. First run `001_create_links_table.sql`
2. Then run `002_add_missing_columns.sql`
3. Finally run `003_reload_schema_cache.sql`

### "Relation already exists" errors

These are safe to ignore if you're running scripts on an existing database. The scripts use `if not exists` clauses to prevent errors.

### RLS Policy Issues

If you encounter permission errors when creating or viewing links:
1. Verify that Row Level Security policies were created correctly
2. Ensure you're authenticated when making requests
3. Check that the policies in `001_create_links_table.sql` were all applied

## Schema Reference

### Links Table Structure

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key, auto-generated |
| `user_id` | uuid | Foreign key to auth.users, owner of the link |
| `slug` | text | Unique short code for the link |
| `dest_url` | text | The destination URL users are redirected to |
| `title` | text | Optional title for the link |
| `ads_required` | integer | Number of ads viewers must watch (default: 3) |
| `views` | integer | Total number of views (default: 0) |
| `completions` | integer | Number of successful completions (default: 0) |
| `is_active` | boolean | Whether the link is active (default: true) |
| `created_at` | timestamp | When the link was created |

### Indexes

- `links_slug_idx` - Index on `slug` for fast lookups
- `links_user_id_idx` - Index on `user_id` for user queries

### Row Level Security Policies

1. **Users can view their own links** - Users can query links they created
2. **Users can insert their own links** - Users can only create links for themselves
3. **Users can update their own links** - Users can only modify their own links
4. **Users can delete their own links** - Users can only delete their own links
5. **Anyone can view links by slug** - Public access for the gate page functionality

## Best Practices

1. **Always run migrations in order** - Start with `001_`, then `002_`, etc.
2. **Test migrations in a development environment first** - Never run untested migrations in production
3. **Backup your database** - Before running migrations on production, create a backup
4. **Keep migration scripts** - Never delete migration scripts, even after they've been applied
5. **Document changes** - Add comments to migration scripts explaining what they do

## Need Help?

If you encounter issues not covered in this guide:
1. Check the main project README.md for general setup instructions
2. Review the Supabase documentation at https://supabase.com/docs
3. Open an issue on the project repository with details about the error
