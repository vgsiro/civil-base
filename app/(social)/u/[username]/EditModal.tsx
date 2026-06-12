'use client'
import { useEffect, useState } from 'react'
import { useScrollLock } from '../../../_hooks/useScrollLock'
import { X, Check, Lock, AtSign, Trash2, Plus, BadgeCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Profile, FeaturedLink } from '../../../_types'
import { useTranslation } from '../../../i18n/LanguageContext'

// ── Avatar gradient options ───────────────────────────────────────────────────
const AVATAR_COLORS = [
  'linear-gradient(135deg, #3b82f6, #8b5cf6)',
  'linear-gradient(135deg, #10b981, #3b82f6)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #ec4899, #8b5cf6)',
  'linear-gradient(135deg, #06b6d4, #10b981)',
  'linear-gradient(135deg, #f97316, #f59e0b)',
]

// ── Profession / Specialization / Experience data ─────────────────────────────
export const PROFESSION_KEYS: { value: string; labelKey: string }[] = [
  { value: 'Civil Engineer',             labelKey: 'prof_civil_engineer' },
  { value: 'Structural Engineer',        labelKey: 'prof_structural_engineer' },
  { value: 'Geotechnical Engineer',      labelKey: 'prof_geotechnical_engineer' },
  { value: 'Transportation Engineer',    labelKey: 'prof_transportation_engineer' },
  { value: 'Environmental Engineer',     labelKey: 'prof_environmental_engineer' },
  { value: 'Hydraulic Engineer',         labelKey: 'prof_hydraulic_engineer' },
  { value: 'Drafter / CAD Technician',   labelKey: 'prof_drafter' },
  { value: 'Project Manager',            labelKey: 'prof_project_manager' },
  { value: 'Professional Engineer (PE)', labelKey: 'prof_pe' },
  { value: 'Graduate Engineer',          labelKey: 'prof_graduate_engineer' },
  { value: 'Student',                    labelKey: 'prof_student' },
  { value: 'Researcher / Academic',      labelKey: 'prof_researcher' },
]

export const SPECIALIZATION_KEYS: { value: string; labelKey: string }[] = [
  { value: 'Foundations & Geotechnical', labelKey: 'spec_foundations' },
  { value: 'Structural Design',          labelKey: 'spec_structural' },
  { value: 'Hydraulics & Hydrology',     labelKey: 'spec_hydraulics' },
  { value: 'Road & Highway',             labelKey: 'spec_road' },
  { value: 'Bridge Engineering',         labelKey: 'spec_bridge' },
  { value: 'Retaining Structures',       labelKey: 'spec_retaining' },
  { value: 'BIM / Digital Engineering',  labelKey: 'spec_bim' },
  { value: 'Construction Management',    labelKey: 'spec_construction' },
  { value: 'Environmental & Drainage',   labelKey: 'spec_environmental' },
  { value: 'Coastal & Marine',           labelKey: 'spec_coastal' },
  { value: 'Tunnelling',                 labelKey: 'spec_tunnelling' },
  { value: 'Quantity Surveying',         labelKey: 'spec_quantity' },
]

export const EXPERIENCE_KEYS: { value: string; labelKey: string }[] = [
  { value: '< 1 year',    labelKey: 'exp_lt1' },
  { value: '1–3 years',   labelKey: 'exp_1_3' },
  { value: '3–5 years',   labelKey: 'exp_3_5' },
  { value: '5–10 years',  labelKey: 'exp_5_10' },
  { value: '10–20 years', labelKey: 'exp_10_20' },
  { value: '20+ years',   labelKey: 'exp_20plus' },
]

export const SPECIALIZATIONS = SPECIALIZATION_KEYS.map(s => s.value)

// ── Helpers ───────────────────────────────────────────────────────────────────
export function slugify(input: string): string {
  return input.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim()
    .replace(/[\s_]+/g, '-').replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '').substring(0, 38)
}

export function translateValue(value: string, t: (key: any) => string): string {
  const prof = PROFESSION_KEYS.find(p => p.value === value)
  if (prof) return t(prof.labelKey)
  const spec = SPECIALIZATION_KEYS.find(s => s.value === value)
  if (spec) return t(spec.labelKey)
  const exp = EXPERIENCE_KEYS.find(e => e.value === value)
  if (exp) return t(exp.labelKey)
  return value
}

