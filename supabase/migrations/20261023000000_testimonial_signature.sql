-- A testimonial can carry the author's signature (an image), shown under
-- their name on the Testimonials page.
alter table public.testimonials add column if not exists signature_path text;
