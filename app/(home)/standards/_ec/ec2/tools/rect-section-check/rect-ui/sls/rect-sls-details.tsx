'use client'
import { useState } from 'react'
import { DetailGroup, CalcStep, Tex } from '@/app/(home)/standards/_lib/ui'
import { Ec2RectInput, Ec2RectResult } from '../../rect-engine/rect-calc'
import { Ec2SlsInput, Ec2SlsResult, calcEc2Sls } from '../../rect-engine/rect-sls-calc'
import { useTranslation } from '@/app/i18n/LanguageContext'

function n(x: number, d = 2) { return isFinite(x) ? x.toFixed(d) : '—' }

const OK  = (ok: boolean) => ok ? '#16a34a' : '#dc2626'
const TAG = (ok: boolean) => ok ? 'PASS' : 'FAIL'

function CheckRow({ label, lhs, rhs, unit, ok }: {
  label: React.ReactNode; lhs: string; rhs: string; unit?: string; ok: boolean
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        padding: '5px 6px', borderTop: '1px solid #f1f5f9', marginTop: 4,
        borderRadius: 4, margin: '4px -6px 0',
        background: hovered ? '#eff6ff' : 'transparent',
        transition: 'background 0.1s',
      }}>
      <span style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>{label}</span>
      <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 12, fontWeight: 700, color: OK(ok) }}>
        {lhs} {ok ? '≤' : '>'} {rhs}{unit ? ` ${unit}` : ''} → {TAG(ok)}
      </span>
    </div>
  )
}

