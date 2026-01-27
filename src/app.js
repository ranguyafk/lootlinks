require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const { createRemoteJWKSet, jwtVerify } = require('jose');
const {
  initializeDatabase,
  createOrGetCreator,
  createLink,
  getLinkBySlug,
  createSession,
  startAdView,
  completeAdView,
  getCompletedAdCount,
  hasCompletedAllAds,
  recordCompletion,
  getCreatorSummary,
  createUser,
  authenticateUser,
  getUserById,
  setSessionUser,
  getSessionUser,
  clearSessionUser,
  getCreatorBySupabaseId,
  createOrUpdateCreatorBySupabaseId,
  getLinksByUserId,
  updateLink,
  deleteLink,
  createProfile,
  getProfileById,
  getProfileByEmail
} = require('./db');

const { checkRateLimit, resetRateLimit, RATE_LIMITS } = require('./rate-limit');

const app = express();
const PAYOUT_PER_AD_VIEW = parseFloat(process.env.PAYOUT_PER_AD_VIEW) || 0.01;
const AD_VIEW_SECONDS = parseInt(process.env.AD_VIEW_SECONDS) || 5;
const MAX_ADS_PER_LINK = parseInt(process.env.MAX_ADS_PER_LINK) || 5;
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'sid';
// Support both NEXT_PUBLIC_ prefix (for v0 compatibility) and legacy names
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

// Warn if Supabase is not configured
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('WARNING: Supabase configuration not found. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env for Supabase auth to work.');
}

// Initialize database
initializeDatabase();

// Supabase JWKS setup for JWT verification
let JWKS = null;
if (SUPABASE_URL) {
  try {
    const JWKS_URL = `${SUPABASE_URL}/auth/v1/.well-known/jwks.json`;
    JWKS = createRemoteJWKSet(new URL(JWKS_URL));
  } catch (error) {
    console.error('Failed to initialize Supabase JWKS:', error);
  }
}

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session middleware - create or use existing session
app.use((req, res, next) => {
  let sid = req.cookies[SESSION_COOKIE_NAME];
  
  if (!sid) {
    sid = uuidv4();
    res.cookie(SESSION_COOKIE_NAME, sid, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
    createSession(sid);
  } else {
    // Ensure session exists in database
    createSession(sid);
  }
  
  req.sessionId = sid;
  next();
});

// Auth middleware - attach user to request if logged in
app.use((req, res, next) => {
  const user = getSessionUser(req.sessionId);
  req.user = user;
  next();
});

// ============================================================================
// API Routes (must be before static files to avoid 404s)
// ============================================================================
// Authentication API Routes
// ============================================================================

// POST /api/auth/check-rate-limit - Check if action is rate limited
app.post('/api/auth/check-rate-limit', (req, res) => {
  try {
    const { action } = req.body;
    
    if (!action || !RATE_LIMITS[action]) {
      return res.status(400).json({ error: 'Invalid action' });
    }
    
    // Extract IP with proxy header validation
    let identifier = req.ip || req.connection.remoteAddress;
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ips = forwardedFor.split(',').map(ip => ip.trim());
      if (ips.length > 0 && ips[0]) {
        identifier = ips[0];
      }
    }
    
    const result = checkRateLimit(identifier, action);
    
    res.json({
      allowed: result.allowed,
      remaining: result.remaining,
      resetAt: result.resetAt,
      limit: RATE_LIMITS[action].maxAttempts
    });
  } catch (error) {
    console.error('Rate limit check error:', error);
    res.status(500).json({ error: 'Failed to check rate limit' });
  }
});

// POST /api/auth/create-profile - Create user profile after signup
app.post('/api/auth/create-profile', async (req, res) => {
  try {
    const { userId, email } = req.body;
    
    if (!userId || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if profile already exists
    const existing = getProfileById(userId);
    if (existing) {
      return res.json({ success: true, profile: existing });
    }
    
    // Create new profile
    const profile = createProfile(userId, email);
    
    res.json({ success: true, profile });
  } catch (error) {
    console.error('Profile creation error:', error);
    res.status(500).json({ error: 'Failed to create profile' });
  }
});

// POST /api/auth/session - Bind Supabase JWT to backend session
app.post('/api/auth/session', async (req, res) => {
  try {
    // Get Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }
    
    const token = authHeader.substring(7);
    
    if (!JWKS) {
      return res.status(500).json({ error: 'Supabase JWT verification not configured' });
    }
    
    // Verify JWT
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `${SUPABASE_URL}/auth/v1`
    });
    
    // Extract user info from JWT
    const supabaseUserId = payload.sub;
    const email = payload.email;
    
    if (!supabaseUserId || !email) {
      return res.status(400).json({ error: 'Invalid token payload' });
    }
    
    // Create or update creator in database
    const creator = createOrUpdateCreatorBySupabaseId(supabaseUserId, email);
    
    // Bind to session
    setSessionUser(req.sessionId, creator.id);
    
    res.json({
      success: true,
      user: {
        id: creator.id,
        email: creator.email,
        balance: creator.balance
      }
    });
  } catch (error) {
    console.error('Session binding error:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

// POST /api/auth/signup - Create new account (legacy - kept for compatibility)
app.post('/api/auth/signup', (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    // Create user
    const user = createUser(email, password);
    
    // Set session
    setSessionUser(req.sessionId, user.id);
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        balance: user.balance
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// POST /api/auth/login - Authenticate user
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Authenticate
    const user = authenticateUser(email, password);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Set session
    setSessionUser(req.sessionId, user.id);
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        balance: user.balance
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// POST /api/auth/logout - Clear session
app.post('/api/auth/logout', (req, res) => {
  try {
    clearSessionUser(req.sessionId);
    res.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
});

// GET /api/me - Get current user (works with both legacy and Supabase auth)
app.get('/api/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      balance: req.user.balance
    }
  });
});

// GET /api/auth/me - Legacy endpoint (redirects to /api/me)
app.get('/api/auth/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      balance: req.user.balance
    }
  });
});

