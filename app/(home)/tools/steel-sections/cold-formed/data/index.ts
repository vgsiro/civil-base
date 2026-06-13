import { SHS_CF_SECTIONS } from '../../data/shs-cf'
import { RHS_CF_SECTIONS } from '../../data/rhs-cf'
import { CHS_CF_SECTIONS } from '../../data/chs-cf'
import type { SectionType } from '../../_shared/types'
import { CHS_VISIBLE_COLS, CHS_COLUMN_GROUPS } from '../../_shared/column-meta'

export const COLD_FORMED_SECTION_TYPES: SectionType[] = [
  {
    id: 'shs-cf',
    label: 'Square Hollow Sections — Cold-formed (BS EN 10219)',
    shortLabel: 'SHS Cold-formed',
    ref: 'BS EN 10219-2:2006',
    family: 'cold-formed',
    rows: SHS_CF_SECTIONS,
  },
  {
    id: 'rhs-cf',
    label: 'Rectangular Hollow Sections — Cold-formed (BS EN 10219)',
    shortLabel: 'RHS Cold-formed',
    ref: 'BS EN 10219-2:2006',
    family: 'cold-formed',
    rows: RHS_CF_SECTIONS,
  },
  {
    id: 'chs-cf',
    label: 'Circular Hollow Sections — Cold-formed (BS EN 10219)',
    shortLabel: 'CHS Cold-formed',
    ref: 'BS EN 10219-2:2006',
    family: 'cold-formed',
    rows: CHS_CF_SECTIONS,
    visibleCols:  CHS_VISIBLE_COLS,
    columnGroups: CHS_COLUMN_GROUPS,
  },
]

export const ALL_COLD_FORMED_ROWS = COLD_FORMED_SECTION_TYPES.flatMap(st => st.rows)
