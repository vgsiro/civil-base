'use client'
import { useTranslation } from '@/app/i18n/LanguageContext'
import Ec2RectCalc from './tools/rect-section-check/Ec2RectCalc'
import { ToolGroup } from '../_shared/tool-card-grid'
import EcToolShell from '../_shared/EcToolShell'
import PageDiscussion from '../../../../_components/home/discussion/PageDiscussion'

export default function Ec2Reference({ section, pageKey, onNavChange }: {
  section: string; pageKey?: string; onNavChange: (key: string, val: string) => void
}) {
  const { t } = useTranslation()

  const TOOL_GROUPS: ToolGroup[] = [
    {
      part: 'EN 1992-1-1',
      desc: t('std_tool_ec2_part_desc'),
      cards: [
        {
          id: 'rect_section',
          label: t('std_tool_ec2_rect_label'),
          desc: t('std_tool_ec2_rect_desc'),
          graphic: (
            <svg width="90" height="65" viewBox="0 0 60 44" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="4" y="4" width="52" height="36" rx="2" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.9)" strokeWidth="2"/>
              {[12, 21, 30, 39, 48].map(cx => <circle key={cx} cx={cx} cy="12" r="3.2" fill="rgba(255,255,255,0.9)" />)}
              {[12, 21, 30, 39, 48].map(cx => <circle key={cx} cx={cx} cy="32" r="3.2" fill="rgba(255,255,255,0.9)" />)}
              <line x1="6" y1="22" x2="54" y2="22" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeDasharray="4 3"/>
            </svg>
          ),
          accent:   '#10b981',
          gradient: 'linear-gradient(135deg, #047857, #10b981)',
          ref:      'EN 1992-1-1 §6.1',
        },
      ],
    },
  ]

  return (
    <EcToolShell
      title={t('std_ref_ec2_title')}
      subtitle={t('std_ref_ec2_sub')}
      accentColor="#10b981"
      accentBg="#ecfdf5"
      groups={TOOL_GROUPS}
      section={section}
      pageKey={pageKey}
      onNavChange={onNavChange}
    >
      {activeSection => (
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {activeSection === 'rect_section' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
                <Ec2RectCalc onBack={() => onNavChange('section', 'tools')} />
              </div>
              {pageKey && <PageDiscussion pageKey={pageKey} />}
            </>
          )}
        </div>
      )}
    </EcToolShell>
  )
}
