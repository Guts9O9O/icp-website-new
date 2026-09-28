# Go-live runbook

Everything below is done once. Every account is created **in iC+P's name**
(studio@icp.firm.in) and the developer is added as a collaborator, so the
studio owns the site outright and can remove the developer's access at handover.

Estimated time: 1–2 hours, mostly waiting on DNS.

There are two stages, and they can be days apart:

- **Stage A — a link to show the client.** Sections 1 and 3 only. That gives a
  working `…vercel.app` address with the real database behind it, before the
  domain exists.
- **Stage B — launch.** Sections 2, 4–7.

## 0. Accounts needed

| Service | Purpose | Plan | Who signs up |
|---|---|---|---|
| GitHub | code hosting; every push deploys | Free | studio (org) or existing `studio329/ICP` repo |
| Supabase | database, admin login, image storage | Free (upgrade ~₹2,100/mo only if images exceed 1 GB) | studio@icp.firm.in |
| Vercel | hosting | Hobby for the preview link; **Pro (US$20/mo) once it serves the studio's domain** — see 3.6 | studio@icp.firm.in, signing in with GitHub |
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

## 3. Vercel (hosting)

1. Push the repository to GitHub (`main` branch).
2. https://vercel.com → **Continue with GitHub** as studio@icp.firm.in →
   **Add New → Project** → import the repo.
3. `vercel.json` in the repo already sets the framework (Vite), build command
   (`npm run build`), output directory (`dist`), caching, and the fallback that
   makes deep links like `/portfolio/hospitality` work on refresh. Leave the
   detected settings alone; just set **Node.js Version 22.x** under Settings →
   General.
4. **Environment variables** — add each one to *Production*, *Preview* and
   *Development*:

   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | Project URL from 1.2 |
   | `VITE_SUPABASE_ANON_KEY` | anon key from 1.2 |
   | `VITE_ENQUIRY_ENDPOINT` | the Apps Script web app URL above |
   | `SITE_URL` | `https://www.icp.firm.in` (used by the sitemap) |

   The service_role key is **not** among them — it never reaches the browser.
5. **Deploy.** The first build gives a `*.vercel.app` address. That is the link
   to send the client. Check every page there (section 7) before touching the
   domain. Every later push to `main` redeploys automatically, and every branch
   gets its own preview URL.
6. **Plan:** Vercel's free *Hobby* plan is for non-commercial use. A
   `*.vercel.app` link used to show work in progress is within that; the
   studio's live site on its own domain is not, so at launch either upgrade to
   **Pro (US$20/mo ≈ ₹1,700/mo)** or move hosting to **Cloudflare Pages**,
   which is free for commercial sites — see the appendix. Nothing in the code
   changes either way.

## 4. Domain

1. Vercel → the project → **Settings → Domains** → add `www.icp.firm.in`, then
   `icp.firm.in` (Vercel offers to redirect the bare domain to www — accept).
2. Vercel shows the exact DNS records to create. Add them at the registrar
   where `icp.firm.in` was bought — typically a `CNAME` for `www` and an `A`
   record for the bare domain. Use the values Vercel shows, not values copied
   from elsewhere.
   - **Do not** replace the domain's nameservers unless you first copy every
     existing record across, especially `MX` — otherwise email to
     studio@icp.firm.in stops. Adding the two records above avoids that risk
     entirely.
   - Propagation takes minutes to a day. HTTPS is issued automatically.
3. Supabase → Authentication → URL Configuration → Site URL
   `https://www.icp.firm.in`, add it to Redirect URLs.

## 5. Keep the free database awake

Supabase pauses free projects after 7 days without traffic. Create a free
https://uptimerobot.com monitor: HTTP(S), URL
`https://<ref>.supabase.co/rest/v1/categories?select=slug`, add a custom header
`apikey: <anon key>`, interval 5 minutes. (Also alerts you if the site is down.)

## 6. Search engines

1. https://search.google.com/search-console → add property
   `https://www.icp.firm.in` → verify with the TXT record it gives you, added
   at the registrar.
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

- Invite the developer as a collaborator on GitHub / Vercel / Supabase only
  for the support period, then remove.
- The admin guide for staff is `docs/ADMIN-GUIDE.md`.
- Support window: 3 months from go-live (bug fixes, uptime, help using the admin).

## Costs after launch

Domain renewal (~₹1,200/yr), plus hosting: Vercel Pro ~₹1,700/mo, or ₹0 on
Cloudflare Pages. Everything else is on free tiers: Supabase (until ~1 GB of
images), Google Apps Script, UptimeRobot.

---

## Appendix: hosting on Cloudflare Pages instead

Free for commercial use, and the repo already carries `public/_redirects` for
deep links. Replaces section 3; section 4 then points the domain at Cloudflare.

1. https://dash.cloudflare.com → sign up as studio@icp.firm.in → **Workers &
   Pages → Create → Pages → Connect to Git** → pick the repo.
2. Build settings: Framework **None**, build command `npm run build`, output
   directory `dist`, and an environment variable `NODE_VERSION=22`.
3. Add the same four environment variables as 3.4, then **Save and Deploy**.
4. Domain: Cloudflare → **Add a site** → `icp.firm.in` → Free plan → set the
   two nameservers it gives you at the registrar. **Copy every existing DNS
   record, especially `MX`, into Cloudflare first** — Cloudflare usually
   imports them automatically, but verify before switching. Then Workers &
   Pages → the project → **Custom domains** → add `www.icp.firm.in` and
   `icp.firm.in`.
