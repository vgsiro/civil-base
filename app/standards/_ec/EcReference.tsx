'use client'
import { useState, useRef, useCallback } from 'react'
import { Table, TR } from '../_lib/ui'
import { TH, TD, TDL } from '../_lib/ui-styles'
import WindCalc from '../_wind/WindCalc'
import WindTables from '../_wind/WindTables'

const TOOL_GROUPS = [
  {
    part: 'EN 1991-1-4',
    desc: 'Wind actions',
    cards: [
      {
        id: 'wind',
        label: 'Wind Calc Tools',
        desc: 'q_p, walls, roofs, canopies, cylinders, signboards',
        emoji: '💨',
        accent: '#0ea5e9',
        gradient: 'linear-gradient(135deg, #0369a1, #0ea5e9)',
      },
    ],
  },
]

const WIND_NAV = [
  { id: 'wind',       label: 'Wind Calc Tools', emoji: '💨' },
  { id: 'wind_table', label: 'EC1 Parts Table', emoji: '📋' },
]

const EC1_PARTS = [
  { code: 'EN 1991-1-1', label: 'Densities, self-weight, imposed loads for buildings' },
  { code: 'EN 1991-1-2', label: 'Actions on structures exposed to fire' },
  { code: 'EN 1991-1-3', label: 'Snow loads' },
  { code: 'EN 1991-1-4', label: 'Wind actions' },
  { code: 'EN 1991-1-5', label: 'Thermal actions' },
  { code: 'EN 1991-1-6', label: 'Actions during execution' },
  { code: 'EN 1991-1-7', label: 'Accidental actions' },
  { code: 'EN 1991-2',   label: 'Traffic loads on bridges' },
  { code: 'EN 1991-3',   label: 'Actions induced by cranes and machinery' },
  { code: 'EN 1991-4',   label: 'Silos and tanks' },
]

const SIDENAV_MIN = 48
const SIDENAV_MAX = 320
const SIDENAV_DEFAULT = 190

