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
    // Read localStorage synchronously in the first effect tick, set locale,
    // then mark ready so children render with the correct locale from the start.
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null
    if (saved && saved in translations) setLocaleState(saved as Locale)
    setReady(true)

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
    syncDb()
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
