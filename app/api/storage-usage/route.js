import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const supabase = createClient(
  'https://ljgmzatintgfqiildszx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqZ216YXRpbnRnZnFpaWxkc3p4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAxOTg4NDIsImV4cCI6MjA5NTc3NDg0Mn0.lbJFmK94Tnh-X9aZ6Pv3WR7YlO55zNvD9waFPeJbVyM'
)

const LIMIT_BYTES = 1024 * 1024 * 1024 // 1 GB free tier

export async function GET() {
  const { data, error } = await supabase.storage.from('pdfs').list('', { limit: 1000 })

  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Recursively get all files including subdirectories
  async function getAllFiles(prefix = '') {
    const { data: items } = await supabase.storage.from('pdfs').list(prefix, { limit: 1000 })
    if (!items) return []
    let files = []
    for (const item of items) {
      if (item.metadata) {
        files.push(item)
      } else {
        const sub = await getAllFiles(prefix ? `${prefix}/${item.name}` : item.name)
        files = files.concat(sub)
      }
    }
    return files
  }

  const allFiles = await getAllFiles()
  const usedBytes = allFiles.reduce((sum, f) => sum + (f.metadata?.size || 0), 0)
  const usedMB = (usedBytes / (1024 * 1024)).toFixed(1)
  const limitGB = (LIMIT_BYTES / (1024 * 1024 * 1024)).toFixed(0)
  const percent = Math.min(100, ((usedBytes / LIMIT_BYTES) * 100).toFixed(1))

  return Response.json({ usedBytes, usedMB, limitGB, percent, fileCount: allFiles.length })
}
