'use client'
import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import 'katex/dist/katex.min.css'
import { PanelLeftOpen, MessageCircle, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'

import { useData } from './hooks/useData'
import { useSearch } from './hooks/useSearch'
import { useSidebar } from './hooks/useSidebar'

import AppHeader from './components/AppHeader'
import SelectModeBar from './components/SelectModeBar'
import PreviewModal from './components/PreviewModal'
import SubjectsPanel from './components/SubjectsPanel'
import SectionsPanel from './components/SectionsPanel'
import FilePanel from './components/FilePanel'
import ChatPanel from './components/ChatPanel'
import HomePage from './components/HomePage'

function AppShell() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const data = useData()
  const search = useSearch()
  const sidebar = useSidebar()

  const [chatSubject, setChatSubject] = useState<any>(null)
  const widgetRef = useRef<HTMLDivElement>(null)
  // Track snap anchor so panel can be positioned on the correct side
  const [snapAnchor, setSnapAnchor] = useState<Anchor>({ bottom: 24, right: 24 })
  const [balloonTop, setBalloonTop] = useState<number | null>(null) // balloon top px from viewport top

  // 8 snap anchors: corners + edge midpoints. Each gives {left|right, top|bottom} in px from viewport edge.
  function snapToEdge(x: number, y: number): Anchor {
    const W = window.innerWidth, H = window.innerHeight
    const pad = 16
    const cx = x + 26, cy = y + 26 // centre of the 52px balloon
    const anchors = [
      { left: pad,         top: pad },          // top-left
      { left: W/2 - 26,   top: pad },          // top-mid
      { right: pad,        top: pad },          // top-right
      { left: pad,         top: H/2 - 26 },    // mid-left
      { right: pad,        top: H/2 - 26 },    // mid-right
      { left: pad,         bottom: pad },       // bot-left
      { left: W/2 - 26,   bottom: pad },       // bot-mid
      { right: pad,        bottom: pad },       // bot-right  (default)
    ]
    // Convert each anchor to absolute {ax, ay} for distance calc
    const resolved = anchors.map(a => {
      const ax = a.right !== undefined ? W - (a.right as number) - 52 : a.left as number
      const ay = a.bottom !== undefined ? H - (a.bottom as number) - 52 : a.top as number
      return { a, ax, ay, d: Math.hypot(cx - (ax + 26), cy - (ay + 26)) }
    })
    return resolved.sort((a, b) => a.d - b.d)[0].a
  }

  type Anchor = { left?: number; right?: number; top?: number; bottom?: number }

  function applySnap(el: HTMLDivElement, a: Anchor) {
    el.style.left   = a.left   !== undefined ? a.left   + 'px' : ''
    el.style.right  = a.right  !== undefined ? a.right  + 'px' : ''
    el.style.top    = a.top    !== undefined ? a.top    + 'px' : ''
    el.style.bottom = a.bottom !== undefined ? a.bottom + 'px' : ''
    setSnapAnchor(a)
    // Record balloon's top position so panel knows which direction has more space
    const resolvedTop = a.bottom !== undefined ? window.innerHeight - (a.bottom as number) - 52 : (a.top as number)
    setBalloonTop(resolvedTop)
  }

  function handleWidgetDrag(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest('button')) return
    e.preventDefault()
    const el = widgetRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const offsetX = e.clientX - rect.left
    const offsetY = e.clientY - rect.top
    let moved = false

    el.style.transition = 'none'
    el.style.right = 'auto'
    el.style.bottom = 'auto'
    el.style.left = rect.left + 'px'
    el.style.top = rect.top + 'px'

    function onMove(ev: MouseEvent) {
      moved = true
      el!.style.left = (ev.clientX - offsetX) + 'px'
      el!.style.top = (ev.clientY - offsetY) + 'px'
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove, true)
      window.removeEventListener('mouseup', onUp, true)
      if (!moved) return
      // Snap to nearest of 8 anchors
      const rect2 = el!.getBoundingClientRect()
      const anchor = snapToEdge(rect2.left, rect2.top)
      el!.style.transition = 'left 0.2s, right 0.2s, top 0.2s, bottom 0.2s'
      applySnap(el!, anchor)
    }
    window.addEventListener('mousemove', onMove, true)
    window.addEventListener('mouseup', onUp, true)
  }
  // If URL already has a subject param, skip the homepage on first render
  const [showHome, setShowHome] = useState(!searchParams.get('subject'))
  const [restored, setRestored] = useState(false)

  const totalSelected = data.selectedSubjectIds.size + data.selectedSectionIds.size + data.selectedPdfIds.size

  // Update URL to reflect current view
  function pushUrl(subjectId: string | null, sectionId: string | null) {
    const params = new URLSearchParams()
    if (subjectId) params.set('subject', subjectId)
    if (sectionId) params.set('section', sectionId)
    const qs = params.toString()
    router.replace(qs ? `/?${qs}` : '/', { scroll: false })
  }

  // On mount: load subjects then restore from URL if params present
  useEffect(() => {
    const init = async () => {
      await data.loadSubjects()
      data.loadStorageUsage()
      data.loadStats()

      const subjectId = searchParams.get('subject')
      const sectionId = searchParams.get('section')

      if (subjectId) {
        const { data: subj } = await supabase.from('subjects').select('*').eq('id', subjectId).single()
        if (subj) {
          await data.selectSubject(subj)
          if (sectionId) {
            const { data: sec } = await supabase.from('sections').select('*').eq('id', sectionId).single()
            if (sec) data.selectSection(sec)
          }
          setShowHome(false)
        }
      }
      setRestored(true)
    }
    init()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync URL whenever subject/section changes (after initial restore)
  useEffect(() => {
    if (!restored) return
    if (!data.selectedSubject) {
      pushUrl(null, null)
      return
    }
    pushUrl(data.selectedSubject.id, data.selectedSection?.id ?? null)
  }, [data.selectedSubject?.id, data.selectedSection?.id, restored]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSelectResult(r: any) {
    search.setSearchOpen(false)
    if (r._type === 'formula') {
      const subjectId = r.sections?.subject_id
      if (subjectId) {
        const { data: subj } = await supabase.from('subjects').select('*').eq('id', subjectId).single()
        if (subj) { data.setSelectedSubject(subj); await data.loadSections(subjectId) }
      }
      data.setSelectedSection({ id: r.section_id, name: r.sections?.name, subject_id: r.sections?.subject_id, section_type: 'formula' })
      await data.loadFormulas(r.section_id)
      data.setHighlightFormulaId(r.id)
      setShowHome(false)
    } else if (r._type === 'mindmap') {
      if (r.subjectId) {
        const { data: subj } = await supabase.from('subjects').select('*').eq('id', r.subjectId).single()
        if (subj) { await data.selectSubject(subj) }
      }
      const { data: sec } = await supabase.from('sections').select('*').eq('id', r.sectionId).single()
      if (sec) data.selectSection(sec)
      setShowHome(false)
    } else {
      search.setPreviewResult(r)
      setShowHome(false)
    }
  }

  async function navigateToFile(pdf: any) {
    const subject = pdf.sections?.subjects
    const section = { id: pdf.section_id, name: pdf.sections?.name, subject_id: pdf.sections?.subject_id, section_type: null as any }
    if (subject) {
      data.setSelectedSubject({ id: pdf.sections?.subject_id, ...subject })
      await data.loadSections(pdf.sections?.subject_id)
    }
    data.setSelectedSection(section)
    await data.loadPdfs(pdf.section_id)
  }

  async function navigateToFormula(formula: any) {
    const section = formula.sections
    const subjectId = section?.subject_id
    if (subjectId) {
      const { data: subj } = await supabase.from('subjects').select('*').eq('id', subjectId).single()
      if (subj) { data.setSelectedSubject(subj); await data.loadSections(subjectId) }
    }
    if (section) data.setSelectedSection({ id: formula.section_id, name: section.name, subject_id: section.subject_id, section_type: 'formula' })
    await data.loadFormulas(formula.section_id)
  }

  function goHome() {
    setShowHome(true)
    pushUrl(null, null)
  }

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}
      onMouseMove={sidebar.onMouseMove}
      onMouseUp={sidebar.onMouseUp}
      onMouseLeave={sidebar.onMouseUp}
    >
      <AppHeader
        storage={data.storage}
        searchQuery={search.searchQuery}
        searchOpen={search.searchOpen}
        searchHistory={search.searchHistory}
        searchResults={search.searchResults}
        searchWrapperRef={search.searchWrapperRef}
        searchInputRef={search.searchInputRef}
        onSearch={search.handleSearch}
        onSearchFocus={() => search.setSearchOpen(true)}
        onClearSearch={() => { search.handleSearch(''); search.setPreviewResult(null) }}
        saveToHistory={search.saveToHistory}
        clearHistory={search.clearHistory}
        removeHistoryItem={search.removeHistoryItem}
        onSelectResult={handleSelectResult}
        onGoHome={goHome}
      />

      {data.selectMode && (
        <SelectModeBar
          totalSelected={totalSelected}
          deleting={data.deleting}
          onExit={data.exitSelectMode}
          onDelete={data.bulkDelete}
        />
      )}

      {search.previewResult && (
        <PreviewModal
          result={search.previewResult}
          onClose={() => search.setPreviewResult(null)}
        />
      )}

      {/* 3-Panel Layout */}
      {showHome ? (
        <HomePage
          stats={data.stats}
          subjects={data.subjects}
          recentSubjects={data.recentSubjects}
          onSelectSubject={s => { data.selectSubject(s); setShowHome(false) }}
          onOpenSearch={() => { search.setSearchOpen(true); search.searchInputRef.current?.focus(); setShowHome(false) }}
          onAddSubject={() => { setShowHome(false); data.setShowAddSubject(true) }}
          onUpdateSubject={data.updateSubject}
          onDeleteSubject={(e, s) => { data.deleteSubject(e, s); }}
        />
      ) : null}
      <div style={{ display: showHome ? 'none' : 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Subjects sidebar */}
        <div style={{ position: 'relative', display: 'flex', flexShrink: 0 }}>
          {sidebar.subjectCollapsed ? (
            <div style={{ width: '32px', borderRight: '1px solid #e2e8f0', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '8px', gap: '8px' }}>
              <button title="Expand subjects" onClick={() => sidebar.setSubjectCollapsed(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}>
                <PanelLeftOpen size={16} />
              </button>
              <span style={{ fontSize: '10px', color: '#94a3b8', writingMode: 'vertical-rl', transform: 'rotate(180deg)', marginTop: '4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subjects</span>
            </div>
          ) : (
            <div style={{ width: sidebar.subjectWidth, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <SubjectsPanel
                subjects={data.subjects}
                selectedSubject={data.selectedSubject}
                selectMode={data.selectMode}
                selectedSubjectIds={data.selectedSubjectIds}
                renaming={data.renaming}
                showAddSubject={data.showAddSubject}
                onSelectSubject={s => { data.selectSubject(s); setShowHome(false); if (!sidebar.subjectPinned) sidebar.setSubjectCollapsed(true) }}
                onToggleSelect={id => data.setSelectedSubjectIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })}
                onDeleteSubject={data.deleteSubject}
                onStartRename={data.startRename}
                onOpenChat={(e, subject) => { e.stopPropagation(); setChatSubject(subject) }}
                onToggleSelectMode={() => { data.setSelectMode(!data.selectMode); if (data.selectMode) data.exitSelectMode() }}
                onToggleAddSubject={() => data.setShowAddSubject(!data.showAddSubject)}
                onAddSubject={data.addSubject}
                renameState={data.renaming}
                renameInputRef={data.renameInputRef}
                onRenameChange={(name, code, category) => data.setRenaming(r => r ? { ...r, name, ...(code !== undefined ? { code } : {}), ...(category !== undefined ? { category } : {}) } : r)}
                onRenameKey={data.handleRenameKey}
                onRenameBlur={data.commitRename}
                onCollapse={() => sidebar.setSubjectCollapsed(true)}
                onTogglePin={() => sidebar.setSubjectPinned(p => !p)}
                pinned={sidebar.subjectPinned}
              />
            </div>
          )}
          {!sidebar.subjectCollapsed && (
            <div
              onMouseDown={e => { sidebar.resizingSidebar.current = { panel: 'subject', startX: e.clientX, startW: sidebar.subjectWidth } }}
              style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '5px', cursor: 'col-resize', zIndex: 10, background: 'transparent' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.3)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            />
          )}
        </div>

        {/* Sections sidebar */}
        <div style={{ position: 'relative', display: 'flex', flexShrink: 0 }}>
          {sidebar.sectionCollapsed ? (
            <div style={{ width: '32px', borderRight: '1px solid #e2e8f0', background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '8px', gap: '8px' }}>
              <button title="Expand sections" onClick={() => sidebar.setSectionCollapsed(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}>
                <PanelLeftOpen size={16} />
              </button>
              <span style={{ fontSize: '10px', color: '#94a3b8', writingMode: 'vertical-rl', transform: 'rotate(180deg)', marginTop: '4px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sections</span>
            </div>
          ) : (
            <div style={{ width: sidebar.sectionWidth, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <SectionsPanel
                sections={data.sections}
                selectedSubject={data.selectedSubject}
                selectedSection={data.selectedSection}
                selectMode={data.selectMode}
                selectedSectionIds={data.selectedSectionIds}
                renaming={data.renaming}
                showAddSection={data.showAddSection}
                onSelectSection={s => { data.selectSection(s); if (!sidebar.sectionPinned) sidebar.setSectionCollapsed(true) }}
                onToggleSelect={id => data.setSelectedSectionIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })}
                onDeleteSection={data.deleteSection}
                onStartRename={data.startRename}
                onToggleAddSection={() => data.setShowAddSection(!data.showAddSection)}
                onAddSection={data.addSection}
                renameInputRef={data.renameInputRef}
                onRenameChange={name => data.setRenaming(r => r ? { ...r, name } : r)}
                onRenameKey={data.handleRenameKey}
                onRenameBlur={data.commitRename}
                onCollapse={() => sidebar.setSectionCollapsed(true)}
                onTogglePin={() => sidebar.setSectionPinned(p => !p)}
                pinned={sidebar.sectionPinned}
              />
            </div>
          )}
          {!sidebar.sectionCollapsed && (
            <div
              onMouseDown={e => { sidebar.resizingSidebar.current = { panel: 'section', startX: e.clientX, startW: sidebar.sectionWidth } }}
              style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '5px', cursor: 'col-resize', zIndex: 10, background: 'transparent' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.3)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            />
          )}
        </div>

        <FilePanel
          selectedSection={data.selectedSection}
          pdfs={data.pdfs}
          formulas={data.formulas}
          uploadQueue={data.uploadQueue}
          uploading={data.uploading}
          selectMode={data.selectMode}
          selectedPdfIds={data.selectedPdfIds}
          onToggleSelectPdf={id => data.setSelectedPdfIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })}
          onDeletePdf={data.deletePdf}
          onOpenPdfChat={(e, pdf) => { e.stopPropagation(); setChatSubject({ type: 'pdf', id: pdf.id, name: pdf.name }) }}
          onStartUploads={data.startUploads}
          onReloadFormulas={data.loadFormulas}
          onReloadPdfs={data.loadPdfs}
          fileInputRef={data.fileInputRef}
          onUploadPdfs={data.uploadPdfs}
          setResizingImg={sidebar.setResizingImg}
          highlightFormulaId={data.highlightFormulaId}
          lectureMaps={data.lectureMaps}
          onSaveLectureMap={data.saveLectureMap}
          onDeleteLectureMaps={data.deleteLectureMaps}
          onPdfOrderChange={() => {
            const mindmapSection = data.sections.find(s => s.section_type === 'mindmap')
            if (data.selectedSubject && mindmapSection) {
              data.loadLectureMaps(data.selectedSubject.id, mindmapSection.id)
            }
          }}
        />
      </div>

      {/* Floating AI widget — balloon is the anchor, panel floats absolutely */}
      <div
        ref={widgetRef}
        onMouseDown={handleWidgetDrag}
        style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 201, width: 52, height: 52, cursor: 'grab' }}
      >
        {chatSubject && (
          <div style={{
            position: 'absolute',
            // Vertical: open toward whichever side has more space
            ...(balloonTop === null || balloonTop > window.innerHeight / 2 ? { bottom: 60 } : { top: 60 }),
            // Horizontal: left-align to balloon, then shift left if panel overflows right edge
            left: 0,
            transform: (() => {
              const balloonLeft = snapAnchor.right !== undefined
                ? window.innerWidth - (snapAnchor.right as number) - 52
                : (snapAnchor.left as number) ?? 0
              const overflow = balloonLeft + 400 - window.innerWidth + 8
              return overflow > 0 ? `translateX(-${overflow}px)` : 'none'
            })(),
            width: 400,
            zIndex: 201,
          }}>
            <ChatPanel
              key={chatSubject === 'global' ? 'global' : chatSubject?.type === 'pdf' ? `pdf:${chatSubject.id}` : chatSubject?.id}
              chatSubject={chatSubject}
              setChatSubject={setChatSubject}
              onNavigateToFile={navigateToFile}
              onNavigateToFormula={navigateToFormula}
              onDragHeader={handleWidgetDrag}
            />
          </div>
        )}
        <button
          onMouseDown={e => {
            const el = widgetRef.current
            if (!el) return
            const rect = el.getBoundingClientRect()
            const offsetX = e.clientX - rect.left
            const offsetY = e.clientY - rect.top
            let moved = false
            el.style.transition = 'none'
            el.style.right = 'auto'; el.style.bottom = 'auto'
            el.style.left = rect.left + 'px'; el.style.top = rect.top + 'px'
            function onMove(ev: MouseEvent) {
              moved = true
              el!.style.left = (ev.clientX - offsetX) + 'px'
              el!.style.top = (ev.clientY - offsetY) + 'px'
            }
            function onUp() {
              window.removeEventListener('mousemove', onMove, true)
              window.removeEventListener('mouseup', onUp, true)
              if (moved) {
                const r = el!.getBoundingClientRect()
                const anchor = snapToEdge(r.left, r.top)
                el!.style.transition = 'left 0.2s, right 0.2s, top 0.2s, bottom 0.2s'
                applySnap(el!, anchor)
              } else {
                setChatSubject((c: any) => c ? null : 'global')
              }
            }
            window.addEventListener('mousemove', onMove, true)
            window.addEventListener('mouseup', onUp, true)
          }}
          style={{
            width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
            background: chatSubject ? '#7c3aed' : '#6d28d9',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(109,40,217,0.45)',
          }}
          title={chatSubject ? 'Close AI chat' : 'Ask AI'}
        >
          {chatSubject ? <X size={20} color="white" /> : <MessageCircle size={22} color="white" />}
        </button>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense>
      <AppShell />
    </Suspense>
  )
}
