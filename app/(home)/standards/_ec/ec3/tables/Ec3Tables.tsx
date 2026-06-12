'use client'
import { useTranslation } from '@/app/i18n/LanguageContext'
import { Table, TR, SectionHeader } from '@/app/(home)/standards/_lib/ui'
import { TH, TD, TDN } from '../../../_lib/ui-styles'

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

const HOLE_DIMS = [
  { size: 'M12', normal: 13, oversize: 15, shortSlot: '16×13', longSlot: '30×13' },
  { size: 'M16', normal: 18, oversize: 20, shortSlot: '22×18', longSlot: '40×18' },
  { size: 'M20', normal: 22, oversize: 24, shortSlot: '26×22', longSlot: '50×22' },
  { size: 'M24', normal: 26, oversize: 30, shortSlot: '32×26', longSlot: '60×26' },
  { size: 'M30', normal: 33, oversize: 38, shortSlot: '40×33', longSlot: '75×33' },
  { size: 'M36', normal: 39, oversize: 45, shortSlot: '46×39', longSlot: '90×39' },
]

const EDGE_MIN = [
  { size: 'M12', e1: 16, e2: 16, p1: 29, p2: 32, e1os: 18, e2os: 18, p1os: 33, p2os: 36 },
  { size: 'M14', e1: 18, e2: 18, p1: 33, p2: 36, e1os: 21, e2os: 21, p1os: 38, p2os: 41 },
  { size: 'M16', e1: 22, e2: 22, p1: 40, p2: 44, e1os: 24, e2os: 24, p1os: 44, p2os: 48 },
  { size: 'M18', e1: 24, e2: 24, p1: 44, p2: 48, e1os: 27, e2os: 27, p1os: 49, p2os: 53 },
  { size: 'M20', e1: 27, e2: 27, p1: 49, p2: 53, e1os: 29, e2os: 29, p1os: 53, p2os: 58 },
  { size: 'M22', e1: 29, e2: 29, p1: 53, p2: 58, e1os: 32, e2os: 32, p1os: 58, p2os: 63 },
  { size: 'M24', e1: 32, e2: 32, p1: 58, p2: 63, e1os: 36, e2os: 36, p1os: 66, p2os: 72 },
  { size: 'M27', e1: 36, e2: 36, p1: 66, p2: 72, e1os: 42, e2os: 42, p1os: 77, p2os: 84 },
  { size: 'M30', e1: 40, e2: 40, p1: 73, p2: 80, e1os: 46, e2os: 46, p1os: 84, p2os: 92 },
  { size: 'M33', e1: 44, e2: 44, p1: 80, p2: 87, e1os: 50, e2os: 50, p1os: 91, p2os: 99 },
  { size: 'M36', e1: 47, e2: 47, p1: 86, p2: 94, e1os: 53, e2os: 53, p1os: 97, p2os: 106 },
]

// ── Exported table components ─────────────────────────────────────────────────

export function BoltStrengthClassesTable() {
  const { t } = useTranslation()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SectionHeader title={t('std_ec3_tbl_bolt_strength_title')} subtitle="EN 1993-1-8 Table 3.1 — Nominal values of yield and ultimate tensile strength for bolts" />
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
      <div style={{ fontSize: 11, color: '#64748b' }}>γ<sub>M2</sub> = 1.25 (recommended partial safety factor, EN 1993-1-8)</div>
    </div>
  )
}

export function BoltDimensionsTable() {
  const { t } = useTranslation()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SectionHeader title={t('std_ec3_tbl_bolt_dims_title')} subtitle="Nominal diameter, gross area and tensile stress area" />
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

export function HoleDimensionsTable() {
  const { t } = useTranslation()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SectionHeader title={t('std_ec3_tbl_hole_dims_title')} subtitle="EN 1993-1-8 Table 3.3 — Recommended clearance hole sizes" />
      <Table>
        <thead><tr>
          <th style={{ ...TH, textAlign: 'left' }}>{t('std_ec3_tbl_bolt_size_col')}</th>
          <th style={TH}>{t('std_ec3_tbl_normal_col')}</th>
          <th style={TH}>{t('std_ec3_tbl_oversize_col')}</th>
          <th style={TH}>{t('std_ec3_tbl_short_slot_col')}</th>
          <th style={TH}>{t('std_ec3_tbl_long_slot_col')}</th>
        </tr></thead>
        <tbody>
          {HOLE_DIMS.map((h, i) => (
            <TR key={h.size} stripe={i % 2 !== 0}>
              <td style={{ ...TD, fontWeight: 700, color: '#8b5cf6', textAlign: 'left' }}>{h.size}</td>
              <td style={TDN}>{h.normal}</td>
              <td style={TDN}>{h.oversize}</td>
              <td style={{ ...TD }}>{h.shortSlot}</td>
              <td style={{ ...TD }}>{h.longSlot}</td>
            </TR>
          ))}
        </tbody>
      </Table>
    </div>
  )
}

export function EdgeDistancesMinTable() {
  const { t } = useTranslation()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <SectionHeader title={t('std_ec3_tbl_edge_dist_title')} subtitle="EN 1993-1-8 Table 3.3 — e₁=1.2d₀, e₂=1.2d₀, p₁=2.2d₀, p₂=2.4d₀" />
      <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid #e2e8f0', display: 'inline-block', maxWidth: '100%' }}>
        <table style={{ borderCollapse: 'collapse', width: 'max-content' }}>
          <thead>
            <tr>
              <th style={TH} rowSpan={2}>{t('std_ec3_tbl_size_col')}</th>
              <th colSpan={4} style={{ ...TH, background: '#eff6ff', color: '#1d4ed8', borderLeft: '2px solid #e2e8f0' }}>{t('std_ec3_tbl_normal_holes')}</th>
              <th colSpan={4} style={{ ...TH, background: '#f0fdf4', color: '#15803d', borderLeft: '2px solid #e2e8f0' }}>{t('std_ec3_tbl_oversize_holes')}</th>
            </tr>
            <tr>
              {[
                { label: 'e₁', bg: '#eff6ff' }, { label: 'e₂', bg: '#eff6ff' }, { label: 'p₁', bg: '#eff6ff' }, { label: 'p₂', bg: '#eff6ff' },
                { label: 'e₁', bg: '#f0fdf4' }, { label: 'e₂', bg: '#f0fdf4' }, { label: 'p₁', bg: '#f0fdf4' }, { label: 'p₂', bg: '#f0fdf4' },
              ].map((col, ci) => (
                <th key={ci} style={{ ...TH, background: col.bg, borderLeft: ci === 4 ? '2px solid #e2e8f0' : undefined }}>
                  {col.label}
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
              </TR>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
