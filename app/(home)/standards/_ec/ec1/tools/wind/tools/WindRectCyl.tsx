'use client'
import React from 'react'
import { TheoryBlock, NumInput, ResultRow, ResultsBox, DetailsSection, DetailGroup, CalcStep, InputDataTable, InputDataRow, Tex, TableRef , LabelTip, ResultsDetailsProvider, ResultsDetailsTabBar , Sub} from '@/app/(home)/standards/_lib/ui'
import { FORMULA_BOX, WIND_SECTION, INPUT_GRID, INPUT_STYLE, LABEL_STYLE, SELECT_STYLE } from '../../../../../_lib/ui-styles'
import { CYL_SURFACES, TERRAIN_CATS } from '../wind-types'
import { Table713, Table41 } from '../WindTables'
import { calcPeakPressure, getCfRect, getCylCf0, getPsiLambda, getEffectiveSlenderness, getCylEffectiveSlenderness } from '../wind-helpers'
import { WindPrimaryInputs, WindSecondaryInputs, INPUT_DIVIDER } from '../WindShared'
import { useTranslation } from '@/app/i18n/LanguageContext'

interface RectProps {
  vb: number; setVb: (v: number) => void
  cat: string; setCat: (v: string) => void
  z: number; setZ: (v: number) => void
  c0: number; setC0: (v: number) => void
  rho: number; setRho: (v: number) => void
  elD: number; setElD: (v: number) => void
  elB: number; setElB: (v: number) => void
  elL: number; setElL: (v: number) => void
  elR: number; setElR: (v: number) => void
  elCscd: number; setElCscd: (v: number) => void
}

