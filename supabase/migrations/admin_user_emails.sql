-- Add email column to profiles and keep it synced from auth.users via trigger
-- This avoids needing to query auth.users directly (which is permission-restricted)

-- 1. Add column
alter table profiles add column if not exists email text;

-- 2. Backfill existing users
update profiles p
set email = u.email
from auth.users u
where u.id = p.id;

-- 3. Function to sync email whenever auth.users is inserted/updated
create or replace function sync_user_email()
returns trigger language plpgsql security definer as $$
begin
  update profiles set email = new.email where id = new.id;
  return new;
end;
$$;

-- 4. Trigger on auth.users
drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after insert or update of email on auth.users
  for each row execute function sync_user_email();
