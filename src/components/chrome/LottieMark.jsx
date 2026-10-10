import { useCallback, useEffect, useRef, useState } from 'react';
// LottieSvg: the SVG-only engine. The brand marks use layer effects (the grey
// tint on the wordmark), which the smaller LottieLight build does not render.
import { LottieSvg } from 'lottie-react';

/**
 * The studio's three brand animations, as supplied by the designer.
 *
 * `art` is where the visible artwork sits inside the canvas: x/w as fractions
 * of the canvas width, y/h as fractions of its height. Measured from the
 * painted pixels of a rendered frame, not from element bounds, which include
 * geometry that is never drawn. Callers
 * size and position the drawn mark from it rather than guessing at the canvas
 * padding. `ratio` is canvas height ÷ width.
 *
 * The short logo is built to be opened: it rests as the compact "iC+P" mark
 * and expands into the full wordmark, so `art` records both states.
 */
export const MARKS = {
  logo: {
    src: '/animations/logo/logo.json',
    assetsPath: '/animations/logo/images/',
    ratio: 1,
    // Starts at the "i", not at the stray dot the export draws ~16px further
    // left (a duplicate of the i's tittle, on its own shape layer): the viewBox
    // leaves it outside, so it is never painted.
    art: { x: 0.266, y: 0.426, w: 0.477, h: 0.182 },
    repairDuplicateWordmark: true,
  },
  shortLogo: {
    src: '/animations/short-logo/short-logo.json',
    assetsPath: '/animations/short-logo/images/',
    ratio: 1080 / 1920,
    art: { x: 0.42, y: 0.4289, w: 0.4467, h: 0.1225 }, // expanded (final frame)
    artClosed: { x: 0.42, y: 0.4289, w: 0.1722, h: 0.1225 }, // "iC+P" (first frame)
  },
  // The signature is painted twice over: vector strokes write it on, and a
  // matted PNG fills it in. Both ship in a red of their own (#85271F) which is
  // neither the brand red nor the mist the client asked for on Home and
  // Portfolio — so the strokes are tinted from the JSON and the PNG is a
  // pre-tinted copy per variant. Same JSON, parsed separately per mark.
  signature: {
    src: '/animations/signature/signature.json',
    assetsPath: '/animations/signature/images-red/',
    ratio: 1,
    art: { x: 0.0767, y: 0.3744, w: 0.85, h: 0.2811 },
    tint: '#793220',
  },
  signatureMist: {
    src: '/animations/signature/signature.json',
    assetsPath: '/animations/signature/images-mist/',
    ratio: 1,
    art: { x: 0.0767, y: 0.3744, w: 0.85, h: 0.2811 },
    tint: '#c3bdb4',
  },
};

// Where the rule that runs along the footer has to stop: the "g" of "design"
// throws its tail down and to the left, and the client asked for the line to
// end just before it rather than run through it. Measured off R3 as a fraction
// of the signature's own box, so it holds whatever size the signature is drawn.
export const SIGNATURE_RULE_STOP = 0.155;

// Fetched once per URL and kept as text. Files live in /public so they are
// never bundled into the JS.
//
// Every animation gets its OWN parsed copy: the engine writes into the object
// it is given (it resolves asset paths and caches layer state there), so two
// animations sharing one object end up drawing each other's image layers —
// which looks like a doubled, ghosted logo that gets worse with every extra
// copy on the page.
const cache = new Map();

/**
 * Works around a fault in the supplied logo export, and only that one.
 *
 * Its wordmark is two text layers of the same words at different sizes (50 and
 * 54), the larger flagged as track-matted by the smaller. After Effects shows
 * that as one masked word; players draw both, so the letters come out doubled.
 * Hiding the matted copy leaves the plain text, which matches the short logo's
 * wordmark exactly.
 *
 * It must not be applied to the other marks: the short logo is built as
 * i + C + "oncepts" + P + "artners", where the two long pieces are matted
 * because that is how it opens from "iC+P" to the full name. Hiding those
 * would leave "iC  +P" with a hole in the middle.
 *
 * Delete this once the designer re-exports the logo.
 */
