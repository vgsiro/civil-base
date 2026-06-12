// ── Shared Eurocode & TCVN constants ─────────────────────────────────────────
// Split from wind-types.ts — wind data moved to _ec/ec1/tools/wind/wind-types.ts

// Eurocode parts list
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
