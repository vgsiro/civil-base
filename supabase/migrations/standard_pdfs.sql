-- Table for Eurocode & TCVN standard PDFs
create table if not exists public.standard_pdfs (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  standard_type text not null check (standard_type in ('eurocode','tcvn')),
  category      text not null default '',
  description   text,
  file_url      text not null,
  created_at    timestamptz not null default now()
);

-- Only admin can insert/update/delete; everyone can read
alter table public.standard_pdfs enable row level security;

create policy "Anyone can read standard_pdfs"
  on public.standard_pdfs for select using (true);

create policy "Admin can manage standard_pdfs"
  on public.standard_pdfs for all
  using (auth.jwt() ->> 'email' = 'tranvuong2832@gmail.com')
  with check (auth.jwt() ->> 'email' = 'tranvuong2832@gmail.com');
