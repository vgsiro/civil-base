'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Heart, MessageCircle, UserPlus, BadgeCheck, X, Bell, AtSign, Users, ShieldAlert, FileWarning, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Profile, Notification, NotificationType } from '../../_types'
import TopNavBar from '../../_components/social/feed/TopNavBar'
import ChatBox from '../../_components/social/messaging/ChatBox'
import { useMessagingChat } from '../../_hooks/useMessagingChat'

const AVATAR_COLORS = [
  'linear-gradient(135deg, #3b82f6, #8b5cf6)',
  'linear-gradient(135deg, #10b981, #3b82f6)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #ec4899, #8b5cf6)',
  'linear-gradient(135deg, #06b6d4, #10b981)',
  'linear-gradient(135deg, #f97316, #f59e0b)',
]

function Avatar({ name, colorIndex, photoUrl, size = 44 }: { name: string | null; colorIndex: number; photoUrl?: string | null; size?: number }) {
  const initial = (name || '?')[0].toUpperCase()
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: AVATAR_COLORS[colorIndex ?? 0], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 800, color: '#fff', flexShrink: 0, overflow: 'hidden' }}>
      {photoUrl ? <img src={photoUrl} alt={initial} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initial}
    </div>
  )
}

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  if (m < 1440) return `${Math.floor(m / 60)}h ago`
  if (m < 10080) return `${Math.floor(m / 1440)}d ago`
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

const TYPE_META: Record<NotificationType, { icon: React.ReactNode; color: string; bg: string }> = {
  like:             { icon: <Heart size={14} fill="#ef4444" color="#ef4444" />,  color: '#ef4444', bg: '#fef2f2' },
  comment:          { icon: <MessageCircle size={14} color="#3b82f6" />,         color: '#3b82f6', bg: '#eff6ff' },
  follow:           { icon: <UserPlus size={14} color="#10b981" />,              color: '#10b981', bg: '#f0fdf4' },
  verify_approved:  { icon: <BadgeCheck size={14} color="#0369a1" />,            color: '#0369a1', bg: '#e0f2fe' },
  verify_rejected:  { icon: <X size={14} color="#ef4444" />,                     color: '#ef4444', bg: '#fef2f2' },
  verify_revoked:   { icon: <X size={14} color="#ef4444" />,                     color: '#ef4444', bg: '#fef2f2' },
  mention:          { icon: <AtSign size={14} color="#8b5cf6" />,                color: '#8b5cf6', bg: '#f5f3ff' },
  friend_request:   { icon: <Users size={14} color="#f59e0b" />,                 color: '#f59e0b', bg: '#fffbeb' },
  friend_accepted:  { icon: <Users size={14} color="#10b981" />,                 color: '#10b981', bg: '#f0fdf4' },
  post_deleted:     { icon: <X size={14} color="#ef4444" />,                     color: '#ef4444', bg: '#fef2f2' },
  post_warned:      { icon: <X size={14} color="#f59e0b" />,                     color: '#f59e0b', bg: '#fffbeb' },
  upgrade_approved: { icon: <BadgeCheck size={14} color="#10b981" />,            color: '#10b981', bg: '#f0fdf4' },
  upgrade_rejected: { icon: <X size={14} color="#ef4444" />,                     color: '#ef4444', bg: '#fef2f2' },
  tier_downgraded:  { icon: <X size={14} color="#f59e0b" />,                     color: '#f59e0b', bg: '#fffbeb' },
}

const ADMIN_TYPES = new Set<NotificationType>(['post_deleted', 'post_warned', 'verify_approved', 'verify_rejected', 'verify_revoked', 'upgrade_approved', 'upgrade_rejected', 'tier_downgraded'])

function rowLabel(n: Notification): string {
  switch (n.type) {
    case 'post_deleted':    return '🚫 Post removed'
    case 'post_warned':     return '⚠️ Warning issued'
    case 'verify_approved': return '🛡️ Verification approved'
    case 'verify_revoked':  return '🛡️ Verification revoked'
    case 'verify_rejected': return '🛡️ Verification rejected'
    case 'upgrade_approved': return n.message?.includes('granted by the admin') ? '🎖️ Tier granted by admin' : '🚀 Upgrade request approved'
    case 'upgrade_rejected': return '📋 Upgrade not approved'
    case 'tier_downgraded': return '⬇️ Subscription downgraded'
    default: return ''
  }
}

