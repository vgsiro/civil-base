'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BookOpen } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import { useTranslation } from '../../i18n/LanguageContext'
import HomeNavBar from '../../_components/shared/HomeNavBar'
import { derivePageKey } from '../../_lib/pageKey'
import Ec0Tab from './_tabs/Ec0Tab'
import Ec1Tab from './_tabs/Ec1Tab'
import Ec2Tab from './_tabs/Ec2Tab'
import Ec3Tab from './_tabs/Ec3Tab'
import TcvnTab from './_tabs/TcvnTab'
import EurocodeTab from './_tabs/EurocodeTab'

// ── Tab types — add EC4–EC9 here when ready ───────────────────────────────────
type TabId = 'ec0' | 'ec1' | 'ec2' | 'ec3' | 'eurocode' | 'tcvn'

type EcEntry = { id: TabId; badge: string; subtitle: string; accentColor: string }
const EC_LIST_BASE: Omit<EcEntry, 'subtitle'>[] = [
  { id: 'ec0', badge: 'EC0', accentColor: '#6366f1' },
  { id: 'ec1', badge: 'EC1', accentColor: '#0ea5e9' },
  { id: 'ec2', badge: 'EC2', accentColor: '#10b981' },
  { id: 'ec3', badge: 'EC3', accentColor: '#8b5cf6' },
]

