'use client'
import { useState } from 'react'
import { BookOpen, Search } from 'lucide-react'
import Link from 'next/link'
import HomeNavBar from '../../_components/shared/HomeNavBar'
import { useTranslation } from '../../i18n/LanguageContext'
import { ALL_TOOL_GROUPS, getAllFlatTools } from './_data/catalogue'

import { CARD_W, CARD_IMG_H } from '../standards/_ec/_shared/tool-card-grid'

export default function ToolsPage() {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()

  // Group cards by category label for display sections
  const allFlat = getAllFlatTools()
  const filtered = q
    ? allFlat.filter(({ card, group }) =>
        card.label.toLowerCase().includes(q) ||
        card.desc.toLowerCase().includes(q) ||
        group.part.toLowerCase().includes(q) ||
        group.label.toLowerCase().includes(q) ||
        group.category.label.toLowerCase().includes(q)
      )
    : allFlat

  // Preserve category order from ALL_TOOL_GROUPS
  const categoryOrder = [...new Map(
    ALL_TOOL_GROUPS.map(g => [g.category.label, g.category])
  ).entries()]

  const byCategory = categoryOrder
    .map(([label, cat]) => ({
      label,
      cat,
      items: filtered.filter(f => f.group.category.label === label),
    }))
    .filter(sec => sec.items.length > 0)

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

          {byCategory.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: 80, color: '#94a3b8' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
              <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>No tools found</div>
              <div style={{ fontSize: 13 }}>Try a different search term</div>
            </div>
          ) : (
            byCategory.map(({ label, cat, items }) => (
              <div key={label}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 4, height: 18, borderRadius: 2, background: cat.accentColor }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{label}</span>
                  {q && <span style={{ fontSize: 11, color: cat.accentColor, marginLeft: 4 }}>— {items.length} result{items.length !== 1 ? 's' : ''}</span>}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                  {items.map(({ key, href, card, group }) => (
                    <Link key={key} href={href}
                      style={{ width: CARD_W, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', textAlign: 'left', padding: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'box-shadow 0.15s, transform 0.15s', flexShrink: 0, textDecoration: 'none', display: 'block' }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 6px 20px ${card.accent}30`; e.currentTarget.style.transform = 'translateY(-2px)' }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'none' }}>
                      <div style={{ height: CARD_IMG_H, background: card.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                        {card.graphic}
                        <span style={{ position: 'absolute', top: 8, right: 10, fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
                          {card.ref}
                        </span>
                      </div>
                      <div style={{ padding: '11px 14px 14px' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: cat.accentColor, background: cat.accentBg, display: 'inline-block', padding: '2px 8px', borderRadius: 6, letterSpacing: '0.04em', marginBottom: 6, marginLeft: -8 }}>
                          {group.part}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: card.accent, marginBottom: 4 }}>{card.label}</div>
                        <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>{card.desc}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))
          )}

        </div>
      </div>
    </div>
  )
}
