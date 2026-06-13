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
  // PFC-specific extras
  U?:   number   // buckling parameter
  X?:   number   // torsional index
  Iw?:  number   // cm⁶ — warping constant (PFC Blue Book uses cm⁶, not dm⁶)
  e0?:  number   // mm — end clearance (distance from web face to flange tip)
  y0?:  number   // mm — distance from shear centre to centroid
  // Paired PFC extras
  s?:   number   // mm — space between webs / legs (laced / back-to-back configurations)
  // Angle section extras
  Iu?:     number   // cm⁴ — second moment about u-u axis (major principal)
  Iv?:     number   // cm⁴ — second moment about v-v axis (minor principal)
  iu?:     number   // cm  — radius of gyration about u-u
  iv?:     number   // cm  — radius of gyration about v-v
  Wu?:     number   // cm³ — elastic modulus about u-u
  Wv?:     number   // cm³ — elastic modulus about v-v
  vs?:     number   // cm  — monosymmetry index (unequal angles)
  tanA?:   number   // —   — tan α, angle between v-v and z-z axes
  phiMin?: number   // —   — equivalent slenderness coefficient minimum
  phiMax?: number   // —   — equivalent slenderness coefficient maximum
  cy?:     number   // cm  — distance from centroid to back of leg (y-direction)
  cz?:     number   // cm  — distance from centroid to back of leg (z-direction)
}

export type SectionFamily = 'open' | 'hollow' | 'cold-formed' | 'pfc' | 'angle'

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
