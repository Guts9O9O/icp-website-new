import { useNavigate } from 'react-router';
import { getCategories } from '../lib/api';
import { useData } from '../lib/useData';
import { EDGE_BAR, fs, u } from '../lib/units';
import EdgeBars from './chrome/EdgeBars';
import SiteNav from './chrome/SiteNav';
import SiteFooter from './chrome/SiteFooter';
import { useSeo } from '../lib/seo';

// Four category columns fill the page top to bottom (R3, revised): the client
// asked for the category image to run the full height, with the nav and the
// footer sitting over it rather than cropping it between them.
// A translucent red bar covers each image and slides away on hover.
export default function PortfolioPage() {
  useSeo({ title: 'Portfolio', description: 'Interior design projects by iConcepts + Partners across hospitality, builders & developers, commercial and private residences.' });
  const navigate = useNavigate();
  const { data: categories } = useData(getCategories);
  const open = (slug) => navigate(`/portfolio/${slug}`);

  return (
    <div className="relative min-h-screen bg-icp-taupe font-brand text-icp-mist">
      <EdgeBars />
      <SiteNav title="Portfolio" />

      <main
        // The column count follows the data rather than being fixed at four:
        // R4 took the categories to five, and the studio can add more.
        className="absolute grid tall:!grid-cols-2"
        style={{
          top: 0,
          bottom: 0,
          left: u(EDGE_BAR),
          right: u(EDGE_BAR),
          gridTemplateColumns: `repeat(${Math.max(1, (categories ?? []).length)}, minmax(0, 1fr))`,
        }}
      >
        {(categories ?? []).map((item, idx, all) => (
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
            <img src={item.image} alt={item.label} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-icp-red/50 transition-transform duration-700 ease-in-out group-hover:-translate-x-full" />
            {idx < all.length - 1 && <div className="absolute inset-y-0 right-0 w-px bg-icp-mist/40" />}
            <div className="absolute inset-x-0 bottom-0 hidden h-px bg-icp-mist/40 tall:block" />
            <div className="absolute inset-0 flex items-center justify-center">
              <p
                className="text-center uppercase text-white drop-shadow-md"
                style={{ fontSize: fs(38, 18), paddingLeft: u(20), paddingRight: u(20), lineHeight: 1.15 }}
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
