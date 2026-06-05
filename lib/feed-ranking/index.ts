import { scorePost } from './ranker'
import type { RankViewer, RankPost, RankInteraction, ScoredPost } from './types'

export type { RankViewer, RankPost, RankInteraction, ScoredPost }

interface DataSource {
  getCandidatePosts(viewerId: string): Promise<RankPost[]>
  getBlockedAuthors(viewerId: string): Promise<Set<string>>
  getHiddenPostIds(viewerId: string): Promise<Set<string>>
  getViewerInteractions(viewerId: string): Promise<RankInteraction[]>
  getSeenCounts(viewerId: string): Promise<Record<string, number>>
}

export async function buildFeed({
  viewer,
  dataSource,
  limit = 20,
  now = Date.now(),
}: {
  viewer: RankViewer
  dataSource: DataSource
  limit?: number
  now?: number
}): Promise<ScoredPost[]> {
  // 1. INVENTORY
  let candidates = await dataSource.getCandidatePosts(viewer.id)

  // 2. FILTER
  const [blocked, hidden] = await Promise.all([
    dataSource.getBlockedAuthors(viewer.id),
    dataSource.getHiddenPostIds(viewer.id),
  ])
  candidates = candidates.filter(p => !blocked.has(p.authorId) && !hidden.has(p.id))

  // 3. RANK
  const [interactions, seenCounts] = await Promise.all([
    dataSource.getViewerInteractions(viewer.id),
    dataSource.getSeenCounts(viewer.id),
  ])
  const ctx = { now, interactions, seenCounts }

  const scored = candidates
    .map(post => scorePost(viewer, post, ctx))
    .sort((a, b) => b.score - a.score)

  // 4. SERVE
  return scored.slice(0, limit)
}
