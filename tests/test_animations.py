"""Brand animation behaviour.

Every mark must settle into a complete, stable state, never sit half-drawn,
and the footer logo must open from "iC+P" to the full wordmark on hover and
close again. Assertions read the animation's own reported state and progress
(`data-lottie`, `data-lottie-progress`) plus page screenshots, so they mean the
same thing in every engine.

    python test_animations.py [chromium|webkit|firefox]
"""
import sys, asyncio, os, os, io
import numpy as np
from PIL import Image, ImageChops
from playwright.async_api import async_playwright

ENGINE = sys.argv[1] if len(sys.argv) > 1 else "chromium"
BASE = os.environ.get("BASE", "http://localhost:5173")
OUT = os.environ.get("OUT", ".")
FOOTER = {"x": 0, "y": 610, "width": 1440, "height": 200}
results = []


def ok(cond, label):
    results.append((bool(cond), label))
    print(("OK   " if cond else "FAIL ") + label)


def node(pg, mark):
    # Home stays mounted under the sliding overlay, so the visible mark is the last one.
    # Prefix match: the signature is drawn in mist on Home and Portfolio and in
    # red elsewhere, which are two separate marks over the same animation.
    return pg.locator(f'[data-lottie-mark^="{mark}"]').last


async def state(pg, mark):
    el = node(pg, mark)
    return await el.get_attribute("data-lottie") if await el.count() else None


async def progress(pg, mark):
    el = node(pg, mark)
    raw = await el.get_attribute("data-lottie-progress") if await el.count() else None
    return None if raw is None else int(raw)


async def settle(pg, mark, want, tries=40):
    for _ in range(tries):
        if await state(pg, mark) == want:
            return True
        await pg.wait_for_timeout(250)
    return False


async def shot(pg, clip=FOOTER):
    """Crop from a viewport screenshot.

    `clip` coordinates in Playwright are relative to the document, but the
    footer is fixed to the viewport, so any scrolling would slide the crop off
    the thing being measured. Cropping the viewport image avoids that entirely.
    """
    img = Image.open(io.BytesIO(await pg.screenshot())).convert("RGB")
    return img.crop((
        round(clip["x"]),
        round(clip["y"]),
        round(clip["x"] + clip["width"]),
        round(clip["y"] + clip["height"]),
    ))


async def viewport_box(pg, mark):
    """The mark's box in viewport coordinates, whatever the scroll position."""
    return await pg.evaluate(
        """(m)=>{const all=document.querySelectorAll('[data-lottie-mark^="'+m+'"]');
        const r=all[all.length-1].getBoundingClientRect();
        return {x:r.x,y:r.y,width:r.width,height:r.height};}""",
        mark,
    )


def changed_box(a, b, threshold=32):
    """Where two screenshots differ by something a person could see."""
    diff = ImageChops.difference(a, b).convert("L")
    return diff.point(lambda v: 255 if v > threshold else 0).getbbox()


def worst_pixel(a, b):
    return max(hi for _, hi in ImageChops.difference(a, b).getextrema())


def ink_columns(img, background):
    """Columns that differ from the page background — i.e. where the mark paints."""
    diff = ImageChops.difference(img.convert("RGB"), Image.new("RGB", img.size, background)).convert("L")
    mask = diff.point(lambda v: 255 if v > 24 else 0)
    return [x for x in range(img.width) if mask.crop((x, 0, x + 1, img.height)).getbbox()]


def wordmark_coverage(cols, merge=8):
    """How continuous the wordmark is, ignoring the roundel that precedes it.

    Letters sit close together, so a whole wordmark is nearly solid. If a
    layer carrying part of the name is wrongly hidden the name breaks into
    islands with a wide hole between them, which this scores low.
    """
    if len(cols) < 2:
        return 0.0
    runs, start, prev = [], cols[0], cols[0]
    for c in cols[1:]:
        if c > prev + merge:
            runs.append((start, prev))
            start = c
        prev = c
    runs.append((start, prev))
    if len(runs) < 2:
        return 1.0
    word = [c for c in cols if c >= runs[1][0]]  # everything after the roundel
    return len(word) / (word[-1] - word[0] + 1)


async def images_settled(pg, tries=100):
    """Wait until every image on the page has finished loading.

    The "nothing moves on its own" checks compare two screenshots a moment
    apart. A photo arriving from the CDN between them is a real pixel change
    that has nothing to do with the animations, and on a cold cache it is slow
    enough to land inside that window.
    """
    for _ in range(tries):
        if await pg.evaluate("[...document.images].every(i => i.complete)"):
            return True
        await pg.wait_for_timeout(100)
    return False


