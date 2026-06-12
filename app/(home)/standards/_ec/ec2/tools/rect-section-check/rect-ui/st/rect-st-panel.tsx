'use client'
import { Ec2RectInput, Ec2RectResult } from '../../rect-engine/rect-calc'
import { Box, Row, GREEN, n2 } from '../../../../../_shared/ui-atoms'
import { ShearSectionDiagram } from './rect-st-diagram'
import { useTranslation } from '@/app/i18n/LanguageContext'

const PURPLE = '#8b5cf6'
const CYAN   = '#0891b2'

export function ShearPanel({ inp, res }: { inp: Ec2RectInput; res: Ec2RectResult }) {
  const { t } = useTranslation()
  const VEd = inp.VEd ?? 0
  const TEd = inp.TEd ?? 0
  const thetaLabel = res.theta_is_override ? `${n2(res.theta_deg, 1)}° (${t('std_ec2rc_assumed')})` : `${n2(res.theta_deg, 1)}°`

  const At_prov  = res.Asw_prov
  const Asl_prov = res.Astot * 100
  const at_ok    = TEd <= res.TRd_c || At_prov  >= res.At_req_s
  const asl_ok   = TEd <= res.TRd_c || Asl_prov >= res.Asl_req

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#334155', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('std_ec2rc_cross_section_stirrups')}
            </div>
            <ShearSectionDiagram inp={inp} />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            <div style={{ minWidth: 280, maxWidth: 360, flex: '1 1 280px' }}>
              <Box title={t('std_ec2rc_input')} accent={CYAN}>
                <Row labelNode={<>V<sub>Ed</sub></>} value={`${n2(VEd)} kN`}
                  tip={t('std_ec2rc_tip_st_ved')} />
                <Row labelNode={<>T<sub>Ed</sub></>} value={`${n2(TEd)} kNm`}
                  tip={t('std_ec2rc_tip_st_ted')} />
                <Row labelNode={<>{t('std_ec2rc_stirrup_word')} Φ<sub>w</sub></>} value={`${inp.stirrup_phi ?? 10} mm`}
                  tip={t('std_ec2rc_tip_stirrup_phi_row')} />
                <Row labelNode={<>{t('std_ec2rc_spacing_s')}</>} value={`${inp.stirrup_s ?? 200} mm`}
                  tip={t('std_ec2rc_tip_stirrup_s_row')} />
                <Row labelNode={<>{t('std_ec2rc_legs')} n<sub>w</sub></>} value={`${inp.stirrup_legs ?? 2}`}
                  tip={t('std_ec2rc_tip_st_legs')} />
                <Row labelNode={<>θ ({t('std_ec2rc_strut_angle')})</>} value={thetaLabel}
                  tip={t('std_ec2rc_tip_theta')} />
                <Row labelNode={<>z = 0.9d ({t('std_ec2rc_lever_arm')})</>} value={`${n2(res.z_shear * 1000, 0)} mm`}
                  tip={t('std_ec2rc_tip_z')} />
              </Box>
            </div>

            <div style={{ minWidth: 280, maxWidth: 360, flex: '1 1 280px' }}>
              <Box title={t('std_ec2rc_shear_resistance')} accent={res.shear_ok ? GREEN : '#dc2626'}>
                <Row labelNode={<>V<sub>Rd,c</sub> ({t('std_ec2rc_no_reinf_short')})</>} value={`${n2(res.VRd_c)} kN`} ok={VEd <= res.VRd_c}
                  tip={t('std_ec2rc_tip_vrdc')} />
                <Row labelNode={<>V<sub>Rd,s</sub> ({t('std_ec2rc_stirrups')})</>} value={`${n2(res.VRd_s)} kN`}
                  tip={t('std_ec2rc_tip_vrds')} />
                <Row labelNode={<>V<sub>Rd,max</sub> ({t('std_ec2rc_strut')})</>} value={`${n2(res.VRd_max)} kN`}
                  tip={t('std_ec2rc_tip_vrdmax')} />
                <div style={{ borderTop: '1px solid #f1f5f9', margin: '4px 0' }} />
                <Row labelNode={<>A<sub>sw</sub>/s req (θ={res.theta_deg.toFixed(1)}°)</>} value={`${n2(res.Asw_req, 0)} mm²/m`}
                  tip={`${t('std_ec2rc_tip_asw_req')} ${res.theta_deg.toFixed(1)}°: A_sw,req/s = V_Ed/(z·f_yd·cot θ).`} />
                <Row labelNode={<>A<sub>sw</sub>/s provided</>} value={`${n2(res.Asw_prov, 0)} mm²/m`} ok={res.Asw_prov_ok} warn={!res.Asw_prov_ok}
                  tip={t('std_ec2rc_tip_asw_prov')} />
                <Row labelNode={<>A<sub>sw</sub>/s min §9.2.2</>} value={`${n2(res.Asw_min, 0)} mm²/m`} ok={res.Asw_min_ok} warn={!res.Asw_min_ok}
                  tip={t('std_ec2rc_tip_rho_w_min')} />
              </Box>
            </div>

            <div style={{ minWidth: 280, maxWidth: 360, flex: '1 1 280px' }}>
              <Box title={t('std_ec2rc_torsion')} accent={res.torsion_combined_ok || TEd <= 0 ? PURPLE : '#dc2626'}>
                <Row labelNode={<>T<sub>Rd,c</sub> ({t('std_ec2rc_cracking')})</>} value={`${n2(res.TRd_c)} kNm`} ok={TEd <= res.TRd_c || TEd <= 0}
                  tip={t('std_ec2rc_tip_trdc')} />
                <Row labelNode={<>T<sub>Rd,max</sub> ({t('std_ec2rc_strut')})</>} value={`${n2(res.TRd_max)} kNm`}
                  tip={t('std_ec2rc_tip_trdmax')} />
                <Row labelNode={<>t<sub>ef</sub> ({t('std_ec2rc_wall_thickness')})</>} value={`${n2(res.tef * 1000, 0)} mm`}
                  tip={t('std_ec2rc_tip_tef')} />
                <Row labelNode={<>A<sub>k</sub> ({t('std_ec2rc_enclosed_area')})</>} value={`${n2(res.Ak * 1e6, 0)} mm²`}
                  tip={t('std_ec2rc_tip_ak')} />
                <Row labelNode={<>u<sub>k</sub> ({t('std_ec2rc_perimeter')})</>} value={`${n2(res.uk * 1000, 0)} mm`}
                  tip={t('std_ec2rc_tip_uk')} />
                {TEd > 0 && <div style={{ borderTop: '1px solid #f1f5f9', margin: '4px 0' }} />}
                {TEd <= 0 ? (
                  <div style={{ fontSize: 10, color: '#64748b', fontStyle: 'italic', padding: '2px 0' }}>
                    {t('std_ec2rc_enter_ted_pre')} T<sub>Ed</sub> &gt; 0 {t('std_ec2rc_enter_ted_post')}
                  </div>
                ) : TEd <= res.TRd_c ? (
                  <Row labelNode={<>T<sub>Ed</sub> ≤ T<sub>Rd,c</sub></>} value={t('std_ec2rc_no_reinf_needed')} ok
                    tip={t('std_ec2rc_tip_no_tors_reinf')} />
                ) : (
                  <>
                    <Row labelNode={<>A<sub>t</sub>/s req</>} value={`${n2(res.At_req_s, 0)} mm²/m`}
                      tip={t('std_ec2rc_tip_at_req')} />
                    <Row labelNode={<>A<sub>t</sub>/s prov</>} value={`${n2(At_prov, 0)} mm²/m`} ok={at_ok} warn={!at_ok}
                      tip={t('std_ec2rc_tip_at_prov')} />
                    <Row labelNode={<>A<sub>sl</sub> req</>} value={`${n2(res.Asl_req, 0)} mm²`}
                      tip={t('std_ec2rc_tip_asl_req')} />
                    <Row labelNode={<>A<sub>sl</sub> prov</>} value={`${n2(Asl_prov, 0)} mm²`} ok={asl_ok} warn={!asl_ok}
                      tip={t('std_ec2rc_tip_asl_prov')} />
                    <div style={{ borderTop: '1px solid #f1f5f9', margin: '4px 0' }} />
                    <Row labelNode={<>T/T<sub>Rd,max</sub> + V/V<sub>Rd,max</sub></>}
                      value={`${n2(TEd / res.TRd_max + VEd / res.VRd_max, 3)} ${res.torsion_interaction_ok ? '≤ 1.0 ✓' : '> 1.0 ✗'}`}
                      ok={res.torsion_interaction_ok} warn={!res.torsion_interaction_ok}
                      tip={t('std_ec2rc_tip_vt_interaction')} />
                  </>
                )}
              </Box>
            </div>
          </div>
    </div>
  )
}
