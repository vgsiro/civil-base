'use client'
import { GraduationCap, Home, Search, X as XIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useTranslation } from '../../../i18n/LanguageContext'
import type { TranslationKey } from '../../../i18n/index'
import type { PostCategory } from '../../../_types'
import AccountMenu from '../user/AccountMenu'
import NotificationDropdown from '../notifications/NotificationDropdown'
import MessageDropdown from '../messaging/MessageDropdown'
import FriendRequestDropdown from '../messaging/FriendRequestDropdown'
import AuthModal from '../../../(home)/subjects/_components/shell/AuthModal'
import { signUpWithProfile } from '../../../_lib/auth'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '../../../_types'

// ── Category SVG icons ────────────────────────────────────────────────────────
const IconConcrete = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="12" height="10" rx="0.5" />
    <circle cx="4.5" cy="5.5" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="11.5" cy="5.5" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="4.5" cy="10.5" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="11.5" cy="10.5" r="0.9" fill="currentColor" stroke="none" />
  </svg>
)
const IconSteel = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="2" x2="13" y2="2" /><line x1="3" y1="14" x2="13" y2="14" />
    <line x1="8" y1="2" x2="8" y2="14" />
    <line x1="3" y1="2.7" x2="3" y2="2" /><line x1="13" y1="2.7" x2="13" y2="2" />
    <line x1="3" y1="13.3" x2="3" y2="14" /><line x1="13" y1="13.3" x2="13" y2="14" />
  </svg>
)
const IconComposite = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="12" height="3" rx="0.4" />
    <line x1="5" y1="14" x2="11" y2="14" /><line x1="8" y1="5" x2="8" y2="14" />
    <line x1="5" y1="13.3" x2="5" y2="14" /><line x1="11" y1="13.3" x2="11" y2="14" />
  </svg>
)
const IconGeotech = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    {/* Pile cap */}
    <rect x="2" y="2" width="12" height="3.5" rx="0.3" />
    {/* Piles */}
    <line x1="5" y1="5.5" x2="5" y2="13.5" strokeWidth="1.8" />
    <line x1="8" y1="5.5" x2="8" y2="13.5" strokeWidth="1.8" />
    <line x1="11" y1="5.5" x2="11" y2="13.5" strokeWidth="1.8" />
  </svg>
)
const IconOthers = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="4.5" cy="4.5" r="1.8" />
    <circle cx="11.5" cy="4.5" r="1.8" />
    <circle cx="4.5" cy="11.5" r="1.8" />
    <circle cx="11.5" cy="11.5" r="1.8" />
  </svg>
)

type CategoryFilter = 'all' | PostCategory

const CATEGORY_TABS: { value: CategoryFilter; labelKey: TranslationKey; activeColor: string; activeBg: string; activeBorder: string; icon: React.ReactNode }[] = [
  { value: 'all',          labelKey: 'nav_all',          activeColor: '#1877f2', activeBg: '#e7f3ff', activeBorder: '#b3d4ff', icon: <Home size={14} /> },
  { value: 'concrete',     labelKey: 'nav_concrete',     activeColor: '#374151', activeBg: '#f3f4f6', activeBorder: '#d1d5db', icon: <IconConcrete /> },
  { value: 'steel',        labelKey: 'nav_steel',        activeColor: '#1d4ed8', activeBg: '#eff6ff', activeBorder: '#bfdbfe', icon: <IconSteel /> },
  { value: 'composite',    labelKey: 'nav_composite',    activeColor: '#6d28d9', activeBg: '#f5f3ff', activeBorder: '#ddd6fe', icon: <IconComposite /> },
  { value: 'geotechnical', labelKey: 'nav_geotechnical', activeColor: '#065f46', activeBg: '#ecfdf5', activeBorder: '#6ee7b7', icon: <IconGeotech /> },
  { value: 'others',       labelKey: 'nav_others',       activeColor: '#b45309', activeBg: '#fffbeb', activeBorder: '#fde68a', icon: <IconOthers /> },
]

interface Props {
  user: User | null
  // true once the auth check has resolved. While false we don't know if the user is logged in,
  // so the sign-in button is hidden to avoid a logged-out flash on F5 before getUser() returns.
  authChecked?: boolean
  profile: Profile | null
  // category filter — pass null if the page doesn't use category filtering (e.g. profile page)
  categoryFilter?: CategoryFilter
  onCategoryChange?: (c: CategoryFilter) => void
  // notification / message / friend counts
  unreadNotifs?: number
  onUnreadNotifsChange?: (n: number | ((prev: number) => number)) => void
  unreadMsgs?: number
  onUnreadMsgsChange?: (n: number | ((prev: number) => number)) => void
  pendingFriends?: number
  onPendingFriendsChange?: (n: number | ((prev: number) => number)) => void
  onOpenChat?: (conv: any, peer: any) => void
  onNewMessage?: (convId: string, peer: any, showAfter?: string) => void
  onRegisterMarkRead?: (fn: (convId: string) => void) => void
  onRegisterSent?: (fn: (convId: string, body: string) => void) => void
  onRegisterRemoveConv?: (fn: (convId: string, deletedAt?: string) => void) => void
  openConvIds?: string[]
  onOpenPost?: (postId: string) => void
}

