'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Search } from 'lucide-react'
import HomeNavBar from '../../_components/shared/HomeNavBar'
import { useTranslation } from '../../i18n/LanguageContext'

import { ToolGroup, CARD_W, CARD_IMG_H } from '../standards/_ec/_shared/tool-card-grid'

// ── All tools catalogue — add new tools here as they are built ────────────────
const ALL_TOOL_GROUPS: (ToolGroup & { tab: string; label: string; accentColor: string; accentBg: string })[] = [
  {
    tab: 'ec0',
    label: 'EC0 — Basis of Design',
    accentColor: '#6366f1',
    accentBg: '#eef2ff',
    part: 'EN 1990',
    desc: 'Basis of design — load combinations',
    cards: [
      {
        id: 'combo_gen',
        label: 'Combination Generator',
        desc: 'Generate EN 1990 ULS/SLS combinations · STAAD output',
        graphic: (
          <svg width="90" height="65" viewBox="0 0 80 55" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8"  y="8"  width="18" height="8" rx="1.5" fill="rgba(255,255,255,0.25)" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2"/>
            <text x="17" y="15" fontSize="6" fill="rgba(255,255,255,0.9)" fontWeight="700" textAnchor="middle">ULS</text>
            <line x1="26" y1="12" x2="36" y2="12" stroke="rgba(255,255,255,0.6)" strokeWidth="1" strokeDasharray="2 2"/>
            <rect x="36" y="8"  width="14" height="8" rx="1.5" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.6)" strokeWidth="1"/>
            <line x1="50" y1="12" x2="60" y2="12" stroke="rgba(255,255,255,0.6)" strokeWidth="1" strokeDasharray="2 2"/>
            <rect x="60" y="8"  width="14" height="8" rx="1.5" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.6)" strokeWidth="1"/>
            <rect x="8"  y="22" width="18" height="8" rx="1.5" fill="rgba(255,255,255,0.25)" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2"/>
            <text x="17" y="29" fontSize="6" fill="rgba(255,255,255,0.9)" fontWeight="700" textAnchor="middle">SLS</text>
            <line x1="26" y1="26" x2="36" y2="26" stroke="rgba(255,255,255,0.6)" strokeWidth="1" strokeDasharray="2 2"/>
            <rect x="36" y="22" width="14" height="8" rx="1.5" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.6)" strokeWidth="1"/>
            <line x1="50" y1="26" x2="60" y2="26" stroke="rgba(255,255,255,0.6)" strokeWidth="1" strokeDasharray="2 2"/>
            <rect x="60" y="22" width="14" height="8" rx="1.5" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.6)" strokeWidth="1"/>
            <line x1="40" y1="38" x2="40" y2="46" stroke="rgba(255,255,255,0.8)" strokeWidth="1.8" strokeLinecap="round"/>
            <polygon points="40,48 36,44 44,44" fill="rgba(255,255,255,0.8)"/>
          </svg>
        ),
        accent:   '#6366f1',
        gradient: 'linear-gradient(135deg, #3730a3, #6366f1)',
        ref:      'EN 1990',
      },
    ],
  },
  {
    tab: 'ec1',
    label: 'EC1 — Actions on Structures',
    accentColor: '#0ea5e9',
    accentBg: '#e0f2fe',
    part: 'EN 1991-1-4',
    desc: 'Wind actions',
    cards: [
      {
        id: 'wind',
        label: 'Wind Load Calculator',
        desc: 'q_p · walls · roofs · canopies · cylinders · signboards',
        graphic: (
          <svg width="90" height="65" viewBox="0 0 90 65" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="54" y="10" width="28" height="44" rx="2" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.85)" strokeWidth="2"/>
            <line x1="8" y1="21" x2="44" y2="21" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round"/>
            <polygon points="50,21 42,16 42,26" fill="rgba(255,255,255,0.9)"/>
            <line x1="8" y1="33" x2="44" y2="33" stroke="rgba(255,255,255,0.65)" strokeWidth="2" strokeLinecap="round"/>
            <polygon points="50,33 42,28 42,38" fill="rgba(255,255,255,0.65)"/>
            <line x1="8" y1="45" x2="44" y2="45" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round"/>
            <polygon points="50,45 42,40 42,50" fill="rgba(255,255,255,0.4)"/>
            <text x="68" y="36" fontSize="9" fill="rgba(255,255,255,0.9)" fontWeight="700" textAnchor="middle">q<tspan fontSize="7" dy="2">p</tspan></text>
          </svg>
        ),
        accent:   '#0ea5e9',
        gradient: 'linear-gradient(135deg, #0369a1, #0ea5e9)',
        ref:      'EN 1991-1-4',
      },
    ],
  },
  {
    tab: 'ec2',
    label: 'EC2 — Concrete Structures',
    accentColor: '#10b981',
    accentBg: '#ecfdf5',
    part: 'EN 1992-1-1',
    desc: 'Design of concrete structures — General rules',
    cards: [
      {
        id: 'rect_section',
        label: 'Rectangular RC Section Check',
        desc: 'ULS bending/axial · shear & torsion · SLS crack width',
        graphic: (
          <svg width="90" height="65" viewBox="0 0 60 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="4" width="52" height="36" rx="2" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.9)" strokeWidth="2"/>
            {[12, 21, 30, 39, 48].map(cx => <circle key={cx} cx={cx} cy="12" r="3.2" fill="rgba(255,255,255,0.9)" />)}
            {[12, 21, 30, 39, 48].map(cx => <circle key={cx} cx={cx} cy="32" r="3.2" fill="rgba(255,255,255,0.9)" />)}
            <line x1="6" y1="22" x2="54" y2="22" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeDasharray="4 3"/>
          </svg>
        ),
        accent:   '#10b981',
        gradient: 'linear-gradient(135deg, #047857, #10b981)',
        ref:      'EN 1992-1-1 §6.1',
      },
    ],
  },
  {
    tab: 'ec3',
    label: 'EC3 — Steel Structures',
    accentColor: '#8b5cf6',
    accentBg: '#f5f3ff',
    part: 'EN 1993-1-8',
    desc: 'Design of joints',
    cards: [
      {
        id: 'bolt_data',
        label: 'Bolt Design Data',
        desc: 'Strength classes, shear/tension/bearing resistance, edge distances',
        graphic: (
          <svg width="90" height="65" viewBox="0 0 90 65" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="38" y="10" width="14" height="45" rx="2" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5"/>
            <rect x="30" y="6" width="30" height="10" rx="2" fill="rgba(255,255,255,0.85)"/>
            <rect x="30" y="49" width="30" height="10" rx="2" fill="rgba(255,255,255,0.85)"/>
            <rect x="12" y="20" width="66" height="10" rx="1.5" fill="rgba(255,255,255,0.35)" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2"/>
            <rect x="12" y="35" width="66" height="10" rx="1.5" fill="rgba(255,255,255,0.35)" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2"/>
          </svg>
        ),
        accent:   '#8b5cf6',
        gradient: 'linear-gradient(135deg, #4c1d95, #8b5cf6)',
        ref:      'EN 1993-1-8 §3',
      },
    ],
  },
]

