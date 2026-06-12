-- Run in Supabase SQL Editor.
--
-- Indexes that back the hot messaging queries. Without these, get_unread_conversations() and
-- the per-conversation message fetches do sequential scans of the whole messages table, which
-- is the main reason the message badge / dropdown feel slow as message volume grows.

-- get_unread_conversations() and ChatBox load both filter messages by conversation_id and
-- order/range on created_at. A composite index serves both the equality and the range.
create index if not exists messages_conv_created_idx
  on messages (conversation_id, created_at);

-- get_unread_conversations() additionally filters sender_id <> user; keeping sender_id in the
-- index lets the count be served without touching the heap rows.
create index if not exists messages_conv_sender_created_idx
  on messages (conversation_id, sender_id, created_at);
