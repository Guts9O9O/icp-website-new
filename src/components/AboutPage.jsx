import { useEffect, useMemo, useRef, useState } from 'react';
import { getAbout, getTeam } from '../lib/api';
import RichText from '../lib/richText';
import { useData } from '../lib/useData';
import { EDGE_BAR, FOOTER_H, NAV_BAR_H, NAV_TOP, NO_HOVER_QUERY, fs, u, v } from '../lib/units';
import { useMediaQuery } from '../lib/useMediaQuery';
import EdgeBars from './chrome/EdgeBars';
import SiteNav from './chrome/SiteNav';
import SiteFooter from './chrome/SiteFooter';
import { useSeo } from '../lib/seo';

const ABOUT_CARD_ID = 'about-icp';

// Column geometry from R3 (design px).
const COL_W = 210; // client feedback: slimmer than R3's 236
const COL_H = 675;
const COL_TOP = 500;
const PHOTO_H = 455;
const NAME_H = 95;
const RULE_H = 5; // R4 p4 measures 5.0 under each photograph
const ABOUT_MARK_W = 75; // the supplied "abou+ iC+P" lockup, at the size the client asked for
// R3 keeps the write-up in a fixed column on the left of the panel, centred
// vertically, whichever card is open and however wide the panel grows.
const WRITEUP_W = 650;

// The three photographs were not shot alike: Prachi's was taken from further
// back, so her face came out about 17% smaller than the other two (by eye
// spacing and by eye-to-chin alike) and her head started twice as far down.
// The client asked for the faces to match and the tops of the heads to meet
// one line. `headTop` is where the hair starts in each photograph, as a share
// of its height; each is zoomed by `zoom` from the top and moved so that its
// head starts at HEAD_LINE. Measured on the current photographs: a member who
// uploads a new one should drop out of this list.
const HEAD_LINE = 0.065;
const PHOTO_FRAME = {
  'Imran Khan': { headTop: 0.059, zoom: 1 },
  'Prachi Laud': { headTop: 0.129, zoom: 1.17 },
  'Archna Shinghal': { headTop: 0.071, zoom: 1 },
};

function photoFrame(member) {
  const frame = PHOTO_FRAME[`${member.firstName} ${member.lastName}`];
  if (!frame) return undefined;
  const shift = (HEAD_LINE - frame.headTop * frame.zoom) * 100;
  return { transformOrigin: 'top center', transform: `translateY(${shift}%) scale(${frame.zoom})` };
}

function TeamCard({ member, isAbout, isActive, isMuted, onEnter, onLeave, onToggle, hoverable, cardRef }) {
  return (
    <div
      ref={cardRef}
      className={[
        'relative flex cursor-pointer flex-col transition-opacity duration-500',
        isActive ? 'z-40' : 'z-10',
        isMuted ? 'opacity-40' : 'opacity-100',
      ].join(' ')}
      style={{ width: u(COL_W), height: v(COL_H) }}
      onMouseEnter={hoverable ? onEnter : undefined}
      onMouseLeave={hoverable ? onLeave : undefined}
      onFocus={hoverable ? onEnter : undefined}
      onBlur={hoverable ? onLeave : undefined}
      onClick={(e) => {
        // Hover devices open on hover and pin on click, so a long write-up can
        // be read and scrolled without holding the pointer still. Touch devices
        // have no hover, so the tap does the opening (its synthetic mouseenter
        // is ignored above and so cannot cancel itself).
        e.stopPropagation();
        onToggle();
      }}
      role="button"
      tabIndex={0}
    >
      {/* z-20: the photo below is positioned and comes later in the DOM, so
          without this the line is covered for the whole height of the photo
          and only reappears under it — the divider the client saw as missing. */}
      <div className="absolute inset-y-0 left-0 z-20 bg-icp-mist" style={{ width: `max(1px, ${u(1.5)})` }} />

      {isAbout ? (
        <div className="flex items-center justify-center" style={{ height: v(PHOTO_H + NAME_H) }}>
          {/* The designer's own lockup, supplied as artwork — it was previously
              rebuilt out of rotated text, which could not match the spacing. */}
          <img
            src="/images/about-icp.png"
            alt="about iC+P"
            style={{ width: u(ABOUT_MARK_W), height: 'auto' }}
          />
        </div>
      ) : (
        <>
          {/* The team photographs are cut-outs, so the cell takes the page
              colour and they sit on it rather than on a white card. R4 runs the
              photograph all the way down to the rule and lays the name band
              across its foot, so the picture shows through the band — it is not
              a separate block below the picture, which is what it had become. */}
          <div className="relative overflow-hidden bg-icp-paper" style={{ height: v(PHOTO_H + NAME_H) }}>
            {member.image ? (
              <img
                src={member.image}
                alt={`${member.firstName} ${member.lastName}`}
                className="h-full w-full object-cover object-top"
                style={photoFrame(member)}
              />
            ) : (
              <div className="h-full w-full bg-icp-mist/40" />
            )}
            {/* 75%, which is what R4 measures. The band is transparent, so how
                it reads depends on the photograph under it — at 50% a pale
                shirt lifted one band well clear of the other two (59 levels
                apart, against R4's own ~20). Three quarters halves the
                photograph's share and brings them back together. */}
            <div
              className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-icp-red/75 text-center text-white"
              style={{ height: v(NAME_H), fontSize: fs(14, 11), letterSpacing: '0.12em' }}
            >
              <span>
                {member.firstName}{' '}
                <span className="font-semibold uppercase">{member.lastName}</span>
              </span>
            </div>
          </div>
        </>
      )}

      {/* R3 ran this rule under the photographs only; the client asked for it
          under the lockup too, so it reads as one line across the row. */}
      <div className="w-full bg-icp-red" style={{ height: v(RULE_H) }} />

      {/* The client asked for these captions bold; `t-strong` rather than a
          weight class, since the light face has no bold of its own. */}
      <div
        className="t-strong flex flex-1 flex-col items-center justify-center text-center text-icp-slate"
        style={{ fontSize: fs(14, 11), letterSpacing: '0.08em', lineHeight: 1.6 }}
      >
        {isAbout ? (
          <p>
            design <span className="font-semibold">TEAM</span>
          </p>
        ) : (
          member.role.map((line, i) => <p key={i}>{line}</p>)
        )}
      </div>
    </div>
  );
}

