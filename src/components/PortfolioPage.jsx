import { useNavigate } from 'react-router';
import { getCategories } from '../lib/api';
import { useData } from '../lib/useData';
import { EDGE_BAR, PORTRAIT_QUERY, fs, u } from '../lib/units';
import { useMediaQuery } from '../lib/useMediaQuery';
import EdgeBars from './chrome/EdgeBars';
import SiteNav from './chrome/SiteNav';
import SiteFooter from './chrome/SiteFooter';
import { useSeo } from '../lib/seo';

// Bespoke Elements is three chandeliers stacked down one ceiling, and the
// client wants all three to read on every screen, which `object-cover` cannot
// promise: a tall window fills the column's height and crops the chandeliers'
// sides, a wide one fills its width and crops the lowest chandelier away. That
// strip instead keeps the column's full width but never gets wider than 0.375
// of its height — the proportion of the screenshot the client held up as right
// — and any room left over is the ceiling's brown, sampled off the photograph.
const CHANDELIERS = 'bespoke-elements';
const CEILING = '#80542f';
const STRIP_W = 'min(100cqw, 37.5cqh)';
// The strip's edges fade into that brown across whatever gap it leaves, and not
// at all where it meets the column, so on the client's reference screen nothing
// changes. 316cqw is the strip's height at the column's full width (570x1801).
const SIDE_FADE = 'clamp(0px, (100cqw - 37.5cqh) / 2, 48px)';
const END_FADE = 'clamp(0px, (100cqh - 316cqw) / 2, 96px)';
const FEATHER = [
  `linear-gradient(to right, transparent, #000 ${SIDE_FADE}, #000 calc(100% - ${SIDE_FADE}), transparent)`,
  `linear-gradient(to bottom, transparent, #000 ${END_FADE}, #000 calc(100% - ${END_FADE}), transparent)`,
].join(', ');

/**
 * Category columns fill the page top to bottom (R4), each carrying its own
 * photograph with a translucent red bar that slides away on hover.
 *
 * The segment write-up lives one level down, on the category's own listing.
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
  // Portrait tablets lay the categories out in short, wide cells where three
  // chandeliers cannot fit, so there the bespoke strip keeps the ordinary crop.
  const portrait = useMediaQuery(PORTRAIT_QUERY);

  return (
    <div className="relative min-h-screen bg-icp-taupe font-brand text-icp-mist">
      <EdgeBars />
      <SiteNav />

      <main
        // The column count follows the data rather than being fixed at four:
        // R4 took the categories to five, and the studio can add more.
        className="absolute grid tall:!grid-cols-2"
        style={{
          top: 0,
          bottom: 0,
          left: u(EDGE_BAR),
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
            onClick={() => open(item.slug)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                open(item.slug);
              }
            }}
          >
            {item.slug === CHANDELIERS && !portrait ? (
              <div className="absolute inset-0 [container-type:size]" style={{ background: CEILING }}>
                <img
                  src={item.image}
                  alt={item.label}
                  className="absolute left-1/2 top-1/2 h-auto max-w-none -translate-x-1/2 -translate-y-1/2"
                  style={{
                    width: STRIP_W,
                    WebkitMaskImage: FEATHER,
                    maskImage: FEATHER,
                    WebkitMaskComposite: 'source-in',
                    maskComposite: 'intersect',
                  }}
                />
              </div>
            ) : (
              <img src={item.image} alt={item.label} className="absolute inset-0 h-full w-full object-cover" />
            )}
            <div className="absolute inset-0 bg-icp-red/50 transition-transform duration-700 ease-in-out group-hover:-translate-x-full" />
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
