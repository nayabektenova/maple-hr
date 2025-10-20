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
