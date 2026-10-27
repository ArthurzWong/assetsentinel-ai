-- ============================================================
-- AssetSentinel AI — Supabase schema (Phase 2 pilot)
-- Run this once in Supabase Dashboard → SQL Editor.
--
-- PILOT MODE NOTICE: RLS policies below are deliberately
-- permissive (anon + authenticated full CRUD) so the demo app
-- works before Phase-2 auth is added. Before real customer data,
-- replace the anon policies with authenticated-only policies and
-- wire Supabase Auth (roles: admin / inspector / reviewer / viewer).
-- ============================================================

create table if not exists properties (
  id text primary key,
  name text not null,
  address text default '',
  town text not null default '',
  state text default 'Selangor',
  type text not null default 'factory',
  roof_area_sqm integer default 0,
  year_built integer default 2000,
  contact_person text default '',
  contact_phone text default '',
  notes text default '',
  created_at timestamptz not null default now()
);

create table if not exists inspections (
  id text primary key,
  property_id text references properties(id) on delete cascade,
  reference text not null,
  title text not null,
  inspector text default '',
  scheduled_date date,
  status text not null default 'in_progress',
  weather text default '',
  summary text default '',
  created_at timestamptz not null default now()
);

create table if not exists images (
  id text primary key,
  inspection_id text references inspections(id) on delete cascade,
  file_name text default '',
  storage_path text default '',
  src text not null default '',
  captured_at timestamptz default now(),
  location_label text default '',
  width integer default 1200,
  height integer default 800
);

create table if not exists findings (
  id text primary key,
  inspection_id text references inspections(id) on delete cascade,
  image_id text references images(id) on delete set null,
  reference text not null,
  defect_type text default 'Other',
  severity text not null default 'medium',
  title text not null,
  notes text default '',
  recommendations text default '',
  status text not null default 'pending_review',
  is_ai_suggestion boolean not null default false,
  annotations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists reviews (
  id text primary key,
  finding_id text references findings(id) on delete cascade,
  action text not null,
  reviewer text default '',
  comment text default '',
  at timestamptz not null default now()
);

create table if not exists activity (
  id text primary key,
  at timestamptz not null default now(),
  kind text not null,
  message text not null
);

create table if not exists company (
  id integer primary key default 1 check (id = 1),
  data jsonb not null
);

-- ------------------------------------------------------------
-- Row Level Security — PILOT MODE (permissive)
-- ------------------------------------------------------------
alter table properties  enable row level security;
alter table inspections enable row level security;
alter table images      enable row level security;
alter table findings    enable row level security;
alter table reviews     enable row level security;
alter table activity    enable row level security;
alter table company     enable row level security;

do $$
declare t text;
begin
  foreach t in array array['properties','inspections','images','findings','reviews','activity','company']
  loop
    execute format('drop policy if exists "pilot full access" on %I', t);
    execute format(
      'create policy "pilot full access" on %I for all to anon, authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- ------------------------------------------------------------
-- Storage: public bucket for inspection imagery (pilot)
-- Production hardening later: private bucket + signed URLs.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('inspection-images', 'inspection-images', true)
on conflict (id) do nothing;

drop policy if exists "pilot read images" on storage.objects;
create policy "pilot read images" on storage.objects
  for select using (bucket_id = 'inspection-images');

drop policy if exists "pilot upload images" on storage.objects;
create policy "pilot upload images" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'inspection-images');

drop policy if exists "pilot delete images" on storage.objects;
create policy "pilot delete images" on storage.objects
  for delete to anon, authenticated using (bucket_id = 'inspection-images');
