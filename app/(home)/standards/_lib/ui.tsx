'use client'
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from '@/app/i18n/LanguageContext'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { DETAILS_STEP, STEP_FORMULA, STEP_RESULT } from './ui-styles'

export { TH, TD, TDN, TDL } from './ui-styles'

export function TR({ children, stripe }: { children: React.ReactNode; stripe?: boolean }) {
  return (
    <tr style={{ background: stripe ? '#fafafa' : '#fff' }}
      onMouseEnter={e => (e.currentTarget.style.background = '#eff6ff')}
      onMouseLeave={e => (e.currentTarget.style.background = stripe ? '#fafafa' : '#fff')}>
      {children}
    </tr>
  )
}

// Converts plain-math notation to LaTeX for KaTeX rendering
export function toLatex(s: string): string {
  return s
    .replace(/\n/g, ' \\quad ')
    .replace(/²/g, '^{2}').replace(/³/g, '^{3}')
    .replace(/z₀,II/g, 'z_{0,II}').replace(/z₀/g, 'z_{0}')
    .replace(/z_min/g, 'z_{\\min}').replace(/z_max/g, 'z_{\\max}')
    .replace(/([A-Za-z\d\}])_([A-Za-z][A-Za-z\d,\.]+)/g, '$1_{$2}')
    .replace(/([A-Za-z\d\}])\^([A-Za-z\d\.]+)/g, '$1^{$2}')
    .replace(/φ/g, '\\varphi').replace(/ψ/g, '\\psi').replace(/ρ/g, '\\rho')
    .replace(/λ/g, '\\lambda').replace(/α/g, '\\alpha').replace(/ν/g, '\\nu')
    .replace(/·/g, ' {\\cdot} ').replace(/×/g, ' {\\times} ')
    .replace(/−/g, ' - ')
    .replace(/≤/g, ' {\\le} ').replace(/≥/g, ' {\\ge} ').replace(/±/g, ' {\\pm} ')
    .replace(/\bmax\b/g, '\\max').replace(/\bmin\b/g, '\\min').replace(/\bln\b/g, '\\ln')
    .replace(/½/g, '\\tfrac{1}{2}')
    .replace(/‰/g, '\\char"2030')
    .replace(/\bkPa\b/g, '\\,\\mathrm{kPa}').replace(/\bkN·m\b/g, '\\,\\mathrm{kN{\\cdot}m}')
    .replace(/\bkN\b/g, '\\,\\mathrm{kN}').replace(/m\/s\b/g, '\\,\\mathrm{m/s}')
    .replace(/kg\/m³/g, '\\,\\mathrm{kg/m^3}').replace(/m²\b/g, '\\,\\mathrm{m^2}')
}

export function Tex({ children, display }: { children: string; display?: boolean }) {
  const latex = toLatex(children)
  let html = ''
  try {
    html = katex.renderToString(latex, { throwOnError: false, displayMode: display ?? false })
  } catch {
    html = children
  }
  return <span dangerouslySetInnerHTML={{ __html: html }} style={{ verticalAlign: 'middle' }} />
}

// Renders a string with $...$ inline math segments as KaTeX
function renderSubscripts(text: string, keyBase: string) {
  const segs = text.split(/(\w+_[\w,]+)/)
  return segs.map((seg, j) => {
    const m = seg.match(/^(\w+)_([\w,]+)$/)
    if (m) return <span key={`${keyBase}-s${j}`}>{m[1]}<sub>{m[2]}</sub></span>
    return <span key={`${keyBase}-s${j}`}>{seg}</span>
  })
}

export function Sub({ children }: { children: string }) {
  return <>{renderSubscripts(children, 'sub')}</>
}

const PROSE_STYLE = { fontSize: 12, color: '#374151', lineHeight: 1.75, margin: '6px 0 10px' } as const
export function Prose({ children, bold }: { children: string; bold?: boolean }) {
  return (
    <p style={{ ...PROSE_STYLE, ...(bold ? { fontWeight: 600 } : {}) }}>
      <Sub>{children}</Sub>
    </p>
  )
}

function TexInline({ s }: { s: string }) {
  const parts = s.split(/(\$[^$]+\$)/)
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('$') && part.endsWith('$')) {
          const latex = part.slice(1, -1)
          let html = ''
          try { html = katex.renderToString(latex, { throwOnError: false, displayMode: false }) } catch { html = latex }
          return <span key={i} dangerouslySetInnerHTML={{ __html: html }} style={{ verticalAlign: 'middle' }} />
        }
        return <span key={i}>{renderSubscripts(part, String(i))}</span>
      })}
    </>
  )
}

