'use client'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Bell, Heart, MessageCircle, UserPlus, BadgeCheck, X, AtSign, ExternalLink, Users, ShieldAlert, FileWarning, ExternalLink as ExternalLinkIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Notification, NotificationType } from '../../../_types'
import { useTranslation } from '../../../i18n/LanguageContext'

const AVATAR_COLORS = [
  'linear-gradient(135deg, #3b82f6, #8b5cf6)',
  'linear-gradient(135deg, #10b981, #3b82f6)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #ec4899, #8b5cf6)',
  'linear-gradient(135deg, #06b6d4, #10b981)',
  'linear-gradient(135deg, #f97316, #f59e0b)',
]

const TYPE_META: Record<NotificationType, { icon: React.ReactNode; bg: string }> = {
  like:             { icon: <Heart size={11} fill="#ef4444" color="#ef4444" />,  bg: '#fef2f2' },
  comment:          { icon: <MessageCircle size={11} color="#3b82f6" />,         bg: '#eff6ff' },
  follow:           { icon: <UserPlus size={11} color="#10b981" />,              bg: '#f0fdf4' },
  verify_approved:  { icon: <BadgeCheck size={11} color="#0369a1" />,            bg: '#e0f2fe' },
  verify_rejected:  { icon: <X size={11} color="#ef4444" />,                     bg: '#fef2f2' },
  verify_revoked:   { icon: <X size={11} color="#ef4444" />,                     bg: '#fef2f2' },
  mention:          { icon: <AtSign size={11} color="#8b5cf6" />,                bg: '#f5f3ff' },
  friend_request:   { icon: <Users size={11} color="#f59e0b" />,                 bg: '#fffbeb' },
  friend_accepted:  { icon: <Users size={11} color="#10b981" />,                 bg: '#f0fdf4' },
  post_deleted:     { icon: <X size={11} color="#ef4444" />,                     bg: '#fef2f2' },
  post_warned:      { icon: <X size={11} color="#f59e0b" />,                     bg: '#fffbeb' },
  upgrade_approved:  { icon: <BadgeCheck size={11} color="#10b981" />,           bg: '#f0fdf4' },
  upgrade_rejected:  { icon: <X size={11} color="#ef4444" />,                    bg: '#fef2f2' },
  tier_downgraded:   { icon: <X size={11} color="#f59e0b" />,                    bg: '#fffbeb' },
}

