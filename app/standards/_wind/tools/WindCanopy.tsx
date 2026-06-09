'use client'
import React from 'react'
import { TheoryBlock, NumInput, Table, TR, ResultRow, ResultsBox, DetailsSection, DetailGroup, CalcStep, InputDataTable, InputDataRow, Tex, TableRef , LabelTip } from '../../_lib/ui'
import { TH, TD, TDN, FORMULA_BOX, WIND_SECTION, INPUT_GRID, INPUT_STYLE, LABEL_STYLE, ZONE_PILL, WIND_IMG } from '../../_lib/ui-styles'
import { calcPeakPressure, getCanopyMono, getCanopyDuo } from '../../_lib/wind-helpers'
import { TERRAIN_CATS } from '../../_lib/wind-types'
import { Table76, Table77, Table41 } from '../WindTables'
import { WindPrimaryInputs, WindSecondaryInputs, INPUT_DIVIDER } from '../WindShared'

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
  const qpResult = calcPeakPressure(vb, cH, cat, c0, rho)
  const { kr, cr, vm, Iv, qp } = qpResult
  const cp = getCanopyMono(canopyAlpha, phi)
  const alphaRad = canopyAlpha * Math.PI / 180
  const dPrime = cD / Math.cos(alphaRad)
  const Aref = cB * dPrime
  const Fw_max = cscd * cp.cf_max * qp * Aref
  const Fw_min = cscd * cp.cf_min * qp * Aref
  return (
    <div style={WIND_SECTION}>
      <TheoryBlock>
        <p><strong>EN 1991-1-4 §7.3</strong> — Canopies are free-standing roofs of negligible solidity without permanent side enclosures (e.g. petrol stations, bus shelters, agricultural barns). Wind acts on both upper and lower surfaces simultaneously.</p>
        <p><strong>Blockage factor φ</strong>: ratio of the area of blockage under the canopy (stored goods, vehicles, equipment) to the total cross-sectional area under the canopy facing the wind. φ = 0 means empty/open; φ = 1 means fully blocked (storage to ceiling height). Blockage significantly alters the pressure distribution.</p>
        <img src={WIND_IMG.canopyBlock} alt="Canopy blockage factor" style={{ width: '100%', maxWidth: 340, borderRadius: 6, margin: '6px 0', display: 'block' }} />
        <p><strong>Net pressure coefficient c<sub>p,net</sub></strong>: represents the combined (net) effect on the upper AND lower canopy surface. Two values are tabulated — c<sub>p,net,max</sub> (maximum downward / positive pressure) and c<sub>p,net,min</sub> (maximum uplift).</p>
        <img src={WIND_IMG.canopyMono} alt="Monopitch canopy pressure zones" style={{ width: '100%', maxWidth: 480, borderRadius: 6, margin: '6px 0', display: 'block' }} />
        <p><strong>Zones A, B, C</strong> (EN 1991-1-4 Table 7.6): Zone C extends d'/10 from the windward and leeward edges (where d' = d/cos α is the sloped depth). Zone B extends b/10 from the side edges. Zone A is the remaining central region.</p>
        <p><strong>Overall force:</strong> F<sub>w</sub> = c<sub>s</sub>c<sub>d</sub> · c<sub>f</sub> · q<sub>p</sub> · A<sub>ref</sub>, where A<sub>ref</sub> = b × d' = b × d/cos(α) (sloped area) and c<sub>f</sub> is the global force coefficient from Table 7.6.</p>
      </TheoryBlock>
      <div style={FORMULA_BOX}>
        <strong>EN 1991-1-4 §7.3 Table 7.6</strong> — Monopitch canopy (0°≤α≤30°).<br />
        φ = blockage (0=empty, 1=blocked) &nbsp;|&nbsp; F<sub>w</sub> = c<sub>s</sub>c<sub>d</sub>·c<sub>f</sub>·q<sub>p</sub>·A<sub>ref</sub>, A<sub>ref</sub> = b·d/cos(α)
      </div>
      <WindPrimaryInputs vb={vb} setVb={setVb} cat={cat} setCat={setCat} />
      <div style={INPUT_GRID}>
        <div>
          <LabelTip tip={"Height of the canopy roof above ground level. Used as the reference height $z_e$ for computing $q_p(z_e)$. For canopies, $z_e = h$ per EN 1991-1-4 §7.3."}>h — canopy height above ground (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={1} step={0.5} value={cH} onChange={setCH} />
        </div>
        <div>
          <LabelTip tip={"Canopy roof pitch angle from horizontal. Range 0°–30° for monopitch canopies. The net pressure coefficients $c_{p,net}$ are read from EN 1991-1-4 Table 7.6 and interpolated between tabulated angles."}>α — pitch angle (°)</LabelTip>
          <NumInput style={INPUT_STYLE} min={0} max={30} step={1} value={canopyAlpha} onChange={setCanopyAlpha} />
        </div>
        <div>
          <LabelTip tip={"Canopy plan dimension in the wind direction. The sloped reference area is $A_{ref} = b \\times d/\\cos\\alpha$. Zone C extends $d'/10$ from each edge where $d' = d/\\cos\\alpha$."}>d — depth parallel to wind (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={1} step={0.5} value={cD} onChange={setCD} />
        </div>
        <div>
          <LabelTip tip={"Canopy plan dimension perpendicular to wind. Zone B extends $b/10$ from the side edges. The reference area is $A_{ref} = b \\times d'$."}>b — width (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={1} step={0.5} value={cB} onChange={setCB} />
        </div>
        <div>
          <LabelTip tip={"Ratio of the blocked area (goods, vehicles) under the canopy to the total cross-sectional area facing the wind. $\\varphi=0$: completely empty/open. $\\varphi=1$: fully blocked to ceiling height. Blockage significantly increases uplift forces. See EN 1991-1-4 §7.3 Figure 7.16."}>φ — blockage ratio (0–1)</LabelTip>
          <NumInput style={INPUT_STYLE} min={0} max={1} step={0.1} value={phi} onChange={setPhi} />
        </div>
      </div>
      <hr style={INPUT_DIVIDER} />
      <div style={INPUT_GRID}>
        <div>
          <LabelTip tip={"Structural factor $c_s c_d$ per EN 1991-1-4 §6. A value of 1.0 is generally conservative for canopies not susceptible to dynamic effects. For dynamically sensitive structures with natural frequency $< 1\\ \\mathrm{Hz}$, a detailed calculation is needed."}>c<sub>s</sub>c<sub>d</sub> — structural factor</LabelTip>
          <NumInput style={INPUT_STYLE} min={0.5} max={1.5} step={0.05} value={cscd} onChange={setCscd} />
        </div>
      </div>
      <WindSecondaryInputs c0={c0} setC0={setC0} rho={rho} setRho={setRho} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <img src={WIND_IMG.canopyMono} alt="Monopitch canopy wind pressure zones A, B, C" style={{ width: '100%', maxWidth: 560, borderRadius: 6, display: 'block' }} />
        <ResultsBox title="Results">
          <ResultRow
            label={<>F<sub>w</sub> max — total downward wind force</>}
            value={Fw_max.toFixed(3)} unit="kN"
            onClick={() => document.getElementById('canym-details')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          />
          <ResultRow label={<>F<sub>w</sub> min — total uplift wind force</>} value={Fw_min.toFixed(3)} unit="kN" />
          <div style={{ fontSize: 12, color: '#1e293b', margin: '4px 0 2px' }}>
            Overall force coefficient: c<sub>f</sub> = <span style={{ color: '#dc2626', fontWeight: 600 }}>{cp.cf_min.toFixed(3)}</span> or <span style={{ color: '#dc2626', fontWeight: 600 }}>+{cp.cf_max.toFixed(3)}</span>
            &nbsp;|&nbsp; Eccentricity: e = 0.25·d' = <strong>{(0.25 * dPrime).toFixed(3)} m</strong> from windward edge
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

              <DetailGroup title="Input Data">
                <InputDataTable>
                  <InputDataRow param={<>Terrain category — <TableRef label="Table 4.1" renderTable={() => <Table41 />} /></>} symbol={<Tex>{'\\text{Cat.}'}</Tex>} value={`Cat. ${cat} — z₀=${z0} m, zmin=${zmin} m`} />
                  <InputDataRow param="Basic wind velocity" symbol={<Tex>{'v_b'}</Tex>} value={vb.toFixed(2)} unit="m/s" />
                  <InputDataRow param="Orography factor" symbol={<Tex>{'c_0(z_e)'}</Tex>} value={c0.toFixed(2)} />
                  <InputDataRow param="Air density" symbol={<Tex>{'\\rho'}</Tex>} value={rho.toFixed(2)} unit="kg/m³" />
                  <InputDataRow param="Canopy height above ground" symbol={<Tex>{'h'}</Tex>} value={cH.toFixed(2)} unit="m" />
                  <InputDataRow param="Plan depth (wind direction)" symbol={<Tex>{'d'}</Tex>} value={cD.toFixed(2)} unit="m" />
                  <InputDataRow param="Plan width (crosswind)" symbol={<Tex>{'b'}</Tex>} value={cB.toFixed(2)} unit="m" />
                  <InputDataRow param={<>Pitch angle — <TableRef label="Table 7.6" renderTable={() => <Table76 />} note="— monopitch canopy cf and cp,net" /></>} symbol={<Tex>{'\\alpha'}</Tex>} value={`${canopyAlpha}°`} />
                  <InputDataRow param="Blockage ratio" symbol={<Tex>{'\\varphi'}</Tex>} value={phi.toFixed(2)} />
                  <InputDataRow param="Structural factor" symbol={<Tex>{'c_s c_d'}</Tex>} value={cscd.toFixed(2)} />
                  <InputDataRow param="Eccentricity of centre of pressure from windward edge" symbol={<Tex>{"e/d'"}</Tex>} value="0.25" />
                </InputDataTable>
              </DetailGroup>

              <DetailGroup title="Reference height">
                <p style={P}>
                  The reference height for the wind action z<sub>e</sub> is equal to the maximum height above ground of the canopy roof h, as specified in EN 1991-1-4 §7.3(8). Therefore:
                </p>
                <CalcStep
                  label={<>Reference height <Tex>{'z_e'}</Tex> (EN 1991-1-4 §7.3(8))</>}
                  formula={`z_e = h = ${cH.toFixed(3)}\\ \\mathrm{m}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title="Reference area of the sloped canopy">
                <p style={P}>
                  The reference area for the wind action A<sub>ref</sub> is equal to the area of the sloped face of the monopitch canopy roof. It is calculated from the plan dimensions b and d by taking into account the inclination of the sloped roof surface with angle α. Therefore:
                </p>
                <CalcStep
                  label={<>Inclined depth <Tex>{"d'"}</Tex></>}
                  formula={`d' = \\frac{d}{\\cos\\alpha} = \\frac{${cD.toFixed(3)}\\ \\mathrm{m}}{\\cos(${canopyAlpha}°)} = \\frac{${cD.toFixed(3)}}{${Math.cos(alphaRad).toFixed(4)}} = ${dPrime.toFixed(3)}\\ \\mathrm{m}`}
                  result={<></>}
                />
                <CalcStep
                  label={<>Reference area <Tex>{'A_{\\mathrm{ref}}'}</Tex></>}
                  formula={`A_{\\mathrm{ref}} = b \\cdot \\frac{d}{\\cos\\alpha} = ${cB.toFixed(3)}\\ \\mathrm{m} \\cdot ${dPrime.toFixed(3)}\\ \\mathrm{m} = ${Aref.toFixed(3)}\\ \\mathrm{m^2}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title="Basic wind velocity">
                <p style={P}>
                  The basic wind velocity v<sub>b</sub> is defined in EN 1991-1-4 §4.2(2)P as a function of the wind direction and time of year at 10 m above ground of terrain Category II. The value of v<sub>b</sub> includes the effects of the directional factor c<sub>dir</sub> and the seasonal factor c<sub>season</sub> and it is provided in the National Annex. In these calculations the basic wind velocity is taken as:
                </p>
                <CalcStep
                  label="Basic wind velocity"
                  formula={`v_b = ${vb.toFixed(2)}\\ \\mathrm{m/s}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title="Terrain roughness">
                <p style={P}>
                  The roughness length z<sub>0</sub> and the minimum height z<sub>min</sub> are specified in EN 1991-1-4 Table 4.1 as a function of the terrain category. For terrain category <strong>{cat}</strong> the corresponding values are: z<sub>0</sub> = {z0} m and z<sub>min</sub> = {zmin} m.
                </p>
                <p style={P}>
                  The terrain factor k<sub>r</sub> depending on the roughness length z<sub>0</sub> = {z0} m is calculated in accordance with EN 1991-1-4 equation (4.5):
                </p>
                <CalcStep
                  label={<>Terrain factor <Tex>{'k_r'}</Tex> (EN 1991-1-4 §4.5 Eq. 4.5)</>}
                  formula={`k_r = 0.19 \\cdot \\left(\\dfrac{z_0}{z_{0,\\mathrm{II}}}\\right)^{0.07} = 0.19 \\cdot \\left(\\dfrac{${z0}\\ \\mathrm{m}}{0.050\\ \\mathrm{m}}\\right)^{0.07} = ${kr.toFixed(4)}`}
                  result={<></>}
                />
                <p style={P}>
                  The roughness factor c<sub>r</sub>(z<sub>e</sub>) at the reference height z<sub>e</sub> accounts for the variability of the mean wind velocity at the site. It is calculated in accordance with EN 1991-1-4 equation (4.4). For the examined case z<sub>e</sub> {cH >= zmin ? '≥' : '<'} z<sub>min</sub>:
                </p>
                <CalcStep
                  label={<>Roughness factor <Tex>{'c_r(z_e)'}</Tex> (EN 1991-1-4 §4.5 Eq. 4.4)</>}
                  formula={`c_r(z_e) = k_r \\cdot \\ln\\!\\left(\\frac{\\max(z_e,\\,z_{\\min})}{z_0}\\right) = ${kr.toFixed(4)} \\cdot \\ln\\!\\left(\\frac{\\max(${cH.toFixed(3)}\\ \\mathrm{m},\\,${zmin}\\ \\mathrm{m})}{${z0}\\ \\mathrm{m}}\\right) = ${cr.toFixed(4)}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title="Orography factor">
                <p style={P}>
                  Where orography (e.g. hills, cliffs etc.) is significant its effect on wind velocities should be taken into account using an orography factor c<sub>0</sub>(z<sub>e</sub>) different from 1.0, as specified in EN 1991-1-4 §4.3.3. In these calculations the orography factor is considered as:
                </p>
                <CalcStep
                  label="Orography factor"
                  formula={`c_0(z_e) = ${c0.toFixed(3)}`}
                  result={<></>}
                  note={c0 === 1.0 ? 'c₀ = 1.0 — flat terrain, no orography correction.' : `c₀ = ${c0.toFixed(3)} — site-specific orography per EN 1991-1-4 §4.3.3.`}
                />
              </DetailGroup>

              <DetailGroup title="Mean wind velocity">
                <p style={P}>
                  The mean wind velocity v<sub>m</sub>(z<sub>e</sub>) at reference height z<sub>e</sub> depends on the terrain roughness, terrain orography and the basic wind velocity v<sub>b</sub>. It is determined using EN 1991-1-4 equation (4.3):
                </p>
                <CalcStep
                  label={<>Mean wind velocity <Tex>{'v_m(z_e)'}</Tex> (EN 1991-1-4 §4.3 Eq. 4.3)</>}
                  formula={`v_m(z_e) = c_r(z_e) \\cdot c_0(z_e) \\cdot v_b = ${cr.toFixed(4)} \\cdot ${c0.toFixed(3)} \\cdot ${vb.toFixed(2)}\\ \\mathrm{m/s} = ${vm.toFixed(2)}\\ \\mathrm{m/s}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title="Wind turbulence">
                <p style={P}>
                  The turbulence intensity I<sub>v</sub>(z<sub>e</sub>) at reference height z<sub>e</sub> is defined as the standard deviation of the turbulence divided by the mean wind velocity. It is calculated in accordance with EN 1991-1-4 equation (4.7). For the examined case z<sub>e</sub> {cH >= zmin ? '≥' : '<'} z<sub>min</sub>:
                </p>
                <CalcStep
                  label={<>Turbulence intensity <Tex>{'I_v(z_e)'}</Tex> (EN 1991-1-4 §4.4 Eq. 4.7)</>}
                  formula={`I_v(z_e) = \\frac{k_I}{c_0(z_e) \\cdot \\ln\\!\\left(\\dfrac{\\max(z_e,\\,z_{\\min})}{z_0}\\right)} = \\frac{1.000}{${c0.toFixed(3)} \\cdot \\ln\\!\\left(\\dfrac{\\max(${cH.toFixed(3)}\\ \\mathrm{m},\\,${zmin}\\ \\mathrm{m})}{${z0}\\ \\mathrm{m}}\\right)} = ${Iv.toFixed(4)}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title="Basic velocity pressure">
                <p style={P}>
                  The basic velocity pressure q<sub>b</sub> is the pressure corresponding to the wind momentum determined at the basic wind velocity v<sub>b</sub>. It is calculated according to EN 1991-1-4 §4.5(1):
                </p>
                <CalcStep
                  label={<>Basic velocity pressure <Tex>{'q_b'}</Tex> (EN 1991-1-4 §4.5(1))</>}
                  formula={`q_b = \\tfrac{1}{2} \\cdot \\rho \\cdot v_b^2 = \\tfrac{1}{2} \\cdot ${rho.toFixed(2)}\\ \\mathrm{kg/m^3} \\cdot (${vb.toFixed(2)}\\ \\mathrm{m/s})^2 = ${(qb*1000).toFixed(0)}\\ \\mathrm{N/m^2} = ${qb.toFixed(4)}\\ \\mathrm{kN/m^2}`}
                  result={<></>}
                  note="Note that by definition 1 N = 1 kg·m/s²."
                />
              </DetailGroup>

              <DetailGroup title="Peak velocity pressure">
                <p style={P}>
                  The peak velocity pressure q<sub>p</sub>(z<sub>e</sub>) at reference height z<sub>e</sub> includes mean and short-term velocity fluctuations. It is determined according to EN 1991-1-4 equation (4.8):
                </p>
                <CalcStep
                  label={<>Peak velocity pressure <Tex>{'q_p(z_e)'}</Tex> (EN 1991-1-4 §4.5 Eq. 4.8)</>}
                  formula={`q_p(z_e) = (1 + 7 \\cdot I_v(z_e)) \\cdot \\tfrac{1}{2} \\cdot \\rho \\cdot v_m(z_e)^2 = (1 + 7 \\cdot ${Iv.toFixed(4)}) \\cdot \\tfrac{1}{2} \\cdot ${rho.toFixed(2)}\\ \\mathrm{kg/m^3} \\cdot (${vm.toFixed(2)}\\ \\mathrm{m/s})^2 = ${(qp*1000).toFixed(0)}\\ \\mathrm{N/m^2}`}
                  result={<></>}
                  note="Note that by definition 1 N = 1 kg·m/s²."
                />
                <CalcStep
                  label=""
                  formula={`\\Rightarrow q_p(z_e) = ${qp.toFixed(4)}\\ \\mathrm{kN/m^2}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title="Net pressure coefficients">
                <p style={P}>
                  The net pressure coefficients c<sub>p,net</sub> represent the maximum local pressure for all wind directions and they should be used in the design of local elements such as roofing elements and fixings. Net pressure coefficients are given for three zones A, B, C as defined in EN 1991-1-4 Table 7.6. Zone C corresponds to the regions parallel to the windward and leeward edges having width d'/10. Zone B corresponds to the regions parallel to the side edges having width b/10. Zone A corresponds to the remaining central region.
                </p>
                <CalcStep
                  label={<>Inclined depth <Tex>{"d'"}</Tex> — zone C width</>}
                  formula={`\\frac{d'}{10} = \\frac{${dPrime.toFixed(3)}\\ \\mathrm{m}}{10} = ${(dPrime/10).toFixed(3)}\\ \\mathrm{m}`}
                  result={<></>}
                />
                <CalcStep
                  label={<>Zone B width</>}
                  formula={`\\frac{b}{10} = \\frac{${cB.toFixed(3)}\\ \\mathrm{m}}{10} = ${(cB/10).toFixed(3)}\\ \\mathrm{m}`}
                  result={<></>}
                />
                <p style={P}>
                  The net pressure coefficient c<sub>p,net</sub> for each of zones A, B, C is defined in EN 1991-1-4 Table 7.6 as a function of the roof angle α and the blockage factor φ. For the examined case: α = {canopyAlpha.toFixed(2)}° and φ = {phi.toFixed(3)}. Negative values correspond to suction (uplift). Both positive and negative values should be considered for each zone:
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

              <DetailGroup title="Net wind pressure on pressure zones">
                <p style={P}>
                  The net wind pressure on the surfaces of the structure w<sub>net</sub> corresponds to the combined effects of external wind pressure and internal wind pressure. For structural surfaces consisting of only one skin:
                </p>
                <CalcStep
                  label=""
                  formula={`w_{\\mathrm{net}} = c_{p,\\mathrm{net}} \\cdot q_p(z_e)`}
                  result={<></>}
                />
                <p style={P}>
                  For the different pressure zones on the monopitch canopy roof the following net pressures are obtained:
                </p>
                {(['A', 'B', 'C'] as const).map(zone => {
                  const mx = (cp as any)[`cp${zone}_max`] as number
                  const mn = (cp as any)[`cp${zone}_min`] as number
                  return (
                    <CalcStep key={zone}
                      label={<>Zone {zone}</>}
                      formula={`\\begin{aligned}
w_{\\mathrm{net},\\min} &= c_{p,\\mathrm{net},\\min} \\cdot q_p = ${mn.toFixed(3)} \\cdot ${qp.toFixed(4)} = ${(qp*mn).toFixed(4)}\\ \\mathrm{kN/m^2} \\\\
w_{\\mathrm{net},\\max} &= c_{p,\\mathrm{net},\\max} \\cdot q_p = +${mx.toFixed(3)} \\cdot ${qp.toFixed(4)} = +${(qp*mx).toFixed(4)}\\ \\mathrm{kN/m^2}
\\end{aligned}`}
                      result={<></>}
                    />
                  )
                })}
                <p style={P}>
                  Zone A is the remaining central region located more than d'/10 = {(dPrime/10).toFixed(3)} m or b/10 = {(cB/10).toFixed(3)} m from the edges. Zone B extends up to b/10 = {(cB/10).toFixed(3)} m from the side edges. Zone C extends up to d'/10 = {(dPrime/10).toFixed(3)} m from the windward and leeward edges. Negative values correspond to uplift. Both positive and negative values should be considered.
                </p>
              </DetailGroup>

              <DetailGroup title="Overall pressure coefficient">
                <p style={P}>
                  The overall pressure coefficient c<sub>f</sub> represents the overall wind force and it should be used in the design of the overall load bearing structure. The overall pressure coefficient c<sub>f</sub> is defined in EN 1991-1-4 Table 7.6 as a function of the roof angle α and the blockage factor φ. For the examined case: α = {canopyAlpha.toFixed(2)}° and φ = {phi.toFixed(3)}. Negative values correspond to uplift:
                </p>
                <CalcStep
                  label={<>Overall force coefficient <Tex>{'c_f'}</Tex> (EN 1991-1-4 Table 7.6)</>}
                  formula={`c_f = ${cp.cf_min.toFixed(3)}\\text{ (uplift) or }+${cp.cf_max.toFixed(3)}\\text{ (downward)}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title="Structural factor">
                <p style={P}>
                  The structural factor c<sub>s</sub>c<sub>d</sub> takes into account the structure size effects from the non-simultaneous occurrence of peak wind pressures on the surface and the dynamic effects of structural vibrations due to turbulence. The structural factor c<sub>s</sub>c<sub>d</sub> is determined in accordance with EN 1991-1-4 Section 6. A value of c<sub>s</sub>c<sub>d</sub> = 1.0 is generally conservative for small structures not susceptible to wind turbulence effects such as buildings with height less than 15 m. In these calculations:
                </p>
                <CalcStep
                  label="Structural factor"
                  formula={`c_s c_d = ${cscd.toFixed(3)}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title="Overall wind force (for total roof surface)">
                <p style={P}>
                  The wind force F<sub>w</sub> corresponding to the overall wind effect on the canopy roof is calculated in accordance with EN 1991-1-4 equation (5.3):
                </p>
                <CalcStep
                  label=""
                  formula={`F_w = c_s c_d \\cdot c_f \\cdot A_{\\mathrm{ref}} \\cdot q_p(z_e)`}
                  result={<></>}
                  note={`Aref = ${Aref.toFixed(3)} m² is the reference wind area of the canopy roof.`}
                />
                <p style={P}>Maximum overall wind force (acting downwards):</p>
                <CalcStep
                  label={<><Tex>{'F_{w,\\max}'}</Tex> — downward</>}
                  formula={`F_{w,\\max} = c_s c_d \\cdot c_{f,\\max} \\cdot A_{\\mathrm{ref}} \\cdot q_p = ${cscd.toFixed(3)} \\cdot (+${cp.cf_max.toFixed(3)}) \\cdot ${Aref.toFixed(3)}\\ \\mathrm{m^2} \\cdot ${qp.toFixed(4)}\\ \\mathrm{kN/m^2} = +${Fw_max.toFixed(3)}\\ \\mathrm{kN}`}
                  result={<></>}
                />
                <p style={P}>Minimum overall wind force (acting upwards):</p>
                <CalcStep
                  label={<><Tex>{'F_{w,\\min}'}</Tex> — uplift</>}
                  formula={`F_{w,\\min} = c_s c_d \\cdot c_{f,\\min} \\cdot A_{\\mathrm{ref}} \\cdot q_p = ${cscd.toFixed(3)} \\cdot (${cp.cf_min.toFixed(3)}) \\cdot ${Aref.toFixed(3)}\\ \\mathrm{m^2} \\cdot ${qp.toFixed(4)}\\ \\mathrm{kN/m^2} = ${Fw_min.toFixed(3)}\\ \\mathrm{kN}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title="Direction and eccentricity of the overall wind force">
                <p style={P}>
                  According to EN 1991-1-4 §7.3(6) the location of the centre of pressure is defined at an eccentricity e from the windward edge. In this calculation the centre of pressure is considered at an eccentricity e = 0.25·d' from the windward edge, where d' = {dPrime.toFixed(3)} m is the inclined length of the canopy roof parallel to the wind direction. Two cases should be examined:
                </p>
                <CalcStep
                  label={<>Eccentricity <Tex>{"e = 0.25 \\cdot d'"}</Tex></>}
                  formula={`e = 0.25 \\cdot d' = 0.25 \\cdot ${dPrime.toFixed(3)}\\ \\mathrm{m} = ${ecc.toFixed(3)}\\ \\mathrm{m}\\text{ from windward edge}`}
                  result={<></>}
                />
                <p style={P}>
                  Maximum force F<sub>w</sub> = +{Fw_max.toFixed(3)} kN (acting downwards) located at e = {ecc.toFixed(3)} m from the windward edge.
                  Minimum force F<sub>w</sub> = {Fw_min.toFixed(3)} kN (acting upwards) located at e = {ecc.toFixed(3)} m from the windward edge.
                </p>
              </DetailGroup>

              <DetailGroup title="Additional notes">
                <ul style={{ fontSize: 12, color: '#374151', lineHeight: 1.75, margin: 0, paddingLeft: 18 }}>
                  <li>Horizontal wind friction forces should be considered in accordance with EN 1991-1-4 §7.5.</li>
                  <li>For roofs with permanent walls see EN 1991-1-4 §7.2 and the relevant calculation Wind load on monopitch roofs.</li>
                  <li>The calculated wind action effects are characteristic values (unfactored). Appropriate load factors should be applied for the relevant design situation. For ULS verifications the partial load factor γ<sub>Q</sub> = 1.50 is applicable for variable actions according to EN 1990.</li>
                </ul>
              </DetailGroup>
            </>)
          })()}
        </DetailsSection>
      </div>
    </div>
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
  const qpResult = calcPeakPressure(vb, cH, cat, c0, rho)
  const { kr, cr, vm, Iv, qp } = qpResult
  const cp = getCanopyDuo(canopyAlpha, phi)
  const alphaRad = Math.abs(canopyAlpha) * Math.PI / 180
  const dPrime = cD / Math.cos(alphaRad)
  const Aref = cB * (cD / 2) / Math.cos(alphaRad)
  const Fw_max = cscd * cp.cf_max * qp * Aref
  const Fw_min = cscd * cp.cf_min * qp * Aref
  return (
    <div style={WIND_SECTION}>
      <TheoryBlock>
        <p><strong>EN 1991-1-4 §7.3</strong> — Duopitch canopies are free-standing roofs without permanent walls, slope −20° ≤ α ≤ 30°. Wind acts on both upper and lower surfaces simultaneously.</p>
        <p><strong>Blockage factor φ</strong>: ratio of blocked cross-sectional area under the canopy to the total free area. φ = 0 (empty), φ = 1 (fully blocked). Downwind of the position of maximum blockage, φ = 0 should be used per §7.3(4).</p>
        <img src={WIND_IMG.canopyBlock} alt="Canopy blockage factor" style={{ width: '100%', maxWidth: 340, borderRadius: 6, margin: '6px 0', display: 'block' }} />
        <p><strong>Zones A, B, C, D</strong> (EN 1991-1-4 Table 7.7): Zone C extends d'/10 from the windward/leeward edges. Zone B extends b/10 from the side edges. Zone D extends ±d'/10 from the central ridge. Zone A is the remaining area on each sloped face.</p>
        <p><strong>Reference area</strong>: A<sub>ref</sub> = b·(d/2)/cos(α) — the area of <em>each</em> sloped face. The overall force F<sub>w</sub> applies per sloped face.</p>
      </TheoryBlock>
      <div style={FORMULA_BOX}>
        <strong>EN 1991-1-4 §7.3 Table 7.7</strong> — Duopitch canopy (−20°≤α≤30°).<br />
        φ = blockage (0=empty, 1=blocked) &nbsp;|&nbsp; F<sub>w</sub> = c<sub>s</sub>c<sub>d</sub>·c<sub>f</sub>·q<sub>p</sub>·A<sub>ref</sub> (per sloped face), A<sub>ref</sub> = b·(d/2)/cos(α)
      </div>
      <WindPrimaryInputs vb={vb} setVb={setVb} cat={cat} setCat={setCat} />
      <div style={INPUT_GRID}>
        <div>
          <LabelTip tip={"Height of the canopy ridge above ground level. Used as the reference height $z_e$ for $q_p$. See EN 1991-1-4 §7.3."}>h — canopy height above ground (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={1} step={0.5} value={cH} onChange={setCH} />
        </div>
        <div>
          <LabelTip tip={"Duopitch canopy slope angle. Negative $\\alpha$ = inverted (valley/trough) canopy. Range $-20°$ to $+30°$ per EN 1991-1-4 Table 7.7. Governs $c_{p,net}$ zone values via interpolation."}>α — pitch angle (°, −20 to +30)</LabelTip>
          <NumInput style={INPUT_STYLE} min={-20} max={30} step={1} value={canopyAlpha} onChange={setCanopyAlpha} />
        </div>
        <div>
          <LabelTip tip={"Total canopy plan depth in the wind direction (both slopes combined). Reference area per slope $= b \\times (d/2)/\\cos\\alpha$."}>d — depth parallel to wind (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={1} step={0.5} value={cD} onChange={setCD} />
        </div>
        <div>
          <LabelTip tip={"Canopy plan width perpendicular to wind. Zone B extends $b/10$ from the side edges. Used in $A_{ref} = b \\times (d/2)/\\cos\\alpha$ per sloped face."}>b — width (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={1} step={0.5} value={cB} onChange={setCB} />
        </div>
        <div>
          <LabelTip tip={"Ratio of blocked area under the canopy to total cross-sectional area facing wind. $\\varphi=0$: empty/open. $\\varphi=1$: fully blocked. Blockage significantly increases uplift in the windward zone. See EN 1991-1-4 §7.3 Figure 7.16."}>φ — blockage ratio (0–1)</LabelTip>
          <NumInput style={INPUT_STYLE} min={0} max={1} step={0.1} value={phi} onChange={setPhi} />
        </div>
      </div>
      <hr style={INPUT_DIVIDER} />
      <div style={INPUT_GRID}>
        <div>
          <LabelTip tip={"Structural factor $c_s c_d$ per EN 1991-1-4 §6. Use 1.0 for most canopy structures. A detailed evaluation is needed for dynamically sensitive or flexible canopies."}>c<sub>s</sub>c<sub>d</sub> — structural factor</LabelTip>
          <NumInput style={INPUT_STYLE} min={0.5} max={1.5} step={0.05} value={cscd} onChange={setCscd} />
        </div>
      </div>
      <WindSecondaryInputs c0={c0} setC0={setC0} rho={rho} setRho={setRho} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <img src={WIND_IMG.canopyDuo} alt="Duopitch canopy wind pressure zones A, B, C, D" style={{ width: '100%', maxWidth: 560, borderRadius: 6, display: 'block' }} />
        <ResultsBox title="Results">
          <ResultRow label={<>F<sub>w</sub> max — total downward wind force (per sloped face)</>} value={Fw_max.toFixed(3)} unit="kN" onClick={() => document.getElementById('canyd-details')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
          <ResultRow label={<>F<sub>w</sub> min — total uplift wind force (per sloped face)</>} value={Fw_min.toFixed(3)} unit="kN" />
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

              <DetailGroup title="Input Data">
                <InputDataTable>
                  <InputDataRow param={<>Terrain category — <TableRef label="Table 4.1" renderTable={() => <Table41 />} /></>} symbol={<Tex>{'\\text{Cat.}'}</Tex>} value={`Cat. ${cat} — z₀=${z0} m, zmin=${zmin} m`} />
                  <InputDataRow param="Basic wind velocity" symbol={<Tex>{'v_b'}</Tex>} value={vb.toFixed(2)} unit="m/s" />
                  <InputDataRow param="Orography factor" symbol={<Tex>{'c_0(z_e)'}</Tex>} value={c0.toFixed(2)} />
                  <InputDataRow param="Air density" symbol={<Tex>{'\\rho'}</Tex>} value={rho.toFixed(2)} unit="kg/m³" />
                  <InputDataRow param="Canopy height above ground (ridge)" symbol={<Tex>{'h'}</Tex>} value={cH.toFixed(2)} unit="m" />
                  <InputDataRow param="Plan depth (wind direction, total)" symbol={<Tex>{'d'}</Tex>} value={cD.toFixed(2)} unit="m" />
                  <InputDataRow param="Plan width (crosswind)" symbol={<Tex>{'b'}</Tex>} value={cB.toFixed(2)} unit="m" />
                  <InputDataRow param={<>Pitch angle — <TableRef label="Table 7.7" renderTable={() => <Table77 />} note="— duopitch canopy cf and cp,net" /></>} symbol={<Tex>{'\\alpha'}</Tex>} value={`${canopyAlpha}°`} />
                  <InputDataRow param="Blockage ratio" symbol={<Tex>{'\\varphi'}</Tex>} value={phi.toFixed(2)} />
                  <InputDataRow param="Structural factor" symbol={<Tex>{'c_s c_d'}</Tex>} value={cscd.toFixed(2)} />
                </InputDataTable>
              </DetailGroup>

              <DetailGroup title="Reference height">
                <p style={P}>
                  The reference height for the wind action z<sub>e</sub> is equal to the maximum height above ground of the canopy roof h (ridge height), as specified in EN 1991-1-4 §7.3(8). Therefore:
                </p>
                <CalcStep
                  label={<>Reference height <Tex>{'z_e'}</Tex> (EN 1991-1-4 §7.3(8))</>}
                  formula={`z_e = h = ${cH.toFixed(3)}\\ \\mathrm{m}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title="Reference area (per sloped face)">
                <p style={P}>
                  The reference area for the wind action A<sub>ref</sub> is equal to the area of each sloped face of the duopitch canopy roof. It is calculated from the plan dimensions b and d by taking into account the inclination of each sloped roof surface with angle α. Note that the reference area calculated below corresponds to each sloped face of the duopitch roof (i.e. half of the total roof area):
                </p>
                <CalcStep
                  label={<>Inclined total depth <Tex>{"d'"}</Tex></>}
                  formula={`d' = \\frac{d}{\\cos|\\alpha|} = \\frac{${cD.toFixed(3)}\\ \\mathrm{m}}{${Math.cos(alphaRad).toFixed(4)}} = ${dPrime.toFixed(3)}\\ \\mathrm{m}`}
                  result={<></>}
                />
                <CalcStep
                  label={<>Reference area per sloped face <Tex>{'A_{\\mathrm{ref}}'}</Tex></>}
                  formula={`A_{\\mathrm{ref}} = b \\cdot \\frac{d/2}{\\cos|\\alpha|} = ${cB.toFixed(3)}\\ \\mathrm{m} \\cdot \\frac{${(cD/2).toFixed(3)}\\ \\mathrm{m}}{${Math.cos(alphaRad).toFixed(4)}} = ${Aref.toFixed(3)}\\ \\mathrm{m^2}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title="Basic wind velocity">
                <p style={P}>
                  The basic wind velocity v<sub>b</sub> is defined in EN 1991-1-4 §4.2(2)P as a function of the wind direction and time of year at 10 m above ground of terrain Category II. In these calculations the basic wind velocity is taken as:
                </p>
                <CalcStep
                  label="Basic wind velocity"
                  formula={`v_b = ${vb.toFixed(2)}\\ \\mathrm{m/s}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title="Terrain roughness">
                <p style={P}>
                  The roughness length z<sub>0</sub> and the minimum height z<sub>min</sub> are specified in EN 1991-1-4 Table 4.1. For terrain category <strong>{cat}</strong>: z<sub>0</sub> = {z0} m and z<sub>min</sub> = {zmin} m.
                </p>
                <CalcStep
                  label={<>Terrain factor <Tex>{'k_r'}</Tex> (EN 1991-1-4 §4.5 Eq. 4.5)</>}
                  formula={`k_r = 0.19 \\cdot \\left(\\dfrac{z_0}{z_{0,\\mathrm{II}}}\\right)^{0.07} = 0.19 \\cdot \\left(\\dfrac{${z0}\\ \\mathrm{m}}{0.050\\ \\mathrm{m}}\\right)^{0.07} = ${kr.toFixed(4)}`}
                  result={<></>}
                />
                <p style={P}>
                  For the examined case z<sub>e</sub> {cH >= zmin ? '≥' : '<'} z<sub>min</sub>:
                </p>
                <CalcStep
                  label={<>Roughness factor <Tex>{'c_r(z_e)'}</Tex> (EN 1991-1-4 §4.5 Eq. 4.4)</>}
                  formula={`c_r(z_e) = k_r \\cdot \\ln\\!\\left(\\frac{\\max(z_e,\\,z_{\\min})}{z_0}\\right) = ${kr.toFixed(4)} \\cdot \\ln\\!\\left(\\frac{\\max(${cH.toFixed(3)}\\ \\mathrm{m},\\,${zmin}\\ \\mathrm{m})}{${z0}\\ \\mathrm{m}}\\right) = ${cr.toFixed(4)}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title="Orography factor">
                <p style={P}>
                  Where orography is significant, the orography factor c<sub>0</sub>(z<sub>e</sub>) is determined per EN 1991-1-4 §4.3.3. In these calculations:
                </p>
                <CalcStep
                  label="Orography factor"
                  formula={`c_0(z_e) = ${c0.toFixed(3)}`}
                  result={<></>}
                  note={c0 === 1.0 ? 'c₀ = 1.0 — flat terrain, no orography correction.' : `c₀ = ${c0.toFixed(3)} — site-specific orography per EN 1991-1-4 §4.3.3.`}
                />
              </DetailGroup>

              <DetailGroup title="Mean wind velocity">
                <CalcStep
                  label={<>Mean wind velocity <Tex>{'v_m(z_e)'}</Tex> (EN 1991-1-4 §4.3 Eq. 4.3)</>}
                  formula={`v_m(z_e) = c_r(z_e) \\cdot c_0(z_e) \\cdot v_b = ${cr.toFixed(4)} \\cdot ${c0.toFixed(3)} \\cdot ${vb.toFixed(2)}\\ \\mathrm{m/s} = ${vm.toFixed(2)}\\ \\mathrm{m/s}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title="Wind turbulence">
                <p style={P}>
                  For the examined case z<sub>e</sub> {cH >= zmin ? '≥' : '<'} z<sub>min</sub>:
                </p>
                <CalcStep
                  label={<>Turbulence intensity <Tex>{'I_v(z_e)'}</Tex> (EN 1991-1-4 §4.4 Eq. 4.7)</>}
                  formula={`I_v(z_e) = \\frac{k_I}{c_0(z_e) \\cdot \\ln\\!\\left(\\dfrac{\\max(z_e,\\,z_{\\min})}{z_0}\\right)} = \\frac{1.000}{${c0.toFixed(3)} \\cdot \\ln\\!\\left(\\dfrac{\\max(${cH.toFixed(3)}\\ \\mathrm{m},\\,${zmin}\\ \\mathrm{m})}{${z0}\\ \\mathrm{m}}\\right)} = ${Iv.toFixed(4)}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title="Basic velocity pressure">
                <CalcStep
                  label={<>Basic velocity pressure <Tex>{'q_b'}</Tex> (EN 1991-1-4 §4.5(1))</>}
                  formula={`q_b = \\tfrac{1}{2} \\cdot \\rho \\cdot v_b^2 = \\tfrac{1}{2} \\cdot ${rho.toFixed(2)}\\ \\mathrm{kg/m^3} \\cdot (${vb.toFixed(2)}\\ \\mathrm{m/s})^2 = ${(qb*1000).toFixed(0)}\\ \\mathrm{N/m^2} = ${qb.toFixed(4)}\\ \\mathrm{kN/m^2}`}
                  result={<></>}
                  note="Note that by definition 1 N = 1 kg·m/s²."
                />
              </DetailGroup>

              <DetailGroup title="Peak velocity pressure">
                <p style={P}>
                  The peak velocity pressure q<sub>p</sub>(z<sub>e</sub>) is determined according to EN 1991-1-4 equation (4.8):
                </p>
                <CalcStep
                  label={<>Peak velocity pressure <Tex>{'q_p(z_e)'}</Tex> (EN 1991-1-4 §4.5 Eq. 4.8)</>}
                  formula={`q_p(z_e) = (1 + 7 \\cdot I_v(z_e)) \\cdot \\tfrac{1}{2} \\cdot \\rho \\cdot v_m(z_e)^2 = (1 + 7 \\cdot ${Iv.toFixed(4)}) \\cdot \\tfrac{1}{2} \\cdot ${rho.toFixed(2)}\\ \\mathrm{kg/m^3} \\cdot (${vm.toFixed(2)}\\ \\mathrm{m/s})^2 = ${(qp*1000).toFixed(0)}\\ \\mathrm{N/m^2}`}
                  result={<></>}
                  note="Note that by definition 1 N = 1 kg·m/s²."
                />
                <CalcStep
                  label=""
                  formula={`\\Rightarrow q_p(z_e) = ${qp.toFixed(4)}\\ \\mathrm{kN/m^2}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title="Net pressure coefficients">
                <p style={P}>
                  The net pressure coefficients c<sub>p,net</sub> represent the maximum local pressure for all wind directions and they should be used in the design of local elements such as roofing elements and fixings. Net pressure coefficients are given for four zones A, B, C, D as defined in EN 1991-1-4 Table 7.7. Zones B and C extend at the sides of the canopy, Zone D extends along the ridge, and Zones A extend at the remaining area for each of the two sloped faces of the duopitch canopy.
                </p>
                <p style={P}>
                  The inclined length of the duopitch canopy roof (sum of both sloped faces) parallel to the wind direction is d' = {dPrime.toFixed(3)} m. Zone C corresponds to the regions parallel to the windward and leeward edges having width d'/10 = {(dPrime/10).toFixed(3)} m. Zone B corresponds to the regions parallel to the side edges having width b/10 = {(cB/10).toFixed(3)} m. Zone D corresponds to the region parallel to the ridge having width d'/10 = {(dPrime/10).toFixed(3)} m at each side of the ridge. Zone A corresponds to the remaining central region for each of the two sloped faces.
                </p>
                <p style={P}>
                  For the examined case α = {canopyAlpha.toFixed(2)}° and φ = {phi.toFixed(3)}, from EN 1991-1-4 Table 7.7 with linear interpolation where appropriate:
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

              <DetailGroup title="Net wind pressure on pressure zones">
                <p style={P}>
                  The net wind pressure on the surfaces of the structure w<sub>net</sub> corresponds to the combined effects of external wind pressure and internal wind pressure. For structural surfaces consisting of only one skin:
                </p>
                <CalcStep
                  label=""
                  formula={`w_{\\mathrm{net}} = c_{p,\\mathrm{net}} \\cdot q_p(z_e)`}
                  result={<></>}
                />
                <p style={P}>
                  For the different pressure zones on the canopy roof the following net pressures are obtained:
                </p>
                {(['A', 'B', 'C', 'D'] as const).map(zone => {
                  const mx = (cp as any)[`cp${zone}_max`] as number
                  const mn = (cp as any)[`cp${zone}_min`] as number
                  return (
                    <CalcStep key={zone}
                      label={<>Zone {zone}</>}
                      formula={`\\begin{aligned}
w_{\\mathrm{net},\\min} &= c_{p,\\mathrm{net},\\min} \\cdot q_p = ${mn.toFixed(3)} \\cdot ${qp.toFixed(4)} = ${(qp*mn).toFixed(4)}\\ \\mathrm{kN/m^2} \\\\
w_{\\mathrm{net},\\max} &= c_{p,\\mathrm{net},\\max} \\cdot q_p = +${mx.toFixed(3)} \\cdot ${qp.toFixed(4)} = +${(qp*mx).toFixed(4)}\\ \\mathrm{kN/m^2}
\\end{aligned}`}
                      result={<></>}
                    />
                  )
                })}
                <p style={P}>
                  Zone A is the remaining central region of the two sloped faces located more than d'/10 = {(dPrime/10).toFixed(3)} m or b/10 = {(cB/10).toFixed(3)} m from the edges and the central ridge. Zone B extends up to b/10 = {(cB/10).toFixed(3)} m from the side edges. Zone C extends up to d'/10 = {(dPrime/10).toFixed(3)} m from the windward and leeward edges. Zone D extends up to ±d'/10 = {(dPrime/10).toFixed(3)} m from the central ridge. Negative values correspond to uplift. Both positive and negative values should be considered.
                </p>
              </DetailGroup>

              <DetailGroup title="Overall pressure coefficient">
                <p style={P}>
                  The overall pressure coefficient c<sub>f</sub> represents the overall wind force and it should be used in the design of the overall load bearing structure. The overall pressure coefficient c<sub>f</sub> is defined in EN 1991-1-4 Table 7.7 as a function of the roof angle α and the blockage factor φ. For the examined case α = {canopyAlpha.toFixed(2)}° and φ = {phi.toFixed(3)}, with linear interpolation where appropriate:
                </p>
                <CalcStep
                  label={<>Overall force coefficient <Tex>{'c_f'}</Tex> (EN 1991-1-4 Table 7.7)</>}
                  formula={`c_f = ${cp.cf_min.toFixed(3)}\\text{ (uplift) or }+${cp.cf_max.toFixed(3)}\\text{ (downward)}`}
                  result={<></>}
                  note="Negative values correspond to suction directed away from the upper surface inducing uplift forces on the roof. Both positive and negative values should be considered."
                />
              </DetailGroup>

              <DetailGroup title="Structural factor">
                <p style={P}>
                  The structural factor c<sub>s</sub>c<sub>d</sub> takes into account the structure size effects from the non-simultaneous occurrence of peak wind pressures on the surface and the dynamic effects of structural vibrations due to turbulence. A value of c<sub>s</sub>c<sub>d</sub> = 1.0 is generally conservative for small structures not susceptible to wind turbulence effects. In these calculations:
                </p>
                <CalcStep
                  label="Structural factor"
                  formula={`c_s c_d = ${cscd.toFixed(3)}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title="Overall wind force (for each sloped face)">
                <p style={P}>
                  The wind force F<sub>w</sub> corresponding to the overall wind effect on each sloped face of the canopy roof is calculated in accordance with EN 1991-1-4 equation (5.3), where A<sub>ref</sub> = {Aref.toFixed(3)} m² is the reference wind area for each sloped face:
                </p>
                <CalcStep
                  label=""
                  formula={`F_w = c_s c_d \\cdot c_f \\cdot A_{\\mathrm{ref}} \\cdot q_p(z_e)`}
                  result={<></>}
                />
                <p style={P}>Maximum overall wind force (acting downwards):</p>
                <CalcStep
                  label={<><Tex>{'F_{w,\\max}'}</Tex> — downward (per sloped face)</>}
                  formula={`F_{w,\\max} = ${cscd.toFixed(3)} \\cdot (+${cp.cf_max.toFixed(3)}) \\cdot ${Aref.toFixed(3)}\\ \\mathrm{m^2} \\cdot ${qp.toFixed(4)}\\ \\mathrm{kN/m^2} = +${Fw_max.toFixed(3)}\\ \\mathrm{kN}`}
                  result={<></>}
                />
                <p style={P}>Minimum overall wind force (acting upwards):</p>
                <CalcStep
                  label={<><Tex>{'F_{w,\\min}'}</Tex> — uplift (per sloped face)</>}
                  formula={`F_{w,\\min} = ${cscd.toFixed(3)} \\cdot (${cp.cf_min.toFixed(3)}) \\cdot ${Aref.toFixed(3)}\\ \\mathrm{m^2} \\cdot ${qp.toFixed(4)}\\ \\mathrm{kN/m^2} = ${Fw_min.toFixed(3)}\\ \\mathrm{kN}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title="Direction and eccentricity of the overall wind force">
                <p style={P}>
                  According to EN 1991-1-4 §7.3(6) Figure 7.17 the location of the centre of pressure is taken at the centre of each of the two sloped faces of the duopitch canopy. Six cases should be examined for the overall effect of the wind force on the canopy roof:
                </p>
                <p style={{ ...P, paddingLeft: 12, borderLeft: '3px solid #e5e7eb' }}>
                  1. Maximum force F<sub>w</sub> = +{Fw_max.toFixed(3)} kN (acting downwards) on both sloped faces<br />
                  2. Maximum force F<sub>w</sub> = +{Fw_max.toFixed(3)} kN (acting downwards) at the upwind sloped face and no force at the downwind sloped face<br />
                  3. No force at the upwind sloped face and maximum force F<sub>w</sub> = +{Fw_max.toFixed(3)} kN (acting downwards) at the downwind sloped face<br />
                  4. Minimum force F<sub>w</sub> = {Fw_min.toFixed(3)} kN (acting upwards) on both sloped faces<br />
                  5. Minimum force F<sub>w</sub> = {Fw_min.toFixed(3)} kN (acting upwards) at the upwind sloped face and no force at the downwind sloped face<br />
                  6. No force at the upwind sloped face and minimum force F<sub>w</sub> = {Fw_min.toFixed(3)} kN (acting upwards) at the downwind sloped face
                </p>
              </DetailGroup>

              <DetailGroup title="Additional notes">
                <ul style={{ fontSize: 12, color: '#374151', lineHeight: 1.75, margin: 0, paddingLeft: 18 }}>
                  <li>Horizontal wind friction forces should be considered in accordance with EN 1991-1-4 §7.5.</li>
                  <li>For roofs with permanent walls see EN 1991-1-4 §7.2 and the relevant calculation Wind load on duopitch roofs.</li>
                  <li>The calculated wind action effects are characteristic values (unfactored). Appropriate load factors should be applied for the relevant design situation. For ULS verifications the partial load factor γ<sub>Q</sub> = 1.50 is applicable for variable actions according to EN 1990.</li>
                </ul>
              </DetailGroup>
            </>)
          })()}
        </DetailsSection>
      </div>
    </div>
  )
}

