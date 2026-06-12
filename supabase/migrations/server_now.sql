-- Run in Supabase SQL Editor.
--
-- server_now: returns the database clock. Use this whenever the client needs a timestamp
-- that will be COMPARED against server-generated timestamps (e.g. messages.created_at).
-- Reading the server clock instead of new Date() avoids the clock-skew class of bug where
-- a lagging browser clock makes a boundary land too early.

create or replace function server_now()
returns timestamptz
language sql
stable
as $$
  select now();
$$;
