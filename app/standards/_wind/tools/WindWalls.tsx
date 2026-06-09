'use client'
import React, { useState } from 'react'
import { TheoryBlock, NumInput, Table, TR, ResultRow, ResultsBox, DetailsSection, DetailGroup, CalcStep, InputDataTable, InputDataRow, Tex, TableRef , LabelTip } from '../../_lib/ui'
import { TH, TD, TDN, FORMULA_BOX, WIND_SECTION, INPUT_GRID, INPUT_STYLE, LABEL_STYLE, SELECT_STYLE, ZONE_PILL, WIND_IMG } from '../../_lib/ui-styles'
import { calcPeakPressure, getCpeWalls } from '../../_lib/wind-helpers'
import { TERRAIN_CATS } from '../../_lib/wind-types'
import { Table71, Table41 } from '../WindTables'
import { WindPrimaryInputs, WindSecondaryInputs, INPUT_DIVIDER } from '../WindShared'

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
  const [loadedArea, setLoadedArea] = useState<'cpe10' | 'cpe1'>('cpe10')

  const ze = wH
  const { kr, cr, vm, Iv, qp } = calcPeakPressure(vb, ze, cat, c0, rho)
  const hd = wH / wD
  const e = Math.min(wB, 2 * wH)

  // Zone C exists only when side wall depth d > e
  const zoneC_exists = wD > e

  // Zone widths for info
  const wA = e / 4
  const wB_zone = e - wA           // e/4 to e
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
    <div style={WIND_SECTION}>
      <TheoryBlock>
        <p><strong>EN 1991-1-4 §7.2.2</strong> — Vertical walls of rectangular-plan buildings.</p>
        <ul style={{ margin: '4px 0 4px 16px', padding: 0 }}>
          <li><strong>A</strong>: corner strip, depth e/4 — highest suction</li>
          <li><strong>B</strong>: strip e/4 to e — reduced suction</li>
          <li><strong>C</strong>: remainder beyond e (only when d &gt; e)</li>
          <li><strong>D</strong>: windward face — positive pressure</li>
          <li><strong>E</strong>: leeward face — suction</li>
        </ul>
        <p>c<sub>pe,10</sub> for loaded areas ≥ 10 m² (overall loads). c<sub>pe,1</sub> for areas ≤ 1 m² (cladding/fixings).</p>
      </TheoryBlock>
      <div style={FORMULA_BOX}>
        <strong>EN 1991-1-4 §7.2.2</strong> — w = q<sub>p</sub>·(c<sub>pe</sub> − c<sub>pi</sub>) &nbsp;|&nbsp; e = min(b, 2h) &nbsp;|&nbsp; z<sub>e</sub> = h
      </div>

      <WindPrimaryInputs vb={vb} setVb={setVb} cat={cat} setCat={setCat} />
      <div style={INPUT_GRID}>
        <div>
          <LabelTip tip={"Building dimension parallel to the wind direction. Used to determine $h/d$ ratio for $c_{pe}$ interpolation and to check whether Zone C exists (Zone C exists only when $d > e = \\min(b, 2h)$)."}>d — depth (wind dir.) (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={1} step={0.5} value={wD} onChange={setWD} />
        </div>
        <div>
          <LabelTip tip={"Building dimension perpendicular to the wind direction. Used to compute the characteristic length $e = \\min(b, 2h)$ which sets the widths of pressure zones A, B, C on the side walls."}>b — width (crosswind) (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={1} step={0.5} value={wB} onChange={setWB} />
        </div>
        <div>
          <LabelTip tip={"Overall building height. Used as the reference height $z_e = h$ for computing $q_p$, and in the characteristic length $e = \\min(b, 2h)$. Governs the $h/d$ ratio for $c_{pe}$ interpolation."}>h — building height (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={1} step={0.5} value={wH} onChange={setWH} />
        </div>
        <div>
          <LabelTip tip={"$c_{pe,10}$ applies to loaded areas $\\geq 10\\ \\mathrm{m}^2$ and is used for overall structural loads. $c_{pe,1}$ applies to areas $\\leq 1\\ \\mathrm{m}^2$ and governs local cladding and fixing design. See EN 1991-1-4 §7.2.1(1)."}>Loaded area (c<sub>pe</sub> selection)</LabelTip>
          <select style={SELECT_STYLE} value={loadedArea} onChange={e => setLoadedArea(e.target.value as 'cpe10' | 'cpe1')}>
            <option value="cpe10">{'>'}10 m² (cpe,10)</option>
            <option value="cpe1">≤1 m² (cpe,1)</option>
          </select>
        </div>
      </div>
      <hr style={INPUT_DIVIDER} />
      <div style={INPUT_GRID}>
        <div>
          <LabelTip tip={"Minimum internal pressure coefficient (suction). Combined with maximum external suction ($c_{pe}$ negative) to produce the most onerous outward net pressure. Typical values: $-0.3$ or $-0.5$ per EN 1991-1-4 §7.2.9."}>c<sub>pi,min</sub></LabelTip>
          <NumInput style={INPUT_STYLE} min={-0.5} max={0} step={0.05} value={cpiMin} onChange={setCpiMin} />
        </div>
        <div>
          <LabelTip tip={"Maximum internal pressure coefficient (positive pressure). Combined with external suction ($c_{pe}$ negative) to produce the most onerous inward net pressure. Typical values: $+0.2$ or $+0.3$ per EN 1991-1-4 §7.2.9."}>c<sub>pi,max</sub></LabelTip>
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

        <ResultsBox title="Results">
          <ResultRow
            label={<>q<sub>p</sub>(z<sub>e</sub>=h) — peak velocity pressure</>}
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

              <DetailGroup title="Input Data">
                <InputDataTable>
                  <InputDataRow param="Basic wind velocity" symbol={<Tex>{'v_b'}</Tex>} value={vb.toFixed(2)} unit="m/s" />
                  <InputDataRow param={<>Terrain category — <TableRef label="Table 4.1" renderTable={() => <Table41 />} /></>} symbol={<Tex>{'\\text{Cat.}'}</Tex>} value={`Cat. ${cat} — z₀ = ${z0} m, z_min = ${zmin} m`} />
                  <InputDataRow param="Building height (reference height)" symbol={<Tex>{'z_e = h'}</Tex>} value={wH.toFixed(2)} unit="m" />
                  <InputDataRow param="Orography factor at ze" symbol={<Tex>{'c_0(z_e)'}</Tex>} value={c0.toFixed(3)} />
                  <InputDataRow param="Air density" symbol={<Tex>{'\\rho'}</Tex>} value={rho.toFixed(2)} unit="kg/m³" />
                  <InputDataRow param="Building depth (wind direction)" symbol={<Tex>{'d'}</Tex>} value={wD.toFixed(2)} unit="m" />
                  <InputDataRow param="Building width (crosswind)" symbol={<Tex>{'b'}</Tex>} value={wB.toFixed(2)} unit="m" />
                  <InputDataRow param="Loaded area" symbol={<Tex>{'A'}</Tex>} value={loadedArea === 'cpe10' ? '≥ 10 m² (cpe,10)' : '≤ 1 m² (cpe,1)'} />
                  <InputDataRow param="Internal pressure coeff. (min / max)" symbol={<Tex>{'c_{pi}'}</Tex>} value={`${cpiMin.toFixed(3)} / +${cpiMax.toFixed(3)}`} />
                </InputDataTable>
              </DetailGroup>

              <DetailGroup title="Reference height">
                <p style={P}>
                  The reference height for the wind action z<sub>e</sub> is equal to the upper height of each wall part for the windward wall (zone D) and the maximum height above ground h for the leeward wall (zone E) and sidewalls (zones A, B, C), as specified in EN 1991-1-4 §7.2.2(1). For buildings where h ≤ b a single reference height applies to all zones. Therefore:
                </p>
                <CalcStep label="Reference height" formula={`z_e = h = ${wH.toFixed(3)}\\ \\mathrm{m}`} result={<></>} />
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
                  The roughness factor c<sub>r</sub>(z<sub>e</sub>) at the reference height z<sub>e</sub> accounts for the variability of the mean wind velocity at the site. It is calculated in accordance with EN 1991-1-4 equation (4.4). For the examined case z<sub>e</sub> = {zeEff.toFixed(3)} m {zeEff >= zmin ? '≥' : '<'} z<sub>min</sub> = {zmin} m:
                </p>
                <CalcStep
                  label={<>Roughness factor <Tex>{'c_r(z_e)'}</Tex> (EN 1991-1-4 §4.5 Eq. 4.4)</>}
                  formula={`c_r(z_e) = k_r \\cdot \\ln\\!\\left(\\frac{\\max(z_e,\\,z_{\\min})}{z_0}\\right) = ${kr.toFixed(4)} \\cdot \\ln\\!\\left(\\frac{\\max(${zeEff.toFixed(3)}\\ \\mathrm{m},\\,${zmin}\\ \\mathrm{m})}{${z0}\\ \\mathrm{m}}\\right) = ${cr.toFixed(4)}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title="Orography factor">
                <p style={P}>
                  Where orography (e.g. hills, cliffs etc.) is significant its effect on wind velocities should be taken into account using an orography factor c<sub>0</sub>(z<sub>e</sub>) different from 1.0, as specified in EN 1991-1-4 §4.3.3. The recommended procedure for calculation of the orography factor c<sub>0</sub>(z<sub>e</sub>) is described in EN 1991-1-4 Annex A.3. In the following calculations the orography factor is considered as c<sub>0</sub>(z<sub>e</sub>) = {c0.toFixed(3)}.
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
                  formula={`I_v(z_e) = \\frac{k_I}{c_0(z_e) \\cdot \\ln\\!\\left(\\frac{\\max(z_e,\\,z_{\\min})}{z_0}\\right)} = \\frac{1.000}{${c0.toFixed(3)} \\cdot \\ln\\!\\left(\\frac{\\max(${zeEff.toFixed(3)}\\ \\mathrm{m},\\,${zmin}\\ \\mathrm{m})}{${z0}\\ \\mathrm{m}}\\right)} = ${Iv.toFixed(4)}`}
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

              <DetailGroup title="Pressure coefficient type">
                <p style={P}>
                  The external pressure coefficients are divided into overall coefficients c<sub>pe,10</sub> and local coefficients c<sub>pe,1</sub> as described in EN 1991-1-4 §7.1.1(1) and §7.2.1(1). Local coefficients c<sub>pe,1</sub> correspond to wind pressure for loaded areas ≤ 1 m² and are used for the design of small elements and fixings. Overall coefficients c<sub>pe,10</sub> correspond to loaded areas ≥ 10 m² and are used for the design of the overall load bearing structure.
                </p>
                <p style={P}>
                  According to EN 1991-1-4 §7.2.1(1), for intermediate loaded areas A between 1 m² and 10 m² the pressure coefficient c<sub>pe</sub> may be interpolated logarithmically: c<sub>pe</sub> = c<sub>pe,1</sub> − (c<sub>pe,1</sub> − c<sub>pe,10</sub>) · log<sub>10</sub>(A). In this calculation the provided external pressure corresponds to <strong>{loadedArea === 'cpe10' ? 'c_pe,10 — applicable for global structural verifications' : 'c_pe,1 — applicable for local cladding and fixings'}</strong>.
                </p>
              </DetailGroup>

              <DetailGroup title="Pressure zones and external pressure coefficients">
                <p style={P}>
                  The wind load on the structure is expressed in terms of external pressure coefficients for five zones A, B, C, D, E as defined in EN 1991-1-4 Figures 7.4 and 7.5. The extent of the zones depends on the length e defined as:
                </p>
                <CalcStep
                  label={<>Characteristic length <Tex>{'e'}</Tex></>}
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
                  The external pressure coefficient c<sub>pe</sub> for each zone is defined in EN 1991-1-4 Table 7.1 as a function of the ratio h/d. For the examined case: h/d = {wH.toFixed(3)} m / {wD.toFixed(3)} m = {hd.toFixed(3)}. The following external pressure coefficients are obtained using linear interpolation where appropriate:
                </p>
                <CalcStep
                  label={<>Aspect ratio <Tex>{'h/d'}</Tex></>}
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
                      note={cpe < 0 ? 'Negative value — suction directed away from the wall surface towards the exterior.' : 'Positive value — pressure directed towards the wall surface.'}
                    />
                  )
                })}
              </DetailGroup>

              <DetailGroup title="Internal pressure coefficients">
                <p style={P}>
                  Internal pressure coefficients c<sub>pi</sub> are specified in EN 1991-1-4 §7.2.9 depending on the size and distribution of the openings of the building. A face of the building is considered dominant when the area of openings at that face is at least twice the area of openings in the remaining faces.
                </p>
                <p style={P}>
                  For a building without a dominant face, the most onerous internal pressure coefficient c<sub>pi</sub> = +0.2 or c<sub>pi</sub> = −0.3 should be considered, as specified in EN 1991-1-4 §7.2.9(6) Note 2. In this calculation: <strong>c<sub>pi,min</sub> = {cpiMin.toFixed(3)} and c<sub>pi,max</sub> = +{cpiMax.toFixed(3)}</strong>. Negative c<sub>pi</sub> values correspond to suction directed away from the internal surface, inducing forces towards the interior.
                </p>
              </DetailGroup>

              <DetailGroup title="Net wind pressure on each zone">
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
                  const governing = Math.abs(wmax) >= Math.abs(wmin) ? wmax : wmin
                  return (
                    <CalcStep key={zone}
                      label={<>Zone {zone} — <Tex>{`c_{pe,${zone}} = ${cpe.toFixed(3)}`}</Tex></>}
                      formula={`\\begin{aligned}w_{\\mathrm{net},${zone}}(c_{pi,\\max}) &= ${qp.toFixed(4)} \\cdot (${cpe.toFixed(3)} - ${cpiMax}) = ${wmax.toFixed(4)}\\ \\mathrm{kN/m^2}\\\\w_{\\mathrm{net},${zone}}(c_{pi,\\min}) &= ${qp.toFixed(4)} \\cdot (${cpe.toFixed(3)} - (${cpiMin})) = ${wmin.toFixed(4)}\\ \\mathrm{kN/m^2}\\end{aligned}`}
                      result={<></>}
                    />
                  )
                })}
              </DetailGroup>

              <DetailGroup title="Additional notes">
                <ul style={{ fontSize: 12, color: '#374151', lineHeight: 1.75, margin: 0, paddingLeft: 18 }}>
                  <li>If significant openings exist on the structure then internal wind pressure may need to be determined accurately as described in EN 1991-1-4 §5.2.</li>
                  <li>Lack of correlation between the windward side (zone D) and the leeward side (zone E) may be taken into account by application of a reduction coefficient to the resulting force as described in EN 1991-1-4 §7.2.2(3).</li>
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

