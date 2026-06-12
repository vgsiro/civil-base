'use client'
import { useState } from 'react'
import { X, Flag, Check } from 'lucide-react'
import { reportUser, type ReportReason } from '../../_lib/moderation'

interface Props {
  reporterId: string
  reportedId: string
  reportedName: string
  onClose: () => void
}

const REASONS: { value: ReportReason; label: string }[] = [
  { value: 'spam', label: 'Spam or scam' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'impersonation', label: 'Impersonation / fake account' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'other', label: 'Something else' },
]

export default function ReportModal({ reporterId, reportedId, reportedName, onClose }: Props) {
  const [reason, setReason] = useState<ReportReason | null>(null)
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!reason) { setError('Please choose a reason.'); return }
    setSubmitting(true)
    setError('')
    const { error: err } = await reportUser(reporterId, reportedId, reason, details.trim() || undefined)
    if (err) { setError(err.message); setSubmitting(false); return }
    setDone(true)
    setSubmitting(false)
  }

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden' }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Flag size={18} color="#ef4444" />
            <span style={{ fontSize: 16, fontWeight: 800, color: '#1e293b' }}>Report {reportedName}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', color: '#94a3b8' }}>
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div style={{ padding: '40px 24px', textAlign: 'center' as const }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Report submitted</div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>
              Thanks for keeping the community safe. Our team will review this report.
            </div>
            <button onClick={onClose}
              style={{ padding: '9px 24px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Close
            </button>
          </div>
        ) : (
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 10, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
                Reason
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {REASONS.map(r => {
                  const active = reason === r.value
                  return (
                    <button
                      key={r.value}
                      onClick={() => setReason(r.value)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8,
                        border: `1.5px solid ${active ? '#ef4444' : '#e2e8f0'}`,
                        background: active ? '#fef2f2' : '#fff', cursor: 'pointer', textAlign: 'left' as const,
                        fontSize: 13, fontWeight: active ? 700 : 500, color: active ? '#b91c1c' : '#334155',
                      }}>
                      <span style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, border: `2px solid ${active ? '#ef4444' : '#cbd5e1'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {active && <Check size={9} color="#ef4444" strokeWidth={3} />}
                      </span>
                      {r.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
                Details <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span>
              </label>
              <textarea
                value={details}
                onChange={e => setDetails(e.target.value)}
                placeholder="Add any context that helps us review this report."
                rows={3}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, color: '#1e293b', resize: 'vertical', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.boxShadow = '0 0 0 2px #ef444420' }}
                onBlur={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>

            {error && (
              <div style={{ fontSize: 13, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={onClose}
                style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'none', color: '#64748b', fontSize: 13, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={submitting}
                style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', fontSize: 13, fontWeight: 700, cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Submitting…' : 'Submit report'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