// Tooltip — fixed-position popup to escape overflow clipping; supports $...$ inline LaTeX in text
export function Tooltip({ text }: { text: React.ReactNode }) {
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null)
  const ref = useRef<HTMLSpanElement>(null)

  const show = () => {
    if (ref.current) {
      const r = ref.current.getBoundingClientRect()
      setRect({ top: r.top + window.scrollY, left: r.left + window.scrollX, width: r.width })
    }
  }
  const hide = () => setRect(null)

  const MAX_W = 300
  const MARGIN = 8
  const anchorX = rect ? rect.left + rect.width / 2 : 0
  const clampedLeft = rect ? Math.min(Math.max(anchorX - MAX_W / 2, MARGIN), window.innerWidth - MAX_W - MARGIN) : 0
  const arrowLeft = rect ? Math.min(Math.max(anchorX - clampedLeft, 12), MAX_W - 12) : MAX_W / 2

  return (
    <span
      ref={ref}
      tabIndex={0}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 4, verticalAlign: 'middle' }}
    >
      <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#e0e7ef', color: '#3b82f6', fontSize: 9, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'default', userSelect: 'none', lineHeight: 1 }}>i</span>
      {rect && (
        <span style={{
          position: 'fixed',
          top: rect.top - 8,
          left: clampedLeft,
          transform: 'translateY(-100%)',
          marginTop: -6,
          zIndex: 9999,
          background: '#1e293b', color: '#f1f5f9', fontSize: 11, lineHeight: 1.6,
          borderRadius: 7, padding: '8px 11px', width: 'max-content', maxWidth: MAX_W, whiteSpace: 'normal',
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)', pointerEvents: 'none',
        }}>
          {typeof text === 'string' ? <TexInline s={text} /> : text}
          <span style={{ position: 'absolute', top: '100%', left: arrowLeft, transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #1e293b' }} />
        </span>
      )}
    </span>
  )
}

// Label row: text on left (wraps), tooltip icon pinned top-right — avoids icon ending up on its own line
export function LabelTip({ children, tip }: { children: React.ReactNode; tip: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'flex-start', gap: 2, marginBottom: 3 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: '#1e293b', lineHeight: 1.4, flex: 1 }}>{children}</span>
      <Tooltip text={tip} />
    </span>
  )
}

// TableRef — hover shows fixed-position mini table preview, click toggles inline full table
export function TableRef({ label, renderTable, note }: {
  label: string
  renderTable?: () => React.ReactNode
  note?: string
}) {
  const [expanded, setExpanded] = useState(false)
  const [popupRect, setPopupRect] = useState<{ top: number; left: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  const showPopup = (e: React.MouseEvent) => {
    if (!renderTable || expanded) return
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setPopupRect({ top: r.top + window.scrollY, left: r.left + window.scrollX })
  }
  const hidePopup = () => setPopupRect(null)

  return (
    <span style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', gap: 0 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <button
          ref={btnRef}
          onClick={() => renderTable && setExpanded(e => !e)}
          onMouseEnter={showPopup}
          onMouseLeave={hidePopup}
          style={{
            fontSize: 10, color: '#1d4ed8', background: '#eff6ff',
            border: '1px solid #bfdbfe', borderRadius: 4, padding: '1px 8px',
            cursor: renderTable ? 'pointer' : 'default',
            fontWeight: 600, letterSpacing: 0, whiteSpace: 'nowrap',
          }}
        >
          {label}{renderTable ? (expanded ? ' ▲' : ' ▾') : ''}
        </button>
        {note && <span style={{ fontSize: 10, color: '#1e293b' }}>{note}</span>}
      </span>
      {/* Hover preview — fixed position to escape any overflow:hidden parent */}
      {popupRect && !expanded && renderTable && (
        <span
          onMouseEnter={e => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: Math.max(8, popupRect.top - 8),
            left: popupRect.left,
            transform: 'translateY(-100%)',
            zIndex: 9999,
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
            padding: '10px 12px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            maxWidth: 640, maxHeight: '70vh', overflowX: 'auto', overflowY: 'auto',
            display: 'block', pointerEvents: 'none',
            fontSize: 11,
          }}
        >
          {renderTable()}
        </span>
      )}
      {/* Expanded inline table */}
      {expanded && renderTable && (
        <span style={{ display: 'block', marginTop: 6, overflowX: 'auto' }}>
          {renderTable()}
        </span>
      )}
    </span>
  )
}

