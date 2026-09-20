import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { getAbout, getTeam } from '../lib/api';
import { useData } from '../lib/useData';

const ABOUT_CARD_ID = 'about-icp';

function LottieLogo() {
  const containerRef = useRef(null);

  useEffect(() => {
    let animation;
    let cancelled = false;

    const startAnimation = async () => {
      const response = await fetch('/animations/short-logo-icp.json');
      const animationData = await response.json();
      if (cancelled || !containerRef.current || !window.lottie) return;
      animation = window.lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData,
        assetsPath: '/animations/images/',
      });
    };

    const loadPlayer = async () => {
      if (window.lottie) { await startAnimation(); return; }
      await new Promise((resolve, reject) => {
        const existing = document.querySelector('script[data-lottie-web="true"]');
        if (existing) {
          existing.addEventListener('load', resolve, { once: true });
          existing.addEventListener('error', reject, { once: true });
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/lottie-web@5.12.2/build/player/lottie.min.js';
        script.async = true;
        script.dataset.lottieWeb = 'true';
        script.addEventListener('load', resolve, { once: true });
        script.addEventListener('error', reject, { once: true });
        document.body.appendChild(script);
      });
      if (!cancelled) await startAnimation();
    };

    loadPlayer().catch(() => {});
    return () => { cancelled = true; if (animation) animation.destroy(); };
  }, []);

  return <div ref={containerRef} className="h-[400px] w-[400px]" aria-label="iC+P Logo" />;
}

function LottieSignature() {
  const containerRef = useRef(null);

  useEffect(() => {
    let animation;
    let cancelled = false;

    const startAnimation = async () => {
      const response = await fetch('/animations/signature.json');
      const animationData = await response.json();

      if (cancelled || !containerRef.current || !window.lottie) return;

      animation = window.lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData,
      });
    };

    const loadPlayer = async () => {
      if (window.lottie) {
        await startAnimation();
        return;
      }

      await new Promise((resolve, reject) => {
        const existing = document.querySelector('script[data-lottie-web="true"]');
        if (existing) {
          existing.addEventListener('load', resolve, { once: true });
          existing.addEventListener('error', reject, { once: true });
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/lottie-web@5.12.2/build/player/lottie.min.js';
        script.async = true;
        script.dataset.lottieWeb = 'true';
        script.addEventListener('load', resolve, { once: true });
        script.addEventListener('error', reject, { once: true });
        document.body.appendChild(script);
      });

      if (!cancelled) {
        await startAnimation();
      }
    };

    loadPlayer().catch(() => {});

    return () => {
      cancelled = true;
      if (animation) animation.destroy();
    };
  }, []);

  return <div ref={containerRef} className="h-[260px] w-[680px]" aria-label="Signature" />;
}

