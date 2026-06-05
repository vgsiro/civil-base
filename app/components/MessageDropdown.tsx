'use client'
import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Search, X, Plus, ExternalLink, Edit2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '../types'

const AVATAR_COLORS = [
  'linear-gradient(135deg, #3b82f6, #8b5cf6)',
  'linear-gradient(135deg, #10b981, #3b82f6)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #ec4899, #8b5cf6)',
  'linear-gradient(135deg, #06b6d4, #10b981)',
  'linear-gradient(135deg, #f97316, #f59e0b)',
]

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (m < 1) return 'now'
  if (m < 60) return `${m}m`
  if (m < 1440) return `${Math.floor(m / 60)}h`
  if (m < 10080) return `${Math.floor(m / 1440)}d`
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

interface ConvRow {
  id: string
  last_message_at: string
  conversation_participants: {
    user_id: string
    last_read_at: string | null
    profiles: { id: string; username: string; display_name: string | null; full_name: string | null; avatar_color: number; avatar_url: string | null }
  }[]
  last_message?: { id: string; body: string; created_at: string; sender_id: string } | null
  unread_count?: number
}

interface Props {
  userId: string
  unreadCount: number
  onUnreadChange: (n: number | ((prev: number) => number)) => void
  onOpenChat: (conv: ConvRow, peer: any) => void
}

