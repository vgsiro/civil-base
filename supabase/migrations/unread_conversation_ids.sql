-- Run in Supabase SQL Editor.
--
-- unread_conversation_ids: returns just the IDs of conversations that have AT LEAST ONE unread
-- message for the user. The message badge only needs the COUNT of such conversations, not the
-- per-conversation message totals — so this uses EXISTS (stops at the first matching message)
-- instead of get_unread_conversations' LEFT JOIN + count(*) + group by over every message.
--
-- EXISTS short-circuits per conversation and is backed by the (conversation_id, sender_id,
-- created_at) index, so it stays fast on cold load even with large message history. The full
-- get_unread_conversations is still used where the per-conversation count matters.

create or replace function unread_conversation_ids(p_user_id uuid)
returns setof uuid
language sql
security definer
stable
as $$
  select cp.conversation_id
  from conversation_participants cp
  where cp.user_id = p_user_id
    and exists (
      select 1 from messages m
      where m.conversation_id = cp.conversation_id
        and m.sender_id <> p_user_id
        and m.created_at > greatest(
          coalesce(cp.last_read_at, '1970-01-01'::timestamptz),
          coalesce(cp.deleted_at,   '1970-01-01'::timestamptz)
        )
    );
$$;
