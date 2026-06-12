'use client'
import React from 'react'
import { TheoryBlock, NumInput, Table, TR, ResultRow, ResultsBox, DetailsSection, DetailGroup, CalcStep, InputDataTable, InputDataRow, Tex, TableRef , LabelTip, ResultsDetailsProvider, ResultsDetailsTabBar , Sub} from '@/app/(home)/standards/_lib/ui'
import { TH, TD, TDN, FORMULA_BOX, WIND_SECTION, INPUT_GRID, INPUT_STYLE, LABEL_STYLE, ZONE_PILL, WIND_IMG } from '../../../../../_lib/ui-styles'
import { calcPeakPressure, getWallNetCp } from '../wind-helpers'
import { TERRAIN_CATS } from '../wind-types'
import { Table79, Table41 } from '../WindTables'
import { WindPrimaryInputs, WindSecondaryInputs, INPUT_DIVIDER } from '../WindShared'
import { useTranslation } from '@/app/i18n/LanguageContext'

interface Props {
  vb: number; setVb: (v: number) => void
  cat: string; setCat: (v: string) => void
  c0: number; setC0: (v: number) => void
  rho: number; setRho: (v: number) => void
  fwL: number; setFwL: (v: number) => void
  fwH: number; setFwH: (v: number) => void
  fwHbase: number; setFwHbase: (v: number) => void
  fwCorner: number; setFwCorner: (v: number) => void
  fwSolid: number; setFwSolid: (v: number) => void
}

