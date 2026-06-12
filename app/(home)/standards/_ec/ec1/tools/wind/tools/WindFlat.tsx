'use client'
import { useState } from 'react'
import { TheoryBlock, NumInput, Table, TR, ResultRow, ResultsBox, DetailsSection, DetailGroup, CalcStep, InputDataTable, InputDataRow, Tex, TableRef, LabelTip, ResultsDetailsProvider, ResultsDetailsTabBar , Sub} from '@/app/(home)/standards/_lib/ui'
import FlatRoofDiagram from '../FlatRoofDiagram'
import { TH, TD, TDN, FORMULA_BOX, WIND_SECTION, INPUT_GRID, INPUT_STYLE, LABEL_STYLE, ZONE_PILL, WIND_IMG } from '../../../../../_lib/ui-styles'
import { calcPeakPressure, getFlatRoofCpe } from '../wind-helpers'
import { TERRAIN_CATS } from '../wind-types'
import { Table72, Table41 } from '../WindTables'
import { WindPrimaryInputs, WindSecondaryInputs, INPUT_DIVIDER } from '../WindShared'
import { useTranslation } from '@/app/i18n/LanguageContext'

interface Props {
  vb: number; setVb: (v: number) => void
  cat: string; setCat: (v: string) => void
  c0: number; setC0: (v: number) => void
  rho: number; setRho: (v: number) => void
  rD: number; setRD: (v: number) => void
  rB: number; setRB: (v: number) => void
  rH: number; setRH: (v: number) => void
  rHp: number; setRHp: (v: number) => void
  cpiMin: number; setCpiMin: (v: number) => void
  cpiMax: number; setCpiMax: (v: number) => void
}

