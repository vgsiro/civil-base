#!/usr/bin/env node
/**
 * Guard against parent-seeded nav badge counts.
 *
 * NotificationDropdown and FriendRequestDropdown self-seed their own unread/pending counts on
 * mount (and keep them live via realtime). Pages must NOT also query those counts and push them
 * down — that's how the bell/people badges drifted out of sync between nav bars: some pages
 * seeded them, some didn't. The dropdown is the single source of truth.
 *
 * This flags a page that pairs a notifications/friendships COUNT query with a setUnreadNotifs(/
 * setPendingFriends( call. Both halves on the same line, or a count query within a few lines of
 * the setter, is the signature. If a use is genuinely intentional, add `// badge-ok` on the line.
 *
 * Usage: node scripts/check-badge-seeding.mjs   (exits non-zero on a match)
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'app')
// The dropdown components themselves legitimately query these counts to self-seed.
const ALLOW = ['NotificationDropdown', 'FriendRequestDropdown']
const EXTS = new Set(['.ts', '.tsx', '.js', '.jsx'])

const NOTIF_COUNT  = /from\(['"]notifications['"]\)[\s\S]{0,120}?count:\s*['"]exact['"]/
const FRIEND_COUNT = /from\(['"]friendships['"]\)[\s\S]{0,160}?count:\s*['"]exact['"]/
const SET_NOTIF  = /setUnreadNotifs\(/
const SET_FRIEND = /setPendingFriends\(/

/** @type {{file: string, kind: string}[]} */
const hits = []

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const s = statSync(p)
    if (s.isDirectory()) { walk(p); continue }
    if (!EXTS.has(extname(p))) continue
    if (ALLOW.some(a => p.includes(a))) continue
    const src = readFileSync(p, 'utf8')
    if (src.includes('badge-ok')) continue
    // Whole-file check: a count query AND the matching setter both present = parent seeding.
    if (NOTIF_COUNT.test(src) && SET_NOTIF.test(src)) hits.push({ file: p, kind: 'notification' })
    if (FRIEND_COUNT.test(src) && SET_FRIEND.test(src)) hits.push({ file: p, kind: 'friend-request' })
  }
}

walk(ROOT)

if (hits.length > 0) {
  console.error('\n✖ Parent-seeded nav badge count (drifts out of sync between nav bars):\n')
  for (const h of hits) console.error(`  ${h.file}  (${h.kind})`)
  console.error('\nThe dropdown self-seeds its own count — remove the parent count query + setter.')
  console.error('If this is genuinely intentional, add `// badge-ok` somewhere in the file.\n')
  process.exit(1)
}

console.log('✓ No parent-seeded nav badge counts.')
