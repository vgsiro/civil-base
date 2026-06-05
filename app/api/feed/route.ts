import { createClient } from '@supabase/supabase-js'
import { buildFeed } from '@/lib/feed-ranking'
import type { RankPost, RankInteraction } from '@/lib/feed-ranking'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Server-side Supabase client (uses service role key if available, anon otherwise)
function serverSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const viewerId  = searchParams.get('viewer_id')
  const limitParam = Number(searchParams.get('limit') ?? 20)
  const offset     = Number(searchParams.get('offset') ?? 0)

  const sb = serverSupabase()

  // Resolve viewer interests from profile specializations + category history
  let viewerInterests: string[] = []
  if (viewerId) {
    const { data: profile } = await sb
      .from('profiles')
      .select('specializations')
      .eq('id', viewerId)
      .maybeSingle()
    viewerInterests = profile?.specializations ?? []
  }

  const viewer = { id: viewerId ?? '__guest__', interests: viewerInterests }

  const dataSource = {
    async getCandidatePosts(): Promise<RankPost[]> {
      // Fetch a wider pool to rank from (3× the page size, min 60)
      const pool = Math.max(limitParam * 3, 60)
      const { data } = await sb
        .from('posts')
        .select(`
          id, user_id, category, created_at,
          post_likes(id),
          post_comments(id),
          post_recommendations(id)
        `)
        .in('visibility', ['public', 'warn_limited'])
        .order('created_at', { ascending: false })
        .limit(pool + offset)

      return (data ?? []).slice(offset).map((p: any) => ({
        id:       p.id,
        authorId: p.user_id,
        createdAt: new Date(p.created_at).getTime(),
        tags:     [p.category].filter(Boolean),
        stats: {
          likes:       p.post_likes?.length ?? 0,
          comments:    p.post_comments?.length ?? 0,
          shares:      p.post_recommendations?.length ?? 0,
          impressions: Math.max((p.post_likes?.length ?? 0) + (p.post_comments?.length ?? 0) + 1, 1),
        },
      }))
    },

    async getBlockedAuthors(): Promise<Set<string>> {
      return new Set<string>()
    },

    async getHiddenPostIds(): Promise<Set<string>> {
      if (!viewerId) return new Set()
      const { data } = await sb
        .from('post_interactions')
        .select('post_id')
        .eq('user_id', viewerId)
        .eq('action', 'hide')
      return new Set((data ?? []).map((r: any) => r.post_id))
    },

    async getViewerInteractions(): Promise<RankInteraction[]> {
      if (!viewerId) return []
      const { data } = await sb
        .from('post_interactions')
        .select('post_id, author_id, action, created_at')
        .eq('user_id', viewerId)
        .order('created_at', { ascending: false })
        .limit(500)
      return (data ?? []).map((r: any) => ({
        userId:   viewerId,
        postId:   r.post_id,
        authorId: r.author_id,
        action:   r.action,
        at:       new Date(r.created_at).getTime(),
      }))
    },

    async getSeenCounts(): Promise<Record<string, number>> {
      if (!viewerId) return {}
      const { data } = await sb
        .from('post_seen')
        .select('post_id, count')
        .eq('user_id', viewerId)
      const map: Record<string, number> = {}
      for (const r of data ?? []) map[r.post_id] = r.count
      return map
    },
  }

  const ranked = await buildFeed({ viewer, dataSource, limit: limitParam })

  // Return ranked post IDs in order; client will use its already-fetched data
  // or we can return full posts. We return IDs + scores so the client can re-order.
  return Response.json({
    order: ranked.map(r => ({ id: r.post.id, score: r.post.id === '__debug__' ? 0 : r.score })),
  })
}
