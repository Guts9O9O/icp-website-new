import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import { getCategory, getProjects } from '../lib/api';
import { useData } from '../lib/useData';

const slideStyles = `
  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(28px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes slideInLeft {
    from { opacity: 0; transform: translateX(-28px); }
    to   { opacity: 1; transform: translateX(0); }
  }
`;

const PAGE_SIZE = 5;

function areaLabel(areaSqft) {
  return areaSqft ? `${areaSqft.toLocaleString('en-IN')} Sq.Ft Area` : '0000 Sq.Ft Area';
}

// Project listing for one portfolio category: /portfolio/:category
export default function PortfolioCategoryPage() {
  const { category: categorySlug } = useParams();
  const navigate = useNavigate();

  const { data: category, loading: categoryLoading } = useData(
    () => getCategory(categorySlug),
    [categorySlug]
  );
  const { data: projects } = useData(() => getProjects(categorySlug), [categorySlug]);

  const [startIndex, setStartIndex] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [direction, setDirection] = useState('next');
  const [slideKey, setSlideKey] = useState(0);

  useEffect(() => {
    setStartIndex(0);
  }, [categorySlug]);

  if (!categoryLoading && !category) {
    return <Navigate to="/portfolio" replace />;
  }

  const list = projects ?? [];
  const visible = list.slice(startIndex, startIndex + PAGE_SIZE);
  const hasNext = startIndex + PAGE_SIZE < list.length;
  const hasPrev = startIndex > 0;

  const go = (dir) => {
    if (exiting) return;
    setDirection(dir);
    setExiting(true);
    setTimeout(() => {
      setStartIndex((i) => i + (dir === 'next' ? PAGE_SIZE : -PAGE_SIZE));
      setSlideKey((k) => k + 1);
      setExiting(false);
    }, 160);
  };

  return (
    <div className="min-h-screen font-brand text-[#e9e1d8]" style={{ background: '#6f6257' }}>
      <style>{slideStyles}</style>
      <div className="fixed inset-y-0 left-0 z-30 w-[7.5px] bg-[#781F1C]" />
      <div className="fixed inset-y-0 right-0 z-30 w-[7.5px] bg-[#C3BDB4]" />

      <nav className="fixed left-0 right-0 top-0 z-20 flex items-center justify-between bg-[#6f6257] pb-4 pt-[56px]">
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
          <button
            type="button"
            onClick={() => navigate('/portfolio')}
            className="ml-[34px] text-[22px] transition hover:text-[#781F1C]"
          >
            portfolio
          </button>
          <span className="ml-[24px] text-[15px] text-[#e3dad0]">{category?.label ?? ''}</span>
        </div>
        <div className="flex items-center gap-4 pr-[7px] pt-[0.65px] text-[15px] font-semilight tracking-[0.02em] text-[#d2ccc4]">
          <button type="button" onClick={() => navigate('/enquiry')} className="transition hover:text-[#781F1C]">
            contact us
          </button>
          <span className="inline-block h-[30px] w-[7.5px] shrink-0 bg-[#781F1C]" />
        </div>
      </nav>

      <main className="relative flex min-h-screen items-center justify-center pt-16">
        <div className="absolute inset-0 bg-[#6f6257]" />
        <div className="relative z-10 flex items-center -mt-20">
          {hasPrev && (
            <button
              type="button"
              onClick={() => go('prev')}
              className="mr-[32.48px] flex items-center gap-2 text-[15px] font-semilight tracking-wide text-[#c9c0b6] transition hover:text-[#f1e6da] shrink-0"
            >
              <span>prev</span>
              <span className="h-6 w-[4px] bg-[#781F1C]" />
            </button>
          )}

          <section
            className="w-full overflow-hidden"
            style={{ marginLeft: '424.59px', marginRight: '424.59px' }}
          >
            <div className="flex items-center">
              {projects && list.length === 0 ? (
                <p className="flex-1 py-24 text-center text-[13px] uppercase tracking-[0.3em] text-[#e7ddd3]/60">
                  Projects coming soon
                </p>
              ) : (
                <div
                  key={slideKey}
                  className={`grid flex-1 grid-cols-5 transition-all duration-[160ms] ease-in ${
                    exiting
                      ? direction === 'next' ? 'opacity-0 -translate-x-6' : 'opacity-0 translate-x-6'
                      : 'opacity-100 translate-x-0'
                  }`}
                  style={!exiting ? {
                    animation: `${direction === 'next' ? 'slideInRight' : 'slideInLeft'} 200ms ease-out forwards`,
                  } : undefined}
                >
                  {visible.map((project) => (
                    <div
                      key={project.id}
                      className="group relative flex flex-col cursor-pointer"
                      style={{ height: '420px' }}
                      onClick={() => navigate(`/portfolio/${categorySlug}/${project.slug}`)}
                    >
                      <div className="relative flex-1 overflow-hidden bg-white/5 transition-transform duration-700 ease-in-out group-hover:scale-[1.02]">
                        {project.thumbnail ? (
                          <img
                            src={project.thumbnail}
                            alt={project.name}
                            className="h-full w-full object-cover object-top transition-all duration-700 ease-in-out group-hover:brightness-110"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[11px] uppercase tracking-[0.3em] text-[#d8c577]">Thumbnail</div>
                        )}
                      </div>

                      <div className="border-t border-[#781F1C] py-3 space-y-1 text-center text-[11px] uppercase tracking-[0.2em] text-[#e7ddd3]/80">
                        <p>{project.name}</p>
                        <p>{project.location}</p>
                        <p>{areaLabel(project.areaSqft)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {hasNext && (
                <button
                  type="button"
                  onClick={() => go('next')}
                  className="ml-[32.48px] flex items-center gap-2 text-[15px] font-semilight tracking-wide text-[#c9c0b6] transition hover:text-[#f1e6da] shrink-0"
                >
                  <span className="h-6 w-[4px] bg-[#781F1C]" />
                  <span>next</span>
                </button>
              )}
            </div>
          </section>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-20">
          <p className="absolute bottom-14 right-8 text-[52px] leading-none text-[#9b251f] [font-family:'Brush_Script_MT','Segoe_Script',cursive] lg:right-16">design to live</p>
          <div className="border-t border-[#c8c2ba]/60 bg-[#f5f1ec]/90 py-4 text-center text-[13px] font-semilight text-[#9b9490]">
            <p>Website designed by adiz · 2026 iConcepts+Partners. All Rights Reserved</p>
          </div>
        </div>
      </main>
    </div>
  );
}
