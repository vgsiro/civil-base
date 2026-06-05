-- Per-user chat history isolation.
-- Run this in Supabase SQL Editor: Dashboard → SQL Editor → New query → paste → Run

-- 1. Add user_id columns
ALTER TABLE chat_sessions
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages (user_id);

-- 3. Enable RLS
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 4. Drop any old policies
DROP POLICY IF EXISTS "chat_sessions_all"      ON chat_sessions;
DROP POLICY IF EXISTS "chat_messages_all"      ON chat_messages;
DROP POLICY IF EXISTS "Users manage own sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Users manage own messages" ON chat_messages;

-- 5. Users see and manage only their own sessions
CREATE POLICY "Users manage own sessions"
  ON chat_sessions FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. Users see their own messages.
--    Server-side inserts (assistant role, sent via user JWT) also satisfy this
--    because route.js now forwards the Bearer token.
CREATE POLICY "Users manage own messages"
  ON chat_messages FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
