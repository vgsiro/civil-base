-- Run in Supabase SQL Editor.
--
-- get_unread_conversations: unread count per conversation for a user, server-side.
--
-- FIX: the unread boundary must be the LATER of last_read_at and deleted_at. Previously the
-- function only used last_read_at, so after a user deleted a conversation (which leaves
-- last_read_at stale) it counted every pre-deletion message as unread. That produced a wrong,
-- inflated badge on load (corrected a beat later by the client-side delete-aware recompute —
-- the "flash then change" the user saw) and was slow because it scanned all those old rows.
--
-- Using greatest(last_read_at, deleted_at) makes the server count match the client's
-- delete-aware view and stops scanning pre-deletion messages.

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
    and m.created_at > greatest(
      coalesce(cp.last_read_at, '1970-01-01'::timestamptz),
      coalesce(cp.deleted_at,   '1970-01-01'::timestamptz)
    )
  where cp.user_id = p_user_id
  group by cp.conversation_id;
$$;
