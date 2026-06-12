'use client'
import React, { useState } from 'react'
import { TheoryBlock, NumInput, Table, TR, ResultRow, ResultsBox, DetailsSection, DetailGroup, CalcStep, InputDataTable, InputDataRow, Tex, TableRef , LabelTip, ResultsDetailsProvider, ResultsDetailsTabBar , Sub} from '@/app/(home)/standards/_lib/ui'
import { TH, TD, TDN, FORMULA_BOX, WIND_SECTION, INPUT_GRID, INPUT_STYLE, LABEL_STYLE, SELECT_STYLE, ZONE_PILL, WIND_IMG } from '../../../../../_lib/ui-styles'
import { calcPeakPressure, getDuoCpe } from '../wind-helpers'
import { TERRAIN_CATS } from '../wind-types'
import { Table74a, Table74b, Table41 } from '../WindTables'
import { WindPrimaryInputs, WindSecondaryInputs, INPUT_DIVIDER } from '../WindShared'
import { useTranslation } from '@/app/i18n/LanguageContext'

interface Props {
  vb: number; setVb: (v: number) => void
  cat: string; setCat: (v: string) => void
  c0: number; setC0: (v: number) => void
  rho: number; setRho: (v: number) => void
  mD: number; setMD: (v: number) => void
  mB: number; setMB: (v: number) => void
  mH: number; setMH: (v: number) => void
  alpha: number; setAlpha: (v: number) => void
  cpiMin: number; setCpiMin: (v: number) => void
  cpiMax: number; setCpiMax: (v: number) => void
}

