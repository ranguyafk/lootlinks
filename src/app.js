require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
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
  getLinksByUserId,
  updateLink,
  deleteLink
} = require('./db');

const app = express();
const PAYOUT_PER_AD_VIEW = parseFloat(process.env.PAYOUT_PER_AD_VIEW) || 0.01;
const AD_VIEW_SECONDS = parseInt(process.env.AD_VIEW_SECONDS) || 5;
const MAX_ADS_PER_LINK = parseInt(process.env.MAX_ADS_PER_LINK) || 5;
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'sid';

// Initialize database
initializeDatabase();

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

// Static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// ============================================================================
// Authentication API Routes
// ============================================================================

// POST /api/auth/signup - Create new account
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

// GET /api/auth/me - Get current user
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
// Page Routes
// ============================================================================

// Serve gate page at /l/:slug
app.get('/l/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'gate.html'));
});

// Serve creator page at /creator
app.get('/creator', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'creator.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = app;
