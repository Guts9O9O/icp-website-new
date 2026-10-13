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
// R3 draws the divider the same height as the bars (59 design px), not the
// height of the capitals. The client asked for it thicker than the PDF's 1.6,
// then (Oct 2026) for half of that again — it was reading as a block rather
// than a rule.
const divider = { width: `max(1px, ${u(2)})`, height: v(NAV_BAR_H) };

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
  });
  const left = ink(leftTone);
  const right = ink(tone);
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
            <span className={`t-title transition-colors ${left.endBar}`} style={{ ...divider, marginLeft: u(24) }} />
            {titleTo ? (
              <Link
                to={titleTo}
                className={`t-title leading-none transition-colors ${left.titleInk} hover:text-icp-taupe`}
                style={{ marginLeft: u(18) }}
              >
                {title}
              </Link>
            ) : (
              <span className={`t-title leading-none transition-colors ${left.titleInk}`} style={{ marginLeft: u(18) }}>
                {title}
              </span>
            )}
          </>
        )}
        {crumb && (
          <>
            <span className={`t-title transition-colors ${left.endBar}`} style={{ ...divider, marginLeft: u(24) }} />
            <Link
              to={crumb.to}
              className={`t-nav transition-colors ${left.crumbText} ${left.crumbHover}`}
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
        <Link to="/enquiry" className={`t-nav transition-colors ${right.text} ${right.textHover}`}>
          Contact Us
        </Link>
        <span className={`t-title ${right.endBar}`} style={{ ...bar, marginLeft: u(20) }} />
      </div>
    </header>
  );
}
