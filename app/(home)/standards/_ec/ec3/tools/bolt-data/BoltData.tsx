'use client'
import { useState } from 'react'
import { Table, TR, SectionHeader } from '@/app/(home)/standards/_lib/ui'
import { TH, TD, TDN } from '../../../../_lib/ui-styles'
import { useTranslation } from '@/app/i18n/LanguageContext'

// ── Data ─────────────────────────────────────────────────────────────────────

const BOLT_GRADES = ['4.6', '4.8', '5.6', '5.8', '6.8', '8.8', '10.9']

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
  { size: 'M5',  d: 5,  Ag: 19.6,  As: 14.2 },
  { size: 'M6',  d: 6,  Ag: 28.3,  As: 20.1 },
  { size: 'M8',  d: 8,  Ag: 50.3,  As: 36.6 },
  { size: 'M10', d: 10, Ag: 78.5,  As: 58.0 },
  { size: 'M12', d: 12, Ag: 113,   As: 84.3 },
  { size: 'M14', d: 14, Ag: 154,   As: 115  },
  { size: 'M16', d: 16, Ag: 201,   As: 157  },
  { size: 'M20', d: 20, Ag: 314,   As: 245  },
  { size: 'M24', d: 24, Ag: 452,   As: 353  },
  { size: 'M30', d: 30, Ag: 707,   As: 561  },
  { size: 'M36', d: 36, Ag: 1020,  As: 817  },
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

// ── Table components ──────────────────────────────────────────────────────────

function MaterialProps() {
  const { t } = useTranslation()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SectionHeader title={t('std_ec3_bolt_material_title')} subtitle={t('std_ec3_bolt_material_sub')} />
      <Table>
        <thead><tr>
          <th style={{ ...TH, textAlign: 'left' }}>{t('std_ec3_tbl_bolt_class_col')}</th>
          <th style={TH}>f<sub>yb</sub> (MPa)</th>
          <th style={TH}>f<sub>ub</sub> (MPa)</th>
          <th style={TH}>f<sub>yb</sub> / f<sub>ub</sub></th>
        </tr></thead>
        <tbody>
          {BOLT_GRADES.map((g, i) => {
            const { fyb, fub } = MATERIAL_PROPS[g]
            return (
              <TR key={g} stripe={i % 2 !== 0}>
                <td style={{ ...TD, fontWeight: 700, color: '#8b5cf6', textAlign: 'left' }}>{g}</td>
                <td style={TDN}>{fyb}</td>
                <td style={TDN}>{fub}</td>
                <td style={{ ...TDN, color: '#64748b' }}>{(fyb / fub).toFixed(2)}</td>
              </TR>
            )
          })}
        </tbody>
      </Table>
      <div style={{ fontSize: 11, color: '#64748b' }}>{t('std_ec3_bolt_material_note')}</div>
    </div>
  )
}

function BoltDimensions() {
  const { t } = useTranslation()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SectionHeader title={t('std_ec3_bolt_dims_title')} subtitle={t('std_ec3_bolt_dims_sub')} />
      <Table>
        <thead><tr>
          <th style={{ ...TH, textAlign: 'left' }}>{t('std_ec3_tbl_size_col')}</th>
          <th style={TH}>d (mm)</th>
          <th style={TH}>A<sub>g</sub> (mm²)</th>
          <th style={TH}>A<sub>s</sub> (mm²)</th>
        </tr></thead>
        <tbody>
          {BOLT_DIMS.map((b, i) => (
            <TR key={b.size} stripe={i % 2 !== 0}>
              <td style={{ ...TD, fontWeight: 700, color: '#8b5cf6', textAlign: 'left' }}>{b.size}</td>
              <td style={TDN}>{b.d}</td>
              <td style={TDN}>{b.Ag}</td>
              <td style={TDN}>{b.As}</td>
            </TR>
          ))}
        </tbody>
      </Table>
    </div>
  )
}

