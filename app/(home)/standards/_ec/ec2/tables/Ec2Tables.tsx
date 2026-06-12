'use client'
import { useTranslation } from '@/app/i18n/LanguageContext'
import { Table, TR, SectionHeader } from '@/app/(home)/standards/_lib/ui'
import { TH, TD, TDN, TDL } from '../../../_lib/ui-styles'
import { EditableText } from '../../_shared/admin/EditableText'

type AdminProps<T> = {
  editMode?: boolean
  rows?: T[]
  onRowChange?: (idx: number, field: keyof T, value: string) => void
}

// ── 1. Concrete design properties ─────────────────────────────────────────────
// Source: EN 1992-1-1 Table 3.1 + §3.1, γC = 1.50, fyk = 500 MPa
export const CONCRETE_GRADES: { grade: string; fck: number; fck_cube: number; fcm: number; fctm: number; fctd: number; Ecm: number; fcd_100: number; fcd_085: number; rho_min: number; rw_min: number }[] = [
  { grade: 'C12/15',  fck: 12, fck_cube: 15,  fcm: 20, fctm: 1.57, fctd: 0.73, Ecm: 27085, fcd_100: 8.00,  fcd_085: 6.80,  rho_min: 0.130, rw_min: 0.055 },
  { grade: 'C16/20',  fck: 16, fck_cube: 20,  fcm: 24, fctm: 1.90, fctd: 0.89, Ecm: 28608, fcd_100: 10.67, fcd_085: 9.07,  rho_min: 0.130, rw_min: 0.064 },
  { grade: 'C20/25',  fck: 20, fck_cube: 25,  fcm: 28, fctm: 2.21, fctd: 1.03, Ecm: 29962, fcd_100: 13.33, fcd_085: 11.33, rho_min: 0.130, rw_min: 0.072 },
  { grade: 'C25/30',  fck: 25, fck_cube: 30,  fcm: 33, fctm: 2.56, fctd: 1.20, Ecm: 31476, fcd_100: 16.67, fcd_085: 14.17, rho_min: 0.133, rw_min: 0.080 },
  { grade: 'C30/37',  fck: 30, fck_cube: 37,  fcm: 38, fctm: 2.90, fctd: 1.35, Ecm: 32837, fcd_100: 20.00, fcd_085: 17.00, rho_min: 0.151, rw_min: 0.088 },
  { grade: 'C35/45',  fck: 35, fck_cube: 45,  fcm: 43, fctm: 3.21, fctd: 1.50, Ecm: 34077, fcd_100: 23.33, fcd_085: 19.83, rho_min: 0.167, rw_min: 0.095 },
  { grade: 'C40/50',  fck: 40, fck_cube: 50,  fcm: 48, fctm: 3.51, fctd: 1.64, Ecm: 35220, fcd_100: 26.67, fcd_085: 22.67, rho_min: 0.182, rw_min: 0.101 },
  { grade: 'C45/55',  fck: 45, fck_cube: 55,  fcm: 53, fctm: 3.80, fctd: 1.77, Ecm: 36283, fcd_100: 30.00, fcd_085: 25.50, rho_min: 0.197, rw_min: 0.107 },
  { grade: 'C50/60',  fck: 50, fck_cube: 60,  fcm: 58, fctm: 4.07, fctd: 1.90, Ecm: 37278, fcd_100: 33.33, fcd_085: 28.33, rho_min: 0.212, rw_min: 0.113 },
  { grade: 'C55/67',  fck: 55, fck_cube: 67,  fcm: 63, fctm: 4.21, fctd: 1.97, Ecm: 38214, fcd_100: 36.67, fcd_085: 31.17, rho_min: 0.219, rw_min: 0.119 },
  { grade: 'C60/75',  fck: 60, fck_cube: 75,  fcm: 68, fctm: 4.35, fctd: 2.03, Ecm: 39100, fcd_100: 40.00, fcd_085: 34.00, rho_min: 0.226, rw_min: 0.124 },
  { grade: 'C70/85',  fck: 70, fck_cube: 85,  fcm: 78, fctm: 4.61, fctd: 2.15, Ecm: 40743, fcd_100: 46.67, fcd_085: 39.67, rho_min: 0.240, rw_min: 0.134 },
  { grade: 'C80/95',  fck: 80, fck_cube: 95,  fcm: 88, fctm: 4.84, fctd: 2.26, Ecm: 42244, fcd_100: 53.33, fcd_085: 45.33, rho_min: 0.252, rw_min: 0.143 },
  { grade: 'C90/105', fck: 90, fck_cube: 105, fcm: 98, fctm: 5.04, fctd: 2.35, Ecm: 43631, fcd_100: 60.00, fcd_085: 51.00, rho_min: 0.262, rw_min: 0.152 },
]

