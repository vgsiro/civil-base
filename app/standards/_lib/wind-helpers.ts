// ── Pure calculation functions (EN 1991-1-4) ─────────────────────────────────
import { TERRAIN_CATS, KR_REF, CPE_WALLS, CPE_MONO_0, CPE_MONO_90, CPE_MONO_180, CPE_DUO_0_WIND, CPE_DUO_90, CANOPY_MONO, CANOPY_DUO, CF_RECT, PSI_LAMBDA_TABLE, CP_WALL_NET, CYL_CF0_TABLE, CYL_KB_COLS, CPE_FLAT_ROOF_TABLE } from './wind-types'

export function calcPeakPressure(vb: number, z: number, catId: string, c0: number, rho: number) {
  const cat = TERRAIN_CATS.find(c => c.id === catId) ?? TERRAIN_CATS[2]
  const z0 = cat.z0; const zmin = cat.zmin
  const kr = 0.19 * Math.pow(z0 / KR_REF.z0, 0.07)
  const ze = Math.max(z, zmin)
  const cr = kr * Math.log(ze / z0)
  const vm = cr * c0 * vb
  const Iv = 1.0 / (c0 * Math.log(ze / z0))  // EN 1991-1-4 Eq 4.7: Iv = kI/(c0·ln(z/z0)), kI=1
  const qp = (1 + 7 * Iv) * 0.5 * rho * vm * vm / 1000
  return { kr, ze, cr, vm, Iv, qp }
}

export function interpLinear(x: number, x0: number, x1: number, y0: number, y1: number) {
  if (x1 === x0) return y0
  return y0 + (y1 - y0) * (x - x0) / (x1 - x0)
}

export function getCpeWalls(hd: number, zone: string, field: 'cpe10' | 'cpe1'): number {
  if (zone === 'A' || zone === 'B' || zone === 'C') {
    return (CPE_WALLS[0] as any)[zone]?.[field] ?? 0
  }
  const clamped = Math.min(Math.max(hd, 0.25), 5)
  const v025 = (CPE_WALLS[0] as any)[zone]?.[field] ?? 0
  const v1   = (CPE_WALLS[1] as any)[zone]?.[field] ?? 0
  const v5   = (CPE_WALLS[5] as any)[zone]?.[field] ?? 0
  if (clamped <= 0.25) return v025
  if (clamped >= 5)    return v5
  if (clamped <= 1)    return interpLinear(clamped, 0.25, 1, v025, v1)
  return interpLinear(clamped, 1, 5, v1, v5)
}

export function getCpe10Walls(hd: number, zone: string): number {
  return getCpeWalls(hd, zone, 'cpe10')
}

// Returns { neg, pos } per zone. pos=null means no positive cpe case for that zone.
export function getMonoCpe(alpha: number, field: 'cpe10' | 'cpe1' = 'cpe10', theta: '0' | '90' | '180' = '0'): Record<string, { neg: number; pos: number | null }> {
  const negField = field === 'cpe10' ? 'neg10' : 'neg1'
  const posField = field === 'cpe10' ? 'pos10' : 'pos1'

  // θ=90°: all-suction only, no positive case
  if (theta === '90') {
    const r: Record<string, { neg: number; pos: number | null }> = {}
    for (const z of ['F', 'G', 'H', 'I']) r[z] = { neg: CPE_MONO_90[z]?.[field] ?? 0, pos: null }
    return r
  }

  // θ=180°: all-suction only (Table 7.3c has no positive values)
  if (theta === '180') {
    const angles = [5, 15, 30, 45, 60, 75]
    const clamped = Math.min(Math.max(alpha, 5), 75)
    const lo = angles.filter(a => a <= clamped).slice(-1)[0] ?? 5
    const hi = angles.filter(a => a >= clamped)[0] ?? 75
    const r: Record<string, { neg: number; pos: number | null }> = {}
    for (const z of ['F', 'G', 'H', 'I']) {
      const f = field === 'cpe10' ? 'cpe10' : 'cpe1'
      const loVal = CPE_MONO_180[lo][z]?.[f] ?? 0
      const hiVal = CPE_MONO_180[hi][z]?.[f] ?? 0
      r[z] = { neg: lo === hi ? loVal : interpLinear(clamped, lo, hi, loVal, hiVal), pos: null }
    }
    return r
  }

  // θ=0°: interpolate both neg and pos fields
  const angles = [5, 15, 30, 45, 60, 75]
  const clamped = Math.min(Math.max(alpha, 5), 75)
  const lo = angles.filter(a => a <= clamped).slice(-1)[0] ?? 5
  const hi = angles.filter(a => a >= clamped)[0] ?? 75
  const r: Record<string, { neg: number; pos: number | null }> = {}
  for (const z of ['F', 'G', 'H', 'I']) {
    const loNeg = CPE_MONO_0[lo][z]?.[negField] ?? 0
    const hiNeg = CPE_MONO_0[hi][z]?.[negField] ?? 0
    const neg = lo === hi ? loNeg : interpLinear(clamped, lo, hi, loNeg, hiNeg)

    const loPos = CPE_MONO_0[lo][z]?.[posField] ?? null
    const hiPos = CPE_MONO_0[hi][z]?.[posField] ?? null
    let pos: number | null = null
    if (loPos !== null && hiPos !== null) {
      pos = lo === hi ? loPos : interpLinear(clamped, lo, hi, loPos, hiPos)
    } else if (loPos !== null || hiPos !== null) {
      // one boundary has pos, other doesn't — interpolate toward 0
      pos = lo === hi
        ? (loPos ?? hiPos ?? null)
        : interpLinear(clamped, lo, hi, loPos ?? 0, hiPos ?? 0)
    }
    r[z] = { neg, pos }
  }
  return r
}

