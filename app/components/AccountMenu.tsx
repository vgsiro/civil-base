'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, LogOut, UserCircle, ChevronRight, ChevronLeft, Languages, KeyRound, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import { useTranslation } from '../i18n/LanguageContext'
import type { Locale } from '../i18n/index'

const AVATAR_COLORS = [
  'linear-gradient(135deg, #3b82f6, #8b5cf6)',
  'linear-gradient(135deg, #10b981, #3b82f6)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #ec4899, #8b5cf6)',
  'linear-gradient(135deg, #06b6d4, #10b981)',
  'linear-gradient(135deg, #f97316, #f59e0b)',
]

const LANGUAGE_OPTIONS: { value: Locale; label: string; code: string }[] = [
  { value: 'en', label: 'English',     code: 'EN' },
  { value: 'vi', label: 'Tiếng Việt',  code: 'VN' },
  // { value: 'zh', label: '中文',       code: 'ZH' },
]

interface Props {
  user: User
  avatarColor?: number
  avatarUrl?: string | null
  displayName: string
  profileUsername?: string | null
  size?: number
  dark?: boolean
  onSignOut?: () => void
}

export default function AccountMenu({ user, avatarColor = 0, avatarUrl, displayName, profileUsername, size = 32, dark = false, onSignOut }: Props) {
  const [open, setOpen] = useState(false)
  const [panel, setPanel] = useState<'main' | 'settings' | 'password'>('main')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [pwMsg, setPwMsg] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { t, locale, setLocale } = useTranslation()

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setPanel('main')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function close() { setOpen(false); setPanel('main'); resetPw() }
  function openSettings() { setPanel('settings') }
  function cancelSettings() { setPanel('main'); resetPw() }
  function resetPw() { setCurrentPw(''); setNewPw(''); setConfirmPw(''); setPwMsg(''); setShowCurrentPw(false); setShowNewPw(false); setShowConfirmPw(false) }

  async function savePassword() {
    if (newPw !== confirmPw) { setPwMsg('Passwords do not match'); return }
    if (newPw.length < 6) { setPwMsg('Minimum 6 characters'); return }
    setPwSaving(true); setPwMsg('')
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email!, password: currentPw })
    if (signInError) { setPwSaving(false); setPwMsg('Current password is incorrect'); return }
    const { error } = await supabase.auth.updateUser({ password: newPw })
    setPwSaving(false)
    if (error) { setPwMsg('Error: ' + error.message); return }
    setPwMsg('Password updated!')
    setTimeout(() => { resetPw(); setPanel('settings') }, 1500)
  }

  async function handleSignOut() {
    close()
    await supabase.auth.signOut()
    if (onSignOut) onSignOut()
    else router.push('/')
  }

  const initial = (displayName || '?')[0].toUpperCase()
  const profileHref = profileUsername ? `/u/${profileUsername}` : '/u/setup'

  const menuItem = (icon: React.ReactNode, label: string, sub: string, onClick: () => void, chevron = true) => (
    <button onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 10px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' as const }}
      onMouseEnter={e => { e.currentTarget.style.background = '#f0f2f5' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e4e6eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#050505' }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: '#65676b', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{sub}</div>}
      </div>
      {chevron && <ChevronRight size={15} color="#bcc0c4" style={{ flexShrink: 0 }} />}
    </button>
  )

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      {/* Trigger */}
      <button
        onClick={() => { setOpen(o => !o); setPanel('main') }}
        style={{ padding: 2, borderRadius: '50%', border: open ? '2px solid #3b82f6' : '2px solid transparent', cursor: 'pointer', background: 'none', transition: 'border-color 0.15s', display: 'flex' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#93c5fd' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = open ? '#3b82f6' : 'transparent' }}>
        <div style={{ width: size, height: size, borderRadius: '50%', background: AVATAR_COLORS[avatarColor], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.round(size * 0.44), fontWeight: 800, color: '#fff', flexShrink: 0, overflow: 'hidden' }}>
          {avatarUrl ? <img src={avatarUrl} alt={initial} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initial}
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: '#fff', borderRadius: 12, boxShadow: '0 8px 40px rgba(0,0,0,0.18)', border: '1px solid #e4e6eb', zIndex: 400, width: 290, overflow: 'hidden' }}>

          {/* ── MAIN PANEL ── */}
          {panel === 'main' && (
            <>
              {/* Profile card */}
              <div style={{ padding: '8px 8px 4px' }}>
                <a href={profileHref} onClick={close}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, textDecoration: 'none', border: '2px solid #3b82f6', background: 'linear-gradient(135deg, #eff6ff, #f5f3ff)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'linear-gradient(135deg, #dbeafe, #ede9fe)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'linear-gradient(135deg, #eff6ff, #f5f3ff)' }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: AVATAR_COLORS[avatarColor], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: '#fff', flexShrink: 0, overflow: 'hidden' }}>
                    {avatarUrl ? <img src={avatarUrl} alt={initial} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initial}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#050505', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{displayName}</div>
                    {profileUsername && <div style={{ fontSize: 12, color: '#65676b', marginTop: 1 }}>@{profileUsername}</div>}
                    <div style={{ fontSize: 12, color: '#3b82f6', fontWeight: 600, marginTop: 3 }}>{t('settings_view_profile')} →</div>
                  </div>
                </a>
              </div>

              <div style={{ height: 1, background: '#e4e6eb', margin: '4px 0' }} />

              <div style={{ padding: '4px 8px' }}>
                {menuItem(<UserCircle size={19} color="#050505" />, t('settings_view_profile'), profileUsername ? `civilbase.com/u/${profileUsername}` : t('settings_view_profile_sub'), () => { router.push(profileHref); close() })}
                {menuItem(<Settings size={19} color="#050505" />, t('settings'), t('settings_language_sub'), openSettings)}
              </div>

              <div style={{ height: 1, background: '#e4e6eb', margin: '4px 0' }} />

              <div style={{ padding: '4px 8px 8px' }}>
                <button onClick={handleSignOut}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 10px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' as const }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <LogOut size={18} color="#ef4444" />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#ef4444' }}>{t('settings_sign_out')}</span>
                </button>
              </div>

              <div style={{ padding: '6px 16px 10px', borderTop: '1px solid #e4e6eb' }}>
                <div style={{ fontSize: 11, color: '#bcc0c4' }}>{t('settings_footer')}</div>
              </div>
            </>
          )}

          {/* ── PASSWORD PANEL ── */}
          {panel === 'password' && (
            <>
              <div style={{ padding: '4px 8px 4px', borderBottom: '1px solid #e4e6eb' }}>
                <button onClick={() => { setPanel('settings'); resetPw() }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', width: '100%' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f0f2f5' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                  <ChevronLeft size={18} color="#050505" />
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#050505' }}>{t('section_change_password')}</span>
                </button>
              </div>

              <div style={{ padding: '14px 16px 8px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(['current', 'new', 'confirm'] as const).map(field => {
                  const val = field === 'current' ? currentPw : field === 'new' ? newPw : confirmPw
                  const setter = field === 'current' ? setCurrentPw : field === 'new' ? setNewPw : setConfirmPw
                  const shown = field === 'current' ? showCurrentPw : field === 'new' ? showNewPw : showConfirmPw
                  const toggleShown = field === 'current' ? () => setShowCurrentPw(v => !v) : field === 'new' ? () => setShowNewPw(v => !v) : () => setShowConfirmPw(v => !v)
                  const label = field === 'current' ? t('field_current_password') : field === 'new' ? t('field_new_password') : t('field_confirm_password')
                  const placeholder = field === 'current' ? t('field_current_password_placeholder') : field === 'new' ? t('field_new_password_placeholder') : t('field_confirm_password_placeholder')
                  return (
                    <div key={field}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#65676b', marginBottom: 5 }}>{label}</div>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #e4e6eb', borderRadius: 8, overflow: 'hidden' }}>
                        <input
                          type={shown ? 'text' : 'password'}
                          value={val}
                          onChange={e => setter(e.target.value)}
                          placeholder={placeholder}
                          style={{ flex: 1, padding: '9px 10px', border: 'none', outline: 'none', fontSize: 14, background: '#fff' }}
                        />
                        <button onClick={toggleShown} tabIndex={-1}
                          style={{ padding: '0 10px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#94a3b8' }}>
                          {shown ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  )
                })}

                {pwMsg && (
                  <div style={{ fontSize: 12, fontWeight: 600, color: pwMsg === 'Password updated!' ? '#10b981' : '#ef4444' }}>{pwMsg}</div>
                )}

                <button onClick={savePassword} disabled={!currentPw || !newPw || !confirmPw || pwSaving}
                  style={{ padding: '10px 0', borderRadius: 8, border: 'none', background: currentPw && newPw && confirmPw ? '#3b82f6' : '#e4e6eb', color: currentPw && newPw && confirmPw ? '#fff' : '#94a3b8', fontSize: 14, fontWeight: 700, cursor: currentPw && newPw && confirmPw ? 'pointer' : 'default' }}
                  onMouseEnter={e => { if (currentPw && newPw && confirmPw) e.currentTarget.style.background = '#2563eb' }}
                  onMouseLeave={e => { if (currentPw && newPw && confirmPw) e.currentTarget.style.background = '#3b82f6' }}>
                  {pwSaving ? t('btn_updating') : t('btn_update_password')}
                </button>
              </div>

              <div style={{ padding: '6px 16px 10px', borderTop: '1px solid #e4e6eb' }}>
                <div style={{ fontSize: 11, color: '#bcc0c4' }}>{t('settings_footer')}</div>
              </div>
            </>
          )}

          {/* ── SETTINGS PANEL ── */}
          {panel === 'settings' && (
            <>
              {/* Header */}
              <div style={{ padding: '4px 8px 4px', borderBottom: '1px solid #e4e6eb' }}>
                <button onClick={cancelSettings}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', width: '100%' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f0f2f5' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                  <ChevronLeft size={18} color="#050505" />
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#050505' }}>{t('settings')}</span>
                </button>
              </div>

              <div style={{ padding: '12px 16px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Language */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                    <Languages size={15} color="#65676b" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{t('settings_language')}</span>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <select
                      value={locale}
                      onChange={e => setLocale(e.target.value as Locale)}
                      style={{ width: '100%', padding: '10px 36px 10px 12px', borderRadius: 9, border: '1.5px solid #3b82f6', background: '#e7f3ff', color: '#1877f2', fontSize: 14, fontWeight: 700, cursor: 'pointer', appearance: 'none', outline: 'none' }}>
                      {LANGUAGE_OPTIONS.map(lang => (
                        <option key={lang.value} value={lang.value}>
                          {lang.code}{'  '}{lang.label}
                        </option>
                      ))}
                    </select>
                    <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 5l4 4 4-4" stroke="#1877f2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  </div>
                </div>

                {/* Change password */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                    <KeyRound size={15} color="#65676b" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{t('section_change_password')}</span>
                  </div>
                  <button onClick={() => setPanel('password')}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 9, border: '1.5px solid #e4e6eb', background: '#f0f2f5', color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left' as const, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#e4e6eb' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#f0f2f5' }}>
                    <span>{t('btn_update_password')}</span>
                    <ChevronRight size={15} color="#bcc0c4" />
                  </button>
                </div>
              </div>

              <div style={{ padding: '6px 16px 10px', borderTop: '1px solid #e4e6eb' }}>
                <div style={{ fontSize: 11, color: '#bcc0c4' }}>{t('settings_footer')}</div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
