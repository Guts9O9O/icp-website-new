import { useNavigate } from 'react-router';
import { getCategories } from '../lib/api';
import { useData } from '../lib/useData';
import { EDGE_BAR, PORTRAIT_QUERY, fs, u } from '../lib/units';
import { useMediaQuery } from '../lib/useMediaQuery';
import EdgeBars from './chrome/EdgeBars';
import SiteNav from './chrome/SiteNav';
import SiteFooter from './chrome/SiteFooter';
import { useSeo } from '../lib/seo';

// Bespoke Elements is three chandeliers stacked down one ceiling, the lowest
// right at the photograph's foot, and the client wants all three on every
// screen. `object-cover` fills a column wider than the photograph by its width
// and crops that lowest chandelier away — which is what a 16:9 screen showed.
// So the strip always runs the column's full height: a narrow column crops its
// sides, as in the screenshot the client held up as right, and a wider one
// leaves room either side, filled with the ceiling's brown (the median of the
// photograph's own edges).
const CHANDELIERS = 'bespoke-elements';
const CEILING = '#7d5028';
// The strip's edges fade into that brown across whatever gap it leaves, and not
// at all when the strip overflows the column. 31.6cqh is the strip's width at
// the column's full height (the photograph is 570x1801).
const SIDE_FADE = 'clamp(0px, (100cqw - 31.6cqh) / 2, 48px)';
const FEATHER = `linear-gradient(to right, transparent, #000 ${SIDE_FADE}, #000 calc(100% - ${SIDE_FADE}), transparent)`;

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
                  className="absolute left-1/2 top-0 h-full w-auto max-w-none -translate-x-1/2"
                  style={{ WebkitMaskImage: FEATHER, maskImage: FEATHER }}
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
