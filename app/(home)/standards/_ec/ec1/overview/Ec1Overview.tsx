'use client'
import { useTranslation } from '@/app/i18n/LanguageContext'
import { EcOverviewPanel, OverviewPart } from '../../_shared/EcOverviewPanel'

export default function Ec1Overview({ onNavTo, editMode, onEditDone, pageKey }: { onNavTo: (params: Record<string, string>) => void; editMode?: boolean; onEditDone?: () => void; pageKey?: string }) {
  const { t } = useTranslation()
  const parts: OverviewPart[] = [
    { code: 'EN 1991-1-1', label: t('std_part_ec1_1_1'), tools: [], tables: [] },
    { code: 'EN 1991-1-2', label: t('std_part_ec1_1_2'), tools: [], tables: [] },
    { code: 'EN 1991-1-3', label: t('std_part_ec1_1_3'), tools: [], tables: [] },
    {
      code: 'EN 1991-1-4',
      label: t('std_part_ec1_1_4'),
      tools:  [{ label: t('std_chip_ec1_wind_calc'),   section: 'wind',  sub: 'reference' }],
      tables: [{ label: t('std_chip_ec1_wind_tables'), section: 't4-1',  sub: 'tables'    }],
    },
    { code: 'EN 1991-1-5', label: t('std_part_ec1_1_5'), tools: [], tables: [] },
    { code: 'EN 1991-1-6', label: t('std_part_ec1_1_6'), tools: [], tables: [] },
    { code: 'EN 1991-1-7', label: t('std_part_ec1_1_7'), tools: [], tables: [] },
    { code: 'EN 1991-2',   label: t('std_part_ec1_2'),   tools: [], tables: [] },
    { code: 'EN 1991-3',   label: t('std_part_ec1_3'),   tools: [], tables: [] },
    { code: 'EN 1991-4',   label: t('std_part_ec1_4'),   tools: [], tables: [] },
  ]
  return (
    <EcOverviewPanel ec="ec1" defaultParts={parts}
      heading={t('std_overview_ec1_heading')}
      subtitle={t('std_overview_ec1_sub')}
      accentColor="#0ea5e9" pageKey={pageKey} onNavTo={onNavTo} editMode={editMode} onEditDone={onEditDone} />
  )
}
