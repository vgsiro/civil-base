// ============================================================
//  dataSource for Next.js  —  the ONLY file tied to your database.
//  Put this at:  lib/feed-ranking/examples/nextjs/dataSource.js
//
//  Every method must return the SAME SHAPES as src/models/types.js.
//  The example below uses Prisma, but swap in any DB / ORM / API —
//  the ranking code never knows or cares.
// ============================================================

// import { prisma } from '@/lib/prisma'; // <- your db client

export function createDataSource() {
  return {
    // 1. INVENTORY — candidate posts (people/pages the viewer follows).
    async getCandidatePosts(viewerId) {
      // const rows = await prisma.post.findMany({
      //   where: { author: { followers: { some: { followerId: viewerId } } } },
      //   orderBy: { createdAt: 'desc' },
      //   take: 500,                       // cap the candidate pool
      //   include: { stats: true },
      // });
      // return rows.map(toPostShape);
      return []; // TODO: replace with the query above
    },

    // 2a. Authors this viewer has blocked.
    async getBlockedAuthors(viewerId) {
      // const blocks = await prisma.block.findMany({ where: { userId: viewerId } });
      // return new Set(blocks.map((b) => b.blockedUserId));
      return new Set();
    },

    // 2b. Posts this viewer hid / dismissed.
    async getHiddenPostIds(viewerId) {
      // const hidden = await prisma.interaction.findMany({
      //   where: { userId: viewerId, action: 'hide' }, select: { postId: true },
      // });
      // return new Set(hidden.map((h) => h.postId));
      return new Set();
    },

    // 3. Viewer's interaction history (powers affinity).
    async getViewerInteractions(viewerId) {
      // return prisma.interaction.findMany({
      //   where: { userId: viewerId },
      //   take: 1000,                      // recent history is enough
      //   orderBy: { at: 'desc' },
      // });
      return [];
    },

    // 4. How many times the viewer already saw each post (seen-penalty).
    async getSeenCounts(viewerId) {
      // const views = await prisma.interaction.groupBy({
      //   by: ['postId'], where: { userId: viewerId, action: 'view' },
      //   _count: { postId: true },
      // });
      // return Object.fromEntries(views.map((v) => [v.postId, v._count.postId]));
      return {};
    },
  };
}

// Helper: map a DB row to the Post shape the ranker expects.
// function toPostShape(row) {
//   return {
//     id: row.id,
//     authorId: row.authorId,
//     createdAt: row.createdAt.getTime(),  // MUST be unix ms
//     tags: row.tags,
//     type: row.type,
//     stats: {
//       likes: row.stats.likes,
//       comments: row.stats.comments,
//       shares: row.stats.shares,
//       impressions: row.stats.impressions,
//     },
//   };
// }
