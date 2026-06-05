// ============================================================
//  FEED PIPELINE  —  the public entry point. Call buildFeed().
// ============================================================
//  This mirrors Facebook's 4 stages:
//    1. INVENTORY  - gather candidate posts
//    2. FILTER     - remove things the viewer shouldn't see
//    3. RANK       - score + sort (the ranker does this)
//    4. SERVE      - take the top N
//
//  The data-fetching is abstracted behind `dataSource` so you can
//  plug in a database, an API, or in-memory test data without
//  changing the ranking logic. See docs/WORKFLOW.md.
// ============================================================

const { scorePost } = require('./ranker');

/**
 * @param {Object} opts
 * @param {import('./models/types').User} opts.viewer
 * @param {Object} opts.dataSource - object with the fetch methods below
 * @param {number} [opts.limit=20] - how many posts to return
 * @param {number} [opts.now=Date.now()]
 * @returns {Promise<import('./models/types').ScoredPost[]>}
 */
async function buildFeed({ viewer, dataSource, limit = 20, now = Date.now() }) {
  // 1. INVENTORY — candidate posts (e.g. from people/pages they follow)
  let candidates = await dataSource.getCandidatePosts(viewer.id);

  // 2. FILTER — drop blocked authors, already-hidden posts, etc.
  const blocked   = await dataSource.getBlockedAuthors(viewer.id);
  const hidden    = await dataSource.getHiddenPostIds(viewer.id);
  candidates = candidates.filter(
    (p) => !blocked.has(p.authorId) && !hidden.has(p.id)
  );

  // Shared context every post needs, fetched ONCE (not per post).
  const ctx = {
    now,
    interactions: await dataSource.getViewerInteractions(viewer.id),
    seenCounts:   await dataSource.getSeenCounts(viewer.id),
  };

  // 3. RANK — score every candidate, then sort high → low.
  const scored = candidates
    .map((post) => scorePost(viewer, post, ctx))
    .sort((a, b) => b.score - a.score);

  // 4. SERVE — top N.
  return scored.slice(0, limit);
}

module.exports = { buildFeed };
