-- =====================================================
-- SAFE MIGRATION: Add Queries Table Only
-- This will NOT delete or modify existing jobs and job_audit tables
-- =====================================================

-- Create queries table (only if it doesn't exist)
create table if not exists public.queries (
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

-- Enable replica identity for real-time sync
alter table public.queries replica identity full;

-- Enable Row Level Security
alter table public.queries enable row level security;

-- Create public read/write policy
create policy "public queries read/write"
on public.queries
for all
using (true)
with check (true);

-- =====================================================
-- VERIFICATION QUERIES (optional - run these to check)
-- =====================================================

-- Check if all tables exist
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('jobs', 'job_audit', 'queries');

-- Count records in each table
-- SELECT 'jobs' as table_name, COUNT(*) as record_count FROM public.jobs
-- UNION ALL
-- SELECT 'job_audit', COUNT(*) FROM public.job_audit
-- UNION ALL
-- SELECT 'queries', COUNT(*) FROM public.queries;
