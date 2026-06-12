'use client'
import { Check, Tag, CreditCard, Search, ExternalLink, Clock, CheckCircle, XCircle } from 'lucide-react'
import { useState } from 'react'
import type { UpgradeRequest } from './data'
import { tierLabel, tierColor, tierBg } from '../../../../../lib/useSubscription'
import type { SubscriptionRow, SubscriptionTier } from '../../../../_types'
import type { SubUser } from '../../_lib/types'
import { ADMIN_EMAIL, AVATAR_COLORS } from '../../_lib/constants'
import { TierBadge } from '../../_components/TierBadge'
import { AvatarCell } from '../../_components/AvatarCell'

export const TIER_DEFS: { tier: Exclude<SubscriptionTier, 'main_admin'>; features: string[] }[] = [
  { tier: 'normal',  features: ['Access all tools', 'See result summaries', 'Community access'] },
  { tier: 'pro',     features: ['Everything in Normal', 'Full result details', 'All calculation breakdowns'] },
  { tier: 'premium', features: ['Everything in Pro', 'Export PDF reports', 'Priority support'] },
  { tier: 'admin',   features: ['Everything in Pro', 'Admin panel access', 'Content moderation'] },
]

export function effectiveTier(userId: string, email: string | null, latestByUser: Record<string, SubscriptionRow>): SubscriptionTier {
  if (email === ADMIN_EMAIL) return 'main_admin'
  const row = latestByUser[userId]
  if (!row) return 'normal'
  if (row.expires_at && new Date(row.expires_at) < new Date()) return 'normal'
  return row.tier
}

// ── Tier stats cards ──────────────────────────────────────────────────────────
interface StatsCardsProps {
  counts: Record<string, number>
  activeFilter: string
  onFilter: (t: string) => void
}

export function TierStatsCards({ counts, activeFilter, onFilter }: StatsCardsProps) {
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
      {(['normal', 'pro', 'premium', 'admin'] as const).map(t => (
        <div key={t} onClick={() => onFilter(activeFilter === t ? 'all' : t)}
          style={{ background: '#1e293b', border: `1px solid ${activeFilter === t ? tierColor(t) : tierColor(t) + '40'}`, borderRadius: 10, padding: '12px 20px', minWidth: 110, cursor: 'pointer', transition: 'border-color 0.15s' }}>
          <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.07em', marginBottom: 4 }}>{tierLabel(t)}</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: tierColor(t) }}>{counts[t] ?? 0}</div>
        </div>
      ))}
    </div>
  )
}

