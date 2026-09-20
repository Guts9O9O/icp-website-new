import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { getClientGroups } from '../lib/api';
import { useData } from '../lib/useData';

const rightLinks = ['Enquiry', 'Instagram', 'Linkedin'];
const linkRoutes = { 'About us': '/about', Clients: '/clients', Portfolio: '/portfolio', Enquiry: '/enquiry' };

function Cell({ item }) {
  if (!item) {
    return <div className="h-[99.3px] w-[170.28px] border-r border-b border-[#47433E]" />;
  }
  if (item.type === 'image') {
    return (
      <div className="flex h-[99.3px] w-[170.28px] items-center justify-center border-r border-b border-[#47433E] px-4 py-4">
        <img
          src={`/images/clients/${item.file}`}
          alt={item.name}
          className="max-h-[70px] max-w-full object-contain"
        />
      </div>
    );
  }
  return (
    <div className="flex h-[99.3px] w-[170.28px] items-center justify-center border-r border-b border-[#47433E] px-3 py-4">
      <p className="text-center text-[11px] leading-relaxed text-[#e4dbd1]/80">
        {item.text.split('\n').map((line, i) => (
          <span key={i} className="block">{line}</span>
        ))}
      </p>
    </div>
  );
}

function SidePanel({ side, title, links, active, onEnter, onLeave, onNavigate, showTrigger = true }) {
  const isLeft = side === 'left';
  return (
    <aside
      className={[
        'icp-panel absolute inset-y-0 z-40 w-[26%] min-w-[260px] max-w-[360px]',
        active ? 'pointer-events-auto' : 'pointer-events-none',
        isLeft ? 'left-0' : 'right-0',
      ].join(' ')}
      onMouseLeave={onLeave}
    >
      {showTrigger && (
        <button
          type="button"
          className={[
            'pointer-events-auto absolute top-16 flex items-center gap-3 text-[24px] font-semilight leading-none text-icp-text/80',
            'transition-colors duration-300 hover:text-[#ede9e1]',
            isLeft ? 'left-0' : 'right-0 flex-row-reverse',
          ].join(' ')}
          onMouseEnter={onEnter}
          onFocus={onEnter}
          aria-label={`Open ${title}`}
        >
          <span className="h-9 w-[6px] bg-[#d8c577]/90" />
          <span className="text-[26px] font-semilight tracking-tight">{title}</span>
        </button>
      )}

      <div
        className={[
          'absolute inset-y-0 overflow-hidden transition-all duration-500',
          isLeft ? 'left-0 origin-left border-r border-white/5' : 'right-0 origin-right border-l border-white/5',
          active ? 'pointer-events-auto w-full opacity-100 translate-x-0' : 'pointer-events-none w-0 opacity-0',
          isLeft ? (active ? 'translate-x-0' : '-translate-x-8') : (active ? 'translate-x-0' : 'translate-x-8'),
        ].join(' ')}
      >
        <div
          className={[
            'pointer-events-none absolute inset-0 transition-all duration-500',
            isLeft ? 'bg-[#781F1C]/65' : 'bg-[#C3BDB4]/65',
            active ? 'opacity-95' : 'opacity-[0.88]',
          ].join(' ')}
        />
        <div
          className={[
            'pointer-events-none absolute inset-y-0 transition-all duration-500',
            isLeft
              ? 'left-0 bg-white/5 shadow-[inset_-10px_0_30px_rgba(255,255,255,0.06)]'
              : 'right-0 bg-white/4 shadow-[inset_10px_0_30px_rgba(255,255,255,0.06)]',
            active ? 'w-[100%]' : 'w-[12px]',
          ].join(' ')}
        />
        <nav
          className={[
            'absolute top-[42%] -translate-y-1/2 transition-all duration-300',
            active ? 'opacity-100' : 'translate-y-[-46%] opacity-0',
            isLeft ? 'right-0 pr-1 text-right' : 'left-14 text-left',
          ].join(' ')}
        >
          <ul className="space-y-8">
            {links.map((link) => (
              <li key={link}>
                <a
                  href="#"
                  onMouseEnter={onEnter}
                  onClick={(e) => {
                    e.preventDefault();
                    if (linkRoutes[link] && typeof onNavigate === 'function') onNavigate(linkRoutes[link]);
                  }}
                  className="icp-link group relative inline-flex items-center text-[30px] font-semilight leading-none text-icp-text/86 transition-colors duration-300 hover:text-[#ede9e1]"
                >
                  {!isLeft && <span className="icp-line mr-4 h-px w-0 bg-icp-yellow/90 transition-all duration-300 group-hover:w-16" />}
                  <span className="border-b border-transparent pb-1 transition-all duration-300">{link}</span>
                  {isLeft && <span className="icp-line ml-4 h-px w-0 bg-icp-yellow/90 transition-all duration-300 group-hover:w-16" />}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}

export default function ClientsPage() {
  const navigate = useNavigate();
  const { data } = useData(getClientGroups);
  const categoryGroups = useMemo(() => data ?? [], [data]);
  const maxRows = useMemo(
    () => Math.max(0, ...categoryGroups.map((cat) => Math.ceil(cat.items.length / 2))),
    [categoryGroups]
  );
  const [activePanel, setActivePanel] = useState(null);

  return (
    <div className="min-h-screen font-brand text-[#e4dbd1]" style={{ background: '#6b6258' }}>
      <div className="fixed inset-y-0 left-0 z-30 w-[7.5px] bg-[#781F1C]" />
      <div className="fixed inset-y-0 right-0 z-30 w-[7.5px] bg-[#C3BDB4]" />

      <SidePanel
        side="right"
        title="Contact Us"
        links={rightLinks}
        active={activePanel === 'right'}
        onEnter={() => setActivePanel('right')}
        onLeave={() => setActivePanel((prev) => (prev === 'right' ? null : prev))}
        onNavigate={navigate}
        showTrigger={false}
      />

      <nav className="flex items-center justify-between bg-[rgba(120,31,28,0.5)] pb-4 pt-[56px]">
        <div className="flex items-center">
          <span className="h-[30px] w-[7.5px] bg-[#781F1C]" />
          <span className="h-[30.25px] w-[7.5px] bg-[#c3bdb4]" />
          <button
            type="button"
            onClick={() => navigate('/')}
            className="ml-[17px] font-semilight text-[15px] tracking-wide text-[#c3bdb4] transition hover:text-[#781F1C]"
          >
            menu
          </button>
          <span className="ml-[30px] h-[30.24px] w-px bg-[#c8c2ba]" />
          <span className="ml-[34px] text-[20px] font-semibold tracking-wide text-[#c3bdb4]">clients</span>
        </div>
        <div className="flex items-center gap-4 pr-[7px] pt-[0.65px] text-[19px] font-semilight tracking-[0.02em] text-[#d2ccc4]">
          <button
            type="button"
            onMouseEnter={() => setActivePanel('right')}
            onFocus={() => setActivePanel('right')}
            className="transition hover:text-[#781F1C]"
          >
            contact us
          </button>
          <span className="inline-block h-[30px] w-[7.5px] shrink-0 bg-[#781F1C]" />
        </div>
      </nav>

      <main className="relative pb-[120px]">
        <div
          className="grid border-l border-t border-[#47433E]"
          style={{ gridTemplateColumns: 'repeat(8, 170.28px)' }}
        >
          {categoryGroups.map((cat) => (
            <div
              key={cat.label}
              className="col-span-2 flex items-center justify-center border-r border-b border-[#47433E] bg-[rgba(120,31,28,0.5)] py-4 text-center text-[18px] font-semilight tracking-wide text-[#C3BDB4]"
            >
              {cat.label}
            </div>
          ))}

          {Array.from({ length: maxRows }).flatMap((_, rowIndex) =>
            categoryGroups.flatMap((cat, catIndex) =>
              [0, 1].map((colIndex) => {
                const itemIndex = rowIndex * 2 + colIndex;
                const item = itemIndex < cat.items.length ? cat.items[itemIndex] : null;
                return <Cell key={`${catIndex}-${rowIndex}-${colIndex}`} item={item} />;
              })
            )
          )}
        </div>

        <div className="relative flex items-center justify-between px-6 pt-8 text-[12px] uppercase tracking-[0.18em] text-[#cbbf74]">
          <div className="flex items-center gap-4">
            <div className="flex h-[58px] w-[86px] items-center justify-center rounded-[18px] border border-[#cbbf74]">
              <span className="text-[14px] tracking-[0.2em] text-[#e3dad0]">iC+P</span>
            </div>
          </div>
        </div>

        <div className="px-6 pt-6 text-right">
          <p className="text-[52px] leading-none text-[#9b251f] [font-family:'Brush_Script_MT','Segoe_Script',cursive]">
            design to live
          </p>
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