export default function MessageDropdown({ userId, unreadCount, onUnreadChange, onOpenChat }: Props) {
  const [open, setOpen] = useState(false)
  const [convs, setConvs] = useState<ConvRow[]>([])
  const [loaded, setLoaded] = useState(false)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (!open || loaded) return
    loadConvs()
  }, [open])

  // Keep refs so the realtime callback never captures stale values
  const onUnreadChangeRef = useRef(onUnreadChange)
  useEffect(() => { onUnreadChangeRef.current = onUnreadChange }, [onUnreadChange])

  // Ref to the current set of conversation IDs this user belongs to
  const myConvIdsRef = useRef<Set<string>>(new Set())

  // Real-time: new message → bump unread — stable channel, never torn down on count change
  useEffect(() => {
    const sub = supabase.channel(`msg-dropdown-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const msg = payload.new as any
        // Ignore messages not in this user's conversations or sent by this user
        if (msg.sender_id === userId) return
        if (!myConvIdsRef.current.has(msg.conversation_id)) return
        onUnreadChangeRef.current((n: number) => n + 1)
        setConvs(prev => prev.map(c => c.id === msg.conversation_id
          ? { ...c, last_message: msg, unread_count: (c.unread_count ?? 0) + 1 }
          : c
        ))
      })
      .subscribe()
    return () => { sub.unsubscribe() }
  }, [userId])

  async function loadConvs() {
    const { data } = await supabase
      .from('conversations')
      .select(`id, last_message_at, conversation_participants(user_id, last_read_at, profiles(id,username,display_name,full_name,avatar_color,avatar_url,is_verified))`)
      .order('last_message_at', { ascending: false })

    if (!data) return setLoaded(true)
    const mine = (data as any[]).filter(c => c.conversation_participants?.some((p: any) => p.user_id === userId))
    const enriched = await Promise.all(mine.map(async c => {
      const myPart = c.conversation_participants?.find((p: any) => p.user_id === userId)
      const [{ data: lastMsg }, { count: unread }] = await Promise.all([
        supabase.from('messages').select('id,body,created_at,sender_id').eq('conversation_id', c.id).order('created_at', { ascending: false }).limit(1),
        supabase.from('messages').select('*', { count: 'exact', head: true }).eq('conversation_id', c.id)
          .neq('sender_id', userId).gt('created_at', myPart?.last_read_at ?? '1970-01-01'),
      ])
      return { ...c, last_message: lastMsg?.[0] ?? null, unread_count: unread ?? 0 } as ConvRow
    }))
    setConvs(enriched)
    myConvIdsRef.current = new Set(enriched.map(c => c.id))
    setLoaded(true)
  }

  // Search people for new chat
  useEffect(() => {
    if (!search.trim()) { setSearchResults([]); return }
    const t = setTimeout(async () => {
      const { data } = await supabase.from('profiles').select('id,username,display_name,full_name,avatar_color,avatar_url,profession,is_verified')
        .ilike('username', `%${search}%`).neq('id', userId).limit(6)
      setSearchResults((data as Profile[]) ?? [])
    }, 300)
    return () => clearTimeout(t)
  }, [search, userId])

  async function startChat(other: Profile) {
    const existing = convs.find(c =>
      c.conversation_participants?.length === 2 &&
      c.conversation_participants.some(p => p.user_id === other.id)
    )
    if (existing) {
      const rawProfiles = existing.conversation_participants?.find(p => p.user_id !== userId)?.profiles
      const peer = (Array.isArray(rawProfiles) ? (rawProfiles as any[])[0] : rawProfiles) as any
      const unread = existing.unread_count ?? 0
      if (unread > 0) {
        setConvs(prev => prev.map(c => c.id === existing.id ? { ...c, unread_count: 0 } : c))
        onUnreadChangeRef.current((n: number) => Math.max(0, n - unread))
      }
      onOpenChat(existing, peer)
      setOpen(false)
      return
    }
    const { data: convId, error: convErr } = await supabase.rpc('find_or_create_conversation', {
      user_a: userId,
      user_b: other.id,
    })
    if (convErr || !convId) return
    myConvIdsRef.current.add(convId)
    const newConv: ConvRow = { id: convId, last_message_at: new Date().toISOString(), conversation_participants: [], last_message: null, unread_count: 0 }
    onOpenChat(newConv, other)
    setOpen(false)
    setShowSearch(false)
    setSearch('')
    await loadConvs()
  }

  const filtered = search && !showSearch
    ? convs.filter(c => {
        const p = c.conversation_participants?.find(pt => pt.user_id !== userId)?.profiles as any
        return (p?.display_name ?? p?.username ?? '').toLowerCase().includes(search.toLowerCase())
      })
    : convs

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ position: 'relative', width: 40, height: 40, borderRadius: '50%', border: 'none', background: open ? '#dbeafe' : '#e4e6eb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.background = '#dbeafe' }}
        onMouseLeave={e => { e.currentTarget.style.background = open ? '#dbeafe' : '#e4e6eb' }}>
        <MessageCircle size={20} color={open ? '#2563eb' : '#65676b'} />
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: 2, right: 2, background: '#ef4444', color: '#fff', borderRadius: '50%', minWidth: 17, height: 17, fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff', padding: '0 2px' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: 'fixed', top: 60, right: 52, width: 360, maxHeight: '82vh', background: '#fff', borderRadius: 12, boxShadow: '0 8px 40px rgba(0,0,0,0.22)', border: '1px solid #e4e6eb', zIndex: 500, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ padding: '14px 16px 10px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#050505' }}>Chats</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => setShowSearch(v => !v)}
                  style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: showSearch ? '#e7f3ff' : '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  title="New message">
                  <Edit2 size={15} color={showSearch ? '#3b82f6' : '#65676b'} />
                </button>
                <a href="/messages" onClick={() => setOpen(false)}
                  style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', textDecoration: 'none' }}
                  title="Open full messages">
                  <ExternalLink size={15} color="#65676b" />
                </a>
              </div>
            </div>
            {/* Search box */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f0f2f5', borderRadius: 20, padding: '7px 12px' }}>
              <Search size={13} color="#65676b" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder={showSearch ? 'Search people…' : 'Search Messenger'}
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14, color: '#050505' }} />
              {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}><X size={13} color="#65676b" /></button>}
            </div>
          </div>

          {/* People search results */}
          {showSearch && (
            <div style={{ flexShrink: 0, borderBottom: '1px solid #f0f2f5' }}>
              {searchResults.map(r => (
                <button key={r.id} onClick={() => startChat(r)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 14px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' as const }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: AVATAR_COLORS[r.avatar_color ?? 0], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', overflow: 'hidden', flexShrink: 0 }}>
                    {r.avatar_url ? <img src={r.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (r.display_name || r.username || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#050505' }}>{r.display_name || r.full_name || r.username}</div>
                    <div style={{ fontSize: 11, color: '#65676b' }}>@{r.username}</div>
                  </div>
                </button>
              ))}
              {search && searchResults.length === 0 && <div style={{ padding: '10px 16px', fontSize: 13, color: '#94a3b8' }}>No people found</div>}
            </div>
          )}

          {/* Conversation list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {!loaded && <div style={{ padding: '24px', textAlign: 'center' as const, color: '#94a3b8', fontSize: 13 }}>Loading…</div>}
            {loaded && filtered.length === 0 && !showSearch && (
              <div style={{ padding: '40px 20px', textAlign: 'center' as const }}>
                <MessageCircle size={32} color="#d1d5db" style={{ margin: '0 auto 10px', display: 'block' }} />
                <div style={{ fontSize: 14, color: '#65676b' }}>No conversations yet</div>
              </div>
            )}
            {filtered.map(conv => {
              const other = conv.conversation_participants?.find(p => p.user_id !== userId)
              // profiles is returned as an array by Supabase even for FK joins — unwrap it
              const op = (Array.isArray(other?.profiles) ? (other?.profiles as any[])[0] : other?.profiles) as any
              const hasUnread = (conv.unread_count ?? 0) > 0
              const lastMsg = conv.last_message as any
              const isMine = lastMsg?.sender_id === userId
              return (
                <button key={conv.id}
                  onClick={() => {
                    const unread = conv.unread_count ?? 0
                    if (unread > 0) {
                      setConvs(prev => prev.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c))
                      onUnreadChangeRef.current((n: number) => Math.max(0, n - unread))
                    }
                    onOpenChat(conv, op)
                    setOpen(false)
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 14px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' as const }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                  {/* Avatar */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: AVATAR_COLORS[op?.avatar_color ?? 0], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 800, color: '#fff', overflow: 'hidden' }}>
                      {op?.avatar_url ? <img src={op.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (op?.display_name || op?.username || '?')[0].toUpperCase()}
                    </div>
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: hasUnread ? 800 : 600, color: '#050505', display: 'flex', alignItems: 'center', gap: 3, overflow: 'hidden' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                        {op?.display_name || op?.full_name || op?.username || 'Unknown'}
                      </span>
                      {op?.is_verified && (
                        <svg width="13" height="13" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                          <circle cx="17" cy="17" r="17" fill="#1877F2"/>
                          <path d="M10 17.5L14.5 22L24 12" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: 12, color: hasUnread ? '#050505' : '#65676b', fontWeight: hasUnread ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, maxWidth: 180 }}>
                        {isMine ? 'You: ' : ''}{lastMsg?.body ?? 'Start a conversation'}
                      </span>
                      {lastMsg && <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>· {timeAgo(lastMsg.created_at)}</span>}
                    </div>
                  </div>
                  {hasUnread && (
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
