import type { SupabaseClient } from '@supabase/supabase-js'
import type { Stats, ChartData, DayCount } from '../../_lib/types'

export async function fetchStats(supabase: SupabaseClient): Promise<Stats> {
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const [
    { count: users }, { count: posts }, { count: pending },
    { count: verified }, { count: todayViews }, { count: totalViews },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('posts').select('*', { count: 'exact', head: true }),
    supabase.from('verify_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_verified', true),
    supabase.from('page_views').select('*', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
    supabase.from('page_views').select('*', { count: 'exact', head: true }),
  ])
  return {
    users: users ?? 0, posts: posts ?? 0, pendingVerify: pending ?? 0,
    verifiedUsers: verified ?? 0, todayViews: todayViews ?? 0, totalViews: totalViews ?? 0,
  }
}

export async function fetchCharts(supabase: SupabaseClient): Promise<ChartData> {
  const since = new Date(); since.setDate(since.getDate() - 29); since.setHours(0, 0, 0, 0)
  const [{ data: viewRows }, { data: userRows }, { data: postRows }] = await Promise.all([
    supabase.from('page_views').select('created_at').gte('created_at', since.toISOString()),
    supabase.from('profiles').select('created_at').gte('created_at', since.toISOString()),
    supabase.from('posts').select('created_at').gte('created_at', since.toISOString()),
  ])

  function toDayCounts(rows: { created_at: string }[] | null): DayCount[] {
    const map: Record<string, number> = {}
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0)
      map[d.toISOString().slice(0, 10)] = 0
    }
    for (const r of rows ?? []) {
      const key = r.created_at.slice(0, 10)
      if (key in map) map[key]++
    }
    return Object.entries(map).map(([date, count]) => ({ date, count }))
  }

  return {
    views30: toDayCounts(viewRows),
    users30: toDayCounts(userRows),
    posts30: toDayCounts(postRows),
  }
}
