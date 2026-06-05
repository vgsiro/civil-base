'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Home, Grid2x2, Users, Bookmark, Clock, ChevronDown, GraduationCap, MessageSquarePlus } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Profile, PostWithProfile, PostCategory } from '../types'
import { useTranslation } from '../i18n/LanguageContext'
import PostCard from '../components/PostCard'
import PostModalFromFeed from '../components/PostModalFromFeed'
import CreatePost from '../components/CreatePost'
import UserCard from '../components/UserCard'
import AccountMenu from '../components/AccountMenu'
import TopNavBar from '../components/TopNavBar'
import CommunityStats from '../components/CommunityStats'
import { usePageView } from '../hooks/usePageView'
import { createNotification, deleteNotification } from '../lib/notify'
import NotificationDropdown from '../components/NotificationDropdown'
import MessageDropdown from '../components/MessageDropdown'
import FriendRequestDropdown from '../components/FriendRequestDropdown'
import ChatBox from '../components/ChatBox'
import FeedbackModal from '../components/FeedbackModal'

const AVATAR_COLORS = [
  'linear-gradient(135deg, #3b82f6, #8b5cf6)',
  'linear-gradient(135deg, #10b981, #3b82f6)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #ec4899, #8b5cf6)',
  'linear-gradient(135deg, #06b6d4, #10b981)',
  'linear-gradient(135deg, #f97316, #f59e0b)',
]

// Defined inside component to pick up translations — see useMemo below
const MAIN_NAV_DEF = [
  { icon: <Home size={20} />, labelKey: 'nav_feed' as const, href: '/feed', active: true, bg: '#3b82f6' },
  { icon: <Grid2x2 size={20} />, labelKey: 'nav_civilbase' as const, href: '/', active: false, bg: '#10b981' },
  { icon: <Users size={20} />, labelKey: 'nav_community' as const, href: '/feed', active: false, bg: '#8b5cf6' },
  { icon: <Bookmark size={20} />, labelKey: 'nav_saved' as const, href: '#', active: false, bg: '#f59e0b' },
  { icon: <Clock size={20} />, labelKey: 'nav_recent' as const, href: '#', active: false, bg: '#64748b' },
]
// Feedback is a button (not a link), defined separately

type CategoryFilter = 'all' | PostCategory

// Concrete: RC beam with cross-section (rectangle + rebar dots)
const IconConcrete = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="14" height="8" rx="0.5" />
    <circle cx="3.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    <circle cx="3.5" cy="9.5" r="0.8" fill="currentColor" stroke="none" />
    <circle cx="12.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    <circle cx="12.5" cy="9.5" r="0.8" fill="currentColor" stroke="none" />
    <line x1="1" y1="8" x2="15" y2="8" strokeDasharray="2 1.5" />
  </svg>
)

// Steel: I-beam cross-section
const IconSteel = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="2" x2="13" y2="2" />
    <line x1="3" y1="14" x2="13" y2="14" />
    <line x1="8" y1="2" x2="8" y2="14" />
    <line x1="3" y1="2.7" x2="3" y2="2" />
    <line x1="13" y1="2.7" x2="13" y2="2" />
    <line x1="3" y1="13.3" x2="3" y2="14" />
    <line x1="13" y1="13.3" x2="13" y2="14" />
  </svg>
)

// Composite: I-beam with concrete slab on top
const IconComposite = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="12" height="3" rx="0.4" />
    <line x1="5" y1="14" x2="11" y2="14" />
    <line x1="8" y1="5" x2="8" y2="14" />
    <line x1="5" y1="13.3" x2="5" y2="14" />
    <line x1="11" y1="13.3" x2="11" y2="14" />
  </svg>
)

// Geotechnical: layered soil with pile
const IconGeotech = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <line x1="1" y1="6" x2="15" y2="6" />
    <line x1="1" y1="10" x2="15" y2="10" />
    <line x1="8" y1="1" x2="8" y2="15" strokeWidth="2" />
    <line x1="6" y1="13" x2="8" y2="15" />
    <line x1="10" y1="13" x2="8" y2="15" />
  </svg>
)

