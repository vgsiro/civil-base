'use client'
import { Ec2RectInput, Ec2RectResult } from '../rect-engine/rect-calc'
import { SectionDiagram } from '../../../../_shared/section-diagram'
import { NMDiagram } from '../../../../_shared/nm-diagram'
import { useTranslation } from '@/app/i18n/LanguageContext'

function n(v: number, d = 2) { return isFinite(v) ? v.toFixed(d) : '—' }
function n2(v: number, d = 1) { return isFinite(v) ? v.toFixed(d) : '—' }

const SEC: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: '#1e40af', textTransform: 'uppercase',
  letterSpacing: '0.05em', borderBottom: '1.5px solid #bfdbfe',
  paddingBottom: 4, marginTop: 18, marginBottom: 8,
}
const ROW: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
  padding: '2px 0', fontSize: 11, borderBottom: '1px solid #f1f5f9',
}
const LABEL: React.CSSProperties = { color: '#374151', flex: 1 }
const SYMBOL: React.CSSProperties = { color: '#6b7280', width: 90, textAlign: 'center', fontStyle: 'italic' }
const VALUE: React.CSSProperties = { color: '#1e293b', fontWeight: 600, width: 110, textAlign: 'right' }

function Sym({ s }: { s: string }) {
  const idx = s.indexOf('_')
  if (idx === -1) return <span style={{ fontStyle: 'italic' }}>{s}</span>
  return (
    <>
      <span style={{ fontStyle: 'italic' }}>{s.slice(0, idx)}</span>
      <sub style={{ fontSize: '0.78em', fontStyle: 'normal' }}>{s.slice(idx + 1)}</sub>
    </>
  )
}

function ResultRow({ label, symbol, value, ok, warn }: {
  label: React.ReactNode; symbol?: string; value: string; ok?: boolean; warn?: boolean
}) {
  return (
    <div style={ROW}>
      <span style={LABEL}>{label}</span>
      {symbol !== undefined && <span style={SYMBOL}><Sym s={symbol} /></span>}
      <span style={VALUE}>
        {ok && <span style={{ color: '#16a34a', marginRight: 4, fontSize: 9 }}>●</span>}
        {warn && <span style={{ color: '#dc2626', marginRight: 4, fontSize: 9 }}>●</span>}
        {value}
      </span>
    </div>
  )
}

function Section({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="cb-section" style={{ breakInside: 'avoid', pageBreakInside: 'avoid', marginBottom: 4 }}>
      <div style={SEC}>{title}</div>
      {children}
    </div>
  )
}


// A4 usable px at 96dpi minus fixed chrome height (header ≈90px + cards ≈68px + solver ≈38px + gaps ≈20px)
const DIAGRAM_BUDGET = 740

