'use client'
import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import type { SubscriptionTier } from '../app/_types'

const TIER_RANK: Record<SubscriptionTier, number> = {
  normal: 0, pro: 1, premium: 2, admin: 3, main_admin: 4,
}

function meetsMin(userTier: SubscriptionTier, minTier: SubscriptionTier): boolean {
  return TIER_RANK[userTier] >= TIER_RANK[minTier]
}

export interface ToolAccess {
  canUse: boolean
  canViewDetails: boolean
  canExport: boolean
  canCopyDetails: boolean
}

export function useToolAccess(toolId: string, userId: string | null, userEmail?: string | null): ToolAccess {
  const tier = useSubscription(userId, userEmail)
  const [minTier, setMinTier] = useState<SubscriptionTier>('normal')
  const [detailsTier, setDetailsTier] = useState<SubscriptionTier>('pro')
  const [copyTier, setCopyTier] = useState<SubscriptionTier>('admin')

  useEffect(() => {
    supabase
      .from('tool_access')
      .select('min_tier, details_tier, copy_tier')
      .eq('tool_id', toolId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setMinTier((data.min_tier as SubscriptionTier) ?? 'normal')
          setDetailsTier((data.details_tier as SubscriptionTier) ?? 'pro')
          setCopyTier((data.copy_tier as SubscriptionTier) ?? 'admin')
        }
      })
  }, [toolId])

  return {
    canUse:         meetsMin(tier, minTier),
    canViewDetails: meetsMin(tier, detailsTier),
    canExport:      tier === 'premium' || tier === 'main_admin',
    canCopyDetails: meetsMin(tier, copyTier),
  }
}

const MAIN_ADMIN_EMAIL = 'tranvuong2832@gmail.com'

export function useSubscription(userId: string | null, userEmail?: string | null): SubscriptionTier {
  const [tier, setTier] = useState<SubscriptionTier>('normal')

  useEffect(() => {
    if (!userId) { setTier('normal'); return }
    if (userEmail === MAIN_ADMIN_EMAIL) { setTier('main_admin'); return }

    supabase
      .from('subscriptions')
      .select('tier, expires_at')
      .eq('user_id', userId)
      .order('granted_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) { setTier('normal'); return }
        const expired = data.expires_at && new Date(data.expires_at) < new Date()
        setTier(expired ? 'normal' : (data.tier as SubscriptionTier))
      })
  }, [userId, userEmail])

  return tier
}

export function tierLabel(tier: SubscriptionTier): string {
  switch (tier) {
    case 'main_admin': return 'Main Admin'
    case 'admin':      return 'Admin'
    case 'premium':    return 'Premium'
    case 'pro':        return 'Pro'
    default:           return 'Normal'
  }
}

export function tierColor(tier: SubscriptionTier): string {
  switch (tier) {
    case 'main_admin': return '#ef4444'
    case 'admin':      return '#f97316'
    case 'premium':    return '#8b5cf6'
    case 'pro':        return '#3b82f6'
    default:           return '#64748b'
  }
}

export function tierBg(tier: SubscriptionTier): string {
  switch (tier) {
    case 'main_admin': return '#fef2f2'
    case 'admin':      return '#fff7ed'
    case 'premium':    return '#f5f3ff'
    case 'pro':        return '#eff6ff'
    default:           return '#f1f5f9'
  }
}
