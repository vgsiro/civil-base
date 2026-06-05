'use client'
import { useState, useRef, useEffect } from 'react'
import { Search, X, LogIn, Rss } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { StorageInfo } from '../types'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import AccountMenu from './AccountMenu'

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
  user: SupabaseUser | null
  isAdmin: boolean
  onSignIn: () => void
  onSignOut: () => void
}

// UserMenu replaced by AccountMenu component — see AccountMenu.tsx

export default function AppHeader({
  storage, searchQuery, searchOpen, searchHistory, searchResults,
  searchWrapperRef, searchInputRef,
  onSearch, onSearchFocus, onClearSearch,
  saveToHistory, clearHistory, removeHistoryItem, onSelectResult, onGoHome,
  user, isAdmin, onSignIn, onSignOut,
}: Props) {
  const [profileUsername, setProfileUsername] = useState<string | null>(null)
  const [profileAvatarColor, setProfileAvatarColor] = useState(0)
  const [profileDisplayName, setProfileDisplayName] = useState('')
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const isAdminUser = user.email === 'tranvuong2832@gmail.com'
    const fallback = isAdminUser ? 'Admin' : (user.user_metadata?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User')
    setProfileDisplayName(fallback)
    supabase.from('profiles').select('username,avatar_color,avatar_url,display_name,full_name').eq('id', user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setProfileUsername(data.username ?? null)
        setProfileAvatarColor(data.avatar_color ?? 0)
        setProfileAvatarUrl(data.avatar_url ?? null)
        if (data.display_name) setProfileDisplayName(data.display_name)
        else if (data.full_name) setProfileDisplayName(data.full_name)
      }
    })
  }, [user])

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/logo.png" alt="Civil Base" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
          <h1 style={{ fontSize: '18px', fontWeight: '700', color: 'white', margin: 0 }}>Civil Base</h1>
        </div>
      </button>

      {/* Feed nav link */}
      <a href="/feed"
        style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, fontWeight: 600, color: '#94a3b8', textDecoration: 'none', padding: '6px 10px', borderRadius: 7, background: 'rgba(255,255,255,0.06)', border: '1px solid transparent' }}
        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.14)'; (e.currentTarget as HTMLAnchorElement).style.color = '#fff' }}
        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLAnchorElement).style.color = '#94a3b8' }}>
        <Rss size={13} /> Feed
      </a>

      {/* Search */}
      <div style={{ flex: 1, position: 'relative' }} ref={searchWrapperRef}>
        <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 1 }} />
        <input
          ref={searchInputRef}
          placeholder="Search…"
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
                {isAdmin ? 'Search lecture notes, formulas & mindmaps' : 'Search is not available for your account'}
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
                  const isSite = r._type === 'site'
                  const isFormula = r._type === 'formula'
                  const isMindmap = r._type === 'mindmap'
                  const accentColor = isSite ? r.categoryColor : isFormula ? '#f59e0b' : isMindmap ? '#10b981' : '#3b82f6'
                  const hoverBg = isSite ? '#fffbeb' : isFormula ? '#fffbeb' : isMindmap ? '#f0fdf4' : '#eff6ff'
                  const tagBg = isSite ? '#fef3c7' : isFormula ? '#fef3c7' : isMindmap ? '#dcfce7' : '#dbeafe'
                  const tagColor = isSite ? '#92400e' : isFormula ? '#92400e' : isMindmap ? '#166534' : '#1e40af'
                  const tagLabel = isSite ? r.category : isFormula ? 'Formula' : isMindmap ? 'Mindmap' : 'Notes'
                  return (
                    <div key={r.id} onClick={() => { saveToHistory(searchQuery); onSelectResult(r) }}
                      style={{ padding: '9px 10px', borderRadius: '8px', marginBottom: '5px', borderLeft: `3px solid ${accentColor}`, cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'flex-start', background: '#f8fafc' }}
                      onMouseEnter={e => (e.currentTarget.style.background = hoverBg)}
                      onMouseLeave={e => (e.currentTarget.style.background = '#f8fafc')}>
                      <span style={{ flexShrink: 0, marginTop: '1px', padding: '2px 7px', borderRadius: '99px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', background: tagBg, color: tagColor }}>
                        {tagLabel}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {isSite ? (
                          <>
                            <p style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', marginBottom: '2px' }}>{r.title}</p>
                            <p style={{ fontSize: '11px', color: '#64748b' }}>{r.description}</p>
                          </>
                        ) : isFormula ? (
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
                {searchResults.length === 0 && (
                  <p style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '16px 0' }}>
                    {isAdmin ? 'No results found' : 'Search is not available for your account'}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>


      {/* Auth */}
      {user ? (
        <AccountMenu
          user={user}
          avatarColor={profileAvatarColor}
          avatarUrl={profileAvatarUrl}
          displayName={profileDisplayName}
          profileUsername={profileUsername}
          size={28}
          dark={true}
          onSignOut={onSignOut}
        />
      ) : (
        <button onClick={onSignIn}
          style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: '#3b82f6', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 600 }}
          onMouseEnter={e => (e.currentTarget.style.background = '#2563eb')}
          onMouseLeave={e => (e.currentTarget.style.background = '#3b82f6')}>
          <LogIn size={14} /> Sign In
        </button>
      )}
    </div>
  )
}