export function getDuoCpe(alpha: number, field: 'cpe10' | 'cpe1' = 'cpe10', theta: '0' | '90' = '0'): Record<string, { neg: number; pos: number | null }> {
  const negField = field === 'cpe10' ? 'neg10' : 'neg1'
  const posField = field === 'cpe10' ? 'pos10' : 'pos1'

  // θ=90°: suction only
  if (theta === '90') {
    const r: Record<string, { neg: number; pos: number | null }> = {}
    for (const z of ['F', 'G', 'H', 'I']) r[z] = { neg: CPE_DUO_90[z]?.[field] ?? 0, pos: null }
    return r
  }

  const angles = [-45, -30, -15, -5, 5, 15, 30, 45, 60, 75]
  const clamped = Math.min(Math.max(alpha, -45), 75)
  const lo = angles.filter(a => a <= clamped).slice(-1)[0] ?? -45
  const hi = angles.filter(a => a >= clamped)[0] ?? 75
  const loData = CPE_DUO_0_WIND[String(lo)] ?? {}
  const hiData = CPE_DUO_0_WIND[String(hi)] ?? {}
  const r: Record<string, { neg: number; pos: number | null }> = {}
  for (const z of ['F', 'G', 'H', 'I', 'J']) {
    const loNeg = loData[z]?.[negField] ?? 0
    const hiNeg = hiData[z]?.[negField] ?? 0
    const neg = lo === hi ? loNeg : interpLinear(clamped, lo, hi, loNeg, hiNeg)

    const loPos = loData[z]?.[posField] ?? null
    const hiPos = hiData[z]?.[posField] ?? null
    let pos: number | null = null
    if (loPos !== null && hiPos !== null) {
      pos = lo === hi ? loPos : interpLinear(clamped, lo, hi, loPos, hiPos)
    } else if (loPos !== null || hiPos !== null) {
      pos = lo === hi
        ? (loPos ?? hiPos ?? null)
        : interpLinear(clamped, lo, hi, loPos ?? 0, hiPos ?? 0)
    }
    r[z] = { neg, pos }
  }
  return r
}

export function getCanopyMono(alpha: number, phi: number = 0) {
  const angles = Object.keys(CANOPY_MONO).map(Number).sort((a, b) => a - b)
  const clamped = Math.min(Math.max(alpha, 0), 30)
  const lo = angles.filter(a => a <= clamped).slice(-1)[0] ?? 0
  const hi = angles.filter(a => a >= clamped)[0] ?? 30
  const phiC = Math.min(Math.max(phi, 0), 1)
  const interp = (r: typeof CANOPY_MONO[number]) => ({
    cpA_max: r.cpA_max,
    cpA_min: r.cpA_min0 + phiC * (r.cpA_min1 - r.cpA_min0),
    cpB_max: r.cpB_max,
    cpB_min: r.cpB_min0 + phiC * (r.cpB_min1 - r.cpB_min0),
    cpC_max: r.cpC_max,
    cpC_min: r.cpC_min0 + phiC * (r.cpC_min1 - r.cpC_min0),
    cf_max: r.cf_max,
    cf_min: r.cf_min0 + phiC * (r.cf_min1 - r.cf_min0),
  })
  if (lo === hi) return interp(CANOPY_MONO[lo])
  const d = interp(CANOPY_MONO[lo]); const u = interp(CANOPY_MONO[hi])
  const lerp = (a: number, b: number) => interpLinear(clamped, lo, hi, a, b)
  return { cpA_max: lerp(d.cpA_max, u.cpA_max), cpA_min: lerp(d.cpA_min, u.cpA_min), cpB_max: lerp(d.cpB_max, u.cpB_max), cpB_min: lerp(d.cpB_min, u.cpB_min), cpC_max: lerp(d.cpC_max, u.cpC_max), cpC_min: lerp(d.cpC_min, u.cpC_min), cf_max: lerp(d.cf_max, u.cf_max), cf_min: lerp(d.cf_min, u.cf_min) }
}

