'use client'
import { useState, useEffect } from 'react'
import { Wrench, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// ── Data ─────────────────────────────────────────────────────────────────────

const BOLT_GRADES = ['4.6','4.8','5.6','5.8','6.8','8.8','10.9']

const MATERIAL_PROPS: Record<string, { fyb: number; fub: number }> = {
  '4.6':  { fyb: 240,  fub: 400  },
  '4.8':  { fyb: 320,  fub: 400  },
  '5.6':  { fyb: 300,  fub: 500  },
  '5.8':  { fyb: 400,  fub: 500  },
  '6.8':  { fyb: 480,  fub: 600  },
  '8.8':  { fyb: 640,  fub: 800  },
  '10.9': { fyb: 900,  fub: 1000 },
}

const BOLT_DIMS = [
  { size: 'M5',  d: 5,  waf: 8,  Ag: 19.6,  As: 14.2 },
  { size: 'M6',  d: 6,  waf: 10, Ag: 28.3,  As: 20.1 },
  { size: 'M8',  d: 8,  waf: 13, Ag: 50.3,  As: 36.6 },
  { size: 'M10', d: 10, waf: 16, Ag: 78.5,  As: 58.0 },
  { size: 'M12', d: 12, waf: 18, Ag: 113,   As: 84.3 },
  { size: 'M14', d: 14, waf: 21, Ag: 154,   As: 115  },
  { size: 'M16', d: 16, waf: 24, Ag: 201,   As: 157  },
  { size: 'M20', d: 20, waf: 30, Ag: 314,   As: 245  },
  { size: 'M24', d: 24, waf: 36, Ag: 452,   As: 353  },
  { size: 'M30', d: 30, waf: 46, Ag: 707,   As: 561  },
  { size: 'M36', d: 36, waf: 55, Ag: 1020,  As: 817  },
]

const TENSION_RD: Record<string, Record<string, number>> = {
  'M5':  { '4.6': 4.09, '4.8': 4.09, '5.6': 5.11, '5.8': 5.11, '6.8': 6.13,  '8.8': 8.18,  '10.9': 10.2  },
  'M6':  { '4.6': 5.79, '4.8': 5.79, '5.6': 7.24, '5.8': 7.24, '6.8': 8.68,  '8.8': 11.6,  '10.9': 14.5  },
  'M8':  { '4.6': 10.5, '4.8': 10.5, '5.6': 13.2, '5.8': 13.2, '6.8': 15.8,  '8.8': 21.1,  '10.9': 26.4  },
  'M10': { '4.6': 16.7, '4.8': 16.7, '5.6': 20.9, '5.8': 20.9, '6.8': 25.1,  '8.8': 33.4,  '10.9': 41.8  },
  'M12': { '4.6': 24.3, '4.8': 24.3, '5.6': 30.3, '5.8': 30.3, '6.8': 36.4,  '8.8': 48.6,  '10.9': 60.7  },
  'M14': { '4.6': 33.1, '4.8': 33.1, '5.6': 41.4, '5.8': 41.4, '6.8': 49.6,  '8.8': 66.2,  '10.9': 82.7  },
  'M16': { '4.6': 45.2, '4.8': 45.2, '5.6': 56.5, '5.8': 56.5, '6.8': 67.8,  '8.8': 90.4,  '10.9': 113.0 },
  'M20': { '4.6': 70.6, '4.8': 70.6, '5.6': 88.2, '5.8': 88.2, '6.8': 105.8, '8.8': 141.1, '10.9': 176.4 },
  'M24': { '4.6': 101.7,'4.8': 101.7,'5.6': 127.1,'5.8': 127.1,'6.8': 152.5, '8.8': 203.3, '10.9': 254.2 },
  'M30': { '4.6': 161.6,'4.8': 161.6,'5.6': 202.0,'5.8': 202.0,'6.8': 242.4, '8.8': 323.2, '10.9': 404.0 },
  'M36': { '4.6': 235.4,'4.8': 235.4,'5.6': 294.2,'5.8': 294.2,'6.8': 353.1, '8.8': 470.7, '10.9': 588.4 },
}

const SHEAR_RD: Record<string, Record<string, number>> = {
  'M5':  { '4.6': 2.73, '4.8': 2.27, '5.6': 3.41, '5.8': 2.84, '6.8': 3.41,  '8.8': 5.45,  '10.9': 5.68  },
  'M6':  { '4.6': 3.86, '4.8': 3.22, '5.6': 4.82, '5.8': 4.02, '6.8': 4.82,  '8.8': 7.72,  '10.9': 8.04  },
  'M8':  { '4.6': 7.03, '4.8': 5.86, '5.6': 8.78, '5.8': 7.32, '6.8': 8.78,  '8.8': 14.1,  '10.9': 14.6  },
  'M10': { '4.6': 11.1, '4.8': 9.28, '5.6': 13.9, '5.8': 11.6, '6.8': 13.9,  '8.8': 22.3,  '10.9': 23.2  },
  'M12': { '4.6': 16.2, '4.8': 13.5, '5.6': 20.2, '5.8': 16.9, '6.8': 20.2,  '8.8': 32.4,  '10.9': 33.7  },
  'M14': { '4.6': 22.1, '4.8': 18.4, '5.6': 27.6, '5.8': 23.0, '6.8': 27.6,  '8.8': 44.1,  '10.9': 46.0  },
  'M16': { '4.6': 30.1, '4.8': 25.1, '5.6': 37.7, '5.8': 31.4, '6.8': 37.7,  '8.8': 60.3,  '10.9': 62.8  },
  'M20': { '4.6': 47.0, '4.8': 39.2, '5.6': 58.8, '5.8': 49.0, '6.8': 58.8,  '8.8': 94.1,  '10.9': 98.0  },
  'M24': { '4.6': 67.7, '4.8': 56.5, '5.6': 84.7, '5.8': 70.6, '6.8': 84.7,  '8.8': 135.5, '10.9': 141.1 },
  'M30': { '4.6': 107.5,'4.8': 89.6, '5.6': 134.4,'5.8': 112.0,'6.8': 134.4, '8.8': 215.0, '10.9': 224.0 },
  'M36': { '4.6': 156.5,'4.8': 130.5,'5.6': 195.7,'5.8': 163.1,'6.8': 195.7, '8.8': 313.1, '10.9': 326.1 },
}

const HOLE_DIMS = [
  { size: 'M12', normal: 13, oversize: 15, shortSlot: '16×13', longSlot: '30×13' },
  { size: 'M16', normal: 18, oversize: 20, shortSlot: '22×18', longSlot: '40×18' },
  { size: 'M20', normal: 22, oversize: 24, shortSlot: '26×22', longSlot: '50×22' },
  { size: 'M24', normal: 26, oversize: 30, shortSlot: '32×26', longSlot: '60×26' },
  { size: 'M30', normal: 33, oversize: 38, shortSlot: '40×33', longSlot: '75×33' },
  { size: 'M36', normal: 39, oversize: 45, shortSlot: '46×39', longSlot: '90×39' },
]

// EN 1993-1-8 Table 3.3 — Minimum distances (rounded up to nearest mm)
const EDGE_MIN = [
  { size: 'M12', e1: 16, e2: 16, p1: 29, p2: 32, e1os: 18, e2os: 18, p1os: 33, p2os: 36, e3: 20, e4: 20 },
  { size: 'M14', e1: 18, e2: 18, p1: 33, p2: 36, e1os: 21, e2os: 21, p1os: 38, p2os: 41, e3: 23, e4: 23 },
  { size: 'M16', e1: 22, e2: 22, p1: 40, p2: 44, e1os: 24, e2os: 24, p1os: 44, p2os: 48, e3: 27, e4: 27 },
  { size: 'M18', e1: 24, e2: 24, p1: 44, p2: 48, e1os: 27, e2os: 27, p1os: 49, p2os: 53, e3: 30, e4: 30 },
  { size: 'M20', e1: 27, e2: 27, p1: 49, p2: 53, e1os: 29, e2os: 29, p1os: 53, p2os: 58, e3: 33, e4: 33 },
  { size: 'M22', e1: 29, e2: 29, p1: 53, p2: 58, e1os: 32, e2os: 32, p1os: 58, p2os: 63, e3: 36, e4: 36 },
  { size: 'M24', e1: 32, e2: 32, p1: 58, p2: 63, e1os: 36, e2os: 36, p1os: 66, p2os: 72, e3: 39, e4: 39 },
  { size: 'M27', e1: 36, e2: 36, p1: 66, p2: 72, e1os: 42, e2os: 42, p1os: 77, p2os: 84, e3: 45, e4: 45 },
  { size: 'M30', e1: 40, e2: 40, p1: 73, p2: 80, e1os: 46, e2os: 46, p1os: 84, p2os: 92, e3: 50, e4: 50 },
  { size: 'M33', e1: 44, e2: 44, p1: 80, p2: 87, e1os: 50, e2os: 50, p1os: 91, p2os: 99, e3: 54, e4: 54 },
  { size: 'M36', e1: 47, e2: 47, p1: 86, p2: 94, e1os: 53, e2os: 53, p1os: 97, p2os: 106, e3: 59, e4: 59 },
]

// EN 1993-1-8 Table 3.4 — Adequate distances for maximum bearing resistance (rounded up)
const EDGE_MAX = [
  { size: 'M12', e1: 39, e2: 26, p1: 52, p2: 39, e1os: 42, e2os: 29, p1os: 55, p2os: 42 },
  { size: 'M14', e1: 45, e2: 30, p1: 60, p2: 45, e1os: 48, e2os: 33, p1os: 64, p2os: 48 },
  { size: 'M16', e1: 54, e2: 36, p1: 72, p2: 54, e1os: 57, e2os: 39, p1os: 76, p2os: 57 },
  { size: 'M18', e1: 60, e2: 40, p1: 80, p2: 60, e1os: 63, e2os: 43, p1os: 84, p2os: 63 },
  { size: 'M20', e1: 66, e2: 44, p1: 88, p2: 66, e1os: 69, e2os: 47, p1os: 92, p2os: 69 },
  { size: 'M22', e1: 72, e2: 48, p1: 96, p2: 72, e1os: 75, e2os: 51, p1os: 100, p2os: 75 },
  { size: 'M24', e1: 78, e2: 52, p1: 104, p2: 78, e1os: 84, e2os: 57, p1os: 112, p2os: 84 },
  { size: 'M27', e1: 90, e2: 60, p1: 120, p2: 90, e1os: 96, e2os: 66, p1os: 128, p2os: 96 },
  { size: 'M30', e1: 99, e2: 66, p1: 132, p2: 99, e1os: 108, e2os: 75, p1os: 144, p2os: 108 },
  { size: 'M33', e1: 108, e2: 72, p1: 144, p2: 108, e1os: 117, e2os: 81, p1os: 156, p2os: 117 },
  { size: 'M36', e1: 117, e2: 78, p1: 156, p2: 117, e1os: 126, e2os: 87, p1os: 168, p2os: 126 },
]

const BEARING_MAX: Record<string, Record<string, number>> = {
  'M5':  { 'S235': 3.60, 'S275': 4.00, 'S355': 4.30 },
  'M8':  { 'S235': 5.76, 'S275': 6.40, 'S355': 6.88 },
  'M12': { 'S235': 8.64, 'S275': 9.60, 'S355': 10.32 },
  'M16': { 'S235': 11.52,'S275': 12.80,'S355': 13.76 },
  'M20': { 'S235': 14.40,'S275': 16.00,'S355': 17.20 },
  'M24': { 'S235': 17.28,'S275': 19.20,'S355': 20.64 },
  'M30': { 'S235': 21.60,'S275': 24.00,'S355': 25.80 },
}

// ── Styles ────────────────────────────────────────────────────────────────────
const TH: React.CSSProperties = { padding: '6px 14px', fontSize: 12, fontWeight: 700, color: '#475569', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', borderRight: '1px solid #e2e8f0', textAlign: 'center', whiteSpace: 'nowrap' }
const TD: React.CSSProperties = { padding: '5px 14px', fontSize: 13, color: '#1e293b', borderBottom: '1px solid #f1f5f9', borderRight: '1px solid #f1f5f9', whiteSpace: 'nowrap', textAlign: 'center' }
const TDN: React.CSSProperties = { ...TD, fontFamily: 'ui-monospace, monospace', fontSize: 13 }

function TR({ children, stripe }: { children: React.ReactNode; stripe?: boolean }) {
  return (
    <tr
      style={{ background: stripe ? '#fafafa' : '#fff' }}
      onMouseEnter={e => (e.currentTarget.style.background = '#eff6ff')}
      onMouseLeave={e => (e.currentTarget.style.background = stripe ? '#fafafa' : '#fff')}
    >{children}</tr>
  )
}

function Table({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #e2e8f0', display: 'inline-block', maxWidth: '100%' }}>
      <table style={{ borderCollapse: 'collapse', width: 'max-content', tableLayout: 'auto' }}>{children}</table>
    </div>
  )
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <h2 style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: 0 }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>{subtitle}</p>}
    </div>
  )
}