// ── Plan feature cards ────────────────────────────────────────────────────────
export function PlanFeatureCards() {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 10, textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>Plan Features</div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
        {TIER_DEFS.map(({ tier, features }) => (
          <div key={tier} style={{ background: '#1e293b', border: `1px solid ${tierColor(tier)}40`, borderRadius: 10, padding: '14px 16px', minWidth: 180, flex: '1 1 180px' }}>
            <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 700, color: tierColor(tier), background: tierBg(tier), padding: '2px 10px', borderRadius: 20, marginBottom: 10 }}>{tierLabel(tier)}</div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
              {features.map(f => (
                <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12, color: '#94a3b8' }}>
                  <Check size={12} color={tierColor(tier)} style={{ marginTop: 1, flexShrink: 0 }} />{f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Users table ───────────────────────────────────────────────────────────────
type UserRowData = SubUser & { tier: SubscriptionTier; sub: SubscriptionRow | null }

interface UsersTableProps {
  users: UserRowData[]
  search: string
  tierFilter: string
  onSearchChange: (v: string) => void
  onTierFilterChange: (v: string) => void
  loading: boolean
  onGrant: () => void
  onOpenGrant: (u: UserRowData) => void
}

export function UsersTable({ users, search, tierFilter, onSearchChange, onTierFilterChange, loading, onGrant, onOpenGrant }: UsersTableProps) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' as const }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase' as const, letterSpacing: '0.07em' }}>All Users</div>
        <div style={{ position: 'relative', flex: 1, maxWidth: 260 }}>
          <Search size={13} color="#475569" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input value={search} onChange={e => onSearchChange(e.target.value)} placeholder="Search name / username…"
            style={{ width: '100%', padding: '6px 10px 6px 28px', borderRadius: 7, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', fontSize: 12, outline: 'none', boxSizing: 'border-box' as const }} />
        </div>
        <select value={tierFilter} onChange={e => onTierFilterChange(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', fontSize: 12, outline: 'none', cursor: 'pointer' }}>
          <option value="all">All tiers</option>
          <option value="normal">Normal</option>
          <option value="pro">Pro</option>
          <option value="premium">Premium</option>
          <option value="admin">Admin</option>
        </select>
        <span style={{ fontSize: 12, color: '#475569' }}>{users.length} user{users.length !== 1 ? 's' : ''}</span>
        <button onClick={onGrant}
          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Tag size={13} /> Grant Tier
        </button>
      </div>

      {loading && <div style={{ color: '#64748b', fontSize: 14 }}>Loading…</div>}
      {!loading && users.length === 0 && <div style={{ padding: '48px', textAlign: 'center' as const, color: '#64748b', fontSize: 14 }}>No users found.</div>}
      {users.length > 0 && (
        <div style={{ background: '#1e293b', borderRadius: 10, border: '1px solid #334155', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
            <thead>
              <tr style={{ background: '#0f172a' }}>
                {['User', 'Email', 'Current Tier', 'Expires', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left' as const, fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' as const, letterSpacing: '0.06em', whiteSpace: 'nowrap' as const }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const sub = u.sub
                const expired = sub?.expires_at && new Date(sub.expires_at) < new Date()
                return (
                  <tr key={u.id} style={{ borderTop: '1px solid #1e3a5f' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#ffffff04')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <AvatarCell displayName={u.display_name} username={u.username} avatarColor={u.avatar_color} avatarUrl={u.avatar_url} size={30} fontSize={11} />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{u.display_name || u.username || u.id.slice(0, 8)}</div>
                          {u.username && <div style={{ fontSize: 11, color: '#475569' }}>@{u.username}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#64748b', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                      {u.email || <span style={{ color: '#334155' }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 14px' }}><TierBadge tier={u.tier} /></td>
                    <td style={{ padding: '10px 14px', fontSize: 12, whiteSpace: 'nowrap' as const, color: expired ? '#f87171' : sub?.expires_at ? '#94a3b8' : '#475569' }}>
                      {u.tier === 'main_admin'
                        ? <span style={{ color: '#f59e0b', fontWeight: 700 }}>∞ Permanent</span>
                        : sub?.expires_at ? new Date(sub.expires_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {u.tier !== 'main_admin' && (
                          <button onClick={() => onOpenGrant(u)}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 6, border: `1px solid ${tierColor(u.tier as any)}50`, background: 'none', color: tierColor(u.tier as any), fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' as const }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#ffffff10' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                            <Tag size={10} />
                            {u.tier === 'normal' ? 'Upgrade' : u.tier === 'premium' || u.tier === 'admin' ? 'Change' : 'Upgrade / Downgrade'}
                          </button>
                        )}
                        {u.username && (
                          <a href={`/profile/${u.username}`} target="_blank" rel="noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '4px 8px', borderRadius: 6, border: '1px solid #334155', background: 'none', color: '#475569', fontSize: 11, cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap' as const }}
                            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#94a3b8'; (e.currentTarget as HTMLAnchorElement).style.background = '#ffffff08' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#475569'; (e.currentTarget as HTMLAnchorElement).style.background = 'none' }}>
                            <ExternalLink size={10} /> Profile
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Grant history table ───────────────────────────────────────────────────────
interface GrantHistoryProps {
  history: SubscriptionRow[]
  allUsers: SubUser[]
}

export function GrantHistoryTable({ history, allUsers }: GrantHistoryProps) {
  if (history.length === 0) {
    return <div style={{ padding: '32px', textAlign: 'center' as const, color: '#475569', fontSize: 13 }}>No subscription records yet.</div>
  }
  return (
    <div style={{ background: '#1e293b', borderRadius: 10, border: '1px solid #334155', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
        <thead>
          <tr style={{ background: '#0f172a' }}>
            {['User', 'Tier', 'Granted At', 'Expires At', 'Note'].map(h => (
              <th key={h} style={{ padding: '10px 14px', textAlign: 'left' as const, fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase' as const, letterSpacing: '0.06em', whiteSpace: 'nowrap' as const }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {history.map(s => {
            const p = allUsers.find(u => u.id === s.user_id) ?? null
            const expired = s.expires_at && new Date(s.expires_at) < new Date()
            const eff = (!s.expires_at || !expired) ? s.tier : 'normal'
            return (
              <tr key={s.id} style={{ borderTop: '1px solid #1e3a5f' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#ffffff04')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <td style={{ padding: '10px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AvatarCell displayName={p?.display_name ?? null} username={p?.username ?? null} avatarColor={p?.avatar_color ?? 0} avatarUrl={p?.avatar_url} size={26} fontSize={10} />
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{p?.display_name || p?.username || s.user_id.slice(0, 8)}</div>
                  </div>
                </td>
                <td style={{ padding: '10px 14px' }}><TierBadge tier={eff as any} expired={!!expired} /></td>
                <td style={{ padding: '10px 14px', fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' as const }}>{new Date(s.granted_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                <td style={{ padding: '10px 14px', fontSize: 12, color: expired ? '#f87171' : s.expires_at ? '#94a3b8' : '#34d399', whiteSpace: 'nowrap' as const }}>
                  {s.expires_at ? new Date(s.expires_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : '∞ Permanent'}
                </td>
                <td style={{ padding: '10px 14px', fontSize: 12, color: '#475569', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{s.note || '—'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ── Grant tier modal ──────────────────────────────────────────────────────────
interface GrantModalProps {
  userId: string
  name: string
  tier: Exclude<SubscriptionTier, 'main_admin'>
  days: number | null
  note: string
  saving: boolean
  onUserIdChange: (v: string) => void
  onTierChange: (t: Exclude<SubscriptionTier, 'main_admin'>) => void
  onDaysChange: (d: number | null) => void
  onNoteChange: (v: string) => void
  onCancel: () => void
  onSave: () => void
}

export function GrantModal({ userId, name, tier, days, note, saving, onUserIdChange, onTierChange, onDaysChange, onNoteChange, onCancel, onSave }: GrantModalProps) {
  return (
    <div onClick={onCancel}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: '#1e293b', borderRadius: 14, border: '1px solid #334155', width: '100%', maxWidth: 440, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: 10 }}>
          <CreditCard size={16} color="#6366f1" />
          <span style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9' }}>
            {userId ? `Change tier — ${name}` : 'Grant tier to user'}
          </span>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {!userId && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>User ID</div>
              <input placeholder="Paste user UUID…" onChange={e => onUserIdChange(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }} />
            </div>
          )}

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>Tier</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
              {(['normal', 'pro', 'premium', 'admin'] as const).map(t => (
                <button key={t} onClick={() => onTierChange(t)}
                  style={{ padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${tier === t ? tierColor(t) : '#334155'}`, background: tier === t ? tierColor(t) + '20' : 'none', color: tier === t ? tierColor(t) : '#64748b', fontSize: 12, fontWeight: tier === t ? 700 : 400, cursor: 'pointer' }}>
                  {tierLabel(t)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>Duration</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
              {([30, 90, 180, 365] as const).map(d => (
                <button key={d} onClick={() => onDaysChange(d)}
                  style={{ padding: '6px 12px', borderRadius: 20, border: `1.5px solid ${days === d ? '#6366f1' : '#334155'}`, background: days === d ? '#6366f120' : 'none', color: days === d ? '#818cf8' : '#64748b', fontSize: 12, fontWeight: days === d ? 700 : 400, cursor: 'pointer' }}>
                  {d}d
                </button>
              ))}
              <button onClick={() => onDaysChange(null)}
                style={{ padding: '6px 12px', borderRadius: 20, border: `1.5px solid ${days === null ? '#34d399' : '#334155'}`, background: days === null ? '#34d39920' : 'none', color: days === null ? '#34d399' : '#64748b', fontSize: 12, fontWeight: days === null ? 700 : 400, cursor: 'pointer' }}>
                Permanent
              </button>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>Note <span style={{ fontWeight: 400, color: '#475569' }}>(optional)</span></div>
            <input value={note} onChange={e => onNoteChange(e.target.value)} placeholder="e.g. Trial grant, sponsor account…"
              style={{ width: '100%', padding: '8px 10px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }} />
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={onCancel} style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid #334155', background: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
            <button onClick={onSave} disabled={!userId || saving}
              style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: userId ? '#6366f1' : '#334155', color: '#fff', fontSize: 13, fontWeight: 700, cursor: userId ? 'pointer' : 'default', opacity: userId ? 1 : 0.5 }}>
              {saving ? 'Saving…' : 'Grant'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Upgrade Requests Panel ────────────────────────────────────────────────────
interface UpgradeRequestsPanelProps {
  requests: UpgradeRequest[]
  allUsers: SubUser[]
  loading: boolean
  onApprove: (req: UpgradeRequest, days: number | null) => Promise<void>
  onReject: (req: UpgradeRequest, reason: string) => Promise<void>
}

const STATUS_META = {
  pending:  { label: 'Pending',  color: '#f59e0b', bg: '#fffbeb' },
  approved: { label: 'Approved', color: '#10b981', bg: '#f0fdf4' },
  rejected: { label: 'Rejected', color: '#ef4444', bg: '#fef2f2' },
}

export function UpgradeRequestsPanel({ requests, allUsers, loading, onApprove, onReject }: UpgradeRequestsPanelProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [actionReq, setActionReq] = useState<UpgradeRequest | null>(null)
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve')
  const [rejectReason, setRejectReason] = useState('')
  const [approveDays, setApproveDays] = useState<number | null>(365)
  const [saving, setSaving] = useState(false)

  const filtered = statusFilter === 'all' ? requests : requests.filter(r => r.status === statusFilter)
  const pendingCount = requests.filter(r => r.status === 'pending').length

  async function handleAction() {
    if (!actionReq) return
    setSaving(true)
    try {
      if (actionType === 'approve') await onApprove(actionReq, approveDays)
      else await onReject(actionReq, rejectReason)
      setActionReq(null); setRejectReason(''); setApproveDays(365)
    } catch (err: any) {
      alert(err.message)
    }
    setSaving(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Action modal */}
      {actionReq && (
        <div onClick={() => setActionReq(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: '#1e293b', borderRadius: 14, border: '1px solid #334155', width: '100%', maxWidth: 420, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: 10 }}>
              {actionType === 'approve'
                ? <CheckCircle size={16} color="#10b981" />
                : <XCircle size={16} color="#ef4444" />}
              <span style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9' }}>
                {actionType === 'approve' ? 'Approve upgrade' : 'Reject upgrade'}
              </span>
            </div>
            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>
                User: <strong style={{ color: '#f1f5f9' }}>{allUsers.find(u => u.id === actionReq.user_id)?.display_name || actionReq.user_id.slice(0, 8)}</strong>
                {' '}→{' '}
                <span style={{ color: tierColor(actionReq.requested_tier), fontWeight: 700 }}>{tierLabel(actionReq.requested_tier)}</span>
              </div>

              {actionType === 'approve' && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 8 }}>Duration</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
                    {([30, 90, 180, 365] as const).map(d => (
                      <button key={d} onClick={() => setApproveDays(d)}
                        style={{ padding: '6px 12px', borderRadius: 20, border: `1.5px solid ${approveDays === d ? '#6366f1' : '#334155'}`, background: approveDays === d ? '#6366f120' : 'none', color: approveDays === d ? '#818cf8' : '#64748b', fontSize: 12, fontWeight: approveDays === d ? 700 : 400, cursor: 'pointer' }}>
                        {d}d
                      </button>
                    ))}
                    <button onClick={() => setApproveDays(null)}
                      style={{ padding: '6px 12px', borderRadius: 20, border: `1.5px solid ${approveDays === null ? '#34d399' : '#334155'}`, background: approveDays === null ? '#34d39920' : 'none', color: approveDays === null ? '#34d399' : '#64748b', fontSize: 12, fontWeight: approveDays === null ? 700 : 400, cursor: 'pointer' }}>
                      Permanent
                    </button>
                  </div>
                </div>
              )}

              {actionType === 'reject' && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>Reason <span style={{ fontWeight: 400, color: '#475569' }}>(optional)</span></div>
                  <input value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                    placeholder="e.g. Not enough account activity yet"
                    style={{ width: '100%', padding: '8px 10px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }} />
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setActionReq(null)}
                  style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid #334155', background: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={handleAction} disabled={saving}
                  style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: actionType === 'approve' ? '#10b981' : '#ef4444', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                  {saving ? 'Saving…' : actionType === 'approve' ? 'Approve' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {(['pending', 'approved', 'rejected', 'all'] as const).map(s => {
          const active = statusFilter === s
          const sm = s !== 'all' ? STATUS_META[s] : null
          return (
            <button key={s} onClick={() => setStatusFilter(s)}
              style={{ padding: '5px 14px', borderRadius: 20, border: `1.5px solid ${active ? (sm?.color ?? '#6366f1') : '#334155'}`, background: active ? `${sm?.color ?? '#6366f1'}20` : 'none', color: active ? (sm?.color ?? '#818cf8') : '#64748b', fontSize: 12, fontWeight: active ? 700 : 400, cursor: 'pointer' }}>
              {s.charAt(0).toUpperCase() + s.slice(1)}{s === 'pending' && pendingCount > 0 ? ` (${pendingCount})` : ''}
            </button>
          )
        })}
      </div>

      {loading && <div style={{ color: '#64748b', fontSize: 14, padding: '24px 0', textAlign: 'center' as const }}>Loading…</div>}

      {!loading && filtered.length === 0 && (
        <div style={{ padding: '48px', textAlign: 'center' as const, color: '#475569', fontSize: 13 }}>
          No {statusFilter === 'all' ? '' : statusFilter} upgrade requests.
        </div>
      )}

      {!loading && filtered.map(req => {
        const user = allUsers.find(u => u.id === req.user_id)
        const sm = STATUS_META[req.status]
        return (
          <div key={req.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <AvatarCell displayName={user?.display_name ?? null} username={user?.username ?? null} avatarColor={user?.avatar_color ?? 0} avatarUrl={user?.avatar_url} size={34} fontSize={12} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{user?.display_name || user?.username || req.user_id.slice(0, 8)}</div>
                  {user?.email && <div style={{ fontSize: 11, color: '#475569' }}>{user.email}</div>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: tierColor(req.requested_tier), background: tierBg(req.requested_tier), padding: '2px 10px', borderRadius: 20 }}>{tierLabel(req.requested_tier)}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: sm.color, background: sm.bg, padding: '2px 10px', borderRadius: 20 }}>{sm.label}</span>
              </div>
            </div>

            {req.message && (
              <div style={{ fontSize: 13, color: '#94a3b8', background: '#0f172a', borderRadius: 8, padding: '8px 12px', lineHeight: 1.5 }}>
                "{req.message}"
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#475569' }}>
                <Clock size={10} />
                {new Date(req.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>

              {req.status === 'pending' && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => { setActionReq(req); setActionType('reject'); setRejectReason('') }}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 7, border: '1px solid #ef444440', background: 'none', color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#ef444410' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                    <XCircle size={11} /> Reject
                  </button>
                  <button
                    onClick={() => { setActionReq(req); setActionType('approve'); setApproveDays(365) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 7, border: 'none', background: '#10b981', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#059669' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#10b981' }}>
                    <CheckCircle size={11} /> Approve
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
