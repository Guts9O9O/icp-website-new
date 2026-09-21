-- Introductory text shown on each portfolio category page (client copy).
alter table public.categories add column if not exists description text;
