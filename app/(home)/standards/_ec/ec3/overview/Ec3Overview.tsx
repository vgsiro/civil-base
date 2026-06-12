'use client'
import { useTranslation } from '@/app/i18n/LanguageContext'
import { EcOverviewPanel, OverviewPart } from '../../_shared/EcOverviewPanel'

export default function Ec3Overview({ onNavTo, editMode, onEditDone, pageKey }: { onNavTo: (params: Record<string, string>) => void; editMode?: boolean; onEditDone?: () => void; pageKey?: string }) {
  const { t } = useTranslation()
  const parts: OverviewPart[] = [
    { code: 'EN 1993-1-1',  label: t('std_part_ec3_1_1'),  tools: [], tables: [] },
    { code: 'EN 1993-1-2',  label: t('std_part_ec3_1_2'),  tools: [], tables: [] },
    { code: 'EN 1993-1-3',  label: t('std_part_ec3_1_3'),  tools: [], tables: [] },
    { code: 'EN 1993-1-4',  label: t('std_part_ec3_1_4'),  tools: [], tables: [] },
    { code: 'EN 1993-1-5',  label: t('std_part_ec3_1_5'),  tools: [], tables: [] },
    { code: 'EN 1993-1-6',  label: t('std_part_ec3_1_6'),  tools: [], tables: [] },
    { code: 'EN 1993-1-7',  label: t('std_part_ec3_1_7'),  tools: [], tables: [] },
    {
      code: 'EN 1993-1-8',
      label: t('std_part_ec3_1_8'),
      tools:  [{ label: t('std_chip_ec3_bolt'), section: 'bolt_data', sub: 'reference' }],
      tables: [],
    },
    { code: 'EN 1993-1-9',  label: t('std_part_ec3_1_9'),  tools: [], tables: [] },
    { code: 'EN 1993-1-10', label: t('std_part_ec3_1_10'), tools: [], tables: [] },
    { code: 'EN 1993-1-11', label: t('std_part_ec3_1_11'), tools: [], tables: [] },
    { code: 'EN 1993-1-12', label: t('std_part_ec3_1_12'), tools: [], tables: [] },
    { code: 'EN 1993-2',    label: t('std_part_ec3_2'),    tools: [], tables: [] },
    { code: 'EN 1993-3',    label: t('std_part_ec3_3'),    tools: [], tables: [] },
    { code: 'EN 1993-4',    label: t('std_part_ec3_4'),    tools: [], tables: [] },
    { code: 'EN 1993-5',    label: t('std_part_ec3_5'),    tools: [], tables: [] },
    { code: 'EN 1993-6',    label: t('std_part_ec3_6'),    tools: [], tables: [] },
  ]
  return (
    <EcOverviewPanel ec="ec3" defaultParts={parts}
      heading={t('std_overview_ec3_heading')}
      subtitle={t('std_overview_ec3_sub')}
      accentColor="#8b5cf6" pageKey={pageKey} onNavTo={onNavTo} editMode={editMode} onEditDone={onEditDone} />
  )
}
