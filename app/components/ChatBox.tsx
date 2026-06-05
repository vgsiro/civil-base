'use client'
import { useEffect, useRef, useState } from 'react'
import { Send, X, Minus, Maximize2, Check, CheckCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const AVATAR_COLORS = [
  'linear-gradient(135deg, #3b82f6, #8b5cf6)',
  'linear-gradient(135deg, #10b981, #3b82f6)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #ec4899, #8b5cf6)',
  'linear-gradient(135deg, #06b6d4, #10b981)',
  'linear-gradient(135deg, #f97316, #f59e0b)',
]

interface Msg {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  created_at: string
  seen: boolean
}

interface Peer {
  id: string
  username: string
  display_name: string | null
  full_name: string | null
  avatar_color: number
  avatar_url: string | null
  is_verified?: boolean
}

interface Props {
  convId: string
  userId: string
  peer: Peer
  onClose: () => void
  onOpenFull: () => void
  onMarkRead?: () => void  // called after marking conversation read
  index?: number
}

export default function ChatBox({ convId, userId, peer: peerProp, onClose, onOpenFull, onMarkRead, index = 0 }: Props) {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [draft, setDraft] = useState('')
  const [minimized, setMinimized] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  // Peer is always resolved from DB — peerProp is only used for name/display while loading
  const [peer, setPeer] = useState<Peer | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fall back to peerProp for name display while the DB fetch is in flight
  const resolvedPeer = peer ?? peerProp
  const peerName = resolvedPeer.display_name || resolvedPeer.full_name || resolvedPeer.username || 'Unknown'
  const peerInitial = peerName[0].toUpperCase()

  // Track the latest message timestamp we've seen, to only fetch newer ones on poll
  const lastMsgTimeRef = useRef<string>('1970-01-01')
  const minimizedRef = useRef(minimized)
  useEffect(() => { minimizedRef.current = minimized }, [minimized])

  useEffect(() => {
    load()
    markRead()

    // Realtime — fast path when Supabase replication is configured
    const sub = supabase.channel(`chatbox-${convId}-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${convId}` }, payload => {
        const m = payload.new as Msg
        setMsgs(prev => {
          if (prev.some(x => x.id === m.id)) return prev
          // Replace matching optimistic message (same sender + body + close timestamp)
          const optimisticIdx = prev.findIndex(x =>
            x.id.startsWith('optimistic-') && x.sender_id === m.sender_id && x.body === m.body
          )
          if (optimisticIdx !== -1) {
            const next = [...prev]
            next[optimisticIdx] = { ...m, seen: false }
            return next
          }
          return [...prev, { ...m, seen: false }]
        })
        lastMsgTimeRef.current = m.created_at
        if (m.sender_id !== userId) markRead()
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversation_participants', filter: `conversation_id=eq.${convId}` }, () => {
        setMsgs(prev => prev.map(m => m.sender_id === userId ? { ...m, seen: true } : m))
      })
      .subscribe()

    // Polling fallback — guarantees delivery even if realtime is not configured on the DB
    const pollInterval = setInterval(async () => {
      if (minimizedRef.current) return
      const { data } = await supabase
        .from('messages')
        .select('id, conversation_id, sender_id, body, created_at')
        .eq('conversation_id', convId)
        .gt('created_at', lastMsgTimeRef.current)
        .order('created_at', { ascending: true })
      if (!data || data.length === 0) return
      setMsgs(prev => {
        let next = [...prev]
        for (const m of data) {
          if (next.some(x => x.id === m.id)) continue
          // Replace matching optimistic message
          const optimisticIdx = next.findIndex(x =>
            x.id.startsWith('optimistic-') && x.sender_id === m.sender_id && x.body === m.body
          )
          if (optimisticIdx !== -1) {
            next[optimisticIdx] = { ...m, seen: false }
          } else {
            next = [...next, { ...m, seen: false }]
          }
        }
        return next
      })
      lastMsgTimeRef.current = data[data.length - 1].created_at
      const hasNewFromPeer = data.some((m: any) => m.sender_id !== userId)
      if (hasNewFromPeer) markRead()
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }, 2000)

    return () => {
      sub.unsubscribe()
      clearInterval(pollInterval)
    }
  }, [convId])

  async function load() {
    const [{ data }, { data: parts }] = await Promise.all([
      supabase.from('messages').select('id, conversation_id, sender_id, body, created_at')
        .eq('conversation_id', convId).order('created_at', { ascending: true }).limit(60),
      supabase.from('conversation_participants')
        .select('user_id, last_read_at').eq('conversation_id', convId),
    ])

    const myPart = parts?.find((p: any) => p.user_id === userId)
    const peerPart = parts?.find((p: any) => p.user_id !== userId)

    // Resolve peer user ID — peerPart.user_id if RLS returns both rows,
    // otherwise fall back to peerProp.id which was passed from the parent
    const peerUserId = peerPart?.user_id ?? (peerProp as any)?.id
    if (peerUserId && peerUserId !== userId) {
      const { data: peerData } = await supabase
        .from('profiles')
        .select('id, username, display_name, full_name, avatar_color, avatar_url, is_verified')
        .eq('id', peerUserId)
        .single()
      if (peerData) setPeer(peerData as Peer)
    }

    const peerRead = peerPart?.last_read_at ?? null
    const enriched = (data ?? []).map((m: any) => ({
      ...m,
      seen: m.sender_id === userId && peerRead && new Date(peerRead) >= new Date(m.created_at),
    }))
    setMsgs(enriched)
    // Seed the poll cursor so it only fetches messages newer than what we just loaded
    if (enriched.length > 0) {
      lastMsgTimeRef.current = enriched[enriched.length - 1].created_at
    }
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  async function markRead() {
    // Use the server's clock via a DB function to avoid client/server clock skew
    // causing messages to still appear unread after F5
    const { error } = await supabase.rpc('mark_conversation_read', {
      p_conversation_id: convId,
      p_user_id: userId,
    })
    if (!error) onMarkRead?.()
  }

  async function send() {
    if (!draft.trim() || sending) return
    setSending(true)
    const body = draft.trim()
    setDraft('')

    // Optimistically add the message immediately — sender sees it right away
    const optimisticId = `optimistic-${Date.now()}`
    const optimistic: Msg = {
      id: optimisticId,
      conversation_id: convId,
      sender_id: userId,
      body,
      created_at: new Date().toISOString(),
      seen: false,
    }
    setMsgs(prev => [...prev, optimistic])
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: convId, sender_id: userId, body })
      .select('id, conversation_id, sender_id, body, created_at')
      .single()

    if (error) {
      setSendError(error.message)
      // Keep the optimistic message visible with error styling rather than silently removing it
      setMsgs(prev => prev.map(m => m.id === optimisticId ? { ...m, failed: true } as any : m))
    } else if (data) {
      setMsgs(prev => prev.map(m => m.id === optimisticId ? { ...data, seen: false } : m))
      lastMsgTimeRef.current = data.created_at
    }

    await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', convId)
    setSending(false)
    inputRef.current?.focus()
  }

  const right = 80 + index * 328  // stack multiple boxes

  return (
    <div style={{
      position: 'fixed', bottom: 0, right: right,
      width: 320, zIndex: 600,
      boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
      borderRadius: '10px 10px 0 0', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      border: '1px solid rgba(0,0,0,0.12)',
    }}>
      {/* Header */}
      <div style={{ background: '#fff', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', borderBottom: minimized ? 'none' : '1px solid #e4e6eb' }}
        onClick={() => setMinimized(v => !v)}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: AVATAR_COLORS[resolvedPeer.avatar_color ?? 0], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', overflow: 'hidden', flexShrink: 0 }}>
          {resolvedPeer.avatar_url ? <img src={resolvedPeer.avatar_url} alt={peerInitial} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : peerInitial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <a
            href={`/u/${resolvedPeer.username}`}
            onClick={e => e.stopPropagation()}
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3, overflow: 'hidden' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#050505', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
              {peerName}
            </span>
            {resolvedPeer.is_verified && (
              <svg width="14" height="14" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                <circle cx="17" cy="17" r="17" fill="#1877F2"/>
                <path d="M10 17.5L14.5 22L24 12" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </a>
        </div>
        <button onClick={e => { e.stopPropagation(); setMinimized(v => !v) }}
          style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f0f2f5' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
          <Minus size={15} color="#65676b" />
        </button>
        <button onClick={e => { e.stopPropagation(); onOpenFull() }}
          style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f0f2f5' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
          <Maximize2 size={14} color="#65676b" />
        </button>
        <button onClick={e => { e.stopPropagation(); onClose() }}
          style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
          <X size={15} color="#65676b" />
        </button>
      </div>

      {/* Messages */}
      {!minimized && (
        <>
          <div style={{ height: 340, overflowY: 'auto', background: '#fff', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {msgs.length === 0 && (
              <div style={{ margin: 'auto', textAlign: 'center' as const, color: '#94a3b8', fontSize: 13 }}>Say hi to {peerName}!</div>
            )}
            {msgs.map((msg, i) => {
              const isMine = msg.sender_id === userId
              const prev = msgs[i - 1]
              const sameGroup = prev && prev.sender_id === msg.sender_id &&
                new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() < 120000
              const isLast = i === msgs.length - 1

              return (
                <div key={msg.id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginTop: sameGroup ? 1 : 8 }}>
                  {!isMine && !sameGroup && (
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: AVATAR_COLORS[resolvedPeer.avatar_color ?? 0], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', overflow: 'hidden', flexShrink: 0, marginRight: 6, alignSelf: 'flex-end' }}>
                      {resolvedPeer.avatar_url ? <img src={resolvedPeer.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : peerInitial}
                    </div>
                  )}
                  {!isMine && sameGroup && <div style={{ width: 30 }} />}

                  <div style={{ maxWidth: '75%' }}>
                    <div style={{ padding: '7px 11px', borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px', background: (msg as any).failed ? '#fee2e2' : isMine ? '#0084ff' : '#f0f2f5', color: (msg as any).failed ? '#dc2626' : isMine ? '#fff' : '#050505', fontSize: 13, lineHeight: 1.4, wordBreak: 'break-word' as const, whiteSpace: 'pre-wrap' as const, opacity: msg.id.startsWith('optimistic-') ? 0.6 : 1 }}>
                      {msg.body}{(msg as any).failed ? ' ✕' : ''}
                    </div>
                    {/* Seen receipt — peer's avatar shown when peer has read the message */}
                    {isMine && isLast && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 2, paddingRight: 2 }}>
                        {msg.seen
                          ? <div style={{ width: 16, height: 16, borderRadius: '50%', overflow: 'hidden', border: '1.5px solid #e4e6eb', boxSizing: 'border-box', flexShrink: 0, background: AVATAR_COLORS[resolvedPeer.avatar_color ?? 0] }}>
                              {resolvedPeer.avatar_url
                                ? <img src={resolvedPeer.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 7, fontWeight: 800, color: '#fff' }}>{peerInitial}</div>
                              }
                            </div>
                          : <CheckCheck size={12} color="#94a3b8" />
                        }
                      </div>
                    )}
                    {isMine && !isLast && msgs[i + 1]?.sender_id !== userId && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 2, paddingRight: 2 }}>
                        <Check size={12} color="#94a3b8" />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            <div ref={endRef} />
          </div>

          {/* Send error */}
          {sendError && (
            <div style={{ background: '#fef2f2', padding: '4px 12px', fontSize: 11, color: '#dc2626', borderTop: '1px solid #fecaca' }}>
              Failed: {sendError} — check browser console
            </div>
          )}

          {/* Input */}
          <div style={{ background: '#fff', padding: '8px 10px', display: 'flex', gap: 6, alignItems: 'center', borderTop: '1px solid #f0f2f5' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#f0f2f5', borderRadius: 20, padding: '0 6px 0 12px' }}>
              <input
                ref={inputRef}
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                onFocus={() => markRead()}
                placeholder="Aa"
                autoFocus
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 13, padding: '8px 0', color: '#050505' }}
              />
              <button onClick={send} disabled={!draft.trim() || sending}
                style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: draft.trim() ? '#0084ff' : 'none', cursor: draft.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.15s' }}>
                <Send size={14} color={draft.trim() ? '#fff' : '#94a3b8'} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
