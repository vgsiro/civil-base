-- Run in Supabase SQL Editor

create table if not exists support_tickets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete set null,
  email       text,
  title       text not null,
  message     text not null,
  image_url   text,
  status      text not null default 'open',  -- open | in_progress | resolved | closed
  admin_reply text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table support_tickets enable row level security;

-- Anyone authenticated can submit a ticket
create policy "Auth users can insert tickets"
  on support_tickets for insert to authenticated
  with check (auth.uid() = user_id);

-- Users can read their own tickets
create policy "Users can read own tickets"
  on support_tickets for select
  using (auth.uid() = user_id);

-- Service role (admin) can do everything — handled via supabase admin client
-- For now allow authenticated users to read all (admin checks email server-side)
-- Admin update is done via service role or RLS bypass in admin page
create policy "Admin can update tickets"
  on support_tickets for update
  using (true);

-- Storage bucket for ticket attachments
insert into storage.buckets (id, name, public)
values ('ticket-attachments', 'ticket-attachments', true)
on conflict (id) do nothing;

create policy "Auth users can upload ticket attachments"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'ticket-attachments');

create policy "Public can read ticket attachments"
  on storage.objects for select
  using (bucket_id = 'ticket-attachments');
