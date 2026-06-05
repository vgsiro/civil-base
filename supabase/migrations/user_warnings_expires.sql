-- Add expires_at to existing user_warnings table (run if table already exists)
alter table public.user_warnings
  add column if not exists expires_at timestamptz not null default (now() + interval '14 days');

-- Backfill existing rows: set expires_at = created_at + 14 days
update public.user_warnings
  set expires_at = created_at + interval '14 days'
  where expires_at = now() + interval '14 days';
