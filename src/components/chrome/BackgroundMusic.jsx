import { useCallback, useEffect, useRef, useState } from 'react';
import { EDGE_BAR, FOOTER_H, u, v } from '../../lib/units';

// Background music for the public site, the way design-studio sites usually
// handle it:
//   - Browsers do not let a page start sound on its own, so the music begins
//     with the visitor's first click, tap or key press anywhere on the site.
//   - A sound toggle is always on screen (WCAG 1.4.2 asks for one whenever
//     audio plays for more than a few seconds), and the choice is remembered,
//     so someone who turns it off is not met with music on their next visit.
//   - It plays quietly, fades in and out rather than cutting, keeps playing
//     from page to page (this is mounted once, above the page transitions),
//     and pauses while the tab is in the background.
// The track (client-assets/audio) was trimmed of its trailing silence and
// given a short fade at each end, so the loop comes round without a gap.
const SRC = '/audio/background.mp3';
const VOLUME = 0.35;
const FADE_MS = 1200;
const STORE = 'icp-sound';
const GAP = 50; // the footer's own inset: the toggle lines up with the iC+P mark

function readPref() {
  try {
    return localStorage.getItem(STORE) !== 'off';
  } catch {
    return true;
  }
}

function writePref(on) {
  try {
    localStorage.setItem(STORE, on ? 'on' : 'off');
  } catch {
    // private windows and blocked storage: the choice just is not remembered
  }
}

export default function BackgroundMusic() {
  const audioRef = useRef(null);
  const toggleRef = useRef(null);
  const fadeRef = useRef(null);
  const [on, setOn] = useState(readPref); // what the visitor wants
  const [playing, setPlaying] = useState(false); // what is actually happening

  const fadeTo = useCallback((target, done) => {
    const audio = audioRef.current;
    cancelAnimationFrame(fadeRef.current);
    if (!audio) return;
    const from = audio.volume;
    const start = performance.now();
    const step = (now) => {
      // A frame's timestamp can fall a moment before `start`; unclamped, that
      // set a volume just under zero, which the browser refuses — and the
      // fade died there, leaving the music playing silently.
      const t = Math.min(1, Math.max(0, (now - start) / FADE_MS));
      audio.volume = Math.min(1, Math.max(0, from + (target - from) * t));
      if (t < 1) fadeRef.current = requestAnimationFrame(step);
      else done?.();
    };
    fadeRef.current = requestAnimationFrame(step);
  }, []);

  const play = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audio.paused) return Promise.resolve(true);
    audio.volume = 0;
    return audio
      .play()
      .then(() => {
        fadeTo(VOLUME);
        return true;
      })
      .catch(() => false); // not allowed yet: wait for an interaction
  }, [fadeTo]);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || audio.paused) return;
    fadeTo(0, () => audio.pause());
  }, [fadeTo]);

  // Wanted and not playing: try now (a returning visitor's browser may allow
  // it), otherwise on the first interaction. The toggle is left to handle its
  // own clicks, or turning the sound off before it ever started would start it.
  useEffect(() => {
    if (!on || playing) return undefined;
    let armed = true;
    const onGesture = (e) => {
      if (!armed || toggleRef.current?.contains(e.target)) return;
      armed = false;
      play();
    };
    if (document.visibilityState === 'visible') play();
    const events = ['pointerdown', 'keydown', 'touchstart'];
    events.forEach((t) => window.addEventListener(t, onGesture, { capture: true, passive: true }));
    return () => events.forEach((t) => window.removeEventListener(t, onGesture, { capture: true }));
  }, [on, playing, play]);

  // Quiet while the tab is out of sight; back when it returns.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') audioRef.current?.pause();
      else if (on) play();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [on, play]);

  useEffect(() => () => cancelAnimationFrame(fadeRef.current), []);

  const toggle = () => {
    const next = !on;
    writePref(next);
    setOn(next);
    if (next) play();
    else pause();
  };

  return (
    <>
      <audio
        ref={audioRef}
        src={SRC}
        loop
        preload="none"
        onPlaying={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <button
        ref={toggleRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggle();
        }}
        aria-pressed={on}
        aria-label={on ? 'Background music on — turn off' : 'Background music off — turn on'}
        title={on ? 'Turn the music off' : 'Turn the music on'}
        className={`icp-eq t-body fixed z-50 flex items-center leading-none text-icp-mist transition-opacity hover:opacity-70 ${playing ? 'is-playing' : ''}`}
        // On the footer's copyright line, under the iC+P mark. Measured from
        // the visible height (--page-h): from `100vh` it sat below the bottom
        // of a tablet's screen, out of sight.
        style={{ left: u(EDGE_BAR + GAP), top: `calc(var(--page-h) - ${v(FOOTER_H - 32)})`, gap: u(12) }}
      >
        <span className="flex items-end" style={{ height: '0.9em', gap: 'max(2px, calc(3 * var(--u)))' }} aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className="icp-eq-bar h-full bg-current"
              style={{ width: 'max(2px, calc(3 * var(--u)))', animationDelay: `${i * -0.27}s` }}
            />
          ))}
        </span>
        <span>{on ? 'Sound on' : 'Sound off'}</span>
      </button>
    </>
  );
}
