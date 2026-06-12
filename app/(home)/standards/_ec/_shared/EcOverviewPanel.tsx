'use client'
import { useState, useEffect } from 'react'
import { useTranslation } from '@/app/i18n/LanguageContext'
import HomeFooter from '../../../../_components/shared/HomeFooter'
import PageDiscussion from '../../../../_components/home/discussion/PageDiscussion'
import { Table, TR } from '@/app/(home)/standards/_lib/ui'
import { TH, TD, TDL } from '../../_lib/ui-styles'
import { useAdminEdit } from './admin/useAdminEdit'
import { EditableText } from './admin/EditableText'
import { AdminEditBar } from './admin/AdminSaveBar'
import { getEcContent, EcId } from '@/lib/ec-content'

export type OverviewPart = {
  code: string
  label: string
  tools:  { label: string; section: string; sub: string }[]
  tables: { label: string; section: string; sub: string }[]
}

function NavChip({ label, accent, onClick }: { label: string; accent: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 9px', borderRadius: 6, border: `1px solid ${accent}40`,
        background: `${accent}12`, color: accent,
        fontSize: 11, fontWeight: 600, cursor: 'pointer',
        whiteSpace: 'nowrap' as const, transition: 'background 0.12s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = `${accent}24`)}
      onMouseLeave={e => (e.currentTarget.style.background = `${accent}12`)}>
      {label} ›
    </button>
  )
}

export function EcOverviewPanel({
  ec, defaultParts, heading, subtitle, accentColor, pageKey, onNavTo, editMode, onEditDone,
}: {
  ec: EcId
  defaultParts: OverviewPart[]
  heading: string
  subtitle: string
  accentColor: string
  pageKey?: string
  onNavTo: (params: Record<string, string>) => void
  editMode?: boolean
  onEditDone?: () => void
}) {
  const { t } = useTranslation()
  const { dirty, saving, stage, save, discard } = useAdminEdit(ec, editMode, onEditDone)
  const [parts, setParts]               = useState<OverviewPart[]>(defaultParts)
  const [dbParts, setDbParts]           = useState<OverviewPart[] | null>(null)
  const [pageHeading, setPageHeading]   = useState(heading)
  const [pageSubtitle, setPageSubtitle] = useState(subtitle)

  // Sync translated defaultParts when locale changes, unless DB has overridden them
  useEffect(() => {
    if (!dbParts) setParts(defaultParts)
  }, [defaultParts]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    getEcContent<OverviewPart[]>(ec, 'overview', 'parts').then(v => { if (v) { setDbParts(v); setParts(v) } })
    getEcContent<string>(ec, 'overview', 'heading').then(v => { if (v) setPageHeading(v) })
    getEcContent<string>(ec, 'overview', 'subtitle').then(v => { if (v) setPageSubtitle(v) })
  }, [ec])

  function commitPartField(idx: number, field: 'code' | 'label', value: string) {
    const next = parts.map((p, i) => i === idx ? { ...p, [field]: value } : p)
    setParts(next)
    stage('overview', 'parts', next)
  }

  function navigate(sub: string, section: string) { onNavTo({ sub, section }) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {editMode && (
        <AdminEditBar dirty={dirty} saving={saving} onSave={save} onDiscard={discard} />
      )}
      <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="ec-overview-body" style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
          <div>
            <EditableText value={pageHeading} editMode={!!editMode}
              onCommit={v => { setPageHeading(v); stage('overview', 'heading', v) }}
              style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', display: 'block', marginBottom: 4 }} />
            <EditableText value={pageSubtitle} editMode={!!editMode}
              onCommit={v => { setPageSubtitle(v); stage('overview', 'subtitle', v) }}
              style={{ fontSize: 12, color: '#64748b' }} />
          </div>
          <Table>
          <thead>
            <tr>
              <th style={{ ...TH, textAlign: 'left', minWidth: 160 }}>{t('std_overview_col_standard')}</th>
              <th style={{ ...TH, textAlign: 'left' }}>{t('std_overview_col_title')}</th>
              <th style={{ ...TH, textAlign: 'left', minWidth: 160 }}>{t('std_overview_col_ref_tools')}</th>
              <th style={{ ...TH, textAlign: 'left', minWidth: 150 }}>{t('std_overview_col_ref_table')}</th>
            </tr>
          </thead>
          <tbody>
            {parts.map((p, i) => (
              <TR key={p.code} stripe={i % 2 !== 0}>
                <td style={{ ...TD, fontWeight: 700, color: accentColor, whiteSpace: 'nowrap' as const }}>
                  <EditableText value={p.code} editMode={!!editMode}
                    onCommit={v => commitPartField(i, 'code', v)}
                    style={{ fontWeight: 700, color: accentColor }} />
                </td>
                <td style={TDL}>
                  <EditableText value={p.label} editMode={!!editMode}
                    onCommit={v => commitPartField(i, 'label', v)}
                    multiline style={{ color: '#334155' }} />
                </td>
                <td style={{ ...TD, verticalAlign: 'middle' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5 }}>
                    {p.tools.length > 0
                      ? p.tools.map(t => <NavChip key={t.label} label={t.label} accent={accentColor} onClick={() => navigate(t.sub, t.section)} />)
                      : <span style={{ fontSize: 11, color: '#cbd5e1' }}>—</span>}
                  </div>
                </td>
                <td style={{ ...TD, verticalAlign: 'middle' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5 }}>
                    {p.tables.length > 0
                      ? p.tables.map(t => <NavChip key={t.label} label={t.label} accent={accentColor} onClick={() => navigate(t.sub, t.section)} />)
                      : <span style={{ fontSize: 11, color: '#cbd5e1' }}>—</span>}
                  </div>
                </td>
              </TR>
            ))}
          </tbody>
        </Table>
        </div>
        {pageKey && <div style={{ padding: '0 32px' }}><PageDiscussion pageKey={pageKey} /></div>}
        <HomeFooter />
      </div>
    </div>
  )
}
