'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  UserPlus, UserMinus, Pencil, Camera,
  BadgeCheck, ShieldCheck, MessageCircle,
  UserCheck, UserX, Clock, X,
} from 'lucide-react'
import { supabase } from '../../../../lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Profile, ProfileStats, PostWithProfile, FeaturedLink } from '../../types'
import PostCard from '../../components/PostCard'
import CreatePost from '../../components/CreatePost'
import AccountMenu from '../../components/AccountMenu'
import TopNavBar from '../../components/TopNavBar'
import VerifyModal from '../../components/VerifyModal'
import PhotoModal from '../../components/PhotoModal'
import ChatBox from '../../components/ChatBox'
import NotificationDropdown from '../../components/NotificationDropdown'
import MessageDropdown from '../../components/MessageDropdown'
import FriendRequestDropdown from '../../components/FriendRequestDropdown'
import PostModalFromFeed from '../../components/PostModalFromFeed'
import { createNotification, deleteNotification } from '../../lib/notify'
import { useTranslation } from '../../i18n/LanguageContext'

// ─── Constants ────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'linear-gradient(135deg, #3b82f6, #8b5cf6)',
  'linear-gradient(135deg, #10b981, #3b82f6)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #ec4899, #8b5cf6)',
  'linear-gradient(135deg, #06b6d4, #10b981)',
  'linear-gradient(135deg, #f97316, #f59e0b)',
]

const COVER_COLORS = [
  'linear-gradient(160deg, #1e3a8a 0%, #2563eb 40%, #7c3aed 100%)',
  'linear-gradient(160deg, #064e3b 0%, #059669 40%, #2563eb 100%)',
  'linear-gradient(160deg, #7c2d12 0%, #d97706 40%, #dc2626 100%)',
  'linear-gradient(160deg, #831843 0%, #db2777 40%, #7c3aed 100%)',
  'linear-gradient(160deg, #164e63 0%, #0891b2 40%, #059669 100%)',
  'linear-gradient(160deg, #7c2d12 0%, #ea580c 40%, #ca8a04 100%)',
]

import EditModal, { PROFESSION_KEYS, SPECIALIZATION_KEYS } from './EditModal'
import ProfileIntroCard from './ProfileIntroCard'

type Tab = 'posts' | 'about'

// ─── Main public profile page ─────────────────────────────────────────────────

