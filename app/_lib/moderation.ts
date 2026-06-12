'use client'
import { supabase } from '@/lib/supabase'

export type ReportReason = 'spam' | 'harassment' | 'impersonation' | 'inappropriate' | 'other'

/** Block a user: they can no longer message you and their content is hidden from you. */
export async function blockUser(blockerId: string, blockedId: string) {
  const { error } = await supabase
    .from('blocked_users')
    .upsert({ blocker_id: blockerId, blocked_id: blockedId }, { onConflict: 'blocker_id,blocked_id' })
  return { error }
}

/** Remove a block. */
export async function unblockUser(blockerId: string, blockedId: string) {
  const { error } = await supabase
    .from('blocked_users')
    .delete()
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId)
  return { error }
}

/** Whether blockerId has blocked blockedId. */
export async function isBlocked(blockerId: string, blockedId: string) {
  const { data } = await supabase
    .from('blocked_users')
    .select('blocker_id')
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId)
    .maybeSingle()
  return !!data
}

/** Whether targetId has blocked viewerId (i.e. viewer is blocked by the profile they're viewing). */
export async function isBlockedByThem(viewerId: string, targetId: string) {
  const { data } = await supabase
    .from('blocked_users')
    .select('blocker_id')
    .eq('blocker_id', targetId)
    .eq('blocked_id', viewerId)
    .maybeSingle()
  return !!data
}

/** IDs of all users in a block relationship with userId (either direction). */
export async function getBlockedIds(userId: string): Promise<string[]> {
  const { data } = await supabase
    .from('blocked_users')
    .select('blocker_id, blocked_id')
    .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`)
  return (data ?? []).map((r: any) =>
    r.blocker_id === userId ? r.blocked_id : r.blocker_id
  )
}

/** File a report against a profile for admin review. */
export async function reportUser(reporterId: string, reportedId: string, reason: ReportReason, details?: string) {
  const { error } = await supabase
    .from('user_reports')
    .insert({ reporter_id: reporterId, reported_id: reportedId, reason, details: details ?? null })
  return { error }
}

/** Clear a conversation for the current user only (the other person keeps their copy).
 *  Stamps deleted_at with the server clock (now()) via RPC so the boundary stays on the
 *  same clock as message.created_at — a client timestamp can lag the server and let old
 *  messages slip past the gt('created_at', deleted_at) filter. */
export async function deleteChatForMe(conversationId: string, userId: string) {
  const { data, error } = await supabase.rpc('delete_chat_for_me', {
    p_conversation_id: conversationId,
    p_user_id: userId,
  })
  return { error, deletedAt: data as string | null }
}
