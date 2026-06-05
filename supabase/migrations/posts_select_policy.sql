-- Fix posts SELECT policy so:
-- 1. Public/friends posts are visible to everyone
-- 2. Private posts are only visible to the owner AND the admin

drop policy if exists "Posts are viewable by everyone" on public.posts;
drop policy if exists "Users can view own private posts" on public.posts;
drop policy if exists "Public posts are viewable" on public.posts;

create policy "Posts select policy"
  on public.posts for select
  using (
    -- Public or friends posts: visible to all
    visibility in ('public', 'friends')
    or
    -- Private posts: only owner can see
    auth.uid() = user_id
    or
    -- Admin can see everything
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
        and auth.users.email = 'tranvuong2832@gmail.com'
    )
  );
