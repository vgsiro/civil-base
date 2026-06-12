'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { Bookmark, FolderOpen, Pencil, Trash2, X, Plus, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Profile, PostWithProfile, SavedCollection } from '../../_types'
import TopNavBar from '../../_components/social/feed/TopNavBar'
import ChatBox from '../../_components/social/messaging/ChatBox'
import PostModalFromFeed from '../../_components/social/post/PostModalFromFeed'
import { useMessagingChat } from '../../_hooks/useMessagingChat'

export default function SavedPage() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [collections, setCollections] = useState<SavedCollection[]>([])
  const [activeCollection, setActiveCollection] = useState<SavedCollection | null>(null)
  const [posts, setPosts] = useState<PostWithProfile[]>([])
  const [loadingCols, setLoadingCols] = useState(true)
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [openPostId, setOpenPostId] = useState<string | null>(null)
  const [unreadNotifs, setUnreadNotifs] = useState(0)
  const [unreadMsgs, setUnreadMsgs] = useState(0)
  const [pendingFriends, setPendingFriends] = useState(0)
  const chat = useMessagingChat()

  // Rename / delete state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  // Create new collection
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    // Seed user + cached profile from the session first so the nav avatar shows the real image
    // on first paint instead of the default circle until the network fetch returns.
    supabase.auth.getSession().then(({ data: { session } }) => {
      const su = session?.user
      if (su) {
        setUser(su)
        try {
          const cached = localStorage.getItem(`civilbase_profile_${su.id}`)
          if (cached) setProfile(JSON.parse(cached) as Profile)
        } catch {}
      }
    })
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) { window.location.href = '/'; return }
      setUser(u)
      const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).maybeSingle()
      if (p) {
        setProfile(p as Profile)
        try { localStorage.setItem(`civilbase_profile_${u.id}`, JSON.stringify(p)) } catch {}
      }
      const { data: cols } = await supabase
        .from('saved_collections')
        .select('*')
        .eq('user_id', u.id)
        .order('created_at', { ascending: false })
      setCollections((cols as SavedCollection[]) ?? [])
      setLoadingCols(false)
    })
  }, [])

  async function openCollection(col: SavedCollection) {
    setActiveCollection(col)
    setLoadingPosts(true)
    const { data: savedRows } = await supabase
      .from('saved_posts')
      .select('post_id, created_at')
      .eq('collection_id', col.id)
      .order('created_at', { ascending: false })
    const postIds = (savedRows ?? []).map((r: any) => r.post_id)
    if (postIds.length === 0) { setPosts([]); setLoadingPosts(false); return }
    const { data: postsData } = await supabase
      .from('posts')
      .select('*, profiles!posts_user_id_fkey(id,username,family_name,given_name,display_name,full_name,profession,specializations,is_verified,avatar_color,avatar_url), post_likes(user_id), post_comments(id), post_recommendations(user_id)')
      .in('id', postIds)
    // Sort by saved_at order
    const map = Object.fromEntries((postsData ?? []).map((p: any) => [p.id, p]))
    setPosts(postIds.map(id => map[id]).filter(Boolean) as PostWithProfile[])
    setLoadingPosts(false)
  }

  async function createCollection() {
    const name = newName.trim()
    if (!name || !user) return
    setCreating(false)
    const { data } = await supabase.from('saved_collections').insert({ user_id: user.id, name }).select('*').single()
    if (data) setCollections(prev => [data as SavedCollection, ...prev])
    setNewName('')
  }

  async function renameCollection(id: string) {
    const name = editName.trim()
    if (!name) return
    await supabase.from('saved_collections').update({ name }).eq('id', id)
    setCollections(prev => prev.map(c => c.id === id ? { ...c, name } : c))
    if (activeCollection?.id === id) setActiveCollection(prev => prev ? { ...prev, name } : prev)
    setEditingId(null)
  }

  async function deleteCollection(id: string) {
    await supabase.from('saved_posts').delete().eq('collection_id', id)
    await supabase.from('saved_collections').delete().eq('id', id)
    setCollections(prev => prev.filter(c => c.id !== id))
    if (activeCollection?.id === id) { setActiveCollection(null); setPosts([]) }
    setDeletingId(null)
  }

  async function unsavePost(postId: string) {
    if (!activeCollection || !user) return
    await supabase.from('saved_posts').delete().eq('user_id', user.id).eq('post_id', postId).eq('collection_id', activeCollection.id)
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  const AVATAR_COLORS = [
    'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    'linear-gradient(135deg, #10b981, #3b82f6)',
    'linear-gradient(135deg, #f59e0b, #ef4444)',
    'linear-gradient(135deg, #ec4899, #8b5cf6)',
    'linear-gradient(135deg, #06b6d4, #10b981)',
    'linear-gradient(135deg, #f97316, #f59e0b)',
  ]

  function timeAgo(d: string) {
    const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
    if (m < 1) return 'Just now'
    if (m < 60) return `${m}m ago`
    if (m < 1440) return `${Math.floor(m / 60)}h ago`
    if (m < 10080) return `${Math.floor(m / 1440)}d ago`
    return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      {openPostId && user && (
        <PostModalFromFeed postId={openPostId} currentUserId={user.id} onClose={() => setOpenPostId(null)} />
      )}

      {user && chat.openChats.map((c, i) => (
        <ChatBox key={c.convId} userId={user.id} {...chat.chatBoxProps(c, i)} />
      ))}

      <TopNavBar
        user={user}
        profile={profile}
        unreadNotifs={unreadNotifs}
        onUnreadNotifsChange={setUnreadNotifs}
        unreadMsgs={unreadMsgs}
        onUnreadMsgsChange={setUnreadMsgs}
        pendingFriends={pendingFriends}
        onPendingFriendsChange={setPendingFriends}
        {...chat.dropdownHandlers}
      />

      <div style={{ maxWidth: 1050, margin: '16px auto', padding: '0 12px', display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, alignItems: 'start' }}>

        {/* ── Left: Collections sidebar ── */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e4e6eb', overflow: 'hidden', position: 'sticky', top: 68 }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0f2f5', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bookmark size={18} color="#3b82f6" />
            <span style={{ fontSize: 16, fontWeight: 800, color: '#050505' }}>Saved</span>
          </div>

          {loadingCols && <div style={{ padding: '24px', textAlign: 'center' as const, color: '#94a3b8', fontSize: 13 }}>Loading…</div>}

          {!loadingCols && collections.length === 0 && !creating && (
            <div style={{ padding: '28px 16px', textAlign: 'center' as const }}>
              <FolderOpen size={32} color="#d1d5db" style={{ margin: '0 auto 8px', display: 'block' }} />
              <div style={{ fontSize: 13, color: '#65676b' }}>No collections yet</div>
            </div>
          )}

          {/* Collection list */}
          <div>
            {collections.map(col => {
              const isActive = activeCollection?.id === col.id
              const isEditing = editingId === col.id
              const isDeleting = deletingId === col.id

              if (isEditing) {
                return (
                  <div key={col.id} style={{ padding: '8px 12px', display: 'flex', gap: 6, alignItems: 'center', borderBottom: '1px solid #f0f2f5' }}>
                    <input
                      autoFocus
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') renameCollection(col.id); if (e.key === 'Escape') setEditingId(null) }}
                      style={{ flex: 1, padding: '6px 10px', borderRadius: 6, border: '1.5px solid #3b82f6', outline: 'none', fontSize: 13 }}
                    />
                    <button onClick={() => renameCollection(col.id)} style={{ padding: '6px 8px', borderRadius: 6, border: 'none', background: '#3b82f6', color: '#fff', cursor: 'pointer' }}><Check size={13} /></button>
                    <button onClick={() => setEditingId(null)} style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}><X size={13} color="#64748b" /></button>
                  </div>
                )
              }

              if (isDeleting) {
                return (
                  <div key={col.id} style={{ padding: '10px 12px', background: '#fef2f2', borderBottom: '1px solid #fecaca' }}>
                    <div style={{ fontSize: 12, color: '#dc2626', fontWeight: 600, marginBottom: 6 }}>Delete "{col.name}"?</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => deleteCollection(col.id)} style={{ flex: 1, padding: '5px', borderRadius: 6, border: 'none', background: '#dc2626', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Delete</button>
                      <button onClick={() => setDeletingId(null)} style={{ flex: 1, padding: '5px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                    </div>
                  </div>
                )
              }

              return (
                <div key={col.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '0 4px', borderBottom: '1px solid #f0f2f5', background: isActive ? '#f0f7ff' : 'transparent' }}>
                  <button onClick={() => openCollection(col)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 10px', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' as const }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f8fafc' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: isActive ? '#dbeafe' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Bookmark size={16} fill={isActive ? '#3b82f6' : 'none'} color={isActive ? '#3b82f6' : '#94a3b8'} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: isActive ? 700 : 500, color: isActive ? '#3b82f6' : '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{col.name}</span>
                  </button>
                  <button onClick={() => { setEditingId(col.id); setEditName(col.name) }}
                    title="Rename"
                    style={{ padding: '6px', borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', flexShrink: 0 }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f0f2f5'; e.currentTarget.style.color = '#3b82f6' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#94a3b8' }}>
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => setDeletingId(col.id)}
                    title="Delete"
                    style={{ padding: '6px', borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', flexShrink: 0 }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#94a3b8' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              )
            })}
          </div>

          {/* Create new */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid #f0f2f5' }}>
            {creating ? (
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  autoFocus
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') createCollection(); if (e.key === 'Escape') { setCreating(false); setNewName('') } }}
                  placeholder="Collection name…"
                  style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: '1.5px solid #3b82f6', outline: 'none', fontSize: 13 }}
                />
                <button onClick={createCollection} disabled={!newName.trim()}
                  style={{ padding: '7px 10px', borderRadius: 8, border: 'none', background: newName.trim() ? '#3b82f6' : '#e2e8f0', color: newName.trim() ? '#fff' : '#94a3b8', cursor: newName.trim() ? 'pointer' : 'default' }}>
                  <Check size={14} />
                </button>
                <button onClick={() => { setCreating(false); setNewName('') }}
                  style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}>
                  <X size={14} color="#64748b" />
                </button>
              </div>
            ) : (
              <button onClick={() => setCreating(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px dashed #cbd5e1', background: 'none', cursor: 'pointer', fontSize: 13, color: '#3b82f6', fontWeight: 600 }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f0f7ff'; e.currentTarget.style.borderColor = '#3b82f6' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = '#cbd5e1' }}>
                <Plus size={15} /> New collection
              </button>
            )}
          </div>
        </div>

        {/* ── Right: Posts in selected collection ── */}
        <div>
          {!activeCollection ? (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e4e6eb', padding: '60px 20px', textAlign: 'center' as const }}>
              <Bookmark size={44} color="#d1d5db" style={{ margin: '0 auto 14px', display: 'block' }} />
              <div style={{ fontSize: 18, fontWeight: 700, color: '#050505', marginBottom: 6 }}>Select a collection</div>
              <div style={{ fontSize: 14, color: '#65676b' }}>Choose a collection on the left to see saved posts.</div>
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e4e6eb', overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0f2f5', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Bookmark size={18} fill="#3b82f6" color="#3b82f6" />
                <span style={{ fontSize: 16, fontWeight: 800, color: '#050505' }}>{activeCollection.name}</span>
                <span style={{ fontSize: 13, color: '#94a3b8', marginLeft: 'auto' }}>{posts.length} post{posts.length !== 1 ? 's' : ''}</span>
              </div>

              {loadingPosts && <div style={{ padding: '40px', textAlign: 'center' as const, color: '#94a3b8', fontSize: 14 }}>Loading…</div>}

              {!loadingPosts && posts.length === 0 && (
                <div style={{ padding: '60px 20px', textAlign: 'center' as const }}>
                  <FolderOpen size={40} color="#d1d5db" style={{ margin: '0 auto 12px', display: 'block' }} />
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#050505', marginBottom: 4 }}>No posts saved here</div>
                  <div style={{ fontSize: 14, color: '#65676b' }}>Save posts from the feed and they'll appear here.</div>
                </div>
              )}

              {/* Post rows */}
              {!loadingPosts && posts.map((post, i) => {
                const author = post.profiles
                const authorName = author?.display_name || author?.full_name || author?.username || 'Unknown'
                const initial = authorName[0].toUpperCase()
                const colorIndex = author?.avatar_color ?? 0
                return (
                  <div key={post.id}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 18px', borderTop: i > 0 ? '1px solid #f0f2f5' : 'none', cursor: 'pointer', transition: 'background 0.1s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f8fafc' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff' }}
                    onClick={() => setOpenPostId(post.id)}>

                    {/* Author avatar */}
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: AVATAR_COLORS[colorIndex], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 800, color: '#fff', flexShrink: 0, overflow: 'hidden' }}>
                      {author?.avatar_url
                        ? <img src={author.avatar_url} alt={initial} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : initial}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{authorName}</span>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>· {timeAgo(post.created_at)}</span>
                      </div>
                      {post.body && (
                        <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.55, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const }}>
                          {post.body}
                        </div>
                      )}
                      {post.media_url && (
                        <div style={{ marginTop: 8, width: 80, height: 60, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                          <img src={post.media_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>❤️ {post.post_likes.length} · 💬 {post.post_comments.length}</span>
                      </div>
                    </div>

                    {/* Unsave button */}
                    <button
                      onClick={e => { e.stopPropagation(); unsavePost(post.id) }}
                      title="Remove from collection"
                      style={{ padding: '6px', borderRadius: 6, border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', flexShrink: 0 }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#94a3b8' }}>
                      <Bookmark size={16} fill="#94a3b8" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
