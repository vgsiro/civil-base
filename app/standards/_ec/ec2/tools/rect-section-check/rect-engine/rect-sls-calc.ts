// EC2 SLS crack check — EN 1992-1-1 §7.2, §7.3
// Cracked section analysis, crack width wk (§7.3.4), min reinforcement (§7.3.2),
// bar spacing/diameter table (Table 7.3N), concrete stress limit (§7.2).

import { Ec2RectInput, ReinfLayer } from './rect-types'

export type { Ec2RectInput } from './rect-types'

export interface Ec2SlsInput {
  Msk: number    // kNm
  Nsk: number    // kN (compression = negative)
  wk_lim: number // mm
  kc: number
}

export interface Ec2SlsResult {
  x_cr: number
  converged: boolean
  alphaE: number
  kappa: number
  eps_c_top: number
  eps_s1: number
  eps_s2: number
  eps_c_bot: number
  Icr: number
  z1: number
  z2: number
  sigma_c: number
  sigma_c_lim: number
  sigma_c_ok: boolean
  sigma_s1: number
  sigma_s2: number
  fct_eff: number
  k: number
  Act: number
  As_min: number
  As_prov: number
  As_min_ok: boolean
  c_nom: number
  k1: number; k2: number; kt: number
  Ac_eff: number
  rho_p_eff: number
  phi_eff: number
  sr_max_calc: number
  sr_max_ub: number
  sr_max: number
  eps_sm: number
  eps_cm: number
  eps_sm_cm: number
  factor: number
  wk: number
  wk_ok: boolean
  phi_max: number
  s_max: number
  phi_prov: number
  s_prov: number
  phi_ok: boolean
  s_ok: boolean
}

const Es = 200000 // MPa

function fctm(fck: number): number {
  if (fck <= 50) return 0.30 * Math.pow(fck, 2 / 3)
  return 2.12 * Math.log(1 + (fck + 8) / 10)
}

function kFactor(h: number): number {
  if (h <= 0.3) return 1.0
  if (h >= 0.8) return 0.65
  return 1.0 - (h - 0.3) / (0.8 - 0.3) * 0.35
}

const TABLE_7_3N_PHI: [number, number, number, number][] = [
  [160, 25, 32, 40],
  [200, 16, 25, 32],
  [240, 12, 16, 20],
  [280,  8, 12, 16],
  [320,  6,  8, 12],
  [360,  5,  6,  8],
]

const TABLE_7_3N_S: [number, number, number, number][] = [
  [160, 300, 300, 300],
  [200, 250, 300, 300],
  [240, 200, 250, 300],
  [280, 150, 200, 250],
  [320, 100, 150, 200],
  [360,  50, 100, 150],
]

function wkCol(wk_lim: number): number {
  if (wk_lim <= 0.2) return 1
  if (wk_lim <= 0.3) return 2
  return 3
}

function tableInterp(table: [number, number, number, number][], sigma: number, col: number): number {
  const s = Math.abs(sigma)
  if (s <= table[0][0]) return table[0][col]
  if (s >= table[table.length - 1][0]) return table[table.length - 1][col]
  for (let i = 0; i < table.length - 1; i++) {
    const s0 = table[i][0], s1 = table[i + 1][0]
    if (s >= s0 && s <= s1) {
      const t = (s - s0) / (s1 - s0)
      return table[i][col] + t * (table[i + 1][col] - table[i][col])
    }
  }
  return table[table.length - 1][col]
}

function buildLayers(inp: Ec2RectInput): ReinfLayer[] {
  const { h, rows1, c1, rows2, c2, nbars3, phi3 } = inp
  const a3 = Math.PI * (phi3 / 1000) ** 2 / 4
  const layers: ReinfLayer[] = []

  let zB = h - c1
  for (let r = 0; r < rows1.length; r++) {
    const { n, phi } = rows1[r]
    const a = Math.PI * (phi / 1000) ** 2 / 4
    if (r > 0) zB -= (rows1[r - 1].phi / 2 + phi / 2 + 25) / 1000
    if (n > 0) layers.push({ z: zB, As: n * a, label: `Bot row ${r + 1}` })
  }

  let zT = c2
  for (let r = 0; r < rows2.length; r++) {
    const { n, phi } = rows2[r]
    const a = Math.PI * (phi / 1000) ** 2 / 4
    if (r > 0) zT += (rows2[r - 1].phi / 2 + phi / 2 + 25) / 1000
    if (n > 0) layers.push({ z: zT, As: n * a, label: `Top row ${r + 1}` })
  }

  for (let i = 0; i < nbars3; i++) {
    const zs = c2 + (h - c1 - c2) * (i + 1) / (nbars3 + 1)
    layers.push({ z: zs, As: 2 * a3, label: `Side ${i + 1}` })
  }
  return layers
}

