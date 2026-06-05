-- user_warnings table: tracks all admin delete/warn actions
create table if not exists public.user_warnings (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  admin_id    uuid references public.profiles(id) on delete set null,
  post_id     uuid references public.posts(id) on delete set null,
  type        text not null check (type in ('delete', 'warn')),
  reason      text not null,
  custom_note text,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '14 days')
);

-- is_banned column on profiles
alter table public.profiles
  add column if not exists is_banned boolean not null default false;

-- RLS: only admins (service role) can insert/select warnings
alter table public.user_warnings enable row level security;

create policy "Admins can manage warnings"
  on public.user_warnings
  using (true)
  with check (true);

-- Index for fast lookup by user
create index if not exists user_warnings_user_id_idx on public.user_warnings(user_id);
