-- Backfill is_professional on existing verified profiles.
-- Users with a profession set are treated as professionals; verified users
-- without a profession are treated as non-professionals.
update public.profiles
set is_professional = case
  when profession is not null and profession <> '' then true
  else false
end
where is_verified = true
  and is_professional is null;
