// EC3 capacity engine for hot-finished hollow sections (SHS + RHS)
// BS EN 1993-1-1:2005, SCI P363 Blue Book formulas
// S355 only — Blue Book does not publish S275 hollow section capacity tables
import type { SectionRow } from '../_shared/types'

// ── Constants ────────────────────────────────────────────────────────────────
const E = 210_000   // N/mm²
const G = 81_000    // N/mm²
const gM0 = 1.0
const gM1 = 1.0

export type SteelGrade = 'S355'
export const GRADES: SteelGrade[] = ['S355']
export const LTB_LENGTHS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]  // m
export const C1_VALUES   = [1.00, 1.13, 1.35, 1.50, 1.77, 2.00, 2.50]
export const N_RATIOS    = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
export const BUCK_LENGTHS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]    // m

function fy(_grade: SteelGrade, t_mm: number): number {
  // EN 10210-1:2006 — t ≤ 16mm: 355; t ≤ 40mm: 345; t ≤ 63mm: 335; t ≤ 80mm: 325
  if (t_mm <= 16) return 355
  if (t_mm <= 40) return 345
  if (t_mm <= 63) return 335
  return 325
}

// ── Types ────────────────────────────────────────────────────────────────────
export interface CrossSectionResult {
  classWeb: number        // 1–4 (web classification under bending)
  classFl:  number        // 1–4 (flange classification under bending)
  sectionClass: number    // governing class
  isClass4: boolean
  Npl_Rd: number          // kN
  Mc_y_Rd: number         // kNm — y-y axis
  Mc_z_Rd: number         // kNm — z-z only for RHS (= Mc_y_Rd for SHS/CHS)
  Vc_y_Rd: number         // kN
  Lc_y: number            // m — limiting length for LTB (RHS/SHS; 0 for CHS = no LTB)
  isSHS: boolean
  isCHS: boolean
  // Used internally by MN/Nb calcs
  Wpl_y: number   // mm³
  Wpl_z: number   // mm³
  Wel_y: number   // mm³
  Wel_z: number   // mm³
  A_mm2: number   // mm²
  iy_mm: number   // mm
  iz_mm: number   // mm
  Iy_mm4: number  // mm⁴
  Iz_mm4: number  // mm⁴
  IT_mm4: number  // mm⁴
  fyVal:  number  // N/mm²
  t_mm:   number  // mm
}

export interface MNrdRow {
  n: number
  MN_y_Rd: number | null  // kNm
  MN_z_Rd: number | null  // kNm (same as MN_y for SHS)
}

export interface NbRdRow {
  Lcr_m: number
  Nb_y_Rd: number   // kN — y-y buckling
  Nb_z_Rd: number   // kN — z-z buckling (= y-y for SHS)
}

export interface LtbRow {
  C1:    number
  MbRds: (number | null)[]   // one per LTB_LENGTHS entry; null if L ≤ Lc (= Mc,Rd)
}

// ── Classification (§5.5) ─────────────────────────────────────────────────────
// For hot-finished RHS/SHS: c = h - 3t (web), cf = b - 3t (flange); no root radius
function classifyHollow(h: number, b: number, t: number, fyVal: number): { classWeb: number; classFl: number } {
  const eps = Math.sqrt(235 / fyVal)
  const cw = h - 3 * t   // web clear height
  const cf = b - 3 * t   // flange clear width
  // Under bending (web): Cl1 ≤ 72ε, Cl2 ≤ 83ε, Cl3 ≤ 124ε, Cl4 > 124ε
  const ratioW = cw / t
  const classWeb = ratioW <= 72 * eps ? 1 : ratioW <= 83 * eps ? 2 : ratioW <= 124 * eps ? 3 : 4
  // Flange (axial compression): Cl1/2/3 ≤ 33ε, Cl3 ≤ 38ε, Cl3 ≤ 42ε, Cl4 > 42ε
  // Blue Book uses same limits for flange (compression element, internal): 33/38/42
  const ratioCf = cf / t
  const classFl = ratioCf <= 33 * eps ? 1 : ratioCf <= 38 * eps ? 2 : ratioCf <= 42 * eps ? 3 : 4
  return { classWeb, classFl }
}