// ── Eurocode dropdown ─────────────────────────────────────────────────────────
function EcDropdown({ activeTab, onSelect }: { activeTab: TabId; onSelect: (id: TabId) => void }) {
  const { t } = useTranslation()
  const EC_LIST: EcEntry[] = EC_LIST_BASE.map(e => ({
    ...e,
    subtitle: t((`std_${e.id}_subtitle`) as Parameters<typeof t>[0]),
  }))
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const activeEc = EC_LIST.find(e => e.id === activeTab)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
          border: `1.5px solid ${activeEc ? activeEc.accentColor : 'rgba(255,255,255,0.2)'}`,
          background: activeEc ? `${activeEc.accentColor}22` : 'rgba(255,255,255,0.08)',
          color: '#fff', cursor: 'pointer', transition: 'all 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = activeEc ? `${activeEc.accentColor}33` : 'rgba(255,255,255,0.14)' }}
        onMouseLeave={e => { e.currentTarget.style.background = activeEc ? `${activeEc.accentColor}22` : 'rgba(255,255,255,0.08)' }}
      >
        <span style={{ fontSize: 10, fontWeight: 800, opacity: 0.7, letterSpacing: '0.05em' }}>{t('std_ec_dropdown_btn')}</span>
        {activeEc && <span style={{ fontSize: 12, fontWeight: 900, color: activeEc.accentColor }}>{activeEc.badge}</span>}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.6, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0,
          background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10, overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          minWidth: 240, zIndex: 100,
        }}>
          <div style={{ padding: '6px 12px 4px', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {t('std_ec_dropdown_header')}
          </div>
          {EC_LIST.map(ec => {
            const isActive = activeTab === ec.id
            return (
              <button key={ec.id} onClick={() => { onSelect(ec.id); setOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                  padding: '9px 14px', background: isActive ? `${ec.accentColor}22` : 'transparent',
                  border: 'none', borderLeft: `3px solid ${isActive ? ec.accentColor : 'transparent'}`,
                  cursor: 'pointer', textAlign: 'left',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ fontSize: 11, fontWeight: 900, color: ec.accentColor, minWidth: 28 }}>{ec.badge}</span>
                <span style={{ fontSize: 12, color: isActive ? '#fff' : 'rgba(255,255,255,0.65)', fontWeight: isActive ? 600 : 400 }}>{ec.subtitle}</span>
                {isActive && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: 'auto', flexShrink: 0 }}>
                    <path d="M2 6L5 9L10 3" stroke={ec.accentColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Page inner ────────────────────────────────────────────────────────────────
function StandardsPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  useEffect(() => { document.title = 'Standards — CivilAxis' }, [])
  const [isAdmin, setIsAdmin] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  const rawTab = searchParams.get('tab')
  const activeTab: TabId = (['ec0', 'ec1', 'ec2', 'ec3', 'tcvn', 'eurocode'] as TabId[]).includes(rawTab as TabId)
    ? (rawTab as TabId)
    : 'ec1'
  const subTab  = searchParams.get('sub')     ?? 'overview'
  const section = searchParams.get('section') ?? 'tools'
  const calc    = searchParams.get('calc')    ?? ''

  const onNavChange = useCallback((key: string, val: string) => {
    const p = new URLSearchParams(searchParams.toString())
    p.set(key, val)
    if (key === 'section' && val !== 'wind' && val !== 'wind_table') p.delete('calc')
    if (key === 'calc'    && val === '')  p.delete('calc')
    if (key === 'sub' && val === 'standards') { p.delete('section'); p.delete('calc') }
    if (key === 'sub' && val === 'reference') { p.set('section', 'tools'); p.delete('calc') }
    if (key === 'sub' && val === 'tables') {
      const curTab = p.get('tab') ?? 'ec1'
      p.set('section', curTab === 'ec0' ? 'psi_factors' : curTab === 'ec1' ? 't4-1' : curTab === 'ec2' ? 'concrete_props' : curTab === 'ec3' ? 'bolt_dims' : '')
      p.delete('calc')
    }
    if (key === 'sub' && val === 'overview') { p.delete('section'); p.delete('calc') }
    if (key === 'sub' && val === 'na')       { p.delete('section'); p.delete('calc') }
    const isCalcOpen = key === 'calc' && val !== ''
    const isToolOpen = key === 'section' && val !== 'tools' && (searchParams.get('sub') ?? 'overview') === 'reference'
    if (isCalcOpen || isToolOpen) router.push(`/standards?${p.toString()}`)
    else router.replace(`/standards?${p.toString()}`)
  }, [router, searchParams])

  const onNavTo = useCallback((params: Record<string, string>) => {
    const p = new URLSearchParams(searchParams.toString())
    Object.entries(params).forEach(([k, v]) => p.set(k, v))
    p.delete('calc')
    router.replace(`/standards?${p.toString()}`)
  }, [router, searchParams])

  useEffect(() => {
    function applyUser(u: User | null) {
      setUser(u)
      setIsAdmin(u?.email === 'tranvuong2832@gmail.com')
    }
    supabase.auth.getSession().then(({ data: { session } }) => applyUser(session?.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => applyUser(session?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])

  const accentColor = EC_LIST_BASE.find(e => e.id === activeTab)?.accentColor ?? '#0ea5e9'
  const pageKey = derivePageKey('/standards', searchParams)

  const sharedProps = { isAdmin, subTab, section, pageKey, onNavChange, onNavTo }

  return (
    <div style={{ height: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%)', flexShrink: 0 }}>
        <HomeNavBar dark pageLabel="EC Standards"
          mobileSlot={<EcDropdown activeTab={activeTab} onSelect={id => router.replace(`/standards?tab=${id}`)} />}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #3b82f6, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BookOpen size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#1e293b', letterSpacing: '0.1em' }}>{t('std_page_label')}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>{t('std_page_title')}</div>
            </div>
          </div>
          <EcDropdown activeTab={activeTab} onSelect={id => router.replace(`/standards?tab=${id}`)} />
        </HomeNavBar>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {activeTab === 'ec0'      && <Ec0Tab      {...sharedProps} />}
        {activeTab === 'ec1'      && <Ec1Tab      {...sharedProps} calc={calc} />}
        {activeTab === 'ec2'      && <Ec2Tab      {...sharedProps} />}
        {activeTab === 'ec3'      && <Ec3Tab      {...sharedProps} />}
        {activeTab === 'tcvn'     && <TcvnTab     isAdmin={isAdmin} subTab={subTab} section={section} pageKey={pageKey} onNavChange={onNavChange} />}
        {activeTab === 'eurocode' && <EurocodeTab {...sharedProps} calc={calc} accentColor={accentColor} />}
      </div>
    </div>
  )
}

export default function StandardsPage() {
  return (
    <Suspense>
      <StandardsPageInner />
    </Suspense>
  )
}
