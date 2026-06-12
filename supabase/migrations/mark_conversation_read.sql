-- Run in Supabase SQL Editor.
--
-- mark_conversation_read: sets last_read_at to the greater of now() and the conversation's
-- newest message timestamp. Using the newest message (not just now()) guarantees every
-- existing message is <= last_read_at, eliminating the race where now() lands microseconds
-- before a concurrently-inserted message and leaves it falsely "unread" after a refresh.
--
-- get_unread_conversations: returns the unread count per conversation for a user, computed
-- entirely server-side. This is the single source of truth for the message badge — no client
-- timestamp comparison and no stale PostgREST join cache.

create or replace function mark_conversation_read(
  p_conversation_id uuid,
  p_user_id uuid
)
returns void
language sql
security definer
as $$
  update conversation_participants
  set last_read_at = greatest(
    now(),
    coalesce(
      (select max(created_at) from messages where conversation_id = p_conversation_id),
      now()
    )
  )
  where conversation_id = p_conversation_id
    and user_id = p_user_id;
$$;

create or replace function get_unread_conversations(p_user_id uuid)
returns table (conversation_id uuid, unread_count bigint)
language sql
security definer
stable
as $$
  select
    cp.conversation_id,
    count(m.id) as unread_count
  from conversation_participants cp
  left join messages m
    on m.conversation_id = cp.conversation_id
    and m.sender_id <> p_user_id
    and m.created_at > coalesce(cp.last_read_at, '1970-01-01'::timestamptz)
  where cp.user_id = p_user_id
  group by cp.conversation_id;
$$;
