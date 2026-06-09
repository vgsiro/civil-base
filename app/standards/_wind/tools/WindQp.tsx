'use client'
import { TheoryBlock, NumInput, Table, TR, LabelTip } from '../../_lib/ui'
import { TH, TD, TDN, TDL, FORMULA_BOX, WIND_SECTION, WIND_IMG, INPUT_GRID, INPUT_STYLE, LABEL_STYLE } from '../../_lib/ui-styles'
import { TERRAIN_CATS } from '../../_lib/wind-types'
import { calcPeakPressure } from '../../_lib/wind-helpers'
import { WindPrimaryInputs, WindSecondaryInputs, PeakPressureResult, INPUT_DIVIDER } from '../WindShared'
import WindPeakDetails from '../WindPeakDetails'

const TERRAIN_IMGS: Record<string, string> = WIND_IMG.terrain

interface Props {
  vb: number; setVb: (v: number) => void
  cat: string; setCat: (v: string) => void
  z: number; setZ: (v: number) => void
  c0: number; setC0: (v: number) => void
  rho: number; setRho: (v: number) => void
}

export default function WindQp({ vb, setVb, cat, setCat, z, setZ, c0, setC0, rho, setRho }: Props) {
  return (
    <div style={WIND_SECTION}>
      <TheoryBlock>
        <p><strong>EN 1991-1-4 §4.3–§4.5</strong> defines the wind velocity profile and peak velocity pressure over terrain.</p>
        <p><strong>Basic wind velocity:</strong> v<sub>b</sub> = v<sub>b,0</sub> · c<sub>dir</sub> · c<sub>season</sub>, where c<sub>dir</sub> and c<sub>season</sub> are typically 1.0.</p>
        <p><strong>Roughness factor:</strong> k<sub>r</sub> = 0.19 · (z₀ / z₀,II)^0.07 — depends only on terrain category, with z₀,II = 0.05 m as reference.</p>
        <p><strong>Roughness factor at height z:</strong> c<sub>r</sub>(z) = k<sub>r</sub> · ln(max(z, z<sub>min</sub>) / z₀)</p>
        <p><strong>Mean wind velocity:</strong> v<sub>m</sub>(z) = c<sub>r</sub>(z) · c<sub>0</sub>(z) · v<sub>b</sub> — the orography factor c<sub>0</sub> accounts for acceleration over hills.</p>
        <p><strong>Turbulence intensity:</strong> I<sub>v</sub>(z) = σ<sub>v</sub> / v<sub>m</sub>(z) = k<sub>r</sub> / (c<sub>0</sub> · ln(z / z₀))</p>
        <p><strong>Peak velocity pressure:</strong> q<sub>p</sub>(z) = [1 + 7·I<sub>v</sub>(z)] · ½ · ρ · v<sub>m</sub>²(z)  [kPa]</p>
        <p>The factor (1 + 7·I<sub>v</sub>) converts mean to peak using a gust factor. Air density ρ = 1.25 kg/m³ by default.</p>
      </TheoryBlock>
      <div style={FORMULA_BOX}>
        k<sub>r</sub> = 0.19·(z₀/0.05)^0.07 &nbsp;|&nbsp; c<sub>r</sub> = k<sub>r</sub>·ln(z/z₀) &nbsp;|&nbsp; v<sub>m</sub> = c<sub>r</sub>·c₀·v<sub>b</sub><br />
        I<sub>v</sub> = k<sub>r</sub>/(c₀·ln(z/z₀)) &nbsp;|&nbsp; <strong>q<sub>p</sub> = [1+7·I<sub>v</sub>]·½·ρ·v<sub>m</sub>²</strong>
      </div>
      <WindPrimaryInputs vb={vb} setVb={setVb} cat={cat} setCat={setCat} />
      <div style={INPUT_GRID}>
        <div>
          <LabelTip tip="The height above ground at which the peak velocity pressure is evaluated. For buildings, $z_e$ is typically taken as the height of the structure or zone being designed. Range: 0.5–300 m. See EN 1991-1-4 §7.2.2.">
            z<sub>e</sub> — Reference height (m)
          </LabelTip>
          <NumInput style={INPUT_STYLE} min={0.5} max={300} step={0.5} value={z} onChange={setZ} />
        </div>
      </div>
      <hr style={INPUT_DIVIDER} />
      <WindSecondaryInputs c0={c0} setC0={setC0} rho={rho} setRho={setRho} />
      <PeakPressureResult vb={vb} cat={cat} z={z} c0={c0} rho={rho} detailsId="qp-details" />
      {/* terrain category images */}
      <div style={{ overflowX: 'auto' }}>
        <Table>
          <thead><tr>
            <th style={TH}>Cat.</th><th style={TH}>z₀ (m)</th><th style={TH}>z<sub>min</sub> (m)</th><th style={{ ...TH, textAlign: 'left' }}>Description</th><th style={TH}>Illustration</th>
          </tr></thead>
          <tbody>{TERRAIN_CATS.map((c, i) => (
            <TR key={c.id} stripe={i % 2 !== 0}>
              <td style={{ ...TD, fontWeight: 700, color: '#3b82f6' }}>{c.id}</td>
              <td style={TDN}>{c.z0}</td><td style={TDN}>{c.zmin}</td>
              <td style={TDL}>{c.label.split(' — ')[1]}</td>
              <td style={{ ...TD, padding: '4px 8px' }}>
                <img src={TERRAIN_IMGS[c.id]} alt={`Terrain category ${c.id}`} style={{ width: 80, height: 52, objectFit: 'cover', borderRadius: 4, display: 'block' }} />
              </td>
            </TR>
          ))}</tbody>
        </Table>
      </div>
      <WindPeakDetails vb={vb} cat={cat} z={z} c0={c0} rho={rho} id="qp-details" />
    </div>
  )
}
