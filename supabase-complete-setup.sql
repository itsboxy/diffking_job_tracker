-- =====================================================
-- COMPLETE SUPABASE SETUP (For Fresh Installation Only)
-- WARNING: This script drops existing tables!
-- Only use this on a NEW Supabase project
-- =====================================================

drop table if exists public.queries;
drop table if exists public.job_audit;
drop table if exists public.jobs;

-- =====================================================
-- JOBS TABLE
-- =====================================================

create table public.jobs (
  id text primary key,
  category text not null,
  customer_name text not null,
  phone_number text not null,
  address text,
  invoice_number text,
  quote_number text,
  importance text not null,
  description text not null,
  date text not null,
  estimated_dispatch_date text,
  items jsonb not null,
  status text not null,
  measurements jsonb,
  attachments jsonb,
  updated_at timestamptz,
  completed_at timestamptz,
  is_deleted boolean default false,
  deleted_at timestamptz,
  is_archived boolean default false,
  archived_at timestamptz
);

alter table public.jobs replica identity full;
alter table public.jobs enable row level security;

create policy "public jobs read/write"
on public.jobs
for all
using (true)
with check (true);

-- =====================================================
-- JOB AUDIT TABLE
-- =====================================================

create table public.job_audit (
  id text primary key,
  job_id text,
  action text not null,
  timestamp timestamptz not null,
  summary text not null,
  client_id text
);

alter table public.job_audit replica identity full;
alter table public.job_audit enable row level security;

create policy "public audit read/write"
on public.job_audit
for all
using (true)
with check (true);

-- =====================================================
-- QUERIES TABLE (NEW)
-- =====================================================

create table public.queries (
  id text primary key,
  customer_name text not null,
  phone_number text not null,
  description text not null,
  items jsonb default '[]'::jsonb,
  date text not null,
  updated_at timestamptz,
  is_deleted boolean default false,
  deleted_at timestamptz
);

alter table public.queries replica identity full;
alter table public.queries enable row level security;

create policy "public queries read/write"
on public.queries
for all
using (true)
with check (true);

-- =====================================================
-- VERIFICATION
-- =====================================================

-- List all tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
