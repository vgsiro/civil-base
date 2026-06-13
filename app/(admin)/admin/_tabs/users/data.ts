import type { SupabaseClient } from '@supabase/supabase-js'
import type { UserRow, RangeMode } from '../../_lib/types'
import { getRangeSince, getRangeTo } from '../../_lib/constants'

function applyRange(q: any, range: RangeMode) {
  const since = getRangeSince(range)
  const to = getRangeTo(range)
  if (since) q = q.gte('created_at', since)
  if (to) q = q.lte('created_at', to)
  return q
}

export async function fetchUsers(supabase: SupabaseClient, range: RangeMode): Promise<UserRow[]> {
  const { data: profiles } = await applyRange(
    supabase.from('profiles')
      .select('id,username,display_name,full_name,profession,specializations,is_verified,is_professional,avatar_color,avatar_url,email,created_at')
      .order('created_at', { ascending: false })
      .limit(200),
    range,
  )
  if (!profiles?.length) return []

  // Fetch latest active subscription tier per user
  const userIds = (profiles as any[]).map(p => p.id)
  const { data: subs } = await supabase
    .from('subscriptions')
    .select('user_id,tier,expires_at')
    .in('user_id', userIds)
    .order('granted_at', { ascending: false })

  const tierMap: Record<string, string> = {}
  for (const s of (subs as any[]) ?? []) {
    if (tierMap[s.user_id]) continue
    const expired = s.expires_at && new Date(s.expires_at) < new Date()
    tierMap[s.user_id] = expired ? 'normal' : s.tier
  }

  return (profiles as any[]).map(p => ({
    ...p,
    subscription_tier: tierMap[p.id] ?? 'normal',
  })) as UserRow[]
}

export async function toggleUserVerified(supabase: SupabaseClient, userId: string, isVerified: boolean) {
  const { error } = await supabase.rpc('admin_toggle_verified', { p_user_id: userId, p_is_verified: isVerified })
  if (error) throw error
}
