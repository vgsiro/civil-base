-- Run this in your Supabase SQL editor
alter table posts
  add column if not exists category text not null default 'others'
  check (category in ('concrete', 'steel', 'composite', 'geotechnical', 'others'));
