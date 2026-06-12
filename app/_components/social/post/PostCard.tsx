'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import { Heart, MessageCircle, Share2, Link2, HelpCircle, Globe, Users, Lock, UserCircle, Image as ImageIcon, MoreHorizontal, Trash2, Pencil, BadgeCheck, AlertTriangle, X, Copy, Bookmark, Plus, Check, FolderOpen } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { createNotification } from '../../../_lib/notify'
import type { PostWithProfile, PostComment, PostVisibility, Profile } from '../../../_types'
import { Avatar, Lightbox, timeAgo, fullTime, useTimeLabels } from './PostCardHelpers'
import PostModal from './PostModal'
import { VerifyPromptModal } from './PostModal'
import EditPostModal from './EditPostModal'
import PostModalFromFeed from './PostModalFromFeed'
import SignInPromptModal from '../../shared/SignInPromptModal'
import { useTranslation } from '../../../i18n/LanguageContext'

// ── Quoted reshare ────────────────────────────────────────────────────────────
export function QuotedPost({ post, currentUserId }: { post: PostWithProfile; currentUserId?: string | null }) {
  const tl = useTimeLabels()
  const [showOriginal, setShowOriginal] = useState(false)
  const visibilityIcon = post.visibility === 'friends' ? <Users size={10} /> : post.visibility === 'private' ? <Lock size={10} /> : <Globe size={10} />
  return (
    <>
      <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', background: '#f8fafc', marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Avatar name={post.profiles?.display_name ?? post.profiles?.full_name} colorIndex={post.profiles?.avatar_color ?? 0} size={24} photoUrl={post.profiles?.avatar_url} />
          <div>
            <a href={`/u/${post.profiles?.username}`} style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#3b82f6')}
              onMouseLeave={e => (e.currentTarget.style.color = '#1e293b')}>
              {post.profiles?.display_name || post.profiles?.full_name || post.profiles?.username}
            </a>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
              <span onClick={() => setShowOriginal(true)} title={fullTime(post.created_at)}
              style={{ fontSize: 11, color: '#94a3b8', cursor: 'pointer', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}>
              {timeAgo(post.created_at, tl)}
            </span>
              <span style={{ color: '#cbd5e1' }}>·</span>
              <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center' }}>{visibilityIcon}</span>
            </div>
          </div>
        </div>
        {post.body && <p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.55, whiteSpace: 'pre-wrap' as const }}>{post.body}</p>}
        {post.media_url && (
          <img src={post.media_url} alt="" onClick={() => setShowOriginal(true)}
            style={{ marginTop: 8, width: '100%', borderRadius: 8, display: 'block', cursor: 'pointer' }} />
        )}
        {post.linked_title && post.linked_url && (
          <a href={post.linked_url} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '6px 10px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 7, textDecoration: 'none', fontSize: 12, color: '#3b82f6' }}>
            <Link2 size={12} /> {post.linked_title}
          </a>
        )}
      </div>
      {showOriginal && (
        <PostModalFromFeed postId={post.id} currentUserId={currentUserId ?? ''} onClose={() => setShowOriginal(false)} />
      )}
    </>
  )
}