function Formula({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 16px', fontFamily: 'ui-monospace, monospace', fontSize: 13, color: '#1e293b', display: 'inline-block' }}>
      {children}
    </div>
  )
}

// ── Section components ────────────────────────────────────────────────────────

function MaterialProps() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHeader title="Bolt Strength Classes" subtitle="EN 1993-1-8 Table 3.1 — Nominal values of yield and ultimate strength" />
      <Table>
        <thead><tr>
          <th style={TH}>Bolt Class</th>
          <th style={{ ...TH, textAlign: 'center' }}>f<sub>yb</sub> (MPa)</th>
          <th style={{ ...TH, textAlign: 'center' }}>f<sub>ub</sub> (MPa)</th>
          <th style={{ ...TH, textAlign: 'center' }}>f<sub>yb</sub> / f<sub>ub</sub></th>
        </tr></thead>
        <tbody>
          {BOLT_GRADES.map((g, i) => {
            const { fyb, fub } = MATERIAL_PROPS[g]
            return (
              <TR key={g} stripe={i % 2 !== 0}>
                <td style={{ ...TD, fontWeight: 700, color: '#8b5cf6' }}>{g}</td>
                <td style={TDN}>{fyb}</td>
                <td style={TDN}>{fub}</td>
                <td style={{ ...TDN, color: '#64748b' }}>{(fyb / fub).toFixed(2)}</td>
              </TR>
            )
          })}
        </tbody>
      </Table>
      <div style={{ fontSize: 12, color: '#64748b' }}>γ<sub>M2</sub> = 1.25 (recommended value per EN 1993-1-8)</div>
    </div>
  )
}

