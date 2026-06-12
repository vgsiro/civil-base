import type { SupabaseClient } from '@supabase/supabase-js'
import type { PostRow, Warning, RangeMode } from '../../_lib/types'
import { getRangeSince, getRangeTo } from '../../_lib/constants'
import { createNotification } from '../../../../_lib/notify'

function applyRange(q: any, range: RangeMode) {
  const since = getRangeSince(range)
  const to = getRangeTo(range)
  if (since) q = q.gte('created_at', since)
  if (to) q = q.lte('created_at', to)
  return q
}

export async function fetchPosts(supabase: SupabaseClient, range: RangeMode): Promise<PostRow[]> {
  const { data, error } = await applyRange(
    supabase.from('posts')
      .select('id,user_id,post_type,body,visibility,category,is_question,created_at,profiles!posts_user_id_fkey(username,display_name,full_name)')
      .order('created_at', { ascending: false })
      .limit(200),
    range,
  )
  if (error) console.error('[Admin] fetchPosts error:', error.message)
  return (data as unknown as PostRow[]) ?? []
}

export type ActionMode = 'delete' | 'warn'

export async function submitPostAction(
  supabase: SupabaseClient,
  post: PostRow,
  mode: ActionMode,
  reason: string,
  note: string,
): Promise<Warning> {
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
  const { data: { user: adminUser } } = await supabase.auth.getUser()
  if (!adminUser) throw new Error('Not authenticated')

  await supabase.from('user_warnings').insert({
    user_id: post.user_id, post_id: post.id, type: mode,
    reason, custom_note: note.trim() || null,
    admin_id: adminUser.id, expires_at: expiresAt,
  })

  if (mode === 'warn') {
    await supabase.rpc('admin_warn_post', { p_post_id: post.id })
  } else {
    await supabase.rpc('admin_hide_post', { p_post_id: post.id })
  }

  const notifMessage = note.trim() ? `${reason} — ${note.trim()}` : reason
  await createNotification({
    userId: post.user_id, actorId: adminUser.id,
    type: mode === 'delete' ? 'post_deleted' : 'post_warned',
    postId: post.id, message: notifMessage, skipSelfCheck: true,
  })

  // Count active (non-expired) warnings against the server clock to avoid client clock skew
  const { data: activeCount } = await supabase.rpc('count_active_warnings', { p_user_id: post.user_id })
  if ((activeCount ?? 0) >= 3) {
    await supabase.from('profiles').update({ is_banned: true }).eq('id', post.user_id)
  }

  return {
    id: crypto.randomUUID(),
    user_id: post.user_id, post_id: post.id, type: mode,
    reason, custom_note: note.trim() || null,
    created_at: new Date().toISOString(), expires_at: expiresAt,
    profiles: post.profiles ? { username: post.profiles.username, display_name: post.profiles.display_name } : null,
  } as Warning
}
