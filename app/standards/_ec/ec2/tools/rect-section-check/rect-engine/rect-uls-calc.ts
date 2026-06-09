// EC2 rectangular RC section — ULS bending + axial (EN 1992-1-1 §6.1)
// Parabolic-rectangular concrete, bilinear steel (no hardening).
//
// Sign convention: N compression = NEGATIVE kN, M positive = tension at bottom, eps compression = NEGATIVE ‰

import { Ec2RectInput, Ec2RectResult, ReinfLayer } from './rect-types'

export type { Ec2RectInput, Ec2RectResult, ReinfLayer } from './rect-types'

const Es = 200000  // MPa

export function tableValues(fck: number): { ec2v: number; ecu2: number; n: number } {
  if (fck <= 50) return { ec2v: 2.0, ecu2: 3.5, n: 2.0 }
  if (fck <= 55) return { ec2v: 2.2, ecu2: 3.1, n: 1.75 }
  if (fck <= 60) return { ec2v: 2.3, ecu2: 2.9, n: 1.6 }
  if (fck <= 70) return { ec2v: 2.4, ecu2: 2.7, n: 1.45 }
  if (fck <= 80) return { ec2v: 2.5, ecu2: 2.6, n: 1.4 }
  return { ec2v: 2.6, ecu2: 2.6, n: 1.4 }
}

export function ecm(fck: number): number {
  return 22000 * Math.pow((fck + 8) / 10, 0.3)
}

function sigmaC(eps: number, fcd: number, ec2v: number, n: number): number {
  const e = -eps
  if (e <= 0) return 0
  if (e <= ec2v) return fcd * (1 - Math.pow(1 - e / ec2v, n))
  return fcd
}

function sigmaS(eps: number, fyd: number, eyd: number): number {
  const e = Math.max(-67.5, Math.min(67.5, eps))
  if (e >= eyd)  return  fyd
  if (e <= -eyd) return -fyd
  return Es * 1e-3 * e
}

export function buildLayers(inp: Ec2RectInput): ReinfLayer[] {
  const { h, rows1, c1, rows2, c2, nbars3, phi3 } = inp
  const a3 = Math.PI * (phi3 / 1000) ** 2 / 4
  const z_bot = h - c1
  const z_top = c2
  const layers: ReinfLayer[] = []
  let zB = z_bot
  for (let r = 0; r < rows1.length; r++) {
    const { n, phi } = rows1[r]
    const a = Math.PI * (phi / 1000) ** 2 / 4
    if (r > 0) zB -= (rows1[r - 1].phi / 2 + phi / 2 + 25) / 1000
    if (n > 0) layers.push({ z: zB, As: n * a, label: `Bottom row ${r + 1}` })
  }
  let zT = z_top
  for (let r = 0; r < rows2.length; r++) {
    const { n, phi } = rows2[r]
    const a = Math.PI * (phi / 1000) ** 2 / 4
    if (r > 0) zT += (rows2[r - 1].phi / 2 + phi / 2 + 25) / 1000
    if (n > 0) layers.push({ z: zT, As: n * a, label: `Top row ${r + 1}` })
  }
  for (let i = 0; i < nbars3; i++) {
    const zs = z_top + (z_bot - z_top) * (i + 1) / (nbars3 + 1)
    layers.push({ z: zs, As: 2 * a3, label: `Side (L3-${i + 1})` })
  }
  return layers
}

interface InternalRes {
  N: number; M: number
  FC: number; FT: number; MC: number; MT: number
}

