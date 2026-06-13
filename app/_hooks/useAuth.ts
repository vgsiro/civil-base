'use client'
import { useEffect, useState } from 'react'
import { supabase, setRememberMe } from '@/lib/supabase'
import { signUpWithProfile, ensureProfile } from '../_lib/auth'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      const su = session?.user
      if (su) {
        // First confirmed login: create the profile row if it doesn't exist yet.
        if (event === 'SIGNED_IN') ensureProfile(su.id, su.email ?? undefined)
        // Keep email in sync on profiles whenever the user signs in.
        if (su.email) supabase.from('profiles').update({ email: su.email }).eq('id', su.id)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string, remember: boolean = true) {
    setRememberMe(remember)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error
  }

  async function signUp(email: string, password: string) {
    return signUpWithProfile(email, password)
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return { user, loading, signIn, signUp, signOut }
}
