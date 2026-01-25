const Database = require('better-sqlite3');
const path = require('path');

// Initialize SQLite database
const db = new Database(path.join(__dirname, '..', 'lootlinks.db'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
function initializeDatabase() {
  // Creators table
  db.exec(`
    CREATE TABLE IF NOT EXISTS creators (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      balance REAL DEFAULT 0.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Links table
  db.exec(`
    CREATE TABLE IF NOT EXISTS links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      creator_id INTEGER NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      dest_url TEXT NOT NULL,
      ads_required INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creator_id) REFERENCES creators(id)
    )
  `);

  // Sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      session_id TEXT PRIMARY KEY,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Impressions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS impressions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      link_id INTEGER NOT NULL,
      ad_index INTEGER NOT NULL,
      session_id TEXT NOT NULL,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (link_id) REFERENCES links(id),
      FOREIGN KEY (session_id) REFERENCES sessions(session_id)
    )
  `);

  // Completions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      link_id INTEGER NOT NULL,
      session_id TEXT NOT NULL,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (link_id) REFERENCES links(id),
      FOREIGN KEY (session_id) REFERENCES sessions(session_id),
      UNIQUE(link_id, session_id)
    )
  `);

  console.log('Database initialized successfully');
}

// Data operations

function createOrGetCreator(email) {
  const existing = db.prepare('SELECT * FROM creators WHERE email = ?').get(email);
  if (existing) return existing;
  
  const result = db.prepare('INSERT INTO creators (email) VALUES (?)').run(email);
  return db.prepare('SELECT * FROM creators WHERE id = ?').get(result.lastInsertRowid);
}

function createLink(creatorId, slug, destUrl, adsRequired) {
  const result = db.prepare(
    'INSERT INTO links (creator_id, slug, dest_url, ads_required) VALUES (?, ?, ?, ?)'
  ).run(creatorId, slug, destUrl, adsRequired);
  
  return db.prepare('SELECT * FROM links WHERE id = ?').get(result.lastInsertRowid);
}

function getLinkBySlug(slug) {
  return db.prepare('SELECT * FROM links WHERE slug = ?').get(slug);
}

function createSession(sessionId) {
  db.prepare('INSERT OR IGNORE INTO sessions (session_id) VALUES (?)').run(sessionId);
}

function startAdView(linkId, adIndex, sessionId) {
  const result = db.prepare(
    'INSERT INTO impressions (link_id, ad_index, session_id) VALUES (?, ?, ?)'
  ).run(linkId, adIndex, sessionId);
  
  return db.prepare('SELECT * FROM impressions WHERE id = ?').get(result.lastInsertRowid);
}

function completeAdView(linkId, adIndex, sessionId) {
  const result = db.prepare(
    `UPDATE impressions 
     SET completed_at = CURRENT_TIMESTAMP 
     WHERE link_id = ? AND ad_index = ? AND session_id = ? AND completed_at IS NULL`
  ).run(linkId, adIndex, sessionId);
  
  return result.changes > 0;
}

function getCompletedAdCount(linkId, sessionId) {
  const result = db.prepare(
    `SELECT COUNT(*) as count 
     FROM impressions 
     WHERE link_id = ? AND session_id = ? AND completed_at IS NOT NULL`
  ).get(linkId, sessionId);
  
  return result.count;
}

function hasCompletedAllAds(linkId, sessionId) {
  const link = getLinkBySlug(null, linkId);
  if (!link) return false;
  
  const completedCount = getCompletedAdCount(linkId, sessionId);
  return completedCount >= link.ads_required;
}

function getLinkById(linkId) {
  return db.prepare('SELECT * FROM links WHERE id = ?').get(linkId);
}

function recordCompletion(linkId, sessionId, payoutAmount) {
  // Check if already completed
  const existing = db.prepare(
    'SELECT * FROM completions WHERE link_id = ? AND session_id = ?'
  ).get(linkId, sessionId);
  
  if (existing) {
    return { alreadyCompleted: true };
  }
  
  // Get link to find creator
  const link = getLinkById(linkId);
  if (!link) {
    throw new Error('Link not found');
  }
  
  // Use a transaction
  const transaction = db.transaction(() => {
    // Record completion
    db.prepare(
      'INSERT INTO completions (link_id, session_id) VALUES (?, ?)'
    ).run(linkId, sessionId);
    
    // Credit creator
    db.prepare(
      'UPDATE creators SET balance = balance + ? WHERE id = ?'
    ).run(payoutAmount, link.creator_id);
  });
  
  transaction();
  
  return { alreadyCompleted: false, link };
}

function getCreatorSummary(email) {
  const creator = db.prepare('SELECT * FROM creators WHERE email = ?').get(email);
  if (!creator) return null;
  
  const links = db.prepare(
    'SELECT id, slug, dest_url, ads_required, created_at FROM links WHERE creator_id = ?'
  ).all(creator.id);
  
  const stats = db.prepare(
    `SELECT 
       COUNT(DISTINCT c.id) as total_completions,
       SUM(l.ads_required) as total_ad_views
     FROM completions c
     JOIN links l ON c.link_id = l.id
     WHERE l.creator_id = ?`
  ).get(creator.id);
  
  return {
    creator,
    links,
    stats: {
      total_completions: stats.total_completions || 0,
      total_ad_views: stats.total_ad_views || 0
    }
  };
}

module.exports = {
  db,
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
};
