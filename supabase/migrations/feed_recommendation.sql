-- ─────────────────────────────────────────────────────────────
--  Feed Recommendation: interaction log + seen-count tracker
-- ─────────────────────────────────────────────────────────────

-- 1. Raw interaction log (used for affinity + hidden posts)
create table if not exists public.post_interactions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  post_id    uuid not null references public.posts(id) on delete cascade,
  author_id  uuid not null,
  action     text not null check (action in ('view','like','comment','share','hide','report')),
  created_at timestamptz not null default now(),
  -- one row per (user, post, action); upsert keeps it tidy
  unique(user_id, post_id, action)
);

create index if not exists post_interactions_user_idx  on public.post_interactions(user_id);
create index if not exists post_interactions_author_idx on public.post_interactions(user_id, author_id);

-- RLS: users can only read/write their own interactions
alter table public.post_interactions enable row level security;

drop policy if exists "own interactions" on public.post_interactions;
create policy "own interactions" on public.post_interactions
  for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────

-- 2. Seen-count per (user, post) — drives the seen-penalty
create table if not exists public.post_seen (
  user_id  uuid not null references auth.users(id) on delete cascade,
  post_id  uuid not null references public.posts(id) on delete cascade,
  count    integer not null default 1,
  primary key (user_id, post_id)
);

alter table public.post_seen enable row level security;

drop policy if exists "own seen" on public.post_seen;
create policy "own seen" on public.post_seen
  for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────

-- 3. RPC helper: increment seen count (upsert)
create or replace function public.increment_post_seen(
  p_user_id uuid,
  p_post_id uuid
) returns void
language plpgsql
security definer
as $$
begin
  insert into public.post_seen(user_id, post_id, count)
  values (p_user_id, p_post_id, 1)
  on conflict (user_id, post_id)
  do update set count = post_seen.count + 1;
end;
$$;
