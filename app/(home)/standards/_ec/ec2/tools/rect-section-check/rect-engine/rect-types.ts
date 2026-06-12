// Shared types for the rectangular RC section calculator

export interface RebarRow {
  n: number    // bars per row
  phi: number  // diameter [mm]
  s?: number[]  // per-gap c-c overrides [mm]: s[j] = c-c from bar j to j+1; omit entry = auto for that gap
  sv?: number  // vertical c-c spacing to next inner row [mm]; omit = tight (bar radii + 25mm gap)
}

export interface ReinfLayer {
  z: number    // depth from top [m]
  As: number   // area [m²]
  label: string
}

export interface Ec2RectInput {
  h: number
  b: number
  concreteName: string
  fck: number
  fyk: number
  acc: number
  gc: number
  gs: number
  MEd: number           // kNm
  NEd: number           // kN  (compression = negative)
  VEd?: number          // kN  (design shear force)
  TEd?: number          // kNm (design torsional moment)

  // Shear reinforcement (EC2 §6.2.3)
  stirrup_phi?: number  // mm  stirrup bar diameter (default 10)
  stirrup_s?: number    // mm  stirrup spacing (default 200)
  stirrup_legs?: number // number of shear legs (default 2)
  theta_deg?: number    // °   strut inclination override (21.8–45°)
  theta_override?: boolean // if true, use theta_deg instead of auto-computed θ
  tie_phi?: number      // mm  horizontal cross-tie diameter (0 = disabled)
  tie_n?: number        // number of horizontal cross-ties
  rows1: RebarRow[]; c1: number   // bottom rows (innermost first)
  rows2: RebarRow[]; c2: number   // top rows (outermost first)
  nbars3: number; phi3: number    // side bars per side
  sideSv?: number[]               // per-gap c-c overrides [mm] between consecutive side bars (top→bottom)
  ecmOverride?: number            // user override for Ecm [MPa], else from EC2 formula

  // First-order effects
  firstOrder?: boolean
  useMinEcc?: boolean
  M1?: number                     // end moment bottom [kNm]
  N1?: number                     // axial at bottom [kN]
  M2?: number                     // end moment top [kNm]
  N2?: number                     // axial at top [kN]
  useImperfection?: boolean       // ea = l0 / 400

  // Second-order effects (nominal curvature method, EC2 §5.8.8)
  secondOrder?: boolean
  l0?: number                     // effective length [m]
  phi_inf?: number                // φ(∞,t₀) — long-term creep base coefficient (default 1.5)
  phi_ef?: number                 // φ_ef override
  M0Eqp?: number                  // quasi-permanent SLS moment [kNm]
  M0EdRef?: '1' | '2'
}

export interface Ec2RectResult {
  ok: boolean
  fcd: number; fyd: number; eyd: number; ecu2: number; ec2v: number; n: number
  Ecm: number; EcmCode: number
  A: number; I: number; zcm: number
  As1: number; As2: number; As3: number; Astot: number; rho: number
  NRd_c: number; NRd_t: number
  MRd_plus: number; MRd_minus: number; MRd: number; MRd0: number; MRd_peak: number
  x: number; xd: number; kappa: number; e0: number
  eps_c_top: number; eps_c_bot: number; eps_s_max: number; eps_s_min: number
  sigma_c_max: number; sigma_s_max: number; sigma_s_min: number
  FC: number; FT: number; MC: number; MT: number
  EI_eff: number; EI_gross: number
  nmCurve: { N: number; M: number }[]
  converged: boolean
  layers: ReinfLayer[]
  d: number
  // Eccentricity results
  e0_min: number
  e0_e1: number
  e0_e2: number
  e0_used: number
  ea: number
  // Second-order (nominal curvature, EC2 §5.8.8)
  lambda: number
  lambda_lim: number
  slender: boolean
  K1: number; K2: number
  nu: number
  phi_inf_used: number
  phi_ef_calc: number
  phi_ef_used: number
  Kr: number; Kphi: number
  r_inv: number
  e2: number
  etot: number
  M_e0: number
  M_ea: number
  M1: number
  M2: number
  MEd_tot: number

  // Shear (EC2 §6.2)
  VRd_c: number
  VRd_s: number
  VRd_max: number
  VRd: number
  shear_ok: boolean
  Asw_req: number       // mm²/m required from VEd at theta_deg
  Asw_prov: number      // mm²/m provided
  Asw_min: number       // mm²/m min §9.2.2
  Asw_min_ok: boolean
  Asw_prov_ok: boolean  // Asw_prov >= Asw_req
  theta_deg: number     // used angle (clamped, or override)
  theta_calc: number    // raw calculated angle from cot θ = VEd/(Asw/s·z·fyd), before clamping
  theta_is_override: boolean
  rho_l_shear: number
  sigma_cp: number
  z_shear: number
  CRd_c: number
  k_shear: number

  // Torsion (EC2 §6.3)
  TEd: number
  tef: number
  Ak: number
  uk: number
  TRd_c: number
  TRd_max: number
  At_req_s: number      // mm²/m
  Asl_req: number       // mm²
  torsion_ok: boolean
  torsion_interaction_ok: boolean
  torsion_combined_ok: boolean
}
