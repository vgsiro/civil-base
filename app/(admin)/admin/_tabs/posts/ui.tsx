'use client'
import { AlertTriangle, HelpCircle, Tag, Link2 } from 'lucide-react'
import type { PostRow } from '../../_lib/types'
import { timeAgo } from '../../_lib/constants'
import type { ActionMode } from './data'

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  concrete:     { bg: '#37415120', color: '#94a3b8' },
  steel:        { bg: '#1d4ed820', color: '#93c5fd' },
  composite:    { bg: '#6d28d920', color: '#c4b5fd' },
  geotechnical: { bg: '#06543020', color: '#6ee7b7' },
  others:       { bg: '#78350f20', color: '#fcd34d' },
}

interface RowProps {
  p: PostRow
  i: number
  total: number
  onWarn: (p: PostRow) => void
  onHide: (p: PostRow) => void
}

export function PostTableRow({ p, i, total, onWarn, onHide }: RowProps) {
  const catStyle = p.category ? (CATEGORY_COLORS[p.category] ?? { bg: '#33415520', color: '#94a3b8' }) : null
  return (
    <tr style={{ borderTop: i > 0 ? '1px solid #0f172a' : 'none', background: 'transparent' }}
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
          <button onClick={() => onWarn(p)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, border: '1px solid #f59e0b40', background: 'none', color: '#fbbf24', fontSize: 12, cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f59e0b15' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
            <AlertTriangle size={12} /> Warn
          </button>
          <button onClick={() => onHide(p)}
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

interface ActionModalProps {
  post: PostRow
  mode: ActionMode
  reason: string
  note: string
  loading: boolean
  onSetReason: (r: string) => void
  onSetNote: (n: string) => void
  onCancel: () => void
  onSubmit: () => void
}

const DELETE_REASONS = [
  'Violates community guidelines', 'Spam or misleading content',
  'Inappropriate or offensive content', 'Off-topic or irrelevant',
  'Copyright infringement', 'Misinformation',
]
const WARN_REASONS = [
  'Post content is too sensitive', 'Language or tone is inappropriate',
  'Unverified claims or speculation', 'Borderline guideline violation',
  'Repeated minor violations',
]

export function ActionModal({ post, mode, reason, note, loading, onSetReason, onSetNote, onCancel, onSubmit }: ActionModalProps) {
  const reasons = mode === 'delete' ? DELETE_REASONS : WARN_REASONS
  const isDelete = mode === 'delete'
  return (
    <div onClick={onCancel}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: '#1e293b', borderRadius: 14, border: '1px solid #334155', width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={16} color={isDelete ? '#f87171' : '#fbbf24'} />
          <span style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9' }}>{isDelete ? 'Hide post & warn user' : 'Warn user'}</span>
        </div>
        {isDelete && (
          <div style={{ padding: '8px 20px', background: '#ef444415', borderBottom: '1px solid #334155' }}>
            <span style={{ fontSize: 12, color: '#f87171' }}>⚠ The post will be set to private — only the author and admins can see it.</span>
          </div>
        )}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #0f172a', background: '#0f172a40' }}>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>@{post.profiles?.username}</div>
          <div style={{ fontSize: 13, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{post.body || '[no text]'}</div>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>Reason * <span style={{ fontWeight: 400, color: '#475569' }}>(select or type your own)</span></div>
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginBottom: 8 }}>
              {reasons.map(r => (
                <button key={r} onClick={() => onSetReason(r)}
                  style={{ padding: '4px 10px', borderRadius: 20, border: `1px solid ${reason === r ? (isDelete ? '#ef4444' : '#f59e0b') : '#334155'}`, background: reason === r ? (isDelete ? '#ef444420' : '#f59e0b20') : 'none', color: reason === r ? (isDelete ? '#f87171' : '#fbbf24') : '#64748b', fontSize: 11, cursor: 'pointer', fontWeight: reason === r ? 700 : 400 }}>
                  {r}
                </button>
              ))}
            </div>
            <input value={reason} onChange={e => onSetReason(e.target.value)} placeholder="Or type a custom reason…"
              style={{ width: '100%', padding: '8px 10px', background: '#0f172a', border: `1px solid ${reason ? '#334155' : '#ef444460'}`, borderRadius: 8, color: reason ? '#e2e8f0' : '#64748b', fontSize: 13, outline: 'none', boxSizing: 'border-box' as const }} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>Additional note (optional)</div>
            <textarea value={note} onChange={e => onSetNote(e.target.value)} placeholder="Add more context for the user…" rows={3}
              style={{ width: '100%', padding: '8px 10px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', fontSize: 13, outline: 'none', resize: 'vertical' as const, fontFamily: 'inherit', boxSizing: 'border-box' as const }} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={onCancel} style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid #334155', background: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
            <button onClick={onSubmit} disabled={!reason || loading}
              style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: isDelete ? (reason ? '#ef4444' : '#7f1d1d') : (reason ? '#f59e0b' : '#78350f'), color: '#fff', fontSize: 13, fontWeight: 700, cursor: reason ? 'pointer' : 'default', opacity: reason ? 1 : 0.5 }}>
              {loading ? 'Processing…' : isDelete ? 'Hide post & notify' : 'Warn user'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
