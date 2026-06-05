-- Run in Supabase SQL Editor
alter table profiles
  add column if not exists pending_profession text default null,
  add column if not exists pending_specializations text[] default null;
