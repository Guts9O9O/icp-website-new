import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { getAbout, getTeam, getTeamPhoto } from '../lib/api';
import RichText from '../lib/richText';
import { useData } from '../lib/useData';
import { EDGE_BAR, FADE_FOOT, NAV_BAR_H, NAV_TOP, NO_HOVER_QUERY, PANEL_TEXT_BOTTOM, fs, u, v } from '../lib/units';
import { useMoreBelow } from '../lib/useMoreBelow';
import { useMediaQuery } from '../lib/useMediaQuery';
import { DEFAULT_TEAM_PHOTO, TEAM_LAYOUT, splitsFor, teamGeometry } from '../lib/teamPhoto';
import EdgeBars from './chrome/EdgeBars';
import SiteNav from './chrome/SiteNav';
import SiteFooter from './chrome/SiteFooter';
import { useSeo } from '../lib/seo';

const ABOUT_ID = 'about-icp';

// R5 (October 2026) puts the team in one photograph instead of four cards: a
// translucent red band runs the width of the page across it, carrying
// "Design TEAM" and each name, and every person stands in a strip of the
// photo (see lib/teamPhoto.js). Pointing at a strip opens its write-up in a
// red panel from the left edge up to the strip, and dims everything to the
// right of it, both at 75% as R5 draws them.
//
// The composition is laid out in design px on one scale, `--m`, centred on
// the page. Width and height share it so the band always crosses the people
// at the same place, whatever the shape of the screen: it is the page height
// on a landscape screen, and on a narrow one shrinks to keep the whole
// composition (1095 design px) across the width.
const PAGE_SCALE = 'min(var(--v), calc(100vw / 1250))';
const m = (n) => `calc(${n} * var(--m))`;
const X = (dx) => `calc(50% + ${m(dx)})`; // from the page's centre line
const Y = (y) => `calc(50% + ${m(y - 800)})`; // design y on the 1600-tall artboard

const LOCKUP_W = 127; // the "abou+ iC+P" lockup, as R5 draws it
const LOCKUP_Y = 850; // its centre
// R3 keeps the write-up in a fixed column on the left of the panel, centred
// vertically, whichever strip is open and however wide the panel grows.
const WRITEUP_W = 650;
// A panel narrower than this cannot be read, so on a narrow screen the
// write-up takes the whole width instead.
const MIN_PANEL_PX = 320;
// The band's names never shrink below this share of their size to fit.
const BAND_FIT_MIN = 0.6;

