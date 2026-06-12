'use client'
import React, { useState } from 'react'
import { TheoryBlock, NumInput, Table, TR, ResultRow, ResultsBox, DetailsSection, DetailGroup, CalcStep, InputDataTable, InputDataRow, Tex, TableRef , LabelTip, ResultsDetailsProvider, ResultsDetailsTabBar , Sub} from '@/app/(home)/standards/_lib/ui'
import { TH, TD, TDN, FORMULA_BOX, WIND_SECTION, INPUT_GRID, INPUT_STYLE, LABEL_STYLE, SELECT_STYLE, ZONE_PILL, WIND_IMG } from '../../../../../_lib/ui-styles'
import { calcPeakPressure, getCpeWalls } from '../wind-helpers'
import { TERRAIN_CATS } from '../wind-types'
import { Table71, Table41 } from '../WindTables'
import { WindPrimaryInputs, WindSecondaryInputs, INPUT_DIVIDER } from '../WindShared'
import { useTranslation } from '@/app/i18n/LanguageContext'

interface Props {
  vb: number; setVb: (v: number) => void
  cat: string; setCat: (v: string) => void
  c0: number; setC0: (v: number) => void
  rho: number; setRho: (v: number) => void
  wD: number; setWD: (v: number) => void
  wB: number; setWB: (v: number) => void
  wH: number; setWH: (v: number) => void
  cpiMin: number; setCpiMin: (v: number) => void
  cpiMax: number; setCpiMax: (v: number) => void
}

