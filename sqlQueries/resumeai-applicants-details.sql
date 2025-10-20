-- Ensure resume_text exists
alter table public.resumeai_applicants
  add column
if not exists resume_text text,
add column
if not exists resume_text_updated_at timestamptz;

-- Drop the derived tsvector column if it exists (DATA-SAFE: derived only)
do $$
begin
    if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
        and table_name = 'resumeai_applicants'
        and column_name = 'resume_tsv'
  ) then
    execute 'alter table public.resumeai_applicants drop column resume_tsv';
end
if;
end$$;

-- Recreate generated tsvector and its index
alter table public.resumeai_applicants
  add column resume_tsv tsvector
  generated always as
(to_tsvector
('english', coalesce
(resume_text, ''))) stored;

create index
if not exists idx_applicants_resume_tsv
  on public.resumeai_applicants using gin
(resume_tsv);


-- A) Openings: store full JD text
alter table public.job_openings
  add column
if not exists jd_text text,
add column
if not exists jd_updated_at timestamptz;

-- B) Applicants: decision/email/path (for uploads)
alter table public.resumeai_applicants
  add column
if not exists decision text check
(decision in
('Approved','Declined')),
add column
if not exists email text,
add column
if not exists resume_path text;

-- C) Matches history (if not created yet)
create table
if not exists public.resumeai_matches
(
  id uuid primary key default gen_random_uuid
(),
  applicant_id uuid not null references public.resumeai_applicants
(id) on
delete cascade,
  job_id bigint
not null,
  match_rate int not null check
(match_rate between 0 and 100),
  metrics jsonb not null,
  scored_at timestamptz not null default now
()
);
create index
if not exists idx_matches_applicant on public.resumeai_matches
(applicant_id);
create index
if not exists idx_matches_job on public.resumeai_matches
(job_id);

-- D) FTS speed (optional; safe)
create index
if not exists idx_applicants_resume_text_tsv
on public.resumeai_applicants
using gin
(to_tsvector
('english', coalesce
(resume_text, '')));


-- Read for authenticated
create policy "resumes read"
on storage.objects for
select to authenticated
using
(bucket_id = 'resumes');

-- Write for authenticated (tighten later to HR roles)
create policy "resumes write"
on storage.objects for
insert to authenticated
with check (
bucket_id
=
'resumes'
);

create policy "resumes update"
on storage.objects for
update to authenticated
using (bucket_id = 'resumes');

create policy "resumes delete"
on storage.objects for
delete to authenticated
using (bucket_id = 'resumes');
