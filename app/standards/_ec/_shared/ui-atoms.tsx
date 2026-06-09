'use client'
import { useState, useRef, useEffect } from 'react'
import { INPUT_STYLE, LABEL_STYLE } from '../../_lib/ui-styles'
import { Tooltip } from '../../_lib/ui'

export const GREEN = '#10b981'
export const BLUE  = '#3b82f6'
export const RED   = '#ef4444'
export const AMBER = '#f59e0b'

export function n2(v: number, d = 2) { return isFinite(v) ? v.toFixed(d) : '—' }
export function n4(v: number) { return n2(v, 4) }

// ── +/− stepper button ────────────────────────────────────────────────────────
export function Stepper({ onInc, onDec, label }: { onInc: () => void; onDec: () => void; label: string }) {
  const btn: React.CSSProperties = {
    width: 22, height: 22, border: '1px solid #d1fae5', borderRadius: 4,
    background: '#ecfdf5', color: '#047857', fontSize: 14, fontWeight: 700,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    lineHeight: 1, padding: 0, flexShrink: 0,
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ fontSize: 10, color: '#64748b', flex: 1 }}>{label}</span>
      <button style={btn} onClick={onDec} title={`Remove bar from ${label}`}>−</button>
      <button style={btn} onClick={onInc} title={`Add bar to ${label}`}>+</button>
    </div>
  )
}

// ── Ecm override input — fully isolated local state ───────────────────────────
export function EcmInput({ value, onCommit }: { value: number; onCommit: (v: number) => void }) {
  const [text, setText] = useState(String(value))
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ ...LABEL_STYLE, marginBottom: 0 }}>
        E<sub>cm</sub> <span style={{ color: '#94a3b8', fontWeight: 400 }}>[MPa]</span>
      </span>
      <input
        type="text"
        inputMode="decimal"
        value={text}
        onChange={e => setText(e.target.value)}
        onBlur={() => {
          const v = parseFloat(text)
          if (isFinite(v) && v > 0) onCommit(v)
          else setText(String(value))
        }}
        style={{ ...INPUT_STYLE, padding: '5px 8px', fontSize: 12 }}
      />
    </label>
  )
}

// ── Numeric input field with ± hold buttons ───────────────────────────────────
export function Field({ label, labelNode, value, onChange, unit, min, max, step, tip }: {
  label?: string; labelNode?: React.ReactNode; value: number; onChange: (v: number) => void
  unit?: string; min?: number; max?: number; step?: number; tip?: React.ReactNode
}) {
  const inputRef  = useRef<HTMLInputElement>(null)
  const isFocused = useRef(false)

  useEffect(() => {
    if (inputRef.current && !isFocused.current) {
      inputRef.current.value = String(value)
    }
  }, [value])

  const commit = (v: number) => {
    const clamped = min != null && v < min ? min : max != null && v > max ? max : v
    if (inputRef.current) inputRef.current.value = String(clamped)
    onChange(clamped)
  }

  const stepBy = (dir: 1 | -1) => {
    const cur = parseFloat(inputRef.current?.value ?? String(value))
    const s = step ?? 1
    commit(isFinite(cur) ? cur + dir * s : value + dir * s)
  }

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef  = useRef<ReturnType<typeof setTimeout>  | null>(null)

  const startHold = (dir: 1 | -1) => {
    stepBy(dir)
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => stepBy(dir), 80)
    }, 400)
  }
  const stopHold = () => {
    if (timeoutRef.current)  { clearTimeout(timeoutRef.current);   timeoutRef.current  = null }
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
  }

  const [hovered, setHovered] = useState(false)

  const btnStyle: React.CSSProperties = {
    position: 'absolute', top: 0, bottom: 0, width: 18,
    border: 'none', background: 'transparent', color: '#94a3b8',
    fontSize: 14, fontWeight: 700, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 0, userSelect: 'none',
    opacity: hovered ? 1 : 0, pointerEvents: hovered ? 'auto' : 'none',
    transition: 'opacity 0.1s',
  }

  const holdProps = (dir: 1 | -1) => ({
    onMouseDown: () => startHold(dir),
    onMouseUp: stopHold,
    onMouseLeave: stopHold,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ ...LABEL_STYLE, marginBottom: 0, display: 'flex', alignItems: 'center' }}>
        <span style={{ flex: 1 }}>{labelNode ?? label}{unit && <span style={{ color: '#94a3b8', fontWeight: 400 }}> [{unit}]</span>}</span>
        {tip && <Tooltip text={tip} />}
      </span>
      <div style={{ position: 'relative' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}>
        <button style={{ ...btnStyle, left: 0 }} tabIndex={-1} {...holdProps(-1)}>−</button>
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          defaultValue={value}
          onFocus={() => { isFocused.current = true }}
          onChange={() => {
            const v = parseFloat(inputRef.current?.value ?? '')
            if (isFinite(v)) onChange(v)
          }}
          onBlur={() => {
            isFocused.current = false
            const v = parseFloat(inputRef.current?.value ?? '')
            if (!isFinite(v)) {
              if (inputRef.current) inputRef.current.value = String(value)
            } else {
              commit(v)
            }
          }}
          style={{ ...INPUT_STYLE, padding: '5px 20px', fontSize: 12, textAlign: 'center' }} />
        <button style={{ ...btnStyle, right: 0 }} tabIndex={-1} {...holdProps(1)}>+</button>
      </div>
    </div>
  )
}

