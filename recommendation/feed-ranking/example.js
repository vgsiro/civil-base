// ============================================================
//  EXAMPLE  —  runnable demo with fake in-memory data.
//  Run with:  node example.js
//
//  The `dataSource` object below is the ONLY thing you replace
//  when moving to a real database. Every method returns the same
//  shapes; swap the bodies for real queries and you're done.
// ============================================================

const { buildFeed } = require('./src/feed');

const now = Date.now();
const HOUR = 1000 * 60 * 60;

const viewer = { id: 'u1', interests: ['tech', 'ai', 'football'] };

const posts = [
  { id: 'p1', authorId: 'a1', createdAt: now - 1 * HOUR,  tags: ['tech', 'ai'],   type: 'video', stats: { likes: 120, comments: 30, shares: 12, impressions: 2000 } },
  { id: 'p2', authorId: 'a2', createdAt: now - 10 * HOUR, tags: ['cooking'],      type: 'image', stats: { likes: 8,   comments: 1,  shares: 0,  impressions: 300 } },
  { id: 'p3', authorId: 'a1', createdAt: now - 30 * HOUR, tags: ['football'],     type: 'text',  stats: { likes: 50,  comments: 20, shares: 5,  impressions: 900 } },
  { id: 'p4', authorId: 'a3', createdAt: now - 0.5 * HOUR,tags: ['gardening'],    type: 'image', stats: { likes: 2,   comments: 0,  shares: 0,  impressions: 50 } },
];

// Viewer u1 interacts a lot with author a1 → high affinity.
const interactions = [
  { userId: 'u1', postId: 'x', authorId: 'a1', action: 'comment', at: now - 50 * HOUR },
  { userId: 'u1', postId: 'y', authorId: 'a1', action: 'like',    at: now - 40 * HOUR },
  { userId: 'u1', postId: 'z', authorId: 'a1', action: 'share',   at: now - 20 * HOUR },
];

const dataSource = {
  async getCandidatePosts()      { return posts; },
  async getBlockedAuthors()      { return new Set(); },
  async getHiddenPostIds()       { return new Set(); },
  async getViewerInteractions()  { return interactions; },
  async getSeenCounts()          { return { p3: 2 }; }, // already saw p3 twice
};

(async () => {
  const feed = await buildFeed({ viewer, dataSource, limit: 10, now });
  console.log('\n=== RANKED FEED for', viewer.id, '===\n');
  for (const { post, score, breakdown } of feed) {
    console.log(
      `${post.id}  score=${score.toFixed(3)}  ` +
      `[${Object.entries(breakdown).map(([k, v]) => `${k}:${v.toFixed(2)}`).join('  ')}]`
    );
  }
})();
