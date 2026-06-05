'use client'
import { UserPlus, UserMinus } from 'lucide-react'
import type { Profile } from '../types'

const AVATAR_COLORS = [
  'linear-gradient(135deg, #3b82f6, #8b5cf6)',
  'linear-gradient(135deg, #10b981, #3b82f6)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #ec4899, #8b5cf6)',
  'linear-gradient(135deg, #06b6d4, #10b981)',
  'linear-gradient(135deg, #f97316, #f59e0b)',
]

interface UserCardProps {
  profile: Profile
  isFollowing: boolean
  onFollowToggle: (profileId: string, isFollowing: boolean) => void
  currentUserId: string | null
}

export default function UserCard({ profile, isFollowing, onFollowToggle, currentUserId }: UserCardProps) {
  const initial = (profile.display_name || profile.full_name || profile.username)[0].toUpperCase()

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
      <a href={`/u/${profile.username}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: AVATAR_COLORS[profile.avatar_color ?? 0], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff' }}>
          {initial}
        </div>
      </a>
      <div style={{ flex: 1, minWidth: 0 }}>
        <a href={`/u/${profile.username}`} style={{ textDecoration: 'none' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}
            onMouseEnter={e => ((e.target as HTMLElement).style.color = '#3b82f6')}
            onMouseLeave={e => ((e.target as HTMLElement).style.color = '#0f172a')}>
            {profile.display_name || profile.full_name || profile.username}
          </div>
        </a>
        {profile.profession && (
          <div style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.profession}</div>
        )}
      </div>
      {currentUserId && currentUserId !== profile.id && (
        <button onClick={() => onFollowToggle(profile.id, isFollowing)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 20, border: `1px solid ${isFollowing ? '#e2e8f0' : '#3b82f6'}`, background: isFollowing ? '#f8fafc' : '#eff6ff', color: isFollowing ? '#64748b' : '#3b82f6', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.8' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}>
          {isFollowing ? <><UserMinus size={12} /> Unfollow</> : <><UserPlus size={12} /> Add friend</>}
        </button>
      )}
    </div>
  )
}
