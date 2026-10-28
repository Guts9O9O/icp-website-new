"""Every page of the public site at every screen size, checked by
layout_audit.js for what a visitor would see go wrong: text cut off, on other
text or under the footer, the page scrolling, a name breaking out of the About
band, the listing's names reaching its pager, a tablet shown the phone screen.

env: BASE, ENGINE (chromium|webkit|firefox), FONT (native|roboto), OUT (dir),
     ONLY (comma list of size-name fragments), ROUTES (comma list of route names),
     SHOTS (1 = save a screenshot of every view), CONC (parallel contexts),
     SWEEP (1 = 49 in-between and extreme sizes instead of the device list)
FONT=roboto draws the site in Roboto, the face Android shows for Segoe UI
(fetched from Google Fonts). Exits 1 if any view has an issue.
"""
import asyncio, json, os, sys, tempfile, time
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.environ.get("BASE", "http://localhost:5173").rstrip("/")
ENGINE = os.environ.get("ENGINE", "chromium")
FONT = os.environ.get("FONT", "native")
OUT = os.environ.get("OUT", os.path.join(tempfile.gettempdir(), "icp-layout"))
SHOTS = os.environ.get("SHOTS", "1") == "1"
CONC = int(os.environ.get("CONC", "5"))
AUDIT = open(os.path.join(HERE, "layout_audit.js"), encoding="utf-8").read()

# name: (viewport w, h, screen w, h, touch)
SIZES = {
    # desktops and laptops (browser window inside the screen)
    "desk-2560x1305": (2560, 1305, 2560, 1440, False),
    "desk-2560x1600": (2560, 1600, 2560, 1600, False),
    "desk-2560x950-ultrawide": (2560, 950, 2560, 1080, False),
    "user-2048x1100": (2048, 1100, 2048, 1152, False),
    "desk-1920x1080-full": (1920, 1080, 1920, 1080, False),
    "desk-1920x945": (1920, 945, 1920, 1080, False),
    "desk-1920x860-bookmarks": (1920, 860, 1920, 1080, False),
    "desk-1680x930": (1680, 930, 1680, 1050, False),
    "lap-1536x730": (1536, 730, 1536, 864, False),
    "lap-1440x790": (1440, 790, 1440, 900, False),
    "lap-1366x657": (1366, 657, 1366, 768, False),
    "lap-1280x680": (1280, 680, 1280, 800, False),
    "lap-1280x590": (1280, 590, 1280, 720, False),
    "lap-1024x650": (1024, 650, 1024, 768, False),
    # tablets, landscape (browser toolbar showing)
    "tab-xiaomi-1096x546": (1096, 546, 1097, 686, True),
    "tab-android-1280x680": (1280, 680, 1280, 800, True),
    "tab-galaxyS7-962x481": (962, 481, 962, 601, True),
    "tab-ipad-1024x690": (1024, 690, 1024, 768, True),
    "tab-ipadmini-1133x680": (1133, 680, 1133, 744, True),
    "tab-ipadair-1180x740": (1180, 740, 1180, 820, True),
    "tab-ipadpro11-1194x760": (1194, 760, 1194, 834, True),
    "tab-ipadpro13-1366x950": (1366, 950, 1366, 1024, True),
    # tablets, portrait
    "por-galaxyS7-601x866": (601, 866, 601, 962, True),
    "por-xiaomi-686x977": (686, 977, 686, 1097, True),
    "por-ipadmini-744x1060": (744, 1060, 744, 1133, True),
    "por-ipad-768x954": (768, 954, 768, 1024, True),
    "por-android-800x1160": (800, 1160, 800, 1280, True),
    "por-ipadair-820x1110": (820, 1110, 820, 1180, True),
    "por-ipadpro11-834x1124": (834, 1124, 834, 1194, True),
    "por-ipadpro13-1024x1296": (1024, 1296, 1024, 1366, True),
    # phones: must get the mobile block
    "phone-390x844": (390, 664, 390, 844, True),
    "phone-land-844x390": (844, 340, 390, 844, True),
    "phone-land-932x430": (932, 380, 430, 932, True),
}

if os.environ.get("SWEEP") == "1":
    SIZES = {}
    for w in (900, 1000, 1150, 1300, 1450, 1600, 1760, 2200, 2400, 3440, 3840):
        for ratio in (0.45, 0.52, 0.6, 0.68):
            h = int(w * ratio)
            SIZES[f"sw-{w}x{h}"] = (w, h, w, int(h * 1.12), False)
    for w, h in ((1280, 520), (1440, 600), (1920, 700), (1100, 560), (1050, 520)):
        SIZES[f"short-{w}x{h}"] = (w, h, w, h + 120, w < 1200)

# Projects with the longest write-ups and names when this was written. A slug
# the studio has since removed just redirects to its category, which is then
# what gets checked.
PROJECTS = [
    ("hospitality", "hotel-sahara-star"),
    ("hospitality", "sankama-the-boutique-hotel"),
    ("commercial", "dark-temptations"),
    ("commercial", "cakewalk"),
    ("builders-developers", "raheja-atlantis"),
    ("private-residences", "pvt-bungalow"),
    ("bespoke-elements", "chandelier"),
]
CATS = ["builders-developers", "hospitality", "commercial", "private-residences", "bespoke-elements"]

# name: (path, action)
ROUTES = {"home": ("/", None), "home-menu": ("/", "menu"), "home-contact": ("/", "contact"),
          "about": ("/about", None), "about-studio": ("/about", "studio"), "about-archna": ("/about", "archna"),
          "portfolio": ("/portfolio", None), "clients": ("/clients", None), "clients-p2": ("/clients", "next"),
          "enquiry": ("/enquiry", None), "testimonials": ("/testimonials", None), "testimonials-long": ("/testimonials", "next")}
