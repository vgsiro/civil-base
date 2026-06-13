'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import {
  computeCapacity,
  LTB_LENGTHS,
  C1_VALUES,
  N_RATIOS,
  BUCK_LENGTHS,
  fy,
  type SteelGrade,
  type CrossSectionResult,
  type MNrdRow,
  type NbRdRow,
} from './ec3-capacity'
import { ALL_SECTION_TYPES, type SectionRow } from '../data/index'
import {
  ResultsDetailsProvider,
  ResultsDetailsTabBar,
  ResultsBox,
  DetailsSection,
  DetailGroup,
  CalcStep,
  Tex,
} from '../../../standards/_lib/ui'

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

// ── Shared sub-tab bar (Results / Details) ────────────────────────────────────

function SubTabBar({ active, onChange }: { active: 'results' | 'details'; onChange: (t: 'results' | 'details') => void }) {
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
      {(['results', 'details'] as const).map(t => (
        <button key={t} onClick={() => onChange(t)} style={{
          padding: '4px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer',
          border: `1.5px solid ${active === t ? ACCENT : '#e2e8f0'}`,
          background: active === t ? ACCENT : '#fff',
          color: active === t ? '#fff' : '#64748b',
          transition: 'all 0.15s',
        }}>
          {t === 'results' ? 'Results' : 'Details'}
        </button>
      ))}
    </div>
  )
}

// ── Section search ────────────────────────────────────────────────────────────

const ALL_ROWS: SectionRow[] = ALL_SECTION_TYPES.flatMap(st => st.rows)

