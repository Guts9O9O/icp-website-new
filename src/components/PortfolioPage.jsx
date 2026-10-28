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
// screen with nothing but the photograph in the column. A column wider than
// the photograph (any 16:9 screen) makes `object-cover` crop top and bottom;
// centred, that crop takes the lowest chandelier away. Kept to the foot, it
// only trims the crown of the top one, which stays plainly a chandelier.
const CHANDELIERS = 'bespoke-elements';

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
  // chandeliers cannot fit, so there the bespoke photograph keeps the centred crop.
  const portrait = useMediaQuery(PORTRAIT_QUERY);

  return (
    <div className="relative min-h-page bg-icp-taupe font-brand text-icp-mist">
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
            className="group relative cursor-pointer overflow-hidden [container-type:inline-size]"
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
            {/* A category the studio has just added may not have its photo
                yet; the column is then plain taupe rather than a broken image. */}
            {item.image && (
              <img
                src={item.image}
                alt={item.label}
                className={`absolute inset-0 h-full w-full object-cover ${item.slug === CHANDELIERS && !portrait ? 'object-bottom' : ''}`}
              />
            )}
            <div className="absolute inset-0 bg-icp-red/50 transition-transform duration-700 ease-in-out group-hover:-translate-x-full" />
            {idx < all.length - 1 && <div className="absolute inset-y-0 right-0 w-px bg-icp-mist/40" />}
            <div className="absolute inset-x-0 bottom-0 hidden h-px bg-icp-mist/40 tall:block" />
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Never wider than its column allows (8.5cqw holds an
                  eleven-letter word, HOSPITALITY, with room either side): the
                  column clips, so a word too wide for it lost its ends. Two
                  words that need two lines split evenly. */}
              <p
                className="text-center uppercase text-white drop-shadow-md"
                style={{ fontSize: `min(${fs(38, 18)}, 8.5cqw)`, paddingLeft: u(16), paddingRight: u(16), lineHeight: 1.15, textWrap: 'balance' }}
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