function SideNav({ items, active, onSelect }: {
  items: { id: string; label: string; emoji: string }[]
  active: string
  onSelect: (id: string) => void
}) {
  const [width, setWidth] = useState(SIDENAV_DEFAULT)
  const [collapsed, setCollapsed] = useState(false)
  const dragging = useRef(false)
  const startX = useRef(0)
  const startW = useRef(0)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    dragging.current = true
    startX.current = e.clientX
    startW.current = collapsed ? 0 : width
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return
      const next = startW.current + ev.clientX - startX.current
      if (next > SIDENAV_MIN) {
        setCollapsed(false)
        setWidth(Math.min(SIDENAV_MAX, next))
      } else {
        setCollapsed(true)
      }
    }
    const onUp = () => {
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [collapsed, width])

  const panelW = collapsed ? SIDENAV_MIN : width

  return (
    <div style={{ display: 'flex', flexShrink: 0, height: '100%' }}>
      <div style={{ width: panelW, background: '#fff', overflowY: collapsed ? 'hidden' : 'auto', overflowX: 'hidden', transition: collapsed ? 'width 0.18s' : 'none', display: 'flex', flexDirection: 'column' }}>
        {collapsed
          ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 8, gap: 2 }}>
              {items.map(s => (
                <button key={s.id} onClick={() => onSelect(s.id)} title={s.label}
                  style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: active === s.id ? '#eff6ff' : 'transparent', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 16 }}>
                  {s.emoji}
                </button>
              ))}
            </div>
          )
          : items.map(s => (
            <button key={s.id} onClick={() => onSelect(s.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '11px 14px', background: active === s.id ? '#eff6ff' : 'transparent',
                border: 'none', borderLeft: `3px solid ${active === s.id ? '#3b82f6' : 'transparent'}`,
                borderBottom: '1px solid #f1f5f9', cursor: 'pointer', textAlign: 'left', flexShrink: 0,
              }}
              onMouseEnter={e => { if (active !== s.id) e.currentTarget.style.background = '#f8fafc' }}
              onMouseLeave={e => { if (active !== s.id) e.currentTarget.style.background = 'transparent' }}>
              <span style={{ fontSize: 15 }}>{s.emoji}</span>
              <span style={{ fontSize: 12, fontWeight: active === s.id ? 700 : 500, color: active === s.id ? '#1d4ed8' : '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.label}</span>
            </button>
          ))
        }
      </div>
      {/* drag handle + collapse toggle */}
      <div
        onMouseDown={onMouseDown}
        style={{ width: 4, flexShrink: 0, background: '#e2e8f0', cursor: 'col-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
        onMouseEnter={e => { if (!collapsed) e.currentTarget.style.background = '#93c5fd' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#e2e8f0' }}>
        <button
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expand panel' : 'Collapse panel'}
          style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 14, height: 24, background: '#cbd5e1', border: 'none', borderRadius: 3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#1e293b', padding: 0, zIndex: 1 }}>
          {collapsed ? '›' : '‹'}
        </button>
      </div>
    </div>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick}
      style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0', marginBottom: -8 }}>
      ‹ Back to Reference Tools
    </button>
  )
}

function EC1PartsTable() {
  return (
    <>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>EN 1991 — Parts overview</div>
        <div style={{ fontSize: 12, color: '#1e293b', marginBottom: 12 }}>Scope of Eurocode 1</div>
      </div>
      <Table>
        <thead><tr>
          <th style={{ ...TH, textAlign: 'left', minWidth: 140 }}>Standard</th>
          <th style={{ ...TH, textAlign: 'left' }}>Title</th>
        </tr></thead>
        <tbody>
          {EC1_PARTS.map((p, i) => (
            <TR key={p.code} stripe={i % 2 !== 0}>
              <td style={{ ...TD, fontWeight: 700, color: '#3b82f6', whiteSpace: 'nowrap' as const }}>{p.code}</td>
              <td style={TDL}>{p.label}</td>
            </TR>
          ))}
        </tbody>
      </Table>
    </>
  )
}


export default function EcReference({ section, calc, onNavChange }: {
  section: string; calc: string; onNavChange: (key: string, val: string) => void
}) {
  const activeSection = section || 'tools'
  const setSection = (id: string) => onNavChange('section', id)

  const isTools = activeSection === 'tools'
  const isWind  = activeSection === 'wind' || activeSection === 'wind_table'

  // ── Card grid — no side panel ─────────────────────────────────────────────
  if (isTools) {
    return (
      <div style={{ overflowY: 'auto', height: '100%', padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>EC1 Reference Tools</div>
          <div style={{ fontSize: 12, color: '#1e293b' }}>Interactive calculators and reference tables · EN 1991</div>
        </div>
        {TOOL_GROUPS.map(group => (
          <div key={group.part}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', background: '#eff6ff', padding: '2px 8px', borderRadius: 6, letterSpacing: '0.04em' }}>{group.part}</span>
              <span style={{ fontSize: 12, color: '#1e293b' }}>{group.desc}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14, maxWidth: 740 }}>
              {group.cards.map(card => (
                <button key={card.id} onClick={() => setSection(card.id)}
                  style={{
                    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
                    overflow: 'hidden', cursor: 'pointer', textAlign: 'left', padding: 0,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'box-shadow 0.15s, transform 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 6px 20px ${card.accent}30`; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'none' }}>
                  <div style={{ height: 68, background: card.gradient, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
                    <span style={{ fontSize: 24 }}>{card.emoji}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>{group.part}</span>
                  </div>
                  <div style={{ padding: '11px 14px 14px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: card.accent, marginBottom: 4 }}>{card.label}</div>
                    <div style={{ fontSize: 11, color: '#1e293b', lineHeight: 1.5 }}>{card.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ── Wind tool group ───────────────────────────────────────────────────────
  if (isWind) {
    return (
      <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
        <SideNav items={WIND_NAV} active={activeSection} onSelect={setSection} />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 20px 8px', flexShrink: 0 }}>
            <BackButton onClick={() => setSection('tools')} />
          </div>
          {activeSection === 'wind_table'
            ? <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}><WindTables /></div>
            : <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                {activeSection === 'wind' && <WindCalc calc={calc} onNavChange={onNavChange} />}
              </div>
          }
        </div>
      </div>
    )
  }

  return null
}

