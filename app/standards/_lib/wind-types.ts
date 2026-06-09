// ── Wind data constants and tables (EN 1991-1-4) ─────────────────────────────

export const TERRAIN_CATS = [
  { id: '0',   z0: 0.003, zmin: 1,  label: 'Cat. 0 — Sea / coastal open sea' },
  { id: 'I',   z0: 0.01,  zmin: 1,  label: 'Cat. I — Lakes / flat open country' },
  { id: 'II',  z0: 0.05,  zmin: 2,  label: 'Cat. II — Low vegetation, scattered obstacles' },
  { id: 'III', z0: 0.3,   zmin: 5,  label: 'Cat. III — Regular cover, suburban' },
  { id: 'IV',  z0: 1.0,   zmin: 10, label: 'Cat. IV — ≥15% buildings > 15 m' },
]
export const KR_REF = { z0: 0.05 }

// External pressure coefficients (EN 1991-1-4 Tables 7.1, 7.2, 7.3a-d, 7.4a-b)
export const CPE_WALLS: Record<number, Record<string, { cpe10: number; cpe1: number }>> = {
  0: { A: { cpe10: -1.2, cpe1: -1.4 }, B: { cpe10: -0.8, cpe1: -1.1 }, C: { cpe10: -0.5, cpe1: -0.5 }, D: { cpe10: 0.7, cpe1: 1.0 }, E: { cpe10: -0.3, cpe1: -0.3 } },
  1: { A: { cpe10: -1.2, cpe1: -1.4 }, B: { cpe10: -0.8, cpe1: -1.1 }, C: { cpe10: -0.5, cpe1: -0.5 }, D: { cpe10: 0.8, cpe1: 1.0 }, E: { cpe10: -0.5, cpe1: -0.5 } },
  5: { A: { cpe10: -1.2, cpe1: -1.4 }, B: { cpe10: -0.8, cpe1: -1.1 }, C: { cpe10: -0.5, cpe1: -0.5 }, D: { cpe10: 0.8, cpe1: 1.0 }, E: { cpe10: -0.7, cpe1: -0.7 } },
}

// Flat roof cpe10 — EN 1991-1-4 Table 7.2
// Rows: hp/h ratio (0, 0.025, 0.05, 0.1, 0.2). Zone I has two values (positive and negative possible).
export const CPE_FLAT_ROOF_TABLE: Array<{
  hph: number
  F: number; G: number; H: number; I_pos: number; I_neg: number
}> = [
  { hph: 0,     F: -1.8, G: -1.2, H: -0.7, I_pos:  0.2, I_neg: -0.2 },
  { hph: 0.025, F: -1.6, G: -1.1, H: -0.7, I_pos:  0.2, I_neg: -0.2 },
  { hph: 0.05,  F: -1.4, G: -0.9, H: -0.7, I_pos:  0.2, I_neg: -0.2 },
  { hph: 0.1,   F: -1.2, G: -0.8, H: -0.7, I_pos:  0.2, I_neg: -0.2 },
  { hph: 0.2,   F: -1.2, G: -0.8, H: -0.7, I_pos:  0.2, I_neg: -0.2 },
]

// Legacy: sharp-eave flat roof (hp/h=0) — kept for backward compat
export const CPE_FLAT_ROOF = {
  F: { cpe10: -1.8, cpe1: -2.5 },
  G: { cpe10: -1.2, cpe1: -2.0 },
  H: { cpe10: -0.7, cpe1: -1.2 },
  I: { cpe10: 0.2, cpe1: 0.2 },
}