export default function WindFlat({ vb, setVb, cat, setCat, c0, setC0, rho, setRho, rD, setRD, rB, setRB, rH, setRH, rHp, setRHp, cpiMin, setCpiMin, cpiMax, setCpiMax }: Props) {
  const { t } = useTranslation()
  const [showDiagram, setShowDiagram] = useState(false)
  const ze = rH
  const { kr, cr, vm, Iv, qp } = calcPeakPressure(vb, ze, cat, c0, rho)
  const e = Math.min(rB, 2 * rH)
  const hph = rH > 0 ? rHp / rH : 0
  const cpe = getFlatRoofCpe(hph)
  const zones: { zone: string; cpe10: number; dual?: boolean }[] = [
    { zone: 'F', cpe10: cpe.F },
    { zone: 'G', cpe10: cpe.G },
    { zone: 'H', cpe10: cpe.H },
    { zone: 'I (+)', cpe10: cpe.I_pos, dual: true },
    { zone: 'I (−)', cpe10: cpe.I_neg, dual: true },
  ]
  return (
    <ResultsDetailsProvider>
    <div style={WIND_SECTION}>
      <ResultsDetailsTabBar />
      <TheoryBlock>
        <p><strong>EN 1991-1-4 §7.2.3</strong> — {t('std_ec1w_thy_wf_p1').split('—').slice(1).join('—').trim()}</p>
        <p>{t('std_ec1w_thy_wf_parapet')}</p>
        <p><strong>Zone I</strong> {t('std_ec1w_thy_wf_i').replace(/^Zone I /i, '')}</p>
        <p><strong>{t('std_ec1w_thy_wf_e').split(':')[0].trim()}</strong>: {t('std_ec1w_thy_wf_e').split(':').slice(1).join(':').trim()}</p>
        <ul style={{ margin: '4px 0 4px 16px', padding: 0 }}>
          <li><strong>F</strong>: {t('std_ec1w_thy_wf_f').split(':').slice(1).join(':').trim()}</li>
          <li><strong>G</strong>: {t('std_ec1w_thy_wf_g').split(':').slice(1).join(':').trim()}</li>
          <li><strong>H</strong>: {t('std_ec1w_thy_wf_h').split(':').slice(1).join(':').trim()}</li>
          <li><strong>I</strong>: {t('std_ec1w_thy_wf_iz').split(':').slice(1).join(':').trim()}</li>
        </ul>
      </TheoryBlock>
      <div style={FORMULA_BOX}>
        <strong>EN 1991-1-4 §7.2.3</strong> — {t('std_ec1w_thy_wf_formula').split('—').slice(1).join('—').trim()}<br />
        {t('std_ec1w_thy_wf_formula2')}
      </div>
      <WindPrimaryInputs vb={vb} setVb={setVb} cat={cat} setCat={setCat} />
      <div style={INPUT_GRID}>
        <div>
          <LabelTip tip={t('std_ec1w_tip_wf_d')}>d — {t('std_ec1w_det_wf_param_d')} (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={1} step={0.5} value={rD} onChange={setRD} />
        </div>
        <div>
          <LabelTip tip={t('std_ec1w_tip_wf_b')}>b — {t('std_ec1w_det_wf_param_b')} (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={1} step={0.5} value={rB} onChange={setRB} />
        </div>
        <div>
          <LabelTip tip={t('std_ec1w_tip_wf_h')}>h — {t('std_ec1w_det_wf_param_h')} (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={1} step={0.5} value={rH} onChange={setRH} />
        </div>
        <div>
          <LabelTip tip={t('std_ec1w_tip_wf_hp')}>h<sub>p</sub> — {t('std_ec1w_det_wf_param_hp')} (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={0} step={0.05} value={rHp} onChange={setRHp} />
        </div>
      </div>
      <hr style={INPUT_DIVIDER} />
      <div style={INPUT_GRID}>
        <div>
          <LabelTip tip={t('std_ec1w_tip_wf_cpi_min')}>c<sub>pi,min</sub></LabelTip>
          <NumInput style={INPUT_STYLE} min={-0.5} max={0} step={0.05} value={cpiMin} onChange={setCpiMin} />
        </div>
        <div>
          <LabelTip tip={t('std_ec1w_tip_wf_cpi_max')}>c<sub>pi,max</sub></LabelTip>
          <NumInput style={INPUT_STYLE} min={0} max={0.5} step={0.05} value={cpiMax} onChange={setCpiMax} />
        </div>
      </div>
      <WindSecondaryInputs c0={c0} setC0={setC0} rho={rho} setRho={setRho} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <img src={WIND_IMG.flatRoof} alt="Flat roof pressure zones" style={{ width: '100%', maxWidth: 520, borderRadius: 6, display: 'block' }} />
        <div style={{ fontSize: 12, color: '#1e293b' }}>e = min(b, 2h) = min({rB}, {2*rH}) = <strong>{e.toFixed(1)} m</strong> &nbsp;|&nbsp; h<sub>p</sub>/h = {hph.toFixed(3)} &nbsp;|&nbsp; z<sub>e</sub> = h = {rH} m</div>
        <div>
          <button
            onClick={() => setShowDiagram(v => !v)}
            style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, border: '1px solid #bfdbfe', borderRadius: 6, background: showDiagram ? '#dbeafe' : '#eff6ff', color: '#1d4ed8', cursor: 'pointer' }}
          >
            {showDiagram ? `▲ ${t('std_ui_hide')}` : `▼ ${t('std_ui_show_zone_diagram')}`}
          </button>
        </div>
        {showDiagram && <FlatRoofDiagram d={rD} b={rB} h={rH} hp={rHp} e={e} />}
        <ResultsBox title={t('std_ui_tab_results')}>
          <ResultRow label={<>q<sub>p</sub>(z<sub>e</sub>=h) — {t('std_ec1w_res_qp')}</>} value={qp.toFixed(3)} unit="kPa" onClick={() => document.getElementById('flat-details')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
          <Table>
            <thead><tr>
              <th style={TH}>Zone</th><th style={TH}>c<sub>pe,10</sub></th>
              <th style={TH}>w (c<sub>pi,max</sub>) (kPa)</th><th style={TH}>w (c<sub>pi,min</sub>) (kPa)</th>
            </tr></thead>
            <tbody>{zones.map(({ zone, cpe10 }, i) => (
              <TR key={zone} stripe={i % 2 !== 0}>
                <td style={{ ...TD, fontWeight: 700 }}><span style={{ ...ZONE_PILL, background: '#dbeafe', color: '#1d4ed8' }}>{zone}</span></td>
                <td style={{ ...TDN, color: cpe10 >= 0 ? '#dc2626' : '#2563eb' }}>{cpe10.toFixed(2)}</td>
                <td style={TDN}>{(qp * (cpe10 - cpiMax)).toFixed(3)}</td>
                <td style={TDN}>{(qp * (cpe10 - cpiMin)).toFixed(3)}</td>
              </TR>
            ))}</tbody>
          </Table>
        </ResultsBox>
        <DetailsSection id="flat-details">
          {(() => {
            const tc = TERRAIN_CATS.find(c => c.id === cat) ?? TERRAIN_CATS[2]
            const z0 = tc.z0; const zmin = tc.zmin
            const qb = 0.5 * rho * vb * vb / 1000
            const wF_max = qp * (cpe.F - cpiMax); const wF_min = qp * (cpe.F - cpiMin)
            const wG_max = qp * (cpe.G - cpiMax); const wG_min = qp * (cpe.G - cpiMin)
            const wH_max = qp * (cpe.H - cpiMax); const wH_min = qp * (cpe.H - cpiMin)
            const wI_pos_max = qp * (cpe.I_pos - cpiMin); const wI_neg_max = qp * (cpe.I_neg - cpiMax)
            const PROSE: React.CSSProperties = { fontSize: 12, color: '#374151', lineHeight: 1.75, margin: '6px 0 10px' }
            return (
              <>
                <p style={{ fontSize: 11, color: '#1e293b', marginBottom: 12 }}>
                  <strong>According to:</strong> EN 1991-1-4:2005+A1:2010 §7.2.3 and Table 7.2
                </p>

                <DetailGroup title={t('std_ec1w_det_input_data')}>
                  <InputDataTable>
                    <InputDataRow param={<>{t('std_ec1w_det_param_cat')} — <TableRef label="Table 4.1" renderTable={() => <Table41 />} /></>} symbol={<Tex>{'\\text{Cat.}'}</Tex>} value={`Cat. ${cat}`} />
                    <InputDataRow param={t('std_ec1w_det_lbl_basic_vb')} symbol={<Tex>{'v_b'}</Tex>} value={vb.toFixed(2)} unit="m/s" />
                    <InputDataRow param={t('std_ec1w_det_wf_param_d')} symbol={<Tex>{'d'}</Tex>} value={rD.toFixed(3)} unit="m" />
                    <InputDataRow param={t('std_ec1w_det_wf_param_b')} symbol={<Tex>{'b'}</Tex>} value={rB.toFixed(3)} unit="m" />
                    <InputDataRow param={t('std_ec1w_det_wf_param_h')} symbol={<Tex>{'h'}</Tex>} value={rH.toFixed(3)} unit="m" />
                    <InputDataRow param={<>{t('std_ec1w_det_wf_param_hp')} — <TableRef label="Table 7.2" renderTable={() => <Table72 />} note="— flat roof cpe" /></>} symbol={<Tex>{'h_p'}</Tex>} value={rHp.toFixed(3)} unit="m" />
                    <InputDataRow param={t('std_ec1w_det_wf_param_c0')} symbol={<Tex>{'c_0(z_e)'}</Tex>} value={c0.toFixed(3)} />
                    <InputDataRow param={t('std_ec1w_det_param_rho_short')} symbol={<Tex>{'\\rho'}</Tex>} value={rho.toFixed(2)} unit="kg/m³" />
                    <InputDataRow param={t('std_ec1w_det_param_cpi_min')} symbol={<Tex>{'c_{pi,\\min}'}</Tex>} value={cpiMin.toFixed(3)} />
                    <InputDataRow param={t('std_ec1w_det_param_cpi_max')} symbol={<Tex>{'c_{pi,\\max}'}</Tex>} value={cpiMax.toFixed(3)} />
                  </InputDataTable>
                </DetailGroup>

                <DetailGroup title={t('std_ec1w_det_ref_height')}>
                  <p style={PROSE}><Sub>{t('std_ec1w_det_wf_ref_h_prose')}</Sub></p>
                  <CalcStep
                    label={<>{t('std_ec1w_det_lbl_ref_height')} <Tex>{'z_e'}</Tex> (EN 1991-1-4 §7.2.3(3))</>}
                    formula={`z_e = h + h_p = ${rH.toFixed(3)}\\ \\mathrm{m} + ${rHp.toFixed(3)}\\ \\mathrm{m} = ${ze.toFixed(3)}\\ \\mathrm{m}`}
                    result={<></>}
                  />
                </DetailGroup>

                <DetailGroup title={t('std_ec1w_det_basic_vb')}>
                  <p style={PROSE}><Sub>{t('std_ec1w_det_vb_prose')}</Sub></p>
                </DetailGroup>

                <DetailGroup title={t('std_ec1w_det_terrain_roughness')}>
                  <p style={PROSE}>
                    <Sub>{t('std_ec1w_det_z0_prose_pre')}</Sub> <strong>{cat}</strong> <Sub>{t('std_ec1w_det_z0_prose_post')}</Sub> z<sub>0</sub> = {z0.toFixed(3)} m, z<sub>min</sub> = {zmin.toFixed(1)} m.
                  </p>
                  <p style={PROSE}>
                    <Sub>{t('std_ec1w_det_kr_prose_pre')}</Sub> {z0.toFixed(3)} <Sub>{t('std_ec1w_det_kr_prose_post')}</Sub>
                  </p>
                  <CalcStep
                    label={<>{t('std_ec1w_det_lbl_terrain_factor')} <Tex>{'k_r'}</Tex> (EN 1991-1-4 §4.5 Eq. 4.5)</>}
                    formula={`k_r = 0.19 \\cdot \\left(\\dfrac{z_0}{z_{0,\\mathrm{II}}}\\right)^{0.07} = 0.19 \\cdot \\left(\\dfrac{${z0.toFixed(3)}\\ \\mathrm{m}}{0.050\\ \\mathrm{m}}\\right)^{0.07} = ${kr.toFixed(4)}`}
                    result={<></>}
                  />
                  <p style={PROSE}>
                    <Sub>{t('std_ec1w_det_cr_prose_pre')}</Sub> {ze.toFixed(3)} m {ze >= zmin ? '≥' : '<'} <Sub>{t('std_ec1w_det_cr_prose_post')}</Sub>
                  </p>
                  <CalcStep
                    label={<>{t('std_ec1w_det_lbl_roughness_factor')} <Tex>{'c_r(z_e)'}</Tex> (EN 1991-1-4 §4.5 Eq. 4.4)</>}
                    formula={`c_r(z_e) = k_r \\cdot \\ln\\!\\left(\\frac{\\max(z_e,\\,z_{\\min})}{z_0}\\right) = ${kr.toFixed(4)} \\cdot \\ln\\!\\left(\\frac{\\max(${ze.toFixed(3)}\\ \\mathrm{m},\\,${zmin.toFixed(1)}\\ \\mathrm{m})}{${z0.toFixed(3)}\\ \\mathrm{m}}\\right) = ${cr.toFixed(4)}`}
                    result={<></>}
                  />
                </DetailGroup>

                <DetailGroup title={t('std_ec1w_det_orography')}>
                  <p style={PROSE}><Sub>{t('std_ec1w_det_orography_prose')}</Sub></p>
                </DetailGroup>

                <DetailGroup title={t('std_ec1w_det_mean_vm')}>
                  <p style={PROSE}><Sub>{t('std_ec1w_det_vm_prose')}</Sub></p>
                  <CalcStep
                    label={<>{t('std_ec1w_res_vm')} <Tex>{'v_m(z_e)'}</Tex> (EN 1991-1-4 §4.3 Eq. 4.3)</>}
                    formula={`v_m(z_e) = c_r(z_e) \\cdot c_0(z_e) \\cdot v_b = ${cr.toFixed(4)} \\cdot ${c0.toFixed(3)} \\cdot ${vb.toFixed(2)}\\ \\mathrm{m/s} = ${vm.toFixed(2)}\\ \\mathrm{m/s}`}
                    result={<></>}
                  />
                </DetailGroup>

                <DetailGroup title={t('std_ec1w_det_turbulence')}>
                  <p style={PROSE}>
                    <Sub>{t('std_ec1w_det_iv_prose_pre')}</Sub> {ze >= zmin ? '≥' : '<'} <Sub>{t('std_ec1w_det_cr_prose_post')}</Sub>
                  </p>
                  <CalcStep
                    label={<>{t('std_ec1w_res_iv')} <Tex>{'I_v(z_e)'}</Tex> (EN 1991-1-4 §4.4 Eq. 4.7)</>}
                    formula={`I_v(z_e) = \\frac{k_I}{c_0(z_e) \\cdot \\ln\\!\\left(\\frac{\\max(z_e,\\,z_{\\min})}{z_0}\\right)} = \\frac{1.000}{${c0.toFixed(3)} \\cdot \\ln\\!\\left(\\frac{\\max(${ze.toFixed(3)}\\ \\mathrm{m},\\,${zmin.toFixed(1)}\\ \\mathrm{m})}{${z0.toFixed(3)}\\ \\mathrm{m}}\\right)} = ${Iv.toFixed(4)}`}
                    result={<></>}
                  />
                </DetailGroup>

                <DetailGroup title={t('std_ec1w_det_basic_qb')}>
                  <p style={PROSE}><Sub>{t('std_ec1w_det_qb_prose')}</Sub></p>
                  <CalcStep
                    label={<>{t('std_ec1w_det_basic_qb')} <Tex>{'q_b'}</Tex> (EN 1991-1-4 §4.5(1))</>}
                    formula={`q_b = \\tfrac{1}{2} \\cdot \\rho \\cdot v_b^2 = \\tfrac{1}{2} \\cdot ${rho.toFixed(2)}\\ \\mathrm{kg/m^3} \\cdot (${vb.toFixed(2)}\\ \\mathrm{m/s})^2 = ${(qb*1000).toFixed(0)}\\ \\mathrm{N/m^2} = ${qb.toFixed(4)}\\ \\mathrm{kN/m^2}`}
                    result={<></>}
                    note={t('std_ec1w_det_note_1N')}
                  />
                </DetailGroup>

                <DetailGroup title={t('std_ec1w_det_peak_qp')}>
                  <p style={PROSE}><Sub>{t('std_ec1w_det_qp_prose')}</Sub></p>
                  <CalcStep
                    label={<>{t('std_ec1w_det_peak_qp')} <Tex>{'q_p(z_e)'}</Tex> (EN 1991-1-4 §4.5 Eq. 4.8)</>}
                    formula={`q_p(z_e) = (1 + 7 \\cdot I_v(z_e)) \\cdot \\tfrac{1}{2} \\cdot \\rho \\cdot v_m(z_e)^2 = (1 + 7 \\cdot ${Iv.toFixed(4)}) \\cdot \\tfrac{1}{2} \\cdot ${rho.toFixed(2)}\\ \\mathrm{kg/m^3} \\cdot (${vm.toFixed(2)}\\ \\mathrm{m/s})^2 = ${(qp*1000).toFixed(0)}\\ \\mathrm{N/m^2}`}
                    result={<></>}
                    note={t('std_ec1w_det_note_1N')}
                  />
                  <CalcStep label="" formula={`\\Rightarrow q_p(z_e) = ${qp.toFixed(4)}\\ \\mathrm{kN/m^2}`} result={<></>} />
                </DetailGroup>

                <DetailGroup title={t('std_ec1w_det_wf_zone_geom_title')}>
                  <p style={PROSE}>
                    The wind load on the structure is expressed in terms of external pressure coefficients for four zones F, G, H, I as defined in EN 1991-1-4 Figure 7.6. The extent of the zones depends on the length e that is defined as:
                  </p>
                  <CalcStep
                    label={<>{t('std_ec1w_det_wf_zone_param')} <Tex>{'e'}</Tex></>}
                    formula={`e = \\min(b,\\,2h) = \\min(${rB.toFixed(3)}\\ \\mathrm{m},\\;2 \\times ${rH.toFixed(3)}\\ \\mathrm{m}) = ${e.toFixed(3)}\\ \\mathrm{m}`}
                    result={<></>}
                  />
                  <p style={PROSE}>
                    Zone F extends starting from both of the upwind corners for length e/10 = {(e/10).toFixed(3)} m and width e/4 = {(e/4).toFixed(3)} m. Zone G extends between Zones F along the windward edge, e/10 = {(e/10).toFixed(3)} m deep. Zone H extends from e/10 to e/2 = {(e/2).toFixed(3)} m from the windward eave. Zone I extends over the remainder of the roof beyond e/2.
                  </p>
                </DetailGroup>

                <DetailGroup title={<>{t('std_ec1w_det_wf_cpe_title')} — <TableRef label="Table 7.2" renderTable={() => <Table72 />} note="— flat roof c_pe" /></>}>
                  <p style={PROSE}>
                    The external pressure coefficient c<sub>pe</sub> for each of zones F, G, H, I is defined in EN 1991-1-4 Table 7.2 as a function of the normalised parapet height h<sub>p</sub>/h:
                  </p>
                  <CalcStep
                    label={<>{t('std_ec1w_det_wf_norm_parapet')} <Tex>{'h_p/h'}</Tex></>}
                    formula={`h_p/h = ${rHp.toFixed(3)}\\ \\mathrm{m} \\;/\\; ${rH.toFixed(3)}\\ \\mathrm{m} = ${hph.toFixed(3)}`}
                    result={<></>}
                  />
                  <Table>
                    <thead><tr>
                      <th style={{ padding: '5px 14px', fontWeight: 700, color: '#1e293b', fontSize: 11, background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>Zone</th>
                      <th style={{ padding: '5px 14px', fontWeight: 700, color: '#1e293b', fontSize: 11, background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>External pressure coefficient</th>
                    </tr></thead>
                    <tbody>
                      {[
                        { z: 'Zone F', label: 'c_{pe,F}', v: cpe.F },
                        { z: 'Zone G', label: 'c_{pe,G}', v: cpe.G },
                        { z: 'Zone H', label: 'c_{pe,H}', v: cpe.H },
                        { z: 'Zone I', label: 'c_{pe,I}', v: null },
                      ].map(({ z, label, v }, i) => (
                        <tr key={z} style={{ background: i % 2 !== 0 ? '#fafafa' : '#fff', borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '5px 14px', fontSize: 12 }}>{z}</td>
                          <td style={{ padding: '5px 14px', fontSize: 12, textAlign: 'right', fontFamily: 'ui-monospace,monospace', color: '#2563eb' }}>
                            {v !== null
                              ? <Tex>{`${label} = ${v.toFixed(3)}`}</Tex>
                              : <Tex>{`${label} = \\pm${cpe.I_pos.toFixed(3)}`}</Tex>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </DetailGroup>

                <DetailGroup title={t('std_ec1w_det_wf_cpi_title')}>
                  <p style={PROSE}>
                    Internal pressure coefficients c<sub>pi</sub> are specified in EN 1991-1-4 §7.2.9 depending on the size and distribution of the openings. For buildings without a dominant face, c<sub>pi</sub> = +0.2 or c<sub>pi</sub> = −0.3 should be considered per §7.2.9(6) Note 2.
                  </p>
                  <CalcStep
                    label={<>{t('std_ec1w_det_cpi_group')}</>}
                    formula={`c_{pi,\\min} = ${cpiMin.toFixed(3)} \\qquad c_{pi,\\max} = ${cpiMax.toFixed(3)}`}
                    result={<></>}
                  />
                  <p style={PROSE}><Sub>{t('std_ec1w_det_note_cpi_neg')}</Sub></p>
                </DetailGroup>

                <DetailGroup title={t('std_ec1w_det_wf_ext_int_title')}>
                  <p style={PROSE}>
                    The external wind pressure w<sub>e</sub> on the structure is derived from the peak velocity pressure q<sub>p</sub>(z<sub>e</sub>) = {qp.toFixed(3)} kN/m² and external pressure coefficient c<sub>pe</sub>:
                  </p>
                  <CalcStep label="" formula={'w_e = q_p(z_e) \\cdot c_{pe}'} result={<></>} />
                  <p style={PROSE}>
                    The internal wind pressure w<sub>i</sub> is derived from the internal pressure coefficient c<sub>pi</sub>. The reference height for internal pressure z<sub>i</sub> = z<sub>e</sub> = {ze.toFixed(3)} m and q<sub>p</sub>(z<sub>i</sub>) = q<sub>p</sub>(z<sub>e</sub>) = {qp.toFixed(4)} kN/m².
                  </p>
                  <CalcStep label="" formula={'w_{\\mathrm{net}} = w_e - w_i = q_p(z_e) \\cdot c_{pe} - q_p(z_i) \\cdot c_{pi}'} result={<></>} />
                </DetailGroup>

                <DetailGroup title={t('std_ec1w_det_wf_net_title')}>
                  <p style={PROSE}>
                    For the case where no dominant face is present, the most unfavourable net wind pressure for each zone is obtained by combining c<sub>pe</sub> with c<sub>pi,min</sub> = {cpiMin.toFixed(3)} or c<sub>pi,max</sub> = {cpiMax.toFixed(3)}.
                  </p>
                  {[
                    { zone: 'F', cpe10: cpe.F, wMax: wF_max, wMin: wF_min },
                    { zone: 'G', cpe10: cpe.G, wMax: wG_max, wMin: wG_min },
                    { zone: 'H', cpe10: cpe.H, wMax: wH_max, wMin: wH_min },
                  ].map(({ zone, cpe10, wMax, wMin }) => (
                    <CalcStep key={zone}
                      label={<>Zone {zone} — <Tex>{`c_{pe,10} = ${cpe10.toFixed(3)}`}</Tex></>}
                      formula={`\\begin{aligned}w_{\\mathrm{net},${zone}}(c_{pi,\\max}) &= ${qp.toFixed(4)} \\cdot (${cpe10.toFixed(3)} - ${cpiMax.toFixed(3)}) = ${wMax.toFixed(4)}\\ \\mathrm{kN/m^2}\\\\w_{\\mathrm{net},${zone}}(c_{pi,\\min}) &= ${qp.toFixed(4)} \\cdot (${cpe10.toFixed(3)} - (${cpiMin.toFixed(3)})) = ${wMin.toFixed(4)}\\ \\mathrm{kN/m^2}\\end{aligned}`}
                      result={<></>}
                    />
                  ))}
                  <CalcStep
                    label={<>Zone I — <Tex>{`c_{pe,10} = \\pm${cpe.I_pos.toFixed(3)}`}</Tex> (both positive and negative must be checked)</>}
                    formula={`\\begin{aligned}w_{\\mathrm{net},I}^{+}(c_{pi,\\min}) &= ${qp.toFixed(4)} \\cdot (${cpe.I_pos.toFixed(3)} - (${cpiMin.toFixed(3)})) = ${wI_pos_max.toFixed(4)}\\ \\mathrm{kN/m^2}\\\\w_{\\mathrm{net},I}^{-}(c_{pi,\\max}) &= ${qp.toFixed(4)} \\cdot (${cpe.I_neg.toFixed(3)} - ${cpiMax.toFixed(3)}) = ${wI_neg_max.toFixed(4)}\\ \\mathrm{kN/m^2}\\end{aligned}`}
                    result={<></>}
                  />
                  <Table>
                    <thead><tr>
                      <th style={{ padding: '5px 14px', fontWeight: 700, color: '#1e293b', fontSize: 11, background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>Zone</th>
                      <th style={{ padding: '5px 14px', fontWeight: 700, color: '#1e293b', fontSize: 11, background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>c<sub>pe,10</sub></th>
                      <th style={{ padding: '5px 14px', fontWeight: 700, color: '#1e293b', fontSize: 11, background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>w (c<sub>pi,max</sub>) kN/m²</th>
                      <th style={{ padding: '5px 14px', fontWeight: 700, color: '#1e293b', fontSize: 11, background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'right' }}>w (c<sub>pi,min</sub>) kN/m²</th>
                    </tr></thead>
                    <tbody>
                      {[
                        { z: 'Zone F',    cpe: cpe.F,     w1: wF_max,     w2: wF_min },
                        { z: 'Zone G',    cpe: cpe.G,     w1: wG_max,     w2: wG_min },
                        { z: 'Zone H',    cpe: cpe.H,     w1: wH_max,     w2: wH_min },
                        { z: 'Zone I (+)', cpe: cpe.I_pos, w1: qp*(cpe.I_pos-cpiMax), w2: wI_pos_max },
                        { z: 'Zone I (−)', cpe: cpe.I_neg, w1: wI_neg_max, w2: qp*(cpe.I_neg-cpiMin) },
                      ].map(({ z, cpe: cv, w1, w2 }, i) => (
                        <tr key={z} style={{ background: i % 2 !== 0 ? '#fafafa' : '#fff', borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '5px 14px', fontSize: 12 }}>{z}</td>
                          <td style={{ padding: '5px 14px', fontSize: 12, textAlign: 'right', fontFamily: 'ui-monospace,monospace', color: cv >= 0 ? '#dc2626' : '#2563eb' }}>{cv.toFixed(2)}</td>
                          <td style={{ padding: '5px 14px', fontSize: 12, textAlign: 'right', fontFamily: 'ui-monospace,monospace', fontWeight: 600, color: '#1e293b' }}>{w1.toFixed(3)}</td>
                          <td style={{ padding: '5px 14px', fontSize: 12, textAlign: 'right', fontFamily: 'ui-monospace,monospace', fontWeight: 600, color: '#1e293b' }}>{w2.toFixed(3)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </DetailGroup>

                <DetailGroup title={t('std_ec1w_det_add_notes')}>
                  <ul style={{ fontSize: 12, color: '#374151', lineHeight: 1.75, margin: 0, paddingLeft: 18 }}>
                    <li>{t('std_ec1w_det_note_openings')}</li>
                    <li>{t('std_ec1w_det_char_note_unfactored')}</li>
                  </ul>
                </DetailGroup>
              </>
            )
          })()}
        </DetailsSection>
      </div>
    </div>
    </ResultsDetailsProvider>
  )
}
