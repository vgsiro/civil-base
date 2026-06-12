'use client'
import { useTranslation } from '@/app/i18n/LanguageContext'
import { EcOverviewPanel, OverviewPart } from '../../_shared/EcOverviewPanel'

export default function Ec2Overview({ onNavTo, editMode, onEditDone, pageKey }: { onNavTo: (params: Record<string, string>) => void; editMode?: boolean; onEditDone?: () => void; pageKey?: string }) {
  const { t } = useTranslation()
  const parts: OverviewPart[] = [
    {
      code: 'EN 1992-1-1',
      label: t('std_part_ec2_1_1'),
      tools: [],
      tables: [
        { label: t('std_chip_ec2_concrete'),  section: 'concrete_props', sub: 'tables' },
        { label: t('std_chip_ec2_anchorage'), section: 'anchorage',      sub: 'tables' },
        { label: t('std_chip_ec2_rebar'),     section: 'rebar_qty',      sub: 'tables' },
      ],
    },
    { code: 'EN 1992-1-2', label: t('std_part_ec2_1_2'), tools: [], tables: [] },
    { code: 'EN 1992-2',   label: t('std_part_ec2_2'),   tools: [], tables: [] },
    { code: 'EN 1992-3',   label: t('std_part_ec2_3'),   tools: [], tables: [] },
  ]
  return (
    <EcOverviewPanel ec="ec2" defaultParts={parts}
      heading={t('std_overview_ec2_heading')}
      subtitle={t('std_overview_ec2_sub')}
      accentColor="#10b981" pageKey={pageKey} onNavTo={onNavTo} editMode={editMode} onEditDone={onEditDone} />
  )
}
