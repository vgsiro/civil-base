import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function serverSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

const VALID_ACTIONS = new Set(['view', 'like', 'comment', 'share', 'hide', 'report'])

export async function POST(request: Request) {
  let body: unknown
  try { body = await request.json() } catch { return Response.json({ error: 'bad json' }, { status: 400 }) }

  const { user_id, post_id, author_id, action } = body as Record<string, string>
  if (!user_id || !post_id || !author_id || !action) {
    return Response.json({ error: 'missing fields' }, { status: 400 })
  }
  if (!VALID_ACTIONS.has(action)) {
    return Response.json({ error: 'invalid action' }, { status: 400 })
  }

  const sb = serverSupabase()

  // Upsert interaction log (keep latest timestamp per user+post+action)
  await sb.from('post_interactions').upsert(
    { user_id, post_id, author_id, action },
    { onConflict: 'user_id,post_id,action', ignoreDuplicates: false },
  )

  // Increment seen count when the action is 'view'
  if (action === 'view') {
    await sb.rpc('increment_post_seen', { p_user_id: user_id, p_post_id: post_id })
  }

  return Response.json({ ok: true })
}
