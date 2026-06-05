import enCommon from './locales/en/common'
import enFeed from './locales/en/feed'
import enProfile from './locales/en/profile'
import enSetup from './locales/en/setup'
import enPostcard from './locales/en/postcard'
import enNotifications from './locales/en/notifications'
import enStandards from './locales/en/standards'

import viCommon from './locales/vi/common'
import viFeed from './locales/vi/feed'
import viProfile from './locales/vi/profile'
import viSetup from './locales/vi/setup'
import viPostcard from './locales/vi/postcard'
import viNotifications from './locales/vi/notifications'
import viStandards from './locales/vi/standards'

export type Locale = 'en' | 'vi'

export const translations = {
  en: { ...enCommon, ...enFeed, ...enProfile, ...enSetup, ...enPostcard, ...enNotifications, ...enStandards },
  vi: { ...viCommon, ...viFeed, ...viProfile, ...viSetup, ...viPostcard, ...viNotifications, ...viStandards },
}

export type TranslationKey = keyof typeof translations.en
