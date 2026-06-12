-- Run in Supabase SQL Editor.
--
-- delete_chat_for_me: clears a conversation for the current user only (the other
-- participant keeps their copy). Stamps deleted_at with the SERVER clock now() so the
-- boundary is on the same clock as message.created_at. Using the client clock here
-- (new Date()) caused old messages to leak back in when the browser clock lagged the
-- server, because gt('created_at', deleted_at) would not filter them out.

drop function if exists delete_chat_for_me(uuid, uuid);

create or replace function delete_chat_for_me(
  p_conversation_id uuid,
  p_user_id uuid
)
returns timestamptz
language sql
security definer
as $$
  update conversation_participants
  set deleted_at = now()
  where conversation_id = p_conversation_id
    and user_id = p_user_id
  returning deleted_at;
$$;
