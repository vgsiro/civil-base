'use client'
import { useTranslation } from '@/app/i18n/LanguageContext'
import PageDiscussion from '../../../../_components/home/discussion/PageDiscussion'
import { Table, TR } from '../../_lib/ui'
import { TH, TD, TDL } from '../../_lib/ui-styles'
import WindCalc from './tools/wind/WindCalc'
import WindTables from './tools/wind/WindTables'
import { ToolGroup } from '../_shared/tool-card-grid'
import EcToolShell from '../_shared/EcToolShell'

export default function Ec1Reference({ section, calc, pageKey, onNavChange }: {
  section: string; calc: string; pageKey?: string; onNavChange: (key: string, val: string) => void
}) {
  const { t } = useTranslation()

  const EC1_PARTS = [
    { code: 'EN 1991-1-1', label: t('std_part_ec1_1_1') },
    { code: 'EN 1991-1-2', label: t('std_part_ec1_1_2') },
    { code: 'EN 1991-1-3', label: t('std_part_ec1_1_3') },
    { code: 'EN 1991-1-4', label: t('std_part_ec1_1_4') },
    { code: 'EN 1991-1-5', label: t('std_part_ec1_1_5') },
    { code: 'EN 1991-1-6', label: t('std_part_ec1_1_6') },
    { code: 'EN 1991-1-7', label: t('std_part_ec1_1_7') },
    { code: 'EN 1991-2',   label: t('std_part_ec1_2')   },
    { code: 'EN 1991-3',   label: t('std_part_ec1_3')   },
    { code: 'EN 1991-4',   label: t('std_part_ec1_4')   },
  ]

  const TOOL_GROUPS: ToolGroup[] = [
    {
      part: 'EN 1991-1-4',
      desc: t('std_tool_ec1_part_desc'),
      cards: [
        {
          id: 'wind',
          label: t('std_tool_ec1_wind_label'),
          desc: t('std_tool_ec1_wind_desc'),
          graphic: (
            <svg width="90" height="65" viewBox="0 0 90 65" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="54" y="10" width="28" height="44" rx="2" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.85)" strokeWidth="2"/>
              <line x1="8" y1="21" x2="44" y2="21" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round"/>
              <polygon points="50,21 42,16 42,26" fill="rgba(255,255,255,0.9)"/>
              <line x1="8" y1="33" x2="44" y2="33" stroke="rgba(255,255,255,0.65)" strokeWidth="2" strokeLinecap="round"/>
              <polygon points="50,33 42,28 42,38" fill="rgba(255,255,255,0.65)"/>
              <line x1="8" y1="45" x2="44" y2="45" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round"/>
              <polygon points="50,45 42,40 42,50" fill="rgba(255,255,255,0.4)"/>
              <text x="68" y="36" fontSize="9" fill="rgba(255,255,255,0.9)" fontWeight="700" textAnchor="middle">
                q<tspan fontSize="7" dy="2">p</tspan>
              </text>
            </svg>
          ),
          accent:   '#0ea5e9',
          gradient: 'linear-gradient(135deg, #0369a1, #0ea5e9)',
          ref:      'EN 1991-1-4',
        },
      ],
    },
  ]

  return (
    <EcToolShell
      title={t('std_ref_ec1_title')}
      subtitle={t('std_ref_ec1_sub')}
      accentColor="#0ea5e9"
      accentBg="#e0f2fe"
      groups={TOOL_GROUPS}
      section={section}
      pageKey={pageKey}
      onNavChange={onNavChange}
    >
      {activeSection => (
        <>
          {activeSection === 'wind_table'
            ? <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}><WindTables /></div>
            : <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '20px 20px 20px' }}>
                {activeSection === 'wind' && <WindCalc calc={calc} onNavChange={onNavChange} />}
                {pageKey && <PageDiscussion pageKey={pageKey} />}
              </div>
          }
        </>
      )}
    </EcToolShell>
  )
}
