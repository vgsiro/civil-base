-- Function to set a post as warn_limited (visible but reduced reach)
create or replace function public.admin_warn_post(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.posts
    set visibility = 'warn_limited',
        updated_at = now()
  where id = p_post_id;
end;
$$;

revoke execute on function public.admin_warn_post(uuid) from public;
grant execute on function public.admin_warn_post(uuid) to authenticated;

-- Update SELECT policy to treat warn_limited as visible to all (same as public)
-- but mark it so the UI can show a badge
drop policy if exists "Posts select policy" on public.posts;

create policy "Posts select policy"
  on public.posts for select
  using (
    visibility in ('public', 'friends', 'private', 'warn_limited')
    or
    (visibility = 'admin_hidden' and (auth.uid() = user_id or auth.email() = 'tranvuong2832@gmail.com'))
  );
