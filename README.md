# iConcepts + Partners — website

Portfolio site for iC+P (Mumbai interior design studio) with an admin panel for
managing projects, team, clients, testimonials and site text.

- **Frontend:** React 18 + Vite + Tailwind, `react-router` v7. Design spec: `client-assets/design/iCP_Website UI_R3.pdf` (2560×1600 artboard; see `src/lib/units.js`).
- **Backend:** Supabase (Postgres + Auth + Storage). Schema and policies in `supabase/migrations/`.
- **Admin:** `/admin` (source in `src/admin/`). Anyone with a login is an admin; self-signup is disabled.

## Local development

```bash
npm install
npm run db:start          # local Supabase in Docker (Docker Desktop must be running)
npm run seed              # starter content + images into the local database
npm run create-admin -- you@example.com "a strong password"
cp .env.example .env.local   # then paste the anon key printed by `npm run db:status`
npm run dev               # http://localhost:5173  (admin: /admin)
```

Without `.env.local` the site runs from the seed files in `src/data/` and the admin is disabled.

Other scripts: `npm run build`, `npm run lint`, `npm run db:status`, `npm run db:reset` (re-applies migrations; run `seed` again after), `npm run db:stop`.

## Media storage layout (bucket `media`)

```
categories/{slug}.webp
projects/{category}/{project-slug}/thumb.webp
projects/{category}/{project-slug}/gallery/{id}.webp   (order stored in project_images.sort_order)
team/{member-id}.webp
clients/{category}/{client-id}-{id}.{png|svg|webp}
```

Photos uploaded through the admin are converted to WebP in the browser (max 2400 px; thumbnails 1200 px).

## Enquiry form backend

`apps-script/Code.gs` is a Google Apps Script web app. It sorts submissions
into **leads** (Design Request, Other) and **recruitment** (Staff Recruitment),
each with its own Google Sheet and notification address, emails the studio and
the sender, applies a honeypot + rate limiting, and mirrors every entry into
the `enquiries` table so it appears under Leads / Recruitment in the admin.
Deployment steps (clasp or browser) are in `apps-script/SETUP.md`. The site
posts to `VITE_ENQUIRY_ENDPOINT`; in development a mock at `/api/enquiry` (see
`vite.config.js`) stands in for it and writes to the local database.
`npm run test:enquiry` checks the script's validation rules in Node.

## Deploying to a Supabase cloud project

```bash
npx supabase link --project-ref <ref>
npx supabase db push
SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SERVICE_ROLE_KEY=<key> npm run seed
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run create-admin -- studio@example.com "password"
```

Then set `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` on the hosting provider and, in the Supabase dashboard, turn off *Allow new users to sign up*.
