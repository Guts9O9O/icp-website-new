import { Link } from 'react-router';
import { EDGE_BAR, NAV_BAR_H, NAV_TOP, u, v } from '../../lib/units';

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
const divider = { width: `max(2px, ${u(4)})`, height: CAP };

/**
 * Top nav shared by every inner page (R3):
 *   left  — [mist bar] Home | Title | crumb
 *   right — rightTitle | Contact Us [red bar]
 * Sits 100 design px from the top, between the edge bars, above any slide-out panels.
 */
export default function SiteNav({
  title,
  crumb, // { label, to } — e.g. the category on portfolio pages
  rightTitle, // page title shown on the right, e.g. "Enquiry"
  leftLabel = 'Home',
  leftTo = '/',
  // What the nav sits on: 'dark' a photo or the taupe, 'light' the pale
  // background, 'red' the brand-red top bar (the clients page).
  tone = 'dark',
}) {
  const onLight = tone === 'light';
  const onRed = tone === 'red';

  // White reads on both the dark pages and the red bar; the pale pages take
  // the brand red. Hovering moves to red — except on the red bar itself, where
  // that would make the link disappear, so it dims to mist instead.
  const text = onLight ? 'text-icp-red' : 'text-white';
  const textHover = onLight ? 'hover:text-icp-taupe' : onRed ? 'hover:text-icp-mist' : 'hover:text-icp-red';
  // The crumb matches the rest of the nav — it is told apart from the page
  // title by size, not by colour. In red it was nearly illegible on taupe.
  const crumbText = onLight ? 'text-icp-slate' : 'text-white';
  const crumbHover = onRed ? 'hover:text-icp-mist' : 'hover:text-icp-red';
  // The closing bar is red everywhere but on the red bar, where R3 shows mist.
  const endBar = onRed ? 'bg-icp-mist' : 'bg-icp-red';
  return (
    <header
      className="pointer-events-none fixed left-0 right-0 z-50 flex items-baseline justify-between"
      style={{ top: v(NAV_TOP), paddingLeft: u(EDGE_BAR), paddingRight: u(EDGE_BAR) }}
    >
      <div className="pointer-events-auto flex items-baseline">
        <span className="t-title bg-icp-mist" style={bar} />
        <Link
          to={leftTo}
          className={`t-nav transition-colors ${text} ${textHover}`}
          style={{ marginLeft: u(20) }}
        >
          {leftLabel}
        </Link>
        {title && (
          <>
            <span className={`t-title ${endBar}`} style={{ ...divider, marginLeft: u(24) }} />
            <span className={`t-title leading-none ${text}`} style={{ marginLeft: u(18) }}>
              {title}
            </span>
          </>
        )}
        {crumb && (
          <>
            <span className={`t-title ${endBar}`} style={{ ...divider, marginLeft: u(24) }} />
            <Link
              to={crumb.to}
              className={`t-nav transition-colors ${crumbText} ${crumbHover}`}
              style={{ marginLeft: u(18) }}
            >
              {crumb.label}
            </Link>
          </>
        )}
      </div>

      <div className="pointer-events-auto flex items-baseline">
        {rightTitle && (
          <>
            <span className="t-title leading-none text-icp-red">{rightTitle}</span>
            <span className="t-title bg-icp-red" style={{ ...divider, marginLeft: u(18), marginRight: u(18) }} />
          </>
        )}
        <Link to="/enquiry" className={`t-nav transition-colors ${text} ${textHover}`}>
          Contact Us
        </Link>
        <span className={`t-title ${endBar}`} style={{ ...bar, marginLeft: u(20) }} />
      </div>
    </header>
  );
}
