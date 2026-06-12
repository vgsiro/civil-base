'use client'
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from '../../../../i18n/LanguageContext'

function PdfFrame({ src, page }: { src: string; page: number }) {
  const [loaded, setLoaded] = useState(false)
  const { t } = useTranslation()
  return (
    <div style={{ flex: 1, position: 'relative', display: 'flex' }}>
      {!loaded && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', gap: 12 }}>
          <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ fontSize: 13, color: '#94a3b8' }}>{t('home_loading_pdf')}</span>
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}
      <iframe
        src={`${src}#page=${page}`}
        onLoad={() => setLoaded(true)}
        style={{ flex: 1, border: 'none', width: '100%', opacity: loaded ? 1 : 0, transition: 'opacity 0.2s' }}
      />
    </div>
  )
}
import { ChevronRight, FileText, Eye, Save, Pencil, ArrowLeft, ExternalLink, BookOpen, Plus, Trash2, Square, CheckSquare, ListOrdered } from 'lucide-react'
import type { LectureMindMap, MindMapNode } from '../../../../_types'

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function parseText(text: string): { title: string; nodes: MindMapNode[] } {
  const lines = text.split('\n')
  let title = ''
  const root: MindMapNode[] = []
  const stack: { node: MindMapNode; depth: number }[] = []
  let titleFound = false

  for (const raw of lines) {
    if (!raw.trim()) continue
    if (!titleFound && !raw.trim().match(/^\d/)) {
      title = raw.trim()
      titleFound = true
      continue
    }
    let depth = 0
    let content = raw.trim()
    const numberedMatch = content.match(/^(\d+(?:\.\d+)*)\s+(.+)/)
    if (numberedMatch) {
      depth = numberedMatch[1].split('.').length - 1
      content = numberedMatch[2].trim()
    } else {
      const indentStr = raw.match(/^(\s*)/)?.[1] ?? ''
      depth = indentStr.includes('\t') ? indentStr.split('\t').length - 1 : Math.floor(indentStr.length / 2)
    }
    let label = content
    let lec: number | null = null
    let page: number | null = null
    const lecMatch = content.match(/^(.*?)\s+-\s+Lec\s+(\d+)[-–](\d+)\s*$/i)
    if (lecMatch) { label = lecMatch[1].trim(); lec = parseInt(lecMatch[2]); page = parseInt(lecMatch[3]) }
    const node: MindMapNode = { id: generateId(), label, description: '', lec, page, children: [] }
    while (stack.length > 0 && stack[stack.length - 1].depth >= depth) stack.pop()
    if (stack.length === 0) root.push(node)
    else stack[stack.length - 1].node.children.push(node)
    stack.push({ node, depth })
  }
  return { title, nodes: root }
}

function nodesToText(title: string, nodes: MindMapNode[], prefix = ''): string {
  const titleLine = title ? title + '\n' : ''
  const body = nodes.map((n, i) => {
    const num = prefix ? `${prefix}.${i + 1}` : `${i + 1}`
    let line = `${num} ${n.label}`
    if (n.lec != null && n.page != null) line += ` - Lec ${n.lec}-${n.page}`
    else if (n.page != null) line += ` - Lec ?-${n.page}`
    return [line, nodesToText('', n.children, num)].filter(Boolean).join('\n')
  }).join('\n')
  return titleLine + body
}

const DEPTH_COLORS = ['#1e293b', '#8b5cf6', '#10b981', '#f59e0b']

