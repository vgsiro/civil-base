-- ─── Run this entire block in Supabase Dashboard → SQL Editor ────────────────
-- Fixes 403 RLS errors on conversations, conversation_participants, and messages.

-- ── 1. conversations ─────────────────────────────────────────────────────────
alter table conversations enable row level security;

-- Any authenticated user can create a conversation
create policy "Auth users can insert conversations"
  on conversations for insert
  to authenticated
  with check (true);

-- A user can see a conversation only if they are a participant
create policy "Participants can select conversations"
  on conversations for select
  using (
    exists (
      select 1 from conversation_participants
      where conversation_id = conversations.id
        and user_id = auth.uid()
    )
  );

-- A participant can update last_message_at
create policy "Participants can update conversations"
  on conversations for update
  using (
    exists (
      select 1 from conversation_participants
      where conversation_id = conversations.id
        and user_id = auth.uid()
    )
  );

-- ── 2. conversation_participants ─────────────────────────────────────────────
alter table conversation_participants enable row level security;

-- Authenticated users can add participants (needed when creating a new conversation)
create policy "Auth users can insert conversation_participants"
  on conversation_participants for insert
  to authenticated
  with check (true);

-- A user can read participant rows for conversations they belong to.
-- Uses a security definer function to avoid infinite recursion (the naive
-- self-referencing EXISTS triggers 42P17 in Postgres RLS evaluation).
create or replace function is_conversation_participant(conv_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from conversation_participants
    where conversation_id = conv_id and user_id = auth.uid()
  )
$$;

create policy "Participants can select conversation_participants"
  on conversation_participants for select
  using (is_conversation_participant(conversation_id));

-- A user can update their own last_read_at
create policy "Users can update own participant row"
  on conversation_participants for update
  using (user_id = auth.uid());

-- ── 3. messages ──────────────────────────────────────────────────────────────
alter table messages enable row level security;

-- A participant can send a message to their conversation
create policy "Participants can insert messages"
  on messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from conversation_participants
      where conversation_id = messages.conversation_id
        and user_id = auth.uid()
    )
  );

-- A participant can read messages in their conversation
create policy "Participants can select messages"
  on messages for select
  using (
    exists (
      select 1 from conversation_participants
      where conversation_id = messages.conversation_id
        and user_id = auth.uid()
    )
  );

-- ── 4. Enable realtime for conversation_participants ─────────────────────────
-- messages is already in supabase_realtime. Add conversation_participants too.
-- Skip this line if it also errors with "already member".
alter publication supabase_realtime add table conversation_participants;
