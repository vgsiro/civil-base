'use client'
import { DetailGroup, CalcStep, InputDataTable, InputDataRow, Tex } from '../../../../../../_lib/ui'
import { Ec2RectInput, Ec2RectResult } from '../../rect-engine/rect-calc'

function n(v: number, d = 2) { return isFinite(v) ? v.toFixed(d) : '—' }
const PROSE: React.CSSProperties = { fontSize: 12, color: '#374151', lineHeight: 1.75, margin: '6px 0 10px' }

export default function RectStDetails({ inp, res }: { inp: Ec2RectInput; res: Ec2RectResult }) {
  const VEd        = inp.VEd ?? 0
  const TEd        = inp.TEd ?? 0
  const hasTorsion = TEd > 0
  const stPhi      = inp.stirrup_phi ?? 10
  const stS        = inp.stirrup_s ?? 200
  const legs       = inp.stirrup_legs ?? 2
  const theta_deg  = res.theta_deg
  const theta_rad  = theta_deg * Math.PI / 180
  const fck        = inp.fck
  const fyk        = inp.fyk
  const gc         = inp.gc
  const fcd        = res.fcd
  const fyd        = res.fyd
  const gs         = inp.gs
  const d_mm       = res.d * 1000
  const bw_mm      = inp.b * 1000
  const z_mm       = res.z_shear * 1000
  const Asw1       = Math.PI * (stPhi / 2) ** 2
  const Asw_per_s  = (legs * Asw1 / stS) * 1000

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '14px 16px', background: '#fff' }}>
      <p style={{ fontSize: 11, color: '#1e293b', marginBottom: 10 }}>
        <strong>According to:</strong> EN 1992-1-1:2004+AC:2008 §6.2 — Shear{hasTorsion ? ' / §6.3 — Torsion' : ''}
      </p>

      <DetailGroup title="Shear & Torsion Input Data">
        <InputDataTable>
          <InputDataRow param="Design shear force"            symbol={<Tex>{'V_{Ed}'}</Tex>}          value={n(VEd, 1)}          unit="kN" />
          {hasTorsion && <InputDataRow param="Design torsional moment" symbol={<Tex>{'T_{Ed}'}</Tex>} value={n(TEd, 1)} unit="kNm" />}
          <InputDataRow param="Stirrup diameter"              symbol={<Tex>{'\\Phi_w'}</Tex>}          value={n(stPhi, 0)}        unit="mm" />
          <InputDataRow param="Stirrup spacing"               symbol={<Tex>{'s'}</Tex>}                value={n(stS, 0)}          unit="mm" />
          <InputDataRow param="Number of shear legs"          symbol={<Tex>{'n_w'}</Tex>}              value={n(legs, 0)}         />
          <InputDataRow param={res.theta_is_override ? 'Strut inclination (Assumed)' : 'Strut inclination (EC2 §6.2.3 optimal)'} symbol={<Tex>{'\\theta'}</Tex>} value={n(theta_deg, 1)} unit="°" />
          <InputDataRow param="Effective depth"               symbol={<Tex>{'d'}</Tex>}                value={n(d_mm, 1)}         unit="mm" />
          <InputDataRow param="Section width (web)"           symbol={<Tex>{'b_w'}</Tex>}              value={n(bw_mm, 1)}        unit="mm" />
          <InputDataRow param="Lever arm z = 0.9d"            symbol={<Tex>{'z'}</Tex>}                value={n(z_mm, 1)}         unit="mm" />
          <InputDataRow param="Longitudinal reinf. ratio (shear)" symbol={<Tex>{'\\rho_l'}</Tex>}    value={n(res.rho_l_shear * 100, 3)} unit="%" />
          <InputDataRow param="Axial compressive stress"      symbol={<Tex>{'\\sigma_{cp}'}</Tex>}    value={n(res.sigma_cp, 2)} unit="MPa" />
        </InputDataTable>
      </DetailGroup>

      <DetailGroup title="Shear resistance without reinforcement (EN 1992-1-1 §6.2.2)">
        <p style={PROSE}>
          The minimum shear resistance of a member without shear reinforcement is checked first.
          If V<sub>Ed</sub> ≤ V<sub>Rd,c</sub>, no shear reinforcement is needed.
        </p>
        <CalcStep label="Size factor k (§6.2.2(1))"
          formulaNode={<span style={{ fontStyle: 'italic' }}>k = min(1 + √(200/d), 2) = min(1 + √(200/{n(d_mm,1)}), 2) = {n(res.k_shear,3)}</span>}
          result={<Tex>{`k = ${n(res.k_shear, 3)}`}</Tex>} />
        <CalcStep label="CRd,c = 0.18 / γc"
          formula={`C_{Rd,c} = \\dfrac{0.18}{\\gamma_c} = \\dfrac{0.18}{${n(gc, 2)}} = ${n(res.CRd_c, 4)}`}
          result={<Tex>{`C_{Rd,c} = ${n(res.CRd_c, 4)}`}</Tex>} />
        <CalcStep label="Shear resistance without reinforcement (§6.2.2(1) Eq. 6.2a)"
          formula={`V_{Rd,c} = \\left[C_{Rd,c} \\cdot k \\cdot (100\\,\\rho_l \\cdot f_{ck})^{1/3} + 0.12\\,\\sigma_{cp}\\right] b_w d`} />
        <CalcStep label=""
          formula={`= \\left[${n(res.CRd_c,4)} \\times ${n(res.k_shear,3)} \\times (100 \\times ${n(res.rho_l_shear,4)} \\times ${n(fck,0)})^{1/3} + 0.12 \\times ${n(res.sigma_cp,2)}\\right] \\times ${n(bw_mm,0)} \\times ${n(d_mm,1)} / 10^6 = ${n(res.VRd_c,2)}\\ \\mathrm{kN}`}
          result={<Tex>{`V_{Rd,c} = ${n(res.VRd_c, 2)}\\ \\mathrm{kN}`}</Tex>}
          note={VEd <= res.VRd_c
            ? <><strong>V<sub>Ed</sub> = {n(VEd,2)} kN ≤ V<sub>Rd,c</sub> = {n(res.VRd_c,2)} kN → shear reinforcement not required by §6.2.2</strong></>
            : <><strong>V<sub>Ed</sub> = {n(VEd,2)} kN &gt; V<sub>Rd,c</sub> = {n(res.VRd_c,2)} kN → shear reinforcement required (§6.2.3)</strong></>} />
      </DetailGroup>

      <DetailGroup title="Shear resistance with stirrups — variable angle truss (EN 1992-1-1 §6.2.3)">
        <p style={PROSE}>
          The variable strut angle method is used. θ is constrained to 21.8° ≤ θ ≤ 45° per EC2 §6.2.3(2).
        </p>
        <CalcStep label="Area of one stirrup bar"
          formula={`A_{sw,1} = \\dfrac{\\pi \\Phi_w^2}{4} = \\dfrac{\\pi \\times ${n(stPhi,0)}^2}{4} = ${n(Asw1, 2)}\\ \\mathrm{mm^2}`}
          result={<Tex>{`A_{sw,1} = ${n(Asw1,2)}\\ \\mathrm{mm^2}`}</Tex>} />
        <CalcStep label="Provided stirrup area per unit length"
          formula={`\\dfrac{A_{sw}}{s} = \\dfrac{n_w \\cdot A_{sw,1}}{s} = \\dfrac{${legs} \\times ${n(Asw1,2)}}{${stS}} \\times 1000 = ${n(Asw_per_s, 1)}\\ \\mathrm{mm^2/m}`}
          result={<Tex>{`A_{sw}/s = ${n(Asw_per_s,1)}\\ \\mathrm{mm^2/m}`}</Tex>} />
        <CalcStep label="Strength reduction factor ν₁ (§6.2.3(3))"
          formula={`\\nu_1 = 0.6\\left(1 - \\dfrac{f_{ck}}{250}\\right) = 0.6\\left(1 - \\dfrac{${n(fck,0)}}{250}\\right) = ${n(0.6*(1-fck/250),3)}`} />
        <CalcStep label="Strut angle from provided stirrups (§6.2.3): cot θ = VEd / (Asw/s · z · fyd)"
          formula={`\\cot\\theta = \\dfrac{V_{Ed}}{(A_{sw}/s) \\cdot z \\cdot f_{yd}} = \\dfrac{${n(VEd,1)}}{${n(Asw_per_s,1)} \\times ${n(z_mm,1)} \\times ${n(fyd,2)} / 10^6} = ${n(VEd / (Asw_per_s * z_mm * fyd / 1e6), 3)}`} />
        <CalcStep label=""
          formulaNode={<span style={{ fontStyle: 'italic' }}>θ_calc = arctan(1 / cot θ) = arctan(1 / {n(VEd / (Asw_per_s * z_mm * fyd / 1e6), 3)}) = {n(res.theta_calc, 1)}°</span>}
          result={<Tex>{`\\theta = ${n(theta_deg,1)}°`}</Tex>}
          note={(() => {
            const cot_raw = VEd > 0 ? VEd / (Asw_per_s * z_mm * fyd / 1e6) : 2.5
            if (res.theta_is_override) {
              return <><strong>cot θ_calc = {n(cot_raw,3)} → user override applied: θ = {n(theta_deg,1)}°</strong></>
            }
            if (cot_raw > 2.5) {
              return <><strong>cot θ_calc = {n(cot_raw,3)} &gt; 2.5 → stirrups over-provided, clamped: θ = 21.8°</strong></>
            }
            if (cot_raw < 1.0) {
              return <><strong>cot θ_calc = {n(cot_raw,3)} &lt; 1.0 → stirrups insufficient even at θ = 45° → FAIL</strong></>
            }
            return <><strong>cot θ_calc = {n(cot_raw,3)} within EC2 limits [1.0, 2.5] → θ = {n(theta_deg,1)}°</strong></>
          })()} />
        <CalcStep label={`Required stirrup area at θ = ${n(theta_deg,1)}° / cot θ = ${n(1/Math.tan(theta_rad),3)} (§6.2.3 Eq. 6.8 solved for Asw/s)`}
          formula={`\\left(\\dfrac{A_{sw}}{s}\\right)_{req} = \\dfrac{V_{Ed}}{z \\cdot f_{yd} \\cdot \\cot\\theta} = \\dfrac{${n(VEd,1)}}{${n(z_mm,1)} \\times ${n(fyd,2)} \\times ${n(1/Math.tan(theta_rad),3)}} \\times 10^6 = ${n(res.Asw_req,1)}\\ \\mathrm{mm^2/m}`}
          result={<Tex>{`(A_{sw}/s)_{req} = ${n(res.Asw_req,1)}\\ \\mathrm{mm^2/m}`}</Tex>}
          note={<><strong>(A<sub>sw</sub>/s)<sub>prov</sub> = {n(Asw_per_s,1)} mm²/m {res.Asw_prov_ok ? '≥' : '<'} (A<sub>sw</sub>/s)<sub>req</sub> = {n(res.Asw_req,1)} mm²/m → {res.Asw_prov_ok ? 'OK ✓' : 'FAIL ✗'}</strong></>} />
        <CalcStep label="Shear capacity from provided stirrups (§6.2.3(3) Eq. 6.8)"
          formula={`V_{Rd,s} = \\dfrac{A_{sw}}{s} \\cdot z \\cdot f_{yd} \\cdot \\cot\\theta`} />
        <CalcStep label=""
          formula={`= ${n(Asw_per_s,1)} \\times ${n(z_mm,1)} \\times ${n(fyd,2)} \\times ${n(1/Math.tan(theta_rad),3)} / 10^6 = ${n(res.VRd_s,2)}\\ \\mathrm{kN}`}
          result={<Tex>{`V_{Rd,s} = ${n(res.VRd_s,2)}\\ \\mathrm{kN}`}</Tex>} />
        <CalcStep label="Concrete strut crushing capacity (§6.2.3(4) Eq. 6.9)"
          formula={`V_{Rd,max} = \\dfrac{\\alpha_{cw} \\cdot b_w \\cdot z \\cdot \\nu_1 \\cdot f_{cd}}{\\cot\\theta + \\tan\\theta}`} />
        <CalcStep label=""
          formula={`= \\dfrac{1 \\times ${n(bw_mm,0)} \\times ${n(z_mm,1)} \\times 0.6(1-${n(fck,0)}/250) \\times ${n(fcd,2)}}{${n(1/Math.tan(theta_rad),3)} + ${n(Math.tan(theta_rad),3)}} / 10^3 = ${n(res.VRd_max,2)}\\ \\mathrm{kN}`}
          result={<Tex>{`V_{Rd,max} = ${n(res.VRd_max,2)}\\ \\mathrm{kN}`}</Tex>}
          note={<><strong>ν₁ = 0.6(1 − f<sub>ck</sub>/250) = {n(0.6*(1-fck/250),3)} (strength reduction factor for cracked concrete in shear)</strong></>} />
        <CalcStep label="Governing shear resistance (§6.2.3)"
          formulaNode={<span style={{ fontStyle: 'italic' }}>V<sub>Rd</sub> = min(V<sub>Rd,s</sub>, V<sub>Rd,max</sub>) = min({n(res.VRd_s,2)}, {n(res.VRd_max,2)}) = {n(res.VRd,2)} kN</span>}
          result={<Tex>{`V_{Rd} = ${n(res.VRd,2)}\\ \\mathrm{kN}`}</Tex>}
          note={<><strong>V<sub>Ed</sub> = {n(VEd,2)} kN {res.shear_ok ? '≤' : '>'} V<sub>Rd</sub> = {n(res.VRd,2)} kN → {res.shear_ok ? 'PASS ✓' : 'FAIL ✗'}</strong></>} />
      </DetailGroup>

      <DetailGroup title="Minimum shear reinforcement (EN 1992-1-1 §9.2.2)">
        <CalcStep label="Minimum stirrup ratio (§9.2.2(5) Eq. 9.4)"
          formula={`\\rho_{w,min} = \\dfrac{0.08 \\sqrt{f_{ck}}}{f_{yk}} = \\dfrac{0.08 \\sqrt{${n(fck,0)}}}{${n(fyk,0)}} = ${n(0.08*Math.sqrt(fck)/fyk, 5)}`}
          result={<Tex>{`\\rho_{w,min} = ${n(0.08*Math.sqrt(fck)/fyk,5)}`}</Tex>} />
        <CalcStep label="Minimum Asw/s (§9.2.2)"
          formula={`\\left(\\dfrac{A_{sw}}{s}\\right)_{min} = \\rho_{w,min} \\cdot b_w = ${n(0.08*Math.sqrt(fck)/fyk,5)} \\times ${n(bw_mm,0)} \\times 1000 = ${n(res.Asw_min,1)}\\ \\mathrm{mm^2/m}`}
          result={<Tex>{`(A_{sw}/s)_{min} = ${n(res.Asw_min,1)}\\ \\mathrm{mm^2/m}`}</Tex>}
          note={<><strong>A<sub>sw</sub>/s = {n(Asw_per_s,1)} mm²/m {res.Asw_min_ok ? '≥' : '<'} (A<sub>sw</sub>/s)<sub>min</sub> = {n(res.Asw_min,1)} mm²/m → {res.Asw_min_ok ? 'OK ✓' : 'NOT OK ✗'}</strong></>} />
      </DetailGroup>

      {hasTorsion && (() => {
        const tef_mm   = res.tef * 1000
        const Ak_mm2   = res.Ak * 1e6
        const uk_mm    = res.uk * 1000
        const fctm     = fck <= 50 ? 0.30 * Math.pow(fck, 2/3) : 2.12 * Math.log(1 + (fck + 8) / 10)
        const fctd     = fctm / 1.5
        const nu1      = 0.6 * (1 - fck / 250)
        return (
          <DetailGroup title="Torsion resistance (EN 1992-1-1 §6.3)">
            <p style={PROSE}>
              Torsion is checked per EC2 §6.3.2. If T<sub>Ed</sub> ≤ T<sub>Rd,c</sub>, no torsion reinforcement is required.
            </p>
            <CalcStep label="Effective wall thickness (§6.3.2(1)): tef = max(A/u, 2·cnom)"
              formulaNode={<span style={{ fontStyle: 'italic' }}>t<sub>ef</sub> = max(A/u, 2c<sub>nom</sub>) = max({n(inp.b*1000,0)}×{n(inp.h*1000,0)} / (2({n(inp.b*1000,0)}+{n(inp.h*1000,0)})), 2×{n(Math.min(inp.c1,inp.c2)*1000,0)}) = {n(tef_mm,0)} mm</span>}
              result={<Tex>{`t_{ef} = ${n(tef_mm,0)}\\ \\mathrm{mm}`}</Tex>} />
            <CalcStep label="Area enclosed by centreline of effective wall: Ak = (b−tef)(h−tef)"
              formula={`A_k = (b - t_{ef})(h - t_{ef}) = (${n(inp.b*1000,0)} - ${n(tef_mm,0)})(${n(inp.h*1000,0)} - ${n(tef_mm,0)}) = ${n(Ak_mm2,0)}\\ \\mathrm{mm^2}`}
              result={<Tex>{`A_k = ${n(Ak_mm2,0)}\\ \\mathrm{mm^2}`}</Tex>} />
            <CalcStep label="Perimeter of Ak: uk = 2(b−tef + h−tef)"
              formula={`u_k = 2\\bigl[(b-t_{ef})+(h-t_{ef})\\bigr] = ${n(uk_mm,0)}\\ \\mathrm{mm}`}
              result={<Tex>{`u_k = ${n(uk_mm,0)}\\ \\mathrm{mm}`}</Tex>} />
            <CalcStep label="Torsional cracking capacity (§6.3.2(5))"
              formula={`f_{ctm} = ${n(fctm,3)}\\ \\mathrm{MPa},\\quad f_{ctd} = f_{ctm}/1.5 = ${n(fctd,3)}\\ \\mathrm{MPa}`} />
            <CalcStep label=""
              formula={`T_{Rd,c} = f_{ctd} \\times 1000 \\cdot 2A_k \\cdot t_{ef} = ${n(fctd,3)} \\times 1000 \\times 2 \\times ${n(Ak_mm2/1e6,4)} \\times ${n(tef_mm/1000,4)} = ${n(res.TRd_c,2)}\\ \\mathrm{kNm}`}
              result={<Tex>{`T_{Rd,c} = ${n(res.TRd_c,2)}\\ \\mathrm{kNm}`}</Tex>}
              note={TEd <= res.TRd_c
                ? <><strong>T<sub>Ed</sub> = {n(TEd,2)} kNm ≤ T<sub>Rd,c</sub> = {n(res.TRd_c,2)} kNm → no torsion reinforcement required (§6.3.2(5))</strong></>
                : <><strong>T<sub>Ed</sub> = {n(TEd,2)} kNm &gt; T<sub>Rd,c</sub> = {n(res.TRd_c,2)} kNm → torsion reinforcement required</strong></>} />
            <CalcStep label="Max torsion resistance — strut crushing (§6.3.2(4))"
              formula={`T_{Rd,max} = \\nu_1 \\cdot f_{cd} \\times 1000 \\cdot 2 A_k \\cdot t_{ef} \\cdot \\sin\\theta \\cdot \\cos\\theta`} />
            <CalcStep label=""
              formula={`= ${n(nu1,3)} \\times ${n(fcd,2)} \\times 1000 \\times 2 \\times ${n(Ak_mm2/1e6,4)} \\times ${n(tef_mm/1000,4)} \\times \\sin(${n(theta_deg,1)}°) \\times \\cos(${n(theta_deg,1)}°) = ${n(res.TRd_max,2)}\\ \\mathrm{kNm}`}
              result={<Tex>{`T_{Rd,max} = ${n(res.TRd_max,2)}\\ \\mathrm{kNm}`}</Tex>} />
            {TEd > res.TRd_c && <>
              <CalcStep label="Required torsion link area per unit length (§6.3.2(2))"
                formula={`\\dfrac{A_t}{s} = \\dfrac{T_{Ed}}{2 A_k f_{yd}} \\times 1000 = \\dfrac{${n(TEd,2)}}{2 \\times ${n(Ak_mm2/1e6,6)} \\times ${n(fyk/gs,2)}} \\times 1000 = ${n(res.At_req_s,1)}\\ \\mathrm{mm^2/m}`}
                result={<Tex>{`A_t/s = ${n(res.At_req_s,1)}\\ \\mathrm{mm^2/m}`}</Tex>} />
              <CalcStep label="Required longitudinal torsion reinforcement (§6.3.2(3))"
                formula={`A_{sl} = \\dfrac{A_t/s}{1000} \\cdot u_k \\cdot \\cot\\theta = \\dfrac{${n(res.At_req_s,1)}}{1000} \\times ${n(uk_mm,0)} \\times ${n(1/Math.tan(theta_rad),3)} = ${n(res.Asl_req,0)}\\ \\mathrm{mm^2}`}
                result={<Tex>{`A_{sl} = ${n(res.Asl_req,0)}\\ \\mathrm{mm^2}`}</Tex>} />
              <CalcStep label="Combined shear & torsion interaction (§6.3.2(4) Eq. 6.31): TEd/TRd,max + VEd/VRd,max ≤ 1.0"
                formula={`\\dfrac{T_{Ed}}{T_{Rd,max}} + \\dfrac{V_{Ed}}{V_{Rd,max}} = \\dfrac{${n(TEd,2)}}{${n(res.TRd_max,2)}} + \\dfrac{${n(VEd,2)}}{${n(res.VRd_max,2)}} = ${n(TEd/res.TRd_max + VEd/res.VRd_max, 3)}`}
                result={<span style={{ color: res.torsion_interaction_ok ? '#16a34a' : '#dc2626', fontWeight: 700 }}>{res.torsion_interaction_ok ? '≤ 1.0 — PASS ✓' : '> 1.0 — FAIL ✗'}</span>} />
            </>}
          </DetailGroup>
        )
      })()}

      <DetailGroup title="Shear & Torsion Verification Summary">
        <CalcStep label="Shear verification"
          formula={`V_{Ed} = ${n(VEd,2)}\\ \\mathrm{kN} ${res.shear_ok ? '\\leq' : '>'} V_{Rd} = ${n(res.VRd,2)}\\ \\mathrm{kN}`}
          result={<span style={{ color: res.shear_ok ? '#16a34a' : '#dc2626', fontWeight: 700 }}>{res.shear_ok ? 'PASS ✓' : 'FAIL ✗'}</span>} />
        <CalcStep label="Minimum reinforcement"
          formula={`A_{sw}/s = ${n(Asw_per_s,1)}\\ \\mathrm{mm^2/m} ${res.Asw_min_ok ? '\\geq' : '<'} (A_{sw}/s)_{min} = ${n(res.Asw_min,1)}\\ \\mathrm{mm^2/m}`}
          result={<span style={{ color: res.Asw_min_ok ? '#16a34a' : '#dc2626', fontWeight: 700 }}>{res.Asw_min_ok ? 'OK ✓' : 'NOT OK ✗'}</span>} />
        {hasTorsion && (
          <CalcStep label="Torsion check"
            formula={TEd <= res.TRd_c
              ? `T_{Ed} = ${n(TEd,2)}\\ \\mathrm{kNm} \\leq T_{Rd,c} = ${n(res.TRd_c,2)}\\ \\mathrm{kNm}`
              : `\\dfrac{T_{Ed}}{T_{Rd,max}} + \\dfrac{V_{Ed}}{V_{Rd,max}} = ${n(TEd/res.TRd_max + VEd/res.VRd_max,3)}`}
            result={<span style={{ color: res.torsion_combined_ok ? '#16a34a' : '#dc2626', fontWeight: 700 }}>{res.torsion_combined_ok ? 'PASS ✓' : 'FAIL ✗'}</span>} />
        )}
      </DetailGroup>
    </div>
  )
}