function TeamCard({
  id,
  firstName,
  lastName,
  role,
  image,
  isActive,
  isMuted,
  onHoverStart,
  onHoverEnd,
  isAbout,
  cardRef,
}) {
  return (
    <div
      className={[
        'relative flex w-[133.36px] flex-col border-x-[1px] border-x-[#C3BDB4] transition-[opacity,transform] duration-500 ease-in-out',
        isActive ? 'z-40 scale-[1.02]' : 'z-10',
        isMuted ? 'opacity-25 grayscale pointer-events-none' : 'opacity-100',
        onHoverStart ? 'cursor-pointer' : '',
      ].join(' ')}
      ref={cardRef}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onKeyDown={(event) => {
        if (!onHoverStart) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onHoverStart();
        }
      }}
      onFocus={onHoverStart}
      onBlur={onHoverEnd}
      role={onHoverStart ? 'button' : undefined}
      tabIndex={onHoverStart ? 0 : undefined}
    >
      {!isAbout && (
        <>
          <div
            className={[
              'relative z-10 overflow-hidden',
              'bg-white/60'
            ].join(' ')}
            style={{ height: '327.3px' }}
          >
            {image ? (
              <img
                src={image}
                alt={`${firstName} ${lastName}`}
                className="h-full w-full object-cover object-top"
              />
            ) : (
              <div className="h-full w-full bg-[#e8e4df]" />
            )}
            <div className="absolute bottom-0 left-0 right-0 z-30 flex h-[40px] items-center justify-center bg-[rgba(102,89,77,0.5)] px-3 text-center">
              <p className="text-[12px] leading-tight tracking-[0.16em] text-[#f4efe8]">
                <span className="font-semilight">{firstName} </span>
                <span className="font-semibold">{lastName}</span>
              </p>
            </div>
          </div>
          <div className="mx-auto h-[4px] w-[132.65px] bg-[#781F1C]" />
          <div className="flex h-[72.7px] flex-col items-center justify-center px-5 text-center">
            {role.map((line, i) => (
              <p key={i} className="whitespace-nowrap text-[12px] font-semilight leading-[1.35] tracking-[0.18em] text-[#47433E]">
                {line}
              </p>
            ))}
          </div>
        </>
      )}
      {isAbout && (
        <>
          <div
            className={[
              'relative z-10 flex items-center justify-center',
              'bg-white/60'
            ].join(' ')}
            style={{ height: '327.3px' }}
          >
            <div className="flex rotate-[-90deg] items-center gap-[18px] text-[#47433E]">
              <span className="text-[13px] font-semilight lowercase tracking-[0.5em]">about</span>
              <span className="text-[22px] font-semilight leading-none tracking-[0.2em]">i C + P</span>
            </div>
          </div>
          <div className="mx-auto h-[4px] w-[132.65px] bg-[#781F1C]" />
          <div className="flex h-[72.7px] items-center justify-center px-5 text-center">
            <p className="whitespace-nowrap text-[12px] font-semilight tracking-[0.18em] text-[#47433E]">
              design <span className="font-semibold">TEAM</span>
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default function AboutPage() {
  const navigate = useNavigate();
  const { data: aboutInfo } = useData(getAbout);
  const { data: members } = useData(getTeam);

  // The "about iC+P" card sits first in the row and opens the studio write-up.
  const team = useMemo(
    () => [
      { id: ABOUT_CARD_ID, firstName: 'About', lastName: 'iC+P', role: ['Design Team'], image: null },
      ...(members ?? []),
    ],
    [members]
  );

  const [activeId, setActiveId] = useState(null);
  const activeMember = team.find((member) => member.id === activeId);
  const isPanelOpen = Boolean(activeMember);
  const [panelWidths, setPanelWidths] = useState({ left: '50vw', right: '50vw' });
  const cardRefs = useRef({});

  useEffect(() => {
    if (!activeId) {
      setPanelWidths({ left: '50vw', right: '50vw' });
      return;
    }
    const el = cardRefs.current[activeId];
    if (!el) return;
    const updateWidths = () => {
      const rect = el.getBoundingClientRect();
      const leftPx = Math.max(0, rect.left);
      const rightPx = Math.max(0, window.innerWidth - rect.right);
      setPanelWidths({ left: `${leftPx}px`, right: `${rightPx}px` });
    };
    updateWidths();
    window.addEventListener('resize', updateWidths);
    return () => window.removeEventListener('resize', updateWidths);
  }, [activeId]);

  return (
    <div className="min-h-screen font-brand" style={{ background: '#f5f1ec' }}>
      <div className="fixed inset-y-0 left-0 z-30 w-[8.22px] bg-[#781f1c]" />
      <div className="fixed inset-y-0 right-0 z-30 w-[8.22px] bg-[#c3bdb4]" />

      {/* Slide-out left panel */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-10 text-white overflow-y-auto',
          'bg-[#8a4f47]/95 shadow-[20px_0_60px_rgba(0,0,0,0.25)]',
          'transform-gpu transition-transform duration-700 ease-in-out',
          isPanelOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        style={{ width: panelWidths.left }}
      >
        <div className="flex h-full flex-col gap-5 px-8 py-10 text-[12.5px] leading-[1.75] tracking-wide">
          {activeMember && activeMember.id === ABOUT_CARD_ID && aboutInfo && (
            <div className="space-y-6 text-[#C3BDB4]">
              <div className="border-b border-white/20 pb-5">
                <p className="mb-3 text-[13px] font-semibold tracking-[0.08em] text-[#C3BDB4]">
                  {aboutInfo.title}
                </p>
                <p>{aboutInfo.intro}</p>
              </div>
              <div className="border-b border-white/20 pb-5">
                <p className="mb-3 text-[13px] font-semibold tracking-[0.08em] text-[#C3BDB4]">
                  Design Team
                </p>
                <p className="mb-4">{aboutInfo.teamIntro}</p>
                <ul className="space-y-2 pl-1">
                  {aboutInfo.hallmarks.map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-[6px] h-[5px] w-[5px] shrink-0 rounded-full bg-[#C3BDB4]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {activeMember && activeMember.id !== ABOUT_CARD_ID && (
            <div className="space-y-4 text-[#C3BDB4]">
              <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#C3BDB4]">
                Design Team
              </p>
              <p className="text-[13px] font-semibold tracking-[0.08em] text-[#C3BDB4]">
                {activeMember.firstName} {activeMember.lastName}
              </p>
              <p className="text-[12px] uppercase tracking-[0.14em] text-[#C3BDB4]">
                {activeMember.role.join(' ')}
              </p>
              <div className="space-y-2 text-[12px]">
                {activeMember.details.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Slide-out overlay from right */}
      <aside
        className={[
          'fixed inset-y-0 right-0 z-10 bg-[rgba(195,189,180,0.5)]',
          'shadow-[-20px_0_60px_rgba(0,0,0,0.18)]',
          'transform-gpu transition-transform duration-700 ease-in-out',
          isPanelOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
        style={{ width: panelWidths.right }}
      />

      {/* Top Nav */}
      <nav className="flex items-center justify-between pb-4 pt-[56px]">
        <div className="flex items-center">
          <span className="h-[33px] w-[8.22px] bg-[#781F1C]" />
          <span className="h-[33px] w-[8.22px] bg-[#c3bdb4]" />
          <div className="ml-[5px] flex w-[70px] items-center justify-center">
            <button
              onClick={() => navigate('/')}
              className="font-light text-[20px] tracking-wide text-[#c3bdb4] transition hover:text-[#781F1C]"
            >
              home
            </button>
          </div>
          <span className="h-[33px] w-[1.2px] bg-[#c8c2ba]" />
          <span className="ml-[15px] w-[120px] text-[28px] font-light tracking-wide text-[#c3bdb4]">about us</span>
        </div>
        <div className="flex items-center gap-4 pr-[7px] pt-[0.65px] text-[20px] font-semilight tracking-[0.02em] text-[#d2ccc4]">
          <button
            onClick={() => navigate('/enquiry')}
            className="transition hover:text-[#781F1C]"
          >
            contact us
          </button>
          <span className="inline-block h-[33px] w-[8.22px] shrink-0 bg-[#781F1C]" />
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative flex flex-col items-center justify-center px-6 py-16">
        <div className="relative z-30 flex flex-wrap items-start justify-center gap-0">
          {team.map((member) => (
            <TeamCard
              key={member.id}
              {...member}
              isAbout={member.id === ABOUT_CARD_ID}
              isActive={activeId === member.id}
              isMuted={isPanelOpen && activeId !== member.id}
              onHoverStart={() => setActiveId(member.id)}
              onHoverEnd={() => setActiveId(null)}
              cardRef={(el) => {
                if (el) cardRefs.current[member.id] = el;
              }}
            />
          ))}
        </div>
      </main>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20">
        <div className="absolute bottom-[50px] left-[50px] z-20">
          <LottieLogo />
        </div>
        <div className="absolute bottom-[-80px] left-[970px] z-20">
          <LottieSignature />
        </div>
        <div className="relative flex h-[40px] items-center justify-center overflow-hidden text-center text-[13px] font-semilight text-[#C3BDB4]">
          <div className="absolute top-0 left-0 h-[1.5px] w-[1232.42px] bg-[#781F1C]" />
          {isPanelOpen && (
            <div
              className="absolute inset-y-0 left-0 z-0 bg-[#8a4f47]/95 transition-all duration-700 ease-in-out"
              style={{ width: panelWidths.left }}
            />
          )}
          {isPanelOpen && (
            <div
              className="absolute inset-y-0 right-0 z-0 bg-[rgba(195,189,180,0.5)] transition-all duration-700 ease-in-out"
              style={{ width: panelWidths.right }}
            />
          )}
          <p className="relative z-10">Website designed by adiz · 2026 iConcepts+Partners. All Rights Reserved</p>
        </div>
      </div>
    </div>
  );
}