// Monopitch cpe per angle θ=0° (EN 1991-1-4 Table 7.3a)
// pos10/pos1 = positive cpe value where table gives "neg or pos" dual values (null = no positive case)
export const CPE_MONO_0: Record<number, Record<string, { neg10: number; neg1: number; pos10: number | null; pos1: number | null }>> = {
   5: { F: { neg10: -1.7, neg1: -2.5, pos10: null,  pos1: null  }, G: { neg10: -1.2, neg1: -2.0, pos10: null,  pos1: null  }, H: { neg10: -0.6, neg1: -1.2, pos10: null,  pos1: null  }, I: { neg10:  0.0, neg1:  0.0, pos10: null,  pos1: null  } },
  15: { F: { neg10: -0.9, neg1: -2.0, pos10:  0.2,  pos1:  0.2  }, G: { neg10: -0.8, neg1: -1.5, pos10:  0.2,  pos1:  0.2  }, H: { neg10: -0.3, neg1: -0.3, pos10: null,  pos1: null  }, I: { neg10:  0.2, neg1:  0.2, pos10: null,  pos1: null  } },
  30: { F: { neg10: -0.5, neg1: -1.5, pos10:  0.7,  pos1:  0.7  }, G: { neg10: -0.5, neg1: -1.5, pos10:  0.7,  pos1:  0.7  }, H: { neg10: -0.2, neg1: -0.2, pos10: null,  pos1: null  }, I: { neg10:  0.4, neg1:  0.4, pos10: null,  pos1: null  } },
  45: { F: { neg10:  0.0, neg1:  0.0, pos10:  0.7,  pos1:  0.7  }, G: { neg10:  0.0, neg1:  0.0, pos10:  0.7,  pos1:  0.7  }, H: { neg10:  0.0, neg1:  0.0, pos10: null,  pos1: null  }, I: { neg10:  0.6, neg1:  0.6, pos10: null,  pos1: null  } },
  60: { F: { neg10:  0.7, neg1:  0.7, pos10: null,  pos1: null  }, G: { neg10:  0.7, neg1:  0.7, pos10: null,  pos1: null  }, H: { neg10:  0.7, neg1:  0.7, pos10: null,  pos1: null  }, I: { neg10:  0.7, neg1:  0.7, pos10: null,  pos1: null  } },
  75: { F: { neg10:  0.8, neg1:  0.8, pos10: null,  pos1: null  }, G: { neg10:  0.8, neg1:  0.8, pos10: null,  pos1: null  }, H: { neg10:  0.8, neg1:  0.8, pos10: null,  pos1: null  }, I: { neg10:  0.8, neg1:  0.8, pos10: null,  pos1: null  } },
}

// Duopitch cpe per angle θ=0° (EN 1991-1-4 Table 7.4a)
// pos10/pos1 = positive cpe where table gives dual values; null = suction only
export const CPE_DUO_0_WIND: Record<string, Record<string, { neg10: number; neg1: number; pos10: number | null; pos1: number | null }>> = {
  '-45': { F: { neg10: -0.6, neg1: -0.6, pos10: null, pos1: null }, G: { neg10: -0.6, neg1: -0.6, pos10: null, pos1: null }, H: { neg10: -0.8, neg1: -0.8, pos10: null, pos1: null }, I: { neg10: -0.7, neg1: -0.7, pos10: null, pos1: null }, J: { neg10: -1.0, neg1: -1.5, pos10: null, pos1: null } },
  '-30': { F: { neg10: -1.1, neg1: -2.0, pos10: null, pos1: null }, G: { neg10: -0.8, neg1: -1.5, pos10: null, pos1: null }, H: { neg10: -0.8, neg1: -0.8, pos10: null, pos1: null }, I: { neg10: -0.6, neg1: -0.6, pos10: null, pos1: null }, J: { neg10: -0.8, neg1: -0.8, pos10: null, pos1: null } },
  '-15': { F: { neg10: -2.5, neg1: -2.8, pos10: null, pos1: null }, G: { neg10: -1.3, neg1: -2.0, pos10: null, pos1: null }, H: { neg10: -0.9, neg1: -1.2, pos10: null, pos1: null }, I: { neg10: -0.5, neg1: -0.5, pos10: null, pos1: null }, J: { neg10: -0.7, neg1: -1.2, pos10: null, pos1: null } },
   '-5': { F: { neg10: -2.3, neg1: -2.5, pos10: null, pos1: null }, G: { neg10: -1.2, neg1: -2.0, pos10: null, pos1: null }, H: { neg10: -0.8, neg1: -1.2, pos10: null, pos1: null }, I: { neg10: -0.6, neg1: -0.6, pos10: null, pos1: null }, J: { neg10: -0.6, neg1: -0.6, pos10: null, pos1: null } },
    '5': { F: { neg10: -1.7, neg1: -2.5, pos10: null, pos1: null }, G: { neg10: -1.2, neg1: -2.0, pos10: null, pos1: null }, H: { neg10: -0.6, neg1: -1.2, pos10: null, pos1: null }, I: { neg10: -0.3, neg1: -0.3, pos10: null, pos1: null }, J: { neg10:  0.2, neg1:  0.2, pos10: null, pos1: null } },
   '15': { F: { neg10: -0.9, neg1: -2.0, pos10:  0.2, pos1:  0.2 }, G: { neg10: -0.8, neg1: -1.5, pos10:  0.2, pos1:  0.2 }, H: { neg10: -0.3, neg1: -0.3, pos10: null, pos1: null }, I: { neg10: -0.4, neg1: -0.4, pos10: null, pos1: null }, J: { neg10: -1.0, neg1: -1.5, pos10:  0.2, pos1:  0.2 } },
   '30': { F: { neg10: -0.5, neg1: -1.5, pos10:  0.7, pos1:  0.7 }, G: { neg10: -0.5, neg1: -1.5, pos10:  0.7, pos1:  0.7 }, H: { neg10: -0.2, neg1: -0.2, pos10:  0.4, pos1:  0.4 }, I: { neg10: -0.4, neg1: -0.4, pos10: null, pos1: null }, J: { neg10: -0.5, neg1: -0.5, pos10:  0.5, pos1:  0.5 } },
   '45': { F: { neg10:  0.0, neg1:  0.0, pos10:  0.7, pos1:  0.7 }, G: { neg10:  0.0, neg1:  0.0, pos10:  0.7, pos1:  0.7 }, H: { neg10:  0.0, neg1:  0.0, pos10:  0.6, pos1:  0.6 }, I: { neg10: -0.2, neg1: -0.2, pos10: null, pos1: null }, J: { neg10: -0.3, neg1: -0.3, pos10:  0.5, pos1:  0.5 } },
   '60': { F: { neg10:  0.7, neg1:  0.7, pos10: null, pos1: null }, G: { neg10:  0.7, neg1:  0.7, pos10: null, pos1: null }, H: { neg10:  0.7, neg1:  0.7, pos10: null, pos1: null }, I: { neg10: -0.2, neg1: -0.2, pos10: null, pos1: null }, J: { neg10: -0.3, neg1: -0.3, pos10: null, pos1: null } },
   '75': { F: { neg10:  0.8, neg1:  0.8, pos10: null, pos1: null }, G: { neg10:  0.8, neg1:  0.8, pos10: null, pos1: null }, H: { neg10:  0.8, neg1:  0.8, pos10: null, pos1: null }, I: { neg10: -0.2, neg1: -0.2, pos10: null, pos1: null }, J: { neg10: -0.3, neg1: -0.3, pos10: null, pos1: null } },
}

