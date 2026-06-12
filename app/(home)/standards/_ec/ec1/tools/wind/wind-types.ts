// ── Wind data constants and tables (EN 1991-1-4) ─────────────────────────────

export const TERRAIN_CATS = [
  { id: '0',   z0: 0.003, zmin: 1,  label: 'Cat. 0 — Sea / coastal open sea',                 descKey: 'std_ec1w_cat0_desc'   as const },
  { id: 'I',   z0: 0.01,  zmin: 1,  label: 'Cat. I — Lakes / flat open country',               descKey: 'std_ec1w_catI_desc'   as const },
  { id: 'II',  z0: 0.05,  zmin: 2,  label: 'Cat. II — Low vegetation, scattered obstacles',    descKey: 'std_ec1w_catII_desc'  as const },
  { id: 'III', z0: 0.3,   zmin: 5,  label: 'Cat. III — Regular cover, suburban',               descKey: 'std_ec1w_catIII_desc' as const },
  { id: 'IV',  z0: 1.0,   zmin: 10, label: 'Cat. IV — ≥15% buildings > 15 m',                 descKey: 'std_ec1w_catIV_desc'  as const },
]
export const KR_REF = { z0: 0.05 }

// External pressure coefficients (EN 1991-1-4 Tables 7.1, 7.2, 7.3a-d, 7.4a-b)
export const CPE_WALLS: Record<number, Record<string, { cpe10: number; cpe1: number }>> = {
  0: { A: { cpe10: -1.2, cpe1: -1.4 }, B: { cpe10: -0.8, cpe1: -1.1 }, C: { cpe10: -0.5, cpe1: -0.5 }, D: { cpe10: 0.7, cpe1: 1.0 }, E: { cpe10: -0.3, cpe1: -0.3 } },
  1: { A: { cpe10: -1.2, cpe1: -1.4 }, B: { cpe10: -0.8, cpe1: -1.1 }, C: { cpe10: -0.5, cpe1: -0.5 }, D: { cpe10: 0.8, cpe1: 1.0 }, E: { cpe10: -0.5, cpe1: -0.5 } },
  5: { A: { cpe10: -1.2, cpe1: -1.4 }, B: { cpe10: -0.8, cpe1: -1.1 }, C: { cpe10: -0.5, cpe1: -0.5 }, D: { cpe10: 0.8, cpe1: 1.0 }, E: { cpe10: -0.7, cpe1: -0.7 } },
}

// Flat roof cpe10 — EN 1991-1-4 Table 7.2
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
export const CPE_MONO_0: Record<number, Record<string, { neg10: number; neg1: number; pos10: number | null; pos1: number | null }>> = {
   5: { F: { neg10: -1.7, neg1: -2.5, pos10: null,  pos1: null  }, G: { neg10: -1.2, neg1: -2.0, pos10: null,  pos1: null  }, H: { neg10: -0.6, neg1: -1.2, pos10: null,  pos1: null  }, I: { neg10:  0.0, neg1:  0.0, pos10: null,  pos1: null  } },
  15: { F: { neg10: -0.9, neg1: -2.0, pos10:  0.2,  pos1:  0.2  }, G: { neg10: -0.8, neg1: -1.5, pos10:  0.2,  pos1:  0.2  }, H: { neg10: -0.3, neg1: -0.3, pos10: null,  pos1: null  }, I: { neg10:  0.2, neg1:  0.2, pos10: null,  pos1: null  } },
  30: { F: { neg10: -0.5, neg1: -1.5, pos10:  0.7,  pos1:  0.7  }, G: { neg10: -0.5, neg1: -1.5, pos10:  0.7,  pos1:  0.7  }, H: { neg10: -0.2, neg1: -0.2, pos10: null,  pos1: null  }, I: { neg10:  0.4, neg1:  0.4, pos10: null,  pos1: null  } },
  45: { F: { neg10:  0.0, neg1:  0.0, pos10:  0.7,  pos1:  0.7  }, G: { neg10:  0.0, neg1:  0.0, pos10:  0.7,  pos1:  0.7  }, H: { neg10:  0.0, neg1:  0.0, pos10: null,  pos1: null  }, I: { neg10:  0.6, neg1:  0.6, pos10: null,  pos1: null  } },
  60: { F: { neg10:  0.7, neg1:  0.7, pos10: null,  pos1: null  }, G: { neg10:  0.7, neg1:  0.7, pos10: null,  pos1: null  }, H: { neg10:  0.7, neg1:  0.7, pos10: null,  pos1: null  }, I: { neg10:  0.7, neg1:  0.7, pos10: null,  pos1: null  } },
  75: { F: { neg10:  0.8, neg1:  0.8, pos10: null,  pos1: null  }, G: { neg10:  0.8, neg1:  0.8, pos10: null,  pos1: null  }, H: { neg10:  0.8, neg1:  0.8, pos10: null,  pos1: null  }, I: { neg10:  0.8, neg1:  0.8, pos10: null,  pos1: null  } },
}