// All known localized labels for each canonical English value, used to normalize user-typed input.
const PROFESSION_ALIASES: Record<string, string[]> = {
  'Civil Engineer':             ['kỹ sư xây dựng', 'civil engineer'],
  'Structural Engineer':        ['kỹ sư kết cấu', 'structural engineer'],
  'Geotechnical Engineer':      ['kỹ sư địa kỹ thuật', 'geotechnical engineer'],
  'Transportation Engineer':    ['kỹ sư giao thông', 'transportation engineer'],
  'Environmental Engineer':     ['kỹ sư môi trường', 'environmental engineer'],
  'Hydraulic Engineer':         ['kỹ sư thủy lợi', 'hydraulic engineer'],
  'Drafter / CAD Technician':   ['kỹ thuật viên / cad', 'kỹ thuật viên/cad', 'drafter / cad technician', 'drafter/cad technician'],
  'Project Manager':            ['quản lý dự án', 'project manager'],
  'Professional Engineer (PE)': ['kỹ sư chuyên nghiệp (pe)', 'kỹ sư chuyên nghiệp', 'professional engineer (pe)'],
  'Graduate Engineer':          ['kỹ sư mới ra trường', 'graduate engineer'],
  'Student':                    ['sinh viên', 'student'],
  'Researcher / Academic':      ['nghiên cứu viên / học thuật', 'nghiên cứu viên/học thuật', 'researcher / academic', 'researcher/academic'],
}

const SPECIALIZATION_ALIASES: Record<string, string[]> = {
  'Foundations & Geotechnical': ['móng & địa kỹ thuật', 'foundations & geotechnical'],
  'Structural Design':          ['thiết kế kết cấu', 'structural design'],
  'Hydraulics & Hydrology':     ['thủy lực & thủy văn', 'hydraulics & hydrology'],
  'Road & Highway':             ['đường bộ & cao tốc', 'road & highway'],
  'Bridge Engineering':         ['kỹ thuật cầu', 'bridge engineering'],
  'Retaining Structures':       ['công trình chắn giữ', 'retaining structures'],
  'BIM / Digital Engineering':  ['bim / kỹ thuật số', 'bim/kỹ thuật số', 'bim / digital engineering', 'bim/digital engineering'],
  'Construction Management':    ['quản lý xây dựng', 'construction management'],
  'Environmental & Drainage':   ['môi trường & thoát nước', 'environmental & drainage'],
  'Coastal & Marine':           ['ven biển & hàng hải', 'coastal & marine'],
  'Tunnelling':                 ['hầm', 'tunnelling', 'tunneling'],
  'Quantity Surveying':         ['dự toán công trình', 'quantity surveying'],
}

export function normalizeProfession(raw: string): string {
  const lower = raw.trim().toLowerCase()
  for (const [canonical, aliases] of Object.entries(PROFESSION_ALIASES)) {
    if (aliases.includes(lower)) return canonical
  }
  return raw.trim()
}

export function normalizeSpecialization(raw: string): string {
  const lower = raw.trim().toLowerCase()
  for (const [canonical, aliases] of Object.entries(SPECIALIZATION_ALIASES)) {
    if (aliases.includes(lower)) return canonical
  }
  return raw.trim()
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1.5px solid #e4e6eb',
  borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 13, fontWeight: 700, color: '#65676b', display: 'block', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}

