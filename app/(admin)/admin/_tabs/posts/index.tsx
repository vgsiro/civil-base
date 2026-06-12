'use client'
import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { PostRow, Warning, RangeMode } from '../../_lib/types'
import { fetchPosts, submitPostAction, type ActionMode } from './data'
import { PostTableRow, ActionModal } from './ui'

interface Props {
  posts: PostRow[]
  setPosts: React.Dispatch<React.SetStateAction<PostRow[]>>
  setWarnings: React.Dispatch<React.SetStateAction<Warning[]>>
  loading: boolean
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
  range: RangeMode
}

export default function PostsTab({ posts, setPosts, setWarnings, loading, setLoading, range }: Props) {
  const [postSection, setPostSection] = useState<'clean' | 'warned' | 'hidden'>('clean')
  const [postTypeFilter, setPostTypeFilter] = useState('all')
  const [postCategoryFilter, setPostCategoryFilter] = useState('all')
  const [actionModal, setActionModal] = useState<{ post: PostRow; mode: ActionMode } | null>(null)
  const [actionReason, setActionReason] = useState('')
  const [actionNote, setActionNote] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  async function refresh() {
    setLoading(true)
    setPosts(await fetchPosts(supabase, range))
    setLoading(false)
  }

  async function handleAction() {
    if (!actionModal || !actionReason) return
    setActionLoading(true)
    const { post, mode } = actionModal
    const newVisibility = mode === 'warn' ? 'warn_limited' : 'admin_hidden'
    const warning = await submitPostAction(supabase, post, mode, actionReason, actionNote)
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, visibility: newVisibility } : p))
    setWarnings(prev => [warning, ...prev])
    setActionModal(null); setActionReason(''); setActionNote(''); setActionLoading(false)
  }

  const cleanPosts  = posts.filter(p => p.visibility !== 'admin_hidden' && p.visibility !== 'warn_limited')
  const warnedPosts = posts.filter(p => p.visibility === 'warn_limited')
  const hiddenPosts = posts.filter(p => p.visibility === 'admin_hidden')

  const sectionDef = [
    { key: 'clean'  as const, label: 'Clean',  count: cleanPosts.length,  color: '#60a5fa', activeBg: '#3b82f620', activeBorder: '#3b82f660' },
    { key: 'warned' as const, label: 'Warned', count: warnedPosts.length, color: '#fbbf24', activeBg: '#f59e0b20', activeBorder: '#f59e0b60' },
    { key: 'hidden' as const, label: 'Hidden', count: hiddenPosts.length, color: '#f87171', activeBg: '#ef444420', activeBorder: '#ef444460' },
  ]

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

  const selectStyle = { padding: '6px 10px', background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0', fontSize: 12, outline: 'none', cursor: 'pointer' } as const

  return (
    <div>
      {actionModal && (
        <ActionModal post={actionModal.post} mode={actionModal.mode}
          reason={actionReason} note={actionNote} loading={actionLoading}
          onSetReason={setActionReason} onSetNote={setActionNote}
          onCancel={() => { setActionModal(null); setActionReason(''); setActionNote('') }}
          onSubmit={handleAction} />
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9' }}>Posts</div>
        <button onClick={refresh} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid #334155', background: 'none', color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {!loading && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap' as const, gap: 10 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
            {sectionDef.map(s => (
              <button key={s.key} onClick={() => setPostSection(s.key)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 20, border: `1px solid ${postSection === s.key ? s.activeBorder : '#334155'}`, background: postSection === s.key ? s.activeBg : 'none', color: postSection === s.key ? s.color : '#64748b', fontSize: 13, fontWeight: postSection === s.key ? 700 : 400, cursor: 'pointer' }}>
                {s.label}
                <span style={{ background: postSection === s.key ? s.color : '#334155', color: postSection === s.key ? '#0f172a' : '#94a3b8', borderRadius: 20, fontSize: 11, fontWeight: 800, padding: '1px 7px', minWidth: 20, textAlign: 'center' as const }}>
                  {s.count}
                </span>
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={postTypeFilter} onChange={e => setPostTypeFilter(e.target.value)} style={selectStyle}>
              <option value="all">All types</option>
              <option value="question">Question</option>
              <option value="discussion">Discussion</option>
              <option value="text">Text</option>
              <option value="image">Image</option>
              <option value="link">Link</option>
              <option value="reshare">Reshare</option>
            </select>
            <select value={postCategoryFilter} onChange={e => setPostCategoryFilter(e.target.value)} style={selectStyle}>
              <option value="all">All categories</option>
              <option value="concrete">Concrete</option>
              <option value="steel">Steel</option>
              <option value="composite">Composite</option>
              <option value="geotechnical">Geotechnical</option>
              <option value="others">Others</option>
            </select>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ color: '#64748b', fontSize: 14, padding: '40px 0', textAlign: 'center' as const }}>Loading…</div>
      ) : (
        <div style={{ background: '#1e293b', borderRadius: 12, border: `1px solid ${sectionBorder}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' as const, tableLayout: 'fixed' as const }}>
            <colgroup><col style={{ width: 36 }} /><col style={{ width: '18%' }} /><col /><col style={{ width: '22%' }} /><col style={{ width: '10%' }} /><col style={{ width: '16%' }} /></colgroup>
            <thead>
              <tr style={{ background: '#0f172a' }}>
                {['#', 'Author', 'Content', 'Type / Category', 'Date', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left' as const, fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: 0.8 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sectionRows.map((p, i) => (
                <PostTableRow key={p.id} p={p} i={i} total={sectionRows.length}
                  onWarn={p => { setActionModal({ post: p, mode: 'warn' }); setActionReason(''); setActionNote('') }}
                  onHide={p => { setActionModal({ post: p, mode: 'delete' }); setActionReason(''); setActionNote('') }} />
              ))}
            </tbody>
          </table>
          {sectionRows.length === 0 && <div style={{ padding: '32px', textAlign: 'center' as const, color: '#475569', fontSize: 13 }}>No posts.</div>}
        </div>
      )}
    </div>
  )
}
