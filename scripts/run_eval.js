/**
 * Phase 5d — Evaluation runner
 *
 * Runs every eval_case through the structural chat pipeline and scores:
 *   - clause_cited: did the answer mention an expected clause?
 *   - verdict_match: does the computed verdict match expected verdict?
 *   - utilisation_ok: is utilisation within ±5% of expected?
 *
 * Usage:
 *   node scripts/run_eval.js
 *
 * Requires env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Runs the chat API locally — start the dev server first (npm run dev).
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const BASE_URL = process.env.EVAL_BASE_URL || 'http://localhost:3000'

async function callStructuralChat(question) {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, scope: 'structural' }),
  })

  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  let answer = ''
  let calcResults = []

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      try {
        const data = JSON.parse(line.slice(6))
        if (data.text) answer += data.text
        if (data.finalAnswer) answer = data.finalAnswer
        if (data.calcResults) calcResults = data.calcResults
      } catch {}
    }
  }

  return { answer, calcResults }
}

function score(evalCase, answer, calcResults) {
  const expected = evalCase.expected || {}
  const scores = {}

  // Clause citation check
  if (expected.clauses && expected.clauses.length > 0) {
    scores.clause_cited = expected.clauses.some(c =>
      answer.toLowerCase().includes(c.toLowerCase())
    )
  }

  // Verdict check
  if (expected.verdict) {
    const result = calcResults.find(r => r.verdict)
    scores.verdict_match = result?.verdict === expected.verdict
  }

  // Utilisation check (within ±5%)
  if (expected.utilisation != null) {
    const result = calcResults.find(r => r.utilisation != null)
    if (result) {
      const diff = Math.abs(result.utilisation - expected.utilisation)
      scores.utilisation_ok = diff <= 0.05
    }
  }

  const passed = Object.values(scores).filter(Boolean).length
  const total = Object.keys(scores).length
  return { scores, passed, total }
}

async function main() {
  const { data: cases } = await supabase
    .from('eval_cases')
    .select('*')
    .eq('scope', 'structural')
    .order('id')

  if (!cases || cases.length === 0) {
    console.log('No eval cases found. Add rows to the eval_cases table first.')
    return
  }

  console.log(`Running ${cases.length} eval cases against ${BASE_URL}...\n`)

  let totalPassed = 0
  let totalChecks = 0

  for (const ec of cases) {
    process.stdout.write(`[${ec.id}] ${ec.question.slice(0, 60)}... `)
    try {
      const { answer, calcResults } = await callStructuralChat(ec.question)
      const { scores, passed, total } = score(ec, answer, calcResults)
      totalPassed += passed
      totalChecks += total
      const tag = total === 0 ? '(no checks)' : passed === total ? 'PASS' : `FAIL (${passed}/${total})`
      console.log(tag)
      if (Object.keys(scores).length > 0) {
        for (const [k, v] of Object.entries(scores)) {
          console.log(`    ${v ? '✓' : '✗'} ${k}`)
        }
      }
    } catch (e) {
      console.log(`ERROR: ${e.message}`)
    }
    // Avoid rate limiting
    await new Promise(r => setTimeout(r, 1500))
  }

  if (totalChecks > 0) {
    const pct = ((totalPassed / totalChecks) * 100).toFixed(1)
    console.log(`\nOverall: ${totalPassed}/${totalChecks} checks passed (${pct}%)`)
  } else {
    console.log('\nNo scorable checks (add expected clauses/verdicts to eval_cases.expected).')
  }
}

main().catch(e => { console.error(e); process.exit(1) })
