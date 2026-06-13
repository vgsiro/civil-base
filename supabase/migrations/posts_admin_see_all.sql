-- Fix posts SELECT policy:
--   public      → everyone
--   friends     → author + accepted friends
--   private     → author only
--   admin_hidden → author + admin
--   admin       → sees all
drop policy if exists "Posts select policy" on public.posts;

create policy "Posts select policy"
  on public.posts for select
  using (
    -- Admin sees everything
    auth.email() = 'tranvuong2832@gmail.com'
    or
    -- Public posts visible to all
    visibility = 'public'
    or
    -- Author always sees their own posts
    auth.uid() = user_id
    or
    -- Friends-only: viewer must be an accepted friend of the author
    (
      visibility = 'friends'
      and exists (
        select 1 from public.friendships f
        where f.status = 'accepted'
          and (
            (f.requester_id = user_id and f.receiver_id = auth.uid())
            or
            (f.receiver_id  = user_id and f.requester_id = auth.uid())
          )
      )
    )
  );
