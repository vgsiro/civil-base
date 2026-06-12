'use client'
import { useTranslation } from '@/app/i18n/LanguageContext'
import { ToolCardGrid, ToolGroup } from './tool-card-grid'

export default function EcToolShell({ title, subtitle, accentColor, accentBg, groups, section, pageKey, onNavChange, children }: {
  title: string
  subtitle: string
  accentColor: string
  accentBg: string
  groups: ToolGroup[]
  section?: string
  pageKey?: string
  onNavChange?: (key: string, val: string) => void
  children: (activeSection: string) => React.ReactNode
}) {
  const { t } = useTranslation()
  const TOOL_IDS     = groups.flatMap(g => g.cards.map(c => c.id))
  const activeSection = section || 'tools'
  const setSection    = (id: string) => onNavChange?.('section', id)
  const isTool        = TOOL_IDS.includes(activeSection)

  if (isTool) {
    return (
      <div className="ec-tool-shell" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {children(activeSection)}
      </div>
    )
  }

  return (
    <div style={{ overflowY: 'auto', height: '100%', padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 12, color: '#64748b' }}>{subtitle}</div>
      </div>
      <ToolCardGrid groups={groups} accentColor={accentColor} accentBg={accentBg} onSelect={setSection} />
    </div>
  )
}