function ResistanceGrid({ title, subtitle, formula, data, unit, note }: {
  title: string; subtitle: string; formula: string
  data: Record<string, Record<string, number>>; unit: string; note: string
}) {
  const sizes = Object.keys(data)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SectionHeader title={title} subtitle={subtitle} />
      <div style={{ fontSize: 11, fontFamily: 'ui-monospace, monospace', color: '#1d4ed8', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '6px 12px', display: 'inline-block' }}>{formula}</div>
      <Table>
        <thead><tr>
          <th style={{ ...TH, textAlign: 'left' }}>Size</th>
          {BOLT_GRADES.map(g => <th key={g} style={TH}>{g}</th>)}
        </tr></thead>
        <tbody>
          {sizes.map((size, i) => (
            <TR key={size} stripe={i % 2 !== 0}>
              <td style={{ ...TD, fontWeight: 700, color: '#8b5cf6', textAlign: 'left' }}>{size}</td>
              {BOLT_GRADES.map(g => (
                <td key={g} style={TDN}>{data[size][g] !== undefined ? data[size][g].toFixed(1) : '—'}</td>
              ))}
            </TR>
          ))}
        </tbody>
      </Table>
      <div style={{ fontSize: 11, color: '#64748b' }}>{unit}. {note}</div>
    </div>
  )
}

function BearingTable() {
  const { t } = useTranslation()
  const sizes = Object.keys(BEARING_MAX)
  const steels = ['S235', 'S275', 'S355']
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SectionHeader title={t('std_ec3_bolt_bearing_title')} subtitle={t('std_ec3_bolt_bearing_sub')} />
      <div style={{ fontSize: 11, fontFamily: 'ui-monospace, monospace', color: '#1d4ed8', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '6px 12px', display: 'inline-block' }}>
        F<sub>b,Rd</sub> = k₁ · α<sub>b</sub> · f<sub>u</sub> · d · t / γ<sub>M2</sub>
      </div>
      <Table>
        <thead><tr>
          <th style={{ ...TH, textAlign: 'left' }}>{t('std_ec3_tbl_size_col')}</th>
          {steels.map(s => <th key={s} style={TH}>{s}</th>)}
        </tr></thead>
        <tbody>
          {sizes.map((size, i) => (
            <TR key={size} stripe={i % 2 !== 0}>
              <td style={{ ...TD, fontWeight: 700, color: '#8b5cf6', textAlign: 'left' }}>{size}</td>
              {steels.map(s => <td key={s} style={TDN}>{BEARING_MAX[size]?.[s]?.toFixed(2) ?? '—'}</td>)}
            </TR>
          ))}
        </tbody>
      </Table>
      <div style={{ fontSize: 11, color: '#64748b' }}>{t('std_ec3_bolt_bearing_note')}</div>
    </div>
  )
}

function HoleDimensions() {
  const { t } = useTranslation()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SectionHeader title={t('std_ec3_bolt_hole_title')} subtitle={t('std_ec3_bolt_hole_sub')} />
      <Table>
        <thead><tr>
          <th style={{ ...TH, textAlign: 'left' }}>{t('std_ec3_tbl_size_col')}</th>
          <th style={TH}>{t('std_ec3_tbl_normal_col')}</th>
          <th style={TH}>{t('std_ec3_tbl_oversize_col')}</th>
          <th style={TH}>{t('std_ec3_bolt_hole_short')}</th>
          <th style={TH}>{t('std_ec3_bolt_hole_long')}</th>
        </tr></thead>
        <tbody>
          {HOLE_DIMS.map((h, i) => (
            <TR key={h.size} stripe={i % 2 !== 0}>
              <td style={{ ...TD, fontWeight: 700, color: '#8b5cf6', textAlign: 'left' }}>{h.size}</td>
              <td style={TDN}>{h.normal}</td>
              <td style={TDN}>{h.oversize}</td>
              <td style={{ ...TD, fontFamily: 'inherit' }}>{h.shortSlot}</td>
              <td style={{ ...TD, fontFamily: 'inherit' }}>{h.longSlot}</td>
            </TR>
          ))}
        </tbody>
      </Table>
    </div>
  )
}

