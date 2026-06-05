'use client'
import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from '../i18n/LanguageContext'

export const AVATAR_COLORS = [
  'linear-gradient(135deg, #3b82f6, #8b5cf6)',
  'linear-gradient(135deg, #10b981, #3b82f6)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #ec4899, #8b5cf6)',
  'linear-gradient(135deg, #06b6d4, #10b981)',
  'linear-gradient(135deg, #f97316, #f59e0b)',
]

interface TimeLabels {
  justNow?: string
  mAgo?: string
  hAgo?: string
  dAgo?: string
  dateLocale?: string
}

export function timeAgo(d: string, labels: TimeLabels = {}) {
  const { justNow = 'Just now', mAgo = 'm ago', hAgo = 'h ago', dAgo = 'd ago', dateLocale = 'en-AU' } = labels
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (m < 1) return justNow
  if (m < 60) return `${m}${mAgo}`
  if (m < 1440) return `${Math.floor(m / 60)}${hAgo}`
  if (m < 10080) return `${Math.floor(m / 1440)}${dAgo}`
  return new Date(d).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' })
}

export function fullTime(d: string, dateLocale = 'en-AU') {
  return new Date(d).toLocaleString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function useTimeLabels(): TimeLabels {
  const { t } = useTranslation()
  return {
    justNow: t('time_just_now'),
    mAgo: t('time_minutes_ago'),
    hAgo: t('time_hours_ago'),
    dAgo: t('time_days_ago'),
    dateLocale: t('date_locale'),
  }
}

export function Avatar({ name, colorIndex, size = 36, photoUrl }: { name: string | null; colorIndex: number; size?: number; photoUrl?: string | null }) {
  const initial = (name || '?')[0].toUpperCase()
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: AVATAR_COLORS[colorIndex ?? 0], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 800, color: '#fff', flexShrink: 0, overflow: 'hidden' }}>
      {photoUrl ? <img src={photoUrl} alt={initial} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initial}
    </div>
  )
}

export function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 1 }}>
        <X size={20} color="#fff" />
      </button>
      <img src={src} alt="" onClick={e => e.stopPropagation()}
        style={{ maxWidth: '92vw', maxHeight: '92vh', objectFit: 'contain', borderRadius: 8, boxShadow: '0 8px 60px rgba(0,0,0,0.6)', display: 'block' }} />
    </div>
  )
}
