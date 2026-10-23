import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router';
import { EDGE_BAR, NAV_BAR_H, NAV_TOP, fs, u, v } from '../../lib/units';

// Client feedback (2026-10): the bars and dividers should be as tall as the
// page title's capitals and sit on their baseline, rather than running taller
// and centred on the row. Segoe UI Light's cap height is ~0.72 of its font
// size, so a 0.72em box on an element carrying the title's own size matches
// the capitals at every viewport — including where the title hits its minimum
// size and stops scaling. `items-baseline` then drops its bottom edge onto the
// shared text baseline: a flex item with no text of its own baselines on its
// bottom margin edge.
const CAP = '0.72em';
// The end bars match the home page header's, which R3 draws taller than the
// capitals; `items-baseline` still drops their bottom edge onto the baseline.
// The divider between Home and the page title keeps the cap height the client
// asked for in the written feedback.
const bar = { width: u(EDGE_BAR), height: v(NAV_BAR_H) };
// R3 draws the divider the same height as the bars (59 design px), not the
// height of the capitals. The client asked for it thicker than the PDF's 1.6,
// then (Oct 2026) for half of that again — it was reading as a block rather
// than a rule.
const divider = { width: `max(1px, ${u(2)})`, height: v(NAV_BAR_H) };

// The crumb on a project page (client, Oct 2026). It keeps the category's
// name, but over it the pointer turns into a "Back" tag, and a click goes back
// one page — to the listing as it was left, on the same page of thumbnails.
// Opened straight from a link, with no page of the site behind it, it opens
// the category instead. The tag is drawn rather than set as a cursor image,
// so it is in the brand face and sharp on every screen; touch screens, with
// no pointer to replace, just follow the link.
function BackCrumb({ to, className, style, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const tag = useRef(null);
  const [shown, setShown] = useState(false);
  const place = (e) => {
    if (tag.current) tag.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
  };
  return (
    <>
      <Link
        to={to}
        className={`${className} cursor-none`}
        style={style}
        onPointerEnter={(e) => {
          if (e.pointerType !== 'mouse') return;
          place(e);
          setShown(true);
        }}
        onPointerMove={place}
        onPointerLeave={() => setShown(false)}
        onClick={(e) => {
          setShown(false);
          // A new tab, or nothing of the site to go back to: the plain link.
          if (location.key === 'default' || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
          e.preventDefault();
          navigate(-1);
        }}
      >
        {children}
      </Link>
      {createPortal(
        <div ref={tag} aria-hidden className="pointer-events-none fixed left-0 top-0 z-[100] font-brand">
          <span
            data-back-cursor
            // Hung just under the pointer rather than centred on it, so the
            // category's name stays in view: the client asked for the name
            // to stay, and only the pointer to say "Back".
            className={`flex origin-top -translate-x-1/2 items-center rounded-full bg-icp-paper uppercase text-icp-red shadow-[0_2px_12px_rgba(0,0,0,0.25)] transition-[opacity,transform] duration-200 ease-out ${
              shown ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
            }`}
            style={{ fontSize: fs(17, 11), letterSpacing: '0.16em', gap: '0.55em', padding: '0.6em 1.05em 0.6em 0.95em', marginTop: '1.1em' }}
          >
            <svg viewBox="0 0 16 12" width="1.15em" height="0.85em" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 6H1.5M6 1.5 1.5 6 6 10.5" />
            </svg>
            Back
          </span>
        </div>,
        document.body
      )}
    </>
  );
}

/**
 * Top nav shared by every inner page (R3):
 *   left  — [mist bar] Home | Title | crumb
 *   right — rightTitle | Contact Us [red bar]
 * Sits 100 design px from the top, between the edge bars, above any slide-out panels.
 */
export default function SiteNav({
  title,
  crumb, // { label, to, back } — e.g. the category on portfolio pages; `back` makes it go back a page
  rightTitle, // page title shown on the right, e.g. "Enquiry"
  titleTo, // makes the page title a link — the way back up from a category
  leftLabel = 'Home',
  leftTo = '/',
  // What the nav sits on: 'dark' a photo or the taupe, 'light' the pale
  // background, 'red' the brand-red top bar (the clients page).
  tone = 'dark',
  // The two halves of the nav do not always sit on the same thing. On a
  // category listing a red panel runs up the left of the page and under this
  // row, so the left half needs the red treatment while "Contact Us", still on
  // the pale background at the far right, keeps the light one.
  leftTone = tone,
}) {
  // Over red, R4 sets the whole row in the off-white #EBE9E6 rather than pure
  // white — measured off its pages 7 and 10, where every nav item is that one
  // colour. White reads on the photography and the taupe; the pale pages take
  // the brand red. Hovering moves to red — except on red itself, where that
  // would make the link disappear, so it dims to mist instead.
  const ink = (t) => ({
    text: t === 'light' ? 'text-icp-taupe' : t === 'red' ? 'text-icp-paper' : 'text-white',
    titleInk: t === 'light' ? 'text-icp-red' : t === 'red' ? 'text-icp-paper' : 'text-white',
    textHover: t === 'light' ? 'hover:text-icp-taupe' : t === 'red' ? 'hover:text-icp-mist' : 'hover:text-icp-red',
    // The crumb matches the rest of the nav — it is told apart from the page
    // title by size, not by colour. R4's page 9 draws the whole row on a pale
    // background in the brand red, the crumb with it; on taupe red was nearly
    // illegible, so only the pale pages take it.
    crumbText: t === 'light' ? 'text-icp-red' : t === 'red' ? 'text-icp-paper' : 'text-white',
    crumbHover: t === 'red' ? 'hover:text-icp-mist' : 'hover:text-icp-red',
    // The closing bar is red everywhere but on the red bar, where R3 shows mist.
    endBar: t === 'red' ? 'bg-icp-mist' : 'bg-icp-red',
    // The dividers follow the closing bar, except on the pale pages, where the
    // client asked for them in the mist of the bar beside "Home" (Oct 2026).
    divider: t === 'light' || t === 'red' ? 'bg-icp-mist' : 'bg-icp-red',
  });
  const left = ink(leftTone);
  const right = ink(tone);
  // The red marks where you are, so only the last item in the trail carries
  // it. On /portfolio the title is the page and takes the red; one level down,
  // on /portfolio/hospitality, the title is an ancestor and steps back to the
  // grey of "Home" while the crumb takes the red. Over red the whole row is
  // one off-white, so there is nothing to step back from.
  const titleInk = leftTone === 'light' && crumb ? left.text : left.titleInk;
  return (
    <header
      className="pointer-events-none fixed left-0 right-0 z-50 flex items-baseline justify-between"
      style={{ top: v(NAV_TOP), paddingLeft: u(EDGE_BAR), paddingRight: u(EDGE_BAR) }}
    >
      <div className="pointer-events-auto flex items-baseline">
        <span className="t-title bg-icp-mist" style={bar} />
        <Link
          to={leftTo}
          className={`t-nav transition-colors ${left.text} ${left.textHover}`}
          style={{ marginLeft: u(20) }}
        >
          {leftLabel}
        </Link>
        {title && (
          <>
            <span className={`t-title transition-colors ${left.divider}`} style={{ ...divider, marginLeft: u(24) }} />
            {titleTo ? (
              <Link
                to={titleTo}
                className={`t-title leading-none transition-colors ${titleInk} hover:text-icp-taupe`}
                style={{ marginLeft: u(18) }}
              >
                {title}
              </Link>
            ) : (
              <span className={`t-title leading-none transition-colors ${titleInk}`} style={{ marginLeft: u(18) }}>
                {title}
              </span>
            )}
          </>
        )}
        {crumb && (
          <>
            <span className={`t-title transition-colors ${left.divider}`} style={{ ...divider, marginLeft: u(24) }} />
            {crumb.back ? (
              <BackCrumb
                to={crumb.to}
                className={`t-nav transition-colors ${left.crumbText} ${left.crumbHover}`}
                style={{ marginLeft: u(18) }}
              >
                {crumb.label}
              </BackCrumb>
            ) : (
              <Link
                to={crumb.to}
                className={`t-nav transition-colors ${left.crumbText} ${left.crumbHover}`}
                style={{ marginLeft: u(18) }}
              >
                {crumb.label}
              </Link>
            )}
          </>
        )}
      </div>

      <div className="pointer-events-auto flex items-baseline">
        {rightTitle && (
          <>
            <span className="t-title leading-none text-icp-red">{rightTitle}</span>
            <span className={`t-title ${right.divider}`} style={{ ...divider, marginLeft: u(18), marginRight: u(18) }} />
          </>
        )}
        <Link to="/enquiry" className={`t-nav transition-colors ${right.text} ${right.textHover}`}>
          Contact Us
        </Link>
        <span className={`t-title ${right.endBar}`} style={{ ...bar, marginLeft: u(20) }} />
      </div>
    </header>
  );
}
