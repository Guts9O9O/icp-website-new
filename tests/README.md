# Browser tests

Four Playwright suites that drive a real browser against a running site. They
check behaviour and pixels, not implementation, so they work equally well
against `npm run dev`, a production preview, or the deployed URL.

## Setup

```bash
pip install playwright pillow numpy
python -m playwright install chromium webkit firefox
```

## Running

`BASE` picks the target; it defaults to `http://localhost:5173`.

```bash
# the public site: routing, layout, content, images, no overflow
BASE=https://icp-website-eight.vercel.app python tests/regress_public.py
ENGINE=webkit python tests/regress_public.py          # also: firefox
SIZES=2560x1400,1440x900 python tests/regress_public.py

# the brand animations: states, hover, the footer marks
python tests/test_animations.py chromium              # also: webkit, firefox

# the enquiry form: validation only — submits nothing
BASE=... python tests/test_form.py

# the admin panel: signs in, lists content, signs out. Changes nothing.
ENVFILE=.env.admin.local BASE=... python tests/cloud_admin_login.py
```

`npm run test:enquiry` is separate — it checks the Apps Script's own rules in
Node, with no browser and no network.

## What each one covers

| Suite | Checks | Notes |
|---|---|---|
| `regress_public.py` | 48 | Two viewport sizes, every route, redirects, carousel, bucket images, overflow |
| `test_animations.py` | 44 | Every mark reaches a settled state; the footer logo opens and closes; the signature draws on each page |
| `test_form.py` | 11 | Subject/detail dropdowns, refusal of empty and malformed input, honeypot, map |
| `cloud_admin_login.py` | 9 | Auth gate, wrong password, sign-in, content listed, menu sections |

## Things these suites learned the hard way

Worth knowing before changing them, because each of these produced a false
result at some point:

- **The home page stays mounted** under the sliding overlay, so most pages have
  two of everything — two footers, two navs, four `<aside>` elements. Selectors
  need `.last`, or a `data-` attribute that only the page under test carries.
- **Anchor on behaviour, not styling.** The carousel's current item was found
  by its red class until the design moved the red onto a ring; it now uses
  `aria-current`. The About panel uses `data-panel="writeup"`.
- **Never sleep a fixed time and then assert.** Content arrives from the
  database, and a cold query is far slower than a warm one. Poll for the
  condition and report how long it took.
- **Wait for images before comparing screenshots.** A photo arriving between
  two frames is a real pixel change that has nothing to do with the thing being
  tested; `images_settled()` exists for this.
- **Measure painted pixels, not element boxes.** The brand exports carry
  geometry that is never drawn, so bounding boxes lie about what a visitor
  sees.
- **Some console noise is not ours.** Fetches cancelled by navigation (WebKit
  reports them as page errors) and Cloudflare's `__cf_bm` cookie on Supabase's
  storage CDN (Firefox logs one per image) are tallied separately, so a real
  error is never buried. A suite that always reports errors is one nobody
  reads.

## format_roundtrip.mjs

The write-up format round trip: the plain text the About page, team bios and
category introductions are stored in, through the admin's editor, and back.

    node tests/format_roundtrip.mjs

No browser and no database — the converters are pure, which is why the parsing
half of the format lives in `src/lib/richTextParse.js` (plain JS) rather than
in `richText.jsx`. The studio's own copy is their words, so a serialiser that
quietly dropped a mark or a level would lose them; the last few checks parse
the real About and category copy to catch exactly that.
