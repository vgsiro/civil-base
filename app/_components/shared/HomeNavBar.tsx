'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '../../_types'
import AccountMenu from '../social/user/AccountMenu'
import NotificationDropdown from '../social/notifications/NotificationDropdown'
import MessageDropdown from '../social/messaging/MessageDropdown'
import FriendRequestDropdown from '../social/messaging/FriendRequestDropdown'
import FeedbackModal from '../social/notifications/FeedbackModal'
import ChatBox from '../social/messaging/ChatBox'
import { useMessagingChat } from '../../_hooks/useMessagingChat'
import { useTranslation } from '../../i18n/LanguageContext'

interface Props {
  /** Content shown between the logo and the right icons (breadcrumb, title, etc.) */
  children?: React.ReactNode
  /** Dark header background — uses white text/icons */
  dark?: boolean
  /** Page label shown as context badge in the feedback modal */
  pageLabel?: string
}

export default function HomeNavBar({ children, dark = false, pageLabel }: Props) {
  const { t } = useTranslation()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const [unreadMsgs, setUnreadMsgs] = useState(0)
  const [pendingFriends, setPendingFriends] = useState(0)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const chat = useMessagingChat()

  // Badge counts are self-seeded by NotificationDropdown / FriendRequestDropdown.
  // Seed the profile (avatar/name) from the localStorage cache first so the account-menu avatar
  // shows the real image on first paint instead of the initials/default circle until the fetch.
  function loadProfile(uid: string) {
    try {
      const cached = localStorage.getItem(`civilbase_profile_${uid}`)
      if (cached) setProfile(JSON.parse(cached) as Profile)
    } catch {}
    supabase.from('profiles').select('*').eq('id', uid).maybeSingle().then(({ data }) => {
      if (data) {
        setProfile(data as Profile)
        try { localStorage.setItem(`civilbase_profile_${uid}`, JSON.stringify(data)) } catch {}
      }
    })
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      if (u) loadProfile(u.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null
      setUser(u)
      if (!u) { setProfile(null); return }
      loadProfile(u.id)
    })
    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const displayName = profile?.display_name || profile?.full_name || user?.email?.split('@')[0] || ''

  const logoStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0,
  }

  const communityBtnStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '0 12px', height: 34, borderRadius: 8,
    border: `1.5px solid ${dark ? 'rgba(255,255,255,0.2)' : 'transparent'}`,
    background: 'transparent', cursor: 'pointer',
    color: dark ? 'rgba(255,255,255,0.8)' : '#65676b',
    fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' as const,
  }

  const pageContext = pageLabel
    ? { label: pageLabel, url: typeof window !== 'undefined' ? window.location.href : '' }
    : undefined

  const footerStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '10px 16px',
    borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : '#e4e6eb'}`,
    fontSize: 12, color: dark ? 'rgba(255,255,255,0.35)' : '#94a3b8',
  }

  return (
    <>
      {/* Floating ChatBoxes */}
      {user && chat.openChats.map((c, i) => (
        <ChatBox key={c.convId} userId={user.id} {...chat.chatBoxProps(c, i)} />
      ))}
      {showFeedback && (
        <FeedbackModal user={user} onClose={() => setShowFeedback(false)} pageContext={pageContext} />
      )}

      {/* Confirm modal */}
      {showConfirm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', width: '100%', maxWidth: 400, padding: '28px 28px 24px' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>{t('nav_confirm_title')}</div>
            <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, marginBottom: 24 }}>
              {t('nav_confirm_body')}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                {t('nav_confirm_stay')}
              </button>
              <button
                onClick={() => { window.location.href = '/feed' }}
                style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = '#2563eb'}
                onMouseLeave={e => e.currentTarget.style.background = '#3b82f6'}>
                {t('nav_confirm_go')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '0 16px', height: 56, flexShrink: 0,
      }}>
        {/* Logo */}
        <a href="/" style={logoStyle}>
          <img src="/logo.png" alt="CivilAxis" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: dark ? '#f1f5f9' : '#1e3a5f' }}>CivilAxis</span>
        </a>

        {/* Breadcrumb slot */}
        {children && (
          <>
            <span style={{ color: dark ? '#475569' : '#d1d5db', fontSize: 16 }}>/</span>
            {children}
          </>
        )}

        <div style={{ flex: 1 }} />

        {/* Donate button — only on tool pages */}
        {pageLabel && (
          <a href="/donate"
            title="Support CivilAxis — buy me a coffee ☕"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px', height: 34, borderRadius: 8, border: `1.5px solid ${dark ? 'rgba(255,255,255,0.2)' : 'transparent'}`, background: 'transparent', cursor: 'pointer', color: dark ? 'rgba(255,255,255,0.8)' : '#65676b', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' as const, textDecoration: 'none' }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = dark ? 'rgba(255,255,255,0.1)' : '#f0f2f5'; (e.currentTarget as HTMLAnchorElement).style.color = dark ? '#fff' : '#050505' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; (e.currentTarget as HTMLAnchorElement).style.color = dark ? 'rgba(255,255,255,0.8)' : '#65676b' }}>
            {t('nav_btn_support')}
          </a>
        )}

        {/* Feedback button */}
        <button
          onClick={() => setShowFeedback(true)}
          title={pageLabel ? `Report an issue or give feedback about ${pageLabel}` : 'Send feedback or report an issue'}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px', height: 34, borderRadius: 8, border: `1.5px solid ${dark ? 'rgba(255,255,255,0.2)' : 'transparent'}`, background: 'transparent', cursor: 'pointer', color: dark ? 'rgba(255,255,255,0.8)' : '#65676b', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' as const }}
          onMouseEnter={e => { e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.1)' : '#f0f2f5'; e.currentTarget.style.color = dark ? '#fff' : '#050505' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = dark ? 'rgba(255,255,255,0.8)' : '#65676b' }}>
          {pageLabel ? t('nav_btn_feedback_page') : t('nav_btn_feedback')}
        </button>

        {/* Community button */}
        <button
          onClick={() => setShowConfirm(true)}
          title="Go to the CivilAxis community feed"
          style={communityBtnStyle}
          onMouseEnter={e => { e.currentTarget.style.background = dark ? 'rgba(255,255,255,0.1)' : '#f0f2f5'; e.currentTarget.style.color = dark ? '#fff' : '#050505' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = dark ? 'rgba(255,255,255,0.8)' : '#65676b' }}>
          {t('nav_btn_community')}
        </button>

        {/* Social icons */}
        {user && (
          <>
            <FriendRequestDropdown
              userId={user.id}
              pendingCount={pendingFriends}
              onCountChange={setPendingFriends}
            />
            <MessageDropdown
              userId={user.id}
              unreadCount={unreadMsgs}
              onUnreadChange={setUnreadMsgs}
              {...chat.dropdownHandlers}
            />
            <NotificationDropdown
              userId={user.id}
              unreadCount={unreadNotifs}
              onUnreadChange={setUnreadNotifs}
            />
            <AccountMenu
              user={user}
              profile={profile}
              avatarColor={profile?.avatar_color ?? 0}
              avatarUrl={profile?.avatar_url ?? null}
              displayName={displayName}
              profileUsername={profile?.username ?? null}
              size={42}
              dark={dark}
            />
          </>
        )}
      </div>
    </>
  )
}
