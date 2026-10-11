import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { getCategory, getProjects } from '../lib/api';
import { useData } from '../lib/useData';
import { fs, u, v } from '../lib/units';
import EdgeBars from './chrome/EdgeBars';
import SiteNav from './chrome/SiteNav';
import SiteFooter from './chrome/SiteFooter';
import CarouselControls from './chrome/CarouselControls';
import { useSeo } from '../lib/seo';

const slideStyles = `
  @keyframes icpSlideInRight { from { opacity: 0; transform: translateX(28px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes icpSlideInLeft  { from { opacity: 0; transform: translateX(-28px); } to { opacity: 1; transform: translateX(0); } }
`;

const PAGE_SIZE = 5;

// Column geometry from R3 (design px).
const COL_W = 229.81;
const COL_H = 788;
const COL_TOP = 500;
const PHOTO_TOP = 43;
const PHOTO_H = 620; // client: the thumbnails should stand taller than R3's 509
const RULE_H = 6;
const CONTROLS_TOP = 1418; // R3 lines these up with the footer mark

function areaLabel(areaSqft) {
  return areaSqft ? `${areaSqft.toLocaleString('en-IN')} Sq.Ft Area` : '0000 Sq.Ft Area';
}

// Project listing for one portfolio category: /portfolio/:category
export default function PortfolioCategoryPage() {
  const { category: categorySlug } = useParams();
  const navigate = useNavigate();

  const { data: category, loading: categoryLoading } = useData(() => getCategory(categorySlug), [categorySlug]);
  const { data: projects } = useData(() => getProjects(categorySlug), [categorySlug]);
  useSeo({
    title: category ? `${category.label} projects` : 'Portfolio',
    description: category?.description?.split(/\n\s*\n/)[0],
  });

  // Page number is remembered per category, so switching category starts at page 1.
  const [pageState, setPageState] = useState({ category: categorySlug, page: 0 });
  const page = pageState.category === categorySlug ? pageState.page : 0;
  const setPage = (n) => setPageState({ category: categorySlug, page: n });
  const [exiting, setExiting] = useState(false);
  const [direction, setDirection] = useState('next');
  const [slideKey, setSlideKey] = useState(0);

  if (!categoryLoading && !category) return <Navigate to="/portfolio" replace />;

  const list = projects ?? [];
  const pageCount = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const visible = list.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  const go = (target) => {
    if (exiting || target === page || target < 0 || target >= pageCount) return;
    setDirection(target > page ? 'next' : 'prev');
    setExiting(true);
    setTimeout(() => {
      setPage(target);
      setSlideKey((k) => k + 1);
      setExiting(false);
    }, 160);
  };

  return (
    <div className="relative min-h-screen bg-icp-paper font-brand text-icp-slate">
      <style>{slideStyles}</style>
      <EdgeBars />
      <SiteNav title="Portfolio" titleTo="/portfolio" crumb={{ label: category?.label ?? '', to: `/portfolio/${categorySlug}` }} tone="light" />

      <main className="absolute left-0 right-0 flex justify-center" style={{ top: v(COL_TOP) }}>
        {projects && list.length === 0 ? (
          <p className="uppercase text-icp-slate/60" style={{ fontSize: fs(16, 12), letterSpacing: '0.3em', marginTop: v(200) }}>
            Projects coming soon
          </p>
        ) : (
          <div
            key={slideKey}
            className={`relative flex transition-all duration-[160ms] ease-in ${
              exiting ? (direction === 'next' ? '-translate-x-6 opacity-0' : 'translate-x-6 opacity-0') : 'translate-x-0 opacity-100'
            }`}
            style={{
              height: v(COL_H),
              animation: exiting ? undefined : `${direction === 'next' ? 'icpSlideInRight' : 'icpSlideInLeft'} 200ms ease-out forwards`,
            }}
          >
            {visible.map((project) => (
              <div
                key={project.id}
                className="group relative flex cursor-pointer flex-col"
                style={{ width: u(COL_W), paddingTop: v(PHOTO_TOP) }}
                onClick={() => navigate(`/portfolio/${categorySlug}/${project.slug}`)}
                role="link"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') navigate(`/portfolio/${categorySlug}/${project.slug}`);
                }}
              >
                <div className="absolute inset-y-0 left-0 bg-icp-mist" style={{ width: `max(1px, ${u(1.5)})` }} />
                <div className="overflow-hidden bg-black/10" style={{ height: v(PHOTO_H) }}>
                  {project.thumbnail ? (
                    <img
                      src={project.thumbnail}
                      alt={project.name}
                      className="h-full w-full object-cover object-top transition-transform duration-700 ease-in-out group-hover:scale-[1.03]"
                    />
                  ) : null}
                </div>
                <div className="w-full bg-icp-red" style={{ height: v(RULE_H) }} />
                <div
                  className="flex flex-1 flex-col items-center justify-center text-center"
                  style={{ fontSize: fs(14, 11), lineHeight: 1.7, letterSpacing: '0.02em' }}
                >
                  <p className="text-icp-slate/60" style={{ fontSize: fs(16, 12) }}>
                    {project.name}
                  </p>
                  <p>{project.location}</p>
                  <p>{areaLabel(project.areaSqft)}</p>
                </div>
              </div>
            ))}
            <div className="absolute inset-y-0 right-0 bg-icp-mist" style={{ width: `max(1px, ${u(1.5)})` }} />
          </div>
        )}
      </main>

      {pageCount > 1 && (
        <div className="absolute left-0 right-0" style={{ top: v(CONTROLS_TOP) }}>
          <CarouselControls
            count={pageCount}
            index={page}
            onSelect={go}
            onPrev={() => go(page - 1)}
            onNext={() => go(page + 1)}
            label="Pages"
            itemLabel={(i) => `Page ${i + 1}`}
            onLight
            endsDisabled
          />
        </div>
      )}

      <SiteFooter />
    </div>
  );
}
