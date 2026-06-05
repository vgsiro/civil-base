-- Upsert a notification, replacing any existing one of the same type for the user.
-- Runs as security definer so admin can overwrite another user's notification row.
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
  delete from public.notifications
  where user_id = p_user_id
    and type in (
      case p_type
        when 'verify_approved' then 'verify_approved'
        when 'verify_revoked'  then 'verify_revoked'
        else p_type
      end,
      case p_type
        when 'verify_approved' then 'verify_revoked'
        when 'verify_revoked'  then 'verify_approved'
        else p_type
      end
    );

  insert into public.notifications (user_id, actor_id, type, message, post_id, read)
  values (p_user_id, p_actor_id, p_type, p_message, p_post_id, false);
end;
$$;

revoke execute on function public.upsert_notification(uuid, uuid, text, text, uuid) from public;
grant execute on function public.upsert_notification(uuid, uuid, text, text, uuid) to authenticated;
