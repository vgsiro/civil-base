'use client'
import { useState } from 'react'
import { useTranslation } from '@/app/i18n/LanguageContext'
import { EcTabBar, EcTab, TAB_ICONS } from '../_ec/_shared/ec-tab-bar'
import { AdminEditToggle } from '../_ec/_shared/admin/AdminSaveBar'
import Ec2Overview from '../_ec/ec2/overview/Ec2Overview'
import Ec2Reference from '../_ec/ec2/Ec2Reference'
import Ec2TablesPanel from '../_ec/ec2/tables/Ec2TablesPanel'
import PdfLibrary from '../_pdf/PdfLibrary'
import Ec2NaPanel from '../_ec/ec2/na/Ec2NaPanel'

export default function Ec2Tab({ isAdmin, subTab, section, pageKey, onNavChange, onNavTo }: {
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
        tabs={tabs} active={subTab} accentColor="#10b981"
        onChange={id => { onNavChange('sub', id); setEditMode(false) }}
        rightSlot={isAdmin ? <AdminEditToggle editMode={editMode} onToggle={() => setEditMode(m => !m)} /> : undefined}
      />
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {subTab === 'overview' && (
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <Ec2Overview pageKey={pageKey} onNavTo={onNavTo} editMode={editMode} onEditDone={() => setEditMode(false)} />
          </div>
        )}
        {subTab === 'reference' && (
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Ec2Reference section={section} pageKey={pageKey} onNavChange={onNavChange} />
          </div>
        )}
        {subTab === 'tables' && (
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <Ec2TablesPanel section={section} pageKey={pageKey} onNavChange={onNavChange} editMode={editMode} onEditDone={() => setEditMode(false)} />
          </div>
        )}
        {subTab === 'standards' && (
          <PdfLibrary type="eurocode" accentColor="#10b981" isAdmin={isAdmin} pageKey={pageKey} />
        )}
        {subTab === 'na' && (
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <Ec2NaPanel section={section} pageKey={pageKey} onNavChange={onNavChange} />
          </div>
        )}
      </div>
    </div>
  )
}