function rowLabelColor(type: NotificationType): string {
  switch (type) {
    case 'post_deleted': case 'verify_rejected': case 'verify_revoked': return '#dc2626'
    case 'verify_approved': return '#0369a1'
    case 'upgrade_approved': return '#059669'
    case 'upgrade_rejected': case 'post_warned': case 'tier_downgraded': return '#b45309'
    default: return '#050505'
  }
}

function adminAvatar(type: NotificationType): { bg: string; emoji: string } {
  switch (type) {
    case 'post_deleted': case 'verify_rejected': case 'verify_revoked': return { bg: 'linear-gradient(135deg, #ef4444, #b91c1c)', emoji: type === 'post_deleted' ? '🚫' : '🛡️' }
    case 'post_warned': return { bg: 'linear-gradient(135deg, #f59e0b, #d97706)', emoji: '⚠️' }
    case 'verify_approved': return { bg: 'linear-gradient(135deg, #0369a1, #0284c7)', emoji: '🛡️' }
    case 'upgrade_approved': return { bg: 'linear-gradient(135deg, #059669, #10b981)', emoji: '🚀' }
    case 'upgrade_rejected': return { bg: 'linear-gradient(135deg, #d97706, #b45309)', emoji: '📋' }
    case 'tier_downgraded': return { bg: 'linear-gradient(135deg, #d97706, #b45309)', emoji: '⬇️' }
    default: return { bg: 'linear-gradient(135deg, #64748b, #475569)', emoji: '📢' }
  }
}

type Filter = 'all' | 'unread' | 'system' | NotificationType

const PAGE_SIZE = 15

