import asyncio, io, os
from playwright.async_api import async_playwright

BASE = os.environ.get("BASE", "http://localhost:5173")
ENGINE = os.environ.get("ENGINE", "chromium")
errors = []
aborted_fetches = []  # navigation-cancelled requests, reported separately
third_party = []  # console noise from other people's CDNs, reported separately
# The database the site is pointed at, so WebKit's "aborted by navigation"
# messages about our own data can be told from a genuine cross-origin failure.
# It moved from the local Supabase to the cloud one, and the match has to move
# with it or every navigation away from a loading page counts as an error.
def _db_hosts():
    # In the order Vite itself resolves them for a production build, so the
    # host this matches is the one the bundle under test actually calls. Both
    # are kept: a dev server and a preview build can point at different
    # databases, and the suite runs against either.
    roots = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
    found = [os.environ.get("VITE_SUPABASE_URL", "")]
    for name in (".env.production.local", ".env.production", ".env.local", ".env"):
        try:
            for line in io.open(os.path.join(roots, name), encoding="utf-8"):
                if line.startswith("VITE_SUPABASE_URL="):
                    found.append(line.split("=", 1)[1].strip())
                    break
        except OSError:
            pass
    return tuple({u.split("//", 1)[-1].rstrip("/") for u in found if u})


DB_HOSTS = _db_hosts()

results = []


def ok(c, label):
    results.append((bool(c), label))
    print(("OK   " if c else "FAIL ") + label)


