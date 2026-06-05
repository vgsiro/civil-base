-- Add is_hidden_by_admin flag to posts
alter table public.posts
  add column if not exists is_hidden_by_admin boolean not null default false;

-- Update admin_hide_post function to also set the flag
create or replace function public.admin_hide_post(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.posts
    set visibility = 'admin_hidden',
        is_hidden_by_admin = true,
        updated_at = now()
  where id = p_post_id;
end;
$$;

revoke execute on function public.admin_hide_post(uuid) from public;
grant execute on function public.admin_hide_post(uuid) to authenticated;
