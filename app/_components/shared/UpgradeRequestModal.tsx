'use client'
import { useState } from 'react'
import { X, ArrowUpCircle, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Props {
  defaultTier?: 'pro' | 'premium'
  onClose: () => void
}

const TIER_META = {
  pro: {
    label: 'Pro',
    color: '#3b82f6',
    bg: '#eff6ff',
    border: '#bfdbfe',
    features: ['Full result details', 'All calculation breakdowns'],
  },
  premium: {
    label: 'Premium',
    color: '#8b5cf6',
    bg: '#f5f3ff',
    border: '#ddd6fe',
    features: ['Everything in Pro', 'Export PDF reports', 'Priority support'],
  },
}

export function UpgradeRequestModal({ defaultTier = 'pro', onClose }: Props) {
  const [selectedTier, setSelectedTier] = useState<'pro' | 'premium'>(defaultTier)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const meta = TIER_META[selectedTier]

  async function handleSubmit() {
    setSubmitting(true)
    setError('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('You must be logged in.'); setSubmitting(false); return }

    const { error: err } = await supabase.from('upgrade_requests').insert({
      user_id: user.id,
      requested_tier: selectedTier,
      message: message.trim() || null,
    })
    if (err) {
      setError(err.message)
      setSubmitting(false)
      return
    }
    setDone(true)
    setSubmitting(false)
  }

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.15)', overflow: 'hidden' }}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ArrowUpCircle size={20} color="#6366f1" />
            <span style={{ fontSize: 16, fontWeight: 800, color: '#1e293b' }}>Request Upgrade</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', color: '#94a3b8' }}>
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div style={{ padding: '40px 24px', textAlign: 'center' as const }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Request sent!</div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>
              Your <strong style={{ color: meta.color }}>{meta.label}</strong> upgrade request has been submitted. The admin will review it and you'll receive a notification.
            </div>
            <button onClick={onClose}
              style={{ padding: '9px 24px', borderRadius: 8, border: 'none', background: meta.color, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Close
            </button>
          </div>
        ) : (
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Tier selector */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 10, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>
                Choose plan
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {(['pro', 'premium'] as const).map(t => {
                  const m = TIER_META[t]
                  const active = selectedTier === t
                  return (
                    <button
                      key={t}
                      onClick={() => setSelectedTier(t)}
                      style={{
                        padding: '12px 14px', borderRadius: 10, textAlign: 'left' as const, cursor: 'pointer',
                        border: `2px solid ${active ? m.color : '#e2e8f0'}`,
                        background: active ? m.bg : '#fff',
                        transition: 'all 0.15s', position: 'relative' as const,
                      }}
                    >
                      {active && (
                        <span style={{ position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Check size={11} color="#fff" strokeWidth={3} />
                        </span>
                      )}
                      <div style={{ fontSize: 13, fontWeight: 800, color: m.color, marginBottom: 6 }}>{m.label}</div>
                      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {m.features.map(f => (
                          <li key={f} style={{ fontSize: 11, color: active ? '#334155' : '#94a3b8', display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: active ? m.color : '#cbd5e1', flexShrink: 0, marginTop: 4, display: 'inline-block' }} />
                            {f}
                          </li>
                        ))}
                      </ul>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Message */}
            <div>
              <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6 }}>
                Why do you need {meta.label}? <span style={{ fontWeight: 400, color: '#9ca3af' }}>(optional)</span>
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={selectedTier === 'premium'
                  ? "e.g. I need to export PDF reports for client deliverables"
                  : "e.g. I'm a structural engineer and need full calculation breakdowns"}
                rows={3}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, color: '#1e293b', resize: 'vertical', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'inherit' }}
                onFocus={e => { e.currentTarget.style.borderColor = meta.color; e.currentTarget.style.boxShadow = `0 0 0 2px ${meta.color}20` }}
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
                style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: meta.color, color: '#fff', fontSize: 13, fontWeight: 700, cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Sending…' : `Request ${meta.label}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
