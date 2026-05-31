'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Search, FolderOpen, FileText, Plus, ChevronRight } from 'lucide-react'

export default function Home() {
  const [subjects, setSubjects] = useState<any[]>([])
  const [sections, setSections] = useState<any[]>([])
  const [pdfs, setPdfs] = useState<any[]>([])
  const [selectedSubject, setSelectedSubject] = useState<any>(null)
  const [selectedSection, setSelectedSection] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showAddSubject, setShowAddSubject] = useState(false)
  const [showAddSection, setShowAddSection] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCode, setNewCode] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)

  useEffect(() => { loadSubjects() }, [])

  async function loadSubjects() {
    const { data } = await supabase.from('subjects').select('*').order('name')
    setSubjects(data || [])
  }

  async function loadSections(subjectId: string) {
    const { data } = await supabase.from('sections').select('*').eq('subject_id', subjectId).order('name')
    setSections(data || [])
  }

  async function loadPdfs(sectionId: string) {
    const { data } = await supabase.from('pdfs').select('*').eq('section_id', sectionId).order('name')
    setPdfs(data || [])
  }

  async function addSubject() {
    if (!newName.trim()) return
    await supabase.from('subjects').insert({ name: newName, code: newCode })
    setNewName(''); setNewCode(''); setShowAddSubject(false)
    loadSubjects()
  }

  async function addSection() {
    if (!newName.trim() || !selectedSubject) return
    await supabase.from('sections').insert({ name: newName, subject_id: selectedSubject.id })
    setNewName(''); setShowAddSection(false)
    loadSections(selectedSubject.id)
  }

  async function handleSearch(query: string) {
    setSearchQuery(query)
    if (!query.trim()) { setSearchResults([]); return }
    const { data } = await supabase
      .from('pdf_chunks')
      .select('*, pdfs(name, sections(name, subjects(name)))')
      .ilike('content', `%${query}%`)
      .limit(20)
    setSearchResults(data || [])
  }

  async function uploadPdf(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !selectedSection) return
    setUploading(true)
    setUploadProgress(0)
    setUploadMsg('Starting upload...')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('sectionId', selectedSection.id)
    formData.append('name', file.name.replace('.pdf', ''))

    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const reader = res.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) return

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const text = decoder.decode(value)
      const lines = text.split('\n').filter(l => l.startsWith('data: '))
      for (const line of lines) {
        try {
          const data = JSON.parse(line.replace('data: ', ''))
          setUploadMsg(data.message)
          setUploadProgress(data.progress)
          if (data.step === 'done') {
            loadPdfs(selectedSection.id)
            setUploading(false)
          }
          if (data.step === 'error') {
            setUploading(false)
          }
        } catch {}
      }
    }
  }

  function selectSubject(subject: any) {
    setSelectedSubject(subject)
    setSelectedSection(null)
    setPdfs([])
    setUploadMsg('')
    setUploadProgress(0)
    loadSections(subject.id)
  }

  function selectSection(section: any) {
    setSelectedSection(section)
    setUploadMsg('')
    setUploadProgress(0)
    loadPdfs(section.id)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>

      {/* Header */}
      <div style={{ background: '#1e293b', color: 'white', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: '600' }}>📚 Lecture Notes</h1>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            placeholder="Search across all notes..."
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 12px 8px 34px', borderRadius: '8px', border: 'none', background: '#334155', color: 'white', fontSize: '14px' }}
          />
        </div>
      </div>

      {/* Search Results */}
      {searchQuery && (
        <div style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '12px 20px', maxHeight: '300px', overflowY: 'auto' }}>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>{searchResults.length} results for "{searchQuery}"</p>
          {searchResults.map((r: any) => (
            <div key={r.id} style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px', marginBottom: '8px', borderLeft: '3px solid #3b82f6' }}>
              <p style={{ fontSize: '12px', color: '#64748b' }}>
                {r.pdfs?.sections?.subjects?.name} → {r.pdfs?.sections?.name} → {r.pdfs?.name} — Page {r.page_number}
              </p>
              <p style={{ fontSize: '13px', fontWeight: '500', marginTop: '2px' }}>{r.heading}</p>
              <p style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>{r.content?.substring(0, 150)}...</p>
            </div>
          ))}
          {searchResults.length === 0 && (
            <p style={{ fontSize: '13px', color: '#94a3b8' }}>No results found</p>
          )}
        </div>
      )}

      {/* 3 Panel Layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Panel 1 - Subjects */}
        <div style={{ width: '220px', borderRight: '1px solid #e2e8f0', background: 'white', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Subjects</span>
            <button onClick={() => setShowAddSubject(!showAddSubject)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' }}>
              <Plus size={16} />
            </button>
          </div>
          {showAddSubject && (
            <div style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <input
                placeholder="Subject name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', marginBottom: '6px' }}
              />
              <input
                placeholder="Code (e.g. CE5509)"
                value={newCode}
                onChange={e => setNewCode(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', marginBottom: '6px' }}
              />
              <button onClick={addSubject} style={{ width: '100%', padding: '6px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>
                Add Subject
              </button>
            </div>
          )}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {subjects.map((s: any) => (
              <div key={s.id} onClick={() => selectSubject(s)}
                style={{
                  padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
                  background: selectedSubject?.id === s.id ? '#eff6ff' : 'white',
                  borderLeft: selectedSubject?.id === s.id ? '3px solid #3b82f6' : '3px solid transparent'
                }}>
                <div style={{ fontSize: '13px', fontWeight: '500', color: selectedSubject?.id === s.id ? '#1d4ed8' : '#1e293b' }}>{s.name}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{s.code}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel 2 - Sections */}
        <div style={{ width: '200px', borderRight: '1px solid #e2e8f0', background: 'white', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Sections</span>
            {selectedSubject && (
              <button onClick={() => setShowAddSection(!showAddSection)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' }}>
                <Plus size={16} />
              </button>
            )}
          </div>
          {showAddSection && (
            <div style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <input
                placeholder="Section name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px', marginBottom: '6px' }}
              />
              <button onClick={addSection} style={{ width: '100%', padding: '6px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>
                Add Section
              </button>
            </div>
          )}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {!selectedSubject && (
              <div style={{ padding: '20px 12px', fontSize: '13px', color: '#94a3b8', textAlign: 'center' }}>Select a subject</div>
            )}
            {sections.map((s: any) => (
              <div key={s.id} onClick={() => selectSection(s)}
                style={{
                  padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9',
                  background: selectedSection?.id === s.id ? '#eff6ff' : 'white',
                  borderLeft: selectedSection?.id === s.id ? '3px solid #3b82f6' : '3px solid transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                }}>
                <span style={{ fontSize: '13px', color: selectedSection?.id === s.id ? '#1d4ed8' : '#1e293b' }}>{s.name}</span>
                <ChevronRight size={14} color="#94a3b8" />
              </div>
            ))}
          </div>
        </div>

        {/* Panel 3 - PDFs */}
        <div style={{ flex: 1, background: '#f8fafc', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
              {selectedSection ? selectedSection.name : 'PDFs'}
            </span>
            {selectedSection && (
              <label style={{ padding: '6px 14px', background: uploading ? '#94a3b8' : '#3b82f6', color: 'white', borderRadius: '8px', cursor: uploading ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: '500' }}>
                {uploading ? 'Processing...' : '+ Upload PDF'}
                <input type="file" accept=".pdf" onChange={uploadPdf} style={{ display: 'none' }} disabled={uploading} />
              </label>
            )}
          </div>

          {/* Progress Bar */}
          {(uploadMsg || uploading) && (
            <div style={{ padding: '10px 16px', background: '#f0fdf4', borderBottom: '1px solid #bbf7d0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: '#16a34a' }}>{uploadMsg}</span>
                <span style={{ fontSize: '13px', fontWeight: '500', color: '#16a34a' }}>{uploadProgress}%</span>
              </div>
              <div style={{ background: '#dcfce7', borderRadius: '99px', height: '6px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${uploadProgress}%`,
                  background: '#16a34a',
                  borderRadius: '99px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          )}

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {!selectedSection && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                <FolderOpen size={48} style={{ margin: '0 auto 12px', display: 'block' }} />
                <p>Select a subject and section to view PDFs</p>
              </div>
            )}
            {selectedSection && pdfs.length === 0 && !uploading && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                <FileText size={48} style={{ margin: '0 auto 12px', display: 'block' }} />
                <p>No PDFs uploaded yet</p>
                <p style={{ fontSize: '13px', marginTop: '8px' }}>Click Upload PDF to get started</p>
              </div>
            )}
            {pdfs.map((p: any) => (
              <div key={p.id} style={{ background: 'white', borderRadius: '10px', padding: '14px 16px', marginBottom: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileText size={20} color="#3b82f6" />
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: '500' }}>{p.name}</p>
                    <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{p.pages} pages</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}