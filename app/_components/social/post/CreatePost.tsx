'use client'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { HelpCircle, FileText, X, Upload, Plus, BarChart2, Globe, Users, Lock, Image as ImageIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { PostType, PostCategory, PostWithProfile, PostVisibility } from '../../../_types'
import type { User } from '@supabase/supabase-js'
import { useTranslation } from '../../../i18n/LanguageContext'
import { toast } from '../../shared/Toast'
import EmojiPicker from '../../shared/EmojiPicker'

const AVATAR_COLORS = [
  'linear-gradient(135deg, #3b82f6, #8b5cf6)',
  'linear-gradient(135deg, #10b981, #3b82f6)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #ec4899, #8b5cf6)',
  'linear-gradient(135deg, #06b6d4, #10b981)',
  'linear-gradient(135deg, #f97316, #f59e0b)',
]

interface CreatePostProps {
  user: User
  avatarColor: number
  avatarUrl?: string | null
  displayName: string
  onPostCreated: (post: PostWithProfile) => void
  resharePost?: PostWithProfile | null
  onCancelReshare?: () => void
}

const IconConcrete = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="12" height="10" rx="0.5" />
    <circle cx="4.5" cy="5.5" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="11.5" cy="5.5" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="4.5" cy="10.5" r="0.9" fill="currentColor" stroke="none" />
    <circle cx="11.5" cy="10.5" r="0.9" fill="currentColor" stroke="none" />
  </svg>
)
const IconSteel = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="2" x2="13" y2="2" /><line x1="3" y1="14" x2="13" y2="14" />
    <line x1="8" y1="2" x2="8" y2="14" /><line x1="3" y1="2.7" x2="3" y2="2" />
    <line x1="13" y1="2.7" x2="13" y2="2" /><line x1="3" y1="13.3" x2="3" y2="14" />
    <line x1="13" y1="13.3" x2="13" y2="14" />
  </svg>
)
const IconComposite = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="12" height="3" rx="0.4" />
    <line x1="5" y1="14" x2="11" y2="14" /><line x1="8" y1="5" x2="8" y2="14" />
    <line x1="5" y1="13.3" x2="5" y2="14" /><line x1="11" y1="13.3" x2="11" y2="14" />
  </svg>
)
const IconGeotech = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="12" height="3.5" rx="0.3" />
    <line x1="5" y1="5.5" x2="5" y2="13.5" strokeWidth="1.8" />
    <line x1="8" y1="5.5" x2="8" y2="13.5" strokeWidth="1.8" />
    <line x1="11" y1="5.5" x2="11" y2="13.5" strokeWidth="1.8" />
  </svg>
)
const IconOthers = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="4.5" cy="4.5" r="1.8" />
    <circle cx="11.5" cy="4.5" r="1.8" />
    <circle cx="4.5" cy="11.5" r="1.8" />
    <circle cx="11.5" cy="11.5" r="1.8" />
  </svg>
)

const VISIBILITY_OPTIONS: { value: PostVisibility; icon: React.ReactNode; label: string }[] = [
  { value: 'public',  icon: <Globe size={12} />,  label: 'Public' },
  { value: 'friends', icon: <Users size={12} />,  label: 'Friends' },
  { value: 'private', icon: <Lock size={12} />,   label: 'Only me' },
]