// ============================================================================
// Link Management API Routes (Authenticated)
// ============================================================================

// POST /api/links - Create a gated link (authenticated)
app.post('/api/links', (req, res) => {
  try {
    // Check authentication
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { dest_url, ads_required } = req.body;
    
    // Validation
    if (!dest_url || ads_required === undefined) {
      return res.status(400).json({ error: 'Missing required fields: dest_url, ads_required' });
    }
    
    // Validate URL
    try {
      new URL(dest_url);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid destination URL' });
    }
    
    // Clamp ads_required to 1-MAX_ADS_PER_LINK
    const clampedAds = Math.max(1, Math.min(parseInt(ads_required), MAX_ADS_PER_LINK));
    
    // Generate unique slug
    const slug = uuidv4().substring(0, 8);
    
    // Create link
    const link = createLink(req.user.id, slug, dest_url, clampedAds);
    
    res.json({
      success: true,
      slug: link.slug,
      url: `${req.protocol}://${req.get('host')}/l/${link.slug}`,
      ads_required: link.ads_required,
      dest_url: link.dest_url
    });
  } catch (error) {
    console.error('Error creating link:', error);
    res.status(500).json({ error: 'Failed to create link' });
  }
});

// GET /api/links - List current user's links (authenticated)
app.get('/api/links', (req, res) => {
  try {
    // Check authentication
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const links = getLinksByUserId(req.user.id);
    
    res.json({
      success: true,
      links: links.map(link => ({
        slug: link.slug,
        dest_url: link.dest_url,
        ads_required: link.ads_required,
        created_at: link.created_at,
        url: `${req.protocol}://${req.get('host')}/l/${link.slug}`
      }))
    });
  } catch (error) {
    console.error('Error listing links:', error);
    res.status(500).json({ error: 'Failed to list links' });
  }
});

// PATCH /api/links/:slug - Update link (owner only)
app.patch('/api/links/:slug', (req, res) => {
  try {
    // Check authentication
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { slug } = req.params;
    const { dest_url, ads_required } = req.body;
    
    const updates = {};
    
    if (dest_url !== undefined) {
      // Validate URL
      try {
        new URL(dest_url);
        updates.dest_url = dest_url;
      } catch (e) {
        return res.status(400).json({ error: 'Invalid destination URL' });
      }
    }
    
    if (ads_required !== undefined) {
      // Clamp ads_required
      updates.ads_required = Math.max(1, Math.min(parseInt(ads_required), MAX_ADS_PER_LINK));
    }
    
    const updatedLink = updateLink(slug, req.user.id, updates);
    
    if (!updatedLink) {
      return res.status(404).json({ error: 'Link not found or access denied' });
    }
    
    res.json({
      success: true,
      link: {
        slug: updatedLink.slug,
        dest_url: updatedLink.dest_url,
        ads_required: updatedLink.ads_required,
        created_at: updatedLink.created_at
      }
    });
  } catch (error) {
    console.error('Error updating link:', error);
    res.status(500).json({ error: 'Failed to update link' });
  }
});

