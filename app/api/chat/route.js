import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { runCalc } from '../../_lib/calc.js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Lazily created on first request so env vars are available at runtime
let supabasePublic = null
function getPublicClient() {
  if (!supabasePublic) {
    supabasePublic = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  }
  return supabasePublic
}

// Per-request client that carries the user's JWT so auth.uid() resolves in RLS
function makeUserClient(accessToken) {
  if (!accessToken) return getPublicClient()
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
  )
}

let genAI = null
function getGenAI() {
  if (!genAI) genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  return genAI
}

// Models in priority order — falls back automatically on 429 rate limit
const MODELS = [
  'gemini-2.5-flash',        // 5 RPM, 20 RPD — best quality
  'gemini-2.5-flash-lite',   // lighter version, higher limits
  'gemma-4-31b-it',          // 15 RPM, 1500 RPD
  'gemma-4-26b-a4b-it',      // 15 RPM, 1500 RPD
]

const STRUCTURAL_SYSTEM_PROMPT = `You are a structural engineering assistant specializing in
Eurocode (EN 1990–EN 1999) and Vietnamese standards (TCVN).

RULES — follow every time:
1. CITE THE CLAUSE. Reference the exact clause or table (e.g. "EN 1993-1-1 §6.2.5",
   "TCVN 5575:2012 Table 7"). Never cite only a page number. If you cannot find a
   clause in the provided context, say so — do not invent one.
2. RESPECT THE EDITION. Only use clauses from the code edition present in the
   retrieved context. If the user pins a version, never mix in another edition.
3. SYMBOLIC, NOT NUMERIC. When a calculation is needed, do NOT compute the final
   number yourself. Output the formula and the substituted symbols, then return a
   machine-readable calc block (see format below). The system computes the result.
4. SHOW WORK IN LATEX. State the formula in LaTeX, then the substitution with
   values. Default units: kN, kNm, mm, MPa unless the user specifies otherwise.
5. VERDICT COMES FROM MATH, NOT YOU. Do not assert PASS/FAIL. Emit the utilisation
   ratio for the system to evaluate.
6. SAFETY. End every calculation answer with: "AI assistance — verify against the
   governing code before use in design."

CALC BLOCK FORMAT — when a numeric check is requested, append a fenced json block:
\`\`\`calc
{
  "clause": "EN 1993-1-1 §6.2.5",
  "quantity": "M_c,Rd",
  "formula_latex": "M_{c,Rd} = \\\\frac{W_{pl} f_y}{\\\\gamma_{M0}}",
  "variables": { "W_pl": {"value": 628000, "unit": "mm^3"},
                 "f_y":  {"value": 275, "unit": "MPa"},
                 "gamma_M0": {"value": 1.0, "unit": "-"} },
  "expression": "(W_pl * f_y) / gamma_M0",
  "result_unit": "Nmm",
  "compare": { "demand_expression": "M_Ed", "demand_value": 90e6, "demand_unit": "Nmm" }
}
\`\`\`
Provide ONE calc block per check. Use SI base units inside the block.`

function extractCalcBlocks(text) {
  const blocks = []
  const regex = /```calc\s*([\s\S]*?)```/g
  let match
  while ((match = regex.exec(text)) !== null) {
    try {
      blocks.push(JSON.parse(match[1].trim()))
    } catch {}
  }
  return blocks
}

function stripCalcBlocks(text) {
  return text.replace(/```calc[\s\S]*?```/g, '').trim()
}