function repairDuplicateMattedText(json) {
  const comps = Object.fromEntries((json.assets ?? []).filter((a) => a.layers).map((a) => [a.id, a]));
  const walk = (layers = []) =>
    layers.forEach((layer) => {
      if (layer.ty === 5 && layer.tt) layer.hd = true;
      if (layer.ty === 0 && comps[layer.refId]) walk(comps[layer.refId].layers);
    });
  walk(json.layers);
  return json;
}

/**
 * Repaints a mark in one colour.
 *
 * White strokes are left alone: those are the track mattes that reveal the
 * writing stroke by stroke, and recolouring them would break the draw-on.
 */
function tint(json, hex) {
  const rgb = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const paint = (items = []) =>
    items.forEach((item) => {
      if (item.ty === 'gr') paint(item.it);
      if ((item.ty === 'st' || item.ty === 'fl') && Array.isArray(item.c?.k)) {
        const [r, g, b] = item.c.k;
        if (r > 0.9 && g > 0.9 && b > 0.9) return; // a matte, not ink
        item.c.k = [...rgb, item.c.k[3] ?? 1];
      }
    });
  const walk = (layers = []) => layers.forEach((l) => l.ty === 4 && paint(l.shapes));
  walk(json.layers);
  (json.assets ?? []).forEach((a) => walk(a.layers));
  return json;
}

async function load(src) {
  if (!cache.has(src)) {
    cache.set(
      src,
      fetch(src)
        .then((r) => {
          if (!r.ok) throw new Error(`Failed to load ${src}`);
          return r.text();
        })
        .catch((err) => {
          // Forget a failed attempt so the next mount can try again. Leaving
          // the rejected promise in the cache means one request cancelled by a
          // navigation mid-flight — which WebKit does readily — stops the mark
          // ever drawing again for the rest of the session.
          cache.delete(src);
          throw err;
        })
    );
  }
  return JSON.parse(await cache.get(src));
}

/**
 * The rectangle a mark needs, covering every state it can be in, as fractions
 * of its canvas. Everything outside it is empty padding that the designer's
 * export carries around the artwork.
 */
export function artRect(mark) {
  const { art, artClosed } = MARKS[mark];
  if (!artClosed) return art;
  const x = Math.min(art.x, artClosed.x);
  const y = Math.min(art.y, artClosed.y);
  return {
    x,
    y,
    w: Math.max(art.x + art.w, artClosed.x + artClosed.w) - x,
    h: Math.max(art.y + art.h, artClosed.y + artClosed.h) - y,
  };
}

/** Width ÷ height of the drawn artwork, for sizing a box around it. */
export function artAspect(mark) {
  const rect = artRect(mark);
  return rect.w / (rect.h * MARKS[mark].ratio);
}

// How much faster than authored the hover open/close runs. The mark is a small
// footer detail: at its natural 2.3s it feels sluggish to open.
const HOVER_SPEED = 2.4;

/**
 * Renders one of the brand marks.
 *
 * `mode`:
 *   'intro' — draws itself whenever it appears, then holds its final frame.
 *             Every mount replays, so the signature animates on each page a
 *             visitor opens rather than only on the first one they land on.
 *   'still' — always the final frame, never animates.
 *   'hover' — rests on the first frame and plays forward while hovered or
 *             focused, reversing when the pointer leaves. Used for the footer
 *             logo, which opens from "iC+P" to the full name.
 *
 * `data-lottie` on the element reports the current state (loading / closed /
 * open / opening / closing / playing / complete) so behaviour can be asserted
 * in tests instead of eyeballed.
 */
