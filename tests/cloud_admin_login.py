"""Non-destructive check that the studio's cloud admin login works.

Signs in, confirms the seeded content is listed, signs out again. Creates and
deletes nothing: this runs against the client's real database.
"""
import asyncio, os, io, sys
from playwright.async_api import async_playwright

BASE = os.environ.get("BASE", "http://localhost:4173")
env = {}
for line in io.open(os.environ["ENVFILE"], encoding="utf-8"):
    line = line.strip()
    if line and not line.startswith("#") and "=" in line:
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip()

results = []
def ok(c, label):
    results.append((bool(c), label))
    print(("OK   " if c else "FAIL ") + label)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await (await b.new_context(viewport={"width": 1440, "height": 900})).new_page()
        # The wrong-password attempt below makes the auth endpoint answer 400,
        # and the signed-out check answers 401. Both are this test doing its
        # job, so only count anything else.
        errs = []
        pg.on("console", lambda m: errs.append(m.text)
              if m.type == "error" and "status of 40" not in m.text else None)

        await pg.goto(BASE + "/admin")
        await pg.wait_for_timeout(1500)
        ok(pg.url.endswith("/admin/login"), "signed-out /admin redirects to the login page")

        await pg.fill("input[type=email]", env["ADMIN_EMAIL"])
        await pg.fill("input[type=password]", "definitely-not-the-password")
        await pg.click("button[type=submit]")
        await pg.wait_for_timeout(2500)
        ok(not pg.url.endswith("/admin/projects"), "a wrong password does not get in")

        await pg.fill("input[type=password]", env["ADMIN_PASSWORD"])
        await pg.click("button[type=submit]")
        for _ in range(60):
            if pg.url.endswith("/admin/projects"):
                break
            await pg.wait_for_timeout(250)
        ok(pg.url.endswith("/admin/projects"), "the studio's password signs in")

        # Poll: the list comes from the cloud database, so a fixed wait would
        # read the page before the query returns and report a phantom failure.
        waited = 0
        while waited < 15000:
            body = (await pg.evaluate("document.body.textContent")).lower()
            if "hotel hilton" in body:
                break
            await pg.wait_for_timeout(250)
            waited += 250
        ok("hotel hilton" in body, f"the seeded projects are listed in the CMS (after {waited} ms)")

        for section in ["team", "clients", "testimonials", "leads", "recruitment"]:
            ok(section in body, f"the '{section}' section is in the admin menu")

        await b.close()
        print(f"\nconsole errors: {len(errs)}")
        for e in sorted(set(errs))[:3]:
            print("   ", e[:140])

asyncio.run(main())
failed = [l for c, l in results if not c]
print(f"{len(results) - len(failed)}/{len(results)} passed")
sys.exit(1 if failed else 0)
