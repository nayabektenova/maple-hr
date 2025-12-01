-- taken help from https://www.postgresql.org/docs/current/tutorial-sql.html
-- This SQL script creates two tables: employees and schedules.
-- taken help from co-pilot
-- 1. Create employees table
create table public.employees (
  id text primary key,
  first_name text not null,
  last_name text not null,
  department text not null
);

-- 2. Create schedules table
-- Use composite primary key (employee_id, weekday) so upsert works easily
create table public.schedules (
  employee_id text not null references public.employees(id) on delete cascade,
  weekday text not null, -- Mon, Tue, Wed, Thu, Fri
  kind text not null check (kind in ('shift','off','vacation')),
  start_time text, -- store as string like "8:00 AM"
  end_time text,
  location text, -- "On-site" or "Remote"
  primary key (employee_id, weekday)
);

-- 3. Insert employees (IDs match the React constants)
insert into public.employees (id, first_name, last_name, department) values
('1','Saul','Mullins','Development'),
('2','Amirah','Vincent','Development'),
('3','Morgan','Terrell','Development'),
('4','Henrietta','Gibbs','Marketing'),
('5','Enzo','Cobb','Development'),
('6','Fintan','Huff','Development'),
('7','Lena','Dixon','Finance'),
('8','Cole','Stanton','Development');

-- 4. Insert schedule rows extracted from your initialSchedule
-- Employee 1
insert into public.schedules (employee_id, weekday, kind, start_time, end_time, location) values
('1','Mon','shift','8:00 AM','5:00 PM','Remote'),
('1','Tue','shift','8:00 AM','5:00 PM','Remote'),
('1','Wed','off', NULL, NULL, NULL),
('1','Thu','shift','8:00 AM','5:00 PM','On-site'),
('1','Fri','shift','8:00 AM','5:00 PM','On-site');

-- Employee 2
insert into public.schedules (employee_id, weekday, kind, start_time, end_time, location) values
('2','Mon','shift','8:00 AM','5:00 PM','On-site'),
('2','Tue','shift','8:00 AM','5:00 PM','Remote'),
('2','Wed','shift','8:00 AM','5:00 PM','On-site'),
('2','Thu','shift','8:00 AM','5:00 PM','Remote'),
('2','Fri','shift','8:00 AM','5:00 PM','On-site');

-- Employee 3
insert into public.schedules (employee_id, weekday, kind, start_time, end_time, location) values
('3','Mon','shift','8:00 AM','5:00 PM','On-site'),
('3','Tue','shift','8:00 AM','5:00 PM','On-site'),
('3','Wed','shift','8:00 AM','5:00 PM','On-site'),
('3','Thu','shift','8:00 AM','5:00 PM','On-site'),
('3','Fri','shift','8:00 AM','5:00 PM','On-site');

-- Employee 4
insert into public.schedules (employee_id, weekday, kind, start_time, end_time, location) values
('4','Mon','shift','8:00 AM','5:00 PM','On-site'),
('4','Tue','shift','8:00 AM','5:00 PM','Remote'),
('4','Wed','off', NULL, NULL, NULL),
('4','Thu','shift','8:00 AM','5:00 PM','Remote'),
('4','Fri','shift','8:00 AM','5:00 PM','On-site');

-- Employee 5
insert into public.schedules (employee_id, weekday, kind, start_time, end_time, location) values
('5','Mon','shift','8:00 AM','5:00 PM','On-site'),
('5','Tue','shift','8:00 AM','5:00 PM','On-site'),
('5','Wed','shift','8:00 AM','5:00 PM','On-site'),
('5','Thu','shift','8:00 AM','5:00 PM','On-site'),
('5','Fri','shift','8:00 AM','5:00 PM','On-site');

-- Employee 6 (Vacation all days)
insert into public.schedules (employee_id, weekday, kind) values
('6','Mon','vacation'),
('6','Tue','vacation'),
('6','Wed','vacation'),
('6','Thu','vacation'),
('6','Fri','vacation');

-- Employee 7
insert into public.schedules (employee_id, weekday, kind, start_time, end_time, location) values
('7','Mon','shift','8:00 AM','5:00 PM','On-site'),
('7','Tue','shift','8:00 AM','5:00 PM','Remote'),
('7','Wed','shift','8:00 AM','5:00 PM','On-site'),
('7','Thu','shift','8:00 AM','5:00 PM','On-site'),
('7','Fri','shift','8:00 AM','5:00 PM','On-site');

-- Employee 8
insert into public.schedules (employee_id, weekday, kind, start_time, end_time, location) values
('8','Mon','shift','8:00 AM','5:00 PM','On-site'),
('8','Tue','off', NULL, NULL, NULL),
('8','Wed','shift','8:00 AM','5:00 PM','On-site'),
('8','Thu','shift','8:00 AM','5:00 PM','On-site'),
('8','Fri','shift','8:00 AM','5:00 PM','On-site');
