/**
 * EC3 capacity calculations — BS EN 1993-1-1:2005 + SCI P363 Blue Book
 * Formulas follow Blue Book §6–§10 notation exactly.
 * All SectionRow values converted to N/mm units internally.
 * Outputs in kN and kNm.
 */

import type { SectionRow } from '../_shared/types'

// ── Constants ────────────────────────────────────────────────────────────────

export type SteelGrade = 'S275' | 'S355'

const E   = 210_000  // N/mm²
const G   = 81_000   // N/mm²
const gM0 = 1.0
const gM1 = 1.0

// UK NA values — §6.3.2.3(1)
const LAM_LT0 = 0.4   // λ̄_LT,0
const BETA    = 0.75  // β

export const LTB_LENGTHS  = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]   // m
export const C1_VALUES    = [1.00, 1.13, 1.35, 1.50, 1.77, 2.00, 2.50]
export const N_RATIOS     = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
export const BUCK_LENGTHS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]   // m

// ── Material (Table 3.1) ─────────────────────────────────────────────────────

export function fy(grade: SteelGrade): number {
  return grade === 'S275' ? 275 : 355   // N/mm² (t ≤ 16 mm)
}

// ── Unit conversions from SectionRow ─────────────────────────────────────────
// SectionRow: h,b,tw,tf,r in mm · A cm² · I cm⁴ · W,Z cm³ · i cm · J cm⁴ · Cw dm⁶

function toMm2(row: SectionRow)  { return row.A  * 1e2  }   // cm²  → mm²
function toMm4x(row: SectionRow) { return row.Ix * 1e4  }   // cm⁴  → mm⁴  (strong axis Iy in EC3 notation)
function toMm4y(row: SectionRow) { return row.Iy * 1e4  }   // cm⁴  → mm⁴  (weak axis Iz in EC3 notation)
function toMm4j(row: SectionRow) { return row.J  * 1e4  }   // cm⁴  → mm⁴  (torsion constant It)
function toMm6w(row: SectionRow) { return row.Cw * 1e12 }   // dm⁶  → mm⁶  (warping constant Iw)
function toMm3zx(row: SectionRow){ return row.Zx * 1e3  }   // cm³  → mm³  (plastic modulus, major)
function toMm3zy(row: SectionRow){ return row.Zy * 1e3  }   // cm³  → mm³  (plastic modulus, minor)
function toMm3wx(row: SectionRow){ return row.Wx * 1e3  }   // cm³  → mm³  (elastic modulus, major)
function toMm3wy(row: SectionRow){ return row.Wy * 1e3  }   // cm³  → mm³  (elastic modulus, minor)
function toMmiy(row: SectionRow) { return row.ix * 10   }   // cm   → mm   (radius of gyration, major)
function toMmiz(row: SectionRow) { return row.iy * 10   }   // cm   → mm   (radius of gyration, minor)

// suppress unused warning — toMm4x used implicitly in engine reference
void toMm4x

// ── Classification (§5.5.2) ──────────────────────────────────────────────────

export function classifySection(row: SectionRow, grade: SteelGrade): 1 | 2 | 3 | 4 {
  const fyv = fy(grade)
  const eps = Math.sqrt(235 / fyv)

  const { h, b, tw, tf, r } = row
  const d        = h - 2 * tf - 2 * r          // depth of web (between fillets)
  const c_flange = (b - tw - 2 * r) / 2        // outstand of compression flange

  // Web in pure bending — Table 5.2 Sheet 1
  const webRatio = d / tw
  let webClass: 1 | 2 | 3 | 4
  if      (webRatio <= 72  * eps) webClass = 1
  else if (webRatio <= 83  * eps) webClass = 2
  else if (webRatio <= 124 * eps) webClass = 3
  else                             webClass = 4

  // Outstand flange — Table 5.2 Sheet 2
  const flangeRatio = c_flange / tf
  let flangeClass: 1 | 2 | 3 | 4
  if      (flangeRatio <= 9  * eps) flangeClass = 1
  else if (flangeRatio <= 10 * eps) flangeClass = 2
  else if (flangeRatio <= 14 * eps) flangeClass = 3
  else                               flangeClass = 4

  return Math.max(webClass, flangeClass) as 1 | 2 | 3 | 4
}

// Web in uniform compression — Blue Book §6.1, Table 5.2 Sheet 1
// c/tw > 42ε → Class 4 under pure compression
export function classifyWebCompression(row: SectionRow, grade: SteelGrade): boolean {
  const fyv = fy(grade)
  const eps = Math.sqrt(235 / fyv)
  const d   = row.h - 2 * row.tf - 2 * row.r
  return d / row.tw > 42 * eps
}