export function getCanopyDuo(alpha: number, phi: number = 0) {
  const keys = Object.keys(CANOPY_DUO).map(Number).sort((a, b) => a - b)
  const clamped = Math.min(Math.max(alpha, -20), 30)
  const lo = keys.filter(a => a <= clamped).slice(-1)[0] ?? -20
  const hi = keys.filter(a => a >= clamped)[0] ?? 30
  const phiC = Math.min(Math.max(phi, 0), 1)
  const interp = (r: typeof CANOPY_DUO[number]) => ({
    cpA_max: r.cpA_max, cpA_min: r.cpA_min0 + phiC * (r.cpA_min1 - r.cpA_min0),
    cpB_max: r.cpB_max, cpB_min: r.cpB_min0 + phiC * (r.cpB_min1 - r.cpB_min0),
    cpC_max: r.cpC_max, cpC_min: r.cpC_min0 + phiC * (r.cpC_min1 - r.cpC_min0),
    cpD_max: r.cpD_max, cpD_min: r.cpD_min0 + phiC * (r.cpD_min1 - r.cpD_min0),
    cf_max: r.cf_max,   cf_min: r.cf_min0 + phiC * (r.cf_min1 - r.cf_min0),
  })
  if (lo === hi) return interp(CANOPY_DUO[lo])
  const dv = interp(CANOPY_DUO[lo]); const uv = interp(CANOPY_DUO[hi])
  const lerp = (a: number, b: number) => interpLinear(clamped, lo, hi, a, b)
  return { cpA_max: lerp(dv.cpA_max, uv.cpA_max), cpA_min: lerp(dv.cpA_min, uv.cpA_min), cpB_max: lerp(dv.cpB_max, uv.cpB_max), cpB_min: lerp(dv.cpB_min, uv.cpB_min), cpC_max: lerp(dv.cpC_max, uv.cpC_max), cpC_min: lerp(dv.cpC_min, uv.cpC_min), cpD_max: lerp(dv.cpD_max, uv.cpD_max), cpD_min: lerp(dv.cpD_min, uv.cpD_min), cf_max: lerp(dv.cf_max, uv.cf_max), cf_min: lerp(dv.cf_min, uv.cf_min) }
}

export function getCfRect(d_b: number): number {
  const pts = CF_RECT
  if (d_b <= pts[0].d_b) return pts[0].cf0
  if (d_b >= pts[pts.length - 1].d_b) return pts[pts.length - 1].cf0
  for (let i = 0; i < pts.length - 1; i++) {
    if (d_b >= pts[i].d_b && d_b <= pts[i + 1].d_b) {
      return interpLinear(d_b, pts[i].d_b, pts[i + 1].d_b, pts[i].cf0, pts[i + 1].cf0)
    }
  }
  return 2.0
}

// End-effect factor ψ_λ per EN 1991-1-4 Figure 7.36 (solid sections, φ=1)
export function getPsiLambda(lambda: number): number {
  const pts = PSI_LAMBDA_TABLE
  if (lambda <= pts[0].lambda) return pts[0].psi
  if (lambda >= pts[pts.length - 1].lambda) return pts[pts.length - 1].psi
  for (let i = 0; i < pts.length - 1; i++) {
    if (lambda >= pts[i].lambda && lambda <= pts[i + 1].lambda)
      return interpLinear(lambda, pts[i].lambda, pts[i + 1].lambda, pts[i].psi, pts[i + 1].psi)
  }
  return 1.0
}

// Effective slenderness λ per EN 1991-1-4 §7.13(2) for rectangular sections
// b = dimension perpendicular to wind, l = element length
export function getEffectiveSlenderness(l: number, b: number): { lambda: number; lambda15: number; lambda50: number } {
  const lambda15 = Math.min(2.0 * l / b, 70)
  const lambda50 = Math.min(1.4 * l / b, 70)
  let lambda: number
  if (l <= 15) lambda = lambda15
  else if (l >= 50) lambda = lambda50
  else lambda = lambda15 + (lambda50 - lambda15) * (l - 15) / (50 - 15)
  return { lambda, lambda15, lambda50 }
}

