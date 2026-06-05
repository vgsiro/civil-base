-- Update admin_approve_verify to also clear verify_requests inside security definer
-- This bypasses RLS on both profiles and verify_requests
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

  delete from public.verify_requests
  where user_id = p_user_id;
end;
$$;

revoke execute on function public.admin_approve_verify(uuid, text, text[]) from public;
grant execute on function public.admin_approve_verify(uuid, text, text[]) to authenticated;
