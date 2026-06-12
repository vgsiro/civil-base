'use client'
import { useState, useRef, useCallback } from 'react'
import { TablesList, TableEntry } from './TablesList'
import PageDiscussion from '../../../../_components/home/discussion/PageDiscussion'

// ── Types ─────────────────────────────────────────────────────────────────────

export type NaItem = {
  id:      string
  number:  string        // e.g. "Table NA.1", "Cl. NA.2.1"
  name:    string        // short description
  content: React.ReactNode
}

export type NaSection = {
  id:      string
  code:    string        // e.g. "SS EN 1991-1-4"
  label:   string        // short description
  items:   NaItem[]
}

export type NaCountry = {
  id:      string
  name:    string        // e.g. "Singapore"
  prefix:  string        // e.g. "SS EN"
  sections: NaSection[]
}

// ── ResizablePanel ────────────────────────────────────────────────────────────

const PANEL_MIN = 40
const PANEL_MAX = 320

function ResizablePanel({
  defaultWidth, maxWidth = PANEL_MAX, accentHover = '#a5b4fc', children,
}: {
  defaultWidth: number; maxWidth?: number
  accentHover?: string; children: (collapsed: boolean) => React.ReactNode
}) {
  const [width, setWidth]         = useState(defaultWidth)
  const [collapsed, setCollapsed] = useState(false)
  const dragging = useRef(false)
  const startX   = useRef(0)
  const startW   = useRef(0)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true
    startX.current   = e.clientX
    startW.current   = collapsed ? 0 : width
    document.body.style.cursor     = 'col-resize'
    document.body.style.userSelect = 'none'
    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return
      const next = startW.current + ev.clientX - startX.current
      if (next > PANEL_MIN) { setCollapsed(false); setWidth(Math.min(maxWidth, next)) }
      else setCollapsed(true)
    }
    const onUp = () => {
      dragging.current = false
      document.body.style.cursor = document.body.style.userSelect = ''
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [collapsed, maxWidth, width])

  const panelW = collapsed ? PANEL_MIN : width

  return (
    <div style={{ display: 'flex', flexShrink: 0, height: '100%' }}>
      <div style={{ width: panelW, background: '#fff', overflowY: collapsed ? 'hidden' : 'auto', overflowX: 'hidden', transition: collapsed ? 'width 0.18s' : 'none', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {children(collapsed)}
      </div>
      <div onMouseDown={onMouseDown}
        style={{ width: 4, flexShrink: 0, background: '#e2e8f0', cursor: 'col-resize', position: 'relative' }}
        onMouseEnter={e => { if (!collapsed) e.currentTarget.style.background = accentHover }}
        onMouseLeave={e => { e.currentTarget.style.background = '#e2e8f0' }}>
        <button onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expand' : 'Collapse'}
          style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 14, height: 24, background: '#cbd5e1', border: 'none', borderRadius: 3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#1e293b', padding: 0, zIndex: 1 }}>
          {collapsed ? '›' : '‹'}
        </button>
      </div>
    </div>
  )
}

// ── NaPanel ───────────────────────────────────────────────────────────────────

export default function NaPanel({
  countries,
  accentColor = '#6366f1',
  accentBg    = '#eef2ff',
  accentHover = '#a5b4fc',
  section,
  pageKey,
  onNavChange,
}: {
  countries:    NaCountry[]
  accentColor?: string
  accentBg?:   string
  accentHover?: string
  section:      string
  pageKey?:     string
  onNavChange:  (key: string, val: string) => void
}) {
  // Derive active country + section + item from URL
  const findActive = () => {
    for (const c of countries) {
      for (const s of c.sections) {
        if (s.id === section) return { countryId: c.id, sectionId: s.id, itemId: s.items[0]?.id ?? '' }
        const item = s.items.find(i => i.id === section)
        if (item) return { countryId: c.id, sectionId: s.id, itemId: item.id }
      }
    }
    const fc = countries[0]
    const fs = fc?.sections[0]
    return { countryId: fc?.id ?? '', sectionId: fs?.id ?? '', itemId: fs?.items[0]?.id ?? '' }
  }

  const { countryId: initCountry, sectionId: initSection, itemId: initItem } = findActive()
  const [selectedCountry, setSelectedCountry] = useState(initCountry)
  const [selectedSection, setSelectedSection] = useState(initSection)
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set([initCountry]))

  const country  = countries.find(c => c.id === selectedCountry)
  const secEntry = country?.sections.find(s => s.id === selectedSection)
  const items    = secEntry?.items ?? []

  // active item id comes from URL (section param) if it matches, else first item
  const activeItemId = items.find(i => i.id === section)?.id ?? initItem

  function toggleCountry(id: string) {
    setExpandedCountries(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectSection(countryId: string, sectionId: string) {
    setSelectedCountry(countryId)
    setSelectedSection(sectionId)
    if (!expandedCountries.has(countryId)) {
      setExpandedCountries(prev => new Set([...prev, countryId]))
    }
    const firstItem = countries.find(c => c.id === countryId)?.sections.find(s => s.id === sectionId)?.items[0]?.id
    if (firstItem) onNavChange('section', firstItem)
  }

  function selectItem(itemId: string) {
    onNavChange('section', itemId)
  }

  const activeContent = items.find(i => i.id === activeItemId)?.content

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ── Panel 1: Countries ────────────────────────────────────────────────── */}
      <ResizablePanel defaultWidth={200} maxWidth={280} accentHover={accentHover}>
        {collapsed => collapsed
          ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 8, gap: 2 }}>
              {countries.map(c => (
                <button key={c.id} onClick={() => selectSection(c.id, c.sections[0]?.id ?? '')}
                  title={c.name}
                  style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 9, fontWeight: 700, background: selectedCountry === c.id ? accentBg : 'transparent', color: selectedCountry === c.id ? accentColor : '#64748b' }}>
                  {c.prefix.replace(' EN', '')}
                </button>
              ))}
            </div>
          )
          : (
            <>
              <div style={{ padding: '10px 12px 6px', fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
                National Annexes
              </div>
              {countries.map(c => {
                const isExpanded   = expandedCountries.has(c.id)
                const isActiveCtry = selectedCountry === c.id
                return (
                  <div key={c.id}>
                    <button onClick={() => toggleCountry(c.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '9px 12px', background: isActiveCtry ? accentBg : 'transparent', border: 'none', borderLeft: `3px solid ${isActiveCtry ? accentColor : 'transparent'}`, borderBottom: '1px solid #f1f5f9', cursor: 'pointer', textAlign: 'left', flexShrink: 0 }}
                      onMouseEnter={e => { if (!isActiveCtry) e.currentTarget.style.background = '#f8fafc' }}
                      onMouseLeave={e => { if (!isActiveCtry) e.currentTarget.style.background = 'transparent' }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
                        style={{ flexShrink: 0, transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', color: isActiveCtry ? accentColor : '#94a3b8' }}>
                        <path d="M3 2L7 5L3 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: isActiveCtry ? accentColor : '#1e293b' }}>{c.name}</div>
                        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>{c.prefix}</div>
                      </div>
                    </button>
                    {isExpanded && c.sections.map(s => {
                      const isActiveSec = selectedSection === s.id && isActiveCtry
                      return (
                        <button key={s.id} onClick={() => selectSection(c.id, s.id)}
                          style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%', padding: '7px 12px 7px 24px', background: isActiveSec ? accentBg : 'transparent', border: 'none', borderLeft: `3px solid ${isActiveSec ? accentColor : 'transparent'}`, borderBottom: '1px solid #f8fafc', cursor: 'pointer', textAlign: 'left', flexShrink: 0 }}
                          onMouseEnter={e => { if (!isActiveSec) e.currentTarget.style.background = '#f8fafc' }}
                          onMouseLeave={e => { if (!isActiveSec) e.currentTarget.style.background = 'transparent' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: isActiveSec ? accentColor : '#3b82f6' }}>{s.code}</span>
                          <span style={{ fontSize: 10, color: isActiveSec ? accentColor : '#64748b', marginTop: 1, lineHeight: 1.3 }}>{s.label}</span>
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </>
          )
        }
      </ResizablePanel>

      {/* ── Panel 2: Items within selected section — shared TablesList ─────────── */}
      <ResizablePanel defaultWidth={210} maxWidth={320} accentHover={accentHover}>
        {collapsed => {
          // Build allTables across all countries/sections for cross-search
          const allTables: TableEntry[] = countries.flatMap(c =>
            c.sections.flatMap(s =>
              s.items.map(i => ({ id: i.id, number: i.number, name: i.name, partId: s.id, partCode: s.code }))
            )
          )
          const visibleTables: TableEntry[] = items.map(i => ({
            id: i.id, number: i.number, name: i.name,
            partId: selectedSection, partCode: secEntry?.code ?? '',
          }))
          return (
            <TablesList
              allTables={allTables} visibleTables={visibleTables}
              activeId={activeItemId} collapsed={collapsed}
              accentColor={accentColor} accentBg={accentBg} accentDark={accentColor}
              onSelect={(itemId, sectionId) => {
                if (sectionId) {
                  // find which country owns this section
                  for (const c of countries) {
                    const s = c.sections.find(s => s.id === sectionId)
                    if (s) { selectSection(c.id, sectionId); break }
                  }
                }
                selectItem(itemId)
              }}
            />
          )
        }}
      </ResizablePanel>

      {/* ── Main content ──────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
        {activeContent ?? (
          <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🏛️</div>
            <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>National Annex</div>
            <div>Content coming soon.</div>
          </div>
        )}
        {pageKey && <PageDiscussion pageKey={pageKey} />}
      </div>

    </div>
  )
}
