'use client'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Send, X, Minus, Maximize2, Check, CheckCheck, ChevronDown, User, Trash2, Ban, Flag, CornerUpLeft, ImageIcon, Paperclip, FileText, AlertCircle, Smile, Sticker } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { blockUser, deleteChatForMe, getBlockedIds } from '../../../_lib/moderation'
import ReportModal from '../../shared/ReportModal'
import StickerPanel from './StickerPanel'
import dynamic from 'next/dynamic'
const EmojiPicker = dynamic(() => import('@emoji-mart/react'), { ssr: false })

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
  reply_to_id?: string | null
  reply_to_body?: string | null
  reply_to_sender_id?: string | null
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
  onMarkRead?: (convId: string) => void
  onSent?: (convId: string, body: string) => void
  onDeleteChat?: (convId: string, deletedAt?: string) => void
  onMinimize?: (convId: string, minimized: boolean) => void
  index?: number
  minimizedProp?: boolean
  startFocused?: boolean
  showAfter?: string
}

export default function ChatBox({ convId, userId, peer: peerProp, onClose, onOpenFull, onMarkRead, onSent, onDeleteChat, onMinimize, index = 0, minimizedProp, startFocused = false, showAfter }: Props) {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [draft, setDraft] = useState('')
  const [minimized, setMinimizedState] = useState(minimizedProp ?? false)
  function setMinimized(val: boolean | ((prev: boolean) => boolean)) {
    setMinimizedState(prev => {
      const next = typeof val === 'function' ? val(prev) : val
      onMinimize?.(convId, next)
      return next
    })
  }
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  // Peer is always resolved from DB — peerProp is only used for name/display while loading
  const [peer, setPeer] = useState<Peer | null>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [collapsed, setCollapsed] = useState(false)
  const focusedRef = useRef(false)  // true only while the textarea has active focus
  const showAfterRef = useRef<string | null>(showAfter ?? null)  // effective lower-bound for messages (post-delete restore)
  function isActivelyFocused() {
    return focusedRef.current
  }
  // Infinite scroll-up: load older messages in pages of 20 when the user reaches the top
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const loadingMoreRef = useRef(false)
  // Header name dropdown (View profile / Delete chat / Block) + report modal + confirm
  const [menuOpen, setMenuOpen] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [confirm, setConfirm] = useState<null | 'delete' | 'block'>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [isBlockedRelation, setIsBlockedRelation] = useState(false)
  const [replyTo, setReplyTo] = useState<{ id: string; body: string; senderId: string } | null>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [filePreview, setFilePreview] = useState<{ file: File; previewUrl: string | null; type: 'image' | 'file' } | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const imageInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showStickerPanel, setShowStickerPanel] = useState(false)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const emojiBtnRef = useRef<HTMLButtonElement>(null)
  const stickerPanelRef = useRef<HTMLDivElement>(null)
  const stickerBtnRef = useRef<HTMLButtonElement>(null)

