export interface SectionRow {
  designation: string
  mass: number   // kg/m
  h: number      // overall depth mm
  b: number      // overall width mm
  tw: number     // web thickness mm
  tf: number     // flange thickness mm
  r: number      // root radius mm
  A: number      // area cm²
  Ix: number     // cm⁴
  Iy: number     // cm⁴
  Wx: number     // elastic modulus major cm³
  Wy: number     // elastic modulus minor cm³
  Zx: number     // plastic modulus major cm³
  Zy: number     // plastic modulus minor cm³
  ix: number     // radius of gyration major cm
  iy: number     // radius of gyration minor cm
  J: number      // torsion constant cm⁴
  Cw: number     // warping constant dm⁶
}

export interface SectionType {
  id: string
  label: string
  shortLabel: string
  ref: string
  rows: SectionRow[]
}

export { UB_SECTIONS } from './ub'
export { UC_SECTIONS } from './uc'

import { UB_SECTIONS } from './ub'
import { UC_SECTIONS } from './uc'

export const ALL_SECTION_TYPES: SectionType[] = [
  {
    id: 'ub',
    label: 'Universal Beams (UB)',
    shortLabel: 'UB',
    ref: 'BS EN 10365:2017',
    rows: UB_SECTIONS,
  },
  {
    id: 'uc',
    label: 'Universal Columns (UC)',
    shortLabel: 'UC',
    ref: 'BS EN 10365:2017',
    rows: UC_SECTIONS,
  },
]

export const COLUMN_GROUPS: { label: string; cols: (keyof SectionRow)[] }[] = [
  { label: 'Dimensions',    cols: ['h', 'b', 'tw', 'tf', 'r'] },
  { label: 'Mass & Area',   cols: ['mass', 'A'] },
  { label: 'Major axis',    cols: ['Ix', 'Wx', 'Zx', 'ix'] },
  { label: 'Minor axis',    cols: ['Iy', 'Wy', 'Zy', 'iy'] },
  { label: 'Torsion',       cols: ['J', 'Cw'] },
]

export const COLUMN_UNITS: Record<keyof SectionRow, string> = {
  designation: '',
  mass: 'kg/m',
  h: 'mm', b: 'mm', tw: 'mm', tf: 'mm', r: 'mm',
  A: 'cm²',
  Ix: 'cm⁴', Iy: 'cm⁴',
  Wx: 'cm³', Wy: 'cm³',
  Zx: 'cm³', Zy: 'cm³',
  ix: 'cm',  iy: 'cm',
  J: 'cm⁴',  Cw: 'dm⁶',
}
