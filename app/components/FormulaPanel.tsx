'use client'
import { useRef, useState, useEffect } from 'react'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import FormulaViewer from './FormulaViewer'
import type { Section, Formula } from '../types'

// Renders a short preview of formula content — strips old KaTeX, re-renders with current version
function FormulaPreview({ content }: { content: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!ref.current || !content) return
    import('katex').then(({ default: katex }) => {
      if (!ref.current) return
      let html = content
      // Strip old KaTeX spans back to $tex$
      const tmp = document.createElement('div')
      tmp.innerHTML = html
      tmp.querySelectorAll('.katex-display').forEach(el => {
        const tex = el.querySelector('annotation')?.textContent?.trim()
        if (tex) el.replaceWith(`$$${tex}$$`)
      })
      tmp.querySelectorAll('.katex').forEach(el => {
        const tex = el.querySelector('annotation')?.textContent?.trim()
        if (tex) el.replaceWith(`$${tex}$`)
      })
      html = tmp.innerHTML
      ref.current.innerHTML = html
      // Re-render $...$ with current katex
      const walker = document.createTreeWalker(ref.current, NodeFilter.SHOW_TEXT)
      const nodes: Text[] = []
      let n: Node | null
      while ((n = walker.nextNode())) nodes.push(n as Text)
      for (const tn of nodes) {
        const text = tn.textContent || ''
        if (!text.includes('$')) continue
        const span = document.createElement('span')
        span.innerHTML = text
          .replace(/\$\$([^$]+)\$\$/g, (_: string, tex: string) => {
            try { return katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false }) } catch { return _ }
          })
          .replace(/\$([^$\n]+)\$/g, (_: string, tex: string) => {
            try { return katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false }) } catch { return _ }
          })
        tn.replaceWith(span)
      }
    })
  }, [content])
  return <div ref={ref} style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', maxHeight: '60px', overflow: 'hidden', pointerEvents: 'none' }} />
}

// Renders a name that may contain $..$ LaTeX
function FormulaName({ name }: { name: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!ref.current) return
    if (!name.includes('$')) { ref.current.textContent = name; return }
    import('katex').then(({ default: katex }) => {
      if (!ref.current) return
      ref.current.innerHTML = name.replace(/\$([^$\n]+)\$/g, (_: string, tex: string) => {
        try { return katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false }) } catch { return _ }
      })
    })
  }, [name])
  return <span ref={ref} />
}

interface FormulaPanelProps {
  selectedSection: Section | null
  formulas: Formula[]
  highlightFormulaId?: string | null
  onReloadFormulas: (sectionId: string) => void
  setResizingImg: (v: any) => void
}