// ── Cross-section resistances (§6.2) ─────────────────────────────────────────

export interface CrossSectionResult {
  cls:             1 | 2 | 3 | 4
  cls4compression: boolean   // web Class 4 under pure compression
  Npl_Rd:  number   // kN  — N_pl,Rd  = A·fy/γM0  §6.2.4
  Nc_Rd:   number   // kN  — N_c,Rd   (= N_pl,Rd for Class 1-3)
  Vpl_Rd:  number   // kN  — V_pl,Rd  §6.2.6
  Mc_Rd:   number   // kNm — M_c,y,Rd (major axis) §6.2.5
  Mc_z_Rd: number   // kNm — M_c,z,Rd (minor axis) §6.2.5
  Mpl_Rd:  number   // kNm — M_pl,y,Rd (plastic, major)
  Mpl_z_Rd:number   // kNm — M_pl,z,Rd (plastic, minor)
  Mel_Rd:  number   // kNm — M_el,y,Rd (elastic, major)
  Mel_z_Rd:number   // kNm — M_el,z,Rd (elastic, minor)
}

export function crossSectionResistances(row: SectionRow, grade: SteelGrade): CrossSectionResult {
  const fyv = fy(grade)
  const cls = classifySection(row, grade)
  const cls4compression = classifyWebCompression(row, grade)

  const A    = toMm2(row)
  const Zplx = toMm3zx(row)
  const Zply = toMm3zy(row)
  const Welx = toMm3wx(row)
  const Wely = toMm3wy(row)
  const { h, b, tw, tf, r } = row

  // §6.2.6 — shear area for rolled I/H sections (Blue Book §9.1)
  // Av = A − 2btf + (tw + 2r)tf  but ≥ ηhwtw (η=1.0 per UK NA)
  const hw = h - 2 * tf
  const Av = Math.max(A - 2 * b * tf + (tw + 2 * r) * tf, hw * tw)

  const Npl_Rd   = (A * fyv) / (gM0 * 1e3)
  const Nc_Rd    = cls <= 3 ? Npl_Rd : 0

  const Vpl_Rd   = (Av * fyv) / (Math.sqrt(3) * gM0 * 1e3)

  const Mpl_Rd   = (Zplx * fyv) / (gM0 * 1e6)
  const Mpl_z_Rd = (Zply * fyv) / (gM0 * 1e6)
  const Mel_Rd   = (Welx * fyv) / (gM0 * 1e6)
  const Mel_z_Rd = (Wely * fyv) / (gM0 * 1e6)

  const Mc_Rd    = cls <= 2 ? Mpl_Rd   : cls === 3 ? Mel_Rd   : 0
  const Mc_z_Rd  = cls <= 2 ? Mpl_z_Rd : cls === 3 ? Mel_z_Rd : 0

  return { cls, cls4compression, Npl_Rd, Nc_Rd, Vpl_Rd, Mc_Rd, Mc_z_Rd, Mpl_Rd, Mpl_z_Rd, Mel_Rd, Mel_z_Rd }
}

// ── Axial + Bending interaction (§6.2.9, Blue Book §10) ─────────────────────

export interface MNrdRow {
  label:  string
  values: number[]   // kNm per N_RATIOS, -1 = Class 4
}

// Major axis M_N,y,Rd — §6.2.9.1 Eq (6.36) / Blue Book §10.1.1(c)
// Minor axis M_N,z,Rd — §6.2.9.1 Eq (6.37/6.38) / Blue Book §10.1.1(d)
export function mNrdTable(row: SectionRow, grade: SteelGrade): MNrdRow[] {
  const { cls, Npl_Rd, Mpl_Rd, Mpl_z_Rd, Mel_Rd, Mel_z_Rd } = crossSectionResistances(row, grade)
  void Npl_Rd
  const A  = toMm2(row)
  const { b, tf } = row

  // a = (A − 2b·tf)/A ≤ 0.5 — §6.2.9.1(c)
  const a = Math.min((A - 2 * b * tf) / A, 0.5)

  const mNy: number[] = N_RATIOS.map(n => {
    if (cls === 4) return -1
    if (cls <= 2) {
      // Eq (6.36): M_N,y,Rd = M_pl,y,Rd·(1−n)/(1−0.5a) ≤ M_pl,y,Rd
      const denom = 1 - 0.5 * a
      if (n >= denom) return 0
      return Math.min(Mpl_Rd * (1 - n) / denom, Mpl_Rd)
    }
    // Class 3 — linear (conservative): M_N,y,Rd = M_el,y,Rd·(1−n) ≥ 0
    return Math.max(Mel_Rd * (1 - n), 0)
  })

  const mNz: number[] = N_RATIOS.map(n => {
    if (cls === 4) return -1
    if (cls <= 2) {
      // Eq (6.37): n ≤ a → M_N,z,Rd = M_pl,z,Rd
      // Eq (6.38): n > a → M_N,z,Rd = M_pl,z,Rd·[1−((n−a)/(1−a))²] ≤ M_pl,z,Rd
      if (n <= a) return Mpl_z_Rd
      const ratio = (n - a) / (1 - a)
      return Math.max(Mpl_z_Rd * (1 - ratio ** 2), 0)
    }
    // Class 3
    return Math.max(Mel_z_Rd * (1 - n), 0)
  })

  return [
    { label: 'M_N,y,Rd', values: mNy },
    { label: 'M_N,z,Rd', values: mNz },
  ]
}

