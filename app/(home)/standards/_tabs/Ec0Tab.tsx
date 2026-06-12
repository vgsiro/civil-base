'use client'
import { useState } from 'react'
import { useTranslation } from '@/app/i18n/LanguageContext'
import { EcTabBar, EcTab, TAB_ICONS } from '../_ec/_shared/ec-tab-bar'
import { AdminEditToggle } from '../_ec/_shared/admin/AdminSaveBar'
import Ec0Overview from '../_ec/ec0/overview/Ec0Overview'
import Ec0Reference from '../_ec/ec0/Ec0Reference'
import Ec0TablesPanel from '../_ec/ec0/tables/Ec0TablesPanel'
import PdfLibrary from '../_pdf/PdfLibrary'
import Ec0NaPanel from '../_ec/ec0/na/Ec0NaPanel'

export default function Ec0Tab({ isAdmin, subTab, section, pageKey, onNavChange, onNavTo }: {
  isAdmin: boolean
  subTab: string
  section: string
  pageKey: string
  onNavChange: (key: string, val: string) => void
  onNavTo: (params: Record<string, string>) => void
}) {
  const { t } = useTranslation()
  const [editMode, setEditMode] = useState(false)

  const tabs: EcTab[] = [
    { id: 'overview',  label: t('std_subtab_overview'),  icon: TAB_ICONS.overview  },
    { id: 'reference', label: t('std_subtab_ref_ec'),    icon: TAB_ICONS.reference },
    { id: 'tables',    label: t('std_subtab_tables'),    icon: TAB_ICONS.tables    },
    { id: 'standards', label: t('std_subtab_pdfs_ec'),   icon: TAB_ICONS.standards },
    { id: 'na',        label: t('std_subtab_na'),        icon: TAB_ICONS.na        },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      <EcTabBar
        tabs={tabs} active={subTab} accentColor="#6366f1"
        onChange={id => { onNavChange('sub', id); setEditMode(false) }}
        rightSlot={isAdmin ? <AdminEditToggle editMode={editMode} onToggle={() => setEditMode(m => !m)} /> : undefined}
      />
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {subTab === 'overview' && (
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <Ec0Overview pageKey={pageKey} onNavTo={onNavTo} editMode={editMode} onEditDone={() => setEditMode(false)} />
          </div>
        )}
        {subTab === 'reference' && (
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <Ec0Reference section={section} pageKey={pageKey} onNavChange={onNavChange} />
          </div>
        )}
        {subTab === 'tables' && (
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <Ec0TablesPanel section={section} pageKey={pageKey} onNavChange={onNavChange} editMode={editMode} onEditDone={() => setEditMode(false)} />
          </div>
        )}
        {subTab === 'standards' && (
          <PdfLibrary type="eurocode" accentColor="#6366f1" isAdmin={isAdmin} pageKey={pageKey} />
        )}
        {subTab === 'na' && (
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <Ec0NaPanel section={section} pageKey={pageKey} onNavChange={onNavChange} />
          </div>
        )}
      </div>
    </div>
  )
}