// Duopitch cpe per angle θ=0° (EN 1991-1-4 Table 7.4a)
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

// Monopitch cpe θ=90° (EN 1991-1-4 Table 7.3b)
export const CPE_MONO_90: Record<string, { cpe10: number; cpe1: number }> = {
  F: { cpe10: -1.6, cpe1: -2.2 },
  G: { cpe10: -1.3, cpe1: -2.0 },
  H: { cpe10: -0.7, cpe1: -1.2 },
  I: { cpe10: -0.6, cpe1: -1.2 },
}

// Monopitch cpe θ=180° (EN 1991-1-4 Table 7.3c)
export const CPE_MONO_180: Record<number, Record<string, { cpe10: number; cpe1: number }>> = {
   5: { F: { cpe10: -2.3, cpe1: -2.5 }, G: { cpe10: -1.3, cpe1: -2.0 }, H: { cpe10: -0.8, cpe1: -1.2 }, I: { cpe10: -0.4, cpe1: -0.5 } },
  15: { F: { cpe10: -2.5, cpe1: -2.8 }, G: { cpe10: -1.3, cpe1: -2.0 }, H: { cpe10: -0.9, cpe1: -1.2 }, I: { cpe10: -0.5, cpe1: -0.5 } },
  30: { F: { cpe10: -1.1, cpe1: -2.0 }, G: { cpe10: -0.8, cpe1: -1.5 }, H: { cpe10: -0.8, cpe1: -0.8 }, I: { cpe10: -0.6, cpe1: -0.6 } },
  45: { F: { cpe10: -0.6, cpe1: -1.2 }, G: { cpe10: -0.5, cpe1: -1.0 }, H: { cpe10: -0.8, cpe1: -0.8 }, I: { cpe10: -0.6, cpe1: -0.8 } },
  60: { F: { cpe10: -0.5, cpe1: -1.0 }, G: { cpe10: -0.5, cpe1: -1.0 }, H: { cpe10: -0.8, cpe1: -0.8 }, I: { cpe10: -0.6, cpe1: -0.8 } },
  75: { F: { cpe10: -0.5, cpe1: -1.0 }, G: { cpe10: -0.5, cpe1: -1.0 }, H: { cpe10: -0.8, cpe1: -0.8 }, I: { cpe10: -0.6, cpe1: -0.8 } },
}

// Duopitch cpe θ=90° (EN 1991-1-4 Table 7.4b)
export const CPE_DUO_90: Record<string, { cpe10: number; cpe1: number }> = {
  F: { cpe10: -1.6, cpe1: -2.2 },
  G: { cpe10: -1.3, cpe1: -2.0 },
  H: { cpe10: -0.7, cpe1: -1.2 },
  I: { cpe10: -0.6, cpe1: -1.2 },
}

// Freestanding wall net pressure coefficients (EN 1991-1-4 Table 7.9, solid φ=1.0)
export const CP_WALL_NET = [
  { l_h: '≤3',  lh: 3,  A: 2.3, B: 1.4, C: 1.2, D: 1.2 },
  { l_h: '5',   lh: 5,  A: 2.9, B: 1.8, C: 1.4, D: 1.2 },
  { l_h: '≥10', lh: 10, A: 3.4, B: 2.1, C: 1.7, D: 1.2 },
]

// Rectangular cross-section force coefficients (EN 1991-1-4 Fig 7.23)
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
