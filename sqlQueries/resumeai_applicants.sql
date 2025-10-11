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