export default function AboutPage() {
  useSeo({
    title: 'About us',
    description: 'iC+P is a multidisciplinary design studio with Interior Design at its core, extending into Architecture, Product Design and bespoke elements. Meet the team behind Design to live.',
  });
  const { data: aboutInfo } = useData(getAbout);
  const { data: members } = useData(getTeam);
  const { data: teamPhoto } = useData(getTeamPhoto);

  const photo = teamPhoto ?? DEFAULT_TEAM_PHOTO;
  // The saved proportions place the strips before the photo has loaded; the
  // photo's own then take over, in case it was replaced without them.
  const [loadedAspect, setLoadedAspect] = useState(null);
  const aspect = loadedAspect ?? photo.aspect ?? DEFAULT_TEAM_PHOTO.aspect;
  const people = useMemo(() => members ?? [], [members]);
  // Until the team has loaded there is no one to give a strip to, but the
  // photo already needs its place: the saved strips (or R5's) stand in, so it
  // does not jump when the names arrive.
  const geo = useMemo(() => {
    const splits = people.length ? splitsFor(photo.splits, people.length) : splitsFor(photo.splits, (photo.splits?.length ?? 4) - 1);
    return teamGeometry({ aspect, splits });
  }, [aspect, photo.splits, people.length]);

  // Strip 0 is the studio's own ("Design TEAM"), then one per person.
  const zones = useMemo(
    () => [
      { id: ABOUT_ID, ...geo.about },
      ...people.map((member, i) => ({ id: member.id, member, ...geo.people[i] })),
    ],
    [geo, people]
  );

  const hoverable = !useMediaQuery(NO_HOVER_QUERY);
  const [activeId, setActiveId] = useState(null);
  // Pinned by a click. The studio write-up runs long enough to scroll, and a
  // panel that closes the moment the pointer leaves the strip cannot be read:
  // reaching its scrollbar means leaving the strip. Clicking holds it open.
  const [pinned, setPinned] = useState(false);
  const active = zones.find((z) => z.id === activeId);
  const isOpen = Boolean(active);
  const [panels, setPanels] = useState({ left: 0, right: 0, narrow: false });
  const zoneRefs = useRef({});
  const [writeupRef, writeupMore] = useMoreBelow();
  const closeTimer = useRef(null);

  // A grace period before closing, so the pointer can cross from the strip into
  // the panel without the panel vanishing underneath it.
  const cancelClose = () => clearTimeout(closeTimer.current);
  const openZone = (id) => {
    cancelClose();
    setActiveId(id);
  };
  // Hover opens a strip only where its panel fits beside it. Where the panel
  // would cover the whole page (a narrow window), opening it for a passing
  // pointer put the page under it until Close was clicked, so there it waits
  // for a click.
  const hoverOpen = (id) => {
    const el = zoneRefs.current[id];
    if (el && el.getBoundingClientRect().left < MIN_PANEL_PX) return;
    openZone(id);
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setActiveId((id) => (pinned ? id : null)), 180);
  };
  const dismiss = () => {
    cancelClose();
    setPinned(false);
    setActiveId(null);
  };

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  // Escape closes a pinned panel — otherwise it could only be dismissed by
  // clicking away, which is not obvious and is unreachable from the keyboard.
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && dismiss();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Panels extend from the page edges to the open strip's edges.
  useEffect(() => {
    if (!activeId) return undefined;
    const el = zoneRefs.current[activeId];
    if (!el) return undefined;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const narrow = rect.left < MIN_PANEL_PX;
      setPanels({
        narrow,
        left: narrow ? window.innerWidth : Math.max(0, rect.left),
        right: narrow ? 0 : Math.max(0, window.innerWidth - rect.right),
      });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [activeId, geo]);

  // Each name stays on one line in its strip. The strips are narrow on a
  // short screen and the text has a readable floor, so a long name could not
  // fit: "Archna SHINGHAL" broke in two and hung out of the band (in Roboto,
  // the face Android draws for Segoe UI, it is wider still). When any name
  // outgrows its strip the whole row steps down together, so the names stay
  // one size.
  const rootRef = useRef(null);
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const fit = () => {
      root.style.setProperty('--band-fit', '1');
      let scale = 1;
      root.querySelectorAll('[data-band-label]').forEach((cell) => {
        const text = cell.querySelector('[data-band-text]');
        const css = getComputedStyle(cell);
        const room = cell.clientWidth - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight);
        const need = text?.getBoundingClientRect().width ?? 0;
        if (need > room && room > 0) scale = Math.min(scale, room / need);
      });
      root.style.setProperty('--band-fit', String(Math.max(BAND_FIT_MIN, scale)));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(root);
    document.fonts?.ready.then(fit);
    return () => observer.disconnect();
  }, [zones]);

  const bandLabel = {
    fontSize: `calc(var(--band-fit, 1) * max(11px, ${m(16)}))`,
    letterSpacing: '0.06em',
    whiteSpace: 'nowrap',
    paddingLeft: `max(4px, ${m(12)})`,
    paddingRight: `max(4px, ${m(12)})`,
  };

  // The strips sit above the write-up panel so a pointer can move straight
  // from one person to the next. Without a pointer that only gets in the way:
  // on a touch screen the text over a strip could not be scrolled (the strip
  // took the swipe) and tapping it switched person. Nor can it work when the
  // panel spans the whole width, with every strip under the text. There the
  // panel goes on top, and when it covers everything it carries a Close.
  const panelOnTop = isOpen && (!hoverable || panels.narrow);
  const activeIndex = zones.findIndex((z) => z.id === activeId);
  // A name under the panel only showed through the write-up as a faint
  // ghost behind its lines, so while the panel covers it, it steps out.
  const covered = (i) => isOpen && (panels.narrow || i < activeIndex);

  return (
    <div ref={rootRef} className="relative min-h-page bg-icp-paper font-brand" style={{ '--m': PAGE_SCALE }} onClick={dismiss}>
      <EdgeBars />
      <SiteNav title="About Us" tone={isOpen ? 'dark' : 'light'} />

      {/* The team, as one photograph. */}
      <img
        src={photo.path}
        alt={people.length ? `The iC+P team: ${people.map((p) => `${p.firstName} ${p.lastName}`).join(', ')}` : 'The iC+P team'}
        onLoad={(e) => {
          const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
          if (w && h) setLoadedAspect(w / h);
        }}
        className="pointer-events-none absolute z-10 select-none object-contain"
        style={{ left: X(geo.photo.left), top: Y(TEAM_LAYOUT.photoTop), width: m(geo.photo.width), height: m(TEAM_LAYOUT.photoH) }}
        draggable={false}
      />

      {/* The designer's own lockup, supplied as artwork, centred in the
          studio's strip. */}
      <img
        src="/images/about-icp.png"
        alt="about iC+P"
        className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2"
        style={{ left: X(geo.about.left + geo.about.width / 2), top: Y(LOCKUP_Y), width: m(LOCKUP_W), height: 'auto' }}
      />

      {/* The band: edge to edge, 75% red as R5 draws it, so the photograph
          shows through it. A white rule starts each person's strip; the
          studio's strip runs on into the band unbroken. */}
      <div
        className="pointer-events-none absolute z-20 bg-icp-red/75"
        style={{ left: u(EDGE_BAR), right: u(EDGE_BAR), top: Y(TEAM_LAYOUT.bandTop), height: m(TEAM_LAYOUT.bandH) }}
      />
      {zones.map((z, i) => (
        <div
          key={`label-${z.id}`}
          data-band-label
          className="pointer-events-none absolute z-20 flex items-center justify-center text-center text-white transition-opacity duration-700"
          style={{
            left: X(z.left),
            width: m(z.width),
            top: Y(TEAM_LAYOUT.bandTop),
            height: m(TEAM_LAYOUT.bandH),
            opacity: covered(i) ? 0 : 1,
            ...bandLabel,
          }}
        >
          {z.member && <span className="absolute inset-y-0 left-0 bg-white" style={{ width: 'max(1px, calc(1.5 * var(--m)))' }} />}
          {z.member ? (
            <span data-band-text>
              {z.member.firstName} <span className="t-strong uppercase">{z.member.lastName}</span>
            </span>
          ) : (
            <span data-band-text>Design TEAM</span>
          )}
        </div>
      ))}

      {/* Left panel: the write-up for the open strip. */}
      <aside
        onMouseEnter={hoverable ? cancelClose : undefined}
        onMouseLeave={hoverable ? scheduleClose : undefined}
        onClick={(e) => e.stopPropagation()}
        data-panel="writeup"
        className={[
          // above the footer marks, below the edge bars/nav; above the strips when panelOnTop
          `fixed inset-y-0 left-0 ${panelOnTop ? 'z-[37]' : 'z-[35]'} bg-icp-red/75 text-white`,
          'transition-transform duration-700 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        style={{ width: panels.left }}
      >
        {/* The panel fills the height, but only this inner band scrolls, and it
            starts below the nav. Scrolling the whole panel ran the write-up up
            underneath "Home | About Us", which is what made the two collide.
            It stops above the footer's iC+P mark, as the category panel does,
            and while there is more below its foot fades: run down to the
            footer rule, the studio's write-up looked cut off mid-sentence. */}
        <div
          ref={writeupRef}
          className="scroll-slim absolute inset-x-0 overflow-y-auto"
          style={{
            top: v(NAV_TOP + NAV_BAR_H + 30),
            bottom: PANEL_TEXT_BOTTOM,
            ...(writeupMore ? { WebkitMaskImage: FADE_FOOT, maskImage: FADE_FOOT } : null),
          }}
        >
          <div
            className="flex min-h-full flex-col justify-center"
            style={{
              paddingLeft: u(EDGE_BAR + 60),
              paddingRight: u(60),
              paddingTop: v(40),
              paddingBottom: v(40),
              width: `min(${u(WRITEUP_W + EDGE_BAR + 120)}, 100%)`,
              fontSize: fs(14, 12),
              lineHeight: 1.8,
              gap: u(40),
            }}
          >
            {active && active.id === ABOUT_ID && aboutInfo && (
              <section>
                <RichText text={aboutInfo.text} tone="dark" gap={u(18)} />
              </section>
            )}
            {active?.member && (
              <section>
                <h2 className="font-semibold" style={{ marginBottom: u(6), letterSpacing: '0.08em' }}>
                  {active.member.firstName} <span className="uppercase">{active.member.lastName}</span>
                </h2>
                <p className="uppercase text-white/80" style={{ marginBottom: u(28), letterSpacing: '0.16em', fontSize: fs(13, 11) }}>
                  {active.member.role.join(' ')}
                </p>
                <RichText text={active.member.bio} tone="dark" gap={u(18)} />
              </section>
            )}
          </div>
        </div>
        {panelOnTop && panels.narrow && (
          <button
            type="button"
            onClick={dismiss}
            className="absolute flex items-center uppercase text-white/90 transition-colors hover:text-white"
            style={{ top: v(NAV_TOP + NAV_BAR_H + 30), right: u(EDGE_BAR + 60), fontSize: fs(13, 11), letterSpacing: '0.16em', gap: '0.6em' }}
          >
            Close
            <svg viewBox="0 0 12 12" width="0.9em" height="0.9em" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
              <path d="M1.5 1.5l9 9M10.5 1.5l-9 9" />
            </svg>
          </button>
        )}
      </aside>

      {/* Right panel: dims everything to the right of the open strip. */}
      <aside
        className={[
          'pointer-events-none fixed inset-y-0 right-0 z-[35] bg-icp-taupe/75',
          'transition-transform duration-700 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
        style={{ width: panels.right }}
      />

      {/* The strips themselves: invisible, above both panels, so the pointer
          can move from one person straight to the next. Each runs from the
          top of the photograph to the foot of the band. */}
      {zones.map((z) => (
        <div
          key={z.id}
          ref={(el) => {
            if (el) zoneRefs.current[z.id] = el;
          }}
          role="button"
          tabIndex={0}
          aria-label={z.member ? `About ${z.member.firstName} ${z.member.lastName}` : 'About iC+P'}
          aria-expanded={activeId === z.id}
          className="absolute z-[36] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          style={{
            left: X(z.left),
            width: m(z.width),
            top: Y(TEAM_LAYOUT.photoTop),
            height: m(TEAM_LAYOUT.bandTop + TEAM_LAYOUT.bandH - TEAM_LAYOUT.photoTop),
          }}
          onMouseEnter={hoverable ? () => hoverOpen(z.id) : undefined}
          onMouseLeave={hoverable ? scheduleClose : undefined}
          onFocus={hoverable ? () => openZone(z.id) : undefined}
          onBlur={hoverable ? scheduleClose : undefined}
          onClick={(e) => {
            // Hover devices open on hover and pin on click, so a long write-up
            // can be read and scrolled without holding the pointer still. Touch
            // devices have no hover, so the tap does the opening, and a second
            // tap on the same person closes it again.
            e.stopPropagation();
            if (!hoverable && activeId === z.id) {
              dismiss();
              return;
            }
            openZone(z.id);
            setPinned(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openZone(z.id);
              setPinned(true);
            }
          }}
        />
      ))}

      <SiteFooter />
    </div>
  );
}
