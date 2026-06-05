// ============================================================
//  SIGNAL: RECENCY  —  newer is better, with a decay curve.
// ============================================================
//  Returns 0..1.  A brand-new post = ~1.  An old post → 0.
//  Uses exponential half-life decay (same math as radioactive
//  decay): after `halfLife` hours the score halves.
// ============================================================

const { PARAMS } = require('../../config/ranking-weights');

/**
 * @param {import('../models/types').Post} post
 * @param {number} now - unix ms (pass it in so tests are deterministic)
 * @returns {number} 0..1
 */
function recencyScore(post, now = Date.now()) {
  const ageHours = (now - post.createdAt) / (1000 * 60 * 60);
  if (ageHours < 0) return 1; // future-dated post, treat as fresh
  const halfLife = PARAMS.recencyHalfLifeHours;
  return Math.pow(0.5, ageHours / halfLife);
}

module.exports = { recencyScore };