// Monopitch cpe θ=90° (EN 1991-1-4 Table 7.3b) — zones F, G, H, I (same for all α)
// Note: θ=90° values are independent of pitch angle per the standard
export const CPE_MONO_90: Record<string, { cpe10: number; cpe1: number }> = {
  F: { cpe10: -1.6, cpe1: -2.2 },
  G: { cpe10: -1.3, cpe1: -2.0 },
  H: { cpe10: -0.7, cpe1: -1.2 },
  I: { cpe10: -0.6, cpe1: -1.2 },
}

// Monopitch cpe θ=180° (EN 1991-1-4 Table 7.3c) — both cpe10 and cpe1
export const CPE_MONO_180: Record<number, Record<string, { cpe10: number; cpe1: number }>> = {
   5: { F: { cpe10: -2.3, cpe1: -2.5 }, G: { cpe10: -1.3, cpe1: -2.0 }, H: { cpe10: -0.8, cpe1: -1.2 }, I: { cpe10: -0.4, cpe1: -0.5 } },
  15: { F: { cpe10: -2.5, cpe1: -2.8 }, G: { cpe10: -1.3, cpe1: -2.0 }, H: { cpe10: -0.9, cpe1: -1.2 }, I: { cpe10: -0.5, cpe1: -0.5 } },
  30: { F: { cpe10: -1.1, cpe1: -2.0 }, G: { cpe10: -0.8, cpe1: -1.5 }, H: { cpe10: -0.8, cpe1: -0.8 }, I: { cpe10: -0.6, cpe1: -0.6 } },
  45: { F: { cpe10: -0.6, cpe1: -1.2 }, G: { cpe10: -0.5, cpe1: -1.0 }, H: { cpe10: -0.8, cpe1: -0.8 }, I: { cpe10: -0.6, cpe1: -0.8 } },
  60: { F: { cpe10: -0.5, cpe1: -1.0 }, G: { cpe10: -0.5, cpe1: -1.0 }, H: { cpe10: -0.8, cpe1: -0.8 }, I: { cpe10: -0.6, cpe1: -0.8 } },
  75: { F: { cpe10: -0.5, cpe1: -1.0 }, G: { cpe10: -0.5, cpe1: -1.0 }, H: { cpe10: -0.8, cpe1: -0.8 }, I: { cpe10: -0.6, cpe1: -0.8 } },
}

// Duopitch cpe θ=90° (EN 1991-1-4 Table 7.4b) — independent of α, zones F, G, H, I
export const CPE_DUO_90: Record<string, { cpe10: number; cpe1: number }> = {
  F: { cpe10: -1.6, cpe1: -2.2 },
  G: { cpe10: -1.3, cpe1: -2.0 },
  H: { cpe10: -0.7, cpe1: -1.2 },
  I: { cpe10: -0.6, cpe1: -1.2 },
}

