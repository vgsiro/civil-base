import { SHS_SECTIONS } from '../../data/shs'
import { RHS_SECTIONS } from '../../data/rhs'
import { CHS_SECTIONS } from '../../data/chs'
import { EHS_SECTIONS } from '../../data/ehs'
import type { SectionType } from '../../_shared/types'
import {
  HOLLOW_VISIBLE_COLS, HOLLOW_COLUMN_GROUPS,
  CHS_VISIBLE_COLS, CHS_COLUMN_GROUPS,
} from '../../_shared/column-meta'

export const HOLLOW_SECTION_TYPES: SectionType[] = [
  {
    id: 'shs',
    label: 'Square Hollow Sections — Hot-finished (BS EN 10210)',
    shortLabel: 'SHS Hot-finished',
    ref: 'BS EN 10210-2:2006',
    family: 'hollow',
    rows: SHS_SECTIONS,
    visibleCols:  HOLLOW_VISIBLE_COLS,
    columnGroups: HOLLOW_COLUMN_GROUPS,
  },
  {
    id: 'rhs',
    label: 'Rectangular Hollow Sections — Hot-finished (BS EN 10210)',
    shortLabel: 'RHS Hot-finished',
    ref: 'BS EN 10210-2:2006',
    family: 'hollow',
    rows: RHS_SECTIONS,
    visibleCols:  HOLLOW_VISIBLE_COLS,
    columnGroups: HOLLOW_COLUMN_GROUPS,
  },
  {
    id: 'chs',
    label: 'Circular Hollow Sections — Hot-finished (BS EN 10210)',
    shortLabel: 'CHS Hot-finished',
    ref: 'BS EN 10210-2:2006',
    family: 'hollow',
    rows: CHS_SECTIONS,
    visibleCols:  CHS_VISIBLE_COLS,
    columnGroups: CHS_COLUMN_GROUPS,
  },
  {
    id: 'ehs',
    label: 'Elliptical Hollow Sections — Hot-finished (BS EN 10210)',
    shortLabel: 'EHS Hot-finished',
    ref: 'BS EN 10210-2:2006',
    family: 'hollow',
    rows: EHS_SECTIONS,
    visibleCols:  HOLLOW_VISIBLE_COLS,
    columnGroups: HOLLOW_COLUMN_GROUPS,
  },
]

export const ALL_HOLLOW_ROWS = HOLLOW_SECTION_TYPES.flatMap(st => st.rows)
