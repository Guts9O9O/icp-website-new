"""Turn a tablet while a page is open: landscape -> portrait -> landscape,
running layout_audit.js at each step. The page must re-fit without a reload.

Turned through Chrome's DevTools protocol, not set_viewport_size: Playwright's
resize also shrinks `screen` to the window, and the site tells phones from
tablets by the screen, so the "tablet" would turn into a phone. Chromium only.
In Roboto, as Android draws the site. Exits 1 if any step has an issue.
"""
import asyncio, json, os, sys
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.environ.get("BASE", "http://localhost:5173").rstrip("/")
AUDIT = open(os.path.join(HERE, "layout_audit.js"), encoding="utf-8").read()
ROBOTO = """@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&display=block');
body, .font-brand, .t-strong, .t-strong *, button, input, select, textarea { font-family: Roboto, sans-serif !important; }"""
INIT = "(() => { const add = () => { const s = document.createElement('style'); s.textContent = %s; document.head.appendChild(s); }; if (document.head) add(); else document.addEventListener('DOMContentLoaded', add); })();" % json.dumps(ROBOTO)
DEVICES = {"xiaomi": ((1096, 546), (686, 977), (1097, 686)), "ipadair": ((1180, 740), (820, 1110), (820, 1180)),
           "galaxyS7": ((962, 481), (601, 866), (601, 962))}
PAGES = ["/", "/about", "/portfolio", "/portfolio/hospitality", "/portfolio/builders-developers?page=3", "/clients",
         "/enquiry", "/testimonials", "/portfolio/commercial/dark-temptations", "/portfolio/bespoke-elements/chandelier"]


async def main():
    bad = 0
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for dev, (land, por, screen) in DEVICES.items():
            ctx = await b.new_context(viewport={"width": land[0], "height": land[1]},
                                      screen={"width": screen[0], "height": screen[1]}, has_touch=True)
            await ctx.add_init_script(INIT)
            pg = await ctx.new_page()
            cdp = await ctx.new_cdp_session(pg)
            long_side, short_side = max(screen), min(screen)

            async def turn(size):
                # A real tablet keeps its screen; turning it swaps the sides.
                portrait = size[1] > size[0]
                await cdp.send("Emulation.setDeviceMetricsOverride", {
                    "width": size[0], "height": size[1], "deviceScaleFactor": 1, "mobile": False,
                    "screenWidth": short_side if portrait else long_side,
                    "screenHeight": long_side if portrait else short_side,
                    "screenOrientation": {"type": "portraitPrimary" if portrait else "landscapePrimary", "angle": 0 if portrait else 90}})

            for path in PAGES:
                await turn(land)
                await pg.goto(BASE + path, wait_until="networkidle")
                await pg.wait_for_timeout(1800)
                for step, size in (("portrait", por), ("landscape", land)):
                    await turn(size)
                    await pg.wait_for_timeout(1500)
                    issues = await pg.evaluate(AUDIT)
                    blocked = await pg.evaluate("document.body.innerText.includes('designed for larger screens')")
                    if blocked:
                        issues.append({"type": "tablet-blocked", "detail": ""})
                    bad += bool(issues)
                    print(("!! " if issues else "   ") + f"{dev:9} {path:42} -> {step:9} {len(issues)}")
                    for i in issues:
                        print(f"      {i['type']}: {i['detail']}")
            await ctx.close()
        await b.close()
    print("views with issues:", bad)
    return 1 if bad else 0


sys.exit(asyncio.run(main()))
