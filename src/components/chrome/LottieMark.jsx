import { useEffect, useState } from 'react';
// LottieSvg: the SVG-only engine. The brand marks use layer effects (the grey
// tint on the wordmark), which the smaller LottieLight build does not render.
import { LottieSvg } from 'lottie-react';

/**
 * The studio's three brand animations, as supplied by the designer.
 *
 * `art` is where the visible artwork sits inside the canvas, as fractions of
 * the canvas width/height (measured from the rendered final frame). Callers
 * size and position the drawn mark from it rather than guessing at the canvas
 * padding. `ratio` is canvas height ÷ width.
 */
export const MARKS = {
  logo: {
    src: '/animations/logo/logo.json',
    assetsPath: '/animations/logo/images/',
    ratio: 1,
    art: { x: 0.2506, y: 0.4252, w: 0.4923, h: 0.1829 },
  },
  shortLogo: {
    src: '/animations/short-logo/short-logo.json',
    assetsPath: '/animations/short-logo/images/',
    ratio: 1080 / 1920,
    art: { x: 0.4199, y: 0.4597, w: 0.4465, h: 0.0693 },
  },
  signature: {
    src: '/animations/signature/signature.json',
    assetsPath: '/animations/signature/images/',
    ratio: 1,
    art: { x: 0.0763, y: 0.3725, w: 0.8504, h: 0.2878 },
  },
};

// Fetches a Lottie JSON once per URL. Files live in /public so they are never
// bundled into the JS.
const cache = new Map();

async function load(src) {
  if (!cache.has(src)) {
    cache.set(
      src,
      fetch(src).then((r) => {
        if (!r.ok) throw new Error(`Failed to load ${src}`);
        return r.json();
      })
    );
  }
  return cache.get(src);
}

/**
 * Renders one of the brand marks. `still` shows its final frame instead of
 * playing (used for the footer logo, which the design shows static).
 */
export default function LottieMark({ mark, loop = true, still = false, className, style }) {
  const config = MARKS[mark];
  const [data, setData] = useState(null);

  useEffect(() => {
    let active = true;
    load(config.src)
      .then((json) => active && setData(json))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [config.src]);

  if (!data) return <div className={className} style={style} aria-hidden="true" />;

  return (
    <LottieSvg
      src={data}
      assetsPath={config.assetsPath}
      loop={still ? false : loop}
      segment={still ? [Math.max(data.ip, data.op - 1), data.op] : undefined}
      autoplay
      className={className}
      style={style}
      aria-hidden="true"
    />
  );
}
