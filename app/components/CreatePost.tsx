'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { HelpCircle, FileText, X, Upload, Plus, BarChart2, Globe, Users, Lock, Image as ImageIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { PostType, PostCategory, PostWithProfile, PostVisibility } from '../types'
import type { User } from '@supabase/supabase-js'
import { useTranslation } from '../i18n/LanguageContext'

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
  displayName: string
  onPostCreated: (post: PostWithProfile) => void
  resharePost?: PostWithProfile | null
  onCancelReshare?: () => void
}

const IconConcrete = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="14" height="8" rx="0.5" />
    <circle cx="3.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    <circle cx="3.5" cy="9.5" r="0.8" fill="currentColor" stroke="none" />
    <circle cx="12.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    <circle cx="12.5" cy="9.5" r="0.8" fill="currentColor" stroke="none" />
    <line x1="1" y1="8" x2="15" y2="8" strokeDasharray="2 1.5" />
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
    <line x1="1" y1="6" x2="15" y2="6" /><line x1="1" y1="10" x2="15" y2="10" />
    <line x1="8" y1="1" x2="8" y2="15" strokeWidth="2" />
    <line x1="6" y1="13" x2="8" y2="15" /><line x1="10" y1="13" x2="8" y2="15" />
  </svg>
)
const IconOthers = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="6.5" />
    <path d="M8 5.5a1.5 1.5 0 0 1 0 3" />
    <circle cx="8" cy="11" r="0.7" fill="currentColor" stroke="none" />
  </svg>
)

const VISIBILITY_OPTIONS: { value: PostVisibility; icon: React.ReactNode; label: string }[] = [
  { value: 'public',  icon: <Globe size={12} />,  label: 'Public' },
  { value: 'friends', icon: <Users size={12} />,  label: 'Friends' },
  { value: 'private', icon: <Lock size={12} />,   label: 'Only me' },
]

