'use client'
import { Ec2RectInput, Ec2RectResult } from '../../rect-engine/rect-calc'
import { Box, Row, GREEN, n2, n4 } from '../../../../../_shared/ui-atoms'
import { SectionDiagram, SpacingClickInfo } from '../../../../../_shared/section-diagram'
import { NMDiagram } from '../../../../../_shared/nm-diagram'

const PURPLE = '#8b5cf6'
const AMBER  = '#f59e0b'
const ORANGE = '#b45309'
const TEAL   = '#0d9488'
const INDIGO = '#4f46e5'
const ROSE   = '#e11d48'
const CYAN   = '#0891b2'
const LIME   = '#65a30d'

export function UlsResults({
  inp, res, anyEffect, onSpacingClick,
}: {
  inp: Ec2RectInput
  res: Ec2RectResult
  anyEffect: boolean
  onSpacingClick: (info: SpacingClickInfo) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Diagram + right sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <SectionDiagram inp={inp} res={res} onSpacingClick={onSpacingClick} />
          <NMDiagram res={res} NEd={inp.NEd} MEd={anyEffect ? res.MEd_tot : inp.MEd} mLabel={anyEffect ? 'MEd,tot' : undefined} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Box title="MOMENT RESISTANCE" accent={GREEN}>
            <Row label={`At Nₑₙ = ${n2(inp.NEd, 0)} kN`} symbol="M_Rd"
              value={`${n2(res.MRd_plus)} kNm`}
              ok={res.MRd_plus >= (anyEffect ? res.MEd_tot : inp.MEd)}
              warn={res.MRd_plus < (anyEffect ? res.MEd_tot : inp.MEd)}
              tip={<>Design moment resistance M<sub>Rd</sub> at the applied axial force N<sub>Ed</sub>, from the equilibrium strain state (EN 1992-1-1 §6.1).</>} />
            <Row label="Peak (all N levels)" symbol="M_Rd,peak" value={`${n2(res.MRd_peak)} kNm`}
              tip={<>Maximum M<sub>Rd</sub> over the full range of axial forces — the peak of the N–M interaction diagram.</>} />
            <Row label="Pure bending (N=0)" symbol="M_Rd,0" value={`${n2(res.MRd0)} kNm`}
              tip={<>Moment resistance at zero axial force (pure bending, N<sub>Ed</sub> = 0).</>} />
            <Row label="Negative (flipped)" symbol="M_Rd,−" value={`${n2(res.MRd_minus)} kNm`}
              tip="Moment resistance for negative moment (tension at top), using the same reinforcement layout." />
            <Row label="Min eccentricity" symbol="e_0" value={`${n2(res.e0 * 1000, 0)} mm`}
              tip={<>EN 1992-1-1 §6.1(4): e<sub>0</sub> = max(h/30, 20 mm). Design moment must be ≥ e<sub>0</sub>·|N<sub>Ed</sub>|.</>} />
          </Box>

          <Box title="REINFORCEMENT" accent={INDIGO}>
            <Row labelNode={<>A<sub>s,1</sub> (bottom)</>} symbol="A_s,1" value={`${n2(res.As1 * 100, 0)} mm²`}
              tip={<>Total area of all bottom (tension) bar rows — Layer 1. A<sub>s,1</sub> = Σ n<sub>i</sub>·(π·Φ<sub>i</sub>²/4).</>} />
            <Row labelNode={<>A<sub>s,2</sub> (top)</>} symbol="A_s,2" value={`${n2(res.As2 * 100, 0)} mm²`}
              tip={<>Total area of all top (compression) bar rows — Layer 2.</>} />
            <Row labelNode={<>A<sub>s,3</sub> (sides)</>} symbol="A_s,3" value={`${n2(res.As3 * 100, 0)} mm²`}
              tip={<>Total area of skin reinforcement distributed along both side faces — Layer 3.</>} />
            <Row labelNode={<>A<sub>s,tot</sub> (total)</>} symbol="A_s,tot" value={`${n2(res.Astot * 100, 0)} mm²`} ok
              tip={<>Sum of all reinforcement: A<sub>s,tot</sub> = A<sub>s,1</sub> + A<sub>s,2</sub> + A<sub>s,3</sub>.</>} />
            <Row label="Ratio" symbol="ρ_l" value={`${n2(res.rho * 100, 2)} %`}
              tip={<>Geometric reinforcement ratio: ρ<sub>l</sub> = A<sub>s,tot</sub> / (b·h). EN 1992-1-1 §9.2.1: 0.1 % ≤ ρ<sub>l</sub> ≤ 4 %.</>} />
            <Row label="Mechanical ratio" symbol="ω" value={n4(res.fyd / res.fcd * res.rho)}
              tip={<>Mechanical reinforcement ratio: ω = ρ<sub>l</sub>·f<sub>yd</sub>/f<sub>cd</sub>. Combines steel and concrete strengths into one dimensionless indicator.</>} />
          </Box>

          <Box title="STRAIN STATE" accent={TEAL}>
            <Row labelNode={<>ε<sub>c,top</sub> (top concrete)</>} symbol="ε_c,top" value={`${n2(res.eps_c_top, 2)} ‰`}
              tip={<>Strain at the top (compression) fibre at ULS equilibrium. Negative = compression. Bounded by ε<sub>cu2</sub> = {n2(res.ecu2)} ‰ (crushing limit).</>} />
            <Row labelNode={<>ε<sub>c,bot</sub> (bottom concrete)</>} symbol="ε_c,bot" value={`${n2(res.eps_c_bot, 2)} ‰`}
              tip="Strain at the bottom fibre. Positive = tension (concrete cracked). Linear profile assumed across full depth." />
            <Row labelNode={<>ε<sub>s,max</sub> (max bar)</>} symbol="ε_s,max" value={`${n2(res.eps_s_max, 2)} ‰`} ok={res.eps_s_max > 0}
              tip={<>Maximum strain in any bar. Positive = tension. Yielding at ε<sub>yd</sub> = {n2(res.eyd, 2)} ‰; plastic plateau to ε<sub>ud</sub> = 0.9·ε<sub>uk</sub>.</>} />
            <Row labelNode={<>ε<sub>s,min</sub> (min bar)</>} symbol="ε_s,min" value={`${n2(res.eps_s_min, 2)} ‰`}
              tip={<>Minimum (most compressive) strain in any bar. Compression bars capped at f<sub>yd</sub> in compression.</>} />
            <Row label="Neutral axis depth" symbol="x" value={`${n2(res.x * 1000, 0)} mm`}
              tip="Depth from the compression face to the neutral axis (zero-strain fibre) in the equilibrium state." />
            <Row label="x / d" value={n4(res.xd)}
              tip="Relative neutral axis depth. x/d < 0.45 (C ≤ 50 MPa) indicates ductile failure with adequate rotation capacity (EN 1992-1-1 §5.5)." />
          </Box>

          <div style={{ fontSize: 10, color: '#1e293b', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, padding: '6px 10px', lineHeight: 1.6 }}>
            <strong>Add rebar rows:</strong> use the <strong>+</strong> buttons in the input panel. Bars automatically stack when they exceed one row.
          </div>
        </div>
      </div>

      {/* Bottom auto-fill grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        <Box title="STRESSES" accent={ROSE}>
          <Row labelNode={<>σ<sub>c,max</sub> (concrete)</>} symbol="σ_c,max" value={`${n2(res.sigma_c_max)} MPa`}
            tip="Maximum compressive stress in the concrete at ULS (parabolic-rectangular model), at the extreme compression fibre." />
          <Row labelNode={<>σ<sub>s,max</sub> (steel)</>} symbol="σ_s,max" value={`${n2(res.sigma_s_max)} MPa`} ok={Math.abs(res.sigma_s_max) >= res.fyd * 0.95}
            tip={<>Maximum stress in any bar. Green when tension steel yielded (|σ<sub>s</sub>| ≥ 0.95·f<sub>yd</sub>) — confirms ductile failure mode.</>} />
          <Row labelNode={<>σ<sub>s,min</sub> (steel)</>} symbol="σ_s,min" value={`${n2(res.sigma_s_min)} MPa`}
            tip={<>Minimum (most compressive) bar stress. Compression bars capped at f<sub>yd</sub>.</>} />
        </Box>

        <Box title={`MATERIAL DESIGN VALUES — ${inp.concreteName}`} accent={ORANGE}>
          <Row label="" symbol="f_cd" value={`${n2(res.fcd)} MPa`}
            tip={<>Design compressive strength: f<sub>cd</sub> = α<sub>cc</sub>·f<sub>ck</sub>/γ<sub>c</sub> (EN 1992-1-1 §3.1.6).</>} />
          <Row label="" symbol="f_yd" value={`${n2(res.fyd)} MPa`}
            tip={<>Design yield strength of steel: f<sub>yd</sub> = f<sub>yk</sub>/γ<sub>s</sub> (EN 1992-1-1 §3.2.7).</>} />
          <Row label="" symbol="ε_yd" value={`${n2(res.eyd, 2)} ‰`}
            tip={<>Design yield strain: ε<sub>yd</sub> = f<sub>yd</sub>/E<sub>s</sub>. Bars yield at this strain in tension or compression.</>} />
          <Row label="" symbol="ε_cu2" value={`${n2(res.ecu2)} ‰`}
            tip={<>Ultimate concrete crushing strain ε<sub>cu2</sub> (parabolic-rectangular model) — EN 1992-1-1 Table 3.1.</>} />
          <Row label="" symbol="ε_c2" value={`${n2(res.ec2v)} ‰`}
            tip={<>Strain ε<sub>c2</sub> at which concrete first reaches f<sub>cd</sub> in the parabolic branch — EN 1992-1-1 Table 3.1.</>} />
          <Row label="Exponent n" value={n2(res.n)}
            tip="Exponent of the parabolic branch (EN 1992-1-1 §3.1.7, Table 3.1). n = 2.0 for fₙₖ ≤ 50 MPa." />
        </Box>

        <Box title="SECTION PROPERTIES" accent={CYAN}>
          <Row label="Area" symbol="A" value={`${n2(res.A * 1e6, 0)} mm²`}
            tip="Gross cross-sectional area: A = b·h." />
          <Row labelNode={<>Second moment <i>I</i></>} symbol="I" value={`${n2(res.I * 1e12, 0)} mm⁴`}
            tip="Second moment of area of the gross uncracked section about its centroid: I = b·h³/12." />
          <Row labelNode={<>N<sub>Rd,c</sub> (pure compression)</>} symbol="N_Rd,c" value={`${n2(res.NRd_c, 0)} kN`}
            ok={inp.NEd >= res.NRd_c} warn={inp.NEd < res.NRd_c}
            tip={<>Max design compressive resistance: N<sub>Rd,c</sub> = −(f<sub>cd</sub>·A<sub>c</sub> + f<sub>yd</sub>·A<sub>s,tot</sub>). N<sub>Ed</sub> must be ≥ this (compression is negative).</>} />
          <Row labelNode={<>N<sub>Rd,t</sub> (pure tension)</>} symbol="N_Rd,t" value={`${n2(res.NRd_t, 0)} kN`}
            ok={inp.NEd <= res.NRd_t} warn={inp.NEd > res.NRd_t}
            tip={<>Max design tensile resistance: N<sub>Rd,t</sub> = f<sub>yd</sub>·A<sub>s,tot</sub>. N<sub>Ed</sub> must be ≤ this value.</>} />
          <div style={{ margin: '4px 0', borderTop: '1px solid #f1f5f9' }} />
          <Row labelNode={<>N<sub>Rd</sub> at N<sub>Ed</sub> = {n2(inp.NEd, 0)} kN</>} symbol="N_Rd"
            value={inp.NEd >= res.NRd_c && inp.NEd <= res.NRd_t ? 'Within range ✓' : 'Outside range ✗'}
            ok={inp.NEd >= res.NRd_c && inp.NEd <= res.NRd_t}
            warn={!(inp.NEd >= res.NRd_c && inp.NEd <= res.NRd_t)}
            tip={<>Checks N<sub>Rd,c</sub> ≤ N<sub>Ed</sub> ≤ N<sub>Rd,t</sub> — N<sub>Ed</sub> lies within the axial resistance envelope.</>} />
        </Box>

        <Box title="EFFECTIVE STIFFNESS" accent={LIME}>
          <Row labelNode={<>E<sub>cm</sub> used</>} symbol="E_cm" value={`${Math.round(res.Ecm).toLocaleString()} MPa`} ok={res.Ecm === res.EcmCode} warn={res.Ecm !== res.EcmCode}
            tip={<>Secant modulus E<sub>cm</sub> from EN 1992-1-1 Table 3.1. Green = code value; amber = user override active.</>} />
          <Row labelNode={<>(EI)<sub>gross</sub></>} value={`${n2(res.EI_gross / 1000, 0)} MNm²`}
            tip={<>Gross (uncracked) bending stiffness: (EI)<sub>gross</sub> = E<sub>cm</sub>·I. Reference stiffness.</>} />
          <Row labelNode={<>(EI)<sub>eff</sub></>} value={`${n2(res.EI_eff / 1000, 0)} MNm²`} ok
            tip={<>Effective bending stiffness accounting for cracking and creep, for second-order analysis (EN 1992-1-1 §5.8.7).</>} />
          <Row labelNode={<>(EI)<sub>eff</sub> / (EI)<sub>gross</sub></>} value={n4(res.EI_eff / res.EI_gross)}
            tip="Stiffness reduction ratio. Values below ~0.5 indicate significant cracking and/or creep." />
        </Box>

        <Box title="INTERNAL FORCES" accent={INDIGO}>
          <Row labelNode={<>F<sub>C</sub> (compression)</>} value={`${n2(res.FC)} kN`}
            tip={<>Resultant compressive force F<sub>C</sub>, integrated from concrete compression block + compressed bars.</>} />
          <Row labelNode={<>F<sub>T</sub> (tension)</>} value={`${n2(res.FT)} kN`}
            tip={<>Resultant tensile force F<sub>T</sub> from tension reinforcement. Equilibrium: F<sub>C</sub> + F<sub>T</sub> + N<sub>Ed</sub> = 0.</>} />
          <Row labelNode={<>M<sub>C</sub></>} value={`${n2(res.MC)} kNm`}
            tip={<>Moment contribution of F<sub>C</sub> about the section centroid.</>} />
          <Row labelNode={<>M<sub>T</sub></>} value={`${n2(res.MT)} kNm`}
            tip={<>Moment contribution of F<sub>T</sub> about the section centroid. M<sub>Rd</sub> = M<sub>C</sub> + M<sub>T</sub>.</>} />
        </Box>

        {inp.firstOrder && (
          <Box title="FIRST-ORDER ECCENTRICITY" accent={CYAN}>
            <Row labelNode={<>e<sub>0,min</sub> = max(h/30, 20 mm)</>} symbol="e_0,min" value={`${n2(res.e0_min * 1000, 1)} mm`}
              tip={<>Minimum eccentricity (EN 1992-1-1 §6.1(4)): e<sub>0,min</sub> = max(h/30, 20 mm). Ensures a minimum design moment for nominally concentric loads.</>} />
            {inp.useMinEcc && <>
              <Row labelNode={<>|M<sub>1</sub>/N<sub>1</sub>|</>} symbol="e_0,1" value={`${n2(res.e0_e1 * 1000, 1)} mm`}
                tip={<>First-end eccentricity from user-entered end moments: e<sub>0,1</sub> = |M<sub>1</sub>/N<sub>1</sub>|.</>} />
              <Row labelNode={<>|M<sub>2</sub>/N<sub>2</sub>|</>} symbol="e_0,2" value={`${n2(res.e0_e2 * 1000, 1)} mm`}
                tip={<>Second-end eccentricity: e<sub>0,2</sub> = |M<sub>2</sub>/N<sub>2</sub>|.</>} />
            </>}
            <Row labelNode={<>e<sub>0</sub> (effective, used)</>} symbol="e_0" value={`${n2(res.e0_used * 1000, 1)} mm`} ok
              tip={<>Adopted first-order eccentricity = max(e<sub>0,min</sub>, e<sub>0,1</sub>, e<sub>0,2</sub>). Applied as M<sub>1</sub> = e<sub>0</sub>·|N<sub>Ed</sub>|.</>} />
            {inp.useImperfection && (
              <Row labelNode={<>e<sub>a</sub> (geom. imperfection)</>} symbol="e_a" value={`${n2(res.ea * 1000, 1)} mm`}
                tip={<>Equivalent geometric imperfection (EN 1992-1-1 §5.2): e<sub>a</sub> = θ<sub>i</sub>·l<sub>0</sub>/2, representing unintended inclination.</>} />
            )}
          </Box>
        )}

        {inp.secondOrder && (
          <Box title="SECOND-ORDER (EC2 §5.8.8)" accent={PURPLE}>
            <Row labelNode={<>λ (slenderness)</>} symbol="λ" value={n2(res.lambda, 1)}
              tip={<>Column slenderness: λ = l<sub>0</sub>/i, where l<sub>0</sub> is effective length and i = √(I/A) is radius of gyration.</>} />
            <Row labelNode={<>λ<sub>lim</sub> (limit)</>} symbol="λ_lim" value={n2(res.lambda_lim, 1)}
              tip={<>Slenderness limit (EN 1992-1-1 §5.8.3.1): λ<sub>lim</sub> = 20·A·B·C/√n. Second-order effects negligible when λ ≤ λ<sub>lim</sub>.</>} />
            <Row label="Slender?" value={res.slender ? 'Yes ← 2nd order active' : 'No — negligible'} ok={!res.slender} warn={res.slender}
              tip={<>If λ &gt; λ<sub>lim</sub>, the column is slender and second-order moments must be included.</>} />
            <Row labelNode={<>n = |N<sub>Ed</sub>|/(A<sub>c</sub>·f<sub>cd</sub>)</>} symbol="n" value={n2(res.nu, 3)}
              tip={<>Relative axial force n = |N<sub>Ed</sub>|/(A<sub>c</sub>·f<sub>cd</sub>). Used in λ<sub>lim</sub> and in curvature correction factor K<sub>r</sub>.</>} />
            <Row labelNode={<>φ(∞,t<sub>0</sub>) — creep coeff.</>} value={n2(res.phi_inf_used, 2)}
              tip={<>Final creep coefficient φ(∞,t<sub>0</sub>) from EN 1992-1-1 Fig. 3.1. Governs long-term stiffness reduction.</>} />
            <Row labelNode={<>φ<sub>ef</sub> = φ(∞,t<sub>0</sub>)·M<sub>0Eqp</sub>/M<sub>0Ed</sub></>} value={n2(res.phi_ef_calc, 3)}
              tip={<>Effective creep ratio (EN 1992-1-1 §5.8.4): φ<sub>ef</sub> = φ(∞,t<sub>0</sub>)·M<sub>0Eqp</sub>/M<sub>0Ed</sub>. Scales creep by quasi-permanent to design moment ratio.</>} />
            <Row labelNode={inp.phi_ef != null ? <>φ<sub>ef</sub> used (override)</> : <>φ<sub>ef</sub> used (computed)</>}
              value={n2(res.phi_ef_used, 3)} ok={inp.phi_ef == null} warn={inp.phi_ef != null}
              tip={inp.phi_ef != null
                ? <>User-supplied φ<sub>ef</sub> override is active. Clear the field to revert to the computed value.</>
                : <>φ<sub>ef</sub> computed from φ(∞,t<sub>0</sub>) and moment ratio. Enter a value in the input panel to override.</>} />
            <Row labelNode={<>K<sub>1</sub> = 1+(0.35+f<sub>ck</sub>/200−λ/150)·φ<sub>ef</sub></>} value={n2(res.K1, 3)}
              tip={<>Creep magnification factor (EN 1992-1-1 §5.8.7.2 Eq. 5.19): K<sub>1</sub> ≥ 1. Amplifies nominal curvature for long-term deflection.</>} />
            <Row labelNode={<>K<sub>2</sub> = K<sub>r</sub> (axial correction)</>} value={n2(res.K2, 3)}
              tip={<>Axial force correction factor K<sub>r</sub> (EN 1992-1-1 §5.8.8.3 Eq. 5.36): K<sub>r</sub> = (n<sub>u</sub>−n)/(n<sub>u</sub>−n<sub>bal</sub>) ≤ 1. Reduces curvature for high axial load.</>} />
            <Row labelNode={<>K<sub>φ</sub> (creep factor)</>} value={n2(res.Kphi, 3)}
              tip={<>Creep factor K<sub>φ</sub> = 1 + β·φ<sub>ef</sub> (EN 1992-1-1 §5.8.8.3 Eq. 5.37). Amplifies nominal curvature 1/r<sub>0</sub> for creep.</>} />
            {res.slender && <>
              <Row labelNode={<>1/r (curvature)</>} value={`${n2(res.r_inv, 4)} m⁻¹`}
                tip={<>Nominal curvature: 1/r = K<sub>r</sub>·K<sub>φ</sub>·f<sub>yd</sub>/(E<sub>s</sub>·0.45·d). Used to compute e<sub>2</sub>.</>} />
              <Row labelNode={<>e<sub>2</sub> (2nd-order ecc.)</>} symbol="e_2" value={`${n2(res.e2 * 1000, 1)} mm`}
                tip={<>Second-order eccentricity: e<sub>2</sub> = (1/r)·l<sub>0</sub>²/c, c = π²/10 for sinusoidal curvature (EN 1992-1-1 §5.8.8.2).</>} />
            </>}
          </Box>
        )}

        {anyEffect && (() => {
          const hasE0 = res.M_e0 > 0, hasEa = res.M_ea > 0, hasM1 = res.M1 > 0, hasM2 = res.M2 > 0
          return (
            <Box title="TOTAL MOMENT" accent={AMBER}>
              <Row labelNode={<>M<sub>Ed</sub> <span style={{ color: '#94a3b8', fontWeight: 400 }}>(user)</span></>} value={`${n2(inp.MEd, 1)} kNm`} />
              {hasE0 && <Row labelNode={<>M<sub>e₀</sub> <span style={{ color: '#94a3b8', fontWeight: 400 }}>(e<sub>0</sub>·|N<sub>Ed</sub>|)</span></>} value={`${n2(res.M_e0, 1)} kNm`} />}
              {hasEa && <Row labelNode={<>M<sub>ea</sub> <span style={{ color: '#94a3b8', fontWeight: 400 }}>(e<sub>a</sub>·|N<sub>Ed</sub>|)</span></>} value={`${n2(res.M_ea, 1)} kNm`} />}
              {hasM1 && <Row labelNode={<>M<sub>1</sub> <span style={{ color: '#94a3b8', fontWeight: 400 }}>({hasE0 && hasEa ? <>M<sub>e₀</sub> + M<sub>ea</sub></> : hasE0 ? <>e<sub>0</sub>·|N|</> : <>e<sub>a</sub>·|N|</>})</span></>} value={`${n2(res.M1, 1)} kNm`} />}
              {hasM2 && <Row labelNode={<>M<sub>2</sub> <span style={{ color: '#94a3b8', fontWeight: 400 }}>(e<sub>2</sub>·|N<sub>Ed</sub>|)</span></>} value={`${n2(res.M2, 1)} kNm`} />}
              <div style={{ borderTop: '1px solid #f1f5f9', margin: '2px 0' }} />
              <Row
                labelNode={<>M<sub>Ed,tot</sub> = M<sub>Ed</sub>{hasM1 ? <> + M<sub>1</sub></> : null}{hasM2 ? <> + M<sub>2</sub></> : null}</>}
                value={`${n2(res.MEd_tot, 1)} kNm`}
                ok={res.MRd_plus >= res.MEd_tot} warn={res.MRd_plus < res.MEd_tot}
              />
            </Box>
          )
        })()}
      </div>

      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', fontSize: 11, color: '#64748b', lineHeight: 1.7 }}>
        <strong style={{ color: '#374151' }}>Notes: </strong>
        +ve moment → tension at bottom. EN 1992-1-1 §6.1(4): |M<sub>Ed</sub>| ≥ e<sub>0</sub>·|N<sub>Ed</sub>|, e<sub>0</sub> = max(h/30, 20 mm).
        {' '}200 concrete strips · bilinear steel · no hardening · EN 1992-1-1 §6.1.
      </div>
    </div>
  )
}
