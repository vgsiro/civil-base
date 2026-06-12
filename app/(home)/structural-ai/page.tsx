'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import {
  HardHat, Plus, Trash2, Send, Calculator, ChevronDown,
  ChevronRight, MessageSquare, Settings, Menu, X,
  ThumbsUp, ThumbsDown, Copy, Check, AlertTriangle, Paperclip,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import HomeNavBar from '../../_components/shared/HomeNavBar'
import HomeFooter from '../../_components/shared/HomeFooter'

// ── Types ─────────────────────────────────────────────────────────────────────

interface CalcResult {
  clause: string | null
  quantity: string | null
  formula_latex: string | null
  result: number
  result_unit: string
  utilisation: number | null
  verdict: 'PASS' | 'FAIL' | null
  error?: string
}

interface Message {
  role: 'user' | 'assistant'
  text: string
  model?: string
  calcResults?: CalcResult[]
  responseId?: number | null
  images?: string[]
}

interface Session {
  id: string
  scope: string
  scope_name: string
  updated_at: string
}

interface StructuralInputs {
  checkType: string
  span: string
  load: string
  section: string
  steel: string
  code: string
}

const EMPTY_INPUTS: StructuralInputs = { checkType: '', span: '', load: '', section: '', steel: '', code: '' }

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  if (m < 1440) return `${Math.floor(m / 60)}h ago`
  if (m < 10080) return `${Math.floor(m / 1440)}d ago`
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

function groupSessionsByDate(sessions: Session[]) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  const week = new Date(today); week.setDate(today.getDate() - 7)
  const month = new Date(today); month.setDate(today.getDate() - 30)

  const groups: { label: string; items: Session[] }[] = [
    { label: 'Today', items: [] },
    { label: 'Yesterday', items: [] },
    { label: 'Last 7 days', items: [] },
    { label: 'Last 30 days', items: [] },
    { label: 'Older', items: [] },
  ]

  for (const s of sessions) {
    const d = new Date(s.updated_at)
    if (d >= today) groups[0].items.push(s)
    else if (d >= yesterday) groups[1].items.push(s)
    else if (d >= week) groups[2].items.push(s)
    else if (d >= month) groups[3].items.push(s)
    else groups[4].items.push(s)
  }

  return groups.filter(g => g.items.length > 0)
}

// ── Sub-components ────────────────────────────────────────────────────────────

function AssistantMessage({ text }: { text: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        p: ({ children }: any) => <p style={{ margin: '0 0 10px 0', lineHeight: 1.7 }}>{children}</p>,
        strong: ({ children }: any) => <strong style={{ fontWeight: 600 }}>{children}</strong>,
        ol: ({ children }: any) => <ol style={{ paddingLeft: 20, margin: '4px 0 10px 0' }}>{children}</ol>,
        ul: ({ children }: any) => <ul style={{ paddingLeft: 20, margin: '4px 0 10px 0' }}>{children}</ul>,
        li: ({ children }: any) => <li style={{ marginBottom: 6, lineHeight: 1.6 }}>{children}</li>,
        code: ({ children, className }: any) => {
          const isBlock = className?.includes('language-')
          return isBlock
            ? <code style={{ display: 'block', background: '#1e293b', color: '#e2e8f0', padding: '12px 16px', borderRadius: 8, fontSize: 13, fontFamily: 'monospace', overflowX: 'auto', margin: '8px 0' }}>{children}</code>
            : <code style={{ background: '#f1f5f9', color: '#0f172a', padding: '2px 6px', borderRadius: 4, fontSize: 13, fontFamily: 'monospace' }}>{children}</code>
        },
        h1: ({ children }: any) => <h1 style={{ fontSize: 18, fontWeight: 700, margin: '16px 0 8px 0', color: '#0f172a' }}>{children}</h1>,
        h2: ({ children }: any) => <h2 style={{ fontSize: 16, fontWeight: 700, margin: '14px 0 6px 0', color: '#0f172a' }}>{children}</h2>,
        h3: ({ children }: any) => <h3 style={{ fontSize: 14, fontWeight: 600, margin: '10px 0 4px 0', color: '#0f172a' }}>{children}</h3>,
        blockquote: ({ children }: any) => <blockquote style={{ borderLeft: '3px solid #e2e8f0', paddingLeft: 12, color: '#64748b', margin: '8px 0', fontStyle: 'italic' }}>{children}</blockquote>,
        table: ({ children }: any) => <div style={{ overflowX: 'auto', margin: '8px 0' }}><table style={{ borderCollapse: 'collapse', fontSize: 13, width: '100%' }}>{children}</table></div>,
        th: ({ children }: any) => <th style={{ border: '1px solid #e2e8f0', padding: '6px 10px', background: '#f8fafc', fontWeight: 600, textAlign: 'left' }}>{children}</th>,
        td: ({ children }: any) => <td style={{ border: '1px solid #e2e8f0', padding: '6px 10px' }}>{children}</td>,
      }}
    >
      {text}
    </ReactMarkdown>
  )
}