export default function ToolsPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [query, setQuery] = useState('')

  function handleSelect(tab: string, sectionId: string) {
    router.push(`/standards?tab=${tab}&sub=reference&section=${sectionId}`)
  }

  const q = query.trim().toLowerCase()
  const filteredGroups = ALL_TOOL_GROUPS.map(group => ({
    ...group,
    cards: group.cards.filter(card =>
      !q ||
      card.label.toLowerCase().includes(q) ||
      card.desc.toLowerCase().includes(q) ||
      group.part.toLowerCase().includes(q) ||
      group.label.toLowerCase().includes(q)
    ),
  })).filter(g => g.cards.length > 0)

  return (
    <div style={{ height: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%)', flexShrink: 0 }}>
        <HomeNavBar dark pageLabel="Design Tools">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BookOpen size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.1em' }}>{t('std_tools_label')}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>{t('std_tools_title')}</div>
            </div>
          </div>
        </HomeNavBar>
      </div>

      {/* Search bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '16px 32px', flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: 520 }}>
          <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search tools…"
            style={{ width: '100%', paddingLeft: 36, paddingRight: query ? 32 : 12, paddingTop: 9, paddingBottom: 9, fontSize: 13, border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none', background: '#f8fafc', color: '#1e293b', boxSizing: 'border-box', transition: 'border-color 0.15s' }}
            onFocus={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.background = '#fff' }}
            onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc' }}
          />
          {query && (
            <button onClick={() => setQuery('')}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 16, lineHeight: 1, padding: '0 2px' }}>
              ×
            </button>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 32px 0' }}>
        <div style={{ maxWidth: 1100, display: 'flex', flexDirection: 'column', gap: 40 }}>

          {filteredGroups.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: 80, color: '#94a3b8' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
              <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>No tools found</div>
              <div style={{ fontSize: 13 }}>Try a different search term</div>
            </div>
          ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 4, height: 18, borderRadius: 2, background: '#1d4ed8' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Eurocode</span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>EN 1990 · EN 1991 · EN 1992 · EN 1993</span>
              {q && <span style={{ fontSize: 11, color: '#6366f1', marginLeft: 4 }}>— {filteredGroups.reduce((s, g) => s + g.cards.length, 0)} result{filteredGroups.reduce((s, g) => s + g.cards.length, 0) !== 1 ? 's' : ''}</span>}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
              {[...filteredGroups]
                .sort((a, b) => a.part.localeCompare(b.part))
                .flatMap(group => group.cards.map(card => ({ card, group })))
                .map(({ card, group }) => (
                  <button key={`${group.tab}-${card.id}`}
                    onClick={() => handleSelect(group.tab, card.id)}
                    style={{ width: CARD_W, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', textAlign: 'left', padding: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'box-shadow 0.15s, transform 0.15s', flexShrink: 0 }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 6px 20px ${card.accent}30`; e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'none' }}>
                    <div style={{ height: CARD_IMG_H, background: card.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                      {card.graphic}
                      <span style={{ position: 'absolute', top: 8, right: 10, fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
                        {card.ref}
                      </span>
                    </div>
                    <div style={{ padding: '11px 14px 14px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: group.accentColor, background: group.accentBg, display: 'inline-block', padding: '2px 8px', borderRadius: 6, letterSpacing: '0.04em', marginBottom: 6, marginLeft: -8 }}>
                        {group.part}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: card.accent, marginBottom: 4 }}>{card.label}</div>
                      <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>{card.desc}</div>
                    </div>
                  </button>
                ))}
            </div>
          </div>
          )}


        </div>
      </div>
    </div>
  )
}
