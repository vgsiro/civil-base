'use client'
import { useState, useMemo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
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

export type PartEntry = { id: string; code: string; label: string }

// Mobile-only two-dropdown + search panel — hidden on desktop via CSS
export function MobilePanelPicker({ parts, selectedPartId, tablesForPart, allTables, activeId, accentColor, onSelectPart, onSelectTable }: {
  parts:          PartEntry[]
  selectedPartId: string
  tablesForPart:  { id: string; number: string; name: string }[]
  allTables:      TableEntry[]
  activeId:       string
  accentColor:    string
  onSelectPart:   (partId: string) => void
  onSelectTable:  (tableId: string, partId?: string) => void
}) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const searchBoxRef = useRef<HTMLDivElement>(null)
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

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

  // Update portal position whenever search activates
  useEffect(() => {
    if (!isSearching || !searchBoxRef.current) { setDropdownPos(null); return }
    const r = searchBoxRef.current.getBoundingClientRect()
    const margin = 8
    const left = Math.max(margin, r.left)
    const right = Math.min(window.innerWidth - margin, r.right)
    setDropdownPos({ top: r.bottom + 4, left, width: right - left })
  }, [isSearching, query])

  // Close on outside click
  useEffect(() => {
    if (!isSearching) return
    const handler = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) setQuery('')
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isSearching])

  return (
    <div className="ec-table-mobile-picker" style={{ display: 'none', flexDirection: 'column', gap: 6, padding: '8px 12px', borderBottom: '1px solid #e2e8f0', background: '#fff', flexShrink: 0 }}>
      {/* Part dropdown */}
      <select
        value={selectedPartId}
        onChange={e => onSelectPart(e.target.value)}
        style={{ width: '100%', padding: '7px 8px', borderRadius: 8, border: `1.5px solid ${accentColor}44`, background: '#f8fafc', fontSize: 12, fontWeight: 600, color: '#1e293b', outline: 'none' }}
      >
        {parts.map(p => (
          <option key={p.id} value={p.id}>{p.code}</option>
        ))}
      </select>
      {/* Table dropdown */}
      <select
        value={activeId}
        onChange={e => onSelectTable(e.target.value)}
        style={{ width: '100%', padding: '7px 8px', borderRadius: 8, border: `1.5px solid ${accentColor}44`, background: '#f8fafc', fontSize: 12, fontWeight: 600, color: '#1e293b', outline: 'none' }}
      >
        {tablesForPart.length === 0
          ? <option disabled value="">— no tables —</option>
          : tablesForPart.map(t => (
            <option key={t.id} value={t.id}>{t.number} — {t.name}</option>
          ))
        }
      </select>

      {/* Row 2: Search box */}
      <div ref={searchBoxRef} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', border: `1px solid ${isSearching ? accentColor + '66' : '#e2e8f0'}`, borderRadius: 8, padding: '6px 10px' }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, color: '#94a3b8' }}>
          <circle cx="5" cy="5" r="3.5" stroke="currentColor" strokeWidth="1.4"/>
          <line x1="7.5" y1="7.5" x2="11" y2="11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search all tables…"
          style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 12, color: '#1e293b', width: '100%' }}
        />
        {query && (
          <button onClick={() => { setQuery(''); inputRef.current?.focus() }}
            style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, color: '#94a3b8', fontSize: 16, lineHeight: 1 }}>×</button>
        )}
      </div>

      {/* Search results — portalled to body to escape overflow:hidden */}
      {mounted && isSearching && dropdownPos && createPortal(
        <div style={{ position: 'fixed', top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, maxHeight: 260, overflowY: 'auto', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 9999 }}>
          {searchResults.length === 0
            ? <div style={{ padding: '10px 12px', fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>No results</div>
            : searchResults.map(t => (
              <button key={t.id} onClick={() => { onSelectTable(t.id, t.partId); setQuery('') }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%', padding: '8px 12px', background: t.id === activeId ? `${accentColor}12` : 'transparent', border: 'none', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', textAlign: 'left' }}
                onMouseEnter={e => { if (t.id !== activeId) e.currentTarget.style.background = '#f8fafc' }}
                onMouseLeave={e => { e.currentTarget.style.background = t.id === activeId ? `${accentColor}12` : 'transparent' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: accentColor }}>{t.number}</span>
                <span style={{ fontSize: 11, color: '#1e293b', lineHeight: 1.3 }}>{t.name}</span>
                <span style={{ fontSize: 10, color: '#94a3b8', marginTop: 1 }}>{t.partCode}</span>
              </button>
            ))
          }
        </div>,
        document.body
      )}
    </div>
  )
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
