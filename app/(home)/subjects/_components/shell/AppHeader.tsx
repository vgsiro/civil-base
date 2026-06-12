'use client'
import { useState, useEffect } from 'react'
import { Search, X, LogIn } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { StorageInfo, Profile } from '../../../../_types'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import AccountMenu from '../../../../_components/social/user/AccountMenu'
import NotificationDropdown from '../../../../_components/social/notifications/NotificationDropdown'
import MessageDropdown from '../../../../_components/social/messaging/MessageDropdown'
import FriendRequestDropdown from '../../../../_components/social/messaging/FriendRequestDropdown'
import FeedbackModal from '../../../../_components/social/notifications/FeedbackModal'
import ChatBox from '../../../../_components/social/messaging/ChatBox'
import { useMessagingChat } from '../../../../_hooks/useMessagingChat'
import { useTranslation } from '../../../../i18n/LanguageContext'

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
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null)
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const [unreadMsgs, setUnreadMsgs] = useState(0)
  const [pendingFriends, setPendingFriends] = useState(0)
  const [showCommunityConfirm, setShowCommunityConfirm] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const chat = useMessagingChat()
  const { t } = useTranslation()

  useEffect(() => {
    if (!user) return
    const isAdminUser = user.email === 'tranvuong2832@gmail.com'
    const fallback = isAdminUser ? 'Admin' : (user.user_metadata?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User')
    setProfileDisplayName(fallback)

    // Seed avatar/name from the cached profile first so the account menu shows the user's real
    // avatar image on first paint instead of the initials/default circle until the fetch returns.
    const applyProfile = (data: Profile) => {
      setCurrentProfile(data)
      setProfileUsername(data.username ?? null)
      setProfileAvatarColor(data.avatar_color ?? 0)
      setProfileAvatarUrl(data.avatar_url ?? null)
      if (data.display_name) setProfileDisplayName(data.display_name)
      else if (data.full_name) setProfileDisplayName(data.full_name)
    }
    try {
      const cached = localStorage.getItem(`civilbase_profile_${user.id}`)
      if (cached) applyProfile(JSON.parse(cached) as Profile)
    } catch {}

    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle().then(({ data }) => {
      if (data) {
        applyProfile(data as Profile)
        try { localStorage.setItem(`civilbase_profile_${user.id}`, JSON.stringify(data)) } catch {}
      }
    })
    // Badge counts are now self-seeded by NotificationDropdown / FriendRequestDropdown.
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
    <>
    {/* Floating ChatBoxes — rendered at page level so they sit above everything */}
    {user && chat.openChats.map((c, i) => (
      <ChatBox key={c.convId} userId={user.id} {...chat.chatBoxProps(c, i)} />
    ))}
    <div className="home-appheader" style={{ background: '#1e293b', color: 'white', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
      {showFeedbackModal && (
        <FeedbackModal user={user} onClose={() => setShowFeedbackModal(false)} />
      )}
      {showCommunityConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', width: '100%', maxWidth: 400, padding: '28px 28px 24px' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>{t('home_confirm_community_title')}</div>
            <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, marginBottom: 24 }}>{t('home_confirm_community_body')}</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowCommunityConfirm(false)}
                style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                {t('home_confirm_stay')}
              </button>
              <button onClick={() => { window.location.href = '/feed' }}
                style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = '#2563eb'}
                onMouseLeave={e => e.currentTarget.style.background = '#3b82f6'}>
                {t('home_confirm_go_community')}
              </button>
            </div>
          </div>
        </div>
      )}
      <a href="/" onClick={e => { if (!e.ctrlKey && !e.metaKey && e.button === 0) { e.preventDefault(); onGoHome() } }}
        style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0, opacity: 1, transition: 'opacity 0.15s' }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
        <img src="/logo.png" alt="CivilAxis" style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }} />
        <h1 className="home-nav-btn-label" style={{ fontSize: '18px', fontWeight: '700', color: 'white', margin: 0 }}>CivilAxis</h1>
      </a>

      {/* Search */}
      <div style={{ flex: 1, position: 'relative' }} ref={searchWrapperRef}>
        <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 1 }} />
        <input
          ref={searchInputRef}
          placeholder={t('home_nav_search_placeholder')}
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
                  <span style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' }}>{t('home_nav_recent_searches')}</span>
                  <button onClick={clearHistory} style={{ fontSize: '11px', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>{t('home_nav_clear_all')}</button>
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
                {isAdmin ? t('home_nav_search_hint') : t('home_nav_search_unavailable')}
              </div>
            )}

            {/* Results */}
            {searchQuery && (
              <div style={{ padding: '10px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>{searchResults.length} {t('home_nav_results_for')} &quot;{searchQuery}&quot;</span>
                  {searchResults.some((r: any) => r._type === 'formula') && (
                    <span style={{ padding: '2px 7px', background: '#fef3c7', color: '#b45309', borderRadius: '99px', fontSize: '11px', fontWeight: '600' }}>
                      {searchResults.filter((r: any) => r._type === 'formula').length} {t('home_nav_tag_formula')}
                    </span>
                  )}
                  {searchResults.some((r: any) => r._type === 'mindmap') && (
                    <span style={{ padding: '2px 7px', background: '#f0fdf4', color: '#15803d', borderRadius: '99px', fontSize: '11px', fontWeight: '600' }}>
                      {searchResults.filter((r: any) => r._type === 'mindmap').length} {t('home_nav_tag_mindmap')}
                    </span>
                  )}
                  {searchResults.some((r: any) => r._type === 'pdf') && (
                    <span style={{ padding: '2px 7px', background: '#eff6ff', color: '#1d4ed8', borderRadius: '99px', fontSize: '11px', fontWeight: '600' }}>
                      {searchResults.filter((r: any) => r._type === 'pdf').length} {t('home_nav_tag_notes')}
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
                  const tagLabel = isSite ? r.category : isFormula ? t('home_nav_label_formula') : isMindmap ? t('home_nav_label_mindmap') : t('home_nav_label_notes')
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
                    {isAdmin ? t('home_nav_no_results') : t('home_nav_search_unavailable')}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>


      {/* Community + social icons + account */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        <button
          onClick={() => setShowCommunityConfirm(true)}
          title={t('home_nav_community_title_tip')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px', height: 34, borderRadius: 8, border: '1.5px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)' }}>
          🌐 <span className="home-nav-btn-label">{t('home_nav_community')}</span>
        </button>
        <button
          onClick={() => setShowFeedbackModal(true)}
          title={t('home_nav_feedback_tip')}
          className="home-nav-feedback-btn"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px', height: 34, borderRadius: 8, border: '1.5px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.8)' }}>
          💬 <span className="home-nav-btn-label">{t('home_nav_send_feedback')}</span>
        </button>
        {user ? (
          <>
            <FriendRequestDropdown userId={user.id} pendingCount={pendingFriends} onCountChange={setPendingFriends} />
            <MessageDropdown
              userId={user.id}
              unreadCount={unreadMsgs}
              onUnreadChange={setUnreadMsgs}
              {...chat.dropdownHandlers}
            />
            <NotificationDropdown userId={user.id} unreadCount={unreadNotifs} onUnreadChange={setUnreadNotifs} />
            <AccountMenu user={user} profile={currentProfile} avatarColor={profileAvatarColor} avatarUrl={profileAvatarUrl} displayName={profileDisplayName} profileUsername={profileUsername} size={34} dark={true} onSignOut={onSignOut} />
          </>
        ) : (
          <button onClick={onSignIn}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: '#3b82f6', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 13, fontWeight: 600 }}
            onMouseEnter={e => (e.currentTarget.style.background = '#2563eb')}
            onMouseLeave={e => (e.currentTarget.style.background = '#3b82f6')}>
            <LogIn size={14} /> {t('home_nav_sign_in')}
          </button>
        )}
      </div>
    </div>
    </>
  )
}
