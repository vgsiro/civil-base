'use client'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { LogIn, X, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useTranslation } from '../../i18n/LanguageContext'

function PasswordInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false)
  const { t } = useTranslation()
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="••••••••"
        style={{ width: '100%', padding: '9px 36px 9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }}
        onFocus={e => (e.currentTarget.style.borderColor = '#3b82f6')}
        onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
      />
      <button type="button" onClick={() => setShow(v => !v)} tabIndex={-1}
        style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', padding: 2 }}>
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  )
}

export default function SignInPromptModal({ action, onClose }: {
  action: 'like' | 'comment' | 'recommend' | 'share' | 'save' | 'vote'
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [step, setStep] = useState<'prompt' | 'auth'>('prompt')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const actionLabel: Record<typeof action, string> = {
    like:      t('guest_prompt_like'),
    comment:   t('guest_prompt_comment'),
    recommend: t('guest_prompt_recommend'),
    share:     t('guest_prompt_share'),
    save:      t('guest_prompt_save'),
    vote:      t('guest_prompt_vote'),
  }

  function switchMode(m: 'signin' | 'signup') {
    setMode(m); setError(''); setSuccess(''); setPassword(''); setConfirm(''); setAgreedToTerms(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setSuccess('')
    if (!email.trim() || !password.trim()) return
    if (mode === 'signup') {
      if (password !== confirm) { setError(t('home_auth_err_passwords_mismatch')); return }
      if (password.length < 6) { setError(t('home_auth_err_password_short')); return }
      if (!agreedToTerms) { setError(t('home_auth_err_agree_terms')); return }
    }
    setLoading(true)
    const { error: err } = mode === 'signin'
      ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
      : await supabase.auth.signUp({ email: email.trim(), password })
    setLoading(false)
    if (err) {
      setError(err.message)
    } else if (mode === 'signup') {
      setSuccess(t('home_auth_success_check_email'))
    } else {
      // Signed in — reload so the page picks up the new session
      window.location.reload()
    }
  }

  const canSubmit = mode === 'signin'
    ? !!(email && password)
    : !!(email && password && confirm && agreedToTerms)

  const modal = (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9300 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 9301, background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', width: 360, overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', padding: '18px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.1em' }}>CIVILAXIS</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>
              {step === 'prompt' ? t('guest_prompt_title') : mode === 'signin' ? t('home_auth_sign_in') : t('home_auth_sign_up')}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}>
            <X size={18} />
          </button>
        </div>

        {step === 'prompt' ? (
          <div style={{ padding: '24px 24px 22px', display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'center' as const }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
              <LogIn size={24} color="#3b82f6" />
            </div>
            <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>{actionLabel[action]}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={() => { setStep('auth'); switchMode('signin') }}
                style={{ width: '100%', padding: '11px 0', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                {t('guest_prompt_btn_signin')}
              </button>
              <button onClick={() => { setStep('auth'); switchMode('signup') }}
                style={{ width: '100%', padding: '10px 0', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', color: '#0f172a', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                {t('home_auth_signup_link')}
              </button>
              <button onClick={onClose}
                style={{ width: '100%', padding: '10px 0', borderRadius: 8, border: 'none', background: '#f0f2f5', color: '#65676b', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                {t('btn_cancel')}
              </button>
            </div>
          </div>
        ) : success ? (
          <div style={{ padding: '32px 24px 36px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' as const }}>
            <div style={{ fontSize: 36 }}>✉️</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{t('home_auth_check_email_title')}</div>
            <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
              {t('home_auth_check_email_sent')} <strong>{email}</strong>.<br />{t('home_auth_check_email_activate')}
            </div>
            <button onClick={onClose}
              style={{ padding: '10px 28px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              {t('home_auth_got_it')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: '18px 24px 22px', display: 'flex', flexDirection: 'column', gap: 11 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>{t('home_auth_email')}</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoFocus
                placeholder={t('home_auth_email_placeholder')}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }}
                onFocus={e => (e.currentTarget.style.borderColor = '#3b82f6')}
                onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>{t('home_auth_password')}</label>
              <PasswordInput value={password} onChange={setPassword} />
            </div>
            {mode === 'signup' && (
              <>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>{t('home_auth_confirm_password')}</label>
                  <PasswordInput value={confirm} onChange={setConfirm} />
                </div>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
                  <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)}
                    style={{ marginTop: 2, flexShrink: 0, accentColor: '#3b82f6' }} />
                  <span>
                    {t('home_auth_agree_prefix')}{' '}
                    <a href="/guidelines" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', fontWeight: 600, textDecoration: 'none' }}>
                      {t('home_auth_terms')}
                    </a>
                  </span>
                </label>
              </>
            )}
            {error && <div style={{ fontSize: 12, color: '#dc2626', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 7, padding: '7px 10px' }}>{error}</div>}
            <button type="submit" disabled={loading || !canSubmit}
              style={{ padding: '10px', borderRadius: 8, border: 'none', cursor: loading || !canSubmit ? 'default' : 'pointer', fontSize: 13, fontWeight: 700,
                background: canSubmit ? '#3b82f6' : '#e2e8f0', color: canSubmit ? '#fff' : '#94a3b8', marginTop: 2 }}>
              {loading ? t('home_auth_please_wait') : mode === 'signin' ? t('home_auth_sign_in') : t('home_auth_create_account')}
            </button>
            <div style={{ textAlign: 'center' as const, fontSize: 12, color: '#64748b' }}>
              {mode === 'signin'
                ? <>{t('home_auth_no_account')} <button type="button" onClick={() => switchMode('signup')} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>{t('home_auth_signup_link')}</button></>
                : <>{t('home_auth_have_account')} <button type="button" onClick={() => switchMode('signin')} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>{t('home_auth_signin_link')}</button></>
              }
            </div>
            <button type="button" onClick={() => setStep('prompt')}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 11, textAlign: 'center' as const }}>
              ← {t('btn_cancel')}
            </button>
          </form>
        )}
      </div>
    </>
  )

  return createPortal(modal, document.body)
}
