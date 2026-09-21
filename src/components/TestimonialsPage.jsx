import { useCallback, useEffect, useState } from 'react';
import { getTestimonials } from '../lib/api';
import { useData } from '../lib/useData';
import { fs, u, v } from '../lib/units';
import EdgeBars from './chrome/EdgeBars';
import SiteNav from './chrome/SiteNav';
import SiteFooter from './chrome/SiteFooter';
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
      <SiteNav title="testimonials" />

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
          </figure>
        ) : null}
      </main>

      {count > 1 && (
        <nav
          className="absolute left-0 right-0 flex items-center justify-center text-icp-mist"
          style={{ top: v(1300), fontSize: fs(20, 12), gap: u(60) }}
          aria-label="Testimonials"
        >
          <button type="button" onClick={() => go((i) => (i - 1 + count) % count)} className="flex items-center" style={{ gap: u(10) }}>
            <span aria-hidden="true">‹</span>
            <span>previous</span>
          </button>
          <div className="flex items-center" style={{ gap: u(25) }}>
            {list.map((t, i) => (
              <button
                key={t.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Testimonial ${i + 1}`}
                className={`rounded-full transition-colors ${i === index ? 'bg-icp-red' : 'bg-icp-mist/70 hover:bg-icp-mist'}`}
                style={{ width: u(10), height: u(10), minWidth: 6, minHeight: 6 }}
              />
            ))}
          </div>
          <button type="button" onClick={() => go((i) => (i + 1) % count)} className="flex items-center" style={{ gap: u(10) }}>
            <span>next</span>
            <span aria-hidden="true">›</span>
          </button>
        </nav>
      )}

      <SiteFooter />
    </div>
  );
}
