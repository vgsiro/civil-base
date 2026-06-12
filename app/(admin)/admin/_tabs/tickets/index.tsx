'use client'
import { useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Ticket, TicketMessage, RangeMode } from '../../_lib/types'
import { fetchTickets, fetchThread, updateTicketStatus, sendReply } from './data'
import { TicketCard, ThreadView } from './ui'

type SubTab = 'open' | 'in_progress' | 'resolved'

interface Props {
  tickets: Ticket[]
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>
  loading: boolean
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
  range: RangeMode
}

export default function TicketsTab({ tickets, setTickets, loading, setLoading, range }: Props) {
  const [subTab, setSubTab] = useState<SubTab>('open')
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null)
  const [threads, setThreads] = useState<Record<string, TicketMessage[]>>({})
  const [loadingThread, setLoadingThread] = useState<string | null>(null)
  const [replyDraft, setReplyDraft] = useState('')
  const [replyImage, setReplyImage] = useState<File | null>(null)
  const [replyImagePreview, setReplyImagePreview] = useState<string | null>(null)
  const [replyDragOver, setReplyDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!expandedTicket || threads[expandedTicket]) return
    setLoadingThread(expandedTicket)
    fetchThread(supabase, expandedTicket).then(msgs => {
      setThreads(prev => ({ ...prev, [expandedTicket]: msgs }))
      setLoadingThread(null)
    })
  }, [expandedTicket])

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
  }, [expandedTicket, replyImage])

  async function refresh() {
    setLoading(true)
    setTickets(await fetchTickets(supabase, range))
    setLoading(false)
  }

  async function handleSend(ticketId: string) {
    const msg = await sendReply(supabase, ticketId, replyDraft.trim(), replyImage)
    if (!msg) return
    setThreads(prev => ({ ...prev, [ticketId]: [...(prev[ticketId] ?? []), msg] }))
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'in_progress', updated_at: msg.created_at } : t))
    setReplyDraft(''); setReplyImage(null); setReplyImagePreview(null)
  }

  async function handleStatus(ticketId: string, status: Ticket['status']) {
    await updateTicketStatus(supabase, ticketId, status)
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status } : t))
    if (status === 'in_progress' && subTab === 'open') setSubTab('in_progress')
    if ((status === 'resolved' || status === 'closed') && subTab !== 'resolved') setSubTab('resolved')
  }

  const openTickets       = tickets.filter(t => t.status === 'open')
  const inProgressTickets = tickets.filter(t => t.status === 'in_progress')
  const resolvedTickets   = tickets.filter(t => t.status === 'resolved' || t.status === 'closed')

  const SUB_TABS: { id: SubTab; label: string; count: number; color: string }[] = [
    { id: 'open',        label: 'Open',        count: openTickets.length,       color: '#ef4444' },
    { id: 'in_progress', label: 'In Progress',  count: inProgressTickets.length, color: '#f59e0b' },
    { id: 'resolved',    label: 'Resolved',     count: resolvedTickets.length,   color: '#10b981' },
  ]

  const visibleTickets =
    subTab === 'open'        ? openTickets :
    subTab === 'in_progress' ? inProgressTickets :
                               resolvedTickets

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9' }}>Support Tickets</div>
        <button onClick={refresh} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8, border: '1px solid #334155', background: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #1e293b', paddingBottom: 0 }}>
        {SUB_TABS.map(t => (
          <button key={t.id} onClick={() => { setSubTab(t.id); setExpandedTicket(null) }} style={{
            padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', borderRadius: '8px 8px 0 0',
            background: subTab === t.id ? '#1e293b' : 'none',
            color: subTab === t.id ? t.color : '#475569',
            borderBottom: subTab === t.id ? `2px solid ${t.color}` : '2px solid transparent',
            transition: 'all 0.12s',
          }}>
            {t.label}
            {t.count > 0 && (
              <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 700, background: subTab === t.id ? t.color + '25' : '#1e293b', color: subTab === t.id ? t.color : '#475569', borderRadius: 10, padding: '1px 6px' }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading && <div style={{ color: '#64748b', fontSize: 14 }}>Loading…</div>}

      {visibleTickets.map(ticket => {
        const isOpen = expandedTicket === ticket.id
        return (
          <TicketCard key={ticket.id} ticket={ticket} isOpen={isOpen}
            onToggle={() => { setExpandedTicket(isOpen ? null : ticket.id); setReplyDraft(''); setReplyImage(null); setReplyImagePreview(null) }}
            threadContent={
              <ThreadView
                ticket={ticket}
                messages={threads[ticket.id] ?? []}
                loading={loadingThread === ticket.id}
                replyDraft={replyDraft}
                replyImagePreview={replyImagePreview}
                replyDragOver={replyDragOver}
                fileRef={fileRef as React.RefObject<HTMLInputElement>}
                onReplyChange={setReplyDraft}
                onFileChange={f => { setReplyImage(f); setReplyImagePreview(URL.createObjectURL(f)) }}
                onRemoveImage={() => { setReplyImage(null); setReplyImagePreview(null) }}
                onDragOver={() => setReplyDragOver(true)}
                onDragLeave={() => setReplyDragOver(false)}
                onDrop={f => { setReplyImage(f); setReplyImagePreview(URL.createObjectURL(f)) }}
                onSend={() => handleSend(ticket.id)}
                onStatusChange={s => handleStatus(ticket.id, s)}
              />
            }
          />
        )
      })}

      {!loading && visibleTickets.length === 0 && (
        <div style={{ padding: '48px', textAlign: 'center' as const, color: '#64748b', fontSize: 14 }}>
          No {subTab.replace('_', ' ')} tickets.
        </div>
      )}
    </div>
  )
}