// ── LTB — M_b,Rd (§6.3.2.2, Blue Book §8.1) ─────────────────────────────────

function ltbAlpha(row: SectionRow): number {
  // Table 6.4 — rolled I sections:
  // h/b > 2 → buckling curve b (α_LT = 0.34)
  // h/b ≤ 2 → buckling curve c (α_LT = 0.49)
  return row.h / row.b > 2 ? 0.34 : 0.49
}

// Elastic critical moment — Timoshenko formula for doubly-symmetric I
// Mcr = C1·(π²EIz/L²)·√(Iw/Iz + L²·G·It/(π²·E·Iz))   [N·mm]
function calcMcr(row: SectionRow, C1: number, Lcr_m: number): number {
  const L  = Lcr_m * 1e3        // m → mm
  const Iz = toMm4y(row)
  const It = toMm4j(row)
  const Iw = toMm6w(row)

  const pi2EIz = Math.PI ** 2 * E * Iz
  const term1  = pi2EIz / (L ** 2)
  const term2  = Math.sqrt(Iw / Iz + (L ** 2 * G * It) / (Math.PI ** 2 * E * Iz))

  return C1 * term1 * term2   // N·mm
}

// Exported so the UI can compute a single-point derivation for chosen C1/L
export function calcMbRdPoint(row: SectionRow, grade: SteelGrade, C1: number, Lcr_m: number): {
  Mcr: number; lamLT: number; phi: number; chiLT: number; chiLTmod: number; MbRd: number; W: number; alpha: number; kc: number; f: number
} {
  const fyv  = fy(grade)
  const { cls } = crossSectionResistances(row, grade)
  const W    = cls <= 2 ? toMm3zx(row) : toMm3wx(row)
  const alpha = ltbAlpha(row)
  const kc   = 1 / Math.sqrt(C1)

  if (cls === 4) return { Mcr: 0, lamLT: 0, phi: 0, chiLT: 0, chiLTmod: 0, MbRd: -1, W, alpha, kc, f: 1 }

  const Mcr   = calcMcr(row, C1, Lcr_m)
  const lamLT = Math.sqrt((W * fyv) / Mcr)

  if (lamLT <= LAM_LT0) {
    const MbRd = (W * fyv) / (gM1 * 1e6)
    return { Mcr, lamLT, phi: 0, chiLT: 1, chiLTmod: 1, MbRd, W, alpha, kc, f: 1 }
  }

  const phi    = 0.5 * (1 + alpha * (lamLT - LAM_LT0) + BETA * lamLT ** 2)
  let chiLT    = Math.min(1 / (phi + Math.sqrt(phi ** 2 - BETA * lamLT ** 2)), 1.0)
  const fFactor = Math.min(1 - 0.5 * (1 - kc) * (1 - 2.0 * (lamLT - 0.8) ** 2), 1.0)
  const f      = Math.max(fFactor, kc)
  const chiLTmod = Math.min(chiLT / f, 1.0, 1 / lamLT ** 2)
  const MbRd   = (chiLTmod * W * fyv) / (gM1 * 1e6)
  return { Mcr, lamLT, phi, chiLT, chiLTmod, MbRd, W, alpha, kc, f }
}

