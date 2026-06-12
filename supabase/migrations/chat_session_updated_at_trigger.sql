-- Run in Supabase SQL Editor.
--
-- chat_sessions.updated_at is used to ORDER the chat history list (most-recent first), so it
-- must be on the server clock to stay consistent. The client previously wrote it with
-- new Date(), which can lag the server and reorder sessions incorrectly.
--
-- DB owns the value via a column default plus a BEFORE UPDATE trigger that stamps now() on
-- every update. The client no longer writes this column.

alter table chat_sessions alter column updated_at set default now();

create or replace function touch_chat_session_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_chat_session_updated_at on chat_sessions;

create trigger trg_touch_chat_session_updated_at
  before update on chat_sessions
  for each row
  execute function touch_chat_session_updated_at();
