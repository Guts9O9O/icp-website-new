import { useEffect, useState } from 'react';
// LottieSvg: the SVG-only engine. The brand marks use layer effects (the grey
// tint on the wordmark), which the smaller LottieLight build does not render.
import { LottieSvg } from 'lottie-react';

// Fetches a Lottie JSON once per URL and renders it. Files live in /public so
// they are never bundled into the JS.
const cache = new Map();

// Marks every image layer hidden — used when an animation references image
// files the designer has not supplied, so nothing 404s or draws half-finished.
function hideImageLayers(json) {
  const walk = (layers = []) => layers.forEach((l) => l.ty === 2 && (l.hd = true));
  walk(json.layers);
  (json.assets ?? []).forEach((a) => walk(a.layers));
  return json;
}

async function load(src, hideImages) {
  const key = `${src}${hideImages ? '#no-images' : ''}`;
  if (!cache.has(key)) {
    cache.set(
      key,
      fetch(src)
        .then((r) => {
          if (!r.ok) throw new Error(`Failed to load ${src}`);
          return r.json();
        })
        .then((json) => (hideImages ? hideImageLayers(json) : json))
    );
  }
  return cache.get(key);
}

// `still` renders the animation's final frame as a static image instead of playing it.
export default function LottieMark({ src, assetsPath, hideImages = false, loop = true, still = false, className, style }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    let active = true;
    load(src, hideImages)
      .then((json) => active && setData(json))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [src, hideImages]);

  if (!data) return <div className={className} style={style} aria-hidden="true" />;

  return (
    <LottieSvg
      src={data}
      assetsPath={assetsPath}
      loop={still ? false : loop}
      segment={still ? [Math.max(data.ip, data.op - 1), data.op] : undefined}
      autoplay
      className={className}
      style={style}
      aria-hidden="true"
    />
  );
}

// Art bounds inside each 1080x1080 canvas (fractions), measured from the files.
// Used by SiteFooter to place the visible artwork, not the canvas.
export const SHORT_LOGO_ART = { x: 0.12, y: 0.428, w: 0.794, h: 0.123 };
export const SIGNATURE_ART = { x: 0.076, y: 0.3725, w: 0.85, h: 0.288 };
