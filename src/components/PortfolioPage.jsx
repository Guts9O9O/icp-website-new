import { useNavigate } from 'react-router';
import { getCategories } from '../lib/api';
import { useData } from '../lib/useData';

export default function PortfolioPage() {
  const navigate = useNavigate();
  const { data: categories } = useData(getCategories);
  const openCategory = (slug) => navigate(`/portfolio/${slug}`);

  return (
    <div className="min-h-screen font-brand text-[#e4dbd1]" style={{ background: '#6b6258' }}>
      <div className="fixed inset-y-0 left-0 z-30 w-[7.5px] bg-[#781F1C]" />
      <div className="fixed inset-y-0 right-0 z-30 w-[7.5px] bg-[#C3BDB4]" />

      <nav className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between pb-4 pt-[56px]">
        <div className="flex items-center">
          <span className="h-[30px] w-[7.5px] bg-[#781F1C]" />
          <span className="h-[30.25px] w-[7.5px] bg-[#c3bdb4]" />
          <button
            type="button"
            onClick={() => navigate('/')}
            className="ml-[17px] font-semilight text-[15px] tracking-wide text-[#c3bdb4] transition hover:text-[#781F1C]"
          >
            home
          </button>
          <span className="ml-[30px] h-[30.24px] w-px bg-[#c8c2ba]" />
          <span className="ml-[34px] text-[20px] font-semibold tracking-wide text-[#c3bdb4]">portfolio</span>
        </div>
        <div className="flex items-center gap-4 pr-[7px] pt-[0.65px] text-[15px] font-semilight tracking-[0.02em] text-[#d2ccc4]">
          <button
            type="button"
            onClick={() => navigate('/enquiry')}
            className="transition hover:text-[#781F1C]"
          >
            contact us
          </button>
          <span className="inline-block h-[30px] w-[7.5px] shrink-0 bg-[#781F1C]" />
        </div>
      </nav>

      <main className="relative min-h-screen pb-[120px]">
        <div className="absolute inset-0 grid grid-cols-4">
          {(categories ?? []).map((item, idx) => (
            <div
              key={item.slug}
              className="group relative overflow-hidden"
              onClick={() => openCategory(item.slug)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openCategory(item.slug);
                }
              }}
            >
              <img
                src={item.image}
                alt={item.label}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div
                className="absolute inset-0 bg-[rgba(195,189,180,0.5)] transition-transform duration-700 ease-in-out group-hover:-translate-x-full"
                style={{ transformOrigin: 'right center' }}
              />
              <div
                className="absolute inset-0 bg-black/15 transition-opacity duration-700 ease-in-out group-hover:opacity-0"
              />
              {idx !== (categories?.length ?? 0) - 1 && (
                <div className="absolute right-0 top-0 h-full w-px bg-[#7b7167]/60" />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-[18px] font-semilight tracking-wide text-[#e1d7cc]">
                  {item.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="absolute bottom-10 left-0 right-0 z-20 px-6">
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4 text-[12px] uppercase tracking-[0.18em] text-[#cbbf74]">
              <div className="flex h-[58px] w-[86px] items-center justify-center rounded-[18px] border border-[#cbbf74]">
                <span className="text-[14px] tracking-[0.2em] text-[#e3dad0]">iC+P</span>
              </div>
              <span>animated logo, will be provided to you</span>
            </div>
            <span className="text-[52px] leading-none text-[#9b251f] [font-family:'Brush_Script_MT','Segoe_Script',cursive]">
              design to live
            </span>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-20">
        <div className="relative flex h-[37.75px] items-center justify-center overflow-hidden border-t border-[#781F1C] text-center text-[13px] font-semilight text-[#C3BDB4]">
          <p className="relative z-10">Website designed by adiz · 2026 iConcepts+Partners. All Rights Reserved</p>
        </div>
      </div>
    </div>
  );
}
