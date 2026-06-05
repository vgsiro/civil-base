import { WEIGHTS, SEEN_PENALTY } from './config'
import { recencyScore, affinityScore, engagementScore, interestScore } from './signals'
import type { RankViewer, RankPost, RankInteraction, ScoredPost } from './types'

export function scorePost(
  viewer: RankViewer,
  post: RankPost,
  ctx: { now: number; interactions: RankInteraction[]; seenCounts: Record<string, number> },
): ScoredPost {
  const signals: [string, number, number][] = [
    ['recency',    WEIGHTS.recency,    recencyScore(post, ctx.now)],
    ['affinity',   WEIGHTS.affinity,   affinityScore(viewer.id, post.authorId, ctx.interactions)],
    ['engagement', WEIGHTS.engagement, engagementScore(post)],
    ['interest',   WEIGHTS.interest,   interestScore(viewer, post)],
  ]

  const totalWeight = signals.reduce((sum, [, w]) => sum + w, 0)

  let score = 0
  const breakdown: Record<string, number> = {}
  for (const [name, weight, value] of signals) {
    const contribution = (weight / totalWeight) * value
    breakdown[name] = contribution
    score += contribution
  }

  const seenCount = ctx.seenCounts[post.id] ?? 0
  if (seenCount > 0) {
    const penalty = Math.pow(SEEN_PENALTY.perViewMultiplier, seenCount)
    score *= penalty
    breakdown.seenPenalty = penalty
  }

  return { post, score, breakdown }
}