export default function CreatePost({ user, avatarColor, displayName, onPostCreated, resharePost, onCancelReshare }: CreatePostProps) {
  const { t } = useTranslation()
  const [activeType, setActiveType] = useState<PostType>(resharePost ? 'reshare' : 'text')
  const [category, setCategory] = useState<PostCategory>('others')
  const [visibility, setVisibility] = useState<PostVisibility>('public')
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false)
  const [body, setBody] = useState('')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [pollOptions, setPollOptions] = useState<string[]>(['', ''])
  const [pollOpen, setPollOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  function applyFile(f: File) {
    if (!f.type.startsWith('image/')) return
    setMediaFile(f)
    setMediaPreview(URL.createObjectURL(f))
  }

  // Ctrl+V paste — only when no modal is open over this component
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      // modal-open class is added by useScrollLock when any modal is mounted
      if (document.body.classList.contains('modal-open')) return
      if (mediaFile) return
      const item = Array.from(e.clipboardData?.items ?? []).find(i => i.type.startsWith('image/'))
      if (!item) return
      const f = item.getAsFile()
      if (f) applyFile(f)
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [mediaFile])

  const TABS: { type: PostType; label: string; icon: React.ReactNode }[] = [
    { type: 'text',     label: t('post_tab_update'),   icon: <FileText size={13} /> },
    { type: 'question', label: t('post_tab_question'), icon: <HelpCircle size={13} /> },
  ]

  const CATEGORIES: { value: PostCategory; label: string; activeColor: string; activeBg: string; activeBorder: string; icon: React.ReactNode }[] = [
    { value: 'concrete',     label: t('nav_concrete'),     activeColor: '#374151', activeBg: '#f3f4f6', activeBorder: '#d1d5db', icon: <IconConcrete /> },
    { value: 'steel',        label: t('nav_steel'),        activeColor: '#1d4ed8', activeBg: '#eff6ff', activeBorder: '#bfdbfe', icon: <IconSteel /> },
    { value: 'composite',    label: t('nav_composite'),    activeColor: '#6d28d9', activeBg: '#f5f3ff', activeBorder: '#ddd6fe', icon: <IconComposite /> },
    { value: 'geotechnical', label: t('nav_geotechnical'), activeColor: '#065f46', activeBg: '#ecfdf5', activeBorder: '#6ee7b7', icon: <IconGeotech /> },
    { value: 'others',       label: t('nav_others'),       activeColor: '#b45309', activeBg: '#fffbeb', activeBorder: '#fde68a', icon: <IconOthers /> },
  ]

  const currentVisibility = VISIBILITY_OPTIONS.find(v => v.value === visibility)!
  const initial = displayName[0].toUpperCase()

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) applyFile(f)
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    if (!isReshare) setDragOver(true)
  }
  function onDragLeave(e: React.DragEvent) {
    // Only clear if leaving the whole drop zone
    if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) setDragOver(false)
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) applyFile(f)
  }

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
        user_id: user.id,
        post_type: finalType,
        category,
        visibility,
        body: body.trim() || null,
        media_url,
        is_question: finalType === 'question',
        poll_options: (finalType === 'question' && validOptions.length >= 2) ? validOptions : null,
        poll_open: finalType === 'question' ? pollOpen : false,
        reshared_post_id: resharePost?.id ?? null,
      })
      .select('*, profiles!posts_user_id_fkey(id, username, family_name, given_name, display_name, full_name, profession, specializations, is_verified, avatar_color, avatar_url), post_likes(user_id), post_comments(id), post_recommendations(user_id)')
      .single()

    setSubmitting(false)
    if (insertErr) { setError(insertErr.message); return }

    onPostCreated(post as PostWithProfile)
    setBody('')
    setMediaFile(null)
    setMediaPreview(null)
    setCategory('others')
    setPollOptions(['', ''])
    setPollOpen(false)
    if (onCancelReshare) onCancelReshare()
  }

  const isReshare = !!resharePost
  const validPollOptions = pollOptions.map(o => o.trim()).filter(Boolean)
  const canSubmit = isReshare ? true :
    body.trim().length > 0 || !!mediaFile ||
    (activeType === 'question' && validPollOptions.length >= 2)

  return (
    <div
      ref={dropZoneRef}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      style={{ background: '#fff', borderRadius: 14, border: `1px solid ${dragOver ? '#3b82f6' : '#e2e8f0'}`, overflow: 'hidden', boxShadow: dragOver ? '0 0 0 3px #bfdbfe' : '0 1px 3px rgba(0,0,0,0.04)', transition: 'border-color 0.15s, box-shadow 0.15s', position: 'relative' }}>

      {/* Drag overlay */}
      {dragOver && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(239,246,255,0.92)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 14, pointerEvents: 'none' }}>
          <ImageIcon size={36} color="#3b82f6" />
          <span style={{ fontSize: 15, fontWeight: 700, color: '#3b82f6' }}>Drop image here</span>
        </div>
      )}

      {/* ── Header: avatar + textarea ── */}
      <div style={{ padding: '16px 18px 10px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: AVATAR_COLORS[avatarColor ?? 0], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
          {initial}
        </div>
        <div style={{ flex: 1 }}>
          {/* Type tabs + visibility row */}
          {!isReshare && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {TABS.map(tab => (
                  <button key={tab.type} onClick={() => setActiveType(tab.type)}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 11px', borderRadius: 20, border: `1px solid ${activeType === tab.type ? '#3b82f6' : '#e2e8f0'}`, background: activeType === tab.type ? '#eff6ff' : '#f8fafc', color: activeType === tab.type ? '#3b82f6' : '#64748b', fontSize: 12, fontWeight: activeType === tab.type ? 600 : 400, cursor: 'pointer' }}>
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>
              {/* Visibility selector */}
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowVisibilityMenu(v => !v)}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                  {currentVisibility.icon}
                  {currentVisibility.label}
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 4l3 3 3-3" stroke="#94a3b8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                {showVisibilityMenu && (
                  <>
                    <div onClick={() => setShowVisibilityMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 100 }} />
                    <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 101, background: '#fff', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.14)', border: '1px solid #e2e8f0', overflow: 'hidden', minWidth: 130 }}>
                      {VISIBILITY_OPTIONS.map(opt => (
                        <button key={opt.value} onClick={() => { setVisibility(opt.value); setShowVisibilityMenu(false) }}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', border: 'none', background: visibility === opt.value ? '#eff6ff' : 'none', color: visibility === opt.value ? '#3b82f6' : '#374151', fontSize: 13, fontWeight: visibility === opt.value ? 700 : 400, cursor: 'pointer', textAlign: 'left' as const }}
                          onMouseEnter={e => { if (visibility !== opt.value) e.currentTarget.style.background = '#f8fafc' }}
                          onMouseLeave={e => { if (visibility !== opt.value) e.currentTarget.style.background = 'none' }}>
                          {opt.icon} {opt.label}
                          {visibility === opt.value && <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: 'auto' }}><path d="M2 6l3 3 5-5" stroke="#3b82f6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder={
              isReshare ? t('post_placeholder_reshare') :
              activeType === 'question' ? t('post_placeholder_question') + '\n\nTip: drag & drop or Ctrl+V to add an image' :
              t('post_placeholder_text') + '\n\nTip: drag & drop or Ctrl+V to add an image'
            }
            rows={isReshare ? 2 : 3}
            style={{ width: '100%', padding: '4px 0', border: 'none', outline: 'none', resize: 'none' as const, fontSize: 14, lineHeight: 1.6, color: '#0f172a', fontFamily: 'inherit', boxSizing: 'border-box' as const }}
          />
        </div>
      </div>

      {/* ── Image preview ── */}
      {mediaPreview && (
        <div style={{ padding: '0 18px 10px' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img src={mediaPreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: 280, borderRadius: 10, display: 'block', objectFit: 'cover' as const }} />
            <button onClick={() => { setMediaFile(null); setMediaPreview(null) }}
              style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Poll options ── */}
      {!isReshare && activeType === 'question' && (
        <div style={{ padding: '0 18px 10px', display: 'flex', flexDirection: 'column', gap: 7 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <BarChart2 size={13} color="#0d9488" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#0d9488' }}>Poll</span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>(optional)</span>
            </div>
            {/* Open / Limited toggle */}
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 20, padding: 2, gap: 2 }}>
              <button onClick={() => setPollOpen(false)}
                style={{ padding: '3px 10px', borderRadius: 18, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', background: !pollOpen ? '#fff' : 'transparent', color: !pollOpen ? '#0f172a' : '#94a3b8', boxShadow: !pollOpen ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.15s' }}>
                Limited
              </button>
              <button onClick={() => setPollOpen(true)}
                style={{ padding: '3px 10px', borderRadius: 18, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', background: pollOpen ? '#0d9488' : 'transparent', color: pollOpen ? '#fff' : '#94a3b8', boxShadow: pollOpen ? '0 1px 3px rgba(0,0,0,0.15)' : 'none', transition: 'all 0.15s' }}>
                Open
              </button>
            </div>
          </div>
          {pollOpen && (
            <div style={{ fontSize: 11, color: '#0d9488', background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 7, padding: '4px 10px' }}>
              Anyone can add new options to this poll
            </div>
          )}
          {pollOptions.map((opt, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', border: '1.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#94a3b8', flexShrink: 0 }}>{i + 1}</div>
              <input value={opt} onChange={e => setPollOptions(prev => prev.map((o, j) => j === i ? e.target.value : o))}
                placeholder={`${t('post_poll_option_placeholder')} ${i + 1}`}
                style={{ flex: 1, padding: '7px 11px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#8b5cf6')}
                onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')} />
              {pollOptions.length > 2 && (
                <button onClick={() => setPollOptions(prev => prev.filter((_, j) => j !== i))}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2, display: 'flex' }}>
                  <X size={14} />
                </button>
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

      {/* ── Reshare preview ── */}
      {isReshare && resharePost && (
        <div style={{ margin: '0 18px 10px', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', background: '#f8fafc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{t('post_reposting')}</span>
            {onCancelReshare && (
              <button onClick={onCancelReshare} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2 }}>
                <X size={13} />
              </button>
            )}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>
            {resharePost.profiles?.display_name || resharePost.profiles?.full_name || resharePost.profiles?.username}
          </div>
          {resharePost.body && (
            <p style={{ margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
              {resharePost.body}
            </p>
          )}
        </div>
      )}

      {error && (
        <div style={{ margin: '0 18px 8px', fontSize: 12, color: '#dc2626', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 7, padding: '6px 10px' }}>{error}</div>
      )}

      {/* ── Footer: image btn + topic + post btn ── */}
      <div style={{ borderTop: '1px solid #f1f5f9' }}>
        {/* Image upload button row */}
        {!isReshare && (
          <div style={{ padding: '8px 18px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={() => fileRef.current?.click()}
              title="Add image"
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, border: '1px solid #e2e8f0', background: mediaFile ? '#eff6ff' : '#f8fafc', color: mediaFile ? '#3b82f6' : '#64748b', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#3b82f6' }}
              onMouseLeave={e => { e.currentTarget.style.background = mediaFile ? '#eff6ff' : '#f8fafc'; e.currentTarget.style.color = mediaFile ? '#3b82f6' : '#64748b' }}>
              <ImageIcon size={14} /> {mediaFile ? 'Image added' : 'Add image'}
            </button>
            {!mediaFile && (
              <span style={{ fontSize: 11, color: '#94a3b8' }}>or drag & drop / Ctrl+V</span>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
          </div>
        )}

        {/* Topic picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px', flexWrap: 'wrap' as const }}>
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginRight: 2 }}>{t('post_topic')}</span>
          {CATEGORIES.map(cat => {
            const active = category === cat.value
            return (
              <button key={cat.value} onClick={() => setCategory(cat.value)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 11px', borderRadius: 10, border: `1.5px solid ${active ? cat.activeBorder : 'transparent'}`, background: active ? cat.activeBg : '#f0f2f5', color: active ? cat.activeColor : '#64748b', fontSize: 12, fontWeight: active ? 700 : 500, cursor: 'pointer' }}>
                {cat.icon}{cat.label}
              </button>
            )
          })}
        </div>

        {/* Post button row */}
        <div style={{ padding: '0 18px 14px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleSubmit} disabled={!canSubmit || submitting}
            style={{ padding: '8px 24px', borderRadius: 8, border: 'none', background: canSubmit ? '#3b82f6' : '#e2e8f0', color: canSubmit ? '#fff' : '#94a3b8', fontSize: 13, fontWeight: 700, cursor: canSubmit ? 'pointer' : 'default', transition: 'background 0.15s' }}
            onMouseEnter={e => { if (canSubmit) e.currentTarget.style.background = '#2563eb' }}
            onMouseLeave={e => { if (canSubmit) e.currentTarget.style.background = '#3b82f6' }}>
            {submitting ? t('post_btn_posting') : isReshare ? t('post_btn_repost') : t('post_btn_post')}
          </button>
        </div>
      </div>
    </div>
  )
}
