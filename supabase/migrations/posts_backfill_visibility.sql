-- Backfill visibility on old posts that have no visibility set.
-- All pre-existing posts were public by intent.
update public.posts
set visibility = 'public'
where visibility is null;