function BoltDimensions() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHeader title="Bolt Dimensions & Cross-Sectional Areas" subtitle="Nominal diameter, nut width across flats, gross area, and stress area" />
      <Table>
        <thead><tr>
          <th style={TH}>Size</th>
          <th style={{ ...TH, textAlign: 'center' }}>d (mm)</th>
          <th style={{ ...TH, textAlign: 'center' }}>Width A/F (mm)</th>
          <th style={{ ...TH, textAlign: 'center' }}>A<sub>g</sub> (mm²)</th>
          <th style={{ ...TH, textAlign: 'center' }}>A<sub>s</sub> (mm²)</th>
        </tr></thead>
        <tbody>
          {BOLT_DIMS.map((b, i) => (
            <TR key={b.size} stripe={i % 2 !== 0}>
              <td style={{ ...TD, fontWeight: 700, color: '#3b82f6' }}>{b.size}</td>
              <td style={TDN}>{b.d}</td>
              <td style={TDN}>{b.waf}</td>
              <td style={TDN}>{b.Ag}</td>
              <td style={TDN}>{b.As}</td>
            </TR>
          ))}
        </tbody>
      </Table>
    </div>
  )
}

function ResistanceTable({ title, subtitle, data, unit, formula }: {
  title: string; subtitle: string; data: Record<string, Record<string, number>>; unit: string; formula: string
}) {
  const sizes = Object.keys(data)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHeader title={title} subtitle={subtitle} />
      <Formula>{formula}</Formula>
      <Table>
        <thead><tr>
          <th style={TH}>Size</th>
          {BOLT_GRADES.map(g => <th key={g} style={{ ...TH, textAlign: 'center' }}>{g}</th>)}
        </tr></thead>
        <tbody>
          {sizes.map((size, i) => (
            <TR key={size} stripe={i % 2 !== 0}>
              <td style={{ ...TD, fontWeight: 700, color: '#3b82f6' }}>{size}</td>
              {BOLT_GRADES.map(g => (
                <td key={g} style={TDN}>{data[size][g] !== undefined ? data[size][g].toFixed(1) : '—'}</td>
              ))}
            </TR>
          ))}
        </tbody>
      </Table>
      <div style={{ fontSize: 12, color: '#64748b' }}>Values in {unit}. Shear plane through threaded portion.</div>
    </div>
  )
}

