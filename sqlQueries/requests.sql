-- Enable pgcrypto for gen_random_uuid (usually already enabled)
create extension
if not exists pgcrypto;

-- Enums (PG15-safe “create-if-missing”)
do $$
begin
    create type hr_request_type as enum
    ('Leave','Shift Change','Expense');
exception when duplicate_object then null;
end$$;

do $$
begin
    create type hr_request_status as enum
    ('pending','approved','declined');
exception when duplicate_object then null;
end$$;

-- Make sure enum values exist (no-op if already there)
alter type hr_request_type
add value
if not exists 'Leave';
alter type hr_request_type
add value
if not exists 'Shift Change';
alter type hr_request_type
add value
if not exists 'Expense';

alter type hr_request_status
add value
if not exists 'pending';
alter type hr_request_status
add value
if not exists 'approved';
alter type hr_request_status
add value
if not exists 'declined';

-- New table: public.hr_requests  (does NOT touch your existing public.requests)
create table
if not exists public.hr_requests
(
  id uuid primary key default gen_random_uuid
(),
  type hr_request_type not null,
  employee_id text not null,
  employee_name text not null,
  submitted_at timestamptz not null default now
(),
  date_start date,
  date_end date,
  amount numeric
(12,2),
  notes text,
  status hr_request_status not null default 'pending',
  processed_at timestamptz,
  processed_by text,
  decline_reason text,
  is_demo boolean not null default false,
  created_at timestamptz not null default now
()
);

create index
if not exists idx_hr_requests_status on public.hr_requests
(status);
create index
if not exists idx_hr_requests_submitted on public.hr_requests
(submitted_at desc);

-- RLS (only on hr_requests)
alter table public.hr_requests enable row level security;

-- Keep this permissive while you wire auth; tighten later.
drop policy
if exists hr_requests_read on public.hr_requests;
drop policy
if exists hr_requests_insert on public.hr_requests;
drop policy
if exists hr_requests_update on public.hr_requests;

create policy hr_requests_read
  on public.hr_requests
  for
select
    to anon, authenticated
  using
(true);

create policy hr_requests_insert
  on public.hr_requests
  for
insert
  to
anon,
authenticated
with check
(true);

create policy hr_requests_update
  on public.hr_requests
  for
update
  to anon, authenticated
  using (true)
with check
(true);

insert into public.hr_requests
    (type, employee_id, employee_name, submitted_at, date_start, date_end, amount, notes, status, is_demo)
values
    ('Leave', '000915041', 'Abel Fekadu', now() - interval
'3 days', '2025-09-20','2025-09-25', null, 'Family trip – PTO', 'pending', true),
('Shift Change','000394998','Hunter Tapping', now
() - interval '20 hours', '2025-09-22','2025-09-22', null, 'Swap evening shift with Naya', 'pending', true),
('Expense','000957380','Naya Bektenova', now
() - interval '6 hours', null, null, 124.56, 'Conference taxi receipts', 'pending', true)
on conflict do nothing;