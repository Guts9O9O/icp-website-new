import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router';
import HomePage from './components/HomePage';
import AboutPage from './components/AboutPage';
import ClientsPage from './components/ClientsPage';
import PortfolioPage from './components/PortfolioPage';
import PortfolioCategoryPage from './components/PortfolioCategoryPage';
import ProjectDetailPage from './components/ProjectDetailPage';
import EnquiryPage from './components/EnquiryPage';

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
  const [overlay, setOverlay] = useState(isHome ? null : location);
  const [shown, setShown] = useState(!isHome);
  const lastKey = useRef(location.key);
  const overlayPath = useRef(isHome ? null : location.pathname);

  useEffect(() => {
    // Skip the initial mount (and StrictMode's re-run of it).
    if (lastKey.current === location.key) return undefined;
    lastKey.current = location.key;

    if (isHome) {
      setShown(false);
      const timer = setTimeout(() => {
        setOverlay(null);
        overlayPath.current = null;
      }, SLIDE_MS);
      return () => clearTimeout(timer);
    }

    const samePage = overlayPath.current === location.pathname;
    overlayPath.current = location.pathname;
    setOverlay(location);
    if (samePage) return undefined;

    // Mount off-screen first, then slide in on the next frame.
    setShown(false);
    let raf2;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setShown(true));
    });
    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [location, isHome]);

  return { isHome, overlay, shown };
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
  if (location.pathname.startsWith('/admin')) {
    return (
      <Suspense fallback={null}>
        <Routes>
          <Route path="/admin/*" element={<AdminApp />} />
        </Routes>
      </Suspense>
    );
  }
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      )}
    </div>
  );
}
