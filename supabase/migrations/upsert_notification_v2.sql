create or replace function public.upsert_notification(
  p_user_id  uuid,
  p_actor_id uuid,
  p_type     text,
  p_message  text default null,
  p_post_id  uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- For verify cycles, clear both sides so only one ever exists at a time.
  -- For all other types, just clear the same type.
  if p_type = 'verify_approved' then
    delete from public.notifications
    where user_id = p_user_id
      and type in ('verify_approved', 'verify_revoked');
  elsif p_type = 'verify_revoked' then
    delete from public.notifications
    where user_id = p_user_id
      and type in ('verify_approved', 'verify_revoked');
  else
    delete from public.notifications
    where user_id = p_user_id
      and type = p_type;
  end if;

  insert into public.notifications (user_id, actor_id, type, message, post_id, read)
  values (p_user_id, p_actor_id, p_type, p_message, p_post_id, false);
end;
$$;

revoke execute on function public.upsert_notification(uuid, uuid, text, text, uuid) from public;
grant execute on function public.upsert_notification(uuid, uuid, text, text, uuid) to authenticated;