export default function NotificationsPage() {
  useEffect(() => { document.title = 'Notifications — CivilAxis' }, [])
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const [unreadMsgs, setUnreadMsgs] = useState(0)
  const [pendingFriends, setPendingFriends] = useState(0)
  const chat = useMessagingChat()
  const [mounted, setMounted] = useState(false)

  // Popup modal state
  const [warningNotif, setWarningNotif] = useState<Notification | null>(null)
  const [verifyNotif, setVerifyNotif] = useState<Notification | null>(null)
  const [revokeNotif, setRevokeNotif] = useState<Notification | null>(null)
  const [upgradeNotif, setUpgradeNotif] = useState<Notification | null>(null)
  const [downgradeNotif, setDowngradeNotif] = useState<Notification | null>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    // Seed user + cached profile from the session first so the nav avatar shows the real image
    // on first paint instead of the default circle until the network fetch returns.
    supabase.auth.getSession().then(({ data: { session } }) => {
      const su = session?.user
      if (su) {
        setUser(su)
        try {
          const cached = localStorage.getItem(`civilbase_profile_${su.id}`)
          if (cached) setProfile(JSON.parse(cached) as Profile)
        } catch {}
      }
    })
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) { window.location.href = '/'; return }
      setUser(u)
      const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle()
      if (p) {
        setProfile(p as Profile)
        try { localStorage.setItem(`civilbase_profile_${u.id}`, JSON.stringify(p)) } catch {}
      }
      await loadNotifications(u.id)

      const sub = supabase.channel('notif-page-' + u.id)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${u.id}` }, async payload => {
          const n = payload.new as Notification
          const actorRes = n.actor_id
            ? await supabase.from('profiles').select('username, display_name, full_name, avatar_color, avatar_url').eq('id', n.actor_id).single()
            : { data: null }
          setNotifications(prev => [{ ...n, actor: actorRes.data ?? undefined } as Notification, ...prev])
          setUnreadNotifs(c => c + 1)
        })
        .subscribe()
      return () => { sub.unsubscribe() }
    })
  }, [])

  async function loadNotifications(uid: string) {
    const { data } = await supabase
      .from('notifications')
      .select('*, actor:actor_id(username, display_name, full_name, avatar_color, avatar_url)')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE + 1)
    const rows = (data as Notification[]) ?? []
    setHasMore(rows.length > PAGE_SIZE)
    setNotifications(rows.slice(0, PAGE_SIZE))
    setUnreadNotifs(rows.slice(0, PAGE_SIZE).filter(n => !n.read).length)
    setLoading(false)
  }

  async function loadMore() {
    if (loadingMore || !hasMore || !user) return
    setLoadingMore(true)
    const oldest = notifications[notifications.length - 1]?.created_at
    const { data } = await supabase
      .from('notifications')
      .select('*, actor:actor_id(username, display_name, full_name, avatar_color, avatar_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .lt('created_at', oldest)
      .limit(PAGE_SIZE + 1)
    const rows = (data as Notification[]) ?? []
    setHasMore(rows.length > PAGE_SIZE)
    setNotifications(prev => [...prev, ...rows.slice(0, PAGE_SIZE)])
    setLoadingMore(false)
  }

  async function markAllRead() {
    if (!user) return
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadNotifs(0)
  }

  async function markRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  async function deleteNotification(id: string) {
    await supabase.from('notifications').delete().eq('id', id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  function handleClick(n: Notification) {
    markRead(n.id)
    if (n.type === 'post_warned' || n.type === 'post_deleted') { setWarningNotif(n); return }
    if (n.type === 'verify_approved') { setVerifyNotif(n); return }
    if (n.type === 'verify_revoked' || n.type === 'verify_rejected') { setRevokeNotif(n); return }
    if (n.type === 'upgrade_approved' || n.type === 'upgrade_rejected') { setUpgradeNotif(n); return }
    if (n.type === 'tier_downgraded') { setDowngradeNotif(n); return }
    if (n.post_id) { window.location.href = `/feed?post=${n.post_id}`; return }
    const actor = n.actor as any
    if (actor?.username) window.location.href = `/u/${actor.username}`
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const filtered = notifications.filter(n => {
    if (filter === 'all') return true
    if (filter === 'unread') return !n.read
    if (filter === 'system') return ADMIN_TYPES.has(n.type)
    return n.type === filter
  })

  const FILTERS: { id: Filter; label: string }[] = [
    { id: 'all',     label: 'All' },
    { id: 'unread',  label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
    { id: 'like',    label: 'Likes' },
    { id: 'comment', label: 'Comments' },
    { id: 'follow',  label: 'Follows' },
    { id: 'system',  label: 'System' },
  ]

  // ── Modals (same as NotificationDropdown) ──────────────────────────────────

  const warningModal = warningNotif && mounted ? createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.3)', width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ background: warningNotif.type === 'post_deleted' ? 'linear-gradient(135deg, #dc2626, #b91c1c)' : 'linear-gradient(135deg, #d97706, #b45309)', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 24 }}>
            {warningNotif.type === 'post_deleted' ? '🚫' : '⚠️'}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{warningNotif.type === 'post_deleted' ? 'Your post was removed' : 'You have received a warning'}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>From CivilAxis Admin</div>
          </div>
        </div>
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 15, color: '#0f172a', lineHeight: 1.65 }}>
            {warningNotif.type === 'post_deleted'
              ? <>You have received <strong>1 warning</strong> from <strong>CivilAxis Admin</strong> because your post was removed for violating our community standards.</>
              : <>You have received <strong>1 warning</strong> from <strong>CivilAxis Admin</strong> because your post was flagged as potentially violating our community standards.</>}
          </div>
          {warningNotif.message && (
            <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#854d0e', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 4 }}>Reason</div>
              <div style={{ fontSize: 14, color: '#713f12', lineHeight: 1.6 }}>{warningNotif.message}</div>
            </div>
          )}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldAlert size={16} color="#dc2626" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>3-Strike Policy</span>
            </div>
            <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>Receiving <strong>3 warnings</strong> will result in your account being <strong style={{ color: '#dc2626' }}>permanently banned</strong> from CivilAxis.</div>
          </div>
          <button onClick={() => setWarningNotif(null)}
            style={{ width: '100%', padding: '12px', borderRadius: 10, border: 'none', background: warningNotif.type === 'post_deleted' ? '#dc2626' : '#d97706', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
            I understand and agree to follow the guidelines
          </button>
        </div>
      </div>
    </div>,
    document.body
  ) : null

  const verifyModal = verifyNotif && mounted ? createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.35)', width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg, #0369a1, #0284c7, #38bdf8)', padding: '28px 28px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🛡️</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: -0.3 }}>You're now verified!</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>Welcome to the CivilAxis professional community</div>
          </div>
        </div>
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: '🏗️', title: 'Be responsible', desc: 'Your badge signals trust. Share only what you know to be accurate.' },
              { icon: '🤝', title: 'Help the community', desc: 'Answer questions, mentor juniors, and lift others up.' },
              { icon: '💡', title: 'Share your knowledge', desc: 'Post insights, case studies, and lessons learned.' },
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
          <button onClick={() => { setVerifyNotif(null); if (profile?.username) window.location.href = `/u/${profile.username}` }}
            style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #0369a1, #0284c7)', color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>
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
        <div style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)', padding: '28px 28px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' as const }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🛡️</div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: -0.3 }}>
              {revokeNotif.type === 'verify_rejected' ? 'Verification rejected' : 'Verification revoked'}
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
              {revokeNotif.type === 'verify_rejected' ? 'Your verification request was not approved' : 'Your professional badge has been removed'}
            </div>
          </div>
        </div>
        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 15, color: '#0f172a', lineHeight: 1.65 }}>
            {revokeNotif.type === 'verify_rejected'
              ? <>We're sorry to inform you that your professional verification request was <strong>not approved by CivilAxis Admin</strong>.</>
              : <>We're sorry to inform you that your professional verification has been <strong>revoked by CivilAxis Admin</strong>.</>}
          </div>
          {revokeNotif.message && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#991b1b', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 4 }}>Reason</div>
              <div style={{ fontSize: 14, color: '#7f1d1d', lineHeight: 1.6 }}>{revokeNotif.message}</div>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { icon: '📋', title: 'Review the guidelines', desc: 'Make sure your activity aligns with CivilAxis community standards.' },
              { icon: '🔄', title: 'Reapply for verification', desc: 'You may submit a new verification request at any time.' },
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
          <button onClick={() => { setRevokeNotif(null); if (profile?.username) window.location.href = `/u/${profile.username}` }}
            style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: '#dc2626', color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>
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
        pro: { gradient: 'linear-gradient(135deg, #2563eb, #3b82f6)', emoji: '🚀', title: 'Pro access granted!', subtitle: 'Your account has been upgraded to Pro', badgeColor: '#3b82f6', badgeBg: '#eff6ff', itemBg: '#eff6ff', itemBorder: '#bfdbfe', btnBg: '#2563eb', items: [
          { icon: '🔍', title: 'Full calculation details', desc: 'Step-by-step breakdowns for ULS, SLS and shear-torsion checks.' },
          { icon: '📊', title: 'All result panels', desc: 'No more locked sections — every tab is now fully accessible.' },
          { icon: '⚡', title: 'Priority access', desc: 'Enjoy a richer experience across all CivilAxis tools.' },
        ]},
        premium: { gradient: 'linear-gradient(135deg, #7c3aed, #8b5cf6)', emoji: '💎', title: 'Premium access granted!', subtitle: 'Your account has been upgraded to Premium', badgeColor: '#7c3aed', badgeBg: '#f5f3ff', itemBg: '#f5f3ff', itemBorder: '#ddd6fe', btnBg: '#7c3aed', items: [
          { icon: '🔍', title: 'Full calculation details', desc: 'Complete step-by-step breakdowns for all engineering checks.' },
          { icon: '📄', title: 'Export PDF reports', desc: 'Download professional PDF reports for client deliverables.' },
          { icon: '🌟', title: 'Priority support', desc: 'Get priority assistance via the support ticket system.' },
        ]},
      }
      const REJECTED_META = {
        pro:     { gradient: 'linear-gradient(135deg, #d97706, #b45309)', emoji: '📋', title: 'Pro request not approved',     subtitle: 'Your Pro upgrade request was reviewed',     itemBg: '#fffbeb', itemBorder: '#fde68a', btnBg: '#d97706' },
        premium: { gradient: 'linear-gradient(135deg, #7c3aed80, #6d28d9)', emoji: '📋', title: 'Premium request not approved', subtitle: 'Your Premium upgrade request was reviewed', itemBg: '#f5f3ff', itemBorder: '#ddd6fe', btnBg: '#7c3aed' },
      }
      const am = APPROVED_META[tier]
      const rm = REJECTED_META[tier]

      return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.35)', width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ background: isApproved ? am.gradient : rm.gradient, padding: '28px 28px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' as const }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                {isApproved ? am.emoji : rm.emoji}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: -0.3 }}>{isApproved ? am.title : rm.title}</div>
                  {isApproved && <span style={{ fontSize: 11, fontWeight: 800, color: am.badgeColor, background: am.badgeBg, padding: '2px 10px', borderRadius: 20 }}>{isPremium ? 'Premium' : 'Pro'}</span>}
                </div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>{isApproved ? am.subtitle : rm.subtitle}</div>
              </div>
            </div>
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
              <button onClick={() => setUpgradeNotif(null)}
                style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: isApproved ? am.btnBg : rm.btnBg, color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>
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
      const TO_META: Record<string, { label: string; gradient: string; itemBg: string; itemBorder: string; btnBg: string }> = {
        normal: { label: 'Normal',  gradient: 'linear-gradient(135deg, #64748b, #475569)', itemBg: '#f8fafc', itemBorder: '#e2e8f0', btnBg: '#64748b' },
        pro:    { label: 'Pro',     gradient: 'linear-gradient(135deg, #d97706, #b45309)', itemBg: '#fffbeb', itemBorder: '#fde68a', btnBg: '#d97706' },
      }
      const meta = TO_META[toTier] ?? TO_META.normal
      const fromLabel = fromTier.charAt(0).toUpperCase() + fromTier.slice(1)

      return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.35)', width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ background: meta.gradient, padding: '28px 28px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' as const }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>⬇️</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: -0.3 }}>
                  {isExpired ? `${fromLabel} subscription expired` : 'Subscription downgraded'}
                </div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>
                  {isExpired ? `Your ${fromLabel} plan has expired — you're now on ${meta.label}` : `Your account was changed from ${fromLabel} to ${meta.label}`}
                </div>
              </div>
            </div>
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
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
              <button onClick={() => setDowngradeNotif(null)}
                style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: meta.btnBg, color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>
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
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {warningModal}
      {verifyModal}
      {revokeModal}
      {upgradeModal}
      {downgradeModal}

      {user && chat.openChats.map((c, i) => (
        <ChatBox key={c.convId} userId={user.id} {...chat.chatBoxProps(c, i)} />
      ))}
      <TopNavBar
        user={user}
        profile={profile}
        unreadNotifs={unreadNotifs}
        onUnreadNotifsChange={setUnreadNotifs}
        unreadMsgs={unreadMsgs}
        onUnreadMsgsChange={setUnreadMsgs}
        pendingFriends={pendingFriends}
        onPendingFriendsChange={setPendingFriends}
        {...chat.dropdownHandlers}
      />

      <div style={{ maxWidth: 680, margin: '16px auto', padding: '0 12px' }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e4e6eb', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={20} color="#050505" />
              <span style={{ fontSize: 18, fontWeight: 800, color: '#050505' }}>Notifications</span>
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead}
                style={{ fontSize: 13, fontWeight: 600, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 10px', borderRadius: 8 }}
                onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                Mark all as read
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 4, padding: '8px 16px', borderBottom: '1px solid #f0f2f5', overflowX: 'auto' as const }}>
            {FILTERS.map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                style={{ padding: '5px 14px', borderRadius: 20, border: 'none', fontSize: 13, fontWeight: filter === f.id ? 700 : 500, cursor: 'pointer', background: filter === f.id ? '#e7f3ff' : 'none', color: filter === f.id ? '#3b82f6' : '#65676b', whiteSpace: 'nowrap' as const }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* List */}
          {loading && <div style={{ padding: '40px', textAlign: 'center' as const, color: '#94a3b8', fontSize: 14 }}>Loading…</div>}
          {!loading && filtered.length === 0 && (
            <div style={{ padding: '60px 20px', textAlign: 'center' as const }}>
              <Bell size={40} color="#d1d5db" style={{ margin: '0 auto 12px', display: 'block' }} />
              <div style={{ fontSize: 16, fontWeight: 700, color: '#050505', marginBottom: 4 }}>No notifications yet</div>
              <div style={{ fontSize: 14, color: '#65676b' }}>We'll let you know when something happens.</div>
            </div>
          )}

          {filtered.map(n => {
            const meta = TYPE_META[n.type] ?? TYPE_META.comment
            const actor = n.actor as any
            const isAdmin = ADMIN_TYPES.has(n.type)
            const av = isAdmin ? adminAvatar(n.type) : null
            const actorName = isAdmin ? 'CivilAxis Admin' : (actor?.display_name || actor?.full_name || actor?.username || 'Someone')

            const rowBg = isAdmin
              ? (n.type === 'verify_approved' ? (n.read ? '#f0f9ff' : '#e0f2fe')
                : (n.type === 'verify_rejected' || n.type === 'verify_revoked') ? (n.read ? '#fff1f2' : '#ffe4e6')
                : n.type === 'upgrade_approved' ? (n.read ? '#f0fdf4' : '#dcfce7')
                : n.type === 'upgrade_rejected' ? (n.read ? '#fffbeb' : '#fef9c3')
                : (n.read ? '#fffbeb' : '#fff8ed'))
              : (n.read ? '#fff' : '#f0f7ff')

            const leftBorder = isAdmin
              ? `3px solid ${(n.type === 'post_deleted' || n.type === 'verify_rejected' || n.type === 'verify_revoked') ? '#ef4444' : n.type === 'verify_approved' ? '#0369a1' : n.type === 'upgrade_approved' ? '#10b981' : '#f59e0b'}`
              : 'none'

            return (
              <div key={n.id}
                onClick={() => handleClick(n)}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', background: rowBg, borderBottom: '1px solid #f0f2f5', cursor: 'pointer', borderLeft: leftBorder, transition: 'background 0.1s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = isAdmin ? (n.type === 'verify_approved' ? '#bae6fd' : (n.type === 'verify_rejected' || n.type === 'verify_revoked') ? '#fecdd3' : n.type === 'upgrade_approved' ? '#bbf7d0' : '#fde68a') : (n.read ? '#f8fafc' : '#e7f0ff') }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = rowBg }}>

                {/* Avatar */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  {isAdmin && av ? (
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: av.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                      {av.emoji}
                    </div>
                  ) : (
                    <Avatar name={actorName} colorIndex={actor?.avatar_color ?? 0} photoUrl={actor?.avatar_url} size={44} />
                  )}
                  <div style={{ position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderRadius: '50%', background: meta.bg, border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {meta.icon}
                  </div>
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {isAdmin ? (
                    <div style={{ fontSize: 14, lineHeight: 1.5 }}>
                      <strong style={{ fontWeight: 700, color: rowLabelColor(n.type) }}>{rowLabel(n)}</strong>
                      <div style={{ fontSize: 12, marginTop: 3, fontWeight: 600, color: n.type === 'upgrade_approved' ? '#059669' : n.type === 'upgrade_rejected' ? '#b45309' : (n.type === 'post_deleted' || n.type === 'verify_rejected' || n.type === 'verify_revoked') ? '#dc2626' : '#b45309' }}>
                        Tap to view full notice →
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 14, color: '#050505', lineHeight: 1.5 }}>
                      <strong>{actorName}</strong>{' '}
                      <span style={{ fontWeight: n.read ? 400 : 600 }}>{n.message || defaultMessage(n.type)}</span>
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: n.read ? '#94a3b8' : '#3b82f6', fontWeight: n.read ? 400 : 700, marginTop: 3 }}>{timeAgo(n.created_at)}</div>
                </div>

                {/* Unread dot + delete */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  {!n.read && <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />}
                  <button
                    onClick={e => { e.stopPropagation(); deleteNotification(n.id) }}
                    style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#94a3b8' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f0f2f5' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                    <X size={14} />
                  </button>
                </div>
              </div>
            )
          })}

          {/* Load more */}
          {filter === 'all' && !loading && hasMore && (
            <div style={{ padding: '12px 16px' }}>
              <button
                onClick={loadMore}
                disabled={loadingMore}
                style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #e4e6eb', background: loadingMore ? '#f8fafc' : '#fff', color: '#3b82f6', fontSize: 13, fontWeight: 600, cursor: loadingMore ? 'default' : 'pointer' }}
                onMouseEnter={e => { if (!loadingMore) e.currentTarget.style.background = '#eff6ff' }}
                onMouseLeave={e => { if (!loadingMore) e.currentTarget.style.background = '#fff' }}>
                {loadingMore ? 'Loading…' : 'Load more notifications'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function defaultMessage(type: NotificationType): string {
  switch (type) {
    case 'like':            return 'liked your post.'
    case 'comment':         return 'commented on your post.'
    case 'follow':          return 'started following you.'
    case 'verify_approved': return 'Your professional verification was approved!'
    case 'verify_rejected': return 'Your verification request was not approved.'
    case 'mention':         return 'mentioned you in a post.'
    default:                return 'sent you a notification.'
  }
}