export default function AboutPage() {
  useSeo({
    title: 'About us',
    description: 'iC+P is a multidisciplinary design studio with Interior Design at its core, extending into Architecture, Product Design and bespoke elements. Meet the team behind Design to live.',
  });
  const { data: aboutInfo } = useData(getAbout);
  const { data: members } = useData(getTeam);

  // The "about iC+P" card sits first in the row and opens the studio write-up.
  const cards = useMemo(
    () => [{ id: ABOUT_CARD_ID, firstName: 'About', lastName: 'iC+P', role: [], image: null }, ...(members ?? [])],
    [members]
  );

  const hoverable = !useMediaQuery(NO_HOVER_QUERY);
  const [activeId, setActiveId] = useState(null);
  // Pinned by a click. The studio write-up runs long enough to scroll, and a
  // panel that closes the moment the pointer leaves the card cannot be read:
  // reaching its scrollbar means leaving the card. Clicking holds it open.
  const [pinned, setPinned] = useState(false);
  const active = cards.find((c) => c.id === activeId);
  const isOpen = Boolean(active);
  const [panels, setPanels] = useState({ left: 0, right: 0 });
  const cardRefs = useRef({});
  const closeTimer = useRef(null);

  // A grace period before closing, so the pointer can cross from the card into
  // the panel without the panel vanishing underneath it.
  const cancelClose = () => clearTimeout(closeTimer.current);
  const openCard = (id) => {
    cancelClose();
    setActiveId(id);
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

  // Panels extend from the page edges to the hovered card's edges.
  useEffect(() => {
    if (!activeId) return undefined;
    const el = cardRefs.current[activeId];
    if (!el) return undefined;
    const update = () => {
      const rect = el.getBoundingClientRect();
      setPanels({ left: Math.max(0, rect.left), right: Math.max(0, window.innerWidth - rect.right) });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [activeId]);

  return (
    <div className="relative min-h-screen bg-icp-paper font-brand" onClick={dismiss}>
      <EdgeBars />
      <SiteNav title="About Us" tone={isOpen ? 'dark' : 'light'} />

      {/* Left panel: write-up for the hovered card */}
      <aside
        onMouseEnter={hoverable ? cancelClose : undefined}
        onMouseLeave={hoverable ? scheduleClose : undefined}
        onClick={(e) => e.stopPropagation()}
        data-panel="writeup"
        className={[
          // Translucent, not solid: R3 lets the lockup and the team photos show
          // through the panel, tinted red. At 80% over the pale page this lands
          // on the #945643 the client asked for.
          'fixed inset-y-0 left-0 z-[35] bg-icp-red/80 text-white', // above the footer marks, below the edge bars/nav
          'transition-transform duration-700 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        style={{ width: panels.left }}
      >
        {/* The panel fills the height, but only this inner band scrolls, and it
            starts below the nav. Scrolling the whole panel ran the write-up up
            underneath "Home | About Us", which is what made the two collide. */}
        <div
          className="scroll-slim absolute inset-x-0 overflow-y-auto"
          style={{ top: v(NAV_TOP + NAV_BAR_H + 30), bottom: v(FOOTER_H) }}
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
          {active && active.id === ABOUT_CARD_ID && aboutInfo && (
            <section>
              <RichText text={aboutInfo.text} tone="dark" gap={u(18)} />
            </section>
          )}
          {active && active.id !== ABOUT_CARD_ID && (
            <section>
              <h2 className="font-semibold" style={{ marginBottom: u(6), letterSpacing: '0.08em' }}>
                {active.firstName} <span className="uppercase">{active.lastName}</span>
              </h2>
              <p className="uppercase text-white/80" style={{ marginBottom: u(28), letterSpacing: '0.16em', fontSize: fs(13, 11) }}>
                {active.role.join(' ')}
              </p>
              <RichText text={active.bio} tone="dark" gap={u(18)} />
            </section>
          )}
        </div>
        </div>
      </aside>

      {/* Right panel: dims everything to the right of the hovered card */}
      <aside
        className={[
          'pointer-events-none fixed inset-y-0 right-0 z-[35] bg-icp-taupe/70',
          'transition-transform duration-700 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
        style={{ width: panels.right }}
      />

      <main className="absolute left-0 right-0 flex justify-center" style={{ top: v(COL_TOP) }}>
        <div className="relative flex">
          {cards.map((card) => (
            <TeamCard
              key={card.id}
              member={card}
              isAbout={card.id === ABOUT_CARD_ID}
              isActive={activeId === card.id}
              isMuted={isOpen && activeId !== card.id}
              onEnter={() => openCard(card.id)}
              onLeave={scheduleClose}
              onToggle={() => {
                openCard(card.id);
                setPinned(true);
              }}
              hoverable={hoverable}
              cardRef={(el) => {
                if (el) cardRefs.current[card.id] = el;
              }}
            />
          ))}
          <div className="absolute inset-y-0 right-0 z-20 bg-icp-mist" style={{ width: `max(1px, ${u(1.5)})` }} />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
