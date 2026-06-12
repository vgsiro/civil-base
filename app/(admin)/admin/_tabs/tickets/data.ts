import type { SupabaseClient } from '@supabase/supabase-js'
import type { Ticket, TicketMessage, RangeMode } from '../../_lib/types'
import { getRangeSince, getRangeTo } from '../../_lib/constants'

function applyRange(q: any, range: RangeMode) {
  const since = getRangeSince(range)
  const to = getRangeTo(range)
  if (since) q = q.gte('created_at', since)
  if (to) q = q.lte('created_at', to)
  return q
}

export async function fetchTickets(supabase: SupabaseClient, range: RangeMode): Promise<Ticket[]> {
  const { data, error } = await applyRange(
    supabase.from('support_tickets').select('*').order('created_at', { ascending: false }).limit(200),
    range,
  )
  if (error) console.error('[Admin] fetchTickets error:', error.message)
  return (data as Ticket[]) ?? []
}

export async function fetchThread(supabase: SupabaseClient, ticketId: string): Promise<TicketMessage[]> {
  const { data } = await supabase.from('ticket_messages').select('*')
    .eq('ticket_id', ticketId).order('created_at', { ascending: true })
  return (data as TicketMessage[]) ?? []
}

export async function updateTicketStatus(supabase: SupabaseClient, id: string, status: Ticket['status']) {
  await supabase.from('support_tickets').update({ status }).eq('id', id)
  // updated_at stamped on the server clock via touch_ticket() to avoid client skew
  await supabase.rpc('touch_ticket', { p_ticket_id: id })
}

export async function sendReply(
  supabase: SupabaseClient,
  ticketId: string,
  body: string,
  image: File | null,
): Promise<TicketMessage | null> {
  let image_url: string | null = null
  if (image) {
    const path = `ticket-attachments/admin-replies/${ticketId}-${Date.now()}-${image.name}`
    const { error: upErr } = await supabase.storage.from('ticket-attachments').upload(path, image)
    if (!upErr) {
      const { data } = supabase.storage.from('ticket-attachments').getPublicUrl(path)
      image_url = data.publicUrl
    }
  }
  const { data: newMsg, error } = await supabase
    .from('ticket_messages')
    .insert({ ticket_id: ticketId, sender: 'admin', body: body || null, image_url })
    .select().single()
  await supabase.from('support_tickets').update({ status: 'in_progress' }).eq('id', ticketId)
  await supabase.rpc('touch_ticket', { p_ticket_id: ticketId })
  if (error || !newMsg) return null
  return newMsg as TicketMessage
}
