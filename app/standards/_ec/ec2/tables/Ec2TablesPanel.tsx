'use client'
import { useState, useRef, useCallback } from 'react'
import { ConcretePropertiesTable, AnchorageLapTable, ReinforcementQuantityTable } from './Ec2Tables'

// ── Data: parts → tables ──────────────────────────────────────────────────────

const PARTS: { id: string; code: string; label: string }[] = [
  { id: 'en1992-1-1', code: 'EN 1992-1-1', label: 'General rules & buildings' },
  { id: 'en1992-1-2', code: 'EN 1992-1-2', label: 'Structural fire design' },
  { id: 'en1992-2',   code: 'EN 1992-2',   label: 'Concrete bridges' },
  { id: 'en1992-3',   code: 'EN 1992-3',   label: 'Liquid retaining structures' },
]

interface TableEntry { id: string; number: string; name: string }

const TABLES_BY_PART: Record<string, TableEntry[]> = {
  'en1992-1-1': [
    { id: 'concrete_props', number: 'Table 3.1', name: 'Concrete Design Properties' },
    { id: 'anchorage',      number: 'Table 8.2', name: 'Anchorage & Lap Lengths' },
    { id: 'rebar_qty',      number: 'Table A',   name: 'Reinforcement Quantity' },
  ],
  'en1992-1-2': [],
  'en1992-2':   [],
  'en1992-3':   [],
}

const DEFAULT_PART  = 'en1992-1-1'
const DEFAULT_TABLE = 'concrete_props'

// ── Resizable collapsible panel ───────────────────────────────────────────────

const ACCENT      = '#10b981'
const ACCENT_DARK = '#065f46'
const PANEL_MIN   = 40
const PANEL_MAX   = 320

