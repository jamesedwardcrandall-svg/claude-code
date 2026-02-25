-- ============================================================
-- Client Dashboard Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. TABLES
-- ---------

-- Profiles: created automatically on auth signup via trigger
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'client' check (role in ('admin', 'client')),
  created_at timestamptz default now()
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  entity_name text,
  entity_type text default 'S-Corp',
  state text default 'TX',
  status text default 'prospect' check (status in ('prospect', 'active', 'inactive')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table services (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  service_name text not null,
  status text default 'not_started' check (status in ('not_started', 'in_progress', 'complete')),
  notes text,
  created_at timestamptz default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  description text not null,
  due_date date,
  completed boolean default false,
  created_at timestamptz default now()
);

create table financials (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  tax_year integer not null default 2026,
  w2_tax_estimate numeric(12,2) default 0,
  scorp_tax_estimate numeric(12,2) default 0,
  ytd_income numeric(12,2) default 0,
  ytd_salary numeric(12,2) default 0,
  ytd_distributions numeric(12,2) default 0,
  q1_est_tax numeric(12,2) default 0,
  q2_est_tax numeric(12,2) default 0,
  q3_est_tax numeric(12,2) default 0,
  q4_est_tax numeric(12,2) default 0,
  created_at timestamptz default now(),
  unique(client_id, tax_year)
);

create table milestones (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  milestone_name text not null,
  completed boolean default false,
  completed_date date,
  created_at timestamptz default now()
);

create table projections (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  tax_year integer not null default 2026,
  projected_gross_income numeric(12,2) default 0,
  projected_expenses jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  unique(client_id, tax_year)
);

create table tax_deadlines (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  label text not null,
  due_date date not null,
  is_extension boolean default false,
  completed boolean default false,
  created_at timestamptz default now()
);


-- 2. AUTO-CREATE PROFILE ON SIGNUP
-- --------------------------------

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'role', 'client'));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();


-- 3. ROW LEVEL SECURITY
-- ---------------------

alter table profiles enable row level security;
alter table clients enable row level security;
alter table services enable row level security;
alter table tasks enable row level security;
alter table financials enable row level security;
alter table milestones enable row level security;
alter table projections enable row level security;
alter table tax_deadlines enable row level security;

-- Helper: check if current user is admin
create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer;

-- Helper: get current user's client id
create or replace function get_my_client_id()
returns uuid as $$
  select id from clients where user_id = auth.uid() limit 1;
$$ language sql security definer;

-- Profiles
create policy "Users can read own profile" on profiles for select using (id = auth.uid());
create policy "Admin can read all profiles" on profiles for select using (is_admin());

-- Clients
create policy "Admin full access to clients" on clients for all using (is_admin());
create policy "Client can read own record" on clients for select using (user_id = auth.uid());

-- Services
create policy "Admin full access to services" on services for all using (is_admin());
create policy "Client can read own services" on services for select using (client_id = get_my_client_id());

-- Tasks
create policy "Admin full access to tasks" on tasks for all using (is_admin());
create policy "Client can read own tasks" on tasks for select using (client_id = get_my_client_id());

-- Financials
create policy "Admin full access to financials" on financials for all using (is_admin());
create policy "Client can read own financials" on financials for select using (client_id = get_my_client_id());

-- Milestones
create policy "Admin full access to milestones" on milestones for all using (is_admin());
create policy "Client can read own milestones" on milestones for select using (client_id = get_my_client_id());

-- Projections
create policy "Admin full access to projections" on projections for all using (is_admin());
create policy "Client can read own projections" on projections for select using (client_id = get_my_client_id());

-- Tax Deadlines
create policy "Admin full access to tax_deadlines" on tax_deadlines for all using (is_admin());
create policy "Client can read own deadlines" on tax_deadlines for select using (client_id = get_my_client_id());


-- 4. SEED DATA
-- ------------
-- Note: user_id is left NULL. After creating auth users in Supabase,
-- link them by updating the user_id column on the clients table.

-- Client 1: Sarah Chen — high-earning active broker
insert into clients (id, name, email, phone, entity_name, entity_type, state, status)
values ('a1111111-1111-1111-1111-111111111111', 'Sarah Chen', 'sarah.chen@email.com', '(512) 555-0101', 'Chen Realty Group LLC', 'S-Corp', 'TX', 'active');