export default function WindWalls({ vb, setVb, cat, setCat, c0, setC0, rho, setRho, wD, setWD, wB, setWB, wH, setWH, cpiMin, setCpiMin, cpiMax, setCpiMax }: Props) {
  const { t } = useTranslation()
  const [loadedArea, setLoadedArea] = useState<'cpe10' | 'cpe1'>('cpe10')

  const ze = wH
  const { kr, cr, vm, Iv, qp } = calcPeakPressure(vb, ze, cat, c0, rho)
  const hd = wH / wD
  const e = Math.min(wB, 2 * wH)

  const zoneC_exists = wD > e
  const wA = e / 4
  const wC_zone = zoneC_exists ? wD - e : 0

  const ZONE_COLORS = {
    A: { bg: '#dbeafe', fg: '#1d4ed8' },
    B: { bg: '#fef3c7', fg: '#92400e' },
    C: { bg: '#dcfce7', fg: '#166534' },
    D: { bg: '#ffe4e6', fg: '#991b1b' },
    E: { bg: '#f3e8ff', fg: '#6b21a8' },
  }

  const zones = ['A', 'B', 'C', 'D', 'E'] as const

  return (
    <ResultsDetailsProvider>
    <div style={WIND_SECTION}>
      <ResultsDetailsTabBar />
      <TheoryBlock>
        <p><strong>{t('std_ec1w_thy_ww_p1').split('—')[0].trim()}</strong> — {t('std_ec1w_thy_ww_p1').split('—').slice(1).join('—').trim()}</p>
        <ul style={{ margin: '4px 0 4px 16px', padding: 0 }}>
          <li><strong>A</strong>: {t('std_ec1w_thy_ww_a').split(':').slice(1).join(':').trim()}</li>
          <li><strong>B</strong>: {t('std_ec1w_thy_ww_b').split(':').slice(1).join(':').trim()}</li>
          <li><strong>C</strong>: {t('std_ec1w_thy_ww_c').split(':').slice(1).join(':').trim()}</li>
          <li><strong>D</strong>: {t('std_ec1w_thy_ww_d').split(':').slice(1).join(':').trim()}</li>
          <li><strong>E</strong>: {t('std_ec1w_thy_ww_e').split(':').slice(1).join(':').trim()}</li>
        </ul>
        <p>{t('std_ec1w_thy_ww_cpe')}</p>
      </TheoryBlock>
      <div style={FORMULA_BOX}>
        <strong>EN 1991-1-4 §7.2.2</strong> — {t('std_ec1w_thy_ww_formula').split('—').slice(1).join('—').trim()}
      </div>

      <WindPrimaryInputs vb={vb} setVb={setVb} cat={cat} setCat={setCat} />
      <div style={INPUT_GRID}>
        <div>
          <LabelTip tip={t('std_ec1w_tip_ww_d')}>d — {t('std_ec1w_det_ww_param_d')} (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={1} step={0.5} value={wD} onChange={setWD} />
        </div>
        <div>
          <LabelTip tip={t('std_ec1w_tip_ww_b')}>b — {t('std_ec1w_det_ww_param_b')} (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={1} step={0.5} value={wB} onChange={setWB} />
        </div>
        <div>
          <LabelTip tip={t('std_ec1w_tip_ww_h')}>h — {t('std_ec1w_det_ww_param_h')} (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={1} step={0.5} value={wH} onChange={setWH} />
        </div>
        <div>
          <LabelTip tip={t('std_ec1w_tip_ww_cpe')}>{t('std_ec1w_det_ww_param_loaded')}</LabelTip>
          <select style={SELECT_STYLE} value={loadedArea} onChange={e => setLoadedArea(e.target.value as 'cpe10' | 'cpe1')}>
            <option value="cpe10">{'>'}10 m² (cpe,10)</option>
            <option value="cpe1">≤1 m² (cpe,1)</option>
          </select>
        </div>
      </div>
      <hr style={INPUT_DIVIDER} />
      <div style={INPUT_GRID}>
        <div>
          <LabelTip tip={t('std_ec1w_tip_ww_cpi_min')}>c<sub>pi,min</sub></LabelTip>
          <NumInput style={INPUT_STYLE} min={-0.5} max={0} step={0.05} value={cpiMin} onChange={setCpiMin} />
        </div>
        <div>
          <LabelTip tip={t('std_ec1w_tip_ww_cpi_max')}>c<sub>pi,max</sub></LabelTip>
          <NumInput style={INPUT_STYLE} min={0} max={0.5} step={0.05} value={cpiMax} onChange={setCpiMax} />
        </div>
      </div>
      <WindSecondaryInputs c0={c0} setC0={setC0} rho={rho} setRho={setRho} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <img src={WIND_IMG.walls} alt="Side walls pressure zones" style={{ width: '100%', maxWidth: 520, borderRadius: 6, display: 'block' }} />
        <div style={{ fontSize: 12, color: '#1e293b' }}>
          e = min(b, 2h) = min({wB}, {2*wH}) = <strong>{e.toFixed(1)} m</strong>
          &nbsp;|&nbsp; h/d = {hd.toFixed(2)}
          &nbsp;|&nbsp; Zone C: {zoneC_exists ? `exists (width = d − e = ${wC_zone.toFixed(1)} m)` : <span style={{ color: '#dc2626' }}>N/A (d ≤ e)</span>}
        </div>

        <ResultsBox title={t('std_ui_tab_results')}>
          <ResultRow
            label={<>q<sub>p</sub>(z<sub>e</sub>=h) — {t('std_ec1w_res_qp')}</>}
            value={qp.toFixed(3)} unit="kPa"
            onClick={() => document.getElementById('walls-details')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          />
          <Table>
            <thead><tr>
              <th style={TH}>Zone</th>
              <th style={TH}>{loadedArea === 'cpe10' ? 'cₚe,10' : 'cₚe,1'}</th>
              <th style={TH}>w (c<sub>pi,max</sub>) (kPa)</th>
              <th style={TH}>w (c<sub>pi,min</sub>) (kPa)</th>
            </tr></thead>
            <tbody>{zones.map((zone, i) => {
              const col = ZONE_COLORS[zone]
              if (zone === 'C' && !zoneC_exists) {
                return (
                  <TR key={zone} stripe={i % 2 !== 0}>
                    <td style={{ ...TD, fontWeight: 700 }}><span style={{ ...ZONE_PILL, background: col.bg, color: col.fg }}>{zone}</span></td>
                    <td style={{ ...TDN, color: '#1e293b', fontStyle: 'italic' }} colSpan={3}>N/A — Zone C does not exist when d ≤ e</td>
                  </TR>
                )
              }
              const cpe = getCpeWalls(hd, zone, loadedArea)
              return (
                <TR key={zone} stripe={i % 2 !== 0}>
                  <td style={{ ...TD, fontWeight: 700 }}><span style={{ ...ZONE_PILL, background: col.bg, color: col.fg }}>{zone}</span></td>
                  <td style={{ ...TDN, color: cpe >= 0 ? '#dc2626' : '#2563eb' }}>{cpe.toFixed(2)}</td>
                  <td style={TDN}>{(qp * (cpe - cpiMax)).toFixed(3)}</td>
                  <td style={TDN}>{(qp * (cpe - cpiMin)).toFixed(3)}</td>
                </TR>
              )
            })}</tbody>
          </Table>
        </ResultsBox>

        <DetailsSection id="walls-details">
          {(() => {
            const catData = TERRAIN_CATS.find(c => c.id === cat)!
            const z0 = catData.z0; const zmin = catData.zmin
            const zeEff = Math.max(ze, zmin)
            const qb = 0.5 * rho * vb * vb / 1000
            const P: React.CSSProperties = { fontSize: 12, color: '#374151', lineHeight: 1.75, margin: '6px 0 10px' }
            return <>
              <p style={{ fontSize: 11, color: '#1e293b', marginBottom: 10 }}>
                <strong>According to:</strong> EN 1991-1-4:2005+A1:2010 §7.2.2 and Table 7.1
              </p>

              <DetailGroup title={t('std_ec1w_det_input_data')}>
                <InputDataTable>
                  <InputDataRow param={t('std_ec1w_det_lbl_basic_vb')} symbol={<Tex>{'v_b'}</Tex>} value={vb.toFixed(2)} unit="m/s" />
                  <InputDataRow param={<>{t('std_ec1w_det_param_cat')} — <TableRef label="Table 4.1" renderTable={() => <Table41 />} /></>} symbol={<Tex>{'\\text{Cat.}'}</Tex>} value={`Cat. ${cat} — z₀ = ${z0} m, z_min = ${zmin} m`} />
                  <InputDataRow param={t('std_ec1w_det_ww_param_h')} symbol={<Tex>{'z_e = h'}</Tex>} value={wH.toFixed(2)} unit="m" />
                  <InputDataRow param={t('std_ec1w_det_param_c0_short')} symbol={<Tex>{'c_0(z_e)'}</Tex>} value={c0.toFixed(3)} />
                  <InputDataRow param={t('std_ec1w_det_param_rho_short')} symbol={<Tex>{'\\rho'}</Tex>} value={rho.toFixed(2)} unit="kg/m³" />
                  <InputDataRow param={t('std_ec1w_det_ww_param_d')} symbol={<Tex>{'d'}</Tex>} value={wD.toFixed(2)} unit="m" />
                  <InputDataRow param={t('std_ec1w_det_ww_param_b')} symbol={<Tex>{'b'}</Tex>} value={wB.toFixed(2)} unit="m" />
                  <InputDataRow param={t('std_ec1w_det_ww_param_loaded')} symbol={<Tex>{'A'}</Tex>} value={loadedArea === 'cpe10' ? '≥ 10 m² (cpe,10)' : '≤ 1 m² (cpe,1)'} />
                  <InputDataRow param={t('std_ec1w_det_ww_param_cpi')} symbol={<Tex>{'c_{pi}'}</Tex>} value={`${cpiMin.toFixed(3)} / +${cpiMax.toFixed(3)}`} />
                </InputDataTable>
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_ref_height')}>
                <p style={P}><Sub>{t('std_ec1w_det_ww_ref_h_prose')}</Sub></p>
                <CalcStep label={t('std_ec1w_det_lbl_ref_height')} formula={`z_e = h = ${wH.toFixed(3)}\\ \\mathrm{m}`} result={<></>} />
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
                  <Sub>{t('std_ec1w_det_cr_prose_pre')}</Sub> {zeEff.toFixed(3)} m {zeEff >= zmin ? '≥' : '<'} <Sub>{t('std_ec1w_det_cr_prose_post')}</Sub>
                </p>
                <CalcStep
                  label={<>{t('std_ec1w_det_lbl_roughness_factor')} <Tex>{'c_r(z_e)'}</Tex> (EN 1991-1-4 §4.5 Eq. 4.4)</>}
                  formula={`c_r(z_e) = k_r \\cdot \\ln\\!\\left(\\frac{\\max(z_e,\\,z_{\\min})}{z_0}\\right) = ${kr.toFixed(4)} \\cdot \\ln\\!\\left(\\frac{\\max(${zeEff.toFixed(3)}\\ \\mathrm{m},\\,${zmin}\\ \\mathrm{m})}{${z0}\\ \\mathrm{m}}\\right) = ${cr.toFixed(4)}`}
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
                  formula={`I_v(z_e) = \\frac{k_I}{c_0(z_e) \\cdot \\ln\\!\\left(\\frac{\\max(z_e,\\,z_{\\min})}{z_0}\\right)} = \\frac{1.000}{${c0.toFixed(3)} \\cdot \\ln\\!\\left(\\frac{\\max(${zeEff.toFixed(3)}\\ \\mathrm{m},\\,${zmin}\\ \\mathrm{m})}{${z0}\\ \\mathrm{m}}\\right)} = ${Iv.toFixed(4)}`}
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

              <DetailGroup title={t('std_ec1w_det_ww_press_type_title')}>
                <p style={P}>
                  The external pressure coefficients are divided into overall coefficients c<sub>pe,10</sub> and local coefficients c<sub>pe,1</sub> as described in EN 1991-1-4 §7.1.1(1) and §7.2.1(1). Local coefficients c<sub>pe,1</sub> correspond to wind pressure for loaded areas ≤ 1 m² and are used for the design of small elements and fixings. Overall coefficients c<sub>pe,10</sub> correspond to loaded areas ≥ 10 m² and are used for the design of the overall load bearing structure.
                </p>
                <p style={P}>
                  According to EN 1991-1-4 §7.2.1(1), for intermediate loaded areas A between 1 m² and 10 m² the pressure coefficient c<sub>pe</sub> may be interpolated logarithmically: c<sub>pe</sub> = c<sub>pe,1</sub> − (c<sub>pe,1</sub> − c<sub>pe,10</sub>) · log<sub>10</sub>(A). In this calculation the provided external pressure corresponds to <strong>{loadedArea === 'cpe10' ? 'c_pe,10 — applicable for global structural verifications' : 'c_pe,1 — applicable for local cladding and fixings'}</strong>.
                </p>
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_ww_cpe_zones_title')}>
                <p style={P}>
                  The wind load on the structure is expressed in terms of external pressure coefficients for five zones A, B, C, D, E as defined in EN 1991-1-4 Figures 7.4 and 7.5. The extent of the zones depends on the length e defined as:
                </p>
                <CalcStep
                  label={<>{t('std_ec1w_det_lbl_char_e')} <Tex>{'e'}</Tex></>}
                  formula={`e = \\min(b,\\,2h) = \\min(${wB.toFixed(3)}\\ \\mathrm{m},\\;2 \\times ${wH.toFixed(3)}\\ \\mathrm{m}) = ${e.toFixed(3)}\\ \\mathrm{m}`}
                  result={<></>}
                />
                <p style={P}>
                  <strong>Pressure zones for sidewalls:</strong> Zone A extends from the front corners for length e/4 = {wA.toFixed(3)} m. Zone B extends from e/4 to e ({wA.toFixed(3)} m to {e.toFixed(3)} m along the wind direction). {zoneC_exists ? `Zone C extends from e to d (${e.toFixed(3)} m to ${wD.toFixed(3)} m).` : `Zone C is not applicable — the full depth d = ${wD.toFixed(3)} m does not exceed e = ${e.toFixed(3)} m.`}
                </p>
                <p style={P}>
                  <strong>Pressure zone for windward wall:</strong> Zone D. For buildings with height h ≤ b, where b is the width perpendicular to wind, the windward wall is considered as one part denoted Zone D.
                </p>
                <p style={P}>
                  <strong>Pressure zone for leeward wall:</strong> Zone E corresponds to the leeward wall.
                </p>
                <p style={P}>
                  The external pressure coefficient c<sub>pe</sub> for each zone is defined in EN 1991-1-4 Table 7.1 as a function of the ratio h/d = {wH.toFixed(3)} m / {wD.toFixed(3)} m = {hd.toFixed(3)}.
                </p>
                <CalcStep
                  label={<>{t('std_ec1w_det_lbl_aspect')} <Tex>{'h/d'}</Tex></>}
                  formula={`h/d = ${wH.toFixed(3)}\\ \\mathrm{m}\\ /\\ ${wD.toFixed(3)}\\ \\mathrm{m} = ${hd.toFixed(3)}`}
                  result={<></>}
                  tableRef={<TableRef label="Table 7.1" renderTable={() => <Table71 />} note="— cpe values for vertical walls" />}
                />
                {zones.map(zone => {
                  if (zone === 'C' && !zoneC_exists) return (
                    <CalcStep key={zone} label={<>Zone C — c<sub>pe,C</sub></>}
                      formula={`c_{pe,C} = \\text{not applicable (}d \\leq e\\text{)}`} result={<></>} />
                  )
                  const cpe = getCpeWalls(hd, zone, loadedArea)
                  return (
                    <CalcStep key={zone}
                      label={<>Zone {zone} — <Tex>{`c_{pe,${zone}}`}</Tex></>}
                      formula={`c_{pe,${zone}} = ${cpe.toFixed(3)}`}
                      result={<></>}
                      note={cpe < 0 ? t('std_ec1w_det_note_suction') : t('std_ec1w_det_note_pressure')}
                    />
                  )
                })}
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_ww_cpi_title')}>
                <p style={P}>
                  Internal pressure coefficients c<sub>pi</sub> are specified in EN 1991-1-4 §7.2.9 depending on the size and distribution of the openings of the building. A face of the building is considered dominant when the area of openings at that face is at least twice the area of openings in the remaining faces.
                </p>
                <p style={P}>
                  For a building without a dominant face, the most onerous internal pressure coefficient c<sub>pi</sub> = +0.2 or c<sub>pi</sub> = −0.3 should be considered, as specified in EN 1991-1-4 §7.2.9(6) Note 2. In this calculation: <strong>c<sub>pi,min</sub> = {cpiMin.toFixed(3)} and c<sub>pi,max</sub> = +{cpiMax.toFixed(3)}</strong>. {t('std_ec1w_det_note_cpi_neg')}
                </p>
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_ww_net_title')}>
                <p style={P}>
                  The net wind pressure on the surfaces of the structure w<sub>net</sub> corresponds to the combined effect of external and internal wind pressure:
                </p>
                <CalcStep label="" formula={`w_{\\mathrm{net}} = w_e - w_i = q_p(z_e) \\cdot c_{pe} - q_p(z_i) \\cdot c_{pi}`} result={<></>}
                  note={`Assuming zi = ze, qp(zi) = qp(ze) = ${qp.toFixed(4)} kN/m². When cpe is negative (suction), cpi,max = +${cpiMax} is most onerous. When cpe is positive (pressure), cpi,min = ${cpiMin} is most onerous.`}
                />
                {zones.map(zone => {
                  if (zone === 'C' && !zoneC_exists) return (
                    <CalcStep key={zone} label={<>Zone C</>}
                      formula={`w_{\\mathrm{net},C} = \\text{not applicable}`} result={<></>} />
                  )
                  const cpe = getCpeWalls(hd, zone, loadedArea)
                  const wmax = qp * (cpe - cpiMax)
                  const wmin = qp * (cpe - cpiMin)
                  return (
                    <CalcStep key={zone}
                      label={<>Zone {zone} — <Tex>{`c_{pe,${zone}} = ${cpe.toFixed(3)}`}</Tex></>}
                      formula={`\\begin{aligned}w_{\\mathrm{net},${zone}}(c_{pi,\\max}) &= ${qp.toFixed(4)} \\cdot (${cpe.toFixed(3)} - ${cpiMax}) = ${wmax.toFixed(4)}\\ \\mathrm{kN/m^2}\\\\w_{\\mathrm{net},${zone}}(c_{pi,\\min}) &= ${qp.toFixed(4)} \\cdot (${cpe.toFixed(3)} - (${cpiMin})) = ${wmin.toFixed(4)}\\ \\mathrm{kN/m^2}\\end{aligned}`}
                      result={<></>}
                    />
                  )
                })}
              </DetailGroup>

              <DetailGroup title={t('std_ec1w_det_add_notes')}>
                <ul style={{ fontSize: 12, color: '#374151', lineHeight: 1.75, margin: 0, paddingLeft: 18 }}>
                  <li>{t('std_ec1w_det_note_openings')}</li>
                  <li>{t('std_ec1w_det_note_lack_corr')}</li>
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
