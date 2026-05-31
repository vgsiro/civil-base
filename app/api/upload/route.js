import { createClient } from '@supabase/supabase-js'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const pdf = require('pdf-parse')

const supabase = createClient(
  'https://ljgmzatintgfqiildszx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqZ216YXRpbnRnZnFpaWxkc3p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxOTg4NDIsImV4cCI6MjA5NTc3NDg0Mn0.lbJFmK94Tnh-X9aZ6Pv3WR7YlO55zNvD9waFPeJbVyM'
)

export async function POST(req) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      function send(data) {
        controller.enqueue(encoder.encode('data: ' + JSON.stringify(data) + '\n\n'))
      }

      try {
        const formData = await req.formData()
        const file = formData.get('file')
        const sectionId = formData.get('sectionId')
        const pdfName = formData.get('name')

        send({ step: 'reading', message: 'Reading PDF file...', progress: 10 })

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        send({ step: 'parsing', message: 'Extracting text from PDF...', progress: 30 })

        const pdfData = await pdf(buffer)

        send({ step: 'saving', message: `Found ${pdfData.numpages} pages, saving...`, progress: 50 })

        const { data: pdfRecord, error: pdfError } = await supabase
          .from('pdfs')
          .insert({ name: pdfName || file.name, section_id: sectionId, pages: pdfData.numpages })
          .select()
          .single()

        if (pdfError) {
          send({ step: 'error', message: 'Error: ' + pdfError.message, progress: 0 })
          controller.close()
          return
        }

        send({ step: 'chunking', message: 'Splitting into searchable sections...', progress: 65 })

        const text = pdfData.text
        const lines = text.split('\n').filter(l => l.trim().length > 20)
        const chunkSize = 30
        const chunks = []

        for (let i = 0; i < lines.length; i += chunkSize) {
          const chunkLines = lines.slice(i, i + chunkSize)
          const content = chunkLines.join(' ').trim()
          const pageNumber = Math.floor((i / lines.length) * pdfData.numpages) + 1
          const heading = chunkLines[0]?.substring(0, 80) || 'Content'
          chunks.push({ pdf_id: pdfRecord.id, page_number: pageNumber, heading, content })
        }

        send({ step: 'indexing', message: `Indexing ${chunks.length} sections...`, progress: 80 })

        if (chunks.length > 0) {
          await supabase.from('pdf_chunks').insert(chunks)
        }

        send({ step: 'done', message: `Done! ${chunks.length} sections indexed from ${pdfData.numpages} pages.`, progress: 100, pdfId: pdfRecord.id, chunks: chunks.length })

      } catch (err) {
        send({ step: 'error', message: 'Error: ' + err.message, progress: 0 })
      }

      controller.close()
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  })
}