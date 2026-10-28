"""Desktop must still look as the client approved it: screenshots the live
site and BASE (a local build) side by side at desktop sizes and reports where
they differ, with the animated marks hidden and the carousels held still.
Diff masks (white = changed) are saved next to the screenshots. A Google map
still loading in one shot shows up on /enquiry; that is not the site.
"""
import asyncio, os, tempfile
import numpy as np
from PIL import Image
from playwright.async_api import async_playwright

LIVE = os.environ.get("LIVE", "https://www.icp.firm.in").rstrip("/")
NEW = os.environ.get("BASE", "http://localhost:5173").rstrip("/")
OUT = os.environ.get("OUT", os.path.join(tempfile.gettempdir(), "icp-desktop-diff"))
os.makedirs(OUT, exist_ok=True)
SIZES = [(2048, 1100), (1920, 945)]
ROUTES = ["/", "/about", "/portfolio", "/portfolio/hospitality", "/portfolio/builders-developers?page=2", "/clients",
          "/enquiry", "/portfolio/commercial/dark-temptations", "/portfolio/bespoke-elements/chandelier"]
# Freeze what moves on its own: the lottie marks, the music bars, autoplay.
FREEZE = """
[data-lottie], .icp-eq { visibility: hidden !important; }
*, *::before, *::after { transition: none !important; animation: none !important; }
"""


async def shot(b, base, w, h, route, path):
    ctx = await b.new_context(viewport={"width": w, "height": h})
    await ctx.add_init_script("window.setInterval = () => 0;")  # stop carousels autoplaying
    pg = await ctx.new_page()
    await pg.goto(base + route, wait_until="networkidle")
    await pg.add_style_tag(content=FREEZE)
    await pg.wait_for_timeout(2500)
    await pg.screenshot(path=path)
    await ctx.close()


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        for w, h in SIZES:
            for r in ROUTES:
                name = f"{w}x{h}_{r.strip('/').replace('/', '_').replace('?', '_') or 'home'}"
                a, n = os.path.join(OUT, name + "_live.png"), os.path.join(OUT, name + "_new.png")
                await shot(b, LIVE, w, h, r, a)
                await shot(b, NEW, w, h, r, n)
                A = np.asarray(Image.open(a).convert("RGB")).astype(int)
                B = np.asarray(Image.open(n).convert("RGB")).astype(int)
                d = np.abs(A - B).max(axis=2) > 24
                frac = d.mean() * 100
                if d.any():
                    ys, xs = np.nonzero(d)
                    box = (xs.min(), ys.min(), xs.max(), ys.max())
                    Image.fromarray((d * 255).astype(np.uint8)).save(os.path.join(OUT, name + "_diff.png"))
                else:
                    box = None
                print(f"{name:60} changed {frac:6.3f}%  box {box}")
        await b.close()


asyncio.run(main())