export function RectSlsDetails({ inp, uls, sls }: { inp: Ec2RectInput; uls: Ec2RectResult; sls: Ec2SlsInput }) {
  const { t } = useTranslation()
  const r: Ec2SlsResult = calcEc2Sls(inp, sls, uls.Ecm)
  const fck = inp.fck

  return (
    <>
      <p style={{ fontSize: 11, color: '#1e293b', marginBottom: 10 }}>
        <strong>{t('std_ec2rc_det_according_to')}</strong> EN 1992-1-1:2004+AC:2008 §7.2, §7.3.2, §7.3.4, §7.3N
      </p>

      <DetailGroup title={t('std_ec2rc_sld_material_props')}>
        <CalcStep label={t('std_ec2rc_sld_char_strength')}
          formula={`f_{ck} = ${n(fck, 0)}\\ \\mathrm{MPa}`} />
        <CalcStep label={t('std_ec2rc_sld_emod_concrete')}
          formula={`E_{cm} = ${n(uls.Ecm, 0)}\\ \\mathrm{MPa}`} />
        <CalcStep label={t('std_ec2rc_sld_emod_steel')}
          formula={`E_s = 200\\ 000\\ \\mathrm{MPa}`} />
        <CalcStep label={t('std_ec2rc_sld_modular_ratio')}
          formula={`\\alpha_e = 200\\ 000 / ${n(uls.Ecm,0)} = ${n(r.alphaE, 2)}`} />
        <CalcStep label={t('std_ec2rc_sld_fctm')}
          formula={
            fck <= 50
              ? `f_{ctm} = 0.30 \\cdot f_{ck}^{2/3} = 0.30 \\times ${n(fck,0)}^{2/3} = ${n(r.fct_eff,3)}\\ \\mathrm{MPa}`
              : `f_{ctm} = 2.12 \\cdot \\ln(1 + (f_{ck}+8)/10) = ${n(r.fct_eff,3)}\\ \\mathrm{MPa}`
          } />
      </DetailGroup>

      <DetailGroup title={t('std_ec2rc_sld_na_depth')}>
        <p style={{ fontSize: 12, color: '#374151', marginBottom: 6, lineHeight: 1.6 }}>
          {t('std_ec2rc_sld_na_prose')}
        </p>
        <CalcStep label={t('std_ec2rc_sld_mtop')}
          formula={`M_{top} = M_{sk} + N_{sk} \\cdot (h/2) = ${n(sls.Msk,1)} + (${n(sls.Nsk,1)}) \\cdot ${n(inp.h/2,3)} = ${n(sls.Msk + sls.Nsk*(inp.h/2),1)}\\ \\mathrm{kNm}`} />
        <CalcStep label={t('std_ec2rc_sld_xcr')}
          formula={`x_{cr} = ${n(r.x_cr*1000,1)}\\ \\mathrm{mm} \\quad (x_{cr}/h = ${n(r.x_cr/inp.h,3)})`} />
        <CalcStep label={t('std_ec2rc_sld_top_strain_curv')}
          formula={`\\varepsilon_0 = ${n(r.eps_c_top,4)}\\ ‰\\ (\\text{compression} = \\text{negative}), \\quad \\kappa = ${n(r.kappa,6)}\\ \\mathrm{rad/m}`} />
      </DetailGroup>

      <DetailGroup title={t('std_ec2rc_sld_strain_stress')}>
        <p style={{ fontSize: 12, color: '#374151', marginBottom: 6 }}>
          {t('std_ec2rc_sld_ss_prose')}
        </p>
        <CalcStep label={t('std_ec2rc_sld_top_conc_stress')}
          formula={`\\varepsilon_{c,top} = ${n(r.eps_c_top,4)}\\ ‰ \\quad \\Rightarrow \\quad \\sigma_c = E_{cm} \\cdot |\\varepsilon_{c,top}| = ${n(uls.Ecm,0)} \\times ${n(Math.abs(r.eps_c_top)/1000,6)} = ${n(r.sigma_c,2)}\\ \\mathrm{MPa}`} />
        <CalcStep label={<>{t('std_ec2rc_sld_bot_steel_stress')} (z = {n(r.z1*1000,0)} mm {t('std_ec2rc_sld_from_top')})</>}
          formula={`\\varepsilon_{s,1} = ${n(r.eps_s1,4)}\\ ‰ \\quad \\Rightarrow \\quad \\sigma_{s,1} = E_s \\cdot \\varepsilon_{s,1} = 200\\ 000 \\times ${n(r.eps_s1/1000,6)} = ${n(r.sigma_s1,2)}\\ \\mathrm{MPa}`} />
        <CalcStep label={<>{t('std_ec2rc_sld_top_steel_stress')} (z = {n(r.z2*1000,0)} mm {t('std_ec2rc_sld_from_top')})</>}
          formula={`\\varepsilon_{s,2} = ${n(r.eps_s2,4)}\\ ‰ \\quad \\Rightarrow \\quad \\sigma_{s,2} = E_s \\cdot \\varepsilon_{s,2} = 200\\ 000 \\times ${n(r.eps_s2/1000,6)} = ${n(r.sigma_s2,2)}\\ \\mathrm{MPa}`} />
      </DetailGroup>

      <DetailGroup title={t('std_ec2rc_sld_concrete_limit')}>
        <CalcStep label={t('std_ec2rc_sld_comp_limit')}
          formula={`\\sigma_{c,lim} = 0.6 \\cdot f_{ck} = 0.6 \\times ${n(fck,0)} = ${n(r.sigma_c_lim,2)}\\ \\mathrm{MPa}`} />
        <CalcStep label={t('std_ec2rc_sld_actual_stress')}
          formula={`\\sigma_c = ${n(r.sigma_c,2)}\\ \\mathrm{MPa}`} />
        <CheckRow label={<>σ<sub>c</sub> ≤ 0.6·f<sub>ck</sub></>}
          lhs={n(r.sigma_c,2)} rhs={n(r.sigma_c_lim,2)} unit="MPa" ok={r.sigma_c_ok} />
      </DetailGroup>

      <DetailGroup title={t('std_ec2rc_sld_min_reinf')}>
        <CalcStep label={t('std_ec2rc_sld_min_formula')}
          formula={`A_{s,min} = k_c \\cdot k \\cdot f_{ct,eff} \\cdot A_{ct} \\;/\\; \\sigma_s`} />
        <CalcStep label={t('std_ec2rc_sld_kc')}
          formula={`k_c = ${n(sls.kc,2)}`} />
        <CalcStep label={<>{t('std_ec2rc_sld_k_depth')} {n(inp.h*1000,0)} mm)</>}
          formulaNode={
            <span style={{ fontStyle: 'italic' }}>
              {inp.h <= 0.3
                ? `k = 1.0  (h ≤ 300 mm)`
                : inp.h >= 0.8
                ? `k = 0.65  (h ≥ 800 mm)`
                : `k = 1.0 − (h−300)/(800−300) × 0.35 = ${n(r.k,3)}`}
            </span>
          } />
        <CalcStep label={t('std_ec2rc_sld_fct_eff')}
          formula={`f_{ct,eff} = ${n(r.fct_eff,3)}\\ \\mathrm{MPa}`} />
        <CalcStep label={t('std_ec2rc_sld_act')}
          formula={`A_{ct} = ${n(r.Act*1e6,0)}\\ \\mathrm{mm^2}`} />
        <CalcStep label={t('std_ec2rc_sld_sigma_s')}
          formula={`\\sigma_s = \\min(${n(Math.abs(r.sigma_s1),0)},\\,${n(inp.fyk,0)}) = ${n(Math.min(Math.abs(r.sigma_s1),inp.fyk),0)}\\ \\mathrm{MPa}`} />
        <CalcStep label={t('std_ec2rc_sld_substitution')}
          formula={`A_{s,min} = ${n(sls.kc,2)} \\times ${n(r.k,3)} \\times ${n(r.fct_eff,3)} \\times ${n(r.Act*1e6,0)} \\;/\\; ${n(Math.min(Math.abs(r.sigma_s1),inp.fyk),0)} = ${n(r.As_min*1e6,0)}\\ \\mathrm{mm^2}`} />
        <CalcStep label={t('std_ec2rc_sld_provided_bottom')}
          formula={`A_{s,prov} = ${n(r.As_prov*1e6,0)}\\ \\mathrm{mm^2}`} />
        <CheckRow label={<>A<sub>s,prov</sub> ≥ A<sub>s,min</sub></>}
          lhs={n(r.As_prov*1e6,0)} rhs={n(r.As_min*1e6,0)} unit="mm²" ok={r.As_min_ok} />
      </DetailGroup>

      <DetailGroup title={t('std_ec2rc_sld_crack_width')}>
        <CalcStep label={t('std_ec2rc_sld_crack_formula')}
          formula={`w_k = s_{r,max} \\cdot (\\varepsilon_{sm} - \\varepsilon_{cm})`} />

        <p style={{ fontSize: 11, fontWeight: 700, color: '#374151', margin: '8px 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {t('std_ec2rc_sld_eff_tension_area')}
        </p>
        <CalcStep label={t('std_ec2rc_sld_hc_eff')}
          formula={`h_{c,eff} = \\min(${n(2.5*(inp.h-r.z1)*1000,1)},\\;${n((inp.h-r.x_cr)/3*1000,1)},\\;${n(inp.h/2*1000,1)}) = ${n(r.Ac_eff/inp.b*1000,1)}\\ \\mathrm{mm}`} />
        <CalcStep label={t('std_ec2rc_sld_ac_eff')}
          formula={`A_{c,eff} = ${n(r.Ac_eff/inp.b*1000,1)} \\times ${n(inp.b*1000,0)} = ${n(r.Ac_eff*1e6,0)}\\ \\mathrm{mm^2}`} />
        <CalcStep label={t('std_ec2rc_sld_rho_p_eff')}
          formula={`\\rho_{p,eff} = ${n(r.As_prov*1e6,0)} / ${n(r.Ac_eff*1e6,0)} = ${n(r.rho_p_eff,5)}`} />

        <p style={{ fontSize: 11, fontWeight: 700, color: '#374151', margin: '8px 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {t('std_ec2rc_sld_equiv_dia')}
        </p>
        <CalcStep label={t('std_ec2rc_sld_phi_eff')}
          formula={`\\phi_{eff} = ${n(r.phi_eff,2)}\\ \\mathrm{mm}`} />

        <p style={{ fontSize: 11, fontWeight: 700, color: '#374151', margin: '8px 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {t('std_ec2rc_sld_max_spacing')}
        </p>
        <CalcStep label={t('std_ec2rc_sld_sr_max_formula')}
          formula={`s_{r,max} = 3.4 \\times ${n(r.c_nom,1)} + 0.8 \\times ${n(r.k2,1)} \\times 0.425 \\times ${n(r.phi_eff,2)} / ${n(r.rho_p_eff,5)} = ${n(r.sr_max_calc,1)}\\ \\mathrm{mm}`}
          note={`k₁ = ${n(r.k1,1)} (${t('std_ec2rc_sld_sr_note_high_bond')}),  k₂ = ${n(r.k2,1)} (${t('std_ec2rc_sld_sr_note_bending')}),  k₃ = 3.4,  k₄ = 0.425,  c = ${n(r.c_nom,1)} mm`} />
        <CalcStep label={t('std_ec2rc_sld_upper_bound')}
          formula={`s_{r,max,ub} = 1.3 \\times (${n(inp.h*1000,0)} - ${n(r.x_cr*1000,1)}) = ${n(r.sr_max_ub,1)}\\ \\mathrm{mm}`} />
        <CalcStep label={t('std_ec2rc_sld_sr_min')}
          formula={`s_{r,max} = \\min(${n(r.sr_max_calc,1)},\\;${n(r.sr_max_ub,1)}) = ${n(r.sr_max,1)}\\ \\mathrm{mm}`} />

        <p style={{ fontSize: 11, fontWeight: 700, color: '#374151', margin: '8px 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {t('std_ec2rc_sld_mean_strain')}
        </p>
        <CalcStep label={t('std_ec2rc_sld_strain_diff_formula')}
          formulaNode={
            <span style={{ fontStyle: 'italic' }}>
              factor = max(0.6,  1 − {n(r.kt,1)}·({n(r.fct_eff,3)}/{n(r.sigma_s1,2)})·{n(1/r.rho_p_eff+r.alphaE,2)}) = {n(r.factor,4)}
            </span>
          } />
        <CalcStep label={t('std_ec2rc_sld_strain_diff')}
          formula={`\\varepsilon_{sm} - \\varepsilon_{cm} = ${n(r.factor,4)} \\times ${n(r.sigma_s1,2)} / 200\\ 000 = ${n(r.eps_sm_cm,4)}\\ ‰`} />

        <p style={{ fontSize: 11, fontWeight: 700, color: '#374151', margin: '8px 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {t('std_ec2rc_sld_crack_width_e')}
        </p>
        <CalcStep label={t('std_ec2rc_sld_crack_calc')}
          formula={`w_k = s_{r,max} \\cdot (\\varepsilon_{sm} - \\varepsilon_{cm}) = ${n(r.sr_max,1)} \\times ${n(r.eps_sm_cm,4)} = ${n(r.wk,3)}\\ \\mathrm{mm}`} />
        <CheckRow label={<>w<sub>k</sub> ≤ w<sub>lim</sub></>}
          lhs={n(r.wk,3)} rhs={String(sls.wk_lim)} unit="mm" ok={r.wk_ok} />
      </DetailGroup>

      <DetailGroup title={t('std_ec2rc_sld_bar_spacing')}>
        <p style={{ fontSize: 12, color: '#374151', marginBottom: 6, lineHeight: 1.6 }}>
          {t('std_ec2rc_sld_bar_prose')} {sls.wk_lim} {t('std_ec2rc_sld_bar_prose_post')}
        </p>
        <CalcStep label={t('std_ec2rc_sld_service_stress')}
          formula={`\\sigma_{s,1} = ${n(r.sigma_s1,2)}\\ \\mathrm{MPa}`} />
        <CalcStep label={t('std_ec2rc_sld_max_dia')}
          formula={`\\phi_{max} = ${n(r.phi_max,0)}\\ \\mathrm{mm}`} />
        <CalcStep label={t('std_ec2rc_sld_prov_dia')}
          formula={`\\phi_{prov} = ${n(r.phi_prov,0)}\\ \\mathrm{mm}`} />
        <CheckRow label={<>φ<sub>prov</sub> ≤ φ<sub>max</sub></>}
          lhs={n(r.phi_prov,0)} rhs={n(r.phi_max,0)} unit="mm" ok={r.phi_ok} />
        <div style={{ height: 8 }} />
        <CalcStep label={t('std_ec2rc_sld_max_spacing_73n')}
          formula={`s_{max} = ${n(r.s_max,0)}\\ \\mathrm{mm}`} />
        <CalcStep label={t('std_ec2rc_sld_est_spacing')}
          formula={`s_{prov} = ${n(r.s_prov,0)}\\ \\mathrm{mm}`} />
        <CheckRow label={<>s<sub>prov</sub> ≤ s<sub>max</sub></>}
          lhs={n(r.s_prov,0)} rhs={n(r.s_max,0)} unit="mm" ok={r.s_ok} />
      </DetailGroup>
    </>
  )
}
