'use client'
import { useState } from 'react'
import { DetailGroup, CalcStep, Tex } from '../../../../../../_lib/ui'
import { Ec2RectInput, Ec2RectResult } from '../../rect-engine/rect-calc'
import { Ec2SlsInput, Ec2SlsResult, calcEc2Sls } from '../../rect-engine/rect-sls-calc'

function n(x: number, d = 2) { return isFinite(x) ? x.toFixed(d) : '—' }

const OK  = (ok: boolean) => ok ? '#16a34a' : '#dc2626'
const TAG = (ok: boolean) => ok ? 'PASS' : 'FAIL'

function CheckRow({ label, lhs, rhs, unit, ok }: {
  label: React.ReactNode; lhs: string; rhs: string; unit?: string; ok: boolean
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        padding: '5px 6px', borderTop: '1px solid #f1f5f9', marginTop: 4,
        borderRadius: 4, margin: '4px -6px 0',
        background: hovered ? '#eff6ff' : 'transparent',
        transition: 'background 0.1s',
      }}>
      <span style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>{label}</span>
      <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 12, fontWeight: 700, color: OK(ok) }}>
        {lhs} {ok ? '≤' : '>'} {rhs}{unit ? ` ${unit}` : ''} → {TAG(ok)}
      </span>
    </div>
  )
}