export default function WindDuo({ vb, setVb, cat, setCat, c0, setC0, rho, setRho, mD, setMD, mB, setMB, mH, setMH, alpha, setAlpha, cpiMin, setCpiMin, cpiMax, setCpiMax }: Props) {
  const { t } = useTranslation()
  const [loadedArea, setLoadedArea] = useState<'cpe10' | 'cpe1'>('cpe10')
  const [theta, setTheta] = useState<'0' | '90'>('0')

  const ze = mH
  const qpResult = calcPeakPressure(vb, ze, cat, c0, rho)
  const { kr, cr, vm, Iv, qp } = qpResult
  const e = Math.min(mB, 2 * mH)
  const cpe = getDuoCpe(alpha, loadedArea, theta)
  const zones = theta === '90' ? ['F', 'G', 'H', 'I'] : ['F', 'G', 'H', 'I', 'J']

  return (
    <ResultsDetailsProvider>
    <div style={WIND_SECTION}>
      <ResultsDetailsTabBar />
      <TheoryBlock>
        <p><strong>EN 1991-1-4 §7.2.5</strong> — {t('std_ec1w_thy_wd_p1').split('—').slice(1).join('—').trim()}</p>
        <p><strong>{t('std_ec1w_thy_wd_theta0').split(':')[0].trim()}</strong>: {t('std_ec1w_thy_wd_theta0').split(':').slice(1).join(':').trim()}</p>
        <ul style={{ margin: '4px 0 4px 16px', padding: 0 }}>
          <li><strong>F</strong>: {t('std_ec1w_thy_wd_f').split(':').slice(1).join(':').trim()}</li>
          <li><strong>G</strong>: {t('std_ec1w_thy_wd_g').split(':').slice(1).join(':').trim()}</li>
          <li><strong>H</strong>: {t('std_ec1w_thy_wd_h').split(':').slice(1).join(':').trim()}</li>
          <li><strong>I</strong>: {t('std_ec1w_thy_wd_i').split(':').slice(1).join(':').trim()}</li>
          <li><strong>J</strong>: {t('std_ec1w_thy_wd_j').split(':').slice(1).join(':').trim()}</li>
        </ul>
        <p>{t('std_ec1w_thy_wd_interp')}</p>
      </TheoryBlock>
      <div style={FORMULA_BOX}>
        <strong>EN 1991-1-4 §7.2.5</strong> — Duopitch (−45°≤α≤75°).{' '}
        {theta === '0' && <>Table 7.4a, θ=0° (wind perpendicular to ridge).</>}
        {theta === '90' && <>Table 7.4b, θ=90° (wind parallel to ridge, independent of α).</>}
        {' '}w = q<sub>p</sub>·(c<sub>pe</sub>−c<sub>pi</sub>). z<sub>e</sub> = h.
      </div>

      <WindPrimaryInputs vb={vb} setVb={setVb} cat={cat} setCat={setCat} />
      <div style={INPUT_GRID}>
        <div>
          <LabelTip tip={t('std_ec1w_tip_wd_d')}>d — {t('std_ec1w_det_rm_param_d')} (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={1} step={0.5} value={mD} onChange={setMD} />
        </div>
        <div>
          <LabelTip tip={t('std_ec1w_tip_wd_b')}>b — {t('std_ec1w_det_rm_param_b')} (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={1} step={0.5} value={mB} onChange={setMB} />
        </div>
        <div>
          <LabelTip tip={t('std_ec1w_tip_wd_h')}>h — {t('std_ec1w_det_rm_param_h_duo')} (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={1} step={0.5} value={mH} onChange={setMH} />
        </div>
        <div>
          <LabelTip tip={t('std_ec1w_tip_wd_alpha')}>α — {t('std_ec1w_det_rm_param_alpha')} (°)</LabelTip>
          <NumInput style={INPUT_STYLE} min={-45} max={75} step={1} value={alpha} onChange={setAlpha} />
        </div>
        <div>
          <LabelTip tip={t('std_ec1w_tip_wd_theta')}>{t('std_ec1w_det_rm_param_theta')}</LabelTip>
          <select style={SELECT_STYLE} value={theta} onChange={e => setTheta(e.target.value as '0' | '90')}>
            <option value="0">0° — wind perpendicular to ridge</option>
            <option value="90">90° — wind parallel to ridge</option>
          </select>
        </div>
        <div>
          <LabelTip tip={t('std_ec1w_tip_wd_cpe')}>{t('std_ec1w_det_ww_param_loaded')}</LabelTip>
          <select style={SELECT_STYLE} value={loadedArea} onChange={e => setLoadedArea(e.target.value as 'cpe10' | 'cpe1')}>
            <option value="cpe10">{'>'}10 m² (cpe,10)</option>
            <option value="cpe1">≤1 m² (cpe,1)</option>
          </select>
        </div>
      </div>
      <hr style={INPUT_DIVIDER} />
      <div style={INPUT_GRID}>
        <div>
          <LabelTip tip={t('std_ec1w_tip_wd_cpi_min')}>c<sub>pi,min</sub></LabelTip>
          <NumInput style={INPUT_STYLE} min={-0.5} max={0} step={0.05} value={cpiMin} onChange={setCpiMin} />
        </div>
        <div>
          <LabelTip tip={t('std_ec1w_tip_wd_cpi_max')}>c<sub>pi,max</sub></LabelTip>
          <NumInput style={INPUT_STYLE} min={0} max={0.5} step={0.05} value={cpiMax} onChange={setCpiMax} />
        </div>
      </div>
      <WindSecondaryInputs c0={c0} setC0={setC0} rho={rho} setRho={setRho} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <img src={WIND_IMG.duoPitch} alt="Duopitch roof pressure zones" style={{ width: '100%', maxWidth: 520, borderRadius: 6, display: 'block' }} />
        <div style={{ fontSize: 12, color: '#1e293b' }}>
          e = min(b, 2h) = min({mB}, {2*mH}) = <strong>{e.toFixed(1)} m</strong>
          &nbsp;|&nbsp; z<sub>e</sub> = h = {mH} m
        </div>
        <ResultsBox title={t('std_ui_tab_results')}>
          <ResultRow
            label={<>q<sub>p</sub>(z<sub>e</sub>=h={mH} m) — {t('std_ec1w_res_qp')}</>}
            value={qp.toFixed(3)} unit="kPa"
            onClick={() => document.getElementById('duo-details')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          />
          <Table>
            <thead><tr>
              <th style={TH}>Zone</th>
              <th style={TH}>{loadedArea === 'cpe10' ? 'cpe,10' : 'cpe,1'}</th>
              <th style={TH}>w (suction) (kPa)</th>
              <th style={TH}>w (pressure) (kPa)</th>
            </tr></thead>
            <tbody>{zones.map((zone, i) => {
              const { neg, pos } = cpe[zone] ?? { neg: 0, pos: null }
              const wNeg = qp * (neg - cpiMax)
              const wPos = pos !== null ? qp * (pos - cpiMin) : qp * (neg - cpiMin)
              return (
                <TR key={zone} stripe={i % 2 !== 0}>
                  <td style={{ ...TD, fontWeight: 700 }}><span style={{ ...ZONE_PILL, background: '#dbeafe', color: '#1d4ed8' }}>{zone}</span></td>
                  <td style={TDN}>
                    <span style={{ color: '#2563eb' }}>{neg.toFixed(2)}</span>
                    {pos !== null && <><span style={{ color: '#1e293b' }}> or </span><span style={{ color: '#dc2626' }}>{pos.toFixed(2)}</span></>}
                  </td>
                  <td style={{ ...TDN, color: '#2563eb' }}>{wNeg.toFixed(3)}</td>
                  <td style={{ ...TDN, color: wPos >= 0 ? '#dc2626' : '#2563eb' }}>{wPos.toFixed(3)}</td>
                </TR>
              )
            })}</tbody>
          </Table>
        </ResultsBox>

        <DetailsSection id="duo-details">
          {(() => {
            const P: React.CSSProperties = { fontSize: 12, color: '#374151', lineHeight: 1.75, margin: '6px 0 10px' }
            const catData = TERRAIN_CATS.find(c => c.id === cat)!
            const z0 = catData.z0
            const zmin = catData.zmin
            const qb = 0.5 * rho * vb * vb / 1000
            const tableLabel = theta === '90' ? 'Table 7.4b (θ=90°)' : `Table 7.4a (θ=0°)`
            return (<>
              <p style={{ fontSize: 11, color: '#1e293b', marginBottom: 10 }}>
                <strong>According to:</strong> EN 1991-1-4:2005+A1:2010 §7.2.5 and {tableLabel}
              </p>

              <DetailGroup title={t('std_ec1w_det_input_data')}>
                <InputDataTable>
                  <InputDataRow param={<>{t('std_ec1w_det_param_cat')} — <TableRef label="Table 4.1" renderTable={() => <Table41 />} /></>} symbol={<Tex>{'\\text{Cat.}'}</Tex>} value={`Cat. ${cat} — z₀=${z0} m, zmin=${zmin} m`} />
                  <InputDataRow param={t('std_ec1w_det_lbl_basic_vb')} symbol={<Tex>{'v_b'}</Tex>} value={vb.toFixed(2)} unit="m/s" />
                  <InputDataRow param={t('std_ec1w_det_param_c0_short')} symbol={<Tex>{'c_0(z_e)'}</Tex>} value={c0.toFixed(2)} />
                  <InputDataRow param={t('std_ec1w_det_param_rho_short')} symbol={<Tex>{'\\rho'}</Tex>} value={rho.toFixed(2)} unit="kg/m³" />
                  <InputDataRow param={t('std_ec1w_det_rm_param_d')} symbol={<Tex>{'d'}</Tex>} value={mD.toFixed(2)} unit="m" />
                  <InputDataRow param={t('std_ec1w_det_rm_param_b')} symbol={<Tex>{'b'}</Tex>} value={mB.toFixed(2)} unit="m" />
                  <InputDataRow param={t('std_ec1w_det_rm_param_h_duo')} symbol={<Tex>{'h'}</Tex>} value={mH.toFixed(2)} unit="m" />
                  <InputDataRow param={t('std_ec1w_det_rm_param_alpha')} symbol={<Tex>{'\\alpha'}</Tex>} value={`${alpha}°`} />
                  <InputDataRow param={t('std_ec1w_det_rm_param_theta')} symbol={<Tex>{'\\theta'}</Tex>} value={`${theta}°`} />
                  <InputDataRow param={t('std_ec1w_det_rm_param_loaded')} symbol={<Tex>{loadedArea === 'cpe10' ? 'A \\geq 10\\ \\mathrm{m}^2' : 'A \\leq 1\\ \\mathrm{m}^2'}</Tex>} value={loadedArea === 'cpe10' ? 'cpe,10' : 'cpe,1'} />
                  <InputDataRow param={t('std_ec1w_det_rm_param_cpi_min')} symbol={<Tex>{'c_{pi,\\min}'}</Tex>} value={cpiMin.toFixed(2)} />
                  <InputDataRow param={t('std_ec1w_det_rm_param_cpi_max')} symbol={<Tex>{'c_{pi,\\max}'}</Tex>} value={cpiMax.toFixed(2)} />
                </InputDataTable>
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_ref_height')}>
                <p style={P}><Sub>{t('std_ec1w_det_ref_height_prose_roof')}</Sub></p>
                <CalcStep
                  label={<>{t('std_ec1w_det_lbl_ref_height')} <Tex>{'z_e'}</Tex> (EN 1991-1-4 §7.2.5(1))</>}
                  formula={`z_e = h = ${mH.toFixed(3)}\\ \\mathrm{m}`}
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

              <DetailGroup title={t('std_ec1w_det_press_coeff_type')}>
                <p style={P}>
                  The external pressure coefficients are divided into overall coefficients c<sub>pe,10</sub> and local coefficients c<sub>pe,1</sub> as described in EN 1991-1-4 §7.1.1(1) and §7.2.1(1). Local coefficients c<sub>pe,1</sub> correspond to wind pressure for loaded areas ≤ 1 m² and they may be used for the design of small elements and fixings. Overall coefficients c<sub>pe,10</sub> correspond to loaded areas ≥ 10 m² and are used for the design of the overall load bearing structure. For intermediate loaded areas A between 1 m² and 10 m² the external pressure coefficient c<sub>pe</sub> may be calculated with logarithmic interpolation.
                </p>
                <p style={P}>
                  In the examined calculation the provided external pressure corresponds to coefficient <strong>{loadedArea === 'cpe10' ? 'c₝ₑ,10' : 'c₝ₑ,1'}</strong>, applicable for {loadedArea === 'cpe10' ? 'global verifications' : 'local element design'}.
                </p>
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_cpe_zones')}>
                <p style={P}>
                  {theta === '0'
                    ? <>Wind direction is perpendicular to the ridge (θ = 0°). The zones F, G, H, I, J are defined in EN 1991-1-4 Figure 7.8(b). The extent depends on the characteristic length e:</>
                    : <>For θ = 90° (wind parallel to ridge) the pressure coefficients are from EN 1991-1-4 Table 7.4b and are independent of pitch angle α. The zones F, G, H, I are defined by:</>
                  }
                </p>
                <CalcStep
                  label={<>{t('std_ec1w_det_lbl_char_e')} <Tex>{'e'}</Tex></>}
                  formula={`e = \\min(b,\\,2h) = \\min(${mB.toFixed(3)}\\ \\mathrm{m},\\, 2 \\times ${mH.toFixed(3)}\\ \\mathrm{m}) = ${e.toFixed(3)}\\ \\mathrm{m}`}
                  result={<></>}
                  tableRef={
                    theta === '90'
                      ? <TableRef label="Table 7.4b" renderTable={() => <Table74b />} note="— θ=90° (wind parallel to ridge)" />
                      : <TableRef label="Table 7.4a" renderTable={() => <Table74a />} note={`— θ=0°, α=${alpha}°`} />
                  }
                />
                <p style={P}>
                  {theta === '0'
                    ? <>For θ = 0°, external pressure coefficient c<sub>pe</sub> for each zone from EN 1991-1-4 Table 7.4a at pitch angle α = {alpha}°. Values are linearly interpolated where appropriate:</>
                    : <>For θ = 90°, external pressure coefficient c<sub>pe</sub> for each zone from EN 1991-1-4 Table 7.4b (independent of α):</>
                  }
                </p>
                {zones.map(zone => {
                  const { neg, pos } = cpe[zone] ?? { neg: 0, pos: null }
                  return (
                    <CalcStep key={zone}
                      label={<>Zone {zone}</>}
                      formula={pos !== null
                        ? `c_{pe,\\text{Zone ${zone}}} = ${neg.toFixed(3)}\\text{ (suction) or }${pos >= 0 ? '+' : ''}${pos.toFixed(3)}\\text{ (pressure)}`
                        : `c_{pe,\\text{Zone ${zone}}} = ${neg.toFixed(3)}`}
                      result={<></>}
                    />
                  )
                })}
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_cpi_group')}>
                <p style={P}>
                  Internal pressure coefficients c<sub>pi</sub> are specified in EN 1991-1-4 §7.2.9. For buildings without a dominant face, c<sub>pi</sub> = +0.2 or c<sub>pi</sub> = −0.3 per §7.2.9(6) Note 2.
                </p>
                <CalcStep
                  label={<>{t('std_ec1w_det_lbl_cpi_suction')} <Tex>{'c_{pi,\\min}'}</Tex></>}
                  formula={`c_{pi,\\min} = ${cpiMin.toFixed(2)}`}
                  result={<></>}
                  note={t('std_ec1w_det_note_cpi_neg')}
                />
                <CalcStep
                  label={<>{t('std_ec1w_det_lbl_cpi_pressure')} <Tex>{'c_{pi,\\max}'}</Tex></>}
                  formula={`c_{pi,\\max} = ${cpiMax.toFixed(2)}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_net_press')}>
                <p style={P}>
                  The net wind pressure w<sub>net</sub> = q<sub>p</sub>(z<sub>e</sub>) · (c<sub>pe</sub> − c<sub>pi</sub>) combines external and internal effects:
                </p>
                <CalcStep
                  label=""
                  formula={`w_{\\mathrm{net}} = w_e - w_i = q_p(z_e) \\cdot c_{pe} - q_p(z_i) \\cdot c_{pi}`}
                  result={<></>}
                  note={`${t('std_ec1w_det_rm_net_zi_note_pre')} ${mH.toFixed(3)} m ${t('std_ec1w_det_rm_net_zi_note_post')} ${qp.toFixed(4)} kN/m².`}
                />
                <p style={P}>
                  When c<sub>pe</sub> is positive then c<sub>pi,min</sub> = {cpiMin.toFixed(2)} is most onerous. When c<sub>pe</sub> is negative then c<sub>pi,max</sub> = {cpiMax.toFixed(2)} is most onerous.
                </p>
                {zones.map(zone => {
                  const { neg, pos } = cpe[zone] ?? { neg: 0, pos: null }
                  const cpePos = pos ?? neg
                  const wSuction = qp * (neg - cpiMax)
                  const wPressure = qp * (cpePos - cpiMin)
                  return (
                    <CalcStep key={zone}
                      label={<>Zone {zone}</>}
                      formula={`\\begin{aligned}
w_{\\text{suction}} &= q_p \\cdot (c_{pe,\\min} - c_{pi,\\max}) = ${qp.toFixed(4)} \\cdot (${neg.toFixed(3)} - ${cpiMax.toFixed(2)}) = ${wSuction.toFixed(4)}\\ \\mathrm{kN/m^2} \\\\
w_{\\text{pressure}} &= q_p \\cdot (c_{pe,\\max} - c_{pi,\\min}) = ${qp.toFixed(4)} \\cdot (${cpePos >= 0 ? '+' : ''}${cpePos.toFixed(3)} - ${cpiMin.toFixed(2)}) = ${wPressure.toFixed(4)}\\ \\mathrm{kN/m^2}
\\end{aligned}`}
                      result={<></>}
                    />
                  )
                })}
              </DetailGroup>

              {theta === '0' && (
                <DetailGroup title={t('std_ec1w_det_rm_theta0_cases_title')}>
                  <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.75, margin: '6px 0 6px' }}>
                    For θ = 0° both positive and negative values should be considered. According to EN 1991-1-4 Table 7.4, Note 1 four cases should be considered:
                  </p>
                  <ul style={{ fontSize: 12, color: '#374151', lineHeight: 1.75, margin: '0 0 6px', paddingLeft: 18 }}>
                    <li>{t('std_ec1w_det_rm_theta0_case1')}</li>
                    <li>{t('std_ec1w_det_rm_theta0_case2')}</li>
                    <li>{t('std_ec1w_det_rm_theta0_case3')}</li>
                    <li>{t('std_ec1w_det_rm_theta0_case4')}</li>
                  </ul>
                  <p style={{ fontSize: 12, color: '#374151', lineHeight: 1.75, margin: 0 }}>{t('std_ec1w_det_rm_theta0_no_mix')}</p>
                </DetailGroup>
              )}

              <DetailGroup title={t('std_ec1w_det_add_notes')}>
                <ul style={{ fontSize: 12, color: '#374151', lineHeight: 1.75, margin: 0, paddingLeft: 18 }}>
                  <li>{t('std_ec1w_det_note_openings')}</li>
                  <li>{t('std_ec1w_det_rm_note_canopy_ref_pre')} {t('std_ec1w_det_rm_note_duo_canopy')}</li>
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