// Derived: fctk,0.05 = 0.7·fctm ; fctk,0.95 = 1.3·fctm (EN 1992-1-1 §3.1.2)
function fctk05(fctm: number) { return +(0.7 * fctm).toFixed(2) }
function fctk95(fctm: number) { return +(1.3 * fctm).toFixed(2) }

type ConcreteGrade = typeof CONCRETE_GRADES[0]

export function ConcretePropertiesTable({ editMode = false, rows = CONCRETE_GRADES, onRowChange }: AdminProps<ConcreteGrade> = {}) {
  const { t } = useTranslation()
  function cell(idx: number, field: keyof ConcreteGrade, display: string, style: React.CSSProperties) {
    return (
      <EditableText value={display} editMode={editMode}
        onCommit={v => onRowChange?.(idx, field, v)}
        style={style} />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHeader
        title={t('std_ec2_tbl_concrete_title')}
        subtitle="EN 1992-1-1 Table 3.1 · γC = 1.50 · fyk = 500 MPa"
      />

      {/* Main strength table */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('std_ec2_tbl_strength_props')}</div>
        <div style={{ overflowX: 'auto' }}>
          <Table>
            <thead>
              <tr>
                <th style={{ ...TH, textAlign: 'left', minWidth: 90 }}>{t('std_ec2_tbl_grade')}</th>
                <th style={TH}>f<sub>ck</sub><br /><span style={{ fontSize: 10, fontWeight: 400 }}>(MPa)</span></th>
                <th style={TH}>f<sub>ck,cube</sub><br /><span style={{ fontSize: 10, fontWeight: 400 }}>(MPa)</span></th>
                <th style={TH}>f<sub>cm</sub><br /><span style={{ fontSize: 10, fontWeight: 400 }}>(MPa)</span></th>
                <th style={TH}>f<sub>ctm</sub><br /><span style={{ fontSize: 10, fontWeight: 400 }}>(MPa)</span></th>
                <th style={TH}>f<sub>ctk,0.05</sub><br /><span style={{ fontSize: 10, fontWeight: 400 }}>(MPa)</span></th>
                <th style={TH}>f<sub>ctk,0.95</sub><br /><span style={{ fontSize: 10, fontWeight: 400 }}>(MPa)</span></th>
                <th style={TH}>f<sub>ctd</sub><br /><span style={{ fontSize: 10, fontWeight: 400 }}>α<sub>ct</sub>=1.0 (MPa)</span></th>
                <th style={TH}>E<sub>cm</sub><br /><span style={{ fontSize: 10, fontWeight: 400 }}>(MPa)</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((g, i) => (
                <TR key={g.grade} stripe={i % 2 !== 0}>
                  <td style={{ ...TD, fontWeight: 700, color: '#10b981', textAlign: 'left' }}>{cell(i, 'grade', g.grade, { fontWeight: 700, color: '#10b981' })}</td>
                  <td style={TDN}>{cell(i, 'fck', String(g.fck), { color: TDN.color })}</td>
                  <td style={TDN}>{cell(i, 'fck_cube', String(g.fck_cube), { color: TDN.color })}</td>
                  <td style={TDN}>{cell(i, 'fcm', String(g.fcm), { color: TDN.color })}</td>
                  <td style={TDN}>{cell(i, 'fctm', g.fctm.toFixed(2), { color: TDN.color })}</td>
                  <td style={TDN}><span style={{ color: '#94a3b8', fontSize: 11 }}>{fctk05(g.fctm).toFixed(2)}</span></td>
                  <td style={TDN}><span style={{ color: '#94a3b8', fontSize: 11 }}>{fctk95(g.fctm).toFixed(2)}</span></td>
                  <td style={TDN}>{cell(i, 'fctd', g.fctd.toFixed(2), { color: TDN.color })}</td>
                  <td style={TDN}>{cell(i, 'Ecm', String(g.Ecm), { color: TDN.color })}</td>
                </TR>
              ))}
            </tbody>
          </Table>
        </div>
      </div>

      {/* Design values table */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('std_ec2_tbl_design_strength_header')}</div>
        <div style={{ overflowX: 'auto' }}>
          <Table>
            <thead>
              <tr>
                <th style={{ ...TH, textAlign: 'left', minWidth: 90 }}>{t('std_ec2_tbl_grade')}</th>
                <th style={TH}>f<sub>cd</sub> α<sub>cc</sub>=1.00<br /><span style={{ fontSize: 10, fontWeight: 400 }}>(MPa)</span></th>
                <th style={TH}>f<sub>cd</sub> α<sub>cc</sub>=0.85<br /><span style={{ fontSize: 10, fontWeight: 400 }}>(MPa)</span></th>
                <th style={TH}>ρ<sub>min</sub><br /><span style={{ fontSize: 10, fontWeight: 400 }}>(%)</span></th>
                <th style={TH}>ρ<sub>w,min</sub><br /><span style={{ fontSize: 10, fontWeight: 400 }}>(%)</span></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((g, i) => (
                <TR key={g.grade} stripe={i % 2 !== 0}>
                  <td style={{ ...TD, fontWeight: 700, color: '#10b981', textAlign: 'left' }}>{cell(i, 'grade', g.grade, { fontWeight: 700, color: '#10b981' })}</td>
                  <td style={TDN}>{cell(i, 'fcd_100', g.fcd_100.toFixed(2), { color: TDN.color })}</td>
                  <td style={TDN}>{cell(i, 'fcd_085', g.fcd_085.toFixed(2), { color: TDN.color })}</td>
                  <td style={TDN}>{cell(i, 'rho_min', g.rho_min.toFixed(3), { color: TDN.color })}</td>
                  <td style={TDN}>{cell(i, 'rw_min', g.rw_min.toFixed(3), { color: TDN.color })}</td>
                </TR>
              ))}
            </tbody>
          </Table>
        </div>
      </div>

      {/* Notes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#166534' }}>
          <strong>{t('std_ec2_tbl_formulas_title')} (EN 1992-1-1 §3.1.2, §3.1.6)</strong>
          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3, fontFamily: 'ui-monospace, monospace' }}>
            <span>f<sub>cm</sub> = f<sub>ck</sub> + 8 MPa</span>
            <span>f<sub>ctm</sub> = 0.30 · f<sub>ck</sub><sup>2/3</sup> for ≤ C50/60 · f<sub>ctm</sub> = 2.12 · ln(1 + f<sub>cm</sub>/10) for &gt; C50/60</span>
            <span>f<sub>ctk,0.05</sub> = 0.7 · f<sub>ctm</sub> · f<sub>ctk,0.95</sub> = 1.3 · f<sub>ctm</sub></span>
            <span>f<sub>ctd</sub> = α<sub>ct</sub> · f<sub>ctk,0.05</sub> / γ<sub>C</sub> (γ<sub>C</sub> = 1.50)</span>
            <span>E<sub>cm</sub> = 22000 · (f<sub>cm</sub>/10)<sup>0.3</sup> MPa</span>
            <span>f<sub>cd</sub> = α<sub>cc</sub> · f<sub>ck</sub> / γ<sub>C</sub></span>
          </div>
        </div>
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#92400e' }}>
          <strong>{t('std_ec2_tbl_min_rein_title')} (EN 1992-1-1 §9.2.1.1, §9.2.2)</strong>
          <div style={{ marginTop: 4, fontFamily: 'ui-monospace, monospace' }}>
            ρ<sub>min</sub> = max(0.26 · f<sub>ctm</sub> / f<sub>yk</sub> , 0.0013) · b<sub>t</sub> · d &nbsp;|&nbsp; ρ<sub>w,min</sub> = (0.08 · √f<sub>ck</sub>) / f<sub>yk</sub>
          </div>
        </div>
        <div style={{ fontSize: 11, color: '#64748b' }}>{t('std_ec2_tbl_general_props')}</div>
      </div>
    </div>
  )
}

// ── 2. Anchorage & lap length ──────────────────────────────────────────────────
// Source: EN 1992-1-1 §8.4.4, §8.7.3 · γC = 1.50 · fyk = 500 MPa · Φ ≤ 32 mm
// α₁=0.7 bent (cd>3Φ), α₁=1.0 straight; α₆=1.5 (>50% lapped in one section)
// All values expressed as multiples of bar diameter Φ

export const ANCHORAGE_DATA: { grade: string; g_str: number; g_bent: number; p_str: number; p_bent: number }[] = [
  { grade: 'C12/15',   g_str: 66, g_bent: 47, p_str: 95,  p_bent: 66 },
  { grade: 'C16/20',   g_str: 55, g_bent: 39, p_str: 78,  p_bent: 55 },
  { grade: 'C20/25',   g_str: 47, g_bent: 33, p_str: 67,  p_bent: 47 },
  { grade: 'C25/30',   g_str: 41, g_bent: 29, p_str: 58,  p_bent: 41 },
  { grade: 'C30/37',   g_str: 36, g_bent: 26, p_str: 52,  p_bent: 36 },
  { grade: 'C35/45',   g_str: 33, g_bent: 23, p_str: 47,  p_bent: 33 },
  { grade: 'C40/50',   g_str: 30, g_bent: 21, p_str: 43,  p_bent: 30 },
  { grade: 'C45/55',   g_str: 28, g_bent: 20, p_str: 39,  p_bent: 28 },
  { grade: 'C50/60',   g_str: 26, g_bent: 18, p_str: 37,  p_bent: 26 },
  { grade: 'C55/67',   g_str: 25, g_bent: 18, p_str: 36,  p_bent: 25 },
  { grade: '≥C60/75',  g_str: 24, g_bent: 17, p_str: 34,  p_bent: 24 },
]

export const LAP_DATA: { grade: string; g_str: number; g_bent: number; p_str: number; p_bent: number }[] = [
  { grade: 'C12/15',   g_str: 99,  g_bent: 70, p_str: 142, p_bent: 99  },
  { grade: 'C16/20',   g_str: 82,  g_bent: 58, p_str: 117, p_bent: 82  },
  { grade: 'C20/25',   g_str: 71,  g_bent: 50, p_str: 101, p_bent: 71  },
  { grade: 'C25/30',   g_str: 61,  g_bent: 43, p_str: 87,  p_bent: 61  },
  { grade: 'C30/37',   g_str: 54,  g_bent: 38, p_str: 77,  p_bent: 54  },
  { grade: 'C35/45',   g_str: 49,  g_bent: 34, p_str: 70,  p_bent: 49  },
  { grade: 'C40/50',   g_str: 45,  g_bent: 31, p_str: 64,  p_bent: 45  },
  { grade: 'C45/55',   g_str: 41,  g_bent: 29, p_str: 59,  p_bent: 41  },
  { grade: 'C50/60',   g_str: 39,  g_bent: 27, p_str: 55,  p_bent: 39  },
  { grade: 'C55/67',   g_str: 37,  g_bent: 26, p_str: 53,  p_bent: 37  },
  { grade: '≥C60/75',  g_str: 36,  g_bent: 25, p_str: 51,  p_bent: 36  },
]

const ALPHA_COEFFS = [
  { alpha: 'α₁', desc: 'Bar shape effect', values: '1.0 straight / bent in compression · 0.7 bent in tension (c_d > 3Φ)' },
  { alpha: 'α₂', desc: 'Concrete cover effect', values: '0.7 ≤ α₂ ≤ 1.0 · α₂ = 1 − 0.15(c_d − Φ)/Φ' },
  { alpha: 'α₃', desc: 'Transverse reinforcement confinement', values: '0.7 ≤ α₃ ≤ 1.0 · α₃ = 1 − Kλ' },
  { alpha: 'α₄', desc: 'Welded transverse reinforcement', values: '0.7 if requirements met, else 1.0' },
  { alpha: 'α₅', desc: 'Transverse pressure effect', values: '0.7 ≤ α₅ ≤ 1.0 · α₅ = 1 − 0.04p' },
  { alpha: 'α₆', desc: 'Lapped bars — percentage lapped in one section', values: '(ρₗ/25)^0.5 · 1.0 ≤ α₆ ≤ 1.5 · α₆ = 1.5 if > 50% lapped' },
]

type AnchorageRow = typeof ANCHORAGE_DATA[0]

export function AnchorageLapTable({ editMode = false, rows = ANCHORAGE_DATA, lapRows = LAP_DATA, onRowChange, onLapRowChange }: AdminProps<AnchorageRow> & { lapRows?: typeof LAP_DATA; onLapRowChange?: (idx: number, field: keyof AnchorageRow, value: string) => void } = {}) {
  const { t } = useTranslation()
  function cell(idx: number, field: keyof AnchorageRow, display: string, style: React.CSSProperties, onChg?: typeof onRowChange) {
    return <EditableText value={display} editMode={editMode} onCommit={v => onChg?.(idx, field, v)} style={style} />
  }

  const colH = (label: string) => (
    <th style={{ ...TH, textAlign: 'center', minWidth: 110 }}>
      <div>{label}</div>
    </th>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHeader
        title={t('std_ec2_tbl_anchorage_title')}
        subtitle="EN 1992-1-1 §8.4.4, §8.7.3 · γC = 1.50 · fyk = 500 MPa · ribbed bars Φ ≤ 32 mm"
      />

      {/* Bond condition note */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#166534' }}>
          <strong>{t('std_ec2_tbl_good_bond')}</strong>
          <ul style={{ margin: '4px 0 0 0', paddingLeft: 16, lineHeight: 1.7 }}>
            <li>{t('std_ec2_tbl_good_bond_1')}</li>
            <li>{t('std_ec2_tbl_good_bond_2')}</li>
            <li>{t('std_ec2_tbl_good_bond_3')}</li>
          </ul>
        </div>
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#9a3412' }}>
          <strong>{t('std_ec2_tbl_poor_bond')}</strong>
          <ul style={{ margin: '4px 0 0 0', paddingLeft: 16, lineHeight: 1.7 }}>
            <li>{t('std_ec2_tbl_poor_bond_1')}</li>
            <li>{t('std_ec2_tbl_poor_bond_2')}</li>
          </ul>
        </div>
      </div>

      {/* Anchorage table */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {t('std_ec2_tbl_anchorage_len_header')}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <Table>
            <thead>
              <tr>
                <th style={{ ...TH, textAlign: 'left', minWidth: 90 }} rowSpan={2}>{t('std_ec2_tbl_concrete_col')}</th>
                <th style={{ ...TH, borderBottom: '1px solid #e2e8f0' }} colSpan={2}>{t('std_ec2_tbl_good_bond_short')}</th>
                <th style={{ ...TH, borderBottom: '1px solid #e2e8f0' }} colSpan={2}>{t('std_ec2_tbl_poor_bond_short')}</th>
              </tr>
              <tr>
                {colH(t('std_ec2_tbl_straight_comp'))}
                {colH(t('std_ec2_tbl_bent_bars'))}
                {colH(t('std_ec2_tbl_straight_comp'))}
                {colH(t('std_ec2_tbl_bent_bars'))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <TR key={r.grade} stripe={i % 2 !== 0}>
                  <td style={{ ...TD, fontWeight: 700, color: '#10b981', textAlign: 'left' }}>{cell(i, 'grade', r.grade, { fontWeight: 700, color: '#10b981' }, onRowChange)}</td>
                  <td style={{ ...TDN, color: '#1d4ed8' }}>{cell(i, 'g_str', String(r.g_str), { color: '#1d4ed8' }, onRowChange)}Φ</td>
                  <td style={{ ...TDN, color: '#1d4ed8' }}>{cell(i, 'g_bent', String(r.g_bent), { color: '#1d4ed8' }, onRowChange)}Φ</td>
                  <td style={{ ...TDN, color: '#dc2626' }}>{cell(i, 'p_str', String(r.p_str), { color: '#dc2626' }, onRowChange)}Φ</td>
                  <td style={{ ...TDN, color: '#dc2626' }}>{cell(i, 'p_bent', String(r.p_bent), { color: '#dc2626' }, onRowChange)}Φ</td>
                </TR>
              ))}
            </tbody>
          </Table>
        </div>
      </div>

      {/* Lap table */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {t('std_ec2_tbl_lap_len_header')} &nbsp;<span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(α₆ = 1.5 — &gt;50% bars lapped in one section)</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <Table>
            <thead>
              <tr>
                <th style={{ ...TH, textAlign: 'left', minWidth: 90 }} rowSpan={2}>{t('std_ec2_tbl_concrete_col')}</th>
                <th style={{ ...TH, borderBottom: '1px solid #e2e8f0' }} colSpan={2}>{t('std_ec2_tbl_good_bond_short')}</th>
                <th style={{ ...TH, borderBottom: '1px solid #e2e8f0' }} colSpan={2}>{t('std_ec2_tbl_poor_bond_short')}</th>
              </tr>
              <tr>
                {colH(t('std_ec2_tbl_straight_comp'))}
                {colH(t('std_ec2_tbl_bent_bars'))}
                {colH(t('std_ec2_tbl_straight_comp'))}
                {colH(t('std_ec2_tbl_bent_bars'))}
              </tr>
            </thead>
            <tbody>
              {lapRows.map((r, i) => (
                <TR key={r.grade} stripe={i % 2 !== 0}>
                  <td style={{ ...TD, fontWeight: 700, color: '#10b981', textAlign: 'left' }}>{cell(i, 'grade', r.grade, { fontWeight: 700, color: '#10b981' }, onLapRowChange)}</td>
                  <td style={{ ...TDN, color: '#1d4ed8' }}>{cell(i, 'g_str', String(r.g_str), { color: '#1d4ed8' }, onLapRowChange)}Φ</td>
                  <td style={{ ...TDN, color: '#1d4ed8' }}>{cell(i, 'g_bent', String(r.g_bent), { color: '#1d4ed8' }, onLapRowChange)}Φ</td>
                  <td style={{ ...TDN, color: '#dc2626' }}>{cell(i, 'p_str', String(r.p_str), { color: '#dc2626' }, onLapRowChange)}Φ</td>
                  <td style={{ ...TDN, color: '#dc2626' }}>{cell(i, 'p_bent', String(r.p_bent), { color: '#dc2626' }, onLapRowChange)}Φ</td>
                </TR>
              ))}
            </tbody>
          </Table>
        </div>
      </div>

      {/* Formulas */}
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 14px', fontSize: 12, color: '#166534' }}>
        <strong>{t('std_ec2_tbl_key_formulas')}</strong>
        <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3, fontFamily: 'ui-monospace, monospace' }}>
          <span>f<sub>bd</sub> = 2.25 · η₁ · η₂ · f<sub>ctd</sub> &nbsp;&nbsp; (ultimate bond stress)</span>
          <span>l<sub>b,rqd</sub> = (Φ/4) · (σ<sub>sd</sub> / f<sub>bd</sub>) &nbsp;&nbsp; (basic anchorage length)</span>
          <span>l<sub>bd</sub> = α₁ · α₂ · α₃ · α₄ · α₅ · l<sub>b,rqd</sub> ≥ l<sub>b,min</sub></span>
          <span>l₀ = α₁ · α₂ · α₃ · α₅ · α₆ · l<sub>b,rqd</sub> ≥ l<sub>0,min</sub></span>
          <span>η₂ = min(1.0, (132 − Φ)/100) &nbsp;&nbsp; bar diameter reduction factor</span>
          <span>(α₂ · α₃ · α₅) ≥ 0.7 &nbsp;&nbsp; lower limit constraint</span>
        </div>
      </div>

      {/* Minimum lengths */}
      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#92400e' }}>
        <strong>{t('std_ec2_tbl_min_lengths')}</strong>
        <div style={{ marginTop: 4, fontFamily: 'ui-monospace, monospace', lineHeight: 1.8 }}>
          <div>{t('std_ec2_tbl_min_tension')}</div>
          <div>{t('std_ec2_tbl_min_compression')}</div>
          <div>{t('std_ec2_tbl_min_lap')}</div>
        </div>
      </div>

      {/* Alpha table */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('std_ec2_tbl_alpha_coeff')}</div>
        <Table>
          <thead>
            <tr>
              <th style={{ ...TH, textAlign: 'center', minWidth: 48 }}>{t('std_ec2_tbl_coeff_col')}</th>
              <th style={{ ...TH, textAlign: 'left' }}>{t('std_ec2_tbl_application_col')}</th>
              <th style={{ ...TH, textAlign: 'left', minWidth: 320 }}>{t('std_ec2_tbl_values_col')}</th>
            </tr>
          </thead>
          <tbody>
            {ALPHA_COEFFS.map((r, i) => (
              <TR key={r.alpha} stripe={i % 2 !== 0}>
                <td style={{ ...TD, fontWeight: 700, color: '#10b981' }}>{r.alpha}</td>
                <td style={TDL}>{r.desc}</td>
                <td style={{ ...TDL, fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>{r.values}</td>
              </TR>
            ))}
          </tbody>
        </Table>
      </div>

      {/* Lap detailing */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#475569' }}>
        <strong style={{ color: '#1e293b' }}>{t('std_ec2_tbl_lap_detail_title')}</strong>
        <ul style={{ margin: '6px 0 0 0', paddingLeft: 16, lineHeight: 1.8 }}>
          <li>{t('std_ec2_tbl_lap_detail_1')}</li>
          <li>{t('std_ec2_tbl_lap_detail_2')}</li>
          <li>{t('std_ec2_tbl_lap_detail_3')}</li>
          <li>{t('std_ec2_tbl_lap_detail_4')}</li>
          <li>{t('std_ec2_tbl_lap_detail_5')}</li>
        </ul>
      </div>
    </div>
  )
}

// ── 3. Reinforcement quantity table ────────────────────────────────────────────
// Source: EN 1992-1-1 · computed from As = π·Φ²/4
// Bar diameters available in Europe; spacings per standard practice

const DIAMETERS = [6, 8, 10, 12, 14, 16, 20, 25, 32] // mm
const SPACINGS  = [75, 100, 125, 150, 175, 200, 225, 250, 300] // mm

// As (mm²) for a single bar
function barArea(d: number) { return Math.PI * d * d / 4 }

// As per metre (cm²/m) for given diameter and spacing
function asPerm(d: number, s: number) {
  return +(barArea(d) / s * 1000 / 100).toFixed(2)  // mm² / mm * 1000mm/m / 100 = cm²/m
}

// Weight per m² (kg/m²) for distributed reinforcement
function wtPerm2(d: number, s: number) {
  return +(barArea(d) * 7850e-6 / s * 1000).toFixed(2)  // g/mm * mm/s * ...
}

// Area of n individual bars (cm²)
function nBarArea(d: number, n: number) {
  return +(barArea(d) * n / 100).toFixed(2)
}

// Weight of n individual bars per metre (kg/m)
function nBarWeight(d: number, n: number) {
  return +(barArea(d) * n * 7850e-6).toFixed(3)
}

const BAR_COUNTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export function ReinforcementQuantityTable() {
  const { t } = useTranslation()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SectionHeader
        title={t('std_ec2_tbl_rebar_title')}
        subtitle="EN 1992-1-1 · As = π·Φ²/4 · ρsteel = 7850 kg/m³ · max spacing 300 mm · min clear spacing max(Φ, 20 mm)"
      />

      {/* Area distributed */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {t('std_ec2_tbl_dist_area_header')}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <Table>
            <thead>
              <tr>
                <th style={{ ...TH, textAlign: 'left', minWidth: 80 }}>{t('std_ec2_tbl_spacing_col')}</th>
                {DIAMETERS.map(d => (
                  <th key={d} style={TH}>Φ{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SPACINGS.map((s, i) => (
                <TR key={s} stripe={i % 2 !== 0}>
                  <td style={{ ...TD, fontWeight: 700, color: '#10b981', textAlign: 'left' }}>{s}</td>
                  {DIAMETERS.map(d => (
                    <td key={d} style={TDN}>{asPerm(d, s).toFixed(2)}</td>
                  ))}
                </TR>
              ))}
            </tbody>
          </Table>
        </div>
      </div>

      {/* Weight distributed */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {t('std_ec2_tbl_dist_weight_header')}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <Table>
            <thead>
              <tr>
                <th style={{ ...TH, textAlign: 'left', minWidth: 80 }}>{t('std_ec2_tbl_spacing_col')}</th>
                {DIAMETERS.map(d => (
                  <th key={d} style={TH}>Φ{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SPACINGS.map((s, i) => (
                <TR key={s} stripe={i % 2 !== 0}>
                  <td style={{ ...TD, fontWeight: 700, color: '#10b981', textAlign: 'left' }}>{s}</td>
                  {DIAMETERS.map(d => (
                    <td key={d} style={TDN}>{wtPerm2(d, s).toFixed(2)}</td>
                  ))}
                </TR>
              ))}
            </tbody>
          </Table>
        </div>
      </div>

      {/* Area individual bars */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {t('std_ec2_tbl_indiv_area_header')}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <Table>
            <thead>
              <tr>
                <th style={{ ...TH, textAlign: 'left', minWidth: 60 }}>Φ (mm)</th>
                {BAR_COUNTS.map(n => (
                  <th key={n} style={TH}>{n}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DIAMETERS.map((d, i) => (
                <TR key={d} stripe={i % 2 !== 0}>
                  <td style={{ ...TD, fontWeight: 700, color: '#10b981', textAlign: 'left' }}>Φ{d}</td>
                  {BAR_COUNTS.map(n => (
                    <td key={n} style={TDN}>{nBarArea(d, n).toFixed(2)}</td>
                  ))}
                </TR>
              ))}
            </tbody>
          </Table>
        </div>
      </div>

      {/* Weight individual bars */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {t('std_ec2_tbl_indiv_weight_header')}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <Table>
            <thead>
              <tr>
                <th style={{ ...TH, textAlign: 'left', minWidth: 60 }}>Φ (mm)</th>
                {BAR_COUNTS.map(n => (
                  <th key={n} style={TH}>{n}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DIAMETERS.map((d, i) => (
                <TR key={d} stripe={i % 2 !== 0}>
                  <td style={{ ...TD, fontWeight: 700, color: '#10b981', textAlign: 'left' }}>Φ{d}</td>
                  {BAR_COUNTS.map(n => (
                    <td key={n} style={TDN}>{nBarWeight(d, n).toFixed(3)}</td>
                  ))}
                </TR>
              ))}
            </tbody>
          </Table>
        </div>
      </div>

      {/* Notes */}
      <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#166534' }}>
        <strong>{t('std_ec2_tbl_formulas_title')}</strong>
        <div style={{ marginTop: 4, fontFamily: 'ui-monospace, monospace', lineHeight: 1.8 }}>
          <div>Single bar area: A<sub>s</sub> = π · Φ² / 4 &nbsp;&nbsp; (mm²)</div>
          <div>Distributed: A<sub>s</sub>/m = A<sub>s</sub> / s × 1000 &nbsp;&nbsp; (mm²/m → cm²/m ÷ 100)</div>
          <div>Weight: w = A<sub>s</sub> × ρ<sub>steel</sub> = A<sub>s</sub> × 7850 × 10⁻⁶ &nbsp;&nbsp; (kg/m)</div>
        </div>
      </div>
    </div>
  )
}