function integrate(
  b: number, h: number, layers: ReinfLayer[],
  eps_top: number, eps_bot: number,
  fcd: number, fyd: number, eyd: number,
  ec2v: number, n: number,
): InternalRes {
  const STRIPS = 200
  const dh = h / STRIPS
  const zcm = h / 2
  let N = 0, M = 0, FC = 0, MC_ = 0, FT = 0, MT_ = 0

  for (let i = 0; i < STRIPS; i++) {
    const z = (i + 0.5) * dh
    const eps = eps_top + (eps_bot - eps_top) * z / h
    const sc = sigmaC(eps, fcd, ec2v, n)
    const Fc = -sc * b * dh * 1e3
    N += Fc; M += Fc * (z - zcm)
    FC += Fc; MC_ += Fc * (z - zcm)
  }

  for (const lay of layers) {
    const eps = eps_top + (eps_bot - eps_top) * lay.z / h
    const ss = sigmaS(eps, fyd, eyd)
    const Fs = ss * lay.As * 1e3
    N += Fs; M += Fs * (lay.z - zcm)
    if (Fs >= 0) { FT += Fs; MT_ += Fs * (lay.z - zcm) }
    else         { FC += Fs; MC_ += Fs * (lay.z - zcm) }
  }

  return { N, M, FC, FT, MC: MC_, MT: MT_ }
}

function buildNMCurve(
  b: number, h: number, layers: ReinfLayer[],
  fcd: number, fyd: number, eyd: number,
  ec2v: number, ecu2: number, n: number,
): { N: number; M: number }[] {
  const eud = 67.5
  const ev = (et: number, eb: number) => {
    const r = integrate(b, h, layers, et, eb, fcd, fyd, eyd, ec2v, n)
    return { N: r.N, M: r.M }
  }

  function findPureBending(): { N: number; M: number } {
    let lo = -ecu2, hi = eud
    for (let i = 0; i < 60; i++) {
      const mid = (lo + hi) / 2
      const r = ev(-ecu2, mid)
      if (Math.abs(r.N) < 0.001) return r
      if (r.N < 0) lo = mid; else hi = mid
    }
    return ev(-ecu2, (lo + hi) / 2)
  }
  const pureBending = findPureBending()

  const pts: { N: number; M: number }[] = []

  function cosSpace(n: number): number[] {
    return Array.from({ length: n + 1 }, (_, i) => (1 - Math.cos(Math.PI * i / n)) / 2)
  }

  const STEPS_AD = 200
  const tAD = cosSpace(STEPS_AD)
  let pureBendingInserted = false
  for (let i = 0; i <= STEPS_AD; i++) {
    const eb = -ecu2 + (eud + ecu2) * tAD[i]
    const p = ev(-ecu2, eb)
    if (i === 0) { pts.push({ N: p.N, M: 0 }); continue }
    if (!pureBendingInserted && p.N > 0) {
      pts.push({ N: 0, M: pureBending.M })
      pureBendingInserted = true
    }
    pts.push(p)
  }

  const STEPS_DE = 40
  const tDE = cosSpace(STEPS_DE)
  for (let i = 1; i <= STEPS_DE; i++) {
    const et = -ecu2 + (eud + ecu2) * tDE[i]
    const p = ev(et, eud)
    pts.push(i === STEPS_DE ? { N: p.N, M: 0 } : p)
  }

  for (let i = 1; i <= STEPS_DE; i++) {
    const eb = eud - (eud + ecu2) * tDE[i]
    pts.push(ev(eud, eb))
  }
  for (let i = 1; i <= STEPS_AD; i++) {
    const et = eud - (eud + ecu2) * tAD[i]
    pts.push(ev(et, -ecu2))
  }

  return pts
}