function timeAgo(d: string, nowLabel = 'now') {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (m < 1) return nowLabel
  if (m < 60) return `${m}m`
  if (m < 1440) return `${Math.floor(m / 60)}h`
  if (m < 10080) return `${Math.floor(m / 1440)}d`
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

// Message strings are resolved via t() inside the component — see notifMsg()

interface Props {
  userId: string
  unreadCount: number
  onUnreadChange: (n: number) => void
  onOpenPost?: (postId: string) => void
}

export default function NotificationDropdown({ userId, unreadCount, onUnreadChange, onOpenPost }: Props) {
  const { t } = useTranslation()

  function notifMsg(type: NotificationType): string {
    switch (type) {
      case 'like':            return t('notif_liked')
      case 'comment':         return t('notif_commented')
      case 'follow':          return t('notif_following')
      case 'verify_approved': return t('notif_verify_approved')
      case 'verify_rejected': return t('notif_verify_rejected')
      case 'mention':         return t('notif_mentioned')
      case 'friend_request':  return t('notif_friend_request')
      case 'friend_accepted': return t('notif_friend_accepted')
      case 'post_deleted':    return t('notif_post_deleted')
      case 'post_warned':     return t('notif_post_warned')
      default:                return ''
    }
  }

  const PREVIEW_MAX = 80

  const PAGE_SIZE = 10

  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [loaded, setLoaded] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [previewNotif, setPreviewNotif] = useState<Notification | null>(null)
  const [warningNotif, setWarningNotif] = useState<Notification | null>(null)
  const [verifyNotif, setVerifyNotif] = useState<Notification | null>(null)
  const [revokeNotif, setRevokeNotif] = useState<Notification | null>(null)
  const [upgradeNotif, setUpgradeNotif] = useState<Notification | null>(null)
  const [downgradeNotif, setDowngradeNotif] = useState<Notification | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [mounted, setMounted] = useState(typeof window !== 'undefined')
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    supabase.from('profiles').select('username').eq('id', userId).single()
      .then(({ data }) => { if (data) setUsername((data as any).username) })
  }, [userId])

  // Self-seed the unread badge count on mount so every nav shows the same number without the
  // parent having to query it. Skip if the dropdown has already been opened (which clears the
  // badge) so we don't resurrect a just-cleared count.
  const seededRef = useRef(false)
  useEffect(() => {
    if (seededRef.current) return
    seededRef.current = true
    supabase.from('notifications').select('*', { count: 'exact', head: true })
      .eq('user_id', userId).eq('read', false)
      .then(({ count }) => { if (!open) onUnreadChange(count ?? 0) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Clear badge on open (visual only); load list on first open
  useEffect(() => {
    if (!open) return
    onUnreadChange(0)
    if (!loaded) load()
  }, [open])

  // Real-time new notifications — stable subscription, never torn down on count change
  const unreadCountRef = useRef(unreadCount)
  useEffect(() => { unreadCountRef.current = unreadCount }, [unreadCount])

  useEffect(() => {
    const sub = supabase.channel(`notif-dropdown-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, async payload => {
        const n = payload.new as Notification
        // Realtime payload has no joins — fetch actor + post separately
        const [actorRes, postRes] = await Promise.all([
          n.actor_id ? supabase.from('profiles').select('username, display_name, full_name, avatar_color, avatar_url').eq('id', n.actor_id).single() : Promise.resolve({ data: null }),
          n.post_id  ? supabase.from('posts').select('body, media_url').eq('id', n.post_id).single() : Promise.resolve({ data: null }),
        ])
        setNotifs(prev => [{ ...n, actor: actorRes.data ?? undefined, post: postRes.data ?? undefined } as Notification, ...prev])
        onUnreadChange(unreadCountRef.current + 1)
      })
      .subscribe()
    return () => { sub.unsubscribe() }
  }, [userId])

  async function enrichAndAppend(data: any[], append: boolean) {
    const postIds = [...new Set(data.filter(n => n.post_id).map(n => n.post_id as string))]
    let postMap: Record<string, { body: string | null; media_url: string | null }> = {}
    if (postIds.length > 0) {
      const { data: posts } = await supabase.from('posts').select('id, body, media_url').in('id', postIds)
      if (posts) posts.forEach((p: any) => { postMap[p.id] = { body: p.body, media_url: p.media_url } })
    }
    const enriched = data.map(n => ({ ...n, post: n.post_id ? postMap[n.post_id] : undefined })) as Notification[]
    setNotifs(prev => append ? [...prev, ...enriched] : enriched)
  }

  async function load() {
    const { data } = await supabase
      .from('notifications')
      .select('*, actor:actor_id(username, display_name, full_name, avatar_color, avatar_url)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE + 1)
    if (!data) { setLoaded(true); return }

    setHasMore(data.length > PAGE_SIZE)
    await enrichAndAppend(data.slice(0, PAGE_SIZE), false)
    setLoaded(true)
  }

  async function loadMore() {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    const oldest = notifs[notifs.length - 1]?.created_at
    const { data } = await supabase
      .from('notifications')
      .select('*, actor:actor_id(username, display_name, full_name, avatar_color, avatar_url)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .lt('created_at', oldest)
      .limit(PAGE_SIZE + 1)
    if (data) {
      setHasMore(data.length > PAGE_SIZE)
      await enrichAndAppend(data.slice(0, PAGE_SIZE), true)
    }
    setLoadingMore(false)
  }

  async function markAllRead() {
    // Optimistic update first
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
    onUnreadChange(0)
    const { error } = await supabase
      .from('notifications').update({ read: true })
      .eq('user_id', userId).eq('read', false)
    if (error) console.error('[markAllRead]', error.message)
  }

  async function markOne(id: string) {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    const { error, count } = await supabase
      .from('notifications').update({ read: true }, { count: 'exact' })
      .eq('id', id).eq('user_id', userId)
    if (error) console.error('[markOne] error:', error.message)
    else if (count === 0) console.warn('[markOne] 0 rows updated — RLS may be blocking the write')
  }

  async function deleteOne(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    setNotifs(prev => prev.filter(n => n.id !== id))
    const { error } = await supabase.from('notifications').delete().eq('id', id).eq('user_id', userId)
    if (error) console.error('[deleteOne]', error.message)
  }

  async function handleClick(n: Notification) {
    if (!n.read) await markOne(n.id)
    setOpen(false)
    if (n.type === 'post_warned' || n.type === 'post_deleted') {
      setWarningNotif(n)
      return
    }
    if (n.type === 'verify_approved') {
      setVerifyNotif(n)
      return
    }
    if (n.type === 'verify_revoked' || n.type === 'verify_rejected') {
      setRevokeNotif(n)
      return
    }
    if (n.type === 'upgrade_approved' || n.type === 'upgrade_rejected') {
      setUpgradeNotif(n)
      return
    }
    if (n.type === 'tier_downgraded') {
      setDowngradeNotif(n)
      return
    }
    if (n.post_id && onOpenPost) {
      onOpenPost(n.post_id)
    } else if (n.post_id) {
      window.location.href = `/feed?post=${n.post_id}`
    } else {
      const actor = n.actor as any
      if (actor?.username) window.location.href = `/u/${actor.username}`
    }
  }

  const displayed = filter === 'unread' ? notifs.filter(n => !n.read) : notifs

  // Warning modal portal
  const warningModal = warningNotif && mounted ? createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ background: warningNotif.type === 'post_deleted' ? 'linear-gradient(135deg, #dc2626, #b91c1c)' : 'linear-gradient(135deg, #d97706, #b45309)', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 24 }}>
            {warningNotif.type === 'post_deleted' ? '🚫' : '⚠️'}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>
              {warningNotif.type === 'post_deleted' ? 'Your post was removed' : 'You have received a warning'}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>From CivilAxis Admin</div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Main message */}
          <div style={{ fontSize: 15, color: '#0f172a', lineHeight: 1.65 }}>
            {warningNotif.type === 'post_deleted' ? (
              <>You have received <strong>1 warning</strong> from <strong>CivilAxis Admin</strong> because your post was removed for violating our community standards.</>
            ) : (
              <>You have received <strong>1 warning</strong> from <strong>CivilAxis Admin</strong> because your post was flagged as potentially violating our community standards.</>
            )}
          </div>

          {/* Reason box */}
          {warningNotif.message && (
            <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#854d0e', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 4 }}>Reason</div>
              <div style={{ fontSize: 14, color: '#713f12', lineHeight: 1.6 }}>{warningNotif.message}</div>
            </div>
          )}

          {/* Policy notice */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldAlert size={16} color="#dc2626" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>3-Strike Policy</span>
            </div>
            <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
              Receiving <strong>3 warnings</strong> will result in your account being <strong style={{ color: '#dc2626' }}>permanently banned</strong> from CivilAxis. Please review our community guidelines and ensure your posts comply with our standards.
            </div>
            <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
              Please do not repeat this behavior in the future. Continued violations may result in further action being taken against your account.
            </div>
          </div>

          {/* View post + guidelines links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <a href={warningNotif.post_id ? `/post/${warningNotif.post_id}` : username ? `/u/${username}` : '/feed'}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 8, border: `1px solid ${warningNotif.type === 'post_deleted' ? '#fecaca' : '#fde68a'}`, background: warningNotif.type === 'post_deleted' ? '#fef2f2' : '#fffbeb', textDecoration: 'none', color: warningNotif.type === 'post_deleted' ? '#dc2626' : '#b45309', fontSize: 14, fontWeight: 600 }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.85' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1' }}>
              <FileWarning size={16} />
              {warningNotif.post_id ? 'View the flagged post' : 'View on your profile'}
              <ExternalLinkIcon size={13} style={{ marginLeft: 'auto' }} />
            </a>
            <a href="/guidelines" target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', textDecoration: 'none', color: '#475569', fontSize: 14, fontWeight: 600 }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#f1f5f9' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#f8fafc' }}>
              <ShieldAlert size={16} />
              Read our Community Guidelines
              <ExternalLinkIcon size={13} style={{ marginLeft: 'auto' }} />
            </a>
          </div>

          {/* Agreement + close */}
          <div style={{ marginTop: 4 }}>
            <button
              onClick={() => setWarningNotif(null)}
              style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: warningNotif.type === 'post_deleted' ? '#dc2626' : '#d97706', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.9' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}>
              I understand and agree to follow the guidelines
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  ) : null

  const verifyModal = verifyNotif && mounted ? createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.35)', width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #0369a1, #0284c7, #38bdf8)', padding: '28px 28px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
            🛡️
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: -0.3 }}>You're now verified!</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>Welcome to the CivilAxis professional community</div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Motivational pillars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: '🏗️', title: 'Be responsible', desc: 'Your badge signals trust. Share only what you know to be accurate — the community counts on it.' },
              { icon: '🤝', title: 'Help the community', desc: 'Answer questions, mentor juniors, and lift others up. Every expert was once a beginner.' },
              { icon: '💡', title: 'Share your knowledge', desc: 'Post insights, case studies, and lessons learned. Real-world experience is the most valuable content here.' },
            ].map(item => (
              <div key={item.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, background: '#f8fafc', borderRadius: 12, padding: '14px 16px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 24, flexShrink: 0, lineHeight: 1 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>{item.title}</div>
                  <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.55 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* View guidelines link */}
          <a href="/guidelines" target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 16px', borderRadius: 10, border: '1px solid #bae6fd', background: '#f0f9ff', textDecoration: 'none', color: '#0369a1', fontSize: 14, fontWeight: 600 }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#e0f2fe' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#f0f9ff' }}>
            <BadgeCheck size={16} />
            Read our Community Guidelines
            <ExternalLink size={13} style={{ marginLeft: 'auto' }} />
          </a>

          {/* Agree & continue */}
          <button
            onClick={() => { setVerifyNotif(null); if (username) window.location.href = `/u/${username}` }}
            style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #0369a1, #0284c7)', color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer', letterSpacing: 0.2 }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.92' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}>
            I agree — view my profile
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null

  const revokeModal = revokeNotif && mounted ? createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.35)', width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)', padding: '28px 28px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' as const }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
            🛡️
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: -0.3 }}>
              {revokeNotif.type === 'verify_rejected' ? 'Verification rejected' : 'Verification revoked'}
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
              {revokeNotif.type === 'verify_rejected' ? 'Your verification request was not approved' : 'Your professional badge has been removed'}
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Apology message */}
          <div style={{ fontSize: 15, color: '#0f172a', lineHeight: 1.65 }}>
            {revokeNotif.type === 'verify_rejected'
              ? <>We're sorry to inform you that your professional verification request was <strong>not approved by CivilAxis Admin</strong>. Your profile remains active, but without a verified badge.</>
              : <>We're sorry to inform you that your professional verification has been <strong>revoked by CivilAxis Admin</strong>. Your verified badge is no longer visible on your profile and posts.</>}
          </div>

          {/* Reason box */}
          {revokeNotif.message && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#991b1b', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 4 }}>Reason</div>
              <div style={{ fontSize: 14, color: '#7f1d1d', lineHeight: 1.6 }}>{revokeNotif.message}</div>
            </div>
          )}

          {/* What you can do */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { icon: '📋', title: 'Review the guidelines', desc: 'Make sure your activity aligns with CivilAxis community standards.' },
              { icon: '🔄', title: 'Reapply for verification', desc: 'You may submit a new verification request with updated documentation at any time.' },
              { icon: '✉️', title: 'Contact support', desc: 'If you believe this decision was made in error, please reach out via the support ticket system.' },
            ].map(item => (
              <div key={item.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: '#f8fafc', borderRadius: 10, padding: '12px 14px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 20, flexShrink: 0, lineHeight: 1 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Guidelines link */}
          <a href="/guidelines" target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 16px', borderRadius: 10, border: '1px solid #fecaca', background: '#fff1f2', textDecoration: 'none', color: '#dc2626', fontSize: 14, fontWeight: 600 }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#ffe4e6' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#fff1f2' }}>
            <ShieldAlert size={16} />
            Read our Community Guidelines
            <ExternalLink size={13} style={{ marginLeft: 'auto' }} />
          </a>

          {/* Close */}
          <button
            onClick={() => { setRevokeNotif(null); if (username) window.location.href = `/u/${username}` }}
            style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: '#dc2626', color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.9' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}>
            I understand — view my profile
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null

  const upgradeModal = upgradeNotif && mounted ? createPortal(
    (() => {
      const msg = upgradeNotif.message ?? ''
      const tierMatch = msg.match(/\[tier:(pro|premium)\]/)
      const tier = (tierMatch?.[1] ?? 'pro') as 'pro' | 'premium'
      const reason = msg.replace(/\[tier:(pro|premium)\]\s*/, '').trim()
      const isApproved = upgradeNotif.type === 'upgrade_approved'
      const isPremium = tier === 'premium'

      const APPROVED_META = {
        pro: {
          gradient: 'linear-gradient(135deg, #2563eb, #3b82f6)',
          emoji: '🚀',
          title: 'Pro access granted!',
          subtitle: 'Your account has been upgraded to Pro',
          badgeColor: '#3b82f6',
          badgeBg: '#eff6ff',
          itemBg: '#eff6ff',
          itemBorder: '#bfdbfe',
          btnBg: '#2563eb',
          items: [
            { icon: '🔍', title: 'Full calculation details', desc: 'Step-by-step breakdowns for ULS, SLS and shear-torsion checks.' },
            { icon: '📊', title: 'All result panels', desc: 'No more locked sections — every tab is now fully accessible.' },
            { icon: '⚡', title: 'Priority access', desc: 'Enjoy a richer experience across all CivilAxis tools.' },
          ],
        },
        premium: {
          gradient: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
          emoji: '💎',
          title: 'Premium access granted!',
          subtitle: 'Your account has been upgraded to Premium',
          badgeColor: '#7c3aed',
          badgeBg: '#f5f3ff',
          itemBg: '#f5f3ff',
          itemBorder: '#ddd6fe',
          btnBg: '#7c3aed',
          items: [
            { icon: '🔍', title: 'Full calculation details', desc: 'Complete step-by-step breakdowns for all engineering checks.' },
            { icon: '📄', title: 'Export PDF reports', desc: 'Download professional PDF reports for client deliverables.' },
            { icon: '🌟', title: 'Priority support', desc: 'Get priority assistance via the support ticket system.' },
          ],
        },
      }

      const REJECTED_META = {
        pro: {
          gradient: 'linear-gradient(135deg, #d97706, #b45309)',
          emoji: '📋',
          title: 'Pro request not approved',
          subtitle: 'Your Pro upgrade request was reviewed',
          itemBg: '#fffbeb',
          itemBorder: '#fde68a',
          btnBg: '#d97706',
        },
        premium: {
          gradient: 'linear-gradient(135deg, #7c3aed80, #6d28d9)',
          emoji: '📋',
          title: 'Premium request not approved',
          subtitle: 'Your Premium upgrade request was reviewed',
          itemBg: '#f5f3ff',
          itemBorder: '#ddd6fe',
          btnBg: '#7c3aed',
        },
      }

      const am = APPROVED_META[tier]
      const rm = REJECTED_META[tier]
      const gradient = isApproved ? am.gradient : rm.gradient
      const emoji = isApproved ? am.emoji : rm.emoji
      const title = isApproved ? am.title : rm.title
      const subtitle = isApproved ? am.subtitle : rm.subtitle
      const btnBg = isApproved ? am.btnBg : rm.btnBg

      return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.35)', width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ background: gradient, padding: '28px 28px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' as const }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                {emoji}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: -0.3 }}>{title}</div>
                  {isApproved && <span style={{ fontSize: 11, fontWeight: 800, color: am.badgeColor, background: am.badgeBg, padding: '2px 10px', borderRadius: 20 }}>{isPremium ? 'Premium' : 'Pro'}</span>}
                </div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>{subtitle}</div>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {isApproved ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {am.items.map(item => (
                    <div key={item.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: am.itemBg, borderRadius: 10, padding: '12px 14px', border: `1px solid ${am.itemBorder}` }}>
                      <span style={{ fontSize: 20, flexShrink: 0, lineHeight: 1 }}>{item.icon}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{item.title}</div>
                        <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {reason && (
                    <div style={{ background: rm.itemBg, border: `1px solid ${rm.itemBorder}`, borderRadius: 10, padding: '12px 16px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 4 }}>Reason</div>
                      <div style={{ fontSize: 14, color: '#78350f', lineHeight: 1.6 }}>{reason}</div>
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { icon: '🔄', title: 'Resubmit your request', desc: 'You can send a new upgrade request at any time from the tool page.' },
                      { icon: '✉️', title: 'Contact support', desc: 'If you have questions, reach us via the support ticket system.' },
                    ].map(item => (
                      <div key={item.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: rm.itemBg, borderRadius: 10, padding: '12px 14px', border: `1px solid ${rm.itemBorder}` }}>
                        <span style={{ fontSize: 20, flexShrink: 0, lineHeight: 1 }}>{item.icon}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{item.title}</div>
                          <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <button
                onClick={() => setUpgradeNotif(null)}
                style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: btnBg, color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.9' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}>
                {isApproved ? `Got it — start using ${isPremium ? 'Premium' : 'Pro'}` : 'OK, I understand'}
              </button>
            </div>
          </div>
        </div>
      )
    })(),
    document.body
  ) : null

  const downgradeModal = downgradeNotif && mounted ? createPortal(
    (() => {
      const msg = downgradeNotif.message ?? ''
      const fromMatch = msg.match(/\[from:(\w+)\]/)
      const toMatch   = msg.match(/\[to:(\w+)\]/)
      const fromTier  = fromMatch?.[1] ?? 'premium'
      const toTier    = toMatch?.[1]   ?? 'normal'
      const isExpired = msg.includes('[expired]')

      const TO_META: Record<string, { label: string; gradient: string; emoji: string; itemBg: string; itemBorder: string; btnBg: string }> = {
        normal:  { label: 'Normal',  gradient: 'linear-gradient(135deg, #64748b, #475569)', emoji: '⬇️', itemBg: '#f8fafc', itemBorder: '#e2e8f0', btnBg: '#64748b' },
        pro:     { label: 'Pro',     gradient: 'linear-gradient(135deg, #d97706, #b45309)', emoji: '⬇️', itemBg: '#fffbeb', itemBorder: '#fde68a', btnBg: '#d97706' },
      }
      const meta = TO_META[toTier] ?? TO_META.normal
      const fromLabel = fromTier.charAt(0).toUpperCase() + fromTier.slice(1)

      return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.35)', width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            <div style={{ background: meta.gradient, padding: '28px 28px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' as const }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                {meta.emoji}
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: -0.3 }}>
                  {isExpired ? `${fromLabel} subscription expired` : `Subscription downgraded`}
                </div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>
                  {isExpired
                    ? `Your ${fromLabel} plan has expired — you're now on ${meta.label}`
                    : `Your account was changed from ${fromLabel} to ${meta.label}`}
                </div>
              </div>
            </div>

            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 15, color: '#0f172a', lineHeight: 1.65 }}>
                {isExpired
                  ? `Your ${fromLabel} access has ended. Some features are now restricted. You can request a new upgrade at any time.`
                  : `Your subscription tier has been updated by the admin from ${fromLabel} to ${meta.label}.`}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { icon: '🔒', title: 'Some features are now locked', desc: `Detailed calculation breakdowns require ${toTier === 'normal' ? 'Pro or higher' : 'Premium'}.` },
                  { icon: '🔄', title: 'Request an upgrade', desc: 'Click the Pro or Premium button on any locked section to submit a new upgrade request.' },
                ].map(item => (
                  <div key={item.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: meta.itemBg, borderRadius: 10, padding: '12px 14px', border: `1px solid ${meta.itemBorder}` }}>
                    <span style={{ fontSize: 20, flexShrink: 0, lineHeight: 1 }}>{item.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setDowngradeNotif(null)}
                style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: meta.btnBg, color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.9' }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}>
                OK, I understand
              </button>
            </div>
          </div>
        </div>
      )
    })(),
    document.body
  ) : null

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {warningModal}
      {verifyModal}
      {revokeModal}
      {upgradeModal}
      {downgradeModal}
      {/* Trigger */}
      <button
        onClick={() => setOpen(v => !v)}
        style={{ position: 'relative', width: 40, height: 40, borderRadius: '50%', border: 'none', background: open ? '#dbeafe' : '#e4e6eb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.background = '#dbeafe' }}
        onMouseLeave={e => { e.currentTarget.style.background = open ? '#dbeafe' : '#e4e6eb' }}>
        <Bell size={20} color={open ? '#2563eb' : '#65676b'} />
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: 2, right: 2, background: '#ef4444', color: '#fff', borderRadius: '50%', minWidth: 17, height: 17, fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff', padding: '0 2px' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Post preview popup */}
      {previewNotif && previewNotif.post && (
        <div
          onClick={() => setPreviewNotif(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 12, boxShadow: '0 8px 40px rgba(0,0,0,0.28)', width: '100%', maxWidth: 480, maxHeight: '70vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Modal header */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #e4e6eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#050505' }}>Post preview</span>
              <button
                onClick={() => setPreviewNotif(null)}
                style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: '#e4e6eb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#65676b' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#d8dadf' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#e4e6eb' }}>
                <X size={14} />
              </button>
            </div>
            {/* Modal body — scrollable */}
            <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
              {previewNotif.post.media_url && (
                <img src={previewNotif.post.media_url} alt="" style={{ width: '100%', borderRadius: 8, marginBottom: previewNotif.post.body ? 12 : 0, objectFit: 'cover', maxHeight: 280 }} />
              )}
              {previewNotif.post.body && (
                <p style={{ fontSize: 14, color: '#050505', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' as const }}>{previewNotif.post.body}</p>
              )}
            </div>
            {/* Open full post */}
            {previewNotif.post_id && (
              <div style={{ padding: '12px 16px', borderTop: '1px solid #e4e6eb', flexShrink: 0 }}>
                <button
                  onClick={() => { setPreviewNotif(null); handleClick(previewNotif) }}
                  style={{ width: '100%', padding: '9px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#2563eb' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#3b82f6' }}>
                  Open post
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dropdown */}
      {open && (
        <div style={{ position: 'fixed', top: 60, right: 8, width: 380, maxHeight: '82vh', background: '#fff', borderRadius: 12, boxShadow: '0 8px 40px rgba(0,0,0,0.22)', border: '1px solid #e4e6eb', zIndex: 500, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ padding: '14px 16px 6px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#050505' }}>{t('notif_title')}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {notifs.some(n => !n.read) && (
                  <button onClick={markAllRead}
                    style={{ fontSize: 12, fontWeight: 600, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                    {t('notif_mark_all_read')}
                  </button>
                )}
                <a href="/notifications" onClick={() => setOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 600, color: '#65676b', textDecoration: 'none', padding: '4px 8px', borderRadius: 6 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#f0f2f5' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'none' }}>
                  <ExternalLink size={12} /> {t('notif_see_all')}
                </a>
              </div>
            </div>
            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: 6 }}>
              {(['all', 'unread'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{ padding: '5px 14px', borderRadius: 20, border: 'none', fontSize: 13, fontWeight: filter === f ? 700 : 500, cursor: 'pointer', background: filter === f ? '#e7f3ff' : '#f0f2f5', color: filter === f ? '#3b82f6' : '#65676b' }}>
                  {f === 'all' ? t('notif_tab_all') : (() => { const u = notifs.filter(n => !n.read).length; return `${t('notif_tab_unread')}${u > 0 ? ` (${u})` : ''}` })()}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {!loaded && <div style={{ padding: '24px', textAlign: 'center' as const, color: '#94a3b8', fontSize: 13 }}>{t('notif_loading')}</div>}
            {loaded && displayed.length === 0 && (
              <div style={{ padding: '40px 20px', textAlign: 'center' as const }}>
                <Bell size={32} color="#d1d5db" style={{ margin: '0 auto 10px', display: 'block' }} />
                <div style={{ fontSize: 14, color: '#65676b' }}>{filter === 'unread' ? t('notif_empty_unread') : t('notif_empty_all')}</div>
              </div>
            )}
            {displayed.map(n => {
              const meta = TYPE_META[n.type] ?? TYPE_META.comment
              const actor = n.actor as any
              const isAdminAction = n.type === 'post_deleted' || n.type === 'post_warned' || n.type === 'verify_approved' || n.type === 'verify_rejected' || n.type === 'verify_revoked' || n.type === 'upgrade_approved' || n.type === 'upgrade_rejected' || n.type === 'tier_downgraded'
              const actorName = isAdminAction ? 'CivilAxis Admin' : (actor?.display_name || actor?.full_name || actor?.username || 'Someone')
              const initial = actorName[0].toUpperCase()
              return (
                <div key={n.id}
                  onClick={() => handleClick(n)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', cursor: 'pointer', background: isAdminAction ? (n.type === 'verify_approved' ? (n.read ? '#f0f9ff' : '#e0f2fe') : (n.type === 'verify_rejected' || n.type === 'verify_revoked') ? (n.read ? '#fff1f2' : '#ffe4e6') : n.type === 'upgrade_approved' ? (n.read ? '#f0fdf4' : '#dcfce7') : n.type === 'upgrade_rejected' ? (n.read ? '#fffbeb' : '#fef9c3') : (n.read ? '#fffbeb' : '#fff8ed')) : (n.read ? '#fff' : '#f0f7ff'), borderBottom: '1px solid #f0f2f5', position: 'relative', borderLeft: isAdminAction ? `3px solid ${n.type === 'post_deleted' || n.type === 'verify_rejected' || n.type === 'verify_revoked' ? '#ef4444' : n.type === 'verify_approved' ? '#0369a1' : n.type === 'upgrade_approved' ? '#10b981' : n.type === 'upgrade_rejected' || n.type === 'post_warned' || n.type === 'tier_downgraded' ? '#f59e0b' : '#0369a1'}` : 'none' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = isAdminAction ? (n.type === 'verify_approved' ? '#bae6fd' : (n.type === 'verify_rejected' || n.type === 'verify_revoked') ? '#fecdd3' : n.type === 'upgrade_approved' ? '#bbf7d0' : (n.type === 'upgrade_rejected' || n.type === 'tier_downgraded') ? '#fde68a' : '#fff3d6') : (n.read ? '#f8fafc' : '#e7f0ff') }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isAdminAction ? (n.type === 'verify_approved' ? (n.read ? '#f0f9ff' : '#e0f2fe') : (n.type === 'verify_rejected' || n.type === 'verify_revoked') ? (n.read ? '#fff1f2' : '#ffe4e6') : n.type === 'upgrade_approved' ? (n.read ? '#f0fdf4' : '#dcfce7') : (n.type === 'upgrade_rejected' || n.type === 'tier_downgraded') ? (n.read ? '#fffbeb' : '#fef9c3') : (n.read ? '#fffbeb' : '#fff8ed')) : (n.read ? '#fff' : '#f0f7ff') }}>

                  {/* Avatar + badge */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    {isAdminAction ? (
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: n.type === 'post_deleted' ? 'linear-gradient(135deg, #ef4444, #b91c1c)' : n.type === 'post_warned' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : (n.type === 'verify_revoked' || n.type === 'verify_rejected') ? 'linear-gradient(135deg, #ef4444, #b91c1c)' : n.type === 'upgrade_approved' ? 'linear-gradient(135deg, #059669, #10b981)' : (n.type === 'upgrade_rejected' || n.type === 'tier_downgraded') ? 'linear-gradient(135deg, #d97706, #b45309)' : 'linear-gradient(135deg, #0369a1, #0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                        {n.type === 'post_deleted' ? '🚫' : n.type === 'post_warned' ? '⚠️' : (n.type === 'verify_revoked' || n.type === 'verify_rejected') ? '🛡️' : n.type === 'upgrade_approved' ? '🚀' : n.type === 'upgrade_rejected' ? '📋' : n.type === 'tier_downgraded' ? '⬇️' : '🛡️'}
                      </div>
                    ) : (
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: AVATAR_COLORS[actor?.avatar_color ?? 0], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 800, color: '#fff', overflow: 'hidden' }}>
                        {actor?.avatar_url ? <img src={actor.avatar_url} alt={initial} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initial}
                      </div>
                    )}
                    <div style={{ position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderRadius: '50%', background: meta.bg, border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {meta.icon}
                    </div>
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {isAdminAction ? (
                      <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                        <strong style={{ fontWeight: 700, color: n.type === 'post_deleted' ? '#dc2626' : n.type === 'post_warned' ? '#b45309' : n.type === 'verify_approved' ? '#0369a1' : (n.type === 'verify_rejected' || n.type === 'verify_revoked') ? '#dc2626' : n.type === 'upgrade_approved' ? '#059669' : (n.type === 'upgrade_rejected' || n.type === 'tier_downgraded') ? '#b45309' : '#dc2626' }}>
                          {n.type === 'post_deleted' ? '🚫 Post removed' : n.type === 'post_warned' ? '⚠️ Warning issued' : n.type === 'verify_approved' ? '🛡️ Verification approved' : n.type === 'verify_revoked' ? '🛡️ Verification revoked' : n.type === 'verify_rejected' ? '🛡️ Verification rejected' : n.type === 'upgrade_approved' ? (n.message?.includes('granted by the admin') ? '🎖️ Tier granted by admin' : '🚀 Upgrade request approved') : n.type === 'upgrade_rejected' ? '📋 Upgrade not approved' : '⬇️ Subscription downgraded'}
                        </strong>
                        <div style={{ fontSize: 11, marginTop: 3, fontWeight: 600, color: n.type === 'upgrade_approved' ? '#059669' : n.type === 'upgrade_rejected' ? '#b45309' : n.type === 'post_deleted' || (n.type === 'verify_rejected' || n.type === 'verify_revoked') ? '#dc2626' : '#b45309' }}>
                          Tap to view full notice →
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: '#050505', lineHeight: 1.45 }}>
                        <strong style={{ fontWeight: 700 }}>{actorName}</strong>{' '}
                        <span style={{ fontWeight: n.read ? 400 : 600 }}>{n.message || notifMsg(n.type)}</span>
                      </div>
                    )}
                    {/* Post preview snippet — skip for admin notifications */}
                    {!isAdminAction && n.post && (n.post.body || n.post.media_url) && (() => {
                      const body = n.post.media_url && !n.post.body ? t('notif_photo') : (n.post.body ?? '')
                      const isLong = body.length > PREVIEW_MAX
                      return (
                        <div style={{ fontSize: 12, color: '#65676b', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                          {isLong ? body.slice(0, PREVIEW_MAX) + '…' : body}
                        </div>
                      )
                    })()}
                    <div style={{ fontSize: 11, color: n.read ? '#94a3b8' : '#3b82f6', fontWeight: n.read ? 400 : 700, marginTop: 3 }}>{timeAgo(n.created_at, t('notif_time_now'))}</div>
                  </div>

                  {/* Right: unread dot (click to mark read) + delete */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {!n.read && (
                      <button
                        title={t('notif_mark_read')}
                        onClick={e => { e.stopPropagation(); markOne(n.id) }}
                        style={{ width: 14, height: 14, borderRadius: '50%', background: '#3b82f6', border: 'none', cursor: 'pointer', flexShrink: 0, padding: 0 }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#1d4ed8' }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#3b82f6' }}
                      />
                    )}
                    <button
                      onClick={e => deleteOne(n.id, e)}
                      style={{ width: 26, height: 26, borderRadius: '50%', border: 'none', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#bcc0c4' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#e4e6eb'; e.currentTarget.style.color = '#65676b' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#bcc0c4' }}>
                      <X size={13} />
                    </button>
                  </div>
                </div>
              )
            })}

            {/* Load more */}
            {filter === 'all' && loaded && hasMore && (
              <div style={{ padding: '10px 14px', borderTop: '1px solid #f0f2f5' }}>
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  style={{ width: '100%', padding: '9px', borderRadius: 8, border: '1px solid #e4e6eb', background: loadingMore ? '#f8fafc' : '#fff', color: '#3b82f6', fontSize: 13, fontWeight: 600, cursor: loadingMore ? 'default' : 'pointer' }}
                  onMouseEnter={e => { if (!loadingMore) e.currentTarget.style.background = '#eff6ff' }}
                  onMouseLeave={e => { if (!loadingMore) e.currentTarget.style.background = '#fff' }}>
                  {loadingMore ? 'Loading…' : 'Load more notifications'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
