'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Heart, MessageCircle, Send, Globe, Users, Lock,
  UserCircle, Image as ImageIcon, MoreHorizontal,
  Trash2, Pencil, X, BadgeCheck, ChevronDown, ArrowLeft,
  Repeat2, AlertTriangle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { createNotification } from '../../../_lib/notify'
import type { PostWithProfile, PostComment, PostVisibility, Profile } from '../../../_types'
import { Avatar, timeAgo, fullTime, useTimeLabels } from '../../../_components/social/post/PostCardHelpers'
import EditPostModal from '../../../_components/social/post/EditPostModal'
import { useTranslation } from '../../../i18n/LanguageContext'

const AVATAR_COLORS = [
  'linear-gradient(135deg, #3b82f6, #8b5cf6)',
  'linear-gradient(135deg, #10b981, #3b82f6)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #ec4899, #8b5cf6)',
  'linear-gradient(135deg, #06b6d4, #10b981)',
  'linear-gradient(135deg, #f97316, #f59e0b)',
]

export default function PostPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const { t } = useTranslation()
  const tl = useTimeLabels()

  const [post, setPost] = useState<PostWithProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null)
  const [comments, setComments] = useState<PostComment[]>([])
  const [votedOption, setVotedOption] = useState<number | null>(null)
  const [voteCounts, setVoteCounts] = useState<number[]>([])
  const [pollLoading, setPollLoading] = useState(false)
  const [commentSort, setCommentSort] = useState<'relevant' | 'newest'>('newest')
  const [commentDraft, setCommentDraft] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)
  const [commentLikes, setCommentLikes] = useState<Record<string, { count: number; liked: boolean }>>({})
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [replyingToId, setReplyingToId] = useState<string | null>(null)
  const [replyDraft, setReplyDraft] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuOpenCommentId, setMenuOpenCommentId] = useState<string | null>(null)
  const [hoveredCommentId, setHoveredCommentId] = useState<string | null>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [sortOpen, setSortOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const BODY_CHAR_LIMIT = 600
  const BODY_LINE_LIMIT = 8
  const sortRef = useRef<HTMLDivElement>(null)
  const commentsEndRef = useRef<HTMLDivElement>(null)

  const VISIBILITY: Record<PostVisibility, { icon: React.ReactNode; label: string }> = {
    public:  { icon: <Globe size={12} />,  label: t('visibility_public') },
    friends: { icon: <Users size={12} />,  label: t('visibility_friends') },
    private:      { icon: <Lock size={12} />,   label: t('visibility_private') },
    admin_hidden:  { icon: <Lock size={12} color="#ef4444" />,         label: 'Admin hidden' },
    warn_limited:  { icon: <AlertTriangle size={12} color="#f59e0b" />, label: 'Limited' },
  }

  useEffect(() => {
    async function load() {
      const [{ data: { user } }, { data: postData, error }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('posts')
          .select('*, profiles!posts_user_id_fkey(id,username,family_name,given_name,display_name,full_name,profession,specializations,is_verified,avatar_color,avatar_url), post_likes(user_id), post_comments(id), post_recommendations(user_id)')
          .eq('id', id)
          .maybeSingle(),
      ])
      if (error || !postData) { setNotFound(true); setLoading(false); return }
      // Block access to admin_hidden posts for non-authors and non-admins
      const vis = (postData as any).visibility
      const isAdminEmail = user?.email === 'tranvuong2832@gmail.com'
      if (vis === 'admin_hidden' && !isAdminEmail && (!user || user.id !== (postData as any).user_id)) {
        setNotFound(true); setLoading(false); return
      }
      setPost(postData as PostWithProfile)

      // Load poll votes
      const pollOptions = (postData as any).poll_options as string[] | null
      if (pollOptions?.length) {
        const [{ data: votes }, { data: myVote }] = await Promise.all([
          supabase.from('post_votes').select('option_index').eq('post_id', id),
          user ? supabase.from('post_votes').select('option_index').eq('post_id', id).eq('user_id', user.id).maybeSingle() : Promise.resolve({ data: null }),
        ])
        const counts = Array(pollOptions.length).fill(0)
        ;(votes ?? []).forEach((v: any) => { if (v.option_index < counts.length) counts[v.option_index]++ })
        setVoteCounts(counts)
        if (myVote) setVotedOption((myVote as any).option_index ?? null)
      }

      if (user) {
        setCurrentUserId(user.id)
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
        setCurrentProfile(prof as Profile | null)
      }

      // Load comments
      const { data: commentRows } = await supabase
        .from('post_comments')
        .select('*, profiles(id,username,family_name,given_name,display_name,full_name,profession,specializations,is_verified,avatar_color,avatar_url)')
        .eq('post_id', id).order('created_at', { ascending: true })
      const rows = (commentRows as any[]) ?? []
      const top = rows.filter(r => !r.parent_id)
      const replies = rows.filter(r => r.parent_id)
      setComments(top.map(c => ({ ...c, replies: replies.filter(r => r.parent_id === c.id) })) as PostComment[])

      if (user && rows.length > 0) {
        const { data: likes } = await supabase.from('comment_likes').select('comment_id, user_id').in('comment_id', rows.map(r => r.id))
        if (likes) {
          const map: Record<string, { count: number; liked: boolean }> = {}
          rows.forEach(r => { map[r.id] = { count: 0, liked: false } })
          likes.forEach((l: any) => {
            if (!map[l.comment_id]) map[l.comment_id] = { count: 0, liked: false }
            map[l.comment_id].count++
            if (l.user_id === user.id) map[l.comment_id].liked = true
          })
          setCommentLikes(map)
        }
      }
      setLoading(false)
    }
    load()
  }, [id])

  // Close sort dropdown on outside click
  useEffect(() => {
    function h(e: MouseEvent) { if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  async function submitComment() {
    if (!commentDraft.trim() || !currentUserId || !post) return
    setCommentLoading(true)
    const { data, error } = await supabase.from('post_comments')
      .insert({ post_id: post.id, user_id: currentUserId, body: commentDraft.trim() })
      .select('id, post_id, user_id, body, created_at').single()
    if (!error && data) {
      const { data: prof } = await supabase.from('profiles').select('id,username,family_name,given_name,display_name,full_name,profession,specializations,is_verified,avatar_color,avatar_url').eq('id', currentUserId).single()
      setComments(prev => [...prev, { ...data, profiles: prof } as PostComment])
      setCommentDraft('')
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      createNotification({ userId: post.user_id, actorId: currentUserId, type: 'comment', postId: post.id })
    }
    setCommentLoading(false)
  }

  async function castVote(optionIndex: number) {
    if (!currentUserId || votedOption !== null || pollLoading) return
    setPollLoading(true)
    await supabase.from('post_votes').insert({ post_id: id, user_id: currentUserId, option_index: optionIndex })
    setVotedOption(optionIndex)
    setVoteCounts(prev => prev.map((c, i) => i === optionIndex ? c + 1 : c))
    setPollLoading(false)
  }

  async function toggleLike() {
    if (!currentUserId || !post) return
    const liked = post.post_likes.some(l => l.user_id === currentUserId)
    if (liked) {
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', currentUserId)
      setPost(p => p ? { ...p, post_likes: p.post_likes.filter(l => l.user_id !== currentUserId) } : p)
    } else {
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: currentUserId })
      setPost(p => p ? { ...p, post_likes: [...p.post_likes, { user_id: currentUserId }] } : p)
      createNotification({ userId: post.user_id, actorId: currentUserId, type: 'like', postId: post.id })
    }
  }

  async function deletePost() {
    if (!post) return
    setDeleting(true)
    await supabase.from('posts').delete().eq('id', post.id)
    router.push('/feed')
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
    if (!replyDraft.trim() || !currentUserId || !post) return
    setReplyLoading(true)
    const { data, error } = await supabase.from('post_comments')
      .insert({ post_id: post.id, user_id: currentUserId, body: replyDraft.trim(), parent_id: parentId })
      .select('id, post_id, user_id, body, created_at, parent_id').single()
    if (!error && data) {
      const { data: prof } = await supabase.from('profiles').select('id,username,family_name,given_name,display_name,full_name,profession,specializations,is_verified,avatar_color,avatar_url').eq('id', currentUserId).single()
      setComments(prev => prev.map(c => c.id === parentId ? { ...c, replies: [...(c.replies ?? []), { ...data, profiles: prof } as PostComment] } : c))
      setReplyDraft('')
      setReplyingToId(null)
    }
    setReplyLoading(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 15, color: '#65676b' }}>Loading…</div>
    </div>
  )

  if (notFound || !post) return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div style={{ fontSize: 40 }}>🔍</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#050505' }}>Post not found</div>
      <button onClick={() => router.push('/feed')} style={{ padding: '9px 20px', borderRadius: 8, background: '#3b82f6', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
        Back to feed
      </button>
    </div>
  )

  const liked = post.post_likes.some(l => l.user_id === currentUserId)
  const likeCount = post.post_likes.length
  const recommended = post.post_recommendations.some(r => r.user_id === currentUserId)
  const recommendCount = post.post_recommendations.length
  const isOwn = currentUserId === post.user_id
  const vis = (post.visibility as PostVisibility) ?? 'public'
  const authorName = post.profiles?.display_name || post.profiles?.full_name || post.profiles?.username || 'Unknown'
  const colorIndex = post.profiles?.avatar_color ?? 0

  const sortedComments = [...comments].sort((a, b) =>
    commentSort === 'relevant'
      ? ((commentLikes[b.id]?.count ?? 0) - (commentLikes[a.id]?.count ?? 0)) || (new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {showEdit && (
        <EditPostModal post={post} onClose={() => setShowEdit(false)}
          onSaved={(body, visibility) => { setPost(p => p ? { ...p, body, visibility } : p); setShowEdit(false) }} />
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

      {/* Top bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: '#fff', borderBottom: '1px solid #e4e6eb', height: 52, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: 'none', background: 'none', color: '#65676b', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f0f2f5' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
          <ArrowLeft size={16} /> Back
        </button>
        <span style={{ fontSize: 16, fontWeight: 800, color: '#050505' }}>Post</span>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 680, margin: '24px auto', padding: '0 16px 40px' }}>
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>

          {/* Post header */}
          <div style={{ padding: '16px 18px 12px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <a href={`/u/${post.profiles?.username}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: AVATAR_COLORS[colorIndex], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#fff', overflow: 'hidden', flexShrink: 0 }}>
                {post.profiles?.avatar_url
                  ? <img src={post.profiles.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : authorName[0]?.toUpperCase()}
              </div>
            </a>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' as const }}>
                <a href={`/u/${post.profiles?.username}`} style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', textDecoration: 'none' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#3b82f6')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#0f172a')}>
                  {authorName}
                </a>
                {post.profiles?.is_verified && post.profiles?.profession && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, color: '#0369a1', background: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: 20, padding: '1px 7px' }}>
                    <BadgeCheck size={11} /> {post.profiles.profession}
                  </span>
                )}
                {post.is_question && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 20, padding: '1px 7px' }}>Question</span>
                )}
                {(post.post_type === 'profile_photo' || post.post_type === 'cover_photo') && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, color: '#3b82f6', background: '#eff6ff', borderRadius: 20, padding: '1px 7px' }}>
                    {post.post_type === 'profile_photo' ? <><UserCircle size={10} /> {t('post_type_profile_photo')}</> : <><ImageIcon size={10} /> {t('post_type_cover_photo')}</>}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                <span title={fullTime(post.created_at, tl.dateLocale)} style={{ fontSize: 12, color: '#94a3b8' }}>{timeAgo(post.created_at, tl)}</span>
                <span style={{ fontSize: 10, color: '#bcc0c4' }}>·</span>
                <span title={VISIBILITY[vis].label} style={{ display: 'flex', alignItems: 'center', color: '#94a3b8' }}>{VISIBILITY[vis].icon}</span>
              </div>
            </div>
            {isOwn && (
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <button onClick={() => setMenuOpen(v => !v)} style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: menuOpen ? '#e4e6eb' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f0f2f5' }}
                  onMouseLeave={e => { e.currentTarget.style.background = menuOpen ? '#e4e6eb' : 'none' }}>
                  <MoreHorizontal size={18} color="#65676b" />
                </button>
                {menuOpen && (
                  <>
                    <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 50 }} />
                    <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 51, background: '#fff', borderRadius: 10, boxShadow: '0 8px 30px rgba(0,0,0,0.16)', border: '1px solid #e4e6eb', overflow: 'hidden', minWidth: 170 }}>
                      <button onClick={() => { setMenuOpen(false); setShowEdit(true) }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#050505', textAlign: 'left' as const }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f0f2f5' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                        <Pencil size={15} color="#65676b" /> {t('post_edit')}
                      </button>
                      <button onClick={() => { setMenuOpen(false); setShowDeleteConfirm(true) }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 14, color: '#ef4444', textAlign: 'left' as const }}
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

          {/* Post body */}
          {post.body && (() => {
            const lines = post.body.split('\n')
            const tooManyLines = lines.length > BODY_LINE_LIMIT
            const tooLong = post.body.length > BODY_CHAR_LIMIT
            const isLong = tooManyLines || tooLong
            const displayBody = isLong && !expanded
              ? (tooManyLines ? lines.slice(0, BODY_LINE_LIMIT).join('\n') : post.body.slice(0, BODY_CHAR_LIMIT)) + '…'
              : post.body
            return (
              <div style={{ padding: '0 18px 14px' }}>
                <p style={{ margin: 0, fontSize: 16, color: '#0f172a', lineHeight: 1.7, whiteSpace: 'pre-wrap' as const }}>{displayBody}</p>
                {isLong && (
                  <button
                    onClick={() => setExpanded(v => !v)}
                    style={{ marginTop: 6, fontSize: 14, fontWeight: 600, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    onMouseEnter={e => { e.currentTarget.style.textDecoration = 'underline' }}
                    onMouseLeave={e => { e.currentTarget.style.textDecoration = 'none' }}>
                    {expanded ? t('sidebar_see_less') : t('sidebar_see_more')}
                  </button>
                )}
              </div>
            )
          })()}

          {/* Poll */}
          {!!(post as any).poll_options?.length && (() => {
            const options = (post as any).poll_options as string[]
            const totalVotes = voteCounts.reduce((a, b) => a + b, 0)
            const hasVoted = votedOption !== null
            return (
              <div style={{ padding: '0 18px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {options.map((opt, i) => {
                  const pct = totalVotes > 0 ? Math.round((voteCounts[i] ?? 0) / totalVotes * 100) : 0
                  const isChosen = votedOption === i
                  return (
                    <button key={i} onClick={() => castVote(i)} disabled={hasVoted || !currentUserId || pollLoading}
                      style={{ position: 'relative', width: '100%', padding: '10px 16px', borderRadius: 10, border: `1.5px solid ${isChosen ? '#8b5cf6' : '#e2e8f0'}`, background: hasVoted ? (isChosen ? '#f5f3ff' : '#f8fafc') : '#fff', cursor: hasVoted || !currentUserId ? 'default' : 'pointer', textAlign: 'left' as const, overflow: 'hidden' }}>
                      {hasVoted && (
                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: isChosen ? '#ede9fe' : '#f1f5f9', borderRadius: 8, transition: 'width 0.4s ease' }} />
                      )}
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: isChosen ? 700 : 500, color: isChosen ? '#7c3aed' : '#374151' }}>
                          {isChosen && <span style={{ marginRight: 5 }}>✓</span>}{opt}
                        </span>
                        {hasVoted && <span style={{ fontSize: 13, fontWeight: 700, color: isChosen ? '#7c3aed' : '#94a3b8', flexShrink: 0 }}>{pct}%</span>}
                      </div>
                    </button>
                  )
                })}
                <div style={{ fontSize: 12, color: '#94a3b8', paddingLeft: 2 }}>
                  {totalVotes} votes{hasVoted && <span> · You voted: <strong>{options[votedOption!]}</strong></span>}
                </div>
              </div>
            )
          })()}

          {/* Media */}
          {post.media_url && (
            <div style={{ padding: '0 0 14px' }}>
              <img src={post.media_url} alt="" style={{ width: '100%', maxHeight: 520, objectFit: 'cover', display: 'block' }} />
            </div>
          )}

          {/* Like / recommend counts */}
          {(likeCount > 0 || recommendCount > 0) && (
            <div style={{ padding: '6px 18px', fontSize: 13, color: '#65676b', borderTop: '1px solid #f0f2f5', display: 'flex', gap: 14 }}>
              {likeCount > 0 && <span>♥ {likeCount} {likeCount === 1 ? t('count_like') : t('count_likes')}</span>}
              {recommendCount > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#0369a1' }}>
                  <BadgeCheck size={13} /> {recommendCount} {recommendCount === 1 ? t('count_recommendation') : t('count_recommendations')}
                </span>
              )}
            </div>
          )}

          {/* Action bar */}
          <div style={{ borderTop: '1px solid #f0f2f5', padding: '4px 10px', display: 'flex', gap: 2 }}>
            <button onClick={toggleLike} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: 'none', background: 'none', cursor: currentUserId ? 'pointer' : 'default', fontSize: 13, color: liked ? '#ef4444' : '#64748b', fontWeight: liked ? 700 : 400 }}
              onMouseEnter={e => { if (currentUserId) e.currentTarget.style.background = '#fef2f2' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
              <Heart size={16} fill={liked ? '#ef4444' : 'none'} color={liked ? '#ef4444' : '#94a3b8'} />
              {t('action_like')}
            </button>
            <button onClick={() => document.getElementById('comment-input')?.focus()} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: '#64748b' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
              <MessageCircle size={16} color="#94a3b8" /> {t('action_comment')}
            </button>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid #f0f2f5', padding: '14px 18px 0' }}>

            {/* Comment sort */}
            {comments.length > 1 && (
              <div ref={sortRef} style={{ position: 'relative', marginBottom: 12 }}>
                <button onClick={() => setSortOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 6, fontSize: 13, fontWeight: 700, color: '#050505' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f0f2f5' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                  {commentSort === 'relevant' ? t('comments_sort_relevant') : t('comments_sort_newest')}
                  <ChevronDown size={14} color="#65676b" style={{ transform: sortOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
                </button>
                {sortOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 20, background: '#fff', borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.18)', border: '1px solid #e4e6eb', overflow: 'hidden', minWidth: 220 }}>
                    {(['relevant', 'newest'] as const).map(s => (
                      <button key={s} onClick={() => { setCommentSort(s); setSortOpen(false) }} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 14px', border: 'none', background: s === commentSort ? '#f0f2f5' : 'none', cursor: 'pointer', fontSize: 13, color: '#050505', textAlign: 'left' as const }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#f7f8fa' }}
                        onMouseLeave={e => { e.currentTarget.style.background = s === commentSort ? '#f0f2f5' : 'none' }}>
                        {s === 'relevant' ? t('comments_sort_relevant') : t('comments_sort_newest')}
                        {s === commentSort && <span style={{ marginLeft: 'auto', width: 18, height: 18, borderRadius: '50%', background: '#1877f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Comments list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 14 }}>
              {comments.length === 0 && (
                <div style={{ textAlign: 'center' as const, color: '#94a3b8', fontSize: 13, padding: '16px 0' }}>{t('comments_empty')}</div>
              )}
              {sortedComments.map(c => {
                const cLike = commentLikes[c.id] ?? { count: 0, liked: false }
                const isMyComment = c.user_id === currentUserId
                const isPostOwner = currentUserId === post.user_id
                const isEditing = editingCommentId === c.id
                const isReplying = replyingToId === c.id
                const isMenuOpen = menuOpenCommentId === c.id
                return (
                  <div key={c.id} onMouseEnter={() => setHoveredCommentId(c.id)} onMouseLeave={() => { if (!isMenuOpen) setHoveredCommentId(null) }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <a href={`/u/${c.profiles?.username}`} style={{ textDecoration: 'none', flexShrink: 0, marginTop: 2 }}>
                        <Avatar name={c.profiles?.display_name ?? c.profiles?.full_name} colorIndex={c.profiles?.avatar_color ?? 0} size={34} photoUrl={c.profiles?.avatar_url} />
                      </a>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {isEditing ? (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', background: '#f0f2f5', borderRadius: 20, padding: '0 6px 0 14px' }}>
                              <input value={editDraft} onChange={e => setEditDraft(e.target.value)} autoFocus
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEditComment(c.id) } if (e.key === 'Escape') setEditingCommentId(null) }}
                                style={{ flex: 1, padding: '9px 0', border: 'none', outline: 'none', background: 'none', fontSize: 14, color: '#0f172a' }} />
                              <button onClick={() => saveEditComment(c.id)} disabled={!editDraft.trim()} style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: editDraft.trim() ? 'pointer' : 'default' }}>
                                <Send size={16} color={editDraft.trim() ? '#3b82f6' : '#94a3b8'} />
                              </button>
                            </div>
                            <button onClick={() => setEditingCommentId(null)} style={{ marginTop: 4, paddingLeft: 4, fontSize: 12, fontWeight: 600, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}>{t('btn_cancel')}</button>
                          </div>
                        ) : (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <div style={{ background: '#f0f2f5', borderRadius: 14, padding: `9px 13px ${cLike.count > 0 ? 18 : 9}px 13px`, display: 'inline-block', maxWidth: 'calc(100% - 40px)', position: 'relative' }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>
                                  {c.profiles?.display_name || c.profiles?.full_name || c.profiles?.username}
                                </div>
                                <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.5 }}>{c.body}</p>
                                {cLike.count > 0 && (
                                  <div style={{ position: 'absolute', bottom: 3, right: 7, background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.15)', padding: '1px 5px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 2, border: '1px solid #e4e6eb' }}>
                                    <Heart size={10} fill="#ef4444" color="#ef4444" /> {cLike.count}
                                  </div>
                                )}
                              </div>
                              {(isMyComment || isPostOwner) && (
                                <div style={{ position: 'relative', flexShrink: 0 }}>
                                  <button onClick={() => setMenuOpenCommentId(isMenuOpen ? null : c.id)}
                                    style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: isMenuOpen ? '#e4e6eb' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: (hoveredCommentId === c.id || isMenuOpen) ? 1 : 0, transition: 'opacity 0.15s' }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#f0f2f5' }}
                                    onMouseLeave={e => { e.currentTarget.style.background = isMenuOpen ? '#e4e6eb' : 'none' }}>
                                    <MoreHorizontal size={15} color="#65676b" />
                                  </button>
                                  {isMenuOpen && (
                                    <>
                                      <div onClick={() => { setMenuOpenCommentId(null); setHoveredCommentId(null) }} style={{ position: 'fixed', inset: 0, zIndex: 50 }} />
                                      <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 51, background: '#fff', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.18)', border: '1px solid #e4e6eb', overflow: 'hidden', minWidth: 160 }}>
                                        {isMyComment && (
                                          <button onClick={() => { setEditingCommentId(c.id); setEditDraft(c.body); setMenuOpenCommentId(null) }}
                                            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: '#050505', textAlign: 'left' as const }}
                                            onMouseEnter={e => { e.currentTarget.style.background = '#f0f2f5' }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                                            <Pencil size={13} color="#65676b" /> {t('comment_edit')}
                                          </button>
                                        )}
                                        <button onClick={() => { deleteComment(c.id); setMenuOpenCommentId(null) }}
                                          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: '#ef4444', textAlign: 'left' as const }}
                                          onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2' }}
                                          onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                                          <Trash2 size={13} color="#ef4444" /> {t('comment_delete')}
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, paddingLeft: 4 }}>
                              <span style={{ fontSize: 11, color: '#94a3b8' }} title={fullTime(c.created_at, tl.dateLocale)}>{timeAgo(c.created_at, tl)}</span>
                              {currentUserId && (
                                <button onClick={() => toggleCommentLike(c.id)} style={{ fontSize: 12, fontWeight: 700, color: cLike.liked ? '#ef4444' : '#65676b', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                  {cLike.liked ? t('action_liked') : t('action_like')}
                                </button>
                              )}
                              {currentUserId && (
                                <button onClick={() => { setReplyingToId(isReplying ? null : c.id); setReplyDraft('') }} style={{ fontSize: 12, fontWeight: 700, color: '#65676b', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                  {t('action_reply')}
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Reply box */}
                    {isReplying && currentProfile && (
                      <div style={{ paddingLeft: 42, marginTop: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
                        <Avatar name={currentProfile.display_name} colorIndex={currentProfile.avatar_color ?? 0} photoUrl={currentProfile.avatar_url} size={26} />
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#f0f2f5', borderRadius: 20, padding: '0 4px 0 12px' }}>
                          <input value={replyDraft} onChange={e => setReplyDraft(e.target.value)} autoFocus
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitReply(c.id) } if (e.key === 'Escape') setReplyingToId(null) }}
                            placeholder={`Reply to ${c.profiles?.display_name || c.profiles?.username}…`}
                            style={{ flex: 1, padding: '7px 0', border: 'none', outline: 'none', background: 'none', fontSize: 13 }} />
                          <button onClick={() => submitReply(c.id)} disabled={!replyDraft.trim() || replyLoading} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: replyDraft.trim() ? '#3b82f6' : 'none', cursor: replyDraft.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Send size={12} color={replyDraft.trim() ? '#fff' : '#94a3b8'} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Replies */}
                    {(c.replies ?? []).length > 0 && (
                      <div style={{ paddingLeft: 42, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {(c.replies ?? []).map(r => {
                          const rLike = commentLikes[r.id] ?? { count: 0, liked: false }
                          const isMyReply = r.user_id === currentUserId
                          const isReplyMenuOpen = menuOpenCommentId === r.id
                          return (
                            <div key={r.id} onMouseEnter={() => setHoveredCommentId(r.id)} onMouseLeave={() => { if (!isReplyMenuOpen) setHoveredCommentId(null) }}>
                              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                                <a href={`/u/${r.profiles?.username}`} style={{ textDecoration: 'none', flexShrink: 0, marginTop: 2 }}>
                                  <Avatar name={r.profiles?.display_name ?? r.profiles?.full_name} colorIndex={r.profiles?.avatar_color ?? 0} size={26} photoUrl={r.profiles?.avatar_url} />
                                </a>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <div style={{ background: '#f0f2f5', borderRadius: 12, padding: `7px 11px ${rLike.count > 0 ? 16 : 7}px 11px`, display: 'inline-block', maxWidth: 'calc(100% - 32px)', position: 'relative' }}>
                                      <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>
                                        {r.profiles?.display_name || r.profiles?.full_name || r.profiles?.username}
                                      </div>
                                      <p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.5 }}>{r.body}</p>
                                      {rLike.count > 0 && (
                                        <div style={{ position: 'absolute', bottom: 2, right: 6, background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.15)', padding: '1px 4px', fontSize: 10, display: 'flex', alignItems: 'center', gap: 2, border: '1px solid #e4e6eb' }}>
                                          <Heart size={9} fill="#ef4444" color="#ef4444" /> {rLike.count}
                                        </div>
                                      )}
                                    </div>
                                    {(isMyReply || isPostOwner) && (
                                      <div style={{ position: 'relative', flexShrink: 0 }}>
                                        <button onClick={() => setMenuOpenCommentId(isReplyMenuOpen ? null : r.id)}
                                          style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', background: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: (hoveredCommentId === r.id || isReplyMenuOpen) ? 1 : 0, transition: 'opacity 0.15s' }}>
                                          <MoreHorizontal size={13} color="#65676b" />
                                        </button>
                                        {isReplyMenuOpen && (
                                          <>
                                            <div onClick={() => { setMenuOpenCommentId(null); setHoveredCommentId(null) }} style={{ position: 'fixed', inset: 0, zIndex: 50 }} />
                                            <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 51, background: '#fff', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.18)', border: '1px solid #e4e6eb', overflow: 'hidden', minWidth: 150 }}>
                                              <button onClick={() => { supabase.from('post_comments').delete().eq('id', r.id).then(() => setComments(prev => prev.map(cc => cc.id === c.id ? { ...cc, replies: (cc.replies ?? []).filter(x => x.id !== r.id) } : cc))); setMenuOpenCommentId(null) }}
                                                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '9px 14px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, color: '#ef4444', textAlign: 'left' as const }}
                                                onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2' }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                                                <Trash2 size={13} color="#ef4444" /> {t('comment_delete')}
                                              </button>
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
                )
              })}
              <div ref={commentsEndRef} />
            </div>
          </div>

          {/* Comment input */}
          {currentUserId && currentProfile && (
            <div style={{ padding: '12px 18px', borderTop: '1px solid #f0f2f5', display: 'flex', gap: 8, alignItems: 'center' }}>
              <Avatar name={currentProfile.display_name} colorIndex={currentProfile.avatar_color ?? 0} photoUrl={currentProfile.avatar_url} size={34} />
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#f0f2f5', borderRadius: 22, padding: '0 4px 0 14px' }}>
                <input id="comment-input" value={commentDraft} onChange={e => setCommentDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment() } }}
                  placeholder={t('comments_write_placeholder')}
                  style={{ flex: 1, padding: '10px 0', border: 'none', outline: 'none', background: 'none', fontSize: 14 }} />
                <button onClick={submitComment} disabled={!commentDraft.trim() || commentLoading}
                  style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: commentDraft.trim() ? '#3b82f6' : 'none', cursor: commentDraft.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Send size={15} color={commentDraft.trim() ? '#fff' : '#94a3b8'} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