// ── ShareModal ────────────────────────────────────────────────────────────────
const AVATAR_COLORS_SHARE = [
  'linear-gradient(135deg, #3b82f6, #8b5cf6)',
  'linear-gradient(135deg, #10b981, #3b82f6)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #ec4899, #8b5cf6)',
  'linear-gradient(135deg, #06b6d4, #10b981)',
  'linear-gradient(135deg, #f97316, #f59e0b)',
]
const SHARE_VISIBILITY: { value: PostVisibility; icon: React.ReactNode; label: string }[] = [
  { value: 'public',  icon: <Globe size={12} />,  label: 'Public' },
  { value: 'friends', icon: <Users size={12} />,  label: 'Friends' },
  { value: 'private', icon: <Lock size={12} />,   label: 'Only me' },
]
function ShareModal({ post, currentUser, currentProfile, onClose, onShared }: {
  post: PostWithProfile
  currentUser: { id: string } | null | undefined
  currentProfile: Profile | null | undefined
  onClose: () => void
  onShared: (newPost: PostWithProfile) => void
}) {
  const { t } = useTranslation()
  const tl = useTimeLabels()
  const [body, setBody] = useState('')
  const [visibility, setVisibility] = useState<PostVisibility>('public')
  const [showVisMenu, setShowVisMenu] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [showSave, setShowSave] = useState(false)
  const currentVis = SHARE_VISIBILITY.find(v => v.value === visibility) ?? SHARE_VISIBILITY[0]
  const displayName = currentProfile?.display_name || currentProfile?.full_name || currentProfile?.username || ''
  const initial = displayName.charAt(0).toUpperCase()
  const avatarColor = currentProfile?.avatar_color ?? 0

  async function handleShare() {
    if (!currentUser) return
    setSubmitting(true)
    setError('')
    const { data: newPost, error: err } = await supabase
      .from('posts')
      .insert({
        user_id: currentUser.id,
        post_type: 'reshare',
        category: 'others',
        visibility,
        body: body.trim() || null,
        reshared_post_id: post.id,
      })
      .select('*, profiles!posts_user_id_fkey(id, username, family_name, given_name, display_name, full_name, profession, specializations, is_verified, avatar_color, avatar_url), post_likes(user_id), post_comments(id), post_recommendations(user_id)')
      .single()
    if (err) { setSubmitting(false); setError(err.message); return }

    // Fetch the original post with full profile so reshared_post is fully populated
    const { data: resharedData } = await supabase
      .from('posts')
      .select('*, profiles!posts_user_id_fkey(id, username, family_name, given_name, display_name, full_name, profession, specializations, is_verified, avatar_color, avatar_url), post_likes(user_id), post_comments(id), post_recommendations(user_id)')
      .eq('id', post.id)
      .single()

    setSubmitting(false)
    const enriched: PostWithProfile = {
      ...(newPost as PostWithProfile),
      reshared_post: (resharedData as PostWithProfile) ?? post,
    }
    onShared(enriched)
    onClose()
  }

  const modal = createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 500, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>{t('action_share')}</span>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={16} color="#64748b" />
          </button>
        </div>

        {/* User row */}
        <div style={{ padding: '14px 20px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            {currentProfile?.avatar_url
              ? <img src={currentProfile.avatar_url} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
              : <div style={{ width: 40, height: 40, borderRadius: '50%', background: AVATAR_COLORS_SHARE[avatarColor % AVATAR_COLORS_SHARE.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{initial}</div>
            }
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{displayName}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, position: 'relative' }}>
                <span style={{ fontSize: 12, color: '#64748b', background: '#f1f5f9', borderRadius: 6, padding: '2px 8px' }}>Feed</span>
                <button onClick={() => setShowVisMenu(v => !v)}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#374151', background: '#f1f5f9', border: 'none', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontWeight: 500 }}>
                  {currentVis.icon} {currentVis.label}
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 4l3 3 3-3" stroke="#94a3b8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                {showVisMenu && (
                  <>
                    <div onClick={() => setShowVisMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
                    <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 52, zIndex: 11, background: '#fff', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.14)', border: '1px solid #e2e8f0', overflow: 'hidden', minWidth: 130 }}>
                      {SHARE_VISIBILITY.map(opt => (
                        <button key={opt.value} onClick={() => { setVisibility(opt.value); setShowVisMenu(false) }}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', border: 'none', background: visibility === opt.value ? '#eff6ff' : 'none', color: visibility === opt.value ? '#3b82f6' : '#374151', fontSize: 13, fontWeight: visibility === opt.value ? 700 : 400, cursor: 'pointer', textAlign: 'left' as const }}
                          onMouseEnter={e => { if (visibility !== opt.value) e.currentTarget.style.background = '#f8fafc' }}
                          onMouseLeave={e => { if (visibility !== opt.value) e.currentTarget.style.background = 'none' }}>
                          {opt.icon} {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Text input */}
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder={t('post_placeholder_reshare')}
            rows={3}
            style={{ width: '100%', border: 'none', outline: 'none', resize: 'none', fontSize: 15, color: '#0f172a', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box' }}
          />

          {/* Quoted post preview */}
          <div style={{ margin: '8px 0 16px', maxHeight: 300, overflowY: 'auto', borderRadius: 10 }}>
            <QuotedPost post={post} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {error && <div style={{ fontSize: 12, color: '#ef4444' }}>{error}</div>}
          <button onClick={handleShare} disabled={submitting}
            style={{ width: '100%', padding: '11px', borderRadius: 10, border: 'none', background: submitting ? '#93c5fd' : '#3b82f6', color: '#fff', fontSize: 15, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer' }}>
            {submitting ? '...' : t('share_now')}
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`)
                  .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
              }}
              style={{ flex: 1, padding: '9px', borderRadius: 10, border: '1px solid #e2e8f0', background: copied ? '#f0fdf4' : '#f8fafc', color: copied ? '#16a34a' : '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <Copy size={14} color={copied ? '#16a34a' : '#64748b'} />
              {copied ? t('share_copied') : t('share_copy_link')}
            </button>
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                onClick={() => navigator.share({ title: post.body ?? '', url: `${window.location.origin}/post/${post.id}` })}
                style={{ flex: 1, padding: '9px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Share2 size={14} color="#64748b" />
                {t('share_via')}
              </button>
            )}
            {currentUser && (
              <button
                onClick={() => setShowSave(true)}
                style={{ flex: 1, padding: '9px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Bookmark size={14} color="#64748b" />
                Save
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
  return (
    <>
      {modal}
      {showSave && currentUser && (
        <SaveModal postId={post.id} userId={currentUser.id} onClose={() => setShowSave(false)} />
      )}
    </>
  )
}

// ── SaveModal ─────────────────────────────────────────────────────────────────
function SaveModal({ postId, userId, onClose }: { postId: string; userId: string; onClose: () => void }) {
  const [collections, setCollections] = useState<{ id: string; name: string }[]>([])
  const [savedInIds, setSavedInIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const [colRes, savedRes] = await Promise.all([
        supabase.from('saved_collections').select('id, name').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('saved_posts').select('collection_id').eq('user_id', userId).eq('post_id', postId),
      ])
      setCollections((colRes.data ?? []) as { id: string; name: string }[])
      setSavedInIds(new Set((savedRes.data ?? []).map((r: any) => r.collection_id)))
      setLoading(false)
    }
    load()
  }, [postId, userId])

  async function createCollection() {
    const name = newName.trim()
    if (!name) return
    setCreating(false)
    const { data } = await supabase.from('saved_collections').insert({ user_id: userId, name }).select('id, name').single()
    if (data) setCollections(prev => [data as { id: string; name: string }, ...prev])
    setNewName('')
  }

  async function toggleSave(collectionId: string) {
    setSaving(collectionId)
    if (savedInIds.has(collectionId)) {
      await supabase.from('saved_posts').delete().eq('user_id', userId).eq('post_id', postId).eq('collection_id', collectionId)
      setSavedInIds(prev => { const n = new Set(prev); n.delete(collectionId); return n })
    } else {
      await supabase.from('saved_posts').insert({ user_id: userId, post_id: postId, collection_id: collectionId })
      setSavedInIds(prev => new Set([...prev, collectionId]))
    }
    setSaving(null)
  }

  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bookmark size={18} color="#3b82f6" />
            <span style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Save post</span>
          </div>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={16} color="#64748b" />
          </button>
        </div>

        {/* Collection list */}
        <div style={{ maxHeight: 320, overflowY: 'auto' }}>
          {loading && <div style={{ padding: '32px', textAlign: 'center' as const, color: '#94a3b8', fontSize: 14 }}>Loading…</div>}
          {!loading && collections.length === 0 && !creating && (
            <div style={{ padding: '32px 20px', textAlign: 'center' as const }}>
              <FolderOpen size={36} color="#d1d5db" style={{ margin: '0 auto 10px', display: 'block' }} />
              <div style={{ fontSize: 14, color: '#65676b' }}>No collections yet. Create one below.</div>
            </div>
          )}
          {collections.map(col => {
            const isSaved = savedInIds.has(col.id)
            return (
              <button key={col.id} onClick={() => toggleSave(col.id)} disabled={saving === col.id}
                style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 20px', border: 'none', background: isSaved ? '#f0f7ff' : 'none', cursor: 'pointer', textAlign: 'left' as const, transition: 'background 0.1s' }}
                onMouseEnter={e => { if (!isSaved) e.currentTarget.style.background = '#f8fafc' }}
                onMouseLeave={e => { if (!isSaved) e.currentTarget.style.background = 'none' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: isSaved ? '#dbeafe' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bookmark size={18} fill={isSaved ? '#3b82f6' : 'none'} color={isSaved ? '#3b82f6' : '#94a3b8'} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{col.name}</div>
                  {isSaved && <div style={{ fontSize: 11, color: '#3b82f6', marginTop: 1 }}>Saved ✓</div>}
                </div>
                {isSaved && <Check size={16} color="#3b82f6" />}
              </button>
            )
          })}
        </div>

        {/* Create new collection */}
        <div style={{ borderTop: '1px solid #f0f2f5', padding: '12px 20px' }}>
          {creating ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') createCollection(); if (e.key === 'Escape') { setCreating(false); setNewName('') } }}
                placeholder="Collection name…"
                style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1.5px solid #3b82f6', outline: 'none', fontSize: 14, color: '#0f172a' }}
              />
              <button onClick={createCollection} disabled={!newName.trim()}
                style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: newName.trim() ? '#3b82f6' : '#e2e8f0', color: newName.trim() ? '#fff' : '#94a3b8', fontSize: 13, fontWeight: 700, cursor: newName.trim() ? 'pointer' : 'default' }}>
                Create
              </button>
              <button onClick={() => { setCreating(false); setNewName('') }}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 13, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setCreating(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px dashed #cbd5e1', background: 'none', cursor: 'pointer', fontSize: 14, color: '#3b82f6', fontWeight: 600 }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f0f7ff'; e.currentTarget.style.borderColor = '#3b82f6' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = '#cbd5e1' }}>
              <Plus size={16} /> New collection
            </button>
          )}
        </div>

        {/* Footer link */}
        <div style={{ padding: '0 20px 14px', textAlign: 'center' as const }}>
          <a href="/saved" style={{ fontSize: 13, color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}
            onMouseEnter={e => { (e.target as HTMLAnchorElement).style.textDecoration = 'underline' }}
            onMouseLeave={e => { (e.target as HTMLAnchorElement).style.textDecoration = 'none' }}>
            View all saved →
          </a>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── PostCard ──────────────────────────────────────────────────────────────────
interface PostCardProps {
  post: PostWithProfile
  currentUserId: string | null
  currentUserIsVerified?: boolean
  currentUser?: { id: string; email?: string } | null
  currentProfile?: Profile | null
  onLikeToggle: (postId: string, wasLiked: boolean) => void
  onRecommendToggle?: (postId: string, wasRecommended: boolean) => void
  onReshare: (post: PostWithProfile) => void
  onPostShared?: (post: PostWithProfile) => void
  onDeleted?: (postId: string) => void
  onEdited?: (postId: string, body: string, visibility: PostVisibility) => void
  openModal?: boolean
  onModalClose?: () => void
  onModalOpen?: (postId: string) => void
  onView?: (postId: string, authorId: string) => void
}

export default function PostCard({ post, currentUserId, currentUserIsVerified = false, currentUser, currentProfile, onLikeToggle, onRecommendToggle, onReshare, onPostShared, onDeleted, onEdited, openModal, onModalClose, onModalOpen, onView }: PostCardProps) {
  const { t } = useTranslation()
  const tl = useTimeLabels()
  const router = useRouter()
  const VISIBILITY: Record<PostVisibility, { icon: React.ReactNode; label: string }> = {
    public:  { icon: <Globe size={11} />,  label: t('visibility_public') },
    friends: { icon: <Users size={11} />,  label: t('visibility_friends') },
    private:      { icon: <Lock size={11} />,   label: t('visibility_private') },
    admin_hidden:  { icon: <Lock size={11} color="#ef4444" />,    label: 'Admin hidden' },
    warn_limited:  { icon: <AlertTriangle size={11} color="#f59e0b" />, label: 'Limited' },
  }
  const BODY_CHAR_LIMIT = 600
  const BODY_LINE_LIMIT = 8

  const [showModal, setShowModal] = useState(openModal ?? false)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showVerifyPrompt, setShowVerifyPrompt] = useState(false)
  const [signInPromptAction, setSignInPromptAction] = useState<'like' | 'comment' | 'recommend' | 'share' | 'save' | 'vote' | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const viewFiredRef = useRef(false)
  const onViewRef = useRef(onView)
  useEffect(() => { onViewRef.current = onView }, [onView])

  // Fire onView once when ≥60% of card is visible for ≥1 second.
  // Uses a ref for the callback so re-renders never reset the observer.
  useEffect(() => {
    if (!cardRef.current) return
    let timer: ReturnType<typeof setTimeout>
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !viewFiredRef.current) {
          timer = setTimeout(() => {
            viewFiredRef.current = true
            onViewRef.current?.(post.id, post.user_id)
          }, 1000)
        } else {
          clearTimeout(timer)
        }
      },
      { threshold: 0.6 },
    )
    obs.observe(cardRef.current)
    return () => { obs.disconnect(); clearTimeout(timer) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id, post.user_id]) // intentionally omit onView — handled via ref above

  // Poll state
  const [votedOption, setVotedOption] = useState<number | null>(null)
  const [voteCounts, setVoteCounts] = useState<number[]>([])
  const [proVoteCounts, setProVoteCounts] = useState<number[]>([])
  const [pollLoading, setPollLoading] = useState(false)
  const [showAllOptions, setShowAllOptions] = useState(false)
  const [showOpinionBox, setShowOpinionBox] = useState(false)
  const [opinionDraft, setOpinionDraft] = useState('')
  const [opinionSubmitted, setOpinionSubmitted] = useState(false)
  const [opinionLoading, setOpinionLoading] = useState(false)
  const [localOptions, setLocalOptions] = useState<string[]>([])
  const hasPoll = !!(post as any).poll_options?.length
  const MAX_VISIBLE_OPTIONS = 5

  useEffect(() => {
    if (!hasPoll) return
    const options = (post as any).poll_options as string[]
    async function loadPoll() {
      const [votesRes, myVoteRes] = await Promise.all([
        supabase.from('post_votes').select('option_index, is_professional').eq('post_id', post.id),
        currentUserId
          ? supabase.from('post_votes').select('option_index').eq('post_id', post.id).eq('user_id', currentUserId).maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ])
      // Fall back to selecting without is_professional if the column doesn't exist yet
      const votes = votesRes.error
        ? ((await supabase.from('post_votes').select('option_index').eq('post_id', post.id)).data ?? [])
        : (votesRes.data ?? [])
      const myVote = myVoteRes.data
      const counts = Array(options.length).fill(0)
      const proCounts = Array(options.length).fill(0)
      ;(votes as any[]).forEach((v: any) => {
        if (v.option_index < counts.length) {
          counts[v.option_index]++
          if (v.is_professional) proCounts[v.option_index]++
        }
      })
      setVoteCounts(counts)
      setProVoteCounts(proCounts)
      if (myVote) setVotedOption((myVote as any).option_index ?? null)
    }
    loadPoll()
  }, [post.id, hasPoll, currentUserId])

  async function castVote(optionIndex: number) {
    if (!currentUserId) { setSignInPromptAction('vote'); return }
    if (votedOption !== null || pollLoading) return
    setPollLoading(true)
    const isPro = !!(currentProfile?.is_verified && currentProfile?.profession)
    let { error } = await supabase.from('post_votes').insert({ post_id: post.id, user_id: currentUserId, option_index: optionIndex, is_professional: isPro })
    // If insert failed because is_professional column doesn't exist yet, retry without it
    if (error) {
      const retry = await supabase.from('post_votes').insert({ post_id: post.id, user_id: currentUserId, option_index: optionIndex })
      error = retry.error
    }
    if (error) { setPollLoading(false); return }
    setVotedOption(optionIndex)
    setVoteCounts(prev => {
      const base = prev.length > 0 ? prev : Array((post as any).poll_options?.length ?? 0).fill(0)
      return base.map((c: number, i: number) => i === optionIndex ? c + 1 : c)
    })
    if (isPro) {
      setProVoteCounts(prev => {
        const base = prev.length > 0 ? prev : Array((post as any).poll_options?.length ?? 0).fill(0)
        return base.map((c: number, i: number) => i === optionIndex ? c + 1 : c)
      })
      // Auto-recommend when a professional votes
      if (onRecommendToggle) {
        const alreadyRecommended = post.post_recommendations.some(r => r.user_id === currentUserId)
        if (!alreadyRecommended) onRecommendToggle(post.id, false)
      }
    }
    setPollLoading(false)
  }

  async function submitOpinion() {
    if (!opinionDraft.trim() || !currentUserId || opinionLoading) return
    setOpinionLoading(true)
    const newOption = opinionDraft.trim()
    const currentOptions = (post as any).poll_options as string[] ?? []
    const updatedOptions = [...currentOptions, ...localOptions, newOption]
    const { error } = await supabase.from('posts').update({ poll_options: updatedOptions }).eq('id', post.id)
    if (!error) {
      setLocalOptions(prev => [...prev, newOption])
      setVoteCounts(prev => [...prev, 0])
      setProVoteCounts(prev => [...prev, 0])
      setOpinionSubmitted(true)
    }
    setOpinionDraft('')
    setShowOpinionBox(false)
    setOpinionLoading(false)
  }

  const liked = post.post_likes.some(l => l.user_id === currentUserId)
  const likeCount = post.post_likes.length
  const recommended = post.post_recommendations.some(r => r.user_id === currentUserId)
  const recommendCount = post.post_recommendations.length
  const commentCount = post.post_comments.length
  const isOwn = currentUserId === post.user_id
  const vis = (post.visibility as PostVisibility) ?? 'public'
  const authorName = post.profiles?.display_name || post.profiles?.full_name || post.profiles?.username || 'Unknown'
  const isPhotoPost = post.post_type === 'profile_photo' || post.post_type === 'cover_photo'

  async function deletePost() {
    setDeleting(true)
    await supabase.from('posts').delete().eq('id', post.id)
    setDeleting(false)
    setShowDeleteConfirm(false)
    onDeleted?.(post.id)
  }

  return (
    <>
      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
      {showModal && (
        <PostModal post={post} currentUserId={currentUserId} currentUserIsVerified={currentUserIsVerified} currentUser={currentUser} currentProfile={currentProfile}
          onClose={() => {
            setShowModal(false)
            onModalClose?.()
            if (window.location.pathname === `/post/${post.id}`) window.history.back()
          }}
          onLikeToggle={onLikeToggle} onRecommendToggle={onRecommendToggle ?? (() => {})} onEdited={onEdited} onDeleted={onDeleted} />
      )}
      {showVerifyPrompt && <VerifyPromptModal onClose={() => setShowVerifyPrompt(false)} currentUser={currentUser} currentProfile={currentProfile} />}
      {signInPromptAction && <SignInPromptModal action={signInPromptAction} onClose={() => setSignInPromptAction(null)} />}
      {showEdit && (
        <EditPostModal post={post} onClose={() => setShowEdit(false)}
          onSaved={(body, visibility) => { setShowEdit(false); onEdited?.(post.id, body, visibility) }} />
      )}
      {showDeleteConfirm && (
        <>
          <div onClick={() => setShowDeleteConfirm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 900 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 901, background: '#fff', borderRadius: 14, boxShadow: '0 16px 60px rgba(0,0,0,0.25)', width: 320, padding: '24px 22px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 17, fontWeight: 800 }}>{t('delete_title')}</div>
            <div style={{ fontSize: 14, color: '#65676b', lineHeight: 1.5 }}>{t('delete_body')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
              <button onClick={deletePost} disabled={deleting} style={{ width: '100%', padding: '10px 0', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                {deleting ? t('btn_deleting') : t('btn_delete')}
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} style={{ width: '100%', padding: '10px 0', borderRadius: 8, border: 'none', background: '#f0f2f5', color: '#050505', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                {t('btn_cancel')}
              </button>
            </div>
          </div>
        </>
      )}

      {/* All poll options popup */}
      {showAllOptions && hasPoll && typeof window !== 'undefined' && createPortal(
        <>
          <div onClick={() => setShowAllOptions(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9200 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 9201, background: '#fff', borderRadius: 16, boxShadow: '0 16px 60px rgba(0,0,0,0.25)', width: 420, maxWidth: '95vw', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{t('post_poll_all_options')}</span>
              <button onClick={() => setShowAllOptions(false)} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f0f2f5' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                <X size={16} color="#65676b" />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(() => {
                const options = (post as any).poll_options as string[]
                const totalVotes = voteCounts.reduce((a, b) => a + b, 0)
                const totalPro = proVoteCounts.reduce((a, b) => a + b, 0)
                const totalNormal = totalVotes - totalPro
                const hasVoted = votedOption !== null
                return options.map((opt, i) => {
                  const totalForOption = voteCounts[i] ?? 0
                  const proForOption = proVoteCounts[i] ?? 0
                  const normalForOption = totalForOption - proForOption
                  const pct = totalVotes > 0 ? Math.round(totalForOption / totalVotes * 100) : 0
                  const proPctOfTotal = totalVotes > 0 ? proForOption / totalVotes * 100 : 0
                  const normalPctOfTotal = totalVotes > 0 ? normalForOption / totalVotes * 100 : 0
                  const proPctLabel = totalVotes > 0 ? Math.round(proForOption / totalVotes * 100) : 0
                  const normalPctLabel = totalVotes > 0 ? Math.round(normalForOption / totalVotes * 100) : 0
                  const isChosen = votedOption === i
                  const hasSplit = totalPro > 0 && totalNormal > 0
                  return (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <button onClick={() => { castVote(i); setShowAllOptions(false) }} disabled={hasVoted || !currentUserId || pollLoading}
                        style={{ position: 'relative', width: '100%', padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${isChosen ? '#0d9488' : '#e2e8f0'}`, background: '#fff', cursor: hasVoted || !currentUserId ? 'default' : 'pointer', textAlign: 'left' as const, overflow: 'hidden' }}>
                        {hasVoted && hasSplit && (
                          <>
                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${proPctOfTotal}%`, background: 'rgba(13,148,136,0.22)', transition: 'width 0.5s ease' }} />
                            <div style={{ position: 'absolute', left: `${proPctOfTotal}%`, top: 0, bottom: 0, width: `${normalPctOfTotal}%`, background: 'rgba(217,119,6,0.18)', transition: 'width 0.5s ease, left 0.5s ease' }} />
                          </>
                        )}
                        {hasVoted && !hasSplit && pct > 0 && (
                          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: 'rgba(100,116,139,0.15)', borderRadius: 8, transition: 'width 0.5s ease' }} />
                        )}
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: isChosen ? 700 : 500, color: isChosen ? '#0d9488' : '#1e293b' }}>
                            {isChosen && <span style={{ marginRight: 4 }}>✓</span>}{opt}
                          </span>
                          {hasVoted && (
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', flexShrink: 0 }}>{pct}%</span>
                          )}
                        </div>
                      </button>
                      {hasVoted && hasSplit && (
                        <div style={{ display: 'flex', gap: 12, paddingLeft: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#0d9488', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0d9488', display: 'inline-block', flexShrink: 0 }} />
                            {proPctLabel}% {t('post_poll_professional_votes')}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: '#b45309', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#d97706', display: 'inline-block', flexShrink: 0 }} />
                            {normalPctLabel}% {t('post_poll_normal_votes')}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })
              })()}
            </div>
          </div>
        </>,
        document.body
      )}

      <div ref={cardRef} style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        {/* Header */}
        <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <a href={`/u/${post.profiles?.username}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
            <Avatar name={authorName} colorIndex={post.profiles?.avatar_color ?? 0} photoUrl={post.profiles?.avatar_url} />
          </a>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' as const }}>
              <a href={`/u/${post.profiles?.username}`} style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', textDecoration: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#3b82f6')}
                onMouseLeave={e => (e.currentTarget.style.color = '#0f172a')}>
                {authorName}
              </a>
              {post.profiles?.is_verified && post.profiles?.profession && (
                <span title={[post.profiles.profession, ...(post.profiles.specializations ?? [])].join(' · ')}
                  style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, color: '#0369a1', background: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: 20, padding: '1px 7px', cursor: 'default' }}>
                  <BadgeCheck size={11} /> {post.profiles.profession}
                </span>
              )}
              {post.is_question && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 700, color: '#7c3aed', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 20, padding: '1px 7px' }}>
                  <HelpCircle size={10} /> {t('post_type_question')}
                </span>
              )}
              {(post.post_type === 'profile_photo' || post.post_type === 'cover_photo') && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 600, color: '#3b82f6', background: '#eff6ff', borderRadius: 20, padding: '1px 7px' }}>
                  {post.post_type === 'profile_photo' ? <><UserCircle size={10} /> {t('post_type_profile_photo')}</> : <><ImageIcon size={10} /> {t('post_type_cover_photo')}</>}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <span onClick={() => { if (onModalOpen) { onModalOpen(post.id) } else { setShowModal(true) } }}
                title={fullTime(post.created_at, tl.dateLocale)}
                style={{ fontSize: 11, color: '#94a3b8', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}>
                {timeAgo(post.created_at, tl)}
              </span>
              <span style={{ fontSize: 10, color: '#bcc0c4' }}>·</span>
              <span title={VISIBILITY[vis].label} style={{ display: 'flex', alignItems: 'center', color: '#94a3b8' }}>{VISIBILITY[vis].icon}</span>
            </div>
          </div>
          {isOwn && (
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button onClick={() => setMenuOpen(v => !v)}
                style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: menuOpen ? '#e4e6eb' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f0f2f5' }}
                onMouseLeave={e => { e.currentTarget.style.background = menuOpen ? '#e4e6eb' : 'none' }}>
                <MoreHorizontal size={18} color="#65676b" />
              </button>
              {menuOpen && (
                <>
                  <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 50 }} />
                  <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 51, background: '#fff', borderRadius: 10, boxShadow: '0 8px 30px rgba(0,0,0,0.16)', border: '1px solid #e4e6eb', overflow: 'hidden', minWidth: 180 }}>
                    <button onClick={() => { setMenuOpen(false); setShowEdit(true) }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#050505', textAlign: 'left' as const }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#f0f2f5' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                      <Pencil size={15} color="#65676b" /> {t('post_edit')}
                    </button>
                    <button onClick={() => { setMenuOpen(false); setShowDeleteConfirm(true) }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#ef4444', textAlign: 'left' as const }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                      <Trash2 size={15} color="#ef4444" /> {t('post_delete')}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: '0 16px 12px' }}>
          {post.post_type === 'reshare' ? (
            <>
              {post.body && (() => {
                const lines = post.body.split('\n')
                const tooManyLines = lines.length > BODY_LINE_LIMIT
                const tooLong = post.body.length > BODY_CHAR_LIMIT
                const isLong = tooManyLines || tooLong
                const displayBody = isLong && !expanded
                  ? (tooManyLines ? lines.slice(0, BODY_LINE_LIMIT).join('\n') : post.body.slice(0, BODY_CHAR_LIMIT)) + '…'
                  : post.body
                return (
                  <div style={{ marginBottom: 4 }}>
                    <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap' as const }}>{displayBody}</p>
                    {isLong && (
                      <button
                        onClick={e => { e.stopPropagation(); setExpanded(v => { if (v) cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); return !v }) }}
                        style={{ marginTop: 4, fontSize: 13, fontWeight: 600, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline' }}
                        onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none' }}>
                        {expanded ? t('sidebar_see_less') : t('sidebar_see_more')}
                      </button>
                    )}
                  </div>
                )
              })()}
              {post.reshared_post && <QuotedPost post={post.reshared_post} currentUserId={currentUserId} />}
            </>
          ) : (
            <>
              {post.body && (() => {
                const lines = post.body.split('\n')
                const tooManyLines = lines.length > BODY_LINE_LIMIT
                const tooLong = post.body.length > BODY_CHAR_LIMIT
                const isLong = tooManyLines || tooLong
                const displayBody = isLong && !expanded
                  ? (tooManyLines ? lines.slice(0, BODY_LINE_LIMIT).join('\n') : post.body.slice(0, BODY_CHAR_LIMIT)) + '…'
                  : post.body
                return (
                  <div>
                    <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap' as const }}>{displayBody}</p>
                    {isLong && (
                      <button
                        onClick={e => { e.stopPropagation(); setExpanded(v => { if (v) cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); return !v }) }}
                        style={{ marginTop: 4, fontSize: 13, fontWeight: 600, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline' }}
                        onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none' }}>
                        {expanded ? t('sidebar_see_less') : t('sidebar_see_more')}
                      </button>
                    )}
                  </div>
                )
              })()}

              {/* Poll */}
              {hasPoll && (() => {
                const options = [...((post as any).poll_options as string[]), ...localOptions]
                const isPollOpen = !!(post as any).poll_open
                const totalVotes = voteCounts.reduce((a, b) => a + b, 0)
                const totalPro = proVoteCounts.reduce((a, b) => a + b, 0)
                const totalNormal = totalVotes - totalPro
                const hasVoted = votedOption !== null
                const visibleOptions = showAllOptions ? options : options.slice(0, MAX_VISIBLE_OPTIONS)
                const hasMore = options.length > MAX_VISIBLE_OPTIONS
                return (
                  <div onClick={e => e.stopPropagation()} style={{ marginTop: post.body ? 12 : 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* Caution notice before voting */}
                    {!hasVoted && currentUserId && (
                      <div style={{ fontSize: 11, color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '5px 10px' }}>
                        ⚠ {t('post_poll_caution')}
                      </div>
                    )}
                    {visibleOptions.map((opt, i) => {
                      const totalForOption = voteCounts[i] ?? 0
                      const proForOption = proVoteCounts[i] ?? 0
                      const normalForOption = totalForOption - proForOption
                      const pct = totalVotes > 0 ? Math.round(totalForOption / totalVotes * 100) : 0
                      const proPctOfTotal = totalVotes > 0 ? proForOption / totalVotes * 100 : 0
                      const normalPctOfTotal = totalVotes > 0 ? normalForOption / totalVotes * 100 : 0
                      const proPctLabel = totalVotes > 0 ? Math.round(proForOption / totalVotes * 100) : 0
                      const normalPctLabel = totalVotes > 0 ? Math.round(normalForOption / totalVotes * 100) : 0
                      const isChosen = votedOption === i
                      const hasSplit = totalPro > 0 && totalNormal > 0
                      return (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <button onClick={() => castVote(i)} disabled={hasVoted || !currentUserId || pollLoading}
                            style={{ position: 'relative', width: '100%', padding: '6px 12px', borderRadius: 8, border: `1.5px solid ${hasVoted ? '#0d9488' : '#cbd5e1'}`, background: '#fff', cursor: hasVoted || !currentUserId ? 'default' : 'pointer', textAlign: 'left' as const, overflow: 'hidden' }}>
                            {hasVoted && hasSplit && (
                              <>
                                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${proPctOfTotal}%`, background: 'rgba(13,148,136,0.15)', transition: 'width 0.4s ease' }} />
                                <div style={{ position: 'absolute', left: `${proPctOfTotal}%`, top: 0, bottom: 0, width: `${normalPctOfTotal}%`, background: 'rgba(217,119,6,0.13)', transition: 'width 0.4s ease, left 0.4s ease' }} />
                              </>
                            )}
                            {hasVoted && !hasSplit && pct > 0 && (
                              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: 'rgba(13,148,136,0.15)', borderRadius: 8, transition: 'width 0.4s ease' }} />
                            )}
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                              <span style={{ fontSize: 13, fontWeight: 600, color: hasVoted ? '#0d9488' : '#374151' }}>
                                {isChosen && <span style={{ marginRight: 4 }}>✓</span>}{opt}
                              </span>
                              {hasVoted && (
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#475569', flexShrink: 0 }}>{pct}%</span>
                              )}
                            </div>
                          </button>
                          {hasVoted && hasSplit && (
                            <div style={{ display: 'flex', gap: 12, paddingLeft: 6 }}>
                              <span style={{ fontSize: 11, fontWeight: 600, color: '#0d9488', display: 'flex', alignItems: 'center', gap: 3 }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0d9488', display: 'inline-block', flexShrink: 0 }} />
                                {proPctLabel}% {t('post_poll_professional_votes')}
                              </span>
                              <span style={{ fontSize: 11, fontWeight: 600, color: '#b45309', display: 'flex', alignItems: 'center', gap: 3 }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#d97706', display: 'inline-block', flexShrink: 0 }} />
                                {normalPctLabel}% {t('post_poll_normal_votes')}
                              </span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                    {/* See more options — opens post modal and pushes unique URL */}
                    {hasMore && (
                      <button onClick={() => {
                        window.history.pushState(null, '', `/post/${post.id}`)
                        setShowModal(true)
                      }}
                        style={{ alignSelf: 'flex-start', fontSize: 12, fontWeight: 600, color: '#0d9488', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0' }}
                        onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline' }}
                        onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none' }}>
                        + {options.length - MAX_VISIBLE_OPTIONS} {t('post_poll_see_more_options')}
                      </button>
                    )}
                    <div style={{ fontSize: 11, color: '#94a3b8', paddingLeft: 2, display: 'flex', flexWrap: 'wrap' as const, gap: 4 }}>
                      <span>{totalVotes} {t('post_poll_votes')}</span>
                      {totalPro > 0 && <span style={{ color: '#0d9488' }}>· {totalPro} {t('post_poll_professional_votes')}</span>}
                      {hasVoted && <span>· {t('post_poll_voted')}: <strong>{options[votedOption!]}</strong></span>}
                      {isPollOpen && <span style={{ color: '#0d9488' }}>· Open poll</span>}
                    </div>
                    {/* Add option — only for open polls */}
                    {isPollOpen && currentUserId && (
                      <>
                        <button onClick={() => { setShowOpinionBox(v => !v); setOpinionSubmitted(false) }}
                          style={{ alignSelf: 'flex-start', fontSize: 12, fontWeight: 600, color: '#0d9488', background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 20, padding: '4px 12px', cursor: 'pointer' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#ccfbf1' }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#f0fdfa' }}>
                          + {t('post_poll_add_opinion')}
                        </button>
                        {showOpinionBox && (
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <input value={opinionDraft} onChange={e => setOpinionDraft(e.target.value)}
                              placeholder="Add a new option…"
                              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submitOpinion() } }}
                              style={{ flex: 1, fontSize: 13, padding: '7px 11px', border: '1.5px solid #99f6e4', borderRadius: 8, outline: 'none', fontFamily: 'inherit' }}
                              onFocus={e => (e.currentTarget.style.borderColor = '#0d9488')}
                              onBlur={e => (e.currentTarget.style.borderColor = '#99f6e4')} />
                            <button onClick={submitOpinion} disabled={!opinionDraft.trim() || opinionLoading}
                              style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: opinionDraft.trim() ? '#0d9488' : '#e2e8f0', color: opinionDraft.trim() ? '#fff' : '#94a3b8', fontSize: 12, fontWeight: 600, cursor: opinionDraft.trim() ? 'pointer' : 'default', flexShrink: 0 }}>
                              Add
                            </button>
                          </div>
                        )}
                        {opinionSubmitted && (
                          <span style={{ fontSize: 11, color: '#0d9488' }}>✓ Option added!</span>
                        )}
                      </>
                    )}
                  </div>
                )
              })()}

              {post.media_url && (
                <img src={post.media_url}
                  alt={post.post_type === 'profile_photo' ? t('post_type_profile_photo') : post.post_type === 'cover_photo' ? t('post_type_cover_photo') : 'Post media'}
                  onClick={() => { if (onModalOpen) { onModalOpen(post.id) } else { setShowModal(true) } }}
                  style={{ marginTop: post.body ? 10 : 0, width: '100%', borderRadius: 10, maxHeight: post.post_type === 'cover_photo' ? 220 : 480, objectFit: 'cover' as const, display: 'block', cursor: 'pointer' }} />
              )}
              {post.linked_title && post.linked_url && (
                <a href={post.linked_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, textDecoration: 'none' }}>
                  <Link2 size={16} color="#3b82f6" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{post.linked_title}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{post.linked_url}</div>
                  </div>
                </a>
              )}
            </>
          )}
        </div>

        {/* Action bar */}
        <div style={{ borderTop: '1px solid #f1f5f9', padding: '6px 10px', display: 'flex', gap: 2 }}>
          <button onClick={() => { if (!currentUserId) { setSignInPromptAction('like'); return } onLikeToggle(post.id, liked) }}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: liked ? '#ef4444' : '#64748b', fontWeight: liked ? 600 : 400 }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
            <Heart size={15} fill={liked ? '#ef4444' : 'none'} color={liked ? '#ef4444' : '#94a3b8'} />
            {likeCount > 0 ? likeCount : ''} {t('action_like')}
          </button>
          <button onClick={() => { if (onModalOpen) { onModalOpen(post.id) } else { setShowModal(true) } }}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: '#64748b' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
            <MessageCircle size={15} color="#94a3b8" />
            {commentCount > 0 ? commentCount : ''} {t('action_comment')}
          </button>
          {!isPhotoPost && (
            <button onClick={() => { if (!currentUserId) { setSignInPromptAction('recommend'); return } if (!currentUserIsVerified) { setShowVerifyPrompt(true); return } onRecommendToggle?.(post.id, recommended) }}
              title={t('recommend_title')}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: recommended ? '#0369a1' : '#64748b', fontWeight: recommended ? 600 : 400 }}
              onMouseEnter={e => { e.currentTarget.style.background = '#e0f2fe' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
              <BadgeCheck size={15} color={recommended ? '#0369a1' : '#94a3b8'} />
              {recommendCount > 0 ? recommendCount : ''} {recommended ? t('action_recommended') : t('action_recommend')}
            </button>
          )}
          <button onClick={() => { if (!currentUserId) { setSignInPromptAction('share'); return } setShowShareModal(true) }}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: '#64748b' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
            <Share2 size={15} color="#94a3b8" /> {t('action_share')}
          </button>
          <button onClick={() => { if (!currentUserId) { setSignInPromptAction('save'); return } setShowSaveModal(true) }}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: '#64748b', marginLeft: 'auto' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f0f7ff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
            <Bookmark size={15} color="#94a3b8" />
          </button>
          {showShareModal && (
            <ShareModal post={post} currentUser={currentUser} currentProfile={currentProfile} onClose={() => setShowShareModal(false)} onShared={enriched => { onPostShared?.(enriched); setShowShareModal(false) }} />
          )}
          {showSaveModal && currentUserId && (
            <SaveModal postId={post.id} userId={currentUserId} onClose={() => setShowSaveModal(false)} />
          )}
        </div>
      </div>
    </>
  )
}
