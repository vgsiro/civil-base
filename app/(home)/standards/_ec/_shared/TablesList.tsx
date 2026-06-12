'use client'
import { useState, useMemo } from 'react'
import { useTranslation } from '@/app/i18n/LanguageContext'
import { EditableText } from './admin/EditableText'

// ── Shared Panel 2 for all EC Tables panels and NaPanel ───────────────────────
// To change search/list style globally, edit here.

export type TableEntry = {
  id:       string
  number:   string   // e.g. "Table 4.1", "Table NA.1"
  name:     string
  partId:   string   // parent part/section id — used to auto-select Panel 1
  partCode: string   // shown as sub-label in search results
}

export function TablesList({
  allTables,
  visibleTables,
  activeId,
  accentColor,
  accentBg,
  accentDark,
  collapsed,
  onSelect,
  editMode = false,
  onCommitTableField,
}: {
  allTables:     TableEntry[]
  visibleTables: TableEntry[]
  activeId:      string
  accentColor:   string
  accentBg:      string
  accentDark:    string
  collapsed:     boolean
  onSelect:      (tableId: string, partId?: string) => void
  editMode?:      boolean
  onCommitTableField?: (tableId: string, field: 'number' | 'name', value: string) => void
}) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return allTables.filter(t =>
      t.number.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      t.partCode.toLowerCase().includes(q)
    )
  }, [query, allTables])

  const isSearching = query.trim().length > 0

  if (collapsed) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 8, gap: 2 }}>
        {visibleTables.map(t => (
          <button key={t.id} onClick={() => onSelect(t.id)} title={`${t.number} ${t.name}`}
            style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 9, fontWeight: 700, background: activeId === t.id ? accentBg : 'transparent', color: activeId === t.id ? accentDark : '#64748b' }}>
            {t.number.replace('Table ', 'T').replace('Cl. ', 'C')}
          </button>
        ))}
        {visibleTables.length === 0 && <span style={{ fontSize: 9, color: '#cbd5e1', paddingTop: 10 }}>—</span>}
      </div>
    )
  }

  const listToShow = isSearching ? searchResults : visibleTables

  return (
    <>
      {/* Search box */}
      <div style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '5px 8px' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, color: '#94a3b8' }}>
            <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.4"/>
            <line x1="7.5" y1="7.5" x2="11" y2="11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t('std_tbl_search_placeholder')}
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 11, color: '#1e293b', width: '100%', minWidth: 0 }}
          />
          {query && (
            <button onClick={() => setQuery('')}
              style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, color: '#94a3b8', fontSize: 14, lineHeight: 1 }}>
              ×
            </button>
          )}
        </div>
      </div>

      {/* Header label — shows part code when searching */}
      {!isSearching && (
        <div style={{ padding: '8px 12px 4px', fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.07em', textTransform: 'uppercase', flexShrink: 0 }}>
          {t('std_tbl_tables_label')}
        </div>
      )}

      {/* List */}
      {listToShow.length === 0
        ? (
          <div style={{ padding: '14px 12px', fontSize: 11, color: '#cbd5e1', fontStyle: 'italic' }}>
            {isSearching ? t('std_tbl_no_results') : t('std_tbl_no_tables')}
          </div>
        )
        : listToShow.map(t => {
          const isActive = activeId === t.id
          return (
            <button key={t.id}
              onClick={() => onSelect(t.id, isSearching ? t.partId : undefined)}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%', padding: '9px 12px', background: isActive ? accentBg : 'transparent', border: 'none', borderLeft: `3px solid ${isActive ? accentColor : 'transparent'}`, borderBottom: '1px solid #f1f5f9', cursor: 'pointer', textAlign: 'left', flexShrink: 0 }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f8fafc' }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}>
              <EditableText value={t.number} editMode={editMode}
                onCommit={v => onCommitTableField?.(t.id, 'number', v)}
                style={{ fontSize: 11, fontWeight: 700, color: isActive ? accentDark : accentColor }} />
              <EditableText value={t.name} editMode={editMode}
                onCommit={v => onCommitTableField?.(t.id, 'name', v)}
                style={{ fontSize: 11, color: isActive ? accentDark : '#1e293b', marginTop: 1, whiteSpace: 'normal', lineHeight: 1.3 }} />
              {isSearching && (
                <span style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{t.partCode}</span>
              )}
            </button>
          )
        })
      }
    </>
  )
}
