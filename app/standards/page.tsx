'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BookOpen } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useTranslation } from '../i18n/LanguageContext'
import EcReference from './_ec/EcReference'
import TcvnReference from './_tcvn/TcvnReference'
import PdfLibrary from './_pdf/PdfLibrary'
import EcOverview from './_ec/EcOverview'
import Ec0Overview from './_ec/ec0/overview/Ec0Overview'
import Ec0Reference from './_ec/Ec0Reference'
import Ec2Overview from './_ec/ec2/overview/Ec2Overview'
import Ec2Reference from './_ec/Ec2Reference'
import Ec0TablesPanel from './_ec/ec0/tables/Ec0TablesPanel'
import Ec1TablesPanel from './_ec/ec1/tables/Ec1TablesPanel'
import Ec2TablesPanel from './_ec/ec2/tables/Ec2TablesPanel'
import Ec3Overview from './_ec/ec3/overview/Ec3Overview'

// ── Tab content ───────────────────────────────────────────────────────────────
function TabContent({ type, accentColor, isAdmin, subTab, section, calc, onNavChange, onNavTo }: {
  type: TabId; accentColor: string; isAdmin: boolean
  subTab: string; section: string; calc: string
  onNavChange: (key: string, val: string) => void
  onNavTo: (params: Record<string, string>) => void
}) {
  const { t } = useTranslation()

  const tabsMap: Record<TabId, { id: string; label: string; emoji: string }[]> = {
    ec0: [
      { id: 'overview',  label: 'Overview',        emoji: '📋' },
      { id: 'reference', label: 'Reference Tools',  emoji: '🔧' },
      { id: 'tables',    label: 'EC Tables',        emoji: '📊' },
      { id: 'standards', label: 'Standard PDFs',    emoji: '📄' },
    ],
    ec1: [
      { id: 'overview',  label: 'Overview',        emoji: '📋' },
      { id: 'reference', label: 'Reference Tools',  emoji: '🔧' },
      { id: 'tables',    label: 'EC Tables',        emoji: '📊' },
      { id: 'standards', label: 'Standard PDFs',    emoji: '📄' },
    ],
    ec2: [
      { id: 'overview',  label: 'Overview',       emoji: '📋' },
      { id: 'reference', label: 'Reference Tools', emoji: '🔧' },
      { id: 'tables',    label: 'EC Tables',       emoji: '📊' },
      { id: 'standards', label: 'Standard PDFs',   emoji: '📄' },
    ],
    ec3: [
      { id: 'overview',  label: 'Overview',        emoji: '📋' },
      { id: 'reference', label: 'Reference Tools',  emoji: '🔧' },
      { id: 'standards', label: 'Standard PDFs',    emoji: '📄' },
    ],
    tcvn: [
      { id: 'reference', label: t('std_subtab_ref_tcvn'),   emoji: '🔧' },
      { id: 'standards', label: t('std_subtab_pdfs_tcvn'),  emoji: '📄' },
    ],
    eurocode: [
      { id: 'overview',  label: 'Overview',        emoji: '📋' },
      { id: 'reference', label: 'Reference Tools',  emoji: '🔧' },
      { id: 'standards', label: 'Standard PDFs',    emoji: '📄' },
    ],
  }

  const tabs = tabsMap[type]

  // Map new tab ids to PdfLibrary type
  const pdfType: 'eurocode' | 'tcvn' = type === 'tcvn' ? 'tcvn' : 'eurocode'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 20px', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => onNavChange('sub', tab.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '11px 16px', fontSize: 13, fontWeight: subTab === tab.id ? 700 : 500, color: subTab === tab.id ? accentColor : '#1e293b', background: 'none', border: 'none', borderBottom: `2px solid ${subTab === tab.id ? accentColor : 'transparent'}`, cursor: 'pointer', marginBottom: -1 }}
            onMouseEnter={e => { if (subTab !== tab.id) e.currentTarget.style.color = '#1e293b' }}
            onMouseLeave={e => { if (subTab !== tab.id) e.currentTarget.style.color = '#1e293b' }}>
            <span>{tab.emoji}</span> {tab.label}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {subTab === 'overview' && (
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            {type === 'ec0'     && <Ec0Overview onNavTo={onNavTo} />}
            {type === 'ec1'     && <EcOverview onNavTo={onNavTo} />}
            {type === 'ec2'     && <Ec2Overview onNavTo={onNavTo} />}
            {type === 'ec3'     && <Ec3Overview onNavTo={onNavTo} />}
            {type === 'eurocode' && <EcOverview onNavTo={onNavTo} />}
          </div>
        )}
        {subTab === 'tables' && (
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            {type === 'ec0' && <Ec0TablesPanel section={section} onNavChange={onNavChange} />}
            {type === 'ec1' && <Ec1TablesPanel section={section} onNavChange={onNavChange} />}
            {type === 'ec2' && <Ec2TablesPanel section={section} onNavChange={onNavChange} />}
          </div>
        )}
        {subTab === 'standards' && <PdfLibrary type={pdfType} accentColor={accentColor} isAdmin={isAdmin} />}
        {subTab === 'reference' && (
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            {(type === 'ec0') && <Ec0Reference section={section} onNavChange={onNavChange} />}
            {(type === 'ec1' || type === 'eurocode') && <EcReference section={section} calc={calc} onNavChange={onNavChange} />}
            {type === 'ec2' && <Ec2Reference section={section} onNavChange={onNavChange} />}
            {type === 'ec3' && <div style={{ padding: 32, color: '#64748b', fontSize: 13 }}>EC3 reference tools coming soon.</div>}
            {type === 'tcvn' && <TcvnReference section={section} onNavChange={onNavChange} />}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
type TabId = 'ec0' | 'ec1' | 'ec2' | 'ec3' | 'eurocode' | 'tcvn'

function StandardsPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  const rawTab = searchParams.get('tab')
  const activeTab: TabId = (['ec0', 'ec1', 'ec2', 'ec3', 'tcvn', 'eurocode'] as TabId[]).includes(rawTab as TabId)
    ? (rawTab as TabId)
    : 'ec1'
  const subTab = searchParams.get('sub') ?? 'overview'
  const section = searchParams.get('section') ?? 'tools'
  const calc = searchParams.get('calc') ?? ''

  const onNavChange = useCallback((key: string, val: string) => {
    const p = new URLSearchParams(searchParams.toString())
    p.set(key, val)
    if (key === 'section' && val !== 'wind' && val !== 'wind_table') p.delete('calc')
    if (key === 'calc' && val === '') p.delete('calc')
    if (key === 'sub' && val === 'standards') { p.delete('section'); p.delete('calc') }
    if (key === 'sub' && val === 'reference') { p.set('section', 'tools'); p.delete('calc') }
    if (key === 'sub' && val === 'tables') {
      const curTab = p.get('tab') ?? 'ec1'
      p.set('section', curTab === 'ec0' ? 'psi_factors' : curTab === 'ec1' ? 't4-1' : curTab === 'ec2' ? 'concrete_props' : '')
      p.delete('calc')
    }
    if (key === 'sub' && val === 'overview')  { p.delete('section'); p.delete('calc') }
    const isCalcOpen = key === 'calc' && val !== ''
    if (isCalcOpen) router.push(`/standards?${p.toString()}`)
    else router.replace(`/standards?${p.toString()}`)
  }, [router, searchParams])

  const onNavTo = useCallback((params: Record<string, string>) => {
    const p = new URLSearchParams(searchParams.toString())
    Object.entries(params).forEach(([k, v]) => p.set(k, v))
    p.delete('calc')
    router.replace(`/standards?${p.toString()}`)
  }, [router, searchParams])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user
      setIsLoggedIn(!!user)
      setIsAdmin(user?.email === 'tranvuong2832@gmail.com')
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      const user = session?.user
      setIsLoggedIn(!!user)
      setIsAdmin(user?.email === 'tranvuong2832@gmail.com')
    })
    return () => subscription.unsubscribe()
  }, [])

  const TABS: { id: TabId; label: string; subtitle: string; accentColor: string; badge: string }[] = [
    { id: 'ec0',     label: 'EC0',     subtitle: 'EN 1990',         accentColor: '#6366f1', badge: 'EC0' },
    { id: 'ec1',     label: 'EC1',     subtitle: 'EN 1991',         accentColor: '#0ea5e9', badge: 'EC1' },
    { id: 'ec2',     label: 'EC2',     subtitle: 'EN 1992',         accentColor: '#10b981', badge: 'EC2' },
    { id: 'ec3',     label: 'EC3',     subtitle: 'EN 1993',         accentColor: '#8b5cf6', badge: 'EC3' },
    { id: 'tcvn',    label: 'TCVN',    subtitle: t('std_tab_tcvn_subtitle'), accentColor: '#f59e0b', badge: 'VN' },
  ]
  const tab = TABS.find(tb => tb.id === activeTab) ?? TABS[1]

  void isLoggedIn

  return (
    <div style={{ height: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%)', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <button onClick={() => router.push('/')} title={t('std_back')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 8, opacity: 0.85, flexShrink: 0 }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '0.85')}>
          <span style={{ fontSize: 20 }}>📚</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{t('std_back')}</span>
        </button>
        <span style={{ color: '#334155', fontSize: 16 }}>/</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #3b82f6, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <BookOpen size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#1e293b', letterSpacing: '0.1em' }}>{t('std_page_label')}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>{t('std_page_title')}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', flexWrap: 'wrap' as const }}>
          {TABS.map(tb => (
            <button key={tb.id} onClick={() => router.replace(`/standards?tab=${tb.id}`)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, border: `2px solid ${activeTab === tb.id ? tb.accentColor : 'transparent'}`, background: activeTab === tb.id ? `${tb.accentColor}22` : 'rgba(255,255,255,0.08)', color: activeTab === tb.id ? '#fff' : '#1e293b', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { if (activeTab !== tb.id) e.currentTarget.style.background = 'rgba(255,255,255,0.14)' }}
              onMouseLeave={e => { if (activeTab !== tb.id) e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize: 11, fontWeight: 900, color: activeTab === tb.id ? '#fff' : 'rgba(255,255,255,0.5)' }}>{tb.badge}</span>
              {tb.label}
              <span style={{ fontSize: 10, color: activeTab === tb.id ? `${tb.accentColor}cc` : '#1e293b' }}>{tb.subtitle}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <TabContent type={activeTab} accentColor={tab.accentColor} isAdmin={isAdmin} subTab={subTab} section={section} calc={calc} onNavChange={onNavChange} onNavTo={onNavTo} />
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
