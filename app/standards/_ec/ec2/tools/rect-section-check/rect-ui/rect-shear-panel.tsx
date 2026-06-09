'use client'
import { useState } from 'react'
import { Ec2RectInput, Ec2RectResult } from '../rect-engine/rect-calc'
import { Box, Row, GREEN, n2 } from '../../../../_shared/ui-atoms'
import RectShearDetails from './rect-shear-details'
import { ShearSectionDiagram } from './rect-shear-diagram'
import { PassFailBar } from './rect-pass-fail-bar'

const PURPLE = '#8b5cf6'
const CYAN   = '#0891b2'

export function ShearPanel({ inp, res }: { inp: Ec2RectInput; res: Ec2RectResult }) {
  const VEd = inp.VEd ?? 0
  const TEd = inp.TEd ?? 0
  const [shearDetails, setShearDetails] = useState(false)
  const thetaLabel = res.theta_is_override ? `${n2(res.theta_deg, 1)}° (Assumed)` : `${n2(res.theta_deg, 1)}°`

  const At_prov  = res.Asw_prov
  const Asl_prov = res.Astot * 100
  const at_ok    = TEd <= res.TRd_c || At_prov  >= res.At_req_s
  const asl_ok   = TEd <= res.TRd_c || Asl_prov >= res.Asl_req
  const allOk    = res.shear_ok && res.Asw_prov_ok && res.Asw_min_ok && at_ok && asl_ok && res.torsion_interaction_ok

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden', alignSelf: 'flex-start' }}>
          {(['results', 'details'] as const).map(sub => (
            <button key={sub} onClick={() => setShearDetails(sub === 'details')} style={{
              fontSize: 11, fontWeight: 700, padding: '4px 14px', cursor: 'pointer', border: 'none',
              background: (shearDetails ? sub === 'details' : sub === 'results') ? '#f1f5f9' : '#f8fafc',
              color: (shearDetails ? sub === 'details' : sub === 'results') ? '#1e293b' : '#94a3b8',
              borderRight: sub === 'results' ? '1px solid #e2e8f0' : 'none',
              transition: 'all 0.15s',
            }}>
              {sub.charAt(0).toUpperCase() + sub.slice(1)}
            </button>
          ))}
        </div>

        <PassFailBar items={[
          { label: `VEd ${res.shear_ok ? '≤' : '>'} VRd`, ok: res.shear_ok },
          { label: 'Asw/s prov ≥ req', ok: res.Asw_prov_ok },
          { label: 'Asw/s min §9.2.2', ok: res.Asw_min_ok },
          ...(TEd > 0 ? (
            TEd <= res.TRd_c
              ? [{ label: 'TEd ≤ TRd,c (no reinf.)', ok: true }]
              : [
                { label: 'At/s prov ≥ req', ok: at_ok },
                { label: 'Asl prov ≥ req', ok: asl_ok },
                { label: 'V+T interaction §6.3', ok: res.torsion_interaction_ok },
              ]
          ) : []),
        ]} />

        <div style={{
          background: allOk ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${allOk ? '#bbf7d0' : '#fecaca'}`,
          borderRadius: 6, padding: '6px 12px', fontSize: 10,
          color: allOk ? '#166534' : '#991b1b', fontWeight: 600,
        }}>
          {allOk ? '✓ All S&T checks pass.' : '✗ One or more S&T checks fail — see details below.'}
          {' '}θ = <strong>{res.theta_deg.toFixed(1)}°</strong>
          {' '}· z = <strong>{(res.z_shear * 1000).toFixed(0)} mm</strong>
          {' '}· VRd,c = <strong>{res.VRd_c.toFixed(1)} kN</strong>
        </div>
      </div>

      {!shearDetails && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#334155', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Cross-section with stirrups
            </div>
            <ShearSectionDiagram inp={inp} />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
            <div style={{ minWidth: 280, maxWidth: 360, flex: '1 1 280px' }}>
              <Box title="INPUT" accent={CYAN}>
                <Row labelNode={<>V<sub>Ed</sub></>} value={`${n2(VEd)} kN`}
                  tip={<>Design shear force V<sub>Ed</sub> at the section being checked.</>} />
                <Row labelNode={<>T<sub>Ed</sub></>} value={`${n2(TEd)} kNm`}
                  tip={<>Design torsional moment T<sub>Ed</sub>. Set to 0 if torsion is not present.</>} />
                <Row labelNode={<>Stirrup Φ<sub>w</sub></>} value={`${inp.stirrup_phi ?? 10} mm`}
                  tip="Diameter of the shear links (stirrups)." />
                <Row labelNode={<>Spacing s</>} value={`${inp.stirrup_s ?? 200} mm`}
                  tip="Centre-to-centre spacing of stirrups along the member axis." />
                <Row labelNode={<>Legs n<sub>w</sub></>} value={`${inp.stirrup_legs ?? 2}`}
                  tip={<>Number of stirrup legs n<sub>w</sub> crossing the shear crack. Typically 2 for a standard closed link.</>} />
                <Row labelNode={<>θ (strut angle)</>} value={thetaLabel}
                  tip={<>Angle of the concrete compression strut to the horizontal. Computed from provided A<sub>sw</sub>, clamped so cot θ ∈ [1.0, 2.5] (θ ∈ [21.8°, 45°]). Override in the input panel.</>} />
                <Row labelNode={<>z = 0.9d (lever arm)</>} value={`${n2(res.z_shear * 1000, 0)} mm`}
                  tip={<>Inner lever arm: z ≈ 0.9·d, where d is the effective depth to the tension steel centroid (EN 1992-1-1 §6.2.3(1)).</>} />
              </Box>
            </div>

            <div style={{ minWidth: 280, maxWidth: 360, flex: '1 1 280px' }}>
              <Box title="EC2 §6.2 SHEAR RESISTANCE" accent={res.shear_ok ? GREEN : '#dc2626'}>
                <Row labelNode={<>V<sub>Rd,c</sub> (no reinf.)</>} value={`${n2(res.VRd_c)} kN`} ok={VEd <= res.VRd_c}
                  tip={<>Shear resistance without links (EN 1992-1-1 §6.2.2). If V<sub>Ed</sub> ≤ V<sub>Rd,c</sub>, stirrups not needed for shear (min. links may still apply per §9.2.2).</>} />
                <Row labelNode={<>V<sub>Rd,s</sub> (stirrups)</>} value={`${n2(res.VRd_s)} kN`}
                  tip={<>Stirrup shear resistance at angle θ: V<sub>Rd,s</sub> = (A<sub>sw</sub>/s)·z·f<sub>yd</sub>·cot θ.</>} />
                <Row labelNode={<>V<sub>Rd,max</sub> (strut)</>} value={`${n2(res.VRd_max)} kN`}
                  tip={<>Max shear limited by strut crushing (EN 1992-1-1 §6.2.3 Eq. 6.9): V<sub>Rd,max</sub> = α<sub>cw</sub>·b<sub>w</sub>·z·ν<sub>1</sub>·f<sub>cd</sub>·cot θ/(1+cot²θ).</>} />
                <div style={{ borderTop: '1px solid #f1f5f9', margin: '4px 0' }} />
                <Row labelNode={<>A<sub>sw</sub>/s req (θ={res.theta_deg.toFixed(1)}°)</>} value={`${n2(res.Asw_req, 0)} mm²/m`}
                  tip={<>Required link area per metre at θ = {res.theta_deg.toFixed(1)}°: A<sub>sw,req</sub>/s = V<sub>Ed</sub>/(z·f<sub>yd</sub>·cot θ).</>} />
                <Row labelNode={<>A<sub>sw</sub>/s provided</>} value={`${n2(res.Asw_prov, 0)} mm²/m`} ok={res.Asw_prov_ok} warn={!res.Asw_prov_ok}
                  tip={<>Provided link area per metre: A<sub>sw</sub>/s = n<sub>w</sub>·(π·Φ<sub>w</sub>²/4)/s. Must be ≥ A<sub>sw,req</sub>/s.</>} />
                <Row labelNode={<>A<sub>sw</sub>/s min §9.2.2</>} value={`${n2(res.Asw_min, 0)} mm²/m`} ok={res.Asw_min_ok} warn={!res.Asw_min_ok}
                  tip={<>Min shear reinforcement (EN 1992-1-1 §9.2.2): ρ<sub>w,min</sub> = 0.08·√f<sub>ck</sub>/f<sub>yk</sub>. Applies regardless of V<sub>Ed</sub>.</>} />
              </Box>
            </div>

            <div style={{ minWidth: 280, maxWidth: 360, flex: '1 1 280px' }}>
              <Box title="EC2 §6.3 TORSION" accent={res.torsion_combined_ok || TEd <= 0 ? PURPLE : '#dc2626'}>
                <Row labelNode={<>T<sub>Rd,c</sub> (cracking)</>} value={`${n2(res.TRd_c)} kNm`} ok={TEd <= res.TRd_c || TEd <= 0}
                  tip={<>Torsional cracking resistance (EN 1992-1-1 §6.3.2): T<sub>Rd,c</sub> = 2·A<sub>k</sub>·t<sub>ef</sub>·f<sub>ctd</sub>. If T<sub>Ed</sub> ≤ T<sub>Rd,c</sub> no torsional reinforcement needed.</>} />
                <Row labelNode={<>T<sub>Rd,max</sub> (strut)</>} value={`${n2(res.TRd_max)} kNm`}
                  tip={<>Max torsion limited by strut crushing (EN 1992-1-1 §6.3.2 Eq. 6.30): T<sub>Rd,max</sub> = 2·ν·α<sub>cw</sub>·A<sub>k</sub>·t<sub>ef</sub>·f<sub>cd</sub>·sin θ·cos θ.</>} />
                <Row labelNode={<>t<sub>ef</sub> (wall thickness)</>} value={`${n2(res.tef * 1000, 0)} mm`}
                  tip={<>Effective wall thickness: t<sub>ef</sub> = A/u, where A is gross area and u is outer perimeter.</>} />
                <Row labelNode={<>A<sub>k</sub> (enclosed area)</>} value={`${n2(res.Ak * 1e6, 0)} mm²`}
                  tip={<>Area enclosed by the thin-wall centre-line: A<sub>k</sub> = (b−t<sub>ef</sub>)·(h−t<sub>ef</sub>).</>} />
                <Row labelNode={<>u<sub>k</sub> (perimeter)</>} value={`${n2(res.uk * 1000, 0)} mm`}
                  tip={<>Perimeter of A<sub>k</sub>: u<sub>k</sub> = 2·(b−t<sub>ef</sub> + h−t<sub>ef</sub>).</>} />
                {TEd > 0 && <div style={{ borderTop: '1px solid #f1f5f9', margin: '4px 0' }} />}
                {TEd <= 0 ? (
                  <div style={{ fontSize: 10, color: '#64748b', fontStyle: 'italic', padding: '2px 0' }}>
                    Enter T<sub>Ed</sub> &gt; 0 to activate.
                  </div>
                ) : TEd <= res.TRd_c ? (
                  <Row labelNode={<>T<sub>Ed</sub> ≤ T<sub>Rd,c</sub></>} value="No reinf. needed ✓" ok
                    tip={<>T<sub>Ed</sub> does not exceed T<sub>Rd,c</sub> — no torsional reinforcement required (EN 1992-1-1 §6.3.2(5)).</>} />
                ) : (
                  <>
                    <Row labelNode={<>A<sub>t</sub>/s req</>} value={`${n2(res.At_req_s, 0)} mm²/m`}
                      tip={<>Required closed link area per metre for torsion: A<sub>t,req</sub>/s = T<sub>Ed</sub>/(2·A<sub>k</sub>·f<sub>yd</sub>·cot θ).</>} />
                    <Row labelNode={<>A<sub>t</sub>/s prov</>} value={`${n2(At_prov, 0)} mm²/m`} ok={at_ok} warn={!at_ok}
                      tip={<>Torsion link area provided (same links as shear). Must be ≥ A<sub>t,req</sub>/s.</>} />
                    <Row labelNode={<>A<sub>sl</sub> req</>} value={`${n2(res.Asl_req, 0)} mm²`}
                      tip={<>Required longitudinal torsion bars: A<sub>sl,req</sub> = T<sub>Ed</sub>·u<sub>k</sub>·tan θ/(2·A<sub>k</sub>·f<sub>yd</sub>). Distributed around the perimeter.</>} />
                    <Row labelNode={<>A<sub>sl</sub> prov</>} value={`${n2(Asl_prov, 0)} mm²`} ok={asl_ok} warn={!asl_ok}
                      tip={<>Longitudinal bars provided (A<sub>s,tot</sub>). Must be ≥ A<sub>sl,req</sub>.</>} />
                    <div style={{ borderTop: '1px solid #f1f5f9', margin: '4px 0' }} />
                    <Row labelNode={<>T/T<sub>Rd,max</sub> + V/V<sub>Rd,max</sub></>}
                      value={`${n2(TEd / res.TRd_max + VEd / res.VRd_max, 3)} ${res.torsion_interaction_ok ? '≤ 1.0 ✓' : '> 1.0 ✗'}`}
                      ok={res.torsion_interaction_ok} warn={!res.torsion_interaction_ok}
                      tip={<>Shear–torsion strut interaction (EN 1992-1-1 §6.3.2 Eq. 6.29): T<sub>Ed</sub>/T<sub>Rd,max</sub> + V<sub>Ed</sub>/V<sub>Rd,max</sub> ≤ 1.0.</>} />
                  </>
                )}
              </Box>
            </div>
          </div>
        </div>
      )}

      {shearDetails && <RectShearDetails inp={inp} res={res} />}
    </div>
  )
}