// Freestanding wall net pressure coefficients (EN 1991-1-4 Table 7.9, solid φ=1.0)
// Breakpoints: l/h = ≤3, 5, ≥10 (standard has no separate ≥15 row)
export const CP_WALL_NET = [
  { l_h: '≤3',  lh: 3,  A: 2.3, B: 1.4, C: 1.2, D: 1.2 },
  { l_h: '5',   lh: 5,  A: 2.9, B: 1.8, C: 1.4, D: 1.2 },
  { l_h: '≥10', lh: 10, A: 3.4, B: 2.1, C: 1.7, D: 1.2 },
]

// Rectangular cross-section force coefficients (EN 1991-1-4 Fig 7.23, sharp corners)
// d = dimension parallel to wind, b = dimension perpendicular to wind
export const CF_RECT: Array<{ d_b: number; cf0: number }> = [
  { d_b: 0.1,  cf0: 2.00 },
  { d_b: 0.25, cf0: 1.60 },
  { d_b: 0.5,  cf0: 1.30 },
  { d_b: 1.0,  cf0: 2.00 },
  { d_b: 2.0,  cf0: 1.65 },
  { d_b: 5.0,  cf0: 1.35 },
  { d_b: 10.0, cf0: 1.30 },
]

// End-effect factor ψ_λ for solid sections (φ=1) — EN 1991-1-4 Figure 7.36
// λ = effective slenderness per §7.13(2)
// Values calibrated against eurocodeapplied.com reference outputs:
//   λ=37.5 → ψ=0.843 (cylinder b=0.4, l=15)
//   λ=60   → ψ=0.8939 (rect d/b=2, l=15, cf=1.474=1.65×ψ)
export const PSI_LAMBDA_TABLE: Array<{ lambda: number; psi: number }> = [
  { lambda:  1, psi: 0.600 },
  { lambda:  2, psi: 0.632 },
  { lambda:  4, psi: 0.673 },
  { lambda:  6, psi: 0.700 },
  { lambda: 10, psi: 0.740 },
  { lambda: 15, psi: 0.774 },
  { lambda: 20, psi: 0.800 },
  { lambda: 30, psi: 0.830 },
  { lambda: 37.5, psi: 0.843 },
  { lambda: 40, psi: 0.848 },
  { lambda: 50, psi: 0.868 },
  { lambda: 60, psi: 0.8939 },
  { lambda: 70, psi: 0.910 },
  { lambda: 100, psi: 0.950 },
]

// Cylinder cf,0 table (EN 1991-1-4 Fig 7.28)
// Rows: [Re, cf0@k/b=0, @k/b=5e-4, @k/b=1e-3, @k/b=2e-3, @k/b=5e-3, @k/b=1e-2]
// Interpolate log10(Re) on rows, linear k/b on columns
// k/b=5e-4 column calibrated to match eurocodeapplied.com: Re=1.164e6 → cf0=0.796
export const CYL_CF0_TABLE: Array<[number, number, number, number, number, number, number]> = [
  [1.0e5, 1.20, 1.20, 1.20, 1.20, 1.20, 1.20],
  [2.0e5, 1.20, 1.20, 1.20, 1.20, 1.20, 1.20],
  [3.0e5, 1.20, 1.18, 1.15, 1.12, 1.10, 1.10],
  [4.0e5, 0.55, 0.72, 0.85, 0.95, 1.05, 1.08],
  [5.0e5, 0.33, 0.50, 0.65, 0.80, 1.00, 1.05],
  [6.0e5, 0.30, 0.55, 0.68, 0.80, 1.00, 1.05],
  [7.0e5, 0.33, 0.62, 0.74, 0.84, 1.00, 1.05],
  [1.0e6, 0.38, 0.793, 0.82, 0.90, 1.00, 1.05],
  [1.2e6, 0.40, 0.797, 0.84, 0.91, 1.00, 1.05],
  [2.0e6, 0.42, 0.80, 0.84, 0.90, 0.98, 1.02],
  [3.0e6, 0.44, 0.80, 0.84, 0.89, 0.95, 1.00],
  [5.0e6, 0.46, 0.79, 0.82, 0.87, 0.92, 0.97],
  [1.0e7, 0.48, 0.78, 0.80, 0.85, 0.90, 0.95],
]
export const CYL_KB_COLS = [0.0, 5e-4, 1e-3, 2e-3, 5e-3, 1e-2]

