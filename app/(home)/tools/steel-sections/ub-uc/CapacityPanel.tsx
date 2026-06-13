'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import {
  computeCapacity,
  calcMbRdPoint,
  calcMNrdPoint,
  calcNbRdPoint,
  LTB_LENGTHS,
  C1_VALUES,
  N_RATIOS,
  BUCK_LENGTHS,
  fy,
  type SteelGrade,
  type CrossSectionResult,
  type MNrdRow,
  type NbRdRow,
} from './ec3-engine'
import { ALL_UB_UC_ROWS } from './data/index'
import type { SectionRow } from '../_shared/types'
import { SteelSectionsExportModal } from './ExportModal'
import {
  DetailGroup,
  CalcStep,
  Tex,
} from '../../../standards/_lib/ui'
import { CapacityShell } from '../_shared/CapacityShell'
import { LockedBanner } from '@/app/_components/shared/LockedBanner'
import type { ToolAccess } from '@/lib/useSubscription'
import { useTranslation } from '../../../../i18n/LanguageContext'

const DEFAULT_ACCESS: ToolAccess = { canUse: true, canViewDetails: false, canExport: false, canCopyDetails: false }

const ACCENT = '#0369a1'

function r0(v: number): string {
  if (v < 0) return '—'
  if (v === 0) return '0'
  return Math.round(v).toLocaleString('en-GB')
}

function r2(v: number): string {
  if (v < 0) return '—'
  return v.toFixed(2)
}


const TH: React.CSSProperties = {
  padding: '6px 8px', fontSize: 11, fontWeight: 700, color: '#475569',
  background: '#f1f5f9', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap', textAlign: 'center',
}
const TD: React.CSSProperties = {
  padding: '5px 8px', fontSize: 11, textAlign: 'center',
  borderBottom: '1px solid #f1f5f9', fontFamily: 'monospace', whiteSpace: 'nowrap',
}
const TDL: React.CSSProperties = {
  ...TD, textAlign: 'left', fontFamily: 'inherit', fontWeight: 600, color: '#334155',
  background: '#f8fafc', position: 'sticky', left: 0, zIndex: 1,
}

// ── Section search ────────────────────────────────────────────────────────────

