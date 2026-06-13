import React from 'react'
import type { SectionRow } from './types'

// Columns shown in the main scrollable table
export const VISIBLE_COLS: (keyof SectionRow)[] = [
  'mass', 'h', 'b', 'tw', 'tf', 'A', 'Ix', 'Iy', 'ix', 'iy', 'Wx', 'Wy', 'Zx', 'Zy',
  'surfacePerM', 'surfacePerTonne',
]

// Groups shown in the expanded detail card
export const COLUMN_GROUPS: { labelKey: string; cols: (keyof SectionRow)[] }[] = [
  { labelKey: 'bb_grp_dimensions', cols: ['h', 'b', 'tw', 'tf', 'r'] },
  { labelKey: 'bb_grp_mass_area',  cols: ['mass', 'A'] },
  { labelKey: 'bb_grp_major_axis', cols: ['Ix', 'Wx', 'Zx', 'ix'] },
  { labelKey: 'bb_grp_minor_axis', cols: ['Iy', 'Wy', 'Zy', 'iy'] },
  { labelKey: 'bb_grp_torsion',    cols: ['J', 'Cw'] },
  { labelKey: 'bb_grp_surface',    cols: ['surfacePerM', 'surfacePerTonne'] },
]

export const COLUMN_UNITS: Partial<Record<keyof SectionRow, string>> = {
  designation: '',
  mass: 'kg/m',
  h: 'mm', b: 'mm', tw: 'mm', tf: 'mm', r: 'mm',
  t: 'mm',
  A: 'cm²',
  Ix: 'cm⁴', Iy: 'cm⁴',
  Wx: 'cm³', Wy: 'cm³',
  Zx: 'cm³', Zy: 'cm³',
  ix: 'cm',  iy: 'cm',
  J: 'cm⁴',  Cw: 'dm⁶',
  Wt: 'cm³',
  surfacePerM:     'm²/m',
  surfacePerTonne: 'm²/t',
  Iw: 'cm⁶',
  e0: 'mm',
  y0: 'mm',
  s:  'mm',
  Iu: 'cm⁴', Iv: 'cm⁴',
  iu: 'cm',  iv: 'cm',
  Wu: 'cm³', Wv: 'cm³',
  vs: 'cm',
  cy: 'cm',  cz: 'cm',
}

// Tooltip i18n keys per column (description text is translated, symbol stays literal)
export const COL_TIP_KEY: Partial<Record<keyof SectionRow, string>> = {
  mass: 'bb_tip_mass',
  h:   'bb_tip_h',  b:  'bb_tip_b',
  tw:  'bb_tip_tw', tf: 'bb_tip_tf', r: 'bb_tip_r',
  t:   'bb_tip_t',
  A:   'bb_tip_A',
  Ix:  'bb_tip_Ix', Iy: 'bb_tip_Iy',
  Wx:  'bb_tip_Wx', Wy: 'bb_tip_Wy',
  Zx:  'bb_tip_Zx', Zy: 'bb_tip_Zy',
  ix:  'bb_tip_ix', iy: 'bb_tip_iy',
  J:   'bb_tip_J',  Cw: 'bb_tip_Cw',
  Wt:  'bb_tip_Wt',
  surfacePerM:     'bb_tip_surfacePerM',
  surfacePerTonne: 'bb_tip_surfacePerTonne',
  U:   'bb_tip_U',
  X:   'bb_tip_X',
  Iw:  'bb_tip_Iw',
  e0:  'bb_tip_e0',
  y0:  'bb_tip_y0',
  s:   'bb_tip_s',
  Iu:  'bb_tip_Iu', Iv:  'bb_tip_Iv',
  iu:  'bb_tip_iu', iv:  'bb_tip_iv',
  Wu:  'bb_tip_Wu', Wv:  'bb_tip_Wv',
  vs:  'bb_tip_vs',
  tanA:   'bb_tip_tanA',
  phiMin: 'bb_tip_phiMin',
  phiMax: 'bb_tip_phiMax',
  cy:  'bb_tip_cy', cz:  'bb_tip_cz',
}

// Symbol prefix shown before the translated description in the tooltip popup
export const COL_TIP_SYMBOL: Partial<Record<keyof SectionRow, string>> = {
  Ix: '$I_y$ — ', Iy: '$I_z$ — ',
  Wx: '$W_{el,y}$ — ', Wy: '$W_{el,z}$ — ',
  Zx: '$W_{pl,y}$ — ', Zy: '$W_{pl,z}$ — ',
  ix: '$i_y$ — ',      iy: '$i_z$ — ',
  J:  '$I_t$ — ',      Cw: '$I_w$ — ',
  Wt: '$W_t$ — ',
  U:  '$u$ — ',
  X:  '$X$ — ',
  Iw: '$I_w$ — ',
  e0: '$e_0$ — ',
  y0: '$y_0$ — ',
  s:  '$s$ — ',
  Iu: '$I_u$ — ', Iv: '$I_v$ — ',
  iu: '$i_u$ — ', iv: '$i_v$ — ',
  Wu: '$W_{el,u}$ — ', Wv: '$W_{el,v}$ — ',
  vs: '$v_s$ — ',
  tanA:   '$\\tan\\alpha$ — ',
  phiMin: '$\\phi_{min}$ — ',
  phiMax: '$\\phi_{max}$ — ',
  cy: '$c_y$ — ', cz: '$c_z$ — ',
}

