#!/usr/bin/env node
/**
 * Guard against the client-clock-skew bug class.
 *
 * A client-generated timestamp (new Date()) written to the DB and later compared against a
 * server-generated one (e.g. messages.created_at) breaks when the browser clock lags the
 * server: boundary comparisons (.gt/.lt/.order on that column) silently include/exclude the
 * wrong rows. Fix by letting the DB own the value (default now(), a trigger, or an RPC that
 * returns now()).
 *
 * This script flags `new Date().toISOString()` (and `Date.now()` ISO variants) that appear in
 * the same statement as a Supabase .insert(/.update( call. Optimistic-UI placeholders and
 * display-only dates are NOT written to the DB and so won't match an insert/update on the
 * same line; if a real case is intentional, add `// ts-ok` on that line to whitelist it.
 *
 * Usage: node scripts/check-client-timestamps.mjs
 * Exits non-zero if any unwhitelisted match is found.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'app')
const EXTS = new Set(['.ts', '.tsx', '.js', '.jsx'])
const CLIENT_TS = /new Date\(\)\.toISOString\(\)/
const DB_WRITE = /\.(insert|update|upsert)\s*\(/

/** @type {{file: string, line: number, text: string}[]} */
const hits = []

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const s = statSync(p)
    if (s.isDirectory()) { walk(p); continue }
    if (!EXTS.has(extname(p))) continue
    const lines = readFileSync(p, 'utf8').split('\n')
    lines.forEach((text, i) => {
      if (text.includes('ts-ok')) return
      if (CLIENT_TS.test(text) && DB_WRITE.test(text)) {
        hits.push({ file: p, line: i + 1, text: text.trim() })
      }
    })
  }
}

walk(ROOT)

if (hits.length > 0) {
  console.error('\n✖ Client timestamp written to the DB (clock-skew risk):\n')
  for (const h of hits) {
    console.error(`  ${h.file}:${h.line}`)
    console.error(`    ${h.text}`)
  }
  console.error('\nLet the DB own the timestamp (default now() / trigger / RPC returning now()).')
  console.error('If this write is genuinely safe (never compared to a server timestamp), add `// ts-ok` on the line.\n')
  process.exit(1)
}

console.log('✓ No client timestamps written to the DB on insert/update.')
