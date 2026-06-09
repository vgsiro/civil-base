'use client'
import { NumInput, ResultRow, ResultsBox , LabelTip } from '../_lib/ui'
import { INPUT_STYLE, LABEL_STYLE, SELECT_STYLE, INPUT_GRID, INPUT_DIVIDER } from '../_lib/ui-styles'
import { TERRAIN_CATS } from '../_lib/wind-types'
import { calcPeakPressure } from '../_lib/wind-helpers'

// Group 1 — terrain + vb (top of every calculator)
export function WindPrimaryInputs({ vb, setVb, cat, setCat }: {
  vb: number; setVb: (v: number) => void
  cat: string; setCat: (v: string) => void
}) {
  return (
    <div style={INPUT_GRID}>
      <div>
        <LabelTip tip={"The terrain category describes the roughness of the upwind terrain. Categories 0–IV range from open sea (0) to urban areas with tall buildings (IV). It affects $z_0$, $z_{min}$, and the roughness factor $c_r$. See EN 1991-1-4 §4.3.2 and Annex A."}>Terrain category</LabelTip>
        <select style={SELECT_STYLE} value={cat} onChange={e => setCat(e.target.value)}>
          {TERRAIN_CATS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </div>
      <div>
        <LabelTip tip={"The basic wind velocity $v_b = v_{b,0} \\cdot c_{dir} \\cdot c_{season}$, where $v_{b,0}$ is the fundamental value defined in the National Annex. The directional and season factors are generally 1.0. See EN 1991-1-4 §4.2(1)P."}>v<sub>b</sub> — Basic wind velocity (m/s)</LabelTip>
        <NumInput style={INPUT_STYLE} min={0} max={100} step={0.5} value={vb} onChange={setVb} />
      </div>
    </div>
  )
}

// Group 2 — c0 + rho (after geometry, separated by a divider)
export function WindSecondaryInputs({ c0, setC0, rho, setRho }: {
  c0: number; setC0: (v: number) => void
  rho: number; setRho: (v: number) => void
}) {
  return (
    <div style={INPUT_GRID}>
      <div>
        <LabelTip tip={"The orography factor $c_0$ accounts for speed-up effects over isolated hills and escarpments. For flat terrain $c_0 = 1.0$. Values greater than 1.0 may apply at hilltops — see EN 1991-1-4 §4.3.3 and Annex A §A.3."}>c<sub>0</sub> — Orography factor</LabelTip>
        <NumInput style={INPUT_STYLE} min={1} max={2} step={0.05} value={c0} onChange={setC0} />
      </div>
      <div>
        <LabelTip tip={"Air density used to compute dynamic pressure. The default value is $1.25\\ \\mathrm{kg/m^3}$ per EN 1991-1-4 §4.5(1). It may be adjusted for altitude or temperature per the National Annex."}>ρ — Air density (kg/m³)</LabelTip>
        <NumInput style={INPUT_STYLE} min={1.0} max={1.35} step={0.005} value={rho} onChange={setRho} />
      </div>
    </div>
  )
}

// Legacy combined component — kept so WindQp still works unchanged
export function WindSharedInputs({ vb, setVb, cat, setCat, c0, setC0, rho, setRho }: {
  vb: number; setVb: (v: number) => void
  cat: string; setCat: (v: string) => void
  c0: number; setC0: (v: number) => void
  rho: number; setRho: (v: number) => void
}) {
  return (
    <>
      <WindPrimaryInputs vb={vb} setVb={setVb} cat={cat} setCat={setCat} />
      <WindSecondaryInputs c0={c0} setC0={setC0} rho={rho} setRho={setRho} />
    </>
  )
}

// Peak pressure result box — used by the qp calculator only
export function PeakPressureResult({ vb, cat, z, c0, rho, detailsId }: {
  vb: number; cat: string; z: number; c0: number; rho: number; detailsId?: string
}) {
  const r = calcPeakPressure(vb, z, cat, c0, rho)
  const scrollTo = detailsId ? () => document.getElementById(detailsId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) : undefined
  return (
    <ResultsBox title="Results">
      <ResultRow label={<>k<sub>r</sub> — roughness coefficient</>} value={r.kr.toFixed(4)} />
      <ResultRow label={<>z<sub>e</sub> — effective height (m)</>} value={r.ze.toFixed(2)} unit="m" />
      <ResultRow label={<>c<sub>r</sub>(z<sub>e</sub>) — terrain roughness factor</>} value={r.cr.toFixed(3)} />
      <ResultRow label={<>v<sub>m</sub>(z<sub>e</sub>) — mean wind velocity</>} value={r.vm.toFixed(2)} unit="m/s" />
      <ResultRow label={<>I<sub>v</sub>(z<sub>e</sub>) — turbulence intensity</>} value={r.Iv.toFixed(4)} />
      <ResultRow label={<>q<sub>p</sub>(z<sub>e</sub>) — peak velocity pressure</>} value={r.qp.toFixed(3)} unit="kPa" onClick={scrollTo} />
    </ResultsBox>
  )
}

export { INPUT_DIVIDER }
