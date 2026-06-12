import { NextRequest, NextResponse } from 'next/server'
import type { Locale } from '@/app/i18n'

// Map Vercel's ISO-3166-1 alpha-2 country codes to supported locales.
// Only list non-English countries; everything else falls back to 'en'.
const COUNTRY_LOCALE: Record<string, Locale> = {
  VN: 'vi',
}

export const dynamic = 'force-dynamic'

export function GET(req: NextRequest) {
  const country = req.headers.get('x-vercel-ip-country') ?? ''
  const locale: Locale = COUNTRY_LOCALE[country.toUpperCase()] ?? 'en'
  return NextResponse.json({ locale, country })
}
