'use client'
import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { Subject, Section, Pdf, Formula, MindMap, MindMapNode, LectureMindMap, UploadQueueItem, StorageInfo, RenameState } from '../types'

export function useData() {
  // ── Core data ──
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [pdfs, setPdfs] = useState<Pdf[]>([])
  const [formulas, setFormulas] = useState<Formula[]>([])
  const [lectureMaps, setLectureMaps] = useState<LectureMindMap[]>([])
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [selectedSection, setSelectedSection] = useState<Section | null>(null)

  // ── Storage ──
  const [storage, setStorage] = useState<StorageInfo | null>(null)

  // ── Upload ──
  const [uploading, setUploading] = useState(false)
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Rename ──
  const [renaming, setRenaming] = useState<RenameState | null>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)

  // ── Multi-select ──
  const [selectMode, setSelectMode] = useState(false)
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<Set<string>>(new Set())
  const [selectedSectionIds, setSelectedSectionIds] = useState<Set<string>>(new Set())
  const [selectedPdfIds, setSelectedPdfIds] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)

  // ── UI toggles ──
  const [showAddSubject, setShowAddSubject] = useState(false)
  const [showAddSection, setShowAddSection] = useState(false)

  // ── Formula highlight ──
  const [highlightFormulaId, setHighlightFormulaId] = useState<string | null>(null)

  // ── Homepage stats ──
  const [stats, setStats] = useState<{ subjects: number; pdfs: number; formulas: number } | null>(null)
  const [recentSubjects, setRecentSubjects] = useState<Subject[]>([])

  async function loadStats() {
    const [{ count: sc }, { count: pc }, { count: fc }] = await Promise.all([
      supabase.from('subjects').select('*', { count: 'exact', head: true }),
      supabase.from('pdfs').select('*', { count: 'exact', head: true }),
      supabase.from('formulas').select('*', { count: 'exact', head: true }),
    ])
    setStats({ subjects: sc ?? 0, pdfs: pc ?? 0, formulas: fc ?? 0 })
  }

  function trackRecentSubject(subject: Subject) {
    setRecentSubjects(prev => {
      const filtered = prev.filter(s => s.id !== subject.id)
      return [subject, ...filtered].slice(0, 5)
    })
  }

  // ── Loaders ──
  async function loadStorageUsage() {
    const res = await fetch('/api/storage-usage')
    const data = await res.json()
    if (!data.error) setStorage(data)
  }

  async function loadSubjects() {
    const { data } = await supabase.from('subjects').select('*').order('name')
    setSubjects(data || [])
  }

  async function loadSections(subjectId: string) {
    const { data } = await supabase.from('sections').select('*').eq('subject_id', subjectId).order('name')
    setSections(data || [])
  }

  async function loadPdfs(sectionId: string) {
    const { data } = await supabase.from('pdfs').select('*').eq('section_id', sectionId).order('name', { ascending: true })
    const sorted = (data || []).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base', numeric: true }))
    setPdfs(sorted)
  }

  async function loadFormulas(sectionId: string) {
    const { data } = await supabase.from('formulas').select('*').eq('section_id', sectionId).order('created_at')
    setFormulas(data || [])
  }

  async function loadLectureMaps(subjectId: string, sectionId: string) {
    // Load all PDFs from the notes section of this subject
    const { data: secs } = await supabase.from('sections').select('id').eq('subject_id', subjectId).eq('section_type', 'notes').limit(1)
    if (!secs?.length) { setLectureMaps([]); return }
    const notesSectionId = secs[0].id
    const { data: pdfRows } = await supabase.from('pdfs').select('*').eq('section_id', notesSectionId).eq('file_type', 'pdf')
    if (!pdfRows?.length) { setLectureMaps([]); return }
    // Apply user-defined drag order from localStorage if present, else sort by name
    const savedOrder: string[] | null = (() => {
      try { return JSON.parse(localStorage.getItem(`pdf-order-${notesSectionId}`) ?? 'null') } catch { return null }
    })()
    let sorted: Pdf[]
    if (savedOrder?.length) {
      const byId = new Map(pdfRows.map((p: Pdf) => [p.id, p]))
      const ordered = savedOrder.map(id => byId.get(id)).filter(Boolean) as Pdf[]
      const rest = pdfRows.filter((p: Pdf) => !savedOrder.includes(p.id))
      sorted = [...ordered, ...rest]
    } else {
      sorted = [...pdfRows].sort((a: Pdf, b: Pdf) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    }
    if (!sorted.length) { setLectureMaps([]); return }
    // Load all mind maps for this mindmap section
    const { data: maps } = await supabase.from('mind_maps').select('*').eq('section_id', sectionId)
    const mapByPdfId = new Map<string, MindMap>((maps || []).map((m: MindMap) => [m.pdf_id, m]))
    setLectureMaps(sorted.map((pdf, i) => ({
      lecNumber: i + 1,
      pdfId: pdf.id,
      pdfName: pdf.name,
      pdfUrl: pdf.file_url,
      map: mapByPdfId.get(pdf.id) ?? null,
    })))
  }

  async function saveLectureMap(sectionId: string, pdfId: string, title: string, nodes: MindMapNode[]) {
    const nodesJson = JSON.parse(JSON.stringify(nodes))
    const existing = lectureMaps.find(l => l.pdfId === pdfId)?.map
    let saved: MindMap | null = null
    if (existing) {
      const { data, error } = await supabase.from('mind_maps')
        .update({ title, nodes: nodesJson, updated_at: new Date().toISOString() })
        .eq('id', existing.id).select().single()
      if (error) { alert('Save failed: ' + error.message); return }
      saved = data
    } else {
      const { data, error } = await supabase.from('mind_maps')
        .insert({ section_id: sectionId, pdf_id: pdfId, title, nodes: nodesJson }).select().single()
      if (error) { alert('Save failed: ' + error.message); return }
      saved = data
    }
    if (saved) {
      setLectureMaps(prev => prev.map(l => l.pdfId === pdfId ? { ...l, map: saved } : l))
    }
  }

  async function deleteLectureMaps(pdfIds: string[]) {
    for (const pdfId of pdfIds) {
      await supabase.from('mind_maps').delete().eq('pdf_id', pdfId)
    }
    setLectureMaps(prev => prev.map(l => pdfIds.includes(l.pdfId) ? { ...l, map: null } : l))
  }

  // ── Subject actions ──
  async function updateSubject(id: string, fields: Partial<{ name: string; code: string; category: string; color: string }>) {
    const { error } = await supabase.from('subjects').update(fields).eq('id', id)
    if (error) { alert('Save failed: ' + error.message); return }
    setSubjects(prev => prev.map(s => s.id === id ? { ...s, ...fields } : s))
    if (selectedSubject?.id === id) setSelectedSubject(s => s ? { ...s, ...fields } : s)
  }

  function randomSubjectColor() {
    const colors = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#ec4899','#84cc16','#475569','#f97316','#14b8a6','#a855f7']
    return colors[Math.floor(Math.random() * colors.length)]
  }

  async function addSubject(name: string, code: string, category = '') {
    const { data: subj } = await supabase.from('subjects').insert({ name, code, category, color: randomSubjectColor() }).select().single()
    if (subj) {
      await supabase.from('sections').insert([
        { name: '01. Mind Map', subject_id: subj.id, section_type: 'mindmap' },
        { name: '02. Lecture Notes', subject_id: subj.id, section_type: 'notes' },
        { name: '03. Important Formula', subject_id: subj.id, section_type: 'formula' },
      ])
    }
    loadSubjects()
  }

  async function deleteSubject(e: React.MouseEvent, subject: Subject) {
    e.stopPropagation()
    if (!confirm(`Delete subject "${subject.name}" and all its sections and PDFs?`)) return
    await supabase.from('subjects').delete().eq('id', subject.id)
    if (selectedSubject?.id === subject.id) {
      setSelectedSubject(null); setSelectedSection(null); setSections([]); setPdfs([])
    }
    loadSubjects()
  }

  async function selectSubject(subject: Subject) {
    trackRecentSubject(subject)
    setSelectedSubject(subject)
    setSelectedSection(null)
    setPdfs([]); setFormulas([]); setLectureMaps([])
    setUploadQueue([])
    const { data } = await supabase.from('sections').select('*').eq('subject_id', subject.id).order('name')
    const secs: Section[] = data || []
    setSections(secs)
    const mindmapSection = secs.find(s => s.section_type === 'mindmap')
    if (mindmapSection) {
      setSelectedSection(mindmapSection)
      loadLectureMaps(subject.id, mindmapSection.id)
    }
  }

  // ── Section actions ──
  async function addSection(name: string) {
    if (!selectedSubject) return
    await supabase.from('sections').insert({ name, subject_id: selectedSubject.id, section_type: 'notes' })
    loadSections(selectedSubject.id)
  }

  async function deleteSection(e: React.MouseEvent, section: Section) {
    e.stopPropagation()
    const label = section.section_type === 'formula' ? 'formulas' : section.section_type === 'mindmap' ? 'mind map' : 'PDFs'
    if (!confirm(`Delete section "${section.name}" and all its ${label}?`)) return
    await supabase.from('formulas').delete().eq('section_id', section.id)
    await supabase.from('mind_maps').delete().eq('section_id', section.id)
    await supabase.from('sections').delete().eq('id', section.id)
    if (selectedSection?.id === section.id) { setSelectedSection(null); setPdfs([]); setFormulas([]); setLectureMaps([]) }
    loadSections(selectedSubject!.id)
  }

  function selectSection(section: Section) {
    setSelectedSection(section)
    setUploadQueue([])
    setHighlightFormulaId(null)
    setLectureMaps([])
    if (section.section_type === 'formula') {
      loadFormulas(section.id)
    } else if (section.section_type === 'mindmap') {
      if (selectedSubject) loadLectureMaps(selectedSubject.id, section.id)
    } else {
      loadPdfs(section.id)
    }
  }

  // ── PDF actions ──
  async function deleteSinglePdfData(pdf: Pdf) {
    if (pdf.file_url) {
      const url = new URL(pdf.file_url)
      const filePath = url.pathname.split('/pdfs/')[1]
      if (filePath) await supabase.storage.from('pdfs').remove([decodeURIComponent(filePath)])
    }
    await supabase.from('pdf_chunks').delete().eq('pdf_id', pdf.id)
    await supabase.from('pdfs').delete().eq('id', pdf.id)
  }

  async function deletePdf(e: React.MouseEvent, pdf: Pdf) {
    e.stopPropagation()
    if (!confirm(`Delete "${pdf.name}"?`)) return
    await deleteSinglePdfData(pdf)
    loadPdfs(selectedSection!.id)
    loadStorageUsage()
  }

  // ── Rename ──
  function startRename(e: React.MouseEvent, type: 'subject' | 'section', item: any) {
    e.stopPropagation()
    setRenaming({ type, id: item.id, name: item.name, code: item.code, category: item.category })
    setTimeout(() => renameInputRef.current?.select(), 0)
  }

  async function commitRename() {
    if (!renaming) return
    if (!renaming.name.trim()) { setRenaming(null); return }
    if (renaming.type === 'subject') {
      const cat = renaming.category ?? ''
      await supabase.from('subjects').update({ name: renaming.name, code: renaming.code ?? '', category: cat }).eq('id', renaming.id)
      setSubjects(prev => prev.map(s => s.id === renaming.id ? { ...s, name: renaming.name, code: renaming.code ?? '', category: cat } : s))
      if (selectedSubject?.id === renaming.id) setSelectedSubject(s => s ? { ...s, name: renaming.name, code: renaming.code ?? '', category: cat } : s)
    } else {
      await supabase.from('sections').update({ name: renaming.name }).eq('id', renaming.id)
      setSections(prev => prev.map(s => s.id === renaming.id ? { ...s, name: renaming.name } : s))
      if (selectedSection?.id === renaming.id) setSelectedSection(s => s ? { ...s, name: renaming.name } : s)
    }
    setRenaming(null)
  }

  function handleRenameKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commitRename()
    if (e.key === 'Escape') setRenaming(null)
  }

  // ── Multi-select ──
  function exitSelectMode() {
    setSelectMode(false)
    setSelectedSubjectIds(new Set())
    setSelectedSectionIds(new Set())
    setSelectedPdfIds(new Set())
  }

  async function bulkDelete() {
    const parts = []
    if (selectedSubjectIds.size) parts.push(`${selectedSubjectIds.size} subject${selectedSubjectIds.size > 1 ? 's' : ''}`)
    if (selectedSectionIds.size) parts.push(`${selectedSectionIds.size} section${selectedSectionIds.size > 1 ? 's' : ''}`)
    if (selectedPdfIds.size) parts.push(`${selectedPdfIds.size} PDF${selectedPdfIds.size > 1 ? 's' : ''}`)
    if (!parts.length || !confirm(`Delete ${parts.join(', ')}? This cannot be undone.`)) return
    setDeleting(true)
    for (const id of selectedPdfIds) { const pdf = pdfs.find(p => p.id === id); if (pdf) await deleteSinglePdfData(pdf) }
    for (const id of selectedSectionIds) await supabase.from('sections').delete().eq('id', id)
    for (const id of selectedSubjectIds) await supabase.from('subjects').delete().eq('id', id)
    setSelectedSubjectIds(new Set()); setSelectedSectionIds(new Set()); setSelectedPdfIds(new Set())
    setSelectMode(false); setDeleting(false)
    loadSubjects()
    if (selectedSubject && !selectedSubjectIds.has(selectedSubject.id)) loadSections(selectedSubject.id)
    else { setSelectedSubject(null); setSelectedSection(null); setSections([]); setPdfs([]) }
    if (selectedSection && !selectedSectionIds.has(selectedSection.id)) loadPdfs(selectedSection.id)
    else { setSelectedSection(null); setPdfs([]) }
    loadStorageUsage()
  }

  // ── Upload ──
  async function uploadSingleFile(file: File, sectionId: string, idx: number) {
    setUploadQueue(q => q.map((item, i) => i === idx ? { ...item, msg: 'Starting...', progress: 5 } : item))
    const formData = new FormData()
    formData.append('file', file)
    formData.append('sectionId', sectionId)
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    const isPdf = file.type === 'application/pdf'
    const cleanName = isPdf ? file.name.replace(/\.pdf$/i, '') : file.name.replace(new RegExp(`\\.${ext}$`, 'i'), '')
    formData.append('name', cleanName)
    formData.append('fileType', isPdf ? 'pdf' : 'image')
    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const reader = res.body?.getReader()
    const decoder = new TextDecoder()
    if (!reader) return
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const lines = decoder.decode(value).split('\n').filter(l => l.startsWith('data: '))
      for (const line of lines) {
        try {
          const data = JSON.parse(line.replace('data: ', ''))
          setUploadQueue(q => q.map((item, i) => i === idx
            ? { ...item, msg: data.message, progress: data.progress, done: data.step === 'done', error: data.step === 'error' }
            : item))
        } catch {}
      }
    }
  }

  async function uploadPdfs(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    await startUploads(files)
  }

  async function startUploads(files: File[]) {
    if (!files.length || !selectedSection) return
    setUploadQueue(files.map(f => ({ name: f.name.replace(/\.(pdf|png|jpg|jpeg|gif|webp)$/i, ''), progress: 0, msg: 'Waiting...', done: false, error: false })))
    setUploading(true)
    for (let i = 0; i < files.length; i++) await uploadSingleFile(files[i], selectedSection.id, i)
    setUploading(false)
    loadPdfs(selectedSection.id)
    loadStorageUsage()
  }

  return {
    // state
    subjects, sections, pdfs, formulas, lectureMaps, stats, recentSubjects,
    selectedSubject, setSelectedSubject,
    selectedSection, setSelectedSection,
    storage, uploading, uploadQueue, fileInputRef,
    renaming, setRenaming, renameInputRef,
    selectMode, setSelectMode,
    selectedSubjectIds, setSelectedSubjectIds,
    selectedSectionIds, setSelectedSectionIds,
    selectedPdfIds, setSelectedPdfIds,
    deleting, showAddSubject, setShowAddSubject,
    showAddSection, setShowAddSection,
    highlightFormulaId, setHighlightFormulaId,
    // loaders
    loadSubjects, loadSections, loadPdfs, loadFormulas, loadLectureMaps, loadStorageUsage, loadStats,
    // mind map actions
    saveLectureMap, deleteLectureMaps,
    // actions
    addSubject, updateSubject, deleteSubject, selectSubject,
    addSection, deleteSection, selectSection,
    deletePdf, deleteSinglePdfData,
    startRename, commitRename, handleRenameKey,
    exitSelectMode, bulkDelete,
    uploadPdfs, startUploads,
  }
}
