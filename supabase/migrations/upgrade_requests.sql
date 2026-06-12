-- Table: upgrade_requests
create table if not exists upgrade_requests (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references profiles(id) on delete cascade,
  requested_tier text not null check (requested_tier in ('pro', 'premium')),
  message        text,
  status         text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by    uuid references profiles(id),
  reviewed_at    timestamptz,
  created_at     timestamptz not null default now()
);

-- RLS
alter table upgrade_requests enable row level security;

-- Users can insert their own requests and read their own
create policy "users_insert_own_upgrade_request"
  on upgrade_requests for insert
  with check (auth.uid() = user_id);

create policy "users_select_own_upgrade_request"
  on upgrade_requests for select
  using (auth.uid() = user_id);

-- Admin can read and update all
create policy "admin_all_upgrade_requests"
  on upgrade_requests for all
  using (auth.email() = 'tranvuong2832@gmail.com')
  with check (auth.email() = 'tranvuong2832@gmail.com');
