// EC2 §6.2 shear + §6.3 torsion for rectangular sections

import { Ec2RectInput, Ec2RectResult } from './rect-types'

export function calcShearTorsion(inp: Ec2RectInput, uls: {
  fcd: number; fyd: number; gc: number; d: number; As1_m2: number; A: number
}): Pick<Ec2RectResult,
  'VRd_c' | 'VRd_s' | 'VRd_max' | 'VRd' | 'shear_ok' |
  'Asw_req' | 'Asw_prov' | 'Asw_min' | 'Asw_min_ok' | 'Asw_prov_ok' |
  'theta_deg' | 'theta_calc' | 'theta_is_override' |
  'rho_l_shear' | 'sigma_cp' | 'z_shear' | 'CRd_c' | 'k_shear' |
  'TEd' | 'tef' | 'Ak' | 'uk' | 'TRd_c' | 'TRd_max' |
  'At_req_s' | 'Asl_req' | 'torsion_ok' | 'torsion_interaction_ok' | 'torsion_combined_ok'
> {
  const { fck, fyk, gs, gc, h, b } = inp
  const { fcd, d, As1_m2, A } = uls

  const VEd_v      = inp.VEd ?? 0
  const stPhi      = inp.stirrup_phi  ?? 10
  const stS        = inp.stirrup_s    ?? 200
  const stLegs     = inp.stirrup_legs ?? 2
  const d_mm       = d * 1000
  const z_shear    = 0.9 * d
  const rho_l_shear = Math.min(As1_m2 / (b * d), 0.02)
  const sigma_cp   = Math.max(-((inp.NEd ?? 0)) / (A * 1e3), 0)
  const k_shear    = Math.min(1 + Math.sqrt(200 / d_mm), 2)
  const CRd_c      = 0.18 / gc

  const VRd_c_raw  = CRd_c * k_shear * Math.pow(100 * rho_l_shear * fck, 1 / 3) * b * d * 1e3
  const VRd_c_min  = (0.035 * Math.pow(k_shear, 1.5) * Math.pow(fck, 0.5) + 0.15 * sigma_cp) * b * d * 1e3
  const VRd_c      = Math.max(VRd_c_raw + 0.15 * sigma_cp * b * d * 1e3, VRd_c_min)

  const nu1        = 0.6 * (1 - fck / 250)

  // Provided stirrup area
  const Asw_bar    = Math.PI * (stPhi / 1000) ** 2 / 4
  const Asw_m2     = stLegs * Asw_bar / (stS / 1000)
  const Asw_mm2    = Asw_m2 * 1e6      // mm²/m

  // Step 1: cot θ from provided stirrups (or user override)
  const theta_is_override = !!(inp.theta_override && inp.theta_deg != null)
  const cot_theta_raw = VEd_v > 0
    ? Asw_m2 * z_shear * (fyk / gs) * 1e3 / VEd_v   // cot θ = Asw/s · z · fyd / VEd
    : 2.5
  const theta_calc_deg = isFinite(cot_theta_raw) && cot_theta_raw > 0
    ? Math.atan(1 / cot_theta_raw) * (180 / Math.PI)
    : 21.8

  // Step 2: clamp cot θ to EC2 limits [1.0, 2.5]  (θ: [21.8°, 45°])
  const cot_theta_clamped = Math.min(2.5, Math.max(1.0, cot_theta_raw))
  const theta_deg = theta_is_override
    ? Math.min(45, Math.max(21.8, inp.theta_deg!))
    : Math.atan(1 / cot_theta_clamped) * (180 / Math.PI)
  const theta     = theta_deg * Math.PI / 180
  const cot_theta = 1 / Math.tan(theta)

  // Step 3: Asw/s req at clamped cot θ — Asw_prov >= Asw_req is the reinforcement check
  const Asw_req_m2  = VEd_v > 0 ? VEd_v / (z_shear * (fyk / gs) * cot_theta * 1e3) : 0
  const Asw_req     = Asw_req_m2 * 1e6  // mm²/m
  const Asw_prov_ok = Asw_mm2 >= Asw_req

  // Step 4: VRd,s and VRd,max at clamped θ
  const VRd_s   = Asw_m2 * z_shear * (fyk / gs) * cot_theta * 1e3
  const VRd_max = nu1 * fcd * b * z_shear * (cot_theta / (1 + cot_theta ** 2)) * 1e3
  const VRd     = Math.min(VRd_s, VRd_max)
  const shear_ok = VEd_v <= Math.max(VRd_c, VRd)

  const rho_w_min  = 0.08 * Math.sqrt(fck) / fyk
  const Asw_min    = rho_w_min * b * 1e6
  const Asw_min_ok = Asw_mm2 >= Asw_min

  // ── Torsion (EC2 §6.3) ──────────────────────────────────────────────────────
  const TEd_v    = inp.TEd ?? 0
  const c_nom    = Math.min(inp.c1, inp.c2)
  const Ag       = b * h
  const ug       = 2 * (b + h)
  const tef      = Math.max(Ag / ug, 2 * c_nom)
  const Ak       = (b - tef) * (h - tef)
  const uk       = 2 * ((b - tef) + (h - tef))
  const fctm     = fck <= 50 ? 0.30 * Math.pow(fck, 2 / 3) : 2.12 * Math.log(1 + (fck + 8) / 10)
  const fctd     = fctm / 1.5
  const TRd_c    = fctd * 1e3 * 2 * Ak * tef
  const TRd_max  = nu1 * fcd * 1e3 * 2 * Ak * tef * Math.sin(theta) * Math.cos(theta)
  const fyd_tors = fyk / gs
  const At_req_s = TEd_v > 0 ? (TEd_v / (2 * Ak * fyd_tors)) * 1000 : 0
  const Asl_req  = TEd_v > 0 ? (At_req_s / 1000) * (uk * 1000) * cot_theta : 0
  const torsion_ok = TEd_v <= TRd_c
  const torsion_interaction_ok = TEd_v <= 0 || (TEd_v / TRd_max + VEd_v / VRd_max) <= 1.0
  const torsion_combined_ok    = torsion_ok || torsion_interaction_ok

  return {
    VRd_c, VRd_s, VRd_max, VRd, shear_ok,
    Asw_req, Asw_prov: Asw_mm2, Asw_min, Asw_min_ok, Asw_prov_ok,
    theta_deg, theta_calc: theta_calc_deg, theta_is_override,
    rho_l_shear, sigma_cp, z_shear, CRd_c, k_shear,
    TEd: TEd_v, tef, Ak, uk, TRd_c, TRd_max,
    At_req_s, Asl_req,
    torsion_ok, torsion_interaction_ok, torsion_combined_ok,
  }
}