// CHS-specific visible columns (replaces VISIBLE_COLS for CHS section types)
export const CHS_VISIBLE_COLS: (keyof SectionRow)[] = [
  'mass', 't', 'A', 'Ix', 'ix', 'Wx', 'Zx', 'J', 'Wt', 'surfacePerM', 'surfacePerTonne',
]

// CHS-specific column groups for the detail card
export const CHS_COLUMN_GROUPS: { labelKey: string; cols: (keyof SectionRow)[] }[] = [
  { labelKey: 'bb_grp_dimensions',    cols: ['t'] },
  { labelKey: 'bb_grp_mass_area',     cols: ['mass', 'A'] },
  { labelKey: 'bb_grp_section_props', cols: ['Ix', 'ix', 'Wx', 'Zx'] },
  { labelKey: 'bb_grp_torsion',       cols: ['J', 'Wt'] },
  { labelKey: 'bb_grp_surface',       cols: ['surfacePerM', 'surfacePerTonne'] },
]

// RHS/SHS extended visible columns (adds surface area)
export const HOLLOW_VISIBLE_COLS: (keyof SectionRow)[] = [
  'mass', 't', 'A', 'Ix', 'Iy', 'ix', 'iy', 'Wx', 'Wy', 'Zx', 'Zy', 'surfacePerM', 'surfacePerTonne',
]

export const HOLLOW_COLUMN_GROUPS: { labelKey: string; cols: (keyof SectionRow)[] }[] = [
  { labelKey: 'bb_grp_dimensions',    cols: ['h', 'b', 't'] },
  { labelKey: 'bb_grp_mass_area',     cols: ['mass', 'A'] },
  { labelKey: 'bb_grp_major_axis',    cols: ['Ix', 'Wx', 'Zx', 'ix'] },
  { labelKey: 'bb_grp_minor_axis',    cols: ['Iy', 'Wy', 'Zy', 'iy'] },
  { labelKey: 'bb_grp_torsion',       cols: ['J', 'Wt'] },
  { labelKey: 'bb_grp_surface',       cols: ['surfacePerM', 'surfacePerTonne'] },
]

// PFC single channel visible columns
export const PFC_VISIBLE_COLS: (keyof SectionRow)[] = [
  'mass', 'h', 'b', 'tw', 'tf', 'A', 'Ix', 'Iy', 'ix', 'iy', 'Wx', 'Wy', 'Zx', 'Zy', 'U', 'X',
]

export const PFC_COLUMN_GROUPS: { labelKey: string; cols: (keyof SectionRow)[] }[] = [
  { labelKey: 'bb_grp_dimensions',    cols: ['h', 'b', 'tw', 'tf', 'r', 'e0'] },
  { labelKey: 'bb_grp_mass_area',     cols: ['mass', 'A'] },
  { labelKey: 'bb_grp_major_axis',    cols: ['Ix', 'Wx', 'Zx', 'ix'] },
  { labelKey: 'bb_grp_minor_axis',    cols: ['Iy', 'Wy', 'Zy', 'iy'] },
  { labelKey: 'bb_grp_torsion',       cols: ['J', 'Iw'] },
  { labelKey: 'bb_grp_buckling',      cols: ['U', 'X', 'y0'] },
]

// Single angle visible columns (EA and UA)
export const ANGLE_VISIBLE_COLS: (keyof SectionRow)[] = [
  'mass', 'h', 'b', 'tw', 'A', 'Ix', 'ix', 'Iy', 'iy', 'Iu', 'iu', 'Iv', 'iv',
]

export const ANGLE_COLUMN_GROUPS: { labelKey: string; cols: (keyof SectionRow)[] }[] = [
  { labelKey: 'bb_grp_dimensions',   cols: ['h', 'b', 'tw', 'r', 'cy', 'cz'] },
  { labelKey: 'bb_grp_mass_area',    cols: ['mass', 'A'] },
  { labelKey: 'bb_grp_yy_axis',      cols: ['Ix', 'ix', 'Wx'] },
  { labelKey: 'bb_grp_zz_axis',      cols: ['Iy', 'iy', 'Wy'] },
  { labelKey: 'bb_grp_uu_axis',      cols: ['Iu', 'iu', 'Wu'] },
  { labelKey: 'bb_grp_vv_axis',      cols: ['Iv', 'iv', 'Wv'] },
  { labelKey: 'bb_grp_torsion',      cols: ['J', 'tanA'] },
  { labelKey: 'bb_grp_buckling',     cols: ['phiMin', 'phiMax', 'vs'] },
]

// Paired angle (back-to-back) visible columns
export const ANGLE_BTB_VISIBLE_COLS: (keyof SectionRow)[] = [
  'mass', 's', 'A', 'Ix', 'ix', 'Iy', 'iy', 'Wx',
]

