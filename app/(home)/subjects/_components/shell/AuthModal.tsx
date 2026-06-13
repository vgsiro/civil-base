'use client'
import { useState } from 'react'
import { useScrollLock } from '../../../../_hooks/useScrollLock'
import { X, Eye, EyeOff } from 'lucide-react'
import { useTranslation } from '../../../../i18n/LanguageContext'
import { EmailValidationError } from '../../../../_lib/auth'

interface Props {
  onClose: () => void
  signIn: (email: string, password: string, remember?: boolean) => Promise<any>
  signUp: (email: string, password: string) => Promise<any>
}

function PasswordInput({ value, onChange, placeholder, error, onBlur }: { value: string; onChange: (v: string) => void; placeholder?: string; error?: boolean; onBlur?: () => void }) {
  const [show, setShow] = useState(false)
  const borderIdle = error ? '#fca5a5' : '#e2e8f0'
  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? '••••••••'}
        style={{ width: '100%', padding: '9px 36px 9px 12px', border: `1px solid ${borderIdle}`, borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
        onFocus={e => (e.currentTarget.style.borderColor = error ? '#fca5a5' : '#3b82f6')}
        onBlur={e => { onBlur?.(); e.currentTarget.style.borderColor = borderIdle }}
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', padding: 2 }}
        tabIndex={-1}>
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  )
}

