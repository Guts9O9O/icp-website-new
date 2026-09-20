import { Link } from 'react-router';
import { EDGE_BAR, NAV_BAR_H, NAV_TOP, u, v } from '../../lib/units';

const smallBar = { width: u(EDGE_BAR), height: v(NAV_BAR_H) };
const divider = { width: u(2), height: v(NAV_BAR_H) };

/**
 * Top nav shared by every inner page (R3):
 *   left  — [mist bar] home | title | crumb
 *   right — rightTitle | contact us [red bar]
 * Sits 100 design px from the top, between the edge bars, above any slide-out panels.
 */
export default function SiteNav({
  title,
  crumb, // { label, to } — e.g. the category on portfolio pages
  rightTitle, // page title shown on the right, e.g. "enquiry"
  leftLabel = 'home',
  leftTo = '/',
}) {
  return (
    <header
      className="pointer-events-none fixed left-0 right-0 z-50 flex items-center justify-between"
      style={{ top: v(NAV_TOP), paddingLeft: u(EDGE_BAR), paddingRight: u(EDGE_BAR) }}
    >
      <div className="pointer-events-auto flex items-center">
        <span className="bg-icp-mist" style={smallBar} />
        <Link
          to={leftTo}
          className="t-nav text-icp-mist transition-colors hover:text-icp-red"
          style={{ marginLeft: u(20) }}
        >
          {leftLabel}
        </Link>
        {title && (
          <>
            <span className="bg-icp-red" style={{ ...divider, marginLeft: u(24) }} />
            <span className="t-title leading-none text-icp-mist" style={{ marginLeft: u(18) }}>
              {title}
            </span>
          </>
        )}
        {crumb && (
          <>
            <span className="bg-icp-red" style={{ ...divider, marginLeft: u(24) }} />
            <Link
              to={crumb.to}
              className="t-nav text-icp-red transition-colors hover:text-icp-mist"
              style={{ marginLeft: u(18) }}
            >
              {crumb.label}
            </Link>
          </>
        )}
      </div>

      <div className="pointer-events-auto flex items-center">
        {rightTitle && (
          <>
            <span className="t-title leading-none text-icp-red">{rightTitle}</span>
            <span className="bg-icp-red" style={{ ...divider, marginLeft: u(18), marginRight: u(18) }} />
          </>
        )}
        <Link to="/enquiry" className="t-nav text-icp-mist transition-colors hover:text-icp-red">
          contact us
        </Link>
        <span className="bg-icp-red" style={{ ...smallBar, marginLeft: u(20) }} />
      </div>
    </header>
  );
}