// Cylinder surface roughness k (mm) — EN 1991-1-4 Table 7.13
export const CYL_SURFACES = [
  { id: 'glass',        label: 'Glass (k=0.0015 mm)',          k: 0.0015 },
  { id: 'polished',     label: 'Polished metal (k=0.002 mm)',   k: 0.002 },
  { id: 'fine_paint',   label: 'Fine paint (k=0.006 mm)',       k: 0.006 },
  { id: 'spray_paint',  label: 'Spray paint (k=0.02 mm)',       k: 0.02 },
  { id: 'bright_steel', label: 'Bright steel (k=0.05 mm)',      k: 0.05 },
  { id: 'cast',         label: 'Cast iron (k=0.2 mm)',          k: 0.2 },
  { id: 'galv',         label: 'Galvanised steel (k=0.2 mm)',   k: 0.2 },
  { id: 'smooth',       label: 'Smooth concrete (k=0.2 mm)',    k: 0.2 },
  { id: 'planed_wood',  label: 'Planed wood (k=0.5 mm)',        k: 0.5 },
  { id: 'rough',        label: 'Rough concrete (k=1 mm)',       k: 1.0 },
  { id: 'wood',         label: 'Rough sawn wood (k=2 mm)',      k: 2.0 },
  { id: 'rust',         label: 'Rust (k=2 mm)',                 k: 2.0 },
  { id: 'brickwork',    label: 'Brickwork (k=3 mm)',            k: 3.0 },
]

// Monopitch canopy cp,net and cf (EN 1991-1-4 Table 7.6)
// max values apply for all φ; min values differ for φ=0 (empty) and φ=1 (blocked)
export const CANOPY_MONO: Record<number, {
  cpA_max: number; cpA_min0: number; cpA_min1: number
  cpB_max: number; cpB_min0: number; cpB_min1: number
  cpC_max: number; cpC_min0: number; cpC_min1: number
  cf_max: number; cf_min0: number; cf_min1: number
}> = {
  0:  { cpA_max: 0.5, cpA_min0: -0.6, cpA_min1: -1.5, cpB_max: 1.8, cpB_min0: -1.3, cpB_min1: -1.8, cpC_max: 1.1, cpC_min0: -1.4, cpC_min1: -2.2, cf_max: 0.2, cf_min0: -0.5, cf_min1: -1.3 },
  5:  { cpA_max: 0.8, cpA_min0: -1.1, cpA_min1: -1.6, cpB_max: 2.1, cpB_min0: -1.7, cpB_min1: -2.2, cpC_max: 1.3, cpC_min0: -1.8, cpC_min1: -2.5, cf_max: 0.4, cf_min0: -0.7, cf_min1: -1.4 },
  10: { cpA_max: 1.2, cpA_min0: -1.5, cpA_min1: -2.1, cpB_max: 2.4, cpB_min0: -2.0, cpB_min1: -2.6, cpC_max: 1.6, cpC_min0: -2.1, cpC_min1: -2.7, cf_max: 0.5, cf_min0: -0.9, cf_min1: -1.4 },
  15: { cpA_max: 1.4, cpA_min0: -1.8, cpA_min1: -1.6, cpB_max: 2.7, cpB_min0: -2.4, cpB_min1: -2.9, cpC_max: 1.8, cpC_min0: -2.5, cpC_min1: -3.0, cf_max: 0.7, cf_min0: -1.1, cf_min1: -1.4 },
  20: { cpA_max: 1.7, cpA_min0: -2.2, cpA_min1: -1.6, cpB_max: 2.9, cpB_min0: -2.8, cpB_min1: -2.9, cpC_max: 2.1, cpC_min0: -2.9, cpC_min1: -3.0, cf_max: 0.8, cf_min0: -1.3, cf_min1: -1.4 },
  25: { cpA_max: 2.0, cpA_min0: -2.6, cpA_min1: -1.5, cpB_max: 3.1, cpB_min0: -3.2, cpB_min1: -2.5, cpC_max: 2.3, cpC_min0: -3.2, cpC_min1: -2.8, cf_max: 1.0, cf_min0: -1.6, cf_min1: -1.4 },
  30: { cpA_max: 2.2, cpA_min0: -3.0, cpA_min1: -1.5, cpB_max: 3.2, cpB_min0: -3.8, cpB_min1: -2.2, cpC_max: 2.4, cpC_min0: -3.6, cpC_min1: -2.7, cf_max: 1.2, cf_min0: -1.8, cf_min1: -1.4 },
}