const AVATAR_COLORS = [
  'linear-gradient(135deg, #3b82f6, #8b5cf6)',
  'linear-gradient(135deg, #10b981, #3b82f6)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #ec4899, #8b5cf6)',
  'linear-gradient(135deg, #06b6d4, #10b981)',
  'linear-gradient(135deg, #f97316, #f59e0b)',
]

interface SearchResult {
  type: 'user' | 'post'
  id: string
  // user fields
  username?: string
  display_name?: string | null
  full_name?: string | null
  avatar_color?: number
  avatar_url?: string | null
  profession?: string | null
  // post fields
  body?: string | null
  author?: string | null
}

export default function TopNavBar({
  user, authChecked = true, profile,
  categoryFilter = 'all', onCategoryChange,
  unreadNotifs = 0, onUnreadNotifsChange,
  unreadMsgs = 0, onUnreadMsgsChange,
  pendingFriends = 0, onPendingFriendsChange,
  onOpenChat, onNewMessage, onRegisterMarkRead, onRegisterSent, onRegisterRemoveConv, openConvIds, onOpenPost,
}: Props) {
  const { t } = useTranslation()
  const displayName = profile?.display_name || profile?.full_name || user?.email?.split('@')[0] || ''

  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleSearchChange(q: string) {
    setSearchQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!q.trim()) { setSearchResults([]); setSearching(false); return }
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      const term = q.trim()
      const [{ data: users }, { data: posts }] = await Promise.all([
        supabase.from('profiles')
          .select('id, username, display_name, full_name, avatar_color, avatar_url, profession')
          .or(`username.ilike.%${term}%,display_name.ilike.%${term}%,full_name.ilike.%${term}%`)
          .limit(5),
        supabase.from('posts')
          .select('id, body, user_id, profiles!posts_user_id_fkey(display_name, full_name, username)')
          .ilike('body', `%${term}%`)
          .eq('visibility', 'public')
          .order('created_at', { ascending: false })
          .limit(5),
      ])
      const userResults: SearchResult[] = (users ?? []).map((u: any) => ({
        type: 'user', id: u.id, username: u.username, display_name: u.display_name,
        full_name: u.full_name, avatar_color: u.avatar_color, avatar_url: u.avatar_url,
        profession: u.profession,
      }))
      const postResults: SearchResult[] = (posts ?? []).map((p: any) => ({
        type: 'post', id: p.id, body: p.body,
        author: p.profiles?.display_name || p.profiles?.full_name || p.profiles?.username || '',
      }))
      setSearchResults([...userResults, ...postResults])
      setSearching(false)
    }, 300)
  }

  function clearSearch() {
    setSearchQuery('')
    setSearchResults([])
    setSearchFocused(false)
  }

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 200,
      background: '#fff', borderBottom: '1px solid #e4e6eb',
      height: 56, display: 'flex', alignItems: 'stretch',
      padding: '0 12px', boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
    }}>
      {/* Left: Logo + search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 8, flexShrink: 0 }}>
        <a href="/feed" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
          <img src="/logo.png" alt="CivilAxis" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: '#1e3a5f', letterSpacing: '-0.5px' }}>CivilAxis</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#6366f1', letterSpacing: '0.03em' }}>Community</span>
          </div>
        </a>

        {/* Search trigger / expanded input */}
        <div ref={searchRef} style={{ position: 'relative' }}>
          {searchFocused ? (
            <div style={{ display: 'flex', alignItems: 'center', background: '#f0f2f5', borderRadius: 20, padding: '0 12px', height: 36, border: '1.5px solid #3b82f6', width: 260 }}>
              <Search size={14} color="#65676b" style={{ flexShrink: 0, marginRight: 8 }} />
              <input
                autoFocus
                value={searchQuery}
                onChange={e => handleSearchChange(e.target.value)}
                onKeyDown={e => { if (e.key === 'Escape') clearSearch() }}
                placeholder="Search people and posts…"
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 13, color: '#050505' }}
              />
              <button onClick={clearSearch} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center', color: '#94a3b8' }}>
                <XIcon size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSearchFocused(true)}
              title="Search"
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px', height: 34, borderRadius: 20, border: 'none', background: '#f0f2f5', color: '#65676b', fontSize: 13, cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#e4e6eb' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f0f2f5' }}>
              <Search size={14} /> Search
            </button>
          )}

          {/* Dropdown */}
          {searchFocused && searchQuery.trim().length > 0 && (
            <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 6, width: 320, background: '#fff', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', border: '1px solid #e4e6eb', zIndex: 300, overflow: 'hidden' }}>
              {searching ? (
                <div style={{ padding: '16px', textAlign: 'center' as const, color: '#94a3b8', fontSize: 13 }}>Searching…</div>
              ) : searchResults.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center' as const, color: '#94a3b8', fontSize: 13 }}>No results for "{searchQuery}"</div>
              ) : (
                <>
                  {searchResults.filter(r => r.type === 'user').length > 0 && (
                    <>
                      <div style={{ padding: '8px 14px 4px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>People</div>
                      {searchResults.filter(r => r.type === 'user').map(r => {
                        const name = r.display_name || r.full_name || r.username || ''
                        const initial = name[0]?.toUpperCase() ?? '?'
                        return (
                          <a key={r.id} href={`/u/${r.username}`}
                            onClick={clearSearch}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', textDecoration: 'none', color: '#050505' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#f0f2f5' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: AVATAR_COLORS[r.avatar_color ?? 0], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', overflow: 'hidden', flexShrink: 0 }}>
                              {r.avatar_url ? <img src={r.avatar_url} alt={initial} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initial}
                            </div>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 700 }}>{name}</div>
                              <div style={{ fontSize: 12, color: '#65676b' }}>@{r.username}{r.profession ? ` · ${r.profession}` : ''}</div>
                            </div>
                          </a>
                        )
                      })}
                    </>
                  )}
                  {searchResults.filter(r => r.type === 'post').length > 0 && (
                    <>
                      {searchResults.filter(r => r.type === 'user').length > 0 && <div style={{ height: 1, background: '#f0f2f5', margin: '4px 0' }} />}
                      <div style={{ padding: '8px 14px 4px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Posts</div>
                      {searchResults.filter(r => r.type === 'post').map(r => (
                        <button key={r.id}
                          onClick={() => { onOpenPost?.(r.id); clearSearch() }}
                          style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 14px', width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' as const }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#f0f2f5' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                          <div style={{ fontSize: 18, flexShrink: 0, marginTop: 2 }}>📝</div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#050505', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{r.body}</div>
                            <div style={{ fontSize: 12, color: '#65676b' }}>by {r.author}</div>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Center: category tabs */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, overflowX: 'auto', scrollbarWidth: 'none' as const }}>
        {CATEGORY_TABS.map(tab => {
          const active = categoryFilter === tab.value
          return (
            <button key={tab.value}
              onClick={() => onCategoryChange?.(tab.value)}
              title={t(tab.labelKey)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 36, height: 34, borderRadius: 8, flexShrink: 0, padding: 0,
                border: `1.5px solid ${active ? tab.activeBorder : 'transparent'}`,
                background: active ? tab.activeBg : 'transparent',
                color: active ? tab.activeColor : '#65676b',
                cursor: 'pointer', transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#f0f2f5'; e.currentTarget.style.color = '#050505' } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#65676b' } }}>
              {tab.icon}
            </button>
          )
        })}
      </div>

      {/* Right: CivilAxis link + icons + account.
          minWidth reserves the logged-in width up front so the centered category tabs don't
          shift left when the avatar/icons mount after the async auth check (the F5 jump). */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minWidth: 290, gap: 4 }}>
        <a href="/"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '0 12px', height: 34, borderRadius: 8, textDecoration: 'none',
            border: '1.5px solid transparent', background: 'transparent',
            color: '#65676b', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' as const,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#f0f2f5'; (e.currentTarget as HTMLAnchorElement).style.color = '#050505' }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; (e.currentTarget as HTMLAnchorElement).style.color = '#65676b' }}>
          <GraduationCap size={15} /> {t('nav_civilbase')}
        </a>

        {user && (
          <>
            <FriendRequestDropdown
              userId={user.id}
              pendingCount={pendingFriends}
              onCountChange={onPendingFriendsChange ?? (() => {})}
            />
            <MessageDropdown
              userId={user.id}
              unreadCount={unreadMsgs}
              onUnreadChange={onUnreadMsgsChange ?? (() => {})}
              onOpenChat={(conv, peer) => onOpenChat?.(conv, peer)}
              onNewMessage={(convId, peer, showAfter) => onNewMessage?.(convId, peer, showAfter)}
              onRegisterMarkRead={onRegisterMarkRead}
              onRegisterSent={onRegisterSent}
              onRegisterRemoveConv={onRegisterRemoveConv}
              openConvIds={openConvIds}
            />
            <NotificationDropdown
              userId={user.id}
              unreadCount={unreadNotifs}
              onUnreadChange={onUnreadNotifsChange ?? (() => {})}
              onOpenPost={onOpenPost}
            />
            <AccountMenu
              user={user}
              profile={profile}
              avatarColor={profile?.avatar_color ?? 0}
              avatarUrl={profile?.avatar_url ?? null}
              displayName={displayName}
              profileUsername={profile?.username ?? null}
              size={28}
              dark={false}
            />
          </>
        )}
        {authChecked && !user && (
          <button onClick={() => setShowAuthModal(true)}
            style={{ padding: '8px 18px', borderRadius: 8, background: '#3b82f6', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            {t('nav_sign_in')}
          </button>
        )}
      </div>
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          signIn={async (email, password) => {
            const { error } = await supabase.auth.signInWithPassword({ email, password })
            if (!error) setShowAuthModal(false)
            return error
          }}
          signUp={signUpWithProfile}
        />
      )}
    </div>
  )
}