export default function LottieMark({ mark, mode = 'intro', label, className, style }) {
  const config = MARKS[mark];
  const [data, setData] = useState(null);
  const [state, setState] = useState('loading');
  const handle = useRef(null);
  const element = useRef(null);
  const hovering = useRef(false);

  // How far through the animation we are, 0-100, written straight to the DOM.
  // It changes every frame, so it must not go through React state.
  const setProgress = useCallback((percent) => {
    if (element.current) element.current.dataset.lottieProgress = String(Math.round(percent));
  }, []);

  useEffect(() => {
    let active = true;
    // React can reuse a DOM node across route changes; clear any progress the
    // previous occupant left behind so it never reports a stale position.
    if (element.current) element.current.dataset.lottieProgress = '';
    load(config.src)
      .then((json) => {
        if (!active) return;
        if (config.repairDuplicateWordmark) repairDuplicateMattedText(json);
        if (config.tint) tint(json, config.tint);
        setData(json);
      })
      .catch(() => active && setState('error'));
    return () => {
      active = false;
    };
  }, [config]);

  // Decide what to show as soon as the engine has built the animation. Until
  // then nothing plays (autoplay is off), so a half-drawn frame can never leak.
  const onReady = useCallback(() => {
    const h = handle.current;
    if (!h) return;
    if (mode === 'hover') {
      h.setSpeed(HOVER_SPEED);
      h.seek(0);
      h.pause();
      setProgress(0);
      setState('closed');
      return;
    }
    if (mode === 'still') {
      h.seek({ percent: 100 });
      h.pause();
      setProgress(100);
      setState('complete');
      return;
    }
    h.setDirection('forward');
    h.play();
    setState('playing');
  }, [mode, setProgress]);

  const onFrame = useCallback(
    ({ currentFrame }) => {
      const total = (data?.op ?? 0) - (data?.ip ?? 0);
      if (total > 0) setProgress((currentFrame / total) * 100);
    },
    [data, setProgress]
  );

  const onComplete = useCallback(() => {
    // Pause explicitly: the engine keeps a frame loop alive after the last
    // frame, which costs a little battery and jitters sub-pixel antialiasing.
    handle.current?.pause();
    if (mode === 'hover') {
      const opened = hovering.current;
      setProgress(opened ? 100 : 0);
      setState(opened ? 'open' : 'closed');
      return;
    }
    setProgress(100);
    setState('complete');
  }, [mode, setProgress]);

  const open = useCallback(() => {
    if (mode !== 'hover') return;
    hovering.current = true;
    const h = handle.current;
    if (!h) return;
    h.setSpeed(HOVER_SPEED);
    h.setDirection('forward');
    h.play();
    setState('opening');
  }, [mode]);

  const close = useCallback(() => {
    if (mode !== 'hover') return;
    hovering.current = false;
    const h = handle.current;
    if (!h) return;
    h.setSpeed(HOVER_SPEED);
    h.setDirection('reverse');
    h.play();
    setState('closing');
  }, [mode]);

  const interactive = mode === 'hover';
  const rect = artRect(mark);
  const commonProps = {
    className,
    style,
    'data-lottie': state,
    'data-lottie-mark': mark,
    ...(interactive
      ? {
          onMouseEnter: open,
          onMouseLeave: close,
          onFocus: open,
          onBlur: close,
          tabIndex: 0,
          role: 'img',
          'aria-label': label ?? 'iConcepts + Partners',
        }
      : { 'aria-hidden': 'true' }),
  };

  // Before the JSON arrives, reserve the same box so nothing shifts.
  if (!data) return <div {...commonProps} ref={element} />;

  // Crop to the artwork with the SVG's own viewBox rather than by scaling a
  // bigger element inside a clipped box. The element then holds exactly what
  // is drawn, at its natural size: nothing to upscale, so the browser cannot
  // hand back a blurry or doubled raster of it.
  const viewBoxSize = [
    Math.round(rect.x * data.w),
    Math.round(rect.y * data.h),
    Math.round(rect.w * data.w),
    Math.round(rect.h * data.h),
  ].join(' ');

  return (
    <LottieSvg
      {...commonProps}
      ref={element}
      src={data}
      assetsPath={config.assetsPath}
      loop={false}
      autoplay={false}
      lottieRef={handle}
      rendererSettings={{ viewBoxSize, viewBoxOnly: true, preserveAspectRatio: 'xMidYMid meet' }}
      subscriptions={{ ready: onReady, complete: onComplete, frame: onFrame }}
    />
  );
}
