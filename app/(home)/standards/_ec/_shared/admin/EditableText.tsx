'use client'
import { useState, useRef, useEffect } from 'react'

export function EditableText({
  value,
  editMode,
  onCommit,
  multiline = false,
  style,
}: {
  value: string
  editMode: boolean
  onCommit: (next: string) => void
  multiline?: boolean
  style?: React.CSSProperties
}) {
  const [draft, setDraft] = useState(value)
  const inputRef          = useRef<HTMLInputElement & HTMLTextAreaElement>(null)

  useEffect(() => { setDraft(value) }, [value])

  function commit() {
    if (draft !== value) onCommit(draft)
  }

  if (!editMode) return <span style={style}>{value}</span>

  const inputCss: React.CSSProperties = {
    fontSize: 'inherit', fontWeight: 'inherit', color: 'inherit',
    lineHeight: 'inherit', fontFamily: 'inherit',
    border: '1px solid #c7d2fe', borderRadius: 4, outline: 'none',
    background: '#f8faff', padding: '2px 6px', width: '100%',
    resize: 'none', boxSizing: 'border-box',
    ...style,
  }

  return multiline
    ? <textarea ref={inputRef} value={draft} rows={2} style={inputCss}
        onClick={e => e.stopPropagation()}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Escape') setDraft(value) }} />
    : <input ref={inputRef} value={draft} style={inputCss}
        onClick={e => e.stopPropagation()}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') { commit(); inputRef.current?.blur() } if (e.key === 'Escape') setDraft(value) }} />
}
