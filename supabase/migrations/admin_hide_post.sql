-- Admin function to hide a post (set visibility to private)
-- Runs as SECURITY DEFINER so it bypasses RLS
create or replace function public.admin_hide_post(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.posts
    set visibility = 'private',
        updated_at = now()
  where id = p_post_id;
end;
$$;

-- Revoke public execute, grant only to authenticated users
-- (admin email check is done in the app layer)
revoke execute on function public.admin_hide_post(uuid) from public;
grant execute on function public.admin_hide_post(uuid) to authenticated;
