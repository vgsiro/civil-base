'use client'
import { supabase } from '@/lib/supabase'
import type { NotificationType } from '../_types'

export async function createNotification({
  userId,
  actorId,
  type,
  postId,
  message,
  skipSelfCheck,
}: {
  userId: string
  actorId: string
  type: NotificationType
  postId?: string
  message?: string
  skipSelfCheck?: boolean
}) {
  if (!skipSelfCheck && userId === actorId) return

  if (skipSelfCheck) {
    // Use security-definer RPC so the admin can delete the recipient's old notification
    // (RLS only lets users delete their own rows, so a plain delete from the client fails).
    const { error } = await supabase.rpc('upsert_notification', {
      p_user_id:  userId,
      p_actor_id: actorId,
      p_type:     type,
      p_message:  message ?? null,
      p_post_id:  postId ?? null,
    })
    if (error) console.error('upsert_notification error:', error.message, { userId, actorId, type })
    return
  }

  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    actor_id: actorId,
    type,
    post_id: postId ?? null,
    message: message ?? null,
    read: false,
  })
  if (error && !error.message.includes('duplicate key') && !error.message.includes('unique constraint')) {
    console.error('createNotification error:', error.message, { userId, actorId, type })
  }
}

export async function deleteNotification({
  userId,
  actorId,
  type,
  postId,
}: {
  userId: string
  actorId: string
  type: NotificationType
  postId?: string
}) {
  if (userId === actorId) return
  let q = supabase.from('notifications')
    .delete()
    .eq('user_id', userId)
    .eq('actor_id', actorId)
    .eq('type', type)
  if (postId) q = q.eq('post_id', postId)
  else q = q.is('post_id', null)
  await q
}