-- Client 2: Marcus Rivera — mid-level, newer S-Corp
insert into clients (id, name, email, phone, entity_name, entity_type, state, status)
values ('b2222222-2222-2222-2222-222222222222', 'Marcus Rivera', 'marcus.rivera@email.com', '(214) 555-0202', 'Rivera Commercial RE LLC', 'S-Corp', 'TX', 'active');

-- Client 3: Jennifer Walsh — prospect considering S-Corp
insert into clients (id, name, email, phone, entity_name, entity_type, state, status)
values ('c3333333-3333-3333-3333-333333333333', 'Jennifer Walsh', 'jwalsh@email.com', '(713) 555-0303', null, null, 'TX', 'prospect');

-- Services
insert into services (client_id, service_name, status, notes) values
  ('a1111111-1111-1111-1111-111111111111', 'Tax Planning', 'complete', 'Annual plan finalized'),
  ('a1111111-1111-1111-1111-111111111111', 'Bookkeeping', 'in_progress', 'Monthly reconciliation ongoing'),
  ('a1111111-1111-1111-1111-111111111111', 'Payroll Setup', 'complete', 'Gusto payroll active'),
  ('b2222222-2222-2222-2222-222222222222', 'S-Corp Formation', 'complete', 'Entity filed with TX SOS'),
  ('b2222222-2222-2222-2222-222222222222', 'Tax Planning', 'in_progress', 'Reviewing optimal salary'),
  ('b2222222-2222-2222-2222-222222222222', 'Payroll Setup', 'in_progress', 'Setting up Gusto'),
  ('c3333333-3333-3333-3333-333333333333', 'Entity Formation', 'not_started', 'Pending client decision'),
  ('c3333333-3333-3333-3333-333333333333', 'Tax Analysis', 'in_progress', 'Comparing W-2 vs S-Corp');

-- Tasks
insert into tasks (client_id, description, due_date, completed) values
  ('a1111111-1111-1111-1111-111111111111', 'File Q1 estimated taxes', '2026-04-15', false),
  ('a1111111-1111-1111-1111-111111111111', 'Review 2025 tax return draft', '2026-03-01', true),
  ('a1111111-1111-1111-1111-111111111111', 'Submit 401(k) enrollment forms', '2026-03-15', false),
  ('b2222222-2222-2222-2222-222222222222', 'Open business bank account', '2026-03-01', false),
  ('b2222222-2222-2222-2222-222222222222', 'Set up payroll with Gusto', '2026-03-15', false),
  ('b2222222-2222-2222-2222-222222222222', 'File S-Corp election (Form 2553)', '2026-03-15', true),
  ('c3333333-3333-3333-3333-333333333333', 'Schedule consultation call', '2026-02-28', false),
  ('c3333333-3333-3333-3333-333333333333', 'Gather 2025 income documentation', '2026-03-10', false);

-- Financials
insert into financials (client_id, tax_year, w2_tax_estimate, scorp_tax_estimate, ytd_income, ytd_salary, ytd_distributions, q1_est_tax, q2_est_tax, q3_est_tax, q4_est_tax) values
  ('a1111111-1111-1111-1111-111111111111', 2026, 285000, 198000, 620000, 120000, 350000, 49500, 49500, 49500, 49500),
  ('b2222222-2222-2222-2222-222222222222', 2026, 128000, 89000, 285000, 85000, 140000, 22250, 22250, 22250, 22250),
  ('c3333333-3333-3333-3333-333333333333', 2026, 92000, 62000, 0, 0, 0, 15500, 15500, 15500, 15500);

