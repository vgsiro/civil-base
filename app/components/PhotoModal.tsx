'use client'
import { useEffect, useRef, useState } from 'react'
import { useScrollLock } from '../hooks/useScrollLock'
import { X, Upload, ZoomIn, ZoomOut, Check, RotateCcw, Globe, Users, Lock, ChevronDown } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { PostVisibility } from '../types'

type Tab = 'avatar' | 'cover'

interface Props {
  user: User
  initialTab?: Tab
  currentAvatarUrl: string | null
  currentCoverUrl: string | null
  avatarColor: number
  displayName: string
  onClose: () => void
  onSaved: (updates: { avatar_url?: string; cover_url?: string }) => void
}

const AVATAR_COLORS = [
  'linear-gradient(135deg, #3b82f6, #8b5cf6)',
  'linear-gradient(135deg, #10b981, #3b82f6)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #ec4899, #8b5cf6)',
  'linear-gradient(135deg, #06b6d4, #10b981)',
  'linear-gradient(135deg, #f97316, #f59e0b)',
]

const VISIBILITY_OPTIONS: { value: PostVisibility; label: string; sub: string; icon: React.ReactNode }[] = [
  { value: 'public',  label: 'Public',   sub: 'Anyone on Civil Base',  icon: <Globe size={16} /> },
  { value: 'friends', label: 'Friends',  sub: 'People you follow',    icon: <Users size={16} /> },
  { value: 'private', label: 'Only me',  sub: 'Only visible to you',  icon: <Lock size={16} /> },
]

// Preview container dimensions
const PREV_SIZE = 300  // avatar: circle diameter
const COVER_PREV_W = 540
const COVER_PREV_H = 180  // 3:1 ratio preview
const BLEED = 80        // extra space around avatar circle so user can see uncropped area


