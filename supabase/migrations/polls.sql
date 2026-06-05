-- Run in Supabase SQL Editor

-- Add poll_options column to posts table
alter table posts add column if not exists poll_options text[] default null;

-- Create post_votes table
create table if not exists post_votes (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references posts(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  option_index integer not null,
  created_at  timestamptz not null default now(),
  unique (post_id, user_id)  -- one vote per user per post
);

alter table post_votes enable row level security;

-- Anyone can read votes (for counting)
create policy "Anyone can read post_votes"
  on post_votes for select using (true);

-- Authenticated users can insert their own vote
create policy "Users can insert own vote"
  on post_votes for insert to authenticated
  with check (auth.uid() = user_id);

-- Users cannot change their vote
-- (no update policy — intentional)
