import en from './locales/en'
import vi from './locales/vi'

// ── Registry ─────────────────────────────────────────────────────────────────
// To add a language: create app/i18n/locales/<code>/ (copy the en/ folder, translate the
// files), then add ONE import above and ONE entry in `translations` + `LANGUAGE_OPTIONS`
// below. Nothing else in the codebase needs to change — Locale is derived from this object.
export const translations = { en, vi }

export type Locale = keyof typeof translations
// Keys come from English (the complete reference); every other locale should mirror them.
export type TranslationKey = keyof typeof en

// Single source of truth for the language switcher (used by AccountMenu, EditModal, …).
export const LANGUAGE_OPTIONS: { value: Locale; label: string; code: string }[] = [
  { value: 'en', label: 'English',    code: 'EN' },
  { value: 'vi', label: 'Tiếng Việt', code: 'VN' },
]