// CHS classification §5.5.2, Table 5.2: d/t ≤ 50ε² → Cl1; ≤ 70ε² → Cl2; ≤ 90ε² → Cl3; > 90ε² → Cl4
function classifyCHS(d: number, t: number, fyVal: number): number {
  const eps2 = 235 / fyVal  // ε²
  const ratio = d / t
  if (ratio <= 50 * eps2) return 1
  if (ratio <= 70 * eps2) return 2
  if (ratio <= 90 * eps2) return 3
  return 4
}

// ── Cross-section resistances ─────────────────────────────────────────────────
export function computeCapacity(row: SectionRow, grade: SteelGrade): CrossSectionResult {
  const t = row.t ?? 0
  const h = row.h
  const b = row.b
  const fyVal = fy(grade, t)
  const isCHS = row.designation.startsWith('CHS')
  const isSHS = (!isCHS && h === b)

  const A_mm2  = row.A  * 100      // cm² → mm²
  const Iy_mm4 = row.Ix * 1e4      // cm⁴ → mm⁴ (stored as Ix for major axis)
  const Iz_mm4 = row.Iy * 1e4
  const Wpl_y  = row.Zx * 1e3      // cm³ → mm³
  const Wpl_z  = row.Zy * 1e3
  const Wel_y  = row.Wx * 1e3
  const Wel_z  = row.Wy * 1e3
  const iy_mm  = row.ix * 10       // cm → mm
  const iz_mm  = row.iy * 10
  const IT_mm4 = row.J  * 1e4

  let classWeb: number, classFl: number
  if (isCHS) {
    const cl = classifyCHS(h, t, fyVal)
    classWeb = cl
    classFl  = cl
  } else {
    ;({ classWeb, classFl } = classifyHollow(h, b, t, fyVal))
  }
  const sectionClass = Math.max(classWeb, classFl)
  const isClass4 = sectionClass === 4

  // Mc,Rd — use Wpl for Cl1/2, Wel for Cl3, null for Cl4
  const Wy_bending = sectionClass <= 2 ? Wpl_y : Wel_y
  const Wz_bending = sectionClass <= 2 ? Wpl_z : Wel_z
  const Mc_y_Rd = isClass4 ? 0 : (Wy_bending * fyVal / gM0) / 1e6   // N·mm → kNm
  const Mc_z_Rd = isClass4 ? 0 : (Wz_bending * fyVal / gM0) / 1e6

  // Npl,Rd
  const Npl_Rd = (A_mm2 * fyVal / gM0) / 1e3   // N → kN

  // Shear resistance — hollow sections: Av = A·h/(b+h) for y-y (EN §6.2.6)
  const Av = A_mm2 * h / (b + h)
  const Vc_y_Rd = (Av * fyVal / (Math.SQRT2 * Math.SQRT2 * Math.sqrt(3)) / gM0) / 1e3  // simplified
  // = Av * fy / (√3 * γM0)
  const Vc_y = (Av * fyVal / (Math.sqrt(3) * gM0)) / 1e3

  // Limiting length Lc for LTB — CHS has no LTB (Lc_y = 0 signals "no LTB" in UI)
  // RHS/SHS: Lc from Blue Book §8.2.2: Lc = 0.4·π·√(EIz·GIT) / (Wy·fy)
  let Lc_y = 0
  if (!isCHS) {
    const Lc_y_mm = isSHS
      ? (0.4 * Math.PI * Math.sqrt(E * Iy_mm4 * G * IT_mm4)) / (Wpl_y * fyVal)
      : (0.4 * Math.PI * Math.sqrt(E * Iz_mm4 * G * IT_mm4)) / (Wpl_y * fyVal)
    Lc_y = Lc_y_mm / 1000
  }

  return {
    classWeb, classFl, sectionClass, isClass4,
    Npl_Rd, Mc_y_Rd, Mc_z_Rd, Vc_y_Rd: Vc_y,
    Lc_y, isSHS, isCHS,
    Wpl_y, Wpl_z, Wel_y, Wel_z, A_mm2,
    iy_mm, iz_mm, Iy_mm4, Iz_mm4, IT_mm4,
    fyVal, t_mm: t,
  }
}

