import { useNavigate } from 'react-router';
import { getCategories } from '../lib/api';
import { useData } from '../lib/useData';
import { EDGE_BAR, FOOTER_H, NAV_BAR_H, NAV_TOP, fs, u, v } from '../lib/units';
import EdgeBars from './chrome/EdgeBars';
import SiteNav from './chrome/SiteNav';
import SiteFooter from './chrome/SiteFooter';

// Four category columns fill the page between the nav and the footer rule (R3).
// A translucent red bar covers each image and slides away on hover.
export default function PortfolioPage() {
  const navigate = useNavigate();
  const { data: categories } = useData(getCategories);
  const open = (slug) => navigate(`/portfolio/${slug}`);

  return (
    <div className="relative min-h-screen bg-icp-taupe font-brand text-icp-mist">
      <EdgeBars />
      <SiteNav title="portfolio" />

      <main
        className="absolute grid grid-cols-4"
        style={{
          top: v(NAV_TOP + NAV_BAR_H),
          bottom: v(FOOTER_H),
          left: u(EDGE_BAR),
          right: u(EDGE_BAR),
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
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-white drop-shadow-md" style={{ fontSize: fs(38, 18) }}>
                {item.label}
              </p>
            </div>
          </div>
        ))}
      </main>

      <SiteFooter />
    </div>
  );
}
