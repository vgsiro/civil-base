'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, MessageCircle, UserPlus, BadgeCheck, X, Bell, AtSign, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Profile, Notification, NotificationType } from '../types'
import AccountMenu from '../components/AccountMenu'

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
}

type Filter = 'all' | 'unread' | NotificationType

export default function NotificationsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) { router.replace('/'); return }
      setUser(u)
      const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle()
      setProfile(p as Profile)
      await loadNotifications(u.id)

      // Real-time
      const sub = supabase.channel('notifications')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${u.id}` }, payload => {
          setNotifications(prev => [payload.new as Notification, ...prev])
        })
        .subscribe()
      return () => { sub.unsubscribe() }
    })
  }, [router])

  async function loadNotifications(uid: string) {
    const { data } = await supabase
      .from('notifications')
      .select('*, actor:actor_id(username, display_name, full_name, avatar_color, avatar_url)')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(60)
    setNotifications((data as Notification[]) ?? [])
    setLoading(false)
  }

  async function markAllRead() {
    if (!user) return
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  async function markRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  async function deleteNotification(id: string) {
    await supabase.from('notifications').delete().eq('id', id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const displayName = profile?.display_name || profile?.full_name || user?.email?.split('@')[0] || ''
  const unreadCount = notifications.filter(n => !n.read).length

  const filtered = notifications.filter(n => {
    if (filter === 'all') return true
    if (filter === 'unread') return !n.read
    return n.type === filter
  })

  const FILTERS: { id: Filter; label: string }[] = [
    { id: 'all',            label: 'All' },
    { id: 'unread',         label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
    { id: 'like',           label: 'Likes' },
    { id: 'comment',        label: 'Comments' },
    { id: 'follow',         label: 'Follows' },
    { id: 'verify_approved', label: 'Verified' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>

      {/* Nav */}
      <div style={{ position: 'sticky', top: 0, zIndex: 200, background: '#fff', borderBottom: '1px solid #e4e6eb', height: 56, display: 'flex', alignItems: 'center', padding: '0 16px', justifyContent: 'space-between', boxShadow: '0 2px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/feed" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <img src="/logo.png" alt="Civil Base" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }} />
            <span style={{ fontSize: 18, fontWeight: 800, color: '#1e3a5f' }}>Civil Base</span>
          </a>
          <span style={{ color: '#d1d5db', fontSize: 18 }}>·</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#050505' }}>Notifications</span>
        </div>
        {user && profile && (
          <AccountMenu user={user} avatarColor={profile.avatar_color ?? 0} avatarUrl={profile.avatar_url ?? null} displayName={displayName} profileUsername={profile.username ?? null} size={28} />
        )}
      </div>

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

          {/* Notification list */}
          {loading && (
            <div style={{ padding: '40px', textAlign: 'center' as const, color: '#94a3b8', fontSize: 14 }}>Loading…</div>
          )}
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
            const actorName = actor?.display_name || actor?.full_name || actor?.username || 'Someone'
            const href = n.post_id ? `/feed` : actor?.username ? `/u/${actor.username}` : '#'

            return (
              <div key={n.id}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', background: n.read ? '#fff' : '#f0f7ff', borderBottom: '1px solid #f0f2f5', cursor: 'pointer', transition: 'background 0.1s' }}
                onClick={() => { markRead(n.id); router.push(href) }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = n.read ? '#f8fafc' : '#e7f0ff' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = n.read ? '#fff' : '#f0f7ff' }}>

                {/* Actor avatar with type badge */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <Avatar name={actorName} colorIndex={actor?.avatar_color ?? 0} photoUrl={actor?.avatar_url} size={44} />
                  <div style={{ position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderRadius: '50%', background: meta.bg, border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {meta.icon}
                  </div>
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, color: '#050505', lineHeight: 1.5 }}>
                    <strong>{actorName}</strong>{' '}
                    {n.message || defaultMessage(n.type)}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{timeAgo(n.created_at)}</div>
                </div>

                {/* Unread dot + delete */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  {!n.read && (
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6' }} />
                  )}
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