// DELETE /api/links/:slug - Delete link (owner only)
app.delete('/api/links/:slug', (req, res) => {
  try {
    // Check authentication
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const { slug } = req.params;
    
    const success = deleteLink(slug, req.user.id);
    
    if (!success) {
      return res.status(404).json({ error: 'Link not found or access denied' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting link:', error);
    res.status(500).json({ error: 'Failed to delete link' });
  }
});

// ============================================================================
// Gate/Viewer API Routes (Public)
// ============================================================================

// GET /api/links/:slug - Get link info for gate page (without dest_url)
app.get('/api/links/:slug', (req, res) => {
  try {
    const { slug } = req.params;
    const link = getLinkBySlug(slug);
    
    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }
    
    // Return info without leaking dest_url
    res.json({
      slug: link.slug,
      ads_required: link.ads_required,
      ad_view_seconds: AD_VIEW_SECONDS
    });
  } catch (error) {
    console.error('Error fetching link:', error);
    res.status(500).json({ error: 'Failed to fetch link' });
  }
});

// POST /api/ads/start - Record start of an ad view
app.post('/api/ads/start', (req, res) => {
  try {
    const { slug, ad_index } = req.body;
    
    if (!slug || ad_index === undefined) {
      return res.status(400).json({ error: 'Missing slug or ad_index' });
    }
    
    const link = getLinkBySlug(slug);
    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }
    
    const adIndexNum = parseInt(ad_index);
    if (adIndexNum < 0 || adIndexNum >= link.ads_required) {
      return res.status(400).json({ error: 'Invalid ad_index' });
    }
    
    const impression = startAdView(link.id, adIndexNum, req.sessionId);
    
    res.json({
      success: true,
      impression_id: impression.id
    });
  } catch (error) {
    console.error('Error starting ad view:', error);
    res.status(500).json({ error: 'Failed to start ad view' });
  }
});

// POST /api/ads/complete - Mark ad view as completed
app.post('/api/ads/complete', (req, res) => {
  try {
    const { slug, ad_index } = req.body;
    
    if (!slug || ad_index === undefined) {
      return res.status(400).json({ error: 'Missing slug or ad_index' });
    }
    
    const link = getLinkBySlug(slug);
    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }
    
    const adIndexNum = parseInt(ad_index);
    const success = completeAdView(link.id, adIndexNum, req.sessionId);
    
    if (!success) {
      return res.status(400).json({ error: 'Ad view not found or already completed' });
    }
    
    const completedCount = getCompletedAdCount(link.id, req.sessionId);
    
    res.json({
      success: true,
      completed_count: completedCount,
      all_completed: completedCount >= link.ads_required
    });
  } catch (error) {
    console.error('Error completing ad view:', error);
    res.status(500).json({ error: 'Failed to complete ad view' });
  }
});

// POST /api/continue - Complete all ad views and get dest_url
app.post('/api/continue', (req, res) => {
  try {
    const { slug } = req.body;
    
    if (!slug) {
      return res.status(400).json({ error: 'Missing slug' });
    }
    
    const link = getLinkBySlug(slug);
    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }
    
    // Verify all ads are completed
    if (!hasCompletedAllAds(link.id, req.sessionId)) {
      return res.status(403).json({ error: 'Not all ad views completed' });
    }
    
    // Calculate payout
    const payoutAmount = PAYOUT_PER_AD_VIEW * link.ads_required;
    
    // Record completion and credit creator
    const result = recordCompletion(link.id, req.sessionId, payoutAmount);
    
    res.json({
      success: true,
      dest_url: link.dest_url,
      already_completed: result.alreadyCompleted
    });
  } catch (error) {
    console.error('Error continuing:', error);
    res.status(500).json({ error: 'Failed to continue' });
  }
});

// GET /api/creator/summary - Get creator summary (legacy - kept for compatibility)
app.get('/api/creator/summary', (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ error: 'Missing email parameter' });
    }
    
    const summary = getCreatorSummary(email);
    
    if (!summary) {
      return res.status(404).json({ error: 'Creator not found' });
    }
    
    res.json(summary);
  } catch (error) {
    console.error('Error fetching creator summary:', error);
    res.status(500).json({ error: 'Failed to fetch creator summary' });
  }
});

// ============================================================================
// 404 Handler for API Routes (must be after all API routes but before static files)
// ============================================================================
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// ============================================================================
// Static File Serving and HTML Template Injection
// ============================================================================

// Middleware to inject Supabase config into HTML files (must be before static files)
app.use((req, res, next) => {
  // Only intercept HTML file requests
  if (req.path.endsWith('.html')) {
    const filePath = path.join(__dirname, '..', 'public', req.path);
    
    fs.readFile(filePath, 'utf8', (err, content) => {
      if (err) {
        return next(); // Let static middleware handle 404
      }
      
      // Replace placeholders with actual values
      // Support both {{SUPABASE_URL}} and {{NEXT_PUBLIC_SUPABASE_URL}} placeholders
      let modifiedContent = content
        .replace(/\{\{SUPABASE_URL\}\}/g, SUPABASE_URL)
        .replace(/\{\{SUPABASE_ANON_KEY\}\}/g, SUPABASE_ANON_KEY)
        .replace(/\{\{NEXT_PUBLIC_SUPABASE_URL\}\}/g, SUPABASE_URL)
        .replace(/\{\{NEXT_PUBLIC_SUPABASE_ANON_KEY\}\}/g, SUPABASE_ANON_KEY);
      
      res.setHeader('Content-Type', 'text/html');
      res.send(modifiedContent);
    });
  } else {
    next();
  }
});

// Static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// ============================================================================
// Page Routes (non-.html routes)
// ============================================================================

// Serve gate page at /l/:slug
app.get('/l/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'gate.html'));
});

// Redirect /creator to /creator.html (legacy route for backward compatibility)
// This ensures template variable injection happens
app.get('/creator', (req, res) => {
  res.redirect('/creator.html');
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = app;
