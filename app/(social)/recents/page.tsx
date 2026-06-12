'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { Clock, Heart, MessageCircle, Repeat2, ThumbsUp, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '../../_types'
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

type ActivityType = 'like' | 'comment' | 'share' | 'vote'
type FilterType = 'all' | ActivityType

interface ActivityItem {
  id: string
  type: ActivityType
  created_at: string
  post_id: string
  post_body: string
  post_author: string
  comment_body?: string
}

const TYPE_META: Record<ActivityType, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  like:    { icon: <Heart size={13} fill="#ef4444" color="#ef4444" />,   color: '#ef4444', bg: '#fef2f2', label: 'liked'    },
  comment: { icon: <MessageCircle size={13} color="#3b82f6" />,          color: '#3b82f6', bg: '#eff6ff', label: 'commented on' },
  share:   { icon: <Repeat2 size={13} color="#10b981" />,                color: '#10b981', bg: '#f0fdf4', label: 'shared'   },
  vote:    { icon: <ThumbsUp size={13} color="#8b5cf6" />,               color: '#8b5cf6', bg: '#f5f3ff', label: 'voted on' },
}

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  if (m < 1440) return `${Math.floor(m / 60)}h ago`
  if (m < 10080) return `${Math.floor(m / 1440)}d ago`
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

function truncate(text: string, max = 80) {
  if (!text) return '(no content)'
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text
}

const PAGE_SIZE = 20

export default function RecentsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [filter, setFilter] = useState<FilterType>('all')
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const [unreadMsgs, setUnreadMsgs] = useState(0)
  const [pendingFriends, setPendingFriends] = useState(0)
  const chat = useMessagingChat()

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
      await load(u.id)
    })
  }, [])

  async function load(uid: string, before?: string) {
    const [likes, comments, shares, votes] = await Promise.all([
      supabase
        .from('post_likes')
        .select('post_id, created_at, posts!inner(id, body, profiles!posts_user_id_fkey(display_name, full_name, username))')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE),

      supabase
        .from('post_comments')
        .select('id, post_id, body, created_at, posts!inner(id, body, profiles!posts_user_id_fkey(display_name, full_name, username))')
        .eq('user_id', uid)
        .is('parent_id', null)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE),

      supabase
        .from('posts')
        .select('id, body, created_at, reshared_post_id, original:reshared_post_id(id, body, profiles!posts_user_id_fkey(display_name, full_name, username))')
        .eq('user_id', uid)
        .not('reshared_post_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE),

      supabase
        .from('post_recommendations')
        .select('post_id, created_at, posts!inner(id, body, profiles!posts_user_id_fkey(display_name, full_name, username))')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE),
    ])

    const merged: ActivityItem[] = []

    for (const r of (likes.data ?? []) as any[]) {
      const post = r.posts
      const author = post?.profiles
      merged.push({
        id: `like-${r.post_id}`,
        type: 'like',
        created_at: r.created_at,
        post_id: r.post_id,
        post_body: post?.body ?? '',
        post_author: author?.display_name || author?.full_name || author?.username || 'someone',
      })
    }

    for (const r of (comments.data ?? []) as any[]) {
      const post = r.posts
      const author = post?.profiles
      merged.push({
        id: `comment-${r.id}`,
        type: 'comment',
        created_at: r.created_at,
        post_id: r.post_id,
        post_body: post?.body ?? '',
        post_author: author?.display_name || author?.full_name || author?.username || 'someone',
        comment_body: r.body,
      })
    }

    for (const r of (shares.data ?? []) as any[]) {
      const original = (r as any).original
      const author = original?.profiles
      merged.push({
        id: `share-${r.id}`,
        type: 'share',
        created_at: r.created_at,
        post_id: original?.id ?? r.id,
        post_body: original?.body ?? r.body ?? '',
        post_author: author?.display_name || author?.full_name || author?.username || 'someone',
      })
    }

    for (const r of (votes.data ?? []) as any[]) {
      const post = r.posts
      const author = post?.profiles
      merged.push({
        id: `vote-${r.post_id}`,
        type: 'vote',
        created_at: r.created_at,
        post_id: r.post_id,
        post_body: post?.body ?? '',
        post_author: author?.display_name || author?.full_name || author?.username || 'someone',
      })
    }

    merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    const page = before ? merged.filter(a => new Date(a.created_at) < new Date(before)) : merged
    const sliced = page.slice(0, PAGE_SIZE)

    if (before) {
      setActivities(prev => [...prev, ...sliced])
    } else {
      setActivities(sliced)
    }
    setHasMore(page.length > PAGE_SIZE)
    setLoading(false)
    setLoadingMore(false)
  }

  function loadMore() {
    if (loadingMore || !hasMore || !user) return
    setLoadingMore(true)
    const oldest = activities[activities.length - 1]?.created_at
    load(user.id, oldest)
  }

  function goToPost(postId: string) {
    window.location.href = `/feed?post=${postId}`
  }

  const FILTERS: { id: FilterType; label: string }[] = [
    { id: 'all',     label: 'All' },
    { id: 'like',    label: 'Likes' },
    { id: 'comment', label: 'Comments' },
    { id: 'share',   label: 'Shares' },
    { id: 'vote',    label: 'Votes' },
  ]

  const filtered = filter === 'all' ? activities : activities.filter(a => a.type === filter)

  const displayName = profile?.display_name || profile?.full_name || user?.email?.split('@')[0] || 'You'
  const avatarColor = profile?.avatar_color ?? 0

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
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

      <div className="single-col-page" style={{ maxWidth: 680, margin: '16px auto', padding: '0 12px' }}>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e4e6eb', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f2f5', display: 'flex', alignItems: 'center', gap: 8 }}>
            {profile?.avatar_url ? (
              <div style={{ width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                <img src={profile.avatar_url} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ) : (
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: AVATAR_COLORS[avatarColor], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                {displayName[0].toUpperCase()}
              </div>
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={18} color="#050505" />
                <span style={{ fontSize: 18, fontWeight: 800, color: '#050505' }}>Your Activity</span>
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 1 }}>Likes, comments, shares and votes you've made</div>
            </div>
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
              <Clock size={40} color="#d1d5db" style={{ margin: '0 auto 12px', display: 'block' }} />
              <div style={{ fontSize: 16, fontWeight: 700, color: '#050505', marginBottom: 4 }}>No activity yet</div>
              <div style={{ fontSize: 14, color: '#65676b' }}>Start engaging with posts — likes, comments, shares and votes will appear here.</div>
            </div>
          )}

          {filtered.map(item => {
            const meta = TYPE_META[item.type]
            return (
              <div key={item.id}
                onClick={() => goToPost(item.post_id)}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', borderBottom: '1px solid #f0f2f5', cursor: 'pointer', transition: 'background 0.1s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f8fafc' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff' }}>

                {/* Icon badge */}
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1.5px solid ${meta.color}22` }}>
                  {meta.icon && <span style={{ transform: 'scale(1.6)' }}>{meta.icon}</span>}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, color: '#050505', lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 700, color: meta.color }}>You {meta.label}</span>{' '}
                    a post by <strong>{item.post_author}</strong>
                  </div>
                  <div style={{ fontSize: 13, color: '#65676b', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                    {item.type === 'comment' && item.comment_body
                      ? <><span style={{ color: '#3b82f6', fontStyle: 'italic' }}>"{truncate(item.comment_body, 60)}"</span>{' — '}</>
                      : null}
                    {truncate(item.post_body)}
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{timeAgo(item.created_at)}</div>
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
                {loadingMore ? 'Loading…' : 'Load more activity'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
