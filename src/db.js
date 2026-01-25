const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
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
      password_hash TEXT,
      supabase_user_id TEXT UNIQUE,
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
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES creators(id)
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

// Authentication functions

function createUser(email, password) {
  // Hash password
  const passwordHash = bcrypt.hashSync(password, 10);
  
  // Create user
  const result = db.prepare(
    'INSERT INTO creators (email, password_hash) VALUES (?, ?)'
  ).run(email, passwordHash);
  
  return db.prepare('SELECT id, email, balance, created_at FROM creators WHERE id = ?').get(result.lastInsertRowid);
}

function authenticateUser(email, password) {
  const user = db.prepare('SELECT * FROM creators WHERE email = ?').get(email);
  
  if (!user || !user.password_hash) {
    return null;
  }
  
  const isValid = bcrypt.compareSync(password, user.password_hash);
  if (!isValid) {
    return null;
  }
  
  // Return user without password_hash
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

function getUserById(userId) {
  const user = db.prepare('SELECT id, email, balance, created_at FROM creators WHERE id = ?').get(userId);
  return user;
}

function setSessionUser(sessionId, userId) {
  db.prepare('UPDATE sessions SET user_id = ? WHERE session_id = ?').run(userId, sessionId);
}

function getSessionUser(sessionId) {
  const session = db.prepare('SELECT user_id FROM sessions WHERE session_id = ?').get(sessionId);
  if (!session || !session.user_id) {
    return null;
  }
  return getUserById(session.user_id);
}

function clearSessionUser(sessionId) {
  db.prepare('UPDATE sessions SET user_id = NULL WHERE session_id = ?').run(sessionId);
}

// Supabase user functions

function getCreatorBySupabaseId(supabaseUserId) {
  return db.prepare('SELECT id, email, supabase_user_id, balance, created_at FROM creators WHERE supabase_user_id = ?').get(supabaseUserId);
}

function createOrUpdateCreatorBySupabaseId(supabaseUserId, email) {
  // Check if creator exists
  const existing = getCreatorBySupabaseId(supabaseUserId);
  if (existing) {
    // Update email if changed
    if (existing.email !== email) {
      db.prepare('UPDATE creators SET email = ? WHERE supabase_user_id = ?').run(email, supabaseUserId);
    }
    return getCreatorBySupabaseId(supabaseUserId);
  }
  
  // Create new creator
  const result = db.prepare(
    'INSERT INTO creators (email, supabase_user_id) VALUES (?, ?)'
  ).run(email, supabaseUserId);
  
  return db.prepare('SELECT id, email, supabase_user_id, balance, created_at FROM creators WHERE id = ?').get(result.lastInsertRowid);
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
  const link = getLinkById(linkId);
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

// CRUD functions for authenticated link management

function getLinksByUserId(userId) {
  return db.prepare(
    'SELECT id, slug, dest_url, ads_required, created_at FROM links WHERE creator_id = ?'
  ).all(userId);
}

function updateLink(slug, userId, updates) {
  // First verify ownership
  const link = db.prepare('SELECT * FROM links WHERE slug = ?').get(slug);
  if (!link || link.creator_id !== userId) {
    return null;
  }
  
  const allowedFields = ['dest_url', 'ads_required'];
  const updateFields = [];
  const values = [];
  
  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      updateFields.push(`${key} = ?`);
      values.push(value);
    }
  }
  
  if (updateFields.length === 0) {
    return link;
  }
  
  values.push(slug);
  
  db.prepare(
    `UPDATE links SET ${updateFields.join(', ')} WHERE slug = ?`
  ).run(...values);
  
  return db.prepare('SELECT * FROM links WHERE slug = ?').get(slug);
}

function deleteLink(slug, userId) {
  // First verify ownership
  const link = db.prepare('SELECT * FROM links WHERE slug = ?').get(slug);
  if (!link || link.creator_id !== userId) {
    return false;
  }
  
  // Delete related data first (due to foreign keys)
  db.prepare('DELETE FROM impressions WHERE link_id = ?').run(link.id);
  db.prepare('DELETE FROM completions WHERE link_id = ?').run(link.id);
  db.prepare('DELETE FROM links WHERE id = ?').run(link.id);
  
  return true;
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
  getCreatorSummary,
  // Auth functions
  createUser,
  authenticateUser,
  getUserById,
  setSessionUser,
  getSessionUser,
  clearSessionUser,
  // Supabase functions
  getCreatorBySupabaseId,
  createOrUpdateCreatorBySupabaseId,
  // CRUD functions
  getLinksByUserId,
  updateLink,
  deleteLink
};
