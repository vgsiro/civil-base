// ============================================================
//  RANKER  —  combines every signal into one score per post.
// ============================================================
//  This is the heart of the algorithm. It stays SHORT on purpose:
//  all the "smarts" live in the signal files and the weights file.
//
//  To add a new signal in future:
//    1. write src/signals/yourSignal.js (returns 0..1)
//    2. add a weight in config/ranking-weights.js
//    3. add ONE line to `signals` below
//  That's the whole change. See docs/EXTENDING.md.
// ============================================================

const { WEIGHTS, SEEN_PENALTY } = require('../config/ranking-weights');
const { recencyScore }    = require('./signals/recency');
const { affinityScore }   = require('./signals/affinity');
const { engagementScore } = require('./signals/engagement');
const { interestScore }   = require('./signals/interest');

/**
 * Score a single post for a single viewer.
 * @param {import('./models/types').User} viewer
 * @param {import('./models/types').Post} post
 * @param {Object} ctx - shared context (interactions, seen counts, now)
 * @returns {import('./models/types').ScoredPost}
 */
function scorePost(viewer, post, ctx) {
  // Each entry: [name, weight, rawSignalValue 0..1]
  const signals = [
    ['recency',    WEIGHTS.recency,    recencyScore(post, ctx.now)],
    ['affinity',   WEIGHTS.affinity,   affinityScore(viewer.id, post.authorId, ctx.interactions)],
    ['engagement', WEIGHTS.engagement, engagementScore(post)],
    ['interest',   WEIGHTS.interest,   interestScore(viewer, post)],
  ];

  const totalWeight = signals.reduce((sum, [, w]) => sum + w, 0);

  let score = 0;
  const breakdown = {};
  for (const [name, weight, value] of signals) {
    const contribution = (weight / totalWeight) * value;
    breakdown[name] = contribution;
    score += contribution;
  }

  // Penalise posts the viewer has already seen, so the feed moves.
  const seenCount = ctx.seenCounts[post.id] ?? 0;
  if (seenCount > 0) {
    const penalty = Math.pow(SEEN_PENALTY.perViewMultiplier, seenCount);
    score *= penalty;
    breakdown.seenPenalty = penalty;
  }

  return { post, score, breakdown };
}

module.exports = { scorePost };