export default function PublicProfilePage() {
  const params = useParams()
  const router = useRouter()
  const username = params?.username as string
  const { t, locale } = useTranslation()

  function tp(value: string | null | undefined): string {
    if (!value) return ''
    const prof = PROFESSION_KEYS.find(p => p.value === value)
    if (prof) return t(prof.labelKey as any)
    const spec = SPECIALIZATION_KEYS.find(s => s.value === value)
    if (spec) return t(spec.labelKey as any)
    return value
  }

  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [posts, setPosts] = useState<PostWithProfile[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending_sent' | 'pending_received' | 'friends'>('none')
  const [friendshipId, setFriendshipId] = useState<string | null>(null)
  const [friendLoading, setFriendLoading] = useState(false)
  const [showMessageBox, setShowMessageBox] = useState(false)
  const [convId, setConvId] = useState<string | null>(null)
  const chatRestoredRef = useRef(false)
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const [unreadMsgs, setUnreadMsgs] = useState(0)
  const [pendingFriends, setPendingFriends] = useState(0)
  const [openChats, setOpenChats] = useState<{ convId: string; peer: any }[]>([])
  const [openPostId, setOpenPostId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('posts')
  const [reshareTarget, setReshareTarget] = useState<PostWithProfile | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [photoModalTab, setPhotoModalTab] = useState<'avatar' | 'cover' | null>(null)
  const [showVerifyModal, setShowVerifyModal] = useState(false)

  // Persist open chat state to sessionStorage so F5 restores them
  useEffect(() => {
    if (!chatRestoredRef.current) return // don't persist until after restore
    const key = `civilbase_chats_${username}`
    sessionStorage.setItem(key, JSON.stringify({ showMessageBox, convId, openChats }))
  }, [showMessageBox, convId, openChats, username])

  useEffect(() => {
    if (!username) return
    async function load() {
      const { data: profileData } = await supabase
        .from('profiles').select('*').eq('username', username).maybeSingle()
      if (!profileData) { setNotFound(true); setLoading(false); return }
      setProfile(profileData as Profile)

      const { data: statsData } = await supabase
        .from('profile_stats').select('*').eq('username', username).maybeSingle()
      setStats(statsData as ProfileStats | null)

      const { data: postsData, error: postsErr } = await supabase
        .from('posts')
        .select('*, profiles!posts_user_id_fkey(id,username,family_name,given_name,display_name,full_name,profession,specializations,is_verified,avatar_color,avatar_url), post_likes(user_id), post_comments(id), post_recommendations(user_id)')
        .eq('user_id', (profileData as Profile).id)
        .order('created_at', { ascending: false })
        .limit(20)
      if (postsErr) console.error('posts fetch error:', postsErr.message)
      setPosts((postsData as PostWithProfile[]) ?? [])

      const { data: { user: authUser } } = await supabase.auth.getUser()
      setCurrentUser(authUser)

      if (authUser) {
        const { data: cpData } = await supabase
          .from('profiles').select('*').eq('id', authUser.id).maybeSingle()
        setCurrentProfile(cpData as Profile | null)

        // Restore open chats from sessionStorage
        if (!chatRestoredRef.current) {
          chatRestoredRef.current = true
          try {
            const saved = sessionStorage.getItem(`civilbase_chats_${username}`)
            if (saved) {
              const { showMessageBox: sm, convId: cid, openChats: oc } = JSON.parse(saved)
              if (sm && cid) { setShowMessageBox(true); setConvId(cid) }
              if (oc?.length) setOpenChats(oc)
            }
          } catch {}
        }

        // Unread counts for nav icons
        const [{ count: nCount }, { data: convParts }, { count: friendCount }] = await Promise.all([
          supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', authUser.id).eq('read', false),
          supabase.from('conversation_participants').select('conversation_id, last_read_at').eq('user_id', authUser.id),
          supabase.from('friendships').select('*', { count: 'exact', head: true }).eq('receiver_id', authUser.id).eq('status', 'pending'),
        ])
        setUnreadNotifs(nCount ?? 0)
        setPendingFriends(friendCount ?? 0)
        if (convParts) {
          let msgUnread = 0
          for (const cp of convParts) {
            const { count } = await supabase.from('messages').select('*', { count: 'exact', head: true })
              .eq('conversation_id', cp.conversation_id).neq('sender_id', authUser.id)
              .gt('created_at', cp.last_read_at ?? '1970-01-01')
            msgUnread += count ?? 0
          }
          setUnreadMsgs(msgUnread)
        }

        if (authUser.id !== (profileData as Profile).id) {
          const [{ data: followData }, { data: friendData }] = await Promise.all([
            supabase.from('follows').select('follower_id')
              .eq('follower_id', authUser.id).eq('following_id', (profileData as Profile).id).maybeSingle(),
            supabase.from('friendships').select('id, status, requester_id')
              .or(`requester_id.eq.${authUser.id},receiver_id.eq.${authUser.id}`)
              .or(`requester_id.eq.${(profileData as Profile).id},receiver_id.eq.${(profileData as Profile).id}`)
              .maybeSingle(),
          ])
          setIsFollowing(!!followData)
          if (friendData) {
            setFriendshipId(friendData.id)
            if (friendData.status === 'accepted') {
              setFriendStatus('friends')
            } else if (friendData.status === 'pending') {
              setFriendStatus(friendData.requester_id === authUser.id ? 'pending_sent' : 'pending_received')
            }
          }
        }

      }

      setLoading(false)
    }

    let cleanup: (() => void) | undefined
    supabase.auth.getUser().then(async ({ data: { user: authUser } }) => {
      if (!authUser) return
      const uid = authUser.id

      // Friend requests: realtime is reliable with a server-side filter
      const channel = supabase.channel(`profile-badges-${uid}-${Date.now()}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'friendships', filter: `receiver_id=eq.${uid}` }, (payload: any) => {
          if (payload.new.status === 'pending') setPendingFriends(n => n + 1)
        })
        .subscribe()

      // Message unread badge: poll every 5s — more reliable than unfiltered realtime
      // (Supabase postgres_changes without a server-side filter doesn't work with RLS)
      async function refreshMsgBadge() {
        const { data: parts } = await supabase
          .from('conversation_participants').select('conversation_id, last_read_at').eq('user_id', uid)
        if (!parts || parts.length === 0) { setUnreadMsgs(0); return }
        let total = 0
        await Promise.all(parts.map(async (cp: any) => {
          const { count } = await supabase.from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', cp.conversation_id)
            .neq('sender_id', uid)
            .gt('created_at', cp.last_read_at ?? '1970-01-01')
          total += count ?? 0
        }))
        setUnreadMsgs(total)
      }

      const pollInterval = setInterval(refreshMsgBadge, 5000)
      cleanup = () => { channel.unsubscribe(); clearInterval(pollInterval) }
    })

    load()
    return () => { cleanup?.() }
  }, [username])

  async function toggleFollow() {
    if (!currentUser || !profile) return
    setFollowLoading(true)
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', currentUser.id).eq('following_id', profile.id)
      setIsFollowing(false)
      setStats(s => s ? { ...s, follower_count: Math.max(0, s.follower_count - 1) } : s)
    } else {
      await supabase.from('follows').insert({ follower_id: currentUser.id, following_id: profile.id })
      setIsFollowing(true)
      setStats(s => s ? { ...s, follower_count: s.follower_count + 1 } : s)
    }
    setFollowLoading(false)
  }

  async function sendFriendRequest() {
    if (!currentUser || !profile) return
    setFriendLoading(true)
    const { data } = await supabase.from('friendships')
      .insert({ requester_id: currentUser.id, receiver_id: profile.id, status: 'pending' })
      .select().single()
    if (data) {
      setFriendStatus('pending_sent')
      setFriendshipId(data.id)
      createNotification({ userId: profile.id, actorId: currentUser.id, type: 'friend_request' })
    }
    setFriendLoading(false)
  }

  async function cancelFriendRequest() {
    if (!friendshipId) return
    setFriendLoading(true)
    await supabase.from('friendships').delete().eq('id', friendshipId)
    setFriendStatus('none'); setFriendshipId(null)
    setFriendLoading(false)
  }

  async function acceptFriendRequest() {
    if (!friendshipId || !currentUser || !profile) return
    setFriendLoading(true)
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId)
    setFriendStatus('friends')
    createNotification({ userId: profile.id, actorId: currentUser.id, type: 'friend_accepted' })
    setFriendLoading(false)
  }

  async function unfriend() {
    if (!friendshipId) return
    setFriendLoading(true)
    await supabase.from('friendships').delete().eq('id', friendshipId)
    setFriendStatus('none'); setFriendshipId(null)
    setFriendLoading(false)
  }

  async function openMessage() {
    if (!currentUser || !profile) return
    const { data: convId, error } = await supabase.rpc('find_or_create_conversation', {
      user_a: currentUser.id,
      user_b: profile.id,
    })
    if (error || !convId) { console.error('[openMessage]', error?.message); return }
    setConvId(convId)
    setShowMessageBox(true)
  }

  function handleLikeToggle(postId: string, wasLiked: boolean) {
    if (!currentUser) return
    setPosts(prev => prev.map(p => p.id !== postId ? p : {
      ...p,
      post_likes: wasLiked
        ? p.post_likes.filter(l => l.user_id !== currentUser.id)
        : [...p.post_likes, { user_id: currentUser.id }],
    }))
    const p = posts.find(x => x.id === postId)
    if (wasLiked) {
      supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', currentUser.id).then(() => {})
      if (p) deleteNotification({ userId: p.user_id, actorId: currentUser.id, type: 'like', postId })
    } else {
      supabase.from('post_likes').insert({ post_id: postId, user_id: currentUser.id }).then(() => {})
      if (p) createNotification({ userId: p.user_id, actorId: currentUser.id, type: 'like', postId })
    }
  }

  function handleRecommendToggle(postId: string, wasRecommended: boolean) {
    if (!currentUser) return
    setPosts(prev => prev.map(p => p.id !== postId ? p : {
      ...p,
      post_recommendations: wasRecommended
        ? p.post_recommendations.filter(r => r.user_id !== currentUser.id)
        : [...p.post_recommendations, { user_id: currentUser.id }],
    }))
    if (wasRecommended) {
      supabase.from('post_recommendations').delete().eq('post_id', postId).eq('user_id', currentUser.id).then(() => {})
    } else {
      supabase.from('post_recommendations').insert({ post_id: postId, user_id: currentUser.id }).then(() => {})
    }
  }

  function handleEditSaved(updated: Partial<Profile>) {
    setProfile(prev => prev ? { ...prev, ...updated } : prev)
    setCurrentProfile(prev => prev ? { ...prev, ...updated } : prev)
    // If username changed, navigate to new URL
    if (updated.username && updated.username !== username) {
      router.replace(`/u/${updated.username}`)
    } else {
      setShowEditModal(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 15, color: '#65676b' }}>{t('profile_loading')}</div>
      </div>
    )
  }

  if (notFound || !profile) {
    return (
      <div style={{ minHeight: '100vh', background: '#f0f2f5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ fontSize: 52 }}>🔍</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#050505' }}>{t('profile_not_found')}</div>
        <div style={{ fontSize: 15, color: '#65676b' }}>{t('profile_not_found_sub')} <strong>@{username}</strong> {t('profile_not_found_exists')}</div>
        <button onClick={() => router.push('/')}
          style={{ marginTop: 8, padding: '10px 24px', borderRadius: 8, background: '#3b82f6', border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
          {t('profile_go_dashboard')}
        </button>
      </div>
    )
  }

  const displayName = profile.display_name || profile.full_name || profile.username
  const initial = displayName[0].toUpperCase()
  const isOwnProfile = currentUser?.id === profile.id
  const joined = new Date(profile.created_at).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-AU', { year: 'numeric', month: 'long' })
  const colorIndex = profile.avatar_color ?? 0
  const cpDisplayName = currentProfile?.display_name || currentProfile?.full_name || currentUser?.email?.split('@')[0] || ''

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>

      {/* Edit modal */}
      {showEditModal && currentUser && (
        <EditModal
          user={currentUser}
          profile={profile}
          onClose={() => setShowEditModal(false)}
          onSaved={handleEditSaved}
        />
      )}

      {/* Photo modal */}
      {photoModalTab && currentUser && (
        <PhotoModal
          user={currentUser}
          initialTab={photoModalTab}
          currentAvatarUrl={profile.avatar_url ?? null}
          currentCoverUrl={profile.cover_url ?? null}
          avatarColor={profile.avatar_color ?? 0}
          displayName={displayName}
          onClose={() => setPhotoModalTab(null)}
          onSaved={async updates => {
            setProfile(prev => prev ? { ...prev, ...updates } : prev)
            setPhotoModalTab(null)
            // Fetch the newly created photo post and prepend it
            const { data } = await supabase
              .from('posts')
              .select('*, profiles!posts_user_id_fkey(id,username,family_name,given_name,display_name,full_name,profession,specializations,is_verified,avatar_color,avatar_url), post_likes(user_id), post_comments(id), post_recommendations(user_id)')
              .eq('user_id', profile!.id)
              .in('post_type', ['profile_photo', 'cover_photo'])
              .order('created_at', { ascending: false })
              .limit(1)
            if (data?.[0]) setPosts(prev => [data[0] as PostWithProfile, ...prev])
          }}
        />
      )}

      {/* Verify modal */}
      {showVerifyModal && currentUser && (
        <VerifyModal
          user={currentUser}
          profile={profile}
          onClose={() => setShowVerifyModal(false)}
        />
      )}

      {/* Post modal from notification click */}
      {openPostId && currentUser && (
        <PostModalFromFeed postId={openPostId} currentUserId={currentUser.id} onClose={() => setOpenPostId(null)} />
      )}

      {/* Floating ChatBox */}
      {showMessageBox && convId && currentUser && profile && (
        <ChatBox
          convId={convId}
          userId={currentUser.id}
          peer={{ id: profile.id, username: profile.username, display_name: profile.display_name, full_name: profile.full_name, avatar_color: profile.avatar_color ?? 0, avatar_url: profile.avatar_url ?? null }}
          onClose={() => setShowMessageBox(false)}
          onOpenFull={() => { window.location.href = `/messages?conv=${convId}` }}
          onMarkRead={() => setUnreadMsgs(0)}
          index={0}
        />
      )}

      {/* Floating ChatBoxes from message dropdown */}
      {currentUser && openChats.map((chat, i) => (
        <ChatBox key={chat.convId} convId={chat.convId} userId={currentUser.id} peer={chat.peer} index={i}
          onClose={() => setOpenChats(prev => prev.filter(c => c.convId !== chat.convId))}
          onOpenFull={() => { window.location.href = `/messages?conv=${chat.convId}` }}
          onMarkRead={() => setUnreadMsgs(n => Math.max(0, n - 1))} />
      ))}

      {/* ═══ TOP NAV ═══ */}
      <TopNavBar
        user={currentUser}
        profile={currentProfile}
        categoryFilter={'all' as any}
        onCategoryChange={c => { router.push(c === 'all' ? '/feed' : `/feed?category=${c}`) }}
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
        onOpenPost={postId => setOpenPostId(postId)}
        onSignIn={() => router.push('/')}
      />

      {/* ═══ COVER + PROFILE HEADER ═══ */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e4e6eb', boxShadow: '0 2px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ maxWidth: 1050, margin: '0 auto' }}>

          {/* Cover photo */}
          <div style={{ position: 'relative', height: 348, borderRadius: '0 0 8px 8px', overflow: 'hidden', background: profile.cover_url ? 'transparent' : COVER_COLORS[colorIndex] }}>
            {profile.cover_url
              ? <img src={profile.cover_url} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              : <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.12)' }} />
            }
            {isOwnProfile && (
              <button onClick={() => setPhotoModalTab('cover')}
                style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.9)', border: 'none', fontSize: 14, fontWeight: 700, color: '#050505', cursor: 'pointer', zIndex: 2 }}>
                <Camera size={16} /> {t('cover_edit')}
              </button>
            )}
          </div>

          {/* Avatar + identity */}
          <div style={{ padding: '0 24px', display: 'flex', alignItems: 'flex-start', gap: 16, marginTop: -36 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 168, height: 168, borderRadius: '50%', background: AVATAR_COLORS[colorIndex], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 68, fontWeight: 900, color: '#fff', border: '4px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
                {profile.avatar_url
                  ? <img src={profile.avatar_url} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : initial
                }
              </div>
              {isOwnProfile && (
                <button title="Change profile photo" onClick={() => setPhotoModalTab('avatar')}
                  style={{ position: 'absolute', bottom: 8, right: 8, width: 36, height: 36, borderRadius: '50%', background: '#e4e6eb', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Camera size={16} color="#050505" />
                </button>
              )}
            </div>

            <div style={{ flex: 1, paddingTop: 44, paddingBottom: 12, minWidth: 0 }}>
              {/* Name + verified badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: '#050505', lineHeight: 1.15 }}>{displayName}</span>
                {profile.is_verified && (
                  <span
                    title={[profile.profession, ...(profile.specializations ?? [])].filter(Boolean).map(tp).join(' · ')}
                    style={{ flexShrink: 0, alignSelf: 'flex-end', marginBottom: 4, cursor: 'default', display: 'inline-flex' }}>
                    <svg width="22" height="22" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="17" cy="17" r="17" fill="#1877F2"/>
                      <path d="M10 17.5L14.5 22L24 12" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                )}
              </div>
              {profile.profession && (
                <div style={{ fontSize: 15, color: '#65676b', marginTop: 3 }}>
                  {tp(profile.profession)}
                  {(profile.specializations ?? []).length > 0 && (
                    <span style={{ color: '#94a3b8' }}> · {profile.specializations!.map(tp).join(' · ')}</span>
                  )}
                </div>
              )}
              {stats && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#65676b' }}>{stats.follower_count.toLocaleString()} {t('stat_followers')}</span>
                  <span style={{ color: '#bcc0c4', fontSize: 15 }}>·</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#65676b' }}>{stats.following_count.toLocaleString()} {t('stat_following')}</span>
                  <span style={{ color: '#bcc0c4', fontSize: 15 }}>·</span>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#65676b' }}>{stats.post_count.toLocaleString()} {t('stat_posts')}</span>
                </div>
              )}
              {/* Action buttons — below stats, full width, wraps for long labels */}
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' as const, alignItems: 'center' }}>
              {isOwnProfile ? (
                <>
                  <button onClick={() => setShowEditModal(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, border: 'none', background: '#e4e6eb', color: '#050505', fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' as const }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#d8dadf' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#e4e6eb' }}>
                    <Pencil size={15} /> {t('btn_edit_profile')}
                  </button>
                  {profile.is_verified ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, background: '#f0fdf4', border: '1.5px solid #86efac', color: '#16a34a', fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap' as const }}>
                      <BadgeCheck size={15} /> {t('badge_verified')}
                    </div>
                  ) : (
                    <button onClick={() => setShowVerifyModal(true)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' as const }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#2563eb' }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#3b82f6' }}>
                      <ShieldCheck size={15} /> {t('btn_get_verified')}
                    </button>
                  )}
                </>
              ) : currentUser ? (
                <>
                  <button onClick={openMessage}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, border: 'none', background: '#e4e6eb', color: '#050505', fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' as const }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#d8dadf' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#e4e6eb' }}>
                    <MessageCircle size={15} /> {t('btn_message')}
                  </button>
                  {friendStatus === 'none' && (
                    <button onClick={sendFriendRequest} disabled={friendLoading}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' as const }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#2563eb' }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#3b82f6' }}>
                      <UserPlus size={15} /> {t('btn_add_friend')}
                    </button>
                  )}
                  {friendStatus === 'pending_sent' && (
                    <button onClick={cancelFriendRequest} disabled={friendLoading}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, border: 'none', background: '#e4e6eb', color: '#050505', fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' as const }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#d8dadf' }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#e4e6eb' }}>
                      <Clock size={15} /> {t('btn_pending_cancel')}
                    </button>
                  )}
                  {friendStatus === 'pending_received' && (
                    <>
                      <button onClick={acceptFriendRequest} disabled={friendLoading}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' as const }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#2563eb' }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#3b82f6' }}>
                        <UserCheck size={15} /> {t('btn_accept')}
                      </button>
                      <button onClick={cancelFriendRequest} disabled={friendLoading}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, border: 'none', background: '#e4e6eb', color: '#050505', fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' as const }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#d8dadf' }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#e4e6eb' }}>
                        <X size={15} /> {t('btn_decline')}
                      </button>
                    </>
                  )}
                  {friendStatus === 'friends' && (
                    <button onClick={unfriend} disabled={friendLoading}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, border: 'none', background: '#e4e6eb', color: '#050505', fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' as const }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#d8dadf' }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#e4e6eb' }}>
                      <UserX size={15} /> {t('btn_unfriend')}
                    </button>
                  )}
                  <button onClick={toggleFollow} disabled={followLoading}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, border: `1.5px solid ${isFollowing ? '#e4e6eb' : '#3b82f6'}`, background: isFollowing ? '#fff' : '#eff6ff', color: isFollowing ? '#65676b' : '#3b82f6', fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' as const }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}>
                    {isFollowing ? <><UserMinus size={15} /> {t('btn_unfollow')}</> : <><UserPlus size={15} /> {t('btn_follow')}</>}
                  </button>
                </>
              ) : (
                <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, background: '#3b82f6', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' as const }}>
                  <UserPlus size={15} /> {t('btn_sign_in_follow')}
                </a>
              )}
            </div>
          </div>
          </div>

          {/* Tab bar */}
          <div style={{ display: 'flex', gap: 2, borderTop: '1px solid #e4e6eb', margin: '12px 24px 0' }}>
            {(['posts', 'about'] as Tab[]).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ padding: '14px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700, color: activeTab === tab ? '#3b82f6' : '#65676b', position: 'relative', borderRadius: '8px 8px 0 0' }}
                onMouseEnter={e => { if (activeTab !== tab) e.currentTarget.style.background = '#f0f2f5' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                {tab === 'posts' ? t('tab_posts') : t('tab_about')}
                {activeTab === tab && (
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: '#3b82f6', borderRadius: '3px 3px 0 0' }} />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ CONTENT ═══ */}
      <div style={{ maxWidth: 1050, margin: '0 auto', padding: '16px 24px', display: 'grid', gridTemplateColumns: '380px 1fr', gap: 16, alignItems: 'start' }}>

        {/* ── LEFT: Intro (sticky) ── */}
        <ProfileIntroCard
          profile={profile}
          joined={joined}
          isOwnProfile={isOwnProfile}
          onEditOpen={() => setShowEditModal(true)}
        />

        {/* ── RIGHT: Posts or About ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {activeTab === 'posts' ? (
            <>
              {isOwnProfile && currentUser && (
                reshareTarget ? (
                  <CreatePost user={currentUser} avatarColor={currentProfile?.avatar_color ?? 0}
                    displayName={cpDisplayName} onPostCreated={p => { setPosts(prev => [p, ...prev]); setReshareTarget(null) }}
                    resharePost={reshareTarget} onCancelReshare={() => setReshareTarget(null)} />
                ) : (
                  <CreatePost user={currentUser} avatarColor={currentProfile?.avatar_color ?? 0}
                    displayName={cpDisplayName} onPostCreated={p => setPosts(prev => [p, ...prev])} />
                )
              )}

              {(() => {
                // Filter posts by visibility
                const visiblePosts = posts.filter(post => {
                  const v = (post as any).visibility ?? 'public'
                  if (v === 'public') return true
                  if (isOwnProfile || currentUser?.id === post.user_id) return true
                  if (v === 'friends') return friendStatus === 'friends'
                  return false // private
                })
                return (
                  <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e4e6eb', overflow: 'hidden' }}>
                    {/* Header inside the card */}
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#050505' }}>{t('section_posts')}</div>
                      <div style={{ fontSize: 14, color: '#65676b' }}>{visiblePosts.length} {visiblePosts.length === 1 ? t('posts_count_singular') : t('posts_count_plural')}</div>
                    </div>

                    {visiblePosts.length === 0 ? (
                      <div style={{ textAlign: 'center' as const, padding: '48px 20px' }}>
                        <div style={{ fontSize: 36, marginBottom: 10 }}>📋</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#050505', marginBottom: 4 }}>{t('posts_empty_title')}</div>
                        <div style={{ fontSize: 14, color: '#65676b' }}>
                          {isOwnProfile ? t('posts_empty_own') : `${displayName} ${t('posts_empty_other')}`}
                        </div>
                        {isOwnProfile && (
                          <a href="/feed" style={{ display: 'inline-block', marginTop: 14, padding: '9px 20px', borderRadius: 8, background: '#3b82f6', color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
                            {t('posts_go_feed')}
                          </a>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {visiblePosts.map((post, i) => (
                          <div key={post.id} style={{ borderTop: i > 0 ? '1px solid #f0f2f5' : 'none' }}>
                            <PostCard post={post} currentUserId={currentUser?.id ?? null}
                              currentUserIsVerified={currentProfile?.is_verified ?? false}
                              currentUser={currentUser}
                              currentProfile={currentProfile}
                              onLikeToggle={handleLikeToggle}
                              onRecommendToggle={handleRecommendToggle}
                              onReshare={p => { setReshareTarget(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                              onDeleted={id => setPosts(prev => prev.filter(p => p.id !== id))}
                              onEdited={(id, body, visibility) => setPosts(prev => prev.map(p => p.id !== id ? p : { ...p, body, visibility }))} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })()}
            </>
          ) : (
            <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e4e6eb', padding: '20px 24px' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#050505', marginBottom: 20 }}>{t('section_about')}</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {[
                  { label: t('about_display_name'), value: profile.display_name },
                  { label: t('about_given_name'), value: profile.given_name },
                  { label: t('about_family_name'), value: profile.family_name },
                  { label: t('about_username'), value: `@${profile.username}` },
                  { label: t('about_profession'), value: profile.profession ? tp(profile.profession) : undefined },
                  { label: t('about_organization'), value: profile.organization },
                  { label: t('about_location'), value: profile.location },
                  { label: t('about_experience'), value: profile.experience ? tp(profile.experience) : undefined },
                  { label: t('about_bio'), value: profile.description },
                  { label: t('about_member_since'), value: joined },
                ].filter(r => r.value).map((row, i, arr) => (
                  <div key={row.label} style={{ display: 'flex', gap: 16, padding: '14px 0', borderBottom: i < arr.length - 1 ? '1px solid #f0f2f5' : 'none' }}>
                    <div style={{ width: 160, fontSize: 15, fontWeight: 700, color: '#65676b', flexShrink: 0 }}>{row.label}</div>
                    <div style={{ flex: 1, fontSize: 15, color: '#050505' }}>{row.value}</div>
                  </div>
                ))}
                {profile.website && (
                  <div style={{ display: 'flex', gap: 16, padding: '14px 0', borderBottom: '1px solid #f0f2f5' }}>
                    <div style={{ width: 160, fontSize: 15, fontWeight: 700, color: '#65676b', flexShrink: 0 }}>{t('about_website')}</div>
                    <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 15, color: '#3b82f6', textDecoration: 'none' }}>{profile.website}</a>
                  </div>
                )}
                {profile.linkedin && (
                  <div style={{ display: 'flex', gap: 16, padding: '14px 0', borderBottom: '1px solid #f0f2f5' }}>
                    <div style={{ width: 160, fontSize: 15, fontWeight: 700, color: '#65676b', flexShrink: 0 }}>{t('about_linkedin')}</div>
                    <a href={profile.linkedin.startsWith('http') ? profile.linkedin : `https://${profile.linkedin}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 15, color: '#0a66c2', textDecoration: 'none' }}>{t('about_view_linkedin')}</a>
                  </div>
                )}
                {profile.specializations && profile.specializations.length > 0 && (
                  <div style={{ display: 'flex', gap: 16, padding: '14px 0' }}>
                    <div style={{ width: 160, fontSize: 15, fontWeight: 700, color: '#65676b', flexShrink: 0, paddingTop: 4 }}>{t('about_specializations')}</div>
                    <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
                      {profile.specializations.map(s => (
                        <span key={s} style={{ fontSize: 13, fontWeight: 600, color: '#3b82f6', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 20, padding: '4px 12px' }}>{tp(s)}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {isOwnProfile && (
                <button onClick={() => setShowEditModal(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 20, padding: '9px 20px', borderRadius: 8, background: '#e4e6eb', color: '#050505', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#d8dadf' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#e4e6eb' }}>
                  <Pencil size={15} /> {t('about_edit_profile')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