// InputDataTable — eurocodeapplied.com style: Parameter | Symbol | Value | Unit
export function InputDataTable({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ overflowX: 'auto', marginBottom: 4 }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
            <th style={{ textAlign: 'left', padding: '5px 10px', fontWeight: 700, color: '#1e293b', fontSize: 11 }}>Parameter</th>
            <th style={{ textAlign: 'center', padding: '5px 10px', fontWeight: 700, color: '#1e293b', fontSize: 11, whiteSpace: 'nowrap' }}>Symbol</th>
            <th style={{ textAlign: 'right', padding: '5px 10px', fontWeight: 700, color: '#1e293b', fontSize: 11, whiteSpace: 'nowrap' }}>Value</th>
            <th style={{ textAlign: 'left', padding: '5px 10px', fontWeight: 700, color: '#1e293b', fontSize: 11 }}>Unit</th>
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export function InputDataRow({ param, symbol, value, unit }: {
  param: React.ReactNode
  symbol?: React.ReactNode
  value: React.ReactNode
  unit?: string
}) {
  return (
    <tr style={{ borderBottom: '1px solid #f1f5f9' }}
      onMouseEnter={e => (e.currentTarget.style.background = '#eff6ff')}
      onMouseLeave={e => (e.currentTarget.style.background = '')}>
      <td style={{ padding: '5px 10px', color: '#374151' }}>{param}</td>
      <td style={{ padding: '5px 10px', textAlign: 'center', color: '#1d4ed8', fontFamily: 'inherit' }}>{symbol}</td>
      <td style={{ padding: '5px 10px', textAlign: 'right', fontFamily: 'ui-monospace, monospace', fontWeight: 600, color: '#1e293b' }}>{value}</td>
      <td style={{ padding: '5px 10px', color: '#1e293b', fontSize: 11 }}>{unit ?? ''}</td>
    </tr>
  )
}

export function NumInput({ value, onChange, style, min, max, step }: {
  value: number
  onChange: (v: number) => void
  style?: React.CSSProperties
  min?: number
  max?: number
  step?: number
}) {
  const [str, setStr] = useState(String(value))
  useEffect(() => {
    const parsed = parseFloat(str)
    if (!isNaN(parsed) && parsed !== value) setStr(String(value))
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <input
      type="number"
      style={style}
      min={min}
      max={max}
      step={step}
      value={str}
      onChange={e => {
        setStr(e.target.value)
        const n = parseFloat(e.target.value)
        if (!isNaN(n)) onChange(n)
      }}
      onBlur={() => {
        const n = parseFloat(str)
        if (isNaN(n)) {
          const fallback = min ?? 0
          setStr(String(fallback))
          onChange(fallback)
        } else {
          setStr(String(n))
        }
      }}
    />
  )
}

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #e2e8f0', display: 'inline-block', maxWidth: '100%' }}>
      <table style={{ borderCollapse: 'collapse', width: 'max-content', tableLayout: 'auto' }}>{children}</table>
    </div>
  )
}

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <h2 style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: 0 }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 11, color: '#1e293b', margin: '2px 0 0' }}>{subtitle}</p>}
    </div>
  )
}

export function TheoryBlock({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ border: '1px solid #e0e7ef', borderRadius: 8, overflow: 'hidden', marginBottom: 4 }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', background: open ? '#eff6ff' : '#f8fafc', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#1d4ed8' }}>
        <span>Theory &amp; Background</span>
        <span style={{ fontSize: 16, lineHeight: 1, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
      </button>
      {open && (
        <div style={{ padding: '12px 16px', background: '#fff', fontSize: 12, color: '#334155', lineHeight: 1.8, borderTop: '1px solid #e0e7ef' }}>
          {children}
        </div>
      )}
    </div>
  )
}

export function ResultRow({ label, value, unit, id, onClick }: { label: React.ReactNode; value: string; unit?: string; id?: string; onClick?: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '6px 0', borderBottom: '1px solid #f1f5f9', gap: 8 }}>
      <span style={{ fontSize: 12, color: '#374151' }}>{label}</span>
      <span style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700, color: '#16a34a', fontSize: 13 }}>{value}</span>
        {unit && <span style={{ fontSize: 11, color: '#1e293b' }}>{unit}</span>}
        {onClick && (
          <button onClick={onClick} style={{ marginLeft: 6, fontSize: 10, color: '#3b82f6', background: 'none', border: '1px solid #bfdbfe', borderRadius: 4, padding: '1px 6px', cursor: 'pointer' }}>
            details ↓
          </button>
        )}
      </span>
    </div>
  )
}

import React, { createContext, useContext } from 'react'

const CopyCtx = createContext<boolean>(true)

/** Wrap your tool's results panel to control whether detail text is selectable/copyable. */
export function CopyProvider({ canCopy, children }: { canCopy: boolean; children: React.ReactNode }) {
  return <CopyCtx.Provider value={canCopy}>{children}</CopyCtx.Provider>
}

