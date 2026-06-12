import { AVATAR_COLORS } from '../_lib/constants'

interface Props {
  displayName: string | null
  username: string | null
  avatarColor: number
  avatarUrl?: string | null
  size?: number
  fontSize?: number
}

export function AvatarCell({ displayName, username, avatarColor, avatarUrl, size = 30, fontSize = 11 }: Props) {
  const initials = (displayName || username || '?')[0].toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: AVATAR_COLORS[avatarColor ?? 0],
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize, fontWeight: 800, color: '#fff', flexShrink: 0,
    }}>
      {avatarUrl
        ? <img src={avatarUrl} alt={initials} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
        : initials}
    </div>
  )
}
