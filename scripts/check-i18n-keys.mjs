#!/usr/bin/env node
/**
 * Guard i18n key parity across locales.
 *
 * English (locales/en) is the reference — it must define every key. Every other locale must
 * define EXACTLY the same set of keys: no missing keys (which silently fall back to English on
 * screen) and no stray/renamed keys (a typo'd key is dead weight that never renders). This
 * catches the two hand-editing mistakes the translation files are prone to.
 *
 * It reads each namespace file in each locale folder and extracts the top-level `key:` names.
 * The locale files are flat `key: 'value'` objects, so a line-based scan is reliable. (No TS
 * runtime needed, so no extra dependency.)
 *
 * Usage: node scripts/check-i18n-keys.mjs   (exits non-zero on any mismatch)
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const LOCALES_DIR = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'app', 'i18n', 'locales')
const REFERENCE = 'en'
// Matches a top-level translation key:  someKey: 'value'  /  some_key: "value"
const KEY_RE = /^\s{2}([a-zA-Z0-9_]+)\s*:/

/** Read all `key:` names from a namespace file. */
function keysInFile(path) {
  const keys = new Set()
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(KEY_RE)
    if (m) keys.add(m[1])
  }
  return keys
}

/** Map of namespace filename -> Set of keys, for one locale folder (recurses into subdirs). */
function keysByNamespace(locale) {
  const out = new Map()
  function scan(dir, prefix) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        scan(join(dir, entry.name), prefix ? `${prefix}/${entry.name}` : entry.name)
      } else if (entry.name.endsWith('.ts') && entry.name !== 'index.ts') {
        const ns = prefix ? `${prefix}/${entry.name}` : entry.name
        out.set(ns, keysInFile(join(dir, entry.name)))
      }
    }
  }
  scan(join(LOCALES_DIR, locale), '')
  return out
}

const locales = readdirSync(LOCALES_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory()).map(d => d.name)

if (!locales.includes(REFERENCE)) {
  console.error(`✖ Reference locale "${REFERENCE}" not found in ${LOCALES_DIR}`)
  process.exit(1)
}

const reference = keysByNamespace(REFERENCE)
const problems = []

for (const locale of locales) {
  if (locale === REFERENCE) continue
  const theirs = keysByNamespace(locale)

  for (const [ns, refKeys] of reference) {
    const localeKeys = theirs.get(ns)
    if (!localeKeys) { problems.push(`${locale}: missing namespace file "${ns}"`); continue }
    for (const k of refKeys) if (!localeKeys.has(k)) problems.push(`${locale}/${ns}: missing key "${k}"`)
    for (const k of localeKeys) if (!refKeys.has(k)) problems.push(`${locale}/${ns}: extra key "${k}" (not in ${REFERENCE})`)
  }
  for (const ns of theirs.keys()) {
    if (!reference.has(ns)) problems.push(`${locale}: extra namespace file "${ns}" (not in ${REFERENCE})`)
  }
}

if (problems.length > 0) {
  console.error('\n✖ i18n key mismatch (every locale must mirror the English keys):\n')
  for (const p of problems) console.error(`  ${p}`)
  console.error(`\nFix: make each locale's keys identical to ${REFERENCE}/. Translate the VALUE, never rename the KEY.\n`)
  process.exit(1)
}

const total = [...reference.values()].reduce((n, s) => n + s.size, 0)
console.log(`✓ i18n keys in sync across ${locales.length} locales (${total} keys each).`)
