import type { RangeMode } from './types'

export const ADMIN_EMAIL = 'tranvuong2832@gmail.com'

export const AVATAR_COLORS = [
  'linear-gradient(135deg, #3b82f6, #8b5cf6)',
  'linear-gradient(135deg, #10b981, #3b82f6)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #ec4899, #8b5cf6)',
  'linear-gradient(135deg, #06b6d4, #10b981)',
  'linear-gradient(135deg, #f97316, #f59e0b)',
]

export function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  if (m < 1440) return `${Math.floor(m / 60)}h ago`
  if (m < 10080) return `${Math.floor(m / 1440)}d ago`
  return new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function getRangeSince(range: RangeMode): string | null {
  if (range.type === 'all') return null
  if (range.type === 'custom') return new Date(range.from).toISOString()
  const d = new Date()
  d.setDate(d.getDate() - range.days)
  return d.toISOString()
}

export function getRangeTo(range: RangeMode): string | null {
  if (range.type === 'custom') return new Date(range.to + 'T23:59:59').toISOString()
  return null
}

export function rangeLabel(range: RangeMode): string {
  if (range.type === 'all') return 'All time'
  if (range.type === 'preset') return range.label
  return `${range.from} → ${range.to}`
}