// ── EditModal ─────────────────────────────────────────────────────────────────
export default function EditModal({ user, profile, onClose, onSaved }: {
  user: User
  profile: Profile
  onClose: () => void
  onSaved: (updated: Partial<Profile>) => void
}) {
  useScrollLock()
  const { t } = useTranslation()
  const meta = user.user_metadata ?? {}
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const [draftFamilyName, setDraftFamilyName] = useState(profile.family_name ?? meta.family_name ?? '')
  const [draftGivenName, setDraftGivenName] = useState(profile.given_name ?? meta.given_name ?? '')
  const [draftDisplayName, setDraftDisplayName] = useState(profile.display_name ?? '')
  const [draftName] = useState(meta.full_name ?? '')
  const [inCivilEng, setInCivilEng] = useState<boolean | null>(
    meta.profession || (meta.specializations?.length ?? 0) > 0 ? true : null
  )
  const [draftProfession, setDraftProfession] = useState(normalizeProfession(meta.profession ?? ''))
  const [draftDescription, setDraftDescription] = useState(meta.description ?? '')
  const [draftLocation, setDraftLocation] = useState(meta.location ?? '')
  const [draftOrg, setDraftOrg] = useState(meta.organization ?? '')
  const [draftWebsite, setDraftWebsite] = useState(meta.website ?? '')
  const [draftLinkedin, setDraftLinkedin] = useState(meta.linkedin ?? '')
  const [draftExperience, setDraftExperience] = useState(meta.experience ?? '')
  const [draftSpecs, setDraftSpecs] = useState<string[]>((meta.specializations ?? []).map(normalizeSpecialization))
  const [draftAvatarColor, setDraftAvatarColor] = useState(profile.avatar_color ?? 0)
  const [draftLinks, setDraftLinks] = useState<FeaturedLink[]>(profile.featured_links ?? [])
  const [draftUsername, setDraftUsername] = useState(profile.username ?? '')
  const [showReverifyPrompt, setShowReverifyPrompt] = useState(false)
  const [usernameAvail, setUsernameAvail] = useState<boolean | null>(null)
  const [checkingUsername, setCheckingUsername] = useState(false)
  useEffect(() => {
    const slug = slugify(draftUsername)
    if (slug === profile.username || slug.length < 3) { setUsernameAvail(null); return }
    setCheckingUsername(true)
    const timer = setTimeout(async () => {
      const { data } = await supabase.from('profiles').select('id').eq('username', slug).neq('id', user.id).maybeSingle()
      setUsernameAvail(!data)
      setCheckingUsername(false)
    }, 400)
    return () => clearTimeout(timer)
  }, [draftUsername])

  function professionChanged() {
    const newProf = draftProfession.trim()
    const newSpecs = [...draftSpecs].sort().join(',')
    const oldProf = (profile.profession ?? '').trim()
    const oldSpecs = [...(profile.specializations ?? [])].sort().join(',')
    return newProf !== oldProf || newSpecs !== oldSpecs
  }

  async function saveInfo(skipReverifyCheck = false) {
    if (!skipReverifyCheck && profile.is_verified && professionChanged()) {
      setShowReverifyPrompt(true)
      return
    }
    setSaving(true); setMsg('')
    const family = draftFamilyName.trim()
    const given = draftGivenName.trim()
    const derivedFullName = [given, family].filter(Boolean).join(' ') || draftName.trim()
    const resolvedDisplay = draftDisplayName.trim() || derivedFullName
    const validLinks = draftLinks.filter(l => l.url.trim() && l.label.trim())
    const professionalChanged = profile.is_verified && professionChanged()
    const normalizedProfession = normalizeProfession(draftProfession)
    const normalizedSpecs = draftSpecs.map(normalizeSpecialization)

    const updates = {
      family_name: family, given_name: given,
      display_name: resolvedDisplay, full_name: derivedFullName,
      ...(!professionalChanged && { profession: normalizedProfession, specializations: normalizedSpecs }),
      description: draftDescription.trim(), location: draftLocation.trim(),
      organization: draftOrg.trim(), website: draftWebsite.trim(),
      linkedin: draftLinkedin.trim(), experience: draftExperience,
      featured_links: validLinks, avatar_color: draftAvatarColor,
    }
    await supabase.auth.updateUser({ data: updates })

    const slug = slugify(draftUsername)
    const profileUpdates: any = {
      id: user.id, family_name: family || null, given_name: given || null,
      display_name: resolvedDisplay || null, full_name: derivedFullName || null,
      description: draftDescription.trim() || null, location: draftLocation.trim() || null,
      organization: draftOrg.trim() || null, website: draftWebsite.trim() || null,
      linkedin: draftLinkedin.trim() || null, experience: draftExperience || null,
      featured_links: validLinks.length ? validLinks : null, avatar_color: draftAvatarColor,
    }
    if (professionalChanged) {
      profileUpdates.pending_profession = normalizedProfession || null
      profileUpdates.pending_specializations = normalizedSpecs.length ? normalizedSpecs : null
    } else {
      profileUpdates.profession = normalizedProfession || null
      profileUpdates.specializations = normalizedSpecs.length ? normalizedSpecs : null
    }
    if (slug.length >= 3 && (usernameAvail === true || slug === profile.username)) {
      profileUpdates.username = slug
    }
    const { error } = await supabase.from('profiles').upsert(profileUpdates, { onConflict: 'id' })
    setSaving(false)
    if (error) { setMsg(`Error: ${error.message}`); return }

    setMsg(professionalChanged ? t('msg_saved_pending_verify') : t('msg_saved'))
    setTimeout(() => {
      setMsg('')
      onSaved({ ...updates, username: profileUpdates.username ?? profile.username })
    }, 2000)
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 501, background: '#fff', borderRadius: 16, boxShadow: '0 24px 80px rgba(0,0,0,0.28)', width: '90vw', maxWidth: 600, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid #e4e6eb', flexShrink: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#050505' }}>{t('modal_edit_title')}</div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', background: '#f0f2f5', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#e4e6eb' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f0f2f5' }}>
            <X size={18} color="#050505" />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Username */}
              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#65676b', display: 'block', marginBottom: 6 }}>{t('field_username')}</label>
                <div style={{ display: 'flex', alignItems: 'center', border: `1.5px solid ${usernameAvail === false ? '#ef4444' : usernameAvail === true ? '#10b981' : '#e4e6eb'}`, borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ padding: '9px 12px', background: '#f8fafc', borderRight: '1px solid #e4e6eb', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <AtSign size={14} color="#65676b" />
                    <span style={{ fontSize: 13, color: '#65676b', whiteSpace: 'nowrap' as const }}>{t('field_username_url_prefix')}</span>
                  </div>
                  <input value={draftUsername} onChange={e => setDraftUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    style={{ flex: 1, padding: '9px 12px', border: 'none', outline: 'none', fontSize: 14, fontWeight: 600 }} />
                  {checkingUsername && <span style={{ padding: '0 10px', fontSize: 12, color: '#65676b' }}>…</span>}
                  {!checkingUsername && usernameAvail === true && <Check size={16} color="#10b981" style={{ marginRight: 10 }} />}
                  {!checkingUsername && usernameAvail === false && <X size={16} color="#ef4444" style={{ marginRight: 10 }} />}
                </div>
                {usernameAvail === false && <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{t('field_username_taken')}</div>}
                {slugify(draftUsername) === profile.username && <div style={{ fontSize: 12, color: '#65676b', marginTop: 4 }}>{t('field_username_current')}</div>}
              </div>

              {/* Name */}
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <Field label={t('field_given_name')}>
                    <input value={draftGivenName} onChange={e => {
                      setDraftGivenName(e.target.value)
                      const f = draftFamilyName.trim(); const g = e.target.value.trim()
                      const opts = [g && f ? `${g} ${f}` : '', g && f ? `${f} ${g}` : '']
                      if (!draftDisplayName || opts.includes(draftDisplayName)) setDraftDisplayName(g && f ? `${g} ${f}` : g || f)
                    }} placeholder={t('field_given_name_placeholder')} style={inputStyle} />
                  </Field>
                </div>
                <div style={{ flex: 1 }}>
                  <Field label={t('field_family_name')}>
                    <input value={draftFamilyName} onChange={e => {
                      setDraftFamilyName(e.target.value)
                      const f = e.target.value.trim(); const g = draftGivenName.trim()
                      const opts = [g && f ? `${g} ${f}` : '', g && f ? `${f} ${g}` : '']
                      if (!draftDisplayName || opts.includes(draftDisplayName)) setDraftDisplayName(g && f ? `${g} ${f}` : g || f)
                    }} placeholder={t('field_family_name_placeholder')} style={inputStyle} />
                  </Field>
                </div>
              </div>

              {/* Display name */}
              {(() => {
                const g = draftGivenName.trim(); const f = draftFamilyName.trim()
                const presets = g && f ? [`${g} ${f}`, `${f} ${g}`] : []
                return (
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 700, color: '#65676b', display: 'block', marginBottom: 6 }}>
                      {t('field_display_name')} <span style={{ fontWeight: 400, color: '#94a3b8' }}>{t('field_display_name_hint')}</span>
                    </label>
                    {presets.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' as const }}>
                        {presets.map(p => (
                          <button key={p} onClick={() => setDraftDisplayName(p)}
                            style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: `1.5px solid ${draftDisplayName === p ? '#3b82f6' : '#e2e8f0'}`, background: draftDisplayName === p ? '#eff6ff' : '#f8fafc', color: draftDisplayName === p ? '#3b82f6' : '#475569', fontWeight: draftDisplayName === p ? 700 : 400 }}>
                            {p}
                          </button>
                        ))}
                        <span style={{ fontSize: 12, color: '#94a3b8', alignSelf: 'center' }}>{t('field_display_name_hint')}</span>
                      </div>
                    )}
                    <input value={draftDisplayName} onChange={e => setDraftDisplayName(e.target.value)} placeholder={presets[0] || 'Your display name'} style={inputStyle} />
                  </div>
                )
              })()}

              {/* Work & background */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '14px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e4e6eb' }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8 }}>{t('field_civil_eng_question')}</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {([true, false] as const).map(val => (
                      <button key={String(val)} onClick={() => setInCivilEng(val)}
                        style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: `1.5px solid ${inCivilEng === val ? '#3b82f6' : '#e2e8f0'}`, background: inCivilEng === val ? '#eff6ff' : '#fff', color: inCivilEng === val ? '#3b82f6' : '#64748b', fontSize: 13, fontWeight: inCivilEng === val ? 700 : 500, cursor: 'pointer' }}>
                        {val ? t('field_yes') : t('field_no')}
                      </button>
                    ))}
                  </div>
                </div>

                {inCivilEng === true && (
                  <>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#65676b', display: 'block', marginBottom: 6 }}>{t('field_profession')}</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5, marginBottom: 7 }}>
                        {PROFESSION_KEYS.map(p => (
                          <button key={p.value} onClick={() => setDraftProfession(draftProfession === p.value ? '' : p.value)}
                            style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, cursor: 'pointer', border: `1px solid ${draftProfession === p.value ? '#3b82f6' : '#e2e8f0'}`, background: draftProfession === p.value ? '#eff6ff' : '#fff', color: draftProfession === p.value ? '#3b82f6' : '#475569', fontWeight: draftProfession === p.value ? 600 : 400 }}>
                            {t(p.labelKey as any)}
                          </button>
                        ))}
                      </div>
                      <input value={draftProfession} onChange={e => setDraftProfession(e.target.value)} placeholder={t('field_profession_placeholder')} style={{ ...inputStyle, background: '#fff' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#65676b', display: 'block', marginBottom: 6 }}>{t('field_specializations')}</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5, marginBottom: 7 }}>
                        {SPECIALIZATION_KEYS.map(s => {
                          const on = draftSpecs.includes(s.value)
                          return (
                            <button key={s.value} onClick={() => setDraftSpecs(prev => on ? prev.filter(x => x !== s.value) : [...prev, s.value])}
                              style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, cursor: 'pointer', border: `1px solid ${on ? '#8b5cf6' : '#e2e8f0'}`, background: on ? '#f5f3ff' : '#fff', color: on ? '#7c3aed' : '#475569', fontWeight: on ? 600 : 400 }}>
                              {t(s.labelKey as any)}
                            </button>
                          )
                        })}
                      </div>
                      <input value={draftSpecs.filter(s => !SPECIALIZATIONS.includes(s)).join(', ')}
                        onChange={e => { const custom = e.target.value ? e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) : []; setDraftSpecs(prev => [...prev.filter(s => SPECIALIZATIONS.includes(s)), ...custom]) }}
                        placeholder={t('field_specializations_placeholder')} style={{ ...inputStyle, background: '#fff' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 700, color: '#65676b', display: 'block', marginBottom: 6 }}>{t('field_experience')}</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5 }}>
                        {EXPERIENCE_KEYS.map(opt => (
                          <button key={opt.value} onClick={() => setDraftExperience(draftExperience === opt.value ? '' : opt.value)}
                            style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: `1px solid ${draftExperience === opt.value ? '#10b981' : '#e2e8f0'}`, background: draftExperience === opt.value ? '#f0fdf4' : '#fff', color: draftExperience === opt.value ? '#059669' : '#475569', fontWeight: draftExperience === opt.value ? 700 : 400 }}>
                            {t(opt.labelKey as any)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {inCivilEng === false && (
                  <>
                    <Field label={t('field_profession_other')}>
                      <input value={draftProfession} onChange={e => setDraftProfession(e.target.value)} placeholder={t('field_profession_other_placeholder')} style={{ ...inputStyle, background: '#fff' }} />
                    </Field>
                    <Field label={t('field_field_industry')}>
                      <input value={draftSpecs.join(', ')} onChange={e => setDraftSpecs(e.target.value ? e.target.value.split(',').map(s => s.trim()).filter(Boolean) : [])} placeholder={t('field_field_industry_placeholder')} style={{ ...inputStyle, background: '#fff' }} />
                    </Field>
                    <Field label={t('field_experience')}>
                      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5 }}>
                        {EXPERIENCE_KEYS.map(opt => (
                          <button key={opt.value} onClick={() => setDraftExperience(draftExperience === opt.value ? '' : opt.value)}
                            style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: `1px solid ${draftExperience === opt.value ? '#10b981' : '#e2e8f0'}`, background: draftExperience === opt.value ? '#f0fdf4' : '#fff', color: draftExperience === opt.value ? '#059669' : '#475569', fontWeight: draftExperience === opt.value ? 700 : 400 }}>
                            {t(opt.labelKey as any)}
                          </button>
                        ))}
                      </div>
                    </Field>
                  </>
                )}
              </div>

              <Field label={t('field_bio')}>
                <textarea value={draftDescription} onChange={e => setDraftDescription(e.target.value)} placeholder={t('field_bio_placeholder')} rows={3}
                  style={{ ...inputStyle, resize: 'vertical' as const, fontFamily: 'inherit' }} />
              </Field>

              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <Field label={t('field_organization')}><input value={draftOrg} onChange={e => setDraftOrg(e.target.value)} placeholder={t('field_organization_placeholder')} style={inputStyle} /></Field>
                </div>
                <div style={{ flex: 1 }}>
                  <Field label={t('field_location')}><input value={draftLocation} onChange={e => setDraftLocation(e.target.value)} placeholder={t('field_location_placeholder')} style={inputStyle} /></Field>
                </div>
              </div>

              <Field label={t('field_website')}><input value={draftWebsite} onChange={e => setDraftWebsite(e.target.value)} placeholder={t('field_website_placeholder')} style={inputStyle} /></Field>
              <Field label={t('field_linkedin')}><input value={draftLinkedin} onChange={e => setDraftLinkedin(e.target.value)} placeholder={t('field_linkedin_placeholder')} style={inputStyle} /></Field>

              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#65676b', display: 'block', marginBottom: 6 }}>
                  {t('field_featured_links')} <span style={{ fontWeight: 400, color: '#94a3b8' }}>{t('field_featured_links_hint')}</span>
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {draftLinks.map((lnk, i) => (
                    <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                        <input value={lnk.label} onChange={e => setDraftLinks(prev => prev.map((l, j) => j === i ? { ...l, label: e.target.value } : l))} placeholder={t('field_link_label_placeholder')} style={{ ...inputStyle, fontSize: 13, padding: '7px 10px' }} />
                        <input value={lnk.url} onChange={e => setDraftLinks(prev => prev.map((l, j) => j === i ? { ...l, url: e.target.value } : l))} placeholder="https://…" style={{ ...inputStyle, fontSize: 13, padding: '7px 10px' }} />
                      </div>
                      <button onClick={() => setDraftLinks(prev => prev.filter((_, j) => j !== i))} style={{ width: 30, height: 30, borderRadius: 6, border: 'none', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                        <Trash2 size={14} color="#ef4444" />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => setDraftLinks(prev => [...prev, { label: '', url: '' }])} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, border: '1.5px dashed #d1d5db', background: 'none', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' as const }}>
                    <Plus size={14} /> {t('btn_add_link')}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#65676b', display: 'block', marginBottom: 6 }}>{t('field_email')}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: '#f8fafc', border: '1.5px solid #e4e6eb', borderRadius: 8 }}>
                  <span style={{ flex: 1, fontSize: 14, color: '#94a3b8', fontStyle: 'italic' }}>{user.email}</span>
                  <Lock size={13} color="#bcc0c4" />
                </div>
              </div>
            </div>

        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid #e4e6eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          {msg ? (
            <div style={{ fontSize: 13, fontWeight: 600, color: msg.startsWith('Error') || msg.includes('match') || msg.includes('Min') ? '#ef4444' : '#10b981' }}>{msg}</div>
          ) : <div />}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#e4e6eb', color: '#050505', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#d8dadf' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#e4e6eb' }}>
              {t('btn_cancel')}
            </button>
            <button onClick={() => saveInfo()} disabled={saving} style={{ padding: '9px 22px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#2563eb' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#3b82f6' }}>
              {saving ? t('btn_saving') : t('btn_save_changes')}
            </button>
          </div>
        </div>
      </div>

      {/* Re-verification prompt */}
      {showReverifyPrompt && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 600 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 601, background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', width: 380, padding: '28px 24px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fef9c3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <BadgeCheck size={26} color="#ca8a04" />
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>{t('reverify_title')}</div>
            </div>
            <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.65 }}>{t('reverify_body')}</div>
            <div style={{ fontSize: 13, color: '#64748b', background: '#f8fafc', borderRadius: 10, padding: '10px 14px', lineHeight: 1.6 }}>{t('reverify_note')}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={() => { setShowReverifyPrompt(false); saveInfo(true) }} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: '#0f172a', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                {t('btn_save_submit_review')}
              </button>
              <button onClick={() => setShowReverifyPrompt(false)} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: '#f0f2f5', color: '#050505', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                {t('btn_cancel')}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
