// ============================================================
//  SIGNAL: INTEREST  —  does the post match the viewer's topics?
// ============================================================
//  Compares the post's tags to the viewer's interests using
//  Jaccard overlap (shared tags / all tags). A floor keeps
//  unrelated posts from being completely invisible.
//  Returns 0..1.
//
//  FUTURE: swap this for embedding cosine-similarity when you
//  have vectors. The function signature stays the same, so
//  nothing else in the system needs to change.
// ============================================================

const { PARAMS } = require('../../config/ranking-weights');

/**
 * @param {import('../models/types').User} viewer
 * @param {import('../models/types').Post} post
 * @returns {number} 0..1
 */
function interestScore(viewer, post) {
  const a = new Set(viewer.interests);
  const b = new Set(post.tags);
  if (a.size === 0 || b.size === 0) return PARAMS.interestFloor;

  let shared = 0;
  for (const tag of b) if (a.has(tag)) shared++;

  const union = new Set([...a, ...b]).size;
  const jaccard = shared / union;

  return Math.max(jaccard, PARAMS.interestFloor);
}

module.exports = { interestScore };
