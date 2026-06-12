-- Subscrip setion tiers: normal | pro | premium | admin
-- main_admin is resolved from email in app code, not stored here

create table if not exists subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  tier        text not null check (tier in ('normal', 'pro', 'premium', 'admin')),
  granted_by  uuid references profiles(id) on delete set null,
  granted_at  timestamptz not null default now(),
  expires_at  timestamptz,   -- null = permanent
  note        text,
  created_at  timestamptz not null default now()
);

-- Index for fast lookup of a user's latest subscription
create index if not exists subscriptions_user_granted
  on subscriptions(user_id, granted_at desc);

-- RLS
alter table subscriptions enable row level security;

-- Users can read their own subscriptions
create policy "users_read_own_subscription"
  on subscriptions for select
  using (auth.uid() = user_id);

-- Only admin can insert/update/delete
create policy "admin_all_subscriptions"
  on subscriptions for all
  using (auth.email() = 'tranvuong2832@gmail.com')
  with check (auth.email() = 'tranvuong2832@gmail.com');

-- Helper function: get the current effective tier for a user
-- Returns the most recent non-expired row, or 'normal' if none
create or replace function get_active_tier(p_user_id uuid)
returns text
language sql
stable
as $$
  select coalesce(
    (
      select tier
      from subscriptions
      where user_id = p_user_id
        and (expires_at is null or expires_at > now())
      order by granted_at desc
      limit 1
    ),
    'normal'
  );
$$;
