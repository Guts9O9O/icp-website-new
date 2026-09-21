import { useEffect, useMemo, useRef, useState } from 'react';
import { getAbout, getTeam } from '../lib/api';
import { useData } from '../lib/useData';
import { EDGE_BAR, fs, u, v } from '../lib/units';
import EdgeBars from './chrome/EdgeBars';
import SiteNav from './chrome/SiteNav';
import SiteFooter from './chrome/SiteFooter';

const ABOUT_CARD_ID = 'about-icp';

// Column geometry from R3 (design px).
const COL_W = 229.81;
const COL_H = 675;
const COL_TOP = 500;
const PHOTO_H = 455;
const NAME_H = 95;
const RULE_H = 6;

function TeamCard({ member, isAbout, isActive, isMuted, onEnter, onLeave, onToggle, cardRef }) {
  return (
    <div
      ref={cardRef}
      className={[
        'relative flex cursor-pointer flex-col transition-opacity duration-500',
        isActive ? 'z-40' : 'z-10',
        isMuted ? 'opacity-40' : 'opacity-100',
      ].join(' ')}
      style={{ width: u(COL_W), height: v(COL_H) }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      role="button"
      tabIndex={0}
    >
      <div className="absolute inset-y-0 left-0 bg-icp-mist" style={{ width: `max(1px, ${u(1.5)})` }} />

      {isAbout ? (
        <div className="flex items-center justify-center" style={{ height: v(PHOTO_H + NAME_H) }}>
          <div className="flex -rotate-90 items-center text-icp-slate" style={{ gap: u(24) }}>
            <span className="font-normal" style={{ fontSize: fs(22, 13), letterSpacing: '0.45em' }}>
              abou<span className="text-icp-red">+</span>
            </span>
            <span className="font-normal" style={{ fontSize: fs(22, 13), letterSpacing: '0.45em' }}>
              iC+P
            </span>
          </div>
        </div>
      ) : (
        <>
          <div className="relative overflow-hidden bg-white" style={{ height: v(PHOTO_H) }}>
            {member.image ? (
              <img
                src={member.image}
                alt={`${member.firstName} ${member.lastName}`}
                className="h-full w-full object-cover object-top"
              />
            ) : (
              <div className="h-full w-full bg-icp-mist/40" />
            )}
          </div>
          <div
            className="flex items-center justify-center bg-icp-taupe/50 text-center text-white"
            style={{ height: v(NAME_H), fontSize: fs(14, 11), letterSpacing: '0.12em' }}
          >
            <span>
              {member.firstName}{' '}
              <span className="font-semibold uppercase">{member.lastName}</span>
            </span>
          </div>
        </>
      )}

      <div className="w-full bg-icp-red" style={{ height: v(RULE_H) }} />

      <div
        className="flex flex-1 flex-col items-center justify-center text-center text-icp-slate"
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
  const { data: aboutInfo } = useData(getAbout);
  const { data: members } = useData(getTeam);

  // The "about iC+P" card sits first in the row and opens the studio write-up.
  const cards = useMemo(
    () => [{ id: ABOUT_CARD_ID, firstName: 'About', lastName: 'iC+P', role: [], image: null }, ...(members ?? [])],
    [members]
  );

  const [activeId, setActiveId] = useState(null);
  const active = cards.find((c) => c.id === activeId);
  const isOpen = Boolean(active);
  const [panels, setPanels] = useState({ left: 0, right: 0 });
  const cardRefs = useRef({});

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
    <div className="relative min-h-screen bg-white font-brand" onClick={() => setActiveId(null)}>
      <EdgeBars />
      <SiteNav title="about us" />

      {/* Left panel: write-up for the hovered card */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-30 overflow-y-auto bg-icp-red/50 text-white backdrop-blur-[1px]',
          'transition-transform duration-700 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        style={{ width: panels.left }}
      >
        <div
          className="flex flex-col"
          style={{
            paddingLeft: u(EDGE_BAR + 60),
            paddingRight: u(60),
            paddingTop: v(320),
            paddingBottom: v(160),
            fontSize: fs(14, 12),
            lineHeight: 1.8,
            gap: u(40),
          }}
        >
          {active && active.id === ABOUT_CARD_ID && aboutInfo && (
            <>
              <section>
                <h2 className="font-semibold" style={{ marginBottom: u(16) }}>{aboutInfo.title}</h2>
                <p>{aboutInfo.intro}</p>
              </section>
              <section>
                <h2 className="font-semibold" style={{ marginBottom: u(16) }}>Design Team</h2>
                <p style={{ marginBottom: u(16) }}>{aboutInfo.teamIntro}</p>
                <ul className="list-disc" style={{ paddingLeft: u(28), display: 'grid', gap: u(10) }}>
                  {aboutInfo.hallmarks.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </section>
            </>
          )}
          {active && active.id !== ABOUT_CARD_ID && (
            <section>
              <h2 className="font-semibold" style={{ marginBottom: u(6) }}>
                {active.firstName} <span className="uppercase">{active.lastName}</span>
              </h2>
              <p className="text-white/80" style={{ marginBottom: u(24) }}>{active.role.join(' ')}</p>
              <div style={{ display: 'grid', gap: u(12) }}>
                {(active.details ?? []).map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </section>
          )}
        </div>
      </aside>

      {/* Right panel: dims everything to the right of the hovered card */}
      <aside
        className={[
          'pointer-events-none fixed inset-y-0 right-0 z-30 bg-icp-taupe/50',
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
              onEnter={() => setActiveId(card.id)}
              onLeave={() => setActiveId(null)}
              onToggle={() => setActiveId((prev) => (prev === card.id ? null : card.id))}
              cardRef={(el) => {
                if (el) cardRefs.current[card.id] = el;
              }}
            />
          ))}
          <div className="absolute inset-y-0 right-0 bg-icp-mist" style={{ width: `max(1px, ${u(1.5)})` }} />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
