'use client'
import { useEffect, useRef, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Send, Search, X, ArrowLeft, Check, CheckCheck,
  MessageCircle, UserPlus, Plus,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Message, Profile } from '../../_types'

interface ConvRow {
  id: string
  created_at: string
  last_message_at: string
  conversation_participants: {
    conversation_id: string
    user_id: string
    last_read_at: string | null
    profiles: { id: string; username: string; display_name: string | null; full_name: string | null; avatar_color: number; avatar_url: string | null }
  }[]
  last_message?: { id: string; body: string; created_at: string; sender_id: string } | null
  unread_count?: number
}
import AccountMenu from '../../_components/social/user/AccountMenu'

const AVATAR_COLORS = [
  'linear-gradient(135deg, #3b82f6, #8b5cf6)',
  'linear-gradient(135deg, #10b981, #3b82f6)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #ec4899, #8b5cf6)',
  'linear-gradient(135deg, #06b6d4, #10b981)',
  'linear-gradient(135deg, #f97316, #f59e0b)',
]

function Avatar({ name, colorIndex, photoUrl, size = 40 }: { name: string | null; colorIndex: number; photoUrl?: string | null; size?: number }) {
  const initial = (name || '?')[0].toUpperCase()
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: AVATAR_COLORS[colorIndex ?? 0], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 800, color: '#fff', flexShrink: 0, overflow: 'hidden' }}>
      {photoUrl ? <img src={photoUrl} alt={initial} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initial}
    </div>
  )
}

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (m < 1) return 'now'
  if (m < 60) return `${m}m`
  if (m < 1440) return `${Math.floor(m / 60)}h`
  if (m < 10080) return `${Math.floor(m / 1440)}d`
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

