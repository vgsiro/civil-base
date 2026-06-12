'use client'
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useScrollLock } from '../../../_hooks/useScrollLock'
import { Heart, MessageCircle, ChevronDown, Send, Globe, Users, Lock, UserCircle, Image as ImageIcon, MoreHorizontal, Trash2, Pencil, X, BadgeCheck, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { createNotification } from '../../../_lib/notify'
import type { PostWithProfile, PostComment, PostVisibility, Profile } from '../../../_types'
import VerifyModal from '../../../_components/shared/VerifyModal'
import SignInPromptModal from '../../../_components/shared/SignInPromptModal'
import EditPostModal from './EditPostModal'
import { Avatar, timeAgo, fullTime, useTimeLabels } from './PostCardHelpers'
import { QuotedPost } from './PostCard'
import { useTranslation } from '../../../i18n/LanguageContext'

// ── Comment sort dropdown ─────────────────────────────────────────────────────
function CommentSortDropdown({ value, onChange }: { value: 'relevant' | 'newest'; onChange: (v: 'relevant' | 'newest') => void }) {
  const { t } = useTranslation()
  const SORT_OPTIONS = [
    { value: 'relevant' as const, label: t('comments_sort_relevant'), desc: t('comments_sort_relevant_desc') },
    { value: 'newest'   as const, label: t('comments_sort_newest'),   desc: t('comments_sort_newest_desc') },
  ]
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const active = SORT_OPTIONS.find(o => o.value === value)!

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' as const, paddingBottom: 8, borderBottom: '1px solid #f0f2f5' }}>
      <button onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', borderRadius: 6 }}
        onMouseEnter={e => { e.currentTarget.style.background = '#f0f2f5' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#050505' }}>{t('comments_all')}</span>
        <ChevronDown size={14} color="#65676b" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
      </button>
      {open && (
        <div style={{ position: 'absolute' as const, top: 'calc(100% + 4px)', left: 0, zIndex: 200, background: '#fff', borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.18)', border: '1px solid #e4e6eb', minWidth: 280, overflow: 'hidden' }}>
          <div style={{ padding: '10px 16px 6px', fontSize: 15, fontWeight: 800, color: '#050505' }}>{t('comments_sort_label')}</div>
          {SORT_OPTIONS.map(opt => (
            <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false) }} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%', padding: '10px 16px', border: 'none', cursor: 'pointer', textAlign: 'left' as const, background: opt.value === value ? '#f0f2f5' : 'none' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f7f8fa' }}
              onMouseLeave={e => { e.currentTarget.style.background = opt.value === value ? '#f0f2f5' : 'none' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e4e6eb', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
                {opt.value === 'relevant'
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" fill="#65676b"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#65676b" strokeWidth="2"/><path d="M12 7v5l3 3" stroke="#65676b" strokeWidth="2" strokeLinecap="round"/></svg>
                }
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#050505' }}>{opt.label}</div>
                <div style={{ fontSize: 12, color: '#65676b', marginTop: 2 }}>{opt.desc}</div>
              </div>
              {opt.value === value && (
                <div style={{ marginLeft: 'auto', width: 20, height: 20, borderRadius: '50%', background: '#1877f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 8 }}>
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              )}
            </button>
          ))}
          <div style={{ height: 8 }} />
        </div>
      )}
    </div>
  )
}

// ── Verify gate modal ─────────────────────────────────────────────────────────
export function VerifyPromptModal({ onClose, currentUser, currentProfile }: {
  onClose: () => void
  currentUser?: { id: string; email?: string } | null
  currentProfile?: Profile | null
}) {
  const { t } = useTranslation()
  const [showVerify, setShowVerify] = useState(false)
  if (showVerify && currentUser && currentProfile) {
    return <VerifyModal user={currentUser} profile={currentProfile} onClose={onClose} />
  }
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9300 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 9301, background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', width: 360, padding: '28px 24px 22px', display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'center' as const }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
          <BadgeCheck size={28} color="#0369a1" />
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{t('recommend_title')}</div>
        <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>{t('recommend_info')}</div>
        <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.55, background: '#f8fafc', borderRadius: 10, padding: '10px 14px' }}>{t('recommend_cta')}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
          {currentUser && currentProfile ? (
            <button onClick={() => setShowVerify(true)} style={{ width: '100%', padding: '10px 0', borderRadius: 8, border: 'none', background: '#0369a1', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              {t('recommend_verify_btn')}
            </button>
          ) : (
            <a href="/" style={{ display: 'block', width: '100%', padding: '10px 0', borderRadius: 8, border: 'none', background: '#0369a1', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', textDecoration: 'none' }}>
              {t('recommend_sign_in_btn')}
            </a>
          )}
          <button onClick={onClose} style={{ width: '100%', padding: '10px 0', borderRadius: 8, border: 'none', background: '#f0f2f5', color: '#050505', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            {t('recommend_close')}
          </button>
        </div>
      </div>
    </>
  )
}

// ── PostModal ─────────────────────────────────────────────────────────────────
export default function PostModal({ post, currentUserId, currentUserIsVerified, currentUser, currentProfile, onClose, onLikeToggle, onRecommendToggle, onEdited, onDeleted }: {
  post: PostWithProfile
  currentUserId: string | null
  currentUserIsVerified: boolean
  currentUser?: { id: string; email?: string } | null
  currentProfile?: Profile | null
  onClose: () => void
  onLikeToggle: (postId: string, wasLiked: boolean) => void
  onRecommendToggle: (postId: string, wasRecommended: boolean) => void
  onEdited?: (id: string, body: string, visibility: PostVisibility) => void
  onDeleted?: (id: string) => void
}) {
  useScrollLock()
  const { t } = useTranslation()
  const tl = useTimeLabels()
  const VISIBILITY: Record<PostVisibility, { icon: React.ReactNode; label: string }> = {
    public:  { icon: <Globe size={11} />,  label: t('visibility_public') },
    friends: { icon: <Users size={11} />,  label: t('visibility_friends') },
    private:      { icon: <Lock size={11} />,   label: t('visibility_private') },
    admin_hidden:  { icon: <Lock size={11} color="#ef4444" />,         label: 'Admin hidden' },
    warn_limited:  { icon: <AlertTriangle size={11} color="#f59e0b" />, label: 'Limited' },
  }
  const [comments, setComments] = useState<PostComment[]>([])
  const [commentSort, setCommentSort] = useState<'relevant' | 'newest'>('relevant')
  const [commentDraft, setCommentDraft] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [currentUserProfile, setCurrentUserProfile] = useState<{ avatar_color: number; avatar_url: string | null; display_name: string | null } | null>(null)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [replyingToId, setReplyingToId] = useState<string | null>(null)
  const [replyDraft, setReplyDraft] = useState('')
  const [commentLikes, setCommentLikes] = useState<Record<string, { count: number; liked: boolean }>>({})
  const [replyLoading, setReplyLoading] = useState(false)
  const [menuOpenCommentId, setMenuOpenCommentId] = useState<string | null>(null)
  const [hoveredCommentId, setHoveredCommentId] = useState<string | null>(null)
  const [showVerifyPrompt, setShowVerifyPrompt] = useState(false)
  const [signInPromptAction, setSignInPromptAction] = useState<'like' | 'comment' | 'recommend' | 'share' | 'save' | 'vote' | null>(null)
  const [deleting, setDeleting] = useState(false)
  const commentsEndRef = useRef<HTMLDivElement>(null)

  // Poll state
  const hasPoll = !!(post as any).poll_options?.length
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
    if (!currentUserId || votedOption !== null || pollLoading) return
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
      const alreadyRecommended = post.post_recommendations.some(r => r.user_id === currentUserId)
      if (!alreadyRecommended) onRecommendToggle(post.id, false)
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

  useEffect(() => {
    if (!currentUserId) return
    supabase.from('profiles').select('avatar_color, avatar_url, display_name, full_name').eq('id', currentUserId).single()
      .then(({ data }) => { if (data) setCurrentUserProfile(data as any) })
  }, [currentUserId])

  const liked = post.post_likes.some(l => l.user_id === currentUserId)
  const likeCount = post.post_likes.length
  const recommended = post.post_recommendations.some(r => r.user_id === currentUserId)
  const recommendCount = post.post_recommendations.length
  const isOwn = currentUserId === post.user_id
  const vis = (post.visibility as PostVisibility) ?? 'public'
  const authorName = post.profiles?.display_name || post.profiles?.full_name || post.profiles?.username || 'Unknown'
  const hasImage = !!post.media_url
  const [mounted, setMounted] = useState(typeof window !== 'undefined')
  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('post_comments')
        .select('*, profiles(id, username, family_name, given_name, display_name, full_name, profession, is_verified, avatar_color, avatar_url)')
        .eq('post_id', post.id).order('created_at', { ascending: true })
      const rows = (data as any[]) ?? []
      const top = rows.filter(r => !r.parent_id)
      const replies = rows.filter(r => r.parent_id)
      const withReplies = top.map(c => ({ ...c, replies: replies.filter(r => r.parent_id === c.id) })) as PostComment[]
      setComments(withReplies)
      if (currentUserId && rows.length > 0) {
        const ids = rows.map(r => r.id)
        const { data: likes } = await supabase.from('comment_likes').select('comment_id, user_id').in('comment_id', ids)
        if (likes) {
          const map: Record<string, { count: number; liked: boolean }> = {}
          ids.forEach(id => { map[id] = { count: 0, liked: false } })
          likes.forEach((l: any) => {
            if (!map[l.comment_id]) map[l.comment_id] = { count: 0, liked: false }
            map[l.comment_id].count++
            if (l.user_id === currentUserId) map[l.comment_id].liked = true
          })
          setCommentLikes(map)
        }
      }
    }
    load()
  }, [post.id, currentUserId])

  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    const scrollY = window.scrollY
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      window.scrollTo(0, scrollY)
    }
  }, [])

  async function submitComment() {
    if (!commentDraft.trim() || !currentUserId) return
    setCommentLoading(true)
    const { data, error } = await supabase.from('post_comments')
      .insert({ post_id: post.id, user_id: currentUserId, body: commentDraft.trim() })
      .select('id, post_id, user_id, body, created_at').single()
    if (error) console.error('comment insert error:', error.message)
    if (data) {
      const { data: prof } = await supabase.from('profiles')
        .select('id, username, family_name, given_name, display_name, full_name, profession, specializations, is_verified, avatar_color, avatar_url')
        .eq('id', currentUserId).single()
      setComments(prev => [...prev, { ...data, profiles: prof } as PostComment])
      setCommentDraft('')
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      createNotification({ userId: post.user_id, actorId: currentUserId, type: 'comment', postId: post.id })
    }
    setCommentLoading(false)
  }

  async function deletePost() {
    setDeleting(true)
    await supabase.from('posts').delete().eq('id', post.id)
    setDeleting(false)
    onDeleted?.(post.id)
    onClose()
  }

  async function deleteComment(commentId: string) {
    await supabase.from('post_comments').delete().eq('id', commentId)
    setComments(prev => prev.filter(c => c.id !== commentId))
  }

  async function saveEditComment(commentId: string) {
    if (!editDraft.trim()) return
    const { error } = await supabase.from('post_comments').update({ body: editDraft.trim() }).eq('id', commentId)
    if (!error) { setComments(prev => prev.map(c => c.id === commentId ? { ...c, body: editDraft.trim() } : c)); setEditingCommentId(null) }
  }

  async function toggleCommentLike(commentId: string) {
    if (!currentUserId) return
    const cur = commentLikes[commentId] ?? { count: 0, liked: false }
    if (cur.liked) {
      await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', currentUserId)
      setCommentLikes(prev => ({ ...prev, [commentId]: { count: Math.max(0, cur.count - 1), liked: false } }))
    } else {
      await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: currentUserId })
      setCommentLikes(prev => ({ ...prev, [commentId]: { count: cur.count + 1, liked: true } }))
    }
  }

  async function submitReply(parentId: string) {
    if (!replyDraft.trim() || !currentUserId) return
    setReplyLoading(true)
    const { data, error } = await supabase.from('post_comments')
      .insert({ post_id: post.id, user_id: currentUserId, body: replyDraft.trim(), parent_id: parentId })
      .select('id, post_id, user_id, body, created_at, parent_id').single()
    if (error) console.error('reply error:', error.message)
    if (data) {
      const { data: prof } = await supabase.from('profiles')
        .select('id, username, family_name, given_name, display_name, full_name, profession, specializations, is_verified, avatar_color, avatar_url')
        .eq('id', currentUserId).single()
      const reply = { ...data, profiles: prof } as PostComment
      setComments(prev => prev.map(c => c.id === parentId ? { ...c, replies: [...(c.replies ?? []), reply] } : c))
      setReplyDraft('')
      setReplyingToId(null)
    }
    setReplyLoading(false)
  }

  if (!mounted) return null
  return createPortal(
    <div data-modal-portal="">
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.55)', zIndex: 9000 }} />
      <div onWheel={e => e.stopPropagation()} className="post-modal-shell" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 9001, display: 'flex', borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.22)', background: '#fff', width: hasImage ? '90vw' : '680px', maxWidth: hasImage ? 1100 : 680, height: '88vh', maxHeight: 860, animation: 'modalIn 0.15s ease' }}>
        <style>{`@keyframes modalIn { from { opacity: 0; transform: translate(-50%,-50%) scale(0.97) } to { opacity: 1; transform: translate(-50%,-50%) scale(1) } }`}</style>

        {hasImage && (
          <div className="post-modal-image" style={{ flex: '1 1 0', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0, overflow: 'hidden' }}>
            <img src={post.media_url!} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
          </div>
        )}

        <div className="post-modal-comments" style={{ width: hasImage ? 380 : '100%', flexShrink: 0, background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #f0f2f5', display: 'flex', alignItems: 'flex-start', gap: 10, flexShrink: 0 }}>
            <a href={`/u/${post.profiles?.username}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
              <Avatar name={authorName} colorIndex={post.profiles?.avatar_color ?? 0} photoUrl={post.profiles?.avatar_url} size={40} />
            </a>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' as const }}>
                <a href={`/u/${post.profiles?.username}`} style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#3b82f6')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#0f172a')}>
                  {authorName}
                </a>
                {post.profiles?.is_verified && post.profiles?.profession && (
                  <span title={[post.profiles.profession, ...(post.profiles.specializations ?? [])].join(' · ')} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, color: '#0369a1', background: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: 20, padding: '1px 7px', cursor: 'default' }}>
                    <BadgeCheck size={11} /> {post.profiles.profession}
                  </span>
                )}
                {(post.post_type === 'profile_photo' || post.post_type === 'cover_photo') && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 600, color: '#3b82f6', background: '#eff6ff', borderRadius: 20, padding: '1px 7px' }}>
                    {post.post_type === 'profile_photo' ? <><UserCircle size={10} /> {t('post_type_profile_photo')}</> : <><ImageIcon size={10} /> {t('post_type_cover_photo')}</>}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <span title={fullTime(post.created_at, tl.dateLocale)} style={{ fontSize: 11, color: '#94a3b8', cursor: 'default' }}>{timeAgo(post.created_at, tl)}</span>
                <span style={{ fontSize: 10, color: '#bcc0c4' }}>·</span>
                <span title={VISIBILITY[vis].label} style={{ display: 'flex', alignItems: 'center', color: '#94a3b8' }}>{VISIBILITY[vis].icon}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
              {isOwn && (
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setMenuOpen(v => !v)} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: menuOpen ? '#e4e6eb' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f0f2f5' }}
                    onMouseLeave={e => { e.currentTarget.style.background = menuOpen ? '#e4e6eb' : 'none' }}>
                    <MoreHorizontal size={17} color="#65676b" />
                  </button>
                  {menuOpen && (
                    <>
                      <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
                      <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 11, background: '#fff', borderRadius: 10, boxShadow: '0 8px 30px rgba(0,0,0,0.16)', border: '1px solid #e4e6eb', overflow: 'hidden', minWidth: 170 }}>
                        <button onClick={() => { setMenuOpen(false); setShowEdit(true) }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: '#050505', textAlign: 'left' as const }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#f0f2f5' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                          <Pencil size={14} color="#65676b" /> {t('post_edit')}
                        </button>
                        <button onClick={() => { setMenuOpen(false); setShowDeleteConfirm(true) }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: '#ef4444', textAlign: 'left' as const }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                          <Trash2 size={14} color="#ef4444" /> {t('post_delete')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
              <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f0f2f5' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                <X size={17} color="#65676b" />
              </button>
            </div>
          </div>

          <div style={{ padding: hasImage ? '12px 14px' : '20px 20px', borderBottom: hasPoll ? 'none' : '1px solid #f0f2f5', flex: 1, overflowY: 'auto', minHeight: 0 }}>
            {/* Image shown inline on mobile (left panel hidden), on desktop left panel shows it */}
            {hasImage && (
              <div className="post-modal-inline-image" style={{ display: 'none', marginBottom: post.body ? 10 : 0 }}>
                <img src={post.media_url!} alt="" style={{ width: '100%', borderRadius: 8, display: 'block', objectFit: 'contain', maxHeight: 340 }} />
              </div>
            )}
            {post.body && <p style={{ margin: 0, fontSize: hasImage ? 14 : 17, color: '#0f172a', lineHeight: 1.7, whiteSpace: 'pre-wrap' as const }}>{post.body}</p>}
            {post.reshared_post && (
              <div style={{ marginTop: post.body ? 10 : 0 }}>
                <QuotedPost post={post.reshared_post} currentUserId={currentUserId} />
              </div>
            )}
          </div>
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
              <div style={{ padding: '12px 14px', borderBottom: '1px solid #f0f2f5', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {!hasVoted && currentUserId && (
                  <div style={{ fontSize: 11, color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '5px 10px' }}>
                    ⚠ {t('post_poll_caution')}
                  </div>
                )}
                {visibleOptions.map((opt: string, i: number) => {
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
                {hasMore && !showAllOptions && (
                  <button onClick={() => setShowAllOptions(true)}
                    style={{ alignSelf: 'flex-start', fontSize: 12, fontWeight: 600, color: '#0d9488', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0' }}
                    onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline' }}
                    onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none' }}>
                    + {options.length - MAX_VISIBLE_OPTIONS} {t('post_poll_see_more_options')}
                  </button>
                )}
                {/* All options popup */}
                {showAllOptions && typeof window !== 'undefined' && createPortal(
                  <>
                    <div onClick={() => setShowAllOptions(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9500 }} />
                    <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 9501, background: '#fff', borderRadius: 16, boxShadow: '0 16px 60px rgba(0,0,0,0.25)', width: 420, maxWidth: '95vw', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{t('post_poll_all_options')}</span>
                        <button onClick={() => setShowAllOptions(false)} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#f0f2f5' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                          <X size={16} color="#65676b" />
                        </button>
                      </div>
                      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {options.map((opt: string, i: number) => {
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
                                  <span style={{ fontSize: 13, fontWeight: isChosen ? 700 : 500, color: hasVoted ? '#0d9488' : '#374151' }}>
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
                        })}
                      </div>
                    </div>
                  </>,
                  document.body
                )}
                <div style={{ fontSize: 11, color: '#94a3b8', paddingLeft: 2, display: 'flex', flexWrap: 'wrap' as const, gap: 4 }}>
                  <span>{totalVotes} {t('post_poll_votes')}</span>
                  {totalPro > 0 && <span style={{ color: '#0d9488' }}>· {totalPro} {t('post_poll_professional_votes')}</span>}
                  {hasVoted && <span>· {t('post_poll_voted')}: <strong>{options[votedOption!]}</strong></span>}
                  {isPollOpen && <span style={{ color: '#0d9488' }}>· Open poll</span>}
                </div>
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

          {(likeCount > 0 || recommendCount > 0) && (
            <div style={{ padding: '6px 14px', fontSize: 12, color: '#65676b', borderBottom: '1px solid #f0f2f5', flexShrink: 0, display: 'flex', gap: 12 }}>
              {likeCount > 0 && <span>♥ {likeCount} {likeCount === 1 ? t('count_like') : t('count_likes')}</span>}
              {recommendCount > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#0369a1' }}>
                  <BadgeCheck size={12} /> {recommendCount} {recommendCount === 1 ? t('count_recommendation') : t('count_recommendations')}
                </span>
              )}
            </div>
          )}

          <div style={{ padding: '4px 10px', borderBottom: '1px solid #f0f2f5', display: 'flex', gap: 2, flexShrink: 0 }}>
            <button onClick={() => { if (!currentUserId) { setSignInPromptAction('like'); return } onLikeToggle(post.id, liked) }}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: liked ? '#ef4444' : '#64748b', fontWeight: liked ? 700 : 400 }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
              <Heart size={16} fill={liked ? '#ef4444' : 'none'} color={liked ? '#ef4444' : '#94a3b8'} />
              {t('action_like')}
            </button>
            <button onClick={() => { if (!currentUserId) { setSignInPromptAction('comment'); return } document.getElementById(`modal-comment-input-${post.id}`)?.focus() }}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: '#64748b' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
              <MessageCircle size={16} color="#94a3b8" /> {t('action_comment')}
            </button>
            {post.post_type !== 'profile_photo' && post.post_type !== 'cover_photo' && (
              <button onClick={() => { if (!currentUserId) { setSignInPromptAction('recommend'); return } if (!currentUserIsVerified) { setShowVerifyPrompt(true); return } onRecommendToggle(post.id, recommended) }}
                title={t('recommend_title')}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: recommended ? '#0369a1' : '#64748b', fontWeight: recommended ? 700 : 400 }}
                onMouseEnter={e => { e.currentTarget.style.background = '#e0f2fe' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                <BadgeCheck size={16} color={recommended ? '#0369a1' : '#94a3b8'} />
                {recommended ? t('action_recommended') : t('action_recommend')}
              </button>
            )}
          </div>
          {showVerifyPrompt && <VerifyPromptModal onClose={() => setShowVerifyPrompt(false)} currentUser={currentUser} currentProfile={currentProfile} />}
          {signInPromptAction && <SignInPromptModal action={signInPromptAction} onClose={() => setSignInPromptAction(null)} />}

          <div style={{ flexShrink: 0, maxHeight: '22%', overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {comments.length > 1 && <CommentSortDropdown value={commentSort} onChange={setCommentSort} />}
            {comments.length === 0 && (
              <div style={{ textAlign: 'center' as const, color: '#94a3b8', fontSize: 13, padding: '20px 0' }}>{t('comments_empty')}</div>
            )}
            {[...comments]
              .sort((a, b) => commentSort === 'relevant'
                ? ((commentLikes[b.id]?.count ?? 0) - (commentLikes[a.id]?.count ?? 0)) || (new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              )
              .map(c => {
                const cLike = commentLikes[c.id] ?? { count: 0, liked: false }
                const isMyComment = c.user_id === currentUserId
                const isPostOwner = currentUserId === post.user_id
                const isEditing = editingCommentId === c.id
                const isReplying = replyingToId === c.id
                const isMenuOpen = menuOpenCommentId === c.id
                const isHovered = hoveredCommentId === c.id
                const showMenu = isMyComment || isPostOwner
                return (
                  <div key={c.id} onMouseEnter={() => setHoveredCommentId(c.id)} onMouseLeave={() => { if (!isMenuOpen) setHoveredCommentId(null) }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <a href={`/u/${c.profiles?.username}`} style={{ textDecoration: 'none', flexShrink: 0, marginTop: 2 }}>
                        <Avatar name={c.profiles?.display_name ?? c.profiles?.full_name} colorIndex={c.profiles?.avatar_color ?? 0} size={32} photoUrl={c.profiles?.avatar_url} />
                      </a>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {isEditing ? (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', background: '#f0f2f5', borderRadius: 20, padding: '0 6px 0 14px' }}>
                              <input value={editDraft} onChange={e => setEditDraft(e.target.value)} autoFocus
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEditComment(c.id) } if (e.key === 'Escape') setEditingCommentId(null) }}
                                style={{ flex: 1, padding: '9px 0', border: 'none', outline: 'none', background: 'none', fontSize: 14, color: '#0f172a' }} />
                              <button onClick={() => saveEditComment(c.id)} disabled={!editDraft.trim()} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: editDraft.trim() ? 'pointer' : 'default', flexShrink: 0 }}>
                                <Send size={16} color={editDraft.trim() ? '#3b82f6' : '#94a3b8'} />
                              </button>
                            </div>
                            <button onClick={() => setEditingCommentId(null)} style={{ marginTop: 4, paddingLeft: 4, fontSize: 12, fontWeight: 600, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>
                              {t('btn_cancel')}
                            </button>
                          </div>
                        ) : (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <div style={{ background: '#f0f2f5', borderRadius: 12, padding: `8px 12px ${cLike.count > 0 ? 16 : 8}px 12px`, display: 'inline-block', maxWidth: 'calc(100% - 36px)', position: 'relative' }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                                  {c.profiles?.display_name || c.profiles?.full_name || c.profiles?.username}
                                  {c.profiles?.is_verified && c.profiles?.profession && (
                                    <span title={[c.profiles.profession, ...(c.profiles.specializations ?? [])].join(' · ')} style={{ display: 'inline-flex', alignItems: 'center', cursor: 'default', flexShrink: 0 }}>
                                      <BadgeCheck size={13} color="#0369a1" />
                                    </span>
                                  )}
                                </div>
                                <p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{c.body}</p>
                                {cLike.count > 0 && (
                                  <div style={{ position: 'absolute', bottom: 2, right: 6, background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.15)', padding: '1px 5px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 2, border: '1px solid #e4e6eb' }}>
                                    <Heart size={10} fill="#ef4444" color="#ef4444" /> {cLike.count}
                                  </div>
                                )}
                              </div>
                              {showMenu && (
                                <div style={{ position: 'relative', flexShrink: 0 }}>
                                  <button onClick={() => setMenuOpenCommentId(isMenuOpen ? null : c.id)}
                                    style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: isMenuOpen ? '#e4e6eb' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: (isHovered || isMenuOpen) ? 1 : 0, transition: 'opacity 0.15s' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#f0f2f5' }}
                                    onMouseLeave={e => { e.currentTarget.style.background = isMenuOpen ? '#e4e6eb' : 'none' }}>
                                    <MoreHorizontal size={15} color="#65676b" />
                                  </button>
                                  {isMenuOpen && (
                                    <>
                                      <div onClick={() => { setMenuOpenCommentId(null); setHoveredCommentId(null) }} style={{ position: 'fixed', inset: 0, zIndex: 1050 }} />
                                      <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 1051, background: '#fff', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.18)', border: '1px solid #e4e6eb', overflow: 'hidden', minWidth: 160 }}>
                                        {isMyComment && (
                                          <button onClick={() => { setEditingCommentId(c.id); setEditDraft(c.body); setMenuOpenCommentId(null) }}
                                            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: '#050505', textAlign: 'left' as const }}
                                            onMouseEnter={e => { e.currentTarget.style.background = '#f0f2f5' }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                                            <Pencil size={13} color="#65676b" /> {t('comment_edit')}
                                          </button>
                                        )}
                                        {(isMyComment || isPostOwner) && (
                                          <button onClick={() => { deleteComment(c.id); setMenuOpenCommentId(null) }}
                                            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: '#ef4444', textAlign: 'left' as const }}
                                            onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2' }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                                            <Trash2 size={13} color="#ef4444" /> {t('comment_delete')}
                                          </button>
                                        )}
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, paddingLeft: 4 }}>
                              <span style={{ fontSize: 10, color: '#94a3b8' }} title={fullTime(c.created_at, tl.dateLocale)}>{timeAgo(c.created_at, tl)}</span>
                              {currentUserId && (
                                <button onClick={() => toggleCommentLike(c.id)} style={{ fontSize: 11, fontWeight: 700, color: cLike.liked ? '#ef4444' : '#65676b', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                  {cLike.liked ? t('action_liked') : t('action_like')}
                                </button>
                              )}
                              {currentUserId && (
                                <button onClick={() => { setReplyingToId(isReplying ? null : c.id); setReplyDraft('') }} style={{ fontSize: 11, fontWeight: 700, color: '#65676b', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                  {t('action_reply')}
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ paddingLeft: 40 }}>
                      {isReplying && currentUserProfile && (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6 }}>
                          <Avatar name={currentUserProfile.display_name ?? null} colorIndex={currentUserProfile.avatar_color ?? 0} photoUrl={currentUserProfile.avatar_url} size={26} />
                          <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#f0f2f5', borderRadius: 20, padding: '0 4px 0 12px' }}>
                            <input value={replyDraft} onChange={e => setReplyDraft(e.target.value)} autoFocus
                              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitReply(c.id) } if (e.key === 'Escape') setReplyingToId(null) }}
                              placeholder={`Reply to ${c.profiles?.display_name || c.profiles?.username}…`}
                              style={{ flex: 1, padding: '7px 0', border: 'none', outline: 'none', background: 'none', fontSize: 12 }} />
                            <button onClick={() => submitReply(c.id)} disabled={!replyDraft.trim() || replyLoading} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: replyDraft.trim() ? '#3b82f6' : 'none', cursor: replyDraft.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Send size={12} color={replyDraft.trim() ? '#fff' : '#94a3b8'} />
                            </button>
                          </div>
                        </div>
                      )}
                      {(c.replies ?? []).length > 0 && (
                        <div style={{ marginTop: 6, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {(c.replies ?? []).map(r => {
                            const rLike = commentLikes[r.id] ?? { count: 0, liked: false }
                            const isMyReply = r.user_id === currentUserId
                            const isReplyMenuOpen = menuOpenCommentId === r.id
                            const isReplyHovered = hoveredCommentId === r.id
                            const showReplyMenu = isMyReply || isPostOwner
                            return (
                              <div key={r.id} onMouseEnter={() => setHoveredCommentId(r.id)} onMouseLeave={() => { if (!isReplyMenuOpen) setHoveredCommentId(null) }}>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                                  <a href={`/u/${r.profiles?.username}`} style={{ textDecoration: 'none', flexShrink: 0, marginTop: 2 }}>
                                    <Avatar name={r.profiles?.display_name ?? r.profiles?.full_name} colorIndex={r.profiles?.avatar_color ?? 0} size={26} photoUrl={r.profiles?.avatar_url} />
                                  </a>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                      <div style={{ background: '#f0f2f5', borderRadius: 12, padding: `7px 11px ${rLike.count > 0 ? 16 : 7}px 11px`, display: 'inline-block', maxWidth: 'calc(100% - 32px)', position: 'relative' }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                                          {r.profiles?.display_name || r.profiles?.full_name || r.profiles?.username}
                                          {r.profiles?.is_verified && r.profiles?.profession && (
                                            <span title={[r.profiles.profession, ...(r.profiles.specializations ?? [])].join(' · ')} style={{ display: 'inline-flex', alignItems: 'center', cursor: 'default', flexShrink: 0 }}>
                                              <BadgeCheck size={12} color="#0369a1" />
                                            </span>
                                          )}
                                        </div>
                                        <p style={{ margin: 0, fontSize: 12, color: '#374151', lineHeight: 1.5 }}>{r.body}</p>
                                        {rLike.count > 0 && (
                                          <div style={{ position: 'absolute', bottom: 2, right: 6, background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.15)', padding: '1px 4px', fontSize: 10, display: 'flex', alignItems: 'center', gap: 2, border: '1px solid #e4e6eb' }}>
                                            <Heart size={9} fill="#ef4444" color="#ef4444" /> {rLike.count}
                                          </div>
                                        )}
                                      </div>
                                      {showReplyMenu && (
                                        <div style={{ position: 'relative', flexShrink: 0 }}>
                                          <button onClick={() => setMenuOpenCommentId(isReplyMenuOpen ? null : r.id)}
                                            style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', background: isReplyMenuOpen ? '#e4e6eb' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: (isReplyHovered || isReplyMenuOpen) ? 1 : 0, transition: 'opacity 0.15s' }}
                                            onMouseEnter={e => { e.currentTarget.style.background = '#f0f2f5' }}
                                            onMouseLeave={e => { e.currentTarget.style.background = isReplyMenuOpen ? '#e4e6eb' : 'none' }}>
                                            <MoreHorizontal size={13} color="#65676b" />
                                          </button>
                                          {isReplyMenuOpen && (
                                            <>
                                              <div onClick={() => { setMenuOpenCommentId(null); setHoveredCommentId(null) }} style={{ position: 'fixed', inset: 0, zIndex: 1050 }} />
                                              <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 1051, background: '#fff', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.18)', border: '1px solid #e4e6eb', overflow: 'hidden', minWidth: 150 }}>
                                                {(isMyReply || isPostOwner) && (
                                                  <button onClick={() => { supabase.from('post_comments').delete().eq('id', r.id).then(() => { setComments(prev => prev.map(cc => cc.id === c.id ? { ...cc, replies: (cc.replies ?? []).filter(x => x.id !== r.id) } : cc)) }); setMenuOpenCommentId(null) }}
                                                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: '#ef4444', textAlign: 'left' as const }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2' }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                                                    <Trash2 size={13} color="#ef4444" /> {t('comment_delete')}
                                                  </button>
                                                )}
                                              </div>
                                            </>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, paddingLeft: 3 }}>
                                      <span style={{ fontSize: 10, color: '#94a3b8' }}>{timeAgo(r.created_at, tl)}</span>
                                      {currentUserId && (
                                        <button onClick={() => toggleCommentLike(r.id)} style={{ fontSize: 11, fontWeight: 700, color: rLike.liked ? '#ef4444' : '#65676b', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                          {rLike.liked ? t('action_liked') : t('action_like')}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            <div ref={commentsEndRef} />
          </div>

          {currentUserId ? (
            <div style={{ padding: '10px 14px', borderTop: '1px solid #f0f2f5', display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
              <Avatar name={currentUserProfile?.display_name ?? null} colorIndex={currentUserProfile?.avatar_color ?? 0} photoUrl={currentUserProfile?.avatar_url} size={32} />
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#f0f2f5', borderRadius: 20, overflow: 'hidden', padding: '0 4px 0 14px' }}>
                <input id={`modal-comment-input-${post.id}`} value={commentDraft} onChange={e => setCommentDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment() } }}
                  placeholder={t('comments_write_placeholder')}
                  style={{ flex: 1, padding: '8px 0', border: 'none', outline: 'none', background: 'none', fontSize: 13 }} />
                <button onClick={submitComment} disabled={!commentDraft.trim() || commentLoading}
                  style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: commentDraft.trim() ? '#3b82f6' : 'none', cursor: commentDraft.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Send size={14} color={commentDraft.trim() ? '#fff' : '#94a3b8'} />
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: '10px 14px', borderTop: '1px solid #f0f2f5', flexShrink: 0 }}>
              <button onClick={() => setSignInPromptAction('comment')}
                style={{ width: '100%', padding: '9px 16px', borderRadius: 20, border: '1px solid #e2e8f0', background: '#f0f2f5', color: '#65676b', fontSize: 13, cursor: 'pointer', textAlign: 'left' as const }}>
                {t('guest_prompt_comment')}
              </button>
            </div>
          )}
        </div>
      </div>

      {showEdit && (
        <EditPostModal post={post} onClose={() => setShowEdit(false)}
          onSaved={(body, visibility) => { setShowEdit(false); onEdited?.(post.id, body, visibility) }} />
      )}

      {showDeleteConfirm && (
        <>
          <div onClick={() => setShowDeleteConfirm(false)} style={{ position: 'fixed', inset: 0, zIndex: 9100 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 9101, background: '#fff', borderRadius: 14, boxShadow: '0 16px 60px rgba(0,0,0,0.25)', width: 320, padding: '24px 22px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
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
    </div>,
    document.body
  )
}
