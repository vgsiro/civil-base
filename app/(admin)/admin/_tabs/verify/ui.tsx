'use client'
import { Check, X, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import type { VerifyRequest } from '../../_lib/types'

function ordinalSuffix(n: number) {
  if (n === 1) return '1st'
  if (n === 2) return '2nd'
  if (n === 3) return '3rd'
  return `${n}th`
}

function isAbsoluteUrl(s: string) {
  try { return /^https?:\/\//i.test(s) } catch { return false }
}

interface CardProps {
  req: VerifyRequest
  ordinal: number
  expanded: boolean
  onToggle: () => void
  onApprove: () => void
  onReject: () => void
}

export function VerifyCard({ req, ordinal, expanded, onToggle, onApprove, onReject }: CardProps) {
  const statusColor = req.status === 'approved' ? '#34d399' : req.status === 'rejected' ? '#f87171' : '#fbbf24'
  const statusBg = req.status === 'approved' ? '#10b98115' : req.status === 'rejected' ? '#ef444415' : '#f59e0b15'
  const docIsUrl = !!req.doc_url && isAbsoluteUrl(req.doc_url)

  return (
    <div style={{ background: '#1e293b', border: `1px solid ${req.status === 'pending' ? '#f59e0b30' : '#334155'}`, borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer' }} onClick={onToggle}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
            <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 14 }}>{req.display_name || req.username}</span>
            <span style={{ fontSize: 12, color: '#64748b' }}>@{req.username}</span>
            {req.profession && (
              <span style={{ fontSize: 11, background: '#1d4ed820', color: '#60a5fa', borderRadius: 20, padding: '1px 8px', border: '1px solid #1d4ed840' }}>{req.profession}</span>
            )}
            {ordinal > 1 && (
              <span style={{ fontSize: 11, fontWeight: 700, background: '#7c3aed20', color: '#a78bfa', borderRadius: 20, padding: '1px 8px', border: '1px solid #7c3aed40' }}>
                {ordinalSuffix(ordinal)} submission
              </span>
            )}
          </div>
          {req.specializations && req.specializations.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4, marginTop: 5 }}>
              {req.specializations.map(s => (
                <span key={s} style={{ fontSize: 10, fontWeight: 600, background: '#7c3aed15', color: '#a78bfa', borderRadius: 20, padding: '1px 8px', border: '1px solid #7c3aed30' }}>{s}</span>
              ))}
            </div>
          )}
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
            {req.email} · {new Date(req.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: statusColor, background: statusBg, borderRadius: 20, padding: '3px 10px', border: `1px solid ${statusColor}40` }}>
          {req.status}
        </span>
        {expanded ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid #334155', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {req.specializations && req.specializations.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>SPECIALIZATIONS</div>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5 }}>
                {req.specializations.map(s => (
                  <span key={s} style={{ fontSize: 12, fontWeight: 600, background: '#7c3aed15', color: '#a78bfa', borderRadius: 20, padding: '3px 10px', border: '1px solid #7c3aed30' }}>{s}</span>
                ))}
              </div>
            </div>
          )}
          {req.note && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>NOTE FROM USER</div>
              <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', lineHeight: 1.6, background: '#0f172a', padding: '10px 12px', borderRadius: 8 }}>{req.note}</p>
            </div>
          )}
          {req.doc_url && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>DOCUMENT</div>
              {docIsUrl ? (
                <a href={req.doc_url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#60a5fa', textDecoration: 'none' }}>
                  <ExternalLink size={13} /> View document
                </a>
              ) : (
                <div style={{ fontSize: 13, color: '#94a3b8', background: '#0f172a', padding: '8px 12px', borderRadius: 8, wordBreak: 'break-all' as const }}>
                  {req.doc_url}
                </div>
              )}
            </div>
          )}
          {req.status === 'pending' && (
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={onApprove}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8, border: 'none', background: '#10b981', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#059669' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#10b981' }}>
                <Check size={14} /> Approve & verify
              </button>
              <button onClick={onReject}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8, border: '1px solid #334155', background: 'none', color: '#f87171', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#ef444415' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                <X size={14} /> Reject
              </button>
            </div>
          )}
          {req.status !== 'pending' && (
            <div style={{ display: 'flex', gap: 8 }}>
              {req.status === 'rejected' && (
                <button onClick={onApprove}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, border: '1px solid #334155', background: 'none', color: '#34d399', fontSize: 13, cursor: 'pointer' }}>
                  <Check size={13} /> Approve anyway
                </button>
              )}
              {req.status === 'approved' && (
                <button onClick={onReject}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, border: '1px solid #334155', background: 'none', color: '#f87171', fontSize: 13, cursor: 'pointer' }}>
                  <X size={13} /> Revoke
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
