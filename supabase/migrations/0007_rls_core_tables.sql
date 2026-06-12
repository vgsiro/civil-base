-- Enable RLS on core content tables: admin-only access
-- sections, subjects, pdfs, pdf_chunks are internal data managed only by the admin

alter table public.sections   enable row level security;
alter table public.subjects   enable row level security;
alter table public.pdfs       enable row level security;
alter table public.pdf_chunks enable row level security;

create policy "Admin only on sections"
  on public.sections for all
  using     (auth.jwt() ->> 'email' = 'tranvuong2832@gmail.com')
  with check (auth.jwt() ->> 'email' = 'tranvuong2832@gmail.com');

create policy "Admin only on subjects"
  on public.subjects for all
  using     (auth.jwt() ->> 'email' = 'tranvuong2832@gmail.com')
  with check (auth.jwt() ->> 'email' = 'tranvuong2832@gmail.com');

create policy "Admin only on pdfs"
  on public.pdfs for all
  using     (auth.jwt() ->> 'email' = 'tranvuong2832@gmail.com')
  with check (auth.jwt() ->> 'email' = 'tranvuong2832@gmail.com');

create policy "Admin only on pdf_chunks"
  on public.pdf_chunks for all
  using     (auth.jwt() ->> 'email' = 'tranvuong2832@gmail.com')
  with check (auth.jwt() ->> 'email' = 'tranvuong2832@gmail.com');

-- Fix profile_stats view: run as querying user (not definer) so it respects RLS
alter view public.profile_stats set (security_invoker = true);
