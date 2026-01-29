# LootLinks Deployment Guide

## Local Development

To run LootLinks locally:

```bash
# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Start the server
npm start
```

The application will be available at `http://localhost:3000`.

## Vercel Deployment Constraints

### Current Issue

The current implementation uses an Express.js server with all routes defined in `src/app.js`. When deployed to Vercel as a static site, API routes (`/api/*`) will return **404 Not Found** because Vercel's static hosting doesn't run the Express server.

### Why This Happens

- Vercel's static deployment serves files from the `public/` directory
- Express routes (including all `/api/*` endpoints) are not accessible
- This causes the client to receive HTML error pages instead of JSON responses
- The client's `safeFetch` function properly handles this by showing user-friendly error messages

### Solution Options

#### Option 1: Deploy to a Platform with Node.js Support (Recommended for MVP)

Deploy to platforms that support Node.js applications:

- **Render** (https://render.com)
- **Fly.io** (https://fly.io)
- **Railway** (https://railway.app)
- **Heroku** (https://heroku.com)

These platforms will run the Express server and support all API endpoints.

**Steps:**
1. Push code to GitHub
2. Connect repository to hosting platform
3. Set environment variables
4. Deploy

#### Option 2: Migrate to Vercel Serverless Functions (Future Enhancement)

To deploy on Vercel with full functionality, migrate API routes to serverless functions:

1. **Create Vercel serverless function wrapper:**
   ```javascript
   // api/[...path].js
   const serverlessHttp = require('serverless-http');
   const app = require('../src/app');
   
   module.exports = serverlessHttp(app);
   ```

2. **Install serverless-http:**
   ```bash
   npm install serverless-http
   ```

3. **Replace SQLite with cloud database:**
   - Vercel serverless functions are stateless
   - SQLite file won't persist between function invocations
   - Use **Vercel Postgres**, **PlanetScale**, or **Supabase**

4. **Update database layer** (`src/db.js`) to use cloud database client

#### Option 3: Hybrid Approach

- Deploy static files to Vercel
- Deploy API to separate Node.js hosting (Render/Fly.io)
- Update frontend to point to API URL

## Current Features

### Authentication
- Email/password signup with bcrypt hashing
- Session-based authentication using cookies
- Secure password storage (minimum 6 characters)

### Link Management
- Authenticated users can create, view, edit, and delete their links
- Each link requires 1-5 sponsor views before redirect
- Links are unique per creator

### Gate Flow
- Viewers see sponsor content (placeholder in MVP)
- Timer-based validation (5 seconds per sponsor)
- Progress tracking and completion verification

### Error Handling
- Client checks `content-type` before JSON parsing
- User-friendly error messages when API is unavailable
- Graceful degradation on deployment platforms without backend support

## Environment Variables

```bash
PORT=3000
SESSION_COOKIE_NAME=sid
PAYOUT_PER_AD_VIEW=0.01
AD_VIEW_SECONDS=5
MAX_ADS_PER_LINK=5
```

## Security Considerations

- Passwords are hashed with bcryptjs (salt rounds: 10)
- HTTP-only session cookies prevent XSS attacks
- Email validation on signup
- Owner-only access for link edit/delete operations
- SQL injection protection via parameterized queries

## Next Steps

1. **Choose deployment platform** based on requirements
2. **Set up CI/CD** for automated deployments
3. **Configure environment variables** in hosting platform
4. **Add email verification** for enhanced security (future)
5. **Implement rate limiting** to prevent abuse (future)
6. **Add analytics dashboard** for link performance (future)
