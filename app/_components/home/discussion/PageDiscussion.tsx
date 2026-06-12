'use client'
import { useEffect, useState, useRef } from 'react'
import { MessageCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '../../../_hooks/useAuth'
import { Avatar } from '../../social/post/PostCardHelpers'
import ThanksButton from './ThanksButton'
import DiscussionComment, { type DiscussionCommentData } from './DiscussionComment'
import { useTranslation } from '../../../i18n/LanguageContext'

interface Props {
  pageKey: string
}

export default function PageDiscussion({ pageKey }: Props) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const userId = user?.id ?? null

  const [visibleCount, setVisibleCount] = useState(10)
  const [expanded, setExpanded] = useState(true)
  const [comments, setComments] = useState<DiscussionCommentData[]>([])
  const [thanksCount, setThanksCount] = useState(0)
  const [thanksGiven, setThanksGiven] = useState(false)
  const [myProfile, setMyProfile] = useState<{ display_name: string | null; avatar_color: number; avatar_url: string | null } | null>(null)
  const [body, setBody] = useState('')
  const [posting, setPosting] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setLoaded(false)
    setComments([])
    setThanksCount(0)
    setThanksGiven(false)
    setVisibleCount(10)

    async function load() {
      const [{ data: thanksRows }, { data: rows }] = await Promise.all([
        supabase.from('page_thanks').select('user_id').eq('page_key', pageKey),
        supabase.from('page_discussions')
          .select('*, profiles!page_discussions_user_id_fkey(username, display_name, full_name, avatar_color, avatar_url)')
          .eq('page_key', pageKey)
          .order('created_at', { ascending: true }),
      ])

      setThanksCount(thanksRows?.length ?? 0)
      setThanksGiven(!!userId && (thanksRows ?? []).some(r => r.user_id === userId))

      if (rows) {
        const ids = rows.map(r => r.id)
        const { data: likes } = userId
          ? await supabase.from('page_comment_likes').select('comment_id, user_id').in('comment_id', ids)
          : { data: [] }

        const likeMap: Record<string, number> = {}
        const myLikes = new Set<string>()
        for (const l of likes ?? []) {
          likeMap[l.comment_id] = (likeMap[l.comment_id] ?? 0) + 1
          if (l.user_id === userId) myLikes.add(l.comment_id)
        }

        const enriched: DiscussionCommentData[] = rows.map(r => ({
          ...r,
          like_count: likeMap[r.id] ?? 0,
          liked_by_me: myLikes.has(r.id),
          replies: [],
        }))

        const top = enriched.filter(r => !r.parent_id)
        const replies = enriched.filter(r => r.parent_id)
        const withReplies = top.map(c => ({
          ...c,
          replies: replies.filter(r => r.parent_id === c.id),
        }))
        setComments(withReplies)
      }
      setLoaded(true)
    }

    load()
  }, [pageKey, userId])

  useEffect(() => {
    if (!userId) return
    supabase.from('profiles').select('display_name, full_name, avatar_color, avatar_url').eq('id', userId).single()
      .then(({ data }) => {
        if (data) setMyProfile({ display_name: data.display_name ?? data.full_name ?? null, avatar_color: data.avatar_color, avatar_url: data.avatar_url })
      })
  }, [userId])

  const totalComments = comments.reduce((acc, c) => acc + 1 + (c.replies?.length ?? 0), 0)

  async function handlePost(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim() || !userId) return
    setPosting(true)
    const { error: insertError } = await supabase.from('page_discussions')
      .insert({ page_key: pageKey, user_id: userId, body: body.trim(), parent_id: null })
    if (insertError) {
      console.error('post comment error:', insertError)
      setPosting(false)
      return
    }
    setBody('')
    setPosting(false)
    // Reload all comments to get the new one with profile data
    const { data: rows } = await supabase.from('page_discussions')
      .select('*, profiles!page_discussions_user_id_fkey(username, display_name, full_name, avatar_color, avatar_url)')
      .eq('page_key', pageKey)
      .order('created_at', { ascending: true })
    if (rows) {
      const ids = rows.map(r => r.id)
      const { data: likes } = userId
        ? await supabase.from('page_comment_likes').select('comment_id, user_id').in('comment_id', ids)
        : { data: [] }
      const likeMap: Record<string, number> = {}
      const myLikes = new Set<string>()
      for (const l of likes ?? []) {
        likeMap[l.comment_id] = (likeMap[l.comment_id] ?? 0) + 1
        if (l.user_id === userId) myLikes.add(l.comment_id)
      }
      const enriched = rows.map(r => ({ ...r, like_count: likeMap[r.id] ?? 0, liked_by_me: myLikes.has(r.id), replies: [] as DiscussionCommentData[] }))
      const top = enriched.filter(r => !r.parent_id)
      const replies = enriched.filter(r => r.parent_id)
      setComments(top.map(c => ({ ...c, replies: replies.filter(r => r.parent_id === c.id) })))
    }
  }

  function handleReplyAdded(parentId: string, reply: DiscussionCommentData) {
    setComments(prev => prev.map(c =>
      c.id === parentId ? { ...c, replies: [...(c.replies ?? []), reply] } : c
    ))
  }

  function handleDeleted(id: string) {
    setComments(prev => {
      const withoutTop = prev.filter(c => c.id !== id)
      return withoutTop.map(c => ({ ...c, replies: (c.replies ?? []).filter(r => r.id !== id) }))
    })
  }

  // Flatten comments + replies into a single ordered list for counting/slicing
  const flatItems: { comment: DiscussionCommentData; parentId: string | null }[] = []
  for (const c of comments) {
    flatItems.push({ comment: c, parentId: null })
    for (const r of c.replies ?? []) flatItems.push({ comment: r, parentId: c.id })
  }
  const visibleItems = flatItems.slice(0, visibleCount)
  const hasMore = flatItems.length > visibleCount

  // Rebuild tree from visible flat list
  const visibleTop: DiscussionCommentData[] = []
  for (const { comment, parentId } of visibleItems) {
    if (!parentId) {
      visibleTop.push({ ...comment, replies: [] })
    } else {
      const parent = visibleTop.find(c => c.id === parentId)
      if (parent) parent.replies = [...(parent.replies ?? []), comment]
    }
  }

  return (
    <div style={{ marginTop: 40, borderTop: '1px solid #e2e8f0', paddingTop: 20 }}>
      {/* Bar: Thanks + Discussion label */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        <ThanksButton pageKey={pageKey} userId={userId} initialCount={thanksCount} initialGiven={thanksGiven} />
        <button
          onClick={() => setExpanded(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, border: '1.5px solid #e2e8f0', background: expanded ? '#f1f5f9' : '#fff', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
          onMouseLeave={e => (e.currentTarget.style.background = expanded ? '#f1f5f9' : '#fff')}
        >
          <MessageCircle size={14} />
          {loaded && totalComments > 0 && <span style={{ fontWeight: 700 }}>{totalComments}</span>}
          <span>{t('home_discussion_title')}</span>
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {expanded && <>
      {/* Comment input */}
      {userId ? (
        <form onSubmit={handlePost} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 20 }}>
          <Avatar
            name={myProfile?.display_name ?? null}
            colorIndex={myProfile?.avatar_color ?? 0}
            photoUrl={myProfile?.avatar_url}
            size={32}
          />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <textarea
              ref={inputRef}
              value={body}
              onChange={e => setBody(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePost(e as any) } }}
              placeholder={t('home_discussion_comment_ph')}
              rows={2}
              style={{
                width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 12,
                fontSize: 13, outline: 'none', resize: 'none', background: '#f8fafc', boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = '#3b82f6')}
              onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
            />
            {body.trim() && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={posting}
                  style={{ padding: '5px 16px', borderRadius: 14, border: 'none', fontSize: 12, fontWeight: 700, background: '#3b82f6', color: '#fff', cursor: 'pointer' }}>
                  {posting ? t('home_discussion_posting') : t('home_discussion_post')}
                </button>
              </div>
            )}
          </div>
        </form>
      ) : (
        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16, padding: '10px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
          {t('home_discussion_signin')}
        </div>
      )}

      {/* Comment list */}
      {!loaded ? (
        <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>{t('home_discussion_loading')}</div>
      ) : comments.length === 0 ? (
        <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>{t('home_discussion_empty')}</div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {visibleTop.map(c => (
              <DiscussionComment
                key={c.id}
                comment={c}
                userId={userId}
                pageKey={pageKey}
                onReplyAdded={(reply) => handleReplyAdded(c.id, reply)}
                onDeleted={handleDeleted}
              />
            ))}
          </div>
          {hasMore && (
            <button
              onClick={() => setVisibleCount(v => v + 10)}
              style={{ marginTop: 14, display: 'block', width: '100%', padding: '8px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')}
              onMouseLeave={e => (e.currentTarget.style.background = '#f8fafc')}
            >
              {t('home_discussion_see_more')} ({flatItems.length - visibleCount} {t('home_discussion_remaining')})
            </button>
          )}
        </>
      )}
      </>}
    </div>
  )
}