export function RectSlsDetails({ inp, uls, sls }: { inp: Ec2RectInput; uls: Ec2RectResult; sls: Ec2SlsInput }) {
  const r: Ec2SlsResult = calcEc2Sls(inp, sls, uls.Ecm)
  const fck = inp.fck

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '14px 16px', background: '#fff' }}>
      <p style={{ fontSize: 11, color: '#1e293b', marginBottom: 10 }}>
        <strong>According to:</strong> EN 1992-1-1:2004+AC:2008 §7.2, §7.3.2, §7.3.4, §7.3N
      </p>

      <DetailGroup title="Material Properties">
        <CalcStep label={<>Characteristic cylinder strength f<sub>ck</sub></>}
          formula={`f_{ck} = ${n(fck, 0)}\\ \\mathrm{MPa}`} />
        <CalcStep label={<>Modulus of elasticity — concrete E<sub>cm</sub> (EC2 Table 3.1)</>}
          formula={`E_{cm} = ${n(uls.Ecm, 0)}\\ \\mathrm{MPa}`} />
        <CalcStep label={<>Modulus of elasticity — steel E<sub>s</sub></>}
          formula={`E_s = 200\\ 000\\ \\mathrm{MPa}`} />
        <CalcStep label={<>Modular ratio α<sub>e</sub> = E<sub>s</sub> / E<sub>cm</sub></>}
          formula={`\\alpha_e = 200\\ 000 / ${n(uls.Ecm,0)} = ${n(r.alphaE, 2)}`} />
        <CalcStep label={<>Mean tensile strength f<sub>ctm</sub> (EC2 Table 3.1)</>}
          formula={
            fck <= 50
              ? `f_{ctm} = 0.30 \\cdot f_{ck}^{2/3} = 0.30 \\times ${n(fck,0)}^{2/3} = ${n(r.fct_eff,3)}\\ \\mathrm{MPa}`
              : `f_{ctm} = 2.12 \\cdot \\ln(1 + (f_{ck}+8)/10) = ${n(r.fct_eff,3)}\\ \\mathrm{MPa}`
          } />
      </DetailGroup>

      <DetailGroup title="Cracked Neutral Axis Depth x_cr (§7.4.2)">
        <p style={{ fontSize: 12, color: '#374151', marginBottom: 6, lineHeight: 1.6 }}>
          Cracked transformed section about top fibre. Solve [<i>EA ES</i>; <i>ES EI</i>]·[ε₀; κ] = [N<sub>sk</sub>; M<sub>top</sub>] by bisection on x until NA = −ε₀/κ matches trial x.
        </p>
        <CalcStep label={<>Moment about top fibre M<sub>top</sub></>}
          formula={`M_{top} = M_{sk} + N_{sk} \\cdot (h/2) = ${n(sls.Msk,1)} + (${n(sls.Nsk,1)}) \\cdot ${n(inp.h/2,3)} = ${n(sls.Msk + sls.Nsk*(inp.h/2),1)}\\ \\mathrm{kNm}`} />
        <CalcStep label={<>Neutral axis depth x<sub>cr</sub> (converged by bisection)</>}
          formula={`x_{cr} = ${n(r.x_cr*1000,1)}\\ \\mathrm{mm} \\quad (x_{cr}/h = ${n(r.x_cr/inp.h,3)})`} />
        <CalcStep label="Top fibre strain and curvature"
          formula={`\\varepsilon_0 = ${n(r.eps_c_top,4)}\\ ‰\\ (\\text{compression} = \\text{negative}), \\quad \\kappa = ${n(r.kappa,6)}\\ \\mathrm{rad/m}`} />
      </DetailGroup>

      <DetailGroup title="Strain & Stress at SLS (§7.4)">
        <p style={{ fontSize: 12, color: '#374151', marginBottom: 6 }}>
          Linear-elastic (Bernoulli): ε(z) = ε₀ + κ·z, where z is measured downward from top fibre.
        </p>
        <CalcStep label="Top fibre concrete stress"
          formula={`\\varepsilon_{c,top} = ${n(r.eps_c_top,4)}\\ ‰ \\quad \\Rightarrow \\quad \\sigma_c = E_{cm} \\cdot |\\varepsilon_{c,top}| = ${n(uls.Ecm,0)} \\times ${n(Math.abs(r.eps_c_top)/1000,6)} = ${n(r.sigma_c,2)}\\ \\mathrm{MPa}`} />
        <CalcStep label={<>Bottom steel stress σ<sub>s,1</sub> (z = {n(r.z1*1000,0)} mm from top)</>}
          formula={`\\varepsilon_{s,1} = ${n(r.eps_s1,4)}\\ ‰ \\quad \\Rightarrow \\quad \\sigma_{s,1} = E_s \\cdot \\varepsilon_{s,1} = 200\\ 000 \\times ${n(r.eps_s1/1000,6)} = ${n(r.sigma_s1,2)}\\ \\mathrm{MPa}`} />
        <CalcStep label={<>Top steel stress σ<sub>s,2</sub> (z = {n(r.z2*1000,0)} mm from top)</>}
          formula={`\\varepsilon_{s,2} = ${n(r.eps_s2,4)}\\ ‰ \\quad \\Rightarrow \\quad \\sigma_{s,2} = E_s \\cdot \\varepsilon_{s,2} = 200\\ 000 \\times ${n(r.eps_s2/1000,6)} = ${n(r.sigma_s2,2)}\\ \\mathrm{MPa}`} />
      </DetailGroup>

      <DetailGroup title="§7.2 Concrete Stress Limit">
        <CalcStep label={<>Compressive stress limit 0.6·f<sub>ck</sub></>}
          formula={`\\sigma_{c,lim} = 0.6 \\cdot f_{ck} = 0.6 \\times ${n(fck,0)} = ${n(r.sigma_c_lim,2)}\\ \\mathrm{MPa}`} />
        <CalcStep label="Actual concrete stress at top fibre"
          formula={`\\sigma_c = ${n(r.sigma_c,2)}\\ \\mathrm{MPa}`} />
        <CheckRow label={<>σ<sub>c</sub> ≤ 0.6·f<sub>ck</sub></>}
          lhs={n(r.sigma_c,2)} rhs={n(r.sigma_c_lim,2)} unit="MPa" ok={r.sigma_c_ok} />
      </DetailGroup>

      <DetailGroup title="§7.3.2 Minimum Reinforcement">
        <CalcStep label="Minimum reinforcement formula"
          formula={`A_{s,min} = k_c \\cdot k \\cdot f_{ct,eff} \\cdot A_{ct} \\;/\\; \\sigma_s`} />
        <CalcStep label={<>k<sub>c</sub> — stress distribution factor (user input)</>}
          formula={`k_c = ${n(sls.kc,2)}`} />
        <CalcStep label={<>k — depth factor (h = {n(inp.h*1000,0)} mm)</>}
          formulaNode={
            <span style={{ fontStyle: 'italic' }}>
              {inp.h <= 0.3
                ? `k = 1.0  (h ≤ 300 mm)`
                : inp.h >= 0.8
                ? `k = 0.65  (h ≥ 800 mm)`
                : `k = 1.0 − (h−300)/(800−300) × 0.35 = ${n(r.k,3)}`}
            </span>
          } />
        <CalcStep label={<>f<sub>ct,eff</sub> = f<sub>ctm</sub></>}
          formula={`f_{ct,eff} = ${n(r.fct_eff,3)}\\ \\mathrm{MPa}`} />
        <CalcStep label={<>A<sub>ct</sub> — tensile zone area below neutral axis</>}
          formula={`A_{ct} = ${n(r.Act*1e6,0)}\\ \\mathrm{mm^2}`} />
        <CalcStep label={<>σ<sub>s</sub> = min(|σ<sub>s,1</sub>|, f<sub>yk</sub>)</>}
          formula={`\\sigma_s = \\min(${n(Math.abs(r.sigma_s1),0)},\\,${n(inp.fyk,0)}) = ${n(Math.min(Math.abs(r.sigma_s1),inp.fyk),0)}\\ \\mathrm{MPa}`} />
        <CalcStep label="Substitution"
          formula={`A_{s,min} = ${n(sls.kc,2)} \\times ${n(r.k,3)} \\times ${n(r.fct_eff,3)} \\times ${n(r.Act*1e6,0)} \\;/\\; ${n(Math.min(Math.abs(r.sigma_s1),inp.fyk),0)} = ${n(r.As_min*1e6,0)}\\ \\mathrm{mm^2}`} />
        <CalcStep label="Provided bottom reinforcement"
          formula={`A_{s,prov} = ${n(r.As_prov*1e6,0)}\\ \\mathrm{mm^2}`} />
        <CheckRow label={<>A<sub>s,prov</sub> ≥ A<sub>s,min</sub></>}
          lhs={n(r.As_prov*1e6,0)} rhs={n(r.As_min*1e6,0)} unit="mm²" ok={r.As_min_ok} />
      </DetailGroup>

      <DetailGroup title="§7.3.4 Crack Width w_k">
        <CalcStep label="Crack width formula"
          formula={`w_k = s_{r,max} \\cdot (\\varepsilon_{sm} - \\varepsilon_{cm})`} />

        <p style={{ fontSize: 11, fontWeight: 700, color: '#374151', margin: '8px 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          (a) Effective tension area A<sub>c,eff</sub> §7.3.2(3)
        </p>
        <CalcStep label={<>h<sub>c,eff</sub> = min(2.5·(h−d),  (h−x)/3,  h/2)</>}
          formula={`h_{c,eff} = \\min(${n(2.5*(inp.h-r.z1)*1000,1)},\\;${n((inp.h-r.x_cr)/3*1000,1)},\\;${n(inp.h/2*1000,1)}) = ${n(r.Ac_eff/inp.b*1000,1)}\\ \\mathrm{mm}`} />
        <CalcStep label={<>A<sub>c,eff</sub> = h<sub>c,eff</sub> · b</>}
          formula={`A_{c,eff} = ${n(r.Ac_eff/inp.b*1000,1)} \\times ${n(inp.b*1000,0)} = ${n(r.Ac_eff*1e6,0)}\\ \\mathrm{mm^2}`} />
        <CalcStep label={<>ρ<sub>p,eff</sub> = A<sub>s,eff</sub> / A<sub>c,eff</sub></>}
          formula={`\\rho_{p,eff} = ${n(r.As_prov*1e6,0)} / ${n(r.Ac_eff*1e6,0)} = ${n(r.rho_p_eff,5)}`} />

        <p style={{ fontSize: 11, fontWeight: 700, color: '#374151', margin: '8px 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          (b) Equivalent bar diameter φ<sub>eff</sub> (EC2 Eq. 7.12)
        </p>
        <CalcStep label={<>φ<sub>eff</sub> = ΣΦᵢ² / ΣΦᵢ (weighted average)</>}
          formula={`\\phi_{eff} = ${n(r.phi_eff,2)}\\ \\mathrm{mm}`} />

        <p style={{ fontSize: 11, fontWeight: 700, color: '#374151', margin: '8px 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          (c) Maximum crack spacing s<sub>r,max</sub> (§7.3.4(3))
        </p>
        <CalcStep label={<>s<sub>r,max</sub> = k₃·c + k₁·k₂·k₄·φ<sub>eff</sub> / ρ<sub>p,eff</sub></>}
          formula={`s_{r,max} = 3.4 \\times ${n(r.c_nom,1)} + 0.8 \\times ${n(r.k2,1)} \\times 0.425 \\times ${n(r.phi_eff,2)} / ${n(r.rho_p_eff,5)} = ${n(r.sr_max_calc,1)}\\ \\mathrm{mm}`}
          note={`k₁ = ${n(r.k1,1)} (high bond),  k₂ = ${n(r.k2,1)} (bending),  k₃ = 3.4,  k₄ = 0.425,  c = ${n(r.c_nom,1)} mm`} />
        <CalcStep label={<>Upper bound 1.3·(h − x) §7.3.4(4)</>}
          formula={`s_{r,max,ub} = 1.3 \\times (${n(inp.h*1000,0)} - ${n(r.x_cr*1000,1)}) = ${n(r.sr_max_ub,1)}\\ \\mathrm{mm}`} />
        <CalcStep label={<>s<sub>r,max</sub> = min(formula, upper bound)</>}
          formula={`s_{r,max} = \\min(${n(r.sr_max_calc,1)},\\;${n(r.sr_max_ub,1)}) = ${n(r.sr_max,1)}\\ \\mathrm{mm}`} />

        <p style={{ fontSize: 11, fontWeight: 700, color: '#374151', margin: '8px 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          (d) Mean strain difference (ε<sub>sm</sub> − ε<sub>cm</sub>) §7.3.4(2)
        </p>
        <CalcStep label={<>ε<sub>sm</sub> − ε<sub>cm</sub> = (σ<sub>s</sub>/E<sub>s</sub>) · max(0.6,  1 − k<sub>t</sub>·(f<sub>ct,eff</sub>/σ<sub>s</sub>)·(1/ρ<sub>p,eff</sub> + α<sub>e</sub>))</>}
          formulaNode={
            <span style={{ fontStyle: 'italic' }}>
              factor = max(0.6,  1 − {n(r.kt,1)}·({n(r.fct_eff,3)}/{n(r.sigma_s1,2)})·{n(1/r.rho_p_eff+r.alphaE,2)}) = {n(r.factor,4)}
            </span>
          } />
        <CalcStep label="Strain difference"
          formula={`\\varepsilon_{sm} - \\varepsilon_{cm} = ${n(r.factor,4)} \\times ${n(r.sigma_s1,2)} / 200\\ 000 = ${n(r.eps_sm_cm,4)}\\ ‰`} />

        <p style={{ fontSize: 11, fontWeight: 700, color: '#374151', margin: '8px 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          (e) Crack width
        </p>
        <CalcStep label="Crack width calculation"
          formula={`w_k = s_{r,max} \\cdot (\\varepsilon_{sm} - \\varepsilon_{cm}) = ${n(r.sr_max,1)} \\times ${n(r.eps_sm_cm,4)} = ${n(r.wk,3)}\\ \\mathrm{mm}`} />
        <CheckRow label={<>w<sub>k</sub> ≤ w<sub>lim</sub></>}
          lhs={n(r.wk,3)} rhs={String(sls.wk_lim)} unit="mm" ok={r.wk_ok} />
      </DetailGroup>

      <DetailGroup title="Table 7.3N — Bar Ø / Spacing Limit">
        <p style={{ fontSize: 12, color: '#374151', marginBottom: 6, lineHeight: 1.6 }}>
          Maximum bar diameter and spacing from Table 7.3N for w<sub>k</sub> = {sls.wk_lim} mm, high bond bars, bending (k₂ = 0.5).
        </p>
        <CalcStep label={<>Service steel stress σ<sub>s,1</sub></>}
          formula={`\\sigma_{s,1} = ${n(r.sigma_s1,2)}\\ \\mathrm{MPa}`} />
        <CalcStep label={<>Maximum bar diameter φ<sub>max</sub> (Table 7.3N)</>}
          formula={`\\phi_{max} = ${n(r.phi_max,0)}\\ \\mathrm{mm}`} />
        <CalcStep label={<>Provided bar diameter φ<sub>prov</sub></>}
          formula={`\\phi_{prov} = ${n(r.phi_prov,0)}\\ \\mathrm{mm}`} />
        <CheckRow label={<>φ<sub>prov</sub> ≤ φ<sub>max</sub></>}
          lhs={n(r.phi_prov,0)} rhs={n(r.phi_max,0)} unit="mm" ok={r.phi_ok} />
        <div style={{ height: 8 }} />
        <CalcStep label={<>Maximum bar spacing s<sub>max</sub> (Table 7.3N)</>}
          formula={`s_{max} = ${n(r.s_max,0)}\\ \\mathrm{mm}`} />
        <CalcStep label={<>Estimated bar spacing s<sub>prov</sub></>}
          formula={`s_{prov} = ${n(r.s_prov,0)}\\ \\mathrm{mm}`} />
        <CheckRow label={<>s<sub>prov</sub> ≤ s<sub>max</sub></>}
          lhs={n(r.s_prov,0)} rhs={n(r.s_max,0)} unit="mm" ok={r.s_ok} />
      </DetailGroup>
    </div>
  )
}
