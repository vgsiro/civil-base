-- Run this in your Supabase SQL editor
create table if not exists post_recommendations (
  post_id   uuid not null references posts(id) on delete cascade,
  user_id   uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table post_recommendations enable row level security;

create policy "Anyone can read recommendations"
  on post_recommendations for select using (true);

create policy "Verified professionals can insert"
  on post_recommendations for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from profiles where id = auth.uid() and is_verified = true
    )
  );

create policy "Users can delete their own recommendation"
  on post_recommendations for delete
  using (auth.uid() = user_id);
