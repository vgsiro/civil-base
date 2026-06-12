'use client'
import { BadgeCheck, ExternalLink, X } from 'lucide-react'
import type { UserRow } from '../../_lib/types'
import { AVATAR_COLORS, timeAgo } from '../../_lib/constants'
import { tierColor, tierBg, tierLabel } from '../../../../../lib/useSubscription'

export function UserTableRow({ u, i, onRevoke }: { u: UserRow; i: number; onRevoke?: () => void }) {
  const tier = (u.subscription_tier ?? 'normal') as any
  const isNormal = !u.subscription_tier || u.subscription_tier === 'normal'

  return (
    <tr style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none', background: 'transparent' }}
      onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = '#ffffff05' }}
      onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}>

      {/* User */}
      <td style={{ padding: '10px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {u.avatar_url
            ? <img src={u.avatar_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            : <div style={{ width: 32, height: 32, borderRadius: '50%', background: AVATAR_COLORS[u.avatar_color ?? 0], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                {(u.display_name || u.username || '?')[0].toUpperCase()}
              </div>
          }
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                {u.display_name || u.full_name || u.username}
              </span>
              {u.is_verified && <BadgeCheck size={14} color="#3b82f6" fill="#3b82f6" strokeWidth={0} style={{ flexShrink: 0 }} />}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: '#64748b' }}>@{u.username}</span>
              <a href={`/u/${u.username}`} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', color: '#3b82f6', opacity: 0.7 }} title="View profile">
                <ExternalLink size={10} />
              </a>
            </div>
          </div>
        </div>
      </td>

      {/* Email */}
      <td style={{ padding: '10px 16px', fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
        {u.email ?? <span style={{ color: '#334155' }}>—</span>}
      </td>

      {/* Profession */}
      <td style={{ padding: '10px 16px', fontSize: 13, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
        {u.profession ?? <span style={{ color: '#475569' }}>—</span>}
      </td>

      {/* Subscription */}
      <td style={{ padding: '10px 16px' }}>
        {isNormal
          ? <span style={{ fontSize: 11, color: '#334155' }}>Normal</span>
          : <span style={{ fontSize: 11, fontWeight: 700, color: tierColor(tier), background: tierBg(tier), padding: '2px 8px', borderRadius: 10 }}>
              {tierLabel(tier)}
            </span>
        }
      </td>

      {/* Joined */}
      <td style={{ padding: '10px 16px', fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' as const }}>
        {timeAgo(u.created_at)}
      </td>

      {/* Revoke (optional) */}
      {onRevoke !== undefined && (
        <td style={{ padding: '10px 16px' }}>
          <button onClick={onRevoke}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, border: '1px solid #ef444440', background: '#ef444410', color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <X size={12} /> Revoke
          </button>
        </td>
      )}
    </tr>
  )
}

// ── Revoke modal (used by VerifyTab) ─────────────────────────────────────────

interface RevokeModalProps {
  user: UserRow
  reason: string
  note: string
  loading: boolean
  onSetReason: (r: string) => void
  onSetNote: (n: string) => void
  onCancel: () => void
  onSubmit: () => void
}

const REVOKE_REASONS = [
  'Misrepresentation of credentials',
  'No longer a practicing professional',
  'Violation of community guidelines',
  'Fraudulent documentation submitted',
  'Account transferred or compromised',
  'Request by the user',
]

export function RevokeModal({ user, reason, note, loading, onSetReason, onSetNote, onCancel, onSubmit }: RevokeModalProps) {
  return (
    <div onClick={onCancel}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: '#1e293b', borderRadius: 14, border: '1px solid #334155', width: '100%', maxWidth: 480, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: 10 }}>
          <BadgeCheck size={16} color="#f87171" />
          <span style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9' }}>Revoke verification</span>
        </div>
        <div style={{ padding: '8px 20px', background: '#ef444415', borderBottom: '1px solid #334155' }}>
          <span style={{ fontSize: 12, color: '#f87171' }}>⚠ This will remove the verified badge from <strong>{user.display_name || user.username}</strong> and notify them.</span>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>Reason * <span style={{ fontWeight: 400, color: '#475569' }}>(select or type your own)</span></div>
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginBottom: 8 }}>
              {REVOKE_REASONS.map(r => (
                <button key={r} onClick={() => onSetReason(r)}
                  style={{ padding: '4px 10px', borderRadius: 20, border: `1px solid ${reason === r ? '#ef4444' : '#334155'}`, background: reason === r ? '#ef444420' : 'none', color: reason === r ? '#f87171' : '#64748b', fontSize: 11, cursor: 'pointer', fontWeight: reason === r ? 700 : 400 }}>
                  {r}
                </button>
              ))}
            </div>
            <input value={reason} onChange={e => onSetReason(e.target.value)}
              placeholder="Or type a custom reason…"
              style={{ width: '100%', padding: '8px 10px', background: '#0f172a', border: `1px solid ${reason ? '#334155' : '#ef444460'}`, borderRadius: 8, color: reason ? '#e2e8f0' : '#64748b', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>Additional note <span style={{ fontWeight: 400, color: '#475569' }}>(optional)</span></div>
            <textarea value={note} onChange={e => onSetNote(e.target.value)} placeholder="Add more context for the user…" rows={3}
              style={{ width: '100%', padding: '8px 10px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', fontSize: 13, outline: 'none', resize: 'vertical' as const, fontFamily: 'inherit', boxSizing: 'border-box' as const }} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={onCancel} style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid #334155', background: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
            <button onClick={onSubmit} disabled={!reason || loading}
              style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: reason ? '#ef4444' : '#7f1d1d', color: '#fff', fontSize: 13, fontWeight: 700, cursor: reason ? 'pointer' : 'default', opacity: reason ? 1 : 0.5 }}>
              {loading ? 'Revoking…' : 'Revoke & notify'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
