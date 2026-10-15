-- A project's taxonomy, in the order the studio reads it: name, location,
-- client, typology, area. Name, location and area already exist.
alter table public.projects add column if not exists client text;
alter table public.projects add column if not exists typology text;
