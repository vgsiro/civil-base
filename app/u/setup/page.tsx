'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, AtSign, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useTranslation } from '../../i18n/LanguageContext'

function slugify(input: string): string {
  return input.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim()
    .replace(/[\s_]+/g, '-').replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '').substring(0, 38)
}

function randomSuffix(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

async function generateUniqueUsername(base: string, userId: string): Promise<string> {
  const candidates = [
    base,
    `${base}${randomSuffix()}`,
    `${base}${randomSuffix()}`,
    `${base}${randomSuffix()}`,
  ]
  for (const candidate of candidates) {
    const slug = slugify(candidate)
    if (slug.length < 3) continue
    const { data } = await supabase
      .from('profiles').select('id').eq('username', slug).neq('id', userId).maybeSingle()
    if (!data) return slug
  }
  // Final fallback: user- + timestamp suffix
  return `user-${Date.now().toString(36)}`
}

export default function SetupUsernamePage() {
  const router = useRouter()
  const { t } = useTranslation()
  const [user, setUser] = useState<any>(null)
  const [value, setValue] = useState('')
  const [checking, setChecking] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  // While auto-generating, show a spinner instead of the form
  const [autoGenerating, setAutoGenerating] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/'); return }

      // Already has username — go straight to profile
      const { data } = await supabase.from('profiles').select('username').eq('id', user.id).maybeSingle()
      if (data?.username) { router.replace(`/u/${data.username}`); return }

      setUser(user)

      // Auto-generate a unique username from name/email and claim it immediately
      const meta = user.user_metadata ?? {}
      const base = slugify(meta.full_name || user.email?.split('@')[0] || 'user')
      const uniqueSlug = await generateUniqueUsername(base.length >= 3 ? base : 'user', user.id)

      const { error: upsertErr } = await supabase.from('profiles').upsert({
        id: user.id,
        username: uniqueSlug,
        full_name: meta.full_name ?? null,
        avatar_color: meta.avatar_color ?? 0,
      }, { onConflict: 'id' })

      if (upsertErr) {
        // Auto-claim failed — fall back to manual picker
        setAutoGenerating(false)
        if (base.length >= 3) setValue(base)
        return
      }

      // Auto-claimed — redirect straight to profile
      router.replace(`/u/${uniqueSlug}`)
    })
  }, [router])

  useEffect(() => {
    if (!value || value.length < 3) { setAvailable(null); return }
    const slug = slugify(value)
    if (slug.length < 3) { setAvailable(null); return }
    setChecking(true)
    setAvailable(null)
    const timer = setTimeout(async () => {
      const { data } = await supabase.from('profiles').select('id').eq('username', slug).maybeSingle()
      setAvailable(!data)
      setChecking(false)
    }, 400)
    return () => clearTimeout(timer)
  }, [value])

  async function handleClaim() {
    setError('')
    const slug = slugify(value)
    if (slug.length < 3) { setError('At least 3 characters'); return }
    if (!available) { setError('That username is taken'); return }
    setSaving(true)
    const meta = user.user_metadata ?? {}
    const { error: err } = await supabase.from('profiles').upsert({
      id: user.id,
      username: slug,
      full_name: meta.full_name ?? null,
      avatar_color: meta.avatar_color ?? 0,
    }, { onConflict: 'id' })
    setSaving(false)
    if (err) { setError(err.message); return }
    router.replace(`/u/${slug}`)
  }

  // Spinner while auto-generating / redirecting
  if (autoGenerating || !user) {
    return (
      <div style={{ minHeight: '100vh', background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Loader2 size={32} color="#3b82f6" style={{ animation: 'spin 1s linear infinite' }} />
          <div style={{ fontSize: 14, color: '#65676b' }}>Setting up your profile…</div>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  // Fallback manual picker (only shown if auto-claim fails)
  const slug = slugify(value)
  const meta = user.user_metadata ?? {}
  const displayName = meta.full_name || user.email?.split('@')[0] || 'You'

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.10)', padding: '40px 36px', maxWidth: 440, width: '100%' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <img src="/logo.png" alt="Civil Base" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
          <span style={{ fontSize: 22, fontWeight: 800, color: '#1e3a5f' }}>Civil Base</span>
        </div>

        <div style={{ fontSize: 24, fontWeight: 800, color: '#050505', marginBottom: 8 }}>
          {t('setup_title')}
        </div>
        <div style={{ fontSize: 15, color: '#65676b', marginBottom: 28, lineHeight: 1.5 }}>
          Hi <strong>{displayName}</strong>! Choose a unique username — this becomes your public profile link.
        </div>

        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', border: `2px solid ${available === true ? '#10b981' : available === false ? '#ef4444' : '#e4e6eb'}`, borderRadius: 10, overflow: 'hidden', background: '#fff', transition: 'border-color 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '12px 14px', background: '#f8fafc', borderRight: '1px solid #e4e6eb', flexShrink: 0 }}>
              <AtSign size={16} color="#65676b" />
              <span style={{ fontSize: 14, color: '#65676b', whiteSpace: 'nowrap' as const }}>{t('field_username_url_prefix')}</span>
            </div>
            <input
              value={value}
              onChange={e => setValue(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="your-username"
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter' && available) handleClaim() }}
              style={{ flex: 1, padding: '12px 14px', border: 'none', outline: 'none', fontSize: 16, fontWeight: 600, color: '#050505', background: 'transparent', minWidth: 0 }}
            />
            {checking && <div style={{ padding: '0 14px', fontSize: 12, color: '#65676b' }}>…</div>}
            {!checking && available === true && <div style={{ padding: '0 14px' }}><Check size={18} color="#10b981" /></div>}
            {!checking && available === false && <div style={{ padding: '0 14px', fontSize: 20 }}>✕</div>}
          </div>
        </div>

        <div style={{ fontSize: 13, minHeight: 20, marginBottom: 20, color: available === true ? '#10b981' : available === false ? '#ef4444' : '#65676b' }}>
          {slug.length >= 3 && !checking && available === true && `✓ @${slug} is available`}
          {slug.length >= 3 && !checking && available === false && `✗ @${slug} is already taken`}
          {slug.length >= 3 && checking && 'Checking availability…'}
          {slug.length > 0 && slug.length < 3 && 'Username must be at least 3 characters'}
          {error && <span style={{ color: '#ef4444' }}>{error}</span>}
        </div>

        <button
          onClick={handleClaim}
          disabled={!available || saving || slug.length < 3}
          style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: available ? '#3b82f6' : '#e4e6eb', color: available ? '#fff' : '#94a3b8', fontSize: 16, fontWeight: 800, cursor: available ? 'pointer' : 'default', transition: 'background 0.15s' }}
          onMouseEnter={e => { if (available) e.currentTarget.style.background = '#2563eb' }}
          onMouseLeave={e => { if (available) e.currentTarget.style.background = '#3b82f6' }}
        >
          {saving ? t('btn_continuing') : `${t('btn_continue')} @${slug || 'username'}`}
        </button>

        <div style={{ marginTop: 16, fontSize: 12, color: '#bcc0c4', textAlign: 'center' as const }}>
          You can change this later from your profile settings.
        </div>
      </div>
    </div>
  )
}