// Others: wrench + question
const IconOthers = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="6.5" />
    <path d="M8 5.5a1.5 1.5 0 0 1 0 3" />
    <circle cx="8" cy="11" r="0.7" fill="currentColor" stroke="none" />
  </svg>
)

const CATEGORY_TABS: { value: CategoryFilter; labelKey: import('../i18n/index').TranslationKey; color: string; activeColor: string; activeBg: string; activeBorder: string; icon: React.ReactNode }[] = [
  { value: 'all',          labelKey: 'nav_all',          color: '#65676b', activeColor: '#1877f2', activeBg: '#e7f3ff', activeBorder: '#b3d4ff', icon: <Home size={14} /> },
  { value: 'concrete',     labelKey: 'nav_concrete',     color: '#65676b', activeColor: '#374151', activeBg: '#f3f4f6', activeBorder: '#d1d5db', icon: <IconConcrete /> },
  { value: 'steel',        labelKey: 'nav_steel',        color: '#65676b', activeColor: '#1d4ed8', activeBg: '#eff6ff', activeBorder: '#bfdbfe', icon: <IconSteel /> },
  { value: 'composite',    labelKey: 'nav_composite',    color: '#65676b', activeColor: '#6d28d9', activeBg: '#f5f3ff', activeBorder: '#ddd6fe', icon: <IconComposite /> },
  { value: 'geotechnical', labelKey: 'nav_geotechnical', color: '#65676b', activeColor: '#065f46', activeBg: '#ecfdf5', activeBorder: '#6ee7b7', icon: <IconGeotech /> },
  { value: 'others',       labelKey: 'nav_others',       color: '#65676b', activeColor: '#b45309', activeBg: '#fffbeb', activeBorder: '#fde68a', icon: <IconOthers /> },
]

