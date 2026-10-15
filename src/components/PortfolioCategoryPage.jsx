import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { getCategory, getProjects } from '../lib/api';
import RichText, { richTextPlain } from '../lib/richText';
import { useData } from '../lib/useData';
import { EDGE_BAR, FOOTER_H, NAV_BAR_H, NAV_TOP, fs, u, v } from '../lib/units';
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
const COL_W = 189.6; // R4 p9 column pitch, measured — R3 drew them at 229.81
const COL_H = 788;
const COL_TOP = 500;
const PHOTO_TOP = 43;
const PHOTO_H = 620; // client: the thumbnails should stand taller than R3's 509
const RULE_H = 4.8; // R4 p9 measures 4.79
const CONTROLS_TOP = 1418; // R3 lines these up with the footer mark

// The segment write-up panel takes the empty space beside the thumbnails. The
// client asked for it to run the whole height of the page, under the nav row,
// as the red panel does on the project view, so it sits below the nav (z-50)
// and the footer (z-30) and lets both paint over it. Only the text is inset,
// clear of the nav above and the footer rule below.
const PANEL_PAD = 60;
const MIN_PANEL_W = 300; // CSS px: below this the write-up is unreadable
const TEXT_TOP = NAV_TOP + NAV_BAR_H + 34;

// Project listing for one portfolio category: /portfolio/:category
export default function PortfolioCategoryPage() {
  const { category: categorySlug } = useParams();
  const navigate = useNavigate();

  const { data: category, loading: categoryLoading } = useData(() => getCategory(categorySlug), [categorySlug]);
  const { data: projects } = useData(() => getProjects(categorySlug), [categorySlug]);
  useSeo({
    title: category ? `${category.label} projects` : 'Portfolio',
    description: richTextPlain(category?.description).split(/\n\s*\n/)[0] || undefined,
  });

  // Page number is remembered per category, so switching category starts at page 1.
  const [pageState, setPageState] = useState({ category: categorySlug, page: 0 });
  const page = pageState.category === categorySlug ? pageState.page : 0;
  const setPage = (n) => setPageState({ category: categorySlug, page: n });
  const [exiting, setExiting] = useState(false);
  const [direction, setDirection] = useState('next');
  const [slideKey, setSlideKey] = useState(0);

  // The panel fills the empty space to the left of the thumbnails rather than
  // pushing them aside, so the row stays centred where R4 puts it.
  const rowRef = useRef(null);
  const [panelW, setPanelW] = useState(0);
  useEffect(() => {
    const measure = () => {
      const row = rowRef.current;
      if (!row) return;
      // Right up to the thumbnails: the panel starts one gutter in, so its
      // width is the whole run from there to the row. Stopping a second gutter
      // short left a pale stripe between the red and the photographs.
      const gutter = (EDGE_BAR / 2560) * window.innerWidth;
      setPanelW(Math.max(0, row.getBoundingClientRect().left - gutter));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [projects, page]);

  // The category's write-up stays open beside the thumbnails, as the client
  // asked; it used to open only while a project was hovered, which hid it from
  // anyone who did not point at a photograph. It needs room to be read, though:
  // a portrait tablet leaves about 160px beside the row, two words a line, so
  // there the page goes without it, as it always has on touch screens.
  const showPanel = Boolean(category?.description) && panelW >= MIN_PANEL_W;

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
      {/* The trail ends in the category, as the client asked: Home and
          Portfolio step back and the category is where you are. Over the red
          panel the whole row is one off-white; without it, SiteNav sets Home
          and Portfolio grey and the category red. */}
      <SiteNav
        title="Portfolio"
        titleTo="/portfolio"
        crumb={{ label: category?.label ?? '', to: `/portfolio/${categorySlug}` }}
        tone="light"
        leftTone={showPanel ? 'red' : 'light'}
      />

      {/* The studio's write-up for this segment, in the red panel R4 uses on
          the project view, carrying the studio's copy for the whole segment. */}
      {showPanel && (
        <aside
          data-panel="segment"
          className="fixed inset-y-0 z-20 overflow-hidden bg-icp-red text-white"
          style={{ left: u(EDGE_BAR), width: panelW }}
        >
          <div
            className="scroll-slim absolute inset-x-0 overflow-y-auto"
            style={{ top: v(TEXT_TOP), bottom: v(FOOTER_H) }}
          >
            <div
              className="flex min-h-full flex-col justify-center"
              style={{
                paddingLeft: u(PANEL_PAD),
                paddingRight: u(PANEL_PAD),
                paddingTop: v(40),
                paddingBottom: v(40),
                fontSize: fs(14, 12),
                lineHeight: 1.8,
              }}
            >
              <RichText text={category.description} tone="dark" gap={u(18)} />
            </div>
          </div>
        </aside>
      )}

      <main className="absolute left-0 right-0 flex justify-center" style={{ top: v(COL_TOP) }}>
        {projects && list.length === 0 ? (
          <p className="uppercase text-icp-slate/60" style={{ fontSize: fs(16, 12), letterSpacing: '0.3em', marginTop: v(200) }}>
            Projects coming soon
          </p>
        ) : (
          <div
            key={slideKey}
            ref={rowRef}
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
                  {/* The name carries `t-strong` rather than a weight: the
                      brand face is Segoe UI Light and has no bold cut. */}
                  <p className="t-strong text-icp-slate/60" style={{ fontSize: fs(16, 12) }}>
                    {project.name}
                  </p>
                  <p>{project.location}</p>
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
