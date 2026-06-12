'use client'
import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Search, X, Plus, ExternalLink, Edit2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '../../../_types'

const AVATAR_COLORS = [
  'linear-gradient(135deg, #3b82f6, #8b5cf6)',
  'linear-gradient(135deg, #10b981, #3b82f6)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #ec4899, #8b5cf6)',
  'linear-gradient(135deg, #06b6d4, #10b981)',
  'linear-gradient(135deg, #f97316, #f59e0b)',
]

function previewBody(body: string) {
  if (/^\[like\]/.test(body)) return '👍'
  if (/^\[sticker\]/.test(body)) return '🎞️ GIF'
  if (/^\[img\]/.test(body)) return '🖼️ Image'
  if (/^\[file name="/.test(body)) return '📎 File'
  return body
}

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
    deleted_at?: string | null
    profiles: { id: string; username: string; display_name: string | null; full_name: string | null; avatar_color: number; avatar_url: string | null; is_verified?: boolean } | { id: string; username: string; display_name: string | null; full_name: string | null; avatar_color: number; avatar_url: string | null; is_verified?: boolean }[]
  }[]
  last_message?: { id: string; body: string; created_at: string; sender_id: string } | null
  unread_count?: number
}

interface Props {
  userId: string
  unreadCount: number
  onUnreadChange: (n: number | ((prev: number) => number)) => void
  onOpenChat: (conv: ConvRow, peer: any) => void
  onNewMessage?: (convId: string, peer: any, showAfter?: string) => void
  onRegisterMarkRead?: (fn: (convId: string) => void) => void
  onRegisterSent?: (fn: (convId: string, body: string) => void) => void
  onRegisterRemoveConv?: (fn: (convId: string, deletedAt?: string) => void) => void
  openConvIds?: string[]
}

