'use client'
import { useState, useEffect } from 'react'
import { ThumbsUp, Trash2, CornerDownRight, AlertTriangle } from 'lucide-react'
import { Avatar } from '../../social/post/PostCardHelpers'
import { supabase } from '@/lib/supabase'
import DiscussionReplyInput from './DiscussionReplyInput'
import { useTranslation } from '../../../i18n/LanguageContext'

function ConfirmDeleteModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  const { t } = useTranslation()
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onCancel}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)' }} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: 16, padding: '28px 28px 20px', maxWidth: 360, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', gap: 16 }}
        onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={20} color="#ef4444" />
          <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{t('home_discussion_delete_confirm_title')}</span>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{t('home_discussion_delete_confirm')}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onCancel}
            style={{ padding: '7px 18px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            {t('home_discussion_delete_cancel')}
          </button>
          <button onClick={onConfirm}
            style={{ padding: '7px 18px', borderRadius: 10, border: 'none', background: '#ef4444', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            {t('home_discussion_delete')}
          </button>
        </div>
      </div>
    </div>
  )
}

export interface DiscussionCommentData {
  id: string
  body: string
  created_at: string
  user_id: string
  parent_id: string | null
  like_count: number
  liked_by_me: boolean
  profiles: {
    username: string
    display_name: string | null
    full_name: string | null
    avatar_color: number
    avatar_url: string | null
  } | null
  replies?: DiscussionCommentData[]
}

interface Props {
  comment: DiscussionCommentData
  userId: string | null
  pageKey: string
  onReplyAdded: (reply: DiscussionCommentData) => void
  onDeleted: (id: string) => void
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export default function DiscussionComment({ comment, userId, pageKey, onReplyAdded, onDeleted }: Props) {
  const { t } = useTranslation()
  const [liked, setLiked] = useState(comment.liked_by_me)
  const [likeCount, setLikeCount] = useState(comment.like_count)

  useEffect(() => {
    setLiked(comment.liked_by_me)
    setLikeCount(comment.like_count)
  }, [comment.liked_by_me, comment.like_count])
  const [showReply, setShowReply] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const authorName = comment.profiles?.display_name ?? comment.profiles?.full_name ?? 'User'
  const isOwn = userId === comment.user_id

  async function toggleLike() {
    if (!userId) return
    if (liked) {
      setLiked(false); setLikeCount(c => c - 1)
      await supabase.from('page_comment_likes').delete().eq('comment_id', comment.id).eq('user_id', userId)
    } else {
      setLiked(true); setLikeCount(c => c + 1)
      await supabase.from('page_comment_likes').insert({ comment_id: comment.id, user_id: userId })
    }
  }

  async function handleDelete() {
    await supabase.from('page_discussions').delete().eq('id', comment.id)
    setShowDeleteConfirm(false)
    onDeleted(comment.id)
  }

  async function handleReply(body: string) {
    if (!userId) return
    const { error } = await supabase.from('page_discussions')
      .insert({ page_key: pageKey, user_id: userId, body, parent_id: comment.id })
    if (error) return
    // Re-fetch the reply with profile data
    const { data } = await supabase.from('page_discussions')
      .select('*, profiles!page_discussions_user_id_fkey(username, display_name, full_name, avatar_color, avatar_url)')
      .eq('page_key', pageKey).eq('parent_id', comment.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    if (data) {
      onReplyAdded({ ...data, like_count: 0, liked_by_me: false, replies: [] })
      setShowReply(false)
    }
  }

  return (
    <div>
      {showDeleteConfirm && <ConfirmDeleteModal onConfirm={handleDelete} onCancel={() => setShowDeleteConfirm(false)} />}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <Avatar name={authorName} colorIndex={comment.profiles?.avatar_color ?? 0} photoUrl={comment.profiles?.avatar_url} size={32} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ background: '#f0f2f5', borderRadius: '0 14px 14px 14px', padding: '8px 12px', display: 'inline-block', maxWidth: '100%' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{authorName}</div>
            <div style={{ fontSize: 13, color: '#1e293b', lineHeight: 1.5, wordBreak: 'break-word' }}>{comment.body}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, paddingLeft: 4 }}>
            <span style={{ fontSize: 11, color: '#94a3b8' }}>{timeAgo(comment.created_at)}</span>
            {userId && (
              <button onClick={toggleLike}
                style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: liked ? '#3b82f6' : '#64748b', padding: 0 }}>
                <ThumbsUp size={12} fill={liked ? '#3b82f6' : 'none'} />
                {likeCount > 0 && <span>{likeCount}</span>}
                <span>{liked ? 'Liked' : 'Like'}</span>
              </button>
            )}
            {userId && !comment.parent_id && (
              <button onClick={() => setShowReply(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#64748b', padding: 0 }}>
                <CornerDownRight size={12} />
                <span>{t('home_discussion_reply')}</span>
              </button>
            )}
            {isOwn && (
              <button onClick={() => setShowDeleteConfirm(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#ef4444', padding: 0 }}>
                <Trash2 size={11} />
                <span>{t('home_discussion_delete')}</span>
              </button>
            )}
          </div>
          {showReply && (
            <DiscussionReplyInput onSubmit={handleReply} onCancel={() => setShowReply(false)} />
          )}
          {comment.replies && comment.replies.length > 0 && (
            <div style={{ marginTop: 8, paddingLeft: 12, borderLeft: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {comment.replies.map(reply => (
                <DiscussionComment
                  key={reply.id}
                  comment={reply}
                  userId={userId}
                  pageKey={pageKey}
                  onReplyAdded={() => {}}
                  onDeleted={(rid) => onDeleted(rid)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