function SectionSearch({ current, onSelect }: { current: SectionRow | null; onSelect: (r: SectionRow) => void }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const matches = useMemo(() => {
    const lq = q.toLowerCase()
    return lq ? ALL_ROWS.filter(r => r.designation.toLowerCase().includes(lq)).slice(0, 20) : []
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
  return (
    <div style={{ background: 'linear-gradient(135deg, #0c4a6e, #0369a1)', borderRadius: 10, padding: '14px 18px', color: '#fff', marginBottom: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>
        {row.designation} · {grade}
        <span style={{ marginLeft: 10, fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.2)', borderRadius: 4, padding: '2px 8px' }}>
          Class {cs.cls}{cs.cls === 4 ? ' — effective section required' : ''}
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 24px', fontSize: 12, alignItems: 'baseline' }}>
        <span><span style={{ opacity: 0.7 }}><Tex>{'M_{c,Rd}'}</Tex></span> = <strong>{r0(cs.Mc_Rd)} kNm</strong></span>
        <span><span style={{ opacity: 0.7 }}><Tex>{'N_{pl,Rd}'}</Tex></span> = <strong>{r0(cs.Npl_Rd)} kN</strong></span>
        <span><span style={{ opacity: 0.7 }}><Tex>{'V_{pl,Rd}'}</Tex></span> = <strong>{r0(cs.Vpl_Rd)} kN</strong></span>
        <span><span style={{ opacity: 0.7 }}><Tex>{'I_x'}</Tex></span> = <strong>{row.Ix.toLocaleString('en-GB')} cm⁴</strong></span>
      </div>
      <div style={{ marginTop: 8, fontSize: 10, opacity: 0.6 }}>
        BS EN 1993-1-1:2005 + BS 4-1:2005 · γ_M0 = γ_M1 = 1.0 (UK NA)
      </div>
    </div>
  )
}

// ── Cross-section details ─────────────────────────────────────────────────────

function n(v: number, d = 2) { return isFinite(v) ? v.toFixed(d) : '—' }

function CrossSectionDetails({ row, grade, cs }: { row: SectionRow; grade: SteelGrade; cs: CrossSectionResult }) {
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
      <DetailGroup title="Material — Table 3.1">
        <CalcStep
          label="Yield strength"
          formula={`f_y = ${fyv}\\ \\mathrm{N/mm^2}\\quad (${grade},\\ t_f = ${row.tf}\\ \\mathrm{mm} \\le 16\\ \\mathrm{mm})`}
        />
        <CalcStep
          label="Epsilon factor"
          formula={`\\varepsilon = \\sqrt{\\dfrac{235}{f_y}} = \\sqrt{\\dfrac{235}{${fyv}}} = ${n(eps, 4)}`}
        />
      </DetailGroup>

      <DetailGroup title="Cross-section classification — §5.5.2">
        <CalcStep
          label="Web depth between fillets"
          formula={`d = h - 2t_f - 2r = ${row.h} - 2 \\times ${row.tf} - 2 \\times ${row.r} = ${n(d, 1)}\\ \\mathrm{mm}`}
        />
        <CalcStep
          label="Web slenderness"
          formula={`\\dfrac{d}{t_w} = \\dfrac{${n(d,1)}}{${row.tw}} = ${n(d/row.tw, 2)} \\quad \\le 72\\varepsilon = ${n(72*eps,2)} \\quad \\Rightarrow \\text{Web Class ${webClass}}`}
        />
        <CalcStep
          label="Flange outstand"
          formula={`c_f = \\dfrac{b - t_w - 2r}{2} = \\dfrac{${row.b} - ${row.tw} - 2 \\times ${row.r}}{2} = ${n(cf,1)}\\ \\mathrm{mm}`}
        />
        <CalcStep
          label="Flange slenderness"
          formula={`\\dfrac{c_f}{t_f} = \\dfrac{${n(cf,1)}}{${row.tf}} = ${n(cf/row.tf,2)} \\quad \\le 9\\varepsilon = ${n(9*eps,2)} \\quad \\Rightarrow \\text{Flange Class ${flangeClass}}`}
        />
        <CalcStep
          label="Section class"
          formula={`\\text{Class} = \\max(${webClass},\\ ${flangeClass}) = \\mathbf{Class\\ ${cs.cls}}`}
        />
      </DetailGroup>

      <DetailGroup title="Cross-section resistances — §6.2">
        <CalcStep
          label={<><Tex>{'N_{pl,Rd}'}</Tex> — §6.2.4</>}
          formula={`N_{pl,Rd} = \\dfrac{A \\cdot f_y}{\\gamma_{M0}} = \\dfrac{${n(A,0)}\\ \\mathrm{mm^2} \\times ${fyv}}{1.0 \\times 10^3} = ${r0(cs.Npl_Rd)}\\ \\mathrm{kN}`}
        />
        <CalcStep
          label={<><Tex>{cs.cls <= 2 ? 'M_{c,y,Rd}' : 'M_{c,y,Rd}'}</Tex> — §6.2.5 ({cs.cls <= 2 ? <Tex>{'W_{pl,y}'}</Tex> : <Tex>{'W_{el,y}'}</Tex>}, Class {cs.cls})</>}
          formula={`M_{c,y,Rd} = \\dfrac{${cs.cls <= 2 ? 'W_{pl,y}' : 'W_{el,y}'} \\cdot f_y}{\\gamma_{M0}} = \\dfrac{${n(W,0)}\\ \\mathrm{mm^3} \\times ${fyv}}{1.0 \\times 10^6} = ${r0(cs.Mc_Rd)}\\ \\mathrm{kNm}`}
        />
        <CalcStep
          label={<>Shear area <Tex>{'A_v'}</Tex> — §6.2.6</>}
          formula={`A_v = A - 2b \\cdot t_f + (t_w + 2r) \\cdot t_f`}
        />
        <CalcStep
          label=""
          formula={`= ${n(A,0)} - 2 \\times ${row.b} \\times ${row.tf} + (${row.tw} + 2 \\times ${row.r}) \\times ${row.tf} = ${n(Av,0)}\\ \\mathrm{mm^2}`}
        />
        <CalcStep
          label={<><Tex>{'V_{pl,Rd}'}</Tex> — §6.2.6</>}
          formula={`V_{pl,Rd} = \\dfrac{A_v \\cdot f_y}{\\sqrt{3} \\cdot \\gamma_{M0}} = \\dfrac{${n(Av,0)} \\times ${fyv}}{\\sqrt{3} \\times 1.0 \\times 10^3} = ${r0(cs.Vpl_Rd)}\\ \\mathrm{kN}`}
        />
      </DetailGroup>
    </div>
  )
}

// ── Bending section ───────────────────────────────────────────────────────────

function BendingSection({ row, grade, mbRd, cs }: { row: SectionRow; grade: SteelGrade; mbRd: number[][]; cs: CrossSectionResult }) {
  const [tab, setTab] = useState<'results' | 'details'>('results')
  const fyv = fy(grade)
  const alpha = row.h / row.b > 2 ? 0.34 : 0.49
  const curve = row.h / row.b > 2 ? 'b' : 'c'
  const W = cs.cls <= 2 ? row.Zx * 1000 : row.Wx * 1000  // mm³

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 14, borderRadius: 2, background: ACCENT }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>BENDING — Buckling Resistance Moment <Tex>{'M_{b,Rd}'}</Tex> (kNm)</span>
        <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 4 }}>§6.3.2.2</span>
      </div>
      <SubTabBar active={tab} onChange={setTab} />

      {tab === 'results' && (
        <div className="bb-table-wrap" style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #e2e8f0' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr>
                <th style={{ ...TH, textAlign: 'left', minWidth: 52 }}>C₁</th>
                {LTB_LENGTHS.map(l => <th key={l} style={TH}>{l}</th>)}
              </tr>
            </thead>
            <tbody>
              {C1_VALUES.map((C1, ci) => (
                <tr key={C1}>
                  <td style={TDL}>{C1.toFixed(2)}</td>
                  {LTB_LENGTHS.map((_, li) => (
                    <td key={li} style={{ ...TD, color: mbRd[ci][li] < 0 ? '#94a3b8' : '#1e293b' }}>
                      {r0(mbRd[ci][li])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'details' && (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '14px 16px', background: '#fff', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <DetailGroup title="LTB buckling curve — EC3 Table 6.4">
            <CalcStep
              label={<>h/b ratio</>}
              formula={`\\dfrac{h}{b} = \\dfrac{${row.h}}{${row.b}} = ${n(row.h/row.b, 2)} ${row.h/row.b > 2 ? '> 2' : '\\le 2'} \\quad \\Rightarrow \\text{Curve ${curve}},\\ \\alpha_{LT} = ${alpha}`}
            />
            <CalcStep
              label={<>Section modulus <Tex>{'W'}</Tex></>}
              formula={`W = ${cs.cls <= 2 ? 'W_{pl,y}' : 'W_{el,y}'} = ${n(W/1000, 0)}\\ \\mathrm{cm^3} = ${n(W, 0)}\\ \\mathrm{mm^3} \\quad (\\text{Class ${cs.cls}})`}
            />
          </DetailGroup>
          <DetailGroup title="Section constants">
            <CalcStep
              label={<>Warping constant <Tex>{'I_w'}</Tex></>}
              formula={`I_w = ${row.Cw}\\ \\mathrm{dm^6} = ${(row.Cw * 1e12).toExponential(3)}\\ \\mathrm{mm^6}`}
            />
            <CalcStep
              label={<>Torsion constant <Tex>{'I_t'}</Tex></>}
              formula={`I_t = J = ${row.J}\\ \\mathrm{cm^4} = ${(row.J * 1e4).toExponential(3)}\\ \\mathrm{mm^4}`}
            />
            <CalcStep
              label={<>Weak-axis second moment <Tex>{'I_z'}</Tex></>}
              formula={`I_z = ${row.Iy}\\ \\mathrm{cm^4} = ${(row.Iy * 1e4).toExponential(3)}\\ \\mathrm{mm^4}`}
            />
          </DetailGroup>
          <DetailGroup title={<><Tex>{'M_{cr}'}</Tex> — Elastic critical moment  §6.3.2.2</>}>
            <CalcStep
              label="Formula"
              formula={`M_{cr} = C_1 \\cdot \\dfrac{\\pi^2 E I_z}{L_{cr}^2} \\cdot \\sqrt{\\dfrac{I_w}{I_z} + \\dfrac{L_{cr}^2 G I_t}{\\pi^2 E I_z}}`}
            />
            <CalcStep
              label={<><Tex>{'C_1'}</Tex> values</>}
              formula={`C_1 = 1.00\\ \\text{(uniform moment)} \\text{ up to } C_1 = 2.50 \\text{ — see results table rows}`}
            />
          </DetailGroup>
          <DetailGroup title={<><Tex>{'\\bar{\\lambda}_{LT}'}</Tex> — Non-dimensional slenderness  §6.3.2.2</>}>
            <CalcStep
              label="Slenderness"
              formula={`\\bar{\\lambda}_{LT} = \\sqrt{\\dfrac{W \\cdot f_y}{M_{cr}}}`}
            />
            <CalcStep
              label="No LTB plateau (UK NA)"
              formula={`\\bar{\\lambda}_{LT} \\le 0.4 = \\bar{\\lambda}_{LT,0} \\quad \\Rightarrow \\chi_{LT} = 1.0`}
            />
          </DetailGroup>
          <DetailGroup title={<><Tex>{'\\chi_{LT}'}</Tex> — LTB reduction factor  §6.3.2.3 + UK NA</>}>
            <CalcStep
              label={<><Tex>{'\\Phi_{LT}'}</Tex></>}
              formula={`\\Phi_{LT} = 0.5\\left[1 + \\alpha_{LT}(\\bar{\\lambda}_{LT} - 0.4) + 0.75\\,\\bar{\\lambda}_{LT}^2\\right] \\quad (\\beta = 0.75,\\ \\alpha_{LT} = ${alpha})`}
            />
            <CalcStep
              label={<><Tex>{'\\chi_{LT}'}</Tex></>}
              formula={`\\chi_{LT} = \\dfrac{1}{\\Phi_{LT} + \\sqrt{\\Phi_{LT}^2 - 0.75\\,\\bar{\\lambda}_{LT}^2}} \\le 1.0`}
            />
            <CalcStep
              label={<>Modification factor <Tex>{'f'}</Tex> (UK NA)</>}
              formula={`k_c = \\dfrac{1}{\\sqrt{C_1}}, \\quad f = 1 - 0.5(1-k_c)\\left[1 - 2(\\bar{\\lambda}_{LT} - 0.8)^2\\right] \\ge k_c`}
            />
            <CalcStep
              label={<>Modified <Tex>{'\\chi_{LT,\\text{mod}}'}</Tex></>}
              formula={`\\chi_{LT,\\text{mod}} = \\dfrac{\\chi_{LT}}{f} \\le \\min\\!\\left(1.0,\\ \\dfrac{1}{\\bar{\\lambda}_{LT}^2}\\right)`}
            />
            <CalcStep
              label={<><Tex>{'M_{b,Rd}'}</Tex> — Buckling resistance moment</>}
              formula={`M_{b,Rd} = \\chi_{LT,\\text{mod}} \\cdot W \\cdot \\dfrac{f_y}{\\gamma_{M1}} = \\chi_{LT,\\text{mod}} \\times ${n(W,0)}\\ \\mathrm{mm^3} \\times \\dfrac{${fyv}}{1.0 \\times 10^6}\\ \\mathrm{kNm}`}
            />
          </DetailGroup>
        </div>
      )}
    </div>
  )
}

// ── Axial + Bending section ───────────────────────────────────────────────────

function AxialBendingSection({ row, grade, mNRd, cs }: { row: SectionRow; grade: SteelGrade; mNRd: MNrdRow[]; cs: CrossSectionResult }) {
  const [tab, setTab] = useState<'results' | 'details'>('results')
  const A  = row.A * 100   // mm²
  const a  = Math.min((A - 2 * row.b * row.tf) / A, 0.5)

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 14, borderRadius: 2, background: ACCENT }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>AXIAL FORCE & BENDING — Reduced Moment Resistance <Tex>{'M_{N,Rd}'}</Tex> (kNm)</span>
        <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 4 }}>§6.2.9</span>
      </div>
      <SubTabBar active={tab} onChange={setTab} />

      {tab === 'results' && (
        <>
          <div className="bb-table-wrap" style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr>
                  <th style={{ ...TH, textAlign: 'left', minWidth: 110 }}><Tex>{'n = N_{Ed}/N_{pl,Rd}'}</Tex></th>
                  {N_RATIOS.map(n => <th key={n} style={TH}>{n.toFixed(1)}</th>)}
                </tr>
              </thead>
              <tbody>
                {mNRd.map((mnRow, ri) => (
                  <tr key={ri} style={{ background: ri % 2 === 0 ? '#fff' : '#f8fafc' }}>
                    <td style={TDL}><Tex>{mnRow.label === 'M_N,y,Rd' ? 'M_{N,y,Rd}' : 'M_{N,z,Rd}'}</Tex></td>
                    {mnRow.values.map((v, i) => (
                      <td key={i} style={{ ...TD, color: v < 0 ? '#94a3b8' : '#1e293b' }}>{r0(v)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: 10, color: '#64748b', marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: '0 16px', alignItems: 'baseline' }}>
            <span><Tex>{'n = N_{Ed}/N_{pl,Rd}'}</Tex></span>
            <span><Tex>{'N_{pl,Rd}'}</Tex> = {r0(cs.Npl_Rd)} kN</span>
            <span><Tex>{'M_{pl,y,Rd}'}</Tex> = {r0(cs.Mpl_Rd)} kNm</span>
            <span><Tex>{'M_{pl,z,Rd}'}</Tex> = {r0(cs.Mpl_z_Rd)} kNm</span>
          </div>
        </>
      )}

      {tab === 'details' && (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '14px 16px', background: '#fff', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <DetailGroup title="Axial utilisation ratio">
            <CalcStep
              label="n ratio"
              formula={`n = \\dfrac{N_{Ed}}{N_{pl,Rd}} \\quad \\text{where}\\ N_{pl,Rd} = ${r0(cs.Npl_Rd)}\\ \\mathrm{kN}`}
            />
          </DetailGroup>
          <DetailGroup title="Web area ratio a — §6.2.9.1(c)">
            <CalcStep
              label="a"
              formula={`a = \\dfrac{A - 2b \\cdot t_f}{A} \\le 0.5 = \\dfrac{${n(A,0)} - 2 \\times ${row.b} \\times ${row.tf}}{${n(A,0)}} = ${n(a, 4)} \\quad \\Rightarrow a = ${n(Math.min(a,0.5), 4)}`}
            />
          </DetailGroup>
          {cs.cls <= 2 && (
            <>
              <DetailGroup title="Major axis M_N,y,Rd — §6.2.9.1 Eq (6.36)  (Class 1/2)">
                <CalcStep
                  label="When n < 1 − 0.5a"
                  formula={`M_{N,y,Rd} = M_{pl,y,Rd} \\cdot \\dfrac{1-n}{1-0.5a} \\le M_{pl,y,Rd}`}
                />
                <CalcStep
                  label=""
                  formula={`M_{pl,y,Rd} = ${r0(cs.Mpl_Rd)}\\ \\mathrm{kNm}, \\quad 1-0.5a = ${n(1-0.5*Math.min(a,0.5),4)}`}
                />
                <CalcStep
                  label="When n ≥ 1 − 0.5a"
                  formula={`M_{N,y,Rd} = 0`}
                />
              </DetailGroup>
              <DetailGroup title="Minor axis M_N,z,Rd — §6.2.9.1 Eq (6.37/6.38)  (Class 1/2)">
                <CalcStep
                  label="When n ≤ a"
                  formula={`M_{N,z,Rd} = M_{pl,z,Rd} = ${r0(cs.Mpl_z_Rd)}\\ \\mathrm{kNm}`}
                />
                <CalcStep
                  label="When n > a"
                  formula={`M_{N,z,Rd} = M_{pl,z,Rd} \\cdot \\left[1 - \\left(\\dfrac{n-a}{1-a}\\right)^2\\right] \\ge 0`}
                />
                <CalcStep
                  label=""
                  formula={`M_{pl,z,Rd} = ${r0(cs.Mpl_z_Rd)}\\ \\mathrm{kNm}, \\quad a = ${n(Math.min(a,0.5),4)}`}
                />
              </DetailGroup>
              <DetailGroup title="Cross-section interaction check — §6.2.1(7) Eq (6.2)">
                <CalcStep
                  label="Conservative criterion"
                  formula={`\\dfrac{N_{Ed}}{N_{pl,Rd}} + \\dfrac{M_{y,Ed}}{M_{c,y,Rd}} + \\dfrac{M_{z,Ed}}{M_{c,z,Rd}} \\le 1.0`}
                />
              </DetailGroup>
            </>
          )}
          {cs.cls === 3 && (
            <DetailGroup title="Class 3 — linear elastic interaction">
              <CalcStep
                label="Major axis"
                formula={`M_{N,y,Rd} = M_{el,y,Rd} \\cdot (1-n) \\ge 0 = ${r0(cs.Mel_Rd)}\\ \\mathrm{kNm} \\times (1-n)`}
              />
              <CalcStep
                label="Minor axis"
                formula={`M_{N,z,Rd} = M_{el,z,Rd} \\cdot (1-n) \\ge 0 = ${r0(cs.Mel_z_Rd)}\\ \\mathrm{kNm} \\times (1-n)`}
              />
            </DetailGroup>
          )}
        </div>
      )}
    </div>
  )
}

// ── Compression section ───────────────────────────────────────────────────────

function CompressionSection({ row, grade, nbRd, cs }: { row: SectionRow; grade: SteelGrade; nbRd: NbRdRow[]; cs: CrossSectionResult }) {
  const [tab, setTab] = useState<'results' | 'details'>('results')
  const fyv = fy(grade)
  const eps = Math.sqrt(235 / fyv)
  const hb  = row.h / row.b
  const alphaY = hb > 1.2 && row.tf <= 100 ? 0.21 : 0.34
  const alphaZ = hb > 1.2 && row.tf <= 100 ? 0.34 : 0.49
  const curveY = alphaY === 0.21 ? 'a' : 'b'
  const curveZ = alphaZ === 0.34 ? 'b' : 'c'

  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 14, borderRadius: 2, background: ACCENT }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>COMPRESSION — Buckling Resistance <Tex>{'N_{b,Rd}'}</Tex> (kN)</span>
        <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 4 }}>§6.3.1</span>
      </div>
      <SubTabBar active={tab} onChange={setTab} />

      {tab === 'results' && (
        <>
          <div className="bb-table-wrap" style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr>
                  <th style={{ ...TH, textAlign: 'left', minWidth: 80 }}>Axis</th>
                  {BUCK_LENGTHS.map(l => <th key={l} style={TH}>{l}</th>)}
                </tr>
              </thead>
              <tbody>
                {nbRd.map((nbRow, ri) => (
                  <tr key={ri} style={{ background: ri % 2 === 0 ? '#fff' : '#f8fafc' }}>
                    <td style={TDL}><Tex>{nbRow.label === 'N_b,y,Rd' ? 'N_{b,y,Rd}' : nbRow.label === 'N_b,z,Rd' ? 'N_{b,z,Rd}' : 'N_{b,T,Rd}'}</Tex></td>
                    {nbRow.values.map((v, li) => (
                      <td key={li} style={{ ...TD, color: v < 0 ? '#94a3b8' : '#1e293b' }}>{r0(v)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: 10, color: '#64748b', marginTop: 6, display: 'flex', gap: '0 12px', alignItems: 'baseline' }}>
            <span>Buckling lengths (m)</span>
            <span><Tex>{'N_{pl,Rd}'}</Tex> = {r0(cs.Npl_Rd)} kN</span>
          </div>
        </>
      )}

      {tab === 'details' && (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '14px 16px', background: '#fff', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <DetailGroup title="Buckling curves — EC3 Table 6.2  (rolled I/H sections)">
            <CalcStep
              label="h/b ratio"
              formula={`\\dfrac{h}{b} = \\dfrac{${row.h}}{${row.b}} = ${n(hb,2)} \\quad ${hb > 1.2 ? '> 1.2' : '\\le 1.2'},\\ t_f = ${row.tf}\\ \\mathrm{mm} \\le 100\\ \\mathrm{mm}`}
            />
            <CalcStep
              label="y-y axis"
              formula={`\\text{Curve ${curveY}}\\ (\\alpha = ${alphaY})`}
            />
            <CalcStep
              label="z-z axis"
              formula={`\\text{Curve ${curveZ}}\\ (\\alpha = ${alphaZ})`}
            />
            <CalcStep
              label="Torsional axis"
              formula={`\\text{Curve c}\\ (\\alpha = 0.49) \\quad \\text{§6.3.1.4}`}
            />
          </DetailGroup>
          <DetailGroup title="Non-dimensional slenderness — §6.3.1.3  (Blue Book notation)">
            <CalcStep
              label="ε factor"
              formula={`\\varepsilon = \\sqrt{\\dfrac{235}{f_y}} = \\sqrt{\\dfrac{235}{${fyv}}} = ${n(eps,4)}`}
            />
            <CalcStep
              label="Slenderness (flexural)"
              formula={`\\bar{\\lambda} = \\dfrac{L_{cr}/i}{93.9\\,\\varepsilon} \\quad \\text{where}\\ i_y = ${row.ix}\\ \\mathrm{cm},\\ i_z = ${row.iy}\\ \\mathrm{cm}`}
            />
            <CalcStep
              label="No buckling plateau"
              formula={`\\bar{\\lambda} \\le 0.2 \\quad \\Rightarrow \\chi = 1.0`}
            />
          </DetailGroup>
          <DetailGroup title="Flexural buckling resistance — §6.3.1.2 Eq (6.49)">
            <CalcStep
              label="Φ factor"
              formula={`\\Phi = 0.5\\left[1 + \\alpha(\\bar{\\lambda} - 0.2) + \\bar{\\lambda}^2\\right]`}
            />
            <CalcStep
              label="χ factor"
              formula={`\\chi = \\dfrac{1}{\\Phi + \\sqrt{\\Phi^2 - \\bar{\\lambda}^2}} \\le 1.0`}
            />
            <CalcStep
              label="Buckling resistance"
              formula={`N_{b,Rd} = \\chi \\cdot \\dfrac{A \\cdot f_y}{\\gamma_{M1}} = \\chi \\times \\dfrac{${n(row.A*100,0)}\\ \\mathrm{mm^2} \\times ${fyv}}{1.0 \\times 10^3}\\ \\mathrm{kN}`}
            />
          </DetailGroup>
          <DetailGroup title="Torsional buckling — §6.3.1.4  (Blue Book §6.1)">
            <CalcStep
              label="Polar radius of gyration"
              formula={`i_0^2 = i_y^2 + i_z^2 = ${n(row.ix*10,1)}^2 + ${n(row.iy*10,1)}^2 = ${n((row.ix*10)**2+(row.iy*10)**2,0)}\\ \\mathrm{mm^2}`}
            />
            <CalcStep
              label="Critical torsional force"
              formula={`N_{cr,T} = \\dfrac{1}{i_0^2}\\left(G I_t + \\dfrac{\\pi^2 E I_w}{L_{cr}^2}\\right)`}
            />
            <CalcStep
              label="Constants"
              formula={`I_t = ${row.J}\\ \\mathrm{cm^4} = ${(row.J*1e4).toExponential(3)}\\ \\mathrm{mm^4}, \\quad I_w = ${row.Cw}\\ \\mathrm{dm^6} = ${(row.Cw*1e12).toExponential(3)}\\ \\mathrm{mm^6}`}
            />
            <CalcStep
              label="Torsional slenderness"
              formula={`\\bar{\\lambda}_T = \\sqrt{\\dfrac{A \\cdot f_y}{N_{cr,T}}} \\quad \\text{then apply Curve c}\\ (\\alpha = 0.49)`}
            />
          </DetailGroup>
        </div>
      )}
    </div>
  )
}

// ── Main CapacityPanel ────────────────────────────────────────────────────────

export default function CapacityPanel({ row: propRow }: { row: SectionRow | null }) {
  const [grade, setGrade] = useState<SteelGrade>('S275')
  const [localRow, setLocalRow] = useState<SectionRow | null>(null)

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
          <span style={{ fontSize: 12, color: '#94a3b8' }}>or click "Capacity →" on any row in Properties tab</span>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 13 }}>
          No section selected
        </div>
      </div>
    )
  }

  const { cs, mbRd, mNRd, nbRd } = result!

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Top bar */}
      <div style={{ padding: '10px 20px', borderBottom: '1px solid #f1f5f9', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <SectionSearch current={row} onSelect={r => setLocalRow(r)} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>Grade:</span>
          {(['S275', 'S355'] as SteelGrade[]).map(g => (
            <button key={g} onClick={() => setGrade(g)} style={{
              padding: '4px 14px', borderRadius: 20,
              border: `1.5px solid ${grade === g ? ACCENT : '#e2e8f0'}`,
              background: grade === g ? ACCENT : '#fff',
              color: grade === g ? '#fff' : '#475569',
              fontWeight: 700, fontSize: 12, cursor: 'pointer',
            }}>{g}</button>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 40px' }}>
        <HeaderCard row={row} grade={grade} cs={cs} />

        {cs.cls === 4 && (
          <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#854d0e' }}>
            Class 4 section — effective section properties required per §6.2.2.5. Resistance values not computed.
          </div>
        )}

        {cs.cls < 4 && (
          <>
            {/* Cross-section results/details */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 3, height: 14, borderRadius: 2, background: ACCENT }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Cross-Section Resistances</span>
                <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 4 }}>§6.2</span>
              </div>
              <ResultsDetailsProvider>
                <ResultsDetailsTabBar />
                <ResultsBox>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 32px', padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, fontSize: 12, alignItems: 'baseline' }}>
                    <span><Tex>{'M_{c,Rd}'}</Tex> = <strong>{r0(cs.Mc_Rd)} kNm</strong></span>
                    <span><Tex>{'N_{pl,Rd}'}</Tex> = <strong>{r0(cs.Npl_Rd)} kN</strong></span>
                    <span><Tex>{'V_{pl,Rd}'}</Tex> = <strong>{r0(cs.Vpl_Rd)} kN</strong></span>
                    <span>Class <strong>{cs.cls}</strong></span>
                  </div>
                </ResultsBox>
                <DetailsSection>
                  <CrossSectionDetails row={row} grade={grade} cs={cs} />
                </DetailsSection>
              </ResultsDetailsProvider>
            </div>

            <BendingSection      row={row} grade={grade} mbRd={mbRd} cs={cs} />
            <AxialBendingSection row={row} grade={grade} mNRd={mNRd} cs={cs} />
            <CompressionSection  row={row} grade={grade} nbRd={nbRd} cs={cs} />
          </>
        )}
      </div>
    </div>
  )
}
