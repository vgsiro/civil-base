-- Admin function to approve verification — bypasses RLS on profiles
create or replace function public.admin_approve_verify(
  p_user_id uuid,
  p_profession text,
  p_specializations text[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
    set is_verified = true,
        profession = coalesce(p_profession, profession),
        specializations = coalesce(p_specializations, specializations),
        pending_profession = null,
        pending_specializations = null
  where id = p_user_id;
end;
$$;

revoke execute on function public.admin_approve_verify(uuid, text, text[]) from public;
grant execute on function public.admin_approve_verify(uuid, text, text[]) to authenticated;

-- Admin function to toggle verified status
create or replace function public.admin_toggle_verified(p_user_id uuid, p_is_verified boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
    set is_verified = p_is_verified
  where id = p_user_id;
end;
$$;

revoke execute on function public.admin_toggle_verified(uuid, boolean) from public;
grant execute on function public.admin_toggle_verified(uuid, boolean) to authenticated;