export default function FormulaPanel({
  selectedSection, formulas, highlightFormulaId, onReloadFormulas, setResizingImg,
}: FormulaPanelProps) {
  const [editingFormula, setEditingFormula] = useState<any>(null)
  const [formulaName, setFormulaName] = useState('')
  const [savingFormula, setSavingFormula] = useState(false)
  const [bulkFormulaMode, setBulkFormulaMode] = useState(false)
  const [bulkFormulaText, setBulkFormulaText] = useState('')
  const [bulkSaving, setBulkSaving] = useState(false)
  const [bulkLog, setBulkLog] = useState<string[]>([])
  const editorRef = useRef<HTMLDivElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)

  // Scroll to highlighted formula when it changes
  useEffect(() => {
    if (highlightFormulaId && highlightRef.current) {
      setTimeout(() => highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
    }
  }, [highlightFormulaId])

  function openNewFormula() {
    setEditingFormula({ isNew: true, isEditing: true })
    setFormulaName('')
    setTimeout(() => { if (editorRef.current) editorRef.current.innerHTML = '' }, 0)
  }

  function openViewFormula(f: Formula) {
    setEditingFormula({ ...f, isEditing: false })
  }

  function startEditFormula(f: any) {
    setEditingFormula({ ...f, isEditing: true })
    setFormulaName(f.name)
    setTimeout(() => {
      if (!editorRef.current) return
      const html = getFormulaHtml(f)
      editorRef.current.innerHTML = html
    }, 0)
  }

  function getFormulaHtml(f: any): string {
    if (!f.content) return ''
    if (f.content.startsWith('<') || f.content.includes('</')) return f.content
    try {
      const parsed = JSON.parse(f.content)
      if (Array.isArray(parsed)) {
        return parsed.map((b: any) =>
          b.type === 'image'
            ? `<img src="${b.content}" style="max-width:100%;border-radius:6px;margin:4px 0"/>`
            : `<p>${b.content.replace(/\n/g, '<br/>')}</p>`
        ).join('')
      }
    } catch {}
    let html = `<p>${f.content.replace(/\n/g, '<br/>')}</p>`
    for (const img of (f.images || [])) html += `<img src="${img}" style="max-width:100%;border-radius:6px;margin:4px 0"/>`
    return html
  }

  async function saveFormula() {
    if (!formulaName.trim() || !selectedSection || !editorRef.current) return
    setSavingFormula(true)
    let html = editorRef.current.innerHTML
    // Upload base64 images
    const base64Regex = /src="(data:image\/[^"]+)"/g
    for (const match of [...html.matchAll(base64Regex)]) {
      const dataUrl = match[1]
      const res = await fetch(dataUrl)
      const blob = await res.blob()
      const ext = blob.type.split('/')[1] || 'png'
      const path = `formulas/${selectedSection.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('pdfs').upload(path, blob, { contentType: blob.type })
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('pdfs').getPublicUrl(path)
        html = html.replace(dataUrl, publicUrl)
      }
    }
    let error
    if (editingFormula?.isNew) {
      const { error: e } = await supabase.from('formulas').insert({
        section_id: selectedSection.id, name: formulaName, content: html, images: [],
      })
      error = e
    } else {
      const { error: e } = await supabase.from('formulas').update({
        name: formulaName, content: html, images: [], updated_at: new Date().toISOString(),
      }).eq('id', editingFormula.id)
      error = e
    }
    setSavingFormula(false)
    if (error) { alert('Save failed: ' + error.message); return }
    await onReloadFormulas(selectedSection.id)
    const { data: fresh } = await supabase.from('formulas').select('*')
      .eq('section_id', selectedSection.id).eq('name', formulaName)
      .order('created_at', { ascending: false }).limit(1).single()
    setEditingFormula(fresh ? { ...fresh, isEditing: false } : null)
  }

  async function deleteFormula(e: React.MouseEvent, f: Formula) {
    e.stopPropagation()
    if (!confirm(`Delete formula "${f.name}"?`)) return
    await supabase.from('formulas').delete().eq('id', f.id)
    if (selectedSection) onReloadFormulas(selectedSection.id)
  }

  async function saveBulkFormulas() {
    if (!selectedSection || !bulkFormulaText.trim()) return
    // Split on lines that are exactly "---" (or "---..." any length dashes, at least 3)
    const blocks = bulkFormulaText.split(/\n\s*(-{3,}|={3,})\s*\n/).filter(b => !b.match(/^[-=]+$/)).map(b => b.trim()).filter(Boolean)
    setBulkSaving(true)
    const log: string[] = []
    for (const block of blocks) {
      const lines = block.split('\n')
      const name = lines[0].trim()
      if (!name) continue
      const content = lines.slice(1).join('\n').trim()
      const html = content ? `<p>${content.replace(/\n/g, '<br/>')}</p>` : ''
      const { error } = await supabase.from('formulas').insert({
        section_id: selectedSection.id, name, content: html, images: [],
      })
      log.push(error ? `✗ ${name}: ${error.message}` : `✓ ${name}`)
    }
    setBulkSaving(false)
    setBulkLog(log)
    await onReloadFormulas(selectedSection.id)
  }

  function handleEditorPaste(e: React.ClipboardEvent<HTMLDivElement>) {
    const items = Array.from(e.clipboardData.items)
    const imageItem = items.find(i => i.type.startsWith('image/'))
    if (!imageItem) return
    e.preventDefault()
    const blob = imageItem.getAsFile()
    if (!blob) return
    const reader = new FileReader()
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string
      if (!dataUrl || !editorRef.current) return
      const img = document.createElement('img')
      img.src = dataUrl; img.style.maxWidth = '100%'; img.style.borderRadius = '6px'
      img.style.margin = '4px 0'; img.style.display = 'block'
      const sel = window.getSelection()
      if (sel && sel.rangeCount) {
        const range = sel.getRangeAt(0)
        range.deleteContents(); range.insertNode(img)
        range.setStartAfter(img); range.collapse(true)
        sel.removeAllRanges(); sel.addRange(range)
      } else { editorRef.current.appendChild(img) }
    }
    reader.readAsDataURL(blob)
  }

  function insertImageFromFile(file: File) {
    const reader = new FileReader()
    reader.onload = ev => {
      const dataUrl = ev.target?.result as string
      if (!dataUrl || !editorRef.current) return
      const img = document.createElement('img')
      img.src = dataUrl; img.style.maxWidth = '100%'; img.style.borderRadius = '6px'
      img.style.margin = '4px 0'; img.style.display = 'block'
      editorRef.current.appendChild(img); editorRef.current.focus()
    }
    reader.readAsDataURL(file)
  }

  return (
    <div style={{ flex: 1, background: '#f8fafc', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Formula Header */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {editingFormula && (
          <button onClick={() => setEditingFormula(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#1e293b')}
            onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}>
            <ArrowLeft size={14} /> Back
          </button>
        )}
        <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', flex: 1 }}>
          {editingFormula
          ? (editingFormula.isEditing
            ? (editingFormula.isNew ? 'New Formula' : 'Edit Formula')
            : <FormulaName name={editingFormula.name} />)
          : selectedSection?.name}
        </span>
        {!editingFormula && !bulkFormulaMode && (
          <>
            <button onClick={openNewFormula}
              style={{ padding: '6px 14px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
              + New
            </button>
            <button onClick={() => { setBulkFormulaMode(true); setBulkFormulaText(''); setBulkLog([]) }}
              style={{ padding: '6px 14px', background: '#fff', color: '#f59e0b', border: '1px solid #f59e0b', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
              + Bulk
            </button>
          </>
        )}
        {bulkFormulaMode && (
          <>
            <button onClick={saveBulkFormulas} disabled={!bulkFormulaText.trim() || bulkSaving}
              style={{ padding: '5px 16px', background: bulkFormulaText.trim() ? '#f59e0b' : '#e2e8f0', color: bulkFormulaText.trim() ? 'white' : '#94a3b8', border: 'none', borderRadius: '7px', cursor: bulkFormulaText.trim() ? 'pointer' : 'default', fontSize: '13px', fontWeight: '500' }}>
              {bulkSaving ? 'Saving...' : 'Save All'}
            </button>
            <button onClick={() => { setBulkFormulaMode(false); setBulkLog([]) }}
              style={{ padding: '5px 12px', background: 'none', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '7px', cursor: 'pointer', fontSize: '13px' }}>
              Cancel
            </button>
          </>
        )}
        {editingFormula && !editingFormula.isEditing && !editingFormula.isNew && (
          <>
            <button onClick={() => startEditFormula(editingFormula)}
              style={{ padding: '5px 14px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Pencil size={13} /> Edit
            </button>
            <button onClick={e => { deleteFormula(e, editingFormula); setEditingFormula(null) }}
              style={{ padding: '5px 10px', background: 'none', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '7px', cursor: 'pointer', fontSize: '13px' }}>
              <Trash2 size={14} />
            </button>
          </>
        )}
        {editingFormula?.isEditing && (
          <button onClick={saveFormula} disabled={savingFormula || !formulaName.trim()}
            style={{ padding: '5px 16px', background: !formulaName.trim() ? '#e2e8f0' : '#f59e0b', color: !formulaName.trim() ? '#94a3b8' : 'white', border: 'none', borderRadius: '7px', cursor: !formulaName.trim() ? 'default' : 'pointer', fontSize: '13px', fontWeight: '500' }}>
            {savingFormula ? 'Saving...' : 'Save'}
          </button>
        )}
      </div>

      {bulkFormulaMode ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '6px 14px', background: '#fffbeb', borderBottom: '1px solid #fef3c7', fontSize: '11px', color: '#92400e', lineHeight: 1.6 }}>
            <strong>Format:</strong> First line = formula name, then content. Separate formulas with <code>---</code> on its own line. Use <code>$...$</code> for inline LaTeX, <code>$$...$$</code> for block.
          </div>
          <textarea
            value={bulkFormulaText}
            onChange={e => { setBulkFormulaText(e.target.value); setBulkLog([]) }}
            spellCheck={false}
            placeholder={`Bending Moment\n$$M = \\frac{wL^2}{8}$$\n\n---\n\nShear Force\n$$V = \\frac{wL}{2}$$\n\n---\n\nEuler Buckling Load\n$$P_{cr} = \\frac{\\pi^2 EI}{L_e^2}$$`}
            style={{ flex: 1, resize: 'none', border: 'none', outline: 'none', padding: '14px 16px', fontFamily: 'ui-monospace, monospace', fontSize: '13px', lineHeight: 1.7, background: '#f8fafc', color: '#1e293b' }}
          />
          {bulkLog.length > 0 && (
            <div style={{ padding: '10px 16px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '12px', lineHeight: 1.8 }}>
              {bulkLog.map((l, i) => (
                <div key={i} style={{ color: l.startsWith('✓') ? '#16a34a' : '#dc2626' }}>{l}</div>
              ))}
              <button onClick={() => { setBulkFormulaMode(false); setBulkLog([]) }}
                style={{ marginTop: 8, padding: '3px 14px', borderRadius: 6, background: '#f59e0b', color: '#fff', border: 'none', cursor: 'pointer', fontSize: '12px' }}>Done</button>
            </div>
          )}
        </div>
      ) : !editingFormula ? (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {formulas.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
              <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>∑</span>
              <p>No formulas yet</p>
              <p style={{ fontSize: '13px', marginTop: '8px' }}>Click &quot;+ New Formula&quot; to add one</p>
            </div>
          )}
          {formulas.map(f => {
            const isHighlighted = f.id === highlightFormulaId
            return (
            <div key={f.id} ref={isHighlighted ? highlightRef : null} onClick={() => openViewFormula(f)}
              style={{ background: isHighlighted ? '#fffbeb' : 'white', borderRadius: '10px', padding: '14px 16px', marginBottom: '10px', border: `1px solid ${isHighlighted ? '#f59e0b' : '#e2e8f0'}`, cursor: 'pointer', transition: 'box-shadow 0.15s', boxShadow: isHighlighted ? '0 0 0 3px rgba(245,158,11,0.2)' : 'none' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = isHighlighted ? '0 0 0 3px rgba(245,158,11,0.3)' : '0 2px 8px rgba(0,0,0,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = isHighlighted ? '0 0 0 3px rgba(245,158,11,0.2)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                    <FormulaName name={f.name} />
                  </p>
                  {f.content && <FormulaPreview content={f.content} />}
                </div>
                <button onClick={e => deleteFormula(e, f)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: '2px', flexShrink: 0 }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#cbd5e1')}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )})}
        </div>
      ) : editingFormula.isEditing ? (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input value={formulaName} onChange={e => setFormulaName(e.target.value)}
            placeholder="Formula name (e.g. Euler Buckling Load)"
            style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '15px', fontWeight: '600', outline: 'none', boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Type text, paste images (Ctrl+V), use $…$ for inline LaTeX or $$…$$ for block</span>
            <label style={{ fontSize: '11px', color: '#f59e0b', cursor: 'pointer', fontWeight: '500', whiteSpace: 'nowrap', marginLeft: 'auto' }}>
              + image
              <input type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) insertImageFromFile(f); e.target.value = '' }} />
            </label>
          </div>
          <div ref={editorRef} contentEditable suppressContentEditableWarning
            onPaste={handleEditorPaste}
            onMouseDown={e => {
              const img = e.target as HTMLImageElement
              if (img.tagName !== 'IMG') return
              e.preventDefault()
              setResizingImg({ el: img, startX: e.clientX, startW: img.offsetWidth })
            }}
            style={{ flex: 1, minHeight: '400px', padding: '12px 14px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', lineHeight: '1.8', outline: 'none', fontFamily: 'inherit', background: 'white', overflowY: 'auto', cursor: 'text' }} />
          <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>Drag image edges to resize • Ctrl+V pastes image at cursor</p>
        </div>
      ) : (
        <FormulaViewer key={editingFormula.id} html={editingFormula.content || ''} />
      )}
    </div>
  )
}
