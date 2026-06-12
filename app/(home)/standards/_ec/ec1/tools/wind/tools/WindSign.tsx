'use client'
import React from 'react'
import { TheoryBlock, NumInput, ResultRow, ResultsBox, DetailsSection, DetailGroup, CalcStep, InputDataTable, InputDataRow, Tex, TableRef, LabelTip, ResultsDetailsProvider, ResultsDetailsTabBar , Sub} from '@/app/(home)/standards/_lib/ui'
import { Table41 } from '../WindTables'
import { FORMULA_BOX, WIND_SECTION, INPUT_GRID, INPUT_STYLE, LABEL_STYLE, WIND_IMG } from '../../../../../_lib/ui-styles'
import { calcPeakPressure } from '../wind-helpers'
import { TERRAIN_CATS } from '../wind-types'
import { WindPrimaryInputs, WindSecondaryInputs, INPUT_DIVIDER } from '../WindShared'
import { useTranslation } from '@/app/i18n/LanguageContext'

interface Props {
  vb: number; setVb: (v: number) => void
  cat: string; setCat: (v: string) => void
  c0: number; setC0: (v: number) => void
  rho: number; setRho: (v: number) => void
  sgW: number; setSgW: (v: number) => void
  sgH: number; setSgH: (v: number) => void
  sgZg: number; setSgZg: (v: number) => void
  sgCscd: number; setSgCscd: (v: number) => void
  sgEcc: number; setSgEcc: (v: number) => void
}

