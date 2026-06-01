'use client'
import { useRef, useState } from 'react'
import { Search, FileText, ChevronRight, MessageCircle, Send, X, Plus, Trash2, BookOpen } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { supabase } from '../../../lib/supabase'
import type { ChatMessage, ChatSession } from '../types'

function AssistantMessage({ text }: { text: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        p: ({ children }: any) => <p style={{ margin: '0 0 8px 0' }}>{children}</p>,
        strong: ({ children }: any) => <strong style={{ fontWeight: '600', color: '#0f172a' }}>{children}</strong>,
        ol: ({ children }: any) => <ol style={{ paddingLeft: '18px', margin: '4px 0 8px 0' }}>{children}</ol>,
        ul: ({ children }: any) => <ul style={{ paddingLeft: '18px', margin: '4px 0 8px 0' }}>{children}</ul>,
        li: ({ children }: any) => <li style={{ marginBottom: '6px' }}>{children}</li>,
        code: ({ children }: any) => <code style={{ background: '#e2e8f0', padding: '1px 5px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>{children}</code>,
        h1: ({ children }: any) => <h1 style={{ fontSize: '15px', fontWeight: '700', margin: '8px 0 4px 0' }}>{children}</h1>,
        h2: ({ children }: any) => <h2 style={{ fontSize: '14px', fontWeight: '700', margin: '8px 0 4px 0' }}>{children}</h2>,
        h3: ({ children }: any) => <h3 style={{ fontSize: '13px', fontWeight: '600', margin: '6px 0 3px 0' }}>{children}</h3>,
      }}
    >
      {text}
    </ReactMarkdown>
  )
}

interface Props {
  chatSubject: any
  setChatSubject: (v: any) => void
  onNavigateToFile: (pdf: any) => void
  onNavigateToFormula: (formula: any) => void
  onDragHeader: (e: React.MouseEvent) => void
}

