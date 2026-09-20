import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';

const leftLinks = ['about us', 'portfolio', 'clients'];
const rightLinks = ['enquiry', 'instagram', 'linkedin'];

const linkRoutes = {
  'about us': '/about',
  clients: '/clients',
  portfolio: '/portfolio',
  enquiry: '/enquiry',
};

// Links with a route become router links; the rest stay inert until wired up.
function NavLink({ to, className, children, onMouseEnter }) {
  if (to) {
    return (
      <Link to={to} className={className} onMouseEnter={onMouseEnter}>
        {children}
      </Link>
    );
  }
  return (
    <a href="#" onClick={(e) => e.preventDefault()} className={className} onMouseEnter={onMouseEnter}>
      {children}
    </a>
  );
}

const counters = [
  { label: 'Hospitality', target: 48 },
  { label: 'Builders & Developers', target: 120 },
  { label: 'Commercial', target: 85 },
  { label: 'Private Residence', target: 230 },
];

function useCounter(target, duration = 2000, started = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!started) return undefined;

    let start = null;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
    return undefined;
  }, [started, target, duration]);

  return count;
}

function Counter({ label, target, started }) {
  const count = useCounter(target, 2000, started);

  return (
    <div className="flex min-w-[120px] flex-col items-center gap-1">
      <span className="text-[30px] leading-none tracking-[0.08em] text-[#d6d0c8] sm:text-[36px]">
        {count}
      </span>
      <span className="text-center text-[11px] uppercase tracking-[0.16em] text-[#c3bdb4] sm:text-[12px]">
        {label}
      </span>
    </div>
  );
}

function BrandMark() {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="mb-5 flex items-center justify-center gap-[3px]">
        <span className="icp-logo-circle" />
        <span className="mx-[2px] h-[2px] w-[38px] bg-[#8f2020]" />
        <span className="icp-logo-circle" />
      </div>
      <h1 className="text-center font-brand text-[32px] font-semilight tracking-[0.06em] text-[#d6d0c8] sm:text-[40px] lg:text-[28px] xl:text-[34px]">
        iConcepts + Partners
      </h1>
    </div>
  );
}

