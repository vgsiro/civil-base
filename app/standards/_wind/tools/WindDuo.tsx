'use client'
import React, { useState } from 'react'
import { TheoryBlock, NumInput, Table, TR, ResultRow, ResultsBox, DetailsSection, DetailGroup, CalcStep, InputDataTable, InputDataRow, Tex, TableRef , LabelTip } from '../../_lib/ui'
import { TH, TD, TDN, FORMULA_BOX, WIND_SECTION, INPUT_GRID, INPUT_STYLE, LABEL_STYLE, SELECT_STYLE, ZONE_PILL, WIND_IMG } from '../../_lib/ui-styles'
import { calcPeakPressure, getDuoCpe } from '../../_lib/wind-helpers'
import { TERRAIN_CATS } from '../../_lib/wind-types'
import { Table74a, Table74b, Table41 } from '../WindTables'
import { WindPrimaryInputs, WindSecondaryInputs, INPUT_DIVIDER } from '../WindShared'

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
  const [loadedArea, setLoadedArea] = useState<'cpe10' | 'cpe1'>('cpe10')
  const [theta, setTheta] = useState<'0' | '90'>('0')

  // ze = ridge height = h (max roof height)
  const ze = mH
  const qpResult = calcPeakPressure(vb, ze, cat, c0, rho)
  const { kr, cr, vm, Iv, qp } = qpResult
  const e = Math.min(mB, 2 * mH)
  const cpe = getDuoCpe(alpha, loadedArea, theta)
  const zones = theta === '90' ? ['F', 'G', 'H', 'I'] : ['F', 'G', 'H', 'I', 'J']

  return (
    <div style={WIND_SECTION}>
      <TheoryBlock>
        <p><strong>EN 1991-1-4 §7.2.5</strong> — Duopitch roofs, −45° ≤ α ≤ +75°. Negative α = inverted (valley) roof.</p>
        <p><strong>Wind direction θ = 0°</strong>: wind perpendicular to ridge. z<sub>e</sub> = h (max roof height).</p>
        <ul style={{ margin: '4px 0 4px 16px', padding: 0 }}>
          <li><strong>F</strong>: corner zone (highest suction or pressure)</li>
          <li><strong>G</strong>: leading eave strip</li>
          <li><strong>H</strong>: windward slope between G and ridge</li>
          <li><strong>I</strong>: leeward slope</li>
          <li><strong>J</strong>: leeward eave zone</li>
        </ul>
        <p>Values linearly interpolated from EN 1991-1-4 Table 7.4a.</p>
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
          <LabelTip tip={"Roof plan dimension parallel to the wind direction. Used with $b$ and $h$ to compute the characteristic length $e = \\min(b, 2h)$ for zone layout on each slope."}>d — depth (wind dir.) (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={1} step={0.5} value={mD} onChange={setMD} />
        </div>
        <div>
          <LabelTip tip={"Roof plan dimension perpendicular to wind (along the ridge). Used to compute $e = \\min(b, 2h)$ which defines widths of zones F (corner), G (eave strip), H, I, J."}>b — width (crosswind) (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={1} step={0.5} value={mB} onChange={setMB} />
        </div>
        <div>
          <LabelTip tip={"Height of the ridge (peak) above ground level. Used as reference height $z_e = h$ for $q_p$, and in the characteristic length $e = \\min(b, 2h)$."}>h — max roof height (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={1} step={0.5} value={mH} onChange={setMH} />
        </div>
        <div>
          <LabelTip tip={"Roof pitch angle from horizontal. Range $-45°$ to $+75°$. Negative $\\alpha$ = inverted (valley) roof. $c_{pe}$ values are interpolated from EN 1991-1-4 Table 7.4a ($\\theta=0°$). At $\\alpha=0°$ the roof is flat; interpolation handles intermediate angles."}>α — pitch angle (°)</LabelTip>
          <NumInput style={INPUT_STYLE} min={-45} max={75} step={1} value={alpha} onChange={setAlpha} />
        </div>
        <div>
          <LabelTip tip={"Angle of wind relative to the ridge. $\\theta=0°$: wind perpendicular to ridge — uses Table 7.4a (depends on $\\alpha$). $\\theta=90°$: wind parallel to ridge — uses Table 7.4b (independent of $\\alpha$)."}>Wind direction θ</LabelTip>
          <select style={SELECT_STYLE} value={theta} onChange={e => setTheta(e.target.value as '0' | '90')}>
            <option value="0">0° — wind perpendicular to ridge</option>
            <option value="90">90° — wind parallel to ridge</option>
          </select>
        </div>
        <div>
          <LabelTip tip={"$c_{pe,10}$ for loaded areas $\\geq 10\\ \\mathrm{m}^2$ (overall structural loads). $c_{pe,1}$ for areas $\\leq 1\\ \\mathrm{m}^2$ (cladding/fixings). See EN 1991-1-4 §7.2.1(1)."}>Loaded area (c<sub>pe</sub>)</LabelTip>
          <select style={SELECT_STYLE} value={loadedArea} onChange={e => setLoadedArea(e.target.value as 'cpe10' | 'cpe1')}>
            <option value="cpe10">{'>'}10 m² (cpe,10)</option>
            <option value="cpe1">≤1 m² (cpe,1)</option>
          </select>
        </div>
      </div>
      <hr style={INPUT_DIVIDER} />
      <div style={INPUT_GRID}>
        <div>
          <LabelTip tip={"Minimum internal pressure coefficient (suction). Combine with $c_{pe}$ to get worst-case outward net pressure. Typical: $-0.3$ or $-0.5$ per EN 1991-1-4 §7.2.9."}>c<sub>pi,min</sub></LabelTip>
          <NumInput style={INPUT_STYLE} min={-0.5} max={0} step={0.05} value={cpiMin} onChange={setCpiMin} />
        </div>
        <div>
          <LabelTip tip={"Maximum internal pressure coefficient (positive). Combine with $c_{pe}$ suction to get worst-case inward net pressure. Typical: $+0.2$ or $+0.3$ per EN 1991-1-4 §7.2.9."}>c<sub>pi,max</sub></LabelTip>
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
        <ResultsBox title="Results">
          <ResultRow
            label={<>q<sub>p</sub>(z<sub>e</sub>=h={mH} m) — peak velocity pressure</>}
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

              <DetailGroup title="Input Data">
                <InputDataTable>
                  <InputDataRow param={<>Terrain category — <TableRef label="Table 4.1" renderTable={() => <Table41 />} /></>} symbol={<Tex>{'\\text{Cat.}'}</Tex>} value={`Cat. ${cat} — z₀=${z0} m, zmin=${zmin} m`} />
                  <InputDataRow param="Basic wind velocity" symbol={<Tex>{'v_b'}</Tex>} value={vb.toFixed(2)} unit="m/s" />
                  <InputDataRow param="Orography factor" symbol={<Tex>{'c_0(z_e)'}</Tex>} value={c0.toFixed(2)} />
                  <InputDataRow param="Air density" symbol={<Tex>{'\\rho'}</Tex>} value={rho.toFixed(2)} unit="kg/m³" />
                  <InputDataRow param="Depth (wind direction)" symbol={<Tex>{'d'}</Tex>} value={mD.toFixed(2)} unit="m" />
                  <InputDataRow param="Width (crosswind / ridge length)" symbol={<Tex>{'b'}</Tex>} value={mB.toFixed(2)} unit="m" />
                  <InputDataRow param="Height to ridge" symbol={<Tex>{'h'}</Tex>} value={mH.toFixed(2)} unit="m" />
                  <InputDataRow param="Roof pitch angle" symbol={<Tex>{'\\alpha'}</Tex>} value={`${alpha}°`} />
                  <InputDataRow param="Wind direction" symbol={<Tex>{'\\theta'}</Tex>} value={`${theta}°`} />
                  <InputDataRow param="Loaded area" symbol={<Tex>{loadedArea === 'cpe10' ? 'A \\geq 10\\ \\mathrm{m}^2' : 'A \\leq 1\\ \\mathrm{m}^2'}</Tex>} value={loadedArea === 'cpe10' ? 'cpe,10' : 'cpe,1'} />
                  <InputDataRow param="Min. internal pressure coeff." symbol={<Tex>{'c_{pi,\\min}'}</Tex>} value={cpiMin.toFixed(2)} />
                  <InputDataRow param="Max. internal pressure coeff." symbol={<Tex>{'c_{pi,\\max}'}</Tex>} value={cpiMax.toFixed(2)} />
                </InputDataTable>
              </DetailGroup>

              <DetailGroup title="Reference height">
                <p style={P}>
                  The reference height for the wind action z<sub>e</sub> is equal to the maximum height above ground of the roof of the building h as specified in EN 1991-1-4 §7.2.5(1). Therefore:
                </p>
                <CalcStep
                  label={<>Reference height <Tex>{'z_e'}</Tex> (EN 1991-1-4 §7.2.5(1))</>}
                  formula={`z_e = h = ${mH.toFixed(3)}\\ \\mathrm{m}`}
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
                  The roughness factor c<sub>r</sub>(z<sub>e</sub>) at the reference height z<sub>e</sub> accounts for the variability of the mean wind velocity at the site. It is calculated in accordance with EN 1991-1-4 equation (4.4). For the examined case z<sub>e</sub> {ze >= zmin ? '≥' : '<'} z<sub>min</sub>:
                </p>
                <CalcStep
                  label={<>Roughness factor <Tex>{'c_r(z_e)'}</Tex> (EN 1991-1-4 §4.5 Eq. 4.4)</>}
                  formula={`c_r(z_e) = k_r \\cdot \\ln\\!\\left(\\frac{\\max(z_e,\\,z_{\\min})}{z_0}\\right) = ${kr.toFixed(4)} \\cdot \\ln\\!\\left(\\frac{\\max(${ze.toFixed(3)}\\ \\mathrm{m},\\,${zmin}\\ \\mathrm{m})}{${z0}\\ \\mathrm{m}}\\right) = ${cr.toFixed(4)}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title="Orography factor">
                <p style={P}>
                  Where orography (e.g. hills, cliffs etc.) is significant its effect on wind velocities should be taken into account using an orography factor c<sub>0</sub>(z<sub>e</sub>) different from 1.0, as specified in EN 1991-1-4 §4.3.3. The recommended procedure for calculation of c<sub>0</sub>(z<sub>e</sub>) is described in EN 1991-1-4 §A.3. In these calculations the orography factor is considered as:
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
                  The turbulence intensity I<sub>v</sub>(z<sub>e</sub>) at reference height z<sub>e</sub> is defined as the standard deviation of the turbulence divided by the mean wind velocity. It is calculated in accordance with EN 1991-1-4 equation (4.7). For the examined case z<sub>e</sub> {ze >= zmin ? '≥' : '<'} z<sub>min</sub>:
                </p>
                <CalcStep
                  label={<>Turbulence intensity <Tex>{'I_v(z_e)'}</Tex> (EN 1991-1-4 §4.4 Eq. 4.7)</>}
                  formula={`I_v(z_e) = \\frac{k_I}{c_0(z_e) \\cdot \\ln\\!\\left(\\dfrac{\\max(z_e,\\,z_{\\min})}{z_0}\\right)} = \\frac{1.000}{${c0.toFixed(3)} \\cdot \\ln\\!\\left(\\dfrac{\\max(${ze.toFixed(3)}\\ \\mathrm{m},\\,${zmin}\\ \\mathrm{m})}{${z0}\\ \\mathrm{m}}\\right)} = ${Iv.toFixed(4)}`}
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

              <DetailGroup title="Pressure coefficient type">
                <p style={P}>
                  The external pressure coefficients are divided into overall coefficients c<sub>pe,10</sub> and local coefficients c<sub>pe,1</sub> as described in EN 1991-1-4 §7.1.1(1) and §7.2.1(1). Local coefficients c<sub>pe,1</sub> correspond to wind pressure for loaded areas ≤ 1 m² and they may be used for the design of small elements and fixings with an area per element of 1 m² or less such as cladding elements and roofing elements. Overall coefficients c<sub>pe,10</sub> correspond to wind pressure for loaded areas ≥ 10 m² and they may be used for the design of the overall load bearing structure.
                </p>
                <p style={P}>
                  According to EN 1991-1-4 §7.2.1(1) for intermediate loaded areas A between 1 m² and 10 m² the external pressure coefficient c<sub>pe</sub> may be calculated between the values c<sub>pe,1</sub> and c<sub>pe,10</sub> with logarithmic interpolation as follows:
                </p>
                <CalcStep
                  label=""
                  formula={`c_{pe} = c_{pe,1} - (c_{pe,1} - c_{pe,10}) \\cdot \\log_{10} A`}
                  result={<></>}
                />
                <p style={P}>
                  In the examined calculation the provided external pressure corresponds to coefficient <strong>{loadedArea === 'cpe10' ? 'c₝ₑ,10' : 'c₝ₑ,1'}</strong>, i.e. the results are applicable for {loadedArea === 'cpe10' ? 'global verifications' : 'local element design'}.
                </p>
              </DetailGroup>

              <DetailGroup title="External pressure coefficients">
                <p style={P}>
                  {theta === '0'
                    ? <>In the examined case the wind direction is perpendicular or nearly perpendicular to the ridge of the duopitch roof (i.e. θ = 0°). For this case the wind load on the structure is expressed in terms of external pressure coefficients for five zones F, G, H, I, J as defined in EN 1991-1-4 Figure 7.8(b). The extent of the zones depends on the length e defined as:</>
                    : <>For θ = 90° (wind parallel to ridge) the external pressure coefficients are taken from EN 1991-1-4 Table 7.4b and are independent of pitch angle α. The zones F, G, H, I are defined by the characteristic length e:</>
                  }
                </p>
                <CalcStep
                  label={<>Characteristic length <Tex>{'e'}</Tex></>}
                  formula={`e = \\min(b,\\,2h) = \\min(${mB.toFixed(3)}\\ \\mathrm{m},\\, 2 \\times ${mH.toFixed(3)}\\ \\mathrm{m}) = ${e.toFixed(3)}\\ \\mathrm{m}`}
                  result={<></>}
                  tableRef={
                    theta === '90'
                      ? <TableRef label="Table 7.4b" renderTable={() => <Table74b />} note="— θ=90° (wind parallel to ridge)" />
                      : <TableRef label="Table 7.4a" renderTable={() => <Table74a />} note={`— θ=0°, α=${alpha}°`} />
                  }
                />
                {theta === '0' && (
                  <p style={P}>
                    Zone F extends on the upwind roof face starting from both of the upwind corners for length e/10 and width e/4. Zone G extends on the upwind roof face between Zones F. Zone H extends on the upwind roof face from e/10 to the ridge. Zone J extends on the downwind roof face from the ridge for length e/10. Zone I extends on the downwind roof face beyond e/10 from the ridge. For the examined roof where e = {e.toFixed(3)} m the applicable zones are F, G, H, I, J.
                  </p>
                )}
                <p style={P}>
                  {theta === '0'
                    ? <>For θ = 0° the external pressure coefficient c<sub>pe</sub> for each zone is defined in EN 1991-1-4 Table 7.4a as a function of pitch angle α = {alpha}°. Values are linearly interpolated between tabulated pitch angles where appropriate. Negative values correspond to suction (uplift); for zones where both signs appear both values should be considered:</>
                    : <>For θ = 90° the external pressure coefficient c<sub>pe</sub> for each zone from EN 1991-1-4 Table 7.4b (independent of α):</>
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

              <DetailGroup title="Internal pressure coefficients">
                <p style={P}>
                  Internal pressure coefficients c<sub>pi</sub> are specified in EN 1991-1-4 §7.2.9 depending on the size and distribution of the openings of the building and background permeability due to leakage paths. A face of the building is considered dominant when the area of openings at that face is at least two times the area of openings and leakages in the remaining faces of the building.
                </p>
                <p style={P}>
                  For buildings without a dominant face and where it is not possible or not justified to estimate the effect of opening distribution in a more accurate manner, the most onerous internal pressure coefficient c<sub>pi</sub> = +0.2 or c<sub>pi</sub> = −0.3 should be considered, as specified in EN 1991-1-4 §7.2.9(6), Note 2. In these calculations the following values are applied:
                </p>
                <CalcStep
                  label={<>Internal pressure coefficient — suction <Tex>{'c_{pi,\\min}'}</Tex></>}
                  formula={`c_{pi,\\min} = ${cpiMin.toFixed(2)}`}
                  result={<></>}
                  note="Negative values correspond to suction directed away from the internal surface — inducing forces towards the interior of the building."
                />
                <CalcStep
                  label={<>Internal pressure coefficient — pressure <Tex>{'c_{pi,\\max}'}</Tex></>}
                  formula={`c_{pi,\\max} = ${cpiMax.toFixed(2)}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title="Net wind pressure on each zone">
                <p style={P}>
                  The net wind pressure on the surfaces of the structure w<sub>net</sub> corresponds to the combined effects of external and internal wind pressure. For structural surfaces consisting of only one skin:
                </p>
                <CalcStep
                  label=""
                  formula={`w_{\\mathrm{net}} = w_e - w_i = q_p(z_e) \\cdot c_{pe} - q_p(z_i) \\cdot c_{pi}`}
                  result={<></>}
                  note={`Reference height for internal pressure zi = ze = ${mH.toFixed(3)} m and qp(zi) = qp(ze) = ${qp.toFixed(4)} kN/m².`}
                />
                <p style={P}>
                  For the case where no dominant face is present, the most unfavourable net wind pressure for each zone is obtained by combining the external pressure coefficient c<sub>pe</sub> with the most unfavourable value of the internal pressure coefficient. When c<sub>pe</sub> is positive then c<sub>pi,min</sub> = {cpiMin.toFixed(2)} is most onerous. When c<sub>pe</sub> is negative then c<sub>pi,max</sub> = {cpiMax.toFixed(2)} is most onerous.
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
                <DetailGroup title="">
                  <p style={{ ...P, marginBottom: 6 }}>
                    For the case θ = 0° (i.e. wind nearly perpendicular to the ridge or trough) the sign of the wind pressure changes rapidly, so both positive and negative values are given, and both values should be considered. According to EN 1991-1-4 Table 7.4, Note 1 four cases should be considered:
                  </p>
                  <ul style={{ fontSize: 12, color: '#374151', lineHeight: 1.75, margin: '0 0 6px', paddingLeft: 18 }}>
                    <li>Largest values of all areas F, G, H combined with largest values of all areas I, J.</li>
                    <li>Largest values of all areas F, G, H combined with smallest values of all areas I, J.</li>
                    <li>Smallest values of all areas F, G, H combined with largest values of all areas I, J.</li>
                    <li>Smallest values of all areas F, G, H combined with smallest values of all areas I, J.</li>
                  </ul>
                  <p style={P}>No mixing of positive and negative values is allowed on the same face.</p>
                </DetailGroup>
              )}

              <DetailGroup title="Additional notes">
                <ul style={{ fontSize: 12, color: '#374151', lineHeight: 1.75, margin: 0, paddingLeft: 18 }}>
                  <li>If significant openings exist on the structure then internal wind pressure may need to be determined accurately as described in EN 1991-1-4 §5.2.</li>
                  <li>For canopy roofs (i.e. roofs without permanent walls) see EN 1991-1-4 §7.3 and the relevant calculation Wind load on duopitch canopies.</li>
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

