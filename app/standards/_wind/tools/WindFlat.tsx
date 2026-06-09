'use client'
import { useState } from 'react'
import { TheoryBlock, NumInput, Table, TR, ResultRow, ResultsBox, DetailsSection, DetailGroup, CalcStep, InputDataTable, InputDataRow, Tex, TableRef, LabelTip } from '../../_lib/ui'
import FlatRoofDiagram from '../FlatRoofDiagram'
import { TH, TD, TDN, FORMULA_BOX, WIND_SECTION, INPUT_GRID, INPUT_STYLE, LABEL_STYLE, ZONE_PILL, WIND_IMG } from '../../_lib/ui-styles'
import { calcPeakPressure, getFlatRoofCpe } from '../../_lib/wind-helpers'
import { TERRAIN_CATS } from '../../_lib/wind-types'
import { Table72, Table41 } from '../WindTables'
import { WindPrimaryInputs, WindSecondaryInputs, INPUT_DIVIDER } from '../WindShared'

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
  const [showDiagram, setShowDiagram] = useState(false)
  const ze = rH  // reference height = eave height for flat roofs
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
    <div style={WIND_SECTION}>
      <TheoryBlock>
        <p><strong>EN 1991-1-4 §7.2.3</strong> — Flat or near-flat roofs (−5° &lt; α &lt; 5°).</p>
        <p>For sharp eaves (no parapet, h<sub>p</sub>=0): highest corner suction F≈−1.8. With parapets h<sub>p</sub>/h ≥ 0.1: F≈−1.2 (reduced).</p>
        <p><strong>Zone I</strong> can be either positive (+0.2) or negative (−0.2) — both cases must be checked in design.</p>
        <p><strong>Zone dimensions:</strong> e = \min(b,\, 2h)</p>
        <ul style={{ margin: '4px 0 4px 16px', padding: 0 }}>
          <li><strong>F</strong>: corner zones, e/10 deep × e/4 wide — highest uplift</li>
          <li><strong>G</strong>: leading-edge strip (excluding corners), e/10 deep</li>
          <li><strong>H</strong>: roof areas e/10 to e/2 from windward edge</li>
          <li><strong>I</strong>: central zone — can be positive or negative</li>
        </ul>
      </TheoryBlock>
      <div style={FORMULA_BOX}>
        <strong>EN 1991-1-4 §7.2.3</strong> — Flat roofs (−5° &lt; α &lt; 5°). Zones F, G, H, I.<br />
        w = q<sub>p</sub>·(c<sub>pe</sub> − c<sub>pi</sub>). Negative = uplift. z<sub>e</sub> = h (eave height).
      </div>
      <WindPrimaryInputs vb={vb} setVb={setVb} cat={cat} setCat={setCat} />
      <div style={INPUT_GRID}>
        <div>
          <LabelTip tip={"Building dimension parallel to the wind direction. Used together with $b$ and $h$ to lay out the roof pressure zones F, G, H, I via the characteristic length $e = \\min(b, 2h)$."}>d — depth (wind dir.) (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={1} step={0.5} value={rD} onChange={setRD} />
        </div>
        <div>
          <LabelTip tip={"Building dimension perpendicular to wind. Governs the characteristic length $e = \\min(b, 2h)$, which sets the extents of zones F ($e/4$ wide), G, and H ($e/2$ deep from eave)."}>b — width (crosswind) (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={1} step={0.5} value={rB} onChange={setRB} />
        </div>
        <div>
          <LabelTip tip={"Height to the eaves (top of walls). Used as the reference height $z_e = h$ for $q_p$ and in $e = \\min(b, 2h)$. For flat roofs, $z_e = h$ per EN 1991-1-4 §7.2.3."}>h — eave height (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={1} step={0.5} value={rH} onChange={setRH} />
        </div>
        <div>
          <LabelTip tip={"Height of the parapet wall above the roof level. The ratio $h_p/h$ determines the $c_{pe,10}$ values from EN 1991-1-4 Table 7.2. Sharp eaves ($h_p=0$) give $c_{pe} = -1.8$ in zone F; at $h_p/h \\geq 0.1$, F reduces to $-1.2$."}>h<sub>p</sub> — parapet height (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={0} step={0.05} value={rHp} onChange={setRHp} />
        </div>
      </div>
      <hr style={INPUT_DIVIDER} />
      <div style={INPUT_GRID}>
        <div>
          <LabelTip tip={"Minimum internal pressure coefficient (suction). Combine with external $c_{pe}$ to find the most onerous net uplift pressure. Typical values: $-0.3$ or $-0.5$ per EN 1991-1-4 §7.2.9."}>c<sub>pi,min</sub></LabelTip>
          <NumInput style={INPUT_STYLE} min={-0.5} max={0} step={0.05} value={cpiMin} onChange={setCpiMin} />
        </div>
        <div>
          <LabelTip tip={"Maximum internal pressure coefficient (positive). Combine with external $c_{pe}$ suction to find the most onerous outward net pressure. Typical values: $+0.2$ or $+0.3$ per EN 1991-1-4 §7.2.9."}>c<sub>pi,max</sub></LabelTip>
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
            {showDiagram ? '▲ Hide diagram' : '▼ Show zone diagram'}
          </button>
        </div>
        {showDiagram && <FlatRoofDiagram d={rD} b={rB} h={rH} hp={rHp} e={e} />}
        <ResultsBox title="Results">
          <ResultRow label={<>q<sub>p</sub>(z<sub>e</sub>=h) — peak velocity pressure</>} value={qp.toFixed(3)} unit="kPa" onClick={() => document.getElementById('flat-details')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
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
            const zeEff = Math.max(ze, zmin)
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

                {/* ── Input Data ── */}
                <DetailGroup title="Input Data">
                  <InputDataTable>
                    <InputDataRow param={<>Terrain category — <TableRef label="Table 4.1" renderTable={() => <Table41 />} /></>} symbol={<Tex>{'\\text{Cat.}'}</Tex>} value={`Cat. ${cat}`} />
                    <InputDataRow param="Basic wind velocity" symbol={<Tex>{'v_b'}</Tex>} value={vb.toFixed(2)} unit="m/s" />
                    <InputDataRow param="Building depth parallel to wind direction" symbol={<Tex>{'d'}</Tex>} value={rD.toFixed(3)} unit="m" />
                    <InputDataRow param="Building width perpendicular to wind (crosswind)" symbol={<Tex>{'b'}</Tex>} value={rB.toFixed(3)} unit="m" />
                    <InputDataRow param="Height from ground to roof level" symbol={<Tex>{'h'}</Tex>} value={rH.toFixed(3)} unit="m" />
                    <InputDataRow param={<>Parapet height — <TableRef label="Table 7.2" renderTable={() => <Table72 />} note="— flat roof cpe" /></>} symbol={<Tex>{'h_p'}</Tex>} value={rHp.toFixed(3)} unit="m" />
                    <InputDataRow param="Orography factor at reference height ze" symbol={<Tex>{'c_0(z_e)'}</Tex>} value={c0.toFixed(3)} />
                    <InputDataRow param="Air density" symbol={<Tex>{'\\rho'}</Tex>} value={rho.toFixed(2)} unit="kg/m³" />
                    <InputDataRow param="Minimum internal pressure coefficient" symbol={<Tex>{'c_{pi,\\min}'}</Tex>} value={cpiMin.toFixed(3)} />
                    <InputDataRow param="Maximum internal pressure coefficient" symbol={<Tex>{'c_{pi,\\max}'}</Tex>} value={cpiMax.toFixed(3)} />
                  </InputDataTable>
                </DetailGroup>

                {/* ── Reference height ── */}
                <DetailGroup title="Reference height">
                  <p style={PROSE}>
                    The reference height for the wind action z<sub>e</sub> is equal to the maximum height above ground of the building h including the additional height of parapets h<sub>p</sub> if present, as specified in EN 1991-1-4 §7.2.3(3). Therefore:
                  </p>
                  <CalcStep
                    label={<>Reference height <Tex>{'z_e'}</Tex> (EN 1991-1-4 §7.2.3(3))</>}
                    formula={`z_e = h + h_p = ${rH.toFixed(3)}\\ \\mathrm{m} + ${rHp.toFixed(3)}\\ \\mathrm{m} = ${ze.toFixed(3)}\\ \\mathrm{m}`}
                    result={<></>}
                  />
                </DetailGroup>

                {/* ── Basic wind velocity ── */}
                <DetailGroup title="Basic wind velocity">
                  <p style={PROSE}>
                    The basic wind velocity v<sub>b</sub> is defined in EN 1991-1-4 §4.2(2)P as a function of the wind direction and time of year at 10 m above ground of terrain category II. The value of v<sub>b</sub> includes the effects of the directional factor c<sub>dir</sub> and the seasonal factor c<sub>season</sub> and it is provided in the National Annex. In the following calculations the basic wind velocity is considered as v<sub>b</sub> = {vb.toFixed(2)} m/s.
                  </p>
                </DetailGroup>

                {/* ── Terrain roughness ── */}
                <DetailGroup title="Terrain roughness">
                  <p style={PROSE}>
                    The roughness length z<sub>0</sub> and the minimum height z<sub>min</sub> are specified in EN 1991-1-4 Table 4.1 as a function of the terrain category. For terrain category {cat} the corresponding values are: z<sub>0</sub> = {z0.toFixed(3)} m and z<sub>min</sub> = {zmin.toFixed(1)} m.
                  </p>
                  <p style={PROSE}>
                    The terrain factor k<sub>r</sub> depending on the roughness length z<sub>0</sub> = {z0.toFixed(3)} m is calculated in accordance with EN 1991-1-4 equation (4.5):
                  </p>
                  <CalcStep
                    label={<>Terrain factor <Tex>{'k_r'}</Tex> (EN 1991-1-4 §4.5 Eq. 4.5)</>}
                    formula={`k_r = 0.19 \\cdot \\left(\\dfrac{z_0}{z_{0,\\mathrm{II}}}\\right)^{0.07} = 0.19 \\cdot \\left(\\dfrac{${z0.toFixed(3)}\\ \\mathrm{m}}{0.050\\ \\mathrm{m}}\\right)^{0.07} = ${kr.toFixed(4)}`}
                    result={<></>}
                  />
                  <p style={PROSE}>
                    The roughness factor c<sub>r</sub>(z<sub>e</sub>) at the reference height z<sub>e</sub> accounts for the variability of the mean wind velocity at the site. It is calculated in accordance with EN 1991-1-4 equation (4.4). For the examined case z<sub>e</sub> {ze >= zmin ? '≥' : '<'} z<sub>min</sub>:
                  </p>
                  <CalcStep
                    label={<>Roughness factor <Tex>{'c_r(z_e)'}</Tex> (EN 1991-1-4 §4.5 Eq. 4.4)</>}
                    formula={`c_r(z_e) = k_r \\cdot \\ln\\!\\left(\\frac{\\max(z_e,\\,z_{\\min})}{z_0}\\right) = ${kr.toFixed(4)} \\cdot \\ln\\!\\left(\\frac{\\max(${ze.toFixed(3)}\\ \\mathrm{m},\\,${zmin.toFixed(1)}\\ \\mathrm{m})}{${z0.toFixed(3)}\\ \\mathrm{m}}\\right) = ${cr.toFixed(4)}`}
                    result={<></>}
                  />
                </DetailGroup>

                {/* ── Orography ── */}
                <DetailGroup title="Orography factor">
                  <p style={PROSE}>
                    Where orography (e.g. hills, cliffs etc.) is significant its effect on wind velocities should be taken into account using an orography factor c<sub>0</sub>(z<sub>e</sub>) different than 1.0, as specified in EN 1991-1-4 §4.3.3. In the following calculations the orography factor is considered as c<sub>0</sub>(z<sub>e</sub>) = {c0.toFixed(3)}.
                  </p>
                </DetailGroup>

                {/* ── Mean wind velocity ── */}
                <DetailGroup title="Mean wind velocity">
                  <p style={PROSE}>
                    The mean wind velocity v<sub>m</sub>(z<sub>e</sub>) at reference height z<sub>e</sub> depends on the terrain roughness, terrain orography and the basic wind velocity v<sub>b</sub>. It is determined using EN 1991-1-4 equation (4.3):
                  </p>
                  <CalcStep
                    label={<>Mean wind velocity <Tex>{'v_m(z_e)'}</Tex> (EN 1991-1-4 §4.3 Eq. 4.3)</>}
                    formula={`v_m(z_e) = c_r(z_e) \\cdot c_0(z_e) \\cdot v_b = ${cr.toFixed(4)} \\cdot ${c0.toFixed(3)} \\cdot ${vb.toFixed(2)}\\ \\mathrm{m/s} = ${vm.toFixed(2)}\\ \\mathrm{m/s}`}
                    result={<></>}
                  />
                </DetailGroup>

                {/* ── Turbulence ── */}
                <DetailGroup title="Wind turbulence">
                  <p style={PROSE}>
                    The turbulence intensity I<sub>v</sub>(z<sub>e</sub>) at reference height z<sub>e</sub> is defined as the standard deviation of the turbulence divided by the mean wind velocity. It is calculated in accordance with EN 1991-1-4 equation (4.7). For the examined case z<sub>e</sub> {ze >= zmin ? '≥' : '<'} z<sub>min</sub>:
                  </p>
                  <CalcStep
                    label={<>Turbulence intensity <Tex>{'I_v(z_e)'}</Tex> (EN 1991-1-4 §4.4 Eq. 4.7)</>}
                    formula={`I_v(z_e) = \\frac{k_I}{c_0(z_e) \\cdot \\ln\\!\\left(\\frac{\\max(z_e,\\,z_{\\min})}{z_0}\\right)} = \\frac{1.000}{${c0.toFixed(3)} \\cdot \\ln\\!\\left(\\frac{\\max(${ze.toFixed(3)}\\ \\mathrm{m},\\,${zmin.toFixed(1)}\\ \\mathrm{m})}{${z0.toFixed(3)}\\ \\mathrm{m}}\\right)} = ${Iv.toFixed(4)}`}
                    result={<></>}
                  />
                </DetailGroup>

                {/* ── Basic velocity pressure ── */}
                <DetailGroup title="Basic velocity pressure">
                  <p style={PROSE}>
                    The basic velocity pressure q<sub>b</sub> is the pressure corresponding to the wind momentum determined at the basic wind velocity v<sub>b</sub>. The basic velocity pressure is calculated according to the fundamental relation specified in EN 1991-1-4 §4.5(1):
                  </p>
                  <CalcStep
                    label={<>Basic velocity pressure <Tex>{'q_b'}</Tex> (EN 1991-1-4 §4.5(1))</>}
                    formula={`q_b = \\tfrac{1}{2} \\cdot \\rho \\cdot v_b^2 = \\tfrac{1}{2} \\cdot ${rho.toFixed(2)}\\ \\mathrm{kg/m^3} \\cdot (${vb.toFixed(2)}\\ \\mathrm{m/s})^2 = ${(qb*1000).toFixed(0)}\\ \\mathrm{N/m^2} = ${qb.toFixed(4)}\\ \\mathrm{kN/m^2}`}
                    result={<></>}
                    note="Note that by definition 1 N = 1 kg·m/s²."
                  />
                </DetailGroup>

                {/* ── Peak velocity pressure ── */}
                <DetailGroup title="Peak velocity pressure">
                  <p style={PROSE}>
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

                {/* ── Zone geometry ── */}
                <DetailGroup title="External pressure coefficients — zone geometry">
                  <p style={PROSE}>
                    The wind load on the structure is expressed in terms of external pressure coefficients for four zones F, G, H, I as defined in EN 1991-1-4 Figure 7.6. The extent of the zones depends on the length e that is defined as:
                  </p>
                  <CalcStep
                    label={<>Zone parameter <Tex>{'e'}</Tex></>}
                    formula={`e = \\min(b,\\,2h) = \\min(${rB.toFixed(3)}\\ \\mathrm{m},\\;2 \\times ${rH.toFixed(3)}\\ \\mathrm{m}) = ${e.toFixed(3)}\\ \\mathrm{m}`}
                    result={<></>}
                  />
                  <p style={PROSE}>
                    Zone F extends starting from both of the upwind corners for length e/10 = {(e/10).toFixed(3)} m and width e/4 = {(e/4).toFixed(3)} m. Zone G extends between Zones F along the windward edge, e/10 = {(e/10).toFixed(3)} m deep. Zone H extends from e/10 to e/2 = {(e/2).toFixed(3)} m from the windward eave. Zone I extends over the remainder of the roof beyond e/2. For the examined roof where e = {e.toFixed(3)} m the applicable zones are F, G, H, I.
                  </p>
                </DetailGroup>

                {/* ── cpe coefficients ── */}
                <DetailGroup title={<>External pressure coefficients — <TableRef label="Table 7.2" renderTable={() => <Table72 />} note="— flat roof c_pe" /></>}>
                  <p style={PROSE}>
                    The external pressure coefficient c<sub>pe</sub> for each of zones F, G, H, I is defined in EN 1991-1-4 Table 7.2 as a function of the normalised parapet height h<sub>p</sub>/h, using linear interpolation where appropriate. For the examined case:
                  </p>
                  <CalcStep
                    label={<>Normalised parapet height <Tex>{'h_p/h'}</Tex></>}
                    formula={`h_p/h = ${rHp.toFixed(3)}\\ \\mathrm{m} \\;/\\; ${rH.toFixed(3)}\\ \\mathrm{m} = ${hph.toFixed(3)}`}
                    result={<></>}
                  />
                  <p style={PROSE}>
                    Moreover, for the examined case the pressure coefficient c<sub>pe,10</sub> is used, corresponding to loaded areas ≥ 10 m² and appropriate for global structural effects. Therefore according to EN 1991-1-4 Table 7.2 the following external pressure coefficients are obtained:
                  </p>
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
                  <p style={{ ...PROSE, marginTop: 8 }}>
                    Negative values for the external pressure coefficient correspond to suction directed away from the external surface inducing uplift forces on the roof. In Zone I, where positive and negative values are given (±), both values should be considered.
                  </p>
                </DetailGroup>

                {/* ── Internal pressure ── */}
                <DetailGroup title="Internal pressure coefficients">
                  <p style={PROSE}>
                    Internal pressure coefficients c<sub>pi</sub> are specified in EN 1991-1-4 §7.2.9 depending on the size and distribution of the openings of the building and background permeability due to leakage paths. A face of the building is considered dominant when the area of openings at that face is at least two times the area of openings and leakages in the remaining faces.
                  </p>
                  <p style={PROSE}>
                    For buildings without a dominant face and where it is not possible or not justified to estimate the effect of opening distribution in a more accurate manner, the most onerous internal pressure coefficient c<sub>pi</sub> = +0.2 or c<sub>pi</sub> = −0.3 should be considered, as specified in EN 1991-1-4 §7.2.9(6) Note 2. In this calculation the following values of the internal pressure coefficient are considered:
                  </p>
                  <CalcStep
                    label={<>Internal pressure coefficients</>}
                    formula={`c_{pi,\\min} = ${cpiMin.toFixed(3)} \\qquad c_{pi,\\max} = ${cpiMax.toFixed(3)}`}
                    result={<></>}
                  />
                  <p style={PROSE}>
                    Negative values for the internal pressure coefficient correspond to suction directed away from the internal surface inducing forces towards the interior of the building.
                  </p>
                </DetailGroup>

                {/* ── External, internal, net pressure explanation ── */}
                <DetailGroup title="External, internal and net wind pressure">
                  <p style={PROSE}>
                    The external wind pressure w<sub>e</sub> on the structure corresponds to the pressure effect on the exterior surface of the roof. It is derived from the peak velocity pressure q<sub>p</sub>(z<sub>e</sub>) = {qp.toFixed(3)} kN/m² by application of the appropriate external pressure coefficient c<sub>pe</sub> as specified in EN 1991-1-4 §5.2(1):
                  </p>
                  <CalcStep label="" formula={'w_e = q_p(z_e) \\cdot c_{pe}'} result={<></>} />
                  <p style={PROSE}>
                    The internal wind pressure w<sub>i</sub> on the structure corresponds to the pressure effect on the interior surface of the roof. It is derived from the peak velocity pressure q<sub>p</sub>(z<sub>i</sub>) by application of the appropriate internal pressure coefficient c<sub>pi</sub> as specified in EN 1991-1-4 §5.2(2):
                  </p>
                  <CalcStep label="" formula={'w_i = q_p(z_i) \\cdot c_{pi}'} result={<></>} />
                  <p style={PROSE}>
                    The reference height for internal pressure z<sub>i</sub> is specified in EN 1991-1-4 §7.2.9(7) as equal to the reference height z<sub>e</sub> corresponding to the faces which contribute with their openings to the creation of the internal pressure. In this calculation it is assumed that z<sub>i</sub> = z<sub>e</sub> = {ze.toFixed(3)} m and q<sub>p</sub>(z<sub>i</sub>) = q<sub>p</sub>(z<sub>e</sub>) = {qp.toFixed(4)} kN/m².
                  </p>
                  <p style={PROSE}>
                    The net wind pressure w<sub>net</sub> on the surfaces of the structure corresponds to the combined effects of external and internal wind pressure. For structural surfaces consisting of only one skin the net pressure effect is determined as:
                  </p>
                  <CalcStep label="" formula={'w_{\\mathrm{net}} = w_e - w_i = q_p(z_e) \\cdot c_{pe} - q_p(z_i) \\cdot c_{pi}'} result={<></>} />
                </DetailGroup>

                {/* ── Net pressures per zone ── */}
                <DetailGroup title="Net wind pressure on each zone">
                  <p style={PROSE}>
                    For the case where no dominant face in terms of openings is present, the most unfavourable net wind pressure for each pressure zone is obtained by combining the corresponding external pressure coefficient c<sub>pe</sub> with the most unfavourable value of the internal pressure coefficient c<sub>pi,min</sub> = {cpiMin.toFixed(3)} or c<sub>pi,max</sub> = {cpiMax.toFixed(3)}. When c<sub>pe</sub> is positive then c<sub>pi,min</sub> is most onerous. When c<sub>pe</sub> is negative then c<sub>pi,max</sub> is most onerous.
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
                  <p style={{ ...PROSE, marginTop: 8 }}>
                    Negative net pressure values correspond to suction directed away from the external surface inducing uplift forces on the roof. For Zone I where positive and negative values are given, both values should be considered in design.
                  </p>
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

                {/* ── Additional notes ── */}
                <DetailGroup title="Additional notes">
                  <ul style={{ fontSize: 12, color: '#374151', lineHeight: 1.75, margin: 0, paddingLeft: 18 }}>
                    <li>If significant openings exist on the structure then internal wind pressure may need to be determined accurately as described in EN 1991-1-4 §5.2.</li>
                    <li>For canopy roofs (i.e. roofs without permanent walls) see EN 1991-1-4 §7.3.</li>
                    <li>The calculated wind action effects are characteristic values (unfactored). Appropriate load factors should be applied for the relevant design situation. For ULS verifications the partial load factor γ<sub>Q</sub> = 1.50 is applicable for variable actions according to EN 1990.</li>
                    <li>The external pressure coefficients c<sub>pe,10</sub> apply to loaded areas ≥ 10 m² and are appropriate for global structural verifications. For small elements and fixings (area ≤ 1 m²) the local coefficient c<sub>pe,1</sub> should be used instead.</li>
                  </ul>
                </DetailGroup>
              </>
            )
          })()}
        </DetailsSection>
      </div>
    </div>
  )
}

