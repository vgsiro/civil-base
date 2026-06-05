import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function POST(req) {
  const { responseId, rating, note, correctedAnswer } = await req.json()

  if (!responseId || rating === undefined) {
    return Response.json({ error: 'responseId and rating required' }, { status: 400 })
  }
  if (![-1, 0, 1].includes(Number(rating))) {
    return Response.json({ error: 'rating must be -1, 0, or 1' }, { status: 400 })
  }

  const { error } = await supabase.from('structural_corrections').insert({
    response_id: responseId,
    rating: Number(rating),
    note: note || null,
    corrected_answer: correctedAnswer || null,
    status: 'pending',
  })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ ok: true })
}
