'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ShieldCheck, Users, FileText, BarChart3, Check, X,
  BadgeCheck, Trash2, Search, RefreshCw, LogOut,
  ChevronDown, ChevronUp, ExternalLink, MessageSquarePlus,
  Circle, Clock, CheckCircle, XCircle, ImageIcon,
  AlertTriangle, Link2, HelpCircle, Tag, Calendar,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import CommunityStats from '../components/CommunityStats'
import { createNotification } from '../lib/notify'

const ADMIN_EMAIL = 'tranvuong2832@gmail.com'

type Tab = 'stats' | 'verify' | 'users' | 'posts' | 'tickets' | 'warnings'

interface TicketMessage {
  id: string
  ticket_id: string
  sender: 'user' | 'admin'
  body: string | null
  image_url: string | null
  created_at: string
}

interface Ticket {
  id: string
  user_id: string | null
  email: string | null
  display_name: string | null
  username: string | null
  title: string
  message: string
  image_url: string | null
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  admin_reply: string | null
  admin_reply_image_url: string | null
  user_reply: string | null
  user_reply_image_url: string | null
  user_reply_at: string | null
  admin_reply_at: string | null
  created_at: string
  updated_at: string
}

interface VerifyRequest {
  id: string
  user_id: string
  username: string
  display_name: string | null
  email: string | null
  profession: string | null
  specializations: string[] | null
  doc_url: string | null
  note: string | null
  status: string
  created_at: string
}

interface UserRow {
  id: string
  username: string
  display_name: string | null
  full_name: string | null
  profession: string | null
  is_verified: boolean
  avatar_color: number
  created_at: string
}

interface PostRow {
  id: string
  user_id: string
  post_type: string
  body: string | null
  visibility: string
  category: string | null
  is_question: boolean
  created_at: string
  profiles: { username: string; display_name: string | null; full_name: string | null } | null
}

interface Warning {
  id: string
  user_id: string
  post_id: string | null
  type: 'delete' | 'warn'
  reason: string
  custom_note: string | null
  created_at: string
  expires_at: string
  profiles: { username: string; display_name: string | null } | null
}

interface Stats {
  users: number
  posts: number
  pendingVerify: number
  verifiedUsers: number
  todayViews: number
  totalViews: number
}

