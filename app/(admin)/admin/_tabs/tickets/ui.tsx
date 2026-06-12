'use client'
import { X, ImageIcon, ExternalLink } from 'lucide-react'
import type { Ticket, TicketMessage } from '../../_lib/types'
import { timeAgo } from '../../_lib/constants'

interface ThreadProps {
  ticket: Ticket
  messages: TicketMessage[]
  loading: boolean
  replyDraft: string
  replyImagePreview: string | null
  replyDragOver: boolean
  fileRef: React.RefObject<HTMLInputElement>
  onReplyChange: (v: string) => void
  onFileChange: (f: File) => void
  onRemoveImage: () => void
  onDragOver: () => void
  onDragLeave: () => void
  onDrop: (f: File) => void
  onSend: () => void
  onStatusChange: (s: Ticket['status']) => void
}

export function ThreadView({
  ticket, messages, loading,
  replyDraft, replyImagePreview, replyDragOver, fileRef,
  onReplyChange, onFileChange, onRemoveImage,
  onDragOver, onDragLeave, onDrop, onSend, onStatusChange,
}: ThreadProps) {
  const canSend = replyDraft.trim() || replyImagePreview
  return (
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
      {loading ? (
        <div style={{ color: '#475569', fontSize: 13, textAlign: 'center' as const }}>Loading…</div>
      ) : messages.map(msg => {
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
        <textarea value={replyDraft} onChange={e => onReplyChange(e.target.value)}
          placeholder="Write a reply to the user… (Ctrl+V to paste image)" rows={3}
          style={{ width: '100%', padding: '8px 12px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', fontSize: 13, outline: 'none', resize: 'vertical' as const, fontFamily: 'inherit', boxSizing: 'border-box' as const }} />

        {replyImagePreview ? (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img src={replyImagePreview} alt="" style={{ maxWidth: 260, maxHeight: 160, borderRadius: 8, display: 'block', border: '1px solid #334155' }} />
            <button onClick={onRemoveImage}
              style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
              <X size={12} />
            </button>
          </div>
        ) : (
          <div onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); onDragOver() }}
            onDragLeave={onDragLeave}
            onDrop={e => { e.preventDefault(); onDragLeave(); const f = e.dataTransfer.files?.[0]; if (f?.type.startsWith('image/')) onDrop(f) }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 16px', border: `2px dashed ${replyDragOver ? '#3b82f6' : '#334155'}`, borderRadius: 8, background: replyDragOver ? '#1e3a5f' : 'transparent', cursor: 'pointer', transition: 'all 0.15s' }}>
            <ImageIcon size={16} color={replyDragOver ? '#3b82f6' : '#475569'} />
            <span style={{ fontSize: 12, color: replyDragOver ? '#93c5fd' : '#64748b' }}>Click, drag & drop, or Ctrl+V</span>
          </div>
        )}
        <input type="file" accept="image/*" ref={fileRef}
          onChange={e => { const f = e.target.files?.[0]; if (f?.type.startsWith('image/')) onFileChange(f) }}
          style={{ display: 'none' }} />

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
          <button onClick={onSend} disabled={!canSend}
            style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: canSend ? '#3b82f6' : '#1e293b', color: canSend ? '#fff' : '#475569', fontSize: 12, fontWeight: 700, cursor: canSend ? 'pointer' : 'default' }}>
            Send reply
          </button>
          {(['open', 'in_progress', 'resolved', 'closed'] as const).filter(s => s !== ticket.status).map(s => (
            <button key={s} onClick={() => onStatusChange(s)}
              style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #334155', background: 'none', color: '#94a3b8', fontSize: 12, cursor: 'pointer', textTransform: 'capitalize' as const }}
              onMouseEnter={e => { e.currentTarget.style.background = '#ffffff08' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
              → {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

interface TicketCardProps {
  ticket: Ticket
  isOpen: boolean
  onToggle: () => void
  threadContent: React.ReactNode
}

export function TicketCard({ ticket, isOpen, onToggle, threadContent }: TicketCardProps) {
  const statusColors: Record<string, { bg: string; color: string }> = {
    open:        { bg: '#ef444420', color: '#f87171' },
    in_progress: { bg: '#f59e0b20', color: '#fbbf24' },
    resolved:    { bg: '#10b98120', color: '#34d399' },
    closed:      { bg: '#64748b20', color: '#94a3b8' },
  }
  const sc = statusColors[ticket.status] ?? statusColors.open
  return (
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, overflow: 'hidden' }}>
      <div onClick={onToggle} style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' as const }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{ticket.title}</span>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: sc.bg, color: sc.color, flexShrink: 0, textTransform: 'capitalize' as const }}>{ticket.status.replace('_', ' ')}</span>
            {ticket.page_context && (() => {
              const sepIdx = ticket.page_context.indexOf(' — ')
              const label = sepIdx !== -1 ? ticket.page_context.slice(0, sepIdx) : ticket.page_context
              const url   = sepIdx !== -1 ? ticket.page_context.slice(sepIdx + 3) : null
              return url ? (
                <a href={url} target="_blank" rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#1e3a5f', color: '#93c5fd', flexShrink: 0, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, textDecoration: 'none' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#1e40af' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#1e3a5f' }}>
                  <ExternalLink size={10} /> 📍 {label}
                </a>
              ) : (
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#1e3a5f', color: '#93c5fd', flexShrink: 0 }}>
                  📍 {label}
                </span>
              )
            })()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
            {ticket.display_name && <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>{ticket.display_name}</span>}
            {ticket.email && <span style={{ fontSize: 12, color: '#475569' }}>{ticket.email}</span>}
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
          {!isOpen && <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{ticket.message}</div>}
        </div>
        <span style={{ color: '#475569', flexShrink: 0, fontSize: 13 }}>{isOpen ? '▲' : '▼'}</span>
      </div>
      {isOpen && threadContent}
    </div>
  )
}