// ── LTB — Mb,Rd table ─────────────────────────────────────────────────────────
// For hollow sections: Mcr = C1 * √(π²EIz/L² * LGIT/π²EIz) = C1 * π/L * √(EIz * GIT)
// LTB curve: b (α = 0.34) per UK NA for RHS; SHS typically no LTB but treated same
// λ_LT,0 = 0.4, β = 0.75 (UK NA)
// Modification factor f applied: f = 1 - 0.5(1-kc)[1 - 2(λ_LT - 0.8)²], kc = 1/√C1
function chi_LT(lamLT: number, alpha: number): number {
  if (lamLT <= 0.4) return 1.0
  const phi = 0.5 * (1 + alpha * (lamLT - 0.4) + 0.75 * lamLT * lamLT)  // β = 0.75
  return Math.min(1.0, 1 / (phi + Math.sqrt(phi * phi - 0.75 * lamLT * lamLT)))
}

function fMod(C1: number, lamLT: number): number {
  const kc = 1 / Math.sqrt(C1)
  const f = 1 - 0.5 * (1 - kc) * (1 - 2 * Math.pow(lamLT - 0.8, 2))
  return Math.min(1.0, Math.max(0, f))
}

export function mbRdTable(row: SectionRow, grade: SteelGrade): LtbRow[] {
  const cs = computeCapacity(row, grade)
  if (cs.isClass4) return C1_VALUES.map(C1 => ({ C1, MbRds: LTB_LENGTHS.map(() => null) }))
  // CHS: no LTB — return null for all entries (UI shows "No LTB" card instead)
  if (cs.isCHS) return C1_VALUES.map(C1 => ({ C1, MbRds: LTB_LENGTHS.map(() => null) }))

  const alpha = 0.34  // curve b for RHS/SHS LTB per UK NA
  const Wy = cs.sectionClass <= 2 ? cs.Wpl_y : cs.Wel_y
  const Iz = cs.iz_mm > 0 ? cs.Iz_mm4 : cs.Iy_mm4  // for SHS Iz = Iy

  return C1_VALUES.map(C1 => {
    const MbRds = LTB_LENGTHS.map(L_m => {
      if (L_m <= cs.Lc_y) return null  // null → display as Mc,y,Rd (no reduction)
      const L = L_m * 1000  // m → mm
      const Mcr = C1 * (Math.PI / L) * Math.sqrt(E * Iz * G * cs.IT_mm4)  // N·mm
      const lamLT = Math.sqrt((Wy * cs.fyVal) / Mcr)
      const chi = chi_LT(lamLT, alpha)
      const f = fMod(C1, lamLT)
      const chiMod = Math.min(1.0, Math.min(chi / f, 1 / (lamLT * lamLT)))
      return (chiMod * Wy * cs.fyVal / gM1) / 1e6  // kNm
    })
    return { C1, MbRds }
  })
}

