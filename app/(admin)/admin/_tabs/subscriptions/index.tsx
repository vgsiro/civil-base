'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { SubscriptionRow, SubscriptionTier } from '../../../../_types'
import type { SubUser } from '../../_lib/types'
import {
  fetchAllUsers, fetchSubscriptions, grantTier,
  fetchUpgradeRequests, approveUpgradeRequest, rejectUpgradeRequest,
  type UpgradeRequest,
} from './data'
import {
  effectiveTier, TierStatsCards, PlanFeatureCards,
  UsersTable, GrantHistoryTable, GrantModal, UpgradeRequestsPanel,
} from './ui'

interface Props {
  allUsers: SubUser[]
  setAllUsers: React.Dispatch<React.SetStateAction<SubUser[]>>
  subscriptions: SubscriptionRow[]
  setSubscriptions: React.Dispatch<React.SetStateAction<SubscriptionRow[]>>
  loading: boolean
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
  onPendingUpgradesChange?: (count: number) => void
}

type SubTab = 'users' | 'requests'
const VALID_SUBS: SubTab[] = ['users', 'requests']

export default function SubscriptionsTab({ allUsers, setAllUsers, subscriptions, setSubscriptions, loading, setLoading, onPendingUpgradesChange }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const subParam = searchParams.get('sub') as SubTab | null
  const [subTab, setSubTabState] = useState<SubTab>(VALID_SUBS.includes(subParam as SubTab) ? subParam! : 'users')

  function setSubTab(t: SubTab) {
    setSubTabState(t)
    router.replace(`/admin?tab=subscriptions&sub=${t}`, { scroll: false })
  }

  // Sync if URL param changes externally
  useEffect(() => {
    if (subParam && VALID_SUBS.includes(subParam)) setSubTabState(subParam)
  }, [subParam])

  const [subSearch, setSubSearch] = useState('')
  const [subTierFilter, setSubTierFilter] = useState<string>('all')
  const [grantModal, setGrantModal] = useState<{ userId: string; name: string } | null>(null)
  const [grantTierVal, setGrantTierVal] = useState<Exclude<SubscriptionTier, 'main_admin'>>('pro')
  const [grantDays, setGrantDays] = useState<number | null>(30)
  const [grantNote, setGrantNote] = useState('')
  const [grantSaving, setGrantSaving] = useState(false)

  const [upgradeRequests, setUpgradeRequests] = useState<UpgradeRequest[]>([])
  const [requestsLoading, setRequestsLoading] = useState(false)

  const pendingCount = upgradeRequests.filter(r => r.status === 'pending').length

  async function refresh() {
    setLoading(true)
    const [users, subs] = await Promise.all([fetchAllUsers(supabase), fetchSubscriptions(supabase)])
    setAllUsers(users)
    setSubscriptions(subs)
    setLoading(false)
  }

  async function refreshRequests() {
    setRequestsLoading(true)
    const reqs = await fetchUpgradeRequests(supabase)
    setUpgradeRequests(reqs)
    onPendingUpgradesChange?.(reqs.filter(r => r.status === 'pending').length)
    setRequestsLoading(false)
  }

  useEffect(() => { refreshRequests() }, [])

  const latestByUser: Record<string, SubscriptionRow> = {}
  for (const s of subscriptions) {
    if (!latestByUser[s.user_id]) latestByUser[s.user_id] = s
  }

  const userRows = allUsers.map(u => ({
    ...u,
    tier: effectiveTier(u.id, u.email, latestByUser),
    sub: latestByUser[u.id] ?? null,
  }))

  const counts: Record<string, number> = { normal: 0, pro: 0, premium: 0, admin: 0 }
  for (const u of userRows) {
    if (u.tier !== 'main_admin') counts[u.tier] = (counts[u.tier] ?? 0) + 1
  }

  const q = subSearch.toLowerCase()
  const filteredUsers = userRows.filter(u => {
    const matchTier = subTierFilter === 'all' || u.tier === subTierFilter
    const matchSearch = !subSearch ||
      (u.display_name ?? '').toLowerCase().includes(q) ||
      (u.username ?? '').toLowerCase().includes(q) ||
      (u.email ?? '').toLowerCase().includes(q)
    return matchTier && matchSearch
  })

  const filteredHistory = subscriptions.filter(s => {
    if (!subSearch) return true
    const p = allUsers.find(u => u.id === s.user_id) ?? null
    return (p?.display_name ?? '').toLowerCase().includes(q) || (p?.username ?? '').toLowerCase().includes(q)
  })

  async function handleGrant() {
    if (!grantModal) return
    setGrantSaving(true)
    try {
      await grantTier(supabase, grantModal.userId, grantTierVal, grantDays, grantNote)
      setGrantModal(null); setGrantTierVal('pro'); setGrantDays(30); setGrantNote('')
      await refresh()
    } catch (err: any) {
      alert(`Failed to grant tier: ${err.message}`)
    }
    setGrantSaving(false)
  }

  async function handleApprove(req: UpgradeRequest, days: number | null) {
    await approveUpgradeRequest(supabase, req, days)
    await Promise.all([refresh(), refreshRequests()])
  }

  async function handleReject(req: UpgradeRequest, reason: string) {
    await rejectUpgradeRequest(supabase, req, reason)
    await refreshRequests()
  }

  const SUB_TABS: { id: SubTab; label: string; count: number; color: string }[] = [
    { id: 'users',    label: 'Users',            count: filteredUsers.length, color: '#6366f1' },
    { id: 'requests', label: 'Upgrade Requests', count: pendingCount,         color: '#f59e0b' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {grantModal && (
        <GrantModal
          userId={grantModal.userId} name={grantModal.name}
          tier={grantTierVal} days={grantDays} note={grantNote} saving={grantSaving}
          onUserIdChange={v => setGrantModal(m => m ? { ...m, userId: v } : m)}
          onTierChange={setGrantTierVal} onDaysChange={setGrantDays} onNoteChange={setGrantNote}
          onCancel={() => setGrantModal(null)} onSave={handleGrant}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9' }}>Subscriptions</div>
        <button onClick={() => { refresh(); refreshRequests() }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: '1px solid #334155', background: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <TierStatsCards counts={counts} activeFilter={subTierFilter} onFilter={setSubTierFilter} />
      <PlanFeatureCards />

      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #1e293b', paddingBottom: 0 }}>
        {SUB_TABS.map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)} style={{
            padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', borderRadius: '8px 8px 0 0',
            background: subTab === t.id ? '#1e293b' : 'none',
            color: subTab === t.id ? t.color : '#475569',
            borderBottom: subTab === t.id ? `2px solid ${t.color}` : '2px solid transparent',
            transition: 'all 0.12s',
          }}>
            {t.label}
            {t.count > 0 && (
              <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 700, background: subTab === t.id ? t.color + '25' : '#1e293b', color: subTab === t.id ? t.color : '#475569', borderRadius: 10, padding: '1px 6px' }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {subTab === 'users' && (
        <>
          <UsersTable
            users={filteredUsers}
            search={subSearch} tierFilter={subTierFilter}
            onSearchChange={setSubSearch} onTierFilterChange={setSubTierFilter}
            loading={loading}
            onGrant={() => setGrantModal({ userId: '', name: 'manual' })}
            onOpenGrant={u => {
              setGrantModal({ userId: u.id, name: u.display_name || u.username || u.id.slice(0, 8) })
              setGrantTierVal(u.tier === 'normal' ? 'pro' : u.tier === 'pro' ? 'premium' : 'normal')
              setGrantDays(30); setGrantNote('')
            }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>Grant History</div>
              <span style={{ fontSize: 12, color: '#334155' }}>{filteredHistory.length} record{filteredHistory.length !== 1 ? 's' : ''}</span>
            </div>
            <GrantHistoryTable history={filteredHistory} allUsers={allUsers} />
          </div>
        </>
      )}

      {subTab === 'requests' && (
        <UpgradeRequestsPanel
          requests={upgradeRequests}
          allUsers={allUsers}
          loading={requestsLoading}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  )
}