export default function WindSign({ vb, setVb, cat, setCat, c0, setC0, rho, setRho, sgW, setSgW, sgH, setSgH, sgZg, setSgZg, sgCscd, setSgCscd, sgEcc, setSgEcc }: Props) {
  const { t } = useTranslation()
  // ze = centre of sign per EN 1991-1-4 §7.4.3(3)
  const ze = sgZg + sgH / 2
  const qpResult = calcPeakPressure(vb, ze, cat, c0, rho)
  const { kr, cr, vm, Iv, qp } = qpResult
  const cf = 1.80
  const Aref = sgW * sgH
  const Fw = sgCscd * cf * qp * Aref
  const zcp = sgZg + sgH / 2
  const Mbase = Fw * zcp
  const eccDist = sgEcc * sgW
  const Tw = eccDist * Fw
  return (
    <ResultsDetailsProvider>
    <div style={WIND_SECTION}>
      <ResultsDetailsTabBar />
      <TheoryBlock>
        <p><strong>{t('std_ec1w_thy_ws_p1').split('—')[0].trim()}</strong> — {t('std_ec1w_thy_ws_p1').split('—').slice(1).join('—').trim()}</p>
        <img src={WIND_IMG.signboard} alt="Signboard geometry notation" style={{ width: '100%', maxWidth: 400, borderRadius: 6, margin: '6px 0', display: 'block' }} />
        <p><strong>{t('std_ec1w_thy_ws_cf').split(':')[0].trim()}</strong>: {t('std_ec1w_thy_ws_cf').split(':').slice(1).join(':').trim()}</p>
        <p><strong>{t('std_ec1w_thy_ws_ecc').split(':')[0].trim()}</strong>: {t('std_ec1w_thy_ws_ecc').split(':').slice(1).join(':').trim()}</p>
        <p><strong>{t('std_ec1w_thy_ws_aref').split(':')[0].trim()}</strong>: {t('std_ec1w_thy_ws_aref').split(':').slice(1).join(':').trim()}</p>
        <p><strong>{t('std_ec1w_thy_ws_ze').split(':')[0].trim()}</strong>: {t('std_ec1w_thy_ws_ze').split(':').slice(1).join(':').trim()}</p>
        <p>{t('std_ec1w_thy_ws_mom')}</p>
      </TheoryBlock>
      <div style={FORMULA_BOX}>
        <strong>EN 1991-1-4 §7.4.3</strong> — {t('std_ec1w_thy_ws_formula').split('—').slice(1).join('—').trim()}<br />
        c<sub>f</sub> = 1.80 &nbsp;|&nbsp; z<sub>e</sub> = z<sub>g</sub> + h/2 &nbsp;|&nbsp; F<sub>w</sub> = c<sub>s</sub>c<sub>d</sub> · 1.80 · q<sub>p</sub> · b·h<br />
        M<sub>w</sub> = F<sub>w</sub> · (z<sub>g</sub> + h/2) &nbsp;|&nbsp; T<sub>w</sub> = ±(e/b) · b · F<sub>w</sub>
      </div>
      <WindPrimaryInputs vb={vb} setVb={setVb} cat={cat} setCat={setCat} />
      <div style={INPUT_GRID}>
        <div>
          <LabelTip tip={t('std_ec1w_tip_ws_b')}>b — {t('std_ec1w_det_sg_param_b')} (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={0.1} step={0.1} value={sgW} onChange={setSgW} />
        </div>
        <div>
          <LabelTip tip={t('std_ec1w_tip_ws_h')}>h — {t('std_ec1w_det_sg_param_h')} (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={0.1} step={0.1} value={sgH} onChange={setSgH} />
        </div>
        <div>
          <LabelTip tip={t('std_ec1w_tip_ws_zg')}>z<sub>g</sub> — {t('std_ec1w_det_sg_param_zg')} (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={0} step={0.1} value={sgZg} onChange={setSgZg} />
        </div>
      </div>
      <hr style={INPUT_DIVIDER} />
      <div style={INPUT_GRID}>
        <div>
          <LabelTip tip={t('std_ec1w_tip_ws_ecc')}>{t('std_ec1w_det_sg_param_ecc')} (±)</LabelTip>
          <NumInput style={INPUT_STYLE} min={0} max={0.5} step={0.05} value={sgEcc} onChange={setSgEcc} />
        </div>
        <div>
          <LabelTip tip={t('std_ec1w_tip_ws_cscd')}>c<sub>s</sub>c<sub>d</sub> — {t('std_ec1w_det_param_struct')}</LabelTip>
          <NumInput style={INPUT_STYLE} min={0.5} max={1.5} step={0.05} value={sgCscd} onChange={setSgCscd} />
        </div>
      </div>
      <WindSecondaryInputs c0={c0} setC0={setC0} rho={rho} setRho={setRho} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <img src={WIND_IMG.signboard} alt="Signboard geometry notation" style={{ width: '100%', maxWidth: 480, borderRadius: 6, display: 'block' }} />
        <ResultsBox title={t('std_ui_tab_results')}>
          <ResultRow label={<>F<sub>w</sub> — {t('std_ec1w_det_total_force')}</>} value={Fw.toFixed(3)} unit="kN" onClick={() => document.getElementById('sign-details')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
          <ResultRow label={<>M<sub>w</sub> — {t('std_ec1w_det_sg_lbl_overturning')}</>} value={Mbase.toFixed(3)} unit="kN·m" />
          <ResultRow label={<>T<sub>w</sub> = ±{sgEcc}·b·F<sub>w</sub> — {t('std_ec1w_det_sg_lbl_torsion')}</>} value={`±${Tw.toFixed(3)}`} unit="kN·m" />
          <ResultRow label={<>Eccentricity e = ±{sgEcc}·b</>} value={`±${eccDist.toFixed(3)}`} unit="m" />
        </ResultsBox>
        <DetailsSection id="sign-details">
          {(() => {
            const P: React.CSSProperties = { fontSize: 12, color: '#374151', lineHeight: 1.75, margin: '6px 0 10px' }
            const catData = TERRAIN_CATS.find(c => c.id === cat)!
            const z0 = catData.z0
            const zmin = catData.zmin
            const qb = 0.5 * rho * vb * vb / 1000
            const weff = Fw / Aref
            return (<>
              <p style={{ fontSize: 11, color: '#1e293b', marginBottom: 10 }}>
                <strong>According to:</strong> EN 1991-1-4:2005+A1:2010 §7.4.3
              </p>

              <DetailGroup title={t('std_ec1w_det_input_data')}>
                <InputDataTable>
                  <InputDataRow param={<>{t('std_ec1w_det_param_cat')} — <TableRef label="Table 4.1" renderTable={() => <Table41 />} /></>} symbol={<Tex>{'\\text{Cat.}'}</Tex>} value={`Cat. ${cat} — z₀=${z0} m, zmin=${zmin} m`} />
                  <InputDataRow param={t('std_ec1w_det_lbl_basic_vb')} symbol={<Tex>{'v_b'}</Tex>} value={vb.toFixed(2)} unit="m/s" />
                  <InputDataRow param={t('std_ec1w_det_sg_param_b')} symbol={<Tex>{'b'}</Tex>} value={sgW.toFixed(3)} unit="m" />
                  <InputDataRow param={t('std_ec1w_det_sg_param_h')} symbol={<Tex>{'h'}</Tex>} value={sgH.toFixed(3)} unit="m" />
                  <InputDataRow param={t('std_ec1w_det_sg_param_zg')} symbol={<Tex>{'z_g'}</Tex>} value={sgZg.toFixed(3)} unit="m" />
                  <InputDataRow param={t('std_ec1w_det_param_c0_short')} symbol={<Tex>{'c_0(z_e)'}</Tex>} value={c0.toFixed(2)} />
                  <InputDataRow param={t('std_ec1w_det_param_struct')} symbol={<Tex>{'c_s c_d'}</Tex>} value={sgCscd.toFixed(2)} />
                  <InputDataRow param={t('std_ec1w_det_param_rho_short')} symbol={<Tex>{'\\rho'}</Tex>} value={rho.toFixed(2)} unit="kg/m³" />
                  <InputDataRow param={t('std_ec1w_det_sg_param_ecc')} symbol={<Tex>{'e/b'}</Tex>} value={`±${sgEcc.toFixed(3)}`} />
                </InputDataTable>
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_sg_ref_title')}>
                <p style={P}><Sub>{t('std_ec1w_det_sg_ref_prose')}</Sub></p>
                <CalcStep
                  label={<>{t('std_ec1w_det_lbl_ref_height')} <Tex>{'z_e'}</Tex></>}
                  formula={`z_e = z_g + \\dfrac{h}{2} = ${sgZg.toFixed(3)}\\ \\mathrm{m} + \\dfrac{${sgH.toFixed(3)}\\ \\mathrm{m}}{2} = ${ze.toFixed(3)}\\ \\mathrm{m}`}
                  result={<></>}
                />
                <CalcStep
                  label={<>{t('std_ec1w_det_lbl_ref_area')} <Tex>{'A_{\\mathrm{ref}}'}</Tex></>}
                  formula={`A_{\\mathrm{ref}} = b \\cdot h = ${sgW.toFixed(3)}\\ \\mathrm{m} \\cdot ${sgH.toFixed(3)}\\ \\mathrm{m} = ${Aref.toFixed(2)}\\ \\mathrm{m^2}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_basic_vb')}>
                <p style={P}><Sub>{t('std_ec1w_det_vb_prose')}</Sub></p>
                <CalcStep
                  label={t('std_ec1w_det_lbl_basic_vb')}
                  formula={`v_b = ${vb.toFixed(2)}\\ \\mathrm{m/s}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_terrain_roughness')}>
                <p style={P}>
                  <Sub>{t('std_ec1w_det_z0_prose_pre')}</Sub> <strong>{cat}</strong> <Sub>{t('std_ec1w_det_z0_prose_post')}</Sub> z<sub>0</sub> = {z0} m, z<sub>min</sub> = {zmin} m.
                </p>
                <CalcStep
                  label={<>{t('std_ec1w_det_lbl_terrain_factor')} <Tex>{'k_r'}</Tex> (EN 1991-1-4 §4.5 Eq. 4.5)</>}
                  formula={`k_r = 0.19 \\cdot \\left(\\dfrac{z_0}{z_{0,\\mathrm{II}}}\\right)^{0.07} = 0.19 \\cdot \\left(\\dfrac{${z0}\\ \\mathrm{m}}{0.050\\ \\mathrm{m}}\\right)^{0.07} = ${kr.toFixed(4)}`}
                  result={<></>}
                />
                <p style={P}>
                  <Sub>{t('std_ec1w_det_cr_prose_pre')}</Sub> {ze.toFixed(3)} m {ze >= zmin ? '≥' : '<'} <Sub>{t('std_ec1w_det_cr_prose_post')}</Sub>
                </p>
                <CalcStep
                  label={<>{t('std_ec1w_det_lbl_roughness_factor')} <Tex>{'c_r(z_e)'}</Tex> (EN 1991-1-4 §4.5 Eq. 4.4)</>}
                  formula={`c_r(z_e) = k_r \\cdot \\ln\\!\\left(\\frac{\\max(z_e,\\,z_{\\min})}{z_0}\\right) = ${kr.toFixed(4)} \\cdot \\ln\\!\\left(\\frac{\\max(${ze.toFixed(3)}\\ \\mathrm{m},\\,${zmin}\\ \\mathrm{m})}{${z0}\\ \\mathrm{m}}\\right) = ${cr.toFixed(4)}`}
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
                <p style={P}><Sub>{t('std_ec1w_det_vm_prose')}</Sub></p>
                <CalcStep
                  label={<>{t('std_ec1w_res_vm')} <Tex>{'v_m(z_e)'}</Tex> (EN 1991-1-4 §4.3 Eq. 4.3)</>}
                  formula={`v_m(z_e) = c_r(z_e) \\cdot c_0(z_e) \\cdot v_b = ${cr.toFixed(4)} \\cdot ${c0.toFixed(3)} \\cdot ${vb.toFixed(2)}\\ \\mathrm{m/s} = ${vm.toFixed(2)}\\ \\mathrm{m/s}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_turbulence')}>
                <p style={P}>
                  <Sub>{t('std_ec1w_det_iv_prose_pre')}</Sub> {ze >= zmin ? '≥' : '<'} <Sub>{t('std_ec1w_det_cr_prose_post')}</Sub>
                </p>
                <CalcStep
                  label={<>{t('std_ec1w_res_iv')} <Tex>{'I_v(z_e)'}</Tex> (EN 1991-1-4 §4.4 Eq. 4.7)</>}
                  formula={`I_v(z_e) = \\frac{k_I}{c_0(z_e) \\cdot \\ln\\!\\left(\\dfrac{\\max(z_e,\\,z_{\\min})}{z_0}\\right)} = \\frac{1.000}{${c0.toFixed(3)} \\cdot \\ln\\!\\left(\\dfrac{\\max(${ze.toFixed(3)}\\ \\mathrm{m},\\,${zmin}\\ \\mathrm{m})}{${z0}\\ \\mathrm{m}}\\right)} = ${Iv.toFixed(4)}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_basic_qb')}>
                <p style={P}><Sub>{t('std_ec1w_det_qb_prose')}</Sub></p>
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

              <DetailGroup title={t('std_ec1w_det_struct_factor')}>
                <p style={P}><Sub>{t('std_ec1w_det_sg_struct_prose')}</Sub></p>
                <CalcStep
                  label={t('std_ec1w_det_lbl_struct_factor')}
                  formula={`c_s c_d = ${sgCscd.toFixed(3)}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_force_coeff')}>
                <p style={P}><Sub>{t('std_ec1w_det_sg_cf_prose')}</Sub></p>
                <CalcStep
                  label={t('std_ec1w_det_lbl_force_coeff')}
                  formula={`c_f = 1.800`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_total_force')}>
                <p style={P}><Sub>{t('std_ec1w_det_sg_fw_prose')}</Sub></p>
                <CalcStep
                  label={<>{t('std_ec1w_det_total_force')} <Tex>{'F_w'}</Tex></>}
                  formula={`F_w = c_s c_d \\cdot c_f \\cdot q_p(z_e) \\cdot A_{\\mathrm{ref}} = ${sgCscd.toFixed(3)} \\cdot 1.800 \\cdot ${qp.toFixed(4)}\\ \\mathrm{kN/m^2} \\cdot ${Aref.toFixed(2)}\\ \\mathrm{m^2} = ${Fw.toFixed(3)}\\ \\mathrm{kN}`}
                  result={<></>}
                />
                <p style={P}><Sub>{t('std_ec1w_det_sg_weff_prose')}</Sub></p>
                <CalcStep
                  label={<>{t('std_ec1w_det_lbl_eff_pressure')} <Tex>{'w_{\\mathrm{eff}}'}</Tex></>}
                  formula={`w_{\\mathrm{eff}} = \\frac{F_w}{A_{\\mathrm{ref}}} = \\frac{${Fw.toFixed(3)}\\ \\mathrm{kN}}{${Aref.toFixed(2)}\\ \\mathrm{m^2}} = ${weff.toFixed(3)}\\ \\mathrm{kN/m^2}`}
                  result={<></>}
                />
                <p style={P}>
                  {t('std_ec1w_det_sg_weff_note_pre')} {weff.toFixed(3)} {t('std_ec1w_det_sg_weff_note_post')}
                </p>
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_sg_overturning_title')}>
                <p style={P}><Sub>{t('std_ec1w_det_sg_overturning_prose')}</Sub></p>
                <CalcStep
                  label={<>{t('std_ec1w_det_sg_lbl_overturning')} <Tex>{'M_w'}</Tex></>}
                  formula={`M_w = F_w \\cdot \\left(z_g + \\dfrac{h}{2}\\right) = ${Fw.toFixed(3)}\\ \\mathrm{kN} \\cdot \\left(${sgZg.toFixed(3)}\\ \\mathrm{m} + \\dfrac{${sgH.toFixed(3)}\\ \\mathrm{m}}{2}\\right) = ${Mbase.toFixed(2)}\\ \\mathrm{kN{\\cdot}m}`}
                  result={<></>}
                  note={t('std_ec1w_det_sg_overturning_note')}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_sg_eccentricity_title')}>
                <p style={P}><Sub>{t('std_ec1w_det_sg_eccentricity_prose')}</Sub></p>
                <CalcStep
                  label={<>{t('std_ec1w_det_sg_lbl_torsion')} <Tex>{'T_w'}</Tex></>}
                  formula={`T_w = \\pm\\,\\frac{e}{b} \\cdot b \\cdot F_w = \\pm\\,${sgEcc.toFixed(3)} \\cdot ${sgW.toFixed(3)}\\ \\mathrm{m} \\cdot ${Fw.toFixed(3)}\\ \\mathrm{kN} = ${Tw.toFixed(2)}\\ \\mathrm{kN{\\cdot}m}`}
                  result={<></>}
                  note={t('std_ec1w_det_sg_torsion_note')}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_add_notes')}>
                <ul style={{ fontSize: 12, color: '#374151', lineHeight: 1.75, margin: 0, paddingLeft: 18 }}>
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
