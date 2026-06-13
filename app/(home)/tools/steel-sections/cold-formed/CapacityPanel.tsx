'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import {
  computeCapacity,
  calcMbRdPoint,
  calcMNrdPoint,
  calcNbRdPoint,
  mbRdTable,
  mNrdTable,
  nbRdTable,
  LTB_LENGTHS,
  C1_VALUES,
  N_RATIOS,
  BUCK_LENGTHS,
  GRADES,
  type SteelGrade,
  type CrossSectionResult,
  type LtbRow,
  type MNrdRow,
  type NbRdRow,
} from './ec3-engine'
import { ALL_COLD_FORMED_ROWS } from './data/index'
import type { SectionRow } from '../_shared/types'
import { ColdFormedExportModal } from './ExportModal'
import {
  DetailGroup,
  CalcStep,
  Tex,
} from '../../../standards/_lib/ui'
import { CapacityShell, type CapacityTab } from '../_shared/CapacityShell'
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

function nf(v: number, d = 2): string {
  return isFinite(v) ? v.toFixed(d) : '—'
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
const INP: React.CSSProperties = {
  width: 72, padding: '4px 8px', fontSize: 11, borderRadius: 6,
  border: '1.5px solid #e2e8f0', outline: 'none', textAlign: 'center',
  fontFamily: 'monospace', background: '#fff', color: '#1e293b',
}

// ── Section search ────────────────────────────────────────────────────────────

function SectionSearch({ current, onSelect }: { current: SectionRow | null; onSelect: (r: SectionRow) => void }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const matches = useMemo(() => {
    const lq = q.toLowerCase()
    return lq ? ALL_COLD_FORMED_ROWS.filter(r => r.designation.toLowerCase().includes(lq)).slice(0, 20) : []
  }, [q])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const { t } = useTranslation()

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
      <input
        type="text" value={q}
        placeholder={current ? current.designation : t('bbcf_search_placeholder')}
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

// ── Header card ───────────────────────────────────────────────────────────────

function HeaderCard({ row, grade, cs }: { row: SectionRow; grade: SteelGrade; cs: CrossSectionResult }) {
  const { t } = useTranslation()
  return (
    <div style={{ background: 'linear-gradient(135deg, #0c4a6e, #0369a1)', borderRadius: 10, padding: '14px 18px', color: '#fff', marginBottom: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>
        {row.designation} · {grade}
        <span style={{ marginLeft: 10, fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.2)', borderRadius: 4, padding: '2px 8px' }}>
          {t('bbcf_header_class')} {cs.sectionClass}{cs.isClass4 ? ` — ${t('bbcf_header_class4_note')}` : ''}
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 24px', fontSize: 12, alignItems: 'baseline' }}>
        <span><span style={{ opacity: 0.7 }}><Tex>{'M_{c,y,Rd}'}</Tex></span> = <strong>{r0(cs.Mc_y_Rd)} kNm</strong></span>
        <span><span style={{ opacity: 0.7 }}><Tex>{'N_{pl,Rd}'}</Tex></span> = <strong>{r0(cs.Npl_Rd)} kN</strong></span>
        <span><span style={{ opacity: 0.7 }}><Tex>{'I'}</Tex></span> = <strong>{row.Ix.toLocaleString('en-GB')} cm⁴</strong></span>
        {!cs.isCHS && <span style={{ opacity: 0.6, fontSize: 10 }}>L<sub>c</sub> = {nf(cs.Lc_y, 2)} m</span>}
        {cs.isCHS && <span style={{ opacity: 0.6, fontSize: 10 }}>No LTB</span>}
      </div>
      <div style={{ marginTop: 8, fontSize: 10, opacity: 0.6 }}>
        {t('bbcf_header_ref')}
      </div>
    </div>
  )
}

// ── Cross-section details ─────────────────────────────────────────────────────

export function CrossSectionDetails({ row, grade, cs }: { row: SectionRow; grade: SteelGrade; cs: CrossSectionResult }) {
  const { t } = useTranslation()
  const t_mm  = cs.t_mm
  const h     = row.h
  const b     = row.b
  const eps   = Math.sqrt(235 / cs.fyVal)
  const cw    = h - 3 * t_mm
  const cf    = b - 3 * t_mm
  const A     = cs.A_mm2
  const Wy    = cs.sectionClass <= 2 ? cs.Wpl_y : cs.Wel_y
  const Wz    = cs.sectionClass <= 2 ? cs.Wpl_z : cs.Wel_z
  const eps2  = 235 / cs.fyVal  // ε²

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <DetailGroup title={t('bbcf_det_class_title')}>
        {cs.isCHS ? (
          <>
            <CalcStep
              label={t('bbcf_det_eps_label')}
              formula={`\\varepsilon^2 = \\dfrac{235}{f_y} = \\dfrac{235}{${cs.fyVal}} = ${nf(eps2, 4)}`}
            />
            <CalcStep
              label={t('bbchs_class_label')}
              formula={`\\dfrac{d}{t} = \\dfrac{${h}}{${t_mm}} = ${nf(h/t_mm, 2)} \\quad (50\\varepsilon^2 = ${nf(50*eps2, 2)},\\ 70\\varepsilon^2 = ${nf(70*eps2, 2)},\\ 90\\varepsilon^2 = ${nf(90*eps2, 2)}) \\quad \\Rightarrow \\text{Class ${cs.sectionClass}}`}
            />
          </>
        ) : (
          <>
            <CalcStep
              label={t('bbcf_det_eps_label')}
              formula={`\\varepsilon = \\sqrt{\\dfrac{235}{f_y}} = \\sqrt{\\dfrac{235}{${cs.fyVal}}} = ${nf(eps, 4)}`}
            />
            <CalcStep
              label={t('bbcf_det_cw_label')}
              formula={`c_w = h - 3t = ${h} - 3 \\times ${t_mm} = ${nf(cw, 1)}\\ \\mathrm{mm}, \\quad \\dfrac{c_w}{t} = ${nf(cw/t_mm, 2)}`}
            />
            <CalcStep
              label={t('bbcf_det_class_web_label')}
              formula={`\\dfrac{c_w}{t} = ${nf(cw/t_mm, 2)} \\le 72\\varepsilon = ${nf(72*eps, 2)} \\quad \\Rightarrow \\text{Web Class ${cs.classWeb}}`}
            />
            <CalcStep
              label={t('bbcf_det_cf_label')}
              formula={`c_f = b - 3t = ${b} - 3 \\times ${t_mm} = ${nf(cf, 1)}\\ \\mathrm{mm}, \\quad \\dfrac{c_f}{t} = ${nf(cf/t_mm, 2)}`}
            />
            <CalcStep
              label={t('bbcf_det_class_fl_label')}
              formula={`\\dfrac{c_f}{t} = ${nf(cf/t_mm, 2)} \\le 33\\varepsilon = ${nf(33*eps, 2)} \\quad \\Rightarrow \\text{Flange Class ${cs.classFl}}`}
            />
          </>
        )}
      </DetailGroup>
      <DetailGroup title={t('bbcf_det_cs_title')}>
        <CalcStep
          label={t('bbcf_det_npl_label')}
          formula={`N_{pl,Rd} = \\dfrac{A \\cdot f_y}{\\gamma_{M0}} = \\dfrac{${nf(A, 0)}\\ \\mathrm{mm^2} \\times ${cs.fyVal}}{1.0 \\times 10^3} = ${r0(cs.Npl_Rd)}\\ \\mathrm{kN}`}
        />
        <CalcStep
          label={t('bbcf_det_mcy_label')}
          formula={`M_{c,Rd} = \\dfrac{${cs.sectionClass <= 2 ? 'W_{pl}' : 'W_{el}'} \\cdot f_y}{\\gamma_{M0}} = \\dfrac{${nf(Wy, 0)}\\ \\mathrm{mm^3} \\times ${cs.fyVal}}{1.0 \\times 10^6} = ${r0(cs.Mc_y_Rd)}\\ \\mathrm{kNm}`}
        />
        {!cs.isSHS && !cs.isCHS && (
          <CalcStep
            label={t('bbcf_det_mcz_label')}
            formula={`M_{c,z,Rd} = \\dfrac{${cs.sectionClass <= 2 ? 'W_{pl,z}' : 'W_{el,z}'} \\cdot f_y}{\\gamma_{M0}} = \\dfrac{${nf(Wz, 0)}\\ \\mathrm{mm^3} \\times ${cs.fyVal}}{1.0 \\times 10^6} = ${r0(cs.Mc_z_Rd)}\\ \\mathrm{kNm}`}
          />
        )}
      </DetailGroup>
      {!cs.isCHS && (
        <DetailGroup title={t('bbcf_det_lc_title')}>
          <CalcStep
            label=""
            formula={`L_c = \\dfrac{\\bar{\\lambda}_{LT,0} \\cdot \\pi \\cdot \\sqrt{EI_z \\cdot GI_T}}{W_y \\cdot f_y} = \\dfrac{0.4 \\cdot \\pi \\cdot \\sqrt{EI_z \\cdot GI_T}}{W_y \\cdot f_y} = ${nf(cs.Lc_y, 2)}\\ \\mathrm{m}`}
          />
        </DetailGroup>
      )}
    </div>
  )
}

// ── Bending section ───────────────────────────────────────────────────────────

export function BendingSection({ row, grade, ltbRows, cs, showDetails, selC1, selL, onSelC1, onSelL }: {
  row: SectionRow; grade: SteelGrade; ltbRows: LtbRow[]; cs: CrossSectionResult
  showDetails?: boolean
  selC1: number; selL: number
  onSelC1: (v: number) => void; onSelL: (v: number) => void
}) {
  const { t } = useTranslation()
  const Wy = cs.sectionClass <= 2 ? cs.Wpl_y : cs.Wel_y
  const hiC1i = C1_VALUES.reduce((best, c, i) => Math.abs(c - selC1) < Math.abs(C1_VALUES[best] - selC1) ? i : best, 0)
  const hiLi  = LTB_LENGTHS.reduce((best, l, i) => Math.abs(l - selL) < Math.abs(LTB_LENGTHS[best] - selL) ? i : best, 0)
  const pt = calcMbRdPoint(row, grade, selC1, selL)

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 3, height: 14, borderRadius: 2, background: ACCENT }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>{t('bbcf_bend_title')} <Tex>{'M_{b,Rd}'}</Tex> (kNm)</span>
        <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 4 }}>{t('bbcf_bend_ref')}</span>
      </div>

      <div className="bb-table-wrap" style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 10 }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr>
              <th style={{ ...TH, textAlign: 'left', minWidth: 52 }}>{t('bbcf_bend_c1_col')}</th>
              {LTB_LENGTHS.map((l, li) => (
                <th key={l} style={{ ...TH, background: li === hiLi ? '#e0f2fe' : TH.background }}>{l.toFixed(1)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ltbRows.map((ltbRow, ci) => (
              <tr key={ltbRow.C1} style={{ background: ci === hiC1i ? '#f0f9ff' : ci % 2 === 0 ? '#fff' : '#f8fafc' }}>
                <td style={{ ...TDL, background: ci === hiC1i ? '#e0f2fe' : TDL.background }}>{ltbRow.C1.toFixed(2)}</td>
                {ltbRow.MbRds.map((v, li) => (
                  <td key={li} onClick={() => { onSelC1(C1_VALUES[ci]); onSelL(LTB_LENGTHS[li]) }}
                    style={{
                      ...TD,
                      color: '#1e293b',
                      background: ci === hiC1i && li === hiLi ? '#bae6fd' : undefined,
                      cursor: 'pointer', fontWeight: ci === hiC1i && li === hiLi ? 700 : undefined,
                    }}>
                    {v === null ? r2(cs.Mc_y_Rd) : r2(v)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: 10, color: '#64748b', marginBottom: 8 }}>
        {t('bbcf_bend_lc_note')} (L<sub>c</sub> = {nf(cs.Lc_y, 2)} m)
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: '#0369a1', fontWeight: 600 }}>{t('bbcf_tab_details')}:</span>
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

      {showDetails && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <DetailGroup title={t('bbcf_det_ltb_title')}>
            <CalcStep
              label={t('bbcf_det_mcr_label')}
              formula={`M_{cr} = C_1 \\cdot \\dfrac{\\pi}{L} \\cdot \\sqrt{EI_z \\cdot GI_T} \\quad (\\text{no warping for hollow})`}
            />
            <CalcStep
              label={`C₁ = ${selC1.toFixed(2)}, L = ${selL} m`}
              formula={`M_{cr} = ${nf(pt.Mcr, 3)}\\ \\mathrm{kNm}`}
            />
          </DetailGroup>
          <DetailGroup title={<><Tex>{'\\bar{\\lambda}_{LT}'}</Tex> — {t('bbcf_det_lam_lt_label')}</>}>
            <CalcStep
              label={t('bbcf_det_lam_lt_label')}
              formula={`\\bar{\\lambda}_{LT} = \\sqrt{\\dfrac{W_y \\cdot f_y}{M_{cr}}} = \\sqrt{\\dfrac{${nf(Wy, 0)} \\times ${cs.fyVal}}{${nf(pt.Mcr * 1e6, 0)}}} = ${nf(pt.lamLT, 4)}`}
            />
            <CalcStep
              label={pt.lamLT <= 0.4 ? 'λ̄_LT ≤ 0.4 → no LTB reduction' : 'λ̄_LT > 0.4'}
              formula={pt.lamLT <= 0.4
                ? `\\bar{\\lambda}_{LT} = ${nf(pt.lamLT, 4)} \\le 0.4 \\quad \\Rightarrow \\chi_{LT} = 1.0`
                : `\\bar{\\lambda}_{LT} = ${nf(pt.lamLT, 4)} > 0.4 \\quad \\Rightarrow \\text{reduction applies}`
              }
            />
          </DetailGroup>
          <DetailGroup title={<><Tex>{'\\chi_{LT}'}</Tex> — {t('bbcf_det_chi_lt_label')}</>}>
            <CalcStep
              label={t('bbcf_det_phi_lt_label')}
              formula={`\\Phi_{LT} = 0.5\\left[1 + 0.34(\\bar{\\lambda}_{LT} - 0.4) + 0.75\\bar{\\lambda}_{LT}^2\\right] = ${nf(pt.phi, 4)}`}
            />
            <CalcStep
              label={t('bbcf_det_chi_lt_label')}
              formula={`\\chi_{LT} = ${nf(pt.chiLT, 4)}`}
            />
            <CalcStep
              label={t('bbcf_det_f_label')}
              formula={`\\chi_{LT,\\mathrm{mod}} = ${nf(pt.chiLTmod, 4)}`}
            />
            <CalcStep
              label={t('bbcf_det_mbrd_label')}
              formula={`M_{b,Rd} = ${nf(pt.chiLTmod, 4)} \\times ${nf(Wy, 0)}\\ \\mathrm{mm^3} \\times \\dfrac{${cs.fyVal}}{1.0 \\times 10^6} = ${r2(pt.MbRd)}\\ \\mathrm{kNm}`}
            />
          </DetailGroup>
        </div>
      )}
    </div>
  )
}

// ── Axial + Bending section ───────────────────────────────────────────────────

export function AxialBendingSection({ row, grade, mnRows, cs, showDetails, selN, onSelN }: {
  row: SectionRow; grade: SteelGrade; mnRows: MNrdRow[]; cs: CrossSectionResult
  showDetails?: boolean
  selN: number; onSelN: (v: number) => void
}) {
  const { t } = useTranslation()
  const pt = calcMNrdPoint(row, grade, selN)
  const hiNi = N_RATIOS.reduce((best, n, i) => Math.abs(n - selN) < Math.abs(N_RATIOS[best] - selN) ? i : best, 0)
  const Mpl_y = cs.Npl_Rd > 0 ? (cs.Wpl_y * cs.fyVal / 1e6) : 0
  const Mpl_z = cs.Npl_Rd > 0 ? (cs.Wpl_z * cs.fyVal / 1e6) : 0

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 3, height: 14, borderRadius: 2, background: ACCENT }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>{t('bbcf_axbend_title')} <Tex>{'M_{N,Rd}'}</Tex> (kNm)</span>
        <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 4 }}>{t('bbcf_axbend_ref')}</span>
      </div>

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
            {[0, ...(cs.isSHS || cs.isCHS ? [] : [1])].map(axis => (
              <tr key={axis} style={{ background: axis % 2 === 0 ? '#fff' : '#f8fafc' }}>
                <td style={TDL}><Tex>{axis === 0 ? 'M_{N,y,Rd}' : 'M_{N,z,Rd}'}</Tex></td>
                {mnRows.map((mnRow, ni) => {
                  const v = axis === 0 ? mnRow.MN_y_Rd : mnRow.MN_z_Rd
                  return (
                    <td key={ni} onClick={() => onSelN(N_RATIOS[ni])}
                      style={{
                        ...TD,
                        color: v === null ? '#94a3b8' : '#1e293b',
                        background: ni === hiNi ? '#bae6fd' : undefined,
                        cursor: 'pointer', fontWeight: ni === hiNi ? 700 : undefined,
                      }}>
                      {v === null ? '—' : r2(v)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: 10, color: '#64748b', marginBottom: 8, display: 'flex', flexWrap: 'wrap', gap: '0 16px', alignItems: 'baseline' }}>
        <span><Tex>{'N_{pl,Rd}'}</Tex> = {r0(cs.Npl_Rd)} kN</span>
        <span><Tex>{'M_{pl,Rd}'}</Tex> = {r0(cs.Mc_y_Rd)} kNm</span>
        {!cs.isSHS && !cs.isCHS && <span><Tex>{'M_{pl,z,Rd}'}</Tex> = {r0(cs.Mc_z_Rd)} kNm</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: '#0369a1', fontWeight: 600 }}>{t('bbcf_tab_details')}:</span>
        <label style={{ fontSize: 11, color: '#475569', display: 'flex', alignItems: 'center', gap: 5 }}>
          n =
          <input style={INP} type="number" step="0.05" min="0" max="1"
            value={selN} onChange={e => { const v = parseFloat(e.target.value); if (isFinite(v) && v >= 0 && v <= 1) onSelN(v) }} />
        </label>
        <span style={{ fontSize: 11, color: '#64748b' }}>
          → <Tex>{'M_{N,y,Rd}'}</Tex> = <strong style={{ color: '#0369a1' }}>{r2(pt.MN_y_Rd)} kNm</strong>
          {!cs.isSHS && !cs.isCHS && <span style={{ marginLeft: 8 }}><Tex>{'M_{N,z,Rd}'}</Tex> = <strong style={{ color: '#0369a1' }}>{r2(pt.MN_z_Rd)} kNm</strong></span>}
        </span>
      </div>

      {showDetails && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <DetailGroup title={t('bbcf_det_mnrd_title')}>
            <CalcStep
              label={t('bbcf_det_aw_label')}
              formula={`a_w = \\dfrac{A - 2bt}{A} \\le 0.5 = ${nf(pt.aw, 4)}`}
            />
            {!cs.isSHS && !cs.isCHS && (
              <CalcStep
                label={t('bbcf_det_af_label')}
                formula={`a_f = \\dfrac{A - 2ht}{A} \\le 0.5 = ${nf(pt.af, 4)}`}
              />
            )}
            <CalcStep
              label={t('bbcf_det_mny_label')}
              formula={cs.isCHS
                ? (cs.sectionClass <= 2
                  ? `M_{N,Rd} = M_{pl} \\cdot \\left(1 - \\left(\\dfrac{n}{a}\\right)^2\\right) = ${r0(Mpl_y)} \\times \\left(1 - \\left(\\dfrac{${selN.toFixed(2)}}{${nf(pt.aw,4)}}\\right)^2\\right) = ${r2(pt.MN_y_Rd)}\\ \\mathrm{kNm}`
                  : `M_{N,Rd} = M_{pl} \\times (1-n) = ${r0(Mpl_y)} \\times (1-${selN.toFixed(2)}) = ${r2(pt.MN_y_Rd)}\\ \\mathrm{kNm}`)
                : (cs.sectionClass <= 2
                  ? `M_{N,y,Rd} = M_{pl,y} \\cdot \\dfrac{1-n}{1-0.5a_w} = ${r0(Mpl_y)} \\times \\dfrac{1-${selN.toFixed(2)}}{1-0.5 \\times ${nf(pt.aw,4)}} = ${r2(pt.MN_y_Rd)}\\ \\mathrm{kNm}`
                  : `M_{N,y,Rd} = M_{pl,y} \\times (1-n) = ${r0(Mpl_y)} \\times (1-${selN.toFixed(2)}) = ${r2(pt.MN_y_Rd)}\\ \\mathrm{kNm}`)
              }
            />
            {!cs.isSHS && !cs.isCHS && (
              <CalcStep
                label={t('bbcf_det_mnz_label')}
                formula={cs.sectionClass <= 2
                  ? `M_{N,z,Rd} = M_{pl,z} \\cdot \\dfrac{1-n}{1-0.5a_f} = ${r0(Mpl_z)} \\times \\dfrac{1-${selN.toFixed(2)}}{1-0.5 \\times ${nf(pt.af,4)}} = ${r2(pt.MN_z_Rd)}\\ \\mathrm{kNm}`
                  : `M_{N,z,Rd} = M_{pl,z} \\times (1-n) = ${r0(Mpl_z)} \\times (1-${selN.toFixed(2)}) = ${r2(pt.MN_z_Rd)}\\ \\mathrm{kNm}`
                }
              />
            )}
          </DetailGroup>
        </div>
      )}
    </div>
  )
}

// ── Compression section ───────────────────────────────────────────────────────

export function CompressionSection({ row, grade, nbRows, cs, showDetails, selLcomp, onSelLcomp }: {
  row: SectionRow; grade: SteelGrade; nbRows: NbRdRow[]; cs: CrossSectionResult
  showDetails?: boolean
  selLcomp: number; onSelLcomp: (v: number) => void
}) {
  const { t } = useTranslation()
  const hiLi = BUCK_LENGTHS.reduce((best, l, i) => Math.abs(l - selLcomp) < Math.abs(BUCK_LENGTHS[best] - selLcomp) ? i : best, 0)
  const pt = calcNbRdPoint(row, grade, selLcomp)
  const eps = Math.sqrt(235 / cs.fyVal)

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 3, height: 14, borderRadius: 2, background: ACCENT }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>{t('bbcf_comp_title')} <Tex>{'N_{b,Rd}'}</Tex> (kN)</span>
        <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 4 }}>{t('bbcf_comp_ref')}</span>
      </div>

      <div className="bb-table-wrap" style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 10 }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr>
              <th style={{ ...TH, textAlign: 'left', minWidth: 80 }}>{t('bbcf_comp_axis_col')}</th>
              {BUCK_LENGTHS.map((l, li) => (
                <th key={l} style={{ ...TH, background: li === hiLi ? '#e0f2fe' : TH.background }}>{l.toFixed(1)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[0, 1].map(axis => (
              <tr key={axis} style={{ background: axis % 2 === 0 ? '#fff' : '#f8fafc' }}>
                <td style={TDL}><Tex>{axis === 0 ? 'N_{b,y,Rd}' : 'N_{b,z,Rd}'}</Tex></td>
                {nbRows.map((nbRow, li) => {
                  const v = axis === 0 ? nbRow.Nb_y_Rd : nbRow.Nb_z_Rd
                  return (
                    <td key={li} onClick={() => onSelLcomp(BUCK_LENGTHS[li])}
                      style={{
                        ...TD, color: '#1e293b',
                        background: li === hiLi ? '#bae6fd' : undefined,
                        cursor: 'pointer', fontWeight: li === hiLi ? 700 : undefined,
                      }}>
                      {r2(v)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: 10, color: '#64748b', marginBottom: 8, display: 'flex', gap: '0 12px', alignItems: 'baseline', flexWrap: 'wrap' }}>
        <span>{t('bbcf_comp_footer')}</span>
        <span><Tex>{'N_{pl,Rd}'}</Tex> = {r0(cs.Npl_Rd)} kN</span>
        <span style={{ opacity: 0.7 }}>{t('bbcf_comp_curve')}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: '#0369a1', fontWeight: 600 }}>{t('bbcf_tab_details')}:</span>
        <label style={{ fontSize: 11, color: '#475569', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Tex>{'L_{cr}'}</Tex> (m)
          <input style={INP} type="number" step="0.5" min="0.5" max="30"
            value={selLcomp} onChange={e => { const v = parseFloat(e.target.value); if (isFinite(v) && v > 0) onSelLcomp(v) }} />
        </label>
        <span style={{ fontSize: 11, color: '#64748b' }}>
          → <Tex>{'N_{b,y,Rd}'}</Tex> = <strong style={{ color: '#0369a1' }}>{r2(pt.Nb_y_Rd)}</strong>
          <span style={{ marginLeft: 6 }}><Tex>{'N_{b,z,Rd}'}</Tex> = <strong style={{ color: '#0369a1' }}>{r2(pt.Nb_z_Rd)}</strong></span>
          <span style={{ marginLeft: 6, fontSize: 10, color: '#94a3b8' }}>kN</span>
        </span>
      </div>

      {showDetails && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <DetailGroup title={t('bbcf_det_nbrd_title')}>
            <CalcStep
              label={t('bbcf_det_eps_label')}
              formula={`\\varepsilon = \\sqrt{\\dfrac{235}{${cs.fyVal}}} = ${nf(eps, 4)}`}
            />
            <CalcStep
              label={t('bbcf_det_lam_y_label')}
              formula={`\\bar{\\lambda}_y = \\dfrac{${selLcomp * 1000}/${nf(cs.iy_mm, 1)}}{\\pi\\sqrt{E/f_y}} = ${nf(pt.lamY, 4)} \\quad \\Rightarrow \\chi_y = ${nf(pt.chiY, 4)}`}
            />
            <CalcStep
              label={t('bbcf_det_lam_z_label')}
              formula={`\\bar{\\lambda}_z = \\dfrac{${selLcomp * 1000}/${nf(cs.iz_mm, 1)}}{\\pi\\sqrt{E/f_y}} = ${nf(pt.lamZ, 4)} \\quad \\Rightarrow \\chi_z = ${nf(pt.chiZ, 4)}`}
            />
            <CalcStep
              label={t('bbcf_det_nby_label')}
              formula={`N_{b,y,Rd} = ${nf(pt.chiY, 4)} \\times \\dfrac{${nf(cs.A_mm2, 0)}\\ \\mathrm{mm^2} \\times ${cs.fyVal}}{1.0 \\times 10^3} = ${r2(pt.Nb_y_Rd)}\\ \\mathrm{kN}`}
            />
            <CalcStep
              label={t('bbcf_det_nbz_label')}
              formula={`N_{b,z,Rd} = ${nf(pt.chiZ, 4)} \\times \\dfrac{${nf(cs.A_mm2, 0)}\\ \\mathrm{mm^2} \\times ${cs.fyVal}}{1.0 \\times 10^3} = ${r2(pt.Nb_z_Rd)}\\ \\mathrm{kN}`}
            />
          </DetailGroup>
        </div>
      )}
    </div>
  )
}

// ── Main CapacityPanel ────────────────────────────────────────────────────────

export default function ColdFormedCapacityPanel({ row: propRow, toolAccess = DEFAULT_ACCESS }: { row: SectionRow | null; toolAccess?: ToolAccess }) {
  const { t } = useTranslation()
  const [grade, setGrade] = useState<SteelGrade>('S355')
  const [localRow, setLocalRow] = useState<SectionRow | null>(null)
  const [tab, setTab] = useState<CapacityTab>('results')
  const [selC1, setSelC1] = useState(1.00)
  const [selL, setSelL] = useState(6)
  const [selN, setSelN] = useState(0.5)
  const [selLcomp, setSelLcomp] = useState(6)
  const [exportOpen, setExportOpen] = useState(false)

  const row = localRow ?? propRow

  const cs = useMemo(() => row ? computeCapacity(row, grade) : null, [row, grade])
  const ltbRows = useMemo(() => row ? mbRdTable(row, grade) : [], [row, grade])
  const mnRows  = useMemo(() => row ? mNrdTable(row, grade) : [], [row, grade])
  const nbRows  = useMemo(() => row ? nbRdTable(row, grade) : [], [row, grade])

  if (!row || !cs) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <SectionSearch current={null} onSelect={r => setLocalRow(r)} />
          <span style={{ fontSize: 12, color: '#94a3b8' }}>{t('bbcf_search_hint')}</span>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
          {t('bb_no_results')}
        </div>
      </div>
    )
  }

  return (
    <>
      <CapacityShell
        searchSlot={<SectionSearch current={row} onSelect={r => setLocalRow(r)} />}
        grade={grade}
        grades={GRADES as unknown as string[]}
        onGrade={g => setGrade(g as SteelGrade)}
        gradeLabel={t('bbcf_grade_label')}
        tab={tab}
        onTab={setTab}
        tabLabels={{ results: t('bbcf_tab_results'), details: t('bbcf_tab_details') }}
        exportLabel={toolAccess.canExport ? `🖨 ${t('bbcf_exp_btn')}` : undefined}
        onExport={toolAccess.canExport ? () => setExportOpen(true) : undefined}
        exportLocked={!toolAccess.canExport}
        exportLockedLabel={t('bb_export_premium')}
        detailsLockedBanner={!toolAccess.canViewDetails
          ? <LockedBanner requiredTier="pro" message={t('bb_upgrade_details')} />
          : undefined
        }
        headerSlot={<HeaderCard row={row} grade={grade} cs={cs} />}
      >
        {cs.isClass4 && (
          <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#854d0e', marginBottom: 16 }}>
            {t('bbcf_header_class')} 4 — {t('bbcf_header_class4_note')}
          </div>
        )}

        {!cs.isClass4 && tab === 'results' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 3, height: 14, borderRadius: 2, background: ACCENT }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t('bbcf_cs_title')}</span>
                <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 4 }}>{t('bbcf_cs_ref')}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 32px', padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 12, alignItems: 'baseline' }}>
                <span><Tex>{'M_{c,Rd}'}</Tex> = <strong>{r0(cs.Mc_y_Rd)} kNm</strong></span>
                {!cs.isSHS && !cs.isCHS && <span><Tex>{'M_{c,z,Rd}'}</Tex> = <strong>{r0(cs.Mc_z_Rd)} kNm</strong></span>}
                <span><Tex>{'N_{pl,Rd}'}</Tex> = <strong>{r0(cs.Npl_Rd)} kN</strong></span>
                <span>{t('bbcf_header_class')} <strong>{cs.sectionClass}</strong></span>
              </div>
            </div>
            {cs.isCHS ? (
              <div style={{ marginBottom: 24, padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 3, height: 14, borderRadius: 2, background: '#16a34a' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#166534' }}>{t('bbchs_no_ltb_title')}</span>
                </div>
                <p style={{ margin: 0, fontSize: 11, color: '#166534' }}>{t('bbchs_no_ltb_note')}</p>
                <p style={{ margin: '6px 0 0', fontSize: 12, color: '#1e293b' }}><Tex>{'M_{b,Rd}'}</Tex> = <Tex>{'M_{c,Rd}'}</Tex> = <strong>{r0(cs.Mc_y_Rd)} kNm</strong></p>
              </div>
            ) : (
              <BendingSection row={row} grade={grade} ltbRows={ltbRows} cs={cs} showDetails={false} selC1={selC1} selL={selL} onSelC1={setSelC1} onSelL={setSelL} />
            )}
            <AxialBendingSection row={row} grade={grade} mnRows={mnRows}   cs={cs} showDetails={false} selN={selN} onSelN={setSelN} />
            <CompressionSection  row={row} grade={grade} nbRows={nbRows}   cs={cs} showDetails={false} selLcomp={selLcomp} onSelLcomp={setSelLcomp} />
          </>
        )}

        {!cs.isClass4 && tab === 'details' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <CrossSectionDetails row={row} grade={grade} cs={cs} />
            {cs.isCHS ? (
              <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 3, height: 14, borderRadius: 2, background: '#16a34a' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#166534' }}>{t('bbchs_no_ltb_title')}</span>
                </div>
                <p style={{ margin: 0, fontSize: 11, color: '#166534' }}>{t('bbchs_no_ltb_note')}</p>
              </div>
            ) : (
              <BendingSection row={row} grade={grade} ltbRows={ltbRows} cs={cs} showDetails selC1={selC1} selL={selL} onSelC1={setSelC1} onSelL={setSelL} />
            )}
            <AxialBendingSection row={row} grade={grade} mnRows={mnRows}   cs={cs} showDetails selN={selN} onSelN={setSelN} />
            <CompressionSection  row={row} grade={grade} nbRows={nbRows}   cs={cs} showDetails selLcomp={selLcomp} onSelLcomp={setSelLcomp} />
          </div>
        )}
      </CapacityShell>

      {exportOpen && (
        <ColdFormedExportModal
          row={row} grade={grade} cs={cs}
          ltbRows={ltbRows} mnRows={mnRows} nbRows={nbRows}
          selC1={selC1} selL={selL} selN={selN} selLcomp={selLcomp}
          onClose={() => setExportOpen(false)}
        />
      )}
    </>
  )
}
