import { UB_SECTIONS } from '../../data/ub'
import { UC_SECTIONS } from '../../data/uc'
import { UBP_SECTIONS } from '../../data/ubp'
import type { SectionType } from '../../_shared/types'

export const UB_UC_SECTION_TYPES: SectionType[] = [
  {
    id: 'ub',
    label: 'Universal Beams (UB)',
    shortLabel: 'UB',
    ref: 'BS EN 10365:2017',
    family: 'open',
    rows: UB_SECTIONS,
  },
  {
    id: 'uc',
    label: 'Universal Columns (UC)',
    shortLabel: 'UC',
    ref: 'BS EN 10365:2017',
    family: 'open',
    rows: UC_SECTIONS,
  },
  {
    id: 'ubp',
    label: 'Universal Bearing Piles (UBP)',
    shortLabel: 'UBP',
    ref: 'BS EN 10365:2017',
    family: 'open',
    rows: UBP_SECTIONS,
  },
]

export const ALL_UB_UC_ROWS = UB_UC_SECTION_TYPES.flatMap(st => st.rows)
