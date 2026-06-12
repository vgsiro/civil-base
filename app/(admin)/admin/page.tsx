'use client'
import { useEffect, useRef, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ShieldCheck, Users, FileText, BarChart3,
  AlertTriangle, MessageSquarePlus, CreditCard, LogOut, ChevronDown, Check, Calendar, Wrench,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Tab, Stats, ChartData, VerifyRequest, UserRow, PostRow, Warning, RangeMode } from './_lib/types'
import type { SubscriptionRow } from '../../_types'
import type { SubUser } from './_lib/types'
import { ADMIN_EMAIL, rangeLabel } from './_lib/constants'
import { fetchStats, fetchCharts } from './_tabs/stats/data'
import { fetchVerifyRequests } from './_tabs/verify/data'
import { fetchUsers } from './_tabs/users/data'
import { fetchPosts } from './_tabs/posts/data'
import { fetchWarnings } from './_tabs/warnings/data'
import { fetchAllUsers, fetchSubscriptions, fetchUpgradeRequests } from './_tabs/subscriptions/data'
import StatsTab        from './_tabs/stats/index'
import VerifyTab       from './_tabs/verify/index'
import UsersTab        from './_tabs/users/index'
import PostsTab        from './_tabs/posts/index'
import TicketsTab      from './_tabs/tickets/index'
import WarningsTab     from './_tabs/warnings/index'
import SubscriptionsTab from './_tabs/subscriptions/index'
import ToolsTab         from './_tabs/tools/index'
import type { Ticket } from './_lib/types'
import { fetchTickets } from './_tabs/tickets/data'

const VALID_TABS: Tab[] = ['stats', 'verify', 'users', 'posts', 'tickets', 'warnings', 'subscriptions', 'tools']

