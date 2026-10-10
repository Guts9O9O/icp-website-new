"""Enquiry form behaviour on the live site.

Validation only: nothing here submits a valid enquiry, because a real
submission emails the studio and writes a row to their Google Sheet.
"""
import asyncio, os, sys
from playwright.async_api import async_playwright

BASE = os.environ.get("BASE", "http://localhost:5173")
results = []
def ok(c, label):
    results.append((bool(c), label)); print(("OK   " if c else "FAIL ") + label)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await (await b.new_context(viewport={"width": 1440, "height": 900})).new_page()
        errs = []
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        await pg.goto(BASE + "/enquiry"); await pg.wait_for_timeout(3000)

        selects = pg.locator("form select")
        ok(await selects.count() == 2, "Design Request shows a second dropdown for the category")
        await selects.nth(0).select_option("Staff Recruitment"); await pg.wait_for_timeout(400)
        opts = await selects.nth(1).locator("option").all_text_contents()
        ok(any("Interior Designer" in o for o in opts), f"Staff Recruitment swaps in the role list ({len(opts)} options)")
        await selects.nth(0).select_option("Other"); await pg.wait_for_timeout(400)
        ok(await pg.locator("form select").count() == 1, "'Other' hides the second dropdown")
        await selects.nth(0).select_option("Design Request"); await pg.wait_for_timeout(400)

        # submit empty -> complains, does not post
        posted = []
        pg.on("request", lambda r: posted.append(r.url) if r.method == "POST" else None)
        await pg.locator("form button[type=submit]").click(); await pg.wait_for_timeout(1200)
        body = (await pg.inner_text("form")).lower()
        ok("enter your name" in body or "please" in body, "empty submit is refused with a message")
        ok(not posted, f"nothing was sent to the server ({len(posted)} POSTs)")

        # a bad email is caught client-side
        await pg.fill("input[type=text] >> nth=0", "Test Person")
        await pg.fill("input[type=email]", "not-an-email")
        await pg.fill("textarea", "Checking validation only.")
        await pg.locator("form button[type=submit]").click(); await pg.wait_for_timeout(1200)
        body = (await pg.inner_text("form")).lower()
        ok("valid email" in body or "email" in body, "a malformed email is refused")
        ok(not posted, f"still nothing sent ({len(posted)} POSTs)")

        # the honeypot exists and is hidden from people
        hp = pg.locator("input[name=website]")
        ok(await hp.count() == 1, "the spam honeypot field is present")
        if await hp.count():
            # `is_visible()` counts an off-screen element as visible, so ask
            # where it actually is: the field is parked far outside the
            # viewport, untabbable and inside an aria-hidden wrapper.
            where = await hp.evaluate("""e => {
                const r = e.getBoundingClientRect();
                return { offScreen: r.right < 0 || r.bottom < 0 || r.left > innerWidth,
                         untabbable: e.tabIndex < 0,
                         hiddenFromAT: !!e.closest('[aria-hidden="true"], .sr-only') };
            }""")
            ok(where["offScreen"] and where["untabbable"] and where["hiddenFromAT"],
               f"and it is out of reach of real visitors ({where})")

        ok(await pg.locator("iframe").count() == 1, "the Google map is embedded")
        ok(len(errs) == 0, f"no console errors ({errs[:1]})")
        await b.close()

asyncio.run(main())
bad = [l for c, l in results if not c]
print(f"\n{len(results) - len(bad)}/{len(results)} passed")
sys.exit(1 if bad else 0)
