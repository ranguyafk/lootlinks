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
  getCreatorSummary
} = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const PAYOUT_PER_AD_VIEW = parseFloat(process.env.PAYOUT_PER_AD_VIEW) || 0.01;
const AD_VIEW_SECONDS = parseInt(process.env.AD_VIEW_SECONDS) || 5;
const MAX_ADS_PER_LINK = parseInt(process.env.MAX_ADS_PER_LINK) || 5;

// Initialize database
initializeDatabase();

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session middleware - create or use existing session
app.use((req, res, next) => {
  let sid = req.cookies.sid;
  
  if (!sid) {
    sid = uuidv4();
    res.cookie('sid', sid, {
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

// Static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// API Routes

// POST /api/links - Create a gated link
app.post('/api/links', (req, res) => {
  try {
    const { email, dest_url, ads_required } = req.body;
    
    // Validation
    if (!email || !dest_url || ads_required === undefined) {
      return res.status(400).json({ error: 'Missing required fields: email, dest_url, ads_required' });
    }
    
    // Validate email format (basic)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Validate URL
    try {
      new URL(dest_url);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid destination URL' });
    }
    
    // Clamp ads_required to 1-MAX_ADS_PER_LINK
    const clampedAds = Math.max(1, Math.min(parseInt(ads_required), MAX_ADS_PER_LINK));
    
    // Create or get creator
    const creator = createOrGetCreator(email);
    
    // Generate unique slug
    const slug = uuidv4().substring(0, 8);
    
    // Create link
    const link = createLink(creator.id, slug, dest_url, clampedAds);
    
    res.json({
      success: true,
      slug: link.slug,
      url: `${req.protocol}://${req.get('host')}/l/${link.slug}`,
      ads_required: link.ads_required
    });
  } catch (error) {
    console.error('Error creating link:', error);
    res.status(500).json({ error: 'Failed to create link' });
  }
});

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

// GET /api/creator/summary - Get creator summary
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

// Start server
app.listen(PORT, () => {
  console.log(`LootLinks server running on http://localhost:${PORT}`);
  console.log(`Configuration:`);
  console.log(`  - Payout per ad view: $${PAYOUT_PER_AD_VIEW}`);
  console.log(`  - Ad view duration: ${AD_VIEW_SECONDS} seconds`);
  console.log(`  - Max ads per link: ${MAX_ADS_PER_LINK}`);
});
