'use client'
import { useTranslation } from '@/app/i18n/LanguageContext'
import LoadComboGenerator from './tools/load-combo/LoadComboGenerator'
import { ToolGroup } from '../_shared/tool-card-grid'
import EcToolShell from '../_shared/EcToolShell'
import PageDiscussion from '../../../../_components/home/discussion/PageDiscussion'

export default function Ec0Reference({ section, pageKey, onNavChange }: {
  section: string; pageKey?: string; onNavChange: (key: string, val: string) => void
}) {
  const { t } = useTranslation()

  const TOOL_GROUPS: ToolGroup[] = [
    {
      part: 'EN 1990',
      desc: t('std_tool_ec0_part_desc'),
      cards: [
        {
          id: 'combo_gen',
          label: t('std_tool_ec0_combo_label'),
          desc: t('std_tool_ec0_combo_desc'),
          graphic: (
            <svg width="90" height="65" viewBox="0 0 80 55" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="8"  y="8"  width="18" height="8" rx="1.5" fill="rgba(255,255,255,0.25)" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2"/>
              <text x="17" y="15" fontSize="6" fill="rgba(255,255,255,0.9)" fontWeight="700" textAnchor="middle">ULS</text>
              <line x1="26" y1="12" x2="36" y2="12" stroke="rgba(255,255,255,0.6)" strokeWidth="1" strokeDasharray="2 2"/>
              <rect x="36" y="8"  width="14" height="8" rx="1.5" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.6)" strokeWidth="1"/>
              <line x1="50" y1="12" x2="60" y2="12" stroke="rgba(255,255,255,0.6)" strokeWidth="1" strokeDasharray="2 2"/>
              <rect x="60" y="8"  width="14" height="8" rx="1.5" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.6)" strokeWidth="1"/>
              <rect x="8"  y="22" width="18" height="8" rx="1.5" fill="rgba(255,255,255,0.25)" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2"/>
              <text x="17" y="29" fontSize="6" fill="rgba(255,255,255,0.9)" fontWeight="700" textAnchor="middle">SLS</text>
              <line x1="26" y1="26" x2="36" y2="26" stroke="rgba(255,255,255,0.6)" strokeWidth="1" strokeDasharray="2 2"/>
              <rect x="36" y="22" width="14" height="8" rx="1.5" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.6)" strokeWidth="1"/>
              <line x1="50" y1="26" x2="60" y2="26" stroke="rgba(255,255,255,0.6)" strokeWidth="1" strokeDasharray="2 2"/>
              <rect x="60" y="22" width="14" height="8" rx="1.5" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.6)" strokeWidth="1"/>
              <line x1="40" y1="38" x2="40" y2="46" stroke="rgba(255,255,255,0.8)" strokeWidth="1.8" strokeLinecap="round"/>
              <polygon points="40,48 36,44 44,44" fill="rgba(255,255,255,0.8)"/>
            </svg>
          ),
          accent:   '#6366f1',
          gradient: 'linear-gradient(135deg, #3730a3, #6366f1)',
          ref:      'EN 1990',
        },
      ],
    },
  ]

  return (
    <EcToolShell
      title={t('std_ref_ec0_title')}
      subtitle={t('std_ref_ec0_sub')}
      accentColor="#6366f1"
      accentBg="#eef2ff"
      groups={TOOL_GROUPS}
      section={section}
      pageKey={pageKey}
      onNavChange={onNavChange}
    >
      {activeSection => (
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {activeSection === 'combo_gen' && <LoadComboGenerator />}
          {pageKey && <PageDiscussion pageKey={pageKey} />}
        </div>
      )}
    </EcToolShell>
  )
}
