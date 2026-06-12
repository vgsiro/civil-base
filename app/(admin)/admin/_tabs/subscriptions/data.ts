import type { SupabaseClient } from '@supabase/supabase-js'
import type { SubUser } from '../../_lib/types'
import type { SubscriptionRow, SubscriptionTier } from '../../../../_types'
import { createNotification } from '../../../../_lib/notify'

export interface UpgradeRequest {
  id: string
  user_id: string
  requested_tier: 'pro' | 'premium'
  message: string | null
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

export async function fetchAllUsers(supabase: SupabaseClient): Promise<SubUser[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id,display_name,username,avatar_color,avatar_url,email')
    .order('created_at', { ascending: false })
    .limit(1000)
  if (error) console.error('[Admin] fetchAllUsers error:', error.message)
  return ((data as any[]) ?? []).map(p => ({ ...p, email: p.email ?? null }))
}

export async function fetchSubscriptions(supabase: SupabaseClient): Promise<SubscriptionRow[]> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('id,user_id,tier,granted_by,granted_at,expires_at,note,created_at')
    .order('granted_at', { ascending: false })
    .limit(500)
  if (error) console.error('[Admin] fetchSubscriptions error:', error.message)
  return (data as unknown as SubscriptionRow[]) ?? []
}

const TIER_RANK: Record<string, number> = { normal: 0, pro: 1, premium: 2, admin: 3 }

export async function grantTier(
  supabase: SupabaseClient,
  userId: string,
  tier: Exclude<SubscriptionTier, 'main_admin'>,
  days: number | null,
  note: string,
): Promise<void> {
  const { data: { user: adminUser } } = await supabase.auth.getUser()
  const expiresAt = days ? new Date(Date.now() + days * 86400000).toISOString() : null

  // Detect downgrade: find current active tier for the user
  const { data: current } = await supabase
    .from('subscriptions')
    .select('tier, expires_at')
    .eq('user_id', userId)
    .order('granted_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  const currentTier = (current && (!current.expires_at || new Date(current.expires_at) > new Date()))
    ? (current.tier as string) : 'normal'

  const { error } = await supabase.from('subscriptions').insert({
    user_id: userId, tier,
    granted_by: adminUser?.id ?? null,
    expires_at: expiresAt,
    note: note.trim() || null,
  })
  if (error) throw error

  if (adminUser && TIER_RANK[tier] > TIER_RANK[currentTier]) {
    // Upgrade by admin
    createNotification({
      userId, actorId: adminUser.id, type: 'upgrade_approved',
      message: `[tier:${tier}] Your ${tier === 'premium' ? 'Premium' : tier === 'admin' ? 'Admin' : 'Pro'} access has been granted by the admin!`,
      skipSelfCheck: true,
    })
  } else if (adminUser && TIER_RANK[tier] < TIER_RANK[currentTier]) {
    // Downgrade by admin
    createNotification({
      userId, actorId: adminUser.id, type: 'tier_downgraded',
      message: `[from:${currentTier}][to:${tier}]`,
      skipSelfCheck: true,
    })
  }
}

export async function fetchUpgradeRequests(supabase: SupabaseClient): Promise<UpgradeRequest[]> {
  const { data, error } = await supabase
    .from('upgrade_requests')
    .select('id,user_id,requested_tier,message,status,reviewed_by,reviewed_at,created_at')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) console.error('[Admin] fetchUpgradeRequests error:', error.message)
  return (data as unknown as UpgradeRequest[]) ?? []
}

export async function approveUpgradeRequest(
  supabase: SupabaseClient,
  req: UpgradeRequest,
  days: number | null,
): Promise<void> {
  const { data: { user: adminUser } } = await supabase.auth.getUser()

  await grantTier(supabase, req.user_id, req.requested_tier, days, `Approved upgrade request`)

  const { error } = await supabase
    .from('upgrade_requests')
    .update({ status: 'approved', reviewed_by: adminUser?.id ?? null, reviewed_at: new Date().toISOString() }) // ts-ok: audit stamp, never compared/ordered
    .eq('id', req.id)
  if (error) throw error

  if (adminUser) {
    createNotification({
      userId: req.user_id, actorId: adminUser.id, type: 'upgrade_approved',
      message: `[tier:${req.requested_tier}] Your ${req.requested_tier === 'premium' ? 'Premium' : 'Pro'} upgrade request was approved!`,
      skipSelfCheck: true,
    })
  }
}

export async function rejectUpgradeRequest(
  supabase: SupabaseClient,
  req: UpgradeRequest,
  reason?: string,
): Promise<void> {
  const { data: { user: adminUser } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('upgrade_requests')
    .update({ status: 'rejected', reviewed_by: adminUser?.id ?? null, reviewed_at: new Date().toISOString() }) // ts-ok: audit stamp, never compared/ordered
    .eq('id', req.id)
  if (error) throw error

  if (adminUser) {
    createNotification({
      userId: req.user_id, actorId: adminUser.id, type: 'upgrade_rejected',
      message: reason?.trim()
        ? `[tier:${req.requested_tier}] ${reason.trim()}`
        : `[tier:${req.requested_tier}]`,
      skipSelfCheck: true,
    })
  }
}