function NodeRow({ node, depth, index, onOpenPage }: {
  node: MindMapNode; depth: number; index: number
  onOpenPage: (lec: number, page: number) => void
}) {
  const [collapsed, setCollapsed] = useState(true)
  const hasChildren = node.children.length > 0
  const color = DEPTH_COLORS[depth % DEPTH_COLORS.length]
  return (
    <div style={{ marginLeft: depth === 0 ? 0 : 18 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, position: 'relative' }}>
        {depth > 0 && <div style={{ position: 'absolute', left: -13, top: 11, width: 9, height: 1, background: '#cbd5e1' }} />}
        <button onClick={() => hasChildren && setCollapsed(c => !c)}
          style={{ background: 'none', border: 'none', cursor: hasChildren ? 'pointer' : 'default', padding: 2, marginTop: 5, color: '#94a3b8', flexShrink: 0, width: 16 }}>
          {hasChildren && <ChevronRight size={12} style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(90deg)', transition: 'transform 0.15s', display: 'block' }} />}
        </button>
        <div onClick={() => hasChildren && setCollapsed(c => !c)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0', flex: 1, minWidth: 0, cursor: hasChildren ? 'pointer' : 'default', transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s' }}
          onMouseEnter={e => { const el = e.currentTarget; el.style.background = '#f0f7ff'; el.style.borderColor = '#93c5fd'; el.style.boxShadow = '0 2px 8px rgba(59,130,246,0.10)' }}
          onMouseLeave={e => { const el = e.currentTarget; el.style.background = '#fff'; el.style.borderColor = '#e2e8f0'; el.style.boxShadow = 'none' }}>
          <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, background: color, flexShrink: 0 }} />
          {depth === 0 && <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0, minWidth: 18 }}>{index + 1}.</span>}
          <span style={{ fontSize: 13, fontWeight: depth === 0 ? 500 : 400, color: '#1e293b', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {node.label}
          </span>
          {node.page != null && (
            <button onClick={e => { e.stopPropagation(); onOpenPage(node.lec ?? 1, node.page!) }}
              style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 7px', borderRadius: 5, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#3b82f6', cursor: 'pointer', fontSize: 11, flexShrink: 0, whiteSpace: 'nowrap' }}>
              <FileText size={10} /> p.{node.page}
            </button>
          )}
        </div>
      </div>
      {!collapsed && hasChildren && (
        <div style={{ marginLeft: 18, marginTop: 3, borderLeft: '1px solid #e2e8f0' }}>
          {node.children.map((child, idx) => (
            <div key={child.id} style={{ marginTop: 3 }}>
              <NodeRow node={child} depth={depth + 1} index={idx} onOpenPage={onOpenPage} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function LectureCard({ entry, sectionId, onSave }: {
  entry: LectureMindMap
  sectionId: string
  onSave: (sectionId: string, pdfId: string, title: string, nodes: MindMapNode[]) => Promise<void>
}) {
  const { t } = useTranslation()
  const hasMap = (entry.map?.nodes?.length ?? 0) > 0
  const initialText = nodesToText(entry.map?.title ?? '', entry.map?.nodes ?? [])
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [text, setText] = useState(initialText)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pdfPreview, setPdfPreview] = useState<{ page: number } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const dirtyRef = useRef(false)

  useEffect(() => { dirtyRef.current = dirty }, [dirty])

  const mapUpdatedAt = entry.map?.updated_at
  useEffect(() => {
    if (dirtyRef.current) return
    setText(nodesToText(entry.map?.title ?? '', entry.map?.nodes ?? []))
    setDirty(false)
  }, [mapUpdatedAt, entry.pdfId])

  const { title: parsedTitle, nodes: parsedNodes } = parseText(text)

  async function handleSave() {
    const { title, nodes } = parseText(text)
    setSaving(true)
    await onSave(sectionId, entry.pdfId, title, nodes)
    setSaving(false)
    dirtyRef.current = false
    setDirty(false)
    setMode('view')
  }

  function handleTab(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== 'Tab') return
    e.preventDefault()
    const ta = e.currentTarget
    const start = ta.selectionStart; const end = ta.selectionEnd
    const next = text.slice(0, start) + '  ' + text.slice(end)
    setText(next); setDirty(true)
    setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + 2 }, 0)
  }

  return (
    <>
    <div style={{ border: `1px solid ${open ? '#bfdbfe' : '#e2e8f0'}`, borderRadius: 10, overflow: 'hidden', marginBottom: 8, transition: 'border-color 0.15s' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: open ? '#f0f7ff' : '#fff', cursor: 'pointer', transition: 'background 0.15s, box-shadow 0.15s' }}
        onClick={() => setOpen(o => !o)}
        onMouseEnter={e => { const el = e.currentTarget; if (!open) el.style.background = '#f0f7ff'; el.style.boxShadow = 'inset 0 -2px 0 #bfdbfe' }}
        onMouseLeave={e => { const el = e.currentTarget; if (!open) el.style.background = '#fff'; el.style.boxShadow = 'none' }}>
        <div style={{ width: 4, height: 18, borderRadius: 2, background: '#3b82f6', flexShrink: 0 }} />
        <BookOpen size={13} color={hasMap ? '#3b82f6' : '#94a3b8'} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: '#fff', background: hasMap ? '#3b82f6' : '#94a3b8', padding: '1px 6px', borderRadius: 5, flexShrink: 0 }}>
          Lec {entry.lecNumber}
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: hasMap ? '#1e293b' : '#94a3b8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {hasMap && entry.map?.title ? entry.map.title : entry.pdfName}
        </span>
        {dirty && <span style={{ fontSize: 11, color: '#f59e0b', background: '#fef3c7', padding: '1px 6px', borderRadius: 8, flexShrink: 0 }}>unsaved</span>}
        {open && (
          <div onClick={e => e.stopPropagation()} style={{ display: 'flex', background: '#f1f5f9', borderRadius: 6, padding: 2, gap: 2, flexShrink: 0 }}>
            <button onClick={() => setMode('view')} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 11, background: mode === 'view' ? '#fff' : 'transparent', color: mode === 'view' ? '#1e293b' : '#94a3b8', boxShadow: mode === 'view' ? '0 1px 2px rgba(0,0,0,0.07)' : 'none' }}>
              <Eye size={11} /> View
            </button>
            <button onClick={() => setMode('edit')} style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 4, border: 'none', cursor: 'pointer', fontSize: 11, background: mode === 'edit' ? '#fff' : 'transparent', color: mode === 'edit' ? '#1e293b' : '#94a3b8', boxShadow: mode === 'edit' ? '0 1px 2px rgba(0,0,0,0.07)' : 'none' }}>
              <Pencil size={11} /> Edit
            </button>
          </div>
        )}
        {open && mode === 'edit' && (
          <button onClick={e => { e.stopPropagation(); handleSave() }} disabled={!dirty || saving}
            style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 10px', borderRadius: 6, border: 'none', cursor: dirty ? 'pointer' : 'default', fontSize: 11, background: dirty ? '#3b82f6' : '#e2e8f0', color: dirty ? '#fff' : '#94a3b8', flexShrink: 0 }}>
            <Save size={11} /> {saving ? 'Saving…' : 'Save'}
          </button>
        )}
        <button onClick={e => { e.stopPropagation(); window.open(entry.pdfUrl, '_blank') }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px', borderRadius: 5, display: 'flex', flexShrink: 0 }} title={t('home_mm_open_pdf')}>
          <ExternalLink size={12} />
        </button>
        <ChevronRight size={14} color="#94a3b8" style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s', flexShrink: 0 }} />
      </div>

      {open && (
        <div>
          {mode === 'edit' ? (
            <div style={{ background: '#f8fafc' }}>
              <div style={{ padding: '5px 12px', background: '#fffbeb', borderTop: '1px solid #fef3c7', fontSize: 10, color: '#92400e' }}>
                Line 1: title&nbsp;|&nbsp;
                <span style={{ fontFamily: 'monospace' }}>1 Topic - Lec N-PAGE</span>&nbsp;/&nbsp;
                <span style={{ fontFamily: 'monospace' }}>1.1 Sub - Lec N-PAGE</span>
              </div>
              <textarea ref={textareaRef} value={text}
                onChange={e => { setText(e.target.value); setDirty(true) }}
                onKeyDown={handleTab} spellCheck={false}
                placeholder={`Topic title\n1 Main topic - Lec N-10\n1.1 Sub-topic - Lec N-45\n2 Another topic - Lec N-80`}
                style={{ width: '100%', minHeight: 180, resize: 'vertical', border: 'none', outline: 'none', padding: '10px 14px', fontFamily: 'ui-monospace, monospace', fontSize: 12, lineHeight: 1.7, background: '#f8fafc', color: '#1e293b', boxSizing: 'border-box' }}
              />
            </div>
          ) : parsedNodes.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
              No content yet —{' '}
              <button onClick={() => setMode('edit')} style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}>
                add outline
              </button>
            </div>
          ) : (
            <div style={{ padding: '10px 12px', background: '#fafbfc' }}>
              {parsedTitle && (
                <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid #f1f5f9' }}>
                  {parsedTitle}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {parsedNodes.map((node, idx) => (
                  <NodeRow key={node.id} node={node} depth={0} index={idx}
                    onOpenPage={(_lec, page) => setPdfPreview({ page })} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>

    {pdfPreview && (
      <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} onClick={() => setPdfPreview(null)} />
        <div style={{ position: 'relative', width: 'calc(100vw - 48px)', maxWidth: 1100, height: 'calc(100vh - 48px)', background: '#fff', borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid #e2e8f0', background: '#fff', flexShrink: 0 }}>
            <button onClick={() => setPdfPreview(null)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 12, padding: '4px 8px', borderRadius: 6 }}
              onMouseEnter={e => (e.currentTarget.style.color = '#1e293b')}
              onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}>
              <ArrowLeft size={13} /> Close
            </button>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#1e293b', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {entry.pdfName} — p.{pdfPreview.page}
            </span>
            <button onClick={() => window.open(entry.pdfUrl, '_blank')}
              style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 12, padding: '4px 8px', borderRadius: 6 }}>
              <ExternalLink size={13} /> New tab
            </button>
          </div>
          <PdfFrame src={entry.pdfUrl} page={pdfPreview.page} />
        </div>
      </div>
    )}
    </>
  )
}

function BulkAdd({ lectureMaps, sectionId, onSave, onClose }: {
  lectureMaps: LectureMindMap[]
  sectionId: string
  onSave: (sectionId: string, pdfId: string, title: string, nodes: MindMapNode[]) => Promise<void>
  onClose: () => void
}) {
  const placeholder = lectureMaps.slice(0, 2).map(e =>
    `${e.pdfName}\n1 Main topic - Lec N-10\n1.1 Sub-topic - Lec N-20`
  ).join('\n\n') + '\n\n...'

  const { t } = useTranslation()
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [log, setLog] = useState<string[]>([])

  async function handleSave() {
    const blocks = text.split(/\n\s*===+\s*\n/).map(b => b.trim()).filter(Boolean)
    setSaving(true)

    const results: string[] = []
    const usedPdfIds = new Set<string>()

    for (let blockIdx = 0; blockIdx < blocks.length; blockIdx++) {
      const block = blocks[blockIdx]
      const lines = block.split('\n')
      const firstLine = lines[0].trim()
      const available = lectureMaps.filter(e => !usedPdfIds.has(e.pdfId))

      let match: LectureMindMap | undefined

      const lecNums = new Set<number>()
      for (const line of lines.slice(1)) {
        const m = line.match(/[-–]\s*Lec\s+(\d+)-/i)
        if (m) lecNums.add(parseInt(m[1]))
      }
      if (lecNums.size === 1) {
        const lec = [...lecNums][0]
        match = available.find(e => e.lecNumber === lec)
      }

      if (!match) {
        match = available[0]
      }

      if (!match) { results.push(`✗ No lecture slot for block ${blockIdx + 1}: "${firstLine}"`); continue }
      usedPdfIds.add(match.pdfId)
      const { title, nodes } = parseText(block)
      await onSave(sectionId, match.pdfId, title, nodes)
      results.push(`✓ "${firstLine}" → Lec ${match.lecNumber} (${match.pdfName})`)
    }
    setSaving(false)
    setLog(results)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', flex: 1 }}>{t('home_mm_bulk_add')}</span>
        <span style={{ fontSize: 11, color: '#94a3b8' }}>{t('home_mm_bulk_hint_1')} <code>===</code>{t('home_mm_bulk_hint_2')} <code>Lec N-page</code> {t('home_mm_bulk_hint_3')}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 12, padding: '3px 8px', borderRadius: 6 }}>✕ {t('home_cancel')}</button>
        <button onClick={handleSave} disabled={!text.trim() || saving}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 14px', borderRadius: 7, border: 'none', cursor: text.trim() ? 'pointer' : 'default', fontSize: 12, background: text.trim() ? '#3b82f6' : '#e2e8f0', color: text.trim() ? '#fff' : '#94a3b8' }}>
          <Save size={12} /> {saving ? 'Saving…' : 'Save All'}
        </button>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <textarea value={text} onChange={e => { setText(e.target.value); setLog([]) }}
          spellCheck={false}
          placeholder={placeholder}
          style={{ flex: 1, resize: 'none', border: 'none', outline: 'none', padding: '14px 16px', fontFamily: 'ui-monospace, monospace', fontSize: 12, lineHeight: 1.7, background: '#f8fafc', color: '#1e293b' }}
        />
        {log.length > 0 && (
          <div style={{ padding: '10px 14px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', fontSize: 12, lineHeight: 1.8 }}>
            {log.map((l, i) => (
              <div key={i} style={{ color: l.startsWith('✓') ? '#16a34a' : '#dc2626' }}>{l}</div>
            ))}
            <button onClick={onClose} style={{ marginTop: 8, padding: '3px 12px', borderRadius: 6, background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12 }}>{t('home_done')}</button>
          </div>
        )}
      </div>
    </div>
  )
}

interface Props {
  sectionId: string
  lectureMaps: LectureMindMap[]
  pdfOrder: string[]
  onSave: (sectionId: string, pdfId: string, title: string, nodes: MindMapNode[]) => Promise<void>
  onDelete: (pdfIds: string[]) => Promise<void>
}

export default function MindMapPanel({ sectionId, lectureMaps, pdfOrder, onSave, onDelete }: Props) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [selectMode, setSelectMode] = useState(false)
  const [bulkAdd, setBulkAdd] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [localMaps, setLocalMaps] = useState<LectureMindMap[]>(lectureMaps)

  useEffect(() => {
    setLocalMaps(lectureMaps)
  }, [lectureMaps, sectionId])

  function applyLectureOrder() {
    if (!pdfOrder.length) return
    const byId = new Map(localMaps.map(m => [m.pdfId, m]))
    const ordered = pdfOrder.map(id => byId.get(id)).filter(Boolean) as LectureMindMap[]
    const rest = localMaps.filter(m => !pdfOrder.includes(m.pdfId))
    setLocalMaps([...ordered, ...rest])
  }

  function toggleSelect(pdfId: string) {
    setSelected(prev => { const n = new Set(prev); n.has(pdfId) ? n.delete(pdfId) : n.add(pdfId); return n })
  }

  async function handleDelete() {
    const ids = [...selected]
    if (!ids.length || !confirm(`Clear mind map data for ${ids.length} lecture${ids.length > 1 ? 's' : ''}?`)) return
    setDeleting(true)
    await onDelete(ids)
    setDeleting(false)
    setSelected(new Set())
    setSelectMode(false)
  }

  if (bulkAdd) {
    return <BulkAdd lectureMaps={lectureMaps} sectionId={sectionId} onSave={onSave} onClose={() => setBulkAdd(false)} />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f8fafc' }}>
      {selectMode ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid #e2e8f0', background: '#fef2f2' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#dc2626', flex: 1 }}>{selected.size} selected</span>
          <button onClick={() => setSelected(new Set(lectureMaps.filter(e => e.map).map(e => e.pdfId)))}
            style={{ fontSize: 12, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer' }}>{t('home_mm_select_all_with_data')}</button>
          <button onClick={handleDelete} disabled={!selected.size || deleting}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 7, border: 'none', cursor: selected.size ? 'pointer' : 'default', fontSize: 12, background: selected.size ? '#ef4444' : '#e2e8f0', color: selected.size ? '#fff' : '#94a3b8' }}>
            <Trash2 size={12} /> {deleting ? t('home_mm_clearing') : t('home_mm_clear_data')}
          </button>
          <button onClick={() => { setSelectMode(false); setSelected(new Set()) }}
            style={{ fontSize: 12, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>{t('home_cancel')}</button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
          <span style={{ fontSize: 15 }}>🗺️</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{t('home_mm_title')}</span>
          <span style={{ fontSize: 11, color: '#94a3b8', flex: 1 }}>{lectureMaps.length} lecture{lectureMaps.length !== 1 ? 's' : ''}</span>
          <button onClick={applyLectureOrder} disabled={!pdfOrder.length}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, background: pdfOrder.length ? '#f0fdf4' : '#f1f5f9', border: `1px solid ${pdfOrder.length ? '#86efac' : '#e2e8f0'}`, color: pdfOrder.length ? '#16a34a' : '#94a3b8', cursor: pdfOrder.length ? 'pointer' : 'default', fontSize: 12 }}
            title={t('home_mm_sort_tip')}>
            <ListOrdered size={12} /> Apply Order
          </button>
          <button onClick={() => setBulkAdd(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 7, background: '#3b82f6', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 12 }}>
            <Plus size={12} /> Add All
          </button>
          <button onClick={() => setSelectMode(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#64748b', cursor: 'pointer', fontSize: 12 }}>
            <Trash2 size={12} /> Delete
          </button>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {lectureMaps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
            <span style={{ fontSize: 32, display: 'block', marginBottom: 8 }}>🗺️</span>
            <p style={{ fontSize: 13 }}>No lecture notes found.</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>{t('home_mm_upload_first')}</p>
          </div>
        ) : (
          localMaps.map((entry) => (
            <div key={entry.pdfId} style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              {selectMode && (
                <button onClick={() => toggleSelect(entry.pdfId)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '10px 2px', color: selected.has(entry.pdfId) ? '#ef4444' : '#cbd5e1', flexShrink: 0 }}>
                  {selected.has(entry.pdfId) ? <CheckSquare size={16} /> : <Square size={16} />}
                </button>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <LectureCard entry={entry} sectionId={sectionId} onSave={onSave} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
