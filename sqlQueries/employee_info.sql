-- Drafted with AI assistance:
-- OpenAI
-- GitHub Copilot
-- Review and tested by Naya Bektenova
-- Here it is assumed public.employees already exists with at least: id, first_name, last_name, department, email, phone.

begin;

    -- 1)Add all columns used by the EmployeeInformation page
    alter table public.employees
  add column
    if not exists gender            text,
    add column
    if not exists personal_email    text,
    add column
    if not exists phone_number      text,
    add column
    if not exists passport_number   text,
    add column
    if not exists date_of_birth     date,
    add column
    if not exists place_of_birth    text,
    add column
    if not exists marital_status    text,
    add column
    if not exists emergency_contact text,
    add column
    if not exists nationality       text,
    add column
    if not exists manager_name      text,
    add column
    if not exists joining_date      date,
    add column
    if not exists current_contract  text,
    add column
    if not exists work_email        text,
    add column
    if not exists work_phone        text,
    add column
    if not exists position          text,
    add column
    if not exists department        text;

-- 2) Backfill from existing minimal fields (email/phone) if empty/blank
update public.employees
set
  personal_email = coalesce(nullif(personal_email, ''), email),
  work_email     = coalesce(nullif(work_email, ''),     email),
  phone_number   = coalesce(nullif(phone_number, ''),   phone),
  work_phone     = coalesce(nullif(work_phone, ''),     phone),
  emergency_contact = coalesce(nullif(emergency_contact,''), phone)
where true;

-- 3) Replace placeholders (NULL, '', 'Unknown', 'Unspecified', '—', '-', 'N/A', 'NA')
--    with deterministic but varied values per row.
with
    ranked
    as
    (
        select
            id,
            row_number() over (order by id) as rn,
            mod(get_byte(decode(md5(id::text), 'hex'), 0), 15) as nat_idx, -- 0..14
            mod(get_byte(decode(md5(id::text), 'hex'), 1), 12) as pob_idx, -- 0..11
            mod(get_byte(decode(md5(id::text), 'hex'), 2),  5) as ms_idx, -- 0..4
            mod(get_byte(decode(md5(id::text), 'hex'), 3),  4) as g_idx, -- 0..3
            mod(get_byte(decode(md5(id::text), 'hex'), 4), 12) as mgr_idx
        -- 0..11
        from public.employees
    ),
upd as (
update public.employees e
set
        nationality
= case
        when e.nationality is null or btrim
(e.nationality) = '' or lower
(e.nationality) in
('unknown','unspecified','n/a','na') or e.nationality in
('—','-')
        then
(array[
            'Canada','United States','United Kingdom','Australia','India',
            'Philippines','Nigeria','Pakistan','China','Brazil',
            'Germany','France','Mexico','Spain','Italy'
        ])[r.nat_idx + 1]
        else e.nationality
end,
        place_of_birth = case
        when e.place_of_birth is null or btrim
(e.place_of_birth) = '' or lower
(e.place_of_birth) in
('unknown','unspecified','n/a','na') or e.place_of_birth in
('—','-')
        then
(array[
            'Calgary, Canada','Toronto, Canada','Vancouver, Canada','Montreal, Canada',
            'Edmonton, Canada','Ottawa, Canada','New York, USA','San Francisco, USA',
            'Seattle, USA','London, UK','Manchester, UK','Birmingham, UK'
        ])[r.pob_idx + 1]
        else e.place_of_birth
end,
        marital_status = case
        when e.marital_status is null or btrim
(e.marital_status) = '' or lower
(e.marital_status) in
('unknown','unspecified','n/a','na') or e.marital_status in
('—','-')
        then
(array['Single','Married','Partnered','Divorced','Widowed'])[r.ms_idx + 1]
        else e.marital_status
end,
        gender = case
        when e.gender is null or btrim
(e.gender) = '' or lower
(e.gender) in
('unknown','unspecified','n/a','na') or e.gender in
('—','-')
        then
(array['Female','Male','Non-binary','Prefer not to say'])[r.g_idx + 1]
        else e.gender
end,
        manager_name = case
        when e.manager_name is null or btrim
(e.manager_name) = '' or lower
(e.manager_name) in
('unknown','unspecified','n/a','na') or e.manager_name in
('—','-')
        then
(array[
            'Alex Johnson','Sam Lee','Taylor Morgan','Jordan Kim','Casey Brown','Riley Patel',
            'Drew Chen','Avery Garcia','Quinn Davis','Jamie Wilson','Cameron Nguyen','Morgan Thompson'
        ])[r.mgr_idx + 1]
        else e.manager_name
end
    from ranked r
    where e.id = r.id
    returning 1
)
select count(*) as rows_updated
from upd;

-- 4) Make every date_of_birth unique (only when currently NULL)
with
    rn
    as
    (
        select id, row_number() over (order by id) as rn
        from public.employees
    )
update public.employees e
set date_of_birth
=
(date '1988-01-01' +
((rn.rn - 1) * interval '37 days'))::date
from rn
where e.id = rn.id
  and e.date_of_birth is null;

-- 5) Fill joining_date and current_contract if missing
with
    rn
    as
    (
        select id, row_number() over (order by id) as rn
        from public.employees
    )
update public.employees e
set
  joining_date
= coalesce
(e.joining_date,
(current_date -
((rn.rn % 240) * interval '1 day'))::date),
  current_contract = coalesce
(e.current_contract, 'Full-time')
from rn
where e.id = rn.id;

-- 6) RLS (DEV): allow authenticated users to update employees (tighten later)
alter table public.employees enable row level security;

create policy
if not exists employees_update_dev
on public.employees
for
update
to authenticated
using (true)
with check
(true);

commit;
