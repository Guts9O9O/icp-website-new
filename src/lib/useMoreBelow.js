import { useEffect, useState } from 'react';

// For a panel whose text can run longer than the screen allows (it scrolls):
// whether there is more below what is showing, so the panel can fade its foot
// (units.js FADE_FOOT) until the reader reaches the end. Returns a callback
// ref for the scrolling element and the flag. It watches the panel and its
// content for size changes, so text arriving, fonts loading or the window
// resizing all re-check without being listed anywhere.
export function useMoreBelow() {
  const [el, setEl] = useState(null);
  const [more, setMore] = useState(false);
  useEffect(() => {
    if (!el) return undefined;
    const check = () => setMore(el.scrollHeight - el.scrollTop - el.clientHeight > 4);
    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    el.addEventListener('scroll', check, { passive: true });
    return () => {
      observer.disconnect();
      el.removeEventListener('scroll', check);
    };
  }, [el]);
  return [setEl, more];
}
