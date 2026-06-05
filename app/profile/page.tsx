'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

// /profile is now just a smart redirect.
// → Has username  : go to /u/[username]
// → No username   : go to /u/setup  (first-time username picker)
// → Not logged in : go to /
export default function ProfileRedirect() {
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/'); return }
      const { data } = await supabase
        .from('profiles').select('username').eq('id', user.id).maybeSingle()
      if (data?.username) {
        router.replace(`/u/${data.username}`)
      } else {
        router.replace('/u/setup')
      }
    })
  }, [router])

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: 14, color: '#65676b' }}>Redirecting…</div>
    </div>
  )
}