function BearingTable() {
  const sizes = Object.keys(BEARING_MAX)
  const steels = ['S235', 'S275', 'S355']
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHeader title="Bearing Resistance Fₕ,Rd per mm Plate Thickness" subtitle="Maximum values — large edge/end distances (e₁≥3d₀, e₂≥1.5d₀, p₁≥3.75d₀, p₂≥3d₀)" />
      <Formula>F<sub>b,Rd</sub> = k₁ · α<sub>b</sub> · f<sub>u</sub> · d · t / γ<sub>M2</sub></Formula>
      <Table>
        <thead><tr>
          <th style={TH}>Size</th>
          {steels.map(s => <th key={s} style={{ ...TH, textAlign: 'center' }}>{s}</th>)}
        </tr></thead>
        <tbody>
          {sizes.map((size, i) => (
            <TR key={size} stripe={i % 2 !== 0}>
              <td style={{ ...TD, fontWeight: 700, color: '#3b82f6' }}>{size}</td>
              {steels.map(s => (
                <td key={s} style={TDN}>{BEARING_MAX[size]?.[s]?.toFixed(2) ?? '—'}</td>
              ))}
            </TR>
          ))}
        </tbody>
      </Table>
      <div style={{ fontSize: 12, color: '#64748b' }}>Values in kN/mm plate thickness.</div>
    </div>
  )
}

function HoleDimensions() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHeader title="Hole Diameters d₀ (mm)" subtitle="EN 1993-1-8 Table 3.3 — Clearance hole sizes" />
      <Table>
        <thead><tr>
          <th style={TH}>Size</th>
          <th style={{ ...TH, textAlign: 'center' }}>Normal</th>
          <th style={{ ...TH, textAlign: 'center' }}>Oversize</th>
          <th style={{ ...TH, textAlign: 'center' }}>Short Slotted</th>
          <th style={{ ...TH, textAlign: 'center' }}>Long Slotted</th>
        </tr></thead>
        <tbody>
          {HOLE_DIMS.map((h, i) => (
            <TR key={h.size} stripe={i % 2 !== 0}>
              <td style={{ ...TD, fontWeight: 700, color: '#3b82f6' }}>{h.size}</td>
              <td style={TDN}>{h.normal}</td>
              <td style={TDN}>{h.oversize}</td>
              <td style={{ ...TDN, fontFamily: 'inherit' }}>{h.shortSlot}</td>
              <td style={{ ...TDN, fontFamily: 'inherit' }}>{h.longSlot}</td>
            </TR>
          ))}
        </tbody>
      </Table>
    </div>
  )
}

function Formulas() {
  const items = [
    { name: 'Tension resistance',       formula: 'Fᵗ,Rd = k₂ · fᵤᵇ · As / γM2',    note: 'k₂ = 0.9 (standard), 0.63 (countersunk)' },
    { name: 'Shear resistance',         formula: 'Fᵥ,Rd = αᵥ · fᵤᵇ · A / γM2', note: 'αv = 0.6 (4.6, 5.6, 8.8) or 0.5 (others), A = As in threaded zone' },
    { name: 'Bearing resistance',       formula: 'Fᵇ,Rd = k₁ · αᵇ · fu · d · t / γM2',  note: 'αb = min(e₁/3d₀, fub/fu, 1.0)' },
    { name: 'Combined shear+tension',   formula: 'Fᵥ,Ed/Fᵥ,Rd + Fᵗ,Ed/(1.4·Fᵗ,Rd) ≤ 1.0', note: 'Interaction check' },
    { name: 'Punching shear',           formula: 'Bp,Rd = 0.6·π · dm · tp · fu / γM2',            note: 'dm = mean of head/nut across flats & diagonal' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SectionHeader title="Design Formulas" subtitle="EN 1993-1-8 Section 3 — Bolts in shear and/or tension" />
      {items.map(item => (
        <div key={item.name} style={{ background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.name}</div>
          <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 14, color: '#1e293b' }}>{item.formula}</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>{item.note}</div>
        </div>
      ))}
      <div style={{ padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: 12, color: '#92400e' }}>
        γ<sub>M2</sub> = 1.25 — Partial safety factor for resistance of bolts (EN 1993-1-8, recommended value)
      </div>
    </div>
  )
}

