import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { getCategories } from '../lib/api';
import RichText from '../lib/richText';
import { useData } from '../lib/useData';
import { useMediaQuery } from '../lib/useMediaQuery';
import { EDGE_BAR, FOOTER_H, NAV_BAR_H, NAV_TOP, NO_HOVER_QUERY, fs, u, v } from '../lib/units';
import EdgeBars from './chrome/EdgeBars';
import SiteNav from './chrome/SiteNav';
import SiteFooter from './chrome/SiteFooter';
import { useSeo } from '../lib/seo';

// The write-up drawer, the width R4 gives the panel on the project page.
const PANEL_W = 800;
const PANEL_PAD = 70;

/**
 * Category columns fill the page top to bottom (R4), each carrying its own
 * photograph with a translucent red bar that slides away on hover.
 *
 * Hovering also brings in the studio's write-up for that segment, the way the
 * About page opens a write-up for each of the founders, in the red panel R4
 * uses on the project page. The columns make room for it rather than being
 * covered by it: an overlay wide enough to read always sealed off the
 * neighbouring columns, so you could open one panel and never reach another.
 */
export default function PortfolioPage() {
  useSeo({
    title: 'Portfolio',
    description:
      'Interior design projects by iConcepts + Partners across developers, hospitality, commercial, private residences and bespoke elements.',
  });
  const navigate = useNavigate();
  const { data: categories } = useData(getCategories);
  const list = categories ?? [];
  const open = (slug) => navigate(`/portfolio/${slug}`);

  const hoverable = !useMediaQuery(NO_HOVER_QUERY);
  const [activeSlug, setActiveSlug] = useState(null);
  const closeTimer = useRef(null);
  const active = list.find((c) => c.slug === activeSlug);
  const isOpen = Boolean(active);

  // A grace period before closing, so the pointer can cross from a column into
  // the drawer — a write-up long enough to scroll is unreadable otherwise.
  const cancelClose = () => clearTimeout(closeTimer.current);
  const openPanel = (slug) => {
    cancelClose();
    setActiveSlug(slug);
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setActiveSlug(null), 180);
  };
  useEffect(() => () => clearTimeout(closeTimer.current), []);

  return (
    <div className="relative min-h-screen bg-icp-taupe font-brand text-icp-mist">
      <EdgeBars />
      <SiteNav />

      {/* The write-up, in the red panel R4 uses on the project page. */}
      <aside
        data-panel="segment"
        aria-hidden={!isOpen}
        onMouseEnter={hoverable ? cancelClose : undefined}
        onMouseLeave={hoverable ? scheduleClose : undefined}
        className={[
          'fixed inset-y-0 z-40 overflow-hidden bg-icp-red text-white',
          'transition-all duration-500 ease-in-out',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
        style={{ left: u(EDGE_BAR), width: isOpen ? u(PANEL_W) : 0 }}
      >
        <div
          className="scroll-slim absolute overflow-y-auto"
          style={{
            top: v(NAV_TOP + NAV_BAR_H + 30),
            bottom: v(FOOTER_H),
            left: 0,
            width: u(PANEL_W),
          }}
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
            {active?.description && <RichText text={active.description} tone="dark" gap={u(18)} />}
          </div>
        </div>
      </aside>

      <main
        // The column count follows the data rather than being fixed at four:
        // R4 took the categories to five, and the studio can add more. The
        // left edge steps aside when the drawer opens.
        className="absolute grid transition-all duration-500 ease-in-out tall:!grid-cols-2"
        style={{
          top: 0,
          bottom: 0,
          left: u(EDGE_BAR + (isOpen ? PANEL_W : 0)),
          right: u(EDGE_BAR),
          gridTemplateColumns: `repeat(${Math.max(1, list.length)}, minmax(0, 1fr))`,
        }}
      >
        {list.map((item, idx, all) => (
          <div
            key={item.slug}
            className="group relative cursor-pointer overflow-hidden"
            role="button"
            tabIndex={0}
            onMouseEnter={hoverable ? () => openPanel(item.slug) : undefined}
            onMouseLeave={hoverable ? scheduleClose : undefined}
            onFocus={hoverable ? () => openPanel(item.slug) : undefined}
            onClick={() => open(item.slug)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                open(item.slug);
              }
            }}
          >
            <img src={item.image} alt={item.label} className="absolute inset-0 h-full w-full object-cover" />
            <div
              className={[
                'absolute inset-0 bg-icp-red/50 transition-transform duration-700 ease-in-out',
                activeSlug === item.slug ? '-translate-x-full' : 'translate-x-0',
              ].join(' ')}
            />
            {idx < all.length - 1 && <div className="absolute inset-y-0 right-0 w-px bg-icp-mist/40" />}
            <div className="absolute inset-x-0 bottom-0 hidden h-px bg-icp-mist/40 tall:block" />
            <div className="absolute inset-0 flex items-center justify-center">
              <p
                className="text-center uppercase text-white drop-shadow-md"
                style={{ fontSize: fs(38, 18), paddingLeft: u(16), paddingRight: u(16), lineHeight: 1.15 }}
              >
                {item.label}
              </p>
            </div>
          </div>
        ))}
      </main>

      <SiteFooter tone="mist" />
    </div>
  );
}
