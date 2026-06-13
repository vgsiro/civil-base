import { EA_SECTIONS } from '../../data/ea'
import { UA_SECTIONS } from '../../data/ua'
import { EA_BTB_SECTIONS } from '../../data/ea-btb'
import { UA_BTB_SECTIONS } from '../../data/ua-btb'
import type { SectionType } from '../../_shared/types'
import {
  ANGLE_VISIBLE_COLS, ANGLE_COLUMN_GROUPS,
  ANGLE_BTB_VISIBLE_COLS, ANGLE_BTB_COLUMN_GROUPS,
} from '../../_shared/column-meta'

export const ANGLE_SECTION_TYPES: SectionType[] = [
  {
    id: 'ea',
    label: 'Equal Angles (EA)',
    shortLabel: 'EA',
    ref: 'BS EN 1993-1-1:2005 / BS EN 10056-1:1999',
    family: 'angle',
    rows: EA_SECTIONS,
    visibleCols:  ANGLE_VISIBLE_COLS,
    columnGroups: ANGLE_COLUMN_GROUPS,
  },
  {
    id: 'ua',
    label: 'Unequal Angles (UA)',
    shortLabel: 'UA',
    ref: 'BS EN 1993-1-1:2005 / BS EN 10056-1:1999',
    family: 'angle',
    rows: UA_SECTIONS,
    visibleCols:  ANGLE_VISIBLE_COLS,
    columnGroups: ANGLE_COLUMN_GROUPS,
  },
  {
    id: 'ea-btb',
    label: 'Equal Angles — Back to Back',
    shortLabel: 'EA Back to Back',
    ref: 'BS EN 1993-1-1:2005 / BS EN 10056-1:1999',
    family: 'angle',
    rows: EA_BTB_SECTIONS,
    visibleCols:  ANGLE_BTB_VISIBLE_COLS,
    columnGroups: ANGLE_BTB_COLUMN_GROUPS,
  },
  {
    id: 'ua-btb',
    label: 'Unequal Angles — Back to Back',
    shortLabel: 'UA Back to Back',
    ref: 'BS EN 1993-1-1:2005 / BS EN 10056-1:1999',
    family: 'angle',
    rows: UA_BTB_SECTIONS,
    visibleCols:  ANGLE_BTB_VISIBLE_COLS,
    columnGroups: ANGLE_BTB_COLUMN_GROUPS,
  },
]

export const ALL_ANGLE_ROWS = ANGLE_SECTION_TYPES.flatMap(st => st.rows)
