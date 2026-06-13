'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Image as ImageIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '../../../../_types'
import TopNavBar from '../../../../_components/social/feed/TopNavBar'
import ChatBox from '../../../../_components/social/messaging/ChatBox'
import PostModalFromFeed from '../../../../_components/social/post/PostModalFromFeed'
import { useTranslation } from '../../../../i18n/LanguageContext'
import { useMessagingChat } from '../../../../_hooks/useMessagingChat'

const PAGE_SIZE = 18

interface PhotoItem {
  id: string
  media_url: string
  created_at: string
}

export default function PhotosPage() {
  const params = useParams()
  const username = params?.username as string
  const { t } = useTranslation()
  const chat = useMessagingChat()

  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null)
  const [targetProfile, setTargetProfile] = useState<Profile | null>(null)
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const [unreadMsgs, setUnreadMsgs] = useState(0)
  const [pendingFriends, setPendingFriends] = useState(0)
  const [openPostId, setOpenPostId] = useState<string | null>(null)
  const [visCache, setVisCache] = useState<string[]>(['public'])
  // Incremented by onAuthStateChange so the data effect re-runs on back-navigation
  const [tick, setTick] = useState(0)

  useEffect(() => { document.title = 'Photos — CivilAxis' }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      setCurrentUser(u)
      if (u) {
        try {
          const cached = localStorage.getItem(`civilbase_profile_${u.id}`)
          if (cached) setCurrentProfile(JSON.parse(cached) as Profile)
        } catch {}
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setCurrentUser(session?.user ?? null)
      setTick(t => t + 1)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!username) return
    async function load() {
      setLoading(true)
      setPhotos([])

      const [{ data: prof }, { data: { user: viewer } }] = await Promise.all([
        supabase.from('profiles').select('*').eq('username', username).maybeSingle(),
        supabase.auth.getUser(),
      ])
      if (!prof) { setLoading(false); return }
      setTargetProfile(prof as Profile)

      if (viewer) {
        setCurrentUser(viewer)
        const { data: cp } = await supabase.from('profiles').select('*').eq('id', viewer.id).maybeSingle()
        if (cp) {
          setCurrentProfile(cp as Profile)
          try { localStorage.setItem(`civilbase_profile_${viewer.id}`, JSON.stringify(cp)) } catch {}
        }
      }

      const isOwn = viewer?.id === prof.id
      let isFriend = false
      if (viewer && !isOwn) {
        const { data: fship } = await supabase
          .from('friendships').select('id').eq('status', 'accepted')
          .or(`and(requester_id.eq.${viewer.id},receiver_id.eq.${prof.id}),and(requester_id.eq.${prof.id},receiver_id.eq.${viewer.id})`)
          .maybeSingle()
        isFriend = !!fship
      }

      const vis = ['public', ...(isOwn ? ['friends', 'private'] : isFriend ? ['friends'] : [])]
      setVisCache(vis)

      const { data } = await supabase
        .from('posts').select('id, media_url, created_at')
        .eq('user_id', prof.id)
        .in('post_type', ['image', 'profile_photo', 'cover_photo'])
        .in('visibility', vis)
        .not('media_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE + 1)

      const rows = (data as PhotoItem[]) ?? []
      setHasMore(rows.length > PAGE_SIZE)
      setPhotos(rows.slice(0, PAGE_SIZE))
      setLoading(false)
    }
    load()
  }, [username, tick])

  async function loadMore() {
    if (loadingMore || !hasMore || !targetProfile) return
    setLoadingMore(true)
    const oldest = photos[photos.length - 1]?.created_at
    const { data } = await supabase
      .from('posts').select('id, media_url, created_at')
      .eq('user_id', targetProfile.id)
      .in('post_type', ['image', 'profile_photo', 'cover_photo'])
      .in('visibility', visCache)
      .not('media_url', 'is', null)
      .order('created_at', { ascending: false })
      .lt('created_at', oldest)
      .limit(PAGE_SIZE + 1)
    const rows = (data as PhotoItem[]) ?? []
    setHasMore(rows.length > PAGE_SIZE)
    setPhotos(prev => [...prev, ...rows.slice(0, PAGE_SIZE)])
    setLoadingMore(false)
  }

  const displayName = targetProfile?.display_name || targetProfile?.full_name || username

  return (
    <>
      {currentUser && chat.openChats.map((c, i) => (
        <ChatBox key={c.convId} userId={currentUser.id} {...chat.chatBoxProps(c, i)} />
      ))}
      <TopNavBar
        user={currentUser}
        profile={currentProfile}
        unreadNotifs={unreadNotifs}
        onUnreadNotifsChange={setUnreadNotifs}
        unreadMsgs={unreadMsgs}
        onUnreadMsgsChange={setUnreadMsgs}
        pendingFriends={pendingFriends}
        onPendingFriendsChange={setPendingFriends}
        {...chat.dropdownHandlers}
      />

      <div style={{ minHeight: '100vh', background: '#f0f2f5', paddingTop: 56 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>

          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e4e6eb', padding: '20px 24px', marginBottom: 16 }}>
            <a href={`/u/${username}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#65676b', textDecoration: 'none', marginBottom: 16 }}
              onMouseEnter={e => (e.currentTarget.style.color = '#3b82f6')}
              onMouseLeave={e => (e.currentTarget.style.color = '#65676b')}>
              <ArrowLeft size={16} />
              {t('photos_page_back')}
            </a>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ImageIcon size={22} color="#3b82f6" />
              <div>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#050505' }}>{t('photos_page_title')}</h1>
                <p style={{ margin: '2px 0 0', fontSize: 14, color: '#65676b' }}>{displayName}</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} style={{ aspectRatio: '1', background: '#e4e6eb', borderRadius: 8 }} />
              ))}
            </div>
          ) : photos.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e4e6eb', padding: '60px 24px', textAlign: 'center' as const }}>
              <ImageIcon size={40} color="#d1d5db" style={{ marginBottom: 12 }} />
              <p style={{ margin: 0, fontSize: 16, color: '#65676b' }}>{t('photos_page_empty')}</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, marginBottom: 16 }}>
                {photos.map(p => (
                  <button key={p.id} onClick={() => setOpenPostId(p.id)}
                    style={{ aspectRatio: '1', display: 'block', borderRadius: 8, overflow: 'hidden', background: '#f0f2f5', border: 'none', padding: 0, cursor: 'pointer' }}>
                    <img src={p.media_url} alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.2s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.05)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)' }} />
                  </button>
                ))}
              </div>
              {hasMore && (
                <div style={{ textAlign: 'center' as const }}>
                  <button onClick={loadMore} disabled={loadingMore}
                    style={{ padding: '10px 32px', borderRadius: 8, border: '1px solid #e4e6eb', background: '#fff', color: '#050505', fontSize: 15, fontWeight: 700, cursor: loadingMore ? 'default' : 'pointer', opacity: loadingMore ? 0.6 : 1 }}
                    onMouseEnter={e => { if (!loadingMore) e.currentTarget.style.background = '#f0f2f5' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}>
                    {loadingMore ? '…' : t('photos_page_load_more')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {openPostId && (
        <PostModalFromFeed
          postId={openPostId}
          currentUserId={currentUser?.id ?? null}
          onClose={() => setOpenPostId(null)}
        />
      )}
    </>
  )
}