function findStrainForN(
  target_N: number,
  b: number, h: number, layers: ReinfLayer[],
  fcd: number, fyd: number, eyd: number,
  ec2v: number, ecu2: number, n: number,
): InternalRes & { eps_top: number; eps_bot: number; converged: boolean } {
  const eud = 67.5
  const ev = (et: number, eb: number) => integrate(b, h, layers, et, eb, fcd, fyd, eyd, ec2v, n)

  const N_comp = ev(-ecu2, -ecu2).N
  const N_mid  = ev(-ecu2,  eud).N

  if (target_N >= N_comp && target_N <= N_mid) {
    let lo = -ecu2, hi = eud
    for (let i = 0; i < 80; i++) {
      const mid = (lo + hi) / 2
      const r = ev(-ecu2, mid)
      if (Math.abs(r.N - target_N) < 0.01)
        return { ...r, eps_top: -ecu2, eps_bot: mid, converged: true }
      if (r.N < target_N) lo = mid; else hi = mid
    }
    const mid = (lo + hi) / 2
    return { ...ev(-ecu2, mid), eps_top: -ecu2, eps_bot: mid, converged: true }
  }

  const N_tens = ev(eud, eud).N
  if (target_N >= N_mid && target_N <= N_tens) {
    let lo = -ecu2, hi = eud
    for (let i = 0; i < 80; i++) {
      const mid = (lo + hi) / 2
      const r = ev(mid, eud)
      if (Math.abs(r.N - target_N) < 0.01)
        return { ...r, eps_top: mid, eps_bot: eud, converged: true }
      if (r.N < target_N) lo = mid; else hi = mid
    }
    const mid = (lo + hi) / 2
    return { ...ev(mid, eud), eps_top: mid, eps_bot: eud, converged: true }
  }

  if (target_N < N_comp) {
    const r = ev(-ecu2, -ecu2)
    return { ...r, eps_top: -ecu2, eps_bot: -ecu2, converged: false }
  }
  const r = ev(eud, eud)
  return { ...r, eps_top: eud, eps_bot: eud, converged: false }
}

export function calcUls(inp: Ec2RectInput): Pick<Ec2RectResult,
  'ok' | 'fcd' | 'fyd' | 'eyd' | 'ecu2' | 'ec2v' | 'n' | 'Ecm' | 'EcmCode' |
  'A' | 'I' | 'zcm' | 'As1' | 'As2' | 'As3' | 'Astot' | 'rho' |
  'NRd_c' | 'NRd_t' | 'MRd_plus' | 'MRd_minus' | 'MRd' | 'MRd0' | 'MRd_peak' |
  'x' | 'xd' | 'kappa' | 'e0' | 'eps_c_top' | 'eps_c_bot' | 'eps_s_max' | 'eps_s_min' |
  'sigma_c_max' | 'sigma_s_max' | 'sigma_s_min' | 'FC' | 'FT' | 'MC' | 'MT' |
  'EI_eff' | 'EI_gross' | 'nmCurve' | 'converged' | 'layers' | 'd' |
  'e0_min' | 'e0_e1' | 'e0_e2' | 'e0_used' | 'ea' |
  'lambda' | 'lambda_lim' | 'slender' | 'K1' | 'K2' | 'nu' |
  'phi_inf_used' | 'phi_ef_calc' | 'phi_ef_used' | 'Kr' | 'Kphi' | 'r_inv' | 'e2' | 'etot' |
  'M_e0' | 'M_ea' | 'M1' | 'M2' | 'MEd_tot'
