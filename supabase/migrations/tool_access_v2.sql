-- Add details_tier column: min tier required to see full calculation details
alter table tool_access
  add column if not exists details_tier text not null default 'pro'
    check (details_tier in ('normal','pro','premium','admin'));

-- Backfill existing rows
update tool_access set details_tier = 'pro' where details_tier is null;
