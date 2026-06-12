'use client'
import { Ec2RectInput, Ec2RectResult } from '../../rect-engine/rect-calc'
import { Box, Row, GREEN, n2, n4 } from '../../../../../_shared/ui-atoms'
import { SectionDiagram, SpacingClickInfo } from '../../../../../_shared/section-diagram'
import { NMDiagram } from '../../../../../_shared/nm-diagram'
import { useTranslation } from '@/app/i18n/LanguageContext'

const PURPLE = '#8b5cf6'
const AMBER  = '#f59e0b'
const ORANGE = '#b45309'
const TEAL   = '#0d9488'
const INDIGO = '#4f46e5'
const ROSE   = '#e11d48'
const CYAN   = '#0891b2'
const LIME   = '#65a30d'

export function UlsResults({
  inp, res, anyEffect, onSpacingClick,
}: {
  inp: Ec2RectInput
  res: Ec2RectResult
  anyEffect: boolean
  onSpacingClick: (info: SpacingClickInfo) => void
}) {
  const { t } = useTranslation()
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Diagram + right sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <SectionDiagram inp={inp} res={res} onSpacingClick={onSpacingClick} />
          <NMDiagram res={res} NEd={inp.NEd} MEd={anyEffect ? res.MEd_tot : inp.MEd} mLabel={anyEffect ? 'MEd,tot' : undefined} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Box title={t('std_ec2rc_moment_resistance')} accent={GREEN}>
            <Row label={`At Nₑₙ = ${n2(inp.NEd, 0)} kN`} symbol="M_Rd"
              value={`${n2(res.MRd_plus)} kNm`}
              ok={res.MRd_plus >= (anyEffect ? res.MEd_tot : inp.MEd)}
              warn={res.MRd_plus < (anyEffect ? res.MEd_tot : inp.MEd)}
              tip={t('std_ec2rc_tip_mrd')} />
            <Row label={t('std_ec2rc_peak_all_n')} symbol="M_Rd,peak" value={`${n2(res.MRd_peak)} kNm`}
              tip={t('std_ec2rc_tip_mrd_peak')} />
            <Row label={t('std_ec2rc_pure_bending')} symbol="M_Rd,0" value={`${n2(res.MRd0)} kNm`}
              tip={t('std_ec2rc_tip_mrd0')} />
            <Row label={t('std_ec2rc_negative_flipped')} symbol="M_Rd,−" value={`${n2(res.MRd_minus)} kNm`}
              tip={t('std_ec2rc_tip_mrd_minus')} />
            <Row label={t('std_ec2rc_min_eccentricity')} symbol="e_0" value={`${n2(res.e0 * 1000, 0)} mm`}
              tip={t('std_ec2rc_tip_e0')} />
          </Box>

          <Box title={t('std_ec2rc_reinforcement')} accent={INDIGO}>
            <Row labelNode={<>A<sub>s,1</sub> ({t('std_ec2rc_bottom')})</>} symbol="A_s,1" value={`${n2(res.As1 * 100, 0)} mm²`}
              tip={t('std_ec2rc_tip_as1')} />
            <Row labelNode={<>A<sub>s,2</sub> ({t('std_ec2rc_top')})</>} symbol="A_s,2" value={`${n2(res.As2 * 100, 0)} mm²`}
              tip={t('std_ec2rc_tip_as2')} />
            <Row labelNode={<>A<sub>s,3</sub> ({t('std_ec2rc_sides')})</>} symbol="A_s,3" value={`${n2(res.As3 * 100, 0)} mm²`}
              tip={t('std_ec2rc_tip_as3')} />
            <Row labelNode={<>A<sub>s,tot</sub> ({t('std_ec2rc_total')})</>} symbol="A_s,tot" value={`${n2(res.Astot * 100, 0)} mm²`} ok
              tip={t('std_ec2rc_tip_astot')} />
            <Row label={t('std_ec2rc_ratio')} symbol="ρ_l" value={`${n2(res.rho * 100, 2)} %`}
              tip={t('std_ec2rc_tip_rho')} />
            <Row label={t('std_ec2rc_mechanical_ratio')} symbol="ω" value={n4(res.fyd / res.fcd * res.rho)}
              tip={t('std_ec2rc_tip_omega')} />
          </Box>

          <Box title={t('std_ec2rc_strain_state')} accent={TEAL}>
            <Row labelNode={<>ε<sub>c,top</sub> ({t('std_ec2rc_top_concrete')})</>} symbol="ε_c,top" value={`${n2(res.eps_c_top, 2)} ‰`}
              tip={<>{t('std_ec2rc_tip_etop')} {t('std_ec2rc_tip_etop_dyn')} {n2(res.ecu2)} {t('std_ec2rc_tip_etop_dyn2')}</>} />
            <Row labelNode={<>ε<sub>c,bot</sub> ({t('std_ec2rc_bottom_concrete')})</>} symbol="ε_c,bot" value={`${n2(res.eps_c_bot, 2)} ‰`}
              tip={t('std_ec2rc_tip_eps_bot')} />
            <Row labelNode={<>ε<sub>s,max</sub> ({t('std_ec2rc_max_bar')})</>} symbol="ε_s,max" value={`${n2(res.eps_s_max, 2)} ‰`} ok={res.eps_s_max > 0}
              tip={<>{t('std_ec2rc_tip_esmax')} {t('std_ec2rc_tip_esmax_dyn')} {n2(res.eyd, 2)} {t('std_ec2rc_tip_esmax_dyn2')}</>} />
            <Row labelNode={<>ε<sub>s,min</sub> ({t('std_ec2rc_min_bar')})</>} symbol="ε_s,min" value={`${n2(res.eps_s_min, 2)} ‰`}
              tip={t('std_ec2rc_tip_esmin')} />
            <Row label={t('std_ec2rc_neutral_axis_depth')} symbol="x" value={`${n2(res.x * 1000, 0)} mm`}
              tip={t('std_ec2rc_tip_neutral_x')} />
            <Row label="x / d" value={n4(res.xd)}
              tip={t('std_ec2rc_tip_xd')} />
          </Box>

          <div style={{ fontSize: 10, color: '#1e293b', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, padding: '6px 10px', lineHeight: 1.6 }}>
            <strong>{t('std_ec2rc_add_rebar_hint_pre')}</strong> {t('std_ec2rc_add_rebar_hint')}
          </div>
        </div>
      </div>

      {/* Bottom auto-fill grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        <Box title={t('std_ec2rc_stresses')} accent={ROSE}>
          <Row labelNode={<>σ<sub>c,max</sub> ({t('std_ec2rc_concrete')})</>} symbol="σ_c,max" value={`${n2(res.sigma_c_max)} MPa`}
            tip={t('std_ec2rc_tip_sc_max')} />
          <Row labelNode={<>σ<sub>s,max</sub> ({t('std_ec2rc_steel')})</>} symbol="σ_s,max" value={`${n2(res.sigma_s_max)} MPa`} ok={Math.abs(res.sigma_s_max) >= res.fyd * 0.95}
            tip={t('std_ec2rc_tip_ssmax')} />
          <Row labelNode={<>σ<sub>s,min</sub> ({t('std_ec2rc_steel')})</>} symbol="σ_s,min" value={`${n2(res.sigma_s_min)} MPa`}
            tip={t('std_ec2rc_tip_ssmin')} />
        </Box>

        <Box title={`${t('std_ec2rc_material_design_values')} — ${inp.concreteName}`} accent={ORANGE}>
          <Row label="" symbol="f_cd" value={`${n2(res.fcd)} MPa`}
            tip={t('std_ec2rc_tip_fcd')} />
          <Row label="" symbol="f_yd" value={`${n2(res.fyd)} MPa`}
            tip={t('std_ec2rc_tip_fyd')} />
          <Row label="" symbol="ε_yd" value={`${n2(res.eyd, 2)} ‰`}
            tip={t('std_ec2rc_tip_eyd')} />
          <Row label="" symbol="ε_cu2" value={`${n2(res.ecu2)} ‰`}
            tip={t('std_ec2rc_tip_ecu2')} />
          <Row label="" symbol="ε_c2" value={`${n2(res.ec2v)} ‰`}
            tip={t('std_ec2rc_tip_ec2')} />
          <Row label={t('std_ec2rc_exponent_n')} value={n2(res.n)}
            tip={t('std_ec2rc_tip_n_exp')} />
        </Box>

        <Box title={t('std_ec2rc_section_properties')} accent={CYAN}>
          <Row label={t('std_ec2rc_area')} symbol="A" value={`${n2(res.A * 1e6, 0)} mm²`}
            tip={t('std_ec2rc_tip_area_gross')} />
          <Row labelNode={<>{t('std_ec2rc_second_moment')} <i>I</i></>} symbol="I" value={`${n2(res.I * 1e12, 0)} mm⁴`}
            tip={t('std_ec2rc_tip_inertia')} />
          <Row labelNode={<>N<sub>Rd,c</sub> ({t('std_ec2rc_pure_compression')})</>} symbol="N_Rd,c" value={`${n2(res.NRd_c, 0)} kN`}
            ok={inp.NEd >= res.NRd_c} warn={inp.NEd < res.NRd_c}
            tip={t('std_ec2rc_tip_nrdc')} />
          <Row labelNode={<>N<sub>Rd,t</sub> ({t('std_ec2rc_pure_tension')})</>} symbol="N_Rd,t" value={`${n2(res.NRd_t, 0)} kN`}
            ok={inp.NEd <= res.NRd_t} warn={inp.NEd > res.NRd_t}
            tip={t('std_ec2rc_tip_nrdt')} />
          <div style={{ margin: '4px 0', borderTop: '1px solid #f1f5f9' }} />
          <Row labelNode={<>N<sub>Rd</sub> at N<sub>Ed</sub> = {n2(inp.NEd, 0)} kN</>} symbol="N_Rd"
            value={inp.NEd >= res.NRd_c && inp.NEd <= res.NRd_t ? t('std_ec2rc_within_range') : t('std_ec2rc_outside_range')}
            ok={inp.NEd >= res.NRd_c && inp.NEd <= res.NRd_t}
            warn={!(inp.NEd >= res.NRd_c && inp.NEd <= res.NRd_t)}
            tip={t('std_ec2rc_tip_nrange')} />
        </Box>

        <Box title={t('std_ec2rc_effective_stiffness')} accent={LIME}>
          <Row labelNode={<>E<sub>cm</sub> {t('std_ec2rc_used_word')}</>} symbol="E_cm" value={`${Math.round(res.Ecm).toLocaleString()} MPa`} ok={res.Ecm === res.EcmCode} warn={res.Ecm !== res.EcmCode}
            tip={t('std_ec2rc_tip_ecm')} />
          <Row labelNode={<>(EI)<sub>gross</sub></>} value={`${n2(res.EI_gross / 1000, 0)} MNm²`}
            tip={t('std_ec2rc_tip_eigross')} />
          <Row labelNode={<>(EI)<sub>eff</sub></>} value={`${n2(res.EI_eff / 1000, 0)} MNm²`} ok
            tip={t('std_ec2rc_tip_eieff')} />
          <Row labelNode={<>(EI)<sub>eff</sub> / (EI)<sub>gross</sub></>} value={n4(res.EI_eff / res.EI_gross)}
            tip={t('std_ec2rc_tip_ei_ratio')} />
        </Box>

        <Box title={t('std_ec2rc_internal_forces')} accent={INDIGO}>
          <Row labelNode={<>F<sub>C</sub> ({t('std_ec2rc_compression')})</>} value={`${n2(res.FC)} kN`}
            tip={t('std_ec2rc_tip_fc')} />
          <Row labelNode={<>F<sub>T</sub> ({t('std_ec2rc_tension')})</>} value={`${n2(res.FT)} kN`}
            tip={t('std_ec2rc_tip_ft')} />
          <Row labelNode={<>M<sub>C</sub></>} value={`${n2(res.MC)} kNm`}
            tip={t('std_ec2rc_tip_mc')} />
          <Row labelNode={<>M<sub>T</sub></>} value={`${n2(res.MT)} kNm`}
            tip={t('std_ec2rc_tip_mt')} />
        </Box>

        {inp.firstOrder && (
          <Box title={t('std_ec2rc_first_order_ecc')} accent={CYAN}>
            <Row labelNode={<>e<sub>0,min</sub> = max(h/30, 20 mm)</>} symbol="e_0,min" value={`${n2(res.e0_min * 1000, 1)} mm`}
              tip={t('std_ec2rc_tip_e0min')} />
            {inp.useMinEcc && <>
              <Row labelNode={<>|M<sub>1</sub>/N<sub>1</sub>|</>} symbol="e_0,1" value={`${n2(res.e0_e1 * 1000, 1)} mm`}
                tip={t('std_ec2rc_tip_e01')} />
              <Row labelNode={<>|M<sub>2</sub>/N<sub>2</sub>|</>} symbol="e_0,2" value={`${n2(res.e0_e2 * 1000, 1)} mm`}
                tip={t('std_ec2rc_tip_e02')} />
            </>}
            <Row labelNode={<>e<sub>0</sub> ({t('std_ec2rc_effective_used')})</>} symbol="e_0" value={`${n2(res.e0_used * 1000, 1)} mm`} ok
              tip={t('std_ec2rc_tip_e0gov')} />
            {inp.useImperfection && (
              <Row labelNode={<>e<sub>a</sub> ({t('std_ec2rc_geom_imperfection_short')})</>} symbol="e_a" value={`${n2(res.ea * 1000, 1)} mm`}
                tip={t('std_ec2rc_tip_ea')} />
            )}
          </Box>
        )}

        {inp.secondOrder && (
          <Box title={t('std_ec2rc_second_order_box')} accent={PURPLE}>
            <Row labelNode={<>λ ({t('std_ec2rc_slenderness')})</>} symbol="λ" value={n2(res.lambda, 1)}
              tip={t('std_ec2rc_tip_lambda')} />
            <Row labelNode={<>λ<sub>lim</sub> ({t('std_ec2rc_limit')})</>} symbol="λ_lim" value={n2(res.lambda_lim, 1)}
              tip={t('std_ec2rc_tip_lambda_lim')} />
            <Row label={t('std_ec2rc_slender_q')} value={res.slender ? t('std_ec2rc_slender_yes') : t('std_ec2rc_slender_no')} ok={!res.slender} warn={res.slender}
              tip={t('std_ec2rc_tip_slender')} />
            <Row labelNode={<>n = |N<sub>Ed</sub>|/(A<sub>c</sub>·f<sub>cd</sub>)</>} symbol="n" value={n2(res.nu, 3)}
              tip={t('std_ec2rc_tip_n_rel')} />
            <Row labelNode={<>φ(∞,t<sub>0</sub>) — {t('std_ec2rc_creep_coeff')}</>} value={n2(res.phi_inf_used, 2)}
              tip={t('std_ec2rc_tip_phi_inf')} />
            <Row labelNode={<>φ<sub>ef</sub> = φ(∞,t<sub>0</sub>)·M<sub>0Eqp</sub>/M<sub>0Ed</sub></>} value={n2(res.phi_ef_calc, 3)}
              tip={t('std_ec2rc_tip_phi_ef_calc')} />
            <Row labelNode={inp.phi_ef != null ? <>φ<sub>ef</sub> {t('std_ec2rc_phi_ef_override')}</> : <>φ<sub>ef</sub> {t('std_ec2rc_phi_ef_computed')}</>}
              value={n2(res.phi_ef_used, 3)} ok={inp.phi_ef == null} warn={inp.phi_ef != null}
              tip={inp.phi_ef != null ? t('std_ec2rc_tip_phi_ef_override') : t('std_ec2rc_tip_phi_ef_computed')} />
            <Row labelNode={<>K<sub>1</sub> = 1+(0.35+f<sub>ck</sub>/200−λ/150)·φ<sub>ef</sub></>} value={n2(res.K1, 3)}
              tip={t('std_ec2rc_tip_k1')} />
            <Row labelNode={<>K<sub>2</sub> = K<sub>r</sub> ({t('std_ec2rc_axial_correction')})</>} value={n2(res.K2, 3)}
              tip={t('std_ec2rc_tip_k2')} />
            <Row labelNode={<>K<sub>φ</sub> ({t('std_ec2rc_creep_factor')})</>} value={n2(res.Kphi, 3)}
              tip={t('std_ec2rc_tip_kphi')} />
            {res.slender && <>
              <Row labelNode={<>1/r ({t('std_ec2rc_curvature')})</>} value={`${n2(res.r_inv, 4)} m⁻¹`}
                tip={t('std_ec2rc_tip_curvature')} />
              <Row labelNode={<>e<sub>2</sub> ({t('std_ec2rc_2nd_order_ecc')})</>} symbol="e_2" value={`${n2(res.e2 * 1000, 1)} mm`}
                tip={t('std_ec2rc_tip_e2')} />
            </>}
          </Box>
        )}

        {anyEffect && (() => {
          const hasE0 = res.M_e0 > 0, hasEa = res.M_ea > 0, hasM1 = res.M1 > 0, hasM2 = res.M2 > 0
          return (
            <Box title={t('std_ec2rc_total_moment')} accent={AMBER}>
              <Row labelNode={<>M<sub>Ed</sub> <span style={{ color: '#94a3b8', fontWeight: 400 }}>({t('std_ec2rc_user')})</span></>} value={`${n2(inp.MEd, 1)} kNm`} />
              {hasE0 && <Row labelNode={<>M<sub>e₀</sub> <span style={{ color: '#94a3b8', fontWeight: 400 }}>(e<sub>0</sub>·|N<sub>Ed</sub>|)</span></>} value={`${n2(res.M_e0, 1)} kNm`} />}
              {hasEa && <Row labelNode={<>M<sub>ea</sub> <span style={{ color: '#94a3b8', fontWeight: 400 }}>(e<sub>a</sub>·|N<sub>Ed</sub>|)</span></>} value={`${n2(res.M_ea, 1)} kNm`} />}
              {hasM1 && <Row labelNode={<>M<sub>1</sub> <span style={{ color: '#94a3b8', fontWeight: 400 }}>({hasE0 && hasEa ? <>M<sub>e₀</sub> + M<sub>ea</sub></> : hasE0 ? <>e<sub>0</sub>·|N|</> : <>e<sub>a</sub>·|N|</>})</span></>} value={`${n2(res.M1, 1)} kNm`} />}
              {hasM2 && <Row labelNode={<>M<sub>2</sub> <span style={{ color: '#94a3b8', fontWeight: 400 }}>(e<sub>2</sub>·|N<sub>Ed</sub>|)</span></>} value={`${n2(res.M2, 1)} kNm`} />}
              <div style={{ borderTop: '1px solid #f1f5f9', margin: '2px 0' }} />
              <Row
                labelNode={<>M<sub>Ed,tot</sub> = M<sub>Ed</sub>{hasM1 ? <> + M<sub>1</sub></> : null}{hasM2 ? <> + M<sub>2</sub></> : null}</>}
                value={`${n2(res.MEd_tot, 1)} kNm`}
                ok={res.MRd_plus >= res.MEd_tot} warn={res.MRd_plus < res.MEd_tot}
              />
            </Box>
          )
        })()}
      </div>

      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', fontSize: 11, color: '#64748b', lineHeight: 1.7 }}>
        <strong style={{ color: '#374151' }}>{t('std_ec2rc_notes')} </strong>
        {t('std_ec2rc_uls_notes_pre')} EN 1992-1-1 §6.1(4): |M<sub>Ed</sub>| ≥ e<sub>0</sub>·|N<sub>Ed</sub>|, e<sub>0</sub> = max(h/30, 20 mm).
        {' '}{t('std_ec2rc_uls_notes_post')}
      </div>
    </div>
  )
}
