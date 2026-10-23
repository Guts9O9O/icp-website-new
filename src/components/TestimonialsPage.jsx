import { useCallback, useEffect, useState } from 'react';
import { getTestimonials } from '../lib/api';
import { useData } from '../lib/useData';
import { fs, u, v } from '../lib/units';
import EdgeBars from './chrome/EdgeBars';
import SiteNav from './chrome/SiteNav';
import SiteFooter from './chrome/SiteFooter';
import CarouselControls from './chrome/CarouselControls';
import { useSeo } from '../lib/seo';

const AUTOPLAY_MS = 9000;

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

  return (
    <div className="relative min-h-screen bg-icp-taupe font-brand text-icp-mist">
      <EdgeBars />
      <SiteNav title="Testimonials" />

      <main className="absolute left-0 right-0 flex justify-center" style={{ top: v(420) }}>
        {items && count === 0 ? (
          <p className="uppercase text-icp-mist/70" style={{ fontSize: fs(16, 12), letterSpacing: '0.3em', marginTop: v(200) }}>
            Testimonials coming soon
          </p>
        ) : current ? (
          <figure key={current.id} className="flex flex-col items-center text-center" style={{ width: `min(${u(1400)}, calc(100vw - ${u(200)}))` }}>
            <span aria-hidden="true" className="leading-none text-icp-red" style={{ fontSize: fs(160, 64), fontFamily: 'Georgia, serif', height: fs(110, 44) }}>
              “
            </span>
            <blockquote className="text-white/90" style={{ fontSize: fs(30, 16), lineHeight: 1.7, marginTop: v(20) }}>
              {current.quote}
            </blockquote>
            <div className="bg-icp-red" style={{ width: u(80), height: `max(2px, ${u(3)})`, marginTop: v(60), marginBottom: v(40) }} />
            <figcaption style={{ fontSize: fs(20, 13), letterSpacing: '0.08em' }}>
              <span className="text-white">{current.author}</span>
              {current.company && <span className="text-icp-mist"> · {current.company}</span>}
            </figcaption>
            {/* The author's own signature, when the studio has added one
                (admin → Testimonials), as it was uploaded. */}
            {current.signature && (
              <img
                src={current.signature}
                alt={`Signature of ${current.author}`}
                className="object-contain"
                style={{ marginTop: v(36), maxHeight: v(150), maxWidth: u(420) }}
              />
            )}
          </figure>
        ) : null}
      </main>

      {count > 1 && (
        <div className="absolute left-0 right-0" style={{ top: v(1418) }}>
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
