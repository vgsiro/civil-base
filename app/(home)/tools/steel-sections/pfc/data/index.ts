import { PFC_SECTIONS } from '../../data/pfc'
import { PFC_LACED_SECTIONS } from '../../data/pfc-laced'
import { PFC_BTB_SECTIONS } from '../../data/pfc-btb'
import type { SectionType } from '../../_shared/types'
import {
  PFC_VISIBLE_COLS, PFC_COLUMN_GROUPS,
  PFC_PAIRED_VISIBLE_COLS, PFC_PAIRED_COLUMN_GROUPS,
} from '../../_shared/column-meta'

export const PFC_SECTION_TYPES: SectionType[] = [
  {
    id: 'pfc',
    label: 'Parallel Flange Channels (PFC)',
    shortLabel: 'PFC',
    ref: 'BS EN 1993-1-1:2005 / BS 4-1:2005',
    family: 'pfc',
    rows: PFC_SECTIONS,
    visibleCols:  PFC_VISIBLE_COLS,
    columnGroups: PFC_COLUMN_GROUPS,
  },
  {
    id: 'pfc-laced',
    label: 'Two PFC — Laced',
    shortLabel: 'PFC Laced',
    ref: 'BS EN 1993-1-1:2005 / BS 4-1:2005',
    family: 'pfc',
    rows: PFC_LACED_SECTIONS,
    visibleCols:  PFC_PAIRED_VISIBLE_COLS,
    columnGroups: PFC_PAIRED_COLUMN_GROUPS,
  },
  {
    id: 'pfc-btb',
    label: 'Two PFC — Back to Back',
    shortLabel: 'PFC Back to Back',
    ref: 'BS EN 1993-1-1:2005 / BS 4-1:2005',
    family: 'pfc',
    rows: PFC_BTB_SECTIONS,
    visibleCols:  PFC_PAIRED_VISIBLE_COLS,
    columnGroups: PFC_PAIRED_COLUMN_GROUPS,
  },
]

export const ALL_PFC_ROWS = PFC_SECTION_TYPES.flatMap(st => st.rows)