export default function AuthModal({ onClose, signIn, signUp }: Props) {
  useScrollLock()
  const { t } = useTranslation()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [confirmError, setConfirmError] = useState('')
  const [success, setSuccess] = useState('')

  function switchMode(m: 'signin' | 'signup') {
    setMode(m); setError(''); setEmailError(''); setConfirmError(''); setSuccess(''); setPassword(''); setConfirm(''); setAgreedToTerms(false)
  }

  // Validate confirm-password match when the user leaves the field, so the hint
  // shows under the input before the submit button becomes enabled.
  function validateConfirmOnBlur(): boolean {
    if (confirm && password !== confirm) { setConfirmError(t('home_auth_err_passwords_mismatch')); return true }
    return false
  }

  function emailErrorMessage(reason: EmailValidationError['reason']): string {
    if (reason === 'disposable') return t('home_auth_err_email_disposable')
    if (reason === 'domain') return t('home_auth_err_email_domain')
    return t('home_auth_err_email_invalid')
  }

  const canSubmit = mode === 'signin'
    ? !!(email && password)
    : !!(email && password && confirm && agreedToTerms)

  // Lightweight format check so we can show an inline hint instead of the browser's
  // native validation bubble (which appears at the cursor).
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  // Validate the email format when the user leaves the field, so the hint shows
  // even before the (disabled-until-complete) submit button can be clicked.
  function validateEmailOnBlur(): boolean {
    const v = email.trim()
    if (v && !EMAIL_RE.test(v)) { setEmailError(t('home_auth_err_email_invalid')); return true }
    return false
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setEmailError(''); setConfirmError(''); setSuccess('')
    if (!email.trim() || !password.trim()) return
    if (!EMAIL_RE.test(email.trim())) { setEmailError(t('home_auth_err_email_invalid')); return }
    if (mode === 'signup') {
      if (password !== confirm) { setConfirmError(t('home_auth_err_passwords_mismatch')); return }
      if (password.length < 6) { setError(t('home_auth_err_password_short')); return }
      if (!agreedToTerms) { setError(t('home_auth_err_agree_terms')); return }
    }
    setLoading(true)
    const err = mode === 'signin'
      ? await signIn(email.trim(), password, rememberMe)
      : await signUp(email.trim(), password)
    setLoading(false)
    if (err) {
      if (err instanceof EmailValidationError) setEmailError(emailErrorMessage(err.reason))
      else if (/email not confirmed/i.test(err.message)) setError(t('home_auth_err_email_not_confirmed'))
      else setError(err.message)
    } else if (mode === 'signup') {
      setSuccess(t('home_auth_success_check_email'))
    } else {
      onClose()
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={onClose} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: 14, width: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', padding: '20px 24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.1em' }}>CIVILAXIS</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{mode === 'signin' ? t('home_auth_sign_in') : t('home_auth_sign_up')}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}>
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div style={{ padding: '36px 24px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f0fdf4', border: '2px solid #86efac', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
              ✉️
            </div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>{t('home_auth_check_email_title')}</div>
            <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
              {t('home_auth_check_email_sent')} <strong>{email}</strong>.<br />{t('home_auth_check_email_activate')}
            </div>
            <div style={{ fontSize: 12, color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px', lineHeight: 1.5 }}>
              {t('home_auth_check_email_spam')}
            </div>
            <button onClick={onClose}
              style={{ marginTop: 8, padding: '10px 28px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              {t('home_auth_got_it')}
            </button>
            <button type="button" onClick={() => switchMode('signin')}
              style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
              {t('home_auth_back_to_signin')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>{t('home_auth_email')}</label>
              <input type="text" inputMode="email" autoComplete="email" value={email}
                onChange={e => { setEmail(e.target.value); if (emailError) setEmailError('') }} autoFocus
                placeholder={t('home_auth_email_placeholder')}
                style={{ width: '100%', padding: '9px 12px', border: `1px solid ${emailError ? '#fca5a5' : '#e2e8f0'}`, borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => (e.currentTarget.style.borderColor = emailError ? '#fca5a5' : '#3b82f6')}
                onBlur={e => { const bad = validateEmailOnBlur(); e.currentTarget.style.borderColor = bad ? '#fca5a5' : '#e2e8f0' }} />
              {emailError && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>{emailError}</div>}
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>{t('home_auth_password')}</label>
              <PasswordInput value={password} onChange={setPassword} />
            </div>

            {mode === 'signin' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: '#475569' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  style={{ flexShrink: 0, accentColor: '#3b82f6' }}
                />
                <span>{t('home_auth_remember_me')}</span>
              </label>
            )}

            {mode === 'signup' && (
              <>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>{t('home_auth_confirm_password')}</label>
                  <PasswordInput
                    value={confirm}
                    onChange={v => { setConfirm(v); if (confirmError) setConfirmError('') }}
                    placeholder={t('home_auth_reenter_password')}
                    error={!!confirmError}
                    onBlur={validateConfirmOnBlur}
                  />
                  {confirmError && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>{confirmError}</div>}
                </div>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={e => setAgreedToTerms(e.target.checked)}
                    style={{ marginTop: 2, flexShrink: 0, accentColor: '#3b82f6' }}
                  />
                  <span>
                    {t('home_auth_agree_prefix')}{' '}
                    <a href="/guidelines" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', fontWeight: 600, textDecoration: 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                      onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}>
                      {t('home_auth_terms')}
                    </a>
                  </span>
                </label>
              </>
            )}

            {error && <div style={{ fontSize: 12, color: '#dc2626', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 7, padding: '7px 10px' }}>{error}</div>}

            <button type="submit" disabled={loading || !canSubmit}
              style={{ padding: '10px', borderRadius: 8, border: 'none', cursor: loading || !canSubmit ? 'default' : 'pointer', fontSize: 13, fontWeight: 700,
                background: canSubmit ? '#3b82f6' : '#e2e8f0',
                color: canSubmit ? '#fff' : '#94a3b8',
                marginTop: 4 }}>
              {loading ? t('home_auth_please_wait') : mode === 'signin' ? t('home_auth_sign_in') : t('home_auth_create_account')}
            </button>

            <div style={{ textAlign: 'center', fontSize: 12, color: '#64748b' }}>
              {mode === 'signin'
                ? <>{t('home_auth_no_account')} <button type="button" onClick={() => switchMode('signup')} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>{t('home_auth_signup_link')}</button></>
                : <>{t('home_auth_have_account')} <button type="button" onClick={() => switchMode('signin')} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>{t('home_auth_signin_link')}</button></>
              }
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
