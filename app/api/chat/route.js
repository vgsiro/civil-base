import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// Models in priority order — falls back automatically on 429 rate limit
const MODELS = [
  'gemini-2.5-flash',   // 5 RPM, 20 RPD — best quality
  'gemini-2.5-flash-lite', // lighter version, higher limits
  'gemma-4-31b-it',     // 15 RPM, 1500 RPD
  'gemma-4-26b-a4b-it', // 15 RPM, 1500 RPD
]

export async function POST(req) {
  const { question, subjectId, subjectName, pdfId, pdfName, history, sessionId } = await req.json()

  // Determine scope: single PDF, subject, or global
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

  // Extract meaningful keywords (skip stop words)
  const stopWords = new Set(['where','what','when','which','find','show','give','tell','how','explain','describe','about','with','from','that','this','have','does','into','more','there','their'])
  const keywords = question.toLowerCase().split(/\W+/).filter(w => w.length > 3 && !stopWords.has(w))

  let pdfContext = []
  if (pdfIds.length > 0) {
    // Try each keyword until we get enough results
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

  // Also fetch mind maps for the subject (unless single PDF)
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

  // Also search formulas (unless single PDF)
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
    // If no name match, search content
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

  // Flatten mind map nodes recursively into bullet text
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

  // Strip HTML tags from formula content for text context
  const stripHtml = (html) => html?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || ''
  const formulaContextText = formulaContext
    .map(f => `[Formula: ${f.name}]\n${stripHtml(f.content)}`)
    .join('\n\n')

  const contextText = [mindMapContextText, formulaContextText, pdfContextText].filter(Boolean).join('\n\n---\n\n')

  if (!contextText) {
    return Response.json({ error: 'No relevant content found.' }, { status: 400 })
  }

  const scope = isSinglePdf
    ? `the document "${pdfName}"`
    : isGlobal ? 'all lecture notes and formulas' : `the subject "${subjectName}"`
  const docList = pdfs.map(p => p.name).join(', ')

  const systemPrompt = `You are a helpful study assistant for a civil engineering student. You are answering questions about ${scope}.

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
        const model = genAI.getGenerativeModel({ model: modelName, systemInstruction: systemPrompt })
        const chat = model.startChat({ history: chatHistory })
        const result = await chat.sendMessageStream(question)

        // Send which model is being used (first chunk)
        await writer.write(encoder.encode(`data: ${JSON.stringify({ model: modelName })}\n\n`))

        let fullAnswer = ''
        for await (const chunk of result.stream) {
          const text = chunk.text()
          if (text) {
            fullAnswer += text
            await writer.write(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
          }
        }

        // Parse SOURCES block from the answer
        const sourcesMatch = fullAnswer.match(/\nSOURCES:\n([\s\S]+)$/m)
        const cleanAnswer = sourcesMatch ? fullAnswer.slice(0, sourcesMatch.index).trim() : fullAnswer
        const sources = []
        if (sourcesMatch) {
          for (const line of sourcesMatch[1].split('\n')) {
            const pdfMatch = line.match(/^-\s*PDF:\s*(.+?)\s*\|\s*Page:\s*(\d+)/i)
            if (pdfMatch) {
              const name = pdfMatch[1].trim()
              const page = parseInt(pdfMatch[2])
              // Look up the pdf_id from pdfContext
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
        // Tell client to replace the displayed answer without the SOURCES block
        if (sourcesMatch) {
          await writer.write(encoder.encode(`data: ${JSON.stringify({ finalAnswer: cleanAnswer })}\n\n`))
        }

        // Save assistant reply server-side (without the SOURCES block)
        if (sessionId && (cleanAnswer || fullAnswer)) {
          await supabase.from('chat_messages').insert({ session_id: sessionId, role: 'assistant', text: cleanAnswer, model: modelName })

          await supabase.from('chat_sessions').update({ updated_at: new Date().toISOString() }).eq('id', sessionId)

        }
        await writer.write(encoder.encode(`data: ${JSON.stringify({ done: true, sessionId })}\n\n`))
        return // success — stop trying
      } catch (err) {
        lastError = err
        const is429 = err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('rate')
        if (!is429) break // non-rate-limit error — don't retry other models
        // else try next model
      }
    }
    await writer.write(encoder.encode(`data: ${JSON.stringify({ error: lastError?.message || 'All models rate limited. Try again later.' })}\n\n`))
  }

  stream()

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
