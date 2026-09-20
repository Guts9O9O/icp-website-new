import { useState } from 'react';

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

const slots = [
  { id: 'c1', image: '/images/Cat_ Comm.png' },
  { id: 'c2' },
  { id: 'c3' },
  { id: 'c4' },
  { id: 'c5' },
];

const PAGE_SIZE = 5;

export default function CommercialPortfolioPage({ onNavigate }) {
  const [startIndex, setStartIndex] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [direction, setDirection] = useState('next');
  const [slideKey, setSlideKey] = useState(0);

  const visibleSlots = slots.slice(startIndex, startIndex + PAGE_SIZE);
  const hasNext = startIndex + PAGE_SIZE < slots.length;
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
      <div className="fixed inset-y-0 left-0 z-30 w-[14.5px] bg-[#781F1C]" />
      <div className="fixed inset-y-0 right-0 z-30 w-[14.5px] bg-[#C3BDB4]" />

      <nav className="fixed left-0 right-0 top-0 z-20 flex items-center justify-between bg-[#6f6257] px-6 py-4">
        <div className="flex items-center gap-3 text-[15px] font-semilight tracking-wide text-[#c9c0b6]">
          <span className="h-[30px] w-[7.5px] bg-[#781F1C]" />
          <button type="button" onClick={() => onNavigate('home')} className="transition hover:text-[#f1e6da]">home</button>
          <span className="text-[#8c8177]">|</span>
          <button type="button" onClick={() => onNavigate('portfolio')} className="transition hover:text-[#f1e6da]">portfolio</button>
          <span className="text-[#8c8177]">|</span>
          <span className="text-[15px] text-[#e3dad0]">Commercial</span>
        </div>
        <div className="flex items-center gap-3 text-[14px] font-semilight tracking-wide text-[#c9c0b6]">
          <button type="button" onClick={() => onNavigate('enquiry')} className="transition hover:text-[#f1e6da]">contact us</button>
          <span className="h-[30px] w-[7.5px] bg-[#781F1C]" />
        </div>
      </nav>

      <main className="relative flex min-h-screen items-center justify-center pt-16">
        <div className="absolute inset-0 bg-[#6f6257]" />
        <div className="relative z-10 flex items-center gap-2 -mt-20">
          {hasPrev && (
            <button
              type="button"
              onClick={() => go('prev')}
              className="flex items-center gap-2 text-[15px] font-semilight tracking-wide text-[#c9c0b6] transition hover:text-[#f1e6da] shrink-0"
            >
              <span>prev</span>
              <span className="h-6 w-[4px] bg-[#781F1C]" />
            </button>
          )}

          <section className="w-full max-w-[980px] overflow-hidden">
            <div
              key={slideKey}
              className={`grid grid-cols-5 transition-all duration-[160ms] ease-in ${
                exiting
                  ? direction === 'next' ? 'opacity-0 -translate-x-6' : 'opacity-0 translate-x-6'
                  : 'opacity-100 translate-x-0'
              }`}
              style={!exiting ? {
                animation: `${direction === 'next' ? 'slideInRight' : 'slideInLeft'} 200ms ease-out forwards`,
              } : undefined}
            >
              {visibleSlots.map((slot) => (
                <div key={slot.id} className="group relative flex flex-col" style={{ height: '420px' }}>
                  <div className="relative flex-1 overflow-hidden bg-white/5 transition-transform duration-700 ease-in-out group-hover:scale-[1.02]">
                    {slot.image ? (
                      <img src={slot.image} alt="Commercial thumbnail" className="h-full w-full object-cover object-top transition-all duration-700 ease-in-out group-hover:brightness-110" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[11px] uppercase tracking-[0.3em] text-[#d8c577]">Thumbnail</div>
                    )}
                  </div>

                  <div className="border-t border-[#781F1C] py-3 space-y-1 text-center text-[11px] uppercase tracking-[0.2em] text-[#e7ddd3]/80">
                    <p>Project Detail</p>
                    <p>Location</p>
                    <p>0000 Sq.Ft Area</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {hasNext && (
            <button
              type="button"
              onClick={() => go('next')}
              className="flex items-center gap-2 text-[15px] font-semilight tracking-wide text-[#c9c0b6] transition hover:text-[#f1e6da] shrink-0"
            >
              <span className="h-6 w-[4px] bg-[#781F1C]" />
              <span>next</span>
            </button>
          )}
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
