-- Website enquiries, mirrored into the CMS so the studio can work them from
-- the admin panel. Two kinds: 'lead' (design requests + general enquiries)
-- and 'recruitment' (job applications). Rows are written by the Google Apps
-- Script form backend using the service role; admins read/update/delete.

create table public.enquiries (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null check (kind in ('lead', 'recruitment')),
  subject      text not null,
  detail       text,
  name         text not null,
  company      text,
  email        text not null,
  zip          text,
  address      text,
  requirement  text,
  page         text,
  user_agent   text,
  status       text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index enquiries_kind_created_idx on public.enquiries (kind, created_at desc);
create index enquiries_kind_status_idx on public.enquiries (kind, status);

create trigger enquiries_set_updated_at
  before update on public.enquiries
  for each row execute function public.set_updated_at();

alter table public.enquiries enable row level security;

-- No insert policy on purpose: only the service role (form backend) inserts.
create policy "admin read enquiries"   on public.enquiries for select to authenticated using (true);
create policy "admin update enquiries" on public.enquiries for update to authenticated using (true) with check (true);
create policy "admin delete enquiries" on public.enquiries for delete to authenticated using (true);
