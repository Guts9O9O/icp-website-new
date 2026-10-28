# Browser tests

Playwright suites that drive a real browser against a running site. They
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

# layout on every screen: 33 desktop, laptop, tablet (both ways up) and phone
# sizes, every page. FONT=roboto draws it as an Android tablet does.
python tests/test_layout.py
FONT=roboto python tests/test_layout.py
ENGINE=webkit ONLY=ipad python tests/test_layout.py     # Safari's engine, iPads
ONLY=xiaomi ROUTES=about,cat-hospitality python tests/test_layout.py
SWEEP=1 SHOTS=0 python tests/test_layout.py             # 49 in-between sizes

# turning a tablet with a page open (Chromium only)
python tests/test_rotation.py

# desktop unchanged: the live site against BASE, pixel by pixel
BASE=http://localhost:4173 python tests/compare_desktop.py
```

For the layout suites against live data, a production build is fastest:
`npm run build && npx vite preview` (port 4173), then `BASE=http://localhost:4173`.

`npm run test:enquiry` is separate — it checks the Apps Script's own rules in
Node, with no browser and no network.

## What each one covers

| Suite | Checks | Notes |
|---|---|---|
| `regress_public.py` | 48 | Two viewport sizes, every route, redirects, carousel, bucket images, overflow |
| `test_animations.py` | 44 | Every mark reaches a settled state; the footer logo opens and closes; the signature draws on each page |
| `test_form.py` | 11 | Subject/detail dropdowns, refusal of empty and malformed input, honeypot, map |
| `cloud_admin_login.py` | 9 | Auth gate, wrong password, sign-in, content listed, menu sections |
| `test_layout.py` | 796 views | Every page and state (menus open, About panels, page 2s, long write-ups) at 33 sizes; `layout_audit.js` does the checking |
| `test_rotation.py` | 60 views | Xiaomi, iPad Air and Galaxy Tab S7 turned to portrait and back on ten pages |
| `compare_desktop.py` | 18 pairs | Live vs BASE at 2048x1100 and 1920x945; % of pixels changed and where |

## Things these suites learned the hard way

Worth knowing before changing them, because each of these produced a false
result at some point:

- **Desktop testing hid every tablet bug.** The client's Android tablet shows
  about 1096x546 of page, in Roboto (Android has no Segoe UI), and counts
  `100vh` as ~96px taller than what it shows. None of that appears at desktop
  sizes in Segoe UI, so test short landscape, portrait and `FONT=roboto`.
- **A tablet is told from a phone by its screen**, not its window. Playwright's
  `set_viewport_size` also sets `screen` to the window size, which makes any
  short window a "phone"; `test_layout.py` sets `screen` per size and
  `test_rotation.py` turns the tablet through the DevTools protocol.

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

The write-up formats. The admin's editor saves HTML (since October 2026); older
write-ups and the seed copy in `src/data` are a plain-text format. The checks
cover where the two meet: an old write-up opening in the editor without losing
a mark or a level, and the plain words of either kind — used for meta
descriptions — coming out with no markup.

    node tests/format_roundtrip.mjs

No browser and no database: the converters are pure, which is why they live in
`src/lib/richTextParse.js` and `richTextFormat.js` (plain JS) rather than in
`richText.jsx`. The last checks parse the studio's real copy from the seed.
What the site draws from the HTML needs the DOM, so it is checked in a browser
rather than here.
