'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import { Heart, MessageCircle, Repeat2, Link2, HelpCircle, Globe, Users, Lock, UserCircle, Image as ImageIcon, MoreHorizontal, Trash2, Pencil, BadgeCheck, AlertTriangle, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { createNotification } from '../lib/notify'
import type { PostWithProfile, PostComment, PostVisibility, Profile } from '../types'
import { Avatar, Lightbox, timeAgo, fullTime, useTimeLabels } from './PostCardHelpers'
import PostModal from './PostModal'
import { VerifyPromptModal } from './PostModal'
import EditPostModal from './EditPostModal'
import { useTranslation } from '../i18n/LanguageContext'

// ── Quoted reshare ────────────────────────────────────────────────────────────
function QuotedPost({ post }: { post: PostWithProfile }) {
  const tl = useTimeLabels()
  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', background: '#f8fafc', marginTop: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Avatar name={post.profiles?.display_name ?? post.profiles?.full_name} colorIndex={post.profiles?.avatar_color ?? 0} size={24} photoUrl={post.profiles?.avatar_url} />
        <a href={`/u/${post.profiles?.username}`} style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', textDecoration: 'none' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#3b82f6')}
          onMouseLeave={e => (e.currentTarget.style.color = '#1e293b')}>
          {post.profiles?.display_name || post.profiles?.full_name || post.profiles?.username}
        </a>
        <span style={{ fontSize: 11, color: '#94a3b8' }}>· {timeAgo(post.created_at, tl)}</span>
      </div>
      {post.body && <p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.55, whiteSpace: 'pre-wrap' as const }}>{post.body}</p>}
      {post.media_url && <img src={post.media_url} alt="" style={{ marginTop: 8, width: '100%', borderRadius: 8, maxHeight: 200, objectFit: 'cover' as const }} />}
      {post.linked_title && post.linked_url && (
        <a href={post.linked_url} target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '6px 10px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 7, textDecoration: 'none', fontSize: 12, color: '#3b82f6' }}>
          <Link2 size={12} /> {post.linked_title}
        </a>
      )}
    </div>
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
  onDeleted?: (postId: string) => void
  onEdited?: (postId: string, body: string, visibility: PostVisibility) => void
  openModal?: boolean
  onModalClose?: () => void
  onModalOpen?: (postId: string) => void
  onView?: (postId: string, authorId: string) => void
}

export default function PostCard({ post, currentUserId, currentUserIsVerified = false, currentUser, currentProfile, onLikeToggle, onRecommendToggle, onReshare, onDeleted, onEdited, openModal, onModalClose, onModalOpen, onView }: PostCardProps) {
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
  const [expanded, setExpanded] = useState(false)
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
              <span title={fullTime(post.created_at, tl.dateLocale)} style={{ fontSize: 11, color: '#94a3b8', cursor: 'default' }}>{timeAgo(post.created_at, tl)}</span>
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
              {post.reshared_post && <QuotedPost post={post.reshared_post} />}
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
                  style={{ marginTop: post.body ? 10 : 0, width: '100%', borderRadius: 10, maxHeight: post.post_type === 'cover_photo' ? 220 : 480, objectFit: 'cover' as const, display: 'block' }} />
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
          <button onClick={() => onLikeToggle(post.id, liked)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: 'none', background: 'none', cursor: currentUserId ? 'pointer' : 'default', fontSize: 13, color: liked ? '#ef4444' : '#64748b', fontWeight: liked ? 600 : 400 }}
            onMouseEnter={e => { if (currentUserId) e.currentTarget.style.background = '#fef2f2' }}
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
            <button onClick={() => { if (!currentUserId || !currentUserIsVerified) { setShowVerifyPrompt(true); return } onRecommendToggle?.(post.id, recommended) }}
              title={t('recommend_title')}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: recommended ? '#0369a1' : '#64748b', fontWeight: recommended ? 600 : 400 }}
              onMouseEnter={e => { e.currentTarget.style.background = '#e0f2fe' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
              <BadgeCheck size={15} color={recommended ? '#0369a1' : '#94a3b8'} />
              {recommendCount > 0 ? recommendCount : ''} {recommended ? t('action_recommended') : t('action_recommend')}
            </button>
          )}
          <button onClick={() => onReshare(post)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: 'none', background: 'none', cursor: currentUserId ? 'pointer' : 'default', fontSize: 13, color: '#64748b' }}
            onMouseEnter={e => { if (currentUserId) e.currentTarget.style.background = '#f0fdf4' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
            <Repeat2 size={15} color="#94a3b8" /> {t('action_repost')}
          </button>
        </div>
      </div>
    </>
  )
}