const PAGE_SIZE = 20

  const [peerIsTyping, setPeerIsTyping] = useState(false)
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const isTypingRef = useRef(false)  // tracks whether we've broadcast typing_start already

  // Fall back to peerProp for name display while the DB fetch is in flight
  useEffect(() => {
    if (minimizedProp !== undefined) setMinimizedState(minimizedProp)
  }, [minimizedProp])

  const resolvedPeer = peer ?? peerProp
  const peerName = resolvedPeer.display_name || resolvedPeer.full_name || resolvedPeer.username || 'Unknown'
  const peerInitial = peerName[0].toUpperCase()

  // Track the latest message timestamp we've seen, to only fetch newer ones on poll
  const lastMsgTimeRef = useRef<string>('1970-01-01')
  const minimizedRef = useRef(minimized)
  useEffect(() => { minimizedRef.current = minimized }, [minimized])

  // Keep the view pinned to the latest message. useLayoutEffect runs synchronously AFTER the
  // DOM updates but BEFORE the browser paints — so we set scrollTop while the new content is
  // already laid out but not yet visible. The user never sees an intermediate (top) position,
  // eliminating the flash entirely. Skips re-pinning if the user scrolled up to read history.
  const pinnedToBottomRef = useRef(true)
  // When prepending older messages, we must preserve the visual position. Capture the
  // scroll height before the prepend so the pin effect can offset by the delta.
  const prependAnchorRef = useRef<number | null>(null)
  function onScroll() {
    const el = scrollRef.current
    if (!el) return
    pinnedToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60
    // Near the top → load the previous page of older messages
    if (el.scrollTop < 80) loadMore()
  }

  // Prevent scroll from leaking to the page when the chat box can't scroll further.
  // Must use a native listener with passive:false — React always registers wheel as passive.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    function onWheel(e: WheelEvent) {
      const { scrollTop, scrollHeight, clientHeight } = el!
      const atTop = scrollTop === 0 && e.deltaY < 0
      const atBottom = scrollTop + clientHeight >= scrollHeight - 1 && e.deltaY > 0
      if (atTop || atBottom) e.preventDefault()
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    if (prependAnchorRef.current !== null) {
      // Older messages were just prepended — keep the same message under the viewport
      // by advancing scrollTop by the height added at the top. No visible jump.
      el.scrollTop = el.scrollHeight - prependAnchorRef.current
      prependAnchorRef.current = null
    } else if (pinnedToBottomRef.current) {
      el.scrollTop = el.scrollHeight
    }
  }, [msgs, peer, minimized, peerIsTyping])

  useEffect(() => {
    load()
    if (startFocused) {
      // Auto-focus and mark read when user explicitly opened this chat (via dropdown click)
      setTimeout(() => {
        if (inputRef.current) { inputRef.current.focus() }
      }, 150)
    }

    // Realtime — fast path when Supabase replication is configured
    const sub = supabase.channel(`chatbox-${convId}-${userId}-${Math.random().toString(36).slice(2)}`)
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
        if (m.sender_id !== userId && isActivelyFocused()) markRead()
        // Peer sent a message — dismiss their typing indicator immediately
        if (m.sender_id !== userId) setPeerIsTyping(false)
        // Scroll handled by the useLayoutEffect pinned to [msgs]
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversation_participants', filter: `conversation_id=eq.${convId}` }, () => {
        setMsgs(prev => prev.map(m => m.sender_id === userId ? { ...m, seen: true } : m))
      })
      .subscribe()

    // Polling fallback — guarantees delivery even if realtime is not configured on the DB
    const pollInterval = setInterval(async () => {
      if (minimizedRef.current) return
      // Never re-fetch messages from before this user's delete boundary
      const pollFloor = showAfterRef.current && showAfterRef.current > lastMsgTimeRef.current
        ? showAfterRef.current : lastMsgTimeRef.current
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .gt('created_at', pollFloor)
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
      if (hasNewFromPeer && isActivelyFocused()) markRead()
      // Scroll handled by the useLayoutEffect pinned to [msgs]
    }, 2000)

    // Typing indicator — broadcast channel per conversation
    const typingCh = supabase.channel(`typing-${convId}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload?.user_id === userId) return  // ignore own events
        if (payload?.typing) {
          setPeerIsTyping(true)
        } else {
          setPeerIsTyping(false)
        }
      })
      .subscribe()
    typingChannelRef.current = typingCh

    return () => {
      supabase.removeChannel(sub)
      supabase.removeChannel(typingCh)
      clearInterval(pollInterval)
    }
  }, [convId])

  async function load() {
    // Always read deleted_at from DB — source of truth even if showAfter prop is missing (HMR/remount)
    const { data: myPartCheck } = await supabase
      .from('conversation_participants')
      .select('deleted_at')
      .eq('conversation_id', convId)
      .eq('user_id', userId)
      .maybeSingle()
    const effectiveShowAfter = showAfter ?? myPartCheck?.deleted_at ?? null
    showAfterRef.current = effectiveShowAfter
    // Do NOT clear deleted_at here — keep it as the persistent message boundary.
    // It is cleared only when A sends a new message (in send/sendFile/sendSticker),
    // which signals A has fully re-engaged with the conversation.

    let msgsQuery = supabase.from('messages').select('*')
      .eq('conversation_id', convId).order('created_at', { ascending: false }).limit(PAGE_SIZE)
    if (effectiveShowAfter) msgsQuery = msgsQuery.gt('created_at', effectiveShowAfter)

    const [{ data: rawDesc }, { data: parts }] = await Promise.all([
      msgsQuery,
      supabase.from('conversation_participants')
        .select('user_id, last_read_at').eq('conversation_id', convId),
    ])
    const data = (rawDesc ?? []).slice().reverse()
    // If we got a full page, there may be older messages to load on scroll-up
    setHasMore((rawDesc ?? []).length === PAGE_SIZE)

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

    // Check block status in both directions
    const peerId = peerPart?.user_id ?? (peerProp as any)?.id
    if (peerId) {
      getBlockedIds(userId).then(ids => setIsBlockedRelation(ids.includes(peerId)))
    }

    const peerRead = peerPart?.last_read_at ?? null
    const enriched = (data ?? []).map((m: any) => ({
      ...m,
      seen: m.sender_id === userId && peerRead && new Date(peerRead) >= new Date(m.created_at),
    }))
    setMsgs(enriched)
    // Seed the poll cursor so it only fetches messages newer than what we just loaded.
    // When nothing loaded (all pre-deletion messages filtered out), anchor the cursor to
    // the delete boundary so the poll never re-fetches old messages.
    if (enriched.length > 0) {
      lastMsgTimeRef.current = enriched[enriched.length - 1].created_at
    } else if (effectiveShowAfter) {
      lastMsgTimeRef.current = effectiveShowAfter
    }
    // Don't auto-mark read on load — only mark when user explicitly focuses the box
    // Scroll handled by the initial-scroll effect below once msgs render.
  }

  // Load the previous page of older messages when the user scrolls to the top.
  async function loadMore() {
    if (loadingMoreRef.current || !hasMore) return
    const oldest = msgs[0]
    if (!oldest) return
    loadingMoreRef.current = true
    setLoadingMore(true)
    // Capture current scroll height so the layout effect can preserve the read position.
    if (scrollRef.current) prependAnchorRef.current = scrollRef.current.scrollHeight
    let olderQuery = supabase.from('messages').select('*')
      .eq('conversation_id', convId)
      .lt('created_at', oldest.created_at)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE)
    if (showAfterRef.current) olderQuery = olderQuery.gt('created_at', showAfterRef.current)
    const { data: rawDesc } = await olderQuery
    const older = (rawDesc ?? []).slice().reverse().map((m: any) => ({ ...m, seen: false }))
    setHasMore((rawDesc ?? []).length === PAGE_SIZE)
    if (older.length > 0) {
      setMsgs(prev => {
        const existing = new Set(prev.map(m => m.id))
        const deduped = older.filter(m => !existing.has(m.id))
        return [...deduped, ...prev]
      })
    } else {
      prependAnchorRef.current = null
    }
    loadingMoreRef.current = false
    setLoadingMore(false)
  }

  async function markRead() {
    onMarkRead?.(convId)  // optimistic — clear badge immediately
    // Supabase query builder is lazy — must await/.then() or the request never fires.
    await supabase.rpc('mark_conversation_read', { p_conversation_id: convId, p_user_id: userId })
  }

  // Close the header menu when clicking outside it
  useEffect(() => {
    if (!menuOpen) return
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  useEffect(() => {
    if (!showEmojiPicker) return
    function handler(e: MouseEvent) {
      const target = e.target as Node
      if (
        emojiPickerRef.current && !emojiPickerRef.current.contains(target) &&
        emojiBtnRef.current && !emojiBtnRef.current.contains(target)
      ) setShowEmojiPicker(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showEmojiPicker])

  useEffect(() => {
    if (!showStickerPanel) return
    function handler(e: MouseEvent) {
      const target = e.target as Node
      if (
        stickerPanelRef.current && !stickerPanelRef.current.contains(target) &&
        stickerBtnRef.current && !stickerBtnRef.current.contains(target)
      ) setShowStickerPanel(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showStickerPanel])

  async function handleDeleteChat() {
    setConfirm(null)
    const { deletedAt } = await deleteChatForMe(convId, userId)
    onDeleteChat?.(convId, deletedAt ?? undefined)
    onClose()
  }

  async function handleBlock() {
    setConfirm(null)
    const peerId = (peer ?? peerProp).id
    await blockUser(userId, peerId)
    setIsBlockedRelation(true)
  }

  function pickImage() { imageInputRef.current?.click() }
  function pickFile() { fileInputRef.current?.click() }

  function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setUploadError('Image must be under 5 MB'); return }
    setUploadError('')
    const previewUrl = URL.createObjectURL(file)
    setFilePreview({ file, previewUrl, type: 'image' })
  }

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { setUploadError('File must be under 10 MB'); return }
    setUploadError('')
    setFilePreview({ file, previewUrl: null, type: 'file' })
  }

  async function sendFile() {
    if (!filePreview || uploading) return
    setUploading(true)
    setUploadError('')
    const ext = filePreview.file.name.split('.').pop() ?? 'bin'
    const path = `chat/${convId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error: uploadErr } = await supabase.storage.from('chat-media').upload(path, filePreview.file)
    if (uploadErr) { setUploadError(uploadErr.message); setUploading(false); return }
    const { data: urlData } = supabase.storage.from('chat-media').getPublicUrl(path)
    const publicUrl = urlData.publicUrl
    // Encode as special body so receiver can render it
    const body = filePreview.type === 'image'
      ? `[img]${publicUrl}[/img]`
      : `[file name="${filePreview.file.name}"]${publicUrl}[/file]`
    if (filePreview.previewUrl) URL.revokeObjectURL(filePreview.previewUrl)
    setFilePreview(null)
    setUploading(false)
    setCollapsed(false)
    if (inputRef.current) inputRef.current.style.height = 'auto'

    // Reuse send logic with constructed body
    const currentReplyTo = replyTo
    setReplyTo(null)
    const optimisticId = `optimistic-${Date.now()}`
    const optimistic: Msg = { id: optimisticId, conversation_id: convId, sender_id: userId, body, created_at: new Date().toISOString(), seen: false, reply_to_id: currentReplyTo?.id ?? null, reply_to_body: currentReplyTo?.body ?? null, reply_to_sender_id: currentReplyTo?.senderId ?? null }
    pinnedToBottomRef.current = true
    setMsgs(prev => [...prev, optimistic])

    const insertPayload: Record<string, any> = { conversation_id: convId, sender_id: userId, body }
    if (currentReplyTo) { insertPayload.reply_to_id = currentReplyTo.id; insertPayload.reply_to_body = currentReplyTo.body; insertPayload.reply_to_sender_id = currentReplyTo.senderId }
    const { data, error } = await supabase.from('messages').insert(insertPayload).select('*').single()
    if (error) {
      setMsgs(prev => prev.map(m => m.id === optimisticId ? { ...m, failed: true } as any : m))
    } else if (data) {
      setMsgs(prev => prev.map(m => m.id === optimisticId ? { ...data, seen: false } : m))
      lastMsgTimeRef.current = data.created_at
      if (showAfterRef.current) {
        showAfterRef.current = null
        supabase.from('conversation_participants').update({ deleted_at: null }).eq('conversation_id', convId).eq('user_id', userId).then(() => {})
      }
    }
    // conversations.last_message_at is bumped server-side by the messages-insert trigger
  }

  function insertEmoji(emoji: { native: string }) {
    const input = inputRef.current
    if (!input) { setDraft(d => d + emoji.native); return }
    const start = input.selectionStart ?? draft.length
    const end = input.selectionEnd ?? draft.length
    const next = draft.slice(0, start) + emoji.native + draft.slice(end)
    setDraft(next)
    // Restore cursor after the inserted emoji
    requestAnimationFrame(() => {
      input.focus()
      input.setSelectionRange(start + emoji.native.length, start + emoji.native.length)
    })
    setShowEmojiPicker(false)
  }

  async function sendSticker(url: string) {
    const body = url === '👍' ? `[like]👍[/like]` : `[sticker]${url}[/sticker]`
    const optimisticId = `optimistic-${Date.now()}`
    const optimistic: Msg = { id: optimisticId, conversation_id: convId, sender_id: userId, body, created_at: new Date().toISOString(), seen: false }
    pinnedToBottomRef.current = true
    setMsgs(prev => [...prev, optimistic])
    const { data, error } = await supabase.from('messages').insert({ conversation_id: convId, sender_id: userId, body }).select('*').single()
    if (error) {
      setMsgs(prev => prev.map(m => m.id === optimisticId ? { ...m, failed: true } as any : m))
    } else if (data) {
      setMsgs(prev => prev.map(m => m.id === optimisticId ? { ...data, seen: false } : m))
      lastMsgTimeRef.current = data.created_at
      onSent?.(convId, body)
      if (showAfterRef.current) {
        showAfterRef.current = null
        supabase.from('conversation_participants').update({ deleted_at: null }).eq('conversation_id', convId).eq('user_id', userId).then(() => {})
      }
    }
    // conversations.last_message_at is bumped server-side by the messages-insert trigger
  }

  async function send() {
    if (!draft.trim() || sending) return
    setSending(true)
    const body = draft.trim()
    const currentReplyTo = replyTo
    setDraft('')
    setReplyTo(null)
    // Stop typing indicator immediately on send
    if (isTypingRef.current) {
      isTypingRef.current = false
      typingChannelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { user_id: userId, typing: false } })
    }

    // Optimistically add the message immediately — sender sees it right away
    const optimisticId = `optimistic-${Date.now()}`
    const optimistic: Msg = {
      id: optimisticId,
      conversation_id: convId,
      sender_id: userId,
      body,
      created_at: new Date().toISOString(),
      seen: false,
      reply_to_id: currentReplyTo?.id ?? null,
      reply_to_body: currentReplyTo?.body ?? null,
      reply_to_sender_id: currentReplyTo?.senderId ?? null,
    }
    pinnedToBottomRef.current = true
    setMsgs(prev => [...prev, optimistic])

    const insertPayload: Record<string, any> = { conversation_id: convId, sender_id: userId, body }
    if (currentReplyTo) {
      insertPayload.reply_to_id = currentReplyTo.id
      insertPayload.reply_to_body = currentReplyTo.body
      insertPayload.reply_to_sender_id = currentReplyTo.senderId
    }
    const { data, error } = await supabase
      .from('messages')
      .insert(insertPayload)
      .select('*')
      .single()

    if (error) {
      setSendError(error.message)
      setMsgs(prev => prev.map(m => m.id === optimisticId ? { ...m, failed: true } as any : m))
    } else if (data) {
      setMsgs(prev => prev.map(m => m.id === optimisticId ? { ...data, seen: false } : m))
      lastMsgTimeRef.current = data.created_at
      onSent?.(convId, body)
      // A sent a message — fully re-engaged, clear the delete boundary
      if (showAfterRef.current) {
        showAfterRef.current = null
        supabase.from('conversation_participants').update({ deleted_at: null }).eq('conversation_id', convId).eq('user_id', userId).then(() => {})
      }
    }

    // conversations.last_message_at is bumped server-side by the messages-insert trigger
    setSending(false)
    setCollapsed(false)
    if (inputRef.current) { inputRef.current.style.height = 'auto'; inputRef.current.focus() }
  }

  function replyPreview(body: string, compact = false) {
    const p = parseBody(body)
    if (p.kind === 'image') return compact
      ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><img src={p.url} style={{ width: 20, height: 20, objectFit: 'cover', borderRadius: 3 }} />Photo</span>
      : <img src={p.url} style={{ display: 'block', width: '100%', maxWidth: 200, borderRadius: 8 }} />
    if (p.kind === 'sticker') return compact
      ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><img src={p.url} style={{ width: 20, height: 20, objectFit: 'cover', borderRadius: 3 }} />Sticker</span>
      : <img src={p.url} style={{ display: 'block', width: 160, borderRadius: 8 }} />
    if (p.kind === 'like') return <span style={{ fontSize: compact ? 14 : 28 }}>{p.emoji}</span>
    if (p.kind === 'file') return <span>📎 {p.name}</span>
    return <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{body}</span>
  }

  function parseBody(body: string) {
    const imgMatch = body.match(/^\[img\](.*?)\[\/img\]$/)
    if (imgMatch) return { kind: 'image' as const, url: imgMatch[1] }
    const stickerMatch = body.match(/^\[sticker\](.*?)\[\/sticker\]$/)
    if (stickerMatch) return { kind: 'sticker' as const, url: stickerMatch[1] }
    const likeMatch = body.match(/^\[like\](.*?)\[\/like\]$/)
    if (likeMatch) return { kind: 'like' as const, emoji: likeMatch[1] }
    const fileMatch = body.match(/^\[file name="(.*?)"\](.*?)\[\/file\]$/)
    if (fileMatch) return { kind: 'file' as const, name: fileMatch[1], url: fileMatch[2] }
    return { kind: 'text' as const }
  }

  const right = 80 + index * 328  // stack multiple boxes
  const bubbleBottom = 20 + index * 68  // stack bubbles vertically when multiple minimized

  if (minimized) {
    return (
      <div style={{ position: 'fixed', bottom: bubbleBottom, right: 16, zIndex: 600, width: 52, height: 52 }}
        className="chat-bubble-wrap">
        <style>{`.chat-bubble-wrap .chat-bubble-x { opacity: 0; } .chat-bubble-wrap:hover .chat-bubble-x { opacity: 1; }`}</style>
        <div
          onClick={() => { setMinimized(false); focusedRef.current = true; markRead() }}
          style={{
            width: 52, height: 52, borderRadius: '50%',
            background: AVATAR_COLORS[resolvedPeer.avatar_color ?? 0],
            boxShadow: '0 4px 16px rgba(0,0,0,0.28)',
            cursor: 'pointer', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 800, color: '#fff',
            border: '3px solid #fff',
          }}>
          {resolvedPeer.avatar_url
            ? <img src={resolvedPeer.avatar_url} alt={peerInitial} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : peerInitial}
        </div>
        <button
          className="chat-bubble-x"
          onClick={e => { e.stopPropagation(); onClose() }}
          style={{
            position: 'absolute', top: -4, right: -4,
            width: 20, height: 20, borderRadius: '50%',
            background: '#fff', border: '2px solid #e4e6eb',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'opacity 0.15s',
          }}>
          <X size={10} color="#65676b" />
        </button>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed', bottom: 0, right: right,
      width: 320, zIndex: 600,
      boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
      borderRadius: '10px 10px 0 0', overflow: 'hidden',
      outline: '1px solid rgba(0,0,0,0.12)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ background: '#fff', padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: minimized ? 'none' : '1px solid #e4e6eb' }}>
        <div ref={menuRef} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0, cursor: 'pointer', position: 'relative' }}
          onClick={() => {
            if (minimized) { setMinimized(false); focusedRef.current = true; markRead() }
            else setMenuOpen(v => !v)
          }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: AVATAR_COLORS[resolvedPeer.avatar_color ?? 0], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', overflow: 'hidden', flexShrink: 0 }}>
            {resolvedPeer.avatar_url ? <img src={resolvedPeer.avatar_url} alt={peerInitial} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : peerInitial}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, overflow: 'hidden' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#050505', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                {peerName}
              </span>
              {resolvedPeer.is_verified && (
                <svg width="14" height="14" viewBox="0 0 34 34" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                  <circle cx="17" cy="17" r="17" fill="#1877F2"/>
                  <path d="M10 17.5L14.5 22L24 12" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          </div>
          {menuOpen && (
            <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, minWidth: 180, background: '#fff', borderRadius: 10, boxShadow: '0 8px 28px rgba(0,0,0,0.18)', border: '1px solid #e4e6eb', zIndex: 50, overflow: 'hidden', padding: '4px 0' }}
              onClick={e => e.stopPropagation()}>
              <a href={`/u/${resolvedPeer.username}`}
                onClick={() => setMenuOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', fontSize: 13, color: '#050505', textDecoration: 'none' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f0f2f5' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                <User size={15} color="#65676b" /> View profile
              </a>
              <button
                onClick={() => { setMenuOpen(false); setConfirm('delete') }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 14px', fontSize: 13, color: '#050505', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' as const }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f0f2f5' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                <Trash2 size={15} color="#65676b" /> Delete chat
              </button>
              <button
                onClick={() => { setMenuOpen(false); setShowReport(true) }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 14px', fontSize: 13, color: '#050505', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' as const }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f0f2f5' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                <Flag size={15} color="#65676b" /> Report
              </button>
              <div style={{ height: 1, background: '#e4e6eb', margin: '4px 0' }} />
              <button
                onClick={() => { setMenuOpen(false); setConfirm('block') }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 14px', fontSize: 13, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' as const, fontWeight: 600 }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                <Ban size={15} color="#dc2626" /> Block
              </button>
            </div>
          )}
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
          <div ref={scrollRef} onScroll={onScroll} style={{ height: 340, overflowY: 'auto', background: '#fff', padding: '8px 10px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {loadingMore && (
              <div style={{ textAlign: 'center' as const, color: '#94a3b8', fontSize: 11, padding: '4px 0' }}>Loading…</div>
            )}
            {msgs.length === 0 && (
              <div style={{ margin: 'auto', textAlign: 'center' as const, color: '#94a3b8', fontSize: 13 }}>Say hi to {peerName}!</div>
            )}
            {msgs.map((msg, i) => {
              const isMine = msg.sender_id === userId
              const prev = msgs[i - 1]
              const sameGroup = prev && prev.sender_id === msg.sender_id &&
                new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime() < 120000
              const isLast = i === msgs.length - 1
              const replyAuthor = msg.reply_to_sender_id === userId ? 'You' : peerName

              function scrollToMsg(targetId: string) {
                const el = scrollRef.current?.querySelector(`[data-msg-id="${targetId}"]`) as HTMLElement | null
                if (!el || !scrollRef.current) return
                el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                el.animate([{ background: 'rgba(0,132,255,0.15)' }, { background: 'transparent' }], { duration: 1000, easing: 'ease-out' })
              }

              return (
                <div key={msg.id}
                  data-msg-id={msg.id}
                  className="chat-msg-row"
                  style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginTop: sameGroup ? 1 : 8, position: 'relative' }}
                  onMouseEnter={e => { const btn = (e.currentTarget as HTMLElement).querySelector('.reply-btn') as HTMLElement | null; if (btn) btn.style.opacity = '1' }}
                  onMouseLeave={e => { const btn = (e.currentTarget as HTMLElement).querySelector('.reply-btn') as HTMLElement | null; if (btn) btn.style.opacity = '0' }}>

                  {!isMine && !sameGroup && (
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: AVATAR_COLORS[resolvedPeer.avatar_color ?? 0], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', overflow: 'hidden', flexShrink: 0, marginRight: 6, alignSelf: 'flex-end' }}>
                      {resolvedPeer.avatar_url ? <img src={resolvedPeer.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : peerInitial}
                    </div>
                  )}
                  {!isMine && sameGroup && <div style={{ width: 30 }} />}

                  {/* Reply button — shown on hover, left of mine / right of theirs */}
                  {isMine && !isBlockedRelation && (
                    <button className="reply-btn"
                      onClick={() => setReplyTo({ id: msg.id, body: msg.body, senderId: msg.sender_id })}
                      style={{ opacity: 0, transition: 'opacity 0.15s', alignSelf: 'center', marginRight: 4, width: 24, height: 24, borderRadius: '50%', border: 'none', background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                      <CornerUpLeft size={12} color="#65676b" />
                    </button>
                  )}

                  <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                    {/* Quoted reply — floats above the bubble like in the reference */}
                    {msg.reply_to_body && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2, padding: '0 4px' }}>
                        <CornerUpLeft size={10} color="#94a3b8" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>
                          {replyAuthor === 'You' ? 'You replied to yourself' : `You replied to ${replyAuthor}`}
                        </span>
                      </div>
                    )}
                    {(() => {
                      const parsed = parseBody(msg.body)
                      const failed = (msg as any).failed
                      const opacity = msg.id.startsWith('optimistic-') ? 0.6 : 1
                      const bubbleBg = failed ? '#fee2e2' : isMine ? '#0084ff' : '#f0f2f5'
                      const bubbleColor = failed ? '#dc2626' : isMine ? '#fff' : '#050505'
                      const radius = isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px'

                      const rp = msg.reply_to_body ? parseBody(msg.reply_to_body) : null
                      const isTextReply = rp?.kind === 'text'
                      const isMediaReply = rp && !isTextReply

                      // grey pill for text replies — taller padding, overlapped by bubble
                      const quotedText = isTextReply ? (
                        <div onClick={e => { e.stopPropagation(); msg.reply_to_id && scrollToMsg(msg.reply_to_id) }}
                          style={{ padding: '6px 10px 14px', background: '#f0f2f5', borderRadius: 12, fontSize: 12, color: '#65676b', lineHeight: 1.4, marginBottom: -8, cursor: msg.reply_to_id ? 'pointer' : 'default', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                          {replyPreview(msg.reply_to_body!)}
                        </div>
                      ) : null

                      // media preview for image/sticker/like replies
                      const quotedMedia = isMediaReply ? (
                        <div onClick={() => msg.reply_to_id && scrollToMsg(msg.reply_to_id)}
                          style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', marginBottom: -8, cursor: msg.reply_to_id ? 'pointer' : 'default' }}>
                          {replyPreview(msg.reply_to_body!)}
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(180,180,180,0.55)' }} />
                        </div>
                      ) : null

                      if (parsed.kind === 'like') return (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start', opacity }}>
                          {quotedMedia}
                          <div style={{ fontSize: 36, lineHeight: 1, userSelect: 'none', position: 'relative', zIndex: 1 }}>{parsed.emoji}</div>
                        </div>
                      )
                      if (parsed.kind === 'sticker') return (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start', opacity }}>
                          {quotedMedia}
                          <div style={{ maxWidth: 160, position: 'relative', zIndex: 1 }}>
                            <img src={parsed.url} alt="sticker" style={{ display: 'block', width: '100%', borderRadius: 8, cursor: 'zoom-in' }} onClick={() => setLightboxUrl(parsed.url)} />
                          </div>
                        </div>
                      )
                      if (parsed.kind === 'image') return (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start', opacity }}>
                          {quotedMedia}
                          <div style={{ borderRadius: radius, overflow: 'hidden', maxWidth: 200, position: 'relative', zIndex: 1 }}>
                            <img src={parsed.url} alt="image" style={{ display: 'block', width: '100%', borderRadius: radius, cursor: 'zoom-in' }} onClick={() => setLightboxUrl(parsed.url)} />
                          </div>
                        </div>
                      )
                      if (parsed.kind === 'file') return (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start', opacity }}>
                          {quotedText ?? quotedMedia}
                          <a href={parsed.url} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: radius, background: bubbleBg, color: bubbleColor, textDecoration: 'none', maxWidth: 220, position: 'relative', zIndex: 1 }}>
                            <FileText size={18} style={{ flexShrink: 0 }} />
                            <span style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{parsed.name}</span>
                          </a>
                        </div>
                      )
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start', opacity }}>
                          {quotedText ?? quotedMedia}
                          <div style={{ padding: '7px 11px', borderRadius: radius, background: bubbleBg, color: bubbleColor, fontSize: 13, lineHeight: 1.4, wordBreak: 'break-word' as const, whiteSpace: 'pre-wrap' as const, position: 'relative', zIndex: 1 }}>
                            {msg.body}{failed ? ' ✕' : ''}
                          </div>
                        </div>
                      )
                    })()}
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

                  {/* Reply button for peer messages */}
                  {!isMine && !isBlockedRelation && (
                    <button className="reply-btn"
                      onClick={() => setReplyTo({ id: msg.id, body: msg.body, senderId: msg.sender_id })}
                      style={{ opacity: 0, transition: 'opacity 0.15s', alignSelf: 'center', marginLeft: 4, width: 24, height: 24, borderRadius: '50%', border: 'none', background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                      <CornerUpLeft size={12} color="#65676b" />
                    </button>
                  )}
                </div>
              )
            })}
            {/* Typing indicator */}
            {peerIsTyping && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginTop: 8, marginBottom: 4 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: AVATAR_COLORS[resolvedPeer.avatar_color ?? 0], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: '#fff', overflow: 'hidden', flexShrink: 0 }}>
                  {resolvedPeer.avatar_url
                    ? <img src={resolvedPeer.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : peerInitial}
                </div>
                <div style={{ padding: '10px 14px', borderRadius: '18px 18px 18px 4px', background: '#f0f2f5', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <style>{`
                    @keyframes cb-dot-bounce {
                      0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
                      30% { transform: translateY(-5px); opacity: 1; }
                    }
                    .cb-dot { width: 6px; height: 6px; border-radius: 50%; background: #8a8d91; animation: cb-dot-bounce 1.2s infinite; }
                    .cb-dot:nth-child(2) { animation-delay: 0.2s; }
                    .cb-dot:nth-child(3) { animation-delay: 0.4s; }
                  `}</style>
                  <div className="cb-dot" />
                  <div className="cb-dot" />
                  <div className="cb-dot" />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Hidden file inputs */}
          <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImagePick} />
          <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFilePick} />

          {/* Send error */}
          {(sendError || uploadError) && (
            <div style={{ background: '#fef2f2', padding: '4px 12px', fontSize: 11, color: '#dc2626', borderTop: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: 4 }}>
              <AlertCircle size={11} /> {sendError || uploadError}
            </div>
          )}

          {/* Input or blocked notice */}
          {isBlockedRelation ? (
            <div style={{ background: '#fff', padding: '10px 12px', borderTop: '1px solid #f0f2f5', textAlign: 'center' as const, fontSize: 12, color: '#94a3b8' }}>
              You can't reply to this conversation.
            </div>
          ) : (
            <div style={{ background: '#fff' }}>
            {/* Reply preview bar */}
            {replyTo && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px 0', borderBottom: '1px solid #f0f2f5' }}>
                <div style={{ flex: 1, borderLeft: '3px solid #0084ff', paddingLeft: 8, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#0084ff', marginBottom: 1 }}>
                    Replying to {replyTo.senderId === userId ? 'yourself' : peerName}
                  </div>
                  <div style={{ fontSize: 11, color: '#65676b', display: 'flex', alignItems: 'center' }}>{replyPreview(replyTo.body, true)}</div>
                </div>
                <button onClick={() => setReplyTo(null)}
                  style={{ width: 20, height: 20, borderRadius: '50%', border: 'none', background: '#e4e6eb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                  <X size={11} color="#65676b" />
                </button>
              </div>
            )}

            {/* File/image preview bar */}
            {filePreview && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderBottom: '1px solid #f0f2f5', background: '#f8fafc' }}>
                {filePreview.type === 'image' && filePreview.previewUrl
                  ? <img src={filePreview.previewUrl} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                  : <div style={{ width: 40, height: 40, borderRadius: 6, background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><FileText size={18} color="#64748b" /></div>
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{filePreview.file.name}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{(filePreview.file.size / 1024).toFixed(0)} KB · {filePreview.type === 'image' ? 'Image' : 'File'}</div>
                </div>
                <button onClick={() => { if (filePreview.previewUrl) URL.revokeObjectURL(filePreview.previewUrl); setFilePreview(null) }}
                  style={{ width: 20, height: 20, borderRadius: '50%', border: 'none', background: '#e4e6eb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                  <X size={11} color="#65676b" />
                </button>
              </div>
            )}

            <div style={{ padding: '8px 6px', display: 'flex', gap: 8, alignItems: 'center', boxSizing: 'border-box', width: '100%' }}>
              {/* + collapse button OR left buttons */}
              {collapsed ? (
                <button onClick={() => setCollapsed(false)}
                  style={{ width: 22, height: 22, borderRadius: '50%', border: 'none', background: '#0084ff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#0073e6' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#0084ff' }}>
                  <span style={{ fontSize: 18, color: '#fff', lineHeight: 1, marginTop: -1 }}>+</span>
                </button>
              ) : (
                <>
                  {/* Sticker button */}
                  <button ref={stickerBtnRef}
                    onClick={() => { setShowStickerPanel(v => !v); setShowEmojiPicker(false) }} title="GIF / Stickers"
                    style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: showStickerPanel ? '#e7f3ff' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                    onMouseEnter={e => { if (!showStickerPanel) e.currentTarget.style.background = '#f0f2f5' }}
                    onMouseLeave={e => { if (!showStickerPanel) e.currentTarget.style.background = 'none' }}>
                    <Sticker size={16} color={showStickerPanel ? '#0084ff' : '#65676b'} />
                  </button>
                  {/* Image button */}
                  <button onClick={pickImage} title="Send image (max 5 MB)"
                    style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f0f2f5' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                    <ImageIcon size={16} color="#65676b" />
                  </button>
                  {/* File button */}
                  <button onClick={pickFile} title="Send file (max 10 MB)"
                    style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f0f2f5' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                    <Paperclip size={16} color="#65676b" />
                  </button>
                </>
              )}

              {/* Pill: textarea + emoji */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'flex-end', background: '#f0f2f5', borderRadius: 20, padding: '0 4px 0 12px' }}>
                <textarea
                  ref={inputRef}
                  value={draft}
                  rows={1}
                  onChange={e => {
                    const val = e.target.value
                    setDraft(val)
                    // collapse left buttons when typing, expand when empty
                    setCollapsed(val.length > 0)
                    // auto-grow
                    e.target.style.height = 'auto'
                    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'
                    // typing indicator broadcast
                    if (typingChannelRef.current) {
                      if (val.length > 0 && !isTypingRef.current) {
                        isTypingRef.current = true
                        typingChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { user_id: userId, typing: true } })
                      } else if (val.length === 0 && isTypingRef.current) {
                        isTypingRef.current = false
                        typingChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { user_id: userId, typing: false } })
                      }
                    }
                  }}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); filePreview ? sendFile() : send() } }}
                  onPaste={e => {
                    const item = Array.from(e.clipboardData.items).find(i => i.type.startsWith('image/'))
                    if (!item) return
                    e.preventDefault()
                    const file = item.getAsFile()
                    if (!file) return
                    if (file.size > 5 * 1024 * 1024) { setUploadError('Image must be under 5 MB'); return }
                    setUploadError('')
                    setFilePreview({ file, previewUrl: URL.createObjectURL(file), type: 'image' })
                  }}
                  onFocus={() => { focusedRef.current = true; markRead() }}
                  onBlur={() => { focusedRef.current = false }}
                  placeholder="Aa"
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 13, padding: '8px 0', color: '#050505', minWidth: 0, resize: 'none', lineHeight: '1.4', overflow: 'hidden', fontFamily: 'inherit' }}
                />
                {/* Emoji picker inside pill */}
                <div ref={emojiPickerRef} style={{ display: 'flex', alignItems: 'center', paddingBottom: 1 }}>
                  <button ref={emojiBtnRef}
                    onClick={() => { setShowEmojiPicker(v => !v); setShowStickerPanel(false) }} title="Emoji"
                    style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: showEmojiPicker ? 'rgba(0,132,255,0.12)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                    onMouseEnter={e => { if (!showEmojiPicker) e.currentTarget.style.background = 'rgba(0,0,0,0.06)' }}
                    onMouseLeave={e => { if (!showEmojiPicker) e.currentTarget.style.background = 'none' }}>
                    <Smile size={16} color={showEmojiPicker ? '#0084ff' : '#65676b'} />
                  </button>
                </div>
              </div>

              {/* Send / Like button */}
              {(draft.trim() || filePreview) ? (
                <button
                  onClick={() => filePreview ? sendFile() : send()}
                  disabled={sending || uploading}
                  style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f0f2f5' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                  <Send size={16} color="#0084ff" />
                </button>
              ) : (
                <button
                  onClick={() => sendSticker('👍')}
                  disabled={sending}
                  title="Send like"
                  style={{ width: 30, height: 30, borderRadius: '50%', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20, lineHeight: 1, transition: 'transform 0.1s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.25)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}>
                  👍
                </button>
              )}
            </div>
            </div>
          )}
        </>
      )}

      {/* Sticker panel portal — renders outside the chat box so it's never clipped */}
      {showStickerPanel && typeof window !== 'undefined' && createPortal(
        <div ref={stickerPanelRef} style={{
          position: 'fixed',
          bottom: (() => { const r = stickerBtnRef.current?.getBoundingClientRect(); return r ? window.innerHeight - r.top + 4 : 120 })(),
          left: (() => { const r = stickerBtnRef.current?.getBoundingClientRect(); return r ? r.left : 80 })(),
          zIndex: 9000,
        }}>
          <StickerPanel onSelect={url => { sendSticker(url); setShowStickerPanel(false) }} onClose={() => setShowStickerPanel(false)} />
        </div>,
        document.body
      )}

      {/* Emoji picker portal — renders outside the chat box so it's never clipped */}
      {showEmojiPicker && typeof window !== 'undefined' && createPortal(
        <div ref={emojiPickerRef} style={{
          position: 'fixed',
          bottom: (() => { const r = emojiBtnRef.current?.getBoundingClientRect(); return r ? window.innerHeight - r.top + 8 : 120 })(),
          right: (() => { const r = emojiBtnRef.current?.getBoundingClientRect(); return window.innerWidth - r!.right })(),
          zIndex: 9000,
        }}>
          <EmojiPicker
            data={async () => (await import('@emoji-mart/data')).default}
            onEmojiSelect={insertEmoji}
            theme="light"
            previewPosition="none"
            skinTonePosition="none"
            maxFrequentRows={1}
            perLine={7}
          />
        </div>,
        document.body
      )}

      {/* Image lightbox */}
      {lightboxUrl && createPortal(
        <div onClick={() => setLightboxUrl(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, cursor: 'zoom-out' }}>
          <button onClick={() => setLightboxUrl(null)}
            style={{ position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={18} color="#fff" />
          </button>
          <img src={lightboxUrl} alt="" onClick={e => e.stopPropagation()}
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 10, objectFit: 'contain', boxShadow: '0 8px 40px rgba(0,0,0,0.5)', cursor: 'default' }} />
        </div>,
        document.body
      )}

      {/* Confirm dialog for Delete chat / Block */}
      {confirm && (
        <div onClick={() => setConfirm(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 360, padding: '22px 22px 18px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
              {confirm === 'delete' ? 'Delete chat?' : `Block ${peerName}?`}
            </div>
            <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, marginBottom: 20 }}>
              {confirm === 'delete'
                ? 'This removes the conversation from your inbox. The other person will still have their copy.'
                : "They won't be able to message you, and you won't see their messages or posts. You can unblock them later."}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirm(null)}
                style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={confirm === 'delete' ? handleDeleteChat : handleBlock}
                style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#dc2626', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                {confirm === 'delete' ? 'Delete' : 'Block'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report modal */}
      {showReport && (
        <ReportModal
          reporterId={userId}
          reportedId={(peer ?? peerProp).id}
          reportedName={peerName}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  )
}