export default function FeedPage() {
  usePageView('feed')
  const router = useRouter()
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const userRef = useRef<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<PostWithProfile[]>([])
  const [suggestions, setSuggestions] = useState<Profile[]>([])
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [reshareTarget, setReshareTarget] = useState<PostWithProfile | null>(null)
  const [leftExpanded, setLeftExpanded] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const [unreadMsgs, setUnreadMsgs] = useState(0)
  const [pendingFriends, setPendingFriends] = useState(0)
  const [openChats, setOpenChats] = useState<{ convId: string; peer: any }[]>([])
  const [openPostId, setOpenPostId] = useState<string | null>(() => searchParams.get('post'))
  const [postSort, setPostSort] = useState<'newest' | 'top' | 'ranked'>('ranked')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>(
    (searchParams.get('category') as CategoryFilter) || 'all'
  )
  // ranked order: array of post IDs from the recommendation API
  const [rankedOrder, setRankedOrder] = useState<string[]>([])

  function openPost(id: string) {
    setOpenPostId(id)
    router.replace(`/feed?post=${id}`, { scroll: false })
  }
  function closePost() {
    setOpenPostId(null)
    router.replace('/feed', { scroll: false })
  }

  function logInteraction(postId: string, authorId: string, action: string) {
    const currentUser = userRef.current
    if (!currentUser) return
    supabase.from('post_interactions')
      .upsert(
        { user_id: currentUser.id, post_id: postId, author_id: authorId, action },
        { onConflict: 'user_id,post_id,action' },
      )
      .then(({ error }) => {
        if (error) console.error('[Interaction] upsert failed:', error.message)
        if (action === 'view') {
          supabase.rpc('increment_post_seen', { p_user_id: currentUser.id, p_post_id: postId }).then(() => {})
        }
      })
  }

  async function fetchRankedOrder(authUser: User | null, currentPosts: PostWithProfile[]) {
    if (currentPosts.length === 0) return
    try {
      // Fetch viewer interests
      const interests: string[] = authUser
        ? ((await supabase.from('profiles').select('specializations').eq('id', authUser.id).maybeSingle())
            .data?.specializations ?? [])
        : []

      // Fetch past interactions (empty if not logged in — RLS)
      const interactionsData = authUser
        ? (await supabase.from('post_interactions')
            .select('post_id, author_id, action')
            .eq('user_id', authUser.id)
            .limit(500)).data ?? []
        : []

      // Fetch seen counts
      const seenData = authUser
        ? (await supabase.from('post_seen')
            .select('post_id, count')
            .eq('user_id', authUser.id)).data ?? []
        : []

      const viewer = { id: authUser?.id ?? '__guest__', interests }
      const interactions = interactionsData.map((r: any) => ({
        userId: authUser!.id, postId: r.post_id, authorId: r.author_id, action: r.action, at: 0,
      }))
      const seenCounts: Record<string, number> = {}
      for (const r of seenData as any[]) seenCounts[r.post_id] = r.count


      // Import ranking engine (it's pure TS, safe to run client-side)
      const { buildFeed } = await import('@/lib/feed-ranking')

      const ranked = await buildFeed({
        viewer,
        dataSource: {
          getCandidatePosts: async () => currentPosts.map(p => ({
            id: p.id,
            authorId: p.user_id,
            createdAt: new Date(p.created_at).getTime(),
            tags: [p.category].filter(Boolean),
            stats: {
              likes:       p.post_likes.length,
              comments:    p.post_comments.length,
              shares:      p.post_recommendations.length,
              impressions: Math.max(p.post_likes.length + p.post_comments.length + 1, 1),
            },
          })),
          getBlockedAuthors:     async () => new Set<string>(),
          getHiddenPostIds:      async () => new Set<string>(),
          getViewerInteractions: async () => interactions,
          getSeenCounts:         async () => seenCounts,
        },
        limit: currentPosts.length,
      })

      setRankedOrder(ranked.map(r => r.post.id))
    } catch (e) {
      console.error('ranking error', e)
    }
  }

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null

    async function init() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      setUser(authUser)
      userRef.current = authUser

      if (authUser) {
        const { data: profileData } = await supabase
          .from('profiles').select('*').eq('id', authUser.id).maybeSingle()
        setProfile(profileData as Profile | null)

        // Unread counts
        const [{ count: notifCount }, { data: convParticipants }, { count: friendCount }] = await Promise.all([
          supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', authUser.id).eq('read', false),
          supabase.from('conversation_participants').select('conversation_id, last_read_at').eq('user_id', authUser.id),
          supabase.from('friendships').select('*', { count: 'exact', head: true }).eq('receiver_id', authUser.id).eq('status', 'pending'),
        ])
        setUnreadNotifs(notifCount ?? 0)
        setPendingFriends(friendCount ?? 0)
        if (convParticipants) {
          let msgUnread = 0
          for (const cp of convParticipants) {
            const { count } = await supabase.from('messages').select('*', { count: 'exact', head: true })
              .eq('conversation_id', cp.conversation_id)
              .neq('sender_id', authUser.id)
              .gt('created_at', cp.last_read_at ?? '1970-01-01')
            msgUnread += count ?? 0
          }
          setUnreadMsgs(msgUnread)
        }

        // Real-time message + friend-request badge (notifications handled by NotificationDropdown)
        channel = supabase.channel(`feed-badges-${authUser.id}-${Date.now()}`)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload: any) => {
            if (payload.new.sender_id !== authUser.id) setUnreadMsgs(n => n + 1)
          })
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'friendships', filter: `receiver_id=eq.${authUser.id}` }, (payload: any) => {
            if (payload.new.status === 'pending') setPendingFriends(n => n + 1)
          })
          .subscribe()

        const { data: followData } = await supabase
          .from('follows').select('following_id').eq('follower_id', authUser.id)
        const ids = new Set<string>((followData ?? []).map((f: any) => f.following_id))
        setFollowingIds(ids)

        const excludeIds = [authUser.id, ...Array.from(ids)]
        const { data: suggData } = await supabase
          .from('profiles').select('*')
          .not('id', 'in', `(${excludeIds.join(',')})`)
          .limit(6)
        setSuggestions((suggData as Profile[]) ?? [])
      }

      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles!posts_user_id_fkey(id,username,family_name,given_name,display_name,full_name,profession,specializations,is_verified,avatar_color,avatar_url), post_likes(user_id), post_comments(id), post_recommendations(user_id)')
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) console.error('feed query error:', error.message, error.details)
      const fetchedPosts = (data as PostWithProfile[]) ?? []
      setPosts(fetchedPosts)
      setHasMore(fetchedPosts.length === 20)
      await fetchRankedOrder(authUser, fetchedPosts)
      setLoading(false)
    }
    init()
    return () => { channel?.unsubscribe() }
  }, [])

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || posts.length === 0) return
    setLoadingMore(true)
    const cursor = posts[posts.length - 1].created_at
    const { data } = await supabase
      .from('posts')
      .select('*, profiles!posts_user_id_fkey(id,username,family_name,given_name,display_name,full_name,profession,specializations,is_verified,avatar_color,avatar_url), post_likes(user_id), post_comments(id), post_recommendations(user_id)')
      .order('created_at', { ascending: false })
      .lt('created_at', cursor)
      .limit(20)
    const more = (data as PostWithProfile[]) ?? []
    setPosts(prev => {
      const updated = [...prev, ...more]
      fetchRankedOrder(userRef.current, updated)
      return updated
    })
    setHasMore(more.length === 20)
    setLoadingMore(false)
  }, [hasMore, loadingMore, posts])

  function handlePostCreated(post: PostWithProfile) {
    setPosts(prev => [post, ...prev])
    setReshareTarget(null)
  }

  function handleLikeToggle(postId: string, wasLiked: boolean) {
    if (!user) return
    setPosts(prev => prev.map(p => p.id !== postId ? p : {
      ...p,
      post_likes: wasLiked
        ? p.post_likes.filter(l => l.user_id !== user.id)
        : [...p.post_likes, { user_id: user.id }],
    }))
    const post = posts.find(p => p.id === postId)
    if (wasLiked) {
      supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id).then(() => {})
      if (post) deleteNotification({ userId: post.user_id, actorId: user.id, type: 'like', postId })
    } else {
      supabase.from('post_likes').insert({ post_id: postId, user_id: user.id })
        .then(({ error }) => { if (error) console.error('like insert error:', error.message) })
      if (post) {
        createNotification({ userId: post.user_id, actorId: user.id, type: 'like', postId })
        logInteraction(postId, post.user_id, 'like')
      }
    }
  }

  function handleRecommendToggle(postId: string, wasRecommended: boolean) {
    if (!user) return
    setPosts(prev => prev.map(p => p.id !== postId ? p : {
      ...p,
      post_recommendations: wasRecommended
        ? p.post_recommendations.filter(r => r.user_id !== user.id)
        : [...p.post_recommendations, { user_id: user.id }],
    }))
    const post = posts.find(p => p.id === postId)
    if (wasRecommended) {
      supabase.from('post_recommendations').delete().eq('post_id', postId).eq('user_id', user.id).then(() => {})
    } else {
      supabase.from('post_recommendations').insert({ post_id: postId, user_id: user.id })
        .then(({ error }) => { if (error) console.error('recommend insert error:', error.message) })
      if (post) logInteraction(postId, post.user_id, 'share')
    }
  }

  async function handleFollowToggle(profileId: string, isFollowing: boolean) {
    if (!user) return
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', profileId)
      setFollowingIds(prev => { const n = new Set(prev); n.delete(profileId); return n })
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: profileId })
      setFollowingIds(prev => new Set([...prev, profileId]))
      createNotification({ userId: profileId, actorId: user.id, type: 'follow' })
    }
  }

  const displayName = profile?.display_name || profile?.full_name || user?.email?.split('@')[0] || 'You'
  const avatarColor = profile?.avatar_color ?? 0
  const profileHref = profile?.username ? `/u/${profile.username}` : '/profile'

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', display: 'flex', flexDirection: 'column' }}>

      {/* Feedback modal */}
      {showFeedback && <FeedbackModal user={user} onClose={() => setShowFeedback(false)} />}

      {/* ── Floating ChatBoxes ── */}
      {user && openChats.map((chat, i) => (
        <ChatBox
          key={chat.convId}
          convId={chat.convId}
          userId={user.id}
          peer={chat.peer}
          index={i}
          onClose={() => setOpenChats(prev => prev.filter(c => c.convId !== chat.convId))}
          onOpenFull={() => { window.location.href = `/messages?conv=${chat.convId}` }}
        />
      ))}

      {/* ── Post modal triggered from notification ── */}
      {openPostId && user && (
        <PostModalFromFeed postId={openPostId} currentUserId={user.id} onClose={closePost} />
      )}

      {/* ═══ TOP NAV BAR ═══ */}
      <TopNavBar
        user={user}
        profile={profile}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        unreadNotifs={unreadNotifs}
        onUnreadNotifsChange={setUnreadNotifs}
        unreadMsgs={unreadMsgs}
        onUnreadMsgsChange={setUnreadMsgs}
        pendingFriends={pendingFriends}
        onPendingFriendsChange={setPendingFriends}
        onOpenChat={(conv, peer) => {
          setOpenChats(prev => prev.some(c => c.convId === conv.id) ? prev : [...prev, { convId: conv.id, peer }])
          setUnreadMsgs(n => Math.max(0, n - (conv.unread_count ?? 0)))
        }}
        onOpenPost={openPost}
        onSignIn={() => router.push('/')}
      />

      {/* ═══ 3-COLUMN BODY ═══ */}
      <div style={{
        flex: 1, maxWidth: 1280, width: '100%', margin: '0 auto',
        padding: '16px 8px',
        display: 'grid', gridTemplateColumns: '280px 1fr 300px', gap: 16,
        alignItems: 'start',
      }}>

        {/* ── LEFT SIDEBAR ── */}
        <div style={{ position: 'sticky', top: 68, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', maxHeight: 'calc(100vh - 80px)' }}>

          {/* User row */}
          {user && (
            <a href={profileHref}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 8, textDecoration: 'none', marginBottom: 4 }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#e4e6eb' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: AVATAR_COLORS[avatarColor], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                {displayName[0].toUpperCase()}
              </div>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#050505' }}>{displayName}</span>
            </a>
          )}

          {/* Main nav */}
          {MAIN_NAV_DEF.map(item => (
            <a key={item.labelKey} href={item.href}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 8,
                textDecoration: 'none', background: item.active ? '#e7f3ff' : 'transparent',
              }}
              onMouseEnter={e => { if (!item.active) (e.currentTarget as HTMLAnchorElement).style.background = '#e4e6eb' }}
              onMouseLeave={e => { if (!item.active) (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: item.active ? item.bg : '#e4e6eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: item.active ? '#fff' : item.bg }}>{item.icon}</span>
              </div>
              <span style={{ fontSize: 15, fontWeight: item.active ? 700 : 500, color: item.active ? '#3b82f6' : '#050505' }}>
                {t(item.labelKey)}
              </span>
            </a>
          ))}

          {/* See more / less */}
          <button onClick={() => setLeftExpanded(v => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' as const, width: '100%' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#e4e6eb' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e4e6eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ChevronDown size={20} color="#050505" style={{ transform: leftExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </div>
            <span style={{ fontSize: 15, fontWeight: 500, color: '#050505' }}>{leftExpanded ? t('sidebar_see_less') : t('sidebar_see_more')}</span>
          </button>

          {/* Feedback / Send ticket */}
          <button onClick={() => setShowFeedback(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' as const, width: '100%' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#e4e6eb' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e4e6eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MessageSquarePlus size={20} color="#7c3aed" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#050505' }}>Send Feedback</div>
              <div style={{ fontSize: 11, color: '#65676b' }}>Report bugs · Request features</div>
            </div>
          </button>

          <div style={{ height: 1, background: '#e4e6eb', margin: '8px 0' }} />

          {/* Shortcuts section */}
          {user && profile?.username && (
            <>
              <div style={{ padding: '4px 12px 2px', fontSize: 17, fontWeight: 700, color: '#050505' }}>{t('sidebar_shortcuts')}</div>
              {[
                { label: t('sidebar_my_profile'), href: profileHref, emoji: '👤' },
                { label: t('sidebar_lecture_notes'), href: '/', emoji: '📚' },
                { label: t('sidebar_bolt_data'), href: '/bolt-data', emoji: '🔩' },
              ].map(sc => (
                <a key={sc.label} href={sc.href}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 12px', borderRadius: 8, textDecoration: 'none' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#e4e6eb' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 10, background: '#e4e6eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                    {sc.emoji}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#050505', lineHeight: 1.3 }}>{sc.label}</span>
                </a>
              ))}
            </>
          )}

          {user && !profile?.username && (
            <div style={{ margin: '8px 12px', padding: '10px 12px', background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a' }}>
              <div style={{ fontSize: 13, color: '#92400e', fontWeight: 700, marginBottom: 4 }}>{t('sidebar_complete_profile')}</div>
              <a href="/profile" style={{ fontSize: 13, color: '#3b82f6', textDecoration: 'none' }}>{t('sidebar_set_username')}</a>
            </div>
          )}

          <div style={{ padding: '16px 12px 8px', fontSize: 12, color: '#bcc0c4', lineHeight: 1.9 }}>
            Civil Base © 2025
          </div>
        </div>

        {/* ── CENTER FEED ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 590, width: '100%', justifySelf: 'center' }}>

          {/* Compose box */}
          {user ? (
            reshareTarget ? (
              <CreatePost user={user} avatarColor={avatarColor} displayName={displayName}
                onPostCreated={handlePostCreated} resharePost={reshareTarget} onCancelReshare={() => setReshareTarget(null)} />
            ) : (
              <CreatePost user={user} avatarColor={avatarColor} displayName={displayName} onPostCreated={handlePostCreated} />
            )
          ) : (
            <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e4e6eb', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e4e6eb', flexShrink: 0 }} />
              <button onClick={() => router.push('/')}
                style={{ flex: 1, textAlign: 'left' as const, padding: '10px 16px', borderRadius: 20, border: '1px solid #e4e6eb', background: '#f0f2f5', color: '#65676b', fontSize: 15, cursor: 'pointer' }}>
                Sign in to share your knowledge…
              </button>
            </div>
          )}

          {/* Posts */}
          {/* Sort bar */}
          {!loading && posts.filter(p => categoryFilter === 'all' || p.category === categoryFilter).length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', borderRadius: 10, border: '1px solid #e4e6eb', padding: '8px 14px' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#65676b' }}>{t('feed_sort')}</span>
              {([
                ['ranked',  '✨ For You']  as const,
                ['newest',  t('feed_sort_latest')] as const,
                ['top',     t('feed_sort_top')]    as const,
              ]).map(([val, label]) => (
                <button key={val} onClick={() => setPostSort(val)}
                  style={{ fontSize: 13, fontWeight: 700, padding: '4px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                    background: postSort === val ? '#e7f3ff' : '#f0f2f5',
                    color: postSort === val ? '#1877f2' : '#65676b' }}>
                  {label}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center' as const, padding: '60px 0', color: '#65676b', fontSize: 15 }}>{t('feed_loading')}</div>
          ) : posts.length === 0 ? (
            <div style={{ textAlign: 'center' as const, padding: '60px 20px', background: '#fff', borderRadius: 10, border: '1px solid #e4e6eb' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📢</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#050505', marginBottom: 6 }}>{t('feed_empty_title')}</div>
              <div style={{ fontSize: 14, color: '#65676b' }}>{t('feed_empty_sub')}</div>
            </div>
          ) : posts.filter(p => categoryFilter === 'all' || p.category === categoryFilter).length === 0 ? (
            <div style={{ textAlign: 'center' as const, padding: '60px 20px', background: '#fff', borderRadius: 10, border: '1px solid #e4e6eb' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#050505', marginBottom: 6 }}>{t('feed_category_empty_title')}</div>
              <div style={{ fontSize: 14, color: '#65676b' }}>{t('feed_category_empty_sub')} {CATEGORY_TABS.find(tab => tab.value === categoryFilter) ? t(CATEGORY_TABS.find(tab => tab.value === categoryFilter)!.labelKey) : ''}!</div>
            </div>
          ) : (
            (() => {
              const filtered = posts.filter(p => categoryFilter === 'all' || p.category === categoryFilter)
              const sorted = postSort === 'ranked' && rankedOrder.length > 0
                ? [...filtered].sort((a, b) => {
                    const ai = rankedOrder.indexOf(a.id)
                    const bi = rankedOrder.indexOf(b.id)
                    // posts not in ranked order go to the end
                    return (ai === -1 ? Infinity : ai) - (bi === -1 ? Infinity : bi)
                  })
                : postSort === 'newest'
                  ? [...filtered].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  : [...filtered].sort((a, b) => b.post_likes.length - a.post_likes.length)
              return sorted.map(post => (
                <PostCard key={post.id} post={post} currentUserId={user?.id ?? null}
                  currentUserIsVerified={profile?.is_verified ?? false}
                  currentUser={user}
                  currentProfile={profile}
                  onLikeToggle={handleLikeToggle}
                  onRecommendToggle={handleRecommendToggle}
                  onReshare={p => { setReshareTarget(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  onDeleted={id => setPosts(prev => prev.filter(p => p.id !== id))}
                  onEdited={(id, body, visibility) => setPosts(prev => prev.map(p => p.id !== id ? p : { ...p, body, visibility }))}
                  onModalOpen={(postId) => { openPost(postId); const p = posts.find(x => x.id === postId); if (p) logInteraction(postId, p.user_id, 'view') }}
                  onModalClose={closePost}
                  onView={(postId, authorId) => logInteraction(postId, authorId, 'view')} />
              ))
            })()
          )}

          {!loading && hasMore && posts.length > 0 && (
            <button onClick={loadMore} disabled={loadingMore}
              style={{ padding: '12px', borderRadius: 8, border: 'none', background: '#fff', color: '#3b82f6', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              {loadingMore ? t('feed_loading_more') : t('feed_see_more')}
            </button>
          )}
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div style={{ position: 'sticky', top: 68, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* People you may know */}
          {suggestions.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e4e6eb', padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 17, fontWeight: 700, color: '#050505' }}>{t('sidebar_people')}</span>
                <a href="#" style={{ fontSize: 14, color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>{t('sidebar_see_all')}</a>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {suggestions.map((s, i) => (
                  <div key={s.id} style={{ borderTop: i > 0 ? '1px solid #f0f2f5' : 'none' }}>
                    <UserCard profile={s} isFollowing={followingIds.has(s.id)} currentUserId={user?.id ?? null}
                      onFollowToggle={handleFollowToggle} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Community stats */}
          <CommunityStats simple />

          {/* Footer links */}
          <div style={{ padding: '0 4px' }}>
            <div style={{ fontSize: 12, color: '#bcc0c4', lineHeight: 2 }}>
              Civil Base · Community · Feed
            </div>
            <div style={{ fontSize: 12, color: '#bcc0c4' }}>© 2025 Civil Base</div>
          </div>
        </div>
      </div>
    </div>
  )
}
