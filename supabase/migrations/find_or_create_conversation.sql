-- Run in Supabase SQL Editor
-- Returns existing conversation ID between two users, or creates a new one.
-- Runs as security definer so it can see all participant rows regardless of RLS.

create or replace function find_or_create_conversation(
  user_a uuid,
  user_b uuid
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_conv_id uuid;
begin
  -- Find existing 1-on-1 conversation between user_a and user_b
  select cp1.conversation_id into v_conv_id
  from conversation_participants cp1
  join conversation_participants cp2
    on cp2.conversation_id = cp1.conversation_id
    and cp2.user_id = user_b
  where cp1.user_id = user_a
  limit 1;

  -- Return existing if found
  if v_conv_id is not null then
    return v_conv_id;
  end if;

  -- Create new conversation
  v_conv_id := gen_random_uuid();
  insert into conversations (id, last_message_at)
  values (v_conv_id, now());

  insert into conversation_participants (conversation_id, user_id)
  values (v_conv_id, user_a), (v_conv_id, user_b);

  return v_conv_id;
end;
$$;
