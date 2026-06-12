'use client'
import { useEffect, useCallback } from 'react'

export interface RecentItem {
  id: string        // unique key, e.g. 'ec2' or 'structural-ai'
  href: string
  label: string
  desc: string
  badge: string
  gradient: string  // CSS gradient string for card header
  accentColor: string
  visitedAt: number // Date.now()
}

const STORAGE_KEY = 'civilaxis_recents'
const MAX_ITEMS = 8

export function getRecents(): RecentItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as RecentItem[]
    return parsed.sort((a, b) => b.visitedAt - a.visitedAt).slice(0, MAX_ITEMS)
  } catch {
    return []
  }
}

export function recordRecent(item: Omit<RecentItem, 'visitedAt'>) {
  if (typeof window === 'undefined') return
  try {
    const existing = getRecents().filter(r => r.id !== item.id)
    const next: RecentItem[] = [{ ...item, visitedAt: Date.now() }, ...existing].slice(0, MAX_ITEMS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {}
}

export function useRecent(item: Omit<RecentItem, 'visitedAt'>) {
  useEffect(() => {
    recordRecent(item)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id])
}
