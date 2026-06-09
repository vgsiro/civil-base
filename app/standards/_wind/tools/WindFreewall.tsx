'use client'
import React from 'react'
import { TheoryBlock, NumInput, Table, TR, ResultRow, ResultsBox, DetailsSection, DetailGroup, CalcStep, InputDataTable, InputDataRow, Tex, TableRef , LabelTip } from '../../_lib/ui'
import { TH, TD, TDN, FORMULA_BOX, WIND_SECTION, INPUT_GRID, INPUT_STYLE, LABEL_STYLE, ZONE_PILL, WIND_IMG } from '../../_lib/ui-styles'
import { calcPeakPressure, getWallNetCp } from '../../_lib/wind-helpers'
import { TERRAIN_CATS } from '../../_lib/wind-types'
import { Table79, Table41 } from '../WindTables'
import { WindPrimaryInputs, WindSecondaryInputs, INPUT_DIVIDER } from '../WindShared'

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
  // ze = top of wall above ground = hbase + h
  const ze = fwHbase + fwH
  const qpResult = calcPeakPressure(vb, ze, cat, c0, rho)
  const { kr, cr, vm, Iv, qp } = qpResult
  const lh = fwL / fwH
  const e = Math.min(fwL, 2 * fwH)
  const zones = ['A', 'B', 'C', 'D']

  // Corner return reduces cp,net in zones A and B (EN 1991-1-4 §7.4.1 note)
  // If l_corner > e/4, zones A and B may use reduced values — we show reduction factor
  const hasCorner = fwCorner > 0
  const cornerNote = hasCorner
    ? `Return corner l_corner = ${fwCorner} m (> 0): c_p,net in zones A and B may be reduced per EN 1991-1-4 §7.4.1 Note 2.`
    : ''

  return (
    <div style={WIND_SECTION}>
      <TheoryBlock>
        <p><strong>EN 1991-1-4 §7.4.1</strong> — Freestanding walls, parapets, and fences.</p>
        <p><strong>Solidity ratio φ</strong>: ratio of solid area to overall area. φ = 1.0 for solid walls; φ &lt; 1.0 for porous/perforated walls.</p>
        <p><strong>Zone layout</strong> (along wall length from corner):</p>
        <ul style={{ margin: '4px 0 4px 16px', padding: 0 }}>
          <li><strong>Zone A</strong>: first e/4 from corner — highest pressure due to flow wrap-around</li>
          <li><strong>Zone B</strong>: e/4 to e from corner</li>
          <li><strong>Zone C</strong>: e to 2e from corner</li>
          <li><strong>Zone D</strong>: beyond 2e — lowest (far-field) pressure</li>
        </ul>
        <p>e = min(l, 2h). Reference height z<sub>e</sub> = h<sub>base</sub> + h (top of wall above ground).</p>
        <p><strong>Net wind pressure:</strong> w = q<sub>p</sub>(z<sub>e</sub>) · c<sub>p,net</sub> · φ</p>
      </TheoryBlock>
      <div style={FORMULA_BOX}>
        <strong>EN 1991-1-4 §7.4.1 Table 7.9</strong> — Freestanding walls &amp; parapets.<br />
        z<sub>e</sub> = h<sub>base</sub> + h &nbsp;|&nbsp; Net pressure zones A (corner), B, C, D. w = q<sub>p</sub> · c<sub>p,net</sub> · φ
      </div>

      <WindPrimaryInputs vb={vb} setVb={setVb} cat={cat} setCat={setCat} />
      <div style={INPUT_GRID}>
        <div>
          <LabelTip tip={"Total length of the freestanding wall. Used in the aspect ratio $l/h$ and characteristic length $e = \\min(l, 2h)$. Longer walls transition through zones A, B, C, D along their length."}>l — wall length (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={1} step={0.5} value={fwL} onChange={setFwL} />
        </div>
        <div>
          <LabelTip tip={"Height of the wall panel above its base. Used to compute the characteristic length $e = \\min(l, 2h)$ and the reference height $z_e = h_{base} + h$. Governs zone widths and $c_{pe}$ interpolation via $l/h$ ratio."}>h — wall height (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={0.5} step={0.5} value={fwH} onChange={setFwH} />
        </div>
        <div>
          <LabelTip tip={"Height from ground level to the bottom edge of the wall (e.g., for a wall on top of a plinth or podium). The reference height for $q_p$ is $z_e = h_{base} + h$ (top of wall above ground)."}>h<sub>base</sub> — base above ground (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={0} step={0.5} value={fwHbase} onChange={setFwHbase} />
        </div>
        <div>
          <LabelTip tip={"Length of a wall return at the corner (an L-shaped or U-shaped plan). A return corner reduces $c_{p,net}$ in zones A and B per EN 1991-1-4 §7.4.1 Note 2. Set to 0 for a plain wall with no return."}>l<sub>corner</sub> — return corner (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={0} step={0.5} value={fwCorner} onChange={setFwCorner} />
        </div>
        <div>
          <LabelTip tip={"Ratio of solid area to total (enclosed) area of the wall. $\\varphi=1.0$ for a fully solid wall. For open/porous walls (fences, lattice), $\\varphi < 1.0$ and $c_{p,net}$ is reduced by $\\varphi$. See EN 1991-1-4 §7.4.1(3)."}>φ — solidity ratio (0–1)</LabelTip>
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

        <ResultsBox title="Results">
          <ResultRow
            label={<>q<sub>p</sub>(z<sub>e</sub>={ze.toFixed(2)} m) — peak velocity pressure</>}
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

              <DetailGroup title="Input Data">
                <InputDataTable>
                  <InputDataRow param="Terrain category" symbol={<Tex>{'\\text{Cat.}'}</Tex>} value={`Cat. ${cat} — z₀ = ${z0} m, z_min = ${zmin} m`} />
                  <InputDataRow param="Basic wind velocity" symbol={<Tex>{'v_b'}</Tex>} value={vb.toFixed(2)} unit="m/s" />
                  <InputDataRow param="Length of wall" symbol={<Tex>{'l'}</Tex>} value={fwL.toFixed(3)} unit="m" />
                  <InputDataRow param="Height of wall above base" symbol={<Tex>{'h'}</Tex>} value={fwH.toFixed(3)} unit="m" />
                  <InputDataRow param="Base height above ground" symbol={<Tex>{'h_{\\mathrm{base}}'}</Tex>} value={fwHbase.toFixed(3)} unit="m" />
                  <InputDataRow param="Return corner length" symbol={<Tex>{'l_{\\mathrm{corner}}'}</Tex>} value={fwCorner.toFixed(3)} unit="m" />
                  <InputDataRow param="Solidity ratio" symbol={<Tex>{'\\varphi'}</Tex>} value={fwSolid.toFixed(2)} />
                  <InputDataRow param="Orography factor at ze" symbol={<Tex>{'c_0(z_e)'}</Tex>} value={c0.toFixed(3)} />
                  <InputDataRow param="Air density" symbol={<Tex>{'\\rho'}</Tex>} value={rho.toFixed(2)} unit="kg/m³" />
                </InputDataTable>
              </DetailGroup>

              <DetailGroup title="Reference height">
                <p style={P}>
                  The reference height for the wind action z<sub>e</sub> is equal to the maximum height above ground of the freestanding wall, as specified in EN 1991-1-4 §7.4.1(2). Therefore:
                </p>
                <CalcStep
                  label={<>Reference height <Tex>{'z_e'}</Tex></>}
                  formula={`z_e = h + h_{\\mathrm{base}} = ${fwH.toFixed(3)}\\ \\mathrm{m} + ${fwHbase.toFixed(3)}\\ \\mathrm{m} = ${ze.toFixed(3)}\\ \\mathrm{m}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title="Basic wind velocity">
                <p style={P}>
                  The basic wind velocity v<sub>b</sub> is defined in EN 1991-1-4 §4.2(2)P as a function of the wind direction and time of year at 10 m above ground of terrain Category II. The value of v<sub>b</sub> includes the effects of the directional factor c<sub>dir</sub> and the seasonal factor c<sub>season</sub> and is provided in the National Annex. In the following calculations the basic wind velocity is considered as v<sub>b</sub> = {vb.toFixed(2)} m/s.
                </p>
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
                  formula={`k_r = 0.19 \\cdot \\left(\\frac{z_0}{z_{0,\\mathrm{II}}}\\right)^{0.07} = 0.19 \\cdot \\left(\\frac{${z0}\\ \\mathrm{m}}{0.050\\ \\mathrm{m}}\\right)^{0.07} = ${kr.toFixed(4)}`}
                  result={<></>}
                />
                <p style={P}>
                  The roughness factor c<sub>r</sub>(z<sub>e</sub>) at the reference height z<sub>e</sub> accounts for the variability of the mean wind velocity at the site. It is calculated in accordance with EN 1991-1-4 equation (4.4). For the examined case z<sub>e</sub> = {ze.toFixed(3)} m {zeEff >= zmin ? '≥' : '<'} z<sub>min</sub> = {zmin} m:
                </p>
                <CalcStep
                  label={<>Roughness factor <Tex>{'c_r(z_e)'}</Tex> (EN 1991-1-4 §4.5 Eq. 4.4)</>}
                  formula={`c_r(z_e) = k_r \\cdot \\ln\\!\\left(\\frac{\\max(z_e,\\,z_{\\min})}{z_0}\\right) = ${kr.toFixed(4)} \\cdot \\ln\\!\\left(\\frac{\\max(${ze.toFixed(3)}\\ \\mathrm{m},\\,${zmin}\\ \\mathrm{m})}{${z0}\\ \\mathrm{m}}\\right) = ${cr.toFixed(4)}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title="Orography factor">
                <p style={P}>
                  Where orography (e.g. hills, cliffs etc.) is significant its effect on wind velocities should be taken into account using an orography factor c<sub>0</sub>(z<sub>e</sub>) different from 1.0, as specified in EN 1991-1-4 §4.3.3. The recommended procedure for calculation of c<sub>0</sub>(z<sub>e</sub>) is described in EN 1991-1-4 Annex A.3. In the following calculations the orography factor is considered as c<sub>0</sub>(z<sub>e</sub>) = {c0.toFixed(3)}.
                </p>
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
                  The turbulence intensity I<sub>v</sub>(z<sub>e</sub>) at reference height z<sub>e</sub> is defined as the standard deviation of the turbulence divided by the mean wind velocity. It is calculated in accordance with EN 1991-1-4 equation (4.7). For the examined case z<sub>e</sub> {zeEff >= zmin ? '≥' : '<'} z<sub>min</sub>:
                </p>
                <CalcStep
                  label={<>Turbulence intensity <Tex>{'I_v(z_e)'}</Tex> (EN 1991-1-4 §4.4 Eq. 4.7)</>}
                  formula={`I_v(z_e) = \\frac{k_I}{c_0(z_e) \\cdot \\ln\\!\\left(\\frac{\\max(z_e,\\,z_{\\min})}{z_0}\\right)} = \\frac{1.000}{${c0.toFixed(3)} \\cdot \\ln\\!\\left(\\frac{\\max(${ze.toFixed(3)}\\ \\mathrm{m},\\,${zmin}\\ \\mathrm{m})}{${z0}\\ \\mathrm{m}}\\right)} = ${Iv.toFixed(4)}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title="Basic velocity pressure">
                <p style={P}>
                  The basic velocity pressure q<sub>b</sub> is the pressure corresponding to the wind momentum determined at the basic wind velocity v<sub>b</sub>. It is calculated according to EN 1991-1-4 §4.5(1):
                </p>
                <CalcStep
                  label={<>Basic velocity pressure <Tex>{'q_b'}</Tex></>}
                  formula={`q_b = \\tfrac{1}{2} \\cdot \\rho \\cdot v_b^2 = \\tfrac{1}{2} \\cdot ${rho.toFixed(2)}\\ \\mathrm{kg/m^3} \\cdot (${vb.toFixed(2)}\\ \\mathrm{m/s})^2 = ${(qb*1000).toFixed(0)}\\ \\mathrm{N/m^2} = ${qb.toFixed(3)}\\ \\mathrm{kN/m^2}`}
                  result={<></>}
                  note="ρ is the air density per EN 1991-1-4 §4.5(1). Note that 1 N = 1 kg·m/s²."
                />
              </DetailGroup>

              <DetailGroup title="Peak velocity pressure">
                <p style={P}>
                  The peak velocity pressure q<sub>p</sub>(z<sub>e</sub>) at reference height z<sub>e</sub> includes mean and short-term velocity fluctuations. It is determined according to EN 1991-1-4 equation (4.8):
                </p>
                <CalcStep
                  label={<>Peak velocity pressure <Tex>{'q_p(z_e)'}</Tex> (EN 1991-1-4 §4.5 Eq. 4.8)</>}
                  formula={`q_p(z_e) = (1 + 7 \\cdot I_v(z_e)) \\cdot \\tfrac{1}{2} \\cdot \\rho \\cdot v_m(z_e)^2 = (1 + 7 \\cdot ${Iv.toFixed(4)}) \\cdot \\tfrac{1}{2} \\cdot ${rho.toFixed(2)} \\cdot (${vm.toFixed(2)})^2 = ${(qp*1000).toFixed(0)}\\ \\mathrm{N/m^2}`}
                  result={<></>}
                  note="Note that 1 N = 1 kg·m/s²."
                />
                <CalcStep label="" formula={`\\Rightarrow q_p(z_e) = ${qp.toFixed(4)}\\ \\mathrm{kN/m^2}`} result={<></>} />
              </DetailGroup>

              <DetailGroup title="Net pressure coefficients">
                <p style={P}>
                  The wind load on the structure is expressed in terms of net pressure coefficients for four zones A, B, C, D as defined in EN 1991-1-4 Figure 7.19. Zone A extends from 0 to 0.3h from the free end. Zone B extends from 0.3h to 2h. Zone C extends from 2h to 4h. Zone D extends beyond 4h. For the examined wall where l/h = {fwL.toFixed(3)} m / {fwH.toFixed(3)} m = {lh.toFixed(3)} the applicable zones are:
                </p>
                <CalcStep
                  label={<>Aspect ratio <Tex>{'l/h'}</Tex></>}
                  formula={`l/h = ${fwL.toFixed(3)}\\ \\mathrm{m}\\ /\\ ${fwH.toFixed(3)}\\ \\mathrm{m} = ${lh.toFixed(3)}`}
                  result={<></>}
                  tableRef={<TableRef label="Table 7.9" renderTable={() => <Table79 />} note="— cp,net for freestanding walls and parapets" />}
                />
                <p style={P}>
                  The net pressure coefficient c<sub>p,net</sub> for each zone is defined in EN 1991-1-4 Table 7.9 as a function of the aspect ratio l/h{hasCorner ? `, the return corner length l_corner/h = ${fwCorner.toFixed(3)}/${fwH.toFixed(3)} = ${(fwCorner/fwH).toFixed(3)}` : ''}, and the solidity ratio φ = {fwSolid.toFixed(3)}. Using linear interpolation where appropriate:
                </p>
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
                    Return corner l<sub>corner</sub> = {fwCorner.toFixed(3)} m detected. A return corner reduces c<sub>p,net</sub> in zones A and B per EN 1991-1-4 §7.4.1 Note 2. Verify reduced values from Table 7.9 for l<sub>corner</sub>/h = {(fwCorner/fwH).toFixed(3)}.
                  </p>
                )}
              </DetailGroup>

              <DetailGroup title="Net wind pressure">
                <p style={P}>
                  The net wind pressure on the structure w<sub>net</sub> corresponds to the net pressure effect on the front and back faces of the wall. The net pressure is derived from the peak velocity pressure q<sub>p</sub>(z<sub>e</sub>) = {qp.toFixed(4)} kN/m² by application of the net pressure coefficient c<sub>p,net</sub>, and reduced by the solidity ratio φ = {fwSolid.toFixed(3)}:
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

              <DetailGroup title="Additional notes">
                <ul style={{ fontSize: 12, color: '#374151', lineHeight: 1.75, margin: 0, paddingLeft: 18 }}>
                  <li>The net pressure corresponds to the overall wind effect on the front face and the back face of the wall.</li>
                  <li>The calculated wind action effects are characteristic values (unfactored). Appropriate load factors should be applied for the relevant design situation. For ULS verifications the partial load factor γ<sub>Q</sub> = 1.50 is applicable for variable actions according to EN 1990.</li>
                </ul>
              </DetailGroup>
            </>
          })()}
        </DetailsSection>
      </div>
    </div>
  )
}

