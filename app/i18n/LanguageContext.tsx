'use client'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { translations, type Locale, type TranslationKey } from './index'

const STORAGE_KEY = 'civilbase_locale'

interface LanguageContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: 'en',
  setLocale: () => {},
  t: (key) => translations.en[key],
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null

    if (saved && saved in translations) {
      // User has an explicit saved preference — use it, skip all detection.
      setLocaleState(saved as Locale)
      setReady(true)
      syncDb()
      return
    }

    // No saved preference: detect from browser language then IP geo.
    async function detectAndInit() {
      let detected: Locale | null = null

      // 1. Browser language (instant, no network)
      const browserLang = navigator.language?.toLowerCase() ?? ''
      if (browserLang.startsWith('vi')) detected = 'vi'

      // 2. IP geo via Vercel header (only if browser gave no signal)
      if (!detected) {
        try {
          const res = await fetch('/api/locale-hint')
          if (res.ok) {
            const { locale } = await res.json()
            if (locale && locale in translations) detected = locale as Locale
          }
        } catch {
          // network error — stay with default
        }
      }

      if (detected) {
        setLocaleState(detected)
        // Don't persist to localStorage — let the user make an explicit choice
      }
      setReady(true)
      syncDb()
    }

    detectAndInit()

    async function syncDb() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return
      const { data: profile } = await supabase
        .from('profiles')
        .select('preferred_locale')
        .eq('id', session.user.id)
        .single()
      const dbLocale = profile?.preferred_locale as Locale | null
      if (dbLocale && dbLocale in translations) {
        setLocaleState(dbLocale as Locale)
        localStorage.setItem(STORAGE_KEY, dbLocale)
      }
    }
  }, [])

  const setLocale = useCallback(async (l: Locale) => {
    setLocaleState(l)
    localStorage.setItem(STORAGE_KEY, l)
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      await supabase
        .from('profiles')
        .update({ preferred_locale: l })
        .eq('id', session.user.id)
    }
  }, [])

  const t = useCallback((key: TranslationKey): string => {
    return translations[locale][key] ?? translations.en[key] ?? key
  }, [locale])

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t])

  if (!ready) return null

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  return useContext(LanguageContext)
}
