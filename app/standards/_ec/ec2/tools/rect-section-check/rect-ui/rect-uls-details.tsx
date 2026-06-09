'use client'
import { DetailGroup, CalcStep, InputDataTable, InputDataRow, Tex } from '../../../../../_lib/ui'
import { Ec2RectInput, Ec2RectResult } from '../rect-engine/rect-calc'

function n(v: number, d = 2) { return isFinite(v) ? v.toFixed(d) : '—' }
function pct(v: number)       { return (v * 100).toFixed(2) }
const PROSE: React.CSSProperties = { fontSize: 12, color: '#374151', lineHeight: 1.75, margin: '6px 0 10px' }

export default function RectUlsDetails({ inp, res }: { inp: Ec2RectInput; res: Ec2RectResult }) {
  const { fck, fyk, acc, gc, gs, h, b, MEd, NEd, rows1, c1, rows2, c2, nbars3, phi3 } = inp
  const {
    fcd, fyd, eyd, ec2v, ecu2, n: nv,
    A, I, zcm,
    As1, As2, As3, Astot, rho,
    NRd_c, NRd_t,
    MRd_plus: MRd, x, xd, kappa, e0,
    eps_c_top, eps_c_bot, eps_s_max, eps_s_min,
    sigma_c_max, sigma_s_max, sigma_s_min,
    FC, FT, MC, MT,
    EI_eff, EI_gross,
    e0_min, e0_e1, e0_e2, e0_used, ea,
    lambda, lambda_lim, slender,
    phi_inf_used, phi_ef_calc, phi_ef_used,
    K1, K2, Kr, Kphi, r_inv, e2,
    M_e0, M_ea, M1, M2, MEd_tot,
    nu,
  } = res

  const eud = 0.9 * 75
  const Ecm = 22000 * Math.pow((fck + 8) / 10, 0.3)
  const Es = 200000
  const d_eff = h - c1
  const lever = FT !== 0 && FC !== 0 ? Math.abs((MT - MC) / (FT > 0 ? FT : FC)) : 0

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '14px 16px', background: '#fff' }}>
      <p style={{ fontSize: 11, color: '#1e293b', marginBottom: 10 }}>
        <strong>According to:</strong> EN 1992-1-1:2004+AC:2008 §6.1, §3.1.7, §3.2.7
      </p>

      <DetailGroup title="Input Data">
        <InputDataTable>
          <InputDataRow param="Concrete characteristic strength" symbol={<Tex>{'f_{ck}'}</Tex>} value={n(fck, 2)} unit="MPa" />
          <InputDataRow param="Steel characteristic yield strength" symbol={<Tex>{'f_{yk}'}</Tex>} value={n(fyk, 2)} unit="MPa" />
          <InputDataRow param="Type of reinforcement stress-strain law" symbol="" value="No hardening (Perfectly plastic)" />
          <InputDataRow param="Ratio (ft/fy)k" symbol={<Tex>{'(f_t/f_y)_k'}</Tex>} value="1" />
          <InputDataRow param="Characteristic ultimate strain" symbol={<Tex>{'\\varepsilon_{uk}'}</Tex>} value="75.00" unit="‰" />
          <InputDataRow param="Height of cross-section" symbol={<Tex>{'h'}</Tex>} value={n(h, 3)} unit="m" />
          <InputDataRow param="Width of cross-section" symbol={<Tex>{'b'}</Tex>} value={n(b, 3)} unit="m" />
          <InputDataRow param="Bottom layer — Layer 1 rows" symbol={<Tex>{'n_1,\\,\\Phi_1'}</Tex>} value={rows1.map((r, i) => `Row ${i + 1}: ${r.n}×Φ${r.phi}`).join(', ')} unit="mm" />
          <InputDataRow param="Cover centroid to bottom edge — Layer 1" symbol={<Tex>{"c'_1"}</Tex>} value={n(c1, 3)} unit="m" />
          <InputDataRow param="Top layer — Layer 2 rows" symbol={<Tex>{'n_2,\\,\\Phi_2'}</Tex>} value={rows2.map((r, i) => `Row ${i + 1}: ${r.n}×Φ${r.phi}`).join(', ')} unit="mm" />
          <InputDataRow param="Cover centroid to top edge — Layer 2" symbol={<Tex>{"c'_2"}</Tex>} value={n(c2, 3)} unit="m" />
          <InputDataRow param="Side bars per side — Layer 3" symbol={<Tex>{'n_3,\\,\\Phi_3'}</Tex>} value={`${nbars3} × Φ${phi3}`} unit="mm" />
          <InputDataRow param={<>Design bending moment (tension at bottom = positive)</>} symbol={<Tex>{'M_{Ed}'}</Tex>} value={n(MEd, 0)} unit="kNm" />
          <InputDataRow param={<>Design axial force (compression negative)</>} symbol={<Tex>{'N_{Ed}'}</Tex>} value={n(NEd, 0)} unit="kN" />
        </InputDataTable>
        <p style={{ ...PROSE, marginTop: 6 }}>
          <strong>Nationally Defined Parameters:</strong> &nbsp;
          α<sub>cc</sub> = {n(acc)}, &nbsp; γ<sub>c</sub> = {n(gc)}, &nbsp; γ<sub>s</sub> = {n(gs)}
        </p>
      </DetailGroup>

      <DetailGroup title="Properties of rectangular concrete cross-section">
        <CalcStep label="Area of gross cross-section"
          formula={`A = b \\cdot h = ${n(b,4)}\\ \\mathrm{m} \\times ${n(h,4)}\\ \\mathrm{m} = ${n(A,4)}\\ \\mathrm{m^2}`}
          result={<Tex>{`A = ${n(A,4)}\\ \\mathrm{m^2}`}</Tex>} />
        <CalcStep label="Second moment of area of gross cross-section"
          formula={`I = \\dfrac{b \\cdot h^3}{12} = \\dfrac{${n(b,4)} \\cdot ${n(h,4)}^3}{12} = ${n(I,6)}\\ \\mathrm{m^4}`}
          result={<Tex>{`I = ${n(I,6)}\\ \\mathrm{m^4}`}</Tex>} />
        <CalcStep label="Centroid from top"
          formula={`z_{cm} = h/2 = ${n(zcm,4)}\\ \\mathrm{m}`}
          result={<Tex>{`z_{cm} = ${n(zcm,4)}\\ \\mathrm{m}`}</Tex>} />
        <CalcStep label="Reinforcement areas"
          formula={`A_{s,1} = ${n(As1,2)}\\ \\mathrm{cm^2},\\quad A_{s,2} = ${n(As2,2)}\\ \\mathrm{cm^2},\\quad A_{s,3} = ${n(As3,2)}\\ \\mathrm{cm^2}`}
          result={<Tex>{`A_{s,1} = ${n(As1,2)},\\quad A_{s,2} = ${n(As2,2)},\\quad A_{s,3} = ${n(As3,2)}\\ \\mathrm{cm^2}`}</Tex>} />
        <CalcStep label="Total area of longitudinal reinforcement"
          formula={`A_{s,tot} = A_{s,1} + A_{s,2} + A_{s,3} = ${n(As1,2)} + ${n(As2,2)} + ${n(As3,2)} = ${n(Astot,2)}\\ \\mathrm{cm^2}`}
          result={<Tex>{`A_{s,tot} = ${n(Astot,2)}\\ \\mathrm{cm^2}`}</Tex>} />
        <CalcStep label="Geometric reinforcement ratio"
          formula={`\\rho_l = \\dfrac{A_{s,tot}}{A} = \\dfrac{${n(Astot,2)}\\ \\mathrm{cm^2}}{${n(A * 1e4,2)}\\ \\mathrm{cm^2}} = ${pct(rho)}\\ \\%`}
          result={<Tex>{`\\rho_l = ${pct(rho)}\\ \\%`}</Tex>} />
        <CalcStep label="Compressive axial force resistance (pure compression, ULS)"
          formula={`N_{Rd,c} = -(f_{cd} \\cdot A + f_{yd} \\cdot A_{s,tot})`} />
        <CalcStep label=""
          formula={`= -(${n(fcd)} \\times ${n(A * 1e6,0)}\\ \\mathrm{mm^2} + ${n(fyd)} \\times ${n(Astot,2)}\\ \\mathrm{cm^2}) \\times 10^{-3} = ${n(NRd_c,2)}\\ \\mathrm{kN}`}
          result={<Tex>{`N_{Rd,c} = ${n(NRd_c,2)}\\ \\mathrm{kN}`}</Tex>} />
        <CalcStep label="Tensile axial force resistance (pure tension, ULS)"
          formula={`N_{Rd,t} = f_{yd} \\cdot A_{s,tot} = ${n(fyd)} \\times ${n(Astot,2)}\\ \\mathrm{cm^2 \\cdot MPa} = ${n(NRd_t,2)}\\ \\mathrm{kN}`}
          result={<Tex>{`N_{Rd,t} = ${n(NRd_t,2)}\\ \\mathrm{kN}`}</Tex>} />
      </DetailGroup>

      <DetailGroup title="Stress-strain law — Concrete (EN 1992-1-1 §3.1.7, Fig 3.3)">
        <p style={PROSE}>The parabolic-rectangular model is used.</p>
        <CalcStep label="Design compressive strength of concrete (EN 1992-1-1 §3.1.6(1)P)"
          formula={`f_{cd} = \\dfrac{\\alpha_{cc} \\cdot f_{ck}}{\\gamma_c} = \\dfrac{${n(acc)} \\times ${n(fck,2)}\\ \\mathrm{MPa}}{${n(gc,2)}} = ${n(fcd,2)}\\ \\mathrm{MPa}`}
          result={<Tex>{`f_{cd} = ${n(fcd,2)}\\ \\mathrm{MPa}`}</Tex>} />
        <CalcStep label={<>Concrete strain parameters — EN 1992-1-1 Table 3.1 for f<sub>ck</sub> = {n(fck, 0)} MPa</>}
          formula={`\\varepsilon_{c2} = ${n(ec2v,2)}\\ ‰,\\quad \\varepsilon_{cu2} = ${n(ecu2,2)}\\ ‰,\\quad n = ${n(nv,2)}`}
          result={<Tex>{`\\varepsilon_{cu2} = ${n(ecu2,2)}\\ ‰`}</Tex>}
          note={`For fck ≤ 50 MPa: εc2 = 2.0 ‰, εcu2 = 3.5 ‰, n = 2.0. Parabolic-rectangular law.`} />
      </DetailGroup>

      <DetailGroup title="Stress-strain law — Reinforcement steel (EN 1992-1-1 §3.2.7, Fig 3.8)">
        <CalcStep label="Design yield strength of reinforcement (EN 1992-1-1 §3.2)"
          formula={`f_{yd} = \\dfrac{f_{yk}}{\\gamma_s} = \\dfrac{${n(fyk,1)}\\ \\mathrm{MPa}}{${n(gs,2)}} = ${n(fyd,2)}\\ \\mathrm{MPa}`}
          result={<Tex>{`f_{yd} = ${n(fyd,2)}\\ \\mathrm{MPa}`}</Tex>} />
        <CalcStep label="Design yield strain (EN 1992-1-1 §3.2.7(4))"
          formula={`\\varepsilon_{yd} = \\dfrac{f_{yd}}{E_s} = \\dfrac{${n(fyd,2)}\\ \\mathrm{MPa}}{${Es.toLocaleString()}\\ \\mathrm{MPa}} = ${n(eyd,2)}\\ ‰`}
          result={<Tex>{`\\varepsilon_{yd} = ${n(eyd,2)}\\ ‰`}</Tex>} />
        <CalcStep label="Design ultimate strain (EN 1992-1-1 §3.2.7(2))"
          formula={`\\varepsilon_{ud} = 0.9 \\cdot \\varepsilon_{uk} = 0.9 \\times 75.00 = ${n(eud,2)}\\ ‰`}
          result={<Tex>{`\\varepsilon_{ud} = ${n(eud,2)}\\ ‰`}</Tex>}
          note="With horizontal top branch (no hardening), there is no need to check the strain limit." />
        <CalcStep label="Modulus of elasticity of concrete (EN 1992-1-1 Table 3.1)"
          formula={`E_{cm} = 22000 \\cdot \\left(\\dfrac{f_{ck}+8}{10}\\right)^{0.3} = 22000 \\cdot \\left(\\dfrac{${n(fck,0)}+8}{10}\\right)^{0.3} = ${n(Ecm, 0)}\\ \\mathrm{MPa}`}
          result={<Tex>{`E_{cm} = ${n(Ecm, 0)}\\ \\mathrm{MPa}`}</Tex>} />
      </DetailGroup>

      <DetailGroup title="Permitted range of strain distributions (EN 1992-1-1 §6.1, Fig 6.1)">
        <p style={PROSE}>The cross-section is discretised into <strong>200 horizontal strips</strong>.</p>
        <CalcStep label="Depth of compressive zone"
          formula={`x = h \\cdot \\dfrac{-\\varepsilon_{c,top}}{\\varepsilon_{c,bot} - \\varepsilon_{c,top}}`} />
        <CalcStep label=""
          formula={`= ${n(h,4)} \\times \\dfrac{-(${n(eps_c_top,2)})}{${n(eps_c_bot,2)} - (${n(eps_c_top,2)})} = ${n(x*1000,1)}\\ \\mathrm{mm}`}
          result={<Tex>{`x = ${n(x*1000,1)}\\ \\mathrm{mm}`}</Tex>} />
        <CalcStep label="Relative neutral axis depth"
          formula={`x/d = ${n(x,4)}\\ \\mathrm{m} \\;/\\; ${n(d_eff,4)}\\ \\mathrm{m} = ${n(xd,4)}`}
          result={<Tex>{`x/d = ${n(xd,4)}`}</Tex>} />
        <CalcStep label="Curvature"
          formula={`\\varphi = \\dfrac{\\varepsilon_{c,bot} - \\varepsilon_{c,top}}{h} = \\dfrac{${n(eps_c_bot,2)} - (${n(eps_c_top,2)})}{${n(h,4)}} \\times 10^{-3} = ${n(kappa * 1e3, 4)}\\ \\mathrm{rad/m}`}
          result={<Tex>{`\\varphi = ${n(kappa * 1e3, 4)}\\ \\mathrm{rad/m}`}</Tex>} />
      </DetailGroup>

      <DetailGroup title="Calculation of cross-section resistance (EN 1992-1-1 §6.1)">
        <p style={PROSE}>The equilibrium strain state for N<sub>Ed</sub> = {n(NEd, 0)} kN is found by bisection.</p>
        <CalcStep label="Governing strain state"
          formula={`\\varepsilon_{c,top} = ${n(eps_c_top,2)}\\ ‰,\\quad \\varepsilon_{c,bot} = ${n(eps_c_bot,2)}\\ ‰`} />
        <CalcStep label="Maximum concrete stress"
          formula={`\\sigma_{c,max} = ${n(sigma_c_max,2)}\\ \\mathrm{MPa}`} />
        <CalcStep label="Reinforcement strains and stresses"
          formula={`\\varepsilon_{s,max} = ${n(eps_s_max,2)}\\ ‰ \\Rightarrow \\sigma_{s,max} = ${n(sigma_s_max,2)}\\ \\mathrm{MPa}`} />
        <CalcStep label=""
          formula={`\\varepsilon_{s,min} = ${n(eps_s_min,2)}\\ ‰ \\Rightarrow \\sigma_{s,min} = ${n(sigma_s_min,2)}\\ \\mathrm{MPa}`} />
      </DetailGroup>

      <DetailGroup title="Pair of internal forces">
        <CalcStep label="Compressive resultant"
          formula={`F_C = ${n(FC,2)}\\ \\mathrm{kN} \\quad \\text{at } M_C = ${n(MC,2)}\\ \\mathrm{kNm}`}
          result={<Tex>{`F_C = ${n(FC,2)}\\ \\mathrm{kN}`}</Tex>} />
        <CalcStep label="Tensile resultant"
          formula={`F_T = ${n(FT,2)}\\ \\mathrm{kN} \\quad \\text{at } M_T = ${n(MT,2)}\\ \\mathrm{kNm}`}
          result={<Tex>{`F_T = ${n(FT,2)}\\ \\mathrm{kN}`}</Tex>} />
        <CalcStep label="Lever arm of internal forces"
          formula={`z = z_T - z_C = ${n(lever,4)}\\ \\mathrm{m}`}
          result={<Tex>{`z = ${n(lever,4)}\\ \\mathrm{m}`}</Tex>} />
      </DetailGroup>

      <DetailGroup title="Minimum eccentricity (EN 1992-1-1 §6.1(4))">
        <CalcStep label="Minimum eccentricity"
          formulaNode={<span style={{ fontStyle: 'italic' }}>e<sub>0</sub> = max(h/30, 20 mm) = max({n(h*1000/30,1)}, 20) = {n(e0*1000,1)} mm</span>}
          note={<><strong>|M<sub>Ed</sub>| = {n(Math.abs(MEd),1)} kNm {Math.abs(MEd) >= e0*Math.abs(NEd) ? '≥' : '<'} e₀·|N<sub>Ed</sub>| = {n(e0*Math.abs(NEd),1)} kNm → minimum eccentricity {Math.abs(MEd) >= e0*Math.abs(NEd) ? 'satisfied' : 'controls'}</strong></>} />
      </DetailGroup>

      <DetailGroup title="Bending moment resistance (EN 1992-1-1 §6.1)">
        <CalcStep label={`Moment resistance for NEd = ${n(NEd,0)} kN`}
          formula={`M_{Rd} = \\sum F_i \\cdot (z_i - z_{cm}) = ${n(MRd,2)}\\ \\mathrm{kNm}`}
          result={<Tex>{`M_{Rd} = ${n(MRd,2)}\\ \\mathrm{kNm}`}</Tex>}
          note={<><strong>M<sub>Rd</sub> = {n(MRd,2)} kNm {Math.abs(MRd) >= Math.abs(MEd) - 0.01 ? '≥' : '<'} M<sub>Ed</sub> = {n(MEd,1)} kNm → {Math.abs(MRd) >= Math.abs(MEd) - 0.01 ? 'OK ✓' : 'NOT OK ✗'}</strong></>} />
      </DetailGroup>

      <DetailGroup title="Effective bending stiffness">
        <CalcStep label="Gross (uncracked) bending stiffness"
          formula={`(EI)_{gross} = E_{cm} \\cdot I = ${n(Ecm,0)}\\ \\mathrm{MPa} \\times ${n(I,6)}\\ \\mathrm{m^4} = ${n(EI_gross/1000,2)}\\ \\mathrm{MNm^2}`}
          result={<Tex>{`(EI)_{gross} = ${n(EI_gross/1000,2)}\\ \\mathrm{MNm^2}`}</Tex>} />
        <CalcStep label="Effective (cracked secant) bending stiffness"
          formula={`(EI)_{eff} = \\dfrac{M_{Rd}}{\\varphi} = \\dfrac{${n(MRd,2)}\\ \\mathrm{kNm}}{${n(Math.abs(kappa)*1e3,4)}\\ \\mathrm{rad/m}} = ${n(EI_eff/1000,2)}\\ \\mathrm{MNm^2}`}
          result={<Tex>{`(EI)_{eff} = ${n(EI_eff/1000,2)}\\ \\mathrm{MNm^2}`}</Tex>}
          note={`(EI)eff / (EI)gross = ${n(EI_eff / EI_gross, 4)} — cracked stiffness ratio`} />
      </DetailGroup>

      {inp.firstOrder && (
        <DetailGroup title="First-order eccentricity (EN 1992-1-1 §6.1(4), §5.2)">
          <CalcStep label="Minimum eccentricity"
            formulaNode={<span style={{ fontStyle: 'italic' }}>e<sub>0,min</sub> = max(h/30, 20 mm) = max({n(h*1000/30,1)}, 20) = {n(e0_min*1000,1)} mm</span>} />
          {inp.useMinEcc && <>
            <CalcStep label="End-moment eccentricity at end 1"
              formula={`e_{0,1} = |M_1/N_1| = |${n(inp.M1??MEd,1)}\\,/\\,${n(inp.N1??NEd,1)}| = ${n(e0_e1*1000,1)}\\ \\mathrm{mm}`}
              result={<Tex>{`e_{0,1} = ${n(e0_e1*1000,1)}\\ \\mathrm{mm}`}</Tex>} />
            <CalcStep label="End-moment eccentricity at end 2"
              formula={`e_{0,2} = |M_2/N_2| = |${n(inp.M2??MEd,1)}\\,/\\,${n(inp.N2??NEd,1)}| = ${n(e0_e2*1000,1)}\\ \\mathrm{mm}`}
              result={<Tex>{`e_{0,2} = ${n(e0_e2*1000,1)}\\ \\mathrm{mm}`}</Tex>} />
            <CalcStep label="Governing first-order eccentricity"
              formulaNode={<span style={{ fontStyle: 'italic' }}>e<sub>0</sub> = max(e<sub>0,1</sub>, e<sub>0,2</sub>, e<sub>0,min</sub>) = max({n(e0_e1*1000,1)}, {n(e0_e2*1000,1)}, {n(e0_min*1000,1)}) = {n(e0_used*1000,1)} mm</span>} />
            {M_e0 > 0 && <CalcStep label="First-order eccentricity moment"
              formula={`M_{e_0} = e_0 \\cdot |N_{Ed}| = ${n(e0_used*1000,1)}\\ \\mathrm{mm} \\times ${n(Math.abs(NEd),0)}\\ \\mathrm{kN} = ${n(M_e0,1)}\\ \\mathrm{kNm}`}
              result={<Tex>{`M_{e_0} = ${n(M_e0,1)}\\ \\mathrm{kNm}`}</Tex>} />}
          </>}
          {inp.useImperfection && <>
            <CalcStep label="Geometric imperfection (EN 1992-1-1 §5.2)"
              formula={`e_a = \\dfrac{l_0}{400} = \\dfrac{${n(inp.l0??10,3)}\\ \\mathrm{m}}{400} = ${n(ea*1000,1)}\\ \\mathrm{mm}`}
              result={<Tex>{`e_a = ${n(ea*1000,1)}\\ \\mathrm{mm}`}</Tex>} />
            <CalcStep label="Imperfection moment"
              formula={`M_{ea} = e_a \\cdot |N_{Ed}| = ${n(ea*1000,1)}\\ \\mathrm{mm} \\times ${n(Math.abs(NEd),0)}\\ \\mathrm{kN} = ${n(M_ea,1)}\\ \\mathrm{kNm}`}
              result={<Tex>{`M_{ea} = ${n(M_ea,1)}\\ \\mathrm{kNm}`}</Tex>} />
          </>}
          {M1 > 0 && <CalcStep label="Total first-order moment addition"
            formula={`M_1 = M_{e_0} + M_{ea} = ${n(M_e0,1)} + ${n(M_ea,1)} = ${n(M1,1)}\\ \\mathrm{kNm}`}
            result={<Tex>{`M_1 = ${n(M1,1)}\\ \\mathrm{kNm}`}</Tex>} />}
        </DetailGroup>
      )}

      {inp.secondOrder && (
        <DetailGroup title="Second-order effects — Nominal curvature method (EN 1992-1-1 §5.8.8)">
          <CalcStep label="Radius of gyration"
            formula={`i = \\sqrt{I/A} = \\sqrt{${n(I,6)}/${n(A,4)}} = ${n(Math.sqrt(I/A),4)}\\ \\mathrm{m}`}
            result={<Tex>{`i = ${n(Math.sqrt(I/A),4)}\\ \\mathrm{m}`}</Tex>} />
          <CalcStep label="Slenderness ratio"
            formula={`\\lambda = l_0/i = ${n(inp.l0??10,3)}/${n(Math.sqrt(I/A),4)} = ${n(lambda,1)}`}
            result={<Tex>{`\\lambda = ${n(lambda,1)}`}</Tex>} />
          <CalcStep label="Relative axial force"
            formula={`n = \\dfrac{|N_{Ed}|}{A \\cdot f_{cd}} = \\dfrac{${n(Math.abs(NEd),0)}}{${n(A*1e6,0)} \\times ${n(fcd,2)}/1000} = ${n(nu,3)}`}
            result={<Tex>{`n = ${n(nu,3)}`}</Tex>} />
          <CalcStep label="Limiting slenderness (EN 1992-1-1 §5.8.3.1)"
            formula={`\\lambda_{lim} = \\dfrac{20 \\cdot A \\cdot B \\cdot C}{\\sqrt{n}} = ${n(lambda_lim,1)}`}
            result={<Tex>{`\\lambda_{lim} = ${n(lambda_lim,1)}`}</Tex>}
            note={slender ? <><strong>λ = {n(lambda,1)} &gt; λ_lim = {n(lambda_lim,1)} → column is slender</strong></> : <><strong>λ = {n(lambda,1)} ≤ λ_lim = {n(lambda_lim,1)} → second-order effects negligible</strong></>} />
          <CalcStep label="Effective creep ratio"
            formula={`\\varphi_{ef} = \\varphi(\\infty,t_0) \\cdot \\dfrac{M_{0Eqp}}{M_{0Ed}}`} />
          <CalcStep label=""
            formula={`= ${n(phi_inf_used,2)} \\times \\dfrac{${n(inp.M0Eqp??Math.round(Math.abs(MEd)*0.6),1)}}{${n(inp.M0EdRef==='2'?(inp.M2??MEd):(inp.M1??MEd),1)}} = ${n(phi_ef_calc,3)}${inp.phi_ef!=null ? ` \\ (\\text{overridden to } ${n(phi_ef_used,3)})` : ''}`}
            result={<Tex>{`\\varphi_{ef} = ${n(phi_ef_used,3)}`}</Tex>} />
          <CalcStep label="K₁ — creep/slenderness correction (§5.8.8.3)"
            formulaNode={<span style={{ fontStyle: 'italic' }}>K<sub>1</sub> = max(1, 1 + (0.35 + f<sub>ck</sub>/200 − λ/150)·φ<sub>ef</sub>) = max(1, 1 + (0.35 + {n(fck,0)}/200 − {n(lambda,1)}/150) × {n(phi_ef_used,3)}) = {n(K1,3)}</span>} />
          <CalcStep label="K₂ (Kr) — axial load correction"
            formula={`K_r = \\dfrac{N_{ud} - |N_{Ed}|}{N_{ud} - N_{bal}} = ${n(Kr,3)}`}
            result={<Tex>{`K_r = ${n(Kr,3)}`}</Tex>} />
          <CalcStep label="Kφ — creep amplification"
            formulaNode={<span style={{ fontStyle: 'italic' }}>K<sub>φ</sub> = max(1, 1 + K<sub>1</sub>·φ<sub>ef</sub>) = max(1, 1 + {n(K1,3)} × {n(phi_ef_used,3)}) = {n(Kphi,3)}</span>} />
          {slender && <>
            <CalcStep label="Curvature 1/r (§5.8.8.3)"
              formula={`\\dfrac{1}{r} = K_r \\cdot K_\\varphi \\cdot \\dfrac{\\varepsilon_{yd}}{0.45 \\cdot d}`} />
            <CalcStep label=""
              formula={`= ${n(Kr,3)} \\times ${n(Kphi,3)} \\times \\dfrac{${n(eyd,3)}}{0.45 \\times ${n(res.d,3)}} \\times 10^{-3} = ${n(r_inv,4)}\\ \\mathrm{m^{-1}}`}
              result={<Tex>{`1/r = ${n(r_inv,4)}\\ \\mathrm{m^{-1}}`}</Tex>} />
            <CalcStep label="Second-order eccentricity"
              formula={`e_2 = \\dfrac{1}{r} \\cdot \\dfrac{l_0^2}{10} = ${n(r_inv,4)} \\times \\dfrac{${n(inp.l0??10,3)}^2}{10} = ${n(e2*1000,1)}\\ \\mathrm{mm}`}
              result={<Tex>{`e_2 = ${n(e2*1000,1)}\\ \\mathrm{mm}`}</Tex>} />
            <CalcStep label="Second-order moment"
              formula={`M_2 = e_2 \\cdot |N_{Ed}| = ${n(e2*1000,1)}\\ \\mathrm{mm} \\times ${n(Math.abs(NEd),0)}\\ \\mathrm{kN} = ${n(M2,1)}\\ \\mathrm{kNm}`}
              result={<Tex>{`M_2 = ${n(M2,1)}\\ \\mathrm{kNm}`}</Tex>} />
          </>}
        </DetailGroup>
      )}

      {(inp.firstOrder || inp.secondOrder) && (
        <DetailGroup title="Total design moment">
          <CalcStep label="Total design moment"
            formula={`M_{Ed,tot} = M_{Ed} + M_1 + M_2 = ${n(Math.abs(MEd),1)} + ${n(M1,1)} + ${n(M2,1)} = ${n(MEd_tot,1)}\\ \\mathrm{kNm}`}
            result={<Tex>{`M_{Ed,tot} = ${n(MEd_tot,1)}\\ \\mathrm{kNm}`}</Tex>}
            note={<><strong>M<sub>Rd</sub> = {n(MRd,2)} kNm {MRd >= MEd_tot ? '≥' : '<'} M<sub>Ed,tot</sub> = {n(MEd_tot,1)} kNm → {MRd >= MEd_tot ? 'OK ✓' : 'NOT OK ✗'}</strong></>} />
        </DetailGroup>
      )}
    </div>
  )
}
