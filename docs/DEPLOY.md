# Go-live runbook

Everything below is done once. Every account is created **in iC+P's name**
(studio@icp.firm.in) and the developer is added as a collaborator, so the
studio owns the site outright and can remove the developer's access at handover.

Estimated time: 1–2 hours, mostly waiting on DNS.

## 0. Accounts needed

| Service | Purpose | Plan | Who signs up |
|---|---|---|---|
| GitHub | code hosting; every push deploys | Free | studio (org) or existing `studio329/ICP` repo |
| Supabase | database, admin login, image storage | Free (upgrade ~₹2,100/mo only if images exceed 1 GB) | studio@icp.firm.in |
| Cloudflare | hosting (Pages) + DNS | Free | studio@icp.firm.in |
| Google (Apps Script) | enquiry form → sheets + email | already done | studio@icp.firm.in |
| UptimeRobot | free ping so the Supabase free tier never pauses | Free | studio or developer |
| Google Search Console | tells Google about the site | Free | studio@icp.firm.in |

## 1. Supabase (cloud database)

1. https://supabase.com → sign up as studio@icp.firm.in → **New organization**
   "iConcepts + Partners" → **New project** `icp-website`, region **Mumbai
   (ap-south-1)**, generate a strong database password and save it.
2. Project Settings → **API**: note the **Project URL**, **anon** key and
   **service_role** key (the last one is secret — never in the website code).
3. Authentication → Sign In / Providers → Email: keep enabled; **Settings →
   turn off "Allow new users to sign up"**.
4. Developer, from the repo root:
   ```bash
   npx supabase login
   npx supabase link --project-ref <project ref>
   npx supabase db push                                   # creates tables, policies, storage bucket
   SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SERVICE_ROLE_KEY=<service_role> npm run seed
   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run create-admin -- studio@icp.firm.in "<strong password>"
   ```
   The seed loads the starter content (categories, sample projects, team,
   clients, about text). The sample Hospitality projects are placeholders — the
   studio replaces them from the admin.
5. Storage → `media` bucket exists and is public-read. Done.

## 2. Google Apps Script — connect the CMS mirror

In the Apps Script project (script.google.com → *iC+P website enquiry form*) →
Project Settings → Script properties, add:

| Property | Value |
|---|---|
| `SUPABASE_URL` | the Project URL from step 1.2 |
| `SUPABASE_SERVICE_KEY` | the service_role key |

From then on every enquiry also appears under Leads / Recruitment in the admin.
The web app URL stays `https://script.google.com/macros/s/AKfycbxOF_MXvKpGdeAaA-8mcCO4XCQ3rC2SHDOtohflmKcEKOwjYBb8d6W8pWNuofrX7kq-/exec`.

## 3. Cloudflare Pages (hosting)

1. Push the repository to GitHub (`main` branch).
2. https://dash.cloudflare.com → sign up as studio@icp.firm.in → **Workers &
   Pages → Create → Pages → Connect to Git** → pick the repo.
3. Build settings: Framework **None**, build command `npm run build`, output
   directory `dist`, Node version `22` (Environment variable `NODE_VERSION=22`).
4. **Environment variables** (Production):

   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | Project URL |
   | `VITE_SUPABASE_ANON_KEY` | anon key |
   | `VITE_ENQUIRY_ENDPOINT` | the Apps Script web app URL above |
   | `SITE_URL` | `https://www.icp.firm.in` (used by the sitemap) |
   | `NODE_VERSION` | `22` |

5. **Save and Deploy.** The first build gives a `*.pages.dev` address — check
   every page there (see the QA list below) before touching the domain.
6. Cloudflare rebuilds and redeploys automatically on every push to `main`.
   `public/_redirects` is already in the repo so deep links work.

## 4. Domain

1. Cloudflare → **Add a site** → `icp.firm.in` → Free plan. Cloudflare shows two
   nameservers; set them at the domain registrar (where icp.firm.in was bought).
   Propagation takes minutes to a day.
   - **Before changing nameservers**, copy every existing DNS record (especially
     `MX` records for email!) into Cloudflare, or email to studio@icp.firm.in
     will stop. Cloudflare usually imports them automatically — verify.
2. Workers & Pages → the project → **Custom domains → Set up a custom domain** →
   `www.icp.firm.in`, then add `icp.firm.in` too (Cloudflare redirects the bare
   domain to www). SSL is automatic.
3. Supabase → Authentication → URL Configuration → Site URL
   `https://www.icp.firm.in`, add it to Redirect URLs.

## 5. Keep the free database awake

Supabase pauses free projects after 7 days without traffic. Create a free
https://uptimerobot.com monitor: HTTP(S), URL
`https://<ref>.supabase.co/rest/v1/categories?select=slug`, add a custom header
`apikey: <anon key>`, interval 5 minutes. (Also alerts you if the site is down.)

## 6. Search engines

1. https://search.google.com/search-console → add property
   `https://www.icp.firm.in` → verify via Cloudflare DNS (TXT record).
2. Sitemaps → submit `https://www.icp.firm.in/sitemap.xml`. It is regenerated
   on every deploy with all published projects.

## 7. Launch QA (on the live domain)

- Every page loads and refreshes: `/`, `/about`, `/clients`, `/portfolio`,
  each category, a project, `/testimonials`, `/enquiry`
- Enquiry form: submit a lead and an application → rows in both Google Sheets,
  emails received, entries under Leads / Recruitment in the admin
- Admin login works at `/admin`; create a project with photos, publish, view
  on the site, delete it
- iPad landscape and portrait; a phone shows the block screen
- Share a project link on WhatsApp → preview shows the title and image
- `https://www.icp.firm.in/sitemap.xml` and `/robots.txt` load

## 8. Handover

- Invite the developer as a collaborator on GitHub / Cloudflare / Supabase only
  for the support period, then remove.
- The admin guide for staff is `docs/ADMIN-GUIDE.md`.
- Support window: 3 months from go-live (bug fixes, uptime, help using the admin).

## Costs after launch

Domain renewal (~₹1,200/yr). Everything else is on free tiers: Cloudflare
Pages, Supabase (until ~1 GB of images), Google Apps Script, UptimeRobot.
