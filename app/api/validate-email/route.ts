import { NextRequest, NextResponse } from 'next/server'
import { resolveMx } from 'dns/promises'

// DNS lookups need the Node runtime (not Edge).
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// RFC-pragmatic email format check — good enough to reject typos like foo@@bar.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Common disposable / temp-mail domains. Extend as needed.
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.info', 'guerrillamail.biz',
  '10minutemail.com', '10minutemail.net', 'tempmail.com', 'temp-mail.org',
  'throwawaymail.com', 'yopmail.com', 'getnada.com', 'maildrop.cc',
  'dispostable.com', 'trashmail.com', 'sharklasers.com', 'spam4.me',
  'mailnesia.com', 'mintemail.com', 'mohmal.com', 'fakeinbox.com',
  'emailondeck.com', 'tempinbox.com', 'mailcatch.com', 'inboxalias.com',
  'mytemp.email', 'tempr.email', 'discard.email', 'spambox.us',
  'maileater.com', 'spamgourmet.com', 'jetable.org', 'tempmailo.com',
  'burnermail.io', 'temp-mail.io', '33mail.com', 'moakt.com',
  'tmail.ws', 'tmpmail.org', 'luxusmail.org', 'minuteinbox.com',
])

type Reason = 'format' | 'domain' | 'disposable'

export async function POST(req: NextRequest) {
  let email = ''
  try {
    const body = await req.json()
    email = String(body?.email ?? '').trim().toLowerCase()
  } catch {
    return NextResponse.json({ valid: false, reason: 'format' as Reason })
  }

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ valid: false, reason: 'format' as Reason })
  }

  const domain = email.split('@')[1]
  if (!domain) {
    return NextResponse.json({ valid: false, reason: 'format' as Reason })
  }

  if (DISPOSABLE_DOMAINS.has(domain)) {
    return NextResponse.json({ valid: false, reason: 'disposable' as Reason })
  }

  // Verify the domain can actually receive mail (has MX records).
  // Only treat a definitive "no mail servers" answer as invalid. Any other DNS
  // failure (server can't reach DNS, timeout, refused) fails OPEN — we let the
  // address through rather than wrongly rejecting real emails like gmail.com in
  // environments where outbound DNS is restricted.
  try {
    const records = await resolveMx(domain)
    if (!records || records.length === 0) {
      // Domain resolved but has no MX — fall back to A/AAAA (RFC 5321 allows
      // mail to a host with only an address record).
      return NextResponse.json({ valid: false, reason: 'domain' as Reason })
    }
  } catch (err: any) {
    const code = err?.code
    if (code === 'ENOTFOUND' || code === 'ENODATA') {
      // Authoritative answer: this domain genuinely has no mail servers.
      return NextResponse.json({ valid: false, reason: 'domain' as Reason })
    }
    // ECONNREFUSED / ETIMEOUT / EAI_AGAIN / etc. — DNS itself is unreachable.
    // Don't penalise the user; let the email through.
    return NextResponse.json({ valid: true, skipped: 'dns_unavailable' })
  }

  return NextResponse.json({ valid: true })
}
