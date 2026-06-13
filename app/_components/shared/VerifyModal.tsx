'use client'
import { useRef, useState } from 'react'
import { useScrollLock } from '../../_hooks/useScrollLock'
import { ShieldCheck, BadgeCheck, Upload, X, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '../../_types'
import { SPECIALIZATION_KEYS, SPECIALIZATIONS } from '../../(social)/u/[username]/EditModal'
import { useTranslation } from '../../i18n/LanguageContext'

interface Props {
  user: { id: string; email?: string }
  profile: Profile
  onClose: () => void
}

export default function VerifyModal({ user, profile, onClose }: Props) {
  useScrollLock()
  const { t } = useTranslation()
  const [isPro, setIsPro] = useState<boolean | null>(null)
  const [nonproProfession, setNonproProfession] = useState(profile.profession ?? '')
  const [docUrl, setDocUrl] = useState('')
  const [note, setNote] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [specs, setSpecs] = useState<string[]>((profile.specializations ?? []))
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [msg, setMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const canSubmit = isPro !== null && (isPro ? !!profile.profession : !!nonproProfession.trim())

  async function submit() {
    if (!canSubmit) return
    setSubmitting(true); setMsg('')
    let uploadedUrl = docUrl.trim()
    if (file) {
      const path = `${user.id}/verify-${Date.now()}-${file.name}`
      const { error: upErr } = await supabase.storage.from('verify-docs').upload(path, file, { upsert: true })
      if (upErr) { setMsg(t('verify_error_upload') + upErr.message); setSubmitting(false); return }
      const { data: urlData } = supabase.storage.from('verify-docs').getPublicUrl(path)
      uploadedUrl = urlData.publicUrl
    }
    if (uploadedUrl && !/^https?:\/\//i.test(uploadedUrl)) {
      setMsg(t('verify_error_url'))
      setSubmitting(false); return
    }

    const normalizedSpecs = specs.map(s => s.trim()).filter(Boolean)
    if (normalizedSpecs.length) {
      await supabase.from('profiles').update({
        pending_specializations: normalizedSpecs,
      }).eq('id', user.id)
    }

    const noteText = [
      isPro ? null : '[Non-professional verification]',
      note.trim() || null,
    ].filter(Boolean).join('\n')

    const { error } = await supabase.from('verify_requests').insert({
      user_id: user.id,
      username: profile.username,
      display_name: profile.display_name || profile.full_name,
      email: user.email,
      profession: isPro ? profile.profession : (nonproProfession.trim() || null),
      doc_url: uploadedUrl || null,
      note: noteText || null,
      status: 'pending',
      is_professional: isPro,
    })
    setSubmitting(false)
    if (error) { setMsg(t('verify_error_submit') + error.message); return }
    setSubmitted(true)
  }

  const benefitList = isPro === false
    ? [t('verify_benefit_badge'), t('verify_benefit_trust')]
    : [t('verify_benefit_badge'), t('verify_benefit_trust'), t('verify_benefit_pro_badge'), t('verify_benefit_recommend')]

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1400, backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1401, background: '#fff', borderRadius: 16, boxShadow: '0 24px 80px rgba(0,0,0,0.28)', width: '90vw', maxWidth: 520, display: 'flex', flexDirection: 'column', overflow: 'hidden', maxHeight: '92vh' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid #e4e6eb', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={20} color="#3b82f6" />
            <span style={{ fontSize: 18, fontWeight: 800, color: '#050505' }}>{t('verify_modal_title')}</span>
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
              <div style={{ fontSize: 18, fontWeight: 800, color: '#050505' }}>{t('verify_submitted_title')}</div>
              <p style={{ margin: 0, fontSize: 14, color: '#65676b', lineHeight: 1.6, maxWidth: 340 }}>
                {t('verify_submitted_body')}
              </p>
              <button onClick={onClose} style={{ marginTop: 8, padding: '10px 28px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                {t('verify_btn_done')}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Benefits box — updates based on isPro selection */}
              <div style={{ background: '#eff6ff', borderRadius: 10, padding: '12px 14px', border: '1px solid #bfdbfe' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1d4ed8', marginBottom: 6 }}>{t('verify_modal_benefit_title')}</div>
                {benefitList.map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#1e40af', marginTop: 4 }}>
                    <Check size={13} color="#3b82f6" style={{ flexShrink: 0 }} /> {item}
                  </div>
                ))}
              </div>

              {/* Professional Yes/No toggle */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>{t('verify_question_pro')}</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {([true, false] as const).map(val => (
                    <button key={String(val)} onClick={() => setIsPro(val)}
                      style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: `1.5px solid ${isPro === val ? '#3b82f6' : '#e2e8f0'}`, background: isPro === val ? '#eff6ff' : '#fff', color: isPro === val ? '#3b82f6' : '#64748b', fontSize: 13, fontWeight: isPro === val ? 700 : 500, cursor: 'pointer' }}>
                      {val ? t('field_yes') : t('field_no')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Profession field */}
              {isPro === true && (
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#65676b', display: 'block', marginBottom: 4 }}>{t('verify_label_profession')}</label>
                  <div style={{ padding: '9px 12px', background: '#f8fafc', border: '1.5px solid #e4e6eb', borderRadius: 8, fontSize: 14, color: profile.profession ? '#050505' : '#94a3b8' }}>
                    {profile.profession || t('verify_profession_not_set')}
                  </div>
                </div>
              )}
              {isPro === false && (
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#65676b', display: 'block', marginBottom: 4 }}>{t('field_profession_other')}</label>
                  <input
                    value={nonproProfession}
                    onChange={e => setNonproProfession(e.target.value)}
                    placeholder={t('field_profession_other_placeholder')}
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e4e6eb', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }}
                  />
                </div>
              )}

              {/* Specializations — chips + custom input for pro only; plain input for non-pro */}
              {isPro === true && (
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#65676b', display: 'block', marginBottom: 6 }}>
                    {t('verify_label_specializations')} <span style={{ fontWeight: 400, color: '#94a3b8' }}>{t('verify_spec_optional')}</span>
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
                    placeholder={t('verify_spec_placeholder')}
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e4e6eb', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }}
                  />
                </div>
              )}
              {isPro === false && (
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#65676b', display: 'block', marginBottom: 6 }}>
                    {t('verify_label_specializations')} <span style={{ fontWeight: 400, color: '#94a3b8' }}>{t('verify_spec_optional')}</span>
                  </label>
                  <input
                    value={specs.join(', ')}
                    onChange={e => setSpecs(e.target.value ? e.target.value.split(',').map(s => s.trim()).filter(Boolean) : [])}
                    placeholder={t('verify_spec_placeholder')}
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e4e6eb', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }}
                  />
                </div>
              )}

              {/* Supporting document */}
              {isPro !== null && (
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#65676b', display: 'block', marginBottom: 4 }}>
                    {t('verify_label_doc')} <span style={{ fontWeight: 400, color: '#94a3b8' }}>{isPro ? t('verify_doc_hint') : t('verify_doc_hint_nonpro')}</span>
                  </label>
                  <DocUpload file={file} setFile={setFile} docUrl={docUrl} setDocUrl={setDocUrl} fileRef={fileRef} uploadLabel={t('verify_upload_btn')} orLabel={t('verify_or_link')} urlPlaceholder={t('verify_doc_url_placeholder')} />
                </div>
              )}

              {/* Note — shown once type is selected */}
              {isPro !== null && (
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#65676b', display: 'block', marginBottom: 4 }}>
                    {t('verify_label_note')} <span style={{ fontWeight: 400, color: '#94a3b8' }}>{t('verify_note_optional')}</span>
                  </label>
                  <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
                    placeholder={t('verify_note_placeholder')}
                    style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e4e6eb', borderRadius: 8, fontSize: 13, outline: 'none', resize: 'vertical' as const, fontFamily: 'inherit', boxSizing: 'border-box' as const }} />
                </div>
              )}

              {/* Inline guidance when not ready to submit */}
              {isPro === null && (
                <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center' as const }}>{t('verify_select_type')}</div>
              )}
              {isPro === true && !profile.profession && (
                <div style={{ fontSize: 13, color: '#f59e0b', fontWeight: 600 }}>{t('verify_pro_required')}</div>
              )}
              {isPro === false && !nonproProfession.trim() && (
                <div style={{ fontSize: 13, color: '#f59e0b', fontWeight: 600 }}>{t('verify_nonpro_required')}</div>
              )}

              {msg && <div style={{ fontSize: 13, color: '#ef4444', fontWeight: 600 }}>{msg}</div>}
            </div>
          )}
        </div>

        {!submitted && (
          <div style={{ padding: '14px 20px', borderTop: '1px solid #e4e6eb', display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
            <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#e4e6eb', color: '#050505', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{t('verify_btn_cancel')}</button>
            <button onClick={submit} disabled={submitting || !canSubmit}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 22px', borderRadius: 8, border: 'none', background: canSubmit ? '#3b82f6' : '#d1d5db', color: canSubmit ? '#fff' : '#9ca3af', fontSize: 14, fontWeight: 700, cursor: canSubmit ? 'pointer' : 'default' }}>
              <ShieldCheck size={16} /> {submitting ? t('verify_btn_submitting') : t('verify_btn_submit')}
            </button>
          </div>
        )}
      </div>
    </>
  )
}

interface DocUploadProps {
  file: File | null
  setFile: (f: File | null) => void
  docUrl: string
  setDocUrl: (v: string) => void
  fileRef: React.RefObject<HTMLInputElement | null>
  uploadLabel: string
  orLabel: string
  urlPlaceholder: string
}

function DocUpload({ file, setFile, docUrl, setDocUrl, fileRef, uploadLabel, orLabel, urlPlaceholder }: DocUploadProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <button onClick={() => fileRef.current?.click()}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', border: '1.5px dashed #d1d5db', borderRadius: 8, background: file ? '#f0fdf4' : '#f8fafc', cursor: 'pointer', fontSize: 13, color: file ? '#16a34a' : '#64748b', fontWeight: file ? 700 : 400 }}>
        {file ? <><Check size={15} color="#16a34a" /> {file.name}</> : <><Upload size={15} /> {uploadLabel}</>}
      </button>
      <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={e => setFile(e.target.files?.[0] ?? null)} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, height: 1, background: '#e4e6eb' }} />
        <span style={{ fontSize: 12, color: '#94a3b8' }}>{orLabel}</span>
        <div style={{ flex: 1, height: 1, background: '#e4e6eb' }} />
      </div>
      <input value={docUrl} onChange={e => setDocUrl(e.target.value)}
        placeholder={urlPlaceholder}
        style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e4e6eb', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }} />
    </div>
  )
}
