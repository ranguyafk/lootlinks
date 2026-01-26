// Rate Limiting System for LootLinks
// Adapted from v0-file-upload-website for Express.js

const db = require('./db');

// Rate limit configurations
const RATE_LIMITS = {
  login: {
    maxAttempts: 5,
    windowMinutes: 15
  },
  signup: {
    maxAttempts: 3,
    windowMinutes: 60
  },
  createLink: {
    maxAttempts: 10,
    windowMinutes: 60
  }
};

/**
 * Check if an action is rate limited
 * @param {string} identifier - IP address or user ID
 * @param {string} action - The action being performed (login, signup, createLink)
 * @returns {Object} { allowed: boolean, remaining: number, resetAt: Date }
 */
function checkRateLimit(identifier, action) {
  const config = RATE_LIMITS[action];
  
  if (!config) {
    throw new Error(`Unknown rate limit action: ${action}`);
  }

  const windowMs = config.windowMinutes * 60 * 1000;
  const now = Date.now();
  const windowStart = new Date(now - windowMs);

  // Get or create rate limit record
  const record = db.getRateLimitRecord(identifier, action, windowStart);
  
  if (!record) {
    // No record exists, create one
    db.createRateLimitRecord(identifier, action);
    return {
      allowed: true,
      remaining: config.maxAttempts - 1,
      resetAt: new Date(now + windowMs)
    };
  }

  // Check if we're within the rate limit
  if (record.count >= config.maxAttempts) {
    const resetAt = new Date(record.window_start.getTime() + windowMs);
    return {
      allowed: false,
      remaining: 0,
      resetAt
    };
  }

  // Increment the counter
  db.incrementRateLimitRecord(record.id);

  return {
    allowed: true,
    remaining: config.maxAttempts - (record.count + 1),
    resetAt: new Date(record.window_start.getTime() + windowMs)
  };
}

/**
 * Reset rate limit for an identifier and action
 * @param {string} identifier - IP address or user ID
 * @param {string} action - The action to reset
 */
function resetRateLimit(identifier, action) {
  db.deleteRateLimitRecords(identifier, action);
}

/**
 * Cleanup old rate limit records
 * Should be called periodically (e.g., daily)
 */
function cleanupOldRecords() {
  const maxAge = Math.max(...Object.values(RATE_LIMITS).map(c => c.windowMinutes));
  const cutoffTime = new Date(Date.now() - (maxAge * 2 * 60 * 1000)); // 2x max window
  
  db.deleteOldRateLimitRecords(cutoffTime);
}

/**
 * Express middleware to check rate limits
 * @param {string} action - The action to rate limit
 * @returns {Function} Express middleware
 */
function rateLimitMiddleware(action) {
  return (req, res, next) => {
    const identifier = req.ip || req.connection.remoteAddress;
    const result = checkRateLimit(identifier, action);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', RATE_LIMITS[action].maxAttempts);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', result.resetAt.toISOString());

    if (!result.allowed) {
      return res.status(429).json({
        error: 'Too many attempts. Please try again later.',
        retryAfter: result.resetAt
      });
    }

    next();
  };
}

module.exports = {
  checkRateLimit,
  resetRateLimit,
  cleanupOldRecords,
  rateLimitMiddleware,
  RATE_LIMITS
};
