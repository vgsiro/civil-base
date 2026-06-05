-- Run in Supabase SQL Editor
-- Sets last_read_at to the server's current time, avoiding client/server clock skew
-- that causes messages to still appear unread after page refresh.

create or replace function mark_conversation_read(
  p_conversation_id uuid,
  p_user_id uuid
)
returns void
language sql
security definer
as $$
  update conversation_participants
  set last_read_at = now()
  where conversation_id = p_conversation_id
    and user_id = p_user_id;
$$;
