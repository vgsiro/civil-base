'use client'
import { GraduationCap, Home } from 'lucide-react'
import { useTranslation } from '../i18n/LanguageContext'
import type { TranslationKey } from '../i18n/index'
import type { PostCategory } from '../types'
import AccountMenu from './AccountMenu'
import NotificationDropdown from './NotificationDropdown'
import MessageDropdown from './MessageDropdown'
import FriendRequestDropdown from './FriendRequestDropdown'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '../types'

// ── Category SVG icons ────────────────────────────────────────────────────────
const IconConcrete = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="14" height="8" rx="0.5" />
    <circle cx="3.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    <circle cx="3.5" cy="9.5" r="0.8" fill="currentColor" stroke="none" />
    <circle cx="12.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    <circle cx="12.5" cy="9.5" r="0.8" fill="currentColor" stroke="none" />
    <line x1="1" y1="8" x2="15" y2="8" strokeDasharray="2 1.5" />
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
    <line x1="1" y1="6" x2="15" y2="6" /><line x1="1" y1="10" x2="15" y2="10" />
    <line x1="8" y1="1" x2="8" y2="15" strokeWidth="2" />
    <line x1="6" y1="13" x2="8" y2="15" /><line x1="10" y1="13" x2="8" y2="15" />
  </svg>
)
const IconOthers = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="6.5" />
    <path d="M8 5.5a1.5 1.5 0 0 1 0 3" />
    <circle cx="8" cy="11" r="0.7" fill="currentColor" stroke="none" />
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
  onOpenPost?: (postId: string) => void
  onSignIn?: () => void
}

export default function TopNavBar({
  user, profile,
  categoryFilter = 'all', onCategoryChange,
  unreadNotifs = 0, onUnreadNotifsChange,
  unreadMsgs = 0, onUnreadMsgsChange,
  pendingFriends = 0, onPendingFriendsChange,
  onOpenChat, onOpenPost, onSignIn,
}: Props) {
  const { t } = useTranslation()
  const displayName = profile?.display_name || profile?.full_name || user?.email?.split('@')[0] || ''

  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 200,
      background: '#fff', borderBottom: '1px solid #e4e6eb',
      height: 56, display: 'flex', alignItems: 'stretch',
      padding: '0 12px', boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
    }}>
      {/* Left: Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 200, paddingRight: 8 }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <img src="/logo.png" alt="Civil Base" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          <span style={{ fontSize: 20, fontWeight: 800, color: '#1e3a5f', letterSpacing: '-0.5px' }}>Civil Base</span>
        </a>
      </div>

      {/* Center: category tabs */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, overflowX: 'auto', scrollbarWidth: 'none' as const }}>
        {CATEGORY_TABS.map(tab => {
          const active = categoryFilter === tab.value
          return (
            <button key={tab.value}
              onClick={() => onCategoryChange?.(tab.value)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                padding: '0 12px', height: 34, borderRadius: 8, flexShrink: 0,
                border: `1.5px solid ${active ? tab.activeBorder : 'transparent'}`,
                background: active ? tab.activeBg : 'transparent',
                color: active ? tab.activeColor : '#65676b',
                fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer', whiteSpace: 'nowrap' as const,
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#f0f2f5'; e.currentTarget.style.color = '#050505' } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#65676b' } }}>
              {tab.icon}
              {t(tab.labelKey)}
            </button>
          )
        })}
      </div>

      {/* Right: Civil Base link + icons + account */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minWidth: 200, gap: 4 }}>
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
            />
            <NotificationDropdown
              userId={user.id}
              unreadCount={unreadNotifs}
              onUnreadChange={onUnreadNotifsChange ?? (() => {})}
              onOpenPost={onOpenPost}
            />
            <AccountMenu
              user={user}
              avatarColor={profile?.avatar_color ?? 0}
              avatarUrl={profile?.avatar_url ?? null}
              displayName={displayName}
              profileUsername={profile?.username ?? null}
              size={28}
              dark={false}
            />
          </>
        )}
        {!user && (
          <button onClick={onSignIn}
            style={{ padding: '8px 18px', borderRadius: 8, background: '#3b82f6', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            {t('nav_sign_in')}
          </button>
        )}
      </div>
    </div>
  )
}
