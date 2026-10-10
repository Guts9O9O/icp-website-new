import { useState } from 'react';
import { Link } from 'react-router';
import { EDGE_BAR, NAV_BAR_H, NAV_TOP, NO_HOVER_QUERY, fs, u, v } from '../lib/units';
import { useMediaQuery } from '../lib/useMediaQuery';
import EdgeBars from './chrome/EdgeBars';
import SiteFooter from './chrome/SiteFooter';
import LottieMark, { artAspect } from './chrome/LottieMark';
import { useSeo } from '../lib/seo';

// Geometry from R3 (design px).
const PANEL_W = 643;
const MENU_TOP = 703; // first menu item
const MENU_GAP = 150;

const leftLinks = [
  { label: 'About Us', to: '/about' },
  { label: 'Portfolio', to: '/portfolio' },
  { label: 'Clients', to: '/clients' },
];
const rightLinks = [
  { label: 'Enquiry', to: '/enquiry' },
  { label: 'Testimonial', to: '/testimonials' },
];

const smallBar = { width: u(EDGE_BAR), height: v(NAV_BAR_H) };

function MenuLink({ link, side }) {
  const isLeft = side === 'left';
  // R3 annotates this one: "Alignment of the vertical line & height should be
  // matching the text height." At rest it is a thin vertical rule standing as
  // tall as the menu capitals (0.72em of the inherited size, Segoe UI Light's
  // cap height); hovering widens it into a block without changing its height.
  const marker = (
    <span
      className={[
        'absolute top-1/2 -translate-y-1/2 transition-all duration-300',
        'w-[var(--rest-w)] group-hover:w-[var(--open-w)]',
        isLeft ? 'right-0 bg-icp-mist' : 'left-0 bg-icp-red',
      ].join(' ')}
      style={{ '--rest-w': `max(2px, ${u(5)})`, '--open-w': u(21), height: '0.72em' }}
    />
  );
  const className = [
    'group relative flex items-center text-icp-mist transition-colors duration-300 hover:text-white',
    isLeft ? 'justify-end' : 'justify-start',
  ].join(' ');
  const style = { fontSize: fs(36, 22), [isLeft ? 'paddingRight' : 'paddingLeft']: u(40) };

  if (!link.to) {
    return (
      <span className={`${className} cursor-default`} style={style}>
        {marker}
        {link.label}
      </span>
    );
  }
  return (
    <Link to={link.to} className={className} style={style}>
      {marker}
      {link.label}
    </Link>
  );
}

function Panel({ side, links, open, onEnter, onLeave, hoverable }) {
  const isLeft = side === 'left';
  return (
    <aside
      className={[
        'fixed inset-y-0 z-30 backdrop-blur-[1px] transition-transform duration-500 ease-in-out',
        isLeft ? 'left-0 bg-icp-red/50' : 'right-0 bg-icp-taupe/50',
        open ? 'translate-x-0' : isLeft ? '-translate-x-full' : 'translate-x-full',
      ].join(' ')}
      style={{ width: u(PANEL_W) }}
      onMouseEnter={hoverable ? onEnter : undefined}
      onMouseLeave={hoverable ? onLeave : undefined}
      onClick={(e) => e.stopPropagation()}
    >
      <nav className="absolute left-0 right-0" style={{ top: v(MENU_TOP) }}>
        <ul className="flex flex-col" style={{ gap: v(MENU_GAP - 36) }}>
          {links.map((link) => (
            <li key={link.label} className="leading-none">
              <MenuLink link={link} side={side} />
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

// The animated logo the designer supplied, at the R3 centrepiece width.
const LOGO_W = 620;

function BrandMark() {
  return (
    <>
      {/* The logo artwork contains the wordmark; the heading is for screen
          readers and search engines. */}
      <h1 className="sr-only">iConcepts + Partners</h1>
      <LottieMark
        mark="logo"
        mode="intro"
        style={{ width: u(LOGO_W), height: u(LOGO_W / artAspect('logo')) }}
      />
    </>
  );
}

export default function HomePage() {
  useSeo();
  const [panel, setPanel] = useState(null);
  // Touch screens have no hover, and a tap fires a synthetic mouseenter right
  // before its click — so on those devices hover handlers are disabled and the
  // tap alone toggles a panel; tapping outside closes it.
  const noHover = useMediaQuery(NO_HOVER_QUERY);
  const hoverable = !noHover;
  const openLeft = () => setPanel('left');
  const openRight = () => setPanel('right');
  const close = (side) => () => setPanel((p) => (p === side ? null : p));

  return (
    <div className="relative min-h-screen overflow-hidden bg-icp-slate font-brand text-icp-mist">
      <img src="/images/Cover Page.jpg.png" alt="" className="absolute inset-0 h-full w-full object-cover" loading="eager" />
      <div className="absolute inset-0 bg-icp-slate/55" />

      <EdgeBars />

      <header
        className="pointer-events-none fixed left-0 right-0 z-50 flex items-center justify-between"
        style={{ top: v(NAV_TOP), paddingLeft: u(EDGE_BAR), paddingRight: u(EDGE_BAR) }}
      >
        <button
          type="button"
          className="pointer-events-auto flex items-center text-icp-mist transition-colors hover:text-white"
          style={{ fontSize: fs(20, 13) }}
          onMouseEnter={hoverable ? openLeft : undefined}
          onFocus={hoverable ? openLeft : undefined}
          onClick={(e) => {
            e.stopPropagation();
            setPanel((p) => (p === 'left' ? null : 'left'));
          }}
          aria-expanded={panel === 'left'}
        >
          <span className="bg-icp-mist" style={smallBar} />
          <span style={{ marginLeft: u(20) }}>Menu</span>
        </button>

        <Link
          to="/enquiry"
          className="pointer-events-auto flex items-center text-icp-mist transition-colors hover:text-white"
          style={{ fontSize: fs(20, 13) }}
          onMouseEnter={hoverable ? openRight : undefined}
          onFocus={hoverable ? openRight : undefined}
          onClick={(e) => {
            // Touch: first tap opens the panel, second tap follows the link.
            if (noHover && panel !== 'right') {
              e.preventDefault();
              e.stopPropagation();
              openRight();
            }
          }}
        >
          <span style={{ marginRight: u(20) }}>Contact Us</span>
          <span className="bg-icp-red" style={smallBar} />
        </Link>
      </header>

      <Panel side="left" links={leftLinks} open={panel === 'left'} onEnter={openLeft} onLeave={close('left')} hoverable={hoverable} />
      <Panel side="right" links={rightLinks} open={panel === 'right'} onEnter={openRight} onLeave={close('right')} hoverable={hoverable} />

      <main className="relative z-10 flex min-h-screen items-center justify-center" onClick={() => setPanel(null)}>
        <BrandMark />
      </main>

      <SiteFooter showLogo={false} tone="mist" />
    </div>
  );
}
