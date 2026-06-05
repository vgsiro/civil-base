// ============================================================
//  SIGNAL: ENGAGEMENT  —  how much did OTHER people react?
// ============================================================
//  A post lots of people liked/commented/shared is probably good.
//  We weight actions (a share > a like), normalise by impressions
//  so small + big posts compare fairly, then log-dampen so one
//  viral post can't dominate the whole feed.
//  Returns 0..1.
// ============================================================

const { PARAMS, ACTION_VALUES } = require('../../config/ranking-weights');

/**
 * @param {import('../models/types').Post} post
 * @returns {number} 0..1
 */
function engagementScore(post) {
  const s = post.stats;
  const raw =
    s.likes    * ACTION_VALUES.like +
    s.comments * ACTION_VALUES.comment +
    s.shares   * ACTION_VALUES.share;

  // Engagement rate = value per impression (avoid divide-by-zero)
  const rate = raw / Math.max(s.impressions, 1);

  // Log dampening: squashes large numbers, keeps small ones lively.
  const damped = Math.log(1 + rate) / Math.log(1 + PARAMS.engagementDampening);

  return Math.min(damped, 1); // clamp to 1
}

module.exports = { engagementScore };
