-- EC Content CMS table
-- Stores editable content for all EC reference pages
-- key format: "ec{N}:{section}:{field}"  e.g. "ec2:overview:parts"
-- value is JSONB so any shape of data can be stored per section

create table if not exists public.ec_content (
  id         uuid primary key default gen_random_uuid(),
  ec         text not null,          -- 'ec0' | 'ec1' | 'ec2' | 'ec3'
  section    text not null,          -- 'overview' | 'tables_parts' | 'tables_rows:{table_id}' | 'na' | 'pdf'
  key        text not null,          -- field name e.g. 'parts', 'rows', 'title'
  value      jsonb not null,         -- the editable data
  updated_at timestamptz default now(),
  updated_by text,                   -- email of admin who saved
  unique (ec, section, key)
);

-- Auto-update timestamp
create or replace function public.ec_content_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists ec_content_updated_at on public.ec_content;
create trigger ec_content_updated_at
  before update on public.ec_content
  for each row execute function public.ec_content_set_updated_at();

-- RLS
alter table public.ec_content enable row level security;

-- Anyone can read
create policy "ec_content_read" on public.ec_content
  for select using (true);

-- Only admin email can write
create policy "ec_content_write" on public.ec_content
  for all using (
    auth.jwt() ->> 'email' = 'tranvuong2832@gmail.com'
  );
