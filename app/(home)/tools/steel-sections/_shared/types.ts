// Shared types for all steel section types (UB/UC, hollow, etc.)

export interface SectionRow {
  designation: string
  mass:  number   // kg/m
  h:     number   // mm — overall depth
  b:     number   // mm — overall width
  tw:    number   // mm — web thickness (open sections); 0 for hollow
  tf:    number   // mm — flange thickness (open sections); 0 for hollow
  r:     number   // mm — root radius (open sections); 0 for hollow
  A:     number   // cm²
  Ix:    number   // cm⁴ — second moment major
  Iy:    number   // cm⁴ — second moment minor
  Wx:    number   // cm³ — elastic modulus major
  Wy:    number   // cm³ — elastic modulus minor
  Zx:    number   // cm³ — plastic modulus major
  Zy:    number   // cm³ — plastic modulus minor
  ix:    number   // cm  — radius of gyration major
  iy:    number   // cm  — radius of gyration minor
  J:     number   // cm⁴ — torsion constant
  Cw:    number   // dm⁶ — warping constant (open sections); 0 for hollow
  // Hollow section extras (absent on open sections)
  t?:              number   // mm — wall thickness (SHS/RHS/CHS)
  Wt?:             number   // cm³ — torsion section modulus (SHS/RHS/CHS)
  surfacePerM?:    number   // m²/m — surface area per metre length
  surfacePerTonne?: number  // m²/t — surface area per tonne
}

export type SectionFamily = 'open' | 'hollow' | 'cold-formed'

export interface SectionType {
  id:            string
  label:         string
  shortLabel:    string
  ref:           string
  family:        SectionFamily
  rows:          SectionRow[]
  visibleCols?:  (keyof SectionRow)[]
  columnGroups?: { labelKey: string; cols: (keyof SectionRow)[] }[]
}