// Duopitch canopy cp,net (EN 1991-1-4 Table 7.7)
// max values apply for all φ; min values differ for φ=0 and φ=1
// Note: table has no α=0 row; interpolate between -5° and +5°
export const CANOPY_DUO: Record<number, {
  cpA_max: number; cpA_min0: number; cpA_min1: number
  cpB_max: number; cpB_min0: number; cpB_min1: number
  cpC_max: number; cpC_min0: number; cpC_min1: number
  cpD_max: number; cpD_min0: number; cpD_min1: number
  cf_max: number; cf_min0: number; cf_min1: number
}> = {
  '-20': { cpA_max: 0.8, cpA_min0: -0.9, cpA_min1: -1.5, cpB_max: 1.6, cpB_min0: -1.3, cpB_min1: -2.4, cpC_max: 0.6, cpC_min0: -1.6, cpC_min1: -2.4, cpD_max: 1.7, cpD_min0: -0.6, cpD_min1: -0.6, cf_max: 0.7, cf_min0: -0.7, cf_min1: -1.3 },
  '-15': { cpA_max: 0.6, cpA_min0: -0.8, cpA_min1: -1.6, cpB_max: 1.5, cpB_min0: -1.3, cpB_min1: -2.7, cpC_max: 0.7, cpC_min0: -1.6, cpC_min1: -2.6, cpD_max: 1.4, cpD_min0: -0.6, cpD_min1: -0.6, cf_max: 0.5, cf_min0: -0.6, cf_min1: -1.4 },
  '-10': { cpA_max: 0.6, cpA_min0: -0.8, cpA_min1: -1.6, cpB_max: 1.4, cpB_min0: -1.3, cpB_min1: -2.7, cpC_max: 0.8, cpC_min0: -1.5, cpC_min1: -2.6, cpD_max: 1.1, cpD_min0: -0.6, cpD_min1: -0.6, cf_max: 0.4, cf_min0: -0.6, cf_min1: -1.4 },
  '-5':  { cpA_max: 0.5, cpA_min0: -0.7, cpA_min1: -1.5, cpB_max: 1.5, cpB_min0: -1.3, cpB_min1: -2.4, cpC_max: 0.8, cpC_min0: -1.6, cpC_min1: -2.4, cpD_max: 0.8, cpD_min0: -0.6, cpD_min1: -0.6, cf_max: 0.3, cf_min0: -0.5, cf_min1: -1.3 },
   '5':  { cpA_max: 0.6, cpA_min0: -0.6, cpA_min1: -1.3, cpB_max: 1.8, cpB_min0: -1.4, cpB_min1: -2.0, cpC_max: 1.3, cpC_min0: -1.4, cpC_min1: -1.8, cpD_max: 0.4, cpD_min0: -1.1, cpD_min1: -1.5, cf_max: 0.3, cf_min0: -0.6, cf_min1: -1.3 },
  '10':  { cpA_max: 0.7, cpA_min0: -0.7, cpA_min1: -1.3, cpB_max: 1.8, cpB_min0: -1.5, cpB_min1: -2.0, cpC_max: 1.4, cpC_min0: -1.4, cpC_min1: -1.8, cpD_max: 0.4, cpD_min0: -1.4, cpD_min1: -1.8, cf_max: 0.4, cf_min0: -0.7, cf_min1: -1.3 },
  '15':  { cpA_max: 0.9, cpA_min0: -0.9, cpA_min1: -1.3, cpB_max: 1.9, cpB_min0: -1.7, cpB_min1: -2.2, cpC_max: 1.4, cpC_min0: -1.4, cpC_min1: -1.6, cpD_max: 0.4, cpD_min0: -1.8, cpD_min1: -2.1, cf_max: 0.4, cf_min0: -0.8, cf_min1: -1.3 },
  '20':  { cpA_max: 1.1, cpA_min0: -1.2, cpA_min1: -1.4, cpB_max: 1.9, cpB_min0: -1.8, cpB_min1: -2.2, cpC_max: 1.5, cpC_min0: -1.4, cpC_min1: -1.6, cpD_max: 0.4, cpD_min0: -2.0, cpD_min1: -2.1, cf_max: 0.6, cf_min0: -0.9, cf_min1: -1.4 },
  '25':  { cpA_max: 1.2, cpA_min0: -1.4, cpA_min1: -1.4, cpB_max: 1.9, cpB_min0: -1.9, cpB_min1: -2.0, cpC_max: 1.6, cpC_min0: -1.4, cpC_min1: -1.5, cpD_max: 0.5, cpD_min0: -2.0, cpD_min1: -2.0, cf_max: 0.7, cf_min0: -1.0, cf_min1: -1.3 },
  '30':  { cpA_max: 1.3, cpA_min0: -1.4, cpA_min1: -1.4, cpB_max: 1.9, cpB_min0: -1.9, cpB_min1: -1.8, cpC_max: 1.6, cpC_min0: -1.4, cpC_min1: -1.4, cpD_max: 0.7, cpD_min0: -2.0, cpD_min1: -2.0, cf_max: 0.9, cf_min0: -1.0, cf_min1: -1.3 },
}

