-- Run in Supabase SQL Editor.
--
-- count_active_warnings: returns the number of a user's warnings that have not yet expired,
-- evaluating expires_at against the SERVER clock now(). Previously the admin client compared
-- expires_at against new Date(), which is the same clock-skew class of bug — a lagging admin
-- clock could mis-count active warnings near an expiry boundary.

create or replace function count_active_warnings(p_user_id uuid)
returns integer
language sql
stable
security definer
as $$
  select count(*)::int
  from user_warnings
  where user_id = p_user_id
    and expires_at > now();
$$;

-- expire_warning: force-expire a warning by setting expires_at to the server clock now(),
-- returning that timestamp so the client can reconcile its local list on the same clock.
create or replace function expire_warning(p_warning_id uuid)
returns timestamptz
language sql
security definer
as $$
  update user_warnings
  set expires_at = now()
  where id = p_warning_id
  returning expires_at;
$$;
