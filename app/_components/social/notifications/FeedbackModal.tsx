'use client'
import { useState, useRef, useEffect } from 'react'
import { X, Send, ImageIcon, Loader2, CheckCircle, Ticket, Plus, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useScrollLock } from '../../../_hooks/useScrollLock'
import type { User } from '@supabase/supabase-js'
import { useTranslation } from '../../../i18n/LanguageContext'

interface Props {
  user: User | null
  onClose: () => void
  pageContext?: { label: string; url: string }
}

interface MyTicket {
  id: string
  title: string
  message: string
  image_url: string | null
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  created_at: string
  updated_at: string
}

interface TicketMessage {
  id: string
  ticket_id: string
  sender: 'user' | 'admin'
  body: string | null
  image_url: string | null
  created_at: string
}

const STATUS_COLORS: Record<string, { color: string; bg: string; dot: string }> = {
  open:        { color: '#dc2626', bg: '#fef2f2', dot: '#ef4444' },
  in_progress: { color: '#b45309', bg: '#fffbeb', dot: '#f59e0b' },
  resolved:    { color: '#065f46', bg: '#ecfdf5', dot: '#10b981' },
  closed:      { color: '#475569', bg: '#f8fafc', dot: '#94a3b8' },
}

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  if (m < 1440) return `${Math.floor(m / 60)}h ago`
  if (m < 10080) return `${Math.floor(m / 1440)}d ago`
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function FeedbackModal({ user, onClose, pageContext }: Props) {
  useScrollLock()
  const { t } = useTranslation()
  const [tab, setTab] = useState<'new' | 'history'>('new')
  const [showDiscard, setShowDiscard] = useState(false)

  // New ticket form
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Whether the form has unsaved content worth protecting
  const isDirty = (title.trim() || message.trim() || !!imageFile) && !submitted

  function tryClose() {
    if (isDirty) { setShowDiscard(true) } else { onClose() }
  }

  // History tab
  const [tickets, setTickets] = useState<MyTicket[]>([])
  const [loadingTickets, setLoadingTickets] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [threadMessages, setThreadMessages] = useState<Record<string, TicketMessage[]>>({})
  const [loadingThread, setLoadingThread] = useState<string | null>(null)
  const [userReplyDraft, setUserReplyDraft] = useState('')
  const [userReplyImage, setUserReplyImage] = useState<File | null>(null)
  const [userReplyPreview, setUserReplyPreview] = useState<string | null>(null)
  const [userReplyDragOver, setUserReplyDragOver] = useState(false)
  const [sendingReply, setSendingReply] = useState(false)
  const replyFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (tab === 'history' && user) loadTickets()
  }, [tab, user])

  // Load thread when a ticket is expanded
  useEffect(() => {
    if (!expandedId || threadMessages[expandedId]) return
    loadThread(expandedId)
  }, [expandedId])

  async function loadThread(ticketId: string) {
    setLoadingThread(ticketId)
    const { data } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })
    setThreadMessages(prev => ({ ...prev, [ticketId]: (data as TicketMessage[]) ?? [] }))
    setLoadingThread(null)
  }

  // Ctrl+V paste for reply image — scoped to expanded ticket on history tab
  useEffect(() => {
    if (tab !== 'history' || !expandedId) return
    function onPaste(e: ClipboardEvent) {
      if (userReplyImage) return
      const item = Array.from(e.clipboardData?.items ?? []).find(i => i.type.startsWith('image/'))
      if (!item) return
      const f = item.getAsFile()
      if (!f) return
      setUserReplyImage(f)
      setUserReplyPreview(URL.createObjectURL(f))
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [tab, expandedId, userReplyImage])

  // Ctrl+V paste for new ticket image — only active on the New Ticket tab
  useEffect(() => {
    if (tab !== 'new' || submitted) return
    function onPaste(e: ClipboardEvent) {
      if (imageFile) return
      const item = Array.from(e.clipboardData?.items ?? []).find(i => i.type.startsWith('image/'))
      if (!item) return
      const f = item.getAsFile()
      if (f) handleFile(f)
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [tab, imageFile, submitted])

  async function loadTickets() {
    if (!user) return
    setLoadingTickets(true)
    const { data } = await supabase
      .from('support_tickets')
      .select('id, title, message, image_url, status, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setTickets((data as MyTicket[]) ?? [])
    setLoadingTickets(false)
  }

  async function sendUserReply(ticketId: string) {
    const body = userReplyDraft.trim()
    if (!body && !userReplyImage) return
    setSendingReply(true)

    let image_url: string | null = null
    if (userReplyImage && user) {
      const path = `ticket-attachments/user-replies/${ticketId}-${Date.now()}-${userReplyImage.name}`
      const { error: upErr } = await supabase.storage.from('ticket-attachments').upload(path, userReplyImage)
      if (!upErr) {
        const { data } = supabase.storage.from('ticket-attachments').getPublicUrl(path)
        image_url = data.publicUrl
      }
    }

    const { data: newMsg, error } = await supabase
      .from('ticket_messages')
      .insert({ ticket_id: ticketId, sender: 'user', body: body || null, image_url })
      .select()
      .single()

    // Reopen ticket and touch updated_at using server clock
    await supabase.from('support_tickets').update({ status: 'open' }).eq('id', ticketId)
    await supabase.rpc('touch_ticket', { p_ticket_id: ticketId })

    setSendingReply(false)
    if (error || !newMsg) return

    const serverTime = (newMsg as any).created_at
    setThreadMessages(prev => ({ ...prev, [ticketId]: [...(prev[ticketId] ?? []), newMsg as TicketMessage] }))
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'open', updated_at: serverTime } : t))
    setUserReplyDraft('')
    setUserReplyImage(null)
    setUserReplyPreview(null)
  }

  function handleFile(f: File) {
    if (!f.type.startsWith('image/')) return
    setImageFile(f)
    setImagePreview(URL.createObjectURL(f))
    setUploadedImageUrl(null)
    // Start uploading immediately in the background
    if (user) {
      setUploading(true)
      const path = `ticket-attachments/${user.id}/${Date.now()}-${f.name}`
      supabase.storage.from('ticket-attachments').upload(path, f).then(({ error: upErr }) => {
        setUploading(false)
        if (!upErr) {
          const { data } = supabase.storage.from('ticket-attachments').getPublicUrl(path)
          setUploadedImageUrl(data.publicUrl)
        }
      })
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  async function submit() {
    if (!title.trim() || !message.trim()) { setError('Please fill in both title and message.'); return }
    setError('')
    setSubmitting(true)

    const profile = user
      ? await supabase.from('profiles').select('display_name, full_name, username').eq('id', user.id).single().then(r => r.data)
      : null

    const display_name = profile?.display_name || profile?.full_name || null
    const username = profile?.username || null
    const image_url = uploadedImageUrl

    const { error: insertErr } = await supabase.from('support_tickets').insert({
      user_id: user?.id ?? null,
      email: user?.email ?? null,
      display_name,
      username,
      title: title.trim(),
      message: message.trim(),
      image_url,
      status: 'open',
      page_context: pageContext ? `${pageContext.label} — ${pageContext.url}` : null,
    })

    setSubmitting(false)
    if (insertErr) { setError(insertErr.message); return }
    setSubmitted(true)
  }

  function resetForm() {
    setTitle(''); setMessage(''); setImageFile(null); setImagePreview(null)
    setUploadedImageUrl(null); setUploading(false)
    setSubmitted(false); setError('')
  }

  return (
    <>
      <div onClick={tryClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 600, backdropFilter: 'blur(2px)' }} />

      {/* Discard confirmation — rendered above everything */}
      {showDiscard && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 700 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 701, background: '#fff', borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,0.28)', padding: '28px 24px', width: 320, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#050505' }}>{t('fb_discard_title')}</div>
            <div style={{ fontSize: 14, color: '#65676b', lineHeight: 1.6 }}>
              {t('fb_discard_body')}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={onClose}
                style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#dc2626' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#ef4444' }}>
                {t('fb_btn_discard')}
              </button>
              <button onClick={() => setShowDiscard(false)}
                style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: '#e4e6eb', color: '#050505', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#d8dadf' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#e4e6eb' }}>
                {t('fb_btn_keep_editing')}
              </button>
            </div>
          </div>
        </>
      )}
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 601, background: '#fff', borderRadius: 16, boxShadow: '0 24px 80px rgba(0,0,0,0.28)', width: '90vw', maxWidth: 540, height: '82vh', display: 'flex', flexDirection: 'column', isolation: 'isolate' }}>

        {/* Header */}
        <div style={{ flexShrink: 0, borderRadius: '16px 16px 0 0', overflow: 'hidden' }}>
          {/* Page context banner — shown only when there is a context */}
          {pageContext && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', background: '#f0f9ff', borderBottom: '1px solid #bae6fd' }}>
              <span style={{ fontSize: 15, flexShrink: 0 }}>📍</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: '#64748b', marginBottom: 1 }}>{t('fb_context_label')}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0369a1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{pageContext.label}</div>
              </div>
              {pageContext.url && (
                <a href={pageContext.url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#0369a1', textDecoration: 'none', flexShrink: 0, padding: '4px 8px', borderRadius: 6, border: '1px solid #bae6fd', background: '#e0f2fe' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#bae6fd' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#e0f2fe' }}>
                  <ExternalLink size={11} /> {t('fb_open_page')}
                </a>
              )}
            </div>
          )}

          <div style={{ padding: '18px 20px 0', borderBottom: '1px solid #e4e6eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#050505' }}>{t('fb_title')}</div>
              <div style={{ fontSize: 12, color: '#65676b', marginTop: 2 }}>{t('fb_sub')}</div>
            </div>
            <button onClick={tryClose}
              style={{ width: 34, height: 34, borderRadius: '50%', background: '#f0f2f5', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
              onMouseEnter={e => { e.currentTarget.style.background = '#e4e6eb' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f0f2f5' }}>
              <X size={16} color="#050505" />
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0 }}>
            {([
              { id: 'new' as const, label: t('fb_tab_new'), icon: <Plus size={13} /> },
              { id: 'history' as const, label: t('fb_tab_history'), icon: <Ticket size={13} /> },
            ] as const).map(tb => (
              <button key={tb.id} onClick={() => { setTab(tb.id); if (tb.id === 'new' && submitted) resetForm() }}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === tb.id ? 700 : 500, color: tab === tb.id ? '#3b82f6' : '#65676b', borderBottom: tab === tb.id ? '2px solid #3b82f6' : '2px solid transparent', marginBottom: -1, transition: 'color 0.15s' }}>
                {tb.icon} {tb.label}
              </button>
            ))}
          </div>
          </div>
        </div>

        {/* ── NEW TICKET TAB ── */}
        {tab === 'new' && (
          submitted ? (
            <div style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, flex: 1, overflowY: 'auto' }}>
              <CheckCircle size={52} color="#10b981" />
              <div style={{ fontSize: 18, fontWeight: 800, color: '#050505' }}>{t('fb_submitted_title')}</div>
              <div style={{ fontSize: 14, color: '#65676b', textAlign: 'center' as const, lineHeight: 1.6 }}>
                {t('fb_submitted_body')}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button onClick={() => { resetForm() }}
                  style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid #e4e6eb', background: '#fff', color: '#374151', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  {t('fb_btn_new_ticket')}
                </button>
                <button onClick={() => { setTab('history'); loadTickets() }}
                  style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  {t('fb_btn_view_tickets')}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto', flex: 1, minHeight: 0 }}>
              {/* Title */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#65676b', display: 'block', marginBottom: 6 }}>{t('fb_field_title')} <span style={{ color: '#ef4444' }}>*</span></label>
                <input value={title} onChange={e => setTitle(e.target.value)}
                  placeholder={pageContext ? `e.g. Issue with ${pageContext.label} — describe the problem…` : t('fb_placeholder_title')}
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e4e6eb', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#3b82f6')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#e4e6eb')} />
              </div>

              {/* Message — grows to fill remaining space */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#65676b', display: 'block', marginBottom: 6 }}>{t('fb_field_message')} <span style={{ color: '#ef4444' }}>*</span></label>
                <textarea value={message} onChange={e => setMessage(e.target.value)}
                  placeholder={t('fb_placeholder_message')}
                  style={{ flex: 1, width: '100%', padding: '9px 12px', border: '1.5px solid #e4e6eb', borderRadius: 8, fontSize: 14, outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const, minHeight: 80 }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#3b82f6')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#e4e6eb')} />
              </div>

              {/* Image */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#65676b', display: 'block', marginBottom: 6 }}>
                  {t('fb_screenshot')} <span style={{ color: '#94a3b8', fontWeight: 400 }}>{t('fb_screenshot_optional')}</span>
                </label>
                {imagePreview ? (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img src={imagePreview} alt="Attachment" style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 8, display: 'block', objectFit: 'cover' as const, border: `1px solid ${uploading ? '#bae6fd' : '#e4e6eb'}`, opacity: uploading ? 0.7 : 1, transition: 'opacity 0.2s' }} />
                    {uploading && (
                      <div style={{ position: 'absolute', bottom: 6, left: 6, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(0,0,0,0.55)', borderRadius: 6, padding: '3px 8px' }}>
                        <Loader2 size={11} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
                        <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>Uploading…</span>
                      </div>
                    )}
                    {!uploading && uploadedImageUrl && (
                      <div style={{ position: 'absolute', bottom: 6, left: 6, display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(16,185,129,0.85)', borderRadius: 6, padding: '3px 8px' }}>
                        <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>✓ Ready</span>
                      </div>
                    )}
                    <button onClick={() => { setImageFile(null); setImagePreview(null); setUploadedImageUrl(null); setUploading(false) }}
                      style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <div onDragOver={e => e.preventDefault()} onDrop={onDrop} onClick={() => fileRef.current?.click()}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '16px', border: '2px dashed #e2e8f0', borderRadius: 10, background: '#f8fafc', cursor: 'pointer' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#3b82f6'; (e.currentTarget as HTMLDivElement).style.background = '#eff6ff' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLDivElement).style.background = '#f8fafc' }}>
                    <ImageIcon size={20} color="#94a3b8" />
                    <span style={{ fontSize: 12, color: '#64748b' }}>{t('fb_upload_hint')}</span>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} style={{ display: 'none' }} />
              </div>

              {user && (
                <div style={{ fontSize: 12, color: '#94a3b8', background: '#f8fafc', borderRadius: 8, padding: '7px 12px', border: '1px solid #f0f2f5' }}>
                  {t('fb_submitting_as')} <strong style={{ color: '#374151' }}>{user.user_metadata?.display_name || user.user_metadata?.full_name || user.email}</strong>
                </div>
              )}

              {error && (
                <div style={{ fontSize: 13, color: '#dc2626', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 7, padding: '7px 12px' }}>{error}</div>
              )}

              <button onClick={submit} disabled={!title.trim() || !message.trim() || submitting || uploading}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 0', borderRadius: 9, border: 'none', background: title.trim() && message.trim() && !uploading ? '#3b82f6' : '#e4e6eb', color: title.trim() && message.trim() && !uploading ? '#fff' : '#94a3b8', fontSize: 14, fontWeight: 700, cursor: title.trim() && message.trim() && !uploading ? 'pointer' : 'default' }}
                onMouseEnter={e => { if (title.trim() && message.trim() && !uploading) e.currentTarget.style.background = '#2563eb' }}
                onMouseLeave={e => { if (title.trim() && message.trim() && !uploading) e.currentTarget.style.background = '#3b82f6' }}>
                {submitting ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> {t('fb_btn_submitting')}</> : uploading ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> {t('fb_btn_uploading')}</> : <><Send size={14} /> {t('fb_btn_submit')}</>}
              </button>
              <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
            </div>
          )
        )}

        {/* ── MY TICKETS TAB ── */}
        {tab === 'history' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {!user && (
              <div style={{ padding: '40px 0', textAlign: 'center' as const, color: '#94a3b8', fontSize: 14 }}>
                {t('fb_sign_in_hint')}
              </div>
            )}

            {user && loadingTickets && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: 8, color: '#94a3b8' }}>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Loading…
                <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
              </div>
            )}

            {user && !loadingTickets && tickets.length === 0 && (
              <div style={{ padding: '48px 0', textAlign: 'center' as const }}>
                <Ticket size={36} color="#d1d5db" style={{ margin: '0 auto 12px', display: 'block' }} />
                <div style={{ fontSize: 15, fontWeight: 700, color: '#374151', marginBottom: 4 }}>{t('fb_no_tickets_title')}</div>
                <div style={{ fontSize: 13, color: '#94a3b8' }}>{t('fb_no_tickets_sub')}</div>
                <button onClick={() => setTab('new')}
                  style={{ marginTop: 14, padding: '8px 20px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  {t('fb_btn_create_first')}
                </button>
              </div>
            )}

            {user && !loadingTickets && tickets.map(ticket => {
              const statusLabels: Record<string, string> = {
                open: t('fb_status_open'), in_progress: t('fb_status_in_progress'),
                resolved: t('fb_status_resolved'), closed: t('fb_status_closed'),
              }
              const sc = STATUS_COLORS[ticket.status] ?? STATUS_COLORS.open
              const sm = { ...sc, label: statusLabels[ticket.status] ?? ticket.status }
              const isOpen = expandedId === ticket.id
              const msgs = threadMessages[ticket.id] ?? []
              const hasAdminMsg = msgs.some(m => m.sender === 'admin')

              return (
                <div key={ticket.id} style={{ border: `1px solid ${isOpen ? '#bfdbfe' : '#e4e6eb'}`, borderRadius: 12, background: '#fff', transition: 'border-color 0.15s' }}>

                  {/* Ticket header row */}
                  <div onClick={() => setExpandedId(isOpen ? null : ticket.id)}
                    style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: sm.dot, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#050505', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{ticket.title}</span>
                        {hasAdminMsg && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 20, padding: '1px 7px', flexShrink: 0 }}>{t('fb_reply_badge')}</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: sm.color, background: sm.bg, borderRadius: 20, padding: '1px 8px' }}>{sm.label}</span>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>{timeAgo(ticket.updated_at)}</span>
                      </div>
                    </div>
                    <span style={{ color: '#bcc0c4', fontSize: 12, flexShrink: 0 }}>{isOpen ? '▲' : '▼'}</span>
                  </div>

                  {/* Expanded thread */}
                  {isOpen && (
                    <div style={{ borderTop: '1px solid #f0f2f5', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>

                      {/* Original message */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>YOU</span>
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>{timeAgo(ticket.created_at)}</span>
                        </div>
                        <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap' as const, background: '#f0fdf4', borderRadius: 10, padding: '10px 12px', border: '1px solid #bbf7d0' }}>
                          {ticket.message}
                        </div>
                        {ticket.image_url && (
                          <a href={ticket.image_url} target="_blank" rel="noopener noreferrer">
                            <img src={ticket.image_url} alt="" style={{ maxWidth: '100%', maxHeight: 180, borderRadius: 8, display: 'block', border: '1px solid #bbf7d0', objectFit: 'cover' as const }} />
                          </a>
                        )}
                      </div>

                      {/* Thread messages */}
                      {loadingThread === ticket.id ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0', color: '#94a3b8', fontSize: 13 }}>Loading…</div>
                      ) : msgs.map(msg => {
                        const isAdmin = msg.sender === 'admin'
                        return (
                          <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              {isAdmin ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ fontSize: 9, fontWeight: 800, color: '#fff' }}>A</span>
                                  </div>
                                  <span style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8' }}>CivilAxis Team</span>
                                </div>
                              ) : (
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#15803d' }}>YOU</span>
                              )}
                              <span style={{ fontSize: 11, color: '#94a3b8' }}>{timeAgo(msg.created_at)}</span>
                            </div>
                            {msg.body && (
                              <div style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' as const, borderRadius: 10, padding: '10px 12px', border: `1px solid ${isAdmin ? '#bfdbfe' : '#bbf7d0'}`, background: isAdmin ? '#eff6ff' : '#f0fdf4', color: isAdmin ? '#1e3a8a' : '#166534' }}>
                                {msg.body}
                              </div>
                            )}
                            {msg.image_url && (
                              <a href={msg.image_url} target="_blank" rel="noopener noreferrer">
                                <img src={msg.image_url} alt="" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, display: 'block', border: `1px solid ${isAdmin ? '#bfdbfe' : '#bbf7d0'}`, objectFit: 'cover' as const }} />
                              </a>
                            )}
                          </div>
                        )
                      })}

                      {msgs.length === 0 && loadingThread !== ticket.id && (
                        <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', textAlign: 'center' as const, padding: '4px 0' }}>
                          No replies yet — we'll get back to you soon.
                        </div>
                      )}

                      {/* Reply compose — disabled if closed */}
                      {ticket.status === 'closed' ? (
                        <div style={{ fontSize: 12, color: '#94a3b8', background: '#f8fafc', borderRadius: 8, padding: '8px 12px', border: '1px solid #f0f2f5', textAlign: 'center' as const }}>
                          This ticket is closed. Open a new ticket if you need further help.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid #f0f2f5', paddingTop: 10 }}>
                          <textarea
                            value={userReplyDraft}
                            onChange={e => setUserReplyDraft(e.target.value)}
                            placeholder="Write a reply… (Ctrl+V to paste image)"
                            rows={3}
                            style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e4e6eb', borderRadius: 8, fontSize: 13, outline: 'none', resize: 'vertical' as const, fontFamily: 'inherit', boxSizing: 'border-box' as const }}
                            onFocus={e => (e.currentTarget.style.borderColor = '#3b82f6')}
                            onBlur={e => (e.currentTarget.style.borderColor = '#e4e6eb')}
                          />
                          {userReplyPreview ? (
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                              <img src={userReplyPreview} alt="" style={{ maxWidth: '100%', maxHeight: 140, borderRadius: 8, display: 'block', border: '1px solid #e4e6eb', objectFit: 'cover' as const }} />
                              <button onClick={() => { setUserReplyImage(null); setUserReplyPreview(null) }}
                                style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <div onClick={() => replyFileRef.current?.click()}
                              onDragOver={e => { e.preventDefault(); setUserReplyDragOver(true) }}
                              onDragLeave={() => setUserReplyDragOver(false)}
                              onDrop={e => {
                                e.preventDefault(); setUserReplyDragOver(false)
                                const f = e.dataTransfer.files?.[0]
                                if (f?.type.startsWith('image/')) { setUserReplyImage(f); setUserReplyPreview(URL.createObjectURL(f)) }
                              }}
                              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', border: `1.5px dashed ${userReplyDragOver ? '#3b82f6' : '#e2e8f0'}`, borderRadius: 8, background: userReplyDragOver ? '#eff6ff' : '#f8fafc', cursor: 'pointer' }}>
                              <ImageIcon size={14} color={userReplyDragOver ? '#3b82f6' : '#94a3b8'} />
                              <span style={{ fontSize: 12, color: userReplyDragOver ? '#3b82f6' : '#94a3b8' }}>Click, drag & drop, or Ctrl+V to attach image</span>
                            </div>
                          )}
                          <input type="file" accept="image/*" ref={replyFileRef}
                            onChange={e => { const f = e.target.files?.[0]; if (f?.type.startsWith('image/')) { setUserReplyImage(f); setUserReplyPreview(URL.createObjectURL(f)) } }}
                            style={{ display: 'none' }} />
                          <button onClick={() => sendUserReply(ticket.id)}
                            disabled={(!userReplyDraft.trim() && !userReplyImage) || sendingReply}
                            style={{ alignSelf: 'flex-end' as const, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 8, border: 'none', background: (userReplyDraft.trim() || userReplyImage) ? '#3b82f6' : '#e4e6eb', color: (userReplyDraft.trim() || userReplyImage) ? '#fff' : '#94a3b8', fontSize: 13, fontWeight: 700, cursor: (userReplyDraft.trim() || userReplyImage) ? 'pointer' : 'default' }}
                            onMouseEnter={e => { if (userReplyDraft.trim() || userReplyImage) e.currentTarget.style.background = '#2563eb' }}
                            onMouseLeave={e => { if (userReplyDraft.trim() || userReplyImage) e.currentTarget.style.background = '#3b82f6' }}>
                            {sendingReply ? 'Sending…' : 'Send'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

    </>
  )
}
