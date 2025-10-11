-- == ResumeAI Applicants: Schema + Basic Policies + Seed ==
-- Safe to run multiple times. No destructive operations.

-- 1) Extension (usually already enabled on Supabase)
create extension
if not exists pgcrypto;

-- 2) Table
create table
if not exists public.resumeai_applicants
(
  id uuid primary key default gen_random_uuid
(),
  job_title text not null,
  full_name text not null,
  compatibility integer not null check
(compatibility between 0 and 100),
  status text not null check
(status in
('View','Viewed')),
  created_at timestamptz not null default now
(),
  unique
(job_title, full_name)
);

-- 3) Indexes
create index
if not exists idx_applicants_job_title on public.resumeai_applicants
(job_title);
create index
if not exists idx_applicants_compat on public.resumeai_applicants
(compatibility desc);

-- 4) RLS (basic)
alter table public.resumeai_applicants enable row level security;

-- Read for everyone (adjust to 'authenticated' if you prefer)
do $$
begin
    if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
        and tablename = 'resumeai_applicants'
        and policyname = 'resumeai_applicants_read_all'
  ) then
    create policy "resumeai_applicants_read_all"
      on public.resumeai_applicants
      for
    select
        using (true);
end
if;
end$$;

-- Optional: allow authenticated users to insert seed/records from the app
do $$
begin
    if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
        and tablename = 'resumeai_applicants'
        and policyname = 'resumeai_applicants_insert_auth'
  ) then
    create policy "resumeai_applicants_insert_auth"
      on public.resumeai_applicants
      for
    insert
      to authenticated
      with check (
    true);
end
if;
end$$;

-- 5) Seed data (unique names, varied compatibility/status)
-- Uses unique (job_title, full_name), so safe to re-run.
insert into public.resumeai_applicants
    (job_title, full_name, compatibility, status)
values
    -- Software Engineer Co-Op
    ('Software Engineer Co-Op', 'Aiden Murphy', 82, 'Viewed'),
    ('Software Engineer Co-Op', 'Maya Choudhury', 67, 'View'),
    ('Software Engineer Co-Op', 'Lucas Nguyen', 91, 'Viewed'),

    -- Communications Specialist
    ('Communications Specialist', 'Priya Kapoor', 74, 'View'),
    ('Communications Specialist', 'Daniel Silva', 59, 'Viewed'),
    ('Communications Specialist', 'Jade Thompson', 88, 'Viewed'),

    -- Cybersecurity Manager
    ('Cybersecurity Manager', 'Olivia Petrov', 93, 'Viewed'),
    ('Cybersecurity Manager', 'Noah Ibrahim', 64, 'View'),
    ('Cybersecurity Manager', 'Sophie Laurent', 79, 'Viewed'),

    -- Digital Marketing Specialist
    ('Digital Marketing Specialist', 'Ethan Rossi', 71, 'Viewed'),
    ('Digital Marketing Specialist', 'Hannah Lee', 83, 'View'),
    ('Digital Marketing Specialist', 'Marco Santos', 66, 'Viewed'),

    -- Janitor assistant
    ('Janitor assistant', 'Carlos Mendez', 54, 'View'),
    ('Janitor assistant', 'Fatima Noor', 72, 'Viewed'),
    ('Janitor assistant', 'George Adams', 61, 'Viewed'),

    -- Janitor
    ('Janitor', 'Natalie Brown', 58, 'Viewed'),
    ('Janitor', 'Omar Farouk', 77, 'View'),
    ('Janitor', 'Yuki Tanaka', 63, 'Viewed'),

    -- Software Engineer I
    ('Software Engineer I', 'Hana Takahashi', 75, 'Viewed'),
    ('Software Engineer I', 'Amara Johnson', 65, 'View'),
    ('Software Engineer I', 'Sofia Haddad', 99, 'Viewed'),

    -- Software Engineer II
    ('Software Engineer II', 'Victor Chen', 84, 'Viewed'),
    ('Software Engineer II', 'Elena Garcia', 69, 'View'),
    ('Software Engineer II', 'Ravi Sharma', 92, 'Viewed'),

    -- Software Engineer III
    ('Software Engineer III', 'Marta Kowalska', 90, 'Viewed'),
    ('Software Engineer III', 'Jonah Schultz', 73, 'View'),
    ('Software Engineer III', 'Zara Rahman', 96, 'Viewed')
on conflict
(job_title, full_name) do nothing;


-- Ensure the parent table has a unique key on job_id (it usually does)
-- If job_openings.job_id isn't unique yet, uncomment this:
-- create unique index if not exists job_openings_job_id_uidx on public.job_openings(job_id);

-- 1) Add job_id to applicants (nullable for now)
alter table public.resumeai_applicants
  add column
if not exists job_id bigint;

-- 2) Backfill job_id by joining on job title
--   Assumes each title maps to a single job_id (your titles list is unique).
update public.resumeai_applicants a
set job_id
= o.job_id
from public.job_openings o
where a.job_title = o.title
  and a.job_id is null;

-- 3) Optional: lock in NOT NULL once backfill is complete
-- (Run this only if every row now has job_id filled)
-- alter table public.resumeai_applicants alter column job_id set not null;

-- 4) Index for performance
create index
if not exists idx_applicants_job_id on public.resumeai_applicants
(job_id);

-- 5) Attach the FK with ON DELETE CASCADE.
-- If a constraint already exists, drop it first (replace the name if different).
do $$
begin
    if exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
        and table_name   = 'resumeai_applicants'
        and constraint_type = 'FOREIGN KEY'
        and constraint_name = 'resumeai_applicants_job_id_fkey'
  ) then
    alter table public.resumeai_applicants
      drop constraint resumeai_applicants_job_id_fkey;
end
if;

  alter table public.resumeai_applicants
    add constraint resumeai_applicants_job_id_fkey
    foreign key (job_id)
    references public.job_openings(job_id)
    on delete cascade;
end$$;

-- RLS note:
-- Cascaded deletes run as part of the parent delete. You do NOT need a separate DELETE policy
-- on resumeai_applicants for the cascade to execute. You only need DELETE allowed on job_openings.
