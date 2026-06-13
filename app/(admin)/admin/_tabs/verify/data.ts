import type { SupabaseClient } from '@supabase/supabase-js'
import type { VerifyRequest } from '../../_lib/types'
import type { RangeMode } from '../../_lib/types'
import { getRangeSince, getRangeTo } from '../../_lib/constants'
import { createNotification } from '../../../../_lib/notify'

function applyRange(q: any, range: RangeMode) {
  const since = getRangeSince(range)
  const to = getRangeTo(range)
  if (since) q = q.gte('created_at', since)
  if (to) q = q.lte('created_at', to)
  return q
}

export async function fetchVerifyRequests(supabase: SupabaseClient, range: RangeMode): Promise<VerifyRequest[]> {
  const { data } = await applyRange(
    supabase.from('verify_requests')
      .select('*, profiles!verify_requests_user_id_fkey(pending_specializations)')
      .neq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(100),
    range,
  )
  return ((data as any[]) ?? []).map(r => ({
    ...r,
    specializations: r.profiles?.pending_specializations ?? null,
    profiles: undefined,
  })) as VerifyRequest[]
}

export async function approveVerifyRequest(supabase: SupabaseClient, req: VerifyRequest) {
  const { data: prof } = await supabase
    .from('profiles')
    .select('pending_profession, pending_specializations')
    .eq('id', req.user_id)
    .single()

  const { error } = await supabase.rpc('admin_approve_verify', {
    p_user_id: req.user_id,
    p_profession: prof?.pending_profession ?? null,
    p_specializations: prof?.pending_specializations ?? null,
    p_is_professional: req.is_professional ?? true,
  })
  if (error) throw error

  const { data: { user: adminUser } } = await supabase.auth.getUser()
  if (adminUser) {
    createNotification({
      userId: req.user_id, actorId: adminUser.id, type: 'verify_approved',
      message: 'Your professional verification was approved! Your profession badge is now visible on your posts.',
      skipSelfCheck: true,
    })
  }
  return prof
}

export async function rejectVerifyRequest(supabase: SupabaseClient, req: VerifyRequest) {
  await supabase.from('verify_requests').update({ status: 'rejected' }).eq('id', req.id)
  const { data: { user: adminUser } } = await supabase.auth.getUser()
  if (adminUser) {
    createNotification({
      userId: req.user_id, actorId: adminUser.id, type: 'verify_rejected',
      message: 'Your verification request was reviewed but could not be approved at this time. You may resubmit with additional documentation.',
      skipSelfCheck: true,
    })
  }
}
