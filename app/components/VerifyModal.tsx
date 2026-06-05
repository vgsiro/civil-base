'use client'
import { useRef, useState } from 'react'
import { useScrollLock } from '../hooks/useScrollLock'
import { ShieldCheck, BadgeCheck, Upload, X, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '../types'
import { SPECIALIZATION_KEYS, SPECIALIZATIONS } from '../u/[username]/EditModal'

interface Props {
  user: { id: string; email?: string }
  profile: Profile
  onClose: () => void
}

export default function VerifyModal({ user, profile, onClose }: Props) {
  useScrollLock()
  const [docUrl, setDocUrl] = useState('')
  const [note, setNote] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [specs, setSpecs] = useState<string[]>((profile.specializations ?? []))
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [msg, setMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function submit() {
    setSubmitting(true); setMsg('')
    let uploadedUrl = docUrl.trim()
    if (file) {
      const path = `${user.id}/verify-${Date.now()}-${file.name}`
      const { error: upErr } = await supabase.storage.from('verify-docs').upload(path, file, { upsert: true })
      if (upErr) { setMsg('File upload failed: ' + upErr.message); setSubmitting(false); return }
      const { data: urlData } = supabase.storage.from('verify-docs').getPublicUrl(path)
      uploadedUrl = urlData.publicUrl
    }
    if (uploadedUrl && !/^https?:\/\//i.test(uploadedUrl)) {
      setMsg('Please enter a valid URL starting with https://')
      setSubmitting(false); return
    }
    const normalizedSpecs = specs.map(s => s.trim()).filter(Boolean)
    // Store pending specializations on the profile so admin_approve_verify can promote them
    await supabase.from('profiles').update({
      pending_specializations: normalizedSpecs.length ? normalizedSpecs : null,
    }).eq('id', user.id)

    const { error } = await supabase.from('verify_requests').insert({
      user_id: user.id,
      username: profile.username,
      display_name: profile.display_name || profile.full_name,
      email: user.email,
      profession: profile.profession,
      doc_url: uploadedUrl || null,
      note: note.trim() || null,
      status: 'pending',
    })
    setSubmitting(false)
    if (error) { setMsg('Submission failed: ' + error.message); return }
    setSubmitted(true)
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1400, backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1401, background: '#fff', borderRadius: 16, boxShadow: '0 24px 80px rgba(0,0,0,0.28)', width: '90vw', maxWidth: 520, display: 'flex', flexDirection: 'column', overflow: 'hidden', maxHeight: '92vh' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid #e4e6eb', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={20} color="#3b82f6" />
            <span style={{ fontSize: 18, fontWeight: 800, color: '#050505' }}>Professional Verification</span>
          </div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: '50%', background: '#f0f2f5', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={17} color="#050505" />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {submitted ? (
            <div style={{ textAlign: 'center' as const, padding: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BadgeCheck size={32} color="#16a34a" />
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#050505' }}>Request submitted!</div>
              <p style={{ margin: 0, fontSize: 14, color: '#65676b', lineHeight: 1.6, maxWidth: 340 }}>
                We've received your verification request. Our team will review your documents and get back to you within 2–3 business days.
              </p>
              <button onClick={onClose} style={{ marginTop: 8, padding: '10px 28px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Done
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: '#eff6ff', borderRadius: 10, padding: '12px 14px', border: '1px solid #bfdbfe' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1d4ed8', marginBottom: 6 }}>What you get with verification</div>
                {[
                  'Your profession badge shown on all posts',
                  'Blue verified checkmark on your profile',
                  'Ability to recommend posts as a professional',
                  'Higher trust from the community',
                ].map(t => (
                  <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#1e40af', marginTop: 4 }}>
                    <Check size={13} color="#3b82f6" style={{ flexShrink: 0 }} /> {t}
                  </div>
                ))}
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#65676b', display: 'block', marginBottom: 4 }}>Your current profession</label>
                <div style={{ padding: '9px 12px', background: '#f8fafc', border: '1.5px solid #e4e6eb', borderRadius: 8, fontSize: 14, color: profile.profession ? '#050505' : '#94a3b8' }}>
                  {profile.profession || 'Not set — please fill in your profession in Edit profile first'}
                </div>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#65676b', display: 'block', marginBottom: 6 }}>
                  Specializations <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional)</span>
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginBottom: 8 }}>
                  {SPECIALIZATION_KEYS.map(s => {
                    const on = specs.includes(s.value)
                    return (
                      <button key={s.value}
                        onClick={() => setSpecs(prev => on ? prev.filter(x => x !== s.value) : [...prev, s.value])}
                        style={{ padding: '4px 11px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: `1px solid ${on ? '#8b5cf6' : '#e2e8f0'}`, background: on ? '#f5f3ff' : '#f8fafc', color: on ? '#7c3aed' : '#475569', fontWeight: on ? 700 : 400 }}>
                        {s.value}
                      </button>
                    )
                  })}
                </div>
                <input
                  value={specs.filter(s => !SPECIALIZATIONS.includes(s)).join(', ')}
                  onChange={e => {
                    const custom = e.target.value ? e.target.value.split(',').map(s => s.trim()).filter(Boolean) : []
                    setSpecs(prev => [...prev.filter(s => SPECIALIZATIONS.includes(s)), ...custom])
                  }}
                  placeholder="Or type custom specializations, comma separated…"
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e4e6eb', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }}
                />
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#65676b', display: 'block', marginBottom: 4 }}>
                  Supporting document <span style={{ fontWeight: 400, color: '#94a3b8' }}>(licence, degree, employer letter…)</span>
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button onClick={() => fileRef.current?.click()}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', border: '1.5px dashed #d1d5db', borderRadius: 8, background: file ? '#f0fdf4' : '#f8fafc', cursor: 'pointer', fontSize: 13, color: file ? '#16a34a' : '#64748b', fontWeight: file ? 700 : 400 }}>
                    {file ? <><Check size={15} color="#16a34a" /> {file.name}</> : <><Upload size={15} /> Upload file (PDF, JPG, PNG)</>}
                  </button>
                  <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={e => setFile(e.target.files?.[0] ?? null)} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 1, background: '#e4e6eb' }} />
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>or paste a link</span>
                    <div style={{ flex: 1, height: 1, background: '#e4e6eb' }} />
                  </div>
                  <input value={docUrl} onChange={e => setDocUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/… or document URL"
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e4e6eb', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#65676b', display: 'block', marginBottom: 4 }}>
                  Additional note <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional)</span>
                </label>
                <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
                  placeholder="Anything you'd like admin to know…"
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e4e6eb', borderRadius: 8, fontSize: 13, outline: 'none', resize: 'vertical' as const, fontFamily: 'inherit', boxSizing: 'border-box' as const }} />
              </div>

              {msg && <div style={{ fontSize: 13, color: '#ef4444', fontWeight: 600 }}>{msg}</div>}
            </div>
          )}
        </div>

        {!submitted && (
          <div style={{ padding: '14px 20px', borderTop: '1px solid #e4e6eb', display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
            <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#e4e6eb', color: '#050505', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
            <button onClick={submit} disabled={submitting || !profile.profession}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 22px', borderRadius: 8, border: 'none', background: profile.profession ? '#3b82f6' : '#d1d5db', color: profile.profession ? '#fff' : '#9ca3af', fontSize: 14, fontWeight: 700, cursor: profile.profession ? 'pointer' : 'default' }}>
              <ShieldCheck size={16} /> {submitting ? 'Submitting…' : 'Submit request'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
