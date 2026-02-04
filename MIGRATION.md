# LootLinks - Clerk + Prisma Migration

This document describes the complete migration from Supabase to Clerk (auth) + Prisma (ORM) + Neon/Postgres (database).

## What Changed

### Authentication
- **Before**: Supabase Auth with email/password
- **After**: Clerk for authentication with hosted UI components

### Database & ORM
- **Before**: Supabase PostgREST API for database operations
- **After**: Prisma ORM with direct PostgreSQL connection (Neon)

### Data Access Pattern
- **Before**: Client-side Supabase client queries
- **After**: Server-side API routes with Prisma queries

## New Stack

- **Next.js 15** (App Router, TypeScript)
- **Clerk** (`@clerk/nextjs`) - Authentication
- **Prisma** (`@prisma/client`) - ORM
- **Neon** (or any managed Postgres) - Database
- **Zod** - Schema validation

## Environment Variables

Create a `.env` file with the following variables:

```env
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx

# Database Configuration
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

## Setup Instructions

### 1. Set Up Clerk

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application
3. Copy the API keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
4. Add them to your `.env` file

### 2. Set Up Neon Database

1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project
3. Copy the connection string
4. Add it to your `.env` as `DATABASE_URL`

### 3. Run Database Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Create the database tables
npx prisma migrate dev --name init
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

## Database Schema

The Prisma schema defines three models:

### User
- `id` (String, cuid) - Clerk user ID
- `email` (String, unique)
- `createdAt` (DateTime)
- `links` (relation to Link[])

### Link
- `id` (String, cuid)
- `userId` (String) - Foreign key to User
- `slug` (String, unique) - URL shortcode
- `destUrl` (String) - Destination URL
- `title` (String?, optional)
- `adsRequired` (Int, default: 3)
- `views` (Int, default: 0)
- `completions` (Int, default: 0)
- `isActive` (Boolean, default: true)
- `createdAt` (DateTime)
- `events` (relation to LinkEvent[])

### LinkEvent
- `id` (String, cuid)
- `linkId` (String) - Foreign key to Link
- `ip` (String)
- `userAgent` (String)
- `country` (String, default: "ZZ")
- `isBot` (Boolean, default: false)
- `valid` (Boolean, default: false)
- `cpmUsd` (Decimal, default: 0.00)
- `createdAt` (DateTime)
- Unique constraint on `[linkId, ip, userAgent, createdAt]` for deduplication

## API Routes

### POST /api/links
Create a new link. Requires authentication.

**Request Body:**
```json
{
  "title": "Optional Title",
  "dest_url": "https://example.com",
  "ads_required": 3
}
```

**Response:**
```json
{
  "data": {
    "id": "clx...",
    "slug": "abc123xy",
    "destUrl": "https://example.com",
    ...
  }
}
```

### PATCH /api/links/[id]
Update a link (toggle active status). Requires authentication.

**Request Body:**
```json
{
  "is_active": false
}
```

### DELETE /api/links/[id]
Delete a link. Requires authentication.

### POST /api/gate/track
Track a gate view event. Public endpoint.

**Request Body:**
```json
{
  "link_id": "clx...",
  "slug": "abc123xy"
}
```

### POST /api/links/[id]/increment-completion
Increment completion count when user completes all tasks. Public endpoint.

## Routes

### Public Routes
- `/` - Home page
- `/features` - Features page
- `/pricing` - Pricing page
- `/auth/sign-in` - Clerk sign-in page
- `/auth/sign-up` - Clerk sign-up page
- `/[slug]` - Direct slug route (same as /l/[slug])
- `/l/[slug]` - Gate interstitial page

### Protected Routes
- `/dashboard` - User dashboard (requires authentication)

## Migration Details

### Files Changed

#### Created
- `lib/db.ts` - Prisma client instance
- `prisma/schema.prisma` - Database schema
- `app/api/links/route.ts` - Create link API
- `app/api/links/[id]/route.ts` - Update/delete link API
- `app/auth/sign-in/page.tsx` - Clerk sign-in page

#### Updated
- `middleware.ts` - Now uses Clerk middleware
- `app/layout.tsx` - Wrapped with ClerkProvider
- `app/dashboard/page.tsx` - Uses Prisma + Clerk
- `app/[slug]/page.tsx` - Uses Prisma
- `app/l/[slug]/page.tsx` - Uses Prisma
- `app/api/gate/track/route.ts` - Uses Prisma
- `app/api/links/[id]/increment-completion/route.ts` - Uses Prisma
- `components/dashboard/*` - Updated to use Clerk user type and API endpoints
- `components/navigation/global-nav.tsx` - Uses Clerk's useUser hook
- `.env.example` - Updated with new environment variables

#### Deleted
- `lib/supabase/*` - All Supabase client/server files
- `supabase/*` - All Supabase SQL scripts and policies
- `scripts/*` - All Supabase migration scripts

### Key Changes

1. **Authentication Flow**:
   - Old: Custom login/signup forms with Supabase
   - New: Clerk's hosted UI components

2. **Data Fetching**:
   - Old: Client-side Supabase queries
   - New: Server-side Prisma queries in API routes

3. **Link Creation**:
   - Old: Client-side insert with Supabase
   - New: POST to `/api/links` with server-side Prisma insert

4. **Link Updates**:
   - Old: Client-side update with Supabase
   - New: PATCH to `/api/links/[id]` with server-side Prisma update

5. **User Management**:
   - Old: Supabase `User` type from `@supabase/supabase-js`
   - New: Clerk `User` type from `@clerk/nextjs/server`

## Testing

To test the application:

1. **Authentication**:
   - Visit `/auth/sign-in` and sign in
   - Visit `/auth/sign-up` and create an account
   - Should redirect to `/dashboard` after successful auth

2. **Dashboard**:
   - Should load user's links from database
   - Should show user email in header
   - Should allow sign out

3. **Create Link**:
   - Click "Create Link" button
   - Fill in destination URL
   - Should create link and show in list

4. **Gate Flow**:
   - Visit a link at `/[slug]` or `/l/[slug]`
   - Should show gate/interstitial page
   - Complete required tasks
   - Should increment completion count
   - Should redirect to destination URL

5. **Link Management**:
   - Toggle link active/inactive
   - Copy link to clipboard
   - Delete link

## Deployment

### Vercel

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `DATABASE_URL`
4. Deploy

Vercel will automatically run `prisma generate` during build.

### Other Platforms

1. Ensure `prisma generate` runs during build
2. Set environment variables
3. Deploy

## Benefits of New Stack

1. **Reliability**: No more PostgREST 400 errors
2. **Type Safety**: Full TypeScript support with Prisma
3. **Server-Side**: All mutations happen on the server
4. **Authentication**: Clerk provides robust, production-ready auth
5. **Migrations**: Prisma migrations for schema management
6. **Flexibility**: Easy to add new features and queries

## Troubleshooting

### Clerk Keys Invalid
- Make sure keys are copied correctly from Clerk dashboard
- Keys should start with `pk_test_` or `pk_live_` (publishable) and `sk_test_` or `sk_live_` (secret)

### Database Connection Failed
- Verify `DATABASE_URL` is correct
- Ensure database is running and accessible
- Check Neon connection string format

### Prisma Client Not Generated
```bash
npx prisma generate
```

### Migration Errors
```bash
# Reset database (development only!)
npx prisma migrate reset

# Create new migration
npx prisma migrate dev --name your_migration_name
```

### Build Errors
- Ensure all environment variables are set
- Run `npx prisma generate` before building
- Check TypeScript errors: `npx tsc --noEmit`

## Support

For issues or questions:
1. Check this documentation
2. Review Clerk docs: https://clerk.com/docs
3. Review Prisma docs: https://www.prisma.io/docs
4. Open an issue on the repository
