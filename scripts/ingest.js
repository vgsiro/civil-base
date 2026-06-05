/**
 * Phase 5e — Ingestion pipeline for structural standard PDFs
 *
 * Usage:
 *   node scripts/ingest.js \
 *     --file path/to/EN_1993-1-1.pdf \
 *     --code "EN 1993-1-1" \
 *     --edition "2005+A1:2014" \
 *     --family eurocode \
 *     --topic steel \
 *     --pdf-id <existing_pdfs.id>   (optional — links to existing pdfs row)
 *
 * Requires env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY
 *
 * Install extra deps first:
 *   npm install pdf-parse dotenv
 */

import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import pdfParse from 'pdf-parse'
import { readFileSync } from 'fs'
import { parseArgs } from 'util'
import 'dotenv/config'

const { values: args } = parseArgs({
  options: {
    file:    { type: 'string' },
    code:    { type: 'string' },
    edition: { type: 'string' },
    family:  { type: 'string', default: 'eurocode' },
    topic:   { type: 'string', default: '' },
    'pdf-id': { type: 'string' },
  },
})

if (!args.file || !args.code || !args.edition) {
  console.error('Usage: node scripts/ingest.js --file <path> --code <ref> --edition <year>')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY   // needs service role to bypass RLS
)

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// ── Clause-aware chunker ─────────────────────────────────────────────────────
// Splits on common structural-code section headings: "6.2.5", "Table 3.1", "Annex A"
function chunkByClause(text) {
  const clausePattern = /(?=^(?:\d+(?:\.\d+)+|Table\s+\d+(?:\.\d+)*|Annex\s+[A-Z])[\s\t])/m
  const rawChunks = text.split(clausePattern).map(s => s.trim()).filter(s => s.length > 80)

  const chunks = []
  let buffer = ''
  for (const c of rawChunks) {
    buffer += (buffer ? '\n\n' : '') + c
    // Aim for ~600-900 chars per chunk (one clause unit)
    if (buffer.length >= 600) {
      chunks.push(buffer)
      buffer = ''
    }
  }
  if (buffer.length > 80) chunks.push(buffer)
  return chunks
}

// Extract clause ref from chunk heading (first line)
function extractClauseRef(chunk) {
  const firstLine = chunk.split('\n')[0].trim()
  const m = firstLine.match(/^(\d+(?:\.\d+)*|Table\s+\d+(?:\.\d+)*|Annex\s+[A-Z])/i)
  return m ? m[1] : null
}

function extractTableRef(chunk) {
  const m = chunk.match(/Table\s+(\d+(?:\.\d+)*)/i)
  return m ? `Table ${m[1]}` : null
}

// ── Embedding via Gemini text-embedding model ────────────────────────────────
async function embedText(text) {
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' })
  const result = await model.embedContent(text)
  return result.embedding.values
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`Ingesting ${args.file} → code=${args.code}, edition=${args.edition}`)

  const pdfBuffer = readFileSync(args.file)
  const { text, numpages } = await pdfParse(pdfBuffer)

  console.log(`Parsed ${numpages} pages, ${text.length} chars`)

  const chunks = chunkByClause(text)
  console.log(`Split into ${chunks.length} chunks`)

  let inserted = 0
  let skipped = 0

  for (let i = 0; i < chunks.length; i++) {
    const content = chunks[i]
    const clauseRef = extractClauseRef(content)
    const tableRef = extractTableRef(content)

    let embedding = null
    try {
      embedding = await embedText(content)
    } catch (e) {
      console.warn(`  Embedding failed for chunk ${i}: ${e.message}`)
    }

    const row = {
      content,
      category: 'structural',
      code_family: args.family,
      code_ref: args.code,
      edition: args.edition,
      clause_ref: clauseRef,
      table_ref: tableRef,
      topic: args.topic || null,
      pdf_id: args['pdf-id'] || null,
      page_number: null,   // page-level tracking not done in this chunker
      ...(embedding ? { embedding } : {}),
    }

    const { error } = await supabase.from('pdf_chunks').insert(row)
    if (error) {
      console.warn(`  Insert error chunk ${i}: ${error.message}`)
      skipped++
    } else {
      inserted++
      if (inserted % 20 === 0) console.log(`  ${inserted}/${chunks.length} inserted…`)
    }

    // Avoid Gemini embedding rate limit
    if (embedding) await new Promise(r => setTimeout(r, 200))
  }

  console.log(`Done. Inserted ${inserted}, skipped ${skipped}.`)
}

main().catch(e => { console.error(e); process.exit(1) })