export function calcMbRdPoint(row: SectionRow, grade: SteelGrade, C1: number, Lcr_m: number) {
  const cs = computeCapacity(row, grade)
  if (cs.isClass4 || Lcr_m <= cs.Lc_y) return { Mcr: 0, lamLT: 0, phi: 0, chiLT: 1, chiLTmod: 1, MbRd: cs.Mc_y_Rd }
  const Wy = cs.sectionClass <= 2 ? cs.Wpl_y : cs.Wel_y
  const Iz = cs.Iz_mm4
  const L = Lcr_m * 1000
  const Mcr = C1 * (Math.PI / L) * Math.sqrt(E * Iz * G * cs.IT_mm4)
  const lamLT = Math.sqrt((Wy * cs.fyVal) / Mcr)
  const alpha = 0.34
  const phi = 0.5 * (1 + alpha * (lamLT - 0.4) + 0.75 * lamLT * lamLT)
  const chiLT = Math.min(1.0, 1 / (phi + Math.sqrt(Math.max(0, phi * phi - 0.75 * lamLT * lamLT))))
  const f = fMod(C1, lamLT)
  const chiLTmod = Math.min(1.0, Math.min(chiLT / f, 1 / (lamLT * lamLT)))
  const MbRd = (chiLTmod * Wy * cs.fyVal / gM1) / 1e6
  return { Mcr: Mcr / 1e6, lamLT, phi, chiLT, chiLTmod, MbRd }
}

// ── MN,Rd table ───────────────────────────────────────────────────────────────
// RHS: aw = (A - 2bt)/A ≤ 0.5; MN,y = Mpl,y * (1-n)/(1-0.5aw)
//       af = (A - 2ht)/A ≤ 0.5; MN,z = Mpl,z * (1-n)/(1-0.5af)
// SHS: symmetric — same formula applies to both axes
function mnCl12(Mpl: number, n: number, alpha: number): number {
  const denom = 1 - 0.5 * alpha
  if (denom <= 0) return 0
  return Math.min(Mpl, Mpl * (1 - n) / denom)
}

export function mNrdTable(row: SectionRow, grade: SteelGrade): MNrdRow[] {
  const cs = computeCapacity(row, grade)
  const t = cs.t_mm
  const h = row.h
  const b = row.b

  const Mpl_y = (cs.Wpl_y * cs.fyVal / gM0) / 1e6  // kNm
  const Mpl_z = (cs.Wpl_z * cs.fyVal / gM0) / 1e6

  return N_RATIOS.map(n => {
    if (cs.isClass4) return { n, MN_y_Rd: null, MN_z_Rd: null }

    // CHS: §6.2.9.1(6) MN,Rd = Mpl · (1 - (n/a)²)  where a = 1 - π·Wel/Wpl
    if (cs.isCHS) {
      if (cs.sectionClass === 3) {
        const MN = Math.max(0, Mpl_y * (1 - n))
        return { n, MN_y_Rd: MN, MN_z_Rd: MN }
      }
      const a = Math.max(0.001, 1 - (Math.PI * cs.Wel_y) / cs.Wpl_y)
      const MN = n >= a ? 0 : Math.max(0, Mpl_y * (1 - (n / a) ** 2))
      return { n, MN_y_Rd: MN, MN_z_Rd: MN }
    }

    if (cs.sectionClass === 3) {
      return {
        n,
        MN_y_Rd: Math.max(0, Mpl_y * (1 - n)),
        MN_z_Rd: Math.max(0, Mpl_z * (1 - n)),
      }
    }
    // RHS/SHS Class 1 or 2
    const aw = Math.min(0.5, (cs.A_mm2 - 2 * b * t) / cs.A_mm2)
    const af = Math.min(0.5, (cs.A_mm2 - 2 * h * t) / cs.A_mm2)
    const MN_y = mnCl12(Mpl_y, n, aw)
    const MN_z = cs.isSHS ? MN_y : mnCl12(Mpl_z, n, af)
    return { n, MN_y_Rd: Math.max(0, MN_y), MN_z_Rd: Math.max(0, MN_z) }
  })
}