export default function PhotoModal({
  user, initialTab = 'avatar',
  currentAvatarUrl, currentCoverUrl,
  avatarColor, displayName,
  onClose, onSaved,
}: Props) {
  useScrollLock()
  const [tab, setTab] = useState<Tab>(initialTab)
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const [naturalW, setNaturalW] = useState(0)
  const [naturalH, setNaturalH] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ mx: 0, my: 0, ox: 0, oy: 0 })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [postCaption, setPostCaption] = useState('')
  const [visibility, setVisibility] = useState<PostVisibility>('public')
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false)
  const [shareUpdate, setShareUpdate] = useState(true)

  const fileRef = useRef<HTMLInputElement>(null)
  const originalFileRef = useRef<File | null>(null)

  const isAvatar = tab === 'avatar'
  const prevW = isAvatar ? PREV_SIZE : COVER_PREV_W
  const prevH = isAvatar ? PREV_SIZE : COVER_PREV_H
  const canvasW = prevW
  const canvasH = prevH

  useEffect(() => {
    setImgSrc(null); setZoom(1); setOffset({ x: 0, y: 0 }); setMsg('')
    setPostCaption(''); setShareUpdate(true)
  }, [tab])

  function getImgStyle(): React.CSSProperties {
    if (!imgSrc || naturalW === 0) return {}
    const drawW = naturalW * zoom
    const drawH = naturalH * zoom
    if (isAvatar) {
      const cx = Math.min(0, Math.max(prevW - drawW, (prevW - drawW) / 2 + offset.x))
      const cy = Math.min(0, Math.max(prevH - drawH, (prevH - drawH) / 2 + offset.y))
      return { position: 'absolute', left: cx, top: cy, width: drawW, height: drawH, pointerEvents: 'none' }
    } else {
      const cy = Math.min(0, Math.max(prevH - drawH, (prevH - drawH) / 2 + offset.y))
      const cx = (prevW - drawW) / 2
      return { position: 'absolute', left: cx, top: cy, width: drawW, height: drawH, pointerEvents: 'none' }
    }
  }

  function initZoom(nw: number, nh: number) {
    // Must cover prevW×prevH (the circle), not the full canvas
    setZoom(Math.max(prevW / nw, prevH / nh))
    setOffset({ x: 0, y: 0 })
  }

  function loadFile(file: File) {
    originalFileRef.current = file
    const reader = new FileReader()
    reader.onload = e => {
      const src = e.target?.result as string
      const img = new Image()
      img.onload = () => {
        setNaturalW(img.naturalWidth)
        setNaturalH(img.naturalHeight)
        setImgSrc(src)
        initZoom(img.naturalWidth, img.naturalHeight)
      }
      img.src = src
    }
    reader.readAsDataURL(file)
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) loadFile(file)
    e.target.value = ''
  }

  // Minimum zoom: image must cover the crop area (prevW×prevH = circle for avatar, container for cover)
  const minZoom = naturalW > 0 ? Math.max(prevW / naturalW, prevH / naturalH) : 1

  function handleZoom(newZoom: number) {
    setZoom(Math.max(minZoom, Math.min(minZoom * 3, newZoom)))
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!imgSrc) return
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    setDragging(true)
    setDragStart({ mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y })
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging || !imgSrc) return
    const dx = e.clientX - dragStart.mx
    const dy = e.clientY - dragStart.my
    setOffset({
      x: isAvatar ? dragStart.ox + dx : 0,
      y: dragStart.oy + dy,
    })
  }

  function onPointerUp() { setDragging(false) }

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (!imgSrc) return
      const d = 6
      if (e.key === 'ArrowLeft'  && isAvatar) setOffset(o => ({ ...o, x: o.x - d }))
      if (e.key === 'ArrowRight' && isAvatar) setOffset(o => ({ ...o, x: o.x + d }))
      if (e.key === 'ArrowUp')   setOffset(o => ({ ...o, y: o.y - d }))
      if (e.key === 'ArrowDown') setOffset(o => ({ ...o, y: o.y + d }))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [imgSrc, isAvatar])

  async function save() {
    const origFile = originalFileRef.current
    if (!imgSrc || !origFile) return
    setSaving(true); setMsg('')

    const prefix = isAvatar ? 'avatar' : 'cover'
    const ts = Date.now()
    const ext = origFile.type.includes('png') ? 'png' : origFile.type.includes('webp') ? 'webp' : 'jpg'
    const path = `${user.id}/${prefix}.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from('profile-photos').upload(path, origFile, { contentType: origFile.type, upsert: true })
    if (uploadErr) { setSaving(false); setMsg('Upload failed: ' + uploadErr.message); return }

    const { data: urlData } = supabase.storage.from('profile-photos').getPublicUrl(path)
    const publicUrl = urlData.publicUrl + `?t=${ts}`

    const field = isAvatar ? 'avatar_url' : 'cover_url'
    await supabase.from('profiles').update({ [field]: publicUrl }).eq('id', user.id)

    if (shareUpdate) {
      const defaultCaption = isAvatar ? 'Updated profile photo.' : 'Updated cover photo.'
      const { error: postErr } = await supabase.from('posts').insert({
        user_id: user.id,
        post_type: isAvatar ? 'profile_photo' : 'cover_photo',
        visibility,
        body: postCaption.trim() || defaultCaption,
        media_url: publicUrl,
        is_question: false,
      })
      if (postErr) { setSaving(false); setMsg('Photo saved but post failed: ' + postErr.message); return }
    }

    setSaving(false); setMsg('Saved!')
    setTimeout(() => { onSaved({ [field]: publicUrl }); onClose() }, 800)
  }

  function tryClose() {
    if (imgSrc) setConfirmDiscard(true)
    else onClose()
  }

  const imgStyle = getImgStyle()
  const visOption = VISIBILITY_OPTIONS.find(v => v.value === visibility)!
  const hint = isAvatar
    ? 'Drag to choose which area shows as your avatar'
    : 'Drag up/down to choose which area shows as your cover'

  return (
    <>
      <div onClick={tryClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 600, backdropFilter: 'blur(2px)' }} />

      {/* Discard confirmation */}
      {confirmDiscard && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 800 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 801, background: '#fff', borderRadius: 14, boxShadow: '0 16px 60px rgba(0,0,0,0.28)', width: 340, padding: '24px 24px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 17, fontWeight: 800 }}>Discard changes?</div>
            <div style={{ fontSize: 14, color: '#65676b', lineHeight: 1.5 }}>Your photo and caption will be lost.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              <button onClick={onClose} style={{ width: '100%', padding: '10px 0', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Discard</button>
              <button onClick={() => setConfirmDiscard(false)} style={{ width: '100%', padding: '10px 0', borderRadius: 8, border: 'none', background: '#f0f2f5', color: '#050505', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Continue editing</button>
            </div>
          </div>
        </>
      )}

      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 601, background: '#fff', borderRadius: 16, boxShadow: '0 24px 80px rgba(0,0,0,0.3)', width: '92vw', maxWidth: 620, display: 'flex', flexDirection: 'column', maxHeight: '92vh', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e4e6eb', flexShrink: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#050505' }}>Edit photo</div>
          <button onClick={tryClose} style={{ width: 34, height: 34, borderRadius: '50%', background: '#f0f2f5', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={17} color="#050505" />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, padding: '8px 20px', borderBottom: '1px solid #e4e6eb', flexShrink: 0 }}>
          {(['avatar', 'cover'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '6px 16px', borderRadius: 8, border: 'none', background: tab === t ? '#e7f3ff' : 'none', color: tab === t ? '#3b82f6' : '#65676b', fontSize: 14, fontWeight: tab === t ? 700 : 500, cursor: 'pointer' }}>
              {t === 'avatar' ? 'Profile photo' : 'Cover photo'}
            </button>
          ))}
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {imgSrc && <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center' as const }}>{hint}</div>}

          {/* Preview */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {imgSrc ? (
              <div
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                style={{
                  position: 'relative',
                  width: canvasW, height: canvasH,
                  overflow: 'hidden',
                  borderRadius: isAvatar ? 12 : 10,
                  cursor: dragging ? 'grabbing' : 'grab',
                  touchAction: 'none',
                  userSelect: 'none' as const,
                  background: 'transparent',
                  boxShadow: isAvatar ? undefined : '0 0 0 3px #e4e6eb',
                }}>

                {/* Image */}
                <img src={imgSrc} style={imgStyle} alt="" draggable={false} />

                {/* Avatar overlay: dark mask with circle hole + white ring */}
                {isAvatar && (
                  <svg
                    width={canvasW} height={canvasH}
                    style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
                  >
                    <defs>
                      <mask id="av-mask">
                        <rect width={canvasW} height={canvasH} fill="white" />
                        <circle cx={canvasW / 2} cy={canvasH / 2} r={PREV_SIZE / 2} fill="black" />
                      </mask>
                    </defs>
                    {/* dim area outside circle */}
                    <rect width={canvasW} height={canvasH} fill="rgba(0,0,0,0.5)" mask="url(#av-mask)" />
                    {/* white circle border */}
                    <circle cx={canvasW / 2} cy={canvasH / 2} r={PREV_SIZE / 2}
                      fill="none" stroke="white" strokeWidth={2.5} />
                  </svg>
                )}

                {/* Hint tooltip */}
                <div style={{
                  position: 'absolute',
                  bottom: 8,
                  left: '50%', transform: 'translateX(-50%)',
                  pointerEvents: 'none', background: 'rgba(0,0,0,0.55)', borderRadius: 8,
                  padding: '4px 10px', fontSize: 11, color: '#fff', fontWeight: 600,
                  whiteSpace: 'nowrap' as const, opacity: dragging ? 0 : 0.9, transition: 'opacity 0.2s',
                }}>
                  {isAvatar ? 'Drag to reposition' : 'Drag up / down'}
                </div>
              </div>
            ) : (
              /* Placeholder */
              <div style={{ width: canvasW, height: canvasH, borderRadius: isAvatar ? '50%' : 10, border: '2px dashed #d1d5db', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#94a3b8', background: '#f8fafc', overflow: 'hidden' }}>
                {isAvatar && currentAvatarUrl
                  ? <img src={currentAvatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : !isAvatar && currentCoverUrl
                  ? <img src={currentCoverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : isAvatar
                  ? <div style={{ width: '100%', height: '100%', background: AVATAR_COLORS[avatarColor], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80, fontWeight: 900, color: '#fff' }}>
                      {(displayName || '?')[0].toUpperCase()}
                    </div>
                  : <><Upload size={28} color="#d1d5db" /><span style={{ fontSize: 13 }}>No cover photo</span></>
                }
              </div>
            )}
          </div>

          {/* Zoom slider */}
          {imgSrc && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => handleZoom(zoom - 0.05)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0 }}><ZoomOut size={18} /></button>
              <input type="range" min={minZoom} max={minZoom * 3} step={0.01} value={zoom}
                onChange={e => handleZoom(Number(e.target.value))}
                style={{ flex: 1, accentColor: '#3b82f6' }} />
              <button onClick={() => handleZoom(zoom + 0.05)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0 }}><ZoomIn size={18} /></button>
              <button onClick={() => { setZoom(minZoom); setOffset({ x: 0, y: 0 }) }} title="Reset"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, marginLeft: 2 }}><RotateCcw size={15} /></button>
            </div>
          )}

          {/* Upload button */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button onClick={() => fileRef.current?.click()}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: 8, border: '1.5px solid #3b82f6', background: imgSrc ? '#f8fafc' : '#eff6ff', color: '#3b82f6', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              <Upload size={16} /> {imgSrc ? 'Change photo' : 'Upload photo'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} style={{ display: 'none' }} />
          </div>

          {msg && (
            <div style={{ textAlign: 'center' as const, fontSize: 13, fontWeight: 600, color: msg.startsWith('Failed') || msg.startsWith('Upload') ? '#ef4444' : '#10b981' }}>{msg}</div>
          )}
        </div>

        {/* Share update section */}
        {imgSrc && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid #e4e6eb', display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setShareUpdate(v => !v)}>
              <div style={{ width: 40, height: 22, borderRadius: 11, position: 'relative', flexShrink: 0, background: shareUpdate ? '#3b82f6' : '#d1d5db', transition: 'background 0.2s' }}>
                <div style={{ position: 'absolute', top: 3, left: shareUpdate ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#050505', userSelect: 'none' as const }}>Share this update to feed</span>
            </div>

            {shareUpdate && (
              <>
                <textarea value={postCaption} onChange={e => setPostCaption(e.target.value)}
                  placeholder={isAvatar ? 'Say something about your new photo…' : 'Say something about your new cover…'}
                  rows={2}
                  style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e4e6eb', borderRadius: 10, fontSize: 14, outline: 'none', resize: 'vertical' as const, fontFamily: 'inherit', boxSizing: 'border-box' as const, lineHeight: 1.5 }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#3b82f6')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#e4e6eb')} />

                <div style={{ position: 'relative', alignSelf: 'flex-start' as const }}>
                  <button onClick={() => setShowVisibilityMenu(v => !v)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1.5px solid #e4e6eb', background: '#f8fafc', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#374151' }}>
                    {visOption.icon}{visOption.label}<ChevronDown size={14} color="#65676b" />
                  </button>
                  {showVisibilityMenu && (
                    <>
                      <div onClick={() => setShowVisibilityMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 700 }} />
                      <div style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: 0, zIndex: 701, background: '#fff', borderRadius: 10, boxShadow: '0 -4px 30px rgba(0,0,0,0.16)', border: '1px solid #e4e6eb', overflow: 'hidden', minWidth: 220 }}>
                        {VISIBILITY_OPTIONS.map(opt => (
                          <button key={opt.value} onClick={() => { setVisibility(opt.value); setShowVisibilityMenu(false) }}
                            style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '10px 14px', border: 'none', background: visibility === opt.value ? '#eff6ff' : '#fff', cursor: 'pointer', textAlign: 'left' as const }}
                            onMouseEnter={e => { if (visibility !== opt.value) e.currentTarget.style.background = '#f8fafc' }}
                            onMouseLeave={e => { if (visibility !== opt.value) e.currentTarget.style.background = '#fff' }}>
                            <div style={{ color: visibility === opt.value ? '#3b82f6' : '#64748b', display: 'flex' }}>{opt.icon}</div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: visibility === opt.value ? '#3b82f6' : '#050505' }}>{opt.label}</div>
                              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{opt.sub}</div>
                            </div>
                            {visibility === opt.value && <Check size={14} color="#3b82f6" style={{ marginLeft: 'auto' }} />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #e4e6eb', display: 'flex', justifyContent: 'flex-end', gap: 8, flexShrink: 0 }}>
          <button onClick={tryClose} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#e4e6eb', color: '#050505', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
          <button onClick={save} disabled={!imgSrc || saving}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 22px', borderRadius: 8, border: 'none', background: imgSrc && !saving ? '#3b82f6' : '#d1d5db', color: imgSrc && !saving ? '#fff' : '#9ca3af', fontSize: 14, fontWeight: 700, cursor: imgSrc && !saving ? 'pointer' : 'default' }}>
            <Check size={16} /> {saving ? 'Saving…' : 'Save photo'}
          </button>
        </div>
      </div>
    </>
  )
}