export function mbRdTable(row: SectionRow, grade: SteelGrade): number[][] {
  const fyv   = fy(grade)
  const { cls } = crossSectionResistances(row, grade)
  const W     = cls <= 2 ? toMm3zx(row) : toMm3wx(row)
  const alpha = ltbAlpha(row)

  return C1_VALUES.map(C1 => {
    // UK NA modification factor kc = 1/√C1  →  f = 1 − 0.5(1−kc)[1 − 2(λ̄_LT − 0.8)²]
    const kc = 1 / Math.sqrt(C1)

    return LTB_LENGTHS.map(L => {
      if (cls === 4) return -1

      const Mcr    = calcMcr(row, C1, L)
      const lamLT  = Math.sqrt((W * fyv) / Mcr)

      // No LTB: λ̄_LT ≤ λ̄_LT,0 = 0.4 → χ_LT = 1.0
      if (lamLT <= LAM_LT0) return (W * fyv) / (gM1 * 1e6)

      // §6.3.2.3 — Φ_LT with β (UK NA: β = 0.75)
      const phi = 0.5 * (1 + alpha * (lamLT - LAM_LT0) + BETA * lamLT ** 2)
      let chiLT = Math.min(1 / (phi + Math.sqrt(phi ** 2 - BETA * lamLT ** 2)), 1.0)

      // UK NA modification factor f — §6.3.2.3(2) + Blue Book §8.1
      // χ_LT,mod = χ_LT / f  but ≤ 1/λ̄_LT² and ≤ 1.0
      const fFactor = Math.min(
        1 - 0.5 * (1 - kc) * (1 - 2.0 * (lamLT - 0.8) ** 2),
        1.0
      )
      // f ≥ kc (lower bound)
      const f = Math.max(fFactor, kc)
      chiLT   = Math.min(chiLT / f, 1.0, 1 / lamLT ** 2)

      return (chiLT * W * fyv) / (gM1 * 1e6)   // kNm
    })
  })
}

// ── Compression — N_b,Rd (§6.3.1, Blue Book §6) ──────────────────────────────

// Non-dimensional slenderness — §6.3.1.3 / Blue Book notation
// λ̄ = (Lcr/i) / (93.9·ε)   [= (Lcr/i) / (π√(E/fy)) exactly]
function lambdaBar(Lcr_mm: number, i_mm: number, fyv: number): number {
  const eps = Math.sqrt(235 / fyv)
  return (Lcr_mm / i_mm) / (93.9 * eps)
}

// Buckling reduction factor χ — §6.3.1.2 Eq (6.49)
function chi(lam: number, alpha: number): number {
  if (lam <= 0.2) return 1.0
  const phi = 0.5 * (1 + alpha * (lam - 0.2) + lam ** 2)
  return Math.min(1 / (phi + Math.sqrt(phi ** 2 - lam ** 2)), 1.0)
}

// Buckling curves — EC3 Table 6.2, rolled I/H sections
function flexuralBucklingCurves(row: SectionRow): { alphaY: number; alphaZ: number } {
  const hb = row.h / row.b
  if (hb > 1.2 && row.tf <= 100) return { alphaY: 0.21, alphaZ: 0.34 }  // curves a/b
  return { alphaY: 0.34, alphaZ: 0.49 }                                    // curves b/c
}

// Torsional buckling slenderness — §6.3.1.4 / Blue Book §6.1
// N_cr,T = (1/i₀²)·(G·It + π²·E·Iw/Lcr²)   i₀² = iy²+iz²  (y₀=0 doubly-symmetric)
// λ̄_T = √(A·fy / N_cr,T)
function lambdaBarT(row: SectionRow, Lcr_mm: number, fyv: number): number {
  const A   = toMm2(row)
  const iy  = toMmiy(row)
  const iz  = toMmiz(row)
  const It  = toMm4j(row)
  const Iw  = toMm6w(row)

  const i0sq = iy ** 2 + iz ** 2
  const NcrT = (1 / i0sq) * (G * It + (Math.PI ** 2 * E * Iw) / (Lcr_mm ** 2))
  return Math.sqrt((A * fyv) / NcrT)
}

export interface NbRdRow {
  label:  string
  values: number[]   // kN per BUCK_LENGTHS, -1 = not applicable
}

