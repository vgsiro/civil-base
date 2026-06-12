// ── TCVN standard constants ───────────────────────────────────────────────────
// Split from wind-types.ts

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
