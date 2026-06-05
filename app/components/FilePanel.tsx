'use client'
import { useRef, useState, useEffect } from 'react'
import { FolderOpen, FileText, Trash2, CheckSquare, Square, MessageCircle, ExternalLink, Pencil, Image, GripVertical } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import MindMapPanel from './MindMapPanel'
import FormulaPanel from './FormulaPanel'
import PdfPreviewModal from './PdfPreviewModal'
import type { Section, Pdf, Formula, LectureMindMap, MindMapNode, UploadQueueItem } from '../types'

interface Props {
  selectedSection: Section | null
  pdfs: Pdf[]
  formulas: Formula[]
  uploadQueue: UploadQueueItem[]
  uploading: boolean
  selectMode: boolean
  selectedPdfIds: Set<string>
  onToggleSelectPdf: (id: string) => void
  onDeletePdf: (e: React.MouseEvent, p: Pdf) => void
  onOpenPdfChat: (e: React.MouseEvent, p: Pdf) => void
  onStartUploads: (files: File[]) => void
  onReloadFormulas: (sectionId: string) => void
  onReloadPdfs: (sectionId: string) => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onUploadPdfs: (e: React.ChangeEvent<HTMLInputElement>) => void
  setResizingImg: (v: any) => void
  highlightFormulaId?: string | null
  lectureMaps: LectureMindMap[]
  onSaveLectureMap: (sectionId: string, pdfId: string, title: string, nodes: MindMapNode[]) => Promise<void>
  onDeleteLectureMaps: (pdfIds: string[]) => Promise<void>
  onPdfOrderChange?: () => void
}

