import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { getCategory, getProject } from '../lib/api';
import { useData } from '../lib/useData';

// Single project view with image carousel: /portfolio/:category/:slug
export default function ProjectDetailPage() {
  const { category: categorySlug, slug } = useParams();
  const navigate = useNavigate();

  const { data: category } = useData(() => getCategory(categorySlug), [categorySlug]);
  const { data: project, loading } = useData(
    () => getProject(categorySlug, slug),
    [categorySlug, slug]
  );

  const images = project?.images ?? [];
  const count = images.length;

  const [index, setIndex] = useState(0);
  const startX = useRef(0);
  const dragging = useRef(false);

  useEffect(() => {
    setIndex(0);
  }, [slug]);

  useEffect(() => {
    if (count === 0) return undefined;
    const onKey = (event) => {
      if (event.key === 'ArrowRight') setIndex((prev) => (prev + 1) % count);
      if (event.key === 'ArrowLeft') setIndex((prev) => (prev - 1 + count) % count);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [count]);

  useEffect(() => {
    if (count === 0) return undefined;
    const timer = setInterval(() => setIndex((prev) => (prev + 1) % count), 3500);
    return () => clearInterval(timer);
  }, [count]);

  if (!loading && !project) {
    return <Navigate to={`/portfolio/${categorySlug}`} replace />;
  }

  const handlePointerDown = (event) => {
    dragging.current = true;
    startX.current = event.clientX;
  };

  const handlePointerUp = (event) => {
    if (!dragging.current || count === 0) return;
    dragging.current = false;
    const delta = event.clientX - startX.current;
    if (Math.abs(delta) < 40) return;
    if (delta < 0) setIndex((prev) => (prev + 1) % count);
    else setIndex((prev) => (prev - 1 + count) % count);
  };

  return (
    <div className="min-h-screen font-brand text-[#f3ece4]" style={{ background: '#6f6257' }}>
      <div className="fixed inset-y-0 left-0 z-30 w-[14.5px] bg-[#781F1C]" />
      <div className="fixed inset-y-0 right-0 z-30 w-[14.5px] bg-[#C3BDB4]" />

      <nav className="fixed left-0 right-0 top-0 z-20 flex items-center">
        <div className="flex w-[30%] min-w-[280px] items-center gap-3 bg-[#8b2c23] px-6 py-4 text-[15px] font-semilight tracking-wide text-[#f3ece4]">
          <span className="h-[30px] w-[7.5px] bg-[#781F1C]" />
          <button type="button" onClick={() => navigate('/')} className="transition hover:text-white">
            home
          </button>
          <span className="text-[#d0b8ad]">|</span>
          <button type="button" onClick={() => navigate('/portfolio')} className="transition hover:text-white">
            portfolio
          </button>
          <span className="text-[#d0b8ad]">|</span>
          <button
            type="button"
            onClick={() => navigate(`/portfolio/${categorySlug}`)}
            className="transition hover:text-white"
          >
            {category?.label ?? ''}
          </button>
        </div>
        <div className="flex w-[70%] items-center justify-end bg-[#6f6257] px-6 py-4 text-[14px] font-semilight tracking-wide text-[#e6ddd4]">
          <button type="button" onClick={() => navigate('/enquiry')} className="transition hover:text-white">
            contact us
          </button>
          <span className="ml-3 h-[30px] w-[7.5px] bg-[#781F1C]" />
        </div>
      </nav>

      <main className="relative flex min-h-screen pt-16">
        <div className="absolute inset-0 bg-[#6f6257]" />
        <section className="relative z-10 flex w-[30%] min-w-[280px] items-start bg-[#8b2c23] px-8 pt-12">
          <div className="max-w-[320px] space-y-4">
            <p className="text-[18px] font-semilight tracking-[0.12em] text-[#f6efe8]">{project?.name}</p>
            <p className="text-[13px] leading-relaxed text-[#f2e7dd]/90 whitespace-pre-line">
              {project?.description}
            </p>
          </div>
        </section>

        <section className="relative z-10 w-[70%] bg-[#6f6257]" style={{ height: 'calc(100vh - 4rem)' }}>
          <div
            className="relative h-full w-full overflow-hidden"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            <div
              className="flex flex-col transition-transform duration-700 ease-in-out"
              style={{ transform: `translateY(calc(-${index} * (100vh - 4rem)))` }}
            >
              {images.map((src, i) => (
                <div key={i} className="w-full flex-shrink-0" style={{ height: 'calc(100vh - 4rem)' }}>
                  <img src={src} alt={`${project?.name ?? 'Project'} ${i + 1}`} className="h-full w-full object-cover object-center" />
                </div>
              ))}
            </div>
          </div>

          {count > 1 && (
            <div className="absolute right-6 top-1/2 z-20 -translate-y-1/2 flex flex-col items-center gap-3 rounded-full border border-[#cbbf74] bg-[#6f6257]/80 px-3 py-4">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={[
                    'block rounded-full transition-all duration-300',
                    i === index ? 'h-4 w-3 bg-[#781F1C]' : 'h-3 w-3 bg-[#cbbf74]',
                  ].join(' ')}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </section>

        <div className="fixed bottom-0 left-0 right-0 z-20">
          <div className="relative px-8">
            <div className="relative flex items-center justify-between pb-6">
              <div className="flex items-center gap-4 text-[12px] uppercase tracking-[0.18em] text-[#cbbf74]">
                <div className="flex h-[58px] w-[86px] items-center justify-center rounded-[18px] border border-[#cbbf74]">
                  <span className="text-[14px] tracking-[0.2em] text-[#e3dad0]">iC+P</span>
                </div>
                <span>Animated Logo, Will Be Provided To You</span>
              </div>
              <span className="text-[40px] leading-none text-[#9b251f] [font-family:'Brush_Script_MT','Segoe_Script',cursive]">
                design to live
              </span>
            </div>
          </div>
          <div className="border-t border-[#c8c2ba]/60 bg-[#f5f1ec]/90 py-4 text-center text-[13px] font-semilight text-[#9b9490]">
            <p>Website designed by adiz · 2026 iConcepts+Partners. All Rights Reserved</p>
          </div>
        </div>
      </main>
    </div>
  );
}