def red_bands(img):
    """How many separate red bars sit above and below the roundel's centre."""
    a = np.asarray(img.convert("RGB")).astype(int)
    red = (a[:, :, 0] > a[:, :, 1] + 35) & (a[:, :, 0] > a[:, :, 2] + 35)
    rows = red.sum(axis=1)
    starts, running = [], False
    for i, v in enumerate(rows):
        if v > 2 and not running:
            starts.append(i)
            running = True
        elif v <= 2:
            running = False
    mid = img.height / 2
    return sum(1 for s in starts if s < mid), sum(1 for s in starts if s >= mid)


async def run(p):
    b = await getattr(p, ENGINE).launch()
    # 16:9, not 16:10. Most screens are, and the design's vertical unit is
    # derived from a 1600-tall artboard, so this is where anything that mixes
    # the horizontal and vertical units goes wrong — as the roundel did.
    ctx = await b.new_context(viewport={"width": 1440, "height": 810})
    pg = await ctx.new_page()
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)

    # --- home: the hero logo plays once and finishes
    await pg.goto(BASE + "/")
    ok(await settle(pg, "logo", "complete"), f"[{ENGINE}] home logo finishes and holds its final frame")
    ok(await progress(pg, "logo") == 100, f"[{ENGINE}] home logo rests at its last frame")

    # --- footer logo rests closed as "iC+P", never mid-draw
    # /clients has no slide-out panels, so nothing else in the footer can move.
    await pg.goto(BASE + "/clients")
    ok(await settle(pg, "shortLogo", "closed"), f"[{ENGINE}] footer logo rests closed")
    ok(await progress(pg, "shortLogo") == 0, f"[{ENGINE}] footer logo sits on its first frame (the iC+P mark)")

    box = await viewport_box(pg, "shortLogo")
    region = {"x": 0, "y": box["y"] - 10, "width": box["x"] + box["width"] + 40, "height": box["height"] + 20}

    async def logo_shot():
        return await shot(pg, region)

    await images_settled(pg)
    rest_a = await logo_shot()
    await pg.wait_for_timeout(1500)
    ok(worst_pixel(rest_a, await logo_shot()) <= 8, f"[{ENGINE}] footer logo does not animate on its own")

    # --- hover opens it to the full wordmark
    closed_shot = await logo_shot()
    await node(pg, "shortLogo").hover()
    ok(await settle(pg, "shortLogo", "open"), f"[{ENGINE}] hover opens the footer logo")
    ok(await progress(pg, "shortLogo") == 100, f"[{ENGINE}] opened logo reaches its last frame")
    open_shot = await logo_shot()
    grew = changed_box(closed_shot, open_shot)
    ok(grew is not None and grew[2] - grew[0] > 40, f"[{ENGINE}] opening visibly widens the mark (changed region {grew})")
    ok(grew is not None and grew[0] > 20, f"[{ENGINE}] the expansion happens to the right of the corner (starts at x={grew[0] if grew else None})")

    # --- the mark is whole: letters that belong to it must not go missing.
    # (A matted layer wrongly hidden leaves "iC  +P" with a hole in the middle.)
    bg = open_shot.getpixel((open_shot.width - 2, 2))
    open_cols = ink_columns(open_shot, bg)
    ok(open_cols and open_cols[-1] > open_shot.width * 0.7,
       f"[{ENGINE}] the open wordmark reaches across its box (last painted column {open_cols[-1] if open_cols else None} of {open_shot.width})")
    # Measured: a whole wordmark scores ~68%, one with a layer wrongly hidden
    # ("iC  +P") scores ~25%. Only the open state can tell them apart — closed,
    # those letters are collapsed either way.
    ok(wordmark_coverage(open_cols) > 0.5,
       f"[{ENGINE}] the open wordmark is continuous, no letters missing ({wordmark_coverage(open_cols):.0%} of it is painted)")

    # --- and closes again on leaving
    await pg.mouse.move(1350, 120)
    ok(await settle(pg, "shortLogo", "closed"), f"[{ENGINE}] moving away closes it again")
    ok(await progress(pg, "shortLogo") == 0, f"[{ENGINE}] it returns to the first frame")
    ok(worst_pixel(closed_shot, await logo_shot()) <= 16, f"[{ENGINE}] closed state looks the same as before the hover")

    # --- the roundel keeps its symmetry on screens that are not 16:10.
    # Its bars are drawn in matching pairs above and below the centre. Sizing
    # the mark's box with `u` across and `v` down made the box a different
    # shape from the artwork on any other aspect; `meet` then shrank the mark
    # until the lower bars fell between pixels and disappeared, leaving three
    # above and two below.
    short_box = await viewport_box(pg, "shortLogo")
    roundel = await shot(pg, {"x": short_box["x"], "y": short_box["y"],
                              "width": short_box["height"], "height": short_box["height"]})
    above, below = red_bands(roundel)
    ok(above == below and above >= 3,
       f"[{ENGINE}] the roundel is symmetric top to bottom ({above} bars above, {below} below)")

    # --- keyboard users get the same behaviour
    await node(pg, "shortLogo").focus()
    ok(await settle(pg, "shortLogo", "open"), f"[{ENGINE}] keyboard focus opens it too")
    await node(pg, "shortLogo").blur()
    ok(await settle(pg, "shortLogo", "closed"), f"[{ENGINE}] blur closes it")

    # --- the marks are where the design puts them: logo bottom-left, signature bottom-right
    vw = 1440
    lb = await viewport_box(pg, "shortLogo")
    sb = await viewport_box(pg, "signature")
    ok(lb["x"] < vw * 0.15, f"[{ENGINE}] logo sits in the bottom-left corner (x={round(lb['x'])})")
    ok(sb["x"] + sb["width"] > vw * 0.8, f"[{ENGINE}] signature sits at the bottom-right (right edge={round(sb['x'] + sb['width'])})")
    ok(sb["x"] > lb["x"] + lb["width"], f"[{ENGINE}] the two marks do not overlap")

    # --- signature draws once, then stays complete on every later page
    await pg.goto(BASE + "/")
    ok(await settle(pg, "signature", "complete"), f"[{ENGINE}] signature finishes drawing")
    ok(await progress(pg, "signature") == 100, f"[{ENGINE}] signature rests complete")

    for path in ["/about", "/clients", "/portfolio", "/portfolio/hospitality", "/enquiry", "/testimonials"]:
        await pg.goto(BASE + path)
        # Watch the whole arrival: the signature draws itself on every page,
        # not only on the first one a visitor lands on.
        seen = set()
        for _ in range(24):
            seen.add(await state(pg, "signature"))
            if "playing" in seen and await state(pg, "signature") == "complete":
                break
            await pg.wait_for_timeout(120)
        ok("playing" in seen, f"[{ENGINE}] {path}: signature draws itself on arrival (saw {sorted(x for x in seen if x)})")
        ok(await settle(pg, "signature", "complete") and await progress(pg, "signature") == 100,
           f"[{ENGINE}] {path}: signature is complete")
        ok(await state(pg, "shortLogo") == "closed", f"[{ENGINE}] {path}: footer logo starts closed")

    # --- and it also redraws on an in-page navigation, not just a fresh load.
    # (Clicking a link keeps the same JS context, which is where the signature
    # used to stay frozen on its final frame.)
    await pg.goto(BASE + "/clients")
    await settle(pg, "signature", "complete")
    # `.last`: home stays mounted under the overlay, so its nav carries a
    # second copy of this link that sits behind the visible page.
    await pg.locator('a[href="/enquiry"]').last.click()
    seen = set()
    for _ in range(24):
        seen.add(await state(pg, "signature"))
        await pg.wait_for_timeout(120)
    ok("playing" in seen, f"[{ENGINE}] clicking through to another page redraws the signature (saw {sorted(x for x in seen if x)})")
    ok(await settle(pg, "signature", "complete"), f"[{ENGINE}] and it finishes after the click-through")

    # --- a reload replays the intro cleanly rather than showing a part-drawn frame
    await pg.reload()
    await pg.wait_for_timeout(300)
    s = await state(pg, "signature")
    ok(s in ("loading", "playing", "complete"), f"[{ENGINE}] after reload the signature loads cleanly, never stuck part-drawn ({s})")
    ok(await settle(pg, "signature", "complete"), f"[{ENGINE}] and it completes")

    # --- nothing is left running once everything has settled
    await pg.goto(BASE + "/enquiry")
    await settle(pg, "signature", "complete")
    await images_settled(pg)
    a = await shot(pg)
    await pg.wait_for_timeout(2000)
    worst = worst_pixel(a, await shot(pg))
    ok(worst <= 8, f"[{ENGINE}] footer is visually static once settled (largest pixel change {worst}/255)")

    await pg.screenshot(path=f"{OUT}/anim-{ENGINE}.png")
    await b.close()
    print(f"\nconsole/page errors: {len(errors)}")
    for e in sorted(set(errors))[:5]:
        print("   ", e[:160])


async def main():
    async with async_playwright() as p:
        await run(p)
    failed = [l for c, l in results if not c]
    print(f"{len(results) - len(failed)}/{len(results)} passed")
    sys.exit(1 if failed else 0)


asyncio.run(main())