// Effective slenderness λ per EN 1991-1-4 §7.13(2) for circular cylinders
// b = diameter, l = element length
export function getCylEffectiveSlenderness(l: number, b: number): { lambda: number; lambda15: number; lambda50: number } {
  const lambda15 = Math.min(l / b, 70)
  const lambda50 = Math.min(0.7 * l / b, 70)
  let lambda: number
  if (l <= 15) lambda = lambda15
  else if (l >= 50) lambda = lambda50
  else lambda = lambda15 + (lambda50 - lambda15) * (l - 15) / (50 - 15)
  return { lambda, lambda15, lambda50 }
}

// Cylinder force coefficient cf,0 per EN 1991-1-4 Fig 7.28
// Uses log10(Re) interpolation on rows + linear k/b interpolation on columns
export function getCylCf0(Re: number, kb: number): number {
  const logRe = Math.log10(Math.max(Re, CYL_CF0_TABLE[0][0]))
  const logTbl = CYL_CF0_TABLE.map(r => Math.log10(r[0]))
  // interpolate each k/b column against log10(Re)
  const cfCols = [1, 2, 3, 4, 5, 6].map(col => {
    const ys = CYL_CF0_TABLE.map(r => r[col])
    if (logRe <= logTbl[0]) return ys[0]
    if (logRe >= logTbl[logTbl.length - 1]) return ys[ys.length - 1]
    for (let i = 0; i < logTbl.length - 1; i++) {
      if (logRe >= logTbl[i] && logRe <= logTbl[i + 1])
        return interpLinear(logRe, logTbl[i], logTbl[i + 1], ys[i], ys[i + 1])
    }
    return ys[ys.length - 1]
  })
  // interpolate between k/b columns
  const kbClamped = Math.min(Math.max(kb, CYL_KB_COLS[0]), CYL_KB_COLS[CYL_KB_COLS.length - 1])
  if (kbClamped <= CYL_KB_COLS[0]) return cfCols[0]
  if (kbClamped >= CYL_KB_COLS[CYL_KB_COLS.length - 1]) return cfCols[cfCols.length - 1]
  for (let i = 0; i < CYL_KB_COLS.length - 1; i++) {
    if (kbClamped >= CYL_KB_COLS[i] && kbClamped <= CYL_KB_COLS[i + 1])
      return interpLinear(kbClamped, CYL_KB_COLS[i], CYL_KB_COLS[i + 1], cfCols[i], cfCols[i + 1])
  }
  return cfCols[cfCols.length - 1]
}

// Flat roof cpe,10 per EN 1991-1-4 Table 7.2, interpolated on hp/h
export function getFlatRoofCpe(hph: number): { F: number; G: number; H: number; I_pos: number; I_neg: number } {
  const tbl = CPE_FLAT_ROOF_TABLE
  const clamped = Math.min(Math.max(hph, 0), 0.2)
  if (clamped <= tbl[0].hph) return tbl[0]
  if (clamped >= tbl[tbl.length - 1].hph) return tbl[tbl.length - 1]
  for (let i = 0; i < tbl.length - 1; i++) {
    if (clamped >= tbl[i].hph && clamped <= tbl[i + 1].hph) {
      const t = (clamped - tbl[i].hph) / (tbl[i + 1].hph - tbl[i].hph)
      return {
        F: tbl[i].F + t * (tbl[i + 1].F - tbl[i].F),
        G: tbl[i].G + t * (tbl[i + 1].G - tbl[i].G),
        H: tbl[i].H + t * (tbl[i + 1].H - tbl[i].H),
        I_pos: tbl[i].I_pos + t * (tbl[i + 1].I_pos - tbl[i].I_pos),
        I_neg: tbl[i].I_neg + t * (tbl[i + 1].I_neg - tbl[i].I_neg),
      }
    }
  }
  return tbl[tbl.length - 1]
}

export function getWallNetCp(l_h: number, zone: string): number {
  const rows = CP_WALL_NET
  const x = Math.max(l_h, 0)
  if (x <= rows[0].lh) return (rows[0] as any)[zone]
  if (x >= rows[rows.length - 1].lh) return (rows[rows.length - 1] as any)[zone]
  for (let i = 0; i < rows.length - 1; i++) {
    if (x >= rows[i].lh && x <= rows[i + 1].lh)
      return interpLinear(x, rows[i].lh, rows[i + 1].lh, (rows[i] as any)[zone], (rows[i + 1] as any)[zone])
  }
  return (rows[rows.length - 1] as any)[zone]
}