export function RectReport({ inp, res }: {
  inp: Ec2RectInput; res: Ec2RectResult
}) {
  const { t } = useTranslation()
  const budget = DIAGRAM_BUDGET
  const anyEffect = !!(inp.firstOrder || inp.secondOrder)
  const MEd_check = anyEffect ? res.MEd_tot : Math.abs(inp.MEd)
  const ok_M = res.MRd_plus >= MEd_check
  const ok_N = inp.NEd >= res.NRd_c && inp.NEd <= res.NRd_t
  const hasE0 = res.M_e0 > 0
  const hasEa = res.M_ea > 0
  const hasM1 = res.M1 > 0
  const hasM2 = res.M2 > 0

  return (
    <div style={{ padding: '12px 0 60px', fontFamily: "'Segoe UI', Arial, sans-serif", fontSize: 11, color: '#1e293b', background: '#fff', minHeight: '297mm' }}>
      {/* Chrome + diagrams wrapped together so the paging engine treats them as one indivisible block */}
      <div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          <div style={{ background: ok_M ? '#f0fdf4' : '#fef2f2', border: `1.5px solid ${ok_M ? '#bbf7d0' : '#fecaca'}`, borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: ok_M ? '#166534' : '#991b1b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>{t('std_ec2rc_rep_moment')}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: ok_M ? '#16a34a' : '#dc2626', margin: '2px 0' }}>{ok_M ? 'PASS' : 'FAIL'}</div>
            <div style={{ fontSize: 9, color: '#64748b' }}>M<sub>Rd</sub> = {n2(res.MRd_plus)} kNm {ok_M ? '≥' : '<'} M<sub>Ed</sub>{anyEffect ? ',tot' : ''} = {n2(MEd_check)} kNm</div>
          </div>
          <div style={{ background: ok_N ? '#f0fdf4' : '#fef2f2', border: `1.5px solid ${ok_N ? '#bbf7d0' : '#fecaca'}`, borderRadius: 8, padding: '10px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: ok_N ? '#166534' : '#991b1b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>{t('std_ec2rc_rep_axial')}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: ok_N ? '#16a34a' : '#dc2626', margin: '2px 0' }}>{ok_N ? 'PASS' : 'FAIL'}</div>
            <div style={{ fontSize: 9, color: '#64748b' }}>N<sub>Ed</sub> = {n2(inp.NEd, 0)} kN {t('std_ec2rc_rep_within')} [N<sub>Rd,c</sub>, N<sub>Rd,t</sub>]</div>
          </div>
        </div>

        <div style={{ marginBottom: 8, padding: '5px 10px', borderRadius: 6, fontSize: 10, background: res.converged ? '#f0fdf4' : '#fffbeb', border: `1px solid ${res.converged ? '#bbf7d0' : '#fde68a'}`, color: res.converged ? '#166534' : '#92400e' }}>
          <strong>{t('std_ec2rc_rep_solver')}</strong> {res.converged ? t('std_ec2rc_rep_solver_ok') : t('std_ec2rc_rep_solver_fail')}
          {' '}{t('std_ec2rc_rep_solver_note')}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <div style={{ width: '100%', height: Math.floor(budget * 0.46), overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
            <div style={{ transform: 'scale(0.85)', transformOrigin: 'top center' }}>
              <SectionDiagram inp={inp} res={res} />
            </div>
          </div>
          <div style={{ width: '100%', height: Math.floor(budget * 0.52), overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
            <div style={{ transform: 'scale(1.0)', transformOrigin: 'top center' }}>
              <NMDiagram res={res} NEd={inp.NEd} MEd={anyEffect ? res.MEd_tot : inp.MEd} mLabel={anyEffect ? 'MEd,tot' : undefined} />
            </div>
          </div>
        </div>
      </div>{/* end chrome+diagrams block */}

      <div className="cb-sections" style={{ columnCount: 2, columnGap: 20 }}>
        <Section title={t('std_ec2rc_rep_s1')}>
          <ResultRow label={t('std_ec2rc_rep_section_height')} symbol="h" value={`${n(inp.h, 3)} m`} />
          <ResultRow label={t('std_ec2rc_rep_section_width')} symbol="b" value={`${n(inp.b, 3)} m`} />
          <ResultRow label={t('std_ec2rc_rep_concrete_grade')} symbol="f_ck" value={`${inp.concreteName} (${inp.fck} MPa)`} />
          <ResultRow label={t('std_ec2rc_rep_steel_yield')} symbol="f_yk" value={`${inp.fyk} MPa`} />
          <ResultRow label="αcc / γc / γs" value={`${inp.acc} / ${inp.gc} / ${inp.gs}`} />
          <ResultRow label={t('std_ec2rc_rep_design_moment')} symbol="M_Ed" value={`${n2(inp.MEd, 1)} kNm`} />
          <ResultRow label={t('std_ec2rc_rep_design_axial')} symbol="N_Ed" value={`${n2(inp.NEd, 0)} kN`} />
          {(inp.l0 != null || inp.secondOrder) && (
            <ResultRow label={t('std_ec2rc_rep_eff_length')} symbol="l₀" value={`${n(inp.l0 ?? 10, 2)} m`} />
          )}
        </Section>

        <Section title={t('std_ec2rc_rep_s2')}>
          <ResultRow label={t('std_ec2rc_rep_design_conc_strength')} symbol="f_cd" value={`${n2(res.fcd)} MPa`} />
          <ResultRow label={t('std_ec2rc_rep_design_steel_strength')} symbol="f_yd" value={`${n2(res.fyd)} MPa`} />
          <ResultRow label={t('std_ec2rc_rep_design_yield_strain')} symbol="ε_yd" value={`${n(res.eyd, 2)} ‰`} />
          <ResultRow label={t('std_ec2rc_rep_crushing_strain')} symbol="ε_cu2" value={`${n(res.ecu2)} ‰`} />
          <ResultRow label={t('std_ec2rc_rep_elastic_mod_conc')} symbol="E_cm" value={`${Math.round(res.Ecm).toLocaleString()} MPa`} />
        </Section>

        <Section title={t('std_ec2rc_rep_s3')}>
          <ResultRow label={t('std_ec2rc_rep_bottom_bars')} symbol="A_s,1" value={`${n2(res.As1 * 100, 0)} mm²`} />
          <ResultRow label={t('std_ec2rc_rep_top_bars')} symbol="A_s,2" value={`${n2(res.As2 * 100, 0)} mm²`} />
          {res.As3 > 0 && <ResultRow label={t('std_ec2rc_rep_side_bars')} symbol="A_s,3" value={`${n2(res.As3 * 100, 0)} mm²`} />}
          <ResultRow label={t('std_ec2rc_rep_total_long_steel')} symbol="A_s,tot" value={`${n2(res.Astot * 100, 0)} mm²`} ok />
          <ResultRow label={t('std_ec2rc_rep_reinf_ratio')} symbol="ρ_l" value={`${n(res.rho * 100, 2)} %`} />
          <ResultRow label={t('std_ec2rc_rep_mech_ratio')} symbol="ω" value={n(res.fyd / res.fcd * res.rho, 4)} />
        </Section>

        <Section title={t('std_ec2rc_rep_s4')}>
          <ResultRow label={t('std_ec2rc_rep_gross_area')} symbol="A" value={`${n2(res.A * 1e6, 0)} mm²`} />
          <ResultRow label={t('std_ec2rc_rep_second_moment')} symbol="I" value={`${n(res.I * 1e12, 0)} mm⁴`} />
          <ResultRow label={t('std_ec2rc_rep_pure_comp_cap')} symbol="N_Rd,c" value={`${n2(res.NRd_c, 0)} kN`} ok={inp.NEd >= res.NRd_c} warn={inp.NEd < res.NRd_c} />
          <ResultRow label={t('std_ec2rc_rep_pure_tens_cap')} symbol="N_Rd,t" value={`${n2(res.NRd_t, 0)} kN`} ok={inp.NEd <= res.NRd_t} warn={inp.NEd > res.NRd_t} />
        </Section>

        <Section title={t('std_ec2rc_rep_s5')}>
          <ResultRow label={t('std_ec2rc_rep_top_conc_strain')} symbol="ε_c,top" value={`${n2(res.eps_c_top, 2)} ‰`} />
          <ResultRow label={t('std_ec2rc_rep_bot_conc_strain')} symbol="ε_c,bot" value={`${n2(res.eps_c_bot, 2)} ‰`} />
          <ResultRow label={t('std_ec2rc_rep_max_rebar_strain')} symbol="ε_s,max" value={`${n2(res.eps_s_max, 2)} ‰`} ok={res.eps_s_max > 0} />
          <ResultRow label={t('std_ec2rc_rep_min_rebar_strain')} symbol="ε_s,min" value={`${n2(res.eps_s_min, 2)} ‰`} />
          <ResultRow label={t('std_ec2rc_rep_na_depth')} symbol="x" value={`${n2(res.x * 1000, 1)} mm`} />
          <ResultRow label={t('std_ec2rc_rep_xd_ratio')} symbol="x/d" value={n(res.xd, 4)} />
          <ResultRow label={t('std_ec2rc_rep_max_conc_stress')} symbol="σ_c,max" value={`${n2(res.sigma_c_max)} MPa`} />
          <ResultRow label={t('std_ec2rc_rep_max_steel_stress')} symbol="σ_s,max" value={`${n2(res.sigma_s_max)} MPa`} ok={Math.abs(res.sigma_s_max) >= res.fyd * 0.95} />
        </Section>

        <Section title={t('std_ec2rc_rep_s6')}>
          <ResultRow label={`MRd @ NEd = ${n2(inp.NEd, 0)} kN`} symbol="M_Rd" value={`${n2(res.MRd_plus)} kNm`} ok={ok_M} warn={!ok_M} />
          <ResultRow label={t('std_ec2rc_rep_peak_all_n')} symbol="M_Rd,peak" value={`${n2(res.MRd_peak)} kNm`} />
          <ResultRow label={t('std_ec2rc_rep_pure_bending')} symbol="M_Rd,0" value={`${n2(res.MRd0)} kNm`} />
          <ResultRow label={t('std_ec2rc_rep_negative_flipped')} symbol="M_Rd,−" value={`${n2(res.MRd_minus)} kNm`} />
        </Section>

        <Section title={t('std_ec2rc_rep_s7')}>
          <ResultRow label={t('std_ec2rc_rep_gross_stiff')} symbol="(EI)_gross" value={`${n2(res.EI_gross / 1000, 1)} MNm²`} />
          <ResultRow label={t('std_ec2rc_rep_eff_stiff')} symbol="(EI)_eff" value={`${n2(res.EI_eff / 1000, 1)} MNm²`} ok />
          <ResultRow label={t('std_ec2rc_rep_cracked_ratio')} value={n(res.EI_eff / res.EI_gross, 4)} />
        </Section>

        {inp.firstOrder && (
          <Section title={t('std_ec2rc_rep_s8')}>
            <ResultRow label={t('std_ec2rc_rep_min_ecc')} symbol="e_0,min" value={`${n2(res.e0_min * 1000, 1)} mm`} />
            {inp.useMinEcc && <>
              <ResultRow label={t('std_ec2rc_rep_ecc_e1')} symbol="e_0,1" value={`${n2(res.e0_e1 * 1000, 1)} mm`} />
              <ResultRow label={t('std_ec2rc_rep_ecc_e2')} symbol="e_0,2" value={`${n2(res.e0_e2 * 1000, 1)} mm`} />
            </>}
            <ResultRow label={t('std_ec2rc_rep_governing_e0')} symbol="e_0" value={`${n2(res.e0_used * 1000, 1)} mm`} ok />
            {inp.useImperfection && (
              <ResultRow label={t('std_ec2rc_rep_geom_imperf')} symbol="e_a" value={`${n2(res.ea * 1000, 1)} mm`} />
            )}
            {hasE0 && <ResultRow label="M_e0 = e₀·|N_Ed|" symbol="M_e0" value={`${n2(res.M_e0, 1)} kNm`} />}
            {hasEa && <ResultRow label="M_ea = ea·|N_Ed|" symbol="M_ea" value={`${n2(res.M_ea, 1)} kNm`} />}
            {hasM1 && <ResultRow label={t('std_ec2rc_rep_first_order_total')} symbol="M_1" value={`${n2(res.M1, 1)} kNm`} />}
          </Section>
        )}

        {inp.secondOrder && (
          <Section title={t('std_ec2rc_rep_s9')}>
            <ResultRow label={t('std_ec2rc_rep_slenderness')} symbol="λ" value={n2(res.lambda, 1)} />
            <ResultRow label={t('std_ec2rc_rep_lim_slenderness')} symbol="λ_lim" value={n2(res.lambda_lim, 1)} />
            <ResultRow label={t('std_ec2rc_rep_col_slender')} value={res.slender ? t('std_ec2rc_rep_slender_yes') : t('std_ec2rc_rep_slender_no')} ok={!res.slender} warn={res.slender} />
            <ResultRow label={t('std_ec2rc_rep_rel_axial')} symbol="n" value={n(res.nu, 3)} />
            <ResultRow label={t('std_ec2rc_rep_lt_creep')} symbol="φ(∞,t₀)" value={n(res.phi_inf_used, 2)} />
            <ResultRow label={t('std_ec2rc_rep_eff_creep_computed')} symbol="φ_ef,calc" value={n(res.phi_ef_calc, 3)} />
            {inp.phi_ef != null && <ResultRow label={t('std_ec2rc_rep_eff_creep_override')} symbol="φ_ef" value={n(res.phi_ef_used, 3)} warn />}
            <ResultRow label="K₁" symbol="K_1" value={n(res.K1, 3)} />
            <ResultRow label="Kr" symbol="K_r" value={n(res.K2, 3)} />
            <ResultRow label="Kφ" symbol="K_φ" value={n(res.Kphi, 3)} />
            {res.slender && <>
              <ResultRow label={t('std_ec2rc_rep_curvature')} value={`${n(res.r_inv, 4)} m⁻¹`} />
              <ResultRow label={t('std_ec2rc_rep_second_order_ecc')} symbol="e_2" value={`${n2(res.e2 * 1000, 1)} mm`} />
              {hasM2 && <ResultRow label="M2 = e₂·|N_Ed|" symbol="M_2" value={`${n2(res.M2, 1)} kNm`} />}
            </>}
          </Section>
        )}

        {anyEffect && (
          <Section title={t('std_ec2rc_rep_s10')}>
            <ResultRow label={t('std_ec2rc_rep_med_user')} symbol="M_Ed" value={`${n2(inp.MEd, 1)} kNm`} />
            {hasM1 && <ResultRow label={t('std_ec2rc_rep_first_order_add')} symbol="M_1" value={`${n2(res.M1, 1)} kNm`} />}
            {hasM2 && <ResultRow label={t('std_ec2rc_rep_second_order_m2')} symbol="M_2" value={`${n2(res.M2, 1)} kNm`} />}
            <div style={{ borderTop: '1.5px solid #1d4ed8', margin: '4px 0 2px' }} />
            <ResultRow label={`MEd,tot = MEd${hasM1 ? ' + M1' : ''}${hasM2 ? ' + M2' : ''}`} symbol="M_Ed,tot" value={`${n2(res.MEd_tot, 1)} kNm`} ok={res.MRd_plus >= res.MEd_tot} warn={res.MRd_plus < res.MEd_tot} />
            <ResultRow label={`${t('std_ec2rc_rep_mrd_vs')} ${res.MRd_plus >= res.MEd_tot ? 'OK ✓' : 'NOT OK ✗'}`} symbol="M_Rd" value={`${n2(res.MRd_plus)} kNm`} ok={res.MRd_plus >= res.MEd_tot} warn={res.MRd_plus < res.MEd_tot} />
          </Section>
        )}
      </div>

    </div>
  )
}
