'use client'
import { useTranslation } from '@/app/i18n/LanguageContext'
import { EcTabBar, EcTab, TAB_ICONS } from '../_ec/_shared/ec-tab-bar'
import EcOverview from '../_ec/ec1/EcOverview'
import EcReference from '../_ec/ec1/Ec1Reference'
import PdfLibrary from '../_pdf/PdfLibrary'
import NaPanel, { NaCountry } from '../_ec/_shared/NaPanel'

// ── Legacy "Eurocode" overview tab — kept for backwards compatibility ────────────
const NA_COUNTRIES: NaCountry[] = [
  {
    id: 'sg', name: 'Singapore', prefix: 'SS EN',
    sections: [
      { id: 'sg-ec1-1-1', code: 'SS EN 1991-1-1', label: 'Densities, self-weight, imposed loads', items: [] },
      { id: 'sg-ec1-1-4', code: 'SS EN 1991-1-4', label: 'Wind actions', items: [] },
    ],
  },
]

export default function EurocodeTab({ isAdmin, subTab, section, calc, pageKey, accentColor, onNavChange, onNavTo }: {
  isAdmin: boolean
  subTab: string
  section: string
  calc: string
  pageKey: string
  accentColor: string
  onNavChange: (key: string, val: string) => void
  onNavTo: (params: Record<string, string>) => void
}) {
  const { t } = useTranslation()

  const tabs: EcTab[] = [
    { id: 'overview',  label: t('std_subtab_overview'), icon: TAB_ICONS.overview  },
    { id: 'reference', label: t('std_subtab_ref_ec'),   icon: TAB_ICONS.reference },
    { id: 'standards', label: t('std_subtab_pdfs_ec'),  icon: TAB_ICONS.standards },
    { id: 'na',        label: t('std_subtab_na'),       icon: TAB_ICONS.na        },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      <EcTabBar
        tabs={tabs} active={subTab} accentColor={accentColor}
        onChange={id => onNavChange('sub', id)}
      />
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {subTab === 'overview' && (
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <EcOverview pageKey={pageKey} onNavTo={onNavTo} />
          </div>
        )}
        {subTab === 'reference' && (
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <EcReference section={section} calc={calc} pageKey={pageKey} onNavChange={onNavChange} />
          </div>
        )}
        {subTab === 'standards' && (
          <PdfLibrary type="eurocode" accentColor={accentColor} isAdmin={isAdmin} pageKey={pageKey} />
        )}
        {subTab === 'na' && (
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <NaPanel countries={NA_COUNTRIES} accentColor={accentColor} accentBg="#f0f9ff" accentHover="#7dd3fc" section={section} pageKey={pageKey} onNavChange={onNavChange} />
          </div>
        )}
      </div>
    </div>
  )
}
