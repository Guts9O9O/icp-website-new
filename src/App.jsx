import { Suspense, lazy, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router';
import HomePage from './components/HomePage';
import AboutPage from './components/AboutPage';
import ClientsPage from './components/ClientsPage';
import PortfolioPage from './components/PortfolioPage';
import PortfolioCategoryPage from './components/PortfolioCategoryPage';
import ProjectDetailPage from './components/ProjectDetailPage';
import EnquiryPage from './components/EnquiryPage';
import TestimonialsPage from './components/TestimonialsPage';
import MobileBlock from './components/MobileBlock';
import BackgroundMusic from './components/chrome/BackgroundMusic';
import { useMediaQuery } from './lib/useMediaQuery';
import { MOBILE_QUERY, isPhoneScreen } from './lib/units';

// Admin panel is loaded only when someone opens /admin.
const AdminApp = lazy(() => import('./admin/AdminApp'));

const SLIDE_MS = 500;

/**
 * Page transition state driven by the URL.
 * Home is always mounted and slides right when another page opens. Any other
 * route renders in an overlay that slides in from the left; navigating back
 * to "/" slides the overlay out and unmounts it after the animation.
 */
function useOverlayTransition() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  // Location changes are folded into state during render (React's pattern for
  // state derived from props); the effect below only runs the animation timers.
  const [state, setState] = useState(() => ({
    key: location.key,
    overlay: isHome ? null : location,
    shown: !isHome,
    phase: 'idle', // 'enter' = slide the overlay in next frame, 'leave' = unmount after the slide-out
  }));

  if (state.key !== location.key) {
    if (isHome) {
      setState({ key: location.key, overlay: state.overlay, shown: false, phase: state.overlay ? 'leave' : 'idle' });
    } else {
      const samePage = state.overlay?.pathname === location.pathname;
      setState({ key: location.key, overlay: location, shown: samePage ? state.shown : false, phase: samePage ? 'idle' : 'enter' });
    }
  }

  useEffect(() => {
    if (state.phase === 'enter') {
      let raf2;
      const raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setState((s) => ({ ...s, shown: true, phase: 'idle' })));
      });
      return () => {
        cancelAnimationFrame(raf1);
        if (raf2) cancelAnimationFrame(raf2);
      };
    }
    if (state.phase === 'leave') {
      const timer = setTimeout(() => setState((s) => (s.phase === 'leave' ? { ...s, overlay: null, phase: 'idle' } : s)), SLIDE_MS);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [state.phase, state.key]);

  return { isHome, overlay: state.overlay, shown: state.shown };
}

// The studio asked for the site's photography not to be saved from the right-
// click menu. The menu is off across the public site (but still offered in the
// enquiry form's fields, where people paste), images cannot be dragged out to
// the desktop, and on tablets a long press no longer offers "Save image" (the
// `icp-protect` rules in index.css). None of this is in the admin.
function useImageProtection() {
  useEffect(() => {
    const isField = (t) => t instanceof Element && t.closest('input, textarea, select, [contenteditable="true"]');
    const onContextMenu = (e) => {
      if (!isField(e.target)) e.preventDefault();
    };
    const onDragStart = (e) => {
      if (e.target instanceof HTMLImageElement) e.preventDefault();
    };
    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('dragstart', onDragStart);
    return () => {
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('dragstart', onDragStart);
    };
  }, []);
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  const location = useLocation();
  const isMobile = useMediaQuery(MOBILE_QUERY) || isPhoneScreen();
  if (location.pathname.startsWith('/admin')) {
    return (
      <Suspense fallback={null}>
        <Routes>
          <Route path="/admin/*" element={<AdminApp />} />
        </Routes>
      </Suspense>
    );
  }
  // The public site is desktop/tablet only (client requirement).
  if (isMobile) return <MobileBlock />;
  return <PublicSite />;
}

function PublicSite() {
  const { isHome, overlay, shown } = useOverlayTransition();
  useImageProtection();

  return (
    /* overflow-clip, not hidden: a hidden box is still scrollable in script, so
       focusing something near its edge could shunt the whole page sideways. */
    <div className="icp-protect relative overflow-clip">
      <ScrollToTop />
      {/* Mounted once, outside the sliding pages, so the music carries on
          from page to page instead of restarting with each one. */}
      <BackgroundMusic />

      <div
        className="transition-transform duration-500 ease-in-out"
        // `none` rather than `translateX(0)` when settled: a transform that
        // stays put keeps the page on its own composited layer, which Chrome
        // can redraw from a stale, blurry raster.
        style={{ transform: isHome ? 'none' : 'translateX(100%)', willChange: isHome ? 'auto' : 'transform' }}
      >
        <HomePage />
      </div>

      {overlay && (
        <div
          key={overlay.pathname}
          className="absolute inset-0 transition-transform duration-500 ease-in-out"
          style={{ transform: shown ? 'none' : 'translateX(-100%)', willChange: shown ? 'auto' : 'transform' }}
        >
          <Routes location={overlay}>
            <Route path="/about" element={<AboutPage />} />
            <Route path="/clients" element={<ClientsPage />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/portfolio/:category" element={<PortfolioCategoryPage />} />
            <Route path="/portfolio/:category/:slug" element={<ProjectDetailPage />} />
            <Route path="/enquiry" element={<EnquiryPage />} />
            <Route path="/testimonials" element={<TestimonialsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      )}
    </div>
  );
}
