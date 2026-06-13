-- Add is_professional flag to verify_requests and profiles
alter table public.verify_requests
  add column if not exists is_professional boolean not null default true;

alter table public.profiles
  add column if not exists is_professional boolean;

-- Update admin_approve_verify to stamp is_professional on the profile
create or replace function public.admin_approve_verify(
  p_user_id uuid,
  p_profession text,
  p_specializations text[],
  p_is_professional boolean default true
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
    set is_verified = true,
        is_professional = p_is_professional,
        profession = coalesce(p_profession, profession),
        specializations = coalesce(p_specializations, specializations),
        pending_profession = null,
        pending_specializations = null
  where id = p_user_id;

  delete from public.verify_requests
  where user_id = p_user_id;
end;
$$;

revoke execute on function public.admin_approve_verify(uuid, text, text[], boolean) from public;
grant execute on function public.admin_approve_verify(uuid, text, text[], boolean) to authenticated;
