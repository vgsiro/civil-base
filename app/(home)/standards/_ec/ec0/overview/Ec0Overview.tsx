'use client'
import { useTranslation } from '@/app/i18n/LanguageContext'
import { EcOverviewPanel, OverviewPart } from '../../_shared/EcOverviewPanel'

export default function Ec0Overview({ onNavTo, editMode, onEditDone, pageKey }: { onNavTo: (params: Record<string, string>) => void; editMode?: boolean; onEditDone?: () => void; pageKey?: string }) {
  const { t } = useTranslation()
  const parts: OverviewPart[] = [
    {
      code: 'EN 1990',
      label: t('std_part_ec0_basis'),
      tools:  [{ label: t('std_chip_ec0_load'),    section: 'load',          sub: 'reference' }],
      tables: [{ label: t('std_chip_ec0_psi'),     section: 'psi_factors',   sub: 'tables'    }],
    },
    {
      code: 'EN 1990 Annex A1',
      label: t('std_part_ec0_a1'),
      tools:  [{ label: t('std_chip_ec0_load'),    section: 'load',          sub: 'reference' }],
      tables: [{ label: t('std_chip_ec0_partial'), section: 'partial_factors', sub: 'tables' }],
    },
    {
      code: 'EN 1990 Annex A2',
      label: t('std_part_ec0_a2'),
      tools: [],
      tables: [],
    },
  ]
  return (
    <EcOverviewPanel ec="ec0" defaultParts={parts}
      heading={t('std_overview_ec0_heading')}
      subtitle={t('std_overview_ec0_sub')}
      accentColor="#6366f1" pageKey={pageKey} onNavTo={onNavTo} editMode={editMode} onEditDone={onEditDone} />
  )
}
