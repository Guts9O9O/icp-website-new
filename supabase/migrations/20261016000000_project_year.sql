-- The year of a project, shown after its area. Text rather than a number so
-- the studio can write a span ("2021–2023") or "Ongoing".
alter table public.projects add column if not exists year text;
