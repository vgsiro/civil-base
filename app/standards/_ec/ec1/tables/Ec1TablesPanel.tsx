'use client'
import { useState, useRef, useCallback } from 'react'
import {
  Table41, Table51,
  Table71, Table72, Table73a, Table73b, Table74a, Table74b, Table75,
  Table76, Table77, Table78, Table79, Table710, Table711, Table712,
  Table713, Table714, Table715, Table716,
  Table81, Table82,
} from '../../../_wind/WindTables'

// ── Data: parts → tables ──────────────────────────────────────────────────────

const PARTS: { id: string; code: string; label: string }[] = [
  { id: 'en1991-1-1', code: 'EN 1991-1-1', label: 'Densities, self-weight, imposed loads' },
  { id: 'en1991-1-2', code: 'EN 1991-1-2', label: 'Actions exposed to fire' },
  { id: 'en1991-1-3', code: 'EN 1991-1-3', label: 'Snow loads' },
  { id: 'en1991-1-4', code: 'EN 1991-1-4', label: 'Wind actions' },
  { id: 'en1991-1-5', code: 'EN 1991-1-5', label: 'Thermal actions' },
  { id: 'en1991-1-6', code: 'EN 1991-1-6', label: 'Actions during execution' },
  { id: 'en1991-1-7', code: 'EN 1991-1-7', label: 'Accidental actions' },
  { id: 'en1991-2',   code: 'EN 1991-2',   label: 'Traffic loads on bridges' },
  { id: 'en1991-3',   code: 'EN 1991-3',   label: 'Cranes and machinery' },
  { id: 'en1991-4',   code: 'EN 1991-4',   label: 'Silos and tanks' },
]

interface TableEntry { id: string; number: string; name: string }

const TABLES_BY_PART: Record<string, TableEntry[]> = {
  'en1991-1-1': [],
  'en1991-1-2': [],
  'en1991-1-3': [],
  'en1991-1-4': [
    { id: 't4-1',  number: 'Table 4.1',  name: 'Terrain categories and terrain parameters' },
    { id: 't5-1',  number: 'Table 5.1',  name: 'Calculation procedures for wind actions' },
    { id: 't7-1',  number: 'Table 7.1',  name: 'External pressure — vertical walls' },
    { id: 't7-2',  number: 'Table 7.2',  name: 'External pressure — flat roofs' },
    { id: 't7-3a', number: 'Table 7.3a', name: 'External pressure — monopitch roofs' },
    { id: 't7-3b', number: 'Table 7.3b', name: 'External pressure — monopitch roofs (θ=90°)' },
    { id: 't7-4a', number: 'Table 7.4a', name: 'External pressure — duopitch roofs (θ=0°)' },
    { id: 't7-4b', number: 'Table 7.4b', name: 'External pressure — duopitch roofs (θ=90°)' },
    { id: 't7-5',  number: 'Table 7.5',  name: 'External pressure — hipped roofs' },
    { id: 't7-6',  number: 'Table 7.6',  name: 'cp,net and cf — monopitch canopies' },
    { id: 't7-7',  number: 'Table 7.7',  name: 'cp,net and cf — duopitch canopies' },
    { id: 't7-8',  number: 'Table 7.8',  name: 'Reduction factors ψmc for multibay canopies' },
    { id: 't7-9',  number: 'Table 7.9',  name: 'Pressure coefficients — free-standing walls' },
    { id: 't7-10', number: 'Table 7.10', name: 'Friction coefficients cfr for surfaces' },
    { id: 't7-11', number: 'Table 7.11', name: 'Force coefficient cf,0 — polygonal sections' },
    { id: 't7-12', number: 'Table 7.12', name: 'Pressure distribution — circular cylinders' },
    { id: 't7-13', number: 'Table 7.13', name: 'Equivalent surface roughness k' },
    { id: 't7-14', number: 'Table 7.14', name: 'Factor κ for cylinders in row arrangement' },
    { id: 't7-15', number: 'Table 7.15', name: 'Force coefficients cf for flags' },
    { id: 't7-16', number: 'Table 7.16', name: 'Recommended values of λ for cylinders' },
    { id: 't8-1',  number: 'Table 8.1',  name: 'Depth to be used for Aref,x' },
    { id: 't8-2',  number: 'Table 8.2',  name: 'Force factor C for bridges' },
  ],
  'en1991-1-5': [],
  'en1991-1-6': [],
  'en1991-1-7': [],
  'en1991-2':   [],
  'en1991-3':   [],
  'en1991-4':   [],
}