const ResultsTabCtx = createContext<{
  active: 'results' | 'details'
  setActive: (t: 'results' | 'details') => void
} | null>(null)

// Pill tab bar — place this at the top of the tool, above TheoryBlock
export function ResultsDetailsTabBar() {
  const ctx = useContext(ResultsTabCtx)
  const { t } = useTranslation()
  if (!ctx) return null
  const { active, setActive } = ctx
  const labels: Record<'results' | 'details', string> = {
    results: t('std_ui_tab_results'),
    details: t('std_ui_tab_details'),
  }
  return (
    <div style={{ display: 'flex', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden', width: 'fit-content', marginBottom: 10 }}>
      {(['results', 'details'] as const).map(tab => (
        <button key={tab} onClick={() => setActive(tab)} style={{
          fontSize: 11, fontWeight: 700, padding: '4px 14px', cursor: 'pointer', border: 'none',
          background: active === tab ? '#f1f5f9' : '#f8fafc',
          color: active === tab ? '#1e293b' : '#94a3b8',
          borderRight: tab === 'results' ? '1px solid #e2e8f0' : 'none',
          transition: 'all 0.15s',
        }}>
          {labels[tab]}
        </button>
      ))}
    </div>
  )
}

// Provider only — use ResultsDetailsTabBar to place the tab bar wherever you need it
export function ResultsDetailsProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState<'results' | 'details'>('results')
  return (
    <ResultsTabCtx.Provider value={{ active, setActive }}>
      {children}
    </ResultsTabCtx.Provider>
  )
}

// Legacy wrapper: tab bar + children in one block (used by EC2 tool)
export function ResultsDetailsTabs({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState<'results' | 'details'>('results')
  return (
    <ResultsTabCtx.Provider value={{ active, setActive }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <ResultsDetailsTabBar />
        {children}
      </div>
    </ResultsTabCtx.Provider>
  )
}

export function ResultsBox({ title, children }: { title?: string; children: React.ReactNode }) {
  const ctx = useContext(ResultsTabCtx)
  // If inside ResultsDetailsTabs, hide when Details tab is active
  if (ctx && ctx.active === 'details') return null
  return (
    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px' }}>
      {title && <div style={{ fontSize: 12, fontWeight: 700, color: '#166534', marginBottom: 6 }}>{title}</div>}
      {children}
    </div>
  )
}

export function DetailsSection({ id, children }: { id?: string; children: React.ReactNode }) {
  const tabCtx = useContext(ResultsTabCtx)
  const canCopy = useContext(CopyCtx)
  if (tabCtx && tabCtx.active !== 'details') return null
  return (
    <div id={id} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '14px 16px', background: '#fff', userSelect: canCopy ? undefined : 'none' }}>
      {children}
    </div>
  )
}

export function DetailGroup({ title, children }: { title: string | React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{title}</div>
      {children}
    </div>
  )
}

export function CalcStep({ label, formula, formulaNode, substitution, unit, note, tableRef }: {
  label: React.ReactNode
  formula?: string
  formulaNode?: React.ReactNode
  substitution?: string
  result?: React.ReactNode
  unit?: string
  note?: React.ReactNode
  tableRef?: React.ReactNode
}) {
  return (
    <div style={DETAILS_STEP}>
      <div style={{ fontSize: 12, color: '#374151', marginBottom: 4 }}>{label}</div>
      {tableRef && <div style={{ marginBottom: 6 }}>{tableRef}</div>}
      {formulaNode && (
        <div style={{ ...STEP_FORMULA, fontFamily: 'inherit', background: '#f8fafc', borderRadius: 4, padding: '4px 8px' }}>
          {formulaNode}
        </div>
      )}
      {formula && (
        <div className="katex-formula-wrap" style={{ ...STEP_FORMULA, fontFamily: 'inherit', background: '#f8fafc', borderRadius: 4, padding: '4px 8px', msOverflowStyle: 'none', scrollbarWidth: 'none' } as React.CSSProperties}>
          <Tex>{formula}</Tex>
        </div>
      )}
      {substitution && (
        <div style={{ fontSize: 11, color: '#1e293b', margin: '2px 0', overflowX: 'auto', whiteSpace: 'nowrap', padding: '2px 8px' }}>
          <Tex>{substitution}</Tex>
        </div>
      )}
      {note && <div style={{ fontSize: 12, color: '#b45309', marginTop: 4, lineHeight: 1.5 }}>{typeof note === 'string' ? renderSubscripts(note, 'note') : note}</div>}
    </div>
  )
}