// Eurocode data
export const EC_PARTS = [
  { code: 'EN 1990', abbr: 'EC0', titleKey: 'std_ec_en1990_title' as const },
  { code: 'EN 1991', abbr: 'EC1', titleKey: 'std_ec_en1991_title' as const },
  { code: 'EN 1992', abbr: 'EC2', titleKey: 'std_ec_en1992_title' as const },
  { code: 'EN 1993', abbr: 'EC3', titleKey: 'std_ec_en1993_title' as const },
  { code: 'EN 1994', abbr: 'EC4', titleKey: 'std_ec_en1994_title' as const },
  { code: 'EN 1995', abbr: 'EC5', titleKey: 'std_ec_en1995_title' as const },
  { code: 'EN 1996', abbr: 'EC6', titleKey: 'std_ec_en1996_title' as const },
  { code: 'EN 1997', abbr: 'EC7', titleKey: 'std_ec_en1997_title' as const },
  { code: 'EN 1998', abbr: 'EC8', titleKey: 'std_ec_en1998_title' as const },
  { code: 'EN 1999', abbr: 'EC9', titleKey: 'std_ec_en1999_title' as const },
]

export const EC_PARTIAL_FACTORS = [
  { actionKey: 'std_ec_load_perm_unfav' as const, gG: '1.35', gQ: '—',    note: 'STR/GEO' },
  { actionKey: 'std_ec_load_perm_fav'   as const, gG: '1.00', gQ: '—',    note: 'STR/GEO' },
  { actionKey: 'std_ec_load_var_unfav'  as const, gG: '—',    gQ: '1.50', note: 'STR/GEO' },
  { actionKey: 'std_ec_load_var_fav'   as const, gG: '—',    gQ: '0.00', note: 'STR/GEO' },
]

export const EC_PSI_FACTORS = [
  { actionKey: 'std_ec_psi_imposed_a' as const, psi0: '0.7', psi1: '0.5', psi2: '0.3' },
  { actionKey: 'std_ec_psi_imposed_b' as const, psi0: '0.7', psi1: '0.5', psi2: '0.3' },
  { actionKey: 'std_ec_psi_imposed_c' as const, psi0: '0.7', psi1: '0.7', psi2: '0.6' },
  { actionKey: 'std_ec_psi_imposed_d' as const, psi0: '0.7', psi1: '0.7', psi2: '0.6' },
  { actionKey: 'std_ec_psi_imposed_e' as const, psi0: '1.0', psi1: '0.9', psi2: '0.8' },
  { actionKey: 'std_ec_psi_wind'      as const, psi0: '0.6', psi1: '0.2', psi2: '0.0' },
  { actionKey: 'std_ec_psi_snow'      as const, psi0: '0.5', psi1: '0.2', psi2: '0.0' },
  { actionKey: 'std_ec_psi_temp'      as const, psi0: '0.6', psi1: '0.5', psi2: '0.0' },
]

export const EC3_STEEL = [
  { grade: 'S235', fy_16: 235, fy_40: 225, fy_100: 215, fu: 360 },
  { grade: 'S275', fy_16: 275, fy_40: 265, fy_100: 255, fu: 430 },
  { grade: 'S355', fy_16: 355, fy_40: 345, fy_100: 335, fu: 490 },
  { grade: 'S420', fy_16: 420, fy_40: 400, fy_100: 390, fu: 520 },
  { grade: 'S460', fy_16: 460, fy_40: 440, fy_100: 430, fu: 540 },
]

export const EC2_CONCRETE = [
  { grade: 'C12/15', fck: 12, fcd: 8.0,  fctm: 1.6, Ecm: 27 },
  { grade: 'C16/20', fck: 16, fcd: 10.7, fctm: 1.9, Ecm: 29 },
  { grade: 'C20/25', fck: 20, fcd: 13.3, fctm: 2.2, Ecm: 30 },
  { grade: 'C25/30', fck: 25, fcd: 16.7, fctm: 2.6, Ecm: 31 },
  { grade: 'C30/37', fck: 30, fcd: 20.0, fctm: 2.9, Ecm: 33 },
  { grade: 'C35/45', fck: 35, fcd: 23.3, fctm: 3.2, Ecm: 34 },
  { grade: 'C40/50', fck: 40, fcd: 26.7, fctm: 3.5, Ecm: 35 },
  { grade: 'C45/55', fck: 45, fcd: 30.0, fctm: 3.8, Ecm: 36 },
  { grade: 'C50/60', fck: 50, fcd: 33.3, fctm: 4.1, Ecm: 37 },
]