function ResizablePanel({
  defaultWidth, minWidth = PANEL_MIN, maxWidth = PANEL_MAX,
  accentHover = '#6ee7b7', children,
}: {
  defaultWidth: number; minWidth?: number; maxWidth?: number
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
      if (next > minWidth) { setCollapsed(false); setWidth(Math.min(maxWidth, next)) }
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
  }, [collapsed, minWidth, maxWidth, width])

  const panelW = collapsed ? minWidth : width

  return (
    <div style={{ display: 'flex', flexShrink: 0, height: '100%' }}>
      <div style={{ width: panelW, background: '#fff', overflowY: collapsed ? 'hidden' : 'auto', overflowX: 'hidden', transition: collapsed ? 'width 0.18s' : 'none', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {children(collapsed)}
      </div>
      {/* drag handle */}
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

// ── Main panel ────────────────────────────────────────────────────────────────

export default function Ec2TablesPanel({ section, onNavChange }: {
  section: string
  onNavChange: (key: string, val: string) => void
}) {
  // Derive active part from the active table id
  const activePart = PARTS.find(p =>
    TABLES_BY_PART[p.id].some(t => t.id === section)
  )?.id ?? DEFAULT_PART

  const [selectedPart, setSelectedPart] = useState(activePart)

  const tablesForPart = TABLES_BY_PART[selectedPart] ?? []

  // Active table: must belong to selected part; else default to first in part
  const allIds = tablesForPart.map(t => t.id)
  const activeTable = allIds.includes(section) ? section : (allIds[0] ?? DEFAULT_TABLE)

  function selectPart(partId: string) {
    setSelectedPart(partId)
    const first = TABLES_BY_PART[partId]?.[0]?.id
    if (first) onNavChange('section', first)
  }

  function selectTable(tableId: string) {
    onNavChange('section', tableId)
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ── Panel 1: EN 1992 parts ─────────────────────────────────────────── */}
      <ResizablePanel defaultWidth={170} maxWidth={280} accentHover="#6ee7b7">
        {collapsed => collapsed
          ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 8, gap: 2 }}>
              {PARTS.map(p => {
                const empty = (TABLES_BY_PART[p.id] ?? []).length === 0
                return (
                  <button key={p.id} onClick={() => !empty && selectPart(p.id)} title={p.code}
                    style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: 6, cursor: empty ? 'not-allowed' : 'pointer', fontSize: 9, fontWeight: 700, opacity: empty ? 0.35 : 1, background: selectedPart === p.id ? '#f0fdf4' : 'transparent', color: selectedPart === p.id ? ACCENT_DARK : '#64748b' }}>
                    {p.code.replace('EN 1992-', '')}
                  </button>
                )
              })}
            </div>
          )
          : (
            <>
              <div style={{ padding: '10px 12px 6px', fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
                EN 1992 Parts
              </div>
              {PARTS.map(p => {
                const empty = (TABLES_BY_PART[p.id] ?? []).length === 0
                return (
                  <button key={p.id} onClick={() => !empty && selectPart(p.id)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%', padding: '9px 12px', opacity: empty ? 0.35 : 1, background: selectedPart === p.id ? '#f0fdf4' : 'transparent', border: 'none', borderLeft: `3px solid ${selectedPart === p.id ? ACCENT : 'transparent'}`, borderBottom: '1px solid #f1f5f9', cursor: empty ? 'not-allowed' : 'pointer', textAlign: 'left', flexShrink: 0 }}
                    onMouseEnter={e => { if (selectedPart !== p.id && !empty) e.currentTarget.style.background = '#f8fafc' }}
                    onMouseLeave={e => { if (selectedPart !== p.id) e.currentTarget.style.background = 'transparent' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: selectedPart === p.id ? ACCENT_DARK : '#1e293b' }}>{p.code}</span>
                    <span style={{ fontSize: 10, color: '#94a3b8', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{p.label}</span>
                  </button>
                )
              })}
            </>
          )
        }
      </ResizablePanel>

      {/* ── Panel 2: Tables in selected part ──────────────────────────────── */}
      <ResizablePanel defaultWidth={200} maxWidth={300} accentHover="#6ee7b7">
        {collapsed => collapsed
          ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 8, gap: 2 }}>
              {tablesForPart.map(t => (
                <button key={t.id} onClick={() => selectTable(t.id)} title={`${t.number} ${t.name}`}
                  style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 9, fontWeight: 700, background: activeTable === t.id ? '#f0fdf4' : 'transparent', color: activeTable === t.id ? ACCENT_DARK : '#64748b' }}>
                  {t.number.replace('Table ', 'T')}
                </button>
              ))}
              {tablesForPart.length === 0 && (
                <span style={{ fontSize: 9, color: '#cbd5e1', paddingTop: 10 }}>—</span>
              )}
            </div>
          )
          : (
            <>
              <div style={{ padding: '10px 12px 6px', fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
                Tables
              </div>
              {tablesForPart.length === 0
                ? <div style={{ padding: '14px 12px', fontSize: 11, color: '#cbd5e1', fontStyle: 'italic' }}>No tables yet</div>
                : tablesForPart.map(t => (
                  <button key={t.id} onClick={() => selectTable(t.id)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%', padding: '9px 12px', background: activeTable === t.id ? '#f0fdf4' : 'transparent', border: 'none', borderLeft: `3px solid ${activeTable === t.id ? ACCENT : 'transparent'}`, borderBottom: '1px solid #f1f5f9', cursor: 'pointer', textAlign: 'left', flexShrink: 0 }}
                    onMouseEnter={e => { if (activeTable !== t.id) e.currentTarget.style.background = '#f8fafc' }}
                    onMouseLeave={e => { if (activeTable !== t.id) e.currentTarget.style.background = 'transparent' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: activeTable === t.id ? ACCENT_DARK : '#3b82f6' }}>{t.number}</span>
                    <span style={{ fontSize: 11, color: activeTable === t.id ? ACCENT_DARK : '#1e293b', marginTop: 1, whiteSpace: 'normal', lineHeight: 1.3 }}>{t.name}</span>
                  </button>
                ))
              }
            </>
          )
        }
      </ResizablePanel>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
        {activeTable === 'concrete_props' && <ConcretePropertiesTable />}
        {activeTable === 'anchorage'      && <AnchorageLapTable />}
        {activeTable === 'rebar_qty'      && <ReinforcementQuantityTable />}
        {tablesForPart.length === 0 && (
          <div style={{ color: '#94a3b8', fontSize: 13, fontStyle: 'italic', paddingTop: 20 }}>
            No tables available for this part yet.
          </div>
        )}
      </div>

    </div>
  )
}
