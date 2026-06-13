import React from 'react'
import type { SectionRow } from './types'

// Columns shown in the main scrollable table
export const VISIBLE_COLS: (keyof SectionRow)[] = [
  'mass', 'h', 'b', 'tw', 'tf', 'A', 'Ix', 'Wx', 'Zx', 'Iy', 'Wy', 'Zy',
]

// Groups shown in the expanded detail card
export const COLUMN_GROUPS: { labelKey: string; cols: (keyof SectionRow)[] }[] = [
  { labelKey: 'bb_grp_dimensions', cols: ['h', 'b', 'tw', 'tf', 'r'] },
  { labelKey: 'bb_grp_mass_area',  cols: ['mass', 'A'] },
  { labelKey: 'bb_grp_major_axis', cols: ['Ix', 'Wx', 'Zx', 'ix'] },
  { labelKey: 'bb_grp_minor_axis', cols: ['Iy', 'Wy', 'Zy', 'iy'] },
  { labelKey: 'bb_grp_torsion',    cols: ['J', 'Cw'] },
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
}

// Symbol prefix shown before the translated description in the tooltip popup
export const COL_TIP_SYMBOL: Partial<Record<keyof SectionRow, string>> = {
  Ix: '$I_x$ — ', Iy: '$I_y$ — ',
  Wx: '$W_{el,x}$ — ', Wy: '$W_{el,y}$ — ',
  Zx: '$W_{pl,x}$ — ', Zy: '$W_{pl,y}$ — ',
  ix: '$i_x$ — ',      iy: '$i_y$ — ',
  J:  '$I_t$ — ',      Cw: '$I_w$ — ',
  Wt: '$W_t$ — ',
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
  'mass', 't', 'A', 'Ix', 'Wx', 'Zx', 'Iy', 'Wy', 'Zy', 'surfacePerM', 'surfacePerTonne',
]

export const HOLLOW_COLUMN_GROUPS: { labelKey: string; cols: (keyof SectionRow)[] }[] = [
  { labelKey: 'bb_grp_dimensions',    cols: ['h', 'b', 't'] },
  { labelKey: 'bb_grp_mass_area',     cols: ['mass', 'A'] },
  { labelKey: 'bb_grp_major_axis',    cols: ['Ix', 'Wx', 'Zx', 'ix'] },
  { labelKey: 'bb_grp_minor_axis',    cols: ['Iy', 'Wy', 'Zy', 'iy'] },
  { labelKey: 'bb_grp_torsion',       cols: ['J', 'Wt'] },
  { labelKey: 'bb_grp_surface',       cols: ['surfacePerM', 'surfacePerTonne'] },
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
  Ix: <span>I<sub>x</sub></span>,
  Iy: <span>I<sub>y</sub></span>,
  Wx: <span>W<sub>el,x</sub></span>,
  Wy: <span>W<sub>el,y</sub></span>,
  Zx: <span>W<sub>pl,x</sub></span>,
  Zy: <span>W<sub>pl,y</sub></span>,
  ix: <span>i<sub>x</sub></span>,
  iy: <span>i<sub>y</sub></span>,
  J:  <span>I<sub>t</sub></span>,
  Cw: <span>I<sub>w</sub></span>,
  Wt: <span>W<sub>t</sub></span>,
  surfacePerM:     <span>SA/m</span>,
  surfacePerTonne: <span>SA/t</span>,
}