function EdgeDistances() {
  const thGroup: React.CSSProperties = { ...TH, textAlign: 'center', borderLeft: '2px solid #e2e8f0' }
  const tdV = (val: number, highlight?: boolean): React.CSSProperties => ({
    ...TDN, color: highlight ? '#2563eb' : '#1e293b',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Table 3.3 — Minimum */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <SectionHeader
          title="Minimum End/Edge Distance & Spacing (Table 3.3)"
          subtitle="EN 1993-1-8 Table 3.3 — Rounded up to nearest mm. e₁=1.2d₀, e₂=1.2d₀, p₁=2.2d₀, p₂=2.4d₀"
        />
        <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #e2e8f0', display: 'inline-block', maxWidth: '100%' }}>
          <table style={{ borderCollapse: 'collapse', width: 'max-content' }}>
            <thead>
              <tr>
                <th style={TH} rowSpan={2}>Size</th>
                <th colSpan={4} style={{ ...TH, textAlign: 'center', borderLeft: '2px solid #e2e8f0', background: '#eff6ff', color: '#1d4ed8' }}>Normal round holes</th>
                <th colSpan={4} style={{ ...TH, textAlign: 'center', borderLeft: '2px solid #e2e8f0', background: '#f0fdf4', color: '#15803d' }}>Oversize round holes</th>
                <th colSpan={2} style={{ ...TH, textAlign: 'center', borderLeft: '2px solid #e2e8f0', background: '#fef9c3', color: '#854d0e' }}>Slotted holes</th>
              </tr>
              <tr>
                {[
                  { label: <span>e<sub>1</sub> (mm)</span>, bg: '#eff6ff' }, { label: <span>e<sub>2</sub> (mm)</span>, bg: '#eff6ff' },
                  { label: <span>p<sub>1</sub> (mm)</span>, bg: '#eff6ff' }, { label: <span>p<sub>2</sub> (mm)</span>, bg: '#eff6ff' },
                  { label: <span>e<sub>1</sub> (mm)</span>, bg: '#f0fdf4' }, { label: <span>e<sub>2</sub> (mm)</span>, bg: '#f0fdf4' },
                  { label: <span>p<sub>1</sub> (mm)</span>, bg: '#f0fdf4' }, { label: <span>p<sub>2</sub> (mm)</span>, bg: '#f0fdf4' },
                  { label: <span>e<sub>3</sub> (mm)</span>, bg: '#fef9c3' }, { label: <span>e<sub>4</sub> (mm)</span>, bg: '#fef9c3' },
                ].map((col, ci) => (
                  <th key={ci} style={{ ...TH, textAlign: 'center', background: col.bg, borderLeft: ci === 4 || ci === 8 ? '2px solid #e2e8f0' : undefined }}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {EDGE_MIN.map((r, i) => (
                <TR key={r.size} stripe={i % 2 !== 0}>
                  <td style={{ ...TD, fontWeight: 700, color: '#3b82f6' }}>{r.size}</td>
                  <td style={TDN}>{r.e1}</td><td style={TDN}>{r.e2}</td>
                  <td style={TDN}>{r.p1}</td><td style={TDN}>{r.p2}</td>
                  <td style={{ ...TDN, color: '#15803d', borderLeft: '2px solid #e2e8f0' }}>{r.e1os}</td>
                  <td style={{ ...TDN, color: '#15803d' }}>{r.e2os}</td>
                  <td style={{ ...TDN, color: '#15803d' }}>{r.p1os}</td>
                  <td style={{ ...TDN, color: '#15803d' }}>{r.p2os}</td>
                  <td style={{ ...TDN, color: '#854d0e', borderLeft: '2px solid #e2e8f0' }}>{r.e3}</td>
                  <td style={{ ...TDN, color: '#854d0e' }}>{r.e4}</td>
                </TR>
              ))}
            </tbody>
          </table>
        </div>
        {/* Figure 3.1 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
          <img
            src="https://cdn.eurocodeapplied.com/images/figures/ec3-bolt-edge-center-distance.png"
            alt="Edge distances and spacing of bolt fasteners (EN1993-1-1 Figure 3.1)"
            style={{ maxWidth: '100%', width: 500, border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', padding: 8 }}
          />
          <div style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>
            Edge distances and spacing of bolt fasteners (reproduced from EN1993-1-1 Figure 3.1)
          </div>
        </div>

        <div style={{ display: 'flex', gap: 32, fontSize: 12, color: '#64748b', flexWrap: 'wrap' }}>
          <span>e<sub>1</sub>, e<sub>2</sub> = end/edge distance &nbsp;|&nbsp; p<sub>1</sub>, p<sub>2</sub> = bolt spacing</span>
          <span>e<sub>3</sub>, e<sub>4</sub> = edge distances for slotted holes (e<sub>3</sub>=1.5d₀, e<sub>4</sub>=1.5d₀)</span>
        </div>
      </div>

      {/* Table 3.4 — Maximum for full bearing */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <SectionHeader
          title="Adequate Distances for Maximum Bearing Resistance Fv,Rd (Table 3.4)"
          subtitle="EN 1993-1-8 Table 3.4 — Rounded up to nearest mm. e₁≥3d₀, e₂≥1.5d₀, p₁≥3.75d₀, p₂≥3d₀"
        />
        <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #e2e8f0', display: 'inline-block', maxWidth: '100%' }}>
          <table style={{ borderCollapse: 'collapse', width: 'max-content' }}>
            <thead>
              <tr>
                <th style={TH} rowSpan={2}>Size</th>
                <th colSpan={4} style={{ ...TH, textAlign: 'center', borderLeft: '2px solid #e2e8f0', background: '#eff6ff', color: '#1d4ed8' }}>Normal round holes</th>
                <th colSpan={4} style={{ ...TH, textAlign: 'center', borderLeft: '2px solid #e2e8f0', background: '#f0fdf4', color: '#15803d' }}>Oversize round holes</th>
              </tr>
              <tr>
                {[
                  { label: <span>e<sub>1</sub> (mm)</span>, bg: '#eff6ff' }, { label: <span>e<sub>2</sub> (mm)</span>, bg: '#eff6ff' },
                  { label: <span>p<sub>1</sub> (mm)</span>, bg: '#eff6ff' }, { label: <span>p<sub>2</sub> (mm)</span>, bg: '#eff6ff' },
                  { label: <span>e<sub>1</sub> (mm)</span>, bg: '#f0fdf4' }, { label: <span>e<sub>2</sub> (mm)</span>, bg: '#f0fdf4' },
                  { label: <span>p<sub>1</sub> (mm)</span>, bg: '#f0fdf4' }, { label: <span>p<sub>2</sub> (mm)</span>, bg: '#f0fdf4' },
                ].map((col, ci) => (
                  <th key={ci} style={{ ...TH, textAlign: 'center', background: col.bg, borderLeft: ci === 4 ? '2px solid #e2e8f0' : undefined }}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {EDGE_MAX.map((r, i) => (
                <TR key={r.size} stripe={i % 2 !== 0}>
                  <td style={{ ...TD, fontWeight: 700, color: '#3b82f6' }}>{r.size}</td>
                  <td style={TDN}>{r.e1}</td><td style={TDN}>{r.e2}</td>
                  <td style={TDN}>{r.p1}</td><td style={TDN}>{r.p2}</td>
                  <td style={{ ...TDN, color: '#15803d', borderLeft: '2px solid #e2e8f0' }}>{r.e1os}</td>
                  <td style={{ ...TDN, color: '#15803d' }}>{r.e2os}</td>
                  <td style={{ ...TDN, color: '#15803d' }}>{r.p1os}</td>
                  <td style={{ ...TDN, color: '#15803d' }}>{r.p2os}</td>
                </TR>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
  void tdV // suppress unused warning
}

// ── Bolt Summary ─────────────────────────────────────────────────────────────
function BoltSummary({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [size, setSize] = useState('M20')
  const [grade, setGrade] = useState('8.8')

  // Check inputs — empty string = not checked
  const [chk, setChk] = useState<Record<string, string>>({})
  const set = (key: string, val: string) => setChk(prev => ({ ...prev, [key]: val }))
  const num = (key: string) => { const v = parseFloat(chk[key] ?? ''); return isNaN(v) ? null : v }

  const dim = BOLT_DIMS.find(b => b.size === size)!
  const mat = MATERIAL_PROPS[grade]
  const ft  = TENSION_RD[size]?.[grade]
  const fv  = SHEAR_RD[size]?.[grade]
  const hole = HOLE_DIMS.find(h => h.size === size)
  const eMin = EDGE_MIN.find(r => r.size === size)
  const eMax = EDGE_MAX.find(r => r.size === size)

  const Row = ({ label, value, unit, note }: { label: React.ReactNode; value: React.ReactNode; unit?: string; note?: string }) => (
    <tr
      style={{ borderBottom: '1px solid #f1f5f9' }}
      onMouseEnter={e => (e.currentTarget.style.background = '#eff6ff')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <td style={{ padding: '6px 12px', fontSize: 13, color: '#1e293b', whiteSpace: 'nowrap', width: 220 }}>{label}</td>
      <td style={{ padding: '6px 12px', fontSize: 13, fontWeight: 700, color: '#1e293b', fontFamily: 'ui-monospace, monospace', textAlign: 'right' }}>{value}</td>
      <td style={{ padding: '6px 12px', fontSize: 12, color: '#475569' }}>{unit}</td>
      {note && <td style={{ padding: '6px 12px', fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>{note}</td>}
    </tr>
  )

  const Group = ({ title, color, children }: { title: string; color: string; children: React.ReactNode }) => (
    <div style={{ borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      <div style={{ background: color, padding: '7px 14px', fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '0.05em' }}>{title}</div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}><tbody>{children}</tbody></table>
    </div>
  )

  const bearingBySteel = BEARING_MAX[size]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Selectors — two-row table */}
      <div style={{ display: 'inline-block', borderRadius: 10, border: '1px solid #e2e8f0', overflow: 'hidden', background: '#fff' }}>
        <table style={{ borderCollapse: 'collapse' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '8px 14px', fontSize: 12, fontWeight: 700, color: '#fff', background: '#3b82f6', whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>BOLT SIZE</td>
              {BOLT_DIMS.map(b => (
                <td key={b.size} style={{ padding: '6px 4px', textAlign: 'center' }}>
                  <button onClick={() => setSize(b.size)}
                    style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', minWidth: 44,
                      background: size === b.size ? '#3b82f6' : 'transparent',
                      color: size === b.size ? '#fff' : '#475569',
                      border: `1px solid ${size === b.size ? '#3b82f6' : '#e2e8f0'}` }}>
                    {b.size}
                  </button>
                </td>
              ))}
            </tr>
            <tr>
              <td style={{ padding: '8px 14px', fontSize: 12, fontWeight: 700, color: '#fff', background: '#8b5cf6', whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>GRADE</td>
              {BOLT_GRADES.map(g => (
                <td key={g} style={{ padding: '6px 4px', textAlign: 'center' }}>
                  <button onClick={() => setGrade(g)}
                    style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', minWidth: 44,
                      background: grade === g ? '#8b5cf6' : 'transparent',
                      color: grade === g ? '#fff' : '#475569',
                      border: `1px solid ${grade === g ? '#8b5cf6' : '#e2e8f0'}` }}>
                    {g}
                  </button>
                </td>
              ))}
              {/* pad remaining cells to align under bolt size buttons */}
              {Array.from({ length: BOLT_DIMS.length - BOLT_GRADES.length }).map((_, i) => <td key={i} />)}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Summary heading */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🔩</div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#1e293b' }}>{size} — Grade {grade}</div>
          <div style={{ fontSize: 12, color: '#334155' }}>f<sub>yb</sub> = {mat.fyb} MPa &nbsp;·&nbsp; f<sub>ub</sub> = {mat.fub} MPa &nbsp;·&nbsp; γ<sub>M2</sub> = 1.25</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Left — summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14, flex: 1, minWidth: 300 }}>

          <Group title="📐 GEOMETRY" color="#3b82f6">
            <Row label="Nominal diameter d" value={dim.d} unit="mm" />
            <Row label="Gross area Ag" value={dim.Ag} unit="mm²" />
            <Row label="Stress area As" value={dim.As} unit="mm²" />
            <Row label="Width across flats" value={dim.waf} unit="mm" />
          </Group>

          <Group title="💪 MATERIAL STRENGTH" color="#8b5cf6">
            <Row label={<>Yield strength f<sub>yb</sub></>} value={mat.fyb} unit="MPa" />
            <Row label={<>Ultimate strength f<sub>ub</sub></>} value={mat.fub} unit="MPa" />
            <Row label={<>f<sub>yb</sub> / f<sub>ub</sub></>} value={(mat.fyb / mat.fub).toFixed(2)} />
          </Group>

          <Group title="↕️ TENSILE RESISTANCE" color="#10b981">
            <Row label={<>F<sub>t,Rd</sub></>} value={ft?.toFixed(1) ?? '—'} unit="kN" note="k₂ = 0.9" />
          </Group>

          <Group title="✂️ SHEAR RESISTANCE" color="#f59e0b">
            <Row label={<>F<sub>v,Rd</sub> per shear plane</>} value={fv?.toFixed(1) ?? '—'} unit="kN" note="threaded portion" />
            <Row label={<>2× F<sub>v,Rd</sub> (double shear)</>} value={fv ? (fv * 2).toFixed(1) : '—'} unit="kN" />
          </Group>

          {bearingBySteel && (
            <Group title="🔧 BEARING RESISTANCE (per mm plate)" color="#ef4444">
              <Row label="S235 steel" value={bearingBySteel['S235']?.toFixed(2) ?? '—'} unit="kN/mm" note="max distances" />
              <Row label="S275 steel" value={bearingBySteel['S275']?.toFixed(2) ?? '—'} unit="kN/mm" />
              <Row label="S355 steel" value={bearingBySteel['S355']?.toFixed(2) ?? '—'} unit="kN/mm" />
            </Group>
          )}

          {hole && (
            <Group title="⭕ HOLE DIMENSIONS" color="#64748b">
              <Row label="Normal clearance d₀" value={hole.normal} unit="mm" />
              <Row label="Oversize d₀" value={hole.oversize} unit="mm" />
              <Row label="Short slotted" value={hole.shortSlot} />
              <Row label="Long slotted" value={hole.longSlot} />
            </Group>
          )}

          {eMin && (
            <Group title="📏 MIN EDGE/END DISTANCES" color="#06b6d4">
              <Row label={<>e<sub>1</sub> end distance</>} value={eMin.e1} unit="mm" note="= 1.2 d₀" />
              <Row label={<>e<sub>2</sub> edge distance</>} value={eMin.e2} unit="mm" note="= 1.2 d₀" />
              <Row label={<>p<sub>1</sub> spacing (load dir)</>} value={eMin.p1} unit="mm" note="= 2.2 d₀" />
              <Row label={<>p<sub>2</sub> spacing (perp)</>} value={eMin.p2} unit="mm" note="= 2.4 d₀" />
            </Group>
          )}

          {eMax && (
            <Group title="📏 DISTANCES FOR MAX BEARING" color="#0ea5e9">
              <Row label={<>e<sub>1</sub> end distance</>} value={eMax.e1} unit="mm" note="= 3 d₀" />
              <Row label={<>e<sub>2</sub> edge distance</>} value={eMax.e2} unit="mm" note="= 1.5 d₀" />
              <Row label={<>p<sub>1</sub> spacing (load dir)</>} value={eMax.p1} unit="mm" note="= 3.75 d₀" />
              <Row label={<>p<sub>2</sub> spacing (perp)</>} value={eMax.p2} unit="mm" note="= 3 d₀" />
            </Group>
          )}

        </div>

        {/* Right — check panel */}
        <div style={{ width: 280, flexShrink: 0, borderRadius: 10, border: '2px solid #e2e8f0', overflow: 'hidden', background: '#fff', position: 'relative' }}>
          {!isLoggedIn && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(248,250,252,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10 }}>
              <Lock size={22} color="#64748b" />
              <div style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Sign in to use Design Check</div>
            </div>
          )}
          <div style={{ background: '#1e293b', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 15 }}>✅</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Design Check</span>
            <span style={{ fontSize: 11, color: '#64748b', marginLeft: 'auto' }}>{size} · {grade}</span>
          </div>
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { key: 'Ft', label: <><b>F</b><sub>t,Ed</sub></>, unit: 'kN', capacity: ft, caption: <>≤ F<sub>t,Rd</sub> = {ft?.toFixed(1) ?? '—'} kN</> },
              { key: 'Fv', label: <><b>F</b><sub>v,Ed</sub></>, unit: 'kN', capacity: fv, caption: <>≤ F<sub>v,Rd</sub> = {fv?.toFixed(1) ?? '—'} kN</> },
              { key: 'e1', label: <><b>e</b><sub>1</sub></>, unit: 'mm', capacity: eMin?.e1, caption: <>≥ {eMin?.e1 ?? '—'} mm (min)</>, minCheck: true },
              { key: 'e2', label: <><b>e</b><sub>2</sub></>, unit: 'mm', capacity: eMin?.e2, caption: <>≥ {eMin?.e2 ?? '—'} mm (min)</>, minCheck: true },
              { key: 'p1', label: <><b>p</b><sub>1</sub></>, unit: 'mm', capacity: eMin?.p1, caption: <>≥ {eMin?.p1 ?? '—'} mm (min)</>, minCheck: true },
              { key: 'p2', label: <><b>p</b><sub>2</sub></>, unit: 'mm', capacity: eMin?.p2, caption: <>≥ {eMin?.p2 ?? '—'} mm (min)</>, minCheck: true },
              { key: 'd0', label: <><b>d</b><sub>0</sub></>, unit: 'mm', capacity: hole?.normal, caption: <>= {hole?.normal ?? '—'} mm (normal)</>, exactCheck: true },
            ].map(({ key, label, unit, capacity, caption, minCheck, exactCheck }) => {
              const v = num(key)
              const ok = v === null || capacity === undefined ? null
                : minCheck ? v >= capacity
                : exactCheck ? v >= capacity
                : v <= capacity
              return (
                <div key={key}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, width: 44, flexShrink: 0, color: '#1e293b' }}>{label}</span>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input
                        type="number"
                        value={chk[key] ?? ''}
                        onChange={e => set(key, e.target.value)}
                        placeholder="—"
                        style={{
                          width: '100%', padding: '5px 28px 5px 8px', borderRadius: 6, fontSize: 13,
                          border: `1.5px solid ${ok === null ? '#e2e8f0' : ok ? '#22c55e' : '#ef4444'}`,
                          outline: 'none', background: ok === null ? '#fff' : ok ? '#f0fdf4' : '#fef2f2',
                          boxSizing: 'border-box',
                        }}
                      />
                      <span style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: '#64748b' }}>{unit}</span>
                    </div>
                    <span style={{ fontSize: 16, width: 20, textAlign: 'center', flexShrink: 0 }}>
                      {ok === null ? '' : ok ? '✅' : '❌'}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#475569', marginTop: 2, paddingLeft: 52 }}>{caption}</div>
                </div>
              )
            })}

            {/* Combined shear+tension interaction */}
            {(() => {
              const vEd = num('Fv'), tEd = num('Ft')
              if (vEd === null || tEd === null || !fv || !ft) return null
              const ratio = (vEd / fv) + (tEd / (1.4 * ft))
              const ok = ratio <= 1.0
              return (
                <div style={{ marginTop: 4, padding: '8px 10px', borderRadius: 8, background: ok ? '#f0fdf4' : '#fef2f2', border: `1px solid ${ok ? '#86efac' : '#fca5a5'}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: ok ? '#15803d' : '#dc2626' }}>
                    {ok ? '✅' : '❌'} Combined shear + tension
                  </div>
                  <div style={{ fontSize: 11, color: '#475569', marginTop: 2, fontFamily: 'ui-monospace, monospace' }}>
                    F<sub>v</sub>/F<sub>v,Rd</sub> + F<sub>t</sub>/(1.4·F<sub>t,Rd</sub>) = {ratio.toFixed(3)} {ok ? '≤ 1.0 ✓' : '> 1.0 ✗'}
                  </div>
                </div>
              )
            })()}

            <button onClick={() => setChk({})}
              style={{ marginTop: 4, padding: '5px', borderRadius: 6, background: 'none', border: '1px solid #e2e8f0', color: '#94a3b8', cursor: 'pointer', fontSize: 11 }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#cbd5e1')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#e2e8f0')}>
              Clear all
            </button>
          </div>
        </div>

          {/* Edge distance reference figure — inside the grid so it flows with cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <img
              src="https://cdn.eurocodeapplied.com/images/figures/ec3-bolt-edge-center-distance.png"
              alt="Edge distances and spacing (EN1993-1-1 Figure 3.1)"
              style={{ maxWidth: '100%', width: 460, border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', padding: 8 }}
            />
            <div style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>
              Edge distances and spacing — EN1993-1-1 Figure 3.1
            </div>
          </div>

        </div>

    </div>
  )
}

// ── Sections config ────────────────────────────────────────────────────────────
const SECTIONS = [
  { id: 'summary',     label: 'Bolt Summary',         emoji: '🔩' },
  { id: 'material',    label: 'Strength Classes',     emoji: '💪', component: <MaterialProps /> },
  { id: 'dimensions',  label: 'Dimensions & Areas',   emoji: '📐', component: <BoltDimensions /> },
  { id: 'tension',     label: 'Tension Resistance',   emoji: '↕️',  component: <ResistanceTable title="Tensile Resistance Ft,Rd (kN)" subtitle="EN 1993-1-8 — per bolt" data={TENSION_RD} unit="kN" formula="Ft,Rd = k₂ · fub · As / γM2    (k₂ = 0.9)" /> },
  { id: 'shear',       label: 'Shear Resistance',     emoji: '✂️',  component: <ResistanceTable title="Shear Resistance Fv,Rd (kN)" subtitle="EN 1993-1-8 — per shear plane, shear through threaded portion" data={SHEAR_RD} unit="kN" formula="Fv,Rd = αv · fub · As / γM2" /> },
  { id: 'bearing',     label: 'Bearing Resistance',   emoji: '🔧', component: <BearingTable /> },
  { id: 'holes',       label: 'Hole Dimensions',      emoji: '⭕', component: <HoleDimensions /> },
  { id: 'edge',        label: 'Edge & End Distance',  emoji: '📏', component: <EdgeDistances /> },
  { id: 'formulas',    label: 'Design Formulas',      emoji: '📖', component: <Formulas /> },
]

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DataPage() {
  const router = useRouter()
  const [active, setActive] = useState('summary')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Read ?section= param from URL to deep-link to a specific section
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sec = params.get('section')
    if (sec && SECTIONS.some(s => s.id === sec)) setActive(sec)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setIsLoggedIn(!!session?.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setIsLoggedIn(!!session?.user))
    return () => subscription.unsubscribe()
  }, [])

  const activeSec = SECTIONS.find(s => s.id === active)!

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #334155 100%)', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        {/* Logo → back to dashboard */}
        <button onClick={() => router.push('/')} title="Back to Dashboard"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 8, opacity: 0.85, flexShrink: 0 }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '0.85')}>
          <span style={{ fontSize: 20 }}>📚</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>Civil Base</span>
        </button>
        <span style={{ color: '#334155', fontSize: 16 }}>/</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #f59e0b, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Wrench size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', letterSpacing: '0.1em' }}>EN 1993-1-8</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>BOLT DESIGN DATA</div>
          </div>
        </div>
        {/* Source link */}
        <a href="https://eurocodeapplied.com/design/en1993/bolt-design-properties" target="_blank" rel="noopener noreferrer"
          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', opacity: 0.7 }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}>
          <img src="https://cdn.eurocodeapplied.com/images/eurocode-applied-logo.png" alt="Eurocode Applied"
            style={{ height: 22 }}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; (e.currentTarget.nextSibling as HTMLElement).style.display = 'inline' }}
          />
          <span style={{ display: 'none', fontSize: 11, color: '#94a3b8' }}>eurocodeapplied.com</span>
        </a>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar nav */}
        <div style={{ width: 200, background: '#fff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>
          {SECTIONS.map(sec => (
            <button key={sec.id} onClick={() => setActive(sec.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                background: active === sec.id ? '#fffbeb' : 'transparent',
                borderTop: 'none', borderRight: 'none',
                borderBottom: '1px solid #f1f5f9',
                borderLeft: `3px solid ${active === sec.id ? '#f59e0b' : 'transparent'}`,
                cursor: 'pointer', textAlign: 'left', width: '100%',
              }}
              onMouseEnter={e => { if (active !== sec.id) e.currentTarget.style.background = '#f8fafc' }}
              onMouseLeave={e => { if (active !== sec.id) e.currentTarget.style.background = 'transparent' }}>
              <span style={{ fontSize: 16 }}>{sec.emoji}</span>
              <span style={{ fontSize: 12, fontWeight: active === sec.id ? 700 : 500, color: active === sec.id ? '#92400e' : '#475569' }}>{sec.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {active === 'summary' ? <BoltSummary isLoggedIn={isLoggedIn} /> : (activeSec as any).component}
        </div>
      </div>
    </div>
  )
}
