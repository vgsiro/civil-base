'use client'
import React from 'react'
import { TheoryBlock, NumInput, ResultRow, ResultsBox, DetailsSection, DetailGroup, CalcStep, InputDataTable, InputDataRow, Tex, TableRef , LabelTip } from '../../_lib/ui'
import { FORMULA_BOX, WIND_SECTION, INPUT_GRID, INPUT_STYLE, LABEL_STYLE, SELECT_STYLE } from '../../_lib/ui-styles'
import { CYL_SURFACES, TERRAIN_CATS } from '../../_lib/wind-types'
import { Table713, Table41 } from '../WindTables'
import { calcPeakPressure, getCfRect, getCylCf0, getPsiLambda, getEffectiveSlenderness, getCylEffectiveSlenderness } from '../../_lib/wind-helpers'
import { WindPrimaryInputs, WindSecondaryInputs, INPUT_DIVIDER } from '../WindShared'

interface RectProps {
  vb: number; setVb: (v: number) => void
  cat: string; setCat: (v: string) => void
  z: number; setZ: (v: number) => void
  c0: number; setC0: (v: number) => void
  rho: number; setRho: (v: number) => void
  elD: number; setElD: (v: number) => void
  elB: number; setElB: (v: number) => void
  elL: number; setElL: (v: number) => void
  elR: number; setElR: (v: number) => void
  elCscd: number; setElCscd: (v: number) => void
}

