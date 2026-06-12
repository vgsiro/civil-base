'use client'
import React from 'react'
import { TheoryBlock, NumInput, Table, TR, ResultRow, ResultsBox, DetailsSection, DetailGroup, CalcStep, InputDataTable, InputDataRow, Tex, TableRef , LabelTip, ResultsDetailsProvider, ResultsDetailsTabBar , Sub} from '@/app/(home)/standards/_lib/ui'
import { TH, TD, TDN, FORMULA_BOX, WIND_SECTION, INPUT_GRID, INPUT_STYLE, LABEL_STYLE, ZONE_PILL, WIND_IMG } from '../../../../../_lib/ui-styles'
import { calcPeakPressure, getCanopyMono, getCanopyDuo } from '../wind-helpers'
import { TERRAIN_CATS } from '../wind-types'
import { Table76, Table77, Table41 } from '../WindTables'
import { WindPrimaryInputs, WindSecondaryInputs, INPUT_DIVIDER } from '../WindShared'
import { useTranslation } from '@/app/i18n/LanguageContext'

interface CanopyMonoProps {
  vb: number; setVb: (v: number) => void
  cat: string; setCat: (v: string) => void
  cH: number; setCH: (v: number) => void
  c0: number; setC0: (v: number) => void
  rho: number; setRho: (v: number) => void
  canopyAlpha: number; setCanopyAlpha: (v: number) => void
  cD: number; setCD: (v: number) => void
  cB: number; setCB: (v: number) => void
  phi: number; setPhi: (v: number) => void
  cscd: number; setCscd: (v: number) => void
}