function MessagesPage() {
  useEffect(() => { document.title = 'Messages — CivilAxis' }, [])
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [conversations, setConversations] = useState<ConvRow[]>([])
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [newMsgSearch, setNewMsgSearch] = useState('')
  const [newMsgResults, setNewMsgResults] = useState<Profile[]>([])
  const [showNewMsg, setShowNewMsg] = useState(false)
  const [convSearch, setConvSearch] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auth
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
      if (!u) { router.replace('/'); return }
      setUser(u)
      const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle()
      if (p) {
        setProfile(p as Profile)
        try { localStorage.setItem(`civilbase_profile_${u.id}`, JSON.stringify(p)) } catch {}
      }
    })
  }, [router])

  // Load conversations
  useEffect(() => {
    if (!user) return
    loadConversations()

    // Open conversation from URL param
    const convId = searchParams.get('conv')
    if (convId) setActiveConvId(convId)
  }, [user])

  async function loadConversations() {
    if (!user) return
    const { data } = await supabase
      .from('conversations')
      .select(`
        id, created_at, last_message_at,
        conversation_participants(
          conversation_id, user_id, last_read_at, deleted_at,
          profiles(id, username, display_name, full_name, avatar_color, avatar_url)
        )
      `)
      .order('last_message_at', { ascending: false })

    if (!data) return setLoading(false)

    // Filter to only convs where current user is an active (non-deleted) participant
    const mine = (data as any[]).filter(c =>
      c.conversation_participants?.some((p: any) => p.user_id === user.id && !p.deleted_at)
    )

    const enriched = await Promise.all(mine.map(async c => {
      const myPart = c.conversation_participants?.find((p: any) => p.user_id === user!.id)
      const [{ data: lastMsg }, { count: unread }] = await Promise.all([
        supabase.from('messages').select('id,body,created_at,sender_id').eq('conversation_id', c.id).order('created_at', { ascending: false }).limit(1),
        supabase.from('messages').select('*', { count: 'exact', head: true }).eq('conversation_id', c.id)
          .gt('created_at', myPart?.last_read_at ?? '1970-01-01'),
      ])
      return { ...c, last_message: lastMsg?.[0] ?? null, unread_count: unread ?? 0 } as ConvRow
    }))

    setConversations(enriched)
    setLoading(false)
  }

  const lastMsgTimeRef = useRef<string>('1970-01-01')

  // Load messages for active conversation
  useEffect(() => {
    if (!activeConvId || !user) return
    const myPart = conversations.find(c => c.id === activeConvId)?.conversation_participants?.find((p: any) => p.user_id === user.id)
    loadMessages(activeConvId, (myPart as any)?.deleted_at)
    markRead(activeConvId)

    // Realtime fast path
    const sub = supabase.channel(`conv-${activeConvId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeConvId}` }, payload => {
        const msg = payload.new as Message
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev
          const optimisticIdx = prev.findIndex((m: any) =>
            m.id?.startsWith('optimistic-') && m.sender_id === (msg as any).sender_id && (m as any).body === (msg as any).body
          )
          if (optimisticIdx !== -1) {
            const next = [...prev]; next[optimisticIdx] = msg; return next
          }
          return [...prev, msg]
        })
        lastMsgTimeRef.current = (msg as any).created_at
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      })
      .subscribe()

    // Polling fallback — 2s interval, only fetches rows newer than last seen
    const pollInterval = setInterval(async () => {
      const { data } = await supabase
        .from('messages')
        .select('id, conversation_id, sender_id, body, created_at')
        .eq('conversation_id', activeConvId)
        .gt('created_at', lastMsgTimeRef.current)
        .order('created_at', { ascending: true })
      if (!data || data.length === 0) return
      setMessages(prev => {
        let next = [...prev]
        for (const m of data) {
          if (next.some((x: any) => x.id === m.id)) continue
          const optimisticIdx = next.findIndex((x: any) =>
            x.id?.startsWith('optimistic-') && x.sender_id === m.sender_id && x.body === m.body
          )
          if (optimisticIdx !== -1) { next[optimisticIdx] = m as any }
          else { next = [...next, m as any] }
        }
        return next
      })
      lastMsgTimeRef.current = data[data.length - 1].created_at
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }, 2000)

    return () => { sub.unsubscribe(); clearInterval(pollInterval) }
  }, [activeConvId, user])

  async function loadMessages(convId: string, deletedAt?: string | null) {
    let q = supabase.from('messages').select('id, conversation_id, sender_id, body, created_at')
      .eq('conversation_id', convId).order('created_at', { ascending: true }).limit(100)
    if (deletedAt) q = q.gt('created_at', deletedAt)
    const { data } = await q
    setMessages((data as unknown as Message[]) ?? [])
    if (data && data.length > 0) {
      lastMsgTimeRef.current = (data[data.length - 1] as any).created_at
    }
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  async function markRead(convId: string) {
    if (!user) return
    await supabase.rpc('mark_conversation_read', {
      p_conversation_id: convId,
      p_user_id: user.id,
    })
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, unread_count: 0 } : c))
  }

  async function sendMessage() {
    if (!draft.trim() || !activeConvId || !user || sending) return
    setSending(true)
    const body = draft.trim()
    setDraft('')

    const optimisticId = `optimistic-${Date.now()}`
    const optimistic = { id: optimisticId, conversation_id: activeConvId, sender_id: user.id, body, created_at: new Date().toISOString() } as any
    setMessages(prev => [...prev, optimistic])
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: activeConvId, sender_id: user.id, body })
      .select('id, conversation_id, sender_id, body, created_at')
      .single()

    if (error) {
      setMessages(prev => prev.filter((m: any) => m.id !== optimisticId))
    } else if (data) {
      setMessages(prev => prev.map((m: any) => m.id === optimisticId ? data : m))
      lastMsgTimeRef.current = (data as any).created_at
    }

    // conversations.last_message_at is bumped server-side by the messages-insert trigger
    setSending(false)
    inputRef.current?.focus()
  }

  // New message: search users
  useEffect(() => {
    if (!newMsgSearch.trim()) { setNewMsgResults([]); return }
    const t = setTimeout(async () => {
      const { data } = await supabase.from('profiles')
        .select('id, username, display_name, full_name, avatar_color, avatar_url, profession, is_verified')
        .ilike('username', `%${newMsgSearch}%`)
        .neq('id', user?.id ?? '')
        .limit(8)
      setNewMsgResults((data as Profile[]) ?? [])
    }, 300)
    return () => clearTimeout(t)
  }, [newMsgSearch, user])

  async function startConversation(otherUser: Profile) {
    if (!user) return
    // Check if conversation already exists
    const existing = conversations.find(c =>
      c.conversation_participants?.length === 2 &&
      c.conversation_participants.some(p => p.user_id === otherUser.id)
    )
    if (existing) { setActiveConvId(existing.id); setShowNewMsg(false); return }

    // Create new conversation
    const { data: conv } = await supabase.from('conversations').insert({}).select().single()
    if (!conv) return
    await supabase.from('conversation_participants').insert([
      { conversation_id: conv.id, user_id: user.id },
      { conversation_id: conv.id, user_id: otherUser.id },
    ])
    await loadConversations()
    setActiveConvId(conv.id)
    setShowNewMsg(false)
    setNewMsgSearch('')
  }

  // Active conversation peer
  const activeConv = conversations.find(c => c.id === activeConvId)
  const peer = activeConv?.conversation_participants?.find(p => p.user_id !== user?.id)
  const peerProfile = (Array.isArray(peer?.profiles) ? (peer?.profiles as any[])[0] : peer?.profiles) as any

  const filteredConvs = convSearch
    ? conversations.filter(c => {
        const raw = c.conversation_participants?.find(pt => pt.user_id !== user?.id)?.profiles
        const p = (Array.isArray(raw) ? (raw as any[])[0] : raw) as any
        return (p?.display_name ?? p?.username ?? '').toLowerCase().includes(convSearch.toLowerCase())
      })
    : conversations

  const displayName = profile?.display_name || profile?.full_name || user?.email?.split('@')[0] || ''

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', display: 'flex', flexDirection: 'column' }}>

      {/* Nav */}
      <div style={{ position: 'sticky', top: 0, zIndex: 200, background: '#fff', borderBottom: '1px solid #e4e6eb', height: 56, display: 'flex', alignItems: 'center', padding: '0 16px', justifyContent: 'space-between', boxShadow: '0 2px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/feed" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <img src="/logo.png" alt="CivilAxis" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }} />
            <span style={{ fontSize: 18, fontWeight: 800, color: '#1e3a5f' }}>CivilAxis</span>
          </a>
          <span style={{ color: '#d1d5db', fontSize: 18 }}>·</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#050505' }}>Messages</span>
        </div>
        {user && profile && (
          <AccountMenu user={user} avatarColor={profile.avatar_color ?? 0} avatarUrl={profile.avatar_url ?? null} displayName={displayName} profileUsername={profile.username ?? null} size={28} />
        )}
      </div>

      {/* Body */}
      <div className="messages-grid" style={{ flex: 1, maxWidth: 1060, width: '100%', margin: '16px auto', display: 'grid', gridTemplateColumns: '360px 1fr', gap: 0, background: '#fff', borderRadius: 12, border: '1px solid #e4e6eb', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden', height: 'calc(100vh - 88px)' }}>

        {/* ── INBOX LIST ── */}
        <div className={`messages-inbox${!activeConvId ? ' active' : ''}`} style={{ borderRight: '1px solid #e4e6eb', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Inbox header */}
          <div style={{ padding: '16px 16px 10px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#050505' }}>Chats</span>
              <button onClick={() => setShowNewMsg(true)}
                style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#e7f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#dbeafe' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#e7f3ff' }}>
                <Plus size={18} color="#3b82f6" />
              </button>
            </div>
            {/* Search conversations */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f0f2f5', borderRadius: 20, padding: '7px 12px' }}>
              <Search size={14} color="#65676b" />
              <input value={convSearch} onChange={e => setConvSearch(e.target.value)}
                placeholder="Search messages"
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14, color: '#050505' }} />
            </div>
          </div>

          {/* New message search panel */}
          {showNewMsg && (
            <div style={{ padding: '0 16px 12px', flexShrink: 0, borderBottom: '1px solid #f0f2f5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f0f2f5', borderRadius: 20, padding: '7px 12px', marginBottom: 8 }}>
                <Search size={14} color="#65676b" />
                <input autoFocus value={newMsgSearch} onChange={e => setNewMsgSearch(e.target.value)}
                  placeholder="Search people…"
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14 }} />
                <button onClick={() => { setShowNewMsg(false); setNewMsgSearch(''); setNewMsgResults([]) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                  <X size={14} color="#65676b" />
                </button>
              </div>
              {newMsgResults.map(r => (
                <button key={r.id} onClick={() => startConversation(r)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '8px 4px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: 8 }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f0f2f5' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                  <Avatar name={r.display_name || r.full_name} colorIndex={r.avatar_color ?? 0} photoUrl={r.avatar_url} size={36} />
                  <div style={{ textAlign: 'left' as const }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#050505' }}>{r.display_name || r.full_name || r.username}</div>
                    <div style={{ fontSize: 12, color: '#65676b' }}>@{r.username}</div>
                  </div>
                </button>
              ))}
              {newMsgSearch && newMsgResults.length === 0 && (
                <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center' as const, padding: '8px 0' }}>No users found</div>
              )}
            </div>
          )}

          {/* Conversation list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading && <div style={{ padding: '20px', textAlign: 'center' as const, color: '#94a3b8', fontSize: 14 }}>Loading…</div>}
            {!loading && filteredConvs.length === 0 && (
              <div style={{ padding: '40px 20px', textAlign: 'center' as const }}>
                <MessageCircle size={36} color="#d1d5db" style={{ margin: '0 auto 12px' }} />
                <div style={{ fontSize: 15, fontWeight: 700, color: '#050505', marginBottom: 4 }}>No conversations yet</div>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>Click + to start a new chat</div>
              </div>
            )}
            {filteredConvs.map(conv => {
              const other = conv.conversation_participants?.find(p => p.user_id !== user?.id)
              const op = (Array.isArray(other?.profiles) ? (other?.profiles as any[])[0] : other?.profiles) as any
              const isActive = conv.id === activeConvId
              const hasUnread = (conv.unread_count ?? 0) > 0
              return (
                <button key={conv.id} onClick={() => setActiveConvId(conv.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 16px', border: 'none', background: isActive ? '#e7f3ff' : 'none', cursor: 'pointer', textAlign: 'left' as const, borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent' }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f8fafc' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'none' }}>
                  <Avatar name={op?.display_name || op?.full_name} colorIndex={op?.avatar_color ?? 0} photoUrl={op?.avatar_url} size={44} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 14, fontWeight: hasUnread ? 800 : 600, color: '#050505', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                        {op?.display_name || op?.full_name || op?.username || 'Unknown'}
                      </span>
                      <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0, marginLeft: 6 }}>
                        {conv.last_message ? timeAgo(conv.last_message.created_at as string) : ''}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                      <span style={{ fontSize: 13, color: hasUnread ? '#050505' : '#65676b', fontWeight: hasUnread ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, maxWidth: 200 }}>
                        {(conv.last_message as any)?.body ?? 'Start a conversation'}
                      </span>
                      {hasUnread && (
                        <span style={{ background: '#3b82f6', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── CONVERSATION PANEL ── */}
        {activeConvId && peerProfile ? (
          <div className={`messages-convo${activeConvId ? ' active' : ''}`} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e4e6eb', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: '#fff' }}>
              {/* Mobile back button */}
              <button onClick={() => setActiveConvId(null)} className="mobile-back-btn"
                style={{ display: 'none', width: 32, height: 32, borderRadius: '50%', border: 'none', background: '#f0f2f5', cursor: 'pointer', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                ←
              </button>
              <a href={`/u/${peerProfile.username}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar name={peerProfile.display_name || peerProfile.full_name} colorIndex={peerProfile.avatar_color ?? 0} photoUrl={peerProfile.avatar_url} size={40} />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#050505' }}>{peerProfile.display_name || peerProfile.full_name || peerProfile.username}</div>
                  <div style={{ fontSize: 12, color: '#65676b' }}>@{peerProfile.username}</div>
                </div>
              </a>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 6, background: '#f8fafc' }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center' as const, color: '#94a3b8', fontSize: 14, margin: 'auto' }}>
                  Say hello to {peerProfile.display_name || peerProfile.username}!
                </div>
              )}
              {messages.map((msg, i) => {
                const isMine = msg.sender_id === user?.id
                const prevMsg = messages[i - 1]
                const sameGroup = prevMsg && prevMsg.sender_id === msg.sender_id &&
                  (new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime()) < 120000
                return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginTop: sameGroup ? 2 : 10 }}>
                    {!isMine && !sameGroup && (
                      <div style={{ marginRight: 8, alignSelf: 'flex-end' }}>
                        <Avatar name={peerProfile.display_name} colorIndex={peerProfile.avatar_color ?? 0} photoUrl={peerProfile.avatar_url} size={28} />
                      </div>
                    )}
                    {!isMine && sameGroup && <div style={{ width: 36 }} />}
                    <div style={{ maxWidth: '70%' }}>
                      <div style={{
                        padding: '8px 12px', borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        background: isMine ? '#3b82f6' : '#fff',
                        color: isMine ? '#fff' : '#050505',
                        fontSize: 14, lineHeight: 1.5, boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                        border: isMine ? 'none' : '1px solid #e4e6eb',
                        whiteSpace: 'pre-wrap' as const, wordBreak: 'break-word' as const,
                      }}>
                        {msg.body}
                      </div>
                      {!sameGroup && (
                        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3, textAlign: isMine ? 'right' as const : 'left' as const, paddingLeft: isMine ? 0 : 4, paddingRight: isMine ? 4 : 0 }}>
                          {timeAgo(msg.created_at)}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid #e4e6eb', display: 'flex', gap: 10, alignItems: 'center', background: '#fff', flexShrink: 0 }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#f0f2f5', borderRadius: 22, padding: '0 6px 0 16px', border: '1.5px solid transparent', transition: 'border-color 0.15s' }}
                onFocus={() => {}} >
                <input
                  ref={inputRef}
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  placeholder="Write a message…"
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14, padding: '10px 0', color: '#050505' }}
                />
                <button onClick={sendMessage} disabled={!draft.trim() || sending}
                  style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: draft.trim() ? '#3b82f6' : 'none', cursor: draft.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' }}>
                  <Send size={16} color={draft.trim() ? '#fff' : '#94a3b8'} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#94a3b8', padding: 40 }}>
            <MessageCircle size={48} color="#d1d5db" />
            <div style={{ fontSize: 18, fontWeight: 700, color: '#050505' }}>Your messages</div>
            <div style={{ fontSize: 14, color: '#65676b', textAlign: 'center' as const, maxWidth: 260 }}>Send private messages to engineers in the CivilAxis community.</div>
            <button onClick={() => setShowNewMsg(true)}
              style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 7, padding: '10px 22px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              <Plus size={16} /> New message
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MessagesPageWrapper() {
  return <Suspense><MessagesPage /></Suspense>
}