function crackedNA(inp: Ec2RectInput, sls: Ec2SlsInput, Ecm: number, layers: ReinfLayer[]): number {
  const { b, h } = inp
  const { Msk, Nsk } = sls
  const ae = Es / Ecm

  if (Math.abs(Nsk) < 1e-6) {
    let sumAs = 0, sumAsDi = 0
    for (const L of layers) { sumAs += L.As; sumAsDi += L.As * L.z }
    const A = b / 2, B = ae * sumAs, C = -ae * sumAsDi
    const disc = B * B - 4 * A * C
    const x = disc >= 0 ? (-B + Math.sqrt(disc)) / (2 * A) : h / 2
    return Math.max(1e-4, Math.min(h - 1e-4, x))
  }

  const N_si = Nsk * 1e3
  const M_si = Msk * 1e3

  function residual(x: number): number {
    let Px = b * x * x / 2
    let Qx = b * x * x / 2 * (h / 2 - x / 3)
    for (const L of layers) {
      const v = ae * L.As * (x - L.z)
      Px += v
      Qx += v * (h / 2 - L.z)
    }
    return Qx * (-N_si) - Px * M_si
  }

  let lo = 1e-4, hi = h - 1e-4
  let rLo = residual(lo), rHi = residual(hi)

  if (rLo * rHi > 0) {
    for (let i = 1; i <= 500; i++) {
      const xa = 1e-4 + (h - 2e-4) * i / 500
      const xb = 1e-4 + (h - 2e-4) * (i + 1) / 500
      const ra = residual(xa), rb = residual(xb)
      if (ra * rb <= 0) { lo = xa; hi = xb; rLo = ra; rHi = rb; break }
    }
  }

  if (rLo * rHi > 0) return h - 1e-4

  const sign = rLo > 0 ? 1 : -1
  let x_sol = (lo + hi) / 2
  for (let iter = 0; iter < 80; iter++) {
    const xm = (lo + hi) / 2
    if (hi - lo < 1e-8) { x_sol = xm; break }
    const rm = residual(xm)
    if (Math.abs(rm) < 1e-10) { x_sol = xm; break }
    if (sign * rm > 0) lo = xm; else hi = xm
    x_sol = xm
  }

  return Math.max(1e-4, Math.min(h - 1e-4, x_sol))
}