export default function WindFreewall({ vb, setVb, cat, setCat, c0, setC0, rho, setRho, fwL, setFwL, fwH, setFwH, fwHbase, setFwHbase, fwCorner, setFwCorner, fwSolid, setFwSolid }: Props) {
  const { t } = useTranslation()
  // ze = top of wall above ground = hbase + h
  const ze = fwHbase + fwH
  const qpResult = calcPeakPressure(vb, ze, cat, c0, rho)
  const { kr, cr, vm, Iv, qp } = qpResult
  const lh = fwL / fwH
  const e = Math.min(fwL, 2 * fwH)
  const zones = ['A', 'B', 'C', 'D']

  const hasCorner = fwCorner > 0

  return (
    <ResultsDetailsProvider>
    <div style={WIND_SECTION}>
      <ResultsDetailsTabBar />
      <TheoryBlock>
        <p><strong>{t('std_ec1w_thy_fw_p1').split('—')[0].trim()}</strong>{t('std_ec1w_thy_fw_p1').includes('—') ? ' — ' + t('std_ec1w_thy_fw_p1').split('—').slice(1).join('—').trim() : ''}</p>
        <p><strong>{t('std_ec1w_thy_fw_phi').split(':')[0].trim()}</strong>: {t('std_ec1w_thy_fw_phi').split(':').slice(1).join(':').trim()}</p>
        <p><strong>{t('std_ec1w_thy_fw_zones')}</strong></p>
        <ul style={{ margin: '4px 0 4px 16px', padding: 0 }}>
          <li><strong>Zone A</strong>: {t('std_ec1w_thy_fw_zone_a').split(':').slice(1).join(':').trim()}</li>
          <li><strong>Zone B</strong>: {t('std_ec1w_thy_fw_zone_b').split(':').slice(1).join(':').trim()}</li>
          <li><strong>Zone C</strong>: {t('std_ec1w_thy_fw_zone_c').split(':').slice(1).join(':').trim()}</li>
          <li><strong>Zone D</strong>: {t('std_ec1w_thy_fw_zone_d').split(':').slice(1).join(':').trim()}</li>
        </ul>
        <p>{t('std_ec1w_thy_fw_e')}</p>
        <p><strong>{t('std_ec1w_thy_fw_net').split(':')[0].trim()}</strong>{t('std_ec1w_thy_fw_net').includes(':') ? ': ' + t('std_ec1w_thy_fw_net').split(':').slice(1).join(':').trim() : ''}</p>
      </TheoryBlock>
      <div style={FORMULA_BOX}>
        <strong>{t('std_ec1w_thy_fw_formula')}</strong><br />
        {t('std_ec1w_thy_fw_formula2')}
      </div>

      <WindPrimaryInputs vb={vb} setVb={setVb} cat={cat} setCat={setCat} />
      <div style={INPUT_GRID}>
        <div>
          <LabelTip tip={t('std_ec1w_tip_fw_l')}>l — {t('std_ec1w_det_fw_param_l')} (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={1} step={0.5} value={fwL} onChange={setFwL} />
        </div>
        <div>
          <LabelTip tip={t('std_ec1w_tip_fw_h')}>h — {t('std_ec1w_det_fw_param_h')} (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={0.5} step={0.5} value={fwH} onChange={setFwH} />
        </div>
        <div>
          <LabelTip tip={t('std_ec1w_tip_fw_hbase')}>h<sub>base</sub> — {t('std_ec1w_det_fw_param_hbase')} (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={0} step={0.5} value={fwHbase} onChange={setFwHbase} />
        </div>
        <div>
          <LabelTip tip={t('std_ec1w_tip_fw_corner')}>l<sub>corner</sub> — {t('std_ec1w_det_fw_param_corner')} (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={0} step={0.5} value={fwCorner} onChange={setFwCorner} />
        </div>
        <div>
          <LabelTip tip={t('std_ec1w_tip_fw_phi')}>φ — {t('std_ec1w_det_fw_param_phi')} (0–1)</LabelTip>
          <NumInput style={INPUT_STYLE} min={0} max={1} step={0.05} value={fwSolid} onChange={setFwSolid} />
        </div>
      </div>
      <hr style={INPUT_DIVIDER} />
      <WindSecondaryInputs c0={c0} setC0={setC0} rho={rho} setRho={setRho} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <img src={WIND_IMG.freewall} alt="Freestanding wall wind zones" style={{ width: '100%', maxWidth: 520, borderRadius: 6, display: 'block' }} />
        <div style={{ fontSize: 12, color: '#1e293b' }}>
          l/h = {lh.toFixed(2)} &nbsp;|&nbsp; e = min(l, 2h) = min({fwL}, {2*fwH}) = <strong>{e.toFixed(2)} m</strong>
          &nbsp;|&nbsp; z<sub>e</sub> = {fwHbase} + {fwH} = <strong>{ze.toFixed(2)} m</strong>
          {hasCorner && <> &nbsp;|&nbsp; <span style={{ color: '#92400e' }}>corner return l = {fwCorner} m</span></>}
        </div>

        <ResultsBox title={t('std_ui_tab_results')}>
          <ResultRow
            label={<>q<sub>p</sub>(z<sub>e</sub>={ze.toFixed(2)} m) — {t('std_ec1w_res_qp')}</>}
            value={qp.toFixed(3)} unit="kPa"
            onClick={() => document.getElementById('freewall-details')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          />
          <Table>
            <thead><tr>
              <th style={TH}>Zone</th><th style={TH}>c<sub>p,net</sub></th><th style={TH}>w·φ (kPa)</th><th style={TH}>Zone extent</th>
            </tr></thead>
            <tbody>{zones.map((zone, i) => {
              const cp = getWallNetCp(lh, zone)
              const zoneLen = zone === 'A'
                ? `0 – e/4 = ${(e/4).toFixed(2)} m`
                : zone === 'B'
                ? `e/4 – e = ${(e/4).toFixed(2)} – ${e.toFixed(2)} m`
                : zone === 'C'
                ? `e – 2e = ${e.toFixed(2)} – ${(2*e).toFixed(2)} m`
                : `> 2e = ${(2*e).toFixed(2)} m`
              return (
                <TR key={zone} stripe={i % 2 !== 0}>
                  <td style={{ ...TD, fontWeight: 700 }}><span style={{ ...ZONE_PILL, background: '#dbeafe', color: '#1d4ed8' }}>{zone}</span></td>
                  <td style={{ ...TDN, color: '#dc2626' }}>{cp.toFixed(2)}</td>
                  <td style={TDN}>{(qp * cp * fwSolid).toFixed(3)}</td>
                  <td style={{ ...TD, fontSize: 11, color: '#1e293b' }}>{zoneLen}</td>
                </TR>
              )
            })}</tbody>
          </Table>
        </ResultsBox>

        <DetailsSection id="freewall-details">
          {(() => {
            const catData = TERRAIN_CATS.find(c => c.id === cat)!
            const z0 = catData.z0; const zmin = catData.zmin
            const zeEff = Math.max(ze, zmin)
            const qb = 0.5 * rho * vb * vb / 1000
            const P: React.CSSProperties = { fontSize: 12, color: '#374151', lineHeight: 1.75, margin: '6px 0 10px' }
            return <>
              <p style={{ fontSize: 11, color: '#1e293b', marginBottom: 10 }}>
                <strong>According to:</strong> EN 1991-1-4:2005+A1:2010 §7.4.1 and Table 7.9
              </p>

              <DetailGroup title={t('std_ec1w_det_input_data')}>
                <InputDataTable>
                  <InputDataRow param={t('std_ec1w_det_param_cat')} symbol={<Tex>{'\\text{Cat.}'}</Tex>} value={`Cat. ${cat} — z₀ = ${z0} m, z_min = ${zmin} m`} />
                  <InputDataRow param={t('std_ec1w_det_lbl_basic_vb')} symbol={<Tex>{'v_b'}</Tex>} value={vb.toFixed(2)} unit="m/s" />
                  <InputDataRow param={t('std_ec1w_det_fw_param_l')} symbol={<Tex>{'l'}</Tex>} value={fwL.toFixed(3)} unit="m" />
                  <InputDataRow param={t('std_ec1w_det_fw_param_h')} symbol={<Tex>{'h'}</Tex>} value={fwH.toFixed(3)} unit="m" />
                  <InputDataRow param={t('std_ec1w_det_fw_param_hbase')} symbol={<Tex>{'h_{\\mathrm{base}}'}</Tex>} value={fwHbase.toFixed(3)} unit="m" />
                  <InputDataRow param={t('std_ec1w_det_fw_param_corner')} symbol={<Tex>{'l_{\\mathrm{corner}}'}</Tex>} value={fwCorner.toFixed(3)} unit="m" />
                  <InputDataRow param={t('std_ec1w_det_fw_param_phi')} symbol={<Tex>{'\\varphi'}</Tex>} value={fwSolid.toFixed(2)} />
                  <InputDataRow param={t('std_ec1w_det_param_c0_short')} symbol={<Tex>{'c_0(z_e)'}</Tex>} value={c0.toFixed(3)} />
                  <InputDataRow param={t('std_ec1w_det_param_rho_short')} symbol={<Tex>{'\\rho'}</Tex>} value={rho.toFixed(2)} unit="kg/m³" />
                </InputDataTable>
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_ref_height')}>
                <p style={P}><Sub>{t('std_ec1w_det_fw_ref_h_prose')}</Sub></p>
                <CalcStep
                  label={<>{t('std_ec1w_det_lbl_ref_height')} <Tex>{'z_e'}</Tex></>}
                  formula={`z_e = h + h_{\\mathrm{base}} = ${fwH.toFixed(3)}\\ \\mathrm{m} + ${fwHbase.toFixed(3)}\\ \\mathrm{m} = ${ze.toFixed(3)}\\ \\mathrm{m}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_basic_vb')}>
                <p style={P}><Sub>{t('std_ec1w_det_vb_prose')}</Sub></p>
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_terrain_roughness')}>
                <p style={P}>
                  <Sub>{t('std_ec1w_det_z0_prose_pre')}</Sub> <strong>{cat}</strong> <Sub>{t('std_ec1w_det_z0_prose_post')}</Sub> z<sub>0</sub> = {z0} m, z<sub>min</sub> = {zmin} m.
                </p>
                <p style={P}>
                  <Sub>{t('std_ec1w_det_kr_prose_pre')}</Sub> {z0} <Sub>{t('std_ec1w_det_kr_prose_post')}</Sub>
                </p>
                <CalcStep
                  label={<>{t('std_ec1w_det_lbl_terrain_factor')} <Tex>{'k_r'}</Tex> (EN 1991-1-4 §4.5 Eq. 4.5)</>}
                  formula={`k_r = 0.19 \\cdot \\left(\\frac{z_0}{z_{0,\\mathrm{II}}}\\right)^{0.07} = 0.19 \\cdot \\left(\\frac{${z0}\\ \\mathrm{m}}{0.050\\ \\mathrm{m}}\\right)^{0.07} = ${kr.toFixed(4)}`}
                  result={<></>}
                />
                <p style={P}>
                  <Sub>{t('std_ec1w_det_cr_prose_pre')}</Sub> {ze.toFixed(3)} m {zeEff >= zmin ? '≥' : '<'} <Sub>{t('std_ec1w_det_cr_prose_post')}</Sub>
                </p>
                <CalcStep
                  label={<>{t('std_ec1w_det_lbl_roughness_factor')} <Tex>{'c_r(z_e)'}</Tex> (EN 1991-1-4 §4.5 Eq. 4.4)</>}
                  formula={`c_r(z_e) = k_r \\cdot \\ln\\!\\left(\\frac{\\max(z_e,\\,z_{\\min})}{z_0}\\right) = ${kr.toFixed(4)} \\cdot \\ln\\!\\left(\\frac{\\max(${ze.toFixed(3)}\\ \\mathrm{m},\\,${zmin}\\ \\mathrm{m})}{${z0}\\ \\mathrm{m}}\\right) = ${cr.toFixed(4)}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_orography')}>
                <p style={P}><Sub>{t('std_ec1w_det_orography_prose')}</Sub></p>
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
                  <Sub>{t('std_ec1w_det_iv_prose_pre')}</Sub> {zeEff >= zmin ? '≥' : '<'} <Sub>{t('std_ec1w_det_cr_prose_post')}</Sub>
                </p>
                <CalcStep
                  label={<>{t('std_ec1w_res_iv')} <Tex>{'I_v(z_e)'}</Tex> (EN 1991-1-4 §4.4 Eq. 4.7)</>}
                  formula={`I_v(z_e) = \\frac{k_I}{c_0(z_e) \\cdot \\ln\\!\\left(\\frac{\\max(z_e,\\,z_{\\min})}{z_0}\\right)} = \\frac{1.000}{${c0.toFixed(3)} \\cdot \\ln\\!\\left(\\frac{\\max(${ze.toFixed(3)}\\ \\mathrm{m},\\,${zmin}\\ \\mathrm{m})}{${z0}\\ \\mathrm{m}}\\right)} = ${Iv.toFixed(4)}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_basic_qb')}>
                <p style={P}><Sub>{t('std_ec1w_det_qb_prose')}</Sub></p>
                <CalcStep
                  label={<>{t('std_ec1w_det_basic_qb')} <Tex>{'q_b'}</Tex></>}
                  formula={`q_b = \\tfrac{1}{2} \\cdot \\rho \\cdot v_b^2 = \\tfrac{1}{2} \\cdot ${rho.toFixed(2)}\\ \\mathrm{kg/m^3} \\cdot (${vb.toFixed(2)}\\ \\mathrm{m/s})^2 = ${(qb*1000).toFixed(0)}\\ \\mathrm{N/m^2} = ${qb.toFixed(3)}\\ \\mathrm{kN/m^2}`}
                  result={<></>}
                  note={t('std_ec1w_det_note_rho_density')}
                />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_peak_qp')}>
                <p style={P}><Sub>{t('std_ec1w_det_qp_prose')}</Sub></p>
                <CalcStep
                  label={<>{t('std_ec1w_det_peak_qp')} <Tex>{'q_p(z_e)'}</Tex> (EN 1991-1-4 §4.5 Eq. 4.8)</>}
                  formula={`q_p(z_e) = (1 + 7 \\cdot I_v(z_e)) \\cdot \\tfrac{1}{2} \\cdot \\rho \\cdot v_m(z_e)^2 = (1 + 7 \\cdot ${Iv.toFixed(4)}) \\cdot \\tfrac{1}{2} \\cdot ${rho.toFixed(2)} \\cdot (${vm.toFixed(2)})^2 = ${(qp*1000).toFixed(0)}\\ \\mathrm{N/m^2}`}
                  result={<></>}
                  note={t('std_ec1w_det_note_1N')}
                />
                <CalcStep label="" formula={`\\Rightarrow q_p(z_e) = ${qp.toFixed(4)}\\ \\mathrm{kN/m^2}`} result={<></>} />
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_fw_net_cp_title')}>
                <p style={P}>
                  <Sub>{t('std_ec1w_det_fw_net_cp_prose')}</Sub> <Sub>{t('std_ec1w_det_fw_lh')}</Sub> l/h = {fwL.toFixed(3)} m / {fwH.toFixed(3)} m = {lh.toFixed(3)}{hasCorner ? `, l_corner/h = ${fwCorner.toFixed(3)}/${fwH.toFixed(3)} = ${(fwCorner/fwH).toFixed(3)}` : ''}, φ = {fwSolid.toFixed(3)}.
                </p>
                <CalcStep
                  label={<><Sub>{t('std_ec1w_det_fw_lh')}</Sub> <Tex>{'l/h'}</Tex></>}
                  formula={`l/h = ${fwL.toFixed(3)}\\ \\mathrm{m}\\ /\\ ${fwH.toFixed(3)}\\ \\mathrm{m} = ${lh.toFixed(3)}`}
                  result={<></>}
                  tableRef={<TableRef label="Table 7.9" renderTable={() => <Table79 />} note="— cp,net for freestanding walls and parapets" />}
                />
                {zones.map(zone => {
                  const cp = getWallNetCp(lh, zone)
                  return (
                    <CalcStep key={zone}
                      label={<>Zone {zone} — <Tex>{`c_{p,\\mathrm{net},${zone}}`}</Tex></>}
                      formula={`c_{p,\\mathrm{net},${zone}} = ${cp.toFixed(3)}`}
                      result={<></>}
                    />
                  )
                })}
                {hasCorner && (
                  <p style={{ ...P, color: '#92400e' }}>
                    Return corner l<sub>corner</sub> = {fwCorner.toFixed(3)} m {t('std_ec1w_det_fw_corner_note')} l<sub>corner</sub>/h = {(fwCorner/fwH).toFixed(3)}.
                  </p>
                )}
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_fw_net_press_title')}>
                <p style={P}>
                  <Sub>{t('std_ec1w_det_fw_net_press_prose')}</Sub>
                </p>
                <CalcStep label="" formula={`w_{\\mathrm{net}} = q_p(z_e) \\cdot c_{p,\\mathrm{net}} \\cdot \\varphi`} result={<></>} />
                {zones.map(zone => {
                  const cp = getWallNetCp(lh, zone)
                  const w = qp * cp * fwSolid
                  const zoneExtent = zone === 'A'
                    ? `0 to 0.3h = ${(0.3*fwH).toFixed(3)} m`
                    : zone === 'B'
                    ? `0.3h = ${(0.3*fwH).toFixed(3)} m to 2h = ${(2*fwH).toFixed(3)} m`
                    : zone === 'C'
                    ? `2h = ${(2*fwH).toFixed(3)} m to 4h = ${(4*fwH).toFixed(3)} m`
                    : `beyond 4h = ${(4*fwH).toFixed(3)} m`
                  return (
                    <CalcStep key={zone}
                      label={<>Zone {zone} — extent: {zoneExtent}</>}
                      formula={`w_{\\mathrm{net},{${zone}}} = ${qp.toFixed(4)} \\cdot ${cp.toFixed(3)} \\cdot ${fwSolid.toFixed(3)} = ${w.toFixed(4)}\\ \\mathrm{kN/m^2}`}
                      result={<></>}
                    />
                  )
                })}
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_add_notes')}>
                <ul style={{ fontSize: 12, color: '#374151', lineHeight: 1.75, margin: 0, paddingLeft: 18 }}>
                  <li>{t('std_ec1w_det_fw_note_net')}</li>
                  <li>{t('std_ec1w_det_char_note_unfactored')}</li>
                </ul>
              </DetailGroup>
            </>
          })()}
        </DetailsSection>
      </div>
    </div>
    </ResultsDetailsProvider>
  )
}