export function WindRect({ vb, setVb, cat, setCat, z, setZ, c0, setC0, rho, setRho, elD, setElD, elB, setElB, elL, setElL, elR, setElR, elCscd, setElCscd }: RectProps) {
  const { t } = useTranslation()
  const qpResult = calcPeakPressure(vb, z, cat, c0, rho)
  const { kr, cr, vm, Iv, qp } = qpResult
  const db = elD / elB
  const cf0 = getCfRect(db)
  const psi_r = elR > 0 ? Math.max(0.5, 1 - (elR / elB)) : 1.0
  const { lambda, lambda15, lambda50 } = getEffectiveSlenderness(elL, elB)
  const psi_lam = getPsiLambda(lambda)
  const cf = cf0 * psi_r * psi_lam
  const Aref = elB * elL
  const Fw = elCscd * cf * qp * Aref
  return (
    <ResultsDetailsProvider>
    <div style={WIND_SECTION}>
      <ResultsDetailsTabBar />
      <TheoryBlock>
        <p><strong>EN 1991-1-4 §7.6</strong> — {t('std_ec1w_thy_rc_p1').split('—').slice(1).join('—').trim()}</p>
        <p><strong>{t('std_ec1w_thy_rc_cf0').split(':')[0].trim()}</strong>: {t('std_ec1w_thy_rc_cf0').split(':').slice(1).join(':').trim()}</p>
        <p><strong>{t('std_ec1w_thy_rc_psi_r').split(':')[0].trim()}</strong>: {t('std_ec1w_thy_rc_psi_r').split(':').slice(1).join(':').trim()}</p>
        <p><strong>{t('std_ec1w_thy_rc_psi_l').split(':')[0].trim()}</strong>: {t('std_ec1w_thy_rc_psi_l').split(':').slice(1).join(':').trim()}</p>
        <p><strong>{t('std_ec1w_thy_rc_fw').split(':')[0].trim()}</strong>: {t('std_ec1w_thy_rc_fw').split(':').slice(1).join(':').trim()}</p>
      </TheoryBlock>
      <div style={FORMULA_BOX}>
        <strong>EN 1991-1-4 §7.6 Fig 7.23</strong> — Prismatic element, rectangular cross-section (sharp corners).<br />
        c<sub>f</sub> = c<sub>f,0</sub> · ψ<sub>r</sub> · ψ<sub>λ</sub> &nbsp;|&nbsp; F<sub>w</sub> = c<sub>s</sub>c<sub>d</sub> · c<sub>f</sub> · q<sub>p</sub> · A<sub>ref</sub>
      </div>
      <WindPrimaryInputs vb={vb} setVb={setVb} cat={cat} setCat={setCat} />
      <div style={INPUT_GRID}>
        <div>
          <LabelTip tip={t('std_ec1w_tip_rc_ze')}>z<sub>e</sub> — {t('std_ec1w_det_rc_param_z')} (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={1} step={0.5} value={z} onChange={setZ} />
        </div>
        <div>
          <LabelTip tip={t('std_ec1w_tip_rc_d')}>d — {t('std_ec1w_det_rc_param_d')} (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={0.05} step={0.05} value={elD} onChange={setElD} />
        </div>
        <div>
          <LabelTip tip={t('std_ec1w_tip_rc_b')}>b — {t('std_ec1w_det_rc_param_b')} (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={0.05} step={0.05} value={elB} onChange={setElB} />
        </div>
        <div>
          <LabelTip tip={t('std_ec1w_tip_rc_l')}>l — {t('std_ec1w_det_rc_param_l')} (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={0.1} step={0.5} value={elL} onChange={setElL} />
        </div>
        <div>
          <LabelTip tip={t('std_ec1w_tip_rc_r')}>r — {t('std_ec1w_det_rc_param_r')} (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={0} step={0.01} value={elR} onChange={setElR} />
        </div>
      </div>
      <hr style={INPUT_DIVIDER} />
      <div style={INPUT_GRID}>
        <div>
          <LabelTip tip={t('std_ec1w_tip_rc_cscd')}>c<sub>s</sub>c<sub>d</sub> — {t('std_ec1w_det_lbl_struct_factor')}</LabelTip>
          <NumInput style={INPUT_STYLE} min={0.5} max={1.5} step={0.05} value={elCscd} onChange={setElCscd} />
        </div>
      </div>
      <WindSecondaryInputs c0={c0} setC0={setC0} rho={rho} setRho={setRho} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <ResultsBox title={t('std_ui_tab_results')}>
          <ResultRow label={<>F<sub>w</sub> — {t('std_ec1w_det_total_force')}</>} value={Fw.toFixed(3)} unit="kN" onClick={() => document.getElementById('rect-details')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
          <ResultRow label={<>c<sub>f</sub> = c<sub>f,0</sub>·ψ<sub>r</sub>·ψ<sub>λ</sub></>} value={cf.toFixed(3)} />
          <ResultRow label={<>A<sub>ref</sub> = b·l</>} value={Aref.toFixed(3)} unit="m²" />
        </ResultsBox>
        <DetailsSection id="rect-details">
          {(() => {
            const P: React.CSSProperties = { fontSize: 12, color: '#374151', lineHeight: 1.75, margin: '6px 0 10px' }
            const catData = TERRAIN_CATS.find(c => c.id === cat)!
            const z0 = catData.z0
            const zmin = catData.zmin
            const qb = 0.5 * rho * vb * vb / 1000
            const weff = Fw / Aref
            return (<>
              <p style={{ fontSize: 11, color: '#1e293b', marginBottom: 10 }}>
                <strong>According to:</strong> EN 1991-1-4:2005+A1:2010 §7.6 and Figure 7.23
              </p>

              <DetailGroup title={t('std_ec1w_det_input_data')}>
                <InputDataTable>
                  <InputDataRow param={<>{t('std_ec1w_det_param_cat')} — <TableRef label="Table 4.1" renderTable={() => <Table41 />} /></>} symbol={<Tex>{'\\text{Cat.}'}</Tex>} value={`Cat. ${cat} — z₀=${z0} m, zmin=${zmin} m`} />
                  <InputDataRow param={t('std_ec1w_det_lbl_basic_vb')} symbol={<Tex>{'v_b'}</Tex>} value={vb.toFixed(2)} unit="m/s" />
                  <InputDataRow param={t('std_ec1w_det_param_c0_short')} symbol={<Tex>{'c_0(z_e)'}</Tex>} value={c0.toFixed(2)} />
                  <InputDataRow param={t('std_ec1w_det_param_rho_short')} symbol={<Tex>{'\\rho'}</Tex>} value={rho.toFixed(2)} unit="kg/m³" />
                  <InputDataRow param={t('std_ec1w_det_rc_param_d')} symbol={<Tex>{'d'}</Tex>} value={elD.toFixed(3)} unit="m" />
                  <InputDataRow param={t('std_ec1w_det_rc_param_b')} symbol={<Tex>{'b'}</Tex>} value={elB.toFixed(3)} unit="m" />
                  <InputDataRow param={t('std_ec1w_det_rc_param_r')} symbol={<Tex>{'r'}</Tex>} value={elR.toFixed(3)} unit="m" />
                  <InputDataRow param={t('std_ec1w_det_rc_param_l')} symbol={<Tex>{'l'}</Tex>} value={elL.toFixed(2)} unit="m" />
                  <InputDataRow param={t('std_ec1w_det_rc_param_z')} symbol={<Tex>{'z'}</Tex>} value={z.toFixed(2)} unit="m" />
                  <InputDataRow param={t('std_ec1w_det_lbl_struct_factor')} symbol={<Tex>{'c_s c_d'}</Tex>} value={elCscd.toFixed(2)} />
                </InputDataTable>
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_ref_area')}>
                <p style={P}><Sub>{t('std_ec1w_det_rc_ref_prose')}</Sub></p>
                <CalcStep
                  label={<>{t('std_ec1w_det_lbl_ref_height')} <Tex>{'z_e'}</Tex></>}
                  formula={`z_e = z = ${z.toFixed(3)}\\ \\mathrm{m}`}
                  result={<></>}
                />
                <CalcStep
                  label={<>{t('std_ec1w_det_lbl_ref_area')} <Tex>{'A_{\\mathrm{ref}}'}</Tex></>}
                  formula={`A_{\\mathrm{ref}} = b \\cdot l = ${elB.toFixed(3)}\\ \\mathrm{m} \\cdot ${elL.toFixed(3)}\\ \\mathrm{m} = ${Aref.toFixed(3)}\\ \\mathrm{m^2}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_basic_vb')}>
                <p style={P}><Sub>{t('std_ec1w_det_vb_prose')}</Sub></p>
                <CalcStep label={t('std_ec1w_det_lbl_basic_vb')} formula={`v_b = ${vb.toFixed(2)}\\ \\mathrm{m/s}`} result={<></>} />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_terrain_roughness')}>
                <p style={P}>
                  <Sub>{t('std_ec1w_det_z0_prose_pre')}</Sub> <strong>{cat}</strong> <Sub>{t('std_ec1w_det_z0_prose_post')}</Sub> z<sub>0</sub> = {z0} m, z<sub>min</sub> = {zmin} m. <Sub>{t('std_ec1w_det_kr_prose_pre')}</Sub> {z0} <Sub>{t('std_ec1w_det_kr_prose_post')}</Sub>
                </p>
                <CalcStep
                  label={<>{t('std_ec1w_det_lbl_terrain_factor')} <Tex>{'k_r'}</Tex> (EN 1991-1-4 §4.5 Eq. 4.5)</>}
                  formula={`k_r = 0.19 \\cdot \\left(\\dfrac{z_0}{z_{0,\\mathrm{II}}}\\right)^{0.07} = 0.19 \\cdot \\left(\\dfrac{${z0}\\ \\mathrm{m}}{0.050\\ \\mathrm{m}}\\right)^{0.07} = ${kr.toFixed(4)}`}
                  result={<></>}
                />
                <p style={P}>
                  <Sub>{t('std_ec1w_det_cr_prose_pre')}</Sub> {z.toFixed(3)} m {z >= zmin ? '≥' : '<'} <Sub>{t('std_ec1w_det_cr_prose_post')}</Sub>
                </p>
                <CalcStep
                  label={<>{t('std_ec1w_det_lbl_roughness_factor')} <Tex>{'c_r(z_e)'}</Tex> (EN 1991-1-4 §4.5 Eq. 4.4)</>}
                  formula={`c_r(z_e) = k_r \\cdot \\ln\\!\\left(\\frac{\\max(z_e,\\,z_{\\min})}{z_0}\\right) = ${kr.toFixed(4)} \\cdot \\ln\\!\\left(\\frac{\\max(${z.toFixed(3)}\\ \\mathrm{m},\\,${zmin}\\ \\mathrm{m})}{${z0}\\ \\mathrm{m}}\\right) = ${cr.toFixed(4)}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_orography')}>
                <p style={P}><Sub>{t('std_ec1w_det_orography_prose')}</Sub></p>
                <CalcStep
                  label={t('std_ec1w_det_lbl_orography')}
                  formula={`c_0(z_e) = ${c0.toFixed(3)}`}
                  result={<></>}
                  note={c0 === 1.0 ? t('std_ec1w_det_note_c0_flat') : `c₀ = ${c0.toFixed(3)} — site-specific orography per EN 1991-1-4 §4.3.3.`}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_mean_vm')}>
                <CalcStep
                  label={<>{t('std_ec1w_res_vm')} <Tex>{'v_m(z_e)'}</Tex> (EN 1991-1-4 §4.3 Eq. 4.3)</>}
                  formula={`v_m(z_e) = c_r(z_e) \\cdot c_0(z_e) \\cdot v_b = ${cr.toFixed(4)} \\cdot ${c0.toFixed(3)} \\cdot ${vb.toFixed(2)}\\ \\mathrm{m/s} = ${vm.toFixed(2)}\\ \\mathrm{m/s}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_turbulence')}>
                <p style={P}>
                  <Sub>{t('std_ec1w_det_iv_prose_pre')}</Sub> {z >= zmin ? '≥' : '<'} <Sub>{t('std_ec1w_det_cr_prose_post')}</Sub>
                </p>
                <CalcStep
                  label={<>{t('std_ec1w_res_iv')} <Tex>{'I_v(z_e)'}</Tex> (EN 1991-1-4 §4.4 Eq. 4.7)</>}
                  formula={`I_v(z_e) = \\frac{k_I}{c_0(z_e) \\cdot \\ln\\!\\left(\\dfrac{\\max(z_e,\\,z_{\\min})}{z_0}\\right)} = \\frac{1.000}{${c0.toFixed(3)} \\cdot \\ln\\!\\left(\\dfrac{\\max(${z.toFixed(3)}\\ \\mathrm{m},\\,${zmin}\\ \\mathrm{m})}{${z0}\\ \\mathrm{m}}\\right)} = ${Iv.toFixed(4)}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_basic_qb')}>
                <CalcStep
                  label={<>{t('std_ec1w_det_basic_qb')} <Tex>{'q_b'}</Tex> (EN 1991-1-4 §4.5(1))</>}
                  formula={`q_b = \\tfrac{1}{2} \\cdot \\rho \\cdot v_b^2 = \\tfrac{1}{2} \\cdot ${rho.toFixed(2)}\\ \\mathrm{kg/m^3} \\cdot (${vb.toFixed(2)}\\ \\mathrm{m/s})^2 = ${(qb*1000).toFixed(0)}\\ \\mathrm{N/m^2} = ${qb.toFixed(4)}\\ \\mathrm{kN/m^2}`}
                  result={<></>}
                  note={t('std_ec1w_det_note_1N')}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_peak_qp')}>
                <p style={P}><Sub>{t('std_ec1w_det_qp_prose')}</Sub></p>
                <CalcStep
                  label={<>{t('std_ec1w_det_peak_qp')} <Tex>{'q_p(z_e)'}</Tex> (EN 1991-1-4 §4.5 Eq. 4.8)</>}
                  formula={`q_p(z_e) = (1 + 7 \\cdot I_v(z_e)) \\cdot \\tfrac{1}{2} \\cdot \\rho \\cdot v_m(z_e)^2 = (1 + 7 \\cdot ${Iv.toFixed(4)}) \\cdot \\tfrac{1}{2} \\cdot ${rho.toFixed(2)}\\ \\mathrm{kg/m^3} \\cdot (${vm.toFixed(2)}\\ \\mathrm{m/s})^2 = ${(qp*1000).toFixed(0)}\\ \\mathrm{N/m^2}`}
                  result={<></>}
                  note={t('std_ec1w_det_note_1N')}
                />
                <CalcStep label="" formula={`\\Rightarrow q_p(z_e) = ${qp.toFixed(4)}\\ \\mathrm{kN/m^2}`} result={<></>} />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_wind_force_calc')}>
                <p style={P}><Sub>{t('std_ec1w_det_rc_fw_prose')}</Sub></p>
                <CalcStep label="" formula={`F_w = c_s c_d \\cdot c_f \\cdot q_p(z_e) \\cdot A_{\\mathrm{ref}}`} result={<></>} />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_struct_factor')}>
                <p style={P}><Sub>{t('std_ec1w_det_struct_factor_prose')}</Sub></p>
                <CalcStep
                  label={<>{t('std_ec1w_det_lbl_struct_factor')} <Tex>{'c_s c_d'}</Tex></>}
                  formula={`c_s c_d = ${elCscd.toFixed(3)}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_rc_slend_title')}>
                <p style={P}><Sub>{t('std_ec1w_det_rc_slend_prose')}</Sub></p>
                <CalcStep
                  label={<>For <Tex>{'l \\leq 15\\ \\mathrm{m}'}</Tex></>}
                  formula={`\\lambda_{15} = \\min\\!\\left(\\frac{2 \\cdot l}{b},\\, 70\\right) = \\min\\!\\left(\\frac{2 \\cdot ${elL.toFixed(3)}\\ \\mathrm{m}}{${elB.toFixed(3)}\\ \\mathrm{m}},\\, 70\\right) = ${lambda15.toFixed(3)}`}
                  result={<></>}
                />
                <CalcStep
                  label={<>For <Tex>{'l \\geq 50\\ \\mathrm{m}'}</Tex></>}
                  formula={`\\lambda_{50} = \\min\\!\\left(\\frac{1.4 \\cdot l}{b},\\, 70\\right) = \\min\\!\\left(\\frac{1.4 \\cdot ${elL.toFixed(3)}\\ \\mathrm{m}}{${elB.toFixed(3)}\\ \\mathrm{m}},\\, 70\\right) = ${lambda50.toFixed(3)}`}
                  result={<></>}
                />
                {elL > 15 && elL < 50 ? (
                  <CalcStep
                    label={<>Interpolated for <Tex>{`${elL.toFixed(3)}\\ \\mathrm{m}`}</Tex></>}
                    formula={`\\lambda = \\lambda_{15} + (\\lambda_{50} - \\lambda_{15}) \\cdot \\frac{l - 15\\ \\mathrm{m}}{50\\ \\mathrm{m} - 15\\ \\mathrm{m}} = ${lambda15.toFixed(3)} + (${lambda50.toFixed(3)} - ${lambda15.toFixed(3)}) \\cdot \\frac{${elL.toFixed(3)} - 15}{35} = ${lambda.toFixed(3)}`}
                    result={<></>}
                  />
                ) : (
                  <CalcStep
                    label={<>{t('std_ec1w_det_rc_lbl_slend')} <Tex>{'\\lambda'}</Tex></>}
                    formula={`\\lambda = ${lambda.toFixed(3)}`}
                    result={<></>}
                    note={elL <= 15 ? `l = ${elL.toFixed(3)} m ≤ 15 m, so λ = λ₁₅ = ${lambda.toFixed(3)}` : `l = ${elL.toFixed(3)} m ≥ 50 m, so λ = λ₅₀ = ${lambda.toFixed(3)}`}
                  />
                )}
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_rc_end_eff_title')}>
                <p style={P}><Sub>{t('std_ec1w_det_rc_end_eff_prose_pre')}</Sub> {lambda.toFixed(3)}:</p>
                <CalcStep
                  label={<>{t('std_ec1w_det_rc_lbl_end_eff')} <Tex>{'\\psi_\\lambda'}</Tex> (EN 1991-1-4 Figure 7.36)</>}
                  formula={`\\psi_\\lambda = ${psi_lam.toFixed(4)}`}
                  result={<></>}
                  note={t('std_ec1w_det_rc_end_eff_note')}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_rc_corner_title')}>
                <p style={P}>
                  {elR === 0
                    ? t('std_ec1w_det_rc_corner_prose_sharp')
                    : `r/b = ${(elR/elB).toFixed(3)}, ψ_r = max(0.5, 1 − r/b) = ${psi_r.toFixed(4)}.`
                  }
                </p>
                <CalcStep
                  label={<>{t('std_ec1w_det_rc_lbl_corner')} <Tex>{'\\psi_r'}</Tex></>}
                  formula={`\\psi_r = ${psi_r.toFixed(4)}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_rc_cf0_title')}>
                <p style={P}><Sub>{t('std_ec1w_det_rc_cf_prose')}</Sub> d ={elD.toFixed(3)} m, b = {elB.toFixed(3)} m, d/b = {db.toFixed(3)}:</p>
                <CalcStep
                  label={<>{t('std_ec1w_det_rc_lbl_cf0')} <Tex>{'c_{f,0}'}</Tex> (Figure 7.23)</>}
                  formula={`c_{f,0} = ${cf0.toFixed(4)}`}
                  result={<></>}
                  note={`d/b = ${db.toFixed(3)}. At d/b = 1 (square): cf,0 ≈ 2.0.`}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_force_coeff')}>
                <p style={P}><Sub>{t('std_ec1w_det_rc_cf_prose')}</Sub></p>
                <CalcStep
                  label={<>{t('std_ec1w_det_lbl_force_coeff')} <Tex>{'c_f'}</Tex></>}
                  formula={`c_f = c_{f,0} \\cdot \\psi_r \\cdot \\psi_\\lambda = ${cf0.toFixed(4)} \\cdot ${psi_r.toFixed(4)} \\cdot ${psi_lam.toFixed(4)} = ${cf.toFixed(4)}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_total_force')}>
                <p style={P}><Sub>{t('std_ec1w_det_total_force_prose')}</Sub></p>
                <CalcStep
                  label={<>{t('std_ec1w_det_lbl_total_force')} <Tex>{'F_w'}</Tex></>}
                  formula={`F_w = c_s c_d \\cdot c_f \\cdot q_p(z_e) \\cdot A_{\\mathrm{ref}} = ${elCscd.toFixed(3)} \\cdot ${cf.toFixed(4)} \\cdot ${qp.toFixed(4)}\\ \\mathrm{kN/m^2} \\cdot ${Aref.toFixed(3)}\\ \\mathrm{m^2} = ${Fw.toFixed(4)}\\ \\mathrm{kN}`}
                  result={<></>}
                />
                <p style={P}><Sub>{t('std_ec1w_det_eff_press_prose')}</Sub></p>
                <CalcStep
                  label={<>{t('std_ec1w_det_lbl_eff_pressure')} <Tex>{'w_{\\mathrm{eff}}'}</Tex></>}
                  formula={`w_{\\mathrm{eff}} = \\frac{F_w}{A_{\\mathrm{ref}}} = \\frac{${Fw.toFixed(4)}\\ \\mathrm{kN}}{${Aref.toFixed(3)}\\ \\mathrm{m^2}} = ${weff.toFixed(4)}\\ \\mathrm{kN/m^2}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_add_notes')}>
                <ul style={{ fontSize: 12, color: '#374151', lineHeight: 1.75, margin: 0, paddingLeft: 18 }}>
                  <li>{t('std_ec1w_det_rc_note_global')} w<sub>eff</sub> = {weff.toFixed(4)} kN/m².</li>
                  <li>{t('std_ec1w_det_char_note_unfactored')}</li>
                </ul>
              </DetailGroup>
            </>)
          })()}
        </DetailsSection>
      </div>
    </div>
    </ResultsDetailsProvider>
  )
}

interface CylProps {
  vb: number; setVb: (v: number) => void
  cat: string; setCat: (v: string) => void
  z: number; setZ: (v: number) => void
  c0: number; setC0: (v: number) => void
  rho: number; setRho: (v: number) => void
  cylDiam: number; setCylDiam: (v: number) => void
  cylL: number; setCylL: (v: number) => void
  cylSurf: string; setCylSurf: (v: string) => void
  cylCscd: number; setCylCscd: (v: number) => void
}

export function WindCylinder({ vb, setVb, cat, setCat, z, setZ, c0, setC0, rho, setRho, cylDiam, setCylDiam, cylL, setCylL, cylSurf, setCylSurf, cylCscd, setCylCscd }: CylProps) {
  const { t } = useTranslation()
  const qpResult = calcPeakPressure(vb, z, cat, c0, rho)
  const { kr: cylKr, cr: cylCr, vm: cylVm, Iv: cylIv, qp } = qpResult
  const surf = CYL_SURFACES.find(s => s.id === cylSurf) ?? CYL_SURFACES[1]
  const nu = 15e-6
  const vPeak = Math.sqrt(2 * qp * 1000 / rho)
  const Re = vPeak * cylDiam / nu
  const kb = (surf.k / 1000) / cylDiam
  const cf0 = getCylCf0(Re, kb)
  const { lambda, lambda15, lambda50 } = getCylEffectiveSlenderness(cylL, cylDiam)
  const psi_lam = getPsiLambda(lambda)
  const cfFinal = cf0 * psi_lam
  const Aref = cylDiam * cylL
  const Fw = cylCscd * cfFinal * qp * Aref
  return (
    <ResultsDetailsProvider>
    <div style={WIND_SECTION}>
      <ResultsDetailsTabBar />
      <TheoryBlock>
        <p><strong>EN 1991-1-4 §7.9.2</strong> — {t('std_ec1w_thy_cyl_p1').split('—').slice(1).join('—').trim()}</p>
        <p><strong>{t('std_ec1w_thy_cyl_re').split(':')[0].trim()}</strong>: {t('std_ec1w_thy_cyl_re').split(':').slice(1).join(':').trim()}</p>
        <p><strong>{t('std_ec1w_thy_cyl_cf').split(':')[0].trim()}</strong>:</p>
        <ul style={{ margin: '4px 0 4px 16px', padding: 0 }}>
          <li>{t('std_ec1w_thy_cyl_sub')}</li>
          <li>{t('std_ec1w_thy_cyl_crit')}</li>
          <li>{t('std_ec1w_thy_cyl_super')}</li>
        </ul>
        <p><strong>{t('std_ec1w_thy_cyl_psi_l').split(':')[0].trim()}</strong>: {t('std_ec1w_thy_cyl_psi_l').split(':').slice(1).join(':').trim()}</p>
        <p><strong>{t('std_ec1w_thy_cyl_fw').split(':')[0].trim()}</strong>: {t('std_ec1w_thy_cyl_fw').split(':').slice(1).join(':').trim()}</p>
      </TheoryBlock>
      <div style={FORMULA_BOX}>
        <strong>EN 1991-1-4 §7.9.2</strong> — Circular cylinders.<br />
        Re = v<sub>m</sub>·b/ν &nbsp;|&nbsp; c<sub>f</sub> depends on Re and k/b &nbsp;|&nbsp; F<sub>w</sub> = c<sub>s</sub>c<sub>d</sub> · c<sub>f</sub> · q<sub>p</sub> · b·l
      </div>
      <WindPrimaryInputs vb={vb} setVb={setVb} cat={cat} setCat={setCat} />
      <div style={INPUT_GRID}>
        <div>
          <LabelTip tip={t('std_ec1w_tip_cyl_ze')}>z<sub>e</sub> — {t('std_ec1w_det_rc_param_z')} (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={1} step={0.5} value={z} onChange={setZ} />
        </div>
        <div>
          <LabelTip tip={t('std_ec1w_tip_cyl_b')}>b — {t('std_ec1w_det_cyl_param_diam')} (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={0.05} step={0.05} value={cylDiam} onChange={setCylDiam} />
        </div>
        <div>
          <LabelTip tip={t('std_ec1w_tip_cyl_l')}>l — {t('std_ec1w_det_cyl_param_l')} (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={0.1} step={0.5} value={cylL} onChange={setCylL} />
        </div>
        <div>
          <LabelTip tip={t('std_ec1w_tip_cyl_rough')}>{t('std_ec1w_det_cyl_param_surf')}</LabelTip>
          <select style={SELECT_STYLE} value={cylSurf} onChange={e => setCylSurf(e.target.value)}>
            {CYL_SURFACES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
      </div>
      <hr style={INPUT_DIVIDER} />
      <div style={INPUT_GRID}>
        <div>
          <LabelTip tip={t('std_ec1w_tip_cyl_cscd')}>c<sub>s</sub>c<sub>d</sub> — {t('std_ec1w_det_lbl_struct_factor')}</LabelTip>
          <NumInput style={INPUT_STYLE} min={0.5} max={1.5} step={0.05} value={cylCscd} onChange={setCylCscd} />
        </div>
      </div>
      <WindSecondaryInputs c0={c0} setC0={setC0} rho={rho} setRho={setRho} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <ResultsBox title={t('std_ui_tab_results')}>
          <ResultRow label={<>F<sub>w</sub> — {t('std_ec1w_det_total_force')}</>} value={Fw.toFixed(3)} unit="kN" onClick={() => document.getElementById('cyl-details')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
          <ResultRow label={<>c<sub>f</sub> = c<sub>f,0</sub>·ψ<sub>λ</sub></>} value={cfFinal.toFixed(3)} />
          <ResultRow label={<>Re = v(z<sub>e</sub>)·b/ν</>} value={Re.toExponential(3)} />
        </ResultsBox>
        <DetailsSection id="cyl-details">
          {(() => {
            const P: React.CSSProperties = { fontSize: 12, color: '#374151', lineHeight: 1.75, margin: '6px 0 10px' }
            const catData = TERRAIN_CATS.find(c => c.id === cat)!
            const z0 = catData.z0
            const zmin = catData.zmin
            const qb = 0.5 * rho * vb * vb / 1000
            const weff = Fw / Aref
            return (<>
              <p style={{ fontSize: 11, color: '#1e293b', marginBottom: 10 }}>
                <strong>According to:</strong> EN 1991-1-4:2005+A1:2010 §7.9.2 and Figure 7.28
              </p>

              <DetailGroup title={t('std_ec1w_det_input_data')}>
                <InputDataTable>
                  <InputDataRow param={<>{t('std_ec1w_det_param_cat')} — <TableRef label="Table 4.1" renderTable={() => <Table41 />} /></>} symbol={<Tex>{'\\text{Cat.}'}</Tex>} value={`Cat. ${cat} — z₀=${z0} m, zmin=${zmin} m`} />
                  <InputDataRow param={t('std_ec1w_det_lbl_basic_vb')} symbol={<Tex>{'v_b'}</Tex>} value={vb.toFixed(2)} unit="m/s" />
                  <InputDataRow param={t('std_ec1w_det_param_c0_short')} symbol={<Tex>{'c_0(z_e)'}</Tex>} value={c0.toFixed(2)} />
                  <InputDataRow param={t('std_ec1w_det_param_rho_short')} symbol={<Tex>{'\\rho'}</Tex>} value={rho.toFixed(2)} unit="kg/m³" />
                  <InputDataRow param={t('std_ec1w_det_cyl_param_diam')} symbol={<Tex>{'b'}</Tex>} value={cylDiam.toFixed(3)} unit="m" />
                  <InputDataRow param={t('std_ec1w_det_cyl_param_l')} symbol={<Tex>{'l'}</Tex>} value={cylL.toFixed(2)} unit="m" />
                  <InputDataRow param={t('std_ec1w_det_cyl_param_z')} symbol={<Tex>{'z'}</Tex>} value={z.toFixed(2)} unit="m" />
                  <InputDataRow param={<>{t('std_ec1w_det_cyl_param_surf')} — <TableRef label="Table 7.13" renderTable={() => <Table713 />} note="— equivalent roughness k" /></>} symbol={<Tex>{'k'}</Tex>} value={`${surf.label} — k = ${surf.k} mm`} />
                  <InputDataRow param={t('std_ec1w_det_lbl_struct_factor')} symbol={<Tex>{'c_s c_d'}</Tex>} value={cylCscd.toFixed(2)} />
                </InputDataTable>
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_ref_area')}>
                <p style={P}><Sub>{t('std_ec1w_det_cyl_ref_prose')}</Sub></p>
                <CalcStep
                  label={<>{t('std_ec1w_det_lbl_ref_height')} <Tex>{'z_e'}</Tex></>}
                  formula={`z_e = z = ${z.toFixed(3)}\\ \\mathrm{m}`}
                  result={<></>}
                />
                <CalcStep
                  label={<>{t('std_ec1w_det_lbl_ref_area')} <Tex>{'A_{\\mathrm{ref}}'}</Tex></>}
                  formula={`A_{\\mathrm{ref}} = b \\cdot l = ${cylDiam.toFixed(3)}\\ \\mathrm{m} \\cdot ${cylL.toFixed(3)}\\ \\mathrm{m} = ${Aref.toFixed(3)}\\ \\mathrm{m^2}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_basic_vb')}>
                <p style={P}><Sub>{t('std_ec1w_det_vb_prose')}</Sub></p>
                <CalcStep label={t('std_ec1w_det_lbl_basic_vb')} formula={`v_b = ${vb.toFixed(2)}\\ \\mathrm{m/s}`} result={<></>} />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_terrain_roughness')}>
                <p style={P}>
                  <Sub>{t('std_ec1w_det_z0_prose_pre')}</Sub> <strong>{cat}</strong> <Sub>{t('std_ec1w_det_z0_prose_post')}</Sub> z<sub>0</sub> = {z0} m, z<sub>min</sub> = {zmin} m. <Sub>{t('std_ec1w_det_kr_prose_pre')}</Sub> {z0} <Sub>{t('std_ec1w_det_kr_prose_post')}</Sub>
                </p>
                <CalcStep
                  label={<>{t('std_ec1w_det_lbl_terrain_factor')} <Tex>{'k_r'}</Tex> (EN 1991-1-4 §4.5 Eq. 4.5)</>}
                  formula={`k_r = 0.19 \\cdot \\left(\\dfrac{z_0}{z_{0,\\mathrm{II}}}\\right)^{0.07} = 0.19 \\cdot \\left(\\dfrac{${z0}\\ \\mathrm{m}}{0.050\\ \\mathrm{m}}\\right)^{0.07} = ${cylKr.toFixed(4)}`}
                  result={<></>}
                />
                <p style={P}>
                  <Sub>{t('std_ec1w_det_cr_prose_pre')}</Sub> {z.toFixed(3)} m {z >= zmin ? '≥' : '<'} <Sub>{t('std_ec1w_det_cr_prose_post')}</Sub>
                </p>
                <CalcStep
                  label={<>{t('std_ec1w_det_lbl_roughness_factor')} <Tex>{'c_r(z_e)'}</Tex> (EN 1991-1-4 §4.5 Eq. 4.4)</>}
                  formula={`c_r(z_e) = k_r \\cdot \\ln\\!\\left(\\frac{\\max(z_e,\\,z_{\\min})}{z_0}\\right) = ${cylKr.toFixed(4)} \\cdot \\ln\\!\\left(\\frac{\\max(${z.toFixed(3)}\\ \\mathrm{m},\\,${zmin}\\ \\mathrm{m})}{${z0}\\ \\mathrm{m}}\\right) = ${cylCr.toFixed(4)}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_orography')}>
                <p style={P}><Sub>{t('std_ec1w_det_orography_prose')}</Sub></p>
                <CalcStep
                  label={t('std_ec1w_det_lbl_orography')}
                  formula={`c_0(z_e) = ${c0.toFixed(3)}`}
                  result={<></>}
                  note={c0 === 1.0 ? t('std_ec1w_det_note_c0_flat') : `c₀ = ${c0.toFixed(3)} — site-specific orography per EN 1991-1-4 §4.3.3.`}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_mean_vm')}>
                <CalcStep
                  label={<>{t('std_ec1w_res_vm')} <Tex>{'v_m(z_e)'}</Tex> (EN 1991-1-4 §4.3 Eq. 4.3)</>}
                  formula={`v_m(z_e) = c_r(z_e) \\cdot c_0(z_e) \\cdot v_b = ${cylCr.toFixed(4)} \\cdot ${c0.toFixed(3)} \\cdot ${vb.toFixed(2)}\\ \\mathrm{m/s} = ${cylVm.toFixed(2)}\\ \\mathrm{m/s}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_turbulence')}>
                <p style={P}>
                  <Sub>{t('std_ec1w_det_iv_prose_pre')}</Sub> {z >= zmin ? '≥' : '<'} <Sub>{t('std_ec1w_det_cr_prose_post')}</Sub>
                </p>
                <CalcStep
                  label={<>{t('std_ec1w_res_iv')} <Tex>{'I_v(z_e)'}</Tex> (EN 1991-1-4 §4.4 Eq. 4.7)</>}
                  formula={`I_v(z_e) = \\frac{k_I}{c_0(z_e) \\cdot \\ln\\!\\left(\\dfrac{\\max(z_e,\\,z_{\\min})}{z_0}\\right)} = \\frac{1.000}{${c0.toFixed(3)} \\cdot \\ln\\!\\left(\\dfrac{\\max(${z.toFixed(3)}\\ \\mathrm{m},\\,${zmin}\\ \\mathrm{m})}{${z0}\\ \\mathrm{m}}\\right)} = ${cylIv.toFixed(4)}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_basic_qb')}>
                <CalcStep
                  label={<>{t('std_ec1w_det_basic_qb')} <Tex>{'q_b'}</Tex> (EN 1991-1-4 §4.5(1))</>}
                  formula={`q_b = \\tfrac{1}{2} \\cdot \\rho \\cdot v_b^2 = \\tfrac{1}{2} \\cdot ${rho.toFixed(2)}\\ \\mathrm{kg/m^3} \\cdot (${vb.toFixed(2)}\\ \\mathrm{m/s})^2 = ${(qb*1000).toFixed(0)}\\ \\mathrm{N/m^2} = ${qb.toFixed(4)}\\ \\mathrm{kN/m^2}`}
                  result={<></>}
                  note={t('std_ec1w_det_note_1N')}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_peak_qp')}>
                <p style={P}><Sub>{t('std_ec1w_det_qp_prose')}</Sub></p>
                <CalcStep
                  label={<>{t('std_ec1w_det_peak_qp')} <Tex>{'q_p(z_e)'}</Tex> (EN 1991-1-4 §4.5 Eq. 4.8)</>}
                  formula={`q_p(z_e) = (1 + 7 \\cdot I_v(z_e)) \\cdot \\tfrac{1}{2} \\cdot \\rho \\cdot v_m(z_e)^2 = (1 + 7 \\cdot ${cylIv.toFixed(4)}) \\cdot \\tfrac{1}{2} \\cdot ${rho.toFixed(2)}\\ \\mathrm{kg/m^3} \\cdot (${cylVm.toFixed(2)}\\ \\mathrm{m/s})^2 = ${(qp*1000).toFixed(0)}\\ \\mathrm{N/m^2}`}
                  result={<></>}
                  note={t('std_ec1w_det_note_1N')}
                />
                <CalcStep label="" formula={`\\Rightarrow q_p(z_e) = ${qp.toFixed(4)}\\ \\mathrm{kN/m^2}`} result={<></>} />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_cyl_peak_vel_title')}>
                <p style={P}><Sub>{t('std_ec1w_det_cyl_peak_vel_prose')}</Sub></p>
                <CalcStep
                  label={<>{t('std_ec1w_det_cyl_lbl_peak_vel')} <Tex>{'v(z_e)'}</Tex></>}
                  formula={`v(z_e) = \\sqrt{\\frac{2 \\cdot q_p(z_e)}{\\rho}} = \\sqrt{\\frac{2 \\cdot ${(qp*1000).toFixed(0)}\\ \\mathrm{N/m^2}}{${rho.toFixed(2)}\\ \\mathrm{kg/m^3}}} = \\sqrt{${(2*qp*1000/rho).toFixed(1)}\\ \\mathrm{m^2/s^2}} = ${vPeak.toFixed(3)}\\ \\mathrm{m/s}`}
                  result={<></>}
                  note={t('std_ec1w_det_note_1N')}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_wind_force_calc')}>
                <p style={P}><Sub>{t('std_ec1w_det_rc_fw_prose')}</Sub></p>
                <CalcStep label="" formula={`F_w = c_s c_d \\cdot c_f \\cdot q_p(z_e) \\cdot A_{\\mathrm{ref}}`} result={<></>} />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_struct_factor')}>
                <p style={P}><Sub>{t('std_ec1w_det_struct_factor_prose')}</Sub></p>
                <CalcStep
                  label={<>{t('std_ec1w_det_lbl_struct_factor')} <Tex>{'c_s c_d'}</Tex></>}
                  formula={`c_s c_d = ${cylCscd.toFixed(3)}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_cyl_re_title')}>
                <p style={P}><Sub>{t('std_ec1w_det_cyl_re_prose')}</Sub></p>
                <CalcStep
                  label={<>{t('std_ec1w_det_cyl_lbl_re')} (EN 1991-1-4 §7.9.1(1))</>}
                  formula={`Re = \\frac{b \\cdot v(z_e)}{\\nu} = \\frac{${cylDiam.toFixed(3)}\\ \\mathrm{m} \\cdot ${vPeak.toFixed(3)}\\ \\mathrm{m/s}}{15.0 \\times 10^{-6}\\ \\mathrm{m^2/s}} = ${Re.toExponential(4)}`}
                  result={<></>}
                  note={`Flow regime: ${Re < 5e5 ? 'Subcritical (Re < 5×10⁵)' : Re < 5e6 ? 'Critical (5×10⁵ < Re < 5×10⁶)' : 'Supercritical (Re > 5×10⁶)'}.`}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_cyl_slend_title')}>
                <p style={P}><Sub>{t('std_ec1w_det_cyl_slend_prose')}</Sub></p>
                <CalcStep
                  label={<>For <Tex>{'l \\leq 15\\ \\mathrm{m}'}</Tex></>}
                  formula={`\\lambda_{15} = \\min\\!\\left(\\frac{l}{b},\\, 70\\right) = \\min\\!\\left(\\frac{${cylL.toFixed(3)}\\ \\mathrm{m}}{${cylDiam.toFixed(3)}\\ \\mathrm{m}},\\, 70\\right) = ${lambda15.toFixed(3)}`}
                  result={<></>}
                />
                <CalcStep
                  label={<>For <Tex>{'l \\geq 50\\ \\mathrm{m}'}</Tex></>}
                  formula={`\\lambda_{50} = \\min\\!\\left(\\frac{0.7 \\cdot l}{b},\\, 70\\right) = \\min\\!\\left(\\frac{0.7 \\cdot ${cylL.toFixed(3)}\\ \\mathrm{m}}{${cylDiam.toFixed(3)}\\ \\mathrm{m}},\\, 70\\right) = ${lambda50.toFixed(3)}`}
                  result={<></>}
                />
                {cylL > 15 && cylL < 50 ? (
                  <CalcStep
                    label={<>Interpolated for <Tex>{`l = ${cylL.toFixed(3)}\\ \\mathrm{m}`}</Tex></>}
                    formula={`\\lambda = \\lambda_{15} + (\\lambda_{50} - \\lambda_{15}) \\cdot \\frac{l - 15\\ \\mathrm{m}}{50\\ \\mathrm{m} - 15\\ \\mathrm{m}} = ${lambda15.toFixed(3)} + (${lambda50.toFixed(3)} - ${lambda15.toFixed(3)}) \\cdot \\frac{${cylL.toFixed(3)} - 15}{35} = ${lambda.toFixed(3)}`}
                    result={<></>}
                  />
                ) : (
                  <CalcStep
                    label={<>{t('std_ec1w_det_rc_lbl_slend')} <Tex>{'\\lambda'}</Tex></>}
                    formula={`\\lambda = ${lambda.toFixed(3)}`}
                    result={<></>}
                    note={cylL <= 15 ? `l = ${cylL.toFixed(3)} m ≤ 15 m, so λ = λ₁₅ = ${lambda.toFixed(3)}` : `l = ${cylL.toFixed(3)} m ≥ 50 m, so λ = λ₅₀ = ${lambda.toFixed(3)}`}
                  />
                )}
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_cyl_end_eff_title')}>
                <p style={P}>
                  <Sub>{t('std_ec1w_det_rc_end_eff_prose_pre')}</Sub> {lambda.toFixed(3)}:
                </p>
                <CalcStep
                  label={<>{t('std_ec1w_det_rc_lbl_end_eff')} <Tex>{'\\psi_\\lambda'}</Tex> (EN 1991-1-4 Figure 7.36)</>}
                  formula={`\\psi_\\lambda = ${psi_lam.toFixed(4)}`}
                  result={<></>}
                  note={t('std_ec1w_det_cyl_end_eff_note')}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_cyl_surf_title')}>
                <p style={P}>
                  <Sub>{t('std_ec1w_det_cyl_re_prose')}</Sub> "<strong>{surf.label}</strong>" — k = {surf.k} mm:
                </p>
                <CalcStep label={t('std_ec1w_det_cyl_lbl_surf')} formula={`k = ${surf.k}\\ \\mathrm{mm}`} result={<></>} />
                <CalcStep
                  label={<>{t('std_ec1w_det_cyl_lbl_rel_rough')} <Tex>{'k/b'}</Tex></>}
                  formula={`k/b = \\frac{${surf.k}\\ \\mathrm{mm} / 1000}{${cylDiam.toFixed(3)}\\ \\mathrm{m}} = ${kb.toFixed(6)}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_cyl_cf0_title')}>
                <p style={P}><Sub>{t('std_ec1w_det_cyl_cf_prose')}</Sub> Re ={Re.toExponential(4)}, k = {surf.k} mm, b = {cylDiam.toFixed(3)} m, k/b = {kb.toFixed(6)}:</p>
                <CalcStep
                  label={<>{t('std_ec1w_det_cyl_lbl_cf0')} <Tex>{'c_{f,0}'}</Tex> (Figure 7.28)</>}
                  formula={`c_{f,0} = ${cf0.toFixed(4)}`}
                  result={<></>}
                  note={`${Re < 5e5 ? 'Subcritical range: cf,0 = 1.2 (constant).' : Re < 5e6 ? 'Critical range: cf,0 drops sharply as the boundary layer transitions to turbulent.' : 'Supercritical range: cf,0 levels off, value depends on surface roughness.'}`}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_force_coeff')}>
                <p style={P}><Sub>{t('std_ec1w_det_cyl_cf_prose')}</Sub></p>
                <CalcStep
                  label={<>{t('std_ec1w_det_lbl_force_coeff')} <Tex>{'c_f'}</Tex></>}
                  formula={`c_f = c_{f,0} \\cdot \\psi_\\lambda = ${cf0.toFixed(4)} \\cdot ${psi_lam.toFixed(4)} = ${cfFinal.toFixed(4)}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_total_force')}>
                <p style={P}><Sub>{t('std_ec1w_det_total_force_prose')}</Sub></p>
                <CalcStep
                  label={<>{t('std_ec1w_det_lbl_total_force')} <Tex>{'F_w'}</Tex></>}
                  formula={`F_w = c_s c_d \\cdot c_f \\cdot q_p(z_e) \\cdot A_{\\mathrm{ref}} = ${cylCscd.toFixed(3)} \\cdot ${cfFinal.toFixed(4)} \\cdot ${qp.toFixed(4)}\\ \\mathrm{kN/m^2} \\cdot ${Aref.toFixed(3)}\\ \\mathrm{m^2} = ${Fw.toFixed(4)}\\ \\mathrm{kN}`}
                  result={<></>}
                />
                <p style={P}><Sub>{t('std_ec1w_det_eff_press_prose')}</Sub></p>
                <CalcStep
                  label={<>{t('std_ec1w_det_lbl_eff_pressure')} <Tex>{'w_{\\mathrm{eff}}'}</Tex></>}
                  formula={`w_{\\mathrm{eff}} = \\frac{F_w}{A_{\\mathrm{ref}}} = \\frac{${Fw.toFixed(4)}\\ \\mathrm{kN}}{${Aref.toFixed(3)}\\ \\mathrm{m^2}} = ${weff.toFixed(4)}\\ \\mathrm{kN/m^2}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_add_notes')}>
                <ul style={{ fontSize: 12, color: '#374151', lineHeight: 1.75, margin: 0, paddingLeft: 18 }}>
                  <li>{t('std_ec1w_det_rc_note_global')} w<sub>eff</sub> = {weff.toFixed(4)} kN/m².</li>
                  <li>{t('std_ec1w_det_char_note_unfactored')}</li>
                </ul>
              </DetailGroup>
            </>)
          })()}
        </DetailsSection>
      </div>
    </div>
    </ResultsDetailsProvider>
  )
}