export async function POST(req) {
  const authHeader = req.headers.get('Authorization') || ''
  const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  const supabase = makeUserClient(accessToken)

  // Decode user ID from the JWT so we can stamp it on assistant message inserts
  let userId = null
  if (accessToken) {
    try {
      const { data } = await supabase.auth.getUser()
      userId = data?.user?.id ?? null
    } catch {}
  }

  const {
    question, subjectId, subjectName, pdfId, pdfName,
    history, sessionId,
    scope: requestScope, edition,
    structuralInputs,
    images,
  } = await req.json()

  const isStructural = requestScope === 'structural'

  // ── STRUCTURAL PATH ────────────────────────────────────────────────────────
  if (isStructural) {
    return handleStructuralChat({
      question, history, sessionId, userId, edition, structuralInputs, images, supabase,
    })
  }

  // ── GENERAL PATH (unchanged) ───────────────────────────────────────────────
  const isSinglePdf = !!pdfId
  const isGlobal = !subjectId && !pdfId

  let pdfs = []
  if (isSinglePdf) {
    pdfs = [{ id: pdfId, name: pdfName }]
  } else if (isGlobal) {
    const { data } = await supabase.from('pdfs').select('id, name')
    pdfs = data || []
  } else {
    const { data: sections } = await supabase
      .from('sections').select('id').eq('subject_id', subjectId)
    const sectionIds = (sections || []).map(s => s.id)
    const { data } = await supabase
      .from('pdfs').select('id, name').in('section_id', sectionIds)
    pdfs = data || []
  }

  const pdfIds = pdfs.map(p => p.id)
  const pdfNameMap = Object.fromEntries(pdfs.map(p => [p.id, p.name]))

  const stopWords = new Set(['where','what','when','which','find','show','give','tell','how','explain','describe','about','with','from','that','this','have','does','into','more','there','their'])
  const keywords = question.toLowerCase().split(/\W+/).filter(w => w.length > 3 && !stopWords.has(w))

  let pdfContext = []
  if (pdfIds.length > 0) {
    for (const kw of keywords) {
      const { data: chunks } = await supabase
        .from('pdf_chunks')
        .select('pdf_id, page_number, content')
        .in('pdf_id', pdfIds)
        .ilike('content', `%${kw}%`)
        .order('page_number')
        .limit(isSinglePdf ? 12 : 10)
      if (chunks && chunks.length >= 2) { pdfContext = chunks; break }
    }
    if (pdfContext.length < 2) {
      const { data: more } = await supabase
        .from('pdf_chunks')
        .select('pdf_id, page_number, content')
        .in('pdf_id', pdfIds)
        .order('page_number')
        .limit(isSinglePdf ? 16 : 12)
      pdfContext = more || []
    }
  }

  let mindMapContext = []
  if (!isSinglePdf) {
    let mmQuery = supabase.from('mind_maps').select('title, nodes, section_id')
    if (!isGlobal) {
      const { data: sections } = await supabase.from('sections').select('id').eq('subject_id', subjectId)
      const sectionIds = (sections || []).map(s => s.id)
      mmQuery = mmQuery.in('section_id', sectionIds)
    }
    const { data: maps } = await mmQuery
    mindMapContext = maps || []
  }

  let formulaContext = []
  if (!isSinglePdf) {
    let formulaQuery = supabase.from('formulas').select('name, content, section_id')
    if (!isGlobal) {
      const { data: sections } = await supabase.from('sections').select('id').eq('subject_id', subjectId)
      const sectionIds = (sections || []).map(s => s.id)
      formulaQuery = formulaQuery.in('section_id', sectionIds)
    }
    const { data: formulas } = await formulaQuery
      .ilike('name', `%${keywords[0] || question}%`)
      .limit(6)
    formulaContext = formulas || []
    if (formulaContext.length === 0) {
      let q2 = supabase.from('formulas').select('name, content, section_id')
      if (!isGlobal) {
        const { data: sections } = await supabase.from('sections').select('id').eq('subject_id', subjectId)
        const sectionIds = (sections || []).map(s => s.id)
        q2 = q2.in('section_id', sectionIds)
      }
      const { data: f2 } = await q2.limit(8)
      formulaContext = f2 || []
    }
  }

  function flattenNodes(nodes, depth = 0) {
    if (!nodes?.length) return ''
    return nodes.map(n => {
      const indent = '  '.repeat(depth)
      const ref = n.lec != null && n.page != null ? ` (Lec ${n.lec}, p.${n.page})` : ''
      return [
        `${indent}- ${n.label}${ref}`,
        flattenNodes(n.children, depth + 1)
      ].filter(Boolean).join('\n')
    }).join('\n')
  }

  const mindMapContextText = mindMapContext.map(m => {
    const nodesText = flattenNodes(m.nodes)
    return `[Mind Map: ${m.title || 'Untitled'}]\n${nodesText}`
  }).join('\n\n')

  const pdfContextText = pdfContext
    .map(c => `[Lecture Note: ${pdfNameMap[c.pdf_id] || 'Document'} — Page ${c.page_number}]\n${c.content}`)
    .join('\n\n')

  const stripHtml = (html) => html?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || ''
  const formulaContextText = formulaContext
    .map(f => `[Formula: ${f.name}]\n${stripHtml(f.content)}`)
    .join('\n\n')

  const contextText = [mindMapContextText, formulaContextText, pdfContextText].filter(Boolean).join('\n\n---\n\n')

  if (!contextText) {
    return Response.json({ error: 'No relevant content found.' }, { status: 400 })
  }

  const scopeLabel = isSinglePdf
    ? `the document "${pdfName}"`
    : isGlobal ? 'all lecture notes and formulas' : `the subject "${subjectName}"`
  const systemPrompt = `You are a helpful study assistant for a civil engineering student. You are answering questions about ${scopeLabel}.

When answering, follow this order:
1. START by scanning the Mind Map context first — it is a structured topic outline built by the student. Use it to identify which topics and lecture pages are relevant to the question.
2. Use those topic references (lecture number and page) to locate and cite the matching Lecture Note excerpts for detailed explanation.
3. Check Formulas for any relevant equations or expressions.
4. Build your answer by combining insights from all three, but always anchor it to the mind map structure when available — e.g. "According to the mind map, this falls under [topic] (Lec X, p.Y). The lecture notes on that page explain..."

Use ONLY the provided context. Be specific: cite document name and page number for lecture notes, formula name for formulas, and mind map topic name for mind map references.

At the very end of your answer, add a SOURCES section listing every excerpt you drew from, in this exact format (no extra text, no markdown):

SOURCES:
- PDF: <exact document name> | Page: <page number>
- FORMULA: <exact formula name>

List ALL sources used — both PDFs and formulas. If you used none, omit the SOURCES section.

Context:
${contextText}`

  const chatHistory = (history || [])
    .filter(m => m.text && m.text.trim())
    .map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }))

  const encoder = new TextEncoder()
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()

  async function stream() {
    let lastError = null
    for (const modelName of MODELS) {
      try {
        const model = getGenAI().getGenerativeModel({ model: modelName, systemInstruction: systemPrompt })
        const chat = model.startChat({ history: chatHistory })
        const result = await chat.sendMessageStream(question)

        await writer.write(encoder.encode(`data: ${JSON.stringify({ model: modelName })}\n\n`))

        let fullAnswer = ''
        for await (const chunk of result.stream) {
          const text = chunk.text()
          if (text) {
            fullAnswer += text
            await writer.write(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
          }
        }

        const sourcesMatch = fullAnswer.match(/\nSOURCES:\n([\s\S]+)$/m)
        const cleanAnswer = sourcesMatch ? fullAnswer.slice(0, sourcesMatch.index).trim() : fullAnswer
        const sources = []
        if (sourcesMatch) {
          for (const line of sourcesMatch[1].split('\n')) {
            const pdfMatch = line.match(/^-\s*PDF:\s*(.+?)\s*\|\s*Page:\s*(\d+)/i)
            if (pdfMatch) {
              const name = pdfMatch[1].trim()
              const page = parseInt(pdfMatch[2])
              const chunk = pdfContext.find(c => (pdfNameMap[c.pdf_id] || '').toLowerCase() === name.toLowerCase() && c.page_number === page)
                ?? pdfContext.find(c => (pdfNameMap[c.pdf_id] || '').toLowerCase().includes(name.toLowerCase()))
              if (chunk) sources.push({ type: 'pdf', name: pdfNameMap[chunk.pdf_id], page: chunk.page_number, pdf_id: chunk.pdf_id })
            }
            const formulaMatch = line.match(/^-\s*FORMULA:\s*(.+)/i)
            if (formulaMatch) {
              const name = formulaMatch[1].trim()
              const formula = formulaContext.find(f => f.name.toLowerCase() === name.toLowerCase())
                ?? formulaContext.find(f => f.name.toLowerCase().includes(name.toLowerCase()))
              if (formula) sources.push({ type: 'formula', name: formula.name, section_id: formula.section_id })
            }
          }
        }
        if (sources.length) {
          await writer.write(encoder.encode(`data: ${JSON.stringify({ sources })}\n\n`))
        }
        if (sourcesMatch) {
          await writer.write(encoder.encode(`data: ${JSON.stringify({ finalAnswer: cleanAnswer })}\n\n`))
        }

        if (sessionId && (cleanAnswer || fullAnswer)) {
          await supabase.from('chat_messages').insert({
            session_id: sessionId,
            role: 'assistant',
            text: cleanAnswer,
            model: modelName,
            ...(userId ? { user_id: userId } : {}),
          })
          await supabase.from('chat_sessions').update({ updated_at: new Date().toISOString() }).eq('id', sessionId) // ts-ok: server-side API route; trigger also stamps now()
        }
        await writer.write(encoder.encode(`data: ${JSON.stringify({ done: true, sessionId })}\n\n`))
        return
      } catch (err) {
        lastError = err
        const is429 = err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('rate')
        if (!is429) break
      }
    }
    await writer.write(encoder.encode(`data: ${JSON.stringify({ error: lastError?.message || 'All models rate limited. Try again later.' })}\n\n`))
  }

  stream().finally(() => writer.close().catch(() => {}))

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

// ── STRUCTURAL HANDLER ────────────────────────────────────────────────────────

async function handleStructuralChat({ question, history, sessionId, userId, edition, structuralInputs, images, supabase }) {
  const stopWords = new Set(['where','what','when','which','find','show','give','tell','how','explain','describe','about','with','from','that','this','have','does','into','more','there','their'])
  const keywords = question.toLowerCase().split(/\W+/).filter(w => w.length > 3 && !stopWords.has(w))

  // Retrieve structural chunks (category = 'structural'), with keyword fallback
  let structuralChunks = []
  for (const kw of [...keywords, question]) {
    const { data } = await supabase
      .from('pdf_chunks')
      .select('id, pdf_id, page_number, content, code_ref, clause_ref, edition')
      .eq('category', 'structural')
      .ilike('content', `%${kw}%`)
      .order('page_number')
      .limit(10)
    if (data && data.length >= 2) { structuralChunks = data; break }
  }
  if (structuralChunks.length < 2) {
    const { data } = await supabase
      .from('pdf_chunks')
      .select('id, pdf_id, page_number, content, code_ref, clause_ref, edition')
      .eq('category', 'structural')
      .order('page_number')
      .limit(10)
    structuralChunks = data || []
  }
  if (edition && structuralChunks.length > 0) {
    const filtered = structuralChunks.filter(c => c.edition === edition)
    if (filtered.length > 0) structuralChunks = filtered
  }

  // Fetch golden few-shot examples similar to query
  let fewShotText = ''
  try {
    const { data: examples } = await supabase
      .from('golden_examples')
      .select('question, answer')
      .eq('scope', 'structural')
      .eq('active', true)
      .limit(3)
    if (examples && examples.length > 0) {
      fewShotText = examples.map(e =>
        `Example question: ${e.question}\nIdeal answer:\n${e.answer}`
      ).join('\n\n---\n\n')
    }
  } catch {}

  const pdfIds = [...new Set(structuralChunks.map(c => c.pdf_id))]
  let pdfNameMap = {}
  if (pdfIds.length > 0) {
    const { data: pdfRows } = await supabase.from('pdfs').select('id, name').in('id', pdfIds)
    pdfNameMap = Object.fromEntries((pdfRows || []).map(p => [p.id, p.name]))
  }

  const retrievedText = structuralChunks.map(c => {
    const docName = pdfNameMap[c.pdf_id] || 'Standard'
    const clauseTag = c.clause_ref ? ` [${c.clause_ref}]` : ''
    const codeTag = c.code_ref ? ` (${c.code_ref}${c.edition ? ', ' + c.edition : ''})` : ''
    return `[${docName}${codeTag} — Page ${c.page_number}${clauseTag}]\n${c.content}`
  }).join('\n\n')

  // Build the structural inputs prefix if provided
  let inputsPrefix = ''
  if (structuralInputs && Object.keys(structuralInputs).length > 0) {
    const parts = Object.entries(structuralInputs)
      .filter(([, v]) => v !== '' && v !== null && v !== undefined)
      .map(([k, v]) => `${k}=${v}`)
    if (parts.length > 0) {
      inputsPrefix = `[Structural inputs] ${parts.join('; ')}\n\n`
    }
  }

  const fullQuestion = inputsPrefix + question

  const systemPrompt = STRUCTURAL_SYSTEM_PROMPT + (fewShotText
    ? `\n\n─── WORKED EXAMPLES (few-shot) ───\n\n${fewShotText}\n\n─── END EXAMPLES ───`
    : '') + `\n\nRetrieved code clauses and tables:\n\n${retrievedText || '(No structural documents found in the knowledge base yet — answer from general knowledge but note the absence.)'}`

  const chatHistory = (history || [])
    .filter(m => m.text && m.text.trim())
    .map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }))

  const encoder = new TextEncoder()
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()

  async function stream() {
    let lastError = null
    for (const modelName of MODELS) {
      try {
        const model = getGenAI().getGenerativeModel({ model: modelName, systemInstruction: systemPrompt })
        const chat = model.startChat({ history: chatHistory })

        // Build multipart message if images are attached
        const messageParts = [{ text: fullQuestion }]
        if (images && images.length > 0) {
          for (const dataUrl of images) {
            const commaIdx = dataUrl.indexOf(',')
            if (commaIdx === -1) continue
            const mimeMatch = dataUrl.match(/^data:([^;]+);base64,/)
            const mimeType = mimeMatch ? mimeMatch[1] : 'image/png'
            const base64Data = dataUrl.slice(commaIdx + 1)
            messageParts.push({ inlineData: { mimeType, data: base64Data } })
          }
        }

        const result = await chat.sendMessageStream(messageParts)

        await writer.write(encoder.encode(`data: ${JSON.stringify({ model: modelName })}\n\n`))

        let fullAnswer = ''
        for await (const chunk of result.stream) {
          const text = chunk.text()
          if (text) {
            fullAnswer += text
            await writer.write(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
          }
        }

        // Extract and run calc blocks deterministically
        const calcBlocks = extractCalcBlocks(fullAnswer)
        const calcResults = []
        for (const block of calcBlocks) {
          try {
            const result = runCalc(block)
            calcResults.push({ ...block, ...result })
          } catch (e) {
            calcResults.push({ ...block, error: e.message })
          }
        }

        // Strip raw calc blocks from displayed prose
        const cleanAnswer = stripCalcBlocks(fullAnswer)

        if (calcResults.length > 0) {
          await writer.write(encoder.encode(`data: ${JSON.stringify({ calcResults })}\n\n`))
        }
        if (cleanAnswer !== fullAnswer) {
          await writer.write(encoder.encode(`data: ${JSON.stringify({ finalAnswer: cleanAnswer })}\n\n`))
        }

        // Log to structural_responses
        let logId = null
        try {
          const retrievedIds = structuralChunks.map(c => c.id)
          const { data: logRow } = await supabase
            .from('structural_responses')
            .insert({
              question: fullQuestion,
              scope: 'structural',
              edition: edition || null,
              retrieved_ids: retrievedIds,
              ai_answer: cleanAnswer || fullAnswer,
              calc_json: calcBlocks.length > 0 ? calcBlocks : null,
              verified: calcResults.length > 0 ? calcResults : null,
            })
            .select('id')
            .single()
          logId = logRow?.id || null
        } catch {}

        if (sessionId && (cleanAnswer || fullAnswer)) {
          await supabase.from('chat_messages').insert({
            session_id: sessionId,
            role: 'assistant',
            text: cleanAnswer || fullAnswer,
            model: modelName,
            ...(userId ? { user_id: userId } : {}),
          })
          await supabase.from('chat_sessions').update({ updated_at: new Date().toISOString() }).eq('id', sessionId) // ts-ok: server-side API route; trigger also stamps now()
        }

        await writer.write(encoder.encode(`data: ${JSON.stringify({ done: true, sessionId, responseId: logId })}\n\n`))
        return
      } catch (err) {
        lastError = err
        const is429 = err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('rate')
        if (!is429) break
      }
    }
    await writer.write(encoder.encode(`data: ${JSON.stringify({ error: lastError?.message || 'All models rate limited. Try again later.' })}\n\n`))
  }

  stream().finally(() => writer.close().catch(() => {}))

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
