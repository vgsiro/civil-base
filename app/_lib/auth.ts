import { supabase } from '@/lib/supabase'

async function generateUniqueUsername(): Promise<string> {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  for (let attempt = 0; attempt < 10; attempt++) {
    const suffix = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    const candidate = `user_${suffix}`
    const { data } = await supabase.from('profiles').select('id').eq('username', candidate).maybeSingle()
    if (!data) return candidate
  }
  return `user_${Date.now().toString(36)}`
}

export async function signUpWithProfile(email: string, password: string) {
  const { error, data } = await supabase.auth.signUp({ email, password })
  if (!error && data.user) {
    const username = await generateUniqueUsername()
    const displayName = email.split('@')[0]
    await supabase.from('profiles').upsert({
      id: data.user.id,
      email,
      username,
      display_name: displayName,
      is_verified: false,
      is_banned: false,
    }, { onConflict: 'id' })
  }
  return error
}