const TABLE_COMPONENTS: Record<string, () => React.ReactElement> = {
  't4-1':  Table41,  't5-1':  Table51,
  't7-1':  Table71,  't7-2':  Table72,
  't7-3a': Table73a, 't7-3b': Table73b,
  't7-4a': Table74a, 't7-4b': Table74b,
  't7-5':  Table75,  't7-6':  Table76,
  't7-7':  Table77,  't7-8':  Table78,
  't7-9':  Table79,  't7-10': Table710,
  't7-11': Table711, 't7-12': Table712,
  't7-13': Table713, 't7-14': Table714,
  't7-15': Table715, 't7-16': Table716,
  't8-1':  Table81,  't8-2':  Table82,
}

const DEFAULT_PART  = 'en1991-1-4'
const DEFAULT_TABLE = 't4-1'

// ── Resizable collapsible panel ───────────────────────────────────────────────

const ACCENT      = '#0ea5e9'
const ACCENT_DARK = '#0369a1'
const PANEL_MIN   = 40
const PANEL_MAX   = 320

function ResizablePanel({
  defaultWidth, minWidth = PANEL_MIN, maxWidth = PANEL_MAX,
  accentHover = '#7dd3fc', children,
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

export default function Ec1TablesPanel({ section, onNavChange }: {
  section: string
  onNavChange: (key: string, val: string) => void
}) {
  const activePart = PARTS.find(p =>
    TABLES_BY_PART[p.id].some(t => t.id === section)
  )?.id ?? DEFAULT_PART

  const [selectedPart, setSelectedPart] = useState(activePart)

  const tablesForPart = TABLES_BY_PART[selectedPart] ?? []
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

  const ActiveComp = activeTable ? TABLE_COMPONENTS[activeTable] : null

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ── Panel 1: EN 1991 parts ─────────────────────────────────────────── */}
      <ResizablePanel defaultWidth={170} maxWidth={280} accentHover="#7dd3fc">
        {collapsed => collapsed
          ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 8, gap: 2 }}>
              {PARTS.map(p => {
                const empty = (TABLES_BY_PART[p.id] ?? []).length === 0
                return (
                  <button key={p.id} onClick={() => !empty && selectPart(p.id)} title={p.code}
                    style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: 6, cursor: empty ? 'not-allowed' : 'pointer', fontSize: 9, fontWeight: 700, opacity: empty ? 0.35 : 1, background: selectedPart === p.id ? '#f0f9ff' : 'transparent', color: selectedPart === p.id ? ACCENT_DARK : '#64748b' }}>
                    {p.code.replace('EN 1991-', '')}
                  </button>
                )
              })}
            </div>
          )
          : (
            <>
              <div style={{ padding: '10px 12px 6px', fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
                EN 1991 Parts
              </div>
              {PARTS.map(p => {
                const empty = (TABLES_BY_PART[p.id] ?? []).length === 0
                return (
                  <button key={p.id} onClick={() => !empty && selectPart(p.id)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%', padding: '9px 12px', opacity: empty ? 0.35 : 1, background: selectedPart === p.id ? '#f0f9ff' : 'transparent', border: 'none', borderLeft: `3px solid ${selectedPart === p.id ? ACCENT : 'transparent'}`, borderBottom: '1px solid #f1f5f9', cursor: empty ? 'not-allowed' : 'pointer', textAlign: 'left', flexShrink: 0 }}
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
      <ResizablePanel defaultWidth={210} maxWidth={320} accentHover="#7dd3fc">
        {collapsed => collapsed
          ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 8, gap: 2 }}>
              {tablesForPart.map(t => (
                <button key={t.id} onClick={() => selectTable(t.id)} title={`${t.number} ${t.name}`}
                  style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 9, fontWeight: 700, background: activeTable === t.id ? '#f0f9ff' : 'transparent', color: activeTable === t.id ? ACCENT_DARK : '#64748b' }}>
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
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%', padding: '9px 12px', background: activeTable === t.id ? '#f0f9ff' : 'transparent', border: 'none', borderLeft: `3px solid ${activeTable === t.id ? ACCENT : 'transparent'}`, borderBottom: '1px solid #f1f5f9', cursor: 'pointer', textAlign: 'left', flexShrink: 0 }}
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
        {ActiveComp
          ? <ActiveComp />
          : tablesForPart.length === 0
            ? (
              <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 40, textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
                <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>No tables yet</div>
                <div>No tables available for this part yet.</div>
              </div>
            )
            : null
        }
      </div>

    </div>
  )
}
