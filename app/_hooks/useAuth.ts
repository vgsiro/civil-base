'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { signUpWithProfile } from '../_lib/auth'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      // Keep email in sync on profiles whenever user signs in
      if (session?.user?.email) {
        supabase.from('profiles').update({ email: session.user.email }).eq('id', session.user.id)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string) {
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