> {
  const { fck, fyk, acc, gc, gs, h, b, MEd, NEd } = inp
  const fcd = acc * fck / gc
  const fyd = fyk / gs
  const eyd = fyd / Es * 1e3
  const { ec2v, ecu2, n } = tableValues(fck)
  const A = h * b
  const I = b * h ** 3 / 12
  const zcm = h / 2
  const EcmCode = ecm(fck)
  const Ecm = (inp.ecmOverride != null && isFinite(inp.ecmOverride) && inp.ecmOverride > 0)
    ? inp.ecmOverride : EcmCode
  const EI_gross = Ecm * I * 1e3
  const d = h - inp.c1

  const layers = buildLayers(inp)

  const a3 = Math.PI * (inp.phi3 / 1000) ** 2 / 4
  const As1 = inp.rows1.reduce((s, r) => s + r.n * Math.PI * (r.phi / 1000) ** 2 / 4, 0)
  const As2 = inp.rows2.reduce((s, r) => s + r.n * Math.PI * (r.phi / 1000) ** 2 / 4, 0)
  const As3 = 2 * inp.nbars3 * a3
  const Astot = As1 + As2 + As3
  const rho = Astot / A

  const NRd_c = -(fcd * A * 1e3 + fyd * Astot * 1e3)
  const NRd_t =  fyd * Astot * 1e3

  const res = findStrainForN(NEd, b, h, layers, fcd, fyd, eyd, ec2v, ecu2, n)
  const { eps_top, eps_bot, M: MRd, FC, FT, MC, MT, converged } = res

  const denom = eps_bot - eps_top
  const x = Math.abs(denom) > 1e-12
    ? Math.max(0, h * (-eps_top) / denom)
    : (eps_top < 0 ? h : 0)
  const xd    = d > 0 ? x / d : 0
  const kappa = denom / h

  const e0_min  = Math.max(h / 30, 0.020)
  const e0_e1 = (inp.M1 != null && inp.N1 != null && Math.abs(inp.N1) > 0.001)
    ? Math.abs(inp.M1) / Math.abs(inp.N1) : 0
  const e0_e2 = (inp.M2 != null && inp.N2 != null && Math.abs(inp.N2) > 0.001)
    ? Math.abs(inp.M2) / Math.abs(inp.N2) : 0
  const e0_used = (inp.firstOrder && inp.useMinEcc)
    ? Math.max(e0_e1, e0_e2, e0_min)
    : e0_min

  const l0_m = (inp.l0 != null && inp.l0 > 0) ? inp.l0 : 10
  const ea = inp.useImperfection ? l0_m / 400 : 0

  const i_rad = Math.sqrt(I / A)
  const lambda = l0_m / i_rad

  const M0Ed_ref = inp.M0EdRef === '2' ? (inp.M2 ?? MEd) : (inp.M1 ?? MEd)
  const phi_inf_used = inp.phi_inf ?? 1.5
  const M0Eqp_val = inp.M0Eqp ?? Math.round(Math.abs(MEd) * 0.6)
  const phi_ef_calc = Math.abs(M0Ed_ref) > 0.001
    ? phi_inf_used * Math.abs(M0Eqp_val) / Math.abs(M0Ed_ref)
    : 0
  const phi_ef_used = (inp.phi_ef != null && inp.phi_ef >= 0) ? inp.phi_ef : phi_ef_calc

  const nu    = Math.abs(NEd) / (A * fcd * 1e3)
  const A_fac = 1 / (1 + 0.2 * phi_ef_used)
  const rho_s = Astot / A
  const B_fac = Math.max(1.1, Math.sqrt(1 + 2 * rho_s))
  const M01 = inp.M1 ?? MEd, M02 = inp.M2 ?? MEd
  const C_fac = Math.max(0.7, 1.7 - (Math.abs(M01) > 0.001 && Math.abs(M02) > 0.001
    ? Math.min(Math.abs(M01), Math.abs(M02)) / Math.max(Math.abs(M01), Math.abs(M02))
    : 1.0))
  const lambda_lim = (20 * A_fac * B_fac * C_fac) / Math.sqrt(Math.max(nu, 0.01))
  const slender = lambda > lambda_lim

  let e2 = 0
  let Kr = 1, Kphi = 1, r_inv = 0, K1 = 1, K2 = 1
  if (inp.secondOrder) {
    K1 = Math.max(1.0, 1 + (0.35 + fck / 200 - lambda / 150) * phi_ef_used)
    const Nud  = Math.abs(NRd_c)
    const Nbal = 0.29 * fck * A * 1e3
    K2 = Math.min(1, Math.max(0, (Nud - Math.abs(NEd)) / (Nud - Nbal)))
    Kr = K2
    Kphi = Math.max(1, 1 + K1 * phi_ef_used)
    if (slender) {
      const r0_inv = eyd / (0.45 * d) * 1e-3
      r_inv = Kr * Kphi * r0_inv
      e2 = r_inv * l0_m * l0_m / 10
    }
  }

  const etot      = e0_used + ea + e2
  const M_e0_val  = (inp.firstOrder && inp.useMinEcc) ? Math.abs(NEd) * e0_used : 0
  const M_ea_val  = Math.abs(NEd) * ea
  const M1_val    = M_e0_val + M_ea_val
  const M2_val    = Math.abs(NEd) * e2
  const MEd_base  = (inp.firstOrder && inp.useMinEcc)
    ? Math.max(Math.abs(MEd), M_e0_val)
    : Math.abs(MEd)
  const MEd_tot   = MEd_base + M_ea_val + M2_val

  const e0 = e0_used

  const eps_s_vals   = layers.map(l => eps_top + (eps_bot - eps_top) * l.z / h)
  const sigma_s_vals = eps_s_vals.map(e => sigmaS(e, fyd, eyd))
  const eps_s_max    = Math.max(...eps_s_vals)
  const eps_s_min    = Math.min(...eps_s_vals)
  const sigma_s_max  = Math.max(...sigma_s_vals)
  const sigma_s_min  = Math.min(...sigma_s_vals)
  const sigma_c_max  = sigmaC(eps_top, fcd, ec2v, n)

  const phi_curv = Math.abs(kappa) > 1e-12 ? kappa * 1e-3 : 1e-12
  const EI_eff   = Math.abs(MRd) / Math.abs(phi_curv)

  const flippedInp: Ec2RectInput = { ...inp, c1: inp.c2, c2: inp.c1, rows1: inp.rows2, rows2: inp.rows1 }
  const flippedLayers = buildLayers(flippedInp).map(l => ({ ...l, z: h - l.z }))
  const resMinus  = findStrainForN(NEd, b, h, flippedLayers, fcd, fyd, eyd, ec2v, ecu2, n)
  const MRd_plus  = MRd
  const MRd_minus = -Math.abs(resMinus.M)

  const nmCurve = buildNMCurve(b, h, layers, fcd, fyd, eyd, ec2v, ecu2, n)
  const MRd_peak = Math.max(...nmCurve.map(p => Math.abs(p.M)))

  let pbLo = -ecu2, pbHi = 67.5
  for (let i = 0; i < 60; i++) {
    const mid = (pbLo + pbHi) / 2
    const rr = integrate(b, h, layers, -ecu2, mid, fcd, fyd, eyd, ec2v, n)
    if (Math.abs(rr.N) < 0.001) { pbLo = pbHi = mid; break }
    if (rr.N < 0) pbLo = mid; else pbHi = mid
  }
  const MRd0 = Math.abs(integrate(b, h, layers, -ecu2, (pbLo + pbHi) / 2, fcd, fyd, eyd, ec2v, n).M)

  return {
    ok: Math.abs(MRd) >= Math.abs(MEd) - 0.01,
    fcd, fyd, eyd, ecu2, ec2v, n, Ecm, EcmCode,
    A, I, zcm,
    As1: As1 * 1e4, As2: As2 * 1e4, As3: As3 * 1e4,
    Astot: Astot * 1e4, rho,
    NRd_c, NRd_t,
    MRd_plus, MRd_minus, MRd, MRd0, MRd_peak,
    x, xd, kappa, e0,
    eps_c_top: eps_top, eps_c_bot: eps_bot,
    eps_s_max, eps_s_min,
    sigma_c_max, sigma_s_max, sigma_s_min,
    FC, FT, MC, MT,
    EI_eff, EI_gross,
    nmCurve,
    converged,
    layers, d,
    e0_min, e0_e1, e0_e2, e0_used, ea,
    lambda, lambda_lim, slender,
    K1, K2, nu, phi_inf_used, phi_ef_calc, phi_ef_used, Kr, Kphi, r_inv, e2, etot,
    M_e0: M_e0_val, M_ea: M_ea_val, M1: M1_val, M2: M2_val, MEd_tot,
  }
}
