-- Add professional flag to post_votes so we can split the tally
alter table post_votes add column if not exists is_professional boolean not null default false;

-- Add suggested_options to posts so viewers can propose new options
create table if not exists post_vote_suggestions (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references posts(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now()
);

alter table post_vote_suggestions enable row level security;

create policy "Anyone can read suggestions"
  on post_vote_suggestions for select using (true);

create policy "Authenticated users can insert suggestions"
  on post_vote_suggestions for insert to authenticated
  with check (auth.uid() = user_id);