// ── Compose modal ─────────────────────────────────────────────────────────────
function ComposeModal({ user, avatarColor, avatarUrl, displayName, resharePost, onCancelReshare, onPostCreated, onClose, initialFile }: CreatePostProps & { onClose: () => void; initialFile?: File | null }) {
  const { t } = useTranslation()
  const [activeType, setActiveType] = useState<PostType>(resharePost ? 'reshare' : 'text')
  const [category, setCategory] = useState<PostCategory>('others')
  const [visibility, setVisibility] = useState<PostVisibility>('public')
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false)
  const [body, setBody] = useState('')
  const [mediaFile, setMediaFile] = useState<File | null>(initialFile ?? null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(initialFile ? URL.createObjectURL(initialFile) : null)
  const [pollOptions, setPollOptions] = useState<string[]>(['', ''])
  const [pollOpen, setPollOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const initial = displayName[0].toUpperCase()
  const isReshare = !!resharePost

  const TABS: { type: PostType; label: string; icon: React.ReactNode }[] = [
    { type: 'text',     label: t('post_tab_update'),   icon: <FileText size={11} /> },
    { type: 'question', label: t('post_tab_question'), icon: <HelpCircle size={11} /> },
  ]
  const CATEGORIES: { value: PostCategory; label: string; activeColor: string; activeBg: string; activeBorder: string; icon: React.ReactNode }[] = [
    { value: 'concrete',     label: t('nav_concrete'),     activeColor: '#374151', activeBg: '#f3f4f6', activeBorder: '#d1d5db', icon: <IconConcrete /> },
    { value: 'steel',        label: t('nav_steel'),        activeColor: '#1d4ed8', activeBg: '#eff6ff', activeBorder: '#bfdbfe', icon: <IconSteel /> },
    { value: 'composite',    label: t('nav_composite'),    activeColor: '#6d28d9', activeBg: '#f5f3ff', activeBorder: '#ddd6fe', icon: <IconComposite /> },
    { value: 'geotechnical', label: t('nav_geotechnical'), activeColor: '#065f46', activeBg: '#ecfdf5', activeBorder: '#6ee7b7', icon: <IconGeotech /> },
    { value: 'others',       label: t('nav_others'),       activeColor: '#b45309', activeBg: '#fffbeb', activeBorder: '#fde68a', icon: <IconOthers /> },
  ]
  const currentVisibility = VISIBILITY_OPTIONS.find(v => v.value === visibility)!

  function insertEmoji(emoji: string) {
    const el = textareaRef.current
    if (!el) { setBody(prev => prev + emoji); return }
    const start = el.selectionStart ?? body.length
    const end = el.selectionEnd ?? body.length
    const next = body.slice(0, start) + emoji + body.slice(end)
    setBody(next)
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(start + emoji.length, start + emoji.length) })
  }

  function applyFile(f: File) {
    if (!f.type.startsWith('image/')) return
    setMediaFile(f)
    setMediaPreview(URL.createObjectURL(f))
  }

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      if (mediaFile) return
      const item = Array.from(e.clipboardData?.items ?? []).find(i => i.type.startsWith('image/'))
      if (!item) return
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT') return
      const f = item.getAsFile()
      if (f) { e.preventDefault(); applyFile(f) }
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [mediaFile])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    // Focus textarea on open
    setTimeout(() => textareaRef.current?.focus(), 50)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  function onDragOver(e: React.DragEvent) { e.preventDefault(); if (!isReshare) setDragOver(true) }
  function onDragLeave(e: React.DragEvent) { if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) setDragOver(false) }
  function onDrop(e: React.DragEvent) { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) applyFile(f) }

  async function handleSubmit() {
    setError('')
    const finalType = resharePost ? 'reshare' : activeType
    const validOptions = pollOptions.map(o => o.trim()).filter(Boolean)
    if (!body.trim() && !mediaFile && !resharePost && !(finalType === 'question' && validOptions.length >= 2)) {
      setError(t('post_error_empty')); return
    }
    if (finalType === 'question' && validOptions.length > 0 && validOptions.length < 2) {
      setError(t('post_poll_min_options')); return
    }
    setSubmitting(true)
    let media_url: string | null = null
    if (mediaFile) {
      const path = `post-media/${user.id}/${Date.now()}-${mediaFile.name}`
      const { error: uploadErr } = await supabase.storage.from('post-media').upload(path, mediaFile)
      if (uploadErr) { setError(t('post_error_upload') + ': ' + uploadErr.message); setSubmitting(false); return }
      const { data: urlData } = supabase.storage.from('post-media').getPublicUrl(path)
      media_url = urlData.publicUrl
    }
    const { data: post, error: insertErr } = await supabase
      .from('posts')
      .insert({
        user_id: user.id, post_type: finalType, category, visibility,
        body: body.trim() || null, media_url,
        is_question: finalType === 'question',
        poll_options: (finalType === 'question' && validOptions.length >= 2) ? validOptions : null,
        poll_open: finalType === 'question' ? pollOpen : false,
        reshared_post_id: resharePost?.id ?? null,
      })
      .select('*, profiles!posts_user_id_fkey(id, username, family_name, given_name, display_name, full_name, profession, specializations, is_verified, avatar_color, avatar_url), post_likes(user_id), post_comments(id), post_recommendations(user_id)')
      .single()
    setSubmitting(false)
    if (insertErr) { setError(insertErr.message); return }
    toast('Post published', 'success')
    onPostCreated(post as PostWithProfile)
    if (onCancelReshare) onCancelReshare()
    onClose()
  }

  const validPollOptions = pollOptions.map(o => o.trim()).filter(Boolean)
  const canSubmit = isReshare ? true : body.trim().length > 0 || !!mediaFile || (activeType === 'question' && validPollOptions.length >= 2)

  return createPortal(
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, backdropFilter: 'blur(2px)' }} />

      {/* Modal */}
      <div
        ref={dropZoneRef}
        onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
        style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1001, background: dragOver ? '#eff6ff' : '#fff', borderRadius: 16, boxShadow: '0 24px 80px rgba(0,0,0,0.28)', width: '90vw', maxWidth: 540, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: dragOver ? '2px dashed #3b82f6' : '1px solid #e2e8f0', transition: 'border-color 0.15s' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '14px 20px', borderBottom: '1px solid #f1f5f9', flexShrink: 0, position: 'relative' }}>
          <span style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>{t('post_btn_post')}</span>
          <button onClick={onClose} style={{ position: 'absolute', right: 16, width: 34, height: 34, borderRadius: '50%', background: '#f0f2f5', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={16} color="#374151" />
          </button>
        </div>

        {/* Author row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px 0', flexShrink: 0 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: AVATAR_COLORS[avatarColor ?? 0], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff', flexShrink: 0, overflow: 'hidden' }}>
            {avatarUrl ? <img src={avatarUrl} alt={initial} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initial}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{displayName}</span>
            {/* Visibility selector */}
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowVisibilityMenu(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#374151', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                {currentVisibility.icon} {currentVisibility.label}
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 4l3 3 3-3" stroke="#94a3b8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              {showVisibilityMenu && (
                <>
                  <div onClick={() => setShowVisibilityMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 100 }} />
                  <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 101, background: '#fff', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.14)', border: '1px solid #e2e8f0', overflow: 'hidden', minWidth: 130 }}>
                    {VISIBILITY_OPTIONS.map(opt => (
                      <button key={opt.value} onClick={() => { setVisibility(opt.value); setShowVisibilityMenu(false) }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', border: 'none', background: visibility === opt.value ? '#eff6ff' : 'none', color: visibility === opt.value ? '#3b82f6' : '#374151', fontSize: 13, fontWeight: visibility === opt.value ? 700 : 400, cursor: 'pointer', textAlign: 'left' as const }}>
                        {opt.icon} {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          {/* Type tabs */}
          {!isReshare && (
            <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
              {TABS.map(tab => (
                <button key={tab.type} onClick={() => setActiveType(tab.type)}
                  style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 20, border: `1px solid ${activeType === tab.type ? '#3b82f6' : '#e2e8f0'}`, background: activeType === tab.type ? '#eff6ff' : '#f8fafc', color: activeType === tab.type ? '#3b82f6' : '#64748b', fontSize: 10, fontWeight: activeType === tab.type ? 600 : 400, cursor: 'pointer' }}>
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 18px' }}>
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder={isReshare ? t('post_placeholder_reshare') : activeType === 'question' ? t('post_placeholder_question') : t('post_placeholder_text')}
            style={{ width: '100%', minHeight: 120, padding: '4px 0', border: 'none', outline: 'none', resize: 'none' as const, fontSize: 15, lineHeight: 1.6, color: '#0f172a', fontFamily: 'inherit', boxSizing: 'border-box' as const }}
          />

          {/* Image preview */}
          {mediaPreview && (
            <div style={{ marginTop: 8 }}>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img src={mediaPreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 260, borderRadius: 10, display: 'block', objectFit: 'cover' as const }} />
                <button onClick={() => { setMediaFile(null); setMediaPreview(null) }}
                  style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                  <X size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Poll */}
          {!isReshare && activeType === 'question' && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 7 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <BarChart2 size={13} color="#0d9488" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0d9488' }}>Poll</span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>(optional)</span>
                </div>
                <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 20, padding: 2, gap: 2 }}>
                  <button onClick={() => setPollOpen(false)} style={{ padding: '3px 10px', borderRadius: 18, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', background: !pollOpen ? '#fff' : 'transparent', color: !pollOpen ? '#0f172a' : '#94a3b8', boxShadow: !pollOpen ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>Limited</button>
                  <button onClick={() => setPollOpen(true)} style={{ padding: '3px 10px', borderRadius: 18, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', background: pollOpen ? '#0d9488' : 'transparent', color: pollOpen ? '#fff' : '#94a3b8' }}>Open</button>
                </div>
              </div>
              {pollOptions.map((opt, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', border: '1.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#94a3b8', flexShrink: 0 }}>{i + 1}</div>
                  <input value={opt} onChange={e => setPollOptions(prev => prev.map((o, j) => j === i ? e.target.value : o))}
                    placeholder={`${t('post_poll_option_placeholder')} ${i + 1}`}
                    style={{ flex: 1, padding: '7px 11px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none' }} />
                  {pollOptions.length > 2 && (
                    <button onClick={() => setPollOptions(prev => prev.filter((_, j) => j !== i))} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2, display: 'flex' }}><X size={14} /></button>
                  )}
                </div>
              ))}
              {pollOptions.length < 6 && (
                <button onClick={() => setPollOptions(prev => [...prev, ''])}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', border: '1.5px dashed #ddd6fe', borderRadius: 8, background: 'none', color: '#8b5cf6', fontSize: 12, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' as const }}>
                  <Plus size={12} /> {t('post_poll_add_option')}
                </button>
              )}
            </div>
          )}

          {/* Reshare preview */}
          {isReshare && resharePost && (
            <div style={{ marginTop: 8, border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', background: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{t('post_reposting')}</span>
                {onCancelReshare && <button onClick={onCancelReshare} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2 }}><X size={13} /></button>}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>
                {resharePost.profiles?.display_name || resharePost.profiles?.full_name || resharePost.profiles?.username}
              </div>
              {resharePost.body && (
                <p style={{ margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>{resharePost.body}</p>
              )}
            </div>
          )}

          {error && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#dc2626', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 7, padding: '6px 10px' }}>{error}</div>
          )}
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #f1f5f9', padding: '10px 18px 14px', display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
          {/* Row 1: image + emoji (left) | post button (right) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {!isReshare && (
                <>
                  <button onClick={() => fileRef.current?.click()} title="Add image"
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, border: '1px solid #e2e8f0', background: mediaFile ? '#eff6ff' : '#f8fafc', color: mediaFile ? '#3b82f6' : '#64748b', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#3b82f6' }}
                    onMouseLeave={e => { e.currentTarget.style.background = mediaFile ? '#eff6ff' : '#f8fafc'; e.currentTarget.style.color = mediaFile ? '#3b82f6' : '#64748b' }}>
                    <ImageIcon size={14} /> {mediaFile ? 'Image added' : 'Add image'}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) applyFile(f) }} style={{ display: 'none' }} />
                  <EmojiPicker onSelect={insertEmoji} />
                </>
              )}
            </div>
            <button onClick={handleSubmit} disabled={!canSubmit || submitting}
              style={{ padding: '8px 28px', borderRadius: 8, border: 'none', background: canSubmit ? '#3b82f6' : '#e2e8f0', color: canSubmit ? '#fff' : '#94a3b8', fontSize: 13, fontWeight: 700, cursor: canSubmit ? 'pointer' : 'default', transition: 'background 0.15s' }}
              onMouseEnter={e => { if (canSubmit) e.currentTarget.style.background = '#2563eb' }}
              onMouseLeave={e => { if (canSubmit) e.currentTarget.style.background = '#3b82f6' }}>
              {submitting ? t('post_btn_posting') : isReshare ? t('post_btn_repost') : t('post_btn_post')}
            </button>
          </div>

          {/* Row 2: topic pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600, flexShrink: 0 }}>{t('post_topic')}</span>
            <select value={category} onChange={e => setCategory(e.target.value as PostCategory)}
              className="topic-select-mobile"
              style={{ display: 'none', flex: 1, padding: '5px 10px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', outline: 'none' }}>
              {[
                { value: 'concrete', label: t('nav_concrete') }, { value: 'steel', label: t('nav_steel') },
                { value: 'composite', label: t('nav_composite') }, { value: 'geotechnical', label: t('nav_geotechnical') },
                { value: 'others', label: t('nav_others') },
              ].map(cat => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
            </select>
            <div className="topic-pills-desktop" style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 }}>
              {CATEGORIES.map((cat) => {
                const active = category === cat.value
                return (
                  <button key={cat.value} onClick={() => setCategory(cat.value)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '4px 8px', borderRadius: 10, border: `1.5px solid ${active ? cat.activeBorder : 'transparent'}`, background: active ? cat.activeBg : '#f0f2f5', color: active ? cat.activeColor : '#64748b', fontSize: 11, fontWeight: active ? 700 : 500, cursor: 'pointer', flex: 1, whiteSpace: 'nowrap' as const }}>
                    {cat.icon}{cat.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

// ── Trigger card (compact, always visible in feed) ────────────────────────────
export default function CreatePost({ user, avatarColor, avatarUrl, displayName, onPostCreated, resharePost, onCancelReshare }: CreatePostProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [initialFile, setInitialFile] = useState<File | null>(null)
  const initial = displayName[0].toUpperCase()
  const triggerFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (resharePost) setOpen(true) }, [resharePost])

  // Paste image on trigger — open modal with file
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      if (open) return
      if (document.body.classList.contains('modal-open')) return
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      const item = Array.from(e.clipboardData?.items ?? []).find(i => i.type.startsWith('image/'))
      if (!item) return
      const f = item.getAsFile()
      if (f) { e.preventDefault(); setInitialFile(f); setOpen(true) }
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [open])

  return (
    <>
      {/* Compact trigger */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: AVATAR_COLORS[avatarColor ?? 0], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff', flexShrink: 0, overflow: 'hidden' }}>
            {avatarUrl ? <img src={avatarUrl} alt={initial} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initial}
          </div>
          <button onClick={() => setOpen(true)}
            style={{ flex: 1, textAlign: 'left' as const, padding: '10px 16px', borderRadius: 20, border: '1px solid #e2e8f0', background: '#f0f2f5', color: '#65676b', fontSize: 15, cursor: 'pointer', fontFamily: 'inherit' }}>
            {t('post_placeholder_text')}
          </button>
        </div>
        {/* Hidden file input for Photo/Video trigger */}
        <input ref={triggerFileRef} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => {
            const f = e.target.files?.[0]
            if (!f) return
            setInitialFile(f)
            setOpen(true)
            e.target.value = ''
          }} />
        {/* Action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, borderTop: '1px solid #f1f5f9', paddingTop: 6 }}>
          {[
            { icon: <ImageIcon size={18} color="#45bd62" />, label: t('post_tab_update') === 'Update & Discussion' ? 'Photo/Video' : 'Ảnh/Video', onClick: () => { triggerFileRef.current?.click() } },
            { icon: <HelpCircle size={18} color="#f7b928" />, label: t('post_tab_question'), onClick: () => { setOpen(true) } },
            { icon: <FileText size={18} color="#1877f2" />, label: t('post_tab_update'), onClick: () => { setOpen(true) } },
          ].map((btn, i) => (
            <button key={i} onClick={btn.onClick}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '6px 8px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: 8, color: '#65676b', fontSize: 13, fontWeight: 600 }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f0f2f5' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
              {btn.icon} {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Modal */}
      {open && (
        <ComposeModal
          user={user} avatarColor={avatarColor} avatarUrl={avatarUrl} displayName={displayName}
          resharePost={resharePost} onCancelReshare={onCancelReshare}
          onPostCreated={onPostCreated}
          initialFile={initialFile}
          onClose={() => { setOpen(false); setInitialFile(null); if (onCancelReshare && resharePost) onCancelReshare() }}
        />
      )}
    </>
  )
}