export default function FilePanel({
  selectedSection, pdfs, formulas, uploadQueue, uploading,
  selectMode, selectedPdfIds, onToggleSelectPdf, onDeletePdf, onOpenPdfChat,
  onStartUploads, onReloadFormulas, onReloadPdfs, fileInputRef, onUploadPdfs, setResizingImg,
  highlightFormulaId, lectureMaps, onSaveLectureMap, onDeleteLectureMaps, onPdfOrderChange,
}: Props) {
  const [previewFile, setPreviewFile] = useState<Pdf | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [renamingPdfId, setRenamingPdfId] = useState<string | null>(null)
  const [renamingPdfName, setRenamingPdfName] = useState('')
  const renameInputRef = useRef<HTMLInputElement>(null)

  // ── Drag-to-reorder state ──
  const [localPdfs, setLocalPdfs] = useState<Pdf[]>([])
  const [reorderMode, setReorderMode] = useState(false)
  const [reorderSnapshot, setReorderSnapshot] = useState<Pdf[]>([])
  const [dragId, setDragId] = useState<string | null>(null)
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  // Sync localPdfs from prop, applying saved order from localStorage
  useEffect(() => {
    if (!selectedSection) { setLocalPdfs(pdfs); return }
    const saved = localStorage.getItem(`pdf-order-${selectedSection.id}`)
    if (!saved) { setLocalPdfs(pdfs); return }
    try {
      const order: string[] = JSON.parse(saved)
      const byId = new Map(pdfs.map(p => [p.id, p]))
      const ordered = order.map(id => byId.get(id)).filter(Boolean) as Pdf[]
      const newOnes = pdfs.filter(p => !order.includes(p.id))
      setLocalPdfs([...ordered, ...newOnes])
    } catch { setLocalPdfs(pdfs) }
  }, [pdfs, selectedSection?.id])

  function savePdfOrder(items: Pdf[]) {
    if (selectedSection) {
      localStorage.setItem(`pdf-order-${selectedSection.id}`, JSON.stringify(items.map(p => p.id)))
      onPdfOrderChange?.()
    }
  }

  function handleGripMouseDown(e: React.MouseEvent, pdfId: string) {
    if (!reorderMode) return
    e.preventDefault()
    setDragId(pdfId)

    function onMove(ev: MouseEvent) {
      const map = itemRefs.current
      // Build list of {id, midY} sorted by current DOM position
      const positions: { id: string; midY: number }[] = []
      map.forEach((el, id) => {
        const rect = el.getBoundingClientRect()
        positions.push({ id, midY: rect.top + rect.height / 2 })
      })
      positions.sort((a, b) => a.midY - b.midY)

      // Find where the cursor sits in the sorted list
      let targetIdx = positions.findIndex(p => p.id === pdfId)
      for (let i = 0; i < positions.length; i++) {
        if (ev.clientY < positions[i].midY) { targetIdx = i; break }
        targetIdx = i
      }

      setLocalPdfs(prev => {
        const fromIdx = prev.findIndex(p => p.id === pdfId)
        if (fromIdx === targetIdx || fromIdx === -1) return prev
        const items = [...prev]
        const [moved] = items.splice(fromIdx, 1)
        items.splice(targetIdx, 0, moved)
        return items
      })
    }

    function onUp() {
      setDragId(null)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  function startReorder() {
    setReorderSnapshot([...localPdfs])
    setReorderMode(true)
  }

  function saveReorder() {
    savePdfOrder(localPdfs)
    setReorderMode(false)
  }

  function cancelReorder() {
    setLocalPdfs(reorderSnapshot)
    setReorderMode(false)
  }

  async function commitRenamePdf() {
    if (!renamingPdfId || !renamingPdfName.trim()) { setRenamingPdfId(null); return }
    await supabase.from('pdfs').update({ name: renamingPdfName.trim() }).eq('id', renamingPdfId)
    if (selectedSection) onReloadPdfs(selectedSection.id)
    setRenamingPdfId(null)
  }

  const showQueue = uploadQueue.length > 0
  const isFormulaSection = selectedSection?.section_type === 'formula'
  const isMindMapSection = selectedSection?.section_type === 'mindmap'

  if (isMindMapSection) {
    return (
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <MindMapPanel
          sectionId={selectedSection!.id}
          lectureMaps={lectureMaps}
          pdfOrder={localPdfs.filter(p => p.file_type === 'pdf').map(p => p.id)}
          onSave={onSaveLectureMap}
          onDelete={onDeleteLectureMaps}
        />
      </div>
    )
  }

  if (isFormulaSection) {
    return (
      <FormulaPanel
        selectedSection={selectedSection}
        formulas={formulas}
        highlightFormulaId={highlightFormulaId}
        onReloadFormulas={onReloadFormulas}
        setResizingImg={setResizingImg}
      />
    )
  }

  return (
    <>
    {previewFile && (
      <PdfPreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
        onOpenPdfChat={onOpenPdfChat}
      />
    )}
    <div style={{ flex: 1, background: '#f8fafc', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
    <div style={{ flex: 1, background: '#f8fafc', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', borderBottom: `1px solid ${reorderMode ? '#fbbf24' : '#e2e8f0'}`, background: reorderMode ? '#fffbeb' : 'white', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: '11px', fontWeight: '600', color: reorderMode ? '#92400e' : '#64748b', textTransform: 'uppercase', flex: 1 }}>
          {reorderMode ? 'Drag to reorder — unsaved' : (selectedSection ? selectedSection.name : 'Files')}
        </span>
        {reorderMode ? (
          <>
            <button onClick={saveReorder}
              style={{ padding: '5px 14px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
              Save Order
            </button>
            <button onClick={cancelReorder}
              style={{ padding: '5px 10px', background: 'none', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '7px', cursor: 'pointer', fontSize: '12px' }}>
              Cancel
            </button>
          </>
        ) : (
          selectedSection && !selectMode && (
            <>
              <button onClick={startReorder}
                style={{ padding: '5px 10px', background: 'none', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: '7px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: 4 }}>
                <GripVertical size={13} /> Reorder
              </button>
              <label style={{ padding: '6px 14px', background: uploading ? '#94a3b8' : '#3b82f6', color: 'white', borderRadius: '8px', cursor: uploading ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '500' }}>
                {uploading ? 'Uploading...' : '+ Upload'}
                <input ref={fileInputRef} type="file" accept=".pdf,image/*" multiple onChange={onUploadPdfs} style={{ display: 'none' }} disabled={uploading} />
              </label>
            </>
          )
        )}
      </div>

      {showQueue && (
        <div style={{ padding: '10px 16px', background: '#f0fdf4', borderBottom: '1px solid #bbf7d0' }}>
          {uploadQueue.map((item, i) => (
            <div key={i} style={{ marginBottom: i < uploadQueue.length - 1 ? '8px' : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', color: item.error ? '#dc2626' : item.done ? '#16a34a' : '#64748b', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.name} — {item.msg}
                </span>
                <span style={{ fontSize: '12px', fontWeight: '500', color: item.error ? '#dc2626' : '#16a34a' }}>
                  {item.error ? 'Error' : item.done ? '✓' : `${item.progress}%`}
                </span>
              </div>
              <div style={{ background: '#dcfce7', borderRadius: '99px', height: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${item.progress}%`, background: item.error ? '#ef4444' : item.done ? '#16a34a' : '#22c55e', borderRadius: '99px', transition: 'width 0.3s ease' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', position: 'relative',
          outline: dragOver ? '2px dashed #3b82f6' : 'none',
          background: dragOver ? '#eff6ff' : undefined,
          transition: 'background 0.15s, outline 0.15s' }}
        onDragOver={e => { e.preventDefault(); if (selectedSection && !uploading) setDragOver(true) }}
        onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false) }}
        onDrop={e => {
          e.preventDefault(); setDragOver(false)
          if (!selectedSection || uploading) return
          const files = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf' || f.type.startsWith('image/'))
          onStartUploads(files)
        }}>
        {dragOver && selectedSection && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 10 }}>
            <FileText size={48} style={{ color: '#3b82f6', marginBottom: '12px' }} />
            <p style={{ fontSize: '15px', fontWeight: '600', color: '#3b82f6' }}>Drop files here</p>
          </div>
        )}
        {!selectedSection && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
            <FolderOpen size={48} style={{ margin: '0 auto 12px', display: 'block' }} />
            <p>Select a subject and section to view files</p>
          </div>
        )}
        {selectedSection && pdfs.length === 0 && !uploading && !dragOver && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
            <FileText size={48} style={{ margin: '0 auto 12px', display: 'block' }} />
            <p>No files uploaded yet</p>
            <p style={{ fontSize: '13px', marginTop: '8px' }}>Click Upload or drag files here</p>
          </div>
        )}
        {localPdfs.map((p, pdfIdx) => {
          const isImage = p.file_type === 'image'
          const lecNumber = isImage ? null : localPdfs.filter((x, i) => i <= pdfIdx && x.file_type === 'pdf').length
          const isDraggingThis = dragId === p.id
          return (
            <div key={p.id}
              ref={el => { if (el) itemRefs.current.set(p.id, el); else itemRefs.current.delete(p.id) }}
              onMouseDown={reorderMode ? e => handleGripMouseDown(e, p.id) : undefined}
              onClick={() => { if (reorderMode || renamingPdfId) return; selectMode ? onToggleSelectPdf(p.id) : (p.file_url && setPreviewFile(p)) }}
              style={{
                background: isDraggingThis ? '#fffbeb' : selectMode && selectedPdfIds.has(p.id) ? '#fef2f2' : 'white',
                borderRadius: '10px', padding: '12px 14px', marginBottom: '8px',
                border: `1px solid ${isDraggingThis ? '#f59e0b' : selectMode && selectedPdfIds.has(p.id) ? '#fca5a5' : '#e2e8f0'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: reorderMode ? (isDraggingThis ? 'grabbing' : 'grab') : selectMode ? 'pointer' : p.file_url ? 'pointer' : 'default',
                transition: 'box-shadow 0.15s, border-color 0.15s',
                boxShadow: isDraggingThis ? '0 4px 16px rgba(245,158,11,0.30)' : 'none',
                userSelect: 'none',
              }}
              onMouseEnter={e => {
                if (!reorderMode && !selectMode && !dragId) {
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)'
                  e.currentTarget.style.borderColor = '#bfdbfe'
                }
              }}
              onMouseLeave={e => {
                if (!isDraggingThis) {
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.borderColor = selectMode && selectedPdfIds.has(p.id) ? '#fca5a5' : '#e2e8f0'
                }
              }}>
              {reorderMode && (
                <span style={{ color: isDraggingThis ? '#f59e0b' : '#d1d5db', padding: '0 6px 0 0', flexShrink: 0, display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                  <GripVertical size={15} />
                </span>
              )}
              {selectMode && (
                <span style={{ marginRight: '10px', color: selectedPdfIds.has(p.id) ? '#ef4444' : '#cbd5e1', flexShrink: 0 }}>
                  {selectedPdfIds.has(p.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                </span>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                {isImage
                  ? <Image size={20} color={selectMode && selectedPdfIds.has(p.id) ? '#ef4444' : '#f59e0b'} style={{ flexShrink: 0 }} />
                  : <FileText size={20} color={selectMode && selectedPdfIds.has(p.id) ? '#ef4444' : '#3b82f6'} style={{ flexShrink: 0 }} />
                }
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {lecNumber != null && (
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#3b82f6', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 5, padding: '0px 5px', flexShrink: 0 }}>
                        Lec {lecNumber}
                      </span>
                    )}
                    {renamingPdfId === p.id ? (
                      <input
                        ref={renameInputRef}
                        value={renamingPdfName}
                        onChange={e => setRenamingPdfName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') commitRenamePdf(); if (e.key === 'Escape') setRenamingPdfId(null) }}
                        onBlur={commitRenamePdf}
                        onClick={e => e.stopPropagation()}
                        autoFocus
                        style={{ fontSize: '14px', fontWeight: '500', border: '1px solid #3b82f6', borderRadius: 5, padding: '2px 8px', outline: 'none', flex: 1, minWidth: 0, boxSizing: 'border-box' }}
                      />
                    ) : (
                      <p title={p.name} style={{ fontSize: '14px', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{p.name}</p>
                    )}
                  </div>
                  <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{isImage ? 'Image' : `${p.pages} pages`}</p>
                </div>
              </div>
              {!selectMode && !reorderMode && renamingPdfId !== p.id && (
                <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                  <button onClick={e => { e.stopPropagation(); setRenamingPdfId(p.id); setRenamingPdfName(p.name) }} title="Rename"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: '4px', borderRadius: '6px' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#3b82f6')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#cbd5e1')}>
                    <Pencil size={14} />
                  </button>
                  {!isImage && (
                    <button onClick={e => onOpenPdfChat(e, p)} title="Ask AI"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: '4px', borderRadius: '6px' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#8b5cf6')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#cbd5e1')}>
                      <MessageCircle size={15} />
                    </button>
                  )}
                  <button onClick={e => { e.stopPropagation(); p.file_url && window.open(p.file_url, '_blank') }} title="Open in new tab"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: '4px', borderRadius: '6px' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#3b82f6')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#cbd5e1')}>
                    <ExternalLink size={15} />
                  </button>
                  <button onClick={e => onDeletePdf(e, p)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: '4px', borderRadius: '6px' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#cbd5e1')}>
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
    </div>
    </>
  )
}
