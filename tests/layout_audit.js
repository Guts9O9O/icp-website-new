// Layout audit, evaluated inside the page by test_layout.py and
// test_rotation.py. Returns the problems a visitor would see: text cut off,
// text on text, text under something opaque, text running into the footer,
// the footer marks or the nav, the page scrolling, the sound toggle off
// screen, a name breaking out of the About band, the listing's names reaching
// its pager, an image that failed to draw.
(() => {
  const issues = [];
  const add = (type, detail) => issues.push({ type, detail });
  const W = innerWidth;
  const H = innerHeight;
  const se = document.scrollingElement;
  if (se.scrollHeight > H + 1) add('vscroll', `${se.scrollHeight - H}px`);
  if (se.scrollWidth > W + 1) add('hscroll', `${se.scrollWidth - W}px`);

  const inter = (a, b) => {
    const l = Math.max(a.left, b.left), t = Math.max(a.top, b.top);
    const r = Math.min(a.right, b.right), btm = Math.min(a.bottom, b.bottom);
    return r > l && btm > t ? { left: l, top: t, right: r, bottom: btm, width: r - l, height: btm - t } : null;
  };
  const shown = (el) => {
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) return false;
      if (e.classList.contains('sr-only')) return false;
    }
    return true;
  };
  const label = (el) => {
    const t = (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40);
    return `<${el.tagName.toLowerCase()}> "${t}"`;
  };

  // Every visible line of text, cut to what its clipping ancestors show.
  const lines = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const n = walker.currentNode;
    if (!n.textContent.trim()) continue;
    const el = n.parentElement;
    if (!el || el.closest('script,style,option,select,noscript,[aria-hidden="true"],iframe')) continue;
    if (!shown(el)) continue;
    const range = document.createRange();
    range.selectNodeContents(n);
    for (const q of range.getClientRects()) {
      if (q.width < 1 || q.height < 1) continue;
      let clip = { left: 0, top: 0, right: W, bottom: H };
      let limiter = 'viewport';
      let scroller = null;
      for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
        const cs = getComputedStyle(a);
        if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue;
        const ar = a.getBoundingClientRect();
        const next = inter(clip, ar);
        if (!next) { clip = null; break; }
        if (next.width < clip.right - clip.left - 0.5 || next.height < clip.bottom - clip.top - 0.5) {
          limiter = a;
        }
        clip = next;
        if (/(auto|scroll)/.test(cs.overflowY)) scroller = a;
      }
      if (!clip) continue;
      const vis = inter(q, clip);
      if (!vis) continue; // wholly off screen / scrolled away / hidden panel
      const cut = q.height - vis.height > 2 || q.width - vis.width > 2;
      if (cut) {
        const inScroller = scroller && (limiter === scroller || limiter === 'viewport' ? scroller : null);
        if (!inScroller) {
          add('clipped-text', `${label(el)} cut by ${limiter === 'viewport' ? 'screen edge' : label(limiter)} (${Math.round(q.width - vis.width)}x${Math.round(q.height - vis.height)}px hidden)`);
        }
      }
      lines.push({ el, q, vis, text: n.textContent.trim().slice(0, 30), scroller });
    }
  }

  // Text on text.
  for (let i = 0; i < lines.length; i++) {
    for (let j = i + 1; j < lines.length; j++) {
      const A = lines[i], B = lines[j];
      if (A.el === B.el || A.el.contains(B.el) || B.el.contains(A.el)) continue;
      const shrink = (r) => ({ left: r.left + 1, right: r.right - 1, top: r.top + r.height * 0.18, bottom: r.bottom - r.height * 0.18 });
      const x = inter(shrink(A.vis), shrink(B.vis));
      if (x && x.width > 1.5 && x.height > 1.5) add('text-overlap', `"${A.text}" / "${B.text}" (${Math.round(x.width)}x${Math.round(x.height)}px)`);
    }
  }

  // Text under something opaque (the marks, rules, photos, panels).
  const style = document.createElement('style');
  style.textContent = '* { pointer-events: auto !important; }';
  document.head.appendChild(style);
  const paints = (e) => {
    if (['IMG', 'SVG', 'CANVAS', 'VIDEO', 'IFRAME'].includes(e.tagName.toUpperCase())) return true;
    const cs = getComputedStyle(e);
    if (cs.backgroundImage !== 'none') return true;
    const m = cs.backgroundColor.match(/rgba?\(([^)]+)\)/);
    if (m) {
      const p = m[1].split(',').map(Number);
      if ((p.length < 4 ? 1 : p[3]) >= 0.3) return true;
    }
    return false;
  };
  for (const L of lines) {
    const pts = [
      [L.vis.left + L.vis.width / 2, L.vis.top + L.vis.height / 2],
      [L.vis.left + 2, L.vis.top + L.vis.height / 2],
      [L.vis.right - 2, L.vis.top + L.vis.height / 2],
    ];
    for (const [x, y] of pts) {
      const stack = document.elementsFromPoint(x, y);
      const own = stack.findIndex((e) => e === L.el || L.el.contains(e) || e.contains(L.el));
      if (own < 0) continue;
      // Slide-over panels (About write-up and dimmer, home menus) cover the
      // page on purpose; the listing's segment panel must not.
      const overlay = (e) => e.closest('aside') && !e.closest('[data-panel="segment"]');
      const over = stack.slice(0, own).find((e) => !e.contains(L.el) && !L.el.contains(e) && paints(e) && !overlay(e));
      if (over) {
        add('covered-text', `"${L.text}" under ${label(over)}`);
        break;
      }
    }
  }
  style.remove();

  // Text that runs into the footer or under the nav.
  const footers = [...document.querySelectorAll('footer')].filter((f) => {
    const r = f.getBoundingClientRect();
    return r.left < W && r.right > 0 && shown(f);
  });
  const footer = footers[footers.length - 1];
  const music = document.querySelector('.icp-eq');
  const opacityOf = (el) => {
    let o = 1;
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity);
    return o;
  };
  const marks = [...document.querySelectorAll('[data-lottie]')].filter((m) => {
    const r = m.getBoundingClientRect();
    return r.width > 0 && r.left < W && r.right > 0 && r.top < H && r.bottom > 0 && shown(m) && opacityOf(m) >= 0.3;
  });
  const navs = [...document.querySelectorAll('header')].filter((h) => {
    const r = h.getBoundingClientRect();
    return r.left < W && r.right > 0 && shown(h);
  });
  const navGroups = navs.flatMap((h) => [...h.children]).map((c) => c.getBoundingClientRect()).filter((r) => r.width > 0 && r.left < W && r.right > 0);
  for (const L of lines) {
    if (footer && footer.contains(L.el)) continue;
    if (music && music.contains(L.el)) continue;
    if (navs.some((h) => h.contains(L.el))) continue;
    if (footer) {
      const rule = footer.getBoundingClientRect().top;
      if (L.vis.bottom > rule + 1 && !L.scroller) add('into-footer', `"${L.text}" ${Math.round(L.vis.bottom - rule)}px below the footer rule`);
    }
    for (const m of marks) {
      if (inter(L.vis, m.getBoundingClientRect())) add('on-mark', `"${L.text}" on ${m.getAttribute('aria-label') || 'footer mark'}`);
    }
    for (const g of navGroups) {
      const x = inter(L.vis, g);
      if (x && x.width > 1 && x.height > 1) add('under-nav', `"${L.text}" under the nav`);
    }
  }
  if (music) {
    const r = music.getBoundingClientRect();
    if (shown(music) && (r.bottom > H + 0.5 || r.top < 0)) add('music-offscreen', `toggle at ${Math.round(r.top)}-${Math.round(r.bottom)} of ${H}`);
  }

  // About: every name on one line, inside its strip.
  for (const cell of document.querySelectorAll('[data-band-label]')) {
    const t = cell.querySelector('[data-band-text]') || cell.lastElementChild;
    if (!t) continue;
    const cr = cell.getBoundingClientRect();
    const tr = t.getBoundingClientRect();
    const fsz = parseFloat(getComputedStyle(t).fontSize);
    if (tr.height > fsz * 1.7) add('band-wrap', `${label(t)} wraps (${Math.round(tr.height)}px tall at ${fsz}px)`);
    if (tr.left < cr.left - 0.5 || tr.right > cr.right + 0.5) add('band-overflow', `${label(t)} wider than its strip`);
  }

  // Listing: the pager clear of the names above it.
  const pager = document.querySelector('nav[aria-label="Pages"]');
  const names = [...document.querySelectorAll('main [role="link"]')];
  if (pager && names.length) {
    const top = pager.getBoundingClientRect().top;
    let low = 0;
    for (const n of names) {
      for (const p of n.querySelectorAll('p')) low = Math.max(low, p.getBoundingClientRect().bottom);
    }
    if (top - low < 8) add('pager-crowded', `pager ${Math.round(top - low)}px under the last line of text`);
    const photo = names[0].querySelector('img');
    if (photo) {
      const ph = photo.getBoundingClientRect().height;
      if (ph < 60) add('photo-squashed', `thumbnails only ${Math.round(ph)}px tall`);
    }
  }

  // Every visible image actually drawn.
  for (const img of document.images) {
    const r = img.getBoundingClientRect();
    if (r.width < 2 || r.right < 0 || r.left > W || r.bottom < 0 || r.top > H || !shown(img)) continue;
    if (!img.complete || img.naturalWidth === 0) add('image-missing', img.src.split('/').pop());
  }

  // One finding per kind + subject.
  const seen = new Set();
  return issues.filter((i) => {
    const k = i.type + i.detail.replace(/\d+px/g, '').replace(/\(\d+x\d+px.*\)/, '');
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
})();
