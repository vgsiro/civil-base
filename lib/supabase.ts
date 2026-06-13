import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ── "Remember me" storage adapter ────────────────────────────────────────────
// Supabase fixes its auth storage backend at client-creation time, so to honour a
// per-login "remember me" choice we route reads/writes to either localStorage
// (persists across browser restarts) or sessionStorage (cleared on browser close)
// based on a small flag. signIn sets the flag *before* signInWithPassword so the
// first token write lands in the right backend.
const REMEMBER_FLAG = 'civilaxis_remember'

/** Record the user's "remember me" choice. Call before signing in. */
export function setRememberMe(remember: boolean) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(REMEMBER_FLAG, remember ? '1' : '0')
  } catch {}
}

function rememberChosen(): boolean {
  if (typeof window === 'undefined') return true
  try {
    // Default to remembered (matches prior behaviour) unless explicitly set to '0'.
    return window.localStorage.getItem(REMEMBER_FLAG) !== '0'
  } catch {
    return true
  }
}

// Storage that follows the remember flag. On write it clears the *other* backend
// so a stale token can't linger and resurrect a session after browser close.
const rememberAwareStorage = {
  getItem(key: string): string | null {
    if (typeof window === 'undefined') return null
    const primary = rememberChosen() ? window.localStorage : window.sessionStorage
    const fallback = rememberChosen() ? window.sessionStorage : window.localStorage
    try {
      return primary.getItem(key) ?? fallback.getItem(key)
    } catch {
      return null
    }
  },
  setItem(key: string, value: string): void {
    if (typeof window === 'undefined') return
    const remember = rememberChosen()
    try {
      if (remember) {
        window.localStorage.setItem(key, value)
        window.sessionStorage.removeItem(key)
      } else {
        window.sessionStorage.setItem(key, value)
        window.localStorage.removeItem(key)
      }
    } catch {}
  },
  removeItem(key: string): void {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.removeItem(key)
      window.sessionStorage.removeItem(key)
    } catch {}
  },
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? rememberAwareStorage : undefined,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
})