interface DayCount { date: string; count: number }
interface ChartData {
  views30: DayCount[]
  users30: DayCount[]
  posts30: DayCount[]
}

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
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  if (m < 1440) return `${Math.floor(m / 60)}h ago`
  if (m < 10080) return `${Math.floor(m / 1440)}d ago`
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [authed, setAuthed] = useState<boolean | null>(null)
  const validTabs: Tab[] = ['stats', 'verify', 'users', 'posts', 'tickets', 'warnings']
  const tabParam = searchParams.get('tab') as Tab | null
  const [tab, setTabState] = useState<Tab>(validTabs.includes(tabParam as Tab) ? tabParam! : 'stats')

  function setTab(t: Tab) {
    setTabState(t)
    router.replace(`/admin?tab=${t}`, { scroll: false })
  }
  const [stats, setStats] = useState<Stats | null>(null)
  const [verifyRequests, setVerifyRequests] = useState<VerifyRequest[]>([])
  const [users, setUsers] = useState<UserRow[]>([])
  const [posts, setPosts] = useState<PostRow[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [expandedReq, setExpandedReq] = useState<string | null>(null)
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null)
  const [ticketThreads, setTicketThreads] = useState<Record<string, TicketMessage[]>>({})
  const [loadingThread, setLoadingThread] = useState<string | null>(null)
  const [replyDraft, setReplyDraft] = useState('')
  const [replyImage, setReplyImage] = useState<File | null>(null)
  const [replyImagePreview, setReplyImagePreview] = useState<string | null>(null)
  const [replyDragOver, setReplyDragOver] = useState(false)
  const replyFileRef = useRef<HTMLInputElement | null>(null)
  const [warnings, setWarnings] = useState<Warning[]>([])
  const [postSection, setPostSection] = useState<'clean' | 'warned' | 'hidden'>('clean')
  const [postTypeFilter, setPostTypeFilter] = useState<string>('all')
  const [postCategoryFilter, setPostCategoryFilter] = useState<string>('all')

  // Global time range filter
  type RangeMode = { type: 'preset'; days: number; label: string } | { type: 'custom'; from: string; to: string } | { type: 'all' }
  const [timeRange, setTimeRange] = useState<RangeMode>({ type: 'all' })
  const [rangePickerOpen, setRangePickerOpen] = useState(false)
  const [customFrom, setCustomFrom] = useState(new Date().toISOString().slice(0, 10))
  const [customTo, setCustomTo] = useState(new Date().toISOString().slice(0, 10))
  const rangePickerRef = useRef<HTMLDivElement>(null)

  function getRangeSince(range: RangeMode): string | null {
    if (range.type === 'all') return null
    if (range.type === 'custom') return new Date(range.from).toISOString()
    const d = new Date()
    d.setDate(d.getDate() - range.days)
    return d.toISOString()
  }
  function getRangeTo(range: RangeMode): string | null {
    if (range.type === 'custom') return new Date(range.to + 'T23:59:59').toISOString()
    return null
  }
  function rangeLabel(range: RangeMode): string {
    if (range.type === 'all') return 'All time'
    if (range.type === 'preset') return range.label
    return `${range.from} → ${range.to}`
  }

  useEffect(() => {
    function h(e: MouseEvent) { if (rangePickerRef.current && !rangePickerRef.current.contains(e.target as Node)) setRangePickerOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // Revoke modal state
  const REVOKE_REASONS = [
    'Misrepresentation of credentials',
    'No longer a practicing professional',
    'Violation of community guidelines',
    'Fraudulent documentation submitted',
    'Account transferred or compromised',
    'Request by the user',
  ]
  const [revokeModal, setRevokeModal] = useState<UserRow | null>(null)
  const [revokeReason, setRevokeReason] = useState('')
  const [revokeNote, setRevokeNote] = useState('')
  const [revokeLoading, setRevokeLoading] = useState(false)

  async function submitRevoke() {
    if (!revokeModal || !revokeReason) return
    setRevokeLoading(true)
    const { error } = await supabase.rpc('admin_toggle_verified', { p_user_id: revokeModal.id, p_is_verified: false })
    if (error) { console.error('[submitRevoke]', error.message); setRevokeLoading(false); return }
    const { data: { user: adminUser } } = await supabase.auth.getUser()
    if (adminUser) {
      const msg = revokeNote.trim()
        ? `We're sorry, but your professional verification has been revoked. Reason: ${revokeReason} — ${revokeNote.trim()}`
        : `We're sorry, but your professional verification has been revoked. Reason: ${revokeReason}`
      createNotification({ userId: revokeModal.id, actorId: adminUser.id, type: 'verify_revoked', message: msg, skipSelfCheck: true })
    }
    setUsers(prev => prev.map(u => u.id === revokeModal.id ? { ...u, is_verified: false } : u))
    setStats(s => s ? { ...s, verifiedUsers: Math.max(0, s.verifiedUsers - 1) } : s)
    setRevokeModal(null); setRevokeReason(''); setRevokeNote(''); setRevokeLoading(false)
  }

  // Delete/warn modal state
  type ModalMode = 'delete' | 'warn'
  const DELETE_REASONS = [
    'Violates community guidelines',
    'Spam or misleading content',
    'Inappropriate or offensive content',
    'Off-topic or irrelevant',
    'Copyright infringement',
    'Misinformation',
  ]
  const WARN_REASONS = [
    'Post content is too sensitive',
    'Language or tone is inappropriate',
    'Unverified claims or speculation',
    'Borderline guideline violation',
    'Repeated minor violations',
  ]
  const [actionModal, setActionModal] = useState<{ post: PostRow; mode: ModalMode } | null>(null)
  const [actionReason, setActionReason] = useState('')
  const [actionNote, setActionNote] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Load thread when ticket is expanded
  useEffect(() => {
    if (!expandedTicket || ticketThreads[expandedTicket]) return
    setLoadingThread(expandedTicket)
    supabase.from('ticket_messages').select('*').eq('ticket_id', expandedTicket)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setTicketThreads(prev => ({ ...prev, [expandedTicket]: (data as TicketMessage[]) ?? [] }))
        setLoadingThread(null)
      })
  }, [expandedTicket])

  // Ctrl+V paste — scoped to the currently expanded ticket
  useEffect(() => {
    if (!expandedTicket) return
    function onPaste(e: ClipboardEvent) {
      if (replyImage) return
      const item = Array.from(e.clipboardData?.items ?? []).find(i => i.type.startsWith('image/'))
      if (!item) return
      const f = item.getAsFile()
      if (!f) return
      setReplyImage(f)
      setReplyImagePreview(URL.createObjectURL(f))
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [expandedTicket])

  // Auth gate
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || user.email !== ADMIN_EMAIL) {
        router.replace('/')
      } else {
        setAuthed(true)
      }
    })
  }, [router])

  useEffect(() => {
    if (!authed) return
    loadStats()
    loadVerifyRequests()
    loadCharts()
  }, [authed])

  useEffect(() => {
    if (!authed) return
    if (tab === 'verify') loadVerifyRequests()
    if (tab === 'users') loadUsers()
    if (tab === 'posts') { loadPosts(); loadWarnings() }
    if (tab === 'tickets') loadTickets()
    if (tab === 'warnings') loadWarnings()
  }, [tab, authed, timeRange])

  async function loadStats() {
    const todayStart = new Date(); todayStart.setHours(0,0,0,0)
    const [{ count: users }, { count: posts }, { count: pending }, { count: verified }, { count: todayViews }, { count: totalViews }] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('posts').select('*', { count: 'exact', head: true }),
      supabase.from('verify_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_verified', true),
      supabase.from('page_views').select('*', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
      supabase.from('page_views').select('*', { count: 'exact', head: true }),
    ])
    setStats({ users: users ?? 0, posts: posts ?? 0, pendingVerify: pending ?? 0, verifiedUsers: verified ?? 0, todayViews: todayViews ?? 0, totalViews: totalViews ?? 0 })
  }

  async function loadCharts() {
    const since = new Date(); since.setDate(since.getDate() - 29); since.setHours(0,0,0,0)

    const [{ data: viewRows }, { data: userRows }, { data: postRows }] = await Promise.all([
      supabase.from('page_views').select('created_at').gte('created_at', since.toISOString()),
      supabase.from('profiles').select('created_at').gte('created_at', since.toISOString()),
      supabase.from('posts').select('created_at').gte('created_at', since.toISOString()),
    ])

    function toDayCounts(rows: { created_at: string }[] | null): DayCount[] {
      const map: Record<string, number> = {}
      for (let i = 29; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0)
        map[d.toISOString().slice(0, 10)] = 0
      }
      for (const r of rows ?? []) {
        const key = r.created_at.slice(0, 10)
        if (key in map) map[key]++
      }
      return Object.entries(map).map(([date, count]) => ({ date, count }))
    }

    setChartData({
      views30: toDayCounts(viewRows),
      users30: toDayCounts(userRows),
      posts30: toDayCounts(postRows),
    })
  }

  async function loadVerifyRequests() {
    const { data } = await applyRange(supabase
      .from('verify_requests')
      .select('*, profiles!verify_requests_user_id_fkey(pending_specializations)')
      .neq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(100))
    const rows = ((data as any[]) ?? []).map(r => ({
      ...r,
      specializations: r.profiles?.pending_specializations ?? null,
      profiles: undefined,
    }))
    setVerifyRequests(rows as VerifyRequest[])
  }

  function applyRange(q: any) {
    const since = getRangeSince(timeRange)
    const to = getRangeTo(timeRange)
    if (since) q = q.gte('created_at', since)
    if (to) q = q.lte('created_at', to)
    return q
  }

  async function loadUsers() {
    setLoading(true)
    const { data } = await applyRange(supabase.from('profiles').select('id,username,display_name,full_name,profession,is_verified,avatar_color,created_at').order('created_at', { ascending: false }).limit(200))
    setUsers((data as UserRow[]) ?? [])
    setLoading(false)
  }

  async function loadPosts() {
    setLoading(true)
    const { data, error } = await applyRange(supabase.from('posts').select('id,user_id,post_type,body,visibility,category,is_question,created_at,profiles!posts_user_id_fkey(username,display_name,full_name)').order('created_at', { ascending: false }).limit(200))
    if (error) console.error('[Admin] loadPosts error:', error.message)
    setPosts((data as unknown as PostRow[]) ?? [])
    setLoading(false)
  }

  async function loadWarnings() {
    setLoading(true)
    const { data, error } = await applyRange(supabase.from('user_warnings').select('*, profiles:user_id(username, display_name)').order('created_at', { ascending: false }).limit(200))
    if (error) console.error('[Admin] loadWarnings error:', error.message)
    setWarnings((data as unknown as Warning[]) ?? [])
    setLoading(false)
  }

  async function loadTickets() {
    setLoading(true)
    const { data, error } = await applyRange(supabase.from('support_tickets').select('*').order('created_at', { ascending: false }).limit(200))
    if (error) console.error('[Admin] loadTickets error:', error.message, error.code)
    setTickets((data as Ticket[]) ?? [])
    setLoading(false)
  }

  async function updateTicketStatus(id: string, status: Ticket['status']) {
    await supabase.from('support_tickets').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t))
  }

  async function sendReply(ticketId: string) {
    const body = replyDraft.trim()
    if (!body && !replyImage) return

    let image_url: string | null = null
    if (replyImage) {
      const path = `ticket-attachments/admin-replies/${ticketId}-${Date.now()}-${replyImage.name}`
      const { error: upErr } = await supabase.storage.from('ticket-attachments').upload(path, replyImage)
      if (!upErr) {
        const { data } = supabase.storage.from('ticket-attachments').getPublicUrl(path)
        image_url = data.publicUrl
      }
    }

    const { data: newMsg, error } = await supabase
      .from('ticket_messages')
      .insert({ ticket_id: ticketId, sender: 'admin', body: body || null, image_url })
      .select().single()

    await supabase.from('support_tickets').update({ status: 'in_progress' }).eq('id', ticketId)
    await supabase.rpc('touch_ticket', { p_ticket_id: ticketId })

    if (error || !newMsg) return
    const serverTime = (newMsg as any).created_at
    setTicketThreads(prev => ({ ...prev, [ticketId]: [...(prev[ticketId] ?? []), newMsg as TicketMessage] }))
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'in_progress', updated_at: serverTime } : t))
    setReplyDraft('')
    setReplyImage(null)
    setReplyImagePreview(null)
  }

  async function approveVerify(req: VerifyRequest) {
    // Fetch pending profession/specs and promote them on approval
    const { data: prof } = await supabase
      .from('profiles')
      .select('pending_profession, pending_specializations')
      .eq('id', req.user_id)
      .single()

    const profileUpdate: any = { is_verified: true, pending_profession: null, pending_specializations: null }
    if (prof?.pending_profession) profileUpdate.profession = prof.pending_profession
    if (prof?.pending_specializations) profileUpdate.specializations = prof.pending_specializations

    const { error: profErr } = await supabase.rpc('admin_approve_verify', {
      p_user_id: req.user_id,
      p_profession: prof?.pending_profession ?? null,
      p_specializations: prof?.pending_specializations ?? null,
    })
    if (profErr) { console.error('[approveVerify] rpc error:', profErr.message); return }
    const { data: { user: adminUser } } = await supabase.auth.getUser()
    if (adminUser) {
      createNotification({ userId: req.user_id, actorId: adminUser.id, type: 'verify_approved', message: 'Your professional verification was approved! Your profession badge is now visible on your posts.', skipSelfCheck: true })
    }
    const removedCount = verifyRequests.filter(r => r.user_id === req.user_id).length
    setVerifyRequests(prev => prev.filter(r => r.user_id !== req.user_id))
    setUsers(prev => prev.map(u => u.id === req.user_id ? { ...u, is_verified: true } : u))
    setStats(s => s ? { ...s, verifiedUsers: s.verifiedUsers + 1, pendingVerify: Math.max(0, s.pendingVerify - removedCount) } : s)
  }

  async function rejectVerify(req: VerifyRequest) {
    await supabase.from('verify_requests').update({ status: 'rejected' }).eq('id', req.id)
    const { data: { user: adminUser } } = await supabase.auth.getUser()
    if (adminUser) {
      createNotification({ userId: req.user_id, actorId: adminUser.id, type: 'verify_rejected', message: 'Your verification request was reviewed but could not be approved at this time. You may resubmit with additional documentation.', skipSelfCheck: true })
    }
    setVerifyRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'rejected' } : r))
    setStats(s => s ? { ...s, pendingVerify: Math.max(0, s.pendingVerify - 1) } : s)
  }

  async function toggleVerified(user: UserRow) {
    if (user.is_verified) {
      // Revoking — show modal for reason
      setRevokeModal(user); setRevokeReason(''); setRevokeNote('')
      return
    }
    // Granting — instant, no reason needed
    const { error } = await supabase.rpc('admin_toggle_verified', { p_user_id: user.id, p_is_verified: true })
    if (error) { console.error('[toggleVerified]', error.message); return }
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_verified: true } : u))
    setStats(s => s ? { ...s, verifiedUsers: s.verifiedUsers + 1 } : s)
  }

  async function submitAction() {
    if (!actionModal || !actionReason) return
    setActionLoading(true)
    const { post, mode } = actionModal
    console.log('[submitAction] start', { mode, postId: post.id })
    const { data: { user: adminUser } } = await supabase.auth.getUser()
    if (!adminUser) { setActionLoading(false); return }

    // Record warning — expires in 14 days
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    const { error: warnErr } = await supabase.from('user_warnings').insert({
      user_id: post.user_id,
      post_id: post.id,
      type: mode,
      reason: actionReason,
      custom_note: actionNote.trim() || null,
      admin_id: adminUser.id,
      expires_at: expiresAt,
    })
    if (warnErr) console.error('[submitAction] warning insert error:', warnErr.message)

    // Warn: limit post reach (warn_limited visibility — still visible but flagged)
    if (mode === 'warn') {
      const { error: warnPostErr } = await supabase.rpc('admin_warn_post', { p_post_id: post.id })
      if (warnPostErr) console.error('[warn_post] error:', warnPostErr.message)
      else setPosts(prev => prev.map(p => p.id === post.id ? { ...p, visibility: 'warn_limited' } : p))
    }

    // Hide & warn: hide from public entirely (admin_hidden visibility)
    if (mode === 'delete') {
      const { error: hideErr } = await supabase.rpc('admin_hide_post', { p_post_id: post.id })
      console.log('[hide_post] rpc result:', hideErr)
      if (hideErr) console.error('[hide_post] error:', hideErr.message)
      else setPosts(prev => prev.map(p => p.id === post.id ? { ...p, visibility: 'admin_hidden' } : p))
    }

    // Send notification to user
    const notifMessage = actionNote.trim()
      ? `${actionReason} — ${actionNote.trim()}`
      : actionReason
    await createNotification({
      userId: post.user_id,
      actorId: adminUser.id,
      type: mode === 'delete' ? 'post_deleted' : 'post_warned',
      postId: post.id,
      message: notifMessage,
      skipSelfCheck: true,
    })

    // Check active (non-expired) warn count → auto-ban if >= 3
    const { count } = await supabase
      .from('user_warnings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', post.user_id)
      .gt('expires_at', new Date().toISOString())
    if ((count ?? 0) >= 3) {
      await supabase.from('profiles').update({ is_banned: true }).eq('id', post.user_id)
    }

    // Optimistically add to warnings so the row mark appears immediately
    setWarnings(prev => [{
      id: crypto.randomUUID(),
      user_id: post.user_id,
      post_id: post.id,
      type: mode,
      reason: actionReason,
      custom_note: actionNote.trim() || null,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      profiles: post.profiles ? { username: post.profiles.username, display_name: post.profiles.display_name } : null,
    } as Warning, ...prev])

    setActionModal(null)
    setActionReason('')
    setActionNote('')
    setActionLoading(false)
  }

  async function unwarn(warningId: string, userId: string) {
    // Expire immediately (set expires_at to now) rather than deleting — preserves history
    const now = new Date().toISOString()
    await supabase.from('user_warnings').update({ expires_at: now }).eq('id', warningId)
    setWarnings(prev => prev.map(w => w.id === warningId ? { ...w, expires_at: now } : w))
    // Unban if active warnings drop below 3
    const remaining = warnings.filter(w => w.id !== warningId && w.user_id === userId && new Date(w.expires_at) > new Date())
    if (remaining.length < 3) {
      await supabase.from('profiles').update({ is_banned: false }).eq('id', userId)
    }
  }

  if (authed === null) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#64748b', fontSize: 15 }}>Checking access…</div>
      </div>
    )
  }

  const filteredUsers = users.filter(u =>
    !userSearch || u.username?.includes(userSearch.toLowerCase()) ||
    (u.display_name ?? '').toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.profession ?? '').toLowerCase().includes(userSearch.toLowerCase())
  )

  const pending = verifyRequests.filter(r => r.status === 'pending')
  const reviewed = verifyRequests.filter(r => r.status !== 'pending')

  // Map each request id → its ordinal submission number for that user (1st, 2nd, 3rd…)
  const reqOrdinal: Record<string, number> = {}
  const userSubmitCount: Record<string, number> = {}
  const sortedAsc = [...verifyRequests].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  for (const r of sortedAsc) {
    userSubmitCount[r.user_id] = (userSubmitCount[r.user_id] ?? 0) + 1
    reqOrdinal[r.id] = userSubmitCount[r.user_id]
  }

  const openTicketsCount = tickets.filter(t => t.status === 'open').length

  const TABS: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'stats',    label: 'Overview',        icon: <BarChart3 size={16} /> },
    { id: 'verify',   label: 'Verify Requests', icon: <ShieldCheck size={16} />, badge: stats?.pendingVerify },
    { id: 'users',    label: 'Users',           icon: <Users size={16} /> },
    { id: 'posts',    label: 'Posts',           icon: <FileText size={16} /> },
    { id: 'tickets',  label: 'Tickets',         icon: <MessageSquarePlus size={16} />, badge: openTicketsCount || undefined },
    { id: 'warnings', label: 'Warnings',        icon: <AlertTriangle size={16} /> },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', fontFamily: 'inherit' }}>

      {/* Top bar */}
      <div style={{ background: '#1e293b', borderBottom: '1px solid #334155', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/logo.png" alt="Civil Base" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} />
          <span style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9' }}>Civil Base Admin</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', background: '#0f172a', borderRadius: 6, padding: '2px 8px', border: '1px solid #334155' }}>Internal</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/" style={{ fontSize: 13, color: '#64748b', textDecoration: 'none' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
            onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}>
            ← Back to app
          </a>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1px solid #334155', background: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 56px)' }}>

        {/* Sidebar */}
        <div style={{ width: 220, background: '#1e293b', borderRight: '1px solid #334155', padding: '16px 12px', flexShrink: 0 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', borderRadius: 8, border: 'none', background: tab === t.id ? '#3b82f620' : 'none', color: tab === t.id ? '#60a5fa' : '#94a3b8', fontSize: 14, fontWeight: tab === t.id ? 700 : 400, cursor: 'pointer', marginBottom: 2, textAlign: 'left' as const, position: 'relative' }}
              onMouseEnter={e => { if (tab !== t.id) e.currentTarget.style.background = '#ffffff08' }}
              onMouseLeave={e => { if (tab !== t.id) e.currentTarget.style.background = 'none' }}>
              {t.icon}
              {t.label}
              {!!t.badge && (
                <span style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', borderRadius: 20, fontSize: 10, fontWeight: 800, padding: '1px 6px', minWidth: 18, textAlign: 'center' as const }}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: 24, overflowY: 'auto' }}>

          {/* ── REVOKE MODAL ── */}
          {revokeModal && (
            <div onClick={() => { setRevokeModal(null); setRevokeReason(''); setRevokeNote('') }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
              <div onClick={e => e.stopPropagation()}
                style={{ background: '#1e293b', borderRadius: 14, border: '1px solid #334155', width: '100%', maxWidth: 480, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <BadgeCheck size={16} color="#f87171" />
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9' }}>Revoke verification</span>
                </div>
                <div style={{ padding: '8px 20px', background: '#ef444415', borderBottom: '1px solid #334155' }}>
                  <span style={{ fontSize: 12, color: '#f87171' }}>⚠ This will remove the verified badge from <strong>{revokeModal.display_name || revokeModal.username}</strong> and notify them.</span>
                </div>
                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>Reason * <span style={{ fontWeight: 400, color: '#475569' }}>(select or type your own)</span></div>
                    <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginBottom: 8 }}>
                      {REVOKE_REASONS.map(r => (
                        <button key={r} onClick={() => setRevokeReason(r)}
                          style={{ padding: '4px 10px', borderRadius: 20, border: `1px solid ${revokeReason === r ? '#ef4444' : '#334155'}`, background: revokeReason === r ? '#ef444420' : 'none', color: revokeReason === r ? '#f87171' : '#64748b', fontSize: 11, cursor: 'pointer', fontWeight: revokeReason === r ? 700 : 400 }}>
                          {r}
                        </button>
                      ))}
                    </div>
                    <input value={revokeReason} onChange={e => setRevokeReason(e.target.value)}
                      placeholder="Or type a custom reason…"
                      style={{ width: '100%', padding: '8px 10px', background: '#0f172a', border: `1px solid ${revokeReason ? '#334155' : '#ef444460'}`, borderRadius: 8, color: revokeReason ? '#e2e8f0' : '#64748b', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>Additional note <span style={{ fontWeight: 400, color: '#475569' }}>(optional)</span></div>
                    <textarea value={revokeNote} onChange={e => setRevokeNote(e.target.value)}
                      placeholder="Add more context for the user…"
                      rows={3}
                      style={{ width: '100%', padding: '8px 10px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', fontSize: 13, outline: 'none', resize: 'vertical' as const, fontFamily: 'inherit', boxSizing: 'border-box' as const }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => { setRevokeModal(null); setRevokeReason(''); setRevokeNote('') }}
                      style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid #334155', background: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>
                      Cancel
                    </button>
                    <button onClick={submitRevoke} disabled={!revokeReason || revokeLoading}
                      style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: revokeReason ? '#ef4444' : '#7f1d1d', color: '#fff', fontSize: 13, fontWeight: 700, cursor: revokeReason ? 'pointer' : 'default', opacity: revokeReason ? 1 : 0.5 }}>
                      {revokeLoading ? 'Revoking…' : 'Revoke & notify'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TIME RANGE FILTER ── */}
          {tab !== 'stats' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase' as const, letterSpacing: 0.8 }}>Period:</span>
              <div ref={rangePickerRef} style={{ position: 'relative' as const }}>
                <button onClick={() => setRangePickerOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' as const }}>
                  <Calendar size={13} color="#64748b" />
                  {rangeLabel(timeRange)}
                  <ChevronDown size={14} color="#64748b" style={{ transform: rangePickerOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
                </button>
                {rangePickerOpen && (
                  <div style={{ position: 'absolute' as const, top: 'calc(100% + 6px)', left: 0, zIndex: 60, background: '#1e293b', border: '1px solid #334155', borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', width: 240, overflow: 'hidden' }}>
                    <div style={{ padding: '6px 0' }}>
                      <button onClick={() => { setTimeRange({ type: 'all' }); setRangePickerOpen(false) }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '9px 14px', border: 'none', background: timeRange.type === 'all' ? '#3b82f610' : 'none', color: timeRange.type === 'all' ? '#60a5fa' : '#e2e8f0', fontSize: 13, fontWeight: 700, cursor: 'pointer', textAlign: 'left' as const }}
                        onMouseEnter={e => { if (timeRange.type !== 'all') e.currentTarget.style.background = '#ffffff08' }}
                        onMouseLeave={e => { if (timeRange.type !== 'all') e.currentTarget.style.background = 'none' }}>
                        All time {timeRange.type === 'all' && <Check size={13} color="#60a5fa" />}
                      </button>
                      <div style={{ height: 1, background: '#334155', margin: '4px 0' }} />
                      {[
                        { days: 7, label: 'Last 7 days' }, { days: 14, label: 'Last 14 days' },
                        { days: 30, label: 'Last 30 days' }, { days: 90, label: 'Last 90 days' },
                        { days: 180, label: 'Last 180 days' }, { days: 365, label: 'Last year' },
                      ].map(p => {
                        const active = timeRange.type === 'preset' && timeRange.days === p.days
                        return (
                          <button key={p.days} onClick={() => { setTimeRange({ type: 'preset', days: p.days, label: p.label }); setRangePickerOpen(false) }}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '8px 14px', border: 'none', background: active ? '#3b82f610' : 'none', color: active ? '#60a5fa' : '#e2e8f0', fontSize: 13, cursor: 'pointer', textAlign: 'left' as const }}
                            onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#ffffff08' }}
                            onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'none' }}>
                            {p.label} {active && <Check size={13} color="#60a5fa" />}
                          </button>
                        )
                      })}
                    </div>
                    <div style={{ borderTop: '1px solid #334155', padding: '12px 14px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: 0.8, marginBottom: 8 }}>Custom range</div>
                      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                        <div>
                          <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>From</label>
                          <input type="date" value={customFrom} max={customTo} onChange={e => setCustomFrom(e.target.value)}
                            style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', fontSize: 13, outline: 'none', colorScheme: 'dark', boxSizing: 'border-box' as const }} />
                        </div>
                        <div>
                          <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>To</label>
                          <input type="date" value={customTo} min={customFrom} max={new Date().toISOString().slice(0,10)} onChange={e => setCustomTo(e.target.value)}
                            style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0', fontSize: 13, outline: 'none', colorScheme: 'dark', boxSizing: 'border-box' as const }} />
                        </div>
                        <button onClick={() => { if (customFrom && customTo && customFrom <= customTo) { setTimeRange({ type: 'custom', from: customFrom, to: customTo }); setRangePickerOpen(false) } }}
                          disabled={!customFrom || !customTo || customFrom > customTo}
                          style={{ padding: '7px 0', borderRadius: 7, border: 'none', background: customFrom && customTo && customFrom <= customTo ? '#3b82f6' : '#334155', color: customFrom && customTo && customFrom <= customTo ? '#fff' : '#64748b', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── OVERVIEW ── */}
          {tab === 'stats' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9' }}>Overview</div>

              {/* Community stats with range selector */}
              <CommunityStats />

              {/* Extra admin-only cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {[
                  { label: 'Pending verify', value: stats?.pendingVerify, color: '#ef4444' },
                  { label: 'Visits today',   value: stats?.todayViews,   color: '#3b82f6' },
                  { label: 'Total visits',   value: stats?.totalViews,   color: '#8b5cf6' },
                ].map(card => (
                  <div key={card.label} style={{ background: '#1e293b', borderRadius: 10, border: '1px solid #334155', padding: '14px 16px' }}>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: 0.5 }}>{card.label}</div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: card.color }}>{card.value ?? '—'}</div>
                  </div>
                ))}
              </div>


              {/* Quick pending verify list */}
              {pending.length > 0 && (
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9', marginBottom: 12 }}>Pending verifications</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {pending.slice(0, 5).map(req => (
                      <div key={req.id} style={{ background: '#1e293b', border: '1px solid #f59e0b40', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontWeight: 700, color: '#f1f5f9' }}>{req.display_name || req.username}</span>
                          <span style={{ color: '#64748b', fontSize: 13 }}> · @{req.username} · {req.profession}</span>
                        </div>
                        <span style={{ fontSize: 11, color: '#64748b' }}>{timeAgo(req.created_at)}</span>
                        <button onClick={() => setTab('verify')} style={{ fontSize: 12, color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Review →</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── VERIFY REQUESTS ── */}
          {tab === 'verify' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9' }}>Verify Requests</div>
                <button onClick={loadVerifyRequests} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid #334155', background: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>
                  <RefreshCw size={13} /> Refresh
                </button>
              </div>

              {pending.length === 0 && reviewed.length === 0 && (
                <div style={{ color: '#64748b', fontSize: 14, textAlign: 'center' as const, padding: '40px 0' }}>No requests yet.</div>
              )}

              {pending.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 10 }}>
                    Pending ({pending.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {pending.map(req => (
                      <VerifyCard key={req.id} req={req} ordinal={reqOrdinal[req.id] ?? 1} expanded={expandedReq === req.id}
                        onToggle={() => setExpandedReq(expandedReq === req.id ? null : req.id)}
                        onApprove={() => approveVerify(req)} onReject={() => rejectVerify(req)} />
                    ))}
                  </div>
                </div>
              )}

              {reviewed.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 10 }}>
                    Reviewed ({reviewed.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {reviewed.map(req => (
                      <VerifyCard key={req.id} req={req} ordinal={reqOrdinal[req.id] ?? 1} expanded={expandedReq === req.id}
                        onToggle={() => setExpandedReq(expandedReq === req.id ? null : req.id)}
                        onApprove={() => approveVerify(req)} onReject={() => rejectVerify(req)} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── USERS ── */}
          {tab === 'users' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9' }}>Users</div>
                <button onClick={loadUsers} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid #334155', background: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>
                  <RefreshCw size={13} /> Refresh
                </button>
              </div>

              {/* Search */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px', maxWidth: 360 }}>
                <Search size={14} color="#64748b" />
                <input value={userSearch} onChange={e => setUserSearch(e.target.value)}
                  placeholder="Search by username, name, profession…"
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#e2e8f0', fontSize: 13 }} />
              </div>

              {loading ? (
                <div style={{ color: '#64748b', fontSize: 14, padding: '40px 0', textAlign: 'center' as const }}>Loading…</div>
              ) : (() => {
                const verifiedUsers = filteredUsers.filter(u => u.is_verified)

                const UserTableRow = ({ u, i, showRevoke }: { u: UserRow; i: number; showRevoke: boolean }) => (
                  <tr key={u.id} style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none', background: 'transparent' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = '#ffffff05' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: AVATAR_COLORS[u.avatar_color ?? 0], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                          {(u.display_name || u.username || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{u.display_name || u.full_name || u.username}</span>
                            {u.is_verified && <BadgeCheck size={14} color="#3b82f6" fill="#3b82f6" strokeWidth={0} style={{ flexShrink: 0 }} />}
                          </div>
                          <a href={`/u/${u.username}`} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: 11, color: '#64748b', textDecoration: 'none' }}>@{u.username}</a>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 13, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{u.profession || <span style={{ color: '#475569' }}>—</span>}</td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' as const }}>{timeAgo(u.created_at)}</td>
                    <td style={{ padding: '10px 16px' }}>
                      {showRevoke ? (
                        <button onClick={() => toggleVerified(u)}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, border: '1px solid #ef444440', background: '#ef444410', color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          <X size={12} /> Revoke
                        </button>
                      ) : (
                        <button onClick={() => toggleVerified(u)}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, border: '1px solid #334155', background: 'none', color: '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          Grant
                        </button>
                      )}
                    </td>
                  </tr>
                )

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Verified section */}
                    {verifiedUsers.length > 0 && (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                          <BadgeCheck size={15} color="#3b82f6" fill="#3b82f6" strokeWidth={0} />
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase' as const, letterSpacing: 1 }}>
                            Verified Professionals ({verifiedUsers.length})
                          </span>
                        </div>
                        <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #3b82f630', overflow: 'hidden' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse' as const, tableLayout: 'fixed' as const }}>
                            <colgroup><col style={{ width: '40%' }} /><col style={{ width: '30%' }} /><col style={{ width: '15%' }} /><col style={{ width: '15%' }} /></colgroup>
                            <thead>
                              <tr style={{ background: '#0f172a' }}>
                                {['User', 'Profession', 'Joined', 'Action'].map(h => (
                                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left' as const, fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: 0.8 }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {verifiedUsers.map((u, i) => <UserTableRow key={u.id} u={u} i={i} showRevoke={true} />)}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* All users section */}
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: 1, marginBottom: 10 }}>
                        All Users ({filteredUsers.length})
                      </div>
                      <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' as const, tableLayout: 'fixed' as const }}>
                          <colgroup><col style={{ width: '40%' }} /><col style={{ width: '30%' }} /><col style={{ width: '15%' }} /><col style={{ width: '15%' }} /></colgroup>
                          <thead>
                            <tr style={{ background: '#0f172a' }}>
                              {['User', 'Profession', 'Joined', 'Action'].map(h => (
                                <th key={h} style={{ padding: '10px 16px', textAlign: 'left' as const, fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: 0.8 }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {filteredUsers.map((u, i) => <UserTableRow key={u.id} u={u} i={i} showRevoke={u.is_verified} />)}
                          </tbody>
                        </table>
                        {filteredUsers.length === 0 && (
                          <div style={{ padding: '40px', textAlign: 'center' as const, color: '#64748b', fontSize: 14 }}>No users found.</div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          {/* ── POSTS ── */}
          {tab === 'posts' && (
            <div>
              {/* Action modal */}
              {actionModal && (() => {
                const { post, mode } = actionModal
                const reasons = mode === 'delete' ? DELETE_REASONS : WARN_REASONS
                const isDelete = mode === 'delete'
                return (
                  <div onClick={() => { setActionModal(null); setActionReason(''); setActionNote('') }}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                    <div onClick={e => e.stopPropagation()}
                      style={{ background: '#1e293b', borderRadius: 14, border: '1px solid #334155', width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 0, overflow: 'hidden' }}>
                      {/* Header */}
                      <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: 10 }}>
                        {isDelete
                          ? <AlertTriangle size={16} color="#f87171" />
                          : <AlertTriangle size={16} color="#fbbf24" />}
                        <span style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9' }}>
                          {isDelete ? 'Hide post & warn user' : 'Warn user'}
                        </span>
                      </div>
                      {isDelete && (
                        <div style={{ padding: '8px 20px', background: '#ef444415', borderBottom: '1px solid #334155' }}>
                          <span style={{ fontSize: 12, color: '#f87171' }}>⚠ The post will be set to private — only the author and admins can see it.</span>
                        </div>
                      )}
                      {/* Post preview */}
                      <div style={{ padding: '12px 20px', borderBottom: '1px solid #0f172a', background: '#0f172a40' }}>
                        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>@{post.profiles?.username}</div>
                        <div style={{ fontSize: 13, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                          {post.body || '[no text]'}
                        </div>
                      </div>
                      {/* Reason */}
                      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>Reason * <span style={{ fontWeight: 400, color: '#475569' }}>(select or type your own)</span></div>
                          {/* Quick-pick presets */}
                          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginBottom: 8 }}>
                            {reasons.map(r => (
                              <button key={r} onClick={() => setActionReason(r)}
                                style={{ padding: '4px 10px', borderRadius: 20, border: `1px solid ${actionReason === r ? (isDelete ? '#ef4444' : '#f59e0b') : '#334155'}`, background: actionReason === r ? (isDelete ? '#ef444420' : '#f59e0b20') : 'none', color: actionReason === r ? (isDelete ? '#f87171' : '#fbbf24') : '#64748b', fontSize: 11, cursor: 'pointer', fontWeight: actionReason === r ? 700 : 400 }}>
                                {r}
                              </button>
                            ))}
                          </div>
                          {/* Free-text input */}
                          <input value={actionReason} onChange={e => setActionReason(e.target.value)}
                            placeholder="Or type a custom reason…"
                            style={{ width: '100%', padding: '8px 10px', background: '#0f172a', border: `1px solid ${actionReason ? '#334155' : '#ef444460'}`, borderRadius: 8, color: actionReason ? '#e2e8f0' : '#64748b', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>Additional note (optional)</div>
                          <textarea value={actionNote} onChange={e => setActionNote(e.target.value)}
                            placeholder="Add more context for the user…"
                            rows={3}
                            style={{ width: '100%', padding: '8px 10px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', fontSize: 13, outline: 'none', resize: 'vertical' as const, fontFamily: 'inherit', boxSizing: 'border-box' as const }} />
                        </div>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button onClick={() => { setActionModal(null); setActionReason(''); setActionNote('') }}
                            style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid #334155', background: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>
                            Cancel
                          </button>
                          <button onClick={submitAction} disabled={!actionReason || actionLoading}
                            style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: isDelete ? (actionReason ? '#ef4444' : '#7f1d1d') : (actionReason ? '#f59e0b' : '#78350f'), color: '#fff', fontSize: 13, fontWeight: 700, cursor: actionReason ? 'pointer' : 'default', opacity: actionReason ? 1 : 0.5 }}>
                            {actionLoading ? 'Processing…' : isDelete ? 'Hide post & notify' : 'Warn user'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })()}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9' }}>Posts</div>
                <button onClick={loadPosts} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid #334155', background: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>
                  <RefreshCw size={13} /> Refresh
                </button>
              </div>
              {/* Section pills */}
              {!loading && (() => {
                const cleanCount = posts.filter(p => p.visibility !== 'admin_hidden' && p.visibility !== 'warn_limited').length
                const warnedCount = posts.filter(p => p.visibility === 'warn_limited').length
                const hiddenCount = posts.filter(p => p.visibility === 'admin_hidden').length
                return (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap' as const, gap: 10 }}>
                    {/* Section pills */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                      {([
                        { key: 'clean',   label: 'Clean',   count: cleanCount,   color: '#60a5fa', activeBg: '#3b82f620', activeBorder: '#3b82f660' },
                        { key: 'warned',  label: 'Warned',  count: warnedCount,  color: '#fbbf24', activeBg: '#f59e0b20', activeBorder: '#f59e0b60' },
                        { key: 'hidden',  label: 'Hidden',  count: hiddenCount,  color: '#f87171', activeBg: '#ef444420', activeBorder: '#ef444460' },
                      ] as { key: 'clean'|'warned'|'hidden'; label: string; count: number; color: string; activeBg: string; activeBorder: string }[]).map(s => (
                        <button key={s.key} onClick={() => setPostSection(s.key)}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 20, border: `1px solid ${postSection === s.key ? s.activeBorder : '#334155'}`, background: postSection === s.key ? s.activeBg : 'none', color: postSection === s.key ? s.color : '#64748b', fontSize: 13, fontWeight: postSection === s.key ? 700 : 400, cursor: 'pointer' }}>
                          {s.label}
                          <span style={{ background: postSection === s.key ? s.color : '#334155', color: postSection === s.key ? '#0f172a' : '#94a3b8', borderRadius: 20, fontSize: 11, fontWeight: 800, padding: '1px 7px', minWidth: 20, textAlign: 'center' as const }}>
                            {s.count}
                          </span>
                        </button>
                      ))}
                    </div>
                    {/* Type + Category filters */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <select value={postTypeFilter} onChange={e => setPostTypeFilter(e.target.value)}
                        style={{ padding: '6px 10px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: postTypeFilter !== 'all' ? '#e2e8f0' : '#64748b', fontSize: 12, outline: 'none', cursor: 'pointer' }}>
                        <option value="all">All types</option>
                        <option value="question">Question</option>
                        <option value="discussion">Discussion</option>
                        <option value="text">Text</option>
                        <option value="image">Image</option>
                        <option value="link">Link</option>
                        <option value="reshare">Reshare</option>
                      </select>
                      <select value={postCategoryFilter} onChange={e => setPostCategoryFilter(e.target.value)}
                        style={{ padding: '6px 10px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: postCategoryFilter !== 'all' ? '#e2e8f0' : '#64748b', fontSize: 12, outline: 'none', cursor: 'pointer' }}>
                        <option value="all">All categories</option>
                        <option value="concrete">Concrete</option>
                        <option value="steel">Steel</option>
                        <option value="composite">Composite</option>
                        <option value="geotechnical">Geotechnical</option>
                        <option value="others">Others</option>
                      </select>
                    </div>
                  </div>
                )
              })()}
              {loading ? (
                <div style={{ color: '#64748b', fontSize: 14, padding: '40px 0', textAlign: 'center' as const }}>Loading…</div>
              ) : (() => {
                const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
                  concrete: { bg: '#37415120', color: '#94a3b8' }, steel: { bg: '#1d4ed820', color: '#93c5fd' },
                  composite: { bg: '#6d28d920', color: '#c4b5fd' }, geotechnical: { bg: '#06543020', color: '#6ee7b7' },
                  others: { bg: '#78350f20', color: '#fcd34d' },
                }
                const cleanPosts = posts.filter(p => p.visibility !== 'admin_hidden' && p.visibility !== 'warn_limited')
                const warnedPosts = posts.filter(p => p.visibility === 'warn_limited')
                const hiddenPosts = posts.filter(p => p.visibility === 'admin_hidden')

                const PostRow = ({ p, i, total }: { p: PostRow; i: number; total: number }) => {
                  const catStyle = p.category ? (CATEGORY_COLORS[p.category] ?? { bg: '#33415520', color: '#94a3b8' }) : null
                  const isHidden = p.visibility === 'admin_hidden'
                  return (
                    <tr key={p.id} style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none', background: 'transparent' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = '#ffffff05' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}>
                      <td style={{ padding: '10px 16px', fontSize: 12, fontWeight: 700, color: '#334155', width: 36 }}>{total - i}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <a href={`/u/${p.profiles?.username}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#60a5fa', textDecoration: 'none', fontWeight: 600 }}>
                          @{p.profiles?.username ?? '—'}
                        </a>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ fontSize: 13, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                          {p.body || <span style={{ color: '#475569', fontStyle: 'italic' }}>[no text]</span>}
                        </div>
                        <a href={`/post/${p.id}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 3, fontSize: 11, color: '#3b82f6', textDecoration: 'none' }}>
                          <Link2 size={10} /> View post
                        </a>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' as const }}>
                            {p.is_question
                              ? <span style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', background: '#4c1d9520', borderRadius: 6, padding: '2px 6px', display: 'flex', alignItems: 'center', gap: 2 }}><HelpCircle size={9} /> Question</span>
                              : <span style={{ fontSize: 10, fontWeight: 700, color: '#60a5fa', background: '#1e3a5f', borderRadius: 6, padding: '2px 6px', display: 'flex', alignItems: 'center', gap: 2 }}><Tag size={9} /> Discussion</span>}
                            <span style={{ fontSize: 10, fontWeight: 600, color: '#64748b', background: '#0f172a', borderRadius: 6, padding: '2px 6px' }}>{p.post_type}</span>
                          </div>
                          {catStyle && p.category && <span style={{ fontSize: 10, fontWeight: 600, color: catStyle.color, background: catStyle.bg, borderRadius: 6, padding: '2px 6px', width: 'fit-content' }}>{p.category}</span>}
                        </div>
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' as const }}>{timeAgo(p.created_at)}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => { setActionModal({ post: p, mode: 'warn' }); setActionReason(''); setActionNote('') }}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, border: '1px solid #f59e0b40', background: 'none', color: '#fbbf24', fontSize: 12, cursor: 'pointer' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#f59e0b15' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                            <AlertTriangle size={12} /> Warn
                          </button>
                          <button onClick={() => { setActionModal({ post: p, mode: 'delete' }); setActionReason(''); setActionNote('') }}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, border: '1px solid #ef444440', background: 'none', color: '#f87171', fontSize: 12, cursor: 'pointer' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#ef444415' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                            <AlertTriangle size={12} /> Hide & warn
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                }

                const PostTable = ({ rows, borderColor }: { rows: PostRow[]; borderColor: string }) => (
                  <div style={{ background: '#1e293b', borderRadius: 12, border: `1px solid ${borderColor}`, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' as const, tableLayout: 'fixed' as const }}>
                      <colgroup><col style={{ width: 36 }} /><col style={{ width: '18%' }} /><col /><col style={{ width: '22%' }} /><col style={{ width: '10%' }} /><col style={{ width: '16%' }} /></colgroup>
                      <thead>
                        <tr style={{ background: '#0f172a' }}>
                          {['#', 'Author', 'Content', 'Type / Category', 'Date', 'Actions'].map(h => (
                            <th key={h} style={{ padding: '10px 16px', textAlign: 'left' as const, fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: 0.8 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>{rows.map((p, i) => <PostRow key={p.id} p={p} i={i} total={rows.length} />)}</tbody>
                    </table>
                    {rows.length === 0 && <div style={{ padding: '32px', textAlign: 'center' as const, color: '#475569', fontSize: 13 }}>No posts.</div>}
                  </div>
                )

                const baseRows = postSection === 'clean' ? cleanPosts : postSection === 'warned' ? warnedPosts : hiddenPosts
                const sectionRows = baseRows.filter(p => {
                  if (postTypeFilter !== 'all') {
                    if (postTypeFilter === 'question' && !p.is_question) return false
                    if (postTypeFilter === 'discussion' && p.is_question) return false
                    if (!['question', 'discussion'].includes(postTypeFilter) && p.post_type !== postTypeFilter) return false
                  }
                  if (postCategoryFilter !== 'all' && p.category !== postCategoryFilter) return false
                  return true
                })
                const sectionBorder = postSection === 'clean' ? '#334155' : postSection === 'warned' ? '#f59e0b40' : '#ef444440'
                return <PostTable rows={sectionRows} borderColor={sectionBorder} />
              })()}
            </div>
          )}

          {/* ── TICKETS ── */}
          {tab === 'tickets' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9' }}>Support Tickets</div>
                <button onClick={loadTickets}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: '1px solid #334155', background: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>
                  <RefreshCw size={13} /> Refresh
                </button>
              </div>

              {/* Status filter summary */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
                {(['open', 'in_progress', 'resolved', 'closed'] as const).map(s => {
                  const count = tickets.filter(t => t.status === s).length
                  const colors: Record<string, string> = { open: '#ef4444', in_progress: '#f59e0b', resolved: '#10b981', closed: '#64748b' }
                  return (
                    <div key={s} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: colors[s], flexShrink: 0, display: 'inline-block' }} />
                      <span style={{ fontSize: 12, color: '#94a3b8', textTransform: 'capitalize' as const }}>{s.replace('_', ' ')}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#f1f5f9' }}>{count}</span>
                    </div>
                  )
                })}
              </div>

              {loading && <div style={{ color: '#64748b', fontSize: 14 }}>Loading…</div>}

              {tickets.map(ticket => {
                const isOpen = expandedTicket === ticket.id
                const statusColors: Record<string, { bg: string; color: string }> = {
                  open:        { bg: '#ef444420', color: '#f87171' },
                  in_progress: { bg: '#f59e0b20', color: '#fbbf24' },
                  resolved:    { bg: '#10b98120', color: '#34d399' },
                  closed:      { bg: '#64748b20', color: '#94a3b8' },
                }
                const sc = statusColors[ticket.status] ?? statusColors.open
                return (
                  <div key={ticket.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, overflow: 'hidden' }}>
                    {/* Ticket header */}
                    <div
                      onClick={() => setExpandedTicket(isOpen ? null : ticket.id)}
                      style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{ticket.title}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: sc.bg, color: sc.color, flexShrink: 0, textTransform: 'capitalize' as const }}>{ticket.status.replace('_', ' ')}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
                          {ticket.display_name && (
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>{ticket.display_name}</span>
                          )}
                          {ticket.email && (
                            <span style={{ fontSize: 12, color: '#475569' }}>{ticket.email}</span>
                          )}
                          {ticket.username && (
                            <a href={`/u/${ticket.username}`} target="_blank" rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, color: '#3b82f6', background: '#1e3a5f', borderRadius: 6, padding: '2px 8px', textDecoration: 'none' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#1e40af' }}
                              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#1e3a5f' }}>
                              <ExternalLink size={10} /> View profile
                            </a>
                          )}
                          <span style={{ fontSize: 11, color: '#475569' }}>· {timeAgo(ticket.updated_at)}</span>
                        </div>
                        {!isOpen && (
                          <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{ticket.message}</div>
                        )}
                      </div>
                      <span style={{ color: '#475569', flexShrink: 0, fontSize: 13 }}>{isOpen ? '▲' : '▼'}</span>
                    </div>

                    {/* Expanded thread */}
                    {isOpen && (
                      <div style={{ borderTop: '1px solid #334155', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>

                        {/* Original message */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#34d399' }}>USER</span>
                            <span style={{ fontSize: 11, color: '#475569' }}>{timeAgo(ticket.created_at)}</span>
                          </div>
                          <div style={{ fontSize: 13, color: '#6ee7b7', lineHeight: 1.7, whiteSpace: 'pre-wrap' as const, background: '#0d2d1a', borderRadius: 8, padding: '10px 12px', border: '1px solid #166534' }}>{ticket.message}</div>
                          {ticket.image_url && (
                            <a href={ticket.image_url} target="_blank" rel="noopener noreferrer">
                              <img src={ticket.image_url} alt="" style={{ maxWidth: '100%', maxHeight: 220, borderRadius: 8, border: '1px solid #166534', display: 'block' }} />
                            </a>
                          )}
                        </div>

                        {/* Thread messages */}
                        {loadingThread === ticket.id ? (
                          <div style={{ color: '#475569', fontSize: 13, textAlign: 'center' as const }}>Loading…</div>
                        ) : (ticketThreads[ticket.id] ?? []).map(msg => {
                          const isAdmin = msg.sender === 'admin'
                          return (
                            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: isAdmin ? '#60a5fa' : '#34d399' }}>{isAdmin ? 'ADMIN' : 'USER'}</span>
                                <span style={{ fontSize: 11, color: '#475569' }}>{timeAgo(msg.created_at)}</span>
                              </div>
                              {msg.body && (
                                <div style={{ fontSize: 13, color: isAdmin ? '#94a3b8' : '#6ee7b7', lineHeight: 1.7, whiteSpace: 'pre-wrap' as const, background: isAdmin ? '#0f172a' : '#0d2d1a', borderRadius: 8, padding: '10px 12px', border: `1px solid ${isAdmin ? '#1e3a5f' : '#166534'}` }}>
                                  {msg.body}
                                </div>
                              )}
                              {msg.image_url && (
                                <a href={msg.image_url} target="_blank" rel="noopener noreferrer">
                                  <img src={msg.image_url} alt="" style={{ maxWidth: '100%', maxHeight: 220, borderRadius: 8, border: `1px solid ${isAdmin ? '#1e3a5f' : '#166534'}`, display: 'block' }} />
                                </a>
                              )}
                            </div>
                          )
                        })}

                        {/* Reply compose */}
                        <div style={{ borderTop: '1px solid #334155', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <textarea
                            value={replyDraft}
                            onChange={e => setReplyDraft(e.target.value)}
                            placeholder="Write a reply to the user… (Ctrl+V to paste image)"
                            rows={3}
                            style={{ width: '100%', padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', fontSize: 13, outline: 'none', resize: 'vertical' as const, fontFamily: 'inherit', boxSizing: 'border-box' as const }}
                          />
                          {replyImagePreview ? (
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                              <img src={replyImagePreview} alt="" style={{ maxWidth: 260, maxHeight: 160, borderRadius: 8, display: 'block', border: '1px solid #334155' }} />
                              <button onClick={() => { setReplyImage(null); setReplyImagePreview(null) }}
                                style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <div onClick={() => replyFileRef.current?.click()}
                              onDragOver={e => { e.preventDefault(); setReplyDragOver(true) }}
                              onDragLeave={() => setReplyDragOver(false)}
                              onDrop={e => {
                                e.preventDefault(); setReplyDragOver(false)
                                const f = e.dataTransfer.files?.[0]
                                if (f?.type.startsWith('image/')) { setReplyImage(f); setReplyImagePreview(URL.createObjectURL(f)) }
                              }}
                              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 16px', border: `2px dashed ${replyDragOver ? '#3b82f6' : '#334155'}`, borderRadius: 8, background: replyDragOver ? '#1e3a5f' : 'transparent', cursor: 'pointer', transition: 'all 0.15s' }}>
                              <ImageIcon size={16} color={replyDragOver ? '#3b82f6' : '#475569'} />
                              <span style={{ fontSize: 12, color: replyDragOver ? '#93c5fd' : '#64748b' }}>Click, drag & drop, or Ctrl+V</span>
                            </div>
                          )}
                          <input type="file" accept="image/*" ref={replyFileRef}
                            onChange={e => { const f = e.target.files?.[0]; if (f?.type.startsWith('image/')) { setReplyImage(f); setReplyImagePreview(URL.createObjectURL(f)) } }}
                            style={{ display: 'none' }} />
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                            <button onClick={() => sendReply(ticket.id)}
                              disabled={!replyDraft.trim() && !replyImage}
                              style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: (replyDraft.trim() || replyImage) ? '#3b82f6' : '#1e293b', color: (replyDraft.trim() || replyImage) ? '#fff' : '#475569', fontSize: 12, fontWeight: 700, cursor: (replyDraft.trim() || replyImage) ? 'pointer' : 'default' }}>
                              Send reply
                            </button>
                            {(['open', 'in_progress', 'resolved', 'closed'] as const).filter(s => s !== ticket.status).map(s => (
                              <button key={s} onClick={() => updateTicketStatus(ticket.id, s)}
                                style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #334155', background: 'none', color: '#94a3b8', fontSize: 12, cursor: 'pointer', textTransform: 'capitalize' as const }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#ffffff08' }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                                → {s.replace('_', ' ')}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {!loading && tickets.length === 0 && (
                <div style={{ padding: '48px', textAlign: 'center' as const, color: '#64748b', fontSize: 14 }}>No tickets yet.</div>
              )}
            </div>
          )}

          {/* ── WARNINGS ── */}
          {tab === 'warnings' && (() => {
            const now = new Date()
            const activeWarnings = warnings.filter(w => new Date(w.expires_at) > now)
            const expiredWarnings = warnings.filter(w => new Date(w.expires_at) <= now)
            // Group active warnings by user
            const byUser: Record<string, Warning[]> = {}
            activeWarnings.forEach(w => { if (!byUser[w.user_id]) byUser[w.user_id] = []; byUser[w.user_id].push(w) })
            const bannedCount = Object.values(byUser).filter(ws => ws.length >= 3).length

            function daysLeft(expires: string) {
              const d = Math.ceil((new Date(expires).getTime() - now.getTime()) / 86400000)
              return d <= 0 ? 'Expires today' : `${d}d left`
            }

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9' }}>Warnings</div>
                  <button onClick={loadWarnings}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: '1px solid #334155', background: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>
                    <RefreshCw size={13} /> Refresh
                  </button>
                </div>

                {/* Summary */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '8px 16px' }}>
                    <span style={{ fontSize: 11, color: '#64748b' }}>Active warnings </span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#fbbf24' }}>{activeWarnings.length}</span>
                  </div>
                  <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '8px 16px' }}>
                    <span style={{ fontSize: 11, color: '#64748b' }}>Banned users (3+) </span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#f87171' }}>{bannedCount}</span>
                  </div>
                  <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '8px 16px' }}>
                    <span style={{ fontSize: 11, color: '#64748b' }}>Expired (cleared) </span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#475569' }}>{expiredWarnings.length}</span>
                  </div>
                </div>

                {loading && <div style={{ color: '#64748b', fontSize: 14 }}>Loading…</div>}
                {!loading && warnings.length === 0 && (
                  <div style={{ padding: '48px', textAlign: 'center' as const, color: '#64748b', fontSize: 14 }}>No warnings issued yet.</div>
                )}

                {/* Per-user warning cards */}
                {Object.entries(byUser).map(([userId, userWarnings]) => {
                  const profile = userWarnings[0].profiles as any
                  const warnCount = userWarnings.length
                  const isBanned = warnCount >= 3
                  return (
                    <div key={userId} style={{ background: '#1e293b', borderRadius: 12, border: `1px solid ${isBanned ? '#ef444440' : '#334155'}`, overflow: 'hidden' }}>
                      {/* User header */}
                      <div style={{ padding: '12px 16px', background: isBanned ? '#ef444408' : '#ffffff03', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #0f172a' }}>
                        <a href={`/u/${profile?.username}`} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 14, fontWeight: 700, color: '#60a5fa', textDecoration: 'none' }}>
                          @{profile?.username ?? userId.slice(0, 8)}
                        </a>
                        {profile?.display_name && <span style={{ fontSize: 13, color: '#64748b' }}>{profile.display_name}</span>}
                        <div style={{ display: 'flex', gap: 4, marginLeft: 4 }}>
                          {[1, 2, 3].map(n => (
                            <div key={n} style={{ width: 10, height: 10, borderRadius: '50%', background: n <= warnCount ? '#f59e0b' : '#334155', border: '1px solid #475569' }} />
                          ))}
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: warnCount >= 3 ? '#f87171' : warnCount >= 2 ? '#fbbf24' : '#94a3b8' }}>
                          {warnCount}/3 warnings{isBanned ? ' — BANNED' : ''}
                        </span>
                      </div>
                      {/* Warning rows */}
                      <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                        <thead>
                          <tr style={{ background: '#0f172a' }}>
                            {['Type', 'Reason', 'Note', 'Post', 'Issued', 'Expires', ''].map(h => (
                              <th key={h} style={{ padding: '8px 14px', textAlign: 'left' as const, fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase' as const, letterSpacing: 0.8 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {userWarnings.map((w, i) => (
                            <tr key={w.id} style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = '#ffffff05' }}
                              onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent' }}>
                              <td style={{ padding: '10px 14px' }}>
                                {w.type === 'delete'
                                  ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, color: '#f87171', background: '#ef444420', borderRadius: 6, padding: '2px 7px' }}><Trash2 size={9} /> Deleted</span>
                                  : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, color: '#fbbf24', background: '#f59e0b20', borderRadius: 6, padding: '2px 7px' }}><AlertTriangle size={9} /> Warned</span>
                                }
                              </td>
                              <td style={{ padding: '10px 14px', fontSize: 12, color: '#94a3b8', maxWidth: 180 }}>
                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{w.reason}</div>
                              </td>
                              <td style={{ padding: '10px 14px', fontSize: 12, color: '#64748b', maxWidth: 160 }}>
                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{w.custom_note || <span style={{ color: '#334155' }}>—</span>}</div>
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                {w.post_id
                                  ? <a href={`/post/${w.post_id}`} target="_blank" rel="noopener noreferrer"
                                      style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#3b82f6', textDecoration: 'none' }}>
                                      <Link2 size={10} /> View
                                    </a>
                                  : <span style={{ color: '#334155', fontSize: 11 }}>—</span>
                                }
                              </td>
                              <td style={{ padding: '10px 14px', fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' as const }}>{timeAgo(w.created_at)}</td>
                              <td style={{ padding: '10px 14px', fontSize: 11, color: new Date(w.expires_at).getTime() - now.getTime() < 86400000 * 2 ? '#f87171' : '#64748b', whiteSpace: 'nowrap' as const }}>
                                {daysLeft(w.expires_at)}
                              </td>
                              <td style={{ padding: '10px 14px' }}>
                                <button onClick={() => unwarn(w.id, userId)}
                                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 6, border: '1px solid #334155', background: 'none', color: '#64748b', fontSize: 11, cursor: 'pointer' }}
                                  onMouseEnter={e => { e.currentTarget.style.background = '#ffffff10'; e.currentTarget.style.color = '#f1f5f9' }}
                                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#64748b' }}>
                                  <X size={10} /> Unwarn
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                })}

                {/* Expired warnings (collapsed) */}
                {expiredWarnings.length > 0 && (
                  <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #1e293b', overflow: 'hidden', opacity: 0.5 }}>
                    <div style={{ padding: '10px 16px', fontSize: 12, color: '#475569', fontWeight: 600 }}>
                      {expiredWarnings.length} expired warning{expiredWarnings.length > 1 ? 's' : ''} (auto-cleared after 14 days)
                    </div>
                  </div>
                )}
              </div>
            )
          })()}

        </div>
      </div>
    </div>
  )
}

// ── SVG Charts ───────────────────────────────────────────────────────────────

function LineChart({ title, data, color }: { title: string; data: DayCount[]; color: string }) {
  const W = 460, H = 120, PAD = { t: 10, r: 10, b: 28, l: 32 }
  const iW = W - PAD.l - PAD.r
  const iH = H - PAD.t - PAD.b
  const max = Math.max(...data.map(d => d.count), 1)
  const pts = data.map((d, i) => {
    const x = PAD.l + (i / (data.length - 1)) * iW
    const y = PAD.t + iH - (d.count / max) * iH
    return `${x},${y}`
  }).join(' ')
  const area = `M ${PAD.l},${PAD.t + iH} ` +
    data.map((d, i) => `L ${PAD.l + (i / (data.length - 1)) * iW},${PAD.t + iH - (d.count / max) * iH}`).join(' ') +
    ` L ${PAD.l + iW},${PAD.t + iH} Z`

  const labelIdxs = [0, Math.floor(data.length / 2), data.length - 1]

  return (
    <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', padding: '16px 20px' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', marginBottom: 10 }}>{title}</div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(t => {
          const y = PAD.t + iH - t * iH
          return (
            <g key={t}>
              <line x1={PAD.l} y1={y} x2={PAD.l + iW} y2={y} stroke="#334155" strokeWidth={0.5} />
              <text x={PAD.l - 4} y={y + 4} textAnchor="end" fontSize={9} fill="#475569">{Math.round(t * max)}</text>
            </g>
          )
        })}
        {/* Area fill */}
        <path d={area} fill={color} fillOpacity={0.12} />
        {/* Line */}
        <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
        {/* Dots for non-zero */}
        {data.map((d, i) => d.count > 0 && (
          <circle key={i}
            cx={PAD.l + (i / (data.length - 1)) * iW}
            cy={PAD.t + iH - (d.count / max) * iH}
            r={3} fill={color} />
        ))}
        {/* X labels */}
        {labelIdxs.map(i => (
          <text key={i}
            x={PAD.l + (i / (data.length - 1)) * iW}
            y={H - 4} textAnchor="middle" fontSize={9} fill="#475569">
            {data[i]?.date.slice(5)}
          </text>
        ))}
      </svg>
    </div>
  )
}

function BarChart({ title, data, color }: { title: string; data: DayCount[]; color: string }) {
  const W = 460, H = 120, PAD = { t: 10, r: 10, b: 28, l: 32 }
  const iW = W - PAD.l - PAD.r
  const iH = H - PAD.t - PAD.b
  const max = Math.max(...data.map(d => d.count), 1)
  const barW = Math.max(2, iW / data.length - 2)
  const labelIdxs = [0, Math.floor(data.length / 2), data.length - 1]

  return (
    <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', padding: '16px 20px' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', marginBottom: 10 }}>{title}</div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
        {[0, 0.5, 1].map(t => {
          const y = PAD.t + iH - t * iH
          return (
            <g key={t}>
              <line x1={PAD.l} y1={y} x2={PAD.l + iW} y2={y} stroke="#334155" strokeWidth={0.5} />
              <text x={PAD.l - 4} y={y + 4} textAnchor="end" fontSize={9} fill="#475569">{Math.round(t * max)}</text>
            </g>
          )
        })}
        {data.map((d, i) => {
          const x = PAD.l + (i / data.length) * iW + 1
          const barH = (d.count / max) * iH
          return (
            <rect key={i} x={x} y={PAD.t + iH - barH} width={barW} height={Math.max(barH, 0)}
              fill={color} fillOpacity={0.75} rx={2} />
          )
        })}
        {labelIdxs.map(i => (
          <text key={i}
            x={PAD.l + (i / data.length) * iW + barW / 2 + 1}
            y={H - 4} textAnchor="middle" fontSize={9} fill="#475569">
            {data[i]?.date.slice(5)}
          </text>
        ))}
      </svg>
    </div>
  )
}

function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  const R = 44, cx = 64, cy = 64, strokeW = 18
  let cumAngle = -Math.PI / 2
  const arcs = segments.map(seg => {
    const angle = (seg.value / total) * 2 * Math.PI
    const x1 = cx + R * Math.cos(cumAngle)
    const y1 = cy + R * Math.sin(cumAngle)
    cumAngle += angle
    const x2 = cx + R * Math.cos(cumAngle)
    const y2 = cy + R * Math.sin(cumAngle)
    const large = angle > Math.PI ? 1 : 0
    return { ...seg, path: `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`, angle }
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <svg width={128} height={128} viewBox="0 0 128 128" style={{ flexShrink: 0 }}>
        {arcs.map((arc, i) => (
          <path key={i} d={arc.path} fill="none" stroke={arc.color} strokeWidth={strokeW} strokeLinecap="butt" />
        ))}
        <text x={cx} y={cx - 7} textAnchor="middle" fontSize={16} fontWeight={800} fill="#f1f5f9">{total}</text>
        <text x={cx} y={cx + 8} textAnchor="middle" fontSize={8} fill="#64748b">users</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {segments.map((seg, i) => (
          <div key={i}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: seg.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#94a3b8' }}>{seg.label}</span>
            </div>
            <div style={{ paddingLeft: 14, fontSize: 20, fontWeight: 800, color: seg.color }}>
              {seg.value} <span style={{ fontSize: 11, fontWeight: 400, color: '#475569' }}>({Math.round(seg.value / total * 100)}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Verify Request Card ───────────────────────────────────────────────────────
function ordinalSuffix(n: number) {
  if (n === 1) return '1st'
  if (n === 2) return '2nd'
  if (n === 3) return '3rd'
  return `${n}th`
}

function isAbsoluteUrl(s: string) {
  try { return /^https?:\/\//i.test(s) } catch { return false }
}

function VerifyCard({ req, ordinal, expanded, onToggle, onApprove, onReject }: {
  req: VerifyRequest
  ordinal: number
  expanded: boolean
  onToggle: () => void
  onApprove: () => void
  onReject: () => void
}) {
  const statusColor = req.status === 'approved' ? '#34d399' : req.status === 'rejected' ? '#f87171' : '#fbbf24'
  const statusBg = req.status === 'approved' ? '#10b98115' : req.status === 'rejected' ? '#ef444415' : '#f59e0b15'
  const docIsUrl = !!req.doc_url && isAbsoluteUrl(req.doc_url)

  return (
    <div style={{ background: '#1e293b', border: `1px solid ${req.status === 'pending' ? '#f59e0b30' : '#334155'}`, borderRadius: 10, overflow: 'hidden' }}>
      {/* Summary row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer' }} onClick={onToggle}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
            <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 14 }}>{req.display_name || req.username}</span>
            <span style={{ fontSize: 12, color: '#64748b' }}>@{req.username}</span>
            {req.profession && (
              <span style={{ fontSize: 11, background: '#1d4ed820', color: '#60a5fa', borderRadius: 20, padding: '1px 8px', border: '1px solid #1d4ed840' }}>{req.profession}</span>
            )}
            {ordinal > 1 && (
              <span style={{ fontSize: 11, fontWeight: 700, background: '#7c3aed20', color: '#a78bfa', borderRadius: 20, padding: '1px 8px', border: '1px solid #7c3aed40' }}>
                {ordinalSuffix(ordinal)} submission
              </span>
            )}
          </div>
          {req.specializations && req.specializations.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 4, marginTop: 5 }}>
              {req.specializations.map(s => (
                <span key={s} style={{ fontSize: 10, fontWeight: 600, background: '#7c3aed15', color: '#a78bfa', borderRadius: 20, padding: '1px 8px', border: '1px solid #7c3aed30' }}>{s}</span>
              ))}
            </div>
          )}
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{req.email} · {new Date(req.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: statusColor, background: statusBg, borderRadius: 20, padding: '3px 10px', border: `1px solid ${statusColor}40` }}>
          {req.status}
        </span>
        {expanded ? <ChevronUp size={16} color="#64748b" /> : <ChevronDown size={16} color="#64748b" />}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop: '1px solid #334155', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {req.specializations && req.specializations.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>SPECIALIZATIONS</div>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 5 }}>
                {req.specializations.map(s => (
                  <span key={s} style={{ fontSize: 12, fontWeight: 600, background: '#7c3aed15', color: '#a78bfa', borderRadius: 20, padding: '3px 10px', border: '1px solid #7c3aed30' }}>{s}</span>
                ))}
              </div>
            </div>
          )}
          {req.note && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>NOTE FROM USER</div>
              <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', lineHeight: 1.6, background: '#0f172a', padding: '10px 12px', borderRadius: 8 }}>{req.note}</p>
            </div>
          )}
          {req.doc_url && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>DOCUMENT</div>
              {docIsUrl ? (
                <a href={req.doc_url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#60a5fa', textDecoration: 'none' }}>
                  <ExternalLink size={13} /> View document
                </a>
              ) : (
                <div style={{ fontSize: 13, color: '#94a3b8', background: '#0f172a', padding: '8px 12px', borderRadius: 8, wordBreak: 'break-all' as const }}>
                  {req.doc_url}
                </div>
              )}
            </div>
          )}
          {req.status === 'pending' && (
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={onApprove}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8, border: 'none', background: '#10b981', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#059669' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#10b981' }}>
                <Check size={14} /> Approve & verify
              </button>
              <button onClick={onReject}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8, border: '1px solid #334155', background: 'none', color: '#f87171', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#ef444415' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                <X size={14} /> Reject
              </button>
            </div>
          )}
          {req.status !== 'pending' && (
            <div style={{ display: 'flex', gap: 8 }}>
              {req.status === 'rejected' && (
                <button onClick={onApprove}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, border: '1px solid #334155', background: 'none', color: '#34d399', fontSize: 13, cursor: 'pointer' }}>
                  <Check size={13} /> Approve anyway
                </button>
              )}
              {req.status === 'approved' && (
                <button onClick={onReject}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 8, border: '1px solid #334155', background: 'none', color: '#f87171', fontSize: 13, cursor: 'pointer' }}>
                  <X size={13} /> Revoke
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