export function WindCanopyMono({ vb, setVb, cat, setCat, cH, setCH, c0, setC0, rho, setRho, canopyAlpha, setCanopyAlpha, cD, setCD, cB, setCB, phi, setPhi, cscd, setCscd }: CanopyMonoProps) {
  const { t } = useTranslation()
  const qpResult = calcPeakPressure(vb, cH, cat, c0, rho)
  const { kr, cr, vm, Iv, qp } = qpResult
  const cp = getCanopyMono(canopyAlpha, phi)
  const alphaRad = canopyAlpha * Math.PI / 180
  const dPrime = cD / Math.cos(alphaRad)
  const Aref = cB * dPrime
  const Fw_max = cscd * cp.cf_max * qp * Aref
  const Fw_min = cscd * cp.cf_min * qp * Aref
  return (
    <ResultsDetailsProvider>
    <div style={WIND_SECTION}>
      <ResultsDetailsTabBar />
      <TheoryBlock>
        <p><strong>EN 1991-1-4 §7.3</strong> — {t('std_ec1w_thy_wc_mono_p1').split('—').slice(1).join('—').trim()}</p>
        <p><strong>{t('std_ec1w_thy_wc_mono_phi').split(':')[0].trim()}</strong>: {t('std_ec1w_thy_wc_mono_phi').split(':').slice(1).join(':').trim()}</p>
        <img src={WIND_IMG.canopyBlock} alt="Canopy blockage factor" style={{ width: '100%', maxWidth: 340, borderRadius: 6, margin: '6px 0', display: 'block' }} />
        <p><strong>{t('std_ec1w_thy_wc_mono_cp').split(':')[0].trim()}</strong>: {t('std_ec1w_thy_wc_mono_cp').split(':').slice(1).join(':').trim()}</p>
        <img src={WIND_IMG.canopyMono} alt="Monopitch canopy pressure zones" style={{ width: '100%', maxWidth: 480, borderRadius: 6, margin: '6px 0', display: 'block' }} />
        <p><strong>{t('std_ec1w_thy_wc_mono_zones').split(':')[0].trim()}</strong>: {t('std_ec1w_thy_wc_mono_zones').split(':').slice(1).join(':').trim()}</p>
        <p><strong>{t('std_ec1w_thy_wc_mono_fw').split(':')[0].trim()}</strong>: {t('std_ec1w_thy_wc_mono_fw').split(':').slice(1).join(':').trim()}</p>
      </TheoryBlock>
      <div style={FORMULA_BOX}>
        <strong>EN 1991-1-4 §7.3 Table 7.6</strong> — Monopitch canopy (0°≤α≤30°).<br />
        φ = blockage (0=empty, 1=blocked) &nbsp;|&nbsp; F<sub>w</sub> = c<sub>s</sub>c<sub>d</sub>·c<sub>f</sub>·q<sub>p</sub>·A<sub>ref</sub>, A<sub>ref</sub> = b·d/cos(α)
      </div>
      <WindPrimaryInputs vb={vb} setVb={setVb} cat={cat} setCat={setCat} />
      <div style={INPUT_GRID}>
        <div>
          <LabelTip tip={t('std_ec1w_tip_wc_mono_h')}>h — {t('std_ec1w_det_cn_param_h')} (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={1} step={0.5} value={cH} onChange={setCH} />
        </div>
        <div>
          <LabelTip tip={t('std_ec1w_tip_wc_mono_alpha')}>α — {t('std_ec1w_det_cn_param_alpha')} (°)</LabelTip>
          <NumInput style={INPUT_STYLE} min={0} max={30} step={1} value={canopyAlpha} onChange={setCanopyAlpha} />
        </div>
        <div>
          <LabelTip tip={t('std_ec1w_tip_wc_mono_d')}>d — {t('std_ec1w_det_cn_param_d')} (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={1} step={0.5} value={cD} onChange={setCD} />
        </div>
        <div>
          <LabelTip tip={t('std_ec1w_tip_wc_mono_b')}>b — {t('std_ec1w_det_cn_param_b')} (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={1} step={0.5} value={cB} onChange={setCB} />
        </div>
        <div>
          <LabelTip tip={t('std_ec1w_tip_wc_mono_phi')}>φ — {t('std_ec1w_det_cn_param_phi')}</LabelTip>
          <NumInput style={INPUT_STYLE} min={0} max={1} step={0.1} value={phi} onChange={setPhi} />
        </div>
      </div>
      <hr style={INPUT_DIVIDER} />
      <div style={INPUT_GRID}>
        <div>
          <LabelTip tip={t('std_ec1w_tip_wc_mono_cscd')}>c<sub>s</sub>c<sub>d</sub> — {t('std_ec1w_det_lbl_struct_factor')}</LabelTip>
          <NumInput style={INPUT_STYLE} min={0.5} max={1.5} step={0.05} value={cscd} onChange={setCscd} />
        </div>
      </div>
      <WindSecondaryInputs c0={c0} setC0={setC0} rho={rho} setRho={setRho} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <img src={WIND_IMG.canopyMono} alt="Monopitch canopy wind pressure zones A, B, C" style={{ width: '100%', maxWidth: 560, borderRadius: 6, display: 'block' }} />
        <ResultsBox title={t('std_ui_tab_results')}>
          <ResultRow
            label={<>F<sub>w</sub> max — {t('std_ec1w_res_fw_max')}</>}
            value={Fw_max.toFixed(3)} unit="kN"
            onClick={() => document.getElementById('canym-details')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          />
          <ResultRow label={<>F<sub>w</sub> min — {t('std_ec1w_res_fw_min')}</>} value={Fw_min.toFixed(3)} unit="kN" />
          <div style={{ fontSize: 12, color: '#1e293b', margin: '4px 0 2px' }}>
            Overall force coefficient: c<sub>f</sub> = <span style={{ color: '#dc2626', fontWeight: 600 }}>{cp.cf_min.toFixed(3)}</span> or <span style={{ color: '#dc2626', fontWeight: 600 }}>+{cp.cf_max.toFixed(3)}</span>
            &nbsp;|&nbsp; {t('std_ec1w_det_cn_lbl_ecc')}: e = 0.25·d' = <strong>{(0.25 * dPrime).toFixed(3)} m</strong> from windward edge
          </div>
          <Table>
            <thead><tr>
              <th style={TH}>Zone</th><th style={TH}>c<sub>p,net</sub> max</th><th style={TH}>c<sub>p,net</sub> min</th>
              <th style={TH}>w max (kPa)</th><th style={TH}>w min (kPa)</th>
            </tr></thead>
            <tbody>{(['A', 'B', 'C'] as const).map((zone, i) => {
              const mx = (cp as any)[`cp${zone}_max`] as number
              const mn = (cp as any)[`cp${zone}_min`] as number
              return (
                <TR key={zone} stripe={i % 2 !== 0}>
                  <td style={{ ...TD, fontWeight: 700 }}><span style={{ ...ZONE_PILL, background: '#dbeafe', color: '#1d4ed8' }}>{zone}</span></td>
                  <td style={{ ...TDN, color: '#dc2626' }}>{mx.toFixed(2)}</td>
                  <td style={{ ...TDN, color: '#2563eb' }}>{mn.toFixed(2)}</td>
                  <td style={{ ...TDN, color: '#dc2626' }}>+{(qp * mx).toFixed(3)}</td>
                  <td style={{ ...TDN, color: '#2563eb' }}>{(qp * mn).toFixed(3)}</td>
                </TR>
              )
            })}</tbody>
          </Table>
          <div style={{ fontSize: 11, color: '#1e293b', marginTop: 6, lineHeight: 1.6 }}>
            Zone A — central region (&gt; d'/10 = {(dPrime/10).toFixed(2)} m from windward/leeward edges and &gt; b/10 = {(cB/10).toFixed(2)} m from side edges)<br/>
            Zone B — side edge strips (≤ b/10 = {(cB/10).toFixed(2)} m from side edges)<br/>
            Zone C — windward/leeward edge strips (≤ d'/10 = {(dPrime/10).toFixed(2)} m from windward/leeward edges)
          </div>
        </ResultsBox>

        <DetailsSection id="canym-details">
          {(() => {
            const P: React.CSSProperties = { fontSize: 12, color: '#374151', lineHeight: 1.75, margin: '6px 0 10px' }
            const catData = TERRAIN_CATS.find(c => c.id === cat)!
            const z0 = catData.z0
            const zmin = catData.zmin
            const qb = 0.5 * rho * vb * vb / 1000
            const ecc = 0.25 * dPrime
            return (<>
              <p style={{ fontSize: 11, color: '#1e293b', marginBottom: 10 }}>
                <strong>According to:</strong> EN 1991-1-4:2005+A1:2010 §7.3 and Table 7.6
              </p>

              <DetailGroup title={t('std_ec1w_det_input_data')}>
                <InputDataTable>
                  <InputDataRow param={<>{t('std_ec1w_det_param_cat')} — <TableRef label="Table 4.1" renderTable={() => <Table41 />} /></>} symbol={<Tex>{'\\text{Cat.}'}</Tex>} value={`Cat. ${cat} — z₀=${z0} m, zmin=${zmin} m`} />
                  <InputDataRow param={t('std_ec1w_det_lbl_basic_vb')} symbol={<Tex>{'v_b'}</Tex>} value={vb.toFixed(2)} unit="m/s" />
                  <InputDataRow param={t('std_ec1w_det_param_c0_short')} symbol={<Tex>{'c_0(z_e)'}</Tex>} value={c0.toFixed(2)} />
                  <InputDataRow param={t('std_ec1w_det_param_rho_short')} symbol={<Tex>{'\\rho'}</Tex>} value={rho.toFixed(2)} unit="kg/m³" />
                  <InputDataRow param={t('std_ec1w_det_cn_param_h')} symbol={<Tex>{'h'}</Tex>} value={cH.toFixed(2)} unit="m" />
                  <InputDataRow param={t('std_ec1w_det_cn_param_d')} symbol={<Tex>{'d'}</Tex>} value={cD.toFixed(2)} unit="m" />
                  <InputDataRow param={t('std_ec1w_det_cn_param_b')} symbol={<Tex>{'b'}</Tex>} value={cB.toFixed(2)} unit="m" />
                  <InputDataRow param={<>{t('std_ec1w_det_cn_param_alpha')} — <TableRef label="Table 7.6" renderTable={() => <Table76 />} note="— monopitch canopy cf and cp,net" /></>} symbol={<Tex>{'\\alpha'}</Tex>} value={`${canopyAlpha}°`} />
                  <InputDataRow param={t('std_ec1w_det_cn_param_phi')} symbol={<Tex>{'\\varphi'}</Tex>} value={phi.toFixed(2)} />
                  <InputDataRow param={t('std_ec1w_det_lbl_struct_factor')} symbol={<Tex>{'c_s c_d'}</Tex>} value={cscd.toFixed(2)} />
                  <InputDataRow param={t('std_ec1w_det_cn_lbl_ecc')} symbol={<Tex>{"e/d'"}</Tex>} value="0.25" />
                </InputDataTable>
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_ref_height')}>
                <p style={P}><Sub>{t('std_ec1w_det_ref_height_prose_roof')}</Sub></p>
                <CalcStep
                  label={<>{t('std_ec1w_det_lbl_ref_height')} <Tex>{'z_e'}</Tex> (EN 1991-1-4 §7.3(8))</>}
                  formula={`z_e = h = ${cH.toFixed(3)}\\ \\mathrm{m}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_cn_ref_area_title')}>
                <p style={P}><Sub>{t('std_ec1w_det_cn_ref_area_prose')}</Sub></p>
                <CalcStep
                  label={<>{t('std_ec1w_det_cn_lbl_inclined_d')} <Tex>{"d'"}</Tex></>}
                  formula={`d' = \\frac{d}{\\cos\\alpha} = \\frac{${cD.toFixed(3)}\\ \\mathrm{m}}{\\cos(${canopyAlpha}°)} = \\frac{${cD.toFixed(3)}}{${Math.cos(alphaRad).toFixed(4)}} = ${dPrime.toFixed(3)}\\ \\mathrm{m}`}
                  result={<></>}
                />
                <CalcStep
                  label={<>{t('std_ec1w_det_lbl_ref_area')} <Tex>{'A_{\\mathrm{ref}}'}</Tex></>}
                  formula={`A_{\\mathrm{ref}} = b \\cdot \\frac{d}{\\cos\\alpha} = ${cB.toFixed(3)}\\ \\mathrm{m} \\cdot ${dPrime.toFixed(3)}\\ \\mathrm{m} = ${Aref.toFixed(3)}\\ \\mathrm{m^2}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_basic_vb')}>
                <p style={P}><Sub>{t('std_ec1w_det_vb_prose')}</Sub></p>
                <CalcStep label={t('std_ec1w_det_lbl_basic_vb')} formula={`v_b = ${vb.toFixed(2)}\\ \\mathrm{m/s}`} result={<></>} />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_terrain_roughness')}>
                <p style={P}>
                  <Sub>{t('std_ec1w_det_z0_prose_pre')}</Sub> <strong>{cat}</strong> <Sub>{t('std_ec1w_det_z0_prose_post')}</Sub> z<sub>0</sub> = {z0} m, z<sub>min</sub> = {zmin} m.
                </p>
                <p style={P}><Sub>{t('std_ec1w_det_kr_prose_pre')}</Sub> {z0} <Sub>{t('std_ec1w_det_kr_prose_post')}</Sub></p>
                <CalcStep
                  label={<>{t('std_ec1w_det_lbl_terrain_factor')} <Tex>{'k_r'}</Tex> (EN 1991-1-4 §4.5 Eq. 4.5)</>}
                  formula={`k_r = 0.19 \\cdot \\left(\\dfrac{z_0}{z_{0,\\mathrm{II}}}\\right)^{0.07} = 0.19 \\cdot \\left(\\dfrac{${z0}\\ \\mathrm{m}}{0.050\\ \\mathrm{m}}\\right)^{0.07} = ${kr.toFixed(4)}`}
                  result={<></>}
                />
                <p style={P}>
                  <Sub>{t('std_ec1w_det_cr_prose_pre')}</Sub> {cH.toFixed(3)} m {cH >= zmin ? '≥' : '<'} <Sub>{t('std_ec1w_det_cr_prose_post')}</Sub>
                </p>
                <CalcStep
                  label={<>{t('std_ec1w_det_lbl_roughness_factor')} <Tex>{'c_r(z_e)'}</Tex> (EN 1991-1-4 §4.5 Eq. 4.4)</>}
                  formula={`c_r(z_e) = k_r \\cdot \\ln\\!\\left(\\frac{\\max(z_e,\\,z_{\\min})}{z_0}\\right) = ${kr.toFixed(4)} \\cdot \\ln\\!\\left(\\frac{\\max(${cH.toFixed(3)}\\ \\mathrm{m},\\,${zmin}\\ \\mathrm{m})}{${z0}\\ \\mathrm{m}}\\right) = ${cr.toFixed(4)}`}
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
                  <Sub>{t('std_ec1w_det_iv_prose_pre')}</Sub> {cH >= zmin ? '≥' : '<'} <Sub>{t('std_ec1w_det_cr_prose_post')}</Sub>
                </p>
                <CalcStep
                  label={<>{t('std_ec1w_res_iv')} <Tex>{'I_v(z_e)'}</Tex> (EN 1991-1-4 §4.4 Eq. 4.7)</>}
                  formula={`I_v(z_e) = \\frac{k_I}{c_0(z_e) \\cdot \\ln\\!\\left(\\dfrac{\\max(z_e,\\,z_{\\min})}{z_0}\\right)} = \\frac{1.000}{${c0.toFixed(3)} \\cdot \\ln\\!\\left(\\dfrac{\\max(${cH.toFixed(3)}\\ \\mathrm{m},\\,${zmin}\\ \\mathrm{m})}{${z0}\\ \\mathrm{m}}\\right)} = ${Iv.toFixed(4)}`}
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

              <DetailGroup title={t('std_ec1w_det_cn_net_cp_title')}>
                <p style={P}>
                  The net pressure coefficients c<sub>p,net</sub> represent the maximum local pressure for all wind directions and they should be used in the design of local elements such as roofing elements and fixings. Net pressure coefficients are given for three zones A, B, C as defined in EN 1991-1-4 Table 7.6. Zone C corresponds to the regions parallel to the windward and leeward edges having width d'/10. Zone B corresponds to the regions parallel to the side edges having width b/10. Zone A corresponds to the remaining central region.
                </p>
                <CalcStep
                  label={<>{t('std_ec1w_det_cn_lbl_inclined_d')} <Tex>{"d'"}</Tex> — zone C width</>}
                  formula={`\\frac{d'}{10} = \\frac{${dPrime.toFixed(3)}\\ \\mathrm{m}}{10} = ${(dPrime/10).toFixed(3)}\\ \\mathrm{m}`}
                  result={<></>}
                />
                <CalcStep
                  label={<>{t('std_ec1w_det_cn_lbl_zone_b_width')}</>}
                  formula={`\\frac{b}{10} = \\frac{${cB.toFixed(3)}\\ \\mathrm{m}}{10} = ${(cB/10).toFixed(3)}\\ \\mathrm{m}`}
                  result={<></>}
                />
                <p style={P}>
                  For α = {canopyAlpha.toFixed(2)}° and φ = {phi.toFixed(3)}, from EN 1991-1-4 Table 7.6:
                </p>
                {(['A', 'B', 'C'] as const).map(zone => {
                  const mx = (cp as any)[`cp${zone}_max`] as number
                  const mn = (cp as any)[`cp${zone}_min`] as number
                  return (
                    <CalcStep key={zone}
                      label={<>Zone {zone}</>}
                      formula={`c_{p,\\mathrm{net},\\text{Zone ${zone}}} = ${mn.toFixed(3)}\\text{ (uplift) or }+${mx.toFixed(3)}\\text{ (downward)}`}
                      result={<></>}
                    />
                  )
                })}
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_cn_net_press_title')}>
                <p style={P}>
                  The net wind pressure w<sub>net</sub> = c<sub>p,net</sub> · q<sub>p</sub>(z<sub>e</sub>) for each zone:
                </p>
                <CalcStep label="" formula={`w_{\\mathrm{net}} = c_{p,\\mathrm{net}} \\cdot q_p(z_e)`} result={<></>} />
                {(['A', 'B', 'C'] as const).map(zone => {
                  const mx = (cp as any)[`cp${zone}_max`] as number
                  const mn = (cp as any)[`cp${zone}_min`] as number
                  return (
                    <CalcStep key={zone}
                      label={<>Zone {zone}</>}
                      formula={`\\begin{aligned}
w_{\\mathrm{net},\\min} &= ${mn.toFixed(3)} \\cdot ${qp.toFixed(4)} = ${(qp*mn).toFixed(4)}\\ \\mathrm{kN/m^2} \\\\
w_{\\mathrm{net},\\max} &= +${mx.toFixed(3)} \\cdot ${qp.toFixed(4)} = +${(qp*mx).toFixed(4)}\\ \\mathrm{kN/m^2}
\\end{aligned}`}
                      result={<></>}
                    />
                  )
                })}
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_cn_overall_cp_title')}>
                <p style={P}>
                  The overall pressure coefficient c<sub>f</sub> for global design, from EN 1991-1-4 Table 7.6 at α = {canopyAlpha.toFixed(2)}° and φ = {phi.toFixed(3)}:
                </p>
                <CalcStep
                  label={<>{t('std_ec1w_det_cn_lbl_cf')} <Tex>{'c_f'}</Tex> (Table 7.6)</>}
                  formula={`c_f = ${cp.cf_min.toFixed(3)}\\text{ (uplift) or }+${cp.cf_max.toFixed(3)}\\text{ (downward)}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_struct_factor')}>
                <p style={P}><Sub>{t('std_ec1w_det_struct_factor_prose')}</Sub></p>
                <CalcStep
                  label={<>{t('std_ec1w_det_lbl_struct_factor')} <Tex>{'c_s c_d'}</Tex></>}
                  formula={`c_s c_d = ${cscd.toFixed(3)}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_cn_overall_force_title')}>
                <p style={P}>
                  F<sub>w</sub> = c<sub>s</sub>c<sub>d</sub> · c<sub>f</sub> · A<sub>ref</sub> · q<sub>p</sub>(z<sub>e</sub>), where A<sub>ref</sub> = {Aref.toFixed(3)} m²:
                </p>
                <CalcStep label="" formula={`F_w = c_s c_d \\cdot c_f \\cdot A_{\\mathrm{ref}} \\cdot q_p(z_e)`} result={<></>} />
                <CalcStep
                  label={<><Tex>{'F_{w,\\max}'}</Tex> — {t('std_ec1w_det_cn_lbl_fw_max')}</>}
                  formula={`F_{w,\\max} = ${cscd.toFixed(3)} \\cdot (+${cp.cf_max.toFixed(3)}) \\cdot ${Aref.toFixed(3)}\\ \\mathrm{m^2} \\cdot ${qp.toFixed(4)}\\ \\mathrm{kN/m^2} = +${Fw_max.toFixed(3)}\\ \\mathrm{kN}`}
                  result={<></>}
                />
                <CalcStep
                  label={<><Tex>{'F_{w,\\min}'}</Tex> — {t('std_ec1w_det_cn_lbl_fw_min')}</>}
                  formula={`F_{w,\\min} = ${cscd.toFixed(3)} \\cdot (${cp.cf_min.toFixed(3)}) \\cdot ${Aref.toFixed(3)}\\ \\mathrm{m^2} \\cdot ${qp.toFixed(4)}\\ \\mathrm{kN/m^2} = ${Fw_min.toFixed(3)}\\ \\mathrm{kN}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_cn_ecc_title')}>
                <p style={P}><Sub>{t('std_ec1w_det_sg_eccentricity_prose')}</Sub></p>
                <CalcStep
                  label={<>{t('std_ec1w_det_cn_lbl_ecc')} <Tex>{"e = 0.25 \\cdot d'"}</Tex></>}
                  formula={`e = 0.25 \\cdot d' = 0.25 \\cdot ${dPrime.toFixed(3)}\\ \\mathrm{m} = ${ecc.toFixed(3)}\\ \\mathrm{m}\\text{ from windward edge}`}
                  result={<></>}
                />
                <p style={P}>
                  F<sub>w,max</sub> = +{Fw_max.toFixed(3)} kN (downward) at e = {ecc.toFixed(3)} m from windward edge.<br />
                  F<sub>w,min</sub> = {Fw_min.toFixed(3)} kN (uplift) at e = {ecc.toFixed(3)} m from windward edge.
                </p>
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_add_notes')}>
                <ul style={{ fontSize: 12, color: '#374151', lineHeight: 1.75, margin: 0, paddingLeft: 18 }}>
                  <li>{t('std_ec1w_det_note_friction')}</li>
                  <li>{t('std_ec1w_det_cn_note_walls_mono')}</li>
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

interface CanopyDuoProps {
  vb: number; setVb: (v: number) => void
  cat: string; setCat: (v: string) => void
  cH: number; setCH: (v: number) => void
  c0: number; setC0: (v: number) => void
  rho: number; setRho: (v: number) => void
  canopyAlpha: number; setCanopyAlpha: (v: number) => void
  cD: number; setCD: (v: number) => void
  cB: number; setCB: (v: number) => void
  phi: number; setPhi: (v: number) => void
  cscd: number; setCscd: (v: number) => void
}

export function WindCanopyDuo({ vb, setVb, cat, setCat, cH, setCH, c0, setC0, rho, setRho, canopyAlpha, setCanopyAlpha, cD, setCD, cB, setCB, phi, setPhi, cscd, setCscd }: CanopyDuoProps) {
  const { t } = useTranslation()
  const qpResult = calcPeakPressure(vb, cH, cat, c0, rho)
  const { kr, cr, vm, Iv, qp } = qpResult
  const cp = getCanopyDuo(canopyAlpha, phi)
  const alphaRad = Math.abs(canopyAlpha) * Math.PI / 180
  const dPrime = cD / Math.cos(alphaRad)
  const Aref = cB * (cD / 2) / Math.cos(alphaRad)
  const Fw_max = cscd * cp.cf_max * qp * Aref
  const Fw_min = cscd * cp.cf_min * qp * Aref
  return (
    <ResultsDetailsProvider>
    <div style={WIND_SECTION}>
      <ResultsDetailsTabBar />
      <TheoryBlock>
        <p><strong>EN 1991-1-4 §7.3</strong> — {t('std_ec1w_thy_wc_duo_p1').split('—').slice(1).join('—').trim()}</p>
        <p><strong>{t('std_ec1w_thy_wc_duo_phi').split(':')[0].trim()}</strong>: {t('std_ec1w_thy_wc_duo_phi').split(':').slice(1).join(':').trim()}</p>
        <img src={WIND_IMG.canopyBlock} alt="Canopy blockage factor" style={{ width: '100%', maxWidth: 340, borderRadius: 6, margin: '6px 0', display: 'block' }} />
        <p><strong>{t('std_ec1w_thy_wc_duo_zones').split(':')[0].trim()}</strong>: {t('std_ec1w_thy_wc_duo_zones').split(':').slice(1).join(':').trim()}</p>
        <p><strong>{t('std_ec1w_thy_wc_duo_aref').split(':')[0].trim()}</strong>: {t('std_ec1w_thy_wc_duo_aref').split(':').slice(1).join(':').trim()}</p>
      </TheoryBlock>
      <div style={FORMULA_BOX}>
        <strong>EN 1991-1-4 §7.3 Table 7.7</strong> — Duopitch canopy (−20°≤α≤30°).<br />
        φ = blockage (0=empty, 1=blocked) &nbsp;|&nbsp; F<sub>w</sub> = c<sub>s</sub>c<sub>d</sub>·c<sub>f</sub>·q<sub>p</sub>·A<sub>ref</sub> (per sloped face), A<sub>ref</sub> = b·(d/2)/cos(α)
      </div>
      <WindPrimaryInputs vb={vb} setVb={setVb} cat={cat} setCat={setCat} />
      <div style={INPUT_GRID}>
        <div>
          <LabelTip tip={t('std_ec1w_tip_wc_duo_h')}>h — {t('std_ec1w_det_cn_param_h')} (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={1} step={0.5} value={cH} onChange={setCH} />
        </div>
        <div>
          <LabelTip tip={t('std_ec1w_tip_wc_duo_alpha')}>α — {t('std_ec1w_det_cn_param_alpha')} (°, −20 to +30)</LabelTip>
          <NumInput style={INPUT_STYLE} min={-20} max={30} step={1} value={canopyAlpha} onChange={setCanopyAlpha} />
        </div>
        <div>
          <LabelTip tip={t('std_ec1w_tip_wc_duo_d')}>d — {t('std_ec1w_det_cn_param_d')} (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={1} step={0.5} value={cD} onChange={setCD} />
        </div>
        <div>
          <LabelTip tip={t('std_ec1w_tip_wc_duo_b')}>b — {t('std_ec1w_det_cn_param_b')} (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={1} step={0.5} value={cB} onChange={setCB} />
        </div>
        <div>
          <LabelTip tip={t('std_ec1w_tip_wc_duo_phi')}>φ — {t('std_ec1w_det_cn_param_phi')}</LabelTip>
          <NumInput style={INPUT_STYLE} min={0} max={1} step={0.1} value={phi} onChange={setPhi} />
        </div>
      </div>
      <hr style={INPUT_DIVIDER} />
      <div style={INPUT_GRID}>
        <div>
          <LabelTip tip={t('std_ec1w_tip_wc_duo_cscd')}>c<sub>s</sub>c<sub>d</sub> — {t('std_ec1w_det_lbl_struct_factor')}</LabelTip>
          <NumInput style={INPUT_STYLE} min={0.5} max={1.5} step={0.05} value={cscd} onChange={setCscd} />
        </div>
      </div>
      <WindSecondaryInputs c0={c0} setC0={setC0} rho={rho} setRho={setRho} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <img src={WIND_IMG.canopyDuo} alt="Duopitch canopy wind pressure zones A, B, C, D" style={{ width: '100%', maxWidth: 560, borderRadius: 6, display: 'block' }} />
        <ResultsBox title={t('std_ui_tab_results')}>
          <ResultRow label={<>F<sub>w</sub> max — {t('std_ec1w_res_fw_max_per_face')}</>} value={Fw_max.toFixed(3)} unit="kN" onClick={() => document.getElementById('canyd-details')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
          <ResultRow label={<>F<sub>w</sub> min — {t('std_ec1w_res_fw_min_per_face')}</>} value={Fw_min.toFixed(3)} unit="kN" />
          <div style={{ fontSize: 12, color: '#1e293b', margin: '4px 0 2px' }}>
            Overall force coefficient: c<sub>f</sub> = <span style={{ color: '#dc2626', fontWeight: 600 }}>{cp.cf_min.toFixed(3)}</span> or <span style={{ color: '#dc2626', fontWeight: 600 }}>+{cp.cf_max.toFixed(3)}</span>
          </div>
          <Table>
            <thead><tr>
              <th style={TH}>Zone</th><th style={TH}>c<sub>p,net</sub> max</th><th style={TH}>c<sub>p,net</sub> min</th>
              <th style={TH}>w max (kPa)</th><th style={TH}>w min (kPa)</th>
            </tr></thead>
            <tbody>{(['A', 'B', 'C', 'D'] as const).map((zone, i) => {
              const mx = (cp as any)[`cp${zone}_max`] as number
              const mn = (cp as any)[`cp${zone}_min`] as number
              return (
                <TR key={zone} stripe={i % 2 !== 0}>
                  <td style={{ ...TD, fontWeight: 700 }}><span style={{ ...ZONE_PILL, background: '#dbeafe', color: '#1d4ed8' }}>{zone}</span></td>
                  <td style={{ ...TDN, color: '#dc2626' }}>{mx.toFixed(2)}</td>
                  <td style={{ ...TDN, color: '#2563eb' }}>{mn.toFixed(2)}</td>
                  <td style={{ ...TDN, color: '#dc2626' }}>+{(qp * mx).toFixed(3)}</td>
                  <td style={{ ...TDN, color: '#2563eb' }}>{(qp * mn).toFixed(3)}</td>
                </TR>
              )
            })}</tbody>
          </Table>
          <div style={{ fontSize: 11, color: '#1e293b', marginTop: 6, lineHeight: 1.6 }}>
            Zone A — remaining central region of each sloped face<br/>
            Zone B — side edge strips ≤ b/10 = {(cB/10).toFixed(2)} m<br/>
            Zone C — windward/leeward edge strips ≤ d'/10 = {(dPrime/10).toFixed(2)} m<br/>
            Zone D — ridge strips ≤ ±d'/10 = {(dPrime/10).toFixed(2)} m from ridge
          </div>
        </ResultsBox>
        <DetailsSection id="canyd-details">
          {(() => {
            const P: React.CSSProperties = { fontSize: 12, color: '#374151', lineHeight: 1.75, margin: '6px 0 10px' }
            const catData = TERRAIN_CATS.find(c => c.id === cat)!
            const z0 = catData.z0
            const zmin = catData.zmin
            const qb = 0.5 * rho * vb * vb / 1000
            return (<>
              <p style={{ fontSize: 11, color: '#1e293b', marginBottom: 10 }}>
                <strong>According to:</strong> EN 1991-1-4:2005+A1:2010 §7.3 and Table 7.7
              </p>

              <DetailGroup title={t('std_ec1w_det_input_data')}>
                <InputDataTable>
                  <InputDataRow param={<>{t('std_ec1w_det_param_cat')} — <TableRef label="Table 4.1" renderTable={() => <Table41 />} /></>} symbol={<Tex>{'\\text{Cat.}'}</Tex>} value={`Cat. ${cat} — z₀=${z0} m, zmin=${zmin} m`} />
                  <InputDataRow param={t('std_ec1w_det_lbl_basic_vb')} symbol={<Tex>{'v_b'}</Tex>} value={vb.toFixed(2)} unit="m/s" />
                  <InputDataRow param={t('std_ec1w_det_param_c0_short')} symbol={<Tex>{'c_0(z_e)'}</Tex>} value={c0.toFixed(2)} />
                  <InputDataRow param={t('std_ec1w_det_param_rho_short')} symbol={<Tex>{'\\rho'}</Tex>} value={rho.toFixed(2)} unit="kg/m³" />
                  <InputDataRow param={t('std_ec1w_det_cn_param_h')} symbol={<Tex>{'h'}</Tex>} value={cH.toFixed(2)} unit="m" />
                  <InputDataRow param={t('std_ec1w_det_cn_param_d')} symbol={<Tex>{'d'}</Tex>} value={cD.toFixed(2)} unit="m" />
                  <InputDataRow param={t('std_ec1w_det_cn_param_b')} symbol={<Tex>{'b'}</Tex>} value={cB.toFixed(2)} unit="m" />
                  <InputDataRow param={<>{t('std_ec1w_det_cn_param_alpha')} — <TableRef label="Table 7.7" renderTable={() => <Table77 />} note="— duopitch canopy cf and cp,net" /></>} symbol={<Tex>{'\\alpha'}</Tex>} value={`${canopyAlpha}°`} />
                  <InputDataRow param={t('std_ec1w_det_cn_param_phi')} symbol={<Tex>{'\\varphi'}</Tex>} value={phi.toFixed(2)} />
                  <InputDataRow param={t('std_ec1w_det_lbl_struct_factor')} symbol={<Tex>{'c_s c_d'}</Tex>} value={cscd.toFixed(2)} />
                </InputDataTable>
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_ref_height')}>
                <p style={P}><Sub>{t('std_ec1w_det_ref_height_prose_roof')}</Sub></p>
                <CalcStep
                  label={<>{t('std_ec1w_det_lbl_ref_height')} <Tex>{'z_e'}</Tex> (EN 1991-1-4 §7.3(8))</>}
                  formula={`z_e = h = ${cH.toFixed(3)}\\ \\mathrm{m}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_cn_duo_ref_area_title')}>
                <p style={P}><Sub>{t('std_ec1w_det_cn_duo_ref_area_prose')}</Sub></p>
                <CalcStep
                  label={<>{t('std_ec1w_det_cn_lbl_inclined_d')} <Tex>{"d'"}</Tex></>}
                  formula={`d' = \\frac{d}{\\cos|\\alpha|} = \\frac{${cD.toFixed(3)}\\ \\mathrm{m}}{${Math.cos(alphaRad).toFixed(4)}} = ${dPrime.toFixed(3)}\\ \\mathrm{m}`}
                  result={<></>}
                />
                <CalcStep
                  label={<>{t('std_ec1w_det_lbl_ref_area')} per sloped face <Tex>{'A_{\\mathrm{ref}}'}</Tex></>}
                  formula={`A_{\\mathrm{ref}} = b \\cdot \\frac{d/2}{\\cos|\\alpha|} = ${cB.toFixed(3)}\\ \\mathrm{m} \\cdot \\frac{${(cD/2).toFixed(3)}\\ \\mathrm{m}}{${Math.cos(alphaRad).toFixed(4)}} = ${Aref.toFixed(3)}\\ \\mathrm{m^2}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_basic_vb')}>
                <p style={P}><Sub>{t('std_ec1w_det_vb_prose')}</Sub></p>
                <CalcStep label={t('std_ec1w_det_lbl_basic_vb')} formula={`v_b = ${vb.toFixed(2)}\\ \\mathrm{m/s}`} result={<></>} />
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
                  <Sub>{t('std_ec1w_det_cr_prose_pre')}</Sub> {cH.toFixed(3)} m {cH >= zmin ? '≥' : '<'} <Sub>{t('std_ec1w_det_cr_prose_post')}</Sub>
                </p>
                <CalcStep
                  label={<>{t('std_ec1w_det_lbl_roughness_factor')} <Tex>{'c_r(z_e)'}</Tex> (EN 1991-1-4 §4.5 Eq. 4.4)</>}
                  formula={`c_r(z_e) = k_r \\cdot \\ln\\!\\left(\\frac{\\max(z_e,\\,z_{\\min})}{z_0}\\right) = ${kr.toFixed(4)} \\cdot \\ln\\!\\left(\\frac{\\max(${cH.toFixed(3)}\\ \\mathrm{m},\\,${zmin}\\ \\mathrm{m})}{${z0}\\ \\mathrm{m}}\\right) = ${cr.toFixed(4)}`}
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
                  <Sub>{t('std_ec1w_det_iv_prose_pre')}</Sub> {cH >= zmin ? '≥' : '<'} <Sub>{t('std_ec1w_det_cr_prose_post')}</Sub>
                </p>
                <CalcStep
                  label={<>{t('std_ec1w_res_iv')} <Tex>{'I_v(z_e)'}</Tex> (EN 1991-1-4 §4.4 Eq. 4.7)</>}
                  formula={`I_v(z_e) = \\frac{k_I}{c_0(z_e) \\cdot \\ln\\!\\left(\\dfrac{\\max(z_e,\\,z_{\\min})}{z_0}\\right)} = \\frac{1.000}{${c0.toFixed(3)} \\cdot \\ln\\!\\left(\\dfrac{\\max(${cH.toFixed(3)}\\ \\mathrm{m},\\,${zmin}\\ \\mathrm{m})}{${z0}\\ \\mathrm{m}}\\right)} = ${Iv.toFixed(4)}`}
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

              <DetailGroup title={t('std_ec1w_det_cn_net_cp_title')}>
                <p style={P}>
                  Net pressure coefficients c<sub>p,net</sub> for zones A, B, C, D from EN 1991-1-4 Table 7.7. d' = {dPrime.toFixed(3)} m (inclined total depth). Zone C width = d'/10 = {(dPrime/10).toFixed(3)} m. Zone B width = b/10 = {(cB/10).toFixed(3)} m. Zone D extends ±d'/10 from ridge.
                </p>
                <p style={P}>
                  For α = {canopyAlpha.toFixed(2)}° and φ = {phi.toFixed(3)}, with linear interpolation where appropriate:
                </p>
                {(['A', 'B', 'C', 'D'] as const).map(zone => {
                  const mx = (cp as any)[`cp${zone}_max`] as number
                  const mn = (cp as any)[`cp${zone}_min`] as number
                  return (
                    <CalcStep key={zone}
                      label={<>Zone {zone}</>}
                      formula={`c_{p,\\mathrm{net},\\text{Zone ${zone}}} = ${mn.toFixed(3)}\\text{ (uplift) or }+${mx.toFixed(3)}\\text{ (downward)}`}
                      result={<></>}
                    />
                  )
                })}
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_cn_net_press_title')}>
                <CalcStep label="" formula={`w_{\\mathrm{net}} = c_{p,\\mathrm{net}} \\cdot q_p(z_e)`} result={<></>} />
                {(['A', 'B', 'C', 'D'] as const).map(zone => {
                  const mx = (cp as any)[`cp${zone}_max`] as number
                  const mn = (cp as any)[`cp${zone}_min`] as number
                  return (
                    <CalcStep key={zone}
                      label={<>Zone {zone}</>}
                      formula={`\\begin{aligned}
w_{\\mathrm{net},\\min} &= ${mn.toFixed(3)} \\cdot ${qp.toFixed(4)} = ${(qp*mn).toFixed(4)}\\ \\mathrm{kN/m^2} \\\\
w_{\\mathrm{net},\\max} &= +${mx.toFixed(3)} \\cdot ${qp.toFixed(4)} = +${(qp*mx).toFixed(4)}\\ \\mathrm{kN/m^2}
\\end{aligned}`}
                      result={<></>}
                    />
                  )
                })}
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_cn_overall_cp_title')}>
                <p style={P}>
                  Overall force coefficient c<sub>f</sub> from EN 1991-1-4 Table 7.7 at α = {canopyAlpha.toFixed(2)}° and φ = {phi.toFixed(3)}:
                </p>
                <CalcStep
                  label={<>{t('std_ec1w_det_cn_lbl_cf')} <Tex>{'c_f'}</Tex> (Table 7.7)</>}
                  formula={`c_f = ${cp.cf_min.toFixed(3)}\\text{ (uplift) or }+${cp.cf_max.toFixed(3)}\\text{ (downward)}`}
                  result={<></>}
                  note="Negative values correspond to suction directed away from the upper surface inducing uplift. Both values should be considered."
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_struct_factor')}>
                <p style={P}><Sub>{t('std_ec1w_det_struct_factor_prose')}</Sub></p>
                <CalcStep
                  label={<>{t('std_ec1w_det_lbl_struct_factor')} <Tex>{'c_s c_d'}</Tex></>}
                  formula={`c_s c_d = ${cscd.toFixed(3)}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_cn_duo_force_title')}>
                <p style={P}>
                  F<sub>w</sub> = c<sub>s</sub>c<sub>d</sub> · c<sub>f</sub> · A<sub>ref</sub> · q<sub>p</sub>(z<sub>e</sub>), A<sub>ref</sub> = {Aref.toFixed(3)} m² per sloped face:
                </p>
                <CalcStep label="" formula={`F_w = c_s c_d \\cdot c_f \\cdot A_{\\mathrm{ref}} \\cdot q_p(z_e)`} result={<></>} />
                <CalcStep
                  label={<><Tex>{'F_{w,\\max}'}</Tex> — {t('std_ec1w_det_cn_lbl_fw_max')} (per sloped face)</>}
                  formula={`F_{w,\\max} = ${cscd.toFixed(3)} \\cdot (+${cp.cf_max.toFixed(3)}) \\cdot ${Aref.toFixed(3)}\\ \\mathrm{m^2} \\cdot ${qp.toFixed(4)}\\ \\mathrm{kN/m^2} = +${Fw_max.toFixed(3)}\\ \\mathrm{kN}`}
                  result={<></>}
                />
                <CalcStep
                  label={<><Tex>{'F_{w,\\min}'}</Tex> — {t('std_ec1w_det_cn_lbl_fw_min')} (per sloped face)</>}
                  formula={`F_{w,\\min} = ${cscd.toFixed(3)} \\cdot (${cp.cf_min.toFixed(3)}) \\cdot ${Aref.toFixed(3)}\\ \\mathrm{m^2} \\cdot ${qp.toFixed(4)}\\ \\mathrm{kN/m^2} = ${Fw_min.toFixed(3)}\\ \\mathrm{kN}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_cn_ecc_title')}>
                <p style={P}>
                  According to EN 1991-1-4 §7.3(6) Figure 7.17, the centre of pressure is at the centre of each sloped face. Six load cases should be examined:
                </p>
                <p style={{ ...P, paddingLeft: 12, borderLeft: '3px solid #e5e7eb' }}>
                  1. F<sub>w,max</sub> = +{Fw_max.toFixed(3)} kN (downward) on both sloped faces<br />
                  2. F<sub>w,max</sub> = +{Fw_max.toFixed(3)} kN (downward) at upwind face only<br />
                  3. F<sub>w,max</sub> = +{Fw_max.toFixed(3)} kN (downward) at downwind face only<br />
                  4. F<sub>w,min</sub> = {Fw_min.toFixed(3)} kN (uplift) on both sloped faces<br />
                  5. F<sub>w,min</sub> = {Fw_min.toFixed(3)} kN (uplift) at upwind face only<br />
                  6. F<sub>w,min</sub> = {Fw_min.toFixed(3)} kN (uplift) at downwind face only
                </p>
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_add_notes')}>
                <ul style={{ fontSize: 12, color: '#374151', lineHeight: 1.75, margin: 0, paddingLeft: 18 }}>
                  <li>{t('std_ec1w_det_note_friction')}</li>
                  <li>{t('std_ec1w_det_cn_note_walls_duo')}</li>
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