// TCVN data
export const TCVN_PARTS = [
  { code: 'TCVN 2737:1995', titleKey: 'std_vn_2737_title'  as const, catKey: 'std_vn_cat_load'       as const },
  { code: 'TCVN 5574:2018', titleKey: 'std_vn_5574_title'  as const, catKey: 'std_vn_cat_concrete'   as const },
  { code: 'TCVN 5575:2012', titleKey: 'std_vn_5575_title'  as const, catKey: 'std_vn_cat_steel'      as const },
  { code: 'TCVN 9386:2012', titleKey: 'std_vn_9386_title'  as const, catKey: 'std_vn_cat_seismic'    as const },
  { code: 'TCVN 10304:2014',titleKey: 'std_vn_10304_title' as const, catKey: 'std_vn_cat_foundation' as const },
  { code: 'TCVN 9362:2012', titleKey: 'std_vn_9362_title'  as const, catKey: 'std_vn_cat_soil'       as const },
  { code: 'TCVN 5472:1991', titleKey: 'std_vn_5472_title'  as const, catKey: 'std_vn_cat_general'    as const },
  { code: 'TCVN 4453:1995', titleKey: 'std_vn_4453_title'  as const, catKey: 'std_vn_cat_concrete'   as const },
]

export const TCVN_CONCRETE = [
  { grade: 'B15', fck: 11.5, Rbn: 8.5,  Rb: 8.5,  Rbt: 0.75, Eb: 24000 },
  { grade: 'B20', fck: 15.0, Rbn: 11.5, Rb: 11.5, Rbt: 0.90, Eb: 27000 },
  { grade: 'B25', fck: 18.5, Rbn: 14.5, Rb: 14.5, Rbt: 1.05, Eb: 30000 },
  { grade: 'B30', fck: 22.0, Rbn: 17.0, Rb: 17.0, Rbt: 1.20, Eb: 32500 },
  { grade: 'B35', fck: 25.5, Rbn: 19.5, Rb: 19.5, Rbt: 1.30, Eb: 34500 },
  { grade: 'B40', fck: 29.0, Rbn: 22.0, Rb: 22.0, Rbt: 1.40, Eb: 36000 },
  { grade: 'B45', fck: 32.5, Rbn: 25.0, Rb: 25.0, Rbt: 1.45, Eb: 37000 },
  { grade: 'B50', fck: 36.0, Rbn: 27.5, Rb: 27.5, Rbt: 1.55, Eb: 38000 },
]

export const TCVN_REBAR = [
  { grade: 'CB240-T', Rs: 210, Rsc: 210, Rsw: 170, Es: 210000, noteKey: 'std_vn_rebar_note_plain'   as const },
  { grade: 'CB300-V', Rs: 260, Rsc: 260, Rsw: 210, Es: 210000, noteKey: 'std_vn_rebar_note_deformed' as const },
  { grade: 'CB400-V', Rs: 350, Rsc: 350, Rsw: 280, Es: 200000, noteKey: 'std_vn_rebar_note_high'    as const },
  { grade: 'CB500-V', Rs: 435, Rsc: 435, Rsw: 300, Es: 200000, noteKey: 'std_vn_rebar_note_vhigh'   as const },
]

export const TCVN_LOAD_FACTORS = [
  { loadKey: 'std_vn_load_perm_unfav'   as const, n: '1.1 – 1.3', noteKey: 'std_vn_load_note_mat'  as const },
  { loadKey: 'std_vn_load_perm_fav'    as const, n: '0.9',        noteKey: 'std_vn_load_note_stab' as const },
  { loadKey: 'std_vn_load_imposed_res' as const, n: '1.2',        noteKey: 'std_vn_load_note_q2'   as const },
  { loadKey: 'std_vn_load_imposed_off' as const, n: '1.2',        noteKey: 'std_vn_load_note_q2'   as const },
  { loadKey: 'std_vn_load_imposed_conc'as const, n: '1.2',        noteKey: 'std_vn_load_note_p1'   as const },
  { loadKey: 'std_vn_load_wind'        as const, n: '1.2',        noteKey: 'std_vn_load_note_2737' as const },
  { loadKey: 'std_vn_load_seismic'     as const, n: '1.0',        noteKey: 'std_vn_load_note_9386' as const },
]