for c in CATS:
    ROUTES[f"cat-{c}"] = (f"/portfolio/{c}", None)
for n in (2, 4):
    ROUTES[f"cat-builders-developers-p{n}"] = (f"/portfolio/builders-developers?page={n}", None)
ROUTES["cat-hospitality-p2"] = ("/portfolio/hospitality?page=2", None)
for c, s in PROJECTS:
    ROUTES[f"proj-{s}"] = (f"/portfolio/{c}/{s}", None)

ROBOTO = """
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&display=block');
body, .font-brand, .t-strong, .t-strong *, button, input, select, textarea { font-family: Roboto, sans-serif !important; }
"""
INIT_FONT = "(() => { const add = () => { const s = document.createElement('style'); s.textContent = %s; document.head.appendChild(s); }; if (document.head) add(); else document.addEventListener('DOMContentLoaded', add); })();" % json.dumps(ROBOTO)


async def settle(pg):
    try:
        await pg.wait_for_load_state("networkidle", timeout=15000)
    except Exception:
        pass
    await pg.evaluate("document.fonts.ready.then(() => true)")
    t0 = time.time()
    while time.time() - t0 < 10:
        done = await pg.evaluate("[...document.images].filter(i => i.getBoundingClientRect().width > 1).every(i => i.complete)")
        if done:
            break
        await pg.wait_for_timeout(200)
    await pg.wait_for_timeout(1300)


async def act(pg, action, touch):
    click = (lambda loc: loc.tap()) if touch else (lambda loc: loc.click())
    if action == "menu":
        await click(pg.get_by_role("button", name="Menu").first)
    elif action == "contact":
        loc = pg.get_by_role("link", name="Contact Us").first
        if touch:
            await loc.tap()
        else:
            await loc.hover()
    elif action == "studio":
        await click(pg.locator('[aria-label="About iC+P"]').last)
    elif action == "archna":
        await click(pg.locator('[aria-label^="About Archna"]').last)
    elif action == "next":
        btn = pg.get_by_role("button", name="Next").last
        if await btn.count() == 0:
            return False
        await click(btn)
    await pg.wait_for_timeout(1000)
    return True


async def run_size(browser, sem, name, spec, routes, results):
    vw, vh, sw, sh, touch = spec
    async with sem:
        ctx = await browser.new_context(viewport={"width": vw, "height": vh}, screen={"width": sw, "height": sh},
                                        has_touch=touch, device_scale_factor=1)
        if FONT == "roboto":
            await ctx.add_init_script(INIT_FONT)
        pg = await ctx.new_page()
        errors = []
        pg.on("pageerror", lambda e: errors.append(str(e)))
        for rname in routes:
            path, action = ROUTES[rname]
            if name.startswith("phone") and rname not in ("home", "about"):
                continue
            try:
                await pg.goto(BASE + path, wait_until="domcontentloaded")
                await settle(pg)
                if action:
                    ok = await act(pg, action, touch)
                    if not ok:
                        continue
                    await settle(pg)
                blocked = await pg.evaluate("document.body.innerText.includes('designed for larger screens')")
                issues = await pg.evaluate(AUDIT)
                if name.startswith("phone"):
                    issues = [] if blocked else [{"type": "phone-not-blocked", "detail": ""}]
                elif blocked:
                    issues = [{"type": "tablet-blocked", "detail": "mobile block shown"}]
                if SHOTS:
                    d = os.path.join(OUT, "shots", name)
                    os.makedirs(d, exist_ok=True)
                    await pg.screenshot(path=os.path.join(d, f"{rname}.png"))
                results.append({"size": name, "route": rname, "issues": issues})
                flag = "  " if not issues else "!!"
                print(f"{flag} {name:28} {rname:34} {len(issues)}", flush=True)
            except Exception as e:  # keep going; report it
                results.append({"size": name, "route": rname, "issues": [{"type": "error", "detail": str(e)[:200]}]})
                print(f"EE {name:28} {rname:34} {str(e)[:120]}", flush=True)
        if errors:
            results.append({"size": name, "route": "*", "issues": [{"type": "pageerror", "detail": e[:200]} for e in errors]})
        await ctx.close()


async def main():
    os.makedirs(OUT, exist_ok=True)
    only = [s for s in os.environ.get("ONLY", "").split(",") if s]
    sizes = {k: v for k, v in SIZES.items() if not only or any(o in k for o in only)}
    rsel = [r for r in os.environ.get("ROUTES", "").split(",") if r]
    routes = [r for r in ROUTES if not rsel or any(x == r or (x.endswith("*") and r.startswith(x[:-1])) for x in rsel)]
    results = []
    async with async_playwright() as p:
        browser = await getattr(p, ENGINE).launch()
        sem = asyncio.Semaphore(CONC)
        await asyncio.gather(*(run_size(browser, sem, n, s, routes, results) for n, s in sizes.items()))
        await browser.close()
    tag = f"{ENGINE}-{FONT}"
    with open(os.path.join(OUT, f"results-{tag}.json"), "w", encoding="utf-8") as f:
        json.dump(results, f, indent=1)
    bad = [r for r in results if r["issues"]]
    print(f"\n{len(results)} views, {len(bad)} with issues")
    for r in sorted(bad, key=lambda r: (r["route"], r["size"])):
        for i in r["issues"]:
            print(f"  {r['route']:30} {r['size']:28} {i['type']:15} {i['detail']}")
    print(f"screenshots and results in {OUT}")
    return 1 if bad else 0


sys.exit(asyncio.run(main()))