// Convert "M_Rd,peak" → M<sub>Rd,peak</sub>, "ε_c,top" → ε<sub>c,top</sub>
// Handles: single underscore, comma-subscripts, Greek letters (ε, σ, ρ, λ, φ, θ, ω)
export function SubSym({ s }: { s: string }) {
  const idx = s.indexOf('_')
  if (idx === -1) return <span style={{ marginLeft: 4, fontStyle: 'italic' }}>{s}</span>
  const base = s.slice(0, idx)
  const sub  = s.slice(idx + 1)
  return (
    <span style={{ marginLeft: 4 }}>
      <span style={{ fontStyle: 'italic' }}>{base}</span>
      <sub style={{ fontSize: '0.75em', fontStyle: 'normal' }}>{sub}</sub>
    </span>
  )
}

export function Row({ label, labelNode, symbol, value, unit, ok, warn, tip }: {
  label?: string; labelNode?: React.ReactNode; symbol?: string; value: string; unit?: string; ok?: boolean; warn?: boolean; tip?: React.ReactNode
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '4px 6px', borderBottom: '1px solid #f1f5f9', gap: 8,
        borderRadius: 4, margin: '0 -6px',
        background: hovered ? '#eff6ff' : 'transparent',
        transition: 'background 0.1s',
      }}>
      <span style={{ fontSize: 11, color: '#374151', flex: 1, display: 'flex', alignItems: 'center' }}>
        {labelNode ? <span className="row-label">{labelNode}</span> : label}{symbol && <SubSym s={symbol} />}
        {tip && <Tooltip text={tip} />}
      </span>
      <span style={{ fontFamily: 'ui-monospace,monospace', fontWeight: 700, fontSize: 12, color: ok ? '#16a34a' : warn ? '#b45309' : '#1e293b' }}>{value}</span>
      {unit && <span style={{ fontSize: 10, color: '#64748b', minWidth: 28, textAlign: 'right' }}>{unit}</span>}
    </div>
  )
}

export function Box({ title, children, accent }: { title: string; children: React.ReactNode; accent?: string }) {
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 8 }}>
      <div style={{ padding: '6px 12px', background: accent ? `${accent}14` : '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: 11, fontWeight: 700, color: accent ?? '#1e293b', letterSpacing: '0.04em' }}>
        {title}
      </div>
      <div style={{ padding: '8px 10px' }}>{children}</div>
    </div>
  )
}
