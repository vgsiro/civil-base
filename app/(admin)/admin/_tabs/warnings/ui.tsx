'use client'
import { X, Trash2, AlertTriangle, Link2 } from 'lucide-react'
import type { Warning } from '../../_lib/types'
import { timeAgo } from '../../_lib/constants'

interface UserWarningCardProps {
  userId: string
  warnings: Warning[]
  now: Date
  onUnwarn: (warningId: string, userId: string) => void
}

function daysLeft(expires: string, now: Date) {
  const d = Math.ceil((new Date(expires).getTime() - now.getTime()) / 86400000)
  return d <= 0 ? 'Expires today' : `${d}d left`
}

export function UserWarningCard({ userId, warnings, now, onUnwarn }: UserWarningCardProps) {
  const profile = warnings[0].profiles as any
  const warnCount = warnings.length
  const isBanned = warnCount >= 3

  return (
    <div style={{ background: '#1e293b', borderRadius: 12, border: `1px solid ${isBanned ? '#ef444440' : '#334155'}`, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', background: isBanned ? '#ef444408' : '#ffffff03', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #0f172a' }}>
        <a href={`/u/${profile?.username}`} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: 14, fontWeight: 700, color: '#60a5fa', textDecoration: 'none' }}>
          @{profile?.username ?? userId.slice(0, 8)}
        </a>
        {profile?.display_name && <span style={{ fontSize: 13, color: '#64748b' }}>{profile.display_name}</span>}
        <div style={{ display: 'flex', gap: 4, marginLeft: 4 }}>
          {[1, 2, 3].map(n => (
            <div key={n} style={{ width: 10, height: 10, borderRadius: '50%', background: n <= warnCount ? '#f59e0b' : '#334155', border: '1px solid #475569' }} />
          ))}
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: warnCount >= 3 ? '#f87171' : warnCount >= 2 ? '#fbbf24' : '#94a3b8' }}>
          {warnCount}/3 warnings{isBanned ? ' — BANNED' : ''}
        </span>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
        <thead>
          <tr style={{ background: '#0f172a' }}>
            {['Type', 'Reason', 'Note', 'Post', 'Issued', 'Expires', ''].map(h => (
              <th key={h} style={{ padding: '8px 14px', textAlign: 'left' as const, fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase' as const, letterSpacing: 0.8 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {warnings.map((w, i) => (
            <tr key={w.id} style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none' }}
              onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = '#ffffff05' }}
              onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}>
              <td style={{ padding: '10px 14px' }}>
                {w.type === 'delete'
                  ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, color: '#f87171', background: '#ef444420', borderRadius: 6, padding: '2px 7px' }}><Trash2 size={9} /> Deleted</span>
                  : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, color: '#fbbf24', background: '#f59e0b20', borderRadius: 6, padding: '2px 7px' }}><AlertTriangle size={9} /> Warned</span>
                }
              </td>
              <td style={{ padding: '10px 14px', fontSize: 12, color: '#94a3b8', maxWidth: 180 }}>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{w.reason}</div>
              </td>
              <td style={{ padding: '10px 14px', fontSize: 12, color: '#64748b', maxWidth: 160 }}>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{w.custom_note || <span style={{ color: '#334155' }}>—</span>}</div>
              </td>
              <td style={{ padding: '10px 14px' }}>
                {w.post_id
                  ? <a href={`/post/${w.post_id}`} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#3b82f6', textDecoration: 'none' }}>
                      <Link2 size={10} /> View
                    </a>
                  : <span style={{ color: '#334155', fontSize: 11 }}>—</span>
                }
              </td>
              <td style={{ padding: '10px 14px', fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' as const }}>{timeAgo(w.created_at)}</td>
              <td style={{ padding: '10px 14px', fontSize: 11, whiteSpace: 'nowrap' as const, color: new Date(w.expires_at).getTime() - now.getTime() < 86400000 * 2 ? '#f87171' : '#64748b' }}>
                {daysLeft(w.expires_at, now)}
              </td>
              <td style={{ padding: '10px 14px' }}>
                <button onClick={() => onUnwarn(w.id, userId)}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 6, border: '1px solid #334155', background: 'none', color: '#64748b', fontSize: 11, cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#ffffff10'; e.currentTarget.style.color = '#f1f5f9' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#64748b' }}>
                  <X size={10} /> Unwarn
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
