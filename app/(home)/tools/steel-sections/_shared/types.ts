// Shared types for all steel section types (UB/UC, hollow, etc.)

export interface SectionRow {
  designation: string
  mass:  number   // kg/m
  h:     number   // mm — overall depth
  b:     number   // mm — overall width
  tw:    number   // mm — web thickness
  tf:    number   // mm — flange thickness
  r:     number   // mm — root radius
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
  Cw:    number   // dm⁶ — warping constant
}

export interface SectionType {
  id:         string
  label:      string
  shortLabel: string
  ref:        string
  rows:       SectionRow[]
}
