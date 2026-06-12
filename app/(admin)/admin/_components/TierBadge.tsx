import { tierColor, tierBg, tierLabel } from '../../../../lib/useSubscription'
import type { SubscriptionTier } from '../../../_types'

interface Props {
  tier: SubscriptionTier
  expired?: boolean
}

export function TierBadge({ tier, expired }: Props) {
  if (tier === 'main_admin') {
    return (
      <span style={{
        fontSize: 11, fontWeight: 800, color: '#fbbf24',
        background: 'linear-gradient(135deg,#78350f33,#92400e33)',
        padding: '2px 10px', borderRadius: 20,
        border: '1px solid #f59e0b60', letterSpacing: '0.04em',
      }}>
        ★ Owner
      </span>
    )
  }

  const t = tier as Exclude<SubscriptionTier, 'main_admin'>
  return (
    <span style={{
      fontSize: 11, fontWeight: 700,
      color: expired ? '#475569' : tierColor(t),
      background: expired ? 'transparent' : tierBg(t) + '33',
      padding: '2px 10px', borderRadius: 20,
      border: `1px solid ${expired ? '#334155' : tierColor(t) + '40'}`,
      opacity: expired ? 0.5 : 1,
    }}>
      {expired ? 'expired' : tierLabel(t)}
    </span>
  )
}
