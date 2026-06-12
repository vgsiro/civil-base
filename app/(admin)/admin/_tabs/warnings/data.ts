import type { SupabaseClient } from '@supabase/supabase-js'
import type { Warning, RangeMode } from '../../_lib/types'
import { getRangeSince, getRangeTo } from '../../_lib/constants'

function applyRange(q: any, range: RangeMode) {
  const since = getRangeSince(range)
  const to = getRangeTo(range)
  if (since) q = q.gte('created_at', since)
  if (to) q = q.lte('created_at', to)
  return q
}

export async function fetchWarnings(supabase: SupabaseClient, range: RangeMode): Promise<Warning[]> {
  const { data, error } = await applyRange(
    supabase.from('user_warnings').select('*, profiles:user_id(username, display_name)')
      .order('created_at', { ascending: false }).limit(200),
    range,
  )
  if (error) console.error('[Admin] fetchWarnings error:', error.message)
  return (data as unknown as Warning[]) ?? []
}

export async function expireWarning(supabase: SupabaseClient, warningId: string, userId: string, remainingWarnings: Warning[]) {
  // Expire on the server clock so expires_at stays consistent with count_active_warnings()
  const { data: now } = await supabase.rpc('expire_warning', { p_warning_id: warningId })
  const ts = (now as string) ?? new Date().toISOString()
  const remaining = remainingWarnings.filter(w => w.id !== warningId && w.user_id === userId && new Date(w.expires_at) > new Date(ts))
  if (remaining.length < 3) {
    await supabase.from('profiles').update({ is_banned: false }).eq('id', userId)
  }
  return ts
}
