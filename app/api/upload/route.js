import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const supabase = createClient(
  'https://ljgmzatintgfqiildszx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqZ216YXRpbnRnZnFpaWxkc3p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxOTg4NDIsImV4cCI6MjA5NTc3NDg0Mn0.lbJFmK94Tnh-X9aZ6Pv3WR7YlO55zNvD9waFPeJbVyM'
)

const yield_ = () => new Promise(r => setTimeout(r, 0))

function sseChunk(data) {
  const msg = 'data: ' + JSON.stringify(data) + '\n\n'
  return msg + ':' + ' '.repeat(Math.max(0, 1024 - msg.length)) + '\n\n'
}

async function extractPagesText(buffer) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/legacy/build/pdf.worker.mjs',
    import.meta.url
  ).toString()
  const pdf = await pdfjs.getDocument({ data: buffer }).promise
  const pages = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const text = content.items.map((item) => item.str).join(' ')
    pages.push(text)
  }
  return { totalPages: pdf.numPages, pages }
}

export async function POST(req) {
  const encoder = new TextEncoder()
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()

  async function process() {
    try {
      const formData = await req.formData()
      const file = formData.get('file')
      const sectionId = formData.get('sectionId')
      const fileName_ = formData.get('name')
      const fileType = formData.get('fileType') || 'pdf' // 'pdf' or 'image'
      const isImage = fileType === 'image'

      await writer.write(encoder.encode(sseChunk({ step: 'reading', message: `Reading ${isImage ? 'image' : 'PDF'} file...`, progress: 10 })))
      await yield_()

      const arrayBuffer = await file.arrayBuffer()
      const fileBuffer = Buffer.from(arrayBuffer.slice(0))

      // Check for existing file with same name and delete it first
      const { data: existing } = await supabase
        .from('pdfs').select('id, file_url').eq('section_id', sectionId).eq('name', fileName_ || file.name).single()
      if (existing) {
        await writer.write(encoder.encode(sseChunk({ step: 'replacing', message: 'Replacing existing file...', progress: 25 })))
        if (existing.file_url) {
          const oldPath = decodeURIComponent(new URL(existing.file_url).pathname.split('/pdfs/')[1])
          if (oldPath) await supabase.storage.from('pdfs').remove([oldPath])
        }
        await supabase.from('pdf_chunks').delete().eq('pdf_id', existing.id)
        await supabase.from('pdfs').delete().eq('id', existing.id)
      }

      await writer.write(encoder.encode(sseChunk({ step: 'uploading', message: 'Uploading to storage...', progress: 40 })))
      await yield_()

      const storageName = `${sectionId}/${Date.now()}_${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('pdfs')
        .upload(storageName, fileBuffer, { contentType: file.type || (isImage ? 'image/jpeg' : 'application/pdf') })

      if (uploadError) {
        await writer.write(encoder.encode(sseChunk({ step: 'error', message: 'Storage error: ' + uploadError.message, progress: 0 })))
        return
      }

      const { data: { publicUrl } } = supabase.storage.from('pdfs').getPublicUrl(storageName)

      if (isImage) {
        // Images: just save the record, no text extraction
        await writer.write(encoder.encode(sseChunk({ step: 'saving', message: 'Saving image...', progress: 80 })))
        await yield_()

        const { data: record, error: recErr } = await supabase
          .from('pdfs')
          .insert({ name: fileName_ || file.name, section_id: sectionId, pages: 0, file_url: publicUrl, file_type: 'image' })
          .select().single()

        if (recErr) {
          await writer.write(encoder.encode(sseChunk({ step: 'error', message: 'Error: ' + recErr.message, progress: 0 })))
          return
        }
        await writer.write(encoder.encode(sseChunk({ step: 'done', message: 'Image uploaded!', progress: 100, pdfId: record.id, chunks: 0 })))
        return
      }

      // PDF: extract text and chunk
      await writer.write(encoder.encode(sseChunk({ step: 'parsing', message: 'Extracting text from PDF...', progress: 55 })))
      await yield_()

      const pdfBuffer = new Uint8Array(arrayBuffer.slice(0))
      const { totalPages, pages } = await extractPagesText(pdfBuffer)

      await writer.write(encoder.encode(sseChunk({ step: 'saving', message: `Found ${totalPages} pages, saving...`, progress: 65 })))
      await yield_()

      const { data: pdfRecord, error: pdfError } = await supabase
        .from('pdfs')
        .insert({ name: fileName_ || file.name, section_id: sectionId, pages: totalPages, file_url: publicUrl, file_type: 'pdf' })
        .select().single()

      if (pdfError) {
        await writer.write(encoder.encode(sseChunk({ step: 'error', message: 'Error: ' + pdfError.message, progress: 0 })))
        return
      }

      await writer.write(encoder.encode(sseChunk({ step: 'chunking', message: 'Splitting into searchable sections...', progress: 75 })))
      await yield_()

      const chunks = []
      const chunkSize = 100
      for (let pageNum = 1; pageNum <= pages.length; pageNum++) {
        const text = pages[pageNum - 1]?.trim()
        if (!text) continue
        const words = text.split(/\s+/).filter(w => w.length > 0)
        for (let i = 0; i < words.length; i += chunkSize) {
          const content = words.slice(i, i + chunkSize).join(' ')
          const heading = words.slice(i, i + 8).join(' ').substring(0, 80)
          chunks.push({ pdf_id: pdfRecord.id, page_number: pageNum, heading, content })
        }
      }

      await writer.write(encoder.encode(sseChunk({ step: 'indexing', message: `Indexing ${chunks.length} sections...`, progress: 90 })))
      await yield_()

      if (chunks.length > 0) {
        await supabase.from('pdf_chunks').insert(chunks)
      }

      await writer.write(encoder.encode(sseChunk({ step: 'done', message: `Done! ${chunks.length} sections indexed from ${totalPages} pages.`, progress: 100, pdfId: pdfRecord.id, chunks: chunks.length })))

    } catch (err) {
      await writer.write(encoder.encode(sseChunk({ step: 'error', message: 'Error: ' + err.message, progress: 0 })))
    } finally {
      await writer.close()
    }
  }

  process()

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    }
  })
}
