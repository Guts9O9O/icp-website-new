-- iC+P website: content schema, access rules and media storage.
--
-- Access model: the public site reads published rows anonymously; anyone who
-- can sign in is an admin (self-signup is disabled, admins are created by the
-- developer), so every write policy is simply "authenticated".

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Categories (fixed set: hospitality, builders-developers, commercial, private-residences)
-- ---------------------------------------------------------------------------
create table public.categories (
  slug        text primary key,
  label       text not null,
  image_path  text,                       -- storage path of the portfolio landing image
  sort_order  integer not null default 0
);

-- ---------------------------------------------------------------------------
-- Projects and their gallery images
-- ---------------------------------------------------------------------------
create table public.projects (
  id             uuid primary key default gen_random_uuid(),
  category_slug  text not null references public.categories (slug),
  slug           text not null,
  name           text not null,
  location       text,
  area_sqft      integer,
  description    text,
  thumbnail_path text,                    -- storage path: projects/{category}/{slug}/thumb.webp
  published      boolean not null default false,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (category_slug, slug),
  constraint projects_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create index projects_category_published_idx
  on public.projects (category_slug, published, sort_order);

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create table public.project_images (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  path        text not null,              -- storage path: projects/{category}/{slug}/gallery/NN.webp
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create index project_images_project_idx on public.project_images (project_id, sort_order);

-- ---------------------------------------------------------------------------
-- Team, clients, testimonials
-- ---------------------------------------------------------------------------
create table public.team_members (
  id          uuid primary key default gen_random_uuid(),
  first_name  text not null,
  last_name   text not null,
  role_lines  text[] not null default '{}', -- e.g. {"Founder","&","Design Director"}
  photo_path  text,
  bio         text,                          -- write-up; blank line separates paragraphs
  published   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger team_members_set_updated_at
  before update on public.team_members
  for each row execute function public.set_updated_at();

create table public.clients (
  id             uuid primary key default gen_random_uuid(),
  category_slug  text not null references public.categories (slug),
  name           text not null,
  logo_path      text,                     -- null = show `text` instead of a logo
  text           text,
  published      boolean not null default true,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now()
);

create index clients_category_idx on public.clients (category_slug, published, sort_order);

create table public.testimonials (
  id          uuid primary key default gen_random_uuid(),
  quote       text not null,
  author      text not null,
  company     text,
  published   boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- Free-form settings: 'about' (studio write-up), 'contact' (phone, email, address, socials)
create table public.site_settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
alter table public.categories     enable row level security;
alter table public.projects       enable row level security;
alter table public.project_images enable row level security;
alter table public.team_members   enable row level security;
alter table public.clients        enable row level security;
alter table public.testimonials   enable row level security;
alter table public.site_settings  enable row level security;

-- Public reads
create policy "public read categories"     on public.categories    for select using (true);
create policy "public read site settings"  on public.site_settings for select using (true);
create policy "public read published projects"
  on public.projects for select using (published or auth.role() = 'authenticated');
create policy "public read images of published projects"
  on public.project_images for select using (
    auth.role() = 'authenticated'
    or exists (select 1 from public.projects p where p.id = project_id and p.published)
  );
create policy "public read published team"
  on public.team_members for select using (published or auth.role() = 'authenticated');
create policy "public read published clients"
  on public.clients for select using (published or auth.role() = 'authenticated');
create policy "public read published testimonials"
  on public.testimonials for select using (published or auth.role() = 'authenticated');

-- Admin writes (any signed-in user)
create policy "admin write categories"     on public.categories     for all to authenticated using (true) with check (true);
create policy "admin write projects"       on public.projects       for all to authenticated using (true) with check (true);
create policy "admin write project images" on public.project_images for all to authenticated using (true) with check (true);
create policy "admin write team"           on public.team_members   for all to authenticated using (true) with check (true);
create policy "admin write clients"        on public.clients        for all to authenticated using (true) with check (true);
create policy "admin write testimonials"   on public.testimonials   for all to authenticated using (true) with check (true);
create policy "admin write site settings"  on public.site_settings  for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Media storage: one public-read bucket, admin-only writes.
-- Folder layout:
--   categories/{slug}.webp
--   projects/{category}/{project-slug}/thumb.webp
--   projects/{category}/{project-slug}/gallery/01.webp, 02.webp, ...
--   team/{id}.webp
--   clients/{category}/{file}
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media', true, 15728640, -- 15 MB per file
  array['image/webp', 'image/jpeg', 'image/png', 'image/svg+xml']
)
on conflict (id) do nothing;

create policy "public read media"
  on storage.objects for select using (bucket_id = 'media');
create policy "admin upload media"
  on storage.objects for insert to authenticated with check (bucket_id = 'media');
create policy "admin update media"
  on storage.objects for update to authenticated using (bucket_id = 'media');
create policy "admin delete media"
  on storage.objects for delete to authenticated using (bucket_id = 'media');

-- ---------------------------------------------------------------------------
-- Fixed categories
-- ---------------------------------------------------------------------------
insert into public.categories (slug, label, image_path, sort_order) values
  ('hospitality',        'Hospitality',           'categories/hospitality.webp',        1),
  ('builders-developers','Builders & Developers', 'categories/builders-developers.webp', 2),
  ('commercial',         'Commercial',            'categories/commercial.webp',         3),
  ('private-residences', 'Private Residences',    'categories/private-residences.webp', 4);
