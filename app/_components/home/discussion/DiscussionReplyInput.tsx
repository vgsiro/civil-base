'use client'
import { useState } from 'react'
import { useTranslation } from '../../../i18n/LanguageContext'

interface Props {
  onSubmit: (body: string) => Promise<void>
  onCancel: () => void
}

export default function DiscussionReplyInput({ onSubmit, onCancel }: Props) {
  const { t } = useTranslation()
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setLoading(true)
    await onSubmit(body.trim())
    setBody('')
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 6, marginTop: 6, marginLeft: 36 }}>
      <input
        autoFocus
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder={t('home_discussion_reply_ph')}
        style={{
          flex: 1, padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 16,
          fontSize: 12, outline: 'none', background: '#f8fafc',
        }}
        onFocus={e => (e.currentTarget.style.borderColor = '#3b82f6')}
        onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
        onKeyDown={e => { if (e.key === 'Escape') onCancel() }}
      />
      <button type="submit" disabled={loading || !body.trim()}
        style={{
          padding: '5px 12px', borderRadius: 14, border: 'none', fontSize: 12, fontWeight: 600,
          background: body.trim() ? '#3b82f6' : '#e2e8f0',
          color: body.trim() ? '#fff' : '#94a3b8',
          cursor: body.trim() ? 'pointer' : 'default',
        }}>
        {loading ? '…' : 'Reply'}
      </button>
      <button type="button" onClick={onCancel}
        style={{ padding: '5px 10px', borderRadius: 14, border: '1px solid #e2e8f0', fontSize: 12, background: '#fff', color: '#64748b', cursor: 'pointer' }}>
        Cancel
      </button>
    </form>
  )
}
