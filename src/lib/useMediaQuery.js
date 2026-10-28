import { useSyncExternalStore } from 'react';
import { MOBILE_QUERY, isPhoneScreen } from './units';

// True on a phone (units.js MOBILE_QUERY / isPhoneScreen). Re-checked on every
// resize, since the window's own size is part of the answer.
export function useIsPhone() {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener('resize', onChange);
      return () => window.removeEventListener('resize', onChange);
    },
    () => window.matchMedia(MOBILE_QUERY).matches || isPhoneScreen(),
    () => false
  );
}

// True when the media query matches; updates live on resize/rotation.
export function useMediaQuery(query) {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false
  );
}