export default function MessageDropdown({ userId, unreadCount, onUnreadChange, onOpenChat, onNewMessage, onRegisterMarkRead, onRegisterSent, onRegisterRemoveConv, openConvIds = [] }: Props) {
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

  // Eager load on mount — seeds refs for realtime handler AND unread counts for badge.
  // Unread counts come from the server-side get_unread_conversations RPC: a single source
  // of truth with no client timestamp comparison and no stale PostgREST join cache.
  useEffect(() => {
    eagerLoadDoneRef.current = false
    loadingRef.current = true
    setLoaded(false)
    setConvs([])
    ;(async () => {
      // Badge first: a lean EXISTS-based RPC returns only the IDs of conversations with unread
      // messages and pushes the count the instant it resolves — independent of the heavier
      // conversations+profiles join below. (get_unread_conversations' full per-conv count is
      // slow on cold load; the badge only needs how many convs are unread.)
      const leanUnreadPromise = supabase.rpc('unread_conversation_ids', { p_user_id: userId }).then(({ data }) => {
        const idList = (data ?? []).map((r: any) => (typeof r === 'string' ? r : r.unread_conversation_ids) as string)
        const ids = new Set<string>(idList.filter((id: string) => !sessionMarkedRef.current.has(id)))
        unreadConvIdsRef.current = ids
        onUnreadChangeRef.current(ids.size)
        return ids
      })

      // Per-conversation counts (for the dropdown list rows) + the conversation/profile join.
      const [{ data: convData }, { data: unreadData }, leanUnreadIds] = await Promise.all([
        supabase
          .from('conversations')
          .select(`id, last_message_at, conversation_participants(user_id, last_read_at, deleted_at, profiles(id,username,display_name,full_name,avatar_color,avatar_url,is_verified))`)
          .order('last_message_at', { ascending: false }),
        supabase.rpc('get_unread_conversations', { p_user_id: userId }),
        leanUnreadPromise,
      ])
      const unreadMap = new Map<string, number>((unreadData ?? []).map((r: any) => [r.conversation_id, Number(r.unread_count)]))
      if (!convData) return
      // Include a conversation if the user is an ACTIVE participant (no deleted_at), OR it was
      // deleted but has a new message after the delete boundary (it's in leanUnreadIds — a
      // "restored" conv). Otherwise a freshly-restored conv only appeared via the 4s polling
      // fallback, leaving the dropdown empty for several seconds.
      const mine = (convData as any[]).filter(c => {
        const p = c.conversation_participants?.find((pt: any) => pt.user_id === userId)
        if (!p) return false
        return !p.deleted_at || leanUnreadIds.has(c.id)
      })
      const convIds = mine.map((c: any) => c.id)
      // Show convs immediately (no last_message yet) so dropdown opens fast
      const withUnread = mine.map((c: any) => ({ ...c, last_message: null, unread_count: unreadMap.get(c.id) ?? 0 }) as ConvRow)
      loadingRef.current = false
      setConvs(withUnread)
      setLoaded(true)
      myConvIdsRef.current = new Set(withUnread.map(c => c.id))
      convsRef.current = withUnread
      // Badge source of truth is the lean EXISTS RPC (delete-aware, matches the early push).
      // The per-conv unreadMap is only for the dropdown list row counts and can disagree for
      // restored-after-delete convs, so it must NOT drive the badge.
      unreadConvIdsRef.current = leanUnreadIds
      eagerLoadDoneRef.current = true
      onUnreadChangeRef.current(leanUnreadIds.size)
      // Map each conv to this user's delete boundary so previews never show pre-deletion messages
      const deletedAtMap = new Map<string, string>()
      for (const c of mine) {
        const p = c.conversation_participants?.find((pt: any) => pt.user_id === userId)
        if (p?.deleted_at) deletedAtMap.set(c.id, p.deleted_at)
      }
      // Fetch last messages in background — updates previews without blocking the dropdown
      if (convIds.length > 0) {
        supabase.from('messages').select('id,body,created_at,sender_id,conversation_id')
          .in('conversation_id', convIds).order('created_at', { ascending: false }).limit(500)
          .then(({ data: lastMsgs }) => {
            if (!lastMsgs) return
            const lastMsgMap = new Map<string, any>()
            for (const m of lastMsgs) {
              // Skip messages before this user's delete boundary
              const boundary = deletedAtMap.get(m.conversation_id)
              if (boundary && m.created_at <= boundary) continue
              if (!lastMsgMap.has(m.conversation_id)) lastMsgMap.set(m.conversation_id, m)
            }
            setConvs(prev => prev.map(c => ({ ...c, last_message: lastMsgMap.get(c.id) ?? c.last_message })))
            convsRef.current = convsRef.current.map(c => ({ ...c, last_message: lastMsgMap.get(c.id) ?? c.last_message }))
          })
      }
    })()
  }, [userId])

  useEffect(() => {
    if (!open) return
    onUnreadChangeRef.current(0)
  }, [open])

  // Keep refs so the realtime callback never captures stale values
  const onUnreadChangeRef = useRef(onUnreadChange)
  useEffect(() => { onUnreadChangeRef.current = onUnreadChange }, [onUnreadChange])
  const onNewMessageRef = useRef(onNewMessage)
  useEffect(() => { onNewMessageRef.current = onNewMessage }, [onNewMessage])

  // Ref to the current set of conversation IDs this user belongs to
  const myConvIdsRef = useRef<Set<string>>(new Set())
  // Ref to latest convs list so realtime handler can look up peer profile
  const convsRef = useRef<ConvRow[]>([])
  useEffect(() => { convsRef.current = convs }, [convs])
  // Ref to currently open ChatBox conv IDs — no badge increment if already open
  const openConvIdsRef = useRef<string[]>([])
  useEffect(() => { openConvIdsRef.current = openConvIds }, [openConvIds])
  // Source-of-truth for unread: set of conv IDs with unread messages (seeded from DB)
  const unreadConvIdsRef = useRef<Set<string>>(new Set())
  // Convs the user marked read this session — async DB re-seeds must NOT re-add these
  // (guards against loadConvs/eagerLoad reading last_read_at before the RPC commits)
  const sessionMarkedRef = useRef<Set<string>>(new Set())
  // Gate: don't process realtime events until eagerLoad has seeded unreadConvIdsRef
  const eagerLoadDoneRef = useRef(false)
  // Prevents loadConvs() from firing while eagerLoad is already in-flight
  const loadingRef = useRef(false)

  // Single source of truth for marking a conversation read: clears the badge optimistically
  // AND persists to the DB. The Supabase query builder is LAZY — it only sends the request
  // when .then() is called on it, so we must chain .then() (a bare call or `void` never fires).
  function markConvRead(convId: string) {
    sessionMarkedRef.current.add(convId)
    unreadConvIdsRef.current.delete(convId)
    onUnreadChangeRef.current(unreadConvIdsRef.current.size)
    setConvs(prev => prev.map(c => c.id === convId ? { ...c, unread_count: 0 } : c))
    supabase.rpc('mark_conversation_read', { p_conversation_id: convId, p_user_id: userId }).then(() => {})
  }
  const markConvReadRef = useRef(markConvRead)
  markConvReadRef.current = markConvRead

  // Register markConvRead with parent — stable wrapper that always calls the latest impl
  useEffect(() => {
    onRegisterMarkRead?.((convId: string) => markConvReadRef.current(convId))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRegisterMarkRead])

  // Map of convId → ISO timestamp when A deleted it — polling fallback uses this to find new messages
  const deletedConvsRef = useRef<Map<string, string>>(new Map())

  // Register removeConv handler — removes conv from dropdown when user deletes it
  useEffect(() => {
    onRegisterRemoveConv?.((convId: string, deletedAt?: string) => {
      // Use the server timestamp from the delete RPC — a client clock can lag the server and
      // make the polling restore re-fetch pre-deletion messages, resurrecting the conversation.
      const ts = deletedAt ?? new Date().toISOString()
      setConvs(prev => prev.filter(c => c.id !== convId))
      unreadConvIdsRef.current.delete(convId)
      onUnreadChangeRef.current(unreadConvIdsRef.current.size)
      deletedConvsRef.current.set(convId, ts)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRegisterRemoveConv])

  // Seed deletedConvsRef from DB on mount — needed to survive page reload.
  // After seeding, removeConv handler keeps it up to date in-memory.
  // pageLoadedAtRef gates auto-open to messages newer than load; it is compared against
  // messages.created_at (server clock) so it must be seeded from the server clock too —
  // a client new Date() can lag the server and let pre-load messages auto-open.
  const pageLoadedAtRef = useRef(new Date().toISOString())
  useEffect(() => {
    supabase.rpc('server_now').then(({ data }) => {
      if (data) pageLoadedAtRef.current = data as string
    })
    supabase
      .from('conversation_participants')
      .select('conversation_id, deleted_at')
      .eq('user_id', userId)
      .not('deleted_at', 'is', null)
      .then(({ data }) => {
        if (!data) return
        for (const p of data) deletedConvsRef.current.set(p.conversation_id, p.deleted_at as string)
      })
  }, [userId])

  // Polling fallback — every 4s, only queries when deletedConvsRef is non-empty (zero-cost otherwise).
  // Uses in-memory ref so no DB roundtrip on every tick.
  useEffect(() => {
    const interval = setInterval(async () => {
      if (deletedConvsRef.current.size === 0) return
      for (const [convId, deletedAt] of deletedConvsRef.current) {
        const { data: newMsgs } = await supabase
          .from('messages')
          .select('id, body, created_at, sender_id, conversation_id')
          .eq('conversation_id', convId)
          .gt('created_at', deletedAt)
          .neq('sender_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
        if (!newMsgs || newMsgs.length === 0) continue
        const msg = newMsgs[0]
        deletedConvsRef.current.delete(convId)
        const { data: convData } = await supabase
          .from('conversations')
          .select(`id, last_message_at, conversation_participants(user_id, last_read_at, deleted_at, profiles(id,username,display_name,full_name,avatar_color,avatar_url,is_verified))`)
          .eq('id', convId)
          .single()
        if (!convData) continue
        const myPart = (convData as any).conversation_participants?.find((p: any) => p.user_id === userId)
        const alreadyRead = myPart?.last_read_at && new Date(myPart.last_read_at) >= new Date(msg.created_at)
        const restored = { ...convData, last_message: msg, unread_count: alreadyRead ? 0 : 1 } as ConvRow
        setConvs(prev => prev.some(c => c.id === restored.id) ? prev : [restored, ...prev])
        convsRef.current = [restored, ...convsRef.current.filter(c => c.id !== restored.id)]
        myConvIdsRef.current.add(restored.id)
        if (!alreadyRead && !unreadConvIdsRef.current.has(convId)) {
          unreadConvIdsRef.current.add(convId)
          onUnreadChangeRef.current(unreadConvIdsRef.current.size)
        }
        // Only auto-open ChatBox if the message is new this session, not pre-existing before page load
        if (msg.created_at <= pageLoadedAtRef.current) continue
        const other = (convData as any).conversation_participants?.find((p: any) => p.user_id !== userId)
        const peer = (Array.isArray(other?.profiles) ? (other?.profiles as any[])[0] : other?.profiles) ?? null
        if (peer && onNewMessageRef.current) onNewMessageRef.current(convId, peer, deletedAt)
      }
    }, 4000)
    return () => clearInterval(interval)
  }, [userId])

  // Register onSent handler — updates last_message preview when this user sends
  useEffect(() => {
    onRegisterSent?.((convId: string, body: string) => {
      const now = new Date().toISOString()
      setConvs(prev => prev.map(c => c.id === convId
        ? { ...c, last_message: { id: '', body, created_at: now, sender_id: userId }, last_message_at: now }
        : c
      ))
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRegisterSent])

  // Real-time: new message → bump unread — stable channel, never torn down on count change
  useEffect(() => {
    const channelName = `msg-dropdown-${userId}-${Math.random().toString(36).slice(2)}`
    const sub = supabase.channel(channelName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const msg = payload.new as any
        // Wait until eagerLoad has seeded unreadConvIdsRef — ignore buffered events replayed on subscribe
        if (!eagerLoadDoneRef.current) return
        // Ignore messages sent by this user or not in their conversations
        if (msg.sender_id === userId) return
        // Unknown conv OR conv removed from dropdown (deleted) — handle via DB fetch
        const existingConv = convsRef.current.find(c => c.id === msg.conversation_id)
        if (!myConvIdsRef.current.has(msg.conversation_id) || !existingConv) {
          void (async () => {
            const { data: convData } = await supabase
              .from('conversations')
              .select(`id, last_message_at, conversation_participants(user_id, last_read_at, deleted_at, profiles(id,username,display_name,full_name,avatar_color,avatar_url,is_verified))`)
              .eq('id', msg.conversation_id)
              .single()
            if (!convData) return
            const isParticipant = (convData as any).conversation_participants?.some((p: any) => p.user_id === userId)
            if (!isParticipant) return
            const restored = { ...convData, last_message: msg, unread_count: 1 } as ConvRow
            setConvs(prev => prev.some(c => c.id === restored.id) ? prev.map(c => c.id === restored.id ? { ...c, last_message: msg, unread_count: (c.unread_count ?? 0) + 1 } : c) : [restored, ...prev])
            convsRef.current = [restored, ...convsRef.current.filter(c => c.id !== restored.id)]
            myConvIdsRef.current.add(restored.id)
            // Badge
            if (!unreadConvIdsRef.current.has(msg.conversation_id)) {
              unreadConvIdsRef.current.add(msg.conversation_id)
              onUnreadChangeRef.current(unreadConvIdsRef.current.size)
            }
            const other = restored.conversation_participants?.find((p: any) => p.user_id !== userId)
            const peer = (Array.isArray(other?.profiles) ? (other?.profiles as any[])[0] : other?.profiles) ?? null
            // Read deleted_at from the fetched participant row — ChatBox will clear it after reading
            const myPartRow = (convData as any).conversation_participants?.find((p: any) => p.user_id === userId)
            const showAfter = myPartRow?.deleted_at ?? undefined
            deletedConvsRef.current.delete(msg.conversation_id)
            if (peer && onNewMessageRef.current) onNewMessageRef.current(msg.conversation_id, peer, showAfter)
          })()
          return
        }
        // Known conv — check DB for deleted_at (source of truth, survives HMR/remount)
        void (async () => {
          const { data: myPart } = await supabase
            .from('conversation_participants')
            .select('deleted_at')
            .eq('conversation_id', msg.conversation_id)
            .eq('user_id', userId)
            .maybeSingle()
          const deletedAt = myPart?.deleted_at ?? null
          if (deletedAt) deletedConvsRef.current.delete(msg.conversation_id)
          sessionMarkedRef.current.delete(msg.conversation_id)
          if (!unreadConvIdsRef.current.has(msg.conversation_id)) {
            unreadConvIdsRef.current.add(msg.conversation_id)
            onUnreadChangeRef.current(unreadConvIdsRef.current.size)
          }
          if (!deletedAt) {
            setConvs(prev => prev.map(c => c.id === msg.conversation_id
              ? { ...c, last_message: msg, unread_count: (c.unread_count ?? 0) + 1 }
              : c
            ))
          }
          const other = existingConv.conversation_participants?.find((p: any) => p.user_id !== userId)
          const peer = (Array.isArray(other?.profiles) ? (other?.profiles as any[])[0] : other?.profiles) ?? null
          if (peer && onNewMessageRef.current) onNewMessageRef.current(msg.conversation_id, peer, deletedAt ?? undefined)
        })()
      })
      .subscribe()
    return () => { supabase.removeChannel(sub) }
  }, [userId])

  async function loadConvs() {
    loadingRef.current = true
    try {
    const [{ data }, { data: unreadData }] = await Promise.all([
      supabase
        .from('conversations')
        .select(`id, last_message_at, conversation_participants(user_id, last_read_at, deleted_at, profiles(id,username,display_name,full_name,avatar_color,avatar_url,is_verified))`)
        .order('last_message_at', { ascending: false }),
      supabase.rpc('get_unread_conversations', { p_user_id: userId }),
    ])

    if (!data) return setLoaded(true)
    const unreadMap = new Map<string, number>(
      (unreadData ?? []).map((r: any) => [r.conversation_id, Number(r.unread_count)])
    )
    const mine = (data as any[]).filter(c => c.conversation_participants?.some((p: any) => p.user_id === userId && !p.deleted_at))
    // Bulk fetch last message for all convs in one query, then pick latest per conv in JS
    const convIds = mine.map(c => c.id)
    // Map each conv to this user's delete boundary so previews never show pre-deletion messages
    const deletedAtMap = new Map<string, string>()
    for (const c of mine) {
      const p = c.conversation_participants?.find((pt: any) => pt.user_id === userId)
      if (p?.deleted_at) deletedAtMap.set(c.id, p.deleted_at)
    }
    let lastMsgMap = new Map<string, any>()
    if (convIds.length > 0) {
      const { data: lastMsgs } = await supabase.from('messages').select('id,body,created_at,sender_id,conversation_id')
        .in('conversation_id', convIds).order('created_at', { ascending: false }).limit(500)
      for (const m of (lastMsgs ?? [])) {
        const boundary = deletedAtMap.get(m.conversation_id)
        if (boundary && m.created_at <= boundary) continue
        if (!lastMsgMap.has(m.conversation_id)) lastMsgMap.set(m.conversation_id, m)
      }
    }
    const enriched = mine.map(c => ({ ...c, last_message: lastMsgMap.get(c.id) ?? null, unread_count: unreadMap.get(c.id) ?? 0 } as ConvRow))
    setConvs(enriched)
    myConvIdsRef.current = new Set(enriched.map(c => c.id))
    convsRef.current = enriched
    // Seed the unread set from the true DB count (used for per-conversation clearing and to
    // restore the badge when the dropdown closes). Exclude convs marked read this session.
    // Do NOT call onUnreadChange here: the dropdown is open, so the badge stays temporarily 0.
    const unreadIds = new Set(
      enriched.filter(c => (c.unread_count ?? 0) > 0 && !sessionMarkedRef.current.has(c.id)).map(c => c.id)
    )
    unreadConvIdsRef.current = unreadIds
    loadingRef.current = false
    setLoaded(true)
    } catch (e) {
      console.error('loadConvs error', e)
      loadingRef.current = false
      setLoaded(true)
    }
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
        unreadConvIdsRef.current.delete(existing.id)
        onUnreadChangeRef.current(unreadConvIdsRef.current.size)
        supabase.rpc('mark_conversation_read', { p_conversation_id: existing.id, p_user_id: userId }).then(() => {})
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
            {!loaded && (
              <>
                {[0,1,2].map(i => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#f0f2f5', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ width: '55%', height: 12, borderRadius: 6, background: '#f0f2f5', marginBottom: 6 }} />
                      <div style={{ width: '75%', height: 10, borderRadius: 6, background: '#f0f2f5' }} />
                    </div>
                  </div>
                ))}
                <div style={{ padding: '6px 14px 10px', textAlign: 'center' as const, fontSize: 12, color: '#94a3b8' }}>Loading conversations…</div>
              </>
            )}
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
                    // Permanent mark-read — clears badge for this conv and persists to DB.
                    // sessionMarkedRef guards against async re-seeds re-adding it before the
                    // RPC commits. Fire the RPC BEFORE closing the dropdown, and don't let
                    // the promise be dropped on unmount — markConvRead handles persistence.
                    markConvRead(conv.id)
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
                        {isMine ? 'You: ' : ''}{lastMsg ? previewBody(lastMsg.body) : 'Start a conversation'}
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
