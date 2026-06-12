'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { createNotification, deleteNotification } from '../../../_lib/notify'
import type { PostWithProfile, PostVisibility, Profile } from '../../../_types'
import PostModal from './PostModal'

interface Props {
  postId: string
  currentUserId: string
  onClose: () => void
}

export default function PostModalFromFeed({ postId, currentUserId, onClose }: Props) {
  const [post, setPost] = useState<PostWithProfile | null>(null)
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null)

  useEffect(() => {
    supabase
      .from('posts')
      .select('*, profiles!posts_user_id_fkey(id,username,family_name,given_name,display_name,full_name,profession,specializations,is_verified,avatar_color,avatar_url), post_likes(user_id), post_comments(id), post_recommendations(user_id)')
      .eq('id', postId)
      .single()
      .then(({ data }) => setPost(data as PostWithProfile))

    supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUserId)
      .maybeSingle()
      .then(({ data }) => setCurrentProfile(data as Profile | null))
  }, [postId, currentUserId])

  if (!post) return null

  return (
    <PostModal
      post={post}
      currentUserId={currentUserId}
      currentUserIsVerified={currentProfile?.is_verified ?? false}
      currentUser={{ id: currentUserId }}
      currentProfile={currentProfile}
      onClose={onClose}
      onLikeToggle={(id, wasLiked) => {
        setPost(prev => prev ? {
          ...prev,
          post_likes: wasLiked
            ? prev.post_likes.filter(l => l.user_id !== currentUserId)
            : [...prev.post_likes, { user_id: currentUserId }],
        } : prev)
        if (!wasLiked) {
          supabase.from('post_likes').insert({ post_id: id, user_id: currentUserId }).then(() => {})
          createNotification({ userId: post.user_id, actorId: currentUserId, type: 'like', postId: id })
        } else {
          supabase.from('post_likes').delete().eq('post_id', id).eq('user_id', currentUserId).then(() => {})
          deleteNotification({ userId: post.user_id, actorId: currentUserId, type: 'like', postId: id })
        }
      }}
      onRecommendToggle={(id, wasRecommended) => {
        setPost(prev => prev ? {
          ...prev,
          post_recommendations: wasRecommended
            ? prev.post_recommendations.filter(r => r.user_id !== currentUserId)
            : [...prev.post_recommendations, { user_id: currentUserId }],
        } : prev)
        if (!wasRecommended) {
          supabase.from('post_recommendations').insert({ post_id: id, user_id: currentUserId }).then(() => {})
        } else {
          supabase.from('post_recommendations').delete().eq('post_id', id).eq('user_id', currentUserId).then(() => {})
        }
      }}
      onDeleted={() => onClose()}
      onEdited={(id, body, visibility) => setPost(prev => prev ? { ...prev, body, visibility } : prev)}
    />
  )
}
