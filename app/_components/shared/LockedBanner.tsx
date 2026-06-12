'use client'
import { useState } from 'react'
import { Lock } from 'lucide-react'
import type { SubscriptionTier } from '../../_types'
import { UpgradeRequestModal } from './UpgradeRequestModal'

interface Props {
  requiredTier: 'pro' | 'premium'
  message?: string
}

const UPGRADE_LABELS: Record<'pro' | 'premium', { label: string; color: string; bg: string; border: string }> = {
  pro:     { label: 'Pro',     color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  premium: { label: 'Premium', color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' },
}

export function LockedBanner({ requiredTier, message }: Props) {
  const meta = UPGRADE_LABELS[requiredTier]
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      {showModal && (
        <UpgradeRequestModal defaultTier={requiredTier} onClose={() => setShowModal(false)} />
      )}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: meta.bg, border: `1.5px solid ${meta.border}`,
        borderRadius: 10, padding: '12px 16px',
      }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Lock size={15} color="#fff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
            {message ?? `Upgrade to ${meta.label} to unlock this section`}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            Click the <strong style={{ color: meta.color }}>{meta.label}</strong> button to send an upgrade request.
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            flexShrink: 0, fontSize: 11, fontWeight: 700,
            color: meta.color, background: '#fff',
            border: `1px solid ${meta.border}`, borderRadius: 6,
            padding: '5px 12px', cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = meta.bg; e.currentTarget.style.boxShadow = `0 2px 8px ${meta.color}30` }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = 'none' }}
        >
          {meta.label} ↑
        </button>
      </div>
    </>
  )
}

export function canViewDetails(tier: SubscriptionTier): boolean {
  return tier === 'pro' || tier === 'premium' || tier === 'admin' || tier === 'main_admin'
}

export function canExport(tier: SubscriptionTier): boolean {
  return tier === 'premium' || tier === 'main_admin'
}
