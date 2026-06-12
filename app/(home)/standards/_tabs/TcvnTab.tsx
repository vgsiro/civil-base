'use client'
import { useTranslation } from '@/app/i18n/LanguageContext'
import { EcTabBar, EcTab, TAB_ICONS } from '../_ec/_shared/ec-tab-bar'
import TcvnReference from '../_tcvn/TcvnReference'
import PdfLibrary from '../_pdf/PdfLibrary'
import NaPanel, { NaCountry } from '../_ec/_shared/NaPanel'

// ── National Annex countries for TCVN — add entries as data becomes available ──
const NA_COUNTRIES: NaCountry[] = [
  {
    id: 'sg', name: 'Singapore', prefix: 'SS EN',
    sections: [
      { id: 'sg-ec1-1-1', code: 'SS EN 1991-1-1', label: 'Densities, self-weight, imposed loads', items: [] },
      { id: 'sg-ec1-1-4', code: 'SS EN 1991-1-4', label: 'Wind actions', items: [] },
    ],
  },
]

export default function TcvnTab({ isAdmin, subTab, section, pageKey, onNavChange }: {
  isAdmin: boolean
  subTab: string
  section: string
  pageKey: string
  onNavChange: (key: string, val: string) => void
}) {
  const { t } = useTranslation()

  const tabs: EcTab[] = [
    { id: 'reference', label: t('std_subtab_ref_tcvn'),  icon: TAB_ICONS.reference },
    { id: 'standards', label: t('std_subtab_pdfs_tcvn'), icon: TAB_ICONS.standards },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      <EcTabBar
        tabs={tabs} active={subTab} accentColor="#f59e0b"
        onChange={id => onNavChange('sub', id)}
      />
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {subTab === 'reference' && (
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <TcvnReference section={section} pageKey={pageKey} onNavChange={onNavChange} />
          </div>
        )}
        {subTab === 'standards' && (
          <PdfLibrary type="tcvn" accentColor="#f59e0b" isAdmin={isAdmin} pageKey={pageKey} />
        )}
      </div>
    </div>
  )
}
