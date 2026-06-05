// ============================================================
//  Next.js App Router API route
//  Put this at:  app/api/feed/route.js
//
//  This runs ON THE SERVER. The ranking engine never reaches the
//  browser — the client just fetches the finished, ranked list.
// ============================================================

import { buildFeed } from '@/lib/feed-ranking/src/feed';
import { createDataSource } from '@/lib/feed-ranking/examples/nextjs/dataSource';
import { getCurrentUser } from '@/lib/auth'; // your own auth helper

export async function GET(request) {
  // 1. Who is asking? (replace with your real session/auth)
  const viewer = await getCurrentUser(request);
  if (!viewer) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // 2. Optional paging via ?limit=20
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get('limit') ?? 20);

  // 3. Build the ranked feed.
  const dataSource = createDataSource();
  const feed = await buildFeed({ viewer, dataSource, limit });

  // 4. Send only what the UI needs (drop the debug breakdown in prod
  //    if you like — keep it while developing, it's gold).
  return Response.json({
    posts: feed.map(({ post, score }) => ({ ...post, _score: score })),
  });
}
