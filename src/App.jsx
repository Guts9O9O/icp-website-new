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
import { useMediaQuery } from './lib/useMediaQuery';
import { MOBILE_QUERY } from './lib/units';

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

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  const location = useLocation();
  const isMobile = useMediaQuery(MOBILE_QUERY);
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

  return (
    <div className="relative overflow-hidden">
      <ScrollToTop />

      <div
        className="transition-transform duration-500 ease-in-out"
        style={{ transform: isHome ? 'translateX(0)' : 'translateX(100%)' }}
      >
        <HomePage />
      </div>

      {overlay && (
        <div
          key={overlay.pathname}
          className="absolute inset-0 transition-transform duration-500 ease-in-out"
          style={{ transform: shown ? 'translateX(0)' : 'translateX(-100%)' }}
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
