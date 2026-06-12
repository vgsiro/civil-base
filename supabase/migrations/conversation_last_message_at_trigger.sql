-- Run in Supabase SQL Editor.
--
-- conversations.last_message_at is used to ORDER the conversation list. It must be on the
-- server clock so it stays consistent with messages.created_at. Previously the client wrote
-- it with new Date(), which can lag the server and produce a wrong sort order.
--
-- This trigger makes the DB own the value: every time a message is inserted, the parent
-- conversation's last_message_at is bumped to now() (server clock). The client no longer
-- writes this column at all. A column default of now() covers the empty-conversation case
-- (a conversation created before its first message).

alter table conversations alter column last_message_at set default now();

create or replace function bump_conversation_last_message_at()
returns trigger
language plpgsql
security definer
as $$
begin
  update conversations
  set last_message_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists trg_bump_conversation_last_message_at on messages;

create trigger trg_bump_conversation_last_message_at
  after insert on messages
  for each row
  execute function bump_conversation_last_message_at();