-- Milestones
insert into milestones (client_id, milestone_name, completed, completed_date) values
  ('a1111111-1111-1111-1111-111111111111', 'Articles Filed', true, '2024-03-15'),
  ('a1111111-1111-1111-1111-111111111111', 'EIN Obtained', true, '2024-03-20'),
  ('a1111111-1111-1111-1111-111111111111', 'S-Corp Election Filed', true, '2024-04-01'),
  ('a1111111-1111-1111-1111-111111111111', 'Payroll Set Up', true, '2024-04-15'),
  ('a1111111-1111-1111-1111-111111111111', 'Bank Account Opened', true, '2024-03-25'),
  ('b2222222-2222-2222-2222-222222222222', 'Articles Filed', true, '2025-11-10'),
  ('b2222222-2222-2222-2222-222222222222', 'EIN Obtained', true, '2025-11-15'),
  ('b2222222-2222-2222-2222-222222222222', 'S-Corp Election Filed', true, '2025-12-01'),
  ('b2222222-2222-2222-2222-222222222222', 'Payroll Set Up', false, null),
  ('b2222222-2222-2222-2222-222222222222', 'Bank Account Opened', false, null),
  ('c3333333-3333-3333-3333-333333333333', 'Articles Filed', false, null),
  ('c3333333-3333-3333-3333-333333333333', 'EIN Obtained', false, null),
  ('c3333333-3333-3333-3333-333333333333', 'S-Corp Election Filed', false, null),
  ('c3333333-3333-3333-3333-333333333333', 'Payroll Set Up', false, null),
  ('c3333333-3333-3333-3333-333333333333', 'Bank Account Opened', false, null);

-- Projections
insert into projections (client_id, tax_year, projected_gross_income, projected_expenses) values
  ('a1111111-1111-1111-1111-111111111111', 2026, 850000, '[{"category":"Marketing","amount":24000},{"category":"Auto","amount":12000},{"category":"Home Office","amount":6000},{"category":"Professional Fees","amount":15000},{"category":"Other","amount":8000}]'::jsonb),
  ('b2222222-2222-2222-2222-222222222222', 2026, 425000, '[{"category":"Marketing","amount":15000},{"category":"Auto","amount":9500},{"category":"Home Office","amount":4200},{"category":"Professional Fees","amount":8000},{"category":"Other","amount":5000}]'::jsonb),
  ('c3333333-3333-3333-3333-333333333333', 2026, 320000, '[{"category":"Marketing","amount":10000},{"category":"Auto","amount":8000},{"category":"Professional Fees","amount":5000}]'::jsonb);

-- Tax Deadlines
insert into tax_deadlines (client_id, label, due_date, is_extension, completed) values
  -- Sarah Chen
  ('a1111111-1111-1111-1111-111111111111', 'S-Corp Return (Form 1120S)', '2026-03-15', false, false),
  ('a1111111-1111-1111-1111-111111111111', 'Q1 Estimated Tax', '2026-04-15', false, false),
  ('a1111111-1111-1111-1111-111111111111', 'Federal Return (Form 1040)', '2026-04-15', false, false),
  ('a1111111-1111-1111-1111-111111111111', 'Q2 Estimated Tax', '2026-06-15', false, false),
  ('a1111111-1111-1111-1111-111111111111', 'Q3 Estimated Tax', '2026-09-15', false, false),
  ('a1111111-1111-1111-1111-111111111111', 'Q4 Estimated Tax', '2027-01-15', false, false),
  -- Marcus Rivera
  ('b2222222-2222-2222-2222-222222222222', 'S-Corp Return (Form 1120S)', '2026-03-15', false, false),
  ('b2222222-2222-2222-2222-222222222222', 'Q1 Estimated Tax', '2026-04-15', false, false),
  ('b2222222-2222-2222-2222-222222222222', 'Federal Return (Form 1040)', '2026-10-15', true, false),
  ('b2222222-2222-2222-2222-222222222222', 'Q2 Estimated Tax', '2026-06-15', false, false),
  ('b2222222-2222-2222-2222-222222222222', 'Q3 Estimated Tax', '2026-09-15', false, false),
  ('b2222222-2222-2222-2222-222222222222', 'Q4 Estimated Tax', '2027-01-15', false, false),
  -- Jennifer Walsh
  ('c3333333-3333-3333-3333-333333333333', 'Q1 Estimated Tax', '2026-04-15', false, false),
  ('c3333333-3333-3333-3333-333333333333', 'Federal Return (Form 1040)', '2026-04-15', false, false),
  ('c3333333-3333-3333-3333-333333333333', 'Q2 Estimated Tax', '2026-06-15', false, false),
  ('c3333333-3333-3333-3333-333333333333', 'Q3 Estimated Tax', '2026-09-15', false, false),
  ('c3333333-3333-3333-3333-333333333333', 'Q4 Estimated Tax', '2027-01-15', false, false);
