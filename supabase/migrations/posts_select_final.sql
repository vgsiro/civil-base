-- Drop conflicting policies
drop policy if exists "Posts readable by everyone" on public.posts;
drop policy if exists "Posts select policy" on public.posts;

-- Single clean SELECT policy using auth.email() — no auth.users join needed
create policy "Posts select policy"
  on public.posts for select
  using (
    -- Normal posts visible to all
    visibility in ('public', 'friends', 'private')
    or
    -- admin_hidden: only author or admin can see
    (visibility = 'admin_hidden' and (auth.uid() = user_id or auth.email() = 'tranvuong2832@gmail.com'))
  );
