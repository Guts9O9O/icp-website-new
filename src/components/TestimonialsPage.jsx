import { useCallback, useEffect, useState } from 'react';
import { getTestimonials } from '../lib/api';
import { useData } from '../lib/useData';
import { FADE_FOOT, PANEL_TEXT_TOP, fs, u, v } from '../lib/units';
import { useMoreBelow } from '../lib/useMoreBelow';
import EdgeBars from './chrome/EdgeBars';
import SiteNav from './chrome/SiteNav';
import SiteFooter from './chrome/SiteFooter';
import CarouselControls from './chrome/CarouselControls';
import { useSeo } from '../lib/seo';

const AUTOPLAY_MS = 9000;
const QUOTE_TOP = 420; // where the quote mark sits when there is room (design px)
const CONTROLS_TOP = 1418;

// One testimonial at a time with the same previous/dots/next controls as the
// project carousel. Content is managed from the admin panel.
export default function TestimonialsPage() {
  useSeo({ title: 'Testimonials', description: 'What clients say about working with iConcepts + Partners.' });
  const { data: items } = useData(getTestimonials);
  const list = items ?? [];
  const count = list.length;

  const [index, setIndex] = useState(0);
  const go = useCallback((next) => setIndex((i) => (typeof next === 'function' ? next(i) : next)), []);

  useEffect(() => {
    if (count < 2) return undefined;
    const timer = setInterval(() => go((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [count, index, go]);

  const current = list[Math.min(index, Math.max(count - 1, 0))];
  const [quoteRef, moreBelow] = useMoreBelow();

  return (
    <div className="relative min-h-page bg-icp-taupe font-brand text-icp-mist">
      <EdgeBars />
      <SiteNav title="Testimonials" />

      {/* The testimonial sits between the nav and the controls. It used to
          start at a fixed line and run on, so on a short screen a long one
          ran through the controls and the footer. Now it starts on that line
          while it has room, rises towards the nav when it needs more, and
          past that the quote itself scrolls, its foot fading. */}
      <main
        className="absolute left-0 right-0 flex flex-col items-center"
        style={{ top: v(PANEL_TEXT_TOP), bottom: `calc(${v(1600 - CONTROLS_TOP)} + max(${v(50)}, 14px))` }}
      >
        <div className="min-h-0 shrink" style={{ flexBasis: v(QUOTE_TOP - PANEL_TEXT_TOP) }} />
        {items && count === 0 ? (
          <p className="uppercase text-icp-mist/70" style={{ fontSize: fs(16, 12), letterSpacing: '0.3em', marginTop: v(200) }}>
            Testimonials coming soon
          </p>
        ) : current ? (
          <figure key={current.id} className="flex min-h-0 flex-col items-center text-center" style={{ width: `min(${u(1400)}, calc(100vw - ${u(200)}))` }}>
            <span aria-hidden="true" className="shrink-0 leading-none text-icp-red" style={{ fontSize: fs(160, 64), fontFamily: 'Georgia, serif', height: fs(110, 44) }}>
              “
            </span>
            <div
              ref={quoteRef}
              className="scroll-slim min-h-0 overflow-y-auto"
              style={{ marginTop: v(20), ...(moreBelow ? { WebkitMaskImage: FADE_FOOT, maskImage: FADE_FOOT } : null) }}
            >
              <blockquote className="text-white/90" style={{ fontSize: fs(30, 16), lineHeight: 1.7 }}>
                {current.quote}
              </blockquote>
            </div>
            <div className="shrink-0 bg-icp-red" style={{ width: u(80), height: `max(2px, ${u(3)})`, marginTop: v(60), marginBottom: v(40) }} />
            <figcaption className="shrink-0" style={{ fontSize: fs(20, 13), letterSpacing: '0.08em' }}>
              <span className="text-white">{current.author}</span>
              {current.company && <span className="text-icp-mist"> · {current.company}</span>}
            </figcaption>
            {/* The author's own signature, when the studio has added one
                (admin → Testimonials), as it was uploaded. */}
            {current.signature && (
              <img
                src={current.signature}
                alt={`Signature of ${current.author}`}
                className="shrink-0 object-contain"
                style={{ marginTop: v(36), maxHeight: v(150), maxWidth: u(420) }}
              />
            )}
          </figure>
        ) : null}
      </main>

      {count > 1 && (
        <div className="absolute left-0 right-0" style={{ top: v(CONTROLS_TOP) }}>
          <CarouselControls
            count={count}
            index={index}
            onSelect={go}
            onPrev={() => go((i) => (i - 1 + count) % count)}
            onNext={() => go((i) => (i + 1) % count)}
            label="Testimonials"
            itemLabel={(i) => `Testimonial ${i + 1}`}
          />
        </div>
      )}

      <SiteFooter />
    </div>
  );
}
