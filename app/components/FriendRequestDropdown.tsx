'use client'
import { useEffect, useRef, useState } from 'react'
import { Users, Check, X, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { createNotification } from '../lib/notify'

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
  if (m < 1) return 'now'
  if (m < 60) return `${m}m`
  if (m < 1440) return `${Math.floor(m / 60)}h`
  if (m < 10080) return `${Math.floor(m / 1440)}d`
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

interface FriendReq {
  id: string
  requester_id: string
  created_at: string
  requester: {
    id: string
    username: string
    display_name: string | null
    full_name: string | null
    avatar_color: number
    avatar_url: string | null
    profession: string | null
  }
}

interface Props {
  userId: string
  pendingCount: number
  onCountChange: (n: number | ((prev: number) => number)) => void
}

export default function FriendRequestDropdown({ userId, pendingCount, onCountChange }: Props) {
  const [open, setOpen] = useState(false)
  const [requests, setRequests] = useState<FriendReq[]>([])
  const [loaded, setLoaded] = useState(false)
  const [acting, setActing] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (!open || loaded) return
    load()
  }, [open])

  // Keep a stable ref so the realtime callback never captures a stale count
  const onCountChangeRef = useRef(onCountChange)
  useEffect(() => { onCountChangeRef.current = onCountChange }, [onCountChange])

  // Real-time new requests — stable subscription, only torn down when userId changes
  useEffect(() => {
    const sub = supabase.channel(`friend-req-dropdown-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'friendships', filter: `receiver_id=eq.${userId}` }, async payload => {
        if ((payload.new as any).status !== 'pending') return
        const { data } = await supabase.from('friendships')
          .select('id, requester_id, created_at, requester:requester_id(id,username,display_name,full_name,avatar_color,avatar_url,profession)')
          .eq('id', (payload.new as any).id).single()
        if (data) {
          setRequests(prev => [data as unknown as FriendReq, ...prev])
          onCountChangeRef.current(prev => prev + 1)
        }
      })
      .subscribe()
    return () => { sub.unsubscribe() }
  }, [userId])

  async function load() {
    const { data } = await supabase
      .from('friendships')
      .select('id, requester_id, created_at, requester:requester_id(id,username,display_name,full_name,avatar_color,avatar_url,profession)')
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    setRequests((data as unknown as FriendReq[]) ?? [])
    setLoaded(true)
  }

  async function accept(req: FriendReq) {
    setActing(req.id)
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', req.id)
    createNotification({ userId: req.requester_id, actorId: userId, type: 'friend_accepted' })
    setRequests(prev => prev.filter(r => r.id !== req.id))
    onCountChangeRef.current((n: number) => Math.max(0, n - 1))
    setActing(null)
  }

  async function decline(req: FriendReq) {
    setActing(req.id)
    await supabase.from('friendships').delete().eq('id', req.id)
    setRequests(prev => prev.filter(r => r.id !== req.id))
    onCountChangeRef.current((n: number) => Math.max(0, n - 1))
    setActing(null)
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{ position: 'relative', width: 40, height: 40, borderRadius: '50%', border: 'none', background: open ? '#dbeafe' : '#e4e6eb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.background = '#dbeafe' }}
        onMouseLeave={e => { e.currentTarget.style.background = open ? '#dbeafe' : '#e4e6eb' }}>
        <Users size={20} color={open ? '#2563eb' : '#65676b'} />
        {pendingCount > 0 && (
          <span style={{ position: 'absolute', top: 2, right: 2, background: '#ef4444', color: '#fff', borderRadius: '50%', minWidth: 17, height: 17, fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff', padding: '0 2px' }}>
            {pendingCount > 9 ? '9+' : pendingCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: 'fixed', top: 60, right: 100, width: 360, maxHeight: '82vh', background: '#fff', borderRadius: 12, boxShadow: '0 8px 40px rgba(0,0,0,0.22)', border: '1px solid #e4e6eb', zIndex: 500, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ padding: '14px 16px 10px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#050505' }}>Friend Requests</span>
            <a href="/feed" onClick={() => setOpen(false)}
              style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 600, color: '#65676b', textDecoration: 'none', padding: '4px 8px', borderRadius: 6 }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#f0f2f5' }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'none' }}>
              <ExternalLink size={12} /> See all
            </a>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 8px' }}>
            {!loaded && <div style={{ padding: '24px', textAlign: 'center' as const, color: '#94a3b8', fontSize: 13 }}>Loading…</div>}
            {loaded && requests.length === 0 && (
              <div style={{ padding: '40px 20px', textAlign: 'center' as const }}>
                <Users size={32} color="#d1d5db" style={{ margin: '0 auto 10px', display: 'block' }} />
                <div style={{ fontSize: 14, color: '#65676b' }}>No pending friend requests</div>
              </div>
            )}
            {requests.map(req => {
              const r = req.requester as any
              const name = r?.display_name || r?.full_name || r?.username || 'Someone'
              const initial = name[0].toUpperCase()
              const isActing = acting === req.id
              return (
                <div key={req.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 6px', borderRadius: 8 }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f8fafc' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}>
                  <a href={r?.username ? `/u/${r.username}` : '#'} onClick={() => setOpen(false)} style={{ flexShrink: 0, textDecoration: 'none' }}>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: AVATAR_COLORS[r?.avatar_color ?? 0], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#fff', overflow: 'hidden' }}>
                      {r?.avatar_url ? <img src={r.avatar_url} alt={initial} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initial}
                    </div>
                  </a>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <a href={r?.username ? `/u/${r.username}` : '#'} onClick={() => setOpen(false)} style={{ textDecoration: 'none' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#050505' }}>{name}</div>
                    </a>
                    {r?.profession && <div style={{ fontSize: 12, color: '#65676b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{r.profession}</div>}
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{timeAgo(req.created_at)}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      <button
                        onClick={() => accept(req)}
                        disabled={isActing}
                        style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', background: '#3b82f6', color: '#fff', fontSize: 13, fontWeight: 700, cursor: isActing ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                        onMouseEnter={e => { if (!isActing) e.currentTarget.style.background = '#2563eb' }}
                        onMouseLeave={e => { if (!isActing) e.currentTarget.style.background = '#3b82f6' }}>
                        <Check size={13} /> Confirm
                      </button>
                      <button
                        onClick={() => decline(req)}
                        disabled={isActing}
                        style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', background: '#e4e6eb', color: '#050505', fontSize: 13, fontWeight: 700, cursor: isActing ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                        onMouseEnter={e => { if (!isActing) e.currentTarget.style.background = '#d8dadf' }}
                        onMouseLeave={e => { if (!isActing) e.currentTarget.style.background = '#e4e6eb' }}>
                        <X size={13} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