export function calcEc2Sls(inp: Ec2RectInput, sls: Ec2SlsInput, Ecm: number): Ec2SlsResult {
  const { b, h, fck, rows1, c1, rows2, c2, nbars3, phi3 } = inp
  const { Msk, Nsk, wk_lim, kc } = sls
  const alpha = Es / Ecm

  const layers = buildLayers(inp)
  const x_cr = crackedNA(inp, sls, Ecm, layers)

  const _E6 = 1e6
  const EA_c = Ecm * _E6 * b * x_cr
  const ES_c = Ecm * _E6 * b * x_cr ** 2 / 2
  const EI_c = Ecm * _E6 * b * x_cr ** 3 / 3
  let EA_s = 0, ES_s = 0, EI_s = 0
  for (const L of layers) {
    EA_s += Es * _E6 * L.As
    ES_s += Es * _E6 * L.As * L.z
    EI_s += Es * _E6 * L.As * L.z ** 2
  }
  const EA = EA_c + EA_s
  const ES = ES_c + ES_s
  const EI = EI_c + EI_s
  const det = EA * EI - ES * ES
  const N_si  = Nsk * 1e3
  const M_si  = (Msk + Nsk * (h / 2)) * 1e3

  const eps0  = (EI * N_si - ES * M_si) / det
  const kappa = (EA * M_si - ES * N_si) / det

  const strainAt = (z: number) => eps0 + kappa * z

  const botLayer = layers.find(L => L.label.startsWith('Bot'))
  const topLayer = layers.find(L => L.label.startsWith('Top'))
  const z1 = botLayer?.z ?? (h - c1)
  const z2 = topLayer?.z ?? c2

  const eps_c_top = strainAt(0)
  const sigma_c   = -eps_c_top * Ecm
  const sigma_c_lim = 0.6 * fck
  const sigma_c_ok  = sigma_c <= sigma_c_lim

  const sigma_s1 = strainAt(z1) * Es
  const sigma_s2 = strainAt(z2) * Es

  const fct_eff = fctm(fck)
  const k = kFactor(h)
  const Act = (h - x_cr) * b
  const sigma_s_lim = inp.fyk
  const As_min    = (kc * k * fct_eff * Act) / sigma_s_lim
  const As_prov   = rows1.reduce((s, r) => s + r.n * Math.PI * (r.phi / 1000) ** 2 / 4, 0)
  const As_min_ok = As_prov >= As_min

  const hc_eff_bot  = Math.min(2.5 * (h - z1), (h - x_cr) / 3, h / 2)
  const Ac_eff_bot  = hc_eff_bot * b
  const As_eff_bot  = rows1.reduce((s, r) => s + r.n * Math.PI * (r.phi / 1000) ** 2 / 4, 0)

  let sumPhi2 = 0, sumPhi = 0
  for (const r of rows1) {
    sumPhi2 += r.n * r.phi ** 2
    sumPhi  += r.n * r.phi
  }
  if (nbars3 > 0) {
    for (let i = 0; i < nbars3; i++) {
      const zs = c2 + (h - c1 - c2) * (i + 1) / (nbars3 + 1)
      const depthFromBot = h - zs
      if (depthFromBot <= hc_eff_bot) {
        sumPhi2 += 2 * phi3 ** 2
        sumPhi  += 2 * phi3
      }
    }
  }
  const phi_eff = sumPhi > 0 ? sumPhi2 / sumPhi : (rows1[0]?.phi ?? 20)
  const phi1    = rows1[0]?.phi ?? 20

  const Ac_eff     = Ac_eff_bot
  const rho_p_eff  = As_eff_bot / Ac_eff

  const c_surf = c1 * 1000 - phi1 / 2
  const c_nom  = c_surf
  const k1 = 0.8
  const k2 = (Msk !== 0) ? 0.5 : 1.0
  const k3 = 3.4
  const k4 = 0.425
  const kt = 0.4

  const sr_max_calc = k3 * c_surf + k1 * k2 * k4 * phi_eff / rho_p_eff
  const sr_max_ub   = 1.3 * (h - x_cr) * 1000
  const sr_max      = Math.min(sr_max_calc, sr_max_ub)

  const absSigS1 = Math.abs(sigma_s1)
  const factor   = absSigS1 > 0
    ? Math.max(0.6, 1 - kt * fct_eff / absSigS1 * (1 / rho_p_eff + alpha))
    : 0.6
  const eps_sm_cm = factor * absSigS1 / Es

  const wk     = sr_max * eps_sm_cm
  const wk_ok  = wk <= wk_lim

  const col     = wkCol(wk_lim)
  const phi_max = tableInterp(TABLE_7_3N_PHI, sigma_s1, col)
  const s_max   = tableInterp(TABLE_7_3N_S,   sigma_s1, col)

  const n1    = rows1[0]?.n ?? 1
  const s_prov = n1 > 1
    ? ((b - 2 * c1) * 1000 - phi1) / (n1 - 1)
    : 999

  const phi_ok = phi1 <= phi_max
  const s_ok   = s_prov <= s_max

  const converged = Math.abs(x_cr) > 0
  const alphaE    = alpha
  const Icr       = b * x_cr ** 3 / 3 + layers.reduce((s, L) => s + alpha * L.As * (L.z - x_cr) ** 2, 0)

  const eps_sm_raw = strainAt(z1)
  const eps_cm_raw = eps_sm_raw - eps_sm_cm

  return {
    x_cr, converged,
    alphaE, kappa, eps_c_top: eps_c_top * 1000, eps_s1: strainAt(z1) * 1000, eps_s2: strainAt(z2) * 1000, eps_c_bot: strainAt(h) * 1000,
    Icr, z1, z2,
    sigma_c, sigma_c_lim, sigma_c_ok,
    sigma_s1, sigma_s2,
    fct_eff, k, Act, As_min, As_prov, As_min_ok,
    c_nom, k1, k2, kt, Ac_eff, rho_p_eff,
    phi_eff, sr_max_calc, sr_max_ub, sr_max,
    eps_sm: eps_sm_raw * 1000, eps_cm: eps_cm_raw * 1000,
    eps_sm_cm: eps_sm_cm * 1000, factor, wk, wk_ok,
    phi_max, s_max, phi_prov: phi1, s_prov, phi_ok, s_ok,
  }
}
