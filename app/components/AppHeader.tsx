'use client'
import { Search, X } from 'lucide-react'
import type { StorageInfo } from '../types'

interface Props {
  storage: StorageInfo | null
  searchQuery: string
  searchOpen: boolean
  searchHistory: string[]
  searchResults: any[]
  searchWrapperRef: React.RefObject<HTMLDivElement | null>
  searchInputRef: React.RefObject<HTMLInputElement | null>
  onSearch: (q: string) => void
  onSearchFocus: () => void
  onClearSearch: () => void
  saveToHistory: (q: string) => void
  clearHistory: () => void
  removeHistoryItem: (i: number) => void
  onSelectResult: (r: any) => void
  onGoHome: () => void
}

export default function AppHeader({
  storage, searchQuery, searchOpen, searchHistory, searchResults,
  searchWrapperRef, searchInputRef,
  onSearch, onSearchFocus, onClearSearch,
  saveToHistory, clearHistory, removeHistoryItem, onSelectResult, onGoHome,
}: Props) {
  const renderName = (name: string) => {
    try {
      const katex = require('katex')
      return name.split(/(\$[^$]+\$)/g).map((part: string, i: number) =>
        part.startsWith('$') && part.endsWith('$')
          ? <span key={i} dangerouslySetInnerHTML={{ __html: katex.renderToString(part.slice(1, -1), { throwOnError: false, displayMode: false }) }} />
          : <span key={i}>{part}</span>
      )
    } catch { return name }
  }

  return (
    <div style={{ background: '#1e293b', color: 'white', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
      <button onClick={onGoHome} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
        <h1 style={{ fontSize: '18px', fontWeight: '600', color: 'white', margin: 0 }}>⚙️ CivilBase</h1>
      </button>

      {/* Search */}
      <div style={{ flex: 1, position: 'relative' }} ref={searchWrapperRef}>
        <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 1 }} />
        <input
          ref={searchInputRef}
          placeholder="Search across all notes..."
          value={searchQuery}
          onChange={e => onSearch(e.target.value)}
          onFocus={onSearchFocus}
          onKeyDown={e => {
            if (e.key === 'Escape') { (e.target as HTMLInputElement).blur() }
            if (e.key === 'Enter' && searchQuery.trim()) saveToHistory(searchQuery.trim())
          }}
          style={{ width: '100%', padding: '8px 34px 8px 34px', borderRadius: '8px', border: searchOpen ? '1px solid #6d28d9' : '1px solid transparent', background: '#334155', color: 'white', fontSize: '14px', outline: 'none' }}
        />
        {searchQuery && (
          <button onClick={onClearSearch}
            style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px', display: 'flex', alignItems: 'center', zIndex: 1 }}>
            <X size={15} />
          </button>
        )}

        {/* Dropdown */}
        {searchOpen && (
          <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: 'white', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', zIndex: 200, maxHeight: '480px', overflowY: 'auto', border: '1px solid #e2e8f0' }}>

            {/* History */}
            {!searchQuery && searchHistory.length > 0 && (
              <div>
                <div style={{ padding: '10px 14px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' }}>Recent searches</span>
                  <button onClick={clearHistory} style={{ fontSize: '11px', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>Clear all</button>
                </div>
                {searchHistory.map((h, i) => (
                  <div key={i} style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                    <Search size={13} color="#94a3b8" style={{ flexShrink: 0 }} />
                    <span onClick={() => { onSearch(h) }} style={{ fontSize: '13px', color: '#334155', flex: 1, cursor: 'pointer' }}>{h}</span>
                    <button onClick={e => { e.stopPropagation(); removeHistoryItem(i) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: '2px', display: 'flex', alignItems: 'center', flexShrink: 0 }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#64748b')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#cbd5e1')}>
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!searchQuery && searchHistory.length === 0 && (
              <div style={{ padding: '24px 14px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                Start typing to search across all notes and formulas
              </div>
            )}

            {/* Results */}
            {searchQuery && (
              <div style={{ padding: '10px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>{searchResults.length} results for &quot;{searchQuery}&quot;</span>
                  {searchResults.some((r: any) => r._type === 'formula') && (
                    <span style={{ padding: '2px 7px', background: '#fef3c7', color: '#b45309', borderRadius: '99px', fontSize: '11px', fontWeight: '600' }}>
                      {searchResults.filter((r: any) => r._type === 'formula').length} formula
                    </span>
                  )}
                  {searchResults.some((r: any) => r._type === 'mindmap') && (
                    <span style={{ padding: '2px 7px', background: '#f0fdf4', color: '#15803d', borderRadius: '99px', fontSize: '11px', fontWeight: '600' }}>
                      {searchResults.filter((r: any) => r._type === 'mindmap').length} mindmap
                    </span>
                  )}
                  {searchResults.some((r: any) => r._type === 'pdf') && (
                    <span style={{ padding: '2px 7px', background: '#eff6ff', color: '#1d4ed8', borderRadius: '99px', fontSize: '11px', fontWeight: '600' }}>
                      {searchResults.filter((r: any) => r._type === 'pdf').length} in notes
                    </span>
                  )}
                </div>
                {searchResults.map((r: any) => {
                  const isFormula = r._type === 'formula'
                  const isMindmap = r._type === 'mindmap'
                  const accentColor = isFormula ? '#f59e0b' : isMindmap ? '#10b981' : '#3b82f6'
                  const hoverBg = isFormula ? '#fffbeb' : isMindmap ? '#f0fdf4' : '#eff6ff'
                  const tagBg = isFormula ? '#fef3c7' : isMindmap ? '#dcfce7' : '#dbeafe'
                  const tagColor = isFormula ? '#92400e' : isMindmap ? '#166534' : '#1e40af'
                  const tagLabel = isFormula ? 'Formula' : isMindmap ? 'Mindmap' : 'Notes'
                  return (
                    <div key={r.id} onClick={() => { saveToHistory(searchQuery); onSelectResult(r) }}
                      style={{ padding: '9px 10px', borderRadius: '8px', marginBottom: '5px', borderLeft: `3px solid ${accentColor}`, cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'flex-start', background: '#f8fafc' }}
                      onMouseEnter={e => (e.currentTarget.style.background = hoverBg)}
                      onMouseLeave={e => (e.currentTarget.style.background = '#f8fafc')}>
                      <span style={{ flexShrink: 0, marginTop: '1px', padding: '2px 7px', borderRadius: '99px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', background: tagBg, color: tagColor }}>
                        {tagLabel}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {isFormula ? (
                          <>
                            <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>{(r.sections as any)?.subjects?.name} → {(r.sections as any)?.name}</p>
                            <p style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>{renderName(r.name)}</p>
                          </>
                        ) : isMindmap ? (
                          <>
                            <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>
                              {r.subjectName} → {r.sectionName} → {r.pdfName}{r.lec != null ? ` — Lec ${r.lec}` : ''}{r.page != null ? ` p.${r.page}` : ''}
                            </p>
                            <p style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</p>
                            <p style={{ fontSize: '11px', color: '#64748b', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.path.slice(0, -1).join(' › ')}</p>
                          </>
                        ) : (
                          <>
                            <p style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>{r.pdfs?.sections?.subjects?.name} → {r.pdfs?.sections?.name} → {r.pdfs?.name} — p.{r.page_number}</p>
                            <p style={{ fontSize: '13px', fontWeight: '500', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.heading}</p>
                            <p style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>{r.content?.substring(0, 100)}...</p>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
                {searchResults.length === 0 && <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '16px 0' }}>No results found</p>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Storage */}
      {storage && (
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '3px', minWidth: '140px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Storage</span>
            <span style={{ fontSize: '11px', color: Number(storage.percent) > 80 ? '#fca5a5' : '#94a3b8' }}>{storage.usedMB} MB / {storage.limitGB} GB</span>
          </div>
          <div style={{ background: '#334155', borderRadius: '99px', height: '4px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${storage.percent}%`, background: Number(storage.percent) > 80 ? '#ef4444' : '#3b82f6', borderRadius: '99px', transition: 'width 0.3s ease' }} />
          </div>
          <div style={{ fontSize: '10px', color: '#475569' }}>{storage.fileCount} files</div>
        </div>
      )}
    </div>
  )
}
