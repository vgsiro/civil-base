-- Run in Supabase SQL Editor.
-- User-to-user moderation: blocking, reporting, and per-user "delete chat".

-- ── 1. blocked_users ─────────────────────────────────────────────────────────
-- Who has blocked whom. A row (blocker, blocked) means blocker no longer wants
-- to see or receive anything from blocked.
create table if not exists blocked_users (
  blocker_id uuid not null references profiles(id) on delete cascade,
  blocked_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

alter table blocked_users enable row level security;

-- A user can read rows where they are the blocker OR the blocked
-- (needed so the blocked person can detect they've been blocked).
create policy "Users manage own blocks - select"
  on blocked_users for select
  using (blocker_id = auth.uid() or blocked_id = auth.uid());

create policy "Users manage own blocks - insert"
  on blocked_users for insert to authenticated
  with check (blocker_id = auth.uid());

create policy "Users manage own blocks - delete"
  on blocked_users for delete
  using (blocker_id = auth.uid());

-- ── 2. user_reports ──────────────────────────────────────────────────────────
-- Reports filed against a profile, reviewed by admins (mirrors support_tickets).
create table if not exists user_reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid references profiles(id) on delete set null,
  reported_id  uuid references profiles(id) on delete cascade,
  reason       text not null,           -- spam | harassment | impersonation | inappropriate | other
  details      text,
  status       text not null default 'open',  -- open | reviewing | resolved | dismissed
  created_at   timestamptz not null default now()
);

alter table user_reports enable row level security;

-- Any authenticated user can file a report as themselves.
create policy "Auth users can insert reports"
  on user_reports for insert to authenticated
  with check (reporter_id = auth.uid());

-- Reporters can read their own reports. (Admin review uses the service-role client.)
create policy "Users read own reports"
  on user_reports for select
  using (reporter_id = auth.uid());

-- ── 3. per-user "delete chat" ────────────────────────────────────────────────
-- cleared_at marks when a user cleared a conversation. Messages older than this are
-- hidden FOR THAT USER ONLY; the other participant keeps their full history.
alter table conversation_participants
  add column if not exists cleared_at timestamptz;

create or replace function delete_conversation_for_me(
  p_conversation_id uuid,
  p_user_id uuid
)
returns void
language sql
security definer
as $$
  update conversation_participants
  set cleared_at = now()
  where conversation_id = p_conversation_id
    and user_id = p_user_id;
$$;