export function nbRdTable(row: SectionRow, grade: SteelGrade): NbRdRow[] {
  const fyv = fy(grade)
  const { cls } = crossSectionResistances(row, grade)
  const A   = toMm2(row)
  const iy  = toMmiy(row)
  const iz  = toMmiz(row)
  const { alphaY, alphaZ } = flexuralBucklingCurves(row)

  // N_b,y,Rd — major axis flexural buckling
  const yRow: number[] = BUCK_LENGTHS.map(L => {
    if (cls === 4) return -1
    const lam = lambdaBar(L * 1e3, iy, fyv)
    return (chi(lam, alphaY) * A * fyv) / (gM1 * 1e3)
  })

  // N_b,z,Rd — minor axis flexural buckling
  const zRow: number[] = BUCK_LENGTHS.map(L => {
    if (cls === 4) return -1
    const lam = lambdaBar(L * 1e3, iz, fyv)
    return (chi(lam, alphaZ) * A * fyv) / (gM1 * 1e3)
  })

  // N_b,T,Rd — torsional buckling §6.3.1.4, curve c (α=0.49)
  const tRow: number[] = BUCK_LENGTHS.map(L => {
    if (cls === 4) return -1
    const lam = lambdaBarT(row, L * 1e3, fyv)
    return (chi(lam, 0.49) * A * fyv) / (gM1 * 1e3)
  })

  return [
    { label: 'N_b,y,Rd', values: yRow },
    { label: 'N_b,z,Rd', values: zRow },
    { label: 'N_b,T,Rd', values: tRow },
  ]
}

// Exported for single-point axial+bending derivation at chosen n
export function calcMNrdPoint(row: SectionRow, grade: SteelGrade, n: number): {
  a: number; MNyRd: number; MNzRd: number
} {
  const { cls, Npl_Rd, Mpl_Rd, Mpl_z_Rd, Mel_Rd, Mel_z_Rd } = crossSectionResistances(row, grade)
  void Npl_Rd
  const A  = toMm2(row)
  const a  = Math.min((A - 2 * row.b * row.tf) / A, 0.5)

  let MNyRd: number
  let MNzRd: number

  if (cls === 4) { return { a, MNyRd: -1, MNzRd: -1 } }
  if (cls <= 2) {
    const denom = 1 - 0.5 * a
    MNyRd = n >= denom ? 0 : Math.min(Mpl_Rd * (1 - n) / denom, Mpl_Rd)
    MNzRd = n <= a ? Mpl_z_Rd : Math.max(Mpl_z_Rd * (1 - ((n - a) / (1 - a)) ** 2), 0)
  } else {
    MNyRd = Math.max(Mel_Rd * (1 - n), 0)
    MNzRd = Math.max(Mel_z_Rd * (1 - n), 0)
  }
  return { a, MNyRd, MNzRd }
}

// Exported for single-point compression derivation at chosen Lcr (m)
export function calcNbRdPoint(row: SectionRow, grade: SteelGrade, Lcr_m: number): {
  lamY: number; lamZ: number; lamT: number
  chiY: number; chiZ: number; chiT: number
  NbYRd: number; NbZRd: number; NbTRd: number
  alphaY: number; alphaZ: number
} {
  const fyv = fy(grade)
  const { cls } = crossSectionResistances(row, grade)
  const A   = toMm2(row)
  const iy  = toMmiy(row)
  const iz  = toMmiz(row)
  const { alphaY, alphaZ } = flexuralBucklingCurves(row)
  const Lcr_mm = Lcr_m * 1e3

  if (cls === 4) return { lamY: 0, lamZ: 0, lamT: 0, chiY: 0, chiZ: 0, chiT: 0, NbYRd: -1, NbZRd: -1, NbTRd: -1, alphaY, alphaZ }

  const lamY = lambdaBar(Lcr_mm, iy, fyv)
  const lamZ = lambdaBar(Lcr_mm, iz, fyv)
  const lamT = lambdaBarT(row, Lcr_mm, fyv)
  const chiY = chi(lamY, alphaY)
  const chiZ = chi(lamZ, alphaZ)
  const chiT = chi(lamT, 0.49)
  return {
    lamY, lamZ, lamT, chiY, chiZ, chiT,
    NbYRd: (chiY * A * fyv) / (gM1 * 1e3),
    NbZRd: (chiZ * A * fyv) / (gM1 * 1e3),
    NbTRd: (chiT * A * fyv) / (gM1 * 1e3),
    alphaY, alphaZ,
  }
}

// ── Convenience: all results in one call ─────────────────────────────────────

export interface CapacityResult {
  cs:    CrossSectionResult
  mbRd:  number[][]    // [C1 index][length index] → kNm
  mNRd:  MNrdRow[]     // [0]=M_N,y,Rd  [1]=M_N,z,Rd
  nbRd:  NbRdRow[]     // [0]=y-y  [1]=z-z  [2]=torsional
}

export function computeCapacity(row: SectionRow, grade: SteelGrade): CapacityResult {
  return {
    cs:    crossSectionResistances(row, grade),
    mbRd:  mbRdTable(row, grade),
    mNRd:  mNrdTable(row, grade),
    nbRd:  nbRdTable(row, grade),
  }
}
