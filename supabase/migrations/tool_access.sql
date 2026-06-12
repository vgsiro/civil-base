-- Tool access control: min tier required to use each tool
create table if not exists tool_access (
  tool_id    text primary key,
  min_tier   text not null default 'normal' check (min_tier in ('normal','pro','premium','admin')),
  updated_at timestamptz not null default now(),
  updated_by uuid references profiles(id)
);

-- Seed with all tools defaulting to 'normal'
insert into tool_access (tool_id, min_tier) values
  ('ec2_rect_section_check', 'normal'),
  ('wind_qp',      'normal'),
  ('wind_walls',   'normal'),
  ('wind_freewall','normal'),
  ('wind_flat',    'normal'),
  ('wind_mono',    'normal'),
  ('wind_duo',     'normal'),
  ('wind_canopy_m','normal'),
  ('wind_canopy_d','normal'),
  ('wind_rect',    'normal'),
  ('wind_cylinder','normal'),
  ('wind_signboard','normal')
on conflict (tool_id) do nothing;

-- RLS
alter table tool_access enable row level security;

-- Anyone can read (tools gate themselves on the client)
create policy "Public read tool_access"
  on tool_access for select using (true);

-- Only admin can write
create policy "Admin write tool_access"
  on tool_access for all
  using (auth.email() = 'tranvuong2832@gmail.com')
  with check (auth.email() = 'tranvuong2832@gmail.com');
