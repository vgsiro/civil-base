import { PARAMS, ACTION_VALUES } from './config'
import type { RankViewer, RankPost, RankInteraction } from './types'

export function recencyScore(post: RankPost, now: number): number {
  const ageHours = (now - post.createdAt) / (1000 * 60 * 60)
  if (ageHours < 0) return 1
  return Math.pow(0.5, ageHours / PARAMS.recencyHalfLifeHours)
}

export function affinityScore(
  viewerId: string,
  authorId: string,
  interactions: RankInteraction[],
): number {
  let total = 0
  for (const i of interactions) {
    if (i.userId === viewerId && i.authorId === authorId) {
      total += ACTION_VALUES[i.action] ?? 0
    }
  }
  if (total <= 0) return 0
  return total / (total + PARAMS.affinitySaturation)
}

export function engagementScore(post: RankPost): number {
  const s = post.stats
  const raw =
    s.likes    * ACTION_VALUES.like +
    s.comments * ACTION_VALUES.comment +
    s.shares   * ACTION_VALUES.share
  const rate   = raw / Math.max(s.impressions, 1)
  const damped = Math.log(1 + rate) / Math.log(1 + PARAMS.engagementDampening)
  return Math.min(damped, 1)
}

export function interestScore(viewer: RankViewer, post: RankPost): number {
  const a = new Set(viewer.interests)
  const b = new Set(post.tags)
  if (a.size === 0 || b.size === 0) return PARAMS.interestFloor

  let shared = 0
  for (const tag of b) if (a.has(tag)) shared++

  const union = new Set([...a, ...b]).size
  return Math.max(shared / union, PARAMS.interestFloor)
}
