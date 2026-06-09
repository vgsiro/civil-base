'use client'
import React from 'react'
import { TheoryBlock, NumInput, ResultRow, ResultsBox, DetailsSection, DetailGroup, CalcStep, InputDataTable, InputDataRow, Tex, TableRef, LabelTip } from '../../_lib/ui'
import { Table41 } from '../WindTables'
import { FORMULA_BOX, WIND_SECTION, INPUT_GRID, INPUT_STYLE, LABEL_STYLE, WIND_IMG } from '../../_lib/ui-styles'
import { calcPeakPressure } from '../../_lib/wind-helpers'
import { TERRAIN_CATS } from '../../_lib/wind-types'
import { WindPrimaryInputs, WindSecondaryInputs, INPUT_DIVIDER } from '../WindShared'

interface Props {
  vb: number; setVb: (v: number) => void
  cat: string; setCat: (v: string) => void
  c0: number; setC0: (v: number) => void
  rho: number; setRho: (v: number) => void
  sgW: number; setSgW: (v: number) => void
  sgH: number; setSgH: (v: number) => void
  sgZg: number; setSgZg: (v: number) => void
  sgCscd: number; setSgCscd: (v: number) => void
  sgEcc: number; setSgEcc: (v: number) => void
}

export default function WindSign({ vb, setVb, cat, setCat, c0, setC0, rho, setRho, sgW, setSgW, sgH, setSgH, sgZg, setSgZg, sgCscd, setSgCscd, sgEcc, setSgEcc }: Props) {
  // ze = centre of sign per EN 1991-1-4 §7.4.3(3)
  const ze = sgZg + sgH / 2
  const qpResult = calcPeakPressure(vb, ze, cat, c0, rho)
  const { kr, cr, vm, Iv, qp } = qpResult
  const cf = 1.80
  const Aref = sgW * sgH
  const Fw = sgCscd * cf * qp * Aref
  const zcp = sgZg + sgH / 2   // same as ze
  const Mbase = Fw * zcp        // overturning moment at base
  const eccDist = sgEcc * sgW   // horizontal eccentricity
  const Tw = eccDist * Fw       // torsional moment at base
  return (
    <div style={WIND_SECTION}>
      <TheoryBlock>
        <p><strong>EN 1991-1-4 §7.4.3</strong> — Rectangular signboards mounted on a single pole or frame, separated from the ground.</p>
        <img src={WIND_IMG.signboard} alt="Signboard geometry notation" style={{ width: '100%', maxWidth: 400, borderRadius: 6, margin: '6px 0', display: 'block' }} />
        <p><strong>Force coefficient:</strong> c<sub>f</sub> = 1.80 (constant, regardless of aspect ratio).</p>
        <p><strong>Eccentricity:</strong> The resultant wind force does not act at the geometric centre. EN 1991-1-4 specifies e = ±0.25·b from the centre, which creates a torsional moment about the vertical axis. Both ±e cases must be checked.</p>
        <p><strong>Reference area:</strong> A<sub>ref</sub> = b × h (width × height of the sign face).</p>
        <p><strong>Reference height:</strong> z<sub>e</sub> = z<sub>g</sub> + h/2 (centre of sign per §7.4.3(3)).</p>
        <p><strong>Overturning moment at base:</strong> M<sub>w</sub> = F<sub>w</sub> · (z<sub>g</sub> + h/2). <strong>Torsional moment:</strong> T<sub>w</sub> = ±(e/b) · b · F<sub>w</sub>.</p>
      </TheoryBlock>
      <div style={FORMULA_BOX}>
        <strong>EN 1991-1-4 §7.4.3</strong> — Rectangular signboards.<br />
        c<sub>f</sub> = 1.80 &nbsp;|&nbsp; z<sub>e</sub> = z<sub>g</sub> + h/2 &nbsp;|&nbsp; F<sub>w</sub> = c<sub>s</sub>c<sub>d</sub> · 1.80 · q<sub>p</sub> · b·h<br />
        M<sub>w</sub> = F<sub>w</sub> · (z<sub>g</sub> + h/2) &nbsp;|&nbsp; T<sub>w</sub> = ±(e/b) · b · F<sub>w</sub>
      </div>
      <WindPrimaryInputs vb={vb} setVb={setVb} cat={cat} setCat={setCat} />
      <div style={INPUT_GRID}>
        <div>
          <LabelTip tip={"The horizontal width of the sign face. Defines the reference area $A_{ref} = b \\times h$. Also used to compute horizontal eccentricity: $e = \\pm 0.25 b$ from the geometric centre. See EN 1991-1-4 §7.4.3(2)."}>b — signboard width (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={0.1} step={0.1} value={sgW} onChange={setSgW} />
        </div>
        <div>
          <LabelTip tip={"The vertical height of the sign face. The centre of pressure is at mid-height: $z_{cp} = z_g + h/2$. Together with $b$ it defines the reference area $A_{ref} = b \\times h$."}>h — signboard height (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={0.1} step={0.1} value={sgH} onChange={setSgH} />
        </div>
        <div>
          <LabelTip tip={"Vertical distance from ground level to the bottom edge of the signboard. The reference height for $q_p$ is $z_e = z_g + h/2$ (centre of sign). Must be $> 0$ for signs separated from the ground. See EN 1991-1-4 §7.4.3(3)."}>z<sub>g</sub> — gap to ground (m)</LabelTip>
          <NumInput style={INPUT_STYLE} min={0} step={0.1} value={sgZg} onChange={setSgZg} />
        </div>
      </div>
      <hr style={INPUT_DIVIDER} />
      <div style={INPUT_GRID}>
        <div>
          <LabelTip tip={"The resultant wind force acts at eccentricity $e = \\pm(e/b) \\cdot b$ from the geometric centre, creating a torsional moment $T_w = \\pm(e/b) \\cdot b \\cdot F_w$. The standard default is $e/b = 0.25$. Both $+e$ and $-e$ cases must be checked. See EN 1991-1-4 §7.4.3."}>e/b eccentricity ratio (±)</LabelTip>
          <NumInput style={INPUT_STYLE} min={0} max={0.5} step={0.05} value={sgEcc} onChange={setSgEcc} />
        </div>
        <div>
          <LabelTip tip={"Structural factor $c_s c_d$ accounting for size and dynamic effects. A value of 1.0 is generally conservative for signboards not susceptible to wind turbulence effects. For dynamically sensitive signs, evaluate per EN 1991-1-4 §6."}>c<sub>s</sub>c<sub>d</sub> — structural factor</LabelTip>
          <NumInput style={INPUT_STYLE} min={0.5} max={1.5} step={0.05} value={sgCscd} onChange={setSgCscd} />
        </div>
      </div>
      <WindSecondaryInputs c0={c0} setC0={setC0} rho={rho} setRho={setRho} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <img src={WIND_IMG.signboard} alt="Signboard geometry notation" style={{ width: '100%', maxWidth: 480, borderRadius: 6, display: 'block' }} />
        <ResultsBox title="Results">
          <ResultRow label={<>F<sub>w</sub> — total horizontal wind force</>} value={Fw.toFixed(3)} unit="kN" onClick={() => document.getElementById('sign-details')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
          <ResultRow label={<>M<sub>w</sub> — overturning moment at base</>} value={Mbase.toFixed(3)} unit="kN·m" />
          <ResultRow label={<>T<sub>w</sub> = ±{sgEcc}·b·F<sub>w</sub> — torsional moment</>} value={`±${Tw.toFixed(3)}`} unit="kN·m" />
          <ResultRow label={<>Eccentricity e = ±{sgEcc}·b</>} value={`±${eccDist.toFixed(3)}`} unit="m" />
        </ResultsBox>
        <DetailsSection id="sign-details">
          {(() => {
            const P: React.CSSProperties = { fontSize: 12, color: '#374151', lineHeight: 1.75, margin: '6px 0 10px' }
            const catData = TERRAIN_CATS.find(c => c.id === cat)!
            const z0 = catData.z0
            const zmin = catData.zmin
            const qb = 0.5 * rho * vb * vb / 1000
            const weff = Fw / Aref
            return (<>
              <p style={{ fontSize: 11, color: '#1e293b', marginBottom: 10 }}>
                <strong>According to:</strong> EN 1991-1-4:2005+A1:2010 §7.4.3
              </p>

              <DetailGroup title="Input Data">
                <InputDataTable>
                  <InputDataRow param={<>Terrain category — <TableRef label="Table 4.1" renderTable={() => <Table41 />} /></>} symbol={<Tex>{'\\text{Cat.}'}</Tex>} value={`Cat. ${cat} — z₀=${z0} m, zmin=${zmin} m`} />
                  <InputDataRow param="Basic wind velocity" symbol={<Tex>{'v_b'}</Tex>} value={vb.toFixed(2)} unit="m/s" />
                  <InputDataRow param="Signboard width" symbol={<Tex>{'b'}</Tex>} value={sgW.toFixed(3)} unit="m" />
                  <InputDataRow param="Signboard height" symbol={<Tex>{'h'}</Tex>} value={sgH.toFixed(3)} unit="m" />
                  <InputDataRow param="Gap to ground" symbol={<Tex>{'z_g'}</Tex>} value={sgZg.toFixed(3)} unit="m" />
                  <InputDataRow param="Orography factor" symbol={<Tex>{'c_0(z_e)'}</Tex>} value={c0.toFixed(2)} />
                  <InputDataRow param="Structural factor" symbol={<Tex>{'c_s c_d'}</Tex>} value={sgCscd.toFixed(2)} />
                  <InputDataRow param="Air density" symbol={<Tex>{'\\rho'}</Tex>} value={rho.toFixed(2)} unit="kg/m³" />
                  <InputDataRow param="Eccentricity ratio" symbol={<Tex>{'e/b'}</Tex>} value={`±${sgEcc.toFixed(3)}`} />
                </InputDataTable>
              </DetailGroup>

              <DetailGroup title="Reference area and height">
                <p style={P}>
                  The reference height for the wind action z<sub>e</sub> is located at the center of the signboard, as specified in EN 1991-1-4 §7.4.3(3). The reference area for the wind action A<sub>ref</sub> is the wind loaded area of the signboard, as specified in EN 1991-1-4 §7.4.3(3). Therefore:
                </p>
                <CalcStep
                  label={<>Reference height <Tex>{'z_e'}</Tex></>}
                  formula={`z_e = z_g + \\dfrac{h}{2} = ${sgZg.toFixed(3)}\\ \\mathrm{m} + \\dfrac{${sgH.toFixed(3)}\\ \\mathrm{m}}{2} = ${ze.toFixed(3)}\\ \\mathrm{m}`}
                  result={<></>}
                />
                <CalcStep
                  label={<>Reference area <Tex>{'A_{\\mathrm{ref}}'}</Tex></>}
                  formula={`A_{\\mathrm{ref}} = b \\cdot h = ${sgW.toFixed(3)}\\ \\mathrm{m} \\cdot ${sgH.toFixed(3)}\\ \\mathrm{m} = ${Aref.toFixed(2)}\\ \\mathrm{m^2}`}
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
                  The roughness factor c<sub>r</sub>(z<sub>e</sub>) is calculated in accordance with EN 1991-1-4 equation (4.4). For the examined case z<sub>e</sub> {ze >= zmin ? '≥' : '<'} z<sub>min</sub>:
                </p>
                <CalcStep
                  label={<>Roughness factor <Tex>{'c_r(z_e)'}</Tex> (EN 1991-1-4 §4.5 Eq. 4.4)</>}
                  formula={`c_r(z_e) = k_r \\cdot \\ln\\!\\left(\\frac{\\max(z_e,\\,z_{\\min})}{z_0}\\right) = ${kr.toFixed(4)} \\cdot \\ln\\!\\left(\\frac{\\max(${ze.toFixed(3)}\\ \\mathrm{m},\\,${zmin}\\ \\mathrm{m})}{${z0}\\ \\mathrm{m}}\\right) = ${cr.toFixed(4)}`}
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
                  For the examined case z<sub>e</sub> {ze >= zmin ? '≥' : '<'} z<sub>min</sub>:
                </p>
                <CalcStep
                  label={<>Turbulence intensity <Tex>{'I_v(z_e)'}</Tex> (EN 1991-1-4 §4.4 Eq. 4.7)</>}
                  formula={`I_v(z_e) = \\frac{k_I}{c_0(z_e) \\cdot \\ln\\!\\left(\\dfrac{\\max(z_e,\\,z_{\\min})}{z_0}\\right)} = \\frac{1.000}{${c0.toFixed(3)} \\cdot \\ln\\!\\left(\\dfrac{\\max(${ze.toFixed(3)}\\ \\mathrm{m},\\,${zmin}\\ \\mathrm{m})}{${z0}\\ \\mathrm{m}}\\right)} = ${Iv.toFixed(4)}`}
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

              <DetailGroup title="Structural factor">
                <p style={P}>
                  The structural factor c<sub>s</sub>c<sub>d</sub> is determined in accordance with EN 1991-1-4 Section 6. A value of c<sub>s</sub>c<sub>d</sub> = 1.0 is generally conservative for small structures not susceptible to wind turbulence effects. In these calculations:
                </p>
                <CalcStep
                  label="Structural factor"
                  formula={`c_s c_d = ${sgCscd.toFixed(3)}`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title="Force coefficient">
                <p style={P}>
                  The force coefficient c<sub>f</sub> is given in EN 1991-1-4 Sections 7 and 8 depending on the type of structure or structural element. According to EN 1991-1-4 §7.4.3, for signboards with z<sub>g</sub> ≥ h/4 or b/h ≤ 1, the force coefficient is c<sub>f</sub> = 1.800.
                </p>
                <CalcStep
                  label="Force coefficient"
                  formula={`c_f = 1.800`}
                  result={<></>}
                />
              </DetailGroup>

              <DetailGroup title="Total wind force">
                <p style={P}>
                  The wind force on the structure F<sub>w</sub> for the overall wind effect is estimated according to the force coefficient method as specified in EN 1991-1-4 §5.3:
                </p>
                <CalcStep
                  label={<>Total wind force <Tex>{'F_w'}</Tex></>}
                  formula={`F_w = c_s c_d \\cdot c_f \\cdot q_p(z_e) \\cdot A_{\\mathrm{ref}} = ${sgCscd.toFixed(3)} \\cdot 1.800 \\cdot ${qp.toFixed(4)}\\ \\mathrm{kN/m^2} \\cdot ${Aref.toFixed(2)}\\ \\mathrm{m^2} = ${Fw.toFixed(3)}\\ \\mathrm{kN}`}
                  result={<></>}
                />
                <p style={P}>
                  The total wind force F<sub>w</sub> takes into account the overall wind effect. The corresponding effective wind pressure w<sub>eff</sub> on the reference wind area A<sub>ref</sub> is equal to:
                </p>
                <CalcStep
                  label={<>Effective wind pressure <Tex>{'w_{\\mathrm{eff}}'}</Tex></>}
                  formula={`w_{\\mathrm{eff}} = \\frac{F_w}{A_{\\mathrm{ref}}} = \\frac{${Fw.toFixed(3)}\\ \\mathrm{kN}}{${Aref.toFixed(2)}\\ \\mathrm{m^2}} = ${weff.toFixed(3)}\\ \\mathrm{kN/m^2}`}
                  result={<></>}
                />
                <p style={P}>
                  This effective pressure w<sub>eff</sub> = {weff.toFixed(3)} kN/m² is appropriate for global verifications of the structure according to the force coefficient method. It is not appropriate for local verifications of structural elements. For the latter case appropriate wind pressure on local surfaces must be estimated according to the relevant pressure coefficients, as specified in EN 1991-1-4 §5.2.
                </p>
              </DetailGroup>

              <DetailGroup title="Overturning moment">
                <p style={P}>
                  According to EN 1991-1-4 §7.4.3 the resultant force normal to the signboard should be taken to act at the height of the center of the signboard. The total overturning moment M<sub>w</sub> acting at the base of the structure is equal to:
                </p>
                <CalcStep
                  label={<>Overturning moment <Tex>{'M_w'}</Tex></>}
                  formula={`M_w = F_w \\cdot \\left(z_g + \\dfrac{h}{2}\\right) = ${Fw.toFixed(3)}\\ \\mathrm{kN} \\cdot \\left(${sgZg.toFixed(3)}\\ \\mathrm{m} + \\dfrac{${sgH.toFixed(3)}\\ \\mathrm{m}}{2}\\right) = ${Mbase.toFixed(2)}\\ \\mathrm{kN{\\cdot}m}`}
                  result={<></>}
                  note="The overturning moment corresponds to the wind action total effect, i.e. it is the total overturning moment for all the base supports."
                />
              </DetailGroup>

              <DetailGroup title="Horizontal eccentricity">
                <p style={P}>
                  According to EN 1991-1-4 §7.4.3 the resultant force normal to the signboard should be taken to act with a horizontal eccentricity e. In this calculation the following normalized eccentricity is considered e/b = ±{sgEcc.toFixed(3)}, where b is the width of the signboard wind loaded area. The total torsional moment T<sub>w</sub> acting at the base of the structure is equal to:
                </p>
                <CalcStep
                  label={<>Torsional moment <Tex>{'T_w'}</Tex></>}
                  formula={`T_w = \\pm\\,\\frac{e}{b} \\cdot b \\cdot F_w = \\pm\\,${sgEcc.toFixed(3)} \\cdot ${sgW.toFixed(3)}\\ \\mathrm{m} \\cdot ${Fw.toFixed(3)}\\ \\mathrm{kN} = ${Tw.toFixed(2)}\\ \\mathrm{kN{\\cdot}m}`}
                  result={<></>}
                  note="The torsional moment corresponds to the wind action total effect, i.e. it is the total torsional moment for all the base supports."
                />
              </DetailGroup>

              <DetailGroup title="Additional notes">
                <ul style={{ fontSize: 12, color: '#374151', lineHeight: 1.75, margin: 0, paddingLeft: 18 }}>
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