function AdminPage() {
  useEffect(() => { document.title = 'Admin — CivilAxis' }, [])
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab') as Tab | null
  const [tab, setTabState] = useState<Tab>(VALID_TABS.includes(tabParam as Tab) ? tabParam! : 'stats')
  const [authed, setAuthed] = useState<boolean | null>(null)

  // Shared data state
  const [stats,         setStats]         = useState<Stats | null>(null)
  const [chartData,     setChartData]     = useState<ChartData | null>(null)
  const [verifyReqs,    setVerifyReqs]    = useState<VerifyRequest[]>([])
  const [users,         setUsers]         = useState<UserRow[]>([])
  const [posts,         setPosts]         = useState<PostRow[]>([])
  const [tickets,       setTickets]       = useState<Ticket[]>([])
  const [warnings,      setWarnings]      = useState<Warning[]>([])
  const [subAllUsers,        setSubAllUsers]        = useState<SubUser[]>([])
  const [subscriptions,      setSubscriptions]      = useState<SubscriptionRow[]>([])
  const [pendingUpgrades,    setPendingUpgrades]    = useState(0)
  const [loading,            setLoading]            = useState(false)

  // Time range filter
  const [timeRange,       setTimeRange]       = useState<RangeMode>({ type: 'all' })
  const [rangePickerOpen, setRangePickerOpen] = useState(false)
  const [customFrom,      setCustomFrom]      = useState(new Date().toISOString().slice(0, 10))
  const [customTo,        setCustomTo]        = useState(new Date().toISOString().slice(0, 10))
  const rangePickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function h(e: MouseEvent) {
      if (rangePickerRef.current && !rangePickerRef.current.contains(e.target as Node)) setRangePickerOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // Auth gate
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || user.email !== ADMIN_EMAIL) router.replace('/')
      else setAuthed(true)
    })
  }, [router])

  // Initial load
  useEffect(() => {
    if (!authed) return
    fetchStats(supabase).then(setStats)
    fetchCharts(supabase).then(setChartData)
    fetchVerifyRequests(supabase, timeRange).then(setVerifyReqs)
    fetchUpgradeRequests(supabase).then(reqs => setPendingUpgrades(reqs.filter(r => r.status === 'pending').length))
  }, [authed])

  // Keep a ref to timeRange so realtime callbacks always use the latest value
  const timeRangeRef = useRef(timeRange)
  useEffect(() => { timeRangeRef.current = timeRange }, [timeRange])

  // Realtime — refetch affected data on any change
  useEffect(() => {
    if (!authed) return
    const channel = supabase
      .channel('admin_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'verify_requests' }, () => {
        fetchVerifyRequests(supabase, timeRangeRef.current).then(setVerifyReqs)
        fetchStats(supabase).then(setStats)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => {
        fetchTickets(supabase, timeRangeRef.current).then(setTickets)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ticket_messages' }, () => {
        fetchTickets(supabase, timeRangeRef.current).then(setTickets)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'upgrade_requests' }, () => {
        fetchUpgradeRequests(supabase).then(reqs => setPendingUpgrades(reqs.filter(r => r.status === 'pending').length))
        fetchSubscriptions(supabase).then(setSubscriptions)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions' }, () => {
        fetchSubscriptions(supabase).then(setSubscriptions)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_warnings' }, () => {
        fetchWarnings(supabase, timeRangeRef.current).then(setWarnings)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        fetchPosts(supabase, timeRangeRef.current).then(setPosts)
        fetchStats(supabase).then(setStats)
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') console.log('[Admin] Realtime channel subscribed')
        if (status === 'CHANNEL_ERROR') console.error('[Admin] Realtime channel error')
      })
    return () => { supabase.removeChannel(channel) }
  }, [authed])

  // Tab-driven load
  useEffect(() => {
    if (!authed) return
    if (tab === 'verify')        fetchVerifyRequests(supabase, timeRange).then(setVerifyReqs)
    if (tab === 'users')         { setLoading(true); fetchUsers(supabase, timeRange).then(d => { setUsers(d); setLoading(false) }) }
    if (tab === 'posts')         { setLoading(true); fetchPosts(supabase, timeRange).then(d => { setPosts(d); setLoading(false) }); fetchWarnings(supabase, timeRange).then(setWarnings) }
    if (tab === 'tickets')       { setLoading(true); fetchTickets(supabase, timeRange).then(d => { setTickets(d); setLoading(false) }) }
    if (tab === 'warnings')      { setLoading(true); fetchWarnings(supabase, timeRange).then(d => { setWarnings(d); setLoading(false) }) }
    if (tab === 'subscriptions') {
      setLoading(true)
      Promise.all([fetchAllUsers(supabase), fetchSubscriptions(supabase)]).then(([u, s]) => {
        setSubAllUsers(u)
        setSubscriptions(s)
        setLoading(false)
      })
    }
  }, [tab, authed, timeRange])

  // Fallback: populate subAllUsers from users list if profiles fetch returned nothing
  useEffect(() => {
    if (tab === 'subscriptions' && subAllUsers.length === 0 && users.length > 0) {
      setSubAllUsers(users.map(u => ({ id: u.id, display_name: u.display_name, username: u.username, avatar_color: u.avatar_color, avatar_url: null, email: null })))
    }
  }, [users, tab])

  function setTab(t: Tab) {
    setTabState(t)
    router.replace(`/admin?tab=${t}`, { scroll: false })
  }

  const openTicketsCount = tickets.filter(t => t.status === 'open').length
  const pending = verifyReqs.filter(r => r.status === 'pending')

  const TABS: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'stats',         label: 'Overview',        icon: <BarChart3 size={16} /> },
    { id: 'verify',        label: 'Verify Requests', icon: <ShieldCheck size={16} />, badge: stats?.pendingVerify },
    { id: 'users',         label: 'Users',           icon: <Users size={16} /> },
    { id: 'posts',         label: 'Posts',           icon: <FileText size={16} /> },
    { id: 'tickets',       label: 'Tickets',         icon: <MessageSquarePlus size={16} />, badge: openTicketsCount || undefined },
    { id: 'warnings',      label: 'Warnings',        icon: <AlertTriangle size={16} /> },
    { id: 'subscriptions', label: 'Subscriptions',   icon: <CreditCard size={16} />, badge: pendingUpgrades || undefined },
    { id: 'tools',         label: 'Tool Access',     icon: <Wrench size={16} /> },
  ]

  if (authed === null) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#64748b', fontSize: 15 }}>Checking access…</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', fontFamily: 'inherit' }}>

      {/* Top bar */}
      <div style={{ background: '#1e293b', borderBottom: '1px solid #334155', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/logo.png" alt="CivilAxis" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} />
          <span style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9' }}>CivilAxis Admin</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', background: '#0f172a', borderRadius: 6, padding: '2px 8px', border: '1px solid #334155' }}>Internal</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}>
            ← Back to app
          </a>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1px solid #334155', background: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 56px)' }}>

        {/* Sidebar */}
        <div style={{ width: 220, background: '#1e293b', borderRight: '1px solid #334155', padding: '16px 12px', flexShrink: 0 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', borderRadius: 8, border: 'none', background: tab === t.id ? '#3b82f620' : 'none', color: tab === t.id ? '#60a5fa' : '#94a3b8', fontSize: 14, fontWeight: tab === t.id ? 700 : 400, cursor: 'pointer', marginBottom: 2, textAlign: 'left' as const, position: 'relative' }}
              onMouseEnter={e => { if (tab !== t.id) e.currentTarget.style.background = '#ffffff08' }}
              onMouseLeave={e => { if (tab !== t.id) e.currentTarget.style.background = 'none' }}>
              {t.icon}
              {t.label}
              {!!t.badge && (
                <span style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', borderRadius: 20, fontSize: 10, fontWeight: 800, padding: '1px 6px', minWidth: 18, textAlign: 'center' as const }}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>

          {/* Time range filter — shown on all tabs except stats, subscriptions and tools */}
          {tab !== 'stats' && tab !== 'subscriptions' && tab !== 'tools' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase' as const, letterSpacing: 0.8 }}>Period:</span>
              <div ref={rangePickerRef} style={{ position: 'relative' as const }}>
                <button onClick={() => setRangePickerOpen(o => !o)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
                  <Calendar size={13} color="#64748b" />
                  {rangeLabel(timeRange)}
                  <ChevronDown size={14} color="#64748b" style={{ transform: rangePickerOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
                </button>
                {rangePickerOpen && (
                  <div style={{ position: 'absolute' as const, top: 'calc(100% + 6px)', left: 0, zIndex: 60, background: '#1e293b', border: '1px solid #334155', borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', width: 240, overflow: 'hidden' }}>
                    <div style={{ padding: '6px 0' }}>
                      <button onClick={() => { setTimeRange({ type: 'all' }); setRangePickerOpen(false) }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '9px 14px', border: 'none', background: timeRange.type === 'all' ? '#3b82f610' : 'none', color: timeRange.type === 'all' ? '#60a5fa' : '#e2e8f0', fontSize: 13, fontWeight: 700, cursor: 'pointer', textAlign: 'left' as const }}
                        onMouseEnter={e => { if (timeRange.type !== 'all') e.currentTarget.style.background = '#ffffff08' }}
                        onMouseLeave={e => { if (timeRange.type !== 'all') e.currentTarget.style.background = 'none' }}>
                        All time {timeRange.type === 'all' && <Check size={13} color="#60a5fa" />}
                      </button>
                      <div style={{ height: 1, background: '#334155', margin: '4px 0' }} />
                      {[
                        { days: 7, label: 'Last 7 days' }, { days: 14, label: 'Last 14 days' },
                        { days: 30, label: 'Last 30 days' }, { days: 90, label: 'Last 90 days' },
                        { days: 180, label: 'Last 180 days' }, { days: 365, label: 'Last year' },
                      ].map(p => {
                        const active = timeRange.type === 'preset' && timeRange.days === p.days
                        return (
                          <button key={p.days} onClick={() => { setTimeRange({ type: 'preset', days: p.days, label: p.label }); setRangePickerOpen(false) }}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '8px 14px', border: 'none', background: active ? '#3b82f610' : 'none', color: active ? '#60a5fa' : '#e2e8f0', fontSize: 13, cursor: 'pointer', textAlign: 'left' as const }}
                            onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#ffffff08' }}
                            onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'none' }}>
                            {p.label} {active && <Check size={13} color="#60a5fa" />}
                          </button>
                        )
                      })}
                    </div>
                    <div style={{ borderTop: '1px solid #334155', padding: '12px 14px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: 0.8, marginBottom: 8 }}>Custom range</div>
                      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                        <div>
                          <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>From</label>
                          <input type="date" value={customFrom} max={customTo} onChange={e => setCustomFrom(e.target.value)}
                            style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', fontSize: 13, outline: 'none', colorScheme: 'dark', boxSizing: 'border-box' as const }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>To</label>
                          <input type="date" value={customTo} min={customFrom} max={new Date().toISOString().slice(0, 10)} onChange={e => setCustomTo(e.target.value)}
                            style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', fontSize: 13, outline: 'none', colorScheme: 'dark', boxSizing: 'border-box' as const }} />
                        </div>
                        <button
                          onClick={() => { if (customFrom && customTo && customFrom <= customTo) { setTimeRange({ type: 'custom', from: customFrom, to: customTo }); setRangePickerOpen(false) } }}
                          disabled={!customFrom || !customTo || customFrom > customTo}
                          style={{ padding: '7px 0', borderRadius: 7, border: 'none', background: customFrom && customTo && customFrom <= customTo ? '#3b82f6' : '#334155', color: customFrom && customTo && customFrom <= customTo ? '#fff' : '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab panels */}
          {tab === 'stats' && (
            <StatsTab stats={stats} chartData={chartData} pendingVerify={pending} onGoToVerify={() => setTab('verify')} />
          )}
          {tab === 'verify' && (
            <VerifyTab requests={verifyReqs} setRequests={setVerifyReqs} users={users} setUsers={setUsers} setStats={setStats} range={timeRange} />
          )}
          {tab === 'users' && (
            <UsersTab users={users} setUsers={setUsers} setStats={setStats} loading={loading} setLoading={setLoading} range={timeRange} />
          )}
          {tab === 'posts' && (
            <PostsTab posts={posts} setPosts={setPosts} setWarnings={setWarnings} loading={loading} setLoading={setLoading} range={timeRange} />
          )}
          {tab === 'tickets' && (
            <TicketsTab tickets={tickets} setTickets={setTickets} loading={loading} setLoading={setLoading} range={timeRange} />
          )}
          {tab === 'warnings' && (
            <WarningsTab warnings={warnings} setWarnings={setWarnings} loading={loading} setLoading={setLoading} range={timeRange} />
          )}
          {tab === 'subscriptions' && (
            <SubscriptionsTab
              allUsers={subAllUsers} setAllUsers={setSubAllUsers}
              subscriptions={subscriptions} setSubscriptions={setSubscriptions}
              loading={loading} setLoading={setLoading}
              onPendingUpgradesChange={setPendingUpgrades}
            />
          )}
          {tab === 'tools' && <ToolsTab />}

        </div>
      </div>
    </div>
  )
}

export default function AdminPageWrapper() {
  return <Suspense><AdminPage /></Suspense>
}