async def run(vw, vh, tag):
    async with async_playwright() as p:
        b = await getattr(p, ENGINE).launch()
        pg = await b.new_page(viewport={"width": vw, "height": vh})

        # Fetches still in flight when we navigate away are aborted by the
        # browser. Playwright's WebKit driver surfaces those as page errors
        # worded "due to access control checks", although nothing in the page
        # actually goes unhandled — an in-page `unhandledrejection` listener
        # registers none of them, and Chromium reports none either. Counting
        # them would mean a suite that always reports errors, which is a suite
        # nobody reads.
        #
        # They are tallied separately rather than dropped, so the noise stays
        # visible without burying a real fault. The match is deliberately
        # narrow: our own origin and whichever database this build is pointed
        # at, so a genuine cross-origin failure (the Google Maps embed, say)
        # still counts as an error — it has to both end in that phrase and name
        # a host of ours. The content assertions remain the real guard either way.
        OURS = (BASE.split("//", 1)[-1].rstrip("/"), *DB_HOSTS)

        def note_pageerror(e):
            message = str(e)
            aborted = message.endswith("due to access control checks.") and any(o in message for o in OURS)
            (aborted_fetches if aborted else errors).append(f"[{tag}] {message}")

        pg.on("pageerror", note_pageerror)
        # Noise from other people's infrastructure, not from the site. Firefox
        # logs a console error for the `__cf_bm` cookie that Cloudflare sets on
        # Supabase's storage CDN — once per image — and for a couple of its own
        # internal modules. Nothing we serve or can change, and the bucket
        # assertions prove the images arrive, so these are tallied apart.
        THIRD_PARTY = ("__cf_bm", 'Could not load "search_impl"', 'Could not load "util"', 'Could not load "geometry"')

        def note_console(m):
            if m.type != "error":
                return
            (third_party if any(n in m.text for n in THIRD_PARTY) else errors).append(f"[{tag}] {m.text}")

        pg.on("console", note_console)
        pg.on("response", lambda r: errors.append(f"[{tag}] HTTP {r.status}: {r.url[:120]}") if r.status >= 400 else None)

        # direct loads. The enquiry page is matched on the domain rather than
        # one address: the studio edits their contact details from the admin,
        # and the suite should not fail when they do.
        checks = [("/", "iconcepts + partners"), ("/about", "about us"), ("/clients", "hegde house"), ("/portfolio", "bespoke elements"),
                  ("/portfolio/hospitality", "hotel hilton"), ("/portfolio/commercial", "projects coming soon"),
                  ("/portfolio/hospitality/hotel-hilton", "sq.ft./ sq.mt"), ("/enquiry", "@icp.firm.in")]
        for path, text in checks:
            await pg.goto(BASE + path)
            # Poll instead of sleeping a fixed time: content arrives from the
            # database, so a cold cloud query is slower than a local one, and a
            # fixed wait turns ordinary latency into a false failure. Report
            # how long it actually took so real slowness still shows up.
            waited = 0
            while waited < 8000:
                # textContent, not inner_text: the home title is screen-reader-only
                content = (await pg.evaluate("document.body.textContent")).lower()
                if text in content:
                    break
                await pg.wait_for_timeout(100)
                waited += 100
            ok(text in content, f"[{tag}] direct {path} (content after {waited} ms)")

        # redirects
        # These redirects wait on a fetch resolving first, so they are given a
        # deadline rather than a fixed pause: 900ms was usually enough and
        # occasionally was not, which showed up as a flake on WebKit.
        async def redirects_to(path, pred, label):
            await pg.goto(BASE + path)
            for _ in range(60):
                if pred(pg.url):
                    break
                await pg.wait_for_timeout(100)
            ok(pred(pg.url), f"[{tag}] {label}")

        await redirects_to("/nope", lambda u: u.rstrip("/") == BASE, "unknown route -> /")
        await redirects_to("/portfolio/nope", lambda u: u.endswith("/portfolio"), "unknown category -> /portfolio")
        await redirects_to("/portfolio/hospitality/nope", lambda u: u.endswith("/portfolio/hospitality"), "unknown project -> category")

        # click-through incl. transition timing, fast double navigation, back/forward
        await pg.goto(BASE + "/"); await pg.wait_for_timeout(600)
        await pg.hover("text=menu"); await pg.wait_for_timeout(600)
        await pg.click("a:has-text('portfolio')"); await pg.wait_for_timeout(700); ok(pg.url.endswith("/portfolio"), f"[{tag}] menu -> portfolio")
        await pg.click("[role=button]:has-text('Hospitality')"); await pg.wait_for_timeout(700)
        await pg.click("text=Hotel Hilton"); await pg.wait_for_timeout(700); ok(pg.url.endswith("/hotel-hilton"), f"[{tag}] listing -> detail")
        # carousel: arrow key + dots + resets on new project
        await pg.keyboard.press("ArrowRight"); await pg.wait_for_timeout(300)
        # Keyed off aria-current, not a colour class: R3 marks the current
        # image with a red ring around the dot rather than by filling it, so
        # the red now lives on a child element.
        dots = pg.locator("nav[aria-label='Images'] button[aria-current='true']")
        ok(await dots.count() == 1, f"[{tag}] carousel active dot after ArrowRight")
        await pg.click("header a:has-text('Hospitality')"); await pg.wait_for_timeout(700)
        await pg.click("text=Aamby Valley"); await pg.wait_for_timeout(900)
        first_active = await pg.locator("nav[aria-label='Images'] div button").nth(0).get_attribute("aria-current")
        ok(first_active == "true", f"[{tag}] carousel starts at image 1 for a different project")
        # home then immediately another page (leave/enter race)
        await pg.click("header a:has-text('home')"); await pg.wait_for_timeout(120)
        await pg.goto(BASE + "/about"); await pg.wait_for_timeout(1200)
        ok("about us" in (await pg.inner_text("body")).lower() and "aamby valley" not in (await pg.inner_text("body")).lower(), f"[{tag}] fast home->about: old page unmounted, about shown")
        await pg.click("header a:has-text('home')"); await pg.wait_for_timeout(900)
        ok("design team" not in (await pg.inner_text("body")).lower(), f"[{tag}] overlay unmounted after slide-out")
        await pg.go_back(); await pg.wait_for_timeout(900); ok(pg.url.endswith("/about"), f"[{tag}] browser back")
        await pg.go_forward(); await pg.wait_for_timeout(900); ok(pg.url.rstrip("/") == BASE, f"[{tag}] browser forward")

        # about hover panels; enquiry dropdown; portfolio hover
        await pg.goto(BASE + "/about"); await pg.wait_for_timeout(900)
        await pg.hover("text=Prachi"); await pg.wait_for_timeout(900)
        ok("co-founder" in (await pg.inner_text("aside[data-panel='writeup']")).lower(), f"[{tag}] about hover shows write-up panel")
        await pg.goto(BASE + "/enquiry"); await pg.wait_for_timeout(900)
        await pg.select_option("select >> nth=0", "Other"); await pg.wait_for_timeout(200)
        ok(await pg.locator("select").count() == 1, f"[{tag}] enquiry: 'Other' hides second dropdown")

        # images from bucket, versioned thumbnails
        async def image_srcs(path, expected):
            """Wait for the page's images to arrive, rather than guessing a delay.

            These come from the database, so a cold cloud query is slower than a
            local one and a fixed wait counts them before they exist.
            """
            await pg.goto(BASE + path)
            srcs = []
            for _ in range(80):
                srcs = await pg.eval_on_selector_all("main img", "e=>e.map(i=>i.src)")
                if len(srcs) == expected:
                    break
                await pg.wait_for_timeout(100)
            return srcs

        srcs = await image_srcs("/portfolio/hospitality", 5)
        ok(len(srcs) == 5 and all("/media/projects/hospitality/" in s and "thumb.webp?v=" in s for s in srcs), f"[{tag}] 5 thumbnails from bucket with version param")
        # /about also carries the "abou+ iC+P" lockup, which is a site asset
        # rather than a team photo, so count only what comes from the bucket.
        srcs = [s for s in await image_srcs("/about", 4) if "/media/team/" in s]
        ok(len(srcs) == 3 and all("?v=" in s for s in srcs), f"[{tag}] team photos versioned ({len(srcs)} from the bucket)")
        # no horizontal overflow
        await pg.goto(BASE + "/clients"); await pg.wait_for_timeout(900)
        sw = await pg.evaluate("document.documentElement.scrollWidth"); ok(sw <= vw, f"[{tag}] no horizontal overflow on clients ({sw}<= {vw})")
        await b.close()


async def main():
    sizes = os.environ.get("SIZES", "2560x1400,1440x900").split(",")
    for sz in sizes:
        w, h = map(int, sz.split("x"))
        await run(w, h, f"{ENGINE} {sz}")

asyncio.run(main())
fails = [l for c, l in results if not c]
extra = []
if aborted_fetches: extra.append(f"{len(aborted_fetches)} fetches aborted by navigation")
if third_party: extra.append(f"{len(third_party)} third-party console notices")
noise = f" (+{'; '.join(extra)})" if extra else ""
print()
print(f"{len(results) - len(fails)}/{len(results)} passed; errors: {len(errors)}{noise}")
for e in sorted(set(errors))[:10]:
    print("   ", e[:200])