export default function ChatPanel({ chatSubject, setChatSubject, onNavigateToFile, onNavigateToFormula, onDragHeader }: Props) {
  const chatBottomRef = useRef<HTMLDivElement>(null)

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatSessionId, setChatSessionId] = useState<string | null>(null)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [showSessions, setShowSessions] = useState(false)
  const [sessionTitle, setSessionTitle] = useState<string | null>(null)
  // Derived: true while waiting for AI response (last message is empty assistant placeholder)
  const isStreaming = chatHistory.length > 0 && chatHistory[chatHistory.length - 1].role === 'assistant' && !chatHistory[chatHistory.length - 1].text
  const [fileSearch, setFileSearch] = useState('')
  const [fileSearchResults, setFileSearchResults] = useState<any[]>([])
  const [formulaSearchResults, setFormulaSearchResults] = useState<any[]>([])
  const [expandedFileId, setExpandedFileId] = useState<string | null>(null)


  async function loadSessions() {
    const { data } = await supabase
      .from('chat_sessions').select('*').order('updated_at', { ascending: false }).limit(50)
    setChatSessions(data || [])
  }

  async function loadSession(session: ChatSession) {
    const { data } = await supabase
      .from('chat_messages').select('*').eq('session_id', session.id).order('created_at')
    setChatHistory((data || []).map((m: any) => ({ role: m.role, text: m.text, model: m.model })))
    setChatSessionId(session.id)
    setSessionTitle(session.scope_name || null)
    setShowSessions(false)
    setChatInput('')
  }

  async function deleteSession(e: React.MouseEvent, sessionId: string) {
    e.stopPropagation()
    await supabase.from('chat_sessions').delete().eq('id', sessionId)
    setChatSessions(s => s.filter(x => x.id !== sessionId))
    if (chatSessionId === sessionId) {
      setChatHistory([])
      setChatSessionId(null)
    }
  }

  async function searchFiles(query: string) {
    setFileSearch(query)
    if (!query.trim()) { setFileSearchResults([]); setFormulaSearchResults([]); return }
    const [{ data: pdfs }, { data: formulas }] = await Promise.all([
      supabase.from('pdfs').select('*, sections(name, subject_id, subjects(name))')
        .ilike('name', `%${query}%`).order('name').limit(15),
      supabase.from('formulas').select('id, name, section_id, sections(name, subject_id, subjects(name))')
        .ilike('name', `%${query}%`).order('name').limit(10),
    ])
    setFileSearchResults(pdfs || [])
    setFormulaSearchResults(formulas || [])
  }

  async function sendChat() {
    if (!chatInput.trim() || isStreaming || !chatSubject) return
    const question = chatInput.trim()
    const historySnapshot = chatHistory.filter(m => m.text && m.text.trim())
    setChatInput('')
    setChatHistory(h => [...h, { role: 'user', text: question }])

    const isGlobal = chatSubject === 'global'
    const isPdf = chatSubject?.type === 'pdf'

    // Generate title from first question immediately — no AI needed
    const autoTitle = question.split(/\s+/).slice(0, 7).join(' ') + (question.split(/\s+/).length > 7 ? '…' : '')

    let sessionId = chatSessionId
    try {
      if (!sessionId) {
        const scope = isGlobal ? 'global' : isPdf ? `pdf:${chatSubject.id}` : chatSubject.id
        const { data: sess } = await supabase
          .from('chat_sessions').insert({ scope, scope_name: autoTitle }).select().single()
        if (sess) {
          sessionId = sess.id
          setChatSessionId(sess.id)
          setSessionTitle(autoTitle)
          setChatSessions(s => [{ id: sess.id, scope: scope, scope_name: autoTitle, updated_at: new Date().toISOString() }, ...s])
        }
      }

      if (sessionId) {
        await supabase.from('chat_messages').insert({ session_id: sessionId, role: 'user', text: question })
      }

      let answer = ''
      let usedModel = ''
      setChatHistory(h => [...h, { role: 'assistant', text: '' }])

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          sessionId,
          pdfId: isPdf ? chatSubject.id : null,
          pdfName: isPdf ? chatSubject.name : null,
          subjectId: !isGlobal && !isPdf ? chatSubject.id : null,
          subjectName: !isGlobal && !isPdf ? chatSubject.name : null,
          history: historySnapshot,
        }),
      })

      if (!res.ok) {
        const err = await res.text()
        setChatHistory(h => h.map((m, i) => i === h.length - 1 ? { ...m, text: 'Error: ' + err } : m))
        return
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (reader) {
        let buffer = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try {
              const data = JSON.parse(line.slice(6))
              if (data.model) usedModel = data.model
              if (data.text) {
                answer += data.text
                setChatHistory(h => h.map((m, i) => i === h.length - 1 ? { ...m, text: answer, model: usedModel } : m))
                chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
              }
              if (data.sources) {
                setChatHistory(h => h.map((m, i) => i === h.length - 1 ? { ...m, sources: data.sources } : m))
              }
              if (data.finalAnswer !== undefined) {
                setChatHistory(h => h.map((m, i) => i === h.length - 1 ? { ...m, text: data.finalAnswer } : m))
              }
              if (data.done) {
                setChatSessions(s => s.map(x => x.id === sessionId ? { ...x, updated_at: new Date().toISOString() } : x))
              }
              if (data.error) {
                setChatHistory(h => h.map((m, i) => i === h.length - 1 ? { ...m, text: 'Error: ' + data.error } : m))
              }
            } catch {}
          }
        }
      }

    } catch (err: any) {
      setChatHistory(h => h.map((m, i) => i === h.length - 1 ? { ...m, text: 'Error: ' + err.message } : m))
    }
  }

  return (
    <div style={{ width: '400px', height: '70vh', maxHeight: '640px', background: 'white', borderRadius: '16px', boxShadow: '0 8px 40px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      {/* Header */}
      <div onMouseDown={onDragHeader} style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'grab', userSelect: 'none' }}>
        <MessageCircle size={18} color="#8b5cf6" style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {sessionTitle || (chatSubject === 'global' ? 'All Lecture Notes' : chatSubject.name)}
          </p>
          <p style={{ fontSize: '11px', color: '#94a3b8' }}>
            {chatSubject === 'global' ? 'Searching across all subjects' : chatSubject?.type === 'pdf' ? 'This document only' : 'Searching this subject only'}
          </p>
        </div>
        <button title="New chat" onClick={() => { setChatHistory([]); setChatSessionId(null); setShowSessions(false); setSessionTitle(null) }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px', flexShrink: 0 }}
          onMouseEnter={e => (e.currentTarget.style.color = '#8b5cf6')}
          onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}>
          <Plus size={16} />
        </button>
        <button title="Chat history" onClick={() => { setShowSessions(s => !s); loadSessions() }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: showSessions ? '#8b5cf6' : '#94a3b8', padding: '4px', flexShrink: 0 }}
          onMouseEnter={e => (e.currentTarget.style.color = '#8b5cf6')}
          onMouseLeave={e => (e.currentTarget.style.color = showSessions ? '#8b5cf6' : '#94a3b8')}>
          <Search size={15} />
        </button>
        <button onClick={() => setChatSubject(null)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px', flexShrink: 0 }}
          onMouseEnter={e => (e.currentTarget.style.color = '#1e293b')}
          onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}>
          <X size={18} />
        </button>
      </div>

      {/* Sessions */}
      {showSessions && (
        <div style={{ borderBottom: '1px solid #e2e8f0', background: '#fafafa', maxHeight: '260px', overflowY: 'auto' }}>
          <div style={{ padding: '8px 12px', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>Chat History</div>
          {chatSessions.length === 0 && <p style={{ padding: '16px 12px', fontSize: '12px', color: '#94a3b8' }}>No saved chats yet</p>}
          {chatSessions.map(sess => (
            <div key={sess.id} onClick={() => loadSession(sess)}
              style={{ padding: '9px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px', background: chatSessionId === sess.id ? '#eff6ff' : 'white' }}
              onMouseEnter={e => { if (chatSessionId !== sess.id) e.currentTarget.style.background = '#f8fafc' }}
              onMouseLeave={e => { if (chatSessionId !== sess.id) e.currentTarget.style.background = 'white' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '12px', fontWeight: '500', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sess.scope_name}</p>
                <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '1px' }}>
                  {new Date(sess.updated_at).toLocaleDateString()} {new Date(sess.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <button onClick={e => deleteSession(e, sess.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: '2px', flexShrink: 0 }}
                onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                onMouseLeave={e => (e.currentTarget.style.color = '#cbd5e1')}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* File Search */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', background: 'white' }}>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input value={fileSearch} onChange={e => searchFiles(e.target.value)} placeholder="Find a file by name..."
            style={{ width: '100%', padding: '6px 8px 6px 28px', border: '1px solid #e2e8f0', borderRadius: '7px', fontSize: '12px', outline: 'none', background: '#f8fafc', boxSizing: 'border-box' }} />
          {fileSearch && (
            <button onClick={() => { setFileSearch(''); setFileSearchResults([]) }}
              style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, lineHeight: 1 }}>
              <X size={12} />
            </button>
          )}
        </div>
        {fileSearchResults.length > 0 && (
          <div style={{ marginTop: '6px', maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {fileSearchResults.map(pdf => (
              <div key={pdf.id} style={{ border: '1px solid #e2e8f0', borderRadius: '7px', overflow: 'hidden' }}>
                <div onClick={() => setExpandedFileId(expandedFileId === pdf.id ? null : pdf.id)}
                  style={{ padding: '7px 10px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: expandedFileId === pdf.id ? '#f0f9ff' : 'white' }}>
                  <FileText size={13} color="#3b82f6" style={{ flexShrink: 0 }} />
                  <span title={pdf.name} style={{ fontSize: '12px', fontWeight: '500', color: '#1e293b', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pdf.name}</span>
                  <ChevronRight size={12} color="#94a3b8" style={{ flexShrink: 0, transform: expandedFileId === pdf.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
                </div>
                {expandedFileId === pdf.id && (
                  <div style={{ padding: '8px 10px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <p style={{ fontSize: '11px', color: '#64748b' }}>📁 {pdf.sections?.subjects?.name} → {pdf.sections?.name}</p>
                    <p style={{ fontSize: '11px', color: '#94a3b8' }}>{pdf.pages} pages</p>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => { onNavigateToFile(pdf); setExpandedFileId(null) }}
                        style={{ flex: 1, padding: '5px 8px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '500' }}>
                        Navigate to file
                      </button>
                      {pdf.file_url && (
                        <button onClick={() => window.open(pdf.file_url, '_blank')}
                          style={{ flex: 1, padding: '5px 8px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '500' }}>
                          Open PDF ↗
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {formulaSearchResults.length > 0 && (
          <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', paddingLeft: '2px' }}>Formulas</p>
            {formulaSearchResults.map(f => (
              <div key={f.id}
                onClick={() => onNavigateToFormula(f)}
                style={{ padding: '7px 10px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', border: '1px solid #e2e8f0', borderRadius: '7px', background: 'white' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#fefce8')}
                onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                <BookOpen size={13} color="#f59e0b" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '12px', fontWeight: '500', color: '#1e293b', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                <span style={{ fontSize: '10px', color: '#94a3b8', flexShrink: 0 }}>
                  {(f.sections as any)?.subjects?.name}
                </span>
              </div>
            ))}
          </div>
        )}
        {fileSearch && fileSearchResults.length === 0 && formulaSearchResults.length === 0 && (
          <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', paddingLeft: '2px' }}>No files or formulas found</p>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {chatHistory.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 16px', color: '#94a3b8' }}>
            <MessageCircle size={36} style={{ margin: '0 auto 12px', display: 'block', color: '#c4b5fd' }} />
            <p style={{ fontSize: '14px', fontWeight: '500', color: '#64748b', marginBottom: '8px' }}>
              {chatSubject === 'global' ? 'Ask about any lecture note' : chatSubject?.type === 'pdf' ? `Ask about "${chatSubject.name}"` : `Ask about ${chatSubject.name}`}
            </p>
            <p style={{ fontSize: '12px' }}>Try: &quot;Summarize the key topics&quot; or &quot;Explain compression members&quot;</p>
          </div>
        )}
        {chatHistory.map((msg, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '85%', padding: '10px 14px',
              borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
              background: msg.role === 'user' ? '#8b5cf6' : '#f1f5f9',
              color: msg.role === 'user' ? 'white' : '#1e293b',
              fontSize: '13px', lineHeight: '1.6',
            }}>
              {msg.role === 'user' ? msg.text : msg.text ? (
                <AssistantMessage text={msg.text} />
              ) : isStreaming && i === chatHistory.length - 1 ? (
                <span style={{ color: '#94a3b8' }}>...</span>
              ) : null}
            </div>
            {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
              <div style={{ maxWidth: '85%', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {msg.sources.filter(s => s.type === 'pdf').map((s, j) => (
                  <button key={j} onClick={() => {
                    supabase.from('pdfs').select('*, sections(name, subject_id, subjects(name))').eq('id', s.pdf_id!).single()
                      .then(({ data }) => { if (data) onNavigateToFile(data) })
                  }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '500', textAlign: 'left' }}>
                    <FileText size={11} style={{ flexShrink: 0 }} />
                    {s.name}{s.page ? ` — p.${s.page}` : ''}
                  </button>
                ))}
                {msg.sources.filter(s => s.type === 'formula').map((s, j) => (
                  <button key={j} onClick={() => {
                    supabase.from('formulas').select('*, sections(name, subject_id, subjects(name))').eq('name', s.name).eq('section_id', s.section_id!).single()
                      .then(({ data }) => { if (data) onNavigateToFormula(data) })
                  }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', background: '#fefce8', color: '#b45309', border: '1px solid #fde68a', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '500', textAlign: 'left' }}>
                    <BookOpen size={11} style={{ flexShrink: 0 }} />
                    {s.name}
                  </button>
                ))}
              </div>
            )}
            {msg.role === 'assistant' && msg.model && (
              <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px', paddingLeft: '4px' }}>{msg.model}</span>
            )}
          </div>
        ))}
        <div ref={chatBottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px', background: 'white' }}>
        <input value={chatInput} onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat() } }}
          placeholder="Ask a question..." disabled={isStreaming}
          style={{ flex: 1, padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: '10px', fontSize: '13px', outline: 'none', background: isStreaming ? '#f8fafc' : 'white' }} />
        <button onClick={sendChat} disabled={isStreaming || !chatInput.trim()}
          style={{ padding: '9px 14px', background: isStreaming || !chatInput.trim() ? '#e2e8f0' : '#8b5cf6', color: isStreaming || !chatInput.trim() ? '#94a3b8' : 'white', border: 'none', borderRadius: '10px', cursor: isStreaming || !chatInput.trim() ? 'default' : 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <Send size={15} />
        </button>
      </div>
    </div>
  )
}
