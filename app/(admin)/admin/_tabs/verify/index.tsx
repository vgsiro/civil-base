'use client'
import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { VerifyRequest, UserRow, Stats, RangeMode } from '../../_lib/types'
import { fetchVerifyRequests, approveVerifyRequest, rejectVerifyRequest } from './data'
import { VerifyCard } from './ui'
import { UserTableRow, RevokeModal } from '../users/ui'
import { toggleUserVerified } from '../users/data'
import { createNotification } from '../../../../_lib/notify'

type SubTab = 'pending' | 'reviewed' | 'verified'

interface Props {
  requests: VerifyRequest[]
  setRequests: React.Dispatch<React.SetStateAction<VerifyRequest[]>>
  users: UserRow[]
  setUsers: React.Dispatch<React.SetStateAction<UserRow[]>>
  setStats: React.Dispatch<React.SetStateAction<Stats | null>>
  range: RangeMode
}

export default function VerifyTab({ requests, setRequests, users, setUsers, setStats, range }: Props) {
  const [subTab, setSubTab] = useState<SubTab>('pending')
  const [expandedReq, setExpandedReq] = useState<string | null>(null)
  const [revokeModal, setRevokeModal] = useState<UserRow | null>(null)
  const [revokeReason, setRevokeReason] = useState('')
  const [revokeNote, setRevokeNote] = useState('')
  const [revokeLoading, setRevokeLoading] = useState(false)

  const pending  = requests.filter(r => r.status === 'pending')
  const reviewed = requests.filter(r => r.status !== 'pending')
  const verified = users.filter(u => u.is_verified)

  const reqOrdinal: Record<string, number> = {}
  const userSubmitCount: Record<string, number> = {}
  const sortedAsc = [...requests].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  for (const r of sortedAsc) {
    userSubmitCount[r.user_id] = (userSubmitCount[r.user_id] ?? 0) + 1
    reqOrdinal[r.id] = userSubmitCount[r.user_id]
  }

  async function refresh() {
    const data = await fetchVerifyRequests(supabase, range)
    setRequests(data)
  }

  async function handleApprove(req: VerifyRequest) {
    await approveVerifyRequest(supabase, req)
    const removedCount = requests.filter(r => r.user_id === req.user_id).length
    setRequests(prev => prev.filter(r => r.user_id !== req.user_id))
    setStats(s => s ? { ...s, verifiedUsers: s.verifiedUsers + 1, pendingVerify: Math.max(0, s.pendingVerify - removedCount) } : s)
  }

  async function handleReject(req: VerifyRequest) {
    await rejectVerifyRequest(supabase, req)
    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'rejected' } : r))
    setStats(s => s ? { ...s, pendingVerify: Math.max(0, s.pendingVerify - 1) } : s)
  }

  async function submitRevoke() {
    if (!revokeModal || !revokeReason) return
    setRevokeLoading(true)
    await toggleUserVerified(supabase, revokeModal.id, false)
    const { data: { user: adminUser } } = await supabase.auth.getUser()
    if (adminUser) {
      const msg = revokeNote.trim()
        ? `We're sorry, but your professional verification has been revoked. Reason: ${revokeReason} — ${revokeNote.trim()}`
        : `We're sorry, but your professional verification has been revoked. Reason: ${revokeReason}`
      createNotification({ userId: revokeModal.id, actorId: adminUser.id, type: 'verify_revoked', message: msg, skipSelfCheck: true })
    }
    setUsers(prev => prev.map(u => u.id === revokeModal.id ? { ...u, is_verified: false } : u))
    setStats(s => s ? { ...s, verifiedUsers: Math.max(0, s.verifiedUsers - 1) } : s)
    setRevokeModal(null); setRevokeReason(''); setRevokeNote(''); setRevokeLoading(false)
  }

  const SUB_TABS: { id: SubTab; label: string; count: number; color: string }[] = [
    { id: 'pending',  label: 'Pending',        count: pending.length,  color: '#f59e0b' },
    { id: 'reviewed', label: 'Reviewed',        count: reviewed.length, color: '#64748b' },
    { id: 'verified', label: 'Verified Users',  count: verified.length, color: '#3b82f6' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {revokeModal && (
        <RevokeModal user={revokeModal} reason={revokeReason} note={revokeNote} loading={revokeLoading}
          onSetReason={setRevokeReason} onSetNote={setRevokeNote}
          onCancel={() => { setRevokeModal(null); setRevokeReason(''); setRevokeNote('') }}
          onSubmit={submitRevoke} />
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9' }}>Verify Requests</div>
        <button onClick={refresh} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid #334155', background: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Sub-tab bar */}
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

      {/* Pending */}
      {subTab === 'pending' && (
        pending.length === 0
          ? <div style={{ color: '#64748b', fontSize: 14, textAlign: 'center' as const, padding: '40px 0' }}>No pending requests.</div>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pending.map(req => (
                <VerifyCard key={req.id} req={req} ordinal={reqOrdinal[req.id] ?? 1}
                  expanded={expandedReq === req.id}
                  onToggle={() => setExpandedReq(expandedReq === req.id ? null : req.id)}
                  onApprove={() => handleApprove(req)} onReject={() => handleReject(req)} />
              ))}
            </div>
      )}

      {/* Reviewed */}
      {subTab === 'reviewed' && (
        reviewed.length === 0
          ? <div style={{ color: '#64748b', fontSize: 14, textAlign: 'center' as const, padding: '40px 0' }}>No reviewed requests.</div>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {reviewed.map(req => (
                <VerifyCard key={req.id} req={req} ordinal={reqOrdinal[req.id] ?? 1}
                  expanded={expandedReq === req.id}
                  onToggle={() => setExpandedReq(expandedReq === req.id ? null : req.id)}
                  onApprove={() => handleApprove(req)} onReject={() => handleReject(req)} />
              ))}
            </div>
      )}

      {/* Verified Users */}
      {subTab === 'verified' && (
        verified.length === 0
          ? <div style={{ color: '#64748b', fontSize: 14, textAlign: 'center' as const, padding: '40px 0' }}>No verified users.</div>
          : <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #3b82f630', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' as const, tableLayout: 'fixed' as const }}>
                <colgroup>
                  <col style={{ width: '22%' }} />
                  <col style={{ width: '20%' }} />
                  <col style={{ width: '20%' }} />
                  <col style={{ width: '13%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '10%' }} />
                </colgroup>
                <thead>
                  <tr style={{ background: '#0f172a' }}>
                    {['User', 'Email', 'Profession', 'Subscription', 'Joined', 'Action'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left' as const, fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: 0.8 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {verified.map((u, i) => (
                    <UserTableRow key={u.id} u={u} i={i} onRevoke={() => { setRevokeModal(u); setRevokeReason(''); setRevokeNote('') }} />
                  ))}
                </tbody>
              </table>
            </div>
      )}
    </div>
  )
}