export const ANGLE_BTB_COLUMN_GROUPS: { labelKey: string; cols: (keyof SectionRow)[] }[] = [
  { labelKey: 'bb_grp_mass_area',   cols: ['mass', 'A', 's'] },
  { labelKey: 'bb_grp_yy_axis',     cols: ['Ix', 'ix', 'Wx'] },
  { labelKey: 'bb_grp_zz_axis',     cols: ['Iy', 'iy'] },
]

// Paired PFC (laced / back-to-back) visible columns
export const PFC_PAIRED_VISIBLE_COLS: (keyof SectionRow)[] = [
  'mass', 's', 'A', 'Ix', 'ix', 'Iy', 'iy', 'Wx', 'Wy', 'Zx', 'Zy',
]

export const PFC_PAIRED_COLUMN_GROUPS: { labelKey: string; cols: (keyof SectionRow)[] }[] = [
  { labelKey: 'bb_grp_mass_area',     cols: ['mass', 'A', 's'] },
  { labelKey: 'bb_grp_major_axis',    cols: ['Ix', 'ix', 'Wx', 'Zx'] },
  { labelKey: 'bb_grp_minor_axis',    cols: ['Iy', 'iy', 'Wy', 'Zy'] },
]

// Table header groups — drive the 3-row grouped thead (group title → symbol → units)
// Each group has a display title and the subset of visibleCols it covers.
// Only cols that actually appear in the active visibleCols are rendered.
export type TableHeaderGroup = { title: string; cols: (keyof SectionRow)[] }

export const TABLE_HEADER_GROUPS: TableHeaderGroup[] = [
  { title: 'Section\nDesignation', cols: ['designation'] },
  { title: 'Dimensions', cols: ['h', 'b', 'tw', 'tf', 'r', 't', 's'] },
  { title: 'Mass &\nArea', cols: ['mass', 'A'] },
  { title: 'Second Moment\nof Area', cols: ['Ix', 'Iy'] },
  { title: 'Radius of\nGyration', cols: ['ix', 'iy'] },
  { title: 'Elastic\nModulus', cols: ['Wx', 'Wy'] },
  { title: 'Plastic\nModulus', cols: ['Zx', 'Zy'] },
  { title: 'Principal Axis\nSecond Moment', cols: ['Iu', 'Iv'] },
  { title: 'Principal Axis\nRadius', cols: ['iu', 'iv'] },
  { title: 'Principal Axis\nElastic Modulus', cols: ['Wu', 'Wv'] },
  { title: 'Buckling\nParameter', cols: ['U'] },
  { title: 'Torsional\nIndex', cols: ['X'] },
  { title: 'Warping\nConstant', cols: ['Cw', 'Iw'] },
  { title: 'Torsional\nConstant', cols: ['J'] },
  { title: 'Torsional\nModulus', cols: ['Wt'] },
  { title: 'Buckling\nFactors', cols: ['phiMin', 'phiMax', 'vs', 'tanA'] },
  { title: 'Centroid', cols: ['cy', 'cz', 'e0', 'y0'] },
  { title: 'Surface\nArea', cols: ['surfacePerM', 'surfacePerTonne'] },
]

// Rendered column label with proper subscripts (JSX)
export const COL_LABEL: Partial<Record<keyof SectionRow, React.ReactNode>> = {
  mass: 'mass',
  h: 'h', b: 'b',
  tw: <span>t<sub>w</sub></span>,
  tf: <span>t<sub>f</sub></span>,
  r:  'r',
  t:  't',
  A:  'A',
  Ix: <span>I<sub>y</sub></span>,
  Iy: <span>I<sub>z</sub></span>,
  Wx: <span>W<sub>el,y</sub></span>,
  Wy: <span>W<sub>el,z</sub></span>,
  Zx: <span>W<sub>pl,y</sub></span>,
  Zy: <span>W<sub>pl,z</sub></span>,
  ix: <span>i<sub>y</sub></span>,
  iy: <span>i<sub>z</sub></span>,
  J:  <span>I<sub>t</sub></span>,
  Cw: <span>I<sub>w</sub></span>,
  Wt: <span>W<sub>t</sub></span>,
  surfacePerM:     <span>SA/m</span>,
  surfacePerTonne: <span>SA/t</span>,
  U:  'u',
  X:  'X',
  Iw: <span>I<sub>w</sub></span>,
  e0: <span>e<sub>0</sub></span>,
  y0: <span>y<sub>0</sub></span>,
  s:  's',
  Iu: <span>I<sub>u</sub></span>,
  Iv: <span>I<sub>v</sub></span>,
  iu: <span>i<sub>u</sub></span>,
  iv: <span>i<sub>v</sub></span>,
  Wu: <span>W<sub>el,u</sub></span>,
  Wv: <span>W<sub>el,v</sub></span>,
  vs: <span>v<sub>s</sub></span>,
  tanA:   <span>tan α</span>,
  phiMin: <span>φ<sub>min</sub></span>,
  phiMax: <span>φ<sub>max</sub></span>,
  cy: <span>c<sub>y</sub></span>,
  cz: <span>c<sub>z</sub></span>,
}
