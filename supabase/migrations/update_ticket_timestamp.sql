-- Run in Supabase SQL Editor
-- Updates support_tickets.updated_at using the server clock to avoid client skew

create or replace function touch_ticket(p_ticket_id uuid)
returns void
language sql
security definer
as $$
  update support_tickets
  set updated_at = now()
  where id = p_ticket_id;
$$;