export function WindRect({ vb, setVb, cat, setCat, z, setZ, c0, setC0, rho, setRho, elD, setElD, elB, setElB, elL, setElL, elR, setElR, elCscd, setElCscd }: RectProps) {
  const qpResult = calcPeakPressure(vb, z, cat, c0, rho)
  const { kr, cr, vm, Iv, qp } = qpResult
  const db = elD / elB
  const cf0 = getCfRect(db)
  const psi_r = elR > 0 ? Math.max(0.5, 1 - (elR / elB)) : 1.0
  const { lambda, lambda15, lambda50 } = getEffectiveSlenderness(elL, elB)
  const psi_lam = getPsiLambda(lambda)
  const cf = cf0 * psi_r * psi_lam
  const Aref = elB * elL
  const Fw = elCscd * cf * qp * Aref
  return (
    <div style={WIND_SECTION}>
      <TheoryBlock>
        <p><strong>EN 1991-1-4 §7.6</strong> — Force coefficients for structural elements with rectangular cross-sections (prismatic members, bridge decks, beams).</p>
        <p><strong>Base force coefficient c<sub>f,0</sub></strong>: depends on the d/b ratio (depth parallel to wind / width perpendicular). From EN 1991-1-4 Figure 7.23 — sharp corners give c<sub>f,0</sub> ≈ 2.0 for square sections, decreasing as d/b increases (more streamlined).</p>
        <p><strong>Corner radius reduction ψ<sub>r</sub></strong>: rounded corners reduce c<sub>f</sub>. ψ<sub>r</sub> = 1 – 0.5·(r/b) for r/b ≤ 0.5, down to a minimum of 0.5.</p>
        <p><strong>Slenderness reduction ψ<sub>λ</sub></strong>: short elements have less drag than infinitely long ones due to end effects. λ = l / max(b, d). ψ<sub>λ</sub> ranges from 0.6 (λ = 1) to 1.0 (λ ≥ 70).</p>
        <p><strong>Overall drag force:</strong> F<sub>w</sub> = c<sub>s</sub>c<sub>d</sub> · c<sub>f,0</sub> · ψ<sub>r</sub> · ψ<sub>λ</sub> · q<sub>p</sub> · A<sub>ref</sub>, where A<sub>ref</sub> = b · l.</p>
      </TheoryBlock>
      <div style={FORMULA_BOX}>
        <strong>EN 1991-1-4 §7.6 Fig 7.23</strong> — Prismatic element, rectangular cross-section (sharp corners).<br />
        c<sub>f</sub> = c<sub>f,0</sub> · ψ<sub>r</sub> · ψ<sub>λ</sub> &nbsp;|&nbsp; F<sub>w</sub> = c<sub>s</sub>c<sub>d</sub> · c<sub>f</sub> · q<sub>p</sub> · A<sub>ref</sub>
      </div>
      <WindPrimaryInputs vb={vb} setVb={setVb} cat={cat} setCat={setCat} />
      <div style={INPUT_GRID}>
        <div>
          <LabelTip tip={"Reference height for computing the peak velocity pressure $q_p$. Typically taken at the centroid or top of the element. See EN 1991-1-4 §7.6."}>z<sub>e</sub> — reference height (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={1} step={0.5} value={z} onChange={setZ} />
        </div>
        <div>
          <LabelTip tip={"Cross-section depth measured parallel to the wind direction. Used in the $d/b$ ratio which governs the base force coefficient $c_{f,0}$ from EN 1991-1-4 Figure 7.23. Also used for slenderness $\\lambda = l/\\max(b,d)$."}>d — dim. parallel to wind (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={0.05} step={0.05} value={elD} onChange={setElD} />
        </div>
        <div>
          <LabelTip tip={"Cross-section width perpendicular to wind. Used in $d/b$ ratio for $c_{f,0}$, corner reduction $\\psi_r = 1 - 0.5(r/b)$, slenderness $\\lambda$, and reference area $A_{ref} = b \\cdot l$."}>b — dim. ⊥ to wind (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={0.05} step={0.05} value={elB} onChange={setElB} />
        </div>
        <div>
          <LabelTip tip={"Total length of the structural element. Used to compute the effective slenderness $\\lambda = l/\\max(b,d)$, which determines the end-effect reduction factor $\\psi_\\lambda$. Longer elements approach $\\psi_\\lambda = 1.0$."}>l — element length (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={0.1} step={0.5} value={elL} onChange={setElL} />
        </div>
        <div>
          <LabelTip tip={"Corner rounding radius of the rectangular cross-section. Rounded corners reduce drag: $\\psi_r = 1 - 0.5(r/b) \\geq 0.5$. Set to 0 for sharp (right-angle) corners. See EN 1991-1-4 §7.6 Figure 7.24."}>r — corner radius (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={0} step={0.01} value={elR} onChange={setElR} />
        </div>
      </div>
      <hr style={INPUT_DIVIDER} />
      <div style={INPUT_GRID}>
        <div>
          <LabelTip tip={"Structural factor per EN 1991-1-4 §6. Use 1.0 for most structural elements. Detailed evaluation needed for slender or dynamically sensitive members."}>c<sub>s</sub>c<sub>d</sub> — structural factor</LabelTip>
          <NumInput style={INPUT_STYLE} min={0.5} max={1.5} step={0.05} value={elCscd} onChange={setElCscd} />
        </div>
      </div>
      <WindSecondaryInputs c0={c0} setC0={setC0} rho={rho} setRho={setRho} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <ResultsBox title="Results">
          <ResultRow label={<>F<sub>w</sub> — total horizontal wind force</>} value={Fw.toFixed(3)} unit="kN" onClick={() => document.getElementById('rect-details')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
          <ResultRow label={<>c<sub>f</sub> = c<sub>f,0</sub>·ψ<sub>r</sub>·ψ<sub>λ</sub></>} value={cf.toFixed(3)} />
          <ResultRow label={<>A<sub>ref</sub> = b·l</>} value={Aref.toFixed(3)} unit="m²" />
        </ResultsBox>
        <DetailsSection id="rect-details">
          {(() => {
            const P: React.CSSProperties = { fontSize: 12, color: '#374151', lineHeight: 1.75, margin: '6px 0 10px' }
            const catData = TERRAIN_CATS.find(c => c.id === cat)!
            const z0 = catData.z0
            const zmin = catData.zmin
            const qb = 0.5 * rho * vb * vb / 1000
            const weff = Fw / Aref
            return (<>
              <p style={{ fontSize: 11, color: '#1e293b', marginBottom: 10 }}>
                <strong>According to:</strong> EN 1991-1-4:2005+A1:2010 §7.6 and Figure 7.23
              </p>

              <DetailGroup title="Input Data">
                <InputDataTable>
                  <InputDataRow param={<>Terrain category — <TableRef label="Table 4.1" renderTable={() => <Table41 />} /></>} symbol={<Tex>{'\\text{Cat.}'}</Tex>} value={`Cat. ${cat} — z₀=${z0} m, zmin=${zmin} m`} />
                  <InputDataRow param="Basic wind velocity" symbol={<Tex>{'v_b'}</Tex>} value={vb.toFixed(2)} unit="m/s" />
                  <InputDataRow param="Orography factor" symbol={<Tex>{'c_0(z_e)'}</Tex>} value={c0.toFixed(2)} />
                  <InputDataRow param="Air density" symbol={<Tex>{'\\rho'}</Tex>} value={rho.toFixed(2)} unit="kg/m³" />
                  <InputDataRow param="Dim. parallel to wind" symbol={<Tex>{'d'}</Tex>} value={elD.toFixed(3)} unit="m" />
                  <InputDataRow param="Dim. perpendicular to wind" symbol={<Tex>{'b'}</Tex>} value={elB.toFixed(3)} unit="m" />
                  <InputDataRow param="Corner radius" symbol={<Tex>{'r'}</Tex>} value={elR.toFixed(3)} unit="m" />
                  <InputDataRow param="Element length" symbol={<Tex>{'l'}</Tex>} value={elL.toFixed(2)} unit="m" />
                  <InputDataRow param="Maximum height above ground" symbol={<Tex>{'z'}</Tex>} value={z.toFixed(2)} unit="m" />
                  <InputDataRow param="Structural factor" symbol={<Tex>{'c_s c_d'}</Tex>} value={elCscd.toFixed(2)} />
                </InputDataTable>
              </DetailGroup>

              <DetailGroup title="Reference area and height">
                <p style={P}>
                  The reference height for the wind action z<sub>e</sub> is equal to the maximum height above ground of the section being considered, as specified in EN 1991-1-4 §7.6(2). The reference area for the wind action A<sub>ref</sub> is the projected area of the element being considered, as specified in EN 1991-1-4 §7.6(2). Therefore:
                </p>
                <CalcStep
                  label={<>Reference height <Tex>{'z_e'}</Tex></>}
                  formula={`z_e = z = ${z.toFixed(3)}\\ \\mathrm{m}`}
                  result={<></>}
                />
                <CalcStep
                  label={<>Reference area <Tex>{'A_{\\mathrm{ref}}'}</Tex></>}
                  formula={`A_{\\mathrm{ref}} = b \\cdot l = ${elB.toFixed(3)}\\ \\mathrm{m} \\cdot ${elL.toFixed(3)}\\ \\mathrm{m} = ${Aref.toFixed(3)}\\ \\mathrm{m^2}`}
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
                  The roughness length z<sub>0</sub> and the minimum height z<sub>min</sub> are specified in EN 1991-1-4 Table 4.1. For terrain category <strong>{cat}</strong>: z<sub>0</sub> = {z0} m and z<sub>min</sub> = {zmin} m. The terrain factor k<sub>r</sub> is calculated in accordance with EN 1991-1-4 equation (4.5):
                </p>
                <CalcStep
                  label={<>Terrain factor <Tex>{'k_r'}</Tex> (EN 1991-1-4 §4.5 Eq. 4.5)</>}
                  formula={`k_r = 0.19 \\cdot \\left(\\dfrac{z_0}{z_{0,\\mathrm{II}}}\\right)^{0.07} = 0.19 \\cdot \\left(\\dfrac{${z0}\\ \\mathrm{m}}{0.050\\ \\mathrm{m}}\\right)^{0.07} = ${kr.toFixed(4)}`}
                  result={<></>}
                />
                <p style={P}>
                  The roughness factor c<sub>r</sub>(z<sub>e</sub>) is calculated in accordance with EN 1991-1-4 equation (4.4). For the examined case z<sub>e</sub> {z >= zmin ? '≥' : '<'} z<sub>min</sub>:
                </p>
                <CalcStep
                  label={<>Roughness factor <Tex>{'c_r(z_e)'}</Tex> (EN 1991-1-4 §4.5 Eq. 4.4)</>}
                  formula={`c_r(z_e) = k_r \\cdot \\ln\\!\\left(\\frac{\\max(z_e,\\,z_{\\min})}{z_0}\\right) = ${kr.toFixed(4)} \\cdot \\ln\\!\\left(\\frac{\\max(${z.toFixed(3)}\\ \\mathrm{m},\\,${zmin}\\ \\mathrm{m})}{${z0}\\ \\mathrm{m}}\\right) = ${cr.toFixed(4)}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title="Orography factor">
                <p style={P}>
                  Where orography is significant, its effect on wind velocities is taken into account using an orography factor c<sub>0</sub>(z<sub>e</sub>) per EN 1991-1-4 §4.3.3. In these calculations:
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
                  For the examined case z<sub>e</sub> {z >= zmin ? '≥' : '<'} z<sub>min</sub>:
                </p>
                <CalcStep
                  label={<>Turbulence intensity <Tex>{'I_v(z_e)'}</Tex> (EN 1991-1-4 §4.4 Eq. 4.7)</>}
                  formula={`I_v(z_e) = \\frac{k_I}{c_0(z_e) \\cdot \\ln\\!\\left(\\dfrac{\\max(z_e,\\,z_{\\min})}{z_0}\\right)} = \\frac{1.000}{${c0.toFixed(3)} \\cdot \\ln\\!\\left(\\dfrac{\\max(${z.toFixed(3)}\\ \\mathrm{m},\\,${zmin}\\ \\mathrm{m})}{${z0}\\ \\mathrm{m}}\\right)} = ${Iv.toFixed(4)}`}
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

              <DetailGroup title="Calculation of wind forces on the structure">
                <p style={P}>
                  The wind force on the structure F<sub>w</sub> for the overall wind effect is estimated according to the force coefficient method as specified in EN 1991-1-4 §5.3:
                </p>
                <CalcStep
                  label=""
                  formula={`F_w = c_s c_d \\cdot c_f \\cdot q_p(z_e) \\cdot A_{\\mathrm{ref}}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title="Structural factor">
                <p style={P}>
                  The structural factor c<sub>s</sub>c<sub>d</sub> takes into account the structure size effects from the non-simultaneous occurrence of peak wind pressures on the surface and the dynamic effects of structural vibrations due to turbulence. A value of c<sub>s</sub>c<sub>d</sub> = 1.0 is generally conservative for small structures not susceptible to wind turbulence effects. In these calculations:
                </p>
                <CalcStep
                  label="Structural factor"
                  formula={`c_s c_d = ${elCscd.toFixed(3)}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title="Effective slenderness">
                <p style={P}>
                  The effective slenderness λ depends on the aspect ratio and the position of the structure and it is given in EN 1991-1-4 §7.13(2).
                </p>
                <CalcStep
                  label={<>For <Tex>{'l \\leq 15\\ \\mathrm{m}'}</Tex></>}
                  formula={`\\lambda_{15} = \\min\\!\\left(\\frac{2 \\cdot l}{b},\\, 70\\right) = \\min\\!\\left(\\frac{2 \\cdot ${elL.toFixed(3)}\\ \\mathrm{m}}{${elB.toFixed(3)}\\ \\mathrm{m}},\\, 70\\right) = ${lambda15.toFixed(3)}`}
                  result={<></>}
                />
                <CalcStep
                  label={<>For <Tex>{'l \\geq 50\\ \\mathrm{m}'}</Tex></>}
                  formula={`\\lambda_{50} = \\min\\!\\left(\\frac{1.4 \\cdot l}{b},\\, 70\\right) = \\min\\!\\left(\\frac{1.4 \\cdot ${elL.toFixed(3)}\\ \\mathrm{m}}{${elB.toFixed(3)}\\ \\mathrm{m}},\\, 70\\right) = ${lambda50.toFixed(3)}`}
                  result={<></>}
                />
                {elL > 15 && elL < 50 ? (
                  <CalcStep
                    label={<>Interpolated for <Tex>{`${elL.toFixed(3)}\\ \\mathrm{m}`}</Tex></>}
                    formula={`\\lambda = \\lambda_{15} + (\\lambda_{50} - \\lambda_{15}) \\cdot \\frac{l - 15\\ \\mathrm{m}}{50\\ \\mathrm{m} - 15\\ \\mathrm{m}} = ${lambda15.toFixed(3)} + (${lambda50.toFixed(3)} - ${lambda15.toFixed(3)}) \\cdot \\frac{${elL.toFixed(3)} - 15}{35} = ${lambda.toFixed(3)}`}
                    result={<></>}
                  />
                ) : (
                  <CalcStep
                    label={<>Effective slenderness <Tex>{'\\lambda'}</Tex></>}
                    formula={`\\lambda = ${lambda.toFixed(3)}`}
                    result={<></>}
                    note={elL <= 15 ? `l = ${elL.toFixed(3)} m ≤ 15 m, so λ = λ₁₅ = ${lambda.toFixed(3)}` : `l = ${elL.toFixed(3)} m ≥ 50 m, so λ = λ₅₀ = ${lambda.toFixed(3)}`}
                  />
                )}
              </DetailGroup>

              <DetailGroup title="End effect factor">
                <p style={P}>
                  The end effect factor ψ<sub>λ</sub> takes into account the reduced resistance of the structure due to the wind flow around the end. The value of ψ<sub>λ</sub> is calculated in accordance with EN 1991-1-4 §7.13. For solid structures (solidity ratio φ = 1.000) the value of the end effect factor ψ<sub>λ</sub> is determined from EN 1991-1-4 Figure 7.36 as a function of the slenderness λ = {lambda.toFixed(3)}:
                </p>
                <CalcStep
                  label={<>End effect factor <Tex>{'\\psi_\\lambda'}</Tex> (EN 1991-1-4 Figure 7.36)</>}
                  formula={`\\psi_\\lambda = ${psi_lam.toFixed(4)}`}
                  result={<></>}
                  note="Ranges from 0.60 (λ = 1) to 1.00 (λ ≥ 100). Accounts for pressure relief at the free ends of finite-length elements."
                />
              </DetailGroup>

              <DetailGroup title="Reduction factor for rounded corners">
                <p style={P}>
                  The reduction factor ψ<sub>r</sub> takes into account the effect of rounded corners. The value of ψ<sub>r</sub> is calculated in accordance with EN 1991-1-4 §7.6(1).{' '}
                  {elR === 0
                    ? <>For cross-sections with sharp corners (r = 0.000 m) there is no reduction, i.e. ψ<sub>r</sub> = 1.000.</>
                    : <>For r/b = {(elR/elB).toFixed(3)}, ψ<sub>r</sub> = max(0.5, 1 − r/b) = {psi_r.toFixed(4)}.</>
                  }
                </p>
                <CalcStep
                  label={<>Corner reduction factor <Tex>{'\\psi_r'}</Tex></>}
                  formula={`\\psi_r = ${psi_r.toFixed(4)}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title="Force coefficient without free-end flow">
                <p style={P}>
                  For elements with rectangular cross-section the force coefficient without free-end flow c<sub>f,0</sub> depends on the aspect ratio d/b of the cross-section. It is specified in EN 1991-1-4 §7.6(1) and determined from EN 1991-1-4 Figure 7.23 for d = {elD.toFixed(3)} m, b = {elB.toFixed(3)} m, d/b = {db.toFixed(3)}:
                </p>
                <CalcStep
                  label={<>Base force coefficient <Tex>{'c_{f,0}'}</Tex> (Figure 7.23)</>}
                  formula={`c_{f,0} = ${cf0.toFixed(4)}`}
                  result={<></>}
                  note={`d/b = ${db.toFixed(3)}. At d/b = 1 (square): cf,0 ≈ 2.0. Decreases as d/b increases (more streamlined shape).`}
                />
              </DetailGroup>

              <DetailGroup title="Force coefficient">
                <p style={P}>
                  The force coefficient c<sub>f</sub> for prism elements with rectangular cross-section is given in EN 1991-1-4 §7.6(1) as c<sub>f</sub> = c<sub>f,0</sub> · ψ<sub>r</sub> · ψ<sub>λ</sub>, where c<sub>f,0</sub> is the force coefficient without free-end flow, ψ<sub>r</sub> is the reduction factor for rounded corners, and ψ<sub>λ</sub> is the end effect factor, as calculated above:
                </p>
                <CalcStep
                  label={<>Force coefficient <Tex>{'c_f'}</Tex></>}
                  formula={`c_f = c_{f,0} \\cdot \\psi_r \\cdot \\psi_\\lambda = ${cf0.toFixed(4)} \\cdot ${psi_r.toFixed(4)} \\cdot ${psi_lam.toFixed(4)} = ${cf.toFixed(4)}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title="Total wind force">
                <p style={P}>
                  The total wind force on the structure F<sub>w</sub> is estimated as:
                </p>
                <CalcStep
                  label={<>Total wind force <Tex>{'F_w'}</Tex></>}
                  formula={`F_w = c_s c_d \\cdot c_f \\cdot q_p(z_e) \\cdot A_{\\mathrm{ref}} = ${elCscd.toFixed(3)} \\cdot ${cf.toFixed(4)} \\cdot ${qp.toFixed(4)}\\ \\mathrm{kN/m^2} \\cdot ${Aref.toFixed(3)}\\ \\mathrm{m^2} = ${Fw.toFixed(4)}\\ \\mathrm{kN}`}
                  result={<></>}
                />
                <p style={P}>
                  The total wind force F<sub>w</sub> takes into account the overall wind effect. The corresponding effective wind pressure w<sub>eff</sub> on the reference wind area A<sub>ref</sub> is equal to:
                </p>
                <CalcStep
                  label={<>Effective wind pressure <Tex>{'w_{\\mathrm{eff}}'}</Tex></>}
                  formula={`w_{\\mathrm{eff}} = \\frac{F_w}{A_{\\mathrm{ref}}} = \\frac{${Fw.toFixed(4)}\\ \\mathrm{kN}}{${Aref.toFixed(3)}\\ \\mathrm{m^2}} = ${weff.toFixed(4)}\\ \\mathrm{kN/m^2}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title="Additional notes">
                <ul style={{ fontSize: 12, color: '#374151', lineHeight: 1.75, margin: 0, paddingLeft: 18 }}>
                  <li>The effective pressure w<sub>eff</sub> = {weff.toFixed(4)} kN/m² is appropriate for global verifications of the structure according to the force coefficient method. It is not appropriate for local verifications of structural elements. For the latter case appropriate wind pressure on local surfaces must be estimated according to the relevant pressure coefficients, as specified in EN 1991-1-4 Section 7.</li>
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

interface CylProps {
  vb: number; setVb: (v: number) => void
  cat: string; setCat: (v: string) => void
  z: number; setZ: (v: number) => void
  c0: number; setC0: (v: number) => void
  rho: number; setRho: (v: number) => void
  cylDiam: number; setCylDiam: (v: number) => void
  cylL: number; setCylL: (v: number) => void
  cylSurf: string; setCylSurf: (v: string) => void
  cylCscd: number; setCylCscd: (v: number) => void
}

export function WindCylinder({ vb, setVb, cat, setCat, z, setZ, c0, setC0, rho, setRho, cylDiam, setCylDiam, cylL, setCylL, cylSurf, setCylSurf, cylCscd, setCylCscd }: CylProps) {
  const qpResult = calcPeakPressure(vb, z, cat, c0, rho)
  const { kr: cylKr, cr: cylCr, vm: cylVm, Iv: cylIv, qp } = qpResult
  const surf = CYL_SURFACES.find(s => s.id === cylSurf) ?? CYL_SURFACES[1]
  const nu = 15e-6
  // Re uses peak velocity v(ze) = sqrt(2·qp/ρ) per §7.9.1(1), not mean velocity
  const vPeak = Math.sqrt(2 * qp * 1000 / rho)  // qp in kPa → Pa = kN/m²×1000 N/kN
  const Re = vPeak * cylDiam / nu
  const kb = (surf.k / 1000) / cylDiam
  const cf0 = getCylCf0(Re, kb)
  const { lambda, lambda15, lambda50 } = getCylEffectiveSlenderness(cylL, cylDiam)
  const psi_lam = getPsiLambda(lambda)
  const cfFinal = cf0 * psi_lam
  const Aref = cylDiam * cylL
  const Fw = cylCscd * cfFinal * qp * Aref
  return (
    <div style={WIND_SECTION}>
      <TheoryBlock>
        <p><strong>EN 1991-1-4 §7.9.2</strong> — Circular cylinders: chimneys, tanks, silos, pipes, circular columns.</p>
        <p><strong>Reynolds number:</strong> Re = v<sub>m</sub> · b / ν, where b = diameter and ν = 15×10⁻⁶ m²/s (kinematic viscosity of air at 20°C).</p>
        <p><strong>Force coefficient c<sub>f</sub></strong> depends on Re and surface roughness k/b:</p>
        <ul style={{ margin: '4px 0 4px 16px', padding: 0 }}>
          <li>Re &lt; 5×10⁵ (subcritical): c<sub>f</sub> = 1.2 — bluff body, no turbulent transition</li>
          <li>5×10⁵ &lt; Re &lt; 5×10⁶ (critical): c<sub>f</sub> drops sharply as boundary layer transitions to turbulent</li>
          <li>Re &gt; 5×10⁶ (supercritical): c<sub>f</sub> ≈ 0.4–0.8 depending on surface roughness</li>
        </ul>
        <p><strong>Slenderness factor ψ<sub>λ</sub></strong>: same end-effect reduction as rectangular sections, based on λ = l/b.</p>
        <p><strong>Drag force:</strong> F<sub>w</sub> = c<sub>s</sub>c<sub>d</sub> · c<sub>f</sub> · ψ<sub>λ</sub> · q<sub>p</sub> · b · l</p>
      </TheoryBlock>
      <div style={FORMULA_BOX}>
        <strong>EN 1991-1-4 §7.9.2</strong> — Circular cylinders.<br />
        Re = v<sub>m</sub>·b/ν &nbsp;|&nbsp; c<sub>f</sub> depends on Re and k/b &nbsp;|&nbsp; F<sub>w</sub> = c<sub>s</sub>c<sub>d</sub> · c<sub>f</sub> · q<sub>p</sub> · b·l
      </div>
      <WindPrimaryInputs vb={vb} setVb={setVb} cat={cat} setCat={setCat} />
      <div style={INPUT_GRID}>
        <div>
          <LabelTip tip={"Reference height for computing $q_p$. Typically taken at the top or centroid of the cylinder. See EN 1991-1-4 §7.9.2."}>z<sub>e</sub> — reference height (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={1} step={0.5} value={z} onChange={setZ} />
        </div>
        <div>
          <LabelTip tip={"Outer diameter of the circular cylinder. Used to compute the Reynolds number $Re = v_m \\cdot b / \\nu$ and the reference area $A_{ref} = b \\cdot l$. Also used for slenderness $\\lambda = l/b$."}>b — diameter (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={0.05} step={0.05} value={cylDiam} onChange={setCylDiam} />
        </div>
        <div>
          <LabelTip tip={"Length (height) of the cylinder. Used in the slenderness factor $\\psi_\\lambda$ via $\\lambda = l/b$. Longer cylinders have $\\psi_\\lambda \\to 1.0$. Also sets the reference area $A_{ref} = b \\cdot l$."}>l — length (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={0.1} step={0.5} value={cylL} onChange={setCylL} />
        </div>
        <div>
          <LabelTip tip={"Equivalent roughness height $k$ of the cylinder surface. Governs the force coefficient $c_f$ in the critical and supercritical Reynolds number ranges. Smooth surfaces (galvanised steel, $k \\approx 0.2\\ \\mathrm{mm}$) give lower $c_f$ than rough surfaces (concrete, $k \\approx 1\\ \\mathrm{mm}$). See EN 1991-1-4 §7.9.2 Figure 7.28."}>Surface roughness</LabelTip>
          <select style={SELECT_STYLE} value={cylSurf} onChange={e => setCylSurf(e.target.value)}>
            {CYL_SURFACES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
      </div>
      <hr style={INPUT_DIVIDER} />
      <div style={INPUT_GRID}>
        <div>
          <LabelTip tip={"Structural factor per EN 1991-1-4 §6. Use 1.0 for most cylinders. Dynamically sensitive structures (chimneys, masts) may require a detailed calculation including vortex shedding."}>c<sub>s</sub>c<sub>d</sub> — structural factor</LabelTip>
          <NumInput style={INPUT_STYLE} min={0.5} max={1.5} step={0.05} value={cylCscd} onChange={setCylCscd} />
        </div>
      </div>
      <WindSecondaryInputs c0={c0} setC0={setC0} rho={rho} setRho={setRho} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <ResultsBox title="Results">
          <ResultRow label={<>F<sub>w</sub> — total horizontal wind force</>} value={Fw.toFixed(3)} unit="kN" onClick={() => document.getElementById('cyl-details')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
          <ResultRow label={<>c<sub>f</sub> = c<sub>f,0</sub>·ψ<sub>λ</sub></>} value={cfFinal.toFixed(3)} />
          <ResultRow label={<>Re = v(z<sub>e</sub>)·b/ν</>} value={Re.toExponential(3)} />
        </ResultsBox>
        <DetailsSection id="cyl-details">
          {(() => {
            const P: React.CSSProperties = { fontSize: 12, color: '#374151', lineHeight: 1.75, margin: '6px 0 10px' }
            const catData = TERRAIN_CATS.find(c => c.id === cat)!
            const z0 = catData.z0
            const zmin = catData.zmin
            const qb = 0.5 * rho * vb * vb / 1000
            const weff = Fw / Aref
            return (<>
              <p style={{ fontSize: 11, color: '#1e293b', marginBottom: 10 }}>
                <strong>According to:</strong> EN 1991-1-4:2005+A1:2010 §7.9.2 and Figure 7.28
              </p>

              <DetailGroup title="Input Data">
                <InputDataTable>
                  <InputDataRow param={<>Terrain category — <TableRef label="Table 4.1" renderTable={() => <Table41 />} /></>} symbol={<Tex>{'\\text{Cat.}'}</Tex>} value={`Cat. ${cat} — z₀=${z0} m, zmin=${zmin} m`} />
                  <InputDataRow param="Basic wind velocity" symbol={<Tex>{'v_b'}</Tex>} value={vb.toFixed(2)} unit="m/s" />
                  <InputDataRow param="Orography factor" symbol={<Tex>{'c_0(z_e)'}</Tex>} value={c0.toFixed(2)} />
                  <InputDataRow param="Air density" symbol={<Tex>{'\\rho'}</Tex>} value={rho.toFixed(2)} unit="kg/m³" />
                  <InputDataRow param="Cylinder diameter" symbol={<Tex>{'b'}</Tex>} value={cylDiam.toFixed(3)} unit="m" />
                  <InputDataRow param="Cylinder length" symbol={<Tex>{'l'}</Tex>} value={cylL.toFixed(2)} unit="m" />
                  <InputDataRow param="Maximum height above ground" symbol={<Tex>{'z'}</Tex>} value={z.toFixed(2)} unit="m" />
                  <InputDataRow param={<>Surface type — <TableRef label="Table 7.13" renderTable={() => <Table713 />} note="— equivalent roughness k" /></>} symbol={<Tex>{'k'}</Tex>} value={`${surf.label} — k = ${surf.k} mm`} />
                  <InputDataRow param="Structural factor" symbol={<Tex>{'c_s c_d'}</Tex>} value={cylCscd.toFixed(2)} />
                </InputDataTable>
              </DetailGroup>

              <DetailGroup title="Reference area and height">
                <p style={P}>
                  The reference height for the wind action z<sub>e</sub> is equal to the maximum height above ground of the section being considered, as specified in EN 1991-1-4 §7.9.2(5). The reference area for the wind action A<sub>ref</sub> is the projected area of the cylinder, as specified in EN 1991-1-4 §7.9.2(4). Therefore:
                </p>
                <CalcStep
                  label={<>Reference height <Tex>{'z_e'}</Tex></>}
                  formula={`z_e = z = ${z.toFixed(3)}\\ \\mathrm{m}`}
                  result={<></>}
                />
                <CalcStep
                  label={<>Reference area <Tex>{'A_{\\mathrm{ref}}'}</Tex></>}
                  formula={`A_{\\mathrm{ref}} = b \\cdot l = ${cylDiam.toFixed(3)}\\ \\mathrm{m} \\cdot ${cylL.toFixed(3)}\\ \\mathrm{m} = ${Aref.toFixed(3)}\\ \\mathrm{m^2}`}
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
                  The roughness length z<sub>0</sub> and the minimum height z<sub>min</sub> are specified in EN 1991-1-4 Table 4.1. For terrain category <strong>{cat}</strong>: z<sub>0</sub> = {z0} m and z<sub>min</sub> = {zmin} m. The terrain factor k<sub>r</sub> is calculated in accordance with EN 1991-1-4 equation (4.5):
                </p>
                <CalcStep
                  label={<>Terrain factor <Tex>{'k_r'}</Tex> (EN 1991-1-4 §4.5 Eq. 4.5)</>}
                  formula={`k_r = 0.19 \\cdot \\left(\\dfrac{z_0}{z_{0,\\mathrm{II}}}\\right)^{0.07} = 0.19 \\cdot \\left(\\dfrac{${z0}\\ \\mathrm{m}}{0.050\\ \\mathrm{m}}\\right)^{0.07} = ${cylKr.toFixed(4)}`}
                  result={<></>}
                />
                <p style={P}>
                  The roughness factor c<sub>r</sub>(z<sub>e</sub>) is calculated in accordance with EN 1991-1-4 equation (4.4). For the examined case z<sub>e</sub> {z >= zmin ? '≥' : '<'} z<sub>min</sub>:
                </p>
                <CalcStep
                  label={<>Roughness factor <Tex>{'c_r(z_e)'}</Tex> (EN 1991-1-4 §4.5 Eq. 4.4)</>}
                  formula={`c_r(z_e) = k_r \\cdot \\ln\\!\\left(\\frac{\\max(z_e,\\,z_{\\min})}{z_0}\\right) = ${cylKr.toFixed(4)} \\cdot \\ln\\!\\left(\\frac{\\max(${z.toFixed(3)}\\ \\mathrm{m},\\,${zmin}\\ \\mathrm{m})}{${z0}\\ \\mathrm{m}}\\right) = ${cylCr.toFixed(4)}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title="Orography factor">
                <p style={P}>
                  Where orography is significant, its effect on wind velocities is taken into account using an orography factor c<sub>0</sub>(z<sub>e</sub>) per EN 1991-1-4 §4.3.3. In these calculations:
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
                  formula={`v_m(z_e) = c_r(z_e) \\cdot c_0(z_e) \\cdot v_b = ${cylCr.toFixed(4)} \\cdot ${c0.toFixed(3)} \\cdot ${vb.toFixed(2)}\\ \\mathrm{m/s} = ${cylVm.toFixed(2)}\\ \\mathrm{m/s}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title="Wind turbulence">
                <p style={P}>
                  For the examined case z<sub>e</sub> {z >= zmin ? '≥' : '<'} z<sub>min</sub>:
                </p>
                <CalcStep
                  label={<>Turbulence intensity <Tex>{'I_v(z_e)'}</Tex> (EN 1991-1-4 §4.4 Eq. 4.7)</>}
                  formula={`I_v(z_e) = \\frac{k_I}{c_0(z_e) \\cdot \\ln\\!\\left(\\dfrac{\\max(z_e,\\,z_{\\min})}{z_0}\\right)} = \\frac{1.000}{${c0.toFixed(3)} \\cdot \\ln\\!\\left(\\dfrac{\\max(${z.toFixed(3)}\\ \\mathrm{m},\\,${zmin}\\ \\mathrm{m})}{${z0}\\ \\mathrm{m}}\\right)} = ${cylIv.toFixed(4)}`}
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
                  formula={`q_p(z_e) = (1 + 7 \\cdot I_v(z_e)) \\cdot \\tfrac{1}{2} \\cdot \\rho \\cdot v_m(z_e)^2 = (1 + 7 \\cdot ${cylIv.toFixed(4)}) \\cdot \\tfrac{1}{2} \\cdot ${rho.toFixed(2)}\\ \\mathrm{kg/m^3} \\cdot (${cylVm.toFixed(2)}\\ \\mathrm{m/s})^2 = ${(qp*1000).toFixed(0)}\\ \\mathrm{N/m^2}`}
                  result={<></>}
                  note="Note that by definition 1 N = 1 kg·m/s²."
                />
                <CalcStep
                  label=""
                  formula={`\\Rightarrow q_p(z_e) = ${qp.toFixed(4)}\\ \\mathrm{kN/m^2}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title="Wind velocity corresponding to peak velocity pressure">
                <p style={P}>
                  The peak wind velocity v(z<sub>e</sub>) at reference height z<sub>e</sub> is the wind velocity corresponding to the peak velocity pressure q<sub>p</sub>(z<sub>e</sub>). It is calculated according to the following fundamental relation, as specified in EN 1991-1-4 §4.5(1):
                </p>
                <CalcStep
                  label={<>Peak wind velocity <Tex>{'v(z_e)'}</Tex></>}
                  formula={`v(z_e) = \\sqrt{\\frac{2 \\cdot q_p(z_e)}{\\rho}} = \\sqrt{\\frac{2 \\cdot ${(qp*1000).toFixed(0)}\\ \\mathrm{N/m^2}}{${rho.toFixed(2)}\\ \\mathrm{kg/m^3}}} = \\sqrt{${(2*qp*1000/rho).toFixed(1)}\\ \\mathrm{m^2/s^2}} = ${vPeak.toFixed(3)}\\ \\mathrm{m/s}`}
                  result={<></>}
                  note="Note that by definition 1 N = 1 kg·m/s²."
                />
              </DetailGroup>

              <DetailGroup title="Calculation of wind forces on the structure">
                <p style={P}>
                  The wind force on the structure F<sub>w</sub> for the overall wind effect is estimated according to the force coefficient method as specified in EN 1991-1-4 §5.3:
                </p>
                <CalcStep
                  label=""
                  formula={`F_w = c_s c_d \\cdot c_f \\cdot q_p(z_e) \\cdot A_{\\mathrm{ref}}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title="Structural factor">
                <p style={P}>
                  The structural factor c<sub>s</sub>c<sub>d</sub> takes into account the structure size effects from the non-simultaneous occurrence of peak wind pressures on the surface and the dynamic effects of structural vibrations due to turbulence. A value of c<sub>s</sub>c<sub>d</sub> = 1.0 is generally conservative for small structures not susceptible to wind turbulence effects such as chimneys with circular cross-sections whose height is less than 60 m and 6.5 times the diameter. In these calculations:
                </p>
                <CalcStep
                  label="Structural factor"
                  formula={`c_s c_d = ${cylCscd.toFixed(3)}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title="Reynolds number">
                <p style={P}>
                  Reynolds number characterises the air flow around the object. For air flow around cylindrical objects Reynolds number is calculated according to EN 1991-1-4 §7.9.1(1), where the kinematic viscosity of the air is ν = 15.0×10⁻⁶ m²/s:
                </p>
                <CalcStep
                  label={<>Reynolds number <Tex>{'Re'}</Tex> (EN 1991-1-4 §7.9.1(1))</>}
                  formula={`Re = \\frac{b \\cdot v(z_e)}{\\nu} = \\frac{${cylDiam.toFixed(3)}\\ \\mathrm{m} \\cdot ${vPeak.toFixed(3)}\\ \\mathrm{m/s}}{15.0 \\times 10^{-6}\\ \\mathrm{m^2/s}} = ${Re.toExponential(4)}`}
                  result={<></>}
                  note={`Flow regime: ${Re < 5e5 ? 'Subcritical (Re < 5×10⁵)' : Re < 5e6 ? 'Critical (5×10⁵ < Re < 5×10⁶)' : 'Supercritical (Re > 5×10⁶)'}.`}
                />
              </DetailGroup>

              <DetailGroup title="Effective slenderness">
                <p style={P}>
                  The effective slenderness λ depends on the aspect ratio and the position of the structure and it is given in EN 1991-1-4 §7.13(2).
                </p>
                <CalcStep
                  label={<>For <Tex>{'l \\leq 15\\ \\mathrm{m}'}</Tex></>}
                  formula={`\\lambda_{15} = \\min\\!\\left(\\frac{l}{b},\\, 70\\right) = \\min\\!\\left(\\frac{${cylL.toFixed(3)}\\ \\mathrm{m}}{${cylDiam.toFixed(3)}\\ \\mathrm{m}},\\, 70\\right) = ${lambda15.toFixed(3)}`}
                  result={<></>}
                />
                <CalcStep
                  label={<>For <Tex>{'l \\geq 50\\ \\mathrm{m}'}</Tex></>}
                  formula={`\\lambda_{50} = \\min\\!\\left(\\frac{0.7 \\cdot l}{b},\\, 70\\right) = \\min\\!\\left(\\frac{0.7 \\cdot ${cylL.toFixed(3)}\\ \\mathrm{m}}{${cylDiam.toFixed(3)}\\ \\mathrm{m}},\\, 70\\right) = ${lambda50.toFixed(3)}`}
                  result={<></>}
                />
                {cylL > 15 && cylL < 50 ? (
                  <CalcStep
                    label={<>Interpolated for <Tex>{`l = ${cylL.toFixed(3)}\\ \\mathrm{m}`}</Tex></>}
                    formula={`\\lambda = \\lambda_{15} + (\\lambda_{50} - \\lambda_{15}) \\cdot \\frac{l - 15\\ \\mathrm{m}}{50\\ \\mathrm{m} - 15\\ \\mathrm{m}} = ${lambda15.toFixed(3)} + (${lambda50.toFixed(3)} - ${lambda15.toFixed(3)}) \\cdot \\frac{${cylL.toFixed(3)} - 15}{35} = ${lambda.toFixed(3)}`}
                    result={<></>}
                  />
                ) : (
                  <CalcStep
                    label={<>Effective slenderness <Tex>{'\\lambda'}</Tex></>}
                    formula={`\\lambda = ${lambda.toFixed(3)}`}
                    result={<></>}
                    note={cylL <= 15 ? `l = ${cylL.toFixed(3)} m ≤ 15 m, so λ = λ₁₅ = ${lambda.toFixed(3)}` : `l = ${cylL.toFixed(3)} m ≥ 50 m, so λ = λ₅₀ = ${lambda.toFixed(3)}`}
                  />
                )}
              </DetailGroup>

              <DetailGroup title="End effect factor">
                <p style={P}>
                  The end effect factor ψ<sub>λ</sub> takes into account the reduced resistance of the structure due to the wind flow around the end. For solid structures (solidity ratio φ = 1.000) the value of ψ<sub>λ</sub> is determined from EN 1991-1-4 Figure 7.36 as a function of the slenderness λ = {lambda.toFixed(3)}:
                </p>
                <CalcStep
                  label={<>End effect factor <Tex>{'\\psi_\\lambda'}</Tex> (EN 1991-1-4 Figure 7.36)</>}
                  formula={`\\psi_\\lambda = ${psi_lam.toFixed(4)}`}
                  result={<></>}
                  note="Ranges from 0.60 (λ = 1) to 1.00 (λ ≥ 100). Accounts for pressure relief at the free ends of finite-length cylinders."
                />
              </DetailGroup>

              <DetailGroup title="Equivalent surface roughness">
                <p style={P}>
                  The equivalent surface roughness k depends on the surface type and it is given in EN 1991-1-4 §7.9.2(2). According to EN 1991-1-4 Table 7.13 for surface type "<strong>{surf.label}</strong>" the corresponding equivalent surface roughness is k = {surf.k} mm:
                </p>
                <CalcStep
                  label="Equivalent surface roughness"
                  formula={`k = ${surf.k}\\ \\mathrm{mm}`}
                  result={<></>}
                />
                <CalcStep
                  label={<>Relative roughness <Tex>{'k/b'}</Tex></>}
                  formula={`k/b = \\frac{${surf.k}\\ \\mathrm{mm} / 1000}{${cylDiam.toFixed(3)}\\ \\mathrm{m}} = ${kb.toFixed(6)}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title="Force coefficient without free-end flow">
                <p style={P}>
                  For circular cylinders the force coefficient without free-end flow c<sub>f,0</sub> depends on the Reynolds number Re and the normalised equivalent surface roughness k/b. The value c<sub>f,0</sub> is determined according to EN 1991-1-4 Figure 7.28 for the values of Re = {Re.toExponential(4)}, k = {surf.k} mm, b = {cylDiam.toFixed(3)} m, k/b = {kb.toFixed(6)}:
                </p>
                <CalcStep
                  label={<>Force coefficient without free-end flow <Tex>{'c_{f,0}'}</Tex> (Figure 7.28)</>}
                  formula={`c_{f,0} = ${cf0.toFixed(4)}`}
                  result={<></>}
                  note={`${Re < 5e5 ? 'Subcritical range: cf,0 = 1.2 (constant).' : Re < 5e6 ? 'Critical range: cf,0 drops sharply as the boundary layer transitions to turbulent.' : 'Supercritical range: cf,0 levels off, value depends on surface roughness.'}`}
                />
              </DetailGroup>

              <DetailGroup title="Force coefficient">
                <p style={P}>
                  The force coefficient c<sub>f</sub> for finite cylinders is given in EN 1991-1-4 §7.9.2(1) as c<sub>f</sub> = c<sub>f,0</sub> · ψ<sub>λ</sub>, where c<sub>f,0</sub> is the force coefficient without free-end flow and ψ<sub>λ</sub> is the end effect factor, as calculated above:
                </p>
                <CalcStep
                  label={<>Force coefficient <Tex>{'c_f'}</Tex></>}
                  formula={`c_f = c_{f,0} \\cdot \\psi_\\lambda = ${cf0.toFixed(4)} \\cdot ${psi_lam.toFixed(4)} = ${cfFinal.toFixed(4)}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title="Total wind force">
                <p style={P}>
                  The total wind force on the structure F<sub>w</sub> is estimated as:
                </p>
                <CalcStep
                  label={<>Total wind force <Tex>{'F_w'}</Tex></>}
                  formula={`F_w = c_s c_d \\cdot c_f \\cdot q_p(z_e) \\cdot A_{\\mathrm{ref}} = ${cylCscd.toFixed(3)} \\cdot ${cfFinal.toFixed(4)} \\cdot ${qp.toFixed(4)}\\ \\mathrm{kN/m^2} \\cdot ${Aref.toFixed(3)}\\ \\mathrm{m^2} = ${Fw.toFixed(4)}\\ \\mathrm{kN}`}
                  result={<></>}
                />
                <p style={P}>
                  The total wind force F<sub>w</sub> takes into account the overall wind effect. The corresponding effective wind pressure w<sub>eff</sub> on the reference wind area A<sub>ref</sub> is equal to:
                </p>
                <CalcStep
                  label={<>Effective wind pressure <Tex>{'w_{\\mathrm{eff}}'}</Tex></>}
                  formula={`w_{\\mathrm{eff}} = \\frac{F_w}{A_{\\mathrm{ref}}} = \\frac{${Fw.toFixed(4)}\\ \\mathrm{kN}}{${Aref.toFixed(3)}\\ \\mathrm{m^2}} = ${weff.toFixed(4)}\\ \\mathrm{kN/m^2}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title="Additional notes">
                <ul style={{ fontSize: 12, color: '#374151', lineHeight: 1.75, margin: 0, paddingLeft: 18 }}>
                  <li>The effective pressure w<sub>eff</sub> = {weff.toFixed(4)} kN/m² is appropriate for global verifications of the structure according to the force coefficient method. It is not appropriate for local verifications of structural elements, such as the shell of the cylinder. For the latter case appropriate wind pressure on local surfaces must be estimated according to the relevant external pressure coefficients, as specified in EN 1991-1-4 §7.9.1.</li>
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