function SectionSearch({ current, onSelect }: { current: SectionRow | null; onSelect: (r: SectionRow) => void }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const matches = useMemo(() => {
    const lq = q.toLowerCase()
    return lq ? ALL_UB_UC_ROWS.filter(r => r.designation.toLowerCase().includes(lq)).slice(0, 20) : []
  }, [q])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
      <input
        type="text" value={q}
        placeholder={current ? current.designation : 'Search section (e.g. UB 406×178)…'}
        onChange={e => { setQ(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        style={{
          width: '100%', padding: '7px 12px', fontSize: 13,
          border: `1.5px solid ${open ? ACCENT : '#e2e8f0'}`, borderRadius: 8,
          outline: 'none', background: '#fff', color: '#1e293b', boxSizing: 'border-box',
        }}
      />
      {open && matches.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: 220, overflowY: 'auto', marginTop: 4,
        }}>
          {matches.map(r => (
            <button key={r.designation} onMouseDown={() => { onSelect(r); setQ(''); setOpen(false) }}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 14px', border: 'none', background: 'none', fontSize: 12, cursor: 'pointer', color: '#1e293b' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f0f9ff')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >{r.designation}</button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Section header card ───────────────────────────────────────────────────────

function HeaderCard({ row, grade, cs }: { row: SectionRow; grade: SteelGrade; cs: CrossSectionResult }) {
  const { t } = useTranslation()
  return (
    <div style={{ background: 'linear-gradient(135deg, #0c4a6e, #0369a1)', borderRadius: 10, padding: '14px 18px', color: '#fff', marginBottom: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>
        {row.designation} · {grade}
        <span style={{ marginLeft: 10, fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.2)', borderRadius: 4, padding: '2px 8px' }}>
          {t('bbuc_header_class')} {cs.cls}{cs.cls === 4 ? ` — ${t('bbuc_header_class4_note')}` : ''}
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 24px', fontSize: 12, alignItems: 'baseline' }}>
        <span><span style={{ opacity: 0.7 }}><Tex>{'M_{c,Rd}'}</Tex></span> = <strong>{r0(cs.Mc_Rd)} kNm</strong></span>
        <span><span style={{ opacity: 0.7 }}><Tex>{'N_{pl,Rd}'}</Tex></span> = <strong>{r0(cs.Npl_Rd)} kN</strong></span>
        <span><span style={{ opacity: 0.7 }}><Tex>{'V_{pl,Rd}'}</Tex></span> = <strong>{r0(cs.Vpl_Rd)} kN</strong></span>
        <span><span style={{ opacity: 0.7 }}><Tex>{'I_x'}</Tex></span> = <strong>{row.Ix.toLocaleString('en-GB')} cm⁴</strong></span>
      </div>
      <div style={{ marginTop: 8, fontSize: 10, opacity: 0.6 }}>
        {t('bbuc_header_ref')}
      </div>
    </div>
  )
}

// ── Cross-section details ─────────────────────────────────────────────────────

function nf(v: number, d = 2) { return isFinite(v) ? v.toFixed(d) : '—' }

export function CrossSectionDetails({ row, grade, cs }: { row: SectionRow; grade: SteelGrade; cs: CrossSectionResult }) {
  const { t } = useTranslation()
  const fyv  = fy(grade)
  const eps  = Math.sqrt(235 / fyv)
  const d    = row.h - 2 * row.tf - 2 * row.r
  const cf   = (row.b - row.tw - 2 * row.r) / 2
  const A    = row.A * 100       // mm²
  const Zplx = row.Zx * 1000    // mm³  plastic major
  const Welx = row.Wx * 1000    // mm³  elastic major
  const hw   = row.h - 2 * row.tf
  const Av   = Math.max(A - 2 * row.b * row.tf + (row.tw + 2 * row.r) * row.tf, hw * row.tw)
  const webClass   = d / row.tw <= 72 * eps ? 1 : d / row.tw <= 83 * eps ? 2 : d / row.tw <= 124 * eps ? 3 : 4
  const flangeClass = cf / row.tf <= 9 * eps ? 1 : cf / row.tf <= 10 * eps ? 2 : cf / row.tf <= 14 * eps ? 3 : 4
  const W    = cs.cls <= 2 ? Zplx : Welx

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <DetailGroup title={t('bbuc_det_material_title')}>
        <CalcStep
          label={t('bbuc_det_fy_label')}
          formula={`f_y = ${fyv}\\ \\mathrm{N/mm^2}\\quad (${grade},\\ t_f = ${row.tf}\\ \\mathrm{mm} \\le 16\\ \\mathrm{mm})`}
        />
        <CalcStep
          label={t('bbuc_det_eps_label')}
          formula={`\\varepsilon = \\sqrt{\\dfrac{235}{f_y}} = \\sqrt{\\dfrac{235}{${fyv}}} = ${nf(eps, 4)}`}
        />
      </DetailGroup>

      <DetailGroup title={t('bbuc_det_class_title')}>
        <CalcStep
          label={t('bbuc_det_web_d_label')}
          formula={`d = h - 2t_f - 2r = ${row.h} - 2 \\times ${row.tf} - 2 \\times ${row.r} = ${nf(d, 1)}\\ \\mathrm{mm}`}
        />
        <CalcStep
          label={t('bbuc_det_web_slend_label')}
          formula={`\\dfrac{d}{t_w} = \\dfrac{${nf(d,1)}}{${row.tw}} = ${nf(d/row.tw, 2)} \\quad \\le 72\\varepsilon = ${nf(72*eps,2)} \\quad \\Rightarrow \\text{Web Class ${webClass}}`}
        />
        <CalcStep
          label={t('bbuc_det_flange_out_label')}
          formula={`c_f = \\dfrac{b - t_w - 2r}{2} = \\dfrac{${row.b} - ${row.tw} - 2 \\times ${row.r}}{2} = ${nf(cf,1)}\\ \\mathrm{mm}`}
        />
        <CalcStep
          label={t('bbuc_det_flange_slend_label')}
          formula={`\\dfrac{c_f}{t_f} = \\dfrac{${nf(cf,1)}}{${row.tf}} = ${nf(cf/row.tf,2)} \\quad \\le 9\\varepsilon = ${nf(9*eps,2)} \\quad \\Rightarrow \\text{Flange Class ${flangeClass}}`}
        />
        <CalcStep
          label={t('bbuc_det_section_class')}
          formula={`\\text{Class} = \\max(${webClass},\\ ${flangeClass}) = \\mathbf{Class\\ ${cs.cls}}`}
        />
      </DetailGroup>

      <DetailGroup title={t('bbuc_det_cs_title')}>
        <CalcStep
          label={<><Tex>{'N_{pl,Rd}'}</Tex> — {t('bbuc_det_nplrd_label')}</>}
          formula={`N_{pl,Rd} = \\dfrac{A \\cdot f_y}{\\gamma_{M0}} = \\dfrac{${nf(A,0)}\\ \\mathrm{mm^2} \\times ${fyv}}{1.0 \\times 10^3} = ${r0(cs.Npl_Rd)}\\ \\mathrm{kN}`}
        />
        <CalcStep
          label={<><Tex>{cs.cls <= 2 ? 'M_{c,y,Rd}' : 'M_{c,y,Rd}'}</Tex> — {t('bbuc_det_mcrd_label')} ({cs.cls <= 2 ? <Tex>{'W_{pl,y}'}</Tex> : <Tex>{'W_{el,y}'}</Tex>}, Class {cs.cls})</>}
          formula={`M_{c,y,Rd} = \\dfrac{${cs.cls <= 2 ? 'W_{pl,y}' : 'W_{el,y}'} \\cdot f_y}{\\gamma_{M0}} = \\dfrac{${nf(W,0)}\\ \\mathrm{mm^3} \\times ${fyv}}{1.0 \\times 10^6} = ${r0(cs.Mc_Rd)}\\ \\mathrm{kNm}`}
        />
        <CalcStep
          label={<>{t('bbuc_det_av_label')} <Tex>{'A_v'}</Tex> — {t('bbuc_det_vplrd_label').split('—')[0]}</>}
          formula={`A_v = A - 2b \\cdot t_f + (t_w + 2r) \\cdot t_f`}
        />
        <CalcStep
          label=""
          formula={`= ${nf(A,0)} - 2 \\times ${row.b} \\times ${row.tf} + (${row.tw} + 2 \\times ${row.r}) \\times ${row.tf} = ${nf(Av,0)}\\ \\mathrm{mm^2}`}
        />
        <CalcStep
          label={<><Tex>{'V_{pl,Rd}'}</Tex> — {t('bbuc_det_vplrd_label')}</>}
          formula={`V_{pl,Rd} = \\dfrac{A_v \\cdot f_y}{\\sqrt{3} \\cdot \\gamma_{M0}} = \\dfrac{${nf(Av,0)} \\times ${fyv}}{\\sqrt{3} \\times 1.0 \\times 10^3} = ${r0(cs.Vpl_Rd)}\\ \\mathrm{kN}`}
        />
      </DetailGroup>
    </div>
  )
}

// ── Shared selector input bar ─────────────────────────────────────────────────

const INP: React.CSSProperties = {
  width: 72, padding: '4px 8px', fontSize: 11, borderRadius: 6,
  border: '1.5px solid #e2e8f0', outline: 'none', textAlign: 'center',
  fontFamily: 'monospace', background: '#fff', color: '#1e293b',
}

// ── Bending section ───────────────────────────────────────────────────────────

export function BendingSection({ row, grade, mbRd, cs, showDetails, selC1, selL, onSelC1, onSelL }: {
  row: SectionRow; grade: SteelGrade; mbRd: number[][]; cs: CrossSectionResult
  showDetails?: boolean
  selC1: number; selL: number
  onSelC1: (v: number) => void; onSelL: (v: number) => void
}) {
  const { t } = useTranslation()
  const fyv = fy(grade)
  const alpha = row.h / row.b > 2 ? 0.34 : 0.49
  const curve = row.h / row.b > 2 ? 'b' : 'c'
  const W = cs.cls <= 2 ? row.Zx * 1000 : row.Wx * 1000  // mm³

  // For highlighted cell: find nearest grid indices
  const hiC1i = C1_VALUES.reduce((best, c, i) => Math.abs(c - selC1) < Math.abs(C1_VALUES[best] - selC1) ? i : best, 0)
  const hiLi  = LTB_LENGTHS.reduce((best, l, i) => Math.abs(l - selL) < Math.abs(LTB_LENGTHS[best] - selL) ? i : best, 0)

  // Point derivation
  const pt = calcMbRdPoint(row, grade, selC1, selL)

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 3, height: 14, borderRadius: 2, background: ACCENT }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>{t('bbuc_bend_title')} <Tex>{'M_{b,Rd}'}</Tex> (kNm)</span>
        <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 4 }}>{t('bbuc_bend_ref')}</span>
      </div>

      {/* Results table — click cell to snap */}
      <div className="bb-table-wrap" style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 10 }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr>
              <th style={{ ...TH, textAlign: 'left', minWidth: 52 }}>{t('bbuc_bend_c1_col')}</th>
              {LTB_LENGTHS.map((l, li) => (
                <th key={l} style={{ ...TH, background: li === hiLi ? '#e0f2fe' : TH.background }}>{l}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {C1_VALUES.map((C1, ci) => (
              <tr key={C1} style={{ background: ci === hiC1i ? '#f0f9ff' : ci % 2 === 0 ? '#fff' : '#f8fafc' }}>
                <td style={{ ...TDL, background: ci === hiC1i ? '#e0f2fe' : TDL.background }}>{C1.toFixed(2)}</td>
                {LTB_LENGTHS.map((_, li) => (
                  <td key={li} onClick={() => { onSelC1(C1_VALUES[ci]); onSelL(LTB_LENGTHS[li]) }}
                    style={{
                      ...TD,
                      color: mbRd[ci][li] < 0 ? '#94a3b8' : '#1e293b',
                      background: ci === hiC1i && li === hiLi ? '#bae6fd' : undefined,
                      cursor: 'pointer', fontWeight: ci === hiC1i && li === hiLi ? 700 : undefined,
                    }}>
                    {r0(mbRd[ci][li])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Selector bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: '#0369a1', fontWeight: 600 }}>{t('bbuc_tab_details')}:</span>
        <label style={{ fontSize: 11, color: '#475569', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Tex>{'C_1'}</Tex>
          <input style={INP} type="number" step="0.01" min="1" max="3"
            value={selC1} onChange={e => { const v = parseFloat(e.target.value); if (isFinite(v) && v > 0) onSelC1(v) }} />
        </label>
        <label style={{ fontSize: 11, color: '#475569', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Tex>{'L_{cr}'}</Tex> (m)
          <input style={INP} type="number" step="0.5" min="0.5" max="30"
            value={selL} onChange={e => { const v = parseFloat(e.target.value); if (isFinite(v) && v > 0) onSelL(v) }} />
        </label>
        <span style={{ fontSize: 11, color: '#64748b', marginLeft: 4 }}>
          → <Tex>{'M_{b,Rd}'}</Tex> = <strong style={{ color: '#0369a1' }}>{r2(pt.MbRd)} kNm</strong>
        </span>
      </div>

      {/* Details */}
      {showDetails && <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <DetailGroup title={t('bbuc_det_ltb_curve_title')}>
          <CalcStep
            label={t('bbuc_det_hb_label')}
            formula={`\\dfrac{h}{b} = \\dfrac{${row.h}}{${row.b}} = ${nf(row.h/row.b, 2)} ${row.h/row.b > 2 ? '> 2' : '\\le 2'} \\quad \\Rightarrow \\text{Curve ${curve}},\\ \\alpha_{LT} = ${alpha}`}
          />
          <CalcStep
            label={<>{t('bbuc_det_W_label')} <Tex>{'W'}</Tex></>}
            formula={`W = ${cs.cls <= 2 ? 'W_{pl,y}' : 'W_{el,y}'} = ${nf(W/1000, 0)}\\ \\mathrm{cm^3} = ${nf(W, 0)}\\ \\mathrm{mm^3} \\quad (\\text{Class ${cs.cls}})`}
          />
        </DetailGroup>
        <DetailGroup title={t('bbuc_det_consts_title')}>
          <CalcStep
            label={<>{t('bbuc_det_Iw_label')} <Tex>{'I_w'}</Tex></>}
            formula={`I_w = ${row.Cw}\\ \\mathrm{dm^6} = ${(row.Cw * 1e12).toExponential(3)}\\ \\mathrm{mm^6}`}
          />
          <CalcStep
            label={<>{t('bbuc_det_It_label')} <Tex>{'I_t'}</Tex></>}
            formula={`I_t = J = ${row.J}\\ \\mathrm{cm^4} = ${(row.J * 1e4).toExponential(3)}\\ \\mathrm{mm^4}`}
          />
          <CalcStep
            label={<>{t('bbuc_det_Iz_label')} <Tex>{'I_z'}</Tex></>}
            formula={`I_z = ${row.Iy}\\ \\mathrm{cm^4} = ${(row.Iy * 1e4).toExponential(3)}\\ \\mathrm{mm^4}`}
          />
        </DetailGroup>
        <DetailGroup title={<><Tex>{'M_{cr}'}</Tex> — {t('bbuc_det_mcr_title')} (C₁ = {selC1.toFixed(2)}, L = {selL} m)</>}>
          <CalcStep
            label={t('bbuc_det_mcr_formula_label')}
            formula={`M_{cr} = C_1 \\cdot \\dfrac{\\pi^2 E I_z}{L_{cr}^2} \\cdot \\sqrt{\\dfrac{I_w}{I_z} + \\dfrac{L_{cr}^2 G I_t}{\\pi^2 E I_z}}`}
          />
          <CalcStep
            label={`C₁ = ${selC1.toFixed(2)}, L = ${selL} m`}
            formula={`M_{cr} = ${nf(pt.Mcr / 1e6, 1)}\\ \\mathrm{kNm}, \\quad k_c = \\dfrac{1}{\\sqrt{${selC1.toFixed(2)}}} = ${nf(pt.kc, 4)}`}
          />
        </DetailGroup>
        <DetailGroup title={<><Tex>{'\\bar{\\lambda}_{LT}'}</Tex> — {t('bbuc_det_lam_title')}</>}>
          <CalcStep
            label={t('bbuc_det_lam_label')}
            formula={`\\bar{\\lambda}_{LT} = \\sqrt{\\dfrac{W \\cdot f_y}{M_{cr}}} = \\sqrt{\\dfrac{${nf(W,0)} \\times ${fyv}}{${nf(pt.Mcr,0)}}} = ${nf(pt.lamLT, 4)}`}
          />
          <CalcStep
            label={t('bbuc_det_lam_plateau')}
            formula={`\\bar{\\lambda}_{LT} = ${nf(pt.lamLT,4)} ${pt.lamLT <= 0.4 ? '\\le 0.4 \\quad \\Rightarrow \\chi_{LT} = 1.0' : '> 0.4 \\quad \\Rightarrow \\text{buckling reduction applies}'}`}
          />
        </DetailGroup>
        <DetailGroup title={<><Tex>{'\\chi_{LT}'}</Tex> — {t('bbuc_det_chi_title')}</>}>
          <CalcStep
            label={<><Tex>{'\\Phi_{LT}'}</Tex></>}
            formula={`\\Phi_{LT} = 0.5\\left[1 + ${alpha}(${nf(pt.lamLT,4)} - 0.4) + 0.75 \\times ${nf(pt.lamLT,4)}^2\\right] = ${nf(pt.phi, 4)}`}
          />
          <CalcStep
            label={<><Tex>{'\\chi_{LT}'}</Tex></>}
            formula={`\\chi_{LT} = \\dfrac{1}{${nf(pt.phi,4)} + \\sqrt{${nf(pt.phi,4)}^2 - 0.75 \\times ${nf(pt.lamLT,4)}^2}} = ${nf(pt.chiLT, 4)}`}
          />
          <CalcStep
            label={<>{t('bbuc_det_f_label')}</>}
            formula={`f = ${nf(pt.f, 4)}, \\quad \\chi_{LT,\\text{mod}} = \\dfrac{${nf(pt.chiLT,4)}}{${nf(pt.f,4)}} = ${nf(pt.chiLTmod, 4)}`}
          />
          <CalcStep
            label={<><Tex>{'M_{b,Rd}'}</Tex> — {t('bbuc_det_mbrd_label')}</>}
            formula={`M_{b,Rd} = ${nf(pt.chiLTmod,4)} \\times ${nf(W,0)}\\ \\mathrm{mm^3} \\times \\dfrac{${fyv}}{1.0 \\times 10^6} = ${r2(pt.MbRd)}\\ \\mathrm{kNm}`}
          />
        </DetailGroup>
      </div>}
    </div>
  )
}

// ── Axial + Bending section ───────────────────────────────────────────────────

export function AxialBendingSection({ row, grade, mNRd, cs, showDetails, selN, onSelN }: {
  row: SectionRow; grade: SteelGrade; mNRd: MNrdRow[]; cs: CrossSectionResult
  showDetails?: boolean
  selN: number; onSelN: (v: number) => void
}) {
  const { t } = useTranslation()
  const A  = row.A * 100   // mm²
  const pt = calcMNrdPoint(row, grade, selN)

  const hiNi = N_RATIOS.reduce((best, n, i) => Math.abs(n - selN) < Math.abs(N_RATIOS[best] - selN) ? i : best, 0)

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 3, height: 14, borderRadius: 2, background: ACCENT }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>{t('bbuc_axbend_title')} <Tex>{'M_{N,Rd}'}</Tex> (kNm)</span>
        <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 4 }}>{t('bbuc_axbend_ref')}</span>
      </div>

      {/* Results table */}
      <div className="bb-table-wrap" style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 10 }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr>
              <th style={{ ...TH, textAlign: 'left', minWidth: 110 }}><Tex>{'n = N_{Ed}/N_{pl,Rd}'}</Tex></th>
              {N_RATIOS.map((nv, ni) => (
                <th key={nv} style={{ ...TH, background: ni === hiNi ? '#e0f2fe' : TH.background }}>{nv.toFixed(1)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mNRd.map((mnRow, ri) => (
              <tr key={ri} style={{ background: ri % 2 === 0 ? '#fff' : '#f8fafc' }}>
                <td style={TDL}><Tex>{mnRow.label === 'M_N,y,Rd' ? 'M_{N,y,Rd}' : 'M_{N,z,Rd}'}</Tex></td>
                {mnRow.values.map((v, ni) => (
                  <td key={ni} onClick={() => onSelN(N_RATIOS[ni])}
                    style={{
                      ...TD, color: v < 0 ? '#94a3b8' : '#1e293b',
                      background: ni === hiNi ? '#bae6fd' : undefined,
                      cursor: 'pointer', fontWeight: ni === hiNi ? 700 : undefined,
                    }}>
                    {r0(v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer + selector bar */}
      <div style={{ fontSize: 10, color: '#64748b', marginBottom: 8, display: 'flex', flexWrap: 'wrap', gap: '0 16px', alignItems: 'baseline' }}>
        <span><Tex>{'N_{pl,Rd}'}</Tex> = {r0(cs.Npl_Rd)} kN</span>
        <span><Tex>{'M_{pl,y,Rd}'}</Tex> = {r0(cs.Mpl_Rd)} kNm</span>
        <span><Tex>{'M_{pl,z,Rd}'}</Tex> = {r0(cs.Mpl_z_Rd)} kNm</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: '#0369a1', fontWeight: 600 }}>{t('bbuc_tab_details')}:</span>
        <label style={{ fontSize: 11, color: '#475569', display: 'flex', alignItems: 'center', gap: 5 }}>
          n =
          <input style={INP} type="number" step="0.05" min="0" max="1"
            value={selN} onChange={e => { const v = parseFloat(e.target.value); if (isFinite(v) && v >= 0 && v <= 1) onSelN(v) }} />
        </label>
        <span style={{ fontSize: 11, color: '#64748b' }}>
          → <Tex>{'M_{N,y,Rd}'}</Tex> = <strong style={{ color: '#0369a1' }}>{r2(pt.MNyRd)} kNm</strong>
          <span style={{ marginLeft: 8 }}><Tex>{'M_{N,z,Rd}'}</Tex> = <strong style={{ color: '#0369a1' }}>{r2(pt.MNzRd)} kNm</strong></span>
        </span>
      </div>

      {/* Details */}
      {showDetails && <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <DetailGroup title={`${t('bbuc_det_n_title')} — n = ${selN.toFixed(2)}`}>
          <CalcStep
            label={t('bbuc_det_n_label')}
            formula={`n = ${selN.toFixed(2)}, \\quad N_{pl,Rd} = ${r0(cs.Npl_Rd)}\\ \\mathrm{kN}`}
          />
        </DetailGroup>
        <DetailGroup title={t('bbuc_det_a_title')}>
          <CalcStep
            label={t('bbuc_det_a_label')}
            formula={`a = \\dfrac{A - 2b \\cdot t_f}{A} \\le 0.5 = \\dfrac{${nf(A,0)} - 2 \\times ${row.b} \\times ${row.tf}}{${nf(A,0)}} = ${nf(pt.a, 4)}`}
          />
        </DetailGroup>
        {cs.cls <= 2 && (
          <>
            <DetailGroup title={t('bbuc_det_mny_title')}>
              <CalcStep
                label={t('bbuc_det_mny_when_ok')}
                formula={`M_{N,y,Rd} = M_{pl,y,Rd} \\cdot \\dfrac{1-n}{1-0.5a} = ${r0(cs.Mpl_Rd)} \\times \\dfrac{1-${selN.toFixed(2)}}{1-0.5 \\times ${nf(pt.a,4)}} = ${r2(pt.MNyRd)}\\ \\mathrm{kNm}`}
              />
            </DetailGroup>
            <DetailGroup title={t('bbuc_det_mnz_title')}>
              <CalcStep
                label={selN <= pt.a ? t('bbuc_det_mnz_when_a') : t('bbuc_det_mnz_when_gt')}
                formula={selN <= pt.a
                  ? `M_{N,z,Rd} = M_{pl,z,Rd} = ${r2(pt.MNzRd)}\\ \\mathrm{kNm} \\quad (n=${selN.toFixed(2)} \\le a=${nf(pt.a,4)})`
                  : `M_{N,z,Rd} = ${r0(cs.Mpl_z_Rd)} \\times \\left[1 - \\left(\\dfrac{${selN.toFixed(2)}-${nf(pt.a,4)}}{1-${nf(pt.a,4)}}\\right)^2\\right] = ${r2(pt.MNzRd)}\\ \\mathrm{kNm}`
                }
              />
            </DetailGroup>
          </>
        )}
        {cs.cls === 3 && (
          <DetailGroup title={t('bbuc_det_cls3_title')}>
            <CalcStep
              label={t('bbuc_det_cls3_major')}
              formula={`M_{N,y,Rd} = ${r0(cs.Mel_Rd)} \\times (1-${selN.toFixed(2)}) = ${r2(pt.MNyRd)}\\ \\mathrm{kNm}`}
            />
            <CalcStep
              label={t('bbuc_det_cls3_minor')}
              formula={`M_{N,z,Rd} = ${r0(cs.Mel_z_Rd)} \\times (1-${selN.toFixed(2)}) = ${r2(pt.MNzRd)}\\ \\mathrm{kNm}`}
            />
          </DetailGroup>
        )}
      </div>}
    </div>
  )
}

// ── Compression section ───────────────────────────────────────────────────────

export function CompressionSection({ row, grade, nbRd, cs, showDetails, selLcomp, onSelLcomp }: {
  row: SectionRow; grade: SteelGrade; nbRd: NbRdRow[]; cs: CrossSectionResult
  showDetails?: boolean
  selLcomp: number; onSelLcomp: (v: number) => void
}) {
  const { t } = useTranslation()
  const fyv = fy(grade)
  const eps = Math.sqrt(235 / fyv)
  const hb  = row.h / row.b
  const hiLi = BUCK_LENGTHS.reduce((best, l, i) => Math.abs(l - selLcomp) < Math.abs(BUCK_LENGTHS[best] - selLcomp) ? i : best, 0)

  const pt = calcNbRdPoint(row, grade, selLcomp)
  const curveY = pt.alphaY === 0.21 ? 'a' : 'b'
  const curveZ = pt.alphaZ === 0.34 ? 'b' : 'c'

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 3, height: 14, borderRadius: 2, background: ACCENT }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>{t('bbuc_comp_title')} <Tex>{'N_{b,Rd}'}</Tex> (kN)</span>
        <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 4 }}>{t('bbuc_comp_ref')}</span>
      </div>

      {/* Results table */}
      <div className="bb-table-wrap" style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 10 }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr>
              <th style={{ ...TH, textAlign: 'left', minWidth: 80 }}>{t('bbuc_comp_axis_col')}</th>
              {BUCK_LENGTHS.map((l, li) => (
                <th key={l} style={{ ...TH, background: li === hiLi ? '#e0f2fe' : TH.background }}>{l}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {nbRd.map((nbRow, ri) => (
              <tr key={ri} style={{ background: ri % 2 === 0 ? '#fff' : '#f8fafc' }}>
                <td style={TDL}><Tex>{nbRow.label === 'N_b,y,Rd' ? 'N_{b,y,Rd}' : nbRow.label === 'N_b,z,Rd' ? 'N_{b,z,Rd}' : 'N_{b,T,Rd}'}</Tex></td>
                {nbRow.values.map((v, li) => (
                  <td key={li} onClick={() => onSelLcomp(BUCK_LENGTHS[li])}
                    style={{
                      ...TD, color: v < 0 ? '#94a3b8' : '#1e293b',
                      background: li === hiLi ? '#bae6fd' : undefined,
                      cursor: 'pointer', fontWeight: li === hiLi ? 700 : undefined,
                    }}>
                    {r0(v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer + selector bar */}
      <div style={{ fontSize: 10, color: '#64748b', marginBottom: 8, display: 'flex', gap: '0 12px', alignItems: 'baseline' }}>
        <span>{t('bbuc_comp_footer')}</span>
        <span><Tex>{'N_{pl,Rd}'}</Tex> = {r0(cs.Npl_Rd)} kN</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: '#0369a1', fontWeight: 600 }}>{t('bbuc_tab_details')}:</span>
        <label style={{ fontSize: 11, color: '#475569', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Tex>{'L_{cr}'}</Tex> (m)
          <input style={INP} type="number" step="0.5" min="0.5" max="30"
            value={selLcomp} onChange={e => { const v = parseFloat(e.target.value); if (isFinite(v) && v > 0) onSelLcomp(v) }} />
        </label>
        <span style={{ fontSize: 11, color: '#64748b' }}>
          → <Tex>{'N_{b,y,Rd}'}</Tex> = <strong style={{ color: '#0369a1' }}>{r2(pt.NbYRd)}</strong>
          <span style={{ marginLeft: 6 }}><Tex>{'N_{b,z,Rd}'}</Tex> = <strong style={{ color: '#0369a1' }}>{r2(pt.NbZRd)}</strong></span>
          <span style={{ marginLeft: 6, fontSize: 10, color: '#94a3b8' }}>kN</span>
        </span>
      </div>

      {/* Details */}
      {showDetails && <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <DetailGroup title={t('bbuc_det_buck_title')}>
          <CalcStep
            label={t('bbuc_det_hb_comp_label')}
            formula={`\\dfrac{h}{b} = \\dfrac{${row.h}}{${row.b}} = ${nf(hb,2)} \\quad ${hb > 1.2 ? '> 1.2' : '\\le 1.2'},\\ t_f = ${row.tf}\\ \\mathrm{mm}`}
          />
          <CalcStep
            label={t('bbuc_det_yy_label')}
            formula={`\\text{Curve ${curveY}}\\ (\\alpha = ${pt.alphaY})`}
          />
          <CalcStep
            label={t('bbuc_det_zz_label')}
            formula={`\\text{Curve ${curveZ}}\\ (\\alpha = ${pt.alphaZ})`}
          />
          <CalcStep
            label={t('bbuc_det_T_label')}
            formula={`\\text{Curve c}\\ (\\alpha = 0.49) \\quad \\text{§6.3.1.4}`}
          />
        </DetailGroup>
        <DetailGroup title={`${t('bbuc_det_lam_flex_title')} — L = ${selLcomp} m`}>
          <CalcStep
            label={t('bbuc_det_eps_comp_label')}
            formula={`\\varepsilon = \\sqrt{\\dfrac{235}{${fyv}}} = ${nf(eps,4)}`}
          />
          <CalcStep
            label="y-y axis"
            formula={`\\bar{\\lambda}_y = \\dfrac{${selLcomp * 1000}/${nf(row.ix*10,1)}}{93.9 \\times ${nf(eps,4)}} = ${nf(pt.lamY, 4)} \\quad \\Rightarrow \\chi_y = ${nf(pt.chiY, 4)}`}
          />
          <CalcStep
            label="z-z axis"
            formula={`\\bar{\\lambda}_z = \\dfrac{${selLcomp * 1000}/${nf(row.iy*10,1)}}{93.9 \\times ${nf(eps,4)}} = ${nf(pt.lamZ, 4)} \\quad \\Rightarrow \\chi_z = ${nf(pt.chiZ, 4)}`}
          />
          <CalcStep
            label={t('bbuc_det_lam_T_label')}
            formula={`\\bar{\\lambda}_T = ${nf(pt.lamT, 4)} \\quad \\Rightarrow \\chi_T = ${nf(pt.chiT, 4)}`}
          />
        </DetailGroup>
        <DetailGroup title={t('bbuc_det_flex_title')}>
          <CalcStep
            label={`N_{b,y,Rd}`}
            formula={`N_{b,y,Rd} = ${nf(pt.chiY,4)} \\times \\dfrac{${nf(row.A*100,0)}\\ \\mathrm{mm^2} \\times ${fyv}}{1.0 \\times 10^3} = ${r2(pt.NbYRd)}\\ \\mathrm{kN}`}
          />
          <CalcStep
            label={`N_{b,z,Rd}`}
            formula={`N_{b,z,Rd} = ${nf(pt.chiZ,4)} \\times \\dfrac{${nf(row.A*100,0)}\\ \\mathrm{mm^2} \\times ${fyv}}{1.0 \\times 10^3} = ${r2(pt.NbZRd)}\\ \\mathrm{kN}`}
          />
          <CalcStep
            label={`N_{b,T,Rd}`}
            formula={`N_{b,T,Rd} = ${nf(pt.chiT,4)} \\times \\dfrac{${nf(row.A*100,0)}\\ \\mathrm{mm^2} \\times ${fyv}}{1.0 \\times 10^3} = ${r2(pt.NbTRd)}\\ \\mathrm{kN}`}
          />
        </DetailGroup>
        <DetailGroup title={t('bbuc_det_tors_title')}>
          <CalcStep
            label={t('bbuc_det_i0_label')}
            formula={`i_0^2 = ${nf(row.ix*10,1)}^2 + ${nf(row.iy*10,1)}^2 = ${nf((row.ix*10)**2+(row.iy*10)**2,0)}\\ \\mathrm{mm^2}`}
          />
          <CalcStep
            label={t('bbuc_det_consts_comp')}
            formula={`I_t = ${row.J}\\ \\mathrm{cm^4},\\quad I_w = ${row.Cw}\\ \\mathrm{dm^6}`}
          />
        </DetailGroup>
      </div>}
    </div>
  )
}

// ── Main CapacityPanel ────────────────────────────────────────────────────────

// ── Pass/Fail badge ───────────────────────────────────────────────────────────

function PassFail({ ed, rd }: { ed: number; rd: number }) {
  const ratio = ed / rd
  const pass = ratio <= 1.0
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 10, fontWeight: 800, padding: '1px 7px', borderRadius: 10,
      background: pass ? '#dcfce7' : '#fee2e2',
      color: pass ? '#15803d' : '#b91c1c',
      marginLeft: 6,
    }}>
      {pass ? '✓ PASS' : '✗ FAIL'}
      <span style={{ fontWeight: 400, opacity: 0.8 }}>{(ratio * 100).toFixed(0)}%</span>
    </span>
  )
}

// ── Design forces input panel ─────────────────────────────────────────────────

function DesignForcesPanel({
  MEd, NEd, VEd,
  onMEd, onNEd, onVEd,
}: {
  MEd: string; NEd: string; VEd: string
  onMEd: (v: string) => void; onNEd: (v: string) => void; onVEd: (v: string) => void
}) {
  const inpStyle: React.CSSProperties = {
    width: 90, padding: '5px 8px', fontSize: 12, borderRadius: 6,
    border: '1.5px solid #e2e8f0', outline: 'none', textAlign: 'right',
    fontFamily: 'monospace', background: '#fff', color: '#1e293b',
    boxSizing: 'border-box',
  }
  const focus = (e: React.FocusEvent<HTMLInputElement>) => (e.currentTarget.style.borderColor = ACCENT)
  const blur  = (e: React.FocusEvent<HTMLInputElement>) => (e.currentTarget.style.borderColor = '#e2e8f0')

  return (
    <div style={{ marginBottom: 20, padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Design Forces (optional — leave blank to skip checks)
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px', alignItems: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#334155' }}>
          <Tex>{'M_{Ed}'}</Tex>
          <input style={inpStyle} type="number" min="0" step="1" placeholder="—"
            value={MEd} onChange={e => onMEd(e.target.value)}
            onFocus={focus} onBlur={blur} />
          <span style={{ fontSize: 11, color: '#64748b' }}>kNm</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#334155' }}>
          <Tex>{'N_{Ed}'}</Tex>
          <input style={inpStyle} type="number" min="0" step="1" placeholder="—"
            value={NEd} onChange={e => onNEd(e.target.value)}
            onFocus={focus} onBlur={blur} />
          <span style={{ fontSize: 11, color: '#64748b' }}>kN</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#334155' }}>
          <Tex>{'V_{Ed}'}</Tex>
          <input style={inpStyle} type="number" min="0" step="1" placeholder="—"
            value={VEd} onChange={e => onVEd(e.target.value)}
            onFocus={focus} onBlur={blur} />
          <span style={{ fontSize: 11, color: '#64748b' }}>kN</span>
        </label>
      </div>
    </div>
  )
}

// ── Main CapacityPanel ────────────────────────────────────────────────────────

export default function CapacityPanel({ row: propRow, toolAccess = DEFAULT_ACCESS }: { row: SectionRow | null; toolAccess?: ToolAccess }) {
  const { t } = useTranslation()
  const [grade, setGrade] = useState<SteelGrade>('S275')
  const [localRow, setLocalRow] = useState<SectionRow | null>(null)
  const [tab, setTab] = useState<'results' | 'details'>('results')
  const [selC1, setSelC1] = useState(1.00)
  const [selL, setSelL] = useState(6)
  const [selN, setSelN] = useState(0.5)
  const [selLcomp, setSelLcomp] = useState(6)
  const [exportOpen, setExportOpen] = useState(false)
  const [MEd, setMEd] = useState('')
  const [NEd, setNEd] = useState('')
  const [VEd, setVEd] = useState('')

  const row = localRow ?? propRow

  const result = useMemo(() => {
    if (!row) return null
    return computeCapacity(row, grade)
  }, [row, grade])

  if (!row) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <SectionSearch current={null} onSelect={r => setLocalRow(r)} />
          <span style={{ fontSize: 12, color: '#94a3b8' }}>{t('bbuc_search_hint')}</span>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
          {t('bb_no_results')}
        </div>
      </div>
    )
  }

  const { cs, mbRd, mNRd, nbRd } = result!

  // Parse optional design forces
  const medV = MEd !== '' ? parseFloat(MEd) : null
  const nedV = NEd !== '' ? parseFloat(NEd) : null
  const vedV = VEd !== '' ? parseFloat(VEd) : null

  return (
    <>
      <CapacityShell
        searchSlot={<SectionSearch current={row} onSelect={r => setLocalRow(r)} />}
        grade={grade}
        grades={['S275', 'S355']}
        onGrade={g => setGrade(g as SteelGrade)}
        gradeLabel={t('bbuc_grade_label')}
        tab={tab}
        onTab={setTab}
        tabLabels={{ results: t('bbuc_tab_results'), details: t('bbuc_tab_details') }}
        exportLabel={toolAccess.canExport ? `🖨 ${t('bbuc_exp_btn')}` : undefined}
        onExport={toolAccess.canExport ? () => setExportOpen(true) : undefined}
        exportLocked={!toolAccess.canExport}
        exportLockedLabel={t('bb_export_premium')}
        detailsLockedBanner={!toolAccess.canViewDetails
          ? <LockedBanner requiredTier="pro" message={t('bb_upgrade_details')} />
          : undefined
        }
        headerSlot={<HeaderCard row={row} grade={grade} cs={cs} />}
      >
        {cs.cls === 4 && (
          <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#854d0e' }}>
            {t('bbuc_class4_warning')}
          </div>
        )}

        {cs.cls < 4 && (
          <DesignForcesPanel
            MEd={MEd} NEd={NEd} VEd={VEd}
            onMEd={setMEd} onNEd={setNEd} onVEd={setVEd}
          />
        )}

        {cs.cls < 4 && tab === 'results' && (
          <>
            {/* Cross-section summary */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 3, height: 14, borderRadius: 2, background: ACCENT }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('bbuc_cs_title')}</span>
                <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 4 }}>{t('bbuc_cs_ref')}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 32px', padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 12, alignItems: 'center' }}>
                <span>
                  <Tex>{'M_{c,Rd}'}</Tex> = <strong>{r0(cs.Mc_Rd)} kNm</strong>
                  {medV !== null && isFinite(medV) && <PassFail ed={medV} rd={cs.Mc_Rd} />}
                </span>
                <span>
                  <Tex>{'N_{pl,Rd}'}</Tex> = <strong>{r0(cs.Npl_Rd)} kN</strong>
                  {nedV !== null && isFinite(nedV) && <PassFail ed={nedV} rd={cs.Npl_Rd} />}
                </span>
                <span>
                  <Tex>{'V_{pl,Rd}'}</Tex> = <strong>{r0(cs.Vpl_Rd)} kN</strong>
                  {vedV !== null && isFinite(vedV) && <PassFail ed={vedV} rd={cs.Vpl_Rd} />}
                </span>
                <span>{t('bbuc_header_class')} <strong>{cs.cls}</strong></span>
              </div>
            </div>
            <BendingSection      row={row} grade={grade} mbRd={mbRd} cs={cs} showDetails={false} selC1={selC1} selL={selL} onSelC1={setSelC1} onSelL={setSelL} />
            <AxialBendingSection row={row} grade={grade} mNRd={mNRd} cs={cs} showDetails={false} selN={selN} onSelN={setSelN} />
            <CompressionSection  row={row} grade={grade} nbRd={nbRd} cs={cs} showDetails={false} selLcomp={selLcomp} onSelLcomp={setSelLcomp} />
          </>
        )}

        {cs.cls < 4 && tab === 'details' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <CrossSectionDetails row={row} grade={grade} cs={cs} />

            {/* Utilisation check in details if forces entered */}
            {(medV !== null || nedV !== null || vedV !== null) && (
              <DetailGroup title="Utilisation Check">
                {medV !== null && isFinite(medV) && (
                  <CalcStep
                    label={<><Tex>{'M_{Ed} / M_{c,Rd}'}</Tex></>}
                    formula={`\\dfrac{M_{Ed}}{M_{c,Rd}} = \\dfrac{${medV}}{${r0(cs.Mc_Rd)}} = ${(medV / cs.Mc_Rd).toFixed(3)} ${medV / cs.Mc_Rd <= 1 ? '\\le 1.0 \\quad \\checkmark\\ \\textbf{PASS}' : '> 1.0 \\quad \\times\\ \\textbf{FAIL}'}`}
                  />
                )}
                {nedV !== null && isFinite(nedV) && (
                  <CalcStep
                    label={<><Tex>{'N_{Ed} / N_{pl,Rd}'}</Tex></>}
                    formula={`\\dfrac{N_{Ed}}{N_{pl,Rd}} = \\dfrac{${nedV}}{${r0(cs.Npl_Rd)}} = ${(nedV / cs.Npl_Rd).toFixed(3)} ${nedV / cs.Npl_Rd <= 1 ? '\\le 1.0 \\quad \\checkmark\\ \\textbf{PASS}' : '> 1.0 \\quad \\times\\ \\textbf{FAIL}'}`}
                  />
                )}
                {vedV !== null && isFinite(vedV) && (
                  <CalcStep
                    label={<><Tex>{'V_{Ed} / V_{pl,Rd}'}</Tex></>}
                    formula={`\\dfrac{V_{Ed}}{V_{pl,Rd}} = \\dfrac{${vedV}}{${r0(cs.Vpl_Rd)}} = ${(vedV / cs.Vpl_Rd).toFixed(3)} ${vedV / cs.Vpl_Rd <= 1 ? '\\le 1.0 \\quad \\checkmark\\ \\textbf{PASS}' : '> 1.0 \\quad \\times\\ \\textbf{FAIL}'}`}
                  />
                )}
              </DetailGroup>
            )}

            <BendingSection      row={row} grade={grade} mbRd={mbRd} cs={cs} showDetails selC1={selC1} selL={selL} onSelC1={setSelC1} onSelL={setSelL} />
            <AxialBendingSection row={row} grade={grade} mNRd={mNRd} cs={cs} showDetails selN={selN} onSelN={setSelN} />
            <CompressionSection  row={row} grade={grade} nbRd={nbRd} cs={cs} showDetails selLcomp={selLcomp} onSelLcomp={setSelLcomp} />
          </div>
        )}
      </CapacityShell>

      {exportOpen && (
        <SteelSectionsExportModal
          row={row} grade={grade} cs={cs}
          mbRd={mbRd} mNRd={mNRd} nbRd={nbRd}
          selC1={selC1} selL={selL} selN={selN} selLcomp={selLcomp}
          onClose={() => setExportOpen(false)}
        />
      )}
    </>
  )
}