function EdgeDistances() {
  const { t } = useTranslation()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SectionHeader title={t('std_ec3_bolt_edge_min_title')} subtitle={t('std_ec3_bolt_edge_min_sub')} />
        <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #e2e8f0', display: 'inline-block', maxWidth: '100%' }}>
          <table style={{ borderCollapse: 'collapse', width: 'max-content' }}>
            <thead>
              <tr>
                <th style={TH} rowSpan={2}>Size</th>
                <th colSpan={4} style={{ ...TH, background: '#eff6ff', color: '#1d4ed8', borderLeft: '2px solid #e2e8f0' }}>{t('std_ec3_tbl_normal_holes')}</th>
                <th colSpan={4} style={{ ...TH, background: '#f0fdf4', color: '#15803d', borderLeft: '2px solid #e2e8f0' }}>{t('std_ec3_tbl_oversize_holes')}</th>
                <th colSpan={2} style={{ ...TH, background: '#fef9c3', color: '#854d0e', borderLeft: '2px solid #e2e8f0' }}>{t('std_ec3_bolt_slotted')}</th>
              </tr>
              <tr>
                {[
                  { label: 'e₁', bg: '#eff6ff' }, { label: 'e₂', bg: '#eff6ff' },
                  { label: 'p₁', bg: '#eff6ff' }, { label: 'p₂', bg: '#eff6ff' },
                  { label: 'e₁', bg: '#f0fdf4' }, { label: 'e₂', bg: '#f0fdf4' },
                  { label: 'p₁', bg: '#f0fdf4' }, { label: 'p₂', bg: '#f0fdf4' },
                  { label: 'e₃', bg: '#fef9c3' }, { label: 'e₄', bg: '#fef9c3' },
                ].map((col, ci) => (
                  <th key={ci} style={{ ...TH, background: col.bg, borderLeft: ci === 4 || ci === 8 ? '2px solid #e2e8f0' : undefined }}>
                    {col.label} <span style={{ fontSize: 10, fontWeight: 400 }}>(mm)</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {EDGE_MIN.map((r, i) => (
                <TR key={r.size} stripe={i % 2 !== 0}>
                  <td style={{ ...TD, fontWeight: 700, color: '#8b5cf6' }}>{r.size}</td>
                  <td style={TDN}>{r.e1}</td><td style={TDN}>{r.e2}</td><td style={TDN}>{r.p1}</td><td style={TDN}>{r.p2}</td>
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
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SectionHeader title={t('std_ec3_bolt_edge_max_title')} subtitle={t('std_ec3_bolt_edge_max_sub')} />
        <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #e2e8f0', display: 'inline-block', maxWidth: '100%' }}>
          <table style={{ borderCollapse: 'collapse', width: 'max-content' }}>
            <thead>
              <tr>
                <th style={TH} rowSpan={2}>Size</th>
                <th colSpan={4} style={{ ...TH, background: '#eff6ff', color: '#1d4ed8', borderLeft: '2px solid #e2e8f0' }}>{t('std_ec3_tbl_normal_holes')}</th>
                <th colSpan={4} style={{ ...TH, background: '#f0fdf4', color: '#15803d', borderLeft: '2px solid #e2e8f0' }}>{t('std_ec3_tbl_oversize_holes')}</th>
              </tr>
              <tr>
                {[
                  { label: 'e₁', bg: '#eff6ff' }, { label: 'e₂', bg: '#eff6ff' },
                  { label: 'p₁', bg: '#eff6ff' }, { label: 'p₂', bg: '#eff6ff' },
                  { label: 'e₁', bg: '#f0fdf4' }, { label: 'e₂', bg: '#f0fdf4' },
                  { label: 'p₁', bg: '#f0fdf4' }, { label: 'p₂', bg: '#f0fdf4' },
                ].map((col, ci) => (
                  <th key={ci} style={{ ...TH, background: col.bg, borderLeft: ci === 4 ? '2px solid #e2e8f0' : undefined }}>
                    {col.label} <span style={{ fontSize: 10, fontWeight: 400 }}>(mm)</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {EDGE_MAX.map((r, i) => (
                <TR key={r.size} stripe={i % 2 !== 0}>
                  <td style={{ ...TD, fontWeight: 700, color: '#8b5cf6' }}>{r.size}</td>
                  <td style={TDN}>{r.e1}</td><td style={TDN}>{r.e2}</td><td style={TDN}>{r.p1}</td><td style={TDN}>{r.p2}</td>
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
}

function DesignFormulas() {
  const { t } = useTranslation()
  const items = [
    { name: t('std_ec3_bolt_f_tension'),  formula: 'Ft,Rd = k₂ · fub · As / γM2',             note: t('std_ec3_bolt_f_tension_note') },
    { name: t('std_ec3_bolt_f_shear'),    formula: 'Fv,Rd = αv · fub · A / γM2',              note: t('std_ec3_bolt_f_shear_note') },
    { name: t('std_ec3_bolt_f_bearing'),  formula: 'Fb,Rd = k₁ · αb · fu · d · t / γM2',     note: t('std_ec3_bolt_f_bearing_note') },
    { name: t('std_ec3_bolt_f_combined'), formula: 'Fv,Ed/Fv,Rd + Ft,Ed/(1.4·Ft,Rd) ≤ 1.0', note: t('std_ec3_bolt_f_combined_note') },
    { name: t('std_ec3_bolt_f_punching'), formula: 'Bp,Rd = 0.6π · dm · tp · fu / γM2',       note: t('std_ec3_bolt_f_punching_note') },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SectionHeader title={t('std_ec3_bolt_formula_title')} subtitle={t('std_ec3_bolt_formula_sub')} />
      {items.map(item => (
        <div key={item.name} style={{ background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.name}</div>
          <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, color: '#1d4ed8' }}>{item.formula}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>{item.note}</div>
        </div>
      ))}
      <div style={{ padding: '8px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 7, fontSize: 11, color: '#92400e' }}>
        {t('std_ec3_bolt_formula_note')}
      </div>
    </div>
  )
}

// ── Bolt Summary (interactive) ────────────────────────────────────────────────

function BoltSummary() {
  const { t } = useTranslation()
  const [size, setSize]   = useState('M20')
  const [grade, setGrade] = useState('8.8')
  const [chk, setChk]     = useState<Record<string, string>>({})
  const set = (key: string, val: string) => setChk(prev => ({ ...prev, [key]: val }))
  const num = (key: string) => { const v = parseFloat(chk[key] ?? ''); return isNaN(v) ? null : v }

  const dim    = BOLT_DIMS.find(b => b.size === size)!
  const mat    = MATERIAL_PROPS[grade]
  const ft     = TENSION_RD[size]?.[grade]
  const fv     = SHEAR_RD[size]?.[grade]
  const hole   = HOLE_DIMS.find(h => h.size === size)
  const eMin   = EDGE_MIN.find(r => r.size === size)
  const eMax   = EDGE_MAX.find(r => r.size === size)
  const bearing = (BEARING_MAX as Record<string, Record<string, number>>)[size]

  const Row = ({ label, value, unit, note }: { label: React.ReactNode; value: React.ReactNode; unit?: string; note?: string }) => (
    <tr style={{ borderBottom: '1px solid #f1f5f9' }}
      onMouseEnter={e => (e.currentTarget.style.background = '#eff6ff')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
      <td style={{ padding: '5px 10px', fontSize: 12, color: '#374151', whiteSpace: 'nowrap' }}>{label}</td>
      <td style={{ padding: '5px 10px', fontSize: 13, fontWeight: 700, color: '#1e293b', fontFamily: 'ui-monospace, monospace', textAlign: 'right' }}>{value}</td>
      <td style={{ padding: '5px 10px', fontSize: 11, color: '#475569' }}>{unit}</td>
      {note && <td style={{ padding: '5px 10px', fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>{note}</td>}
    </tr>
  )

  const Group = ({ title, color, children }: { title: string; color: string; children: React.ReactNode }) => (
    <div style={{ borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      <div style={{ background: color, padding: '5px 12px', fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}>{title}</div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}><tbody>{children}</tbody></table>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHeader title={t('std_ec3_bolt_summary_title')} subtitle={t('std_ec3_bolt_summary_sub')} />

      {/* Selectors */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '6px 12px', fontSize: 11, fontWeight: 700, color: '#fff', background: '#8b5cf6', whiteSpace: 'nowrap' }}>{t('std_ec3_tbl_size_col').toUpperCase()}</td>
              {BOLT_DIMS.map(b => (
                <td key={b.size} style={{ padding: '4px 3px', textAlign: 'center' }}>
                  <button onClick={() => setSize(b.size)}
                    style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      background: size === b.size ? '#8b5cf6' : 'transparent',
                      color: size === b.size ? '#fff' : '#475569',
                      border: `1px solid ${size === b.size ? '#8b5cf6' : '#e2e8f0'}` }}>
                    {b.size}
                  </button>
                </td>
              ))}
            </tr>
            <tr>
              <td style={{ padding: '6px 12px', fontSize: 11, fontWeight: 700, color: '#fff', background: '#6d28d9', whiteSpace: 'nowrap' }}>{t('std_ec3_tbl_bolt_class_col').toUpperCase()}</td>
              {BOLT_GRADES.map(g => (
                <td key={g} style={{ padding: '4px 3px', textAlign: 'center' }}>
                  <button onClick={() => setGrade(g)}
                    style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      background: grade === g ? '#6d28d9' : 'transparent',
                      color: grade === g ? '#fff' : '#475569',
                      border: `1px solid ${grade === g ? '#6d28d9' : '#e2e8f0'}` }}>
                    {g}
                  </button>
                </td>
              ))}
              {Array.from({ length: BOLT_DIMS.length - BOLT_GRADES.length }).map((_, i) => <td key={i} />)}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Heading */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, #4c1d95, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🔩</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#1e293b' }}>{size} — Grade {grade}</div>
          <div style={{ fontSize: 11, color: '#475569' }}>
            f<sub>yb</sub> = {mat.fyb} MPa · f<sub>ub</sub> = {mat.fub} MPa · γ<sub>M2</sub> = 1.25
          </div>
        </div>
      </div>

      {/* Cards + check panel */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10, flex: 1, minWidth: 260 }}>
          <Group title={`📐 ${t('std_ec3_bolt_grp_geometry')}`} color="#8b5cf6">
            <Row label={t('std_ec3_bolt_row_diam')} value={dim.d} unit="mm" />
            <Row label={<>Gross area A<sub>g</sub></>} value={dim.Ag} unit="mm²" />
            <Row label={<>Stress area A<sub>s</sub></>} value={dim.As} unit="mm²" />
          </Group>

          <Group title={`💪 ${t('std_ec3_bolt_grp_material')}`} color="#6d28d9">
            <Row label={<>f<sub>yb</sub></>} value={mat.fyb} unit="MPa" />
            <Row label={<>f<sub>ub</sub></>} value={mat.fub} unit="MPa" />
            <Row label={<>f<sub>yb</sub>/f<sub>ub</sub></>} value={(mat.fyb / mat.fub).toFixed(2)} />
          </Group>

          <Group title={`↕️ ${t('std_ec3_bolt_grp_tension')}`} color="#7c3aed">
            <Row label={<>F<sub>t,Rd</sub></>} value={ft?.toFixed(1) ?? '—'} unit="kN" note="k₂ = 0.9" />
          </Group>

          <Group title={`✂️ ${t('std_ec3_bolt_grp_shear')}`} color="#7c3aed">
            <Row label={<>F<sub>v,Rd</sub> (single)</>} value={fv?.toFixed(1) ?? '—'} unit="kN" note={t('std_ec3_bolt_row_threaded')} />
            <Row label={<>F<sub>v,Rd</sub> (double)</>} value={fv ? (fv * 2).toFixed(1) : '—'} unit="kN" />
          </Group>

          {bearing && (
            <Group title={`🔧 ${t('std_ec3_bolt_grp_bearing')}`} color="#7c3aed">
              <Row label="S235" value={bearing['S235']?.toFixed(2) ?? '—'} unit="kN/mm" />
              <Row label="S275" value={bearing['S275']?.toFixed(2) ?? '—'} unit="kN/mm" />
              <Row label="S355" value={bearing['S355']?.toFixed(2) ?? '—'} unit="kN/mm" />
            </Group>
          )}

          {hole && (
            <Group title={`⭕ ${t('std_ec3_bolt_grp_holes')}`} color="#64748b">
              <Row label={t('std_ec3_bolt_row_normal_d0')} value={hole.normal} unit="mm" />
              <Row label={t('std_ec3_bolt_row_over_d0')} value={hole.oversize} unit="mm" />
            </Group>
          )}

          {eMin && (
            <Group title={`📏 ${t('std_ec3_bolt_grp_edge_min')}`} color="#0891b2">
              <Row label={<>e<sub>1</sub></>} value={eMin.e1} unit="mm" note="= 1.2 d₀" />
              <Row label={<>e<sub>2</sub></>} value={eMin.e2} unit="mm" note="= 1.2 d₀" />
              <Row label={<>p<sub>1</sub></>} value={eMin.p1} unit="mm" note="= 2.2 d₀" />
              <Row label={<>p<sub>2</sub></>} value={eMin.p2} unit="mm" note="= 2.4 d₀" />
            </Group>
          )}

          {eMax && (
            <Group title={`📏 ${t('std_ec3_bolt_grp_edge_max')}`} color="#0e7490">
              <Row label={<>e<sub>1</sub></>} value={eMax.e1} unit="mm" note="= 3 d₀" />
              <Row label={<>e<sub>2</sub></>} value={eMax.e2} unit="mm" note="= 1.5 d₀" />
              <Row label={<>p<sub>1</sub></>} value={eMax.p1} unit="mm" note="= 3.75 d₀" />
              <Row label={<>p<sub>2</sub></>} value={eMax.p2} unit="mm" note="= 3 d₀" />
            </Group>
          )}
        </div>

        {/* Quick check panel */}
        <div style={{ width: 260, flexShrink: 0, borderRadius: 8, border: '2px solid #e2e8f0', overflow: 'hidden', background: '#fff' }}>
          <div style={{ background: '#1e293b', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>✅ {t('std_ec3_bolt_chk_title')}</span>
            <span style={{ fontSize: 10, color: '#64748b', marginLeft: 'auto' }}>{size} · {grade}</span>
          </div>
          <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { key: 'Ft', label: <span>F<sub>t,Ed</sub></span>, unit: 'kN', capacity: ft, minCheck: false },
              { key: 'Fv', label: <span>F<sub>v,Ed</sub></span>, unit: 'kN', capacity: fv, minCheck: false },
              { key: 'e1', label: <span>e<sub>1</sub></span>,    unit: 'mm', capacity: eMin?.e1, minCheck: true },
              { key: 'e2', label: <span>e<sub>2</sub></span>,    unit: 'mm', capacity: eMin?.e2, minCheck: true },
              { key: 'p1', label: <span>p<sub>1</sub></span>,    unit: 'mm', capacity: eMin?.p1, minCheck: true },
              { key: 'p2', label: <span>p<sub>2</sub></span>,    unit: 'mm', capacity: eMin?.p2, minCheck: true },
            ].map(({ key, label, unit, capacity, minCheck }) => {
              const v  = num(key)
              const ok = v === null || capacity === undefined ? null : minCheck ? v >= capacity : v <= capacity
              return (
                <div key={key}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, width: 36, flexShrink: 0, color: '#1e293b' }}>{label}</span>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input type="number" value={chk[key] ?? ''} onChange={e => set(key, e.target.value)}
                        placeholder="—"
                        style={{ width: '100%', padding: '4px 24px 4px 7px', borderRadius: 5, fontSize: 12,
                          border: `1.5px solid ${ok === null ? '#e2e8f0' : ok ? '#22c55e' : '#ef4444'}`,
                          outline: 'none', background: ok === null ? '#fff' : ok ? '#f0fdf4' : '#fef2f2',
                          boxSizing: 'border-box' as const }} />
                      <span style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: '#94a3b8' }}>{unit}</span>
                    </div>
                    <span style={{ fontSize: 14, width: 18, textAlign: 'center', flexShrink: 0 }}>
                      {ok === null ? '' : ok ? '✅' : '❌'}
                    </span>
                  </div>
                  {capacity !== undefined && (
                    <div style={{ fontSize: 10, color: '#475569', paddingLeft: 42 }}>
                      {minCheck ? `≥ ${capacity} mm (min)` : `≤ ${capacity?.toFixed(1)} kN`}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Interaction check */}
            {(() => {
              const vEd = num('Fv'), tEd = num('Ft')
              if (vEd === null || tEd === null || !fv || !ft) return null
              const ratio = (vEd / fv) + (tEd / (1.4 * ft))
              const ok = ratio <= 1.0
              return (
                <div style={{ marginTop: 2, padding: '6px 8px', borderRadius: 6, background: ok ? '#f0fdf4' : '#fef2f2', border: `1px solid ${ok ? '#86efac' : '#fca5a5'}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: ok ? '#15803d' : '#dc2626' }}>
                    {ok ? '✅' : '❌'} {t('std_ec3_bolt_chk_shear_ten')}
                  </div>
                  <div style={{ fontSize: 10, color: '#475569', marginTop: 1, fontFamily: 'ui-monospace, monospace' }}>
                    η = {ratio.toFixed(3)} {ok ? '≤ 1.0 ✓' : '> 1.0 ✗'}
                  </div>
                </div>
              )
            })()}

            <button onClick={() => setChk({})}
              style={{ padding: '4px', borderRadius: 5, background: 'none', border: '1px solid #e2e8f0', color: '#94a3b8', cursor: 'pointer', fontSize: 10 }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#cbd5e1')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#e2e8f0')}>
              {t('std_ec3_bolt_chk_clear')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function BoltData() {
  const { t } = useTranslation()
  const [active, setActive] = useState('summary')

  const SECTIONS = [
    { id: 'summary',    label: t('std_ec3_bolt_nav_summary'),    emoji: '🔩' },
    { id: 'material',   label: t('std_ec3_bolt_nav_material'),   emoji: '💪' },
    { id: 'dimensions', label: t('std_ec3_bolt_nav_dimensions'), emoji: '📐' },
    { id: 'tension',    label: t('std_ec3_bolt_nav_tension'),    emoji: '↕️'  },
    { id: 'shear',      label: t('std_ec3_bolt_nav_shear'),      emoji: '✂️'  },
    { id: 'bearing',    label: t('std_ec3_bolt_nav_bearing'),    emoji: '🔧' },
    { id: 'holes',      label: t('std_ec3_bolt_nav_holes'),      emoji: '⭕' },
    { id: 'edge',       label: t('std_ec3_bolt_nav_edge'),       emoji: '📏' },
    { id: 'formulas',   label: t('std_ec3_bolt_nav_formulas'),   emoji: '📖' },
  ]

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Section sidenav */}
      <div style={{ width: 180, flexShrink: 0, background: '#fff', borderRight: '1px solid #e2e8f0', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '10px 12px 6px', fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>EN 1993-1-8</div>
        {SECTIONS.map(sec => (
          <button key={sec.id} onClick={() => setActive(sec.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 12px',
              background: active === sec.id ? '#f5f3ff' : 'transparent',
              border: 'none', borderLeft: `3px solid ${active === sec.id ? '#8b5cf6' : 'transparent'}`,
              borderBottom: '1px solid #f1f5f9', cursor: 'pointer', textAlign: 'left', flexShrink: 0 }}
            onMouseEnter={e => { if (active !== sec.id) e.currentTarget.style.background = '#f8fafc' }}
            onMouseLeave={e => { if (active !== sec.id) e.currentTarget.style.background = 'transparent' }}>
            <span style={{ fontSize: 14 }}>{sec.emoji}</span>
            <span style={{ fontSize: 11, fontWeight: active === sec.id ? 700 : 500, color: active === sec.id ? '#6d28d9' : '#1e293b' }}>{sec.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', minWidth: 0 }}>
        {active === 'summary'    && <BoltSummary />}
        {active === 'material'   && <MaterialProps />}
        {active === 'dimensions' && <BoltDimensions />}
        {active === 'tension'    && <ResistanceGrid title={t('std_ec3_bolt_tension_title')} subtitle={t('std_ec3_bolt_tension_sub')} formula="Ft,Rd = k₂ · fub · As / γM2  (k₂ = 0.9)" data={TENSION_RD} unit="kN" note={t('std_ec3_bolt_tension_note')} />}
        {active === 'shear'      && <ResistanceGrid title={t('std_ec3_bolt_shear_title')} subtitle={t('std_ec3_bolt_shear_sub')} formula="Fv,Rd = αv · fub · As / γM2" data={SHEAR_RD} unit="kN" note={t('std_ec3_bolt_tension_note')} />}
        {active === 'bearing'    && <BearingTable />}
        {active === 'holes'      && <HoleDimensions />}
        {active === 'edge'       && <EdgeDistances />}
        {active === 'formulas'   && <DesignFormulas />}
      </div>
    </div>
  )
}
