import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useParams } from 'react-router';
import { getCategory, getProject } from '../lib/api';
import { useData } from '../lib/useData';
import { EDGE_BAR, fs, u, v } from '../lib/units';
import EdgeBars from './chrome/EdgeBars';
import SiteNav from './chrome/SiteNav';
import SiteFooter from './chrome/SiteFooter';
import CarouselControls from './chrome/CarouselControls';
import { useSeo } from '../lib/seo';

// Measured off R4 page 10 (design px). The caption no longer sits on the
// photograph: a red panel runs down the left of the page carrying the
// project's name, area and description, and the image fills the rest.
const PANEL_W = 800;
const TEXT_LEFT = 131; // the write-up's left edge inside the panel
const TEXT_TOP = 555;
const FRAME_TOP = 328;
const FRAME_W = 1747;
const FRAME_H = 941;
const CONTROLS_TOP = 1335;
const AUTOPLAY_MS = 4000;

// R4 writes the area as "Area 0000 Sq.ft./ Sq.Mt". The zeroes are the
// designer's placeholder and stay until the studio fills the real figure in
// from the admin, which is how the listing pages read too.
function areaLabel(sqft) {
  if (!sqft) return 'Area 0000 Sq.ft./ Sq.Mt';
  const sqm = Math.round(sqft * 0.092903);
  return `Area ${sqft.toLocaleString('en-IN')} Sq.ft./ ${sqm.toLocaleString('en-IN')} Sq.Mt`;
}

// Single project view with image carousel: /portfolio/:category/:slug
export default function ProjectDetailPage() {
  const { category: categorySlug, slug } = useParams();

  const { data: category } = useData(() => getCategory(categorySlug), [categorySlug]);
  const { data: project, loading } = useData(() => getProject(categorySlug, slug), [categorySlug, slug]);
  useSeo({
    title: project ? `${project.name}${project.location ? `, ${project.location}` : ''}` : undefined,
    description: project ? `${project.name}${project.location ? `, ${project.location}` : ''} — ${category?.label ?? ''} interior design by iConcepts + Partners. ${(project.description ?? '').split(/\n\s*\n/).pop() ?? ''}` : undefined,
    image: project?.thumbnail?.startsWith('http') ? project.thumbnail : undefined,
  });

  const images = project?.images ?? [];
  const count = images.length;

  // Carousel position is remembered per project, so a new project starts at image 1.
  const [indexState, setIndexState] = useState({ slug, index: 0 });
  const index = indexState.slug === slug ? indexState.index : 0;
  const setIndex = useCallback(
    (next) =>
      setIndexState((s) => {
        const current = s.slug === slug ? s.index : 0;
        return { slug, index: typeof next === 'function' ? next(current) : next };
      }),
    [slug]
  );
  const startX = useRef(0);
  const dragging = useRef(false);

  useEffect(() => {
    if (count < 2) return undefined;
    const onKey = (e) => {
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % count);
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + count) % count);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [count, setIndex]);

  useEffect(() => {
    if (count < 2) return undefined;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [count, index, setIndex]);

  if (!loading && !project) return <Navigate to={`/portfolio/${categorySlug}`} replace />;

  const onPointerDown = (e) => {
    dragging.current = true;
    startX.current = e.clientX;
  };
  const onPointerUp = (e) => {
    if (!dragging.current || count < 2) return;
    dragging.current = false;
    const delta = e.clientX - startX.current;
    if (Math.abs(delta) < 40) return;
    setIndex((i) => (delta < 0 ? (i + 1) % count : (i - 1 + count) % count));
  };

  return (
    <div className="relative min-h-screen bg-icp-taupe font-brand text-icp-mist">
      <EdgeBars />
      <SiteNav title="Portfolio" titleTo="/portfolio" crumb={{ label: category?.label ?? '', to: `/portfolio/${categorySlug}` }} />

      {/* R4: a red panel down the left carrying the project's details, with
          the photography filling the rest of the page. */}
      <div
        className="absolute bottom-0 top-0 bg-icp-red"
        style={{ left: u(EDGE_BAR), width: u(PANEL_W) }}
      />

      {project && (
        <div
          className="absolute text-white tall:static tall:px-[calc(60*var(--u))] tall:pt-[calc(200*var(--v))]"
          style={{
            left: u(EDGE_BAR + TEXT_LEFT),
            top: v(TEXT_TOP),
            width: u(PANEL_W - TEXT_LEFT - 60),
            lineHeight: 1.7,
          }}
        >
          <p style={{ fontSize: fs(17, 12) }}>
            <span className="t-strong">{project.name}</span>
            {project.location ? `, ${project.location}` : ''}
          </p>
          <p className="text-white/85" style={{ fontSize: fs(15, 11), marginTop: v(10) }}>
            {areaLabel(project.areaSqft)}
          </p>
          {project.description && (
            <p className="text-white/85" style={{ fontSize: fs(15, 11), marginTop: v(34) }}>
              {project.description}
            </p>
          )}
        </div>
      )}

      <main className="absolute" style={{ top: v(FRAME_TOP), left: u(EDGE_BAR + PANEL_W) }}>
        <div
          className="relative select-none overflow-hidden bg-black/10"
          style={{
            width: `min(${u(FRAME_W)}, calc(100vw - ${u(EDGE_BAR * 2 + PANEL_W)}))`,
            height: v(FRAME_H),
            touchAction: 'pan-y',
          }}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <div
            className="flex h-full transition-transform duration-700 ease-in-out"
            style={{ width: `${Math.max(count, 1) * 100}%`, transform: `translateX(-${(100 / Math.max(count, 1)) * index}%)` }}
          >
            {images.map((src, i) => (
              <div key={i} className="h-full" style={{ width: `${100 / count}%` }}>
                <img src={src} alt={`${project?.name ?? 'Project'} ${i + 1}`} className="h-full w-full object-cover" draggable={false} />
              </div>
            ))}
          </div>
        </div>
      </main>

      {count > 1 && (
        <div
          className="absolute right-0"
          style={{ top: v(CONTROLS_TOP), left: u(EDGE_BAR + PANEL_W) }}
        >
          <CarouselControls
            count={count}
            index={index}
            onSelect={setIndex}
            onPrev={() => setIndex((i) => (i - 1 + count) % count)}
            onNext={() => setIndex((i) => (i + 1) % count)}
            label="Images"
            itemLabel={(i) => `Image ${i + 1}`}
          />
        </div>
      )}

      <SiteFooter />
    </div>
  );
}
