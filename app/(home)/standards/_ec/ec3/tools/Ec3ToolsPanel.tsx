'use client'
import BoltData from './bolt-data/BoltData'
import { ToolGroup } from '../../_shared/tool-card-grid'
import EcToolShell from '../../_shared/EcToolShell'
import { useTranslation } from '@/app/i18n/LanguageContext'

export default function Ec3ToolsPanel({ section, pageKey, onNavChange }: {
  section?: string
  pageKey?: string
  onNavChange?: (key: string, val: string) => void
}) {
  const { t } = useTranslation()

  const TOOL_GROUPS: ToolGroup[] = [
    {
      part: 'EN 1993-1-8',
      desc: t('std_tool_ec3_part_desc'),
      cards: [
        {
          id: 'bolt_data',
          label: t('std_tool_ec3_bolt_label'),
          desc: t('std_tool_ec3_bolt_desc'),
          graphic: (
            <svg width="90" height="65" viewBox="0 0 90 65" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="38" y="10" width="14" height="45" rx="2" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5"/>
              <rect x="30" y="6" width="30" height="10" rx="2" fill="rgba(255,255,255,0.85)"/>
              <rect x="30" y="49" width="30" height="10" rx="2" fill="rgba(255,255,255,0.85)"/>
              <rect x="12" y="20" width="66" height="10" rx="1.5" fill="rgba(255,255,255,0.35)" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2"/>
              <rect x="12" y="35" width="66" height="10" rx="1.5" fill="rgba(255,255,255,0.35)" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2"/>
            </svg>
          ),
          accent:   '#8b5cf6',
          gradient: 'linear-gradient(135deg, #4c1d95, #8b5cf6)',
          ref:      'EN 1993-1-8 §3',
        },
      ],
    },
  ]

  return (
    <EcToolShell
      title={t('std_ref_ec3_title')}
      subtitle={t('std_ref_ec3_sub')}
      accentColor="#8b5cf6"
      accentBg="#f5f3ff"
      groups={TOOL_GROUPS}
      section={section}
      pageKey={pageKey}
      onNavChange={onNavChange}
    >
      {activeSection => (
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {activeSection === 'bolt_data' && <BoltData />}
        </div>
      )}
    </EcToolShell>
  )
}
