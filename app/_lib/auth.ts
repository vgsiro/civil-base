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

// Returned when client-side email validation fails, so the modal can show a
// localized message instead of a raw Supabase error.
export type EmailValidationReason = 'format' | 'domain' | 'disposable'
export class EmailValidationError extends Error {
  reason: EmailValidationReason
  constructor(reason: EmailValidationReason) {
    super(`email_invalid:${reason}`)
    this.reason = reason
    this.name = 'EmailValidationError'
  }
}

async function validateEmailExists(email: string): Promise<EmailValidationReason | null> {
  try {
    const res = await fetch('/api/validate-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    if (!res.ok) return null // network/route issue — don't block signup
    const data = (await res.json()) as { valid: boolean; reason?: EmailValidationReason }
    return data.valid ? null : (data.reason ?? 'format')
  } catch {
    return null // offline / fetch failure — fail open rather than block legit users
  }
}

export async function signUpWithProfile(email: string, password: string) {
  const invalid = await validateEmailExists(email)
  if (invalid) return new EmailValidationError(invalid)

  // With "Confirm email" enabled, signUp sends a confirmation link and the
  // account stays unconfirmed (cannot log in) until clicked. The profile row is
  // NOT created here — it's created on first confirmed login (see ensureProfile)
  // so unconfirmed/fake-email signups don't leave orphan rows.
  // Return the user to the exact page they signed up from (origin + path, no
  // query/hash — Supabase appends its own auth params).
  const redirectTo = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}`
    : undefined
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: redirectTo },
  })
  return error
}

// Creates the profile row for a freshly-confirmed user if it doesn't exist yet.
// Idempotent — safe to call on every login. Returns silently on any error so it
// never blocks the auth flow.
export async function ensureProfile(userId: string, email: string | undefined) {
  try {
    const { data: existing } = await supabase
      .from('profiles').select('id').eq('id', userId).maybeSingle()
    if (existing) return
    const username = await generateUniqueUsername()
    const displayName = (email ?? '').split('@')[0] || username
    await supabase.from('profiles').upsert({
      id: userId,
      email: email ?? null,
      username,
      display_name: displayName,
      is_verified: false,
      is_banned: false,
    }, { onConflict: 'id' })
  } catch {
    // swallow — profile can also be created via the /u/setup flow
  }
}
