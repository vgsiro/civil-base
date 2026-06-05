-- Allow post authors to mark a question poll as open (anyone can add options)
alter table posts add column if not exists poll_open boolean not null default false;
