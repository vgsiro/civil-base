-- First, see all existing policies on posts table
select policyname, cmd, qual
from pg_policies
where tablename = 'posts';
