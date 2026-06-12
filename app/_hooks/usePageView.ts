'use client'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const SESSION_DURATION_MS = 60 * 60 * 1000 // 1 hour

export function usePageView(page: string) {
  useEffect(() => {
    const key = `pv_last_${page}`
    const last = localStorage.getItem(key)
    const now = Date.now()

    if (last && now - parseInt(last, 10) < SESSION_DURATION_MS) return

    localStorage.setItem(key, String(now))
    supabase.from('page_views').insert({ page }).then(() => {})
  }, [page])
}
