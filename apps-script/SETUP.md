# Enquiry form backend — setup

The website's enquiry form posts to a small Google Apps Script that runs inside
the studio's Google account (studio@icp.firm.in). Every submission is sorted
into one of two kinds:

| Subject on the form                | Kind        | Google Sheet            | Emails go to                              | Admin page  |
|------------------------------------|-------------|-------------------------|-------------------------------------------|-------------|
| Design Request, Other              | lead        | **Website Leads**       | `NOTIFY_TO_LEADS`                          | Leads       |
| Staff Recruitment                  | recruitment | **Website Recruitment** | `NOTIFY_TO_RECRUITMENT` (falls back to leads) | Recruitment |

For each submission the script appends a sheet row, emails the studio (reply-to
= the visitor), sends the visitor an acknowledgement, and mirrors the entry
into the website admin. No server, no monthly cost.

There are two ways to deploy it. **Path A** is for the developer (command
line); **Path B** is for anyone, in the browser. Both end with the same
one-minute step in the Apps Script editor.

---

## Path A — developer, from this repo (clasp)

One-time, on the developer's machine, **signed in as studio@icp.firm.in in the browser**:

1. Turn on the Apps Script API for the account: open
   https://script.google.com/home/usersettings and switch **Google Apps Script API** on.
2. In the project folder run `npx @google/clasp login` — a browser tab opens;
   sign in as studio@icp.firm.in and click **Allow**. (The token is stored in
   `~/.clasprc.json` on this machine only; run `npx @google/clasp logout` afterwards
   if the machine is shared.)

Then the developer runs, from the repo root:

```bash
cd apps-script
npx @google/clasp create-script --type standalone --title "iC+P website enquiry form"
npx @google/clasp push -f
npx @google/clasp create-deployment --description "Website enquiry form"
npx @google/clasp open-script
```

`create-deployment` prints a deployment ID; the web app URL is
`https://script.google.com/macros/s/<deployment id>/exec`.

Now do **"Finish in the editor"** below.

## Path B — anyone, in the browser

1. Go to https://script.google.com → **New project**. Name it
   `iC+P website enquiry form` (click "Untitled project" to rename).
2. Delete the contents of the editor and paste the whole of `Code.gs`.
3. Left sidebar → **Project Settings (gear)** → tick **Show "appsscript.json"
   manifest file in editor**. Back in the editor, open `appsscript.json`,
   replace its contents with the `appsscript.json` from this folder, and save.
4. **Deploy → New deployment** → gear → **Web app** → Execute as **Me**, Who has
   access **Anyone** → **Deploy** → **Authorize access** → choose the account →
   (**Advanced → Go to iC+P website enquiry form (unsafe)** if shown — it is
   your own script) → **Allow**. Copy the **Web app URL**.

Now do **"Finish in the editor"** below.

## Finish in the editor (both paths, ~1 minute)

1. In the Apps Script editor, choose **setup** in the function dropdown of the
   toolbar and click **Run**. First time, Google asks for permission — **Allow**.
   This creates the two Google Sheets in the account's Drive and remembers
   them. Open **View → Logs** (or the Execution log) to see their links.
2. **Project Settings → Script properties** → add:

   | Property                | Value                                                            |
   |-------------------------|------------------------------------------------------------------|
   | `NOTIFY_TO_LEADS`       | who receives design enquiries, e.g. `studio@icp.firm.in` (comma-separated for several) |
   | `NOTIFY_TO_RECRUITMENT` | who receives job applications (leave out to use the leads address) |
   | `STUDIO_PHONE`          | `+91 99 8792 1441` — shown in the acknowledgement email           |
   | `SUPABASE_URL`          | the website database URL (developer supplies)                     |
   | `SUPABASE_SERVICE_KEY`  | the website database service key (developer supplies; keep private) |

   `FROM_NAME` defaults to *iConcepts + Partners*.
3. Choose **sendTestEnquiry** → **Run**. Within a minute: one row in each sheet,
   two notification emails in the inbox(es) above, two acknowledgement emails in
   the account's own inbox, and two entries in the website admin (Leads and
   Recruitment).
4. Give the **Web app URL** to the developer — it becomes `VITE_ENQUIRY_ENDPOINT`
   on the website. Then submit the live form once to confirm.

---

## Day to day

- **Change who gets the emails:** edit the `NOTIFY_TO_…` script properties. No redeploy.
- **Share the sheets:** they are normal Google Sheets in Drive — share the
  recruitment sheet with whoever handles hiring without exposing leads.
- **Change email wording:** edit `Code.gs`, then **Deploy → Manage deployments
  → pencil → Version: New version → Deploy** (Path A: `clasp push -f` then
  `clasp create-deployment`). The URL stays the same only when you edit the
  existing deployment rather than creating a new one.
- **Limits:** 5 submissions per email address per hour, 200 per day, so spam
  cannot exhaust Google's email quota (100 emails/day on a free Gmail account,
  1,500/day on Google Workspace).

## If it stops working

- Google occasionally asks for re-authorisation after a long time: open the
  editor, run `sendTestEnquiry`, click **Allow**.
- If a sheet was deleted, the script creates a fresh one on the next
  submission (or run `setup` again).
- Whenever the script is unreachable, the website shows the studio's email
  address as a fallback so visitors can always get in touch.