function CalcCard({ result }: { result: CalcResult }) {
  if (result.error) {
    return (
      <div style={{ margin: '10px 0', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, fontSize: 13, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8 }}>
        <AlertTriangle size={14} /> Calc error: {result.error}
      </div>
    )
  }
  const isPass = result.verdict === 'PASS'
  const isFail = result.verdict === 'FAIL'
  const utilPct = result.utilisation != null ? (result.utilisation * 100).toFixed(1) : null

  return (
    <div style={{ margin: '10px 0', border: `1.5px solid ${isPass ? '#bbf7d0' : isFail ? '#fca5a5' : '#e2e8f0'}`, borderRadius: 12, overflow: 'hidden', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ padding: '8px 14px', background: isPass ? '#f0fdf4' : isFail ? '#fef2f2' : '#f8fafc', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #f1f5f9' }}>
        <Calculator size={14} color={isPass ? '#16a34a' : isFail ? '#dc2626' : '#64748b'} />
        <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', flex: 1 }}>
          {result.quantity || 'Calculation'}{result.clause ? <span style={{ fontWeight: 400, color: '#64748b', marginLeft: 6 }}>— {result.clause}</span> : null}
        </span>
        {result.verdict && (
          <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: isPass ? '#16a34a' : '#dc2626', color: 'white', letterSpacing: '0.05em' }}>
            {result.verdict}
          </span>
        )}
      </div>
      <div style={{ padding: '10px 14px' }}>
        <div style={{ display: 'flex', gap: 20, marginBottom: utilPct ? 8 : 0, flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Result</span>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginTop: 1 }}>
              {result.result.toLocaleString(undefined, { maximumFractionDigits: 3 })} <span style={{ fontSize: 12, fontWeight: 400, color: '#64748b' }}>{result.result_unit}</span>
            </div>
          </div>
          {utilPct && (
            <div>
              <span style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Utilisation</span>
              <div style={{ fontSize: 15, fontWeight: 700, color: isPass ? '#16a34a' : '#dc2626', marginTop: 1 }}>
                {utilPct}%
              </div>
            </div>
          )}
        </div>
        {utilPct && (
          <div style={{ height: 6, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(parseFloat(utilPct), 100)}%`, background: isPass ? '#16a34a' : '#dc2626', borderRadius: 99, transition: 'width 0.4s ease' }} />
          </div>
        )}
        <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>AI assistance — verify against the governing code before use in design.</p>
      </div>
    </div>
  )
}

function StructuralForm({ inputs, onChange, question, setQuestion, onSubmit, onClose }: {
  inputs: StructuralInputs
  onChange: (k: keyof StructuralInputs, v: string) => void
  question: string
  setQuestion: (v: string) => void
  onSubmit: () => void
  onClose: () => void
}) {
  const field = (label: string, key: keyof StructuralInputs, placeholder: string) => (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.04em' }}>{label}</label>
      <input
        value={inputs[key]}
        onChange={e => onChange(key, e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', background: 'white', color: '#0f172a', boxSizing: 'border-box' as const }}
        onFocus={e => e.target.style.borderColor = '#f59e0b'}
        onBlur={e => e.target.style.borderColor = '#e2e8f0'}
      />
    </div>
  )

  return (
    <div style={{ background: '#fafafa', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Calculator size={14} color="#f59e0b" /> Structural Inputs
        </span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2 }}>
          <X size={14} />
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        {field('Check type', 'checkType', 'Beam bending, column…')}
        {field('Section', 'section', 'IPE300, HEA200…')}
        {field('Span / length', 'span', '6m, 3500mm…')}
        {field('Steel grade', 'steel', 'S275, S355…')}
        {field('Load', 'load', '20 kN/m UDL, 50 kN…')}
        {field('Code', 'code', 'EN 1993-1-1, TCVN…')}
      </div>
      <div style={{ marginBottom: 10 }}>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.04em' }}>Question</label>
        <textarea
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit() } }}
          placeholder="e.g. Check the bending resistance at midspan"
          rows={2}
          style={{ width: '100%', padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const }}
          onFocus={e => e.target.style.borderColor = '#f59e0b'}
          onBlur={e => e.target.style.borderColor = '#e2e8f0'}
        />
      </div>
      <button onClick={onSubmit}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, float: 'right' as const }}>
        <HardHat size={14} color="#f59e0b" /> Run Check
      </button>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function StructuralAIPage() {
  useEffect(() => { document.title = 'Structural AI — CivilAxis' }, [])
  const router = useRouter()
  const params = useParams()
  const urlSessionId = params?.sessionId as string | undefined
  const [user, setUser] = useState<User | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [structuralInputs, setStructuralInputs] = useState<StructuralInputs>(EMPTY_INPUTS)
  const [formQuestion, setFormQuestion] = useState('')
  const [feedbackGiven, setFeedbackGiven] = useState<Record<number, number>>({})
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pendingImages, setPendingImages] = useState<string[]>([])
  const [authLoading, setAuthLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync URL session ID → state
  useEffect(() => {
    if (!user) return
    if (urlSessionId) {
      if (urlSessionId !== activeSessionId) loadSessionById(urlSessionId)
    } else {
      setActiveSessionId(null)
      setMessages([])
      setInput('')
      setPendingImages([])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSessionId, user])

  // Auth — then load sessions once we know who the user is
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
      if (session?.user) loadSessions().then(() => {
        if (urlSessionId) loadSessionById(urlSessionId)
      })
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) loadSessions()
      else setSessions([])
    })
    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadSessions() {
    const { data: { session } } = await supabase.auth.getSession()
    const userId = session?.user?.id
    if (!userId) { setSessions([]); return }
    const { data } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('scope', 'structural')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(100)
    setSessions((data as Session[]) || [])
  }

  async function loadSessionById(id: string) {
    setActiveSessionId(id)
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', id)
      .order('created_at')
    setMessages((data || []).map((m: any) => ({ role: m.role, text: m.text, model: m.model })))
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)
  }

  async function loadSession(session: Session) {
    router.push(`/structural-ai/${session.id}`)
  }

  async function deleteSession(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    setDeletingId(id)
    await supabase.from('chat_sessions').delete().eq('id', id)
    setSessions(s => s.filter(x => x.id !== id))
    if (activeSessionId === id) {
      router.push('/structural-ai')
    }
    setDeletingId(null)
  }

  function startNewChat() {
    router.push('/structural-ai')
  }

  function copyMessage(text: string, idx: number) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx)
      setTimeout(() => setCopiedIdx(null), 1800)
    })
  }

  function readFilesAsDataURL(files: FileList | File[]) {
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue
      const reader = new FileReader()
      reader.onload = e => {
        const result = e.target?.result as string
        if (result) setPendingImages(prev => [...prev, result])
      }
      reader.readAsDataURL(file)
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = e.clipboardData?.items
    if (!items) return
    const imageItems = Array.from(items).filter(item => item.type.startsWith('image/'))
    if (imageItems.length === 0) return
    e.preventDefault()
    const files = imageItems.map(item => item.getAsFile()).filter(Boolean) as File[]
    readFilesAsDataURL(files)
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    if (e.dataTransfer.files.length > 0) {
      readFilesAsDataURL(e.dataTransfer.files)
    }
  }

  function removeImage(idx: number) {
    setPendingImages(prev => prev.filter((_, i) => i !== idx))
  }

  async function submitFeedback(responseId: number, rating: number) {
    setFeedbackGiven(f => ({ ...f, [responseId]: rating }))
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responseId, rating }),
      })
    } catch {}
  }

  const sendMessage = useCallback(async (overrideQuestion?: string, inputs?: StructuralInputs) => {
    const question = (overrideQuestion ?? input).trim()
    if (isStreaming) return
    if (!question && pendingImages.length === 0) return

    const imagesToSend = pendingImages.slice()
    setInput('')
    setPendingImages([])
    setIsStreaming(true)
    const historySnapshot = messages.filter(m => m.text?.trim())
    setMessages(prev => [...prev, { role: 'user', text: question, images: imagesToSend.length > 0 ? imagesToSend : undefined }])

    const autoTitle = question
      ? question.split(/\s+/).slice(0, 8).join(' ') + (question.split(/\s+/).length > 8 ? '…' : '')
      : `Image${imagesToSend.length > 1 ? 's' : ''} — ${new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}`

    let sessionId = activeSessionId
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession()
      const userId = authSession?.user?.id ?? null
      const accessToken = authSession?.access_token ?? null

      if (!sessionId) {
        const { data: sess, error: sessErr } = await supabase
          .from('chat_sessions')
          .insert({ scope: 'structural', scope_name: autoTitle, user_id: userId })
          .select().single()
        if (sessErr) console.error('[chat] session insert error:', sessErr.message)
        if (sess) {
          sessionId = sess.id
          setActiveSessionId(sess.id)
          router.replace(`/structural-ai/${sess.id}`)
        }
      }
      if (sessionId) {
        const { error: msgErr } = await supabase
          .from('chat_messages')
          .insert({ session_id: sessionId, role: 'user', text: question, user_id: userId })
        if (msgErr) console.error('[chat] message insert error:', msgErr.message)
      }

      setMessages(prev => [...prev, { role: 'assistant', text: '' }])

      const effectiveQuestion = question || 'What is shown in this image? Describe any structural details, loads, dimensions, or notation visible.'
      const body: any = { question: effectiveQuestion, sessionId, history: historySnapshot, scope: 'structural' }
      if (inputs && Object.values(inputs).some(v => v !== '')) body.structuralInputs = inputs
      if (imagesToSend.length > 0) body.images = imagesToSend

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.text()
        setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, text: 'Error: ' + err } : m))
        setIsStreaming(false)
        return
      }

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (reader) {
        let buffer = ''
        let answer = ''
        let usedModel = ''
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
                setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, text: answer, model: usedModel } : m))
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
              }
              if (data.finalAnswer !== undefined) {
                answer = data.finalAnswer
                setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, text: data.finalAnswer } : m))
              }
              if (data.calcResults) {
                setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, calcResults: data.calcResults } : m))
              }
              if (data.done) {
                if (data.responseId) {
                  setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, responseId: data.responseId } : m))
                }
                loadSessions()
              }
              if (data.error) {
                setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, text: 'Error: ' + data.error } : m))
              }
            } catch {}
          }
        }
      }
    } catch (err: any) {
      setMessages(prev => prev.map((m, i) => i === prev.length - 1 ? { ...m, text: 'Error: ' + err.message } : m))
    } finally {
      setIsStreaming(false)
    }
  }, [input, isStreaming, messages, activeSessionId, pendingImages])

  function handleFormSubmit() {
    const q = formQuestion.trim()
    if (!q) return
    const hasInputs = Object.values(structuralInputs).some(v => v !== '')
    sendMessage(q, hasInputs ? structuralInputs : undefined)
    setStructuralInputs(EMPTY_INPUTS)
    setFormQuestion('')
    setShowForm(false)
  }

  // Auto-resize textarea
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px'
  }

  const sessionGroups = groupSessionsByDate(sessions)
  const isEmpty = messages.length === 0

  // ── Auth gate ─────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#cbd5e1', animation: 'pulse 1.4s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>
    )
  }

  if (!user) {
    router.replace('/')
    return null
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#fff', overflow: 'hidden' }}>

      {/* ── Top bar ── */}
      <HomeNavBar pageLabel="Structural AI">
        <button onClick={() => setSidebarOpen(s => !s)}
          style={{ width: 32, height: 32, border: 'none', background: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}
          onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}>
          <Menu size={18} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HardHat size={15} color="#f59e0b" />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Structural AI</span>
          <span style={{ fontSize: 11, color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: 20 }}>Eurocode & TCVN</span>
        </div>
        <button onClick={startNewChat}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
          onMouseEnter={e => e.currentTarget.style.background = '#1e293b'}
          onMouseLeave={e => e.currentTarget.style.background = '#0f172a'}>
          <Plus size={13} /> New chat
        </button>
      </HomeNavBar>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Sidebar ── */}
        <div style={{
          width: sidebarOpen ? 280 : 0,
          flexShrink: 0,
          overflow: 'hidden',
          transition: 'width 0.2s ease',
          borderRight: '1px solid #e2e8f0',
          background: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{ width: 280, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Sidebar header */}
            <div style={{ padding: '14px 14px 10px', flexShrink: 0 }}>
              <button onClick={startNewChat}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#0f172a' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                <Plus size={15} color="#64748b" />
                New conversation
              </button>
            </div>

            {/* Session list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 16px' }}>
              {sessions.length === 0 && (
                <div style={{ padding: '32px 12px', textAlign: 'center' as const, color: '#94a3b8', fontSize: 13 }}>
                  No conversations yet
                </div>
              )}
              {sessionGroups.map(group => (
                <div key={group.label}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '10px 8px 4px' }}>
                    {group.label}
                  </div>
                  {group.items.map(sess => (
                    <div key={sess.id}
                      onClick={() => loadSession(sess)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                        background: activeSessionId === sess.id ? '#e2e8f0' : 'transparent',
                        marginBottom: 1,
                      }}
                      onMouseEnter={e => { if (activeSessionId !== sess.id) e.currentTarget.style.background = '#f1f5f9' }}
                      onMouseLeave={e => { if (activeSessionId !== sess.id) e.currentTarget.style.background = 'transparent' }}>
                      <MessageSquare size={13} color="#94a3b8" style={{ flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 13, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                        {sess.scope_name}
                      </span>
                      <button
                        onClick={e => deleteSession(e, sess.id)}
                        style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: '2px', borderRadius: 4, display: 'flex', opacity: deletingId === sess.id ? 1 : undefined }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.opacity = '1' }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#cbd5e1' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Sidebar footer */}
            <div style={{ padding: '10px 14px', borderTop: '1px solid #e2e8f0', flexShrink: 0 }}>
              <a href="/standards" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, textDecoration: 'none', color: '#475569', fontSize: 13 }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f1f5f9'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                <Settings size={14} /> Standards & References
              </a>
            </div>
          </div>
        </div>

        {/* ── Main chat area ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 20px' }}>
            {isEmpty ? (
              /* Welcome screen */
              <div style={{ maxWidth: 680, margin: '0 auto', padding: '60px 24px 24px' }}>
                <div style={{ textAlign: 'center' as const, marginBottom: 48 }}>
                  <div style={{ width: 64, height: 64, borderRadius: 18, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <HardHat size={34} color="#f59e0b" />
                  </div>
                  <h1 style={{ fontSize: 28, fontWeight: 700, color: '#0f172a', marginBottom: 10 }}>Structural Engineering AI</h1>
                  <p style={{ fontSize: 15, color: '#64748b', maxWidth: 440, margin: '0 auto', lineHeight: 1.6 }}>
                    Clause-cited answers from Eurocode & TCVN standards. Calculations verified by deterministic math, not the AI.
                  </p>
                </div>

                {/* Suggested prompts */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { icon: '🏗️', title: 'Beam bending check', sub: 'IPE300, S275, M_Ed = 90 kNm, EN 1993-1-1' },
                    { icon: '🔩', title: 'Bolt shear resistance', sub: 'M20 grade 8.8, single shear, EN 1993-1-8' },
                    { icon: '🏛️', title: 'Concrete column', sub: 'B25, 300×300mm, N_Ed = 800 kN, TCVN 5574' },
                    { icon: '📐', title: 'Weld capacity', sub: 'Fillet weld 6mm, S355 plate, EN 1993-1-8' },
                  ].map(p => (
                    <button key={p.title} onClick={() => setInput(p.title + ' — ' + p.sub)}
                      style={{ padding: '14px 16px', border: '1px solid #e2e8f0', borderRadius: 12, background: 'white', cursor: 'pointer', textAlign: 'left' as const, transition: 'border-color 0.15s, box-shadow 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(245,158,11,0.12)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none' }}>
                      <div style={{ fontSize: 18, marginBottom: 6 }}>{p.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 3 }}>{p.title}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>{p.sub}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Message thread */
              <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 24px 0' }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{ marginBottom: 28 }}>
                    {msg.role === 'user' ? (
                      /* User bubble */
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                          {msg.images && msg.images.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end' }}>
                              {msg.images.map((src, imgIdx) => (
                                <img key={imgIdx} src={src} alt="attachment"
                                  style={{ maxWidth: 220, maxHeight: 160, borderRadius: 10, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.15)' }} />
                              ))}
                            </div>
                          )}
                          <div style={{ background: '#0f172a', color: 'white', padding: '12px 16px', borderRadius: '18px 18px 4px 18px', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' as const, wordBreak: 'break-word' as const }}>
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Assistant message */
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 9, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                          <HardHat size={17} color="#f59e0b" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {msg.text ? (
                            <div style={{ fontSize: 14, color: '#1e293b', lineHeight: 1.7 }}>
                              <AssistantMessage text={msg.text} />
                            </div>
                          ) : isStreaming && i === messages.length - 1 ? (
                            <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '8px 0' }}>
                              {[0, 1, 2].map(j => (
                                <div key={j} style={{ width: 7, height: 7, borderRadius: '50%', background: '#94a3b8', animation: 'pulse 1.4s ease-in-out infinite', animationDelay: `${j * 0.2}s` }} />
                              ))}
                            </div>
                          ) : null}

                          {/* Calc results */}
                          {msg.calcResults?.map((cr, j) => <CalcCard key={j} result={cr} />)}

                          {/* Action row */}
                          {msg.text && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
                              {msg.model && (
                                <span style={{ fontSize: 11, color: '#cbd5e1', marginRight: 4 }}>{msg.model}</span>
                              )}
                              <button onClick={() => copyMessage(msg.text, i)}
                                style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 12, padding: '3px 6px', borderRadius: 6 }}
                                onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                                {copiedIdx === i ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                                {copiedIdx === i ? 'Copied' : 'Copy'}
                              </button>
                              {(msg as any).responseId != null && (
                                <>
                                  {feedbackGiven[(msg as any).responseId] === undefined ? (
                                    <>
                                      <button onClick={() => submitFeedback((msg as any).responseId, 1)}
                                        style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 12, padding: '3px 6px', borderRadius: 6 }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.color = '#16a34a' }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#94a3b8' }}>
                                        <ThumbsUp size={13} /> Good
                                      </button>
                                      <button onClick={() => submitFeedback((msg as any).responseId, -1)}
                                        style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 12, padding: '3px 6px', borderRadius: 6 }}
                                        onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626' }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#94a3b8' }}>
                                        <ThumbsDown size={13} /> Wrong
                                      </button>
                                    </>
                                  ) : (
                                    <span style={{ fontSize: 12, color: feedbackGiven[(msg as any).responseId] === 1 ? '#16a34a' : '#dc2626' }}>
                                      {feedbackGiven[(msg as any).responseId] === 1 ? '✓ Marked helpful' : '✗ Marked incorrect'}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* ── Input area ── */}
          <div style={{ flexShrink: 0, padding: '12px 24px 20px', background: '#fff' }}>
            <div style={{ maxWidth: 760, margin: '0 auto' }}>
              {showForm && (
                <StructuralForm
                  inputs={structuralInputs}
                  onChange={(k, v) => setStructuralInputs(s => ({ ...s, [k]: v }))}
                  question={formQuestion}
                  setQuestion={setFormQuestion}
                  onSubmit={handleFormSubmit}
                  onClose={() => setShowForm(false)}
                />
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={e => { if (e.target.files) { readFilesAsDataURL(e.target.files); e.target.value = '' } }}
              />
              <div style={{ border: '1.5px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', transition: 'border-color 0.15s' }}
                onFocusCapture={e => (e.currentTarget as HTMLElement).style.borderColor = '#94a3b8'}
                onBlurCapture={e => (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'}
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}>
                {/* Image preview strip */}
                {pendingImages.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '10px 12px 0' }}>
                    {pendingImages.map((src, idx) => (
                      <div key={idx} style={{ position: 'relative', flexShrink: 0 }}>
                        <img src={src} alt="attachment"
                          style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0', display: 'block' }} />
                        <button onClick={() => removeImage(idx)}
                          style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: '#64748b', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                          <X size={10} color="white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  onPaste={handlePaste}
                  placeholder="Ask a structural engineering question… (Shift+Enter for new line)"
                  disabled={isStreaming}
                  rows={1}
                  style={{ width: '100%', padding: '14px 16px 0', border: 'none', outline: 'none', resize: 'none', fontSize: 14, lineHeight: 1.6, fontFamily: 'inherit', background: 'transparent', color: '#0f172a', boxSizing: 'border-box' as const, minHeight: 52, maxHeight: 200, overflowY: 'auto' as const }}
                />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px 10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button onClick={() => setShowForm(s => !s)}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: showForm ? '#0f172a' : '#f8fafc', color: showForm ? '#f59e0b' : '#64748b', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 500 }}
                      onMouseEnter={e => { if (!showForm) e.currentTarget.style.background = '#f1f5f9' }}
                      onMouseLeave={e => { if (!showForm) e.currentTarget.style.background = '#f8fafc' }}>
                      <Calculator size={13} /> Structured inputs
                    </button>
                    <button onClick={() => fileInputRef.current?.click()}
                      title="Attach image"
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 8px', background: pendingImages.length > 0 ? '#f0f9ff' : '#f8fafc', color: pendingImages.length > 0 ? '#0284c7' : '#94a3b8', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#f0f9ff'; e.currentTarget.style.color = '#0284c7' }}
                      onMouseLeave={e => { e.currentTarget.style.background = pendingImages.length > 0 ? '#f0f9ff' : '#f8fafc'; e.currentTarget.style.color = pendingImages.length > 0 ? '#0284c7' : '#94a3b8' }}>
                      <Paperclip size={13} />
                      {pendingImages.length > 0 && <span>{pendingImages.length}</span>}
                    </button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: '#cbd5e1' }}>Enter to send · Shift+Enter for newline</span>
                    <button onClick={() => sendMessage()} disabled={isStreaming || (!input.trim() && pendingImages.length === 0)}
                      style={{ width: 36, height: 36, borderRadius: 9, border: 'none', background: isStreaming || (!input.trim() && pendingImages.length === 0) ? '#f1f5f9' : '#0f172a', cursor: isStreaming || (!input.trim() && pendingImages.length === 0) ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}>
                      <Send size={15} color={isStreaming || (!input.trim() && pendingImages.length === 0) ? '#cbd5e1' : 'white'} />
                    </button>
                  </div>
                </div>
              </div>
              <p style={{ fontSize: 11, color: '#cbd5e1', textAlign: 'center' as const, marginTop: 8 }}>
                AI answers must be verified against the governing code edition before use in design.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
