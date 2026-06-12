'use client'
import { useState } from 'react'
import { MapPin, Globe, Link2, Building2, Calendar, Award, GraduationCap, ExternalLink } from 'lucide-react'
import type { Profile } from '../../../_types'
import { useTranslation } from '../../../i18n/LanguageContext'
import { EXPERIENCE_KEYS, PROFESSION_KEYS, SPECIALIZATION_KEYS } from './EditModal'

interface Props {
  profile: Profile
  joined: string
  isOwnProfile: boolean
  onEditOpen: () => void
}

export default function ProfileIntroCard({ profile, joined, isOwnProfile, onEditOpen }: Props) {
  const { t } = useTranslation()
  const [bioExpanded, setBioExpanded] = useState(false)

  function tp(value: string | null | undefined): string {
    if (!value) return ''
    const prof = PROFESSION_KEYS.find(p => p.value === value)
    if (prof) return t(prof.labelKey as any)
    const spec = SPECIALIZATION_KEYS.find(s => s.value === value)
    if (spec) return t(spec.labelKey as any)
    const exp = EXPERIENCE_KEYS.find(e => e.value === value)
    if (exp) return t(exp.labelKey as any)
    return value
  }

  return (
    <div className="profile-left-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 72 }}>
      {/* Intro card */}
      <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e4e6eb', padding: '16px' }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#050505', marginBottom: 14 }}>{t('section_intro')}</div>

        {/* Bio */}
        {profile.description && (() => {
          const BIO_LIMIT = 160
          const long = profile.description!.length > BIO_LIMIT
          const shown = bioExpanded || !long ? profile.description! : profile.description!.slice(0, BIO_LIMIT).trimEnd() + '…'
          return (
            <div style={{ marginBottom: 14 }}>
              <p style={{ margin: 0, fontSize: 15, color: '#050505', lineHeight: 1.6, textAlign: 'center' as const }}>{shown}</p>
              {long && (
                <button onClick={() => setBioExpanded(v => !v)}
                  style={{ display: 'block', margin: '4px auto 0', background: 'none', border: 'none', color: '#3b82f6', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                  {bioExpanded ? t('intro_see_less') : t('intro_see_more')}
                </button>
              )}
            </div>
          )
        })()}

        {/* Edit bio button */}
        {isOwnProfile && (
          <button onClick={onEditOpen}
            style={{ display: 'block', width: '100%', textAlign: 'center' as const, padding: '8px 0', marginBottom: 14, borderRadius: 8, background: '#e4e6eb', color: '#050505', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', boxSizing: 'border-box' as const }}
            onMouseEnter={e => { e.currentTarget.style.background = '#d8dadf' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#e4e6eb' }}>
            {t('btn_edit_bio')}
          </button>
        )}

        {/* Profile fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {profile.profession && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, color: '#050505' }}>
              <Award size={18} color="#65676b" style={{ flexShrink: 0 }} />
              <span><strong>{tp(profile.profession)}</strong></span>
            </div>
          )}
          {profile.organization && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, color: '#050505' }}>
              <Building2 size={18} color="#65676b" style={{ flexShrink: 0 }} />
              <span>{profile.organization}</span>
            </div>
          )}
          {profile.experience && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, color: '#050505' }}>
              <GraduationCap size={18} color="#65676b" style={{ flexShrink: 0 }} />
              <span>{tp(profile.experience)} {t('intro_experience')}</span>
            </div>
          )}
          {profile.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, color: '#050505' }}>
              <MapPin size={18} color="#65676b" style={{ flexShrink: 0 }} />
              <span>{t('intro_lives_in')} <strong>{profile.location}</strong></span>
            </div>
          )}
          {profile.website && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15 }}>
              <Globe size={18} color="#65676b" style={{ flexShrink: 0 }} />
              <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                target="_blank" rel="noopener noreferrer"
                style={{ color: '#3b82f6', textDecoration: 'none', wordBreak: 'break-all' as const }}
                onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}>
                {profile.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
          {profile.linkedin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15 }}>
              <Link2 size={18} color="#0a66c2" style={{ flexShrink: 0 }} />
              <a href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://${profile.linkedin}`}
                target="_blank" rel="noopener noreferrer"
                style={{ color: '#0a66c2', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}>
                {t('intro_linkedin')}
              </a>
            </div>
          )}
          {profile.featured_links && profile.featured_links.length > 0 && (
            <>
              <div style={{ height: 1, background: '#f0f2f5', margin: '2px 0' }} />
              {profile.featured_links.map((lnk, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14 }}>
                  <ExternalLink size={16} color="#64748b" style={{ flexShrink: 0, marginTop: 2 }} />
                  <a href={lnk.url.startsWith('http') ? lnk.url : `https://${lnk.url}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ color: '#3b82f6', textDecoration: 'none', lineHeight: 1.4 }}
                    onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                    onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}>
                    {lnk.label}
                  </a>
                </div>
              ))}
            </>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, color: '#65676b' }}>
            <Calendar size={18} color="#65676b" style={{ flexShrink: 0 }} />
            <span>{t('intro_joined')} {joined}</span>
          </div>
        </div>

        {/* Completeness bar (own profile only) */}
        {isOwnProfile && (() => {
          const fields = [
            { key: 'display_name',    filled: !!profile.display_name },
            { key: 'profession',      filled: !!profile.profession },
            { key: 'description',     filled: !!profile.description },
            { key: 'organization',    filled: !!profile.organization },
            { key: 'location',        filled: !!profile.location },
            { key: 'experience',      filled: !!profile.experience },
            { key: 'avatar_url',      filled: !!profile.avatar_url },
            { key: 'specializations', filled: !!(profile.specializations?.length) },
          ]
          const filled = fields.filter(f => f.filled).length
          const total = fields.length
          const pct = Math.round((filled / total) * 100)
          if (pct === 100) return (
            <div style={{ marginTop: 14 }}>
              <button onClick={onEditOpen}
                style={{ display: 'block', width: '100%', textAlign: 'center' as const, padding: '8px 0', borderRadius: 8, background: '#e4e6eb', color: '#050505', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', boxSizing: 'border-box' as const }}
                onMouseEnter={e => { e.currentTarget.style.background = '#d8dadf' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#e4e6eb' }}>
                {t('btn_edit_details')}
              </button>
            </div>
          )
          const MESSAGES = [
            { min: 0,   msg: t('completeness_0') },
            { min: 25,  msg: t('completeness_25') },
            { min: 50,  msg: t('completeness_50') },
            { min: 75,  msg: t('completeness_75') },
            { min: 90,  msg: t('completeness_90') },
            { min: 100, msg: t('completeness_100') },
          ]
          const motivate = [...MESSAGES].reverse().find(m => pct >= m.min)!.msg
          const barColor = pct === 100 ? '#16a34a' : pct >= 75 ? '#3b82f6' : pct >= 50 ? '#f59e0b' : '#94a3b8'
          return (
            <div style={{ marginTop: 14 }}>
              <button onClick={onEditOpen}
                style={{ display: 'block', width: '100%', textAlign: 'center' as const, padding: '8px 0', borderRadius: 8, background: '#e4e6eb', color: '#050505', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', boxSizing: 'border-box' as const }}
                onMouseEnter={e => { e.currentTarget.style.background = '#d8dadf' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#e4e6eb' }}>
                {t('btn_edit_details')}
              </button>
              <div style={{ marginTop: 12, padding: '12px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e4e6eb' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{t('profile_completeness')}</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: barColor }}>{filled}/{total}</span>
                </div>
                <div style={{ height: 7, borderRadius: 10, background: '#e4e6eb', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 10, transition: 'width 0.4s ease' }} />
                </div>
                <p style={{ margin: '8px 0 0', fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{motivate}</p>
                {pct < 100 && (
                  <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap' as const, gap: 4 }}>
                    {fields.filter(f => !f.filled).map(f => (
                      <button key={f.key} onClick={onEditOpen}
                        style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, border: '1px dashed #cbd5e1', background: 'none', color: '#64748b', cursor: 'pointer' }}>
                        + {f.key.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })()}
      </div>

      {/* Specializations card */}
      {profile.specializations && profile.specializations.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e4e6eb', padding: '16px' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#050505', marginBottom: 12 }}>{t('section_specializations')}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
            {profile.specializations.map(s => (
              <span key={s} style={{ fontSize: 13, fontWeight: 600, color: '#3b82f6', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 20, padding: '4px 12px' }}>{tp(s)}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