export function calcMNrdPoint(row: SectionRow, grade: SteelGrade, n: number) {
  const cs = computeCapacity(row, grade)
  const t = cs.t_mm
  const h = row.h
  const b = row.b
  const Mpl_y = (cs.Wpl_y * cs.fyVal / gM0) / 1e6
  const Mpl_z = (cs.Wpl_z * cs.fyVal / gM0) / 1e6

  if (cs.isCHS) {
    const a = Math.max(0.001, 1 - (Math.PI * cs.Wel_y) / cs.Wpl_y)
    const MN = n >= a ? 0 : Math.max(0, Mpl_y * (1 - (n / a) ** 2))
    return { aw: a, af: a, MN_y_Rd: MN, MN_z_Rd: MN }
  }

  const aw = Math.min(0.5, (cs.A_mm2 - 2 * b * t) / cs.A_mm2)
  const af = Math.min(0.5, (cs.A_mm2 - 2 * h * t) / cs.A_mm2)
  const MN_y_Rd = cs.sectionClass <= 2 ? mnCl12(Mpl_y, n, aw) : Mpl_y * (1 - n)
  const MN_z_Rd = cs.sectionClass <= 2
    ? (cs.isSHS ? MN_y_Rd : mnCl12(Mpl_z, n, af))
    : Mpl_z * (1 - n)
  return { aw, af, MN_y_Rd: Math.max(0, MN_y_Rd), MN_z_Rd: Math.max(0, MN_z_Rd) }
}

// ── Column buckling — Nb,Rd ───────────────────────────────────────────────────
// Hot-finished hollow sections: curve a (α = 0.21) — EC3 Table 6.2
function lambdaBar(Lcr_mm: number, i_mm: number, fyVal: number): number {
  return Lcr_mm / (i_mm * Math.PI * Math.sqrt(E / fyVal))
}

function chi(lamBar: number, alpha: number): number {
  const phi = 0.5 * (1 + alpha * (lamBar - 0.2) + lamBar * lamBar)
  return Math.min(1.0, 1 / (phi + Math.sqrt(phi * phi - lamBar * lamBar)))
}

export function nbRdTable(row: SectionRow, grade: SteelGrade): NbRdRow[] {
  const cs = computeCapacity(row, grade)
  const alpha = 0.21  // curve a for hot-finished hollow sections

  return BUCK_LENGTHS.map(L_m => {
    const Lcr = L_m * 1000  // mm
    const lamY = lambdaBar(Lcr, cs.iy_mm, cs.fyVal)
    const lamZ = lambdaBar(Lcr, cs.iz_mm, cs.fyVal)
    const chiY = chi(lamY, alpha)
    const chiZ = chi(lamZ, alpha)
    const Nb_y_Rd = (chiY * cs.A_mm2 * cs.fyVal / gM1) / 1e3
    const Nb_z_Rd = (chiZ * cs.A_mm2 * cs.fyVal / gM1) / 1e3
    return { Lcr_m: L_m, Nb_y_Rd, Nb_z_Rd }
  })
}

export function calcNbRdPoint(row: SectionRow, grade: SteelGrade, Lcr_m: number) {
  const cs = computeCapacity(row, grade)
  const alpha = 0.21
  const Lcr = Lcr_m * 1000
  const lamY = lambdaBar(Lcr, cs.iy_mm, cs.fyVal)
  const lamZ = lambdaBar(Lcr, cs.iz_mm, cs.fyVal)
  const phiY = 0.5 * (1 + alpha * (lamY - 0.2) + lamY * lamY)
  const phiZ = 0.5 * (1 + alpha * (lamZ - 0.2) + lamZ * lamZ)
  const chiY = Math.min(1.0, 1 / (phiY + Math.sqrt(phiY * phiY - lamY * lamY)))
  const chiZ = Math.min(1.0, 1 / (phiZ + Math.sqrt(phiZ * phiZ - lamZ * lamZ)))
  const Nb_y_Rd = (chiY * cs.A_mm2 * cs.fyVal / gM1) / 1e3
  const Nb_z_Rd = (chiZ * cs.A_mm2 * cs.fyVal / gM1) / 1e3
  return { lamY, lamZ, phiY, phiZ, chiY, chiZ, alphaY: alpha, alphaZ: alpha, Nb_y_Rd, Nb_z_Rd }
}
