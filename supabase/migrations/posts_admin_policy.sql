-- Fix UPDATE policies — use auth.email() instead of joining auth.users
drop policy if exists "Users can update own posts" on public.posts;
drop policy if exists "Admin can update any post" on public.posts;

create policy "Users can update own posts"
  on public.posts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Admin can update any post"
  on public.posts for update
  using (auth.email() = 'tranvuong2832@gmail.com')
  with check (auth.email() = 'tranvuong2832@gmail.com');