function LeftMenu({ active, onEnter, onLeave }) {
  return (
    <aside className="absolute inset-y-0 left-0 z-30 hidden w-[321.25px] lg:block" onMouseLeave={onLeave}>
      <button
        type="button"
        onMouseEnter={onEnter}
        onFocus={onEnter}
        aria-label="Open menu"
        className="pointer-events-auto absolute left-[15px] top-[56.65px] flex items-center gap-4 text-[20px] font-semilight tracking-[0.02em] text-[#d2ccc4]"
      >
        <span className="h-[30.25px] w-[7.5px] bg-[#c3bdb4]" />
        <span className="">menu</span>
      </button>

      <div
        className={[
          'absolute inset-y-0 left-0 overflow-hidden bg-[rgba(120,31,28,0.5)] backdrop-blur-[1px] transition-all duration-500',
          active ? 'pointer-events-auto w-full opacity-100' : 'pointer-events-none w-0 opacity-0',
        ].join(' ')}
        onMouseEnter={onEnter}
      >
        <nav className="absolute right-0 top-1/2 w-full -translate-y-1/2 pl-10 text-right">
          <ul className="space-y-[80px]">
            {leftLinks.map((link) => (
              <li key={link}>
                <NavLink
                  to={linkRoutes[link]}
                  onMouseEnter={onEnter}
                  className="group relative flex justify-end pr-[35px] text-[36px] font-light leading-none tracking-[0.01em] text-[#d7d1ca] transition-colors duration-300 hover:text-[#f1eadf]"
                >
                  <span className="absolute right-0 top-1/2 h-0 w-0 -translate-y-1/2 bg-[#C3BDB4] transition-all duration-300 group-hover:h-[10px] group-hover:w-[20px]" />
                  <span>{link}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}

function RightRail({ active, onEnter, onLeave }) {
  return (
    <aside className="absolute inset-y-0 right-0 z-30 hidden w-[321.25px] min-w-[280px] lg:block xl:min-w-[320px]">
      <div className="absolute inset-y-0 right-0 w-[14.5px] bg-[#c3bdb4]" />

      <div
        className="absolute right-0 top-16 flex items-center top-[56.65px] right-[15px] gap-4 text-[20px] font-semilight tracking-[0.02em] text-[#d2ccc4]"
        onMouseEnter={onEnter}
      >
        <span className="">contact us</span>
        <span className="h-[30px] w-[7.5px] bg-[#781f1c]" />
      </div>

      <div
        className={[
          'absolute inset-y-0 right-0 overflow-hidden bg-[rgba(195,189,180,0.5)] backdrop-blur-[1px] transition-all duration-500',
          active ? 'w-full opacity-100' : 'w-0 opacity-0',
        ].join(' ')}
        onMouseLeave={onLeave}
      >
        <div
          className={[
            'pointer-events-none absolute inset-0 transition-opacity duration-300',
            active ? 'bg-[rgba(60,52,46,0.18)] opacity-100' : 'bg-transparent opacity-0',
          ].join(' ')}
        />

        <nav className="absolute left-0 top-[41%] w-full pr-8 xl:pr-10">
          <ul className="space-y-[100px]">
            {rightLinks.map((link) => {
              const isPrimary = link === 'enquiry';

              return (
                <li key={link}>
                  <NavLink
                    to={linkRoutes[link]}
                    className={[
                      'group relative flex items-center pl-[35px] text-[36px] font-semilight leading-none transition-colors duration-300',
                      isPrimary ? 'text-[#d6d0c8]' : 'text-[#d6d0c8]/78 hover:text-[#f1eadf]',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'absolute left-0 top-1/2 h-0 w-0 -translate-y-1/2 bg-[#781F1C] transition-all duration-300',
                        'group-hover:h-[10px] group-hover:w-[20px]',
                      ].join(' ')}
                    />
                    <span>{link}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        <p className="absolute bottom-8 right-8 text-[56px] leading-none text-[#8f2020] [font-family:'Brush_Script_MT','Segoe_Script',cursive] xl:right-12">
          design to live
        </p>
      </div>
    </aside>
  );
}

export default function HomePage() {
  const [activePanel, setActivePanel] = useState(null);
  const [countersStarted, setCountersStarted] = useState(false);
  const countersRef = useRef(null);

  useEffect(() => {
    const el = countersRef.current;
    if (!el) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCountersStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="font-brand font-semilight text-[#d8d4cd]">
      <main className="relative min-h-screen overflow-hidden bg-[#322c28]">
        <img
          src="/images/Cover Page.jpg.png"
          alt="Interior background"
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />

        <div className="absolute inset-0 bg-[rgba(36,31,27,0.46)]" />
        <div className="absolute inset-y-0 left-0 z-20 w-[14.5px] bg-[#781f1c]" />
        <LeftMenu
          active={activePanel === 'left'}
          onEnter={() => setActivePanel('left')}
          onLeave={() => setActivePanel((prev) => (prev === 'left' ? null : prev))}
        />

        <RightRail
          active={activePanel === 'right'}
          onEnter={() => setActivePanel('right')}
          onLeave={() => setActivePanel((prev) => (prev === 'right' ? null : prev))}
        />

        <div className="relative z-10 flex min-h-screen flex-col px-6 pt-6 sm:px-8 lg:px-10">
          <section className="flex flex-1 items-center justify-center">
            <BrandMark />
          </section>

          <section ref={countersRef} className="relative z-10 mb-[120px] mt-0">
            <div className="mx-auto flex max-w-[920px] flex-wrap items-start justify-center gap-x-10 gap-y-6">
              {counters.map((counter) => (
                <Counter
                  key={counter.label}
                  label={counter.label}
                  target={counter.target}
                  started={countersStarted}
                />
              ))}
            </div>
          </section>

          <footer className="relative z-10 mt-auto flex h-[37.75px] items-center justify-center border-t border-[#781f1c] text-center text-[10px] tracking-[0.01em] text-[#C3BDB4] sm:text-[11px]">
            <p>Website designed by adiz Ⓒ 2026 iConcepts+Partners. All Rights Reserved</p>
          </footer>
        </div>

        <section className="relative z-20 mt-auto block p-4 lg:hidden">
          <div className="rounded-[26px] bg-[rgba(71,67,62,0.72)] px-5 py-5 backdrop-blur-sm">
            <div className="mb-5 flex items-center justify-between text-[15px] text-[#d6d0c8]">
              <span className="flex items-center gap-3">
                <span className="h-10 w-[6px] bg-[#781f1c]" />
                <span>menu</span>
              </span>
              <span className="flex items-center gap-3">
                <span>contact us</span>
                <span className="h-10 w-[6px] bg-[#781f1c]" />
              </span>
            </div>

            <nav className="space-y-3">
              {[...leftLinks, ...rightLinks].map((item) => (
                <NavLink
                  key={item}
                  to={linkRoutes[item]}
                  className="block text-[20px] font-semilight text-[#d6d0c8]"
                >
                  {item}
                </NavLink>
              ))}
            </nav>

            <p className="mt-6 text-right text-[42px] leading-none text-[#8f2020] [font-family:'Brush_Script_MT','Segoe_Script',cursive]">
              design to live
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
