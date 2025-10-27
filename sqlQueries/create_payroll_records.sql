create table
if not exists payroll_records
(
  id uuid primary key default gen_random_uuid
(),

  employee_id text,
  employee_name text,

  hours_worked numeric
(10,2) not null default 0,
  hourly_rate  numeric
(10,2) not null default 0,

  gross_pay numeric
(12,2) not null default 0,
  cpp       numeric
(12,2) not null default 0,
  -- ei       numeric(12,2),
  -- ft       numeric(12,2),
  net_pay   numeric
(12,2) not null default 0,

  created_at timestamptz not null default now
()
);

alter table payroll_records enable row level security;

create policy "allow insert from authenticated"
on payroll_records
for
insert
to authenticated
with check (
true
);

create policy "allow select own data"
on payroll_records
for
select
    to authenticated
using
( true );
