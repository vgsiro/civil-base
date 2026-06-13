'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '../../../../_types'
import TopNavBar from '../../../../_components/social/feed/TopNavBar'
import ChatBox from '../../../../_components/social/messaging/ChatBox'
import { useTranslation } from '../../../../i18n/LanguageContext'
import { useMessagingChat } from '../../../../_hooks/useMessagingChat'

const AVATAR_COLORS = [
  'linear-gradient(135deg, #3b82f6, #8b5cf6)',
  'linear-gradient(135deg, #10b981, #3b82f6)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #ec4899, #8b5cf6)',
  'linear-gradient(135deg, #06b6d4, #10b981)',
  'linear-gradient(135deg, #f97316, #f59e0b)',
]

const PAGE_SIZE = 18

interface FriendItem {
  id: string
  username: string
  display_name: string | null
  full_name: string | null
  avatar_color: number
  avatar_url: string | null
}

export default function FriendsPage() {
  const params = useParams()
  const username = params?.username as string
  const { t } = useTranslation()
  const chat = useMessagingChat()

  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null)
  const [targetProfile, setTargetProfile] = useState<Profile | null>(null)
  const [friends, setFriends] = useState<FriendItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const [unreadMsgs, setUnreadMsgs] = useState(0)
  const [pendingFriends, setPendingFriends] = useState(0)
  // Incremented by onAuthStateChange so the data effect re-runs on back-navigation
  const [tick, setTick] = useState(0)

  useEffect(() => { document.title = 'Friends — CivilAxis' }, [])

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
      setFriends([])

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

      const [{ count }, { data: fships }] = await Promise.all([
        supabase.from('friendships').select('id', { count: 'exact', head: true })
          .eq('status', 'accepted')
          .or(`requester_id.eq.${prof.id},receiver_id.eq.${prof.id}`),
        supabase.from('friendships').select('id, requester_id, receiver_id')
          .eq('status', 'accepted')
          .or(`requester_id.eq.${prof.id},receiver_id.eq.${prof.id}`)
          .order('created_at', { ascending: false })
          .limit(PAGE_SIZE + 1),
      ])
      setTotalCount(count ?? 0)

      if (fships?.length) {
        const more = fships.length > PAGE_SIZE
        const slice = fships.slice(0, PAGE_SIZE)
        const friendIds = slice.map((f: any) =>
          f.requester_id === prof.id ? f.receiver_id : f.requester_id
        )
        const { data: profiles } = await supabase
          .from('profiles').select('id, username, display_name, full_name, avatar_color, avatar_url')
          .in('id', friendIds)
        setFriends((profiles as FriendItem[]) ?? [])
        setHasMore(more)
      }

      setLoading(false)
    }
    load()
  }, [username, tick])

  async function loadMore() {
    if (loadingMore || !hasMore || !targetProfile) return
    setLoadingMore(true)
    const offset = friends.length
    const { data: fships } = await supabase
      .from('friendships').select('id, requester_id, receiver_id')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${targetProfile.id},receiver_id.eq.${targetProfile.id}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE)

    if (!fships?.length) { setHasMore(false); setLoadingMore(false); return }

    const friendIds = fships.map((f: any) =>
      f.requester_id === targetProfile.id ? f.receiver_id : f.requester_id
    )
    const { data: profiles } = await supabase
      .from('profiles').select('id, username, display_name, full_name, avatar_color, avatar_url')
      .in('id', friendIds)
    setHasMore(fships.length > PAGE_SIZE)
    setFriends(prev => [...prev, ...(profiles as FriendItem[]) ?? []])
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
              {t('friends_page_back')}
            </a>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Users size={22} color="#3b82f6" />
              <div>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#050505' }}>{t('friends_page_title')}</h1>
                <p style={{ margin: '2px 0 0', fontSize: 14, color: '#65676b' }}>
                  {displayName}{totalCount > 0 ? ` · ${totalCount} ${t('friends_count')}` : ''}
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 10, border: '1px solid #e4e6eb', padding: 16, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 72, height: 72, borderRadius: 8, background: '#e4e6eb' }} />
                  <div style={{ width: '60%', height: 12, borderRadius: 6, background: '#e4e6eb' }} />
                </div>
              ))}
            </div>
          ) : friends.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e4e6eb', padding: '60px 24px', textAlign: 'center' as const }}>
              <Users size={40} color="#d1d5db" style={{ marginBottom: 12 }} />
              <p style={{ margin: 0, fontSize: 16, color: '#65676b' }}>{t('friends_page_empty')}</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                {friends.map(f => (
                  <a key={f.id} href={`/u/${f.username}`}
                    style={{ background: '#fff', borderRadius: 10, border: '1px solid #e4e6eb', padding: '16px 12px', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 8, textDecoration: 'none', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = '#3b82f6' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = '#e4e6eb' }}>
                    {f.avatar_url
                      ? <img src={f.avatar_url} alt="" style={{ width: 72, height: 72, borderRadius: 8, objectFit: 'cover', display: 'block' }} />
                      : <div style={{ width: 72, height: 72, borderRadius: 8, background: AVATAR_COLORS[f.avatar_color ?? 0], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: '#fff' }}>
                          {(f.display_name || f.full_name || f.username || '?')[0].toUpperCase()}
                        </div>
                    }
                    <div style={{ textAlign: 'center' as const }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#050505', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, maxWidth: 160 }}>
                        {f.display_name || f.full_name || f.username}
                      </div>
                      <div style={{ fontSize: 12, color: '#65676b', marginTop: 2 }}>@{f.username}</div>
                    </div>
                  </a>
                ))}
              </div>
              {hasMore && (
                <div style={{ textAlign: 'center' as const }}>
                  <button onClick={loadMore} disabled={loadingMore}
                    style={{ padding: '10px 32px', borderRadius: 8, border: '1px solid #e4e6eb', background: '#fff', color: '#050505', fontSize: 15, fontWeight: 700, cursor: loadingMore ? 'default' : 'pointer', opacity: loadingMore ? 0.6 : 1 }}
                    onMouseEnter={e => { if (!loadingMore) e.currentTarget.style.background = '#f0f2f5' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}>
                    {loadingMore ? '…' : t('friends_page_load_more')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
