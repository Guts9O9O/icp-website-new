import { useState } from 'react';
import HomePage from './components/HomePage';
import AboutPage from './components/AboutPage';
import ClientsPage from './components/ClientsPage';
import PortfolioPage from './components/PortfolioPage';
import EnquiryPage from './components/EnquiryPage';
import HospitalityPortfolioPage from './components/HospitalityPortfolioPage';
import BuildersPortfolioPage from './components/BuildersPortfolioPage';
import CommercialPortfolioPage from './components/CommercialPortfolioPage';
import PrivateResidencesPortfolioPage from './components/PrivateResidencesPortfolioPage';
import HospitalityProjectPage from './components/HospitalityProjectPage';

function App() {
  const [page, setPage] = useState('home');
  const [visible, setVisible] = useState('home'); // which page is rendered
  const [detailId, setDetailId] = useState(null);

  const navigate = (target) => {
    if (target === page) return;
    if (typeof target === 'string' && target.startsWith('portfolio-hospitality-detail:')) {
      const id = target.split(':')[1] || null;
      setDetailId(id);
      setVisible('portfolio-hospitality-detail');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setPage('portfolio-hospitality-detail'));
      });
      return;
    }
    if (
      target === 'about' ||
      target === 'clients' ||
      target === 'portfolio' ||
      target === 'enquiry' ||
      target === 'portfolio-hospitality' ||
      target === 'portfolio-builders' ||
      target === 'portfolio-commercial' ||
      target === 'portfolio-private' ||
      target === 'portfolio-hospitality-detail'
    ) {
      setVisible(target); // mount target page (starts off-screen left)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setPage(target)); // trigger slide-in
      });
    } else {
      setPage('home'); // trigger slide-out
      setTimeout(() => setVisible('home'), 500); // unmount after transition
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* HomePage — always mounted, slides right when about opens */}
      <div
        className="transition-transform duration-500 ease-in-out"
        style={{ transform: page !== 'home' ? 'translateX(100%)' : 'translateX(0)' }}
      >
        <HomePage onNavigate={navigate} />
      </div>

      {/* AboutPage — slides in from left */}
      {visible === 'about' && (
        <div
          className="absolute inset-0 transition-transform duration-500 ease-in-out"
          style={{ transform: page === 'about' ? 'translateX(0)' : 'translateX(-100%)' }}
        >
          <AboutPage onNavigate={navigate} />
        </div>
      )}

      {/* ClientsPage — slides in from left */}
      {visible === 'clients' && (
        <div
          className="absolute inset-0 transition-transform duration-500 ease-in-out"
          style={{ transform: page === 'clients' ? 'translateX(0)' : 'translateX(-100%)' }}
        >
          <ClientsPage onNavigate={navigate} />
        </div>
      )}

      {/* PortfolioPage — slides in from left */}
      {visible === 'portfolio' && (
        <div
          className="absolute inset-0 transition-transform duration-500 ease-in-out"
          style={{ transform: page === 'portfolio' ? 'translateX(0)' : 'translateX(-100%)' }}
        >
          <PortfolioPage onNavigate={navigate} />
        </div>
      )}

      {/* EnquiryPage — slides in from left */}
      {visible === 'enquiry' && (
        <div
          className="absolute inset-0 transition-transform duration-500 ease-in-out"
          style={{ transform: page === 'enquiry' ? 'translateX(0)' : 'translateX(-100%)' }}
        >
          <EnquiryPage onNavigate={navigate} />
        </div>
      )}

      {/* Hospitality Portfolio Page — slides in from left */}
      {visible === 'portfolio-hospitality' && (
        <div
          className="absolute inset-0 transition-transform duration-500 ease-in-out"
          style={{ transform: page === 'portfolio-hospitality' ? 'translateX(0)' : 'translateX(-100%)' }}
        >
          <HospitalityPortfolioPage onNavigate={navigate} />
        </div>
      )}

      {visible === 'portfolio-builders' && (
        <div
          className="absolute inset-0 transition-transform duration-500 ease-in-out"
          style={{ transform: page === 'portfolio-builders' ? 'translateX(0)' : 'translateX(-100%)' }}
        >
          <BuildersPortfolioPage onNavigate={navigate} />
        </div>
      )}

      {visible === 'portfolio-commercial' && (
        <div
          className="absolute inset-0 transition-transform duration-500 ease-in-out"
          style={{ transform: page === 'portfolio-commercial' ? 'translateX(0)' : 'translateX(-100%)' }}
        >
          <CommercialPortfolioPage onNavigate={navigate} />
        </div>
      )}

      {visible === 'portfolio-private' && (
        <div
          className="absolute inset-0 transition-transform duration-500 ease-in-out"
          style={{ transform: page === 'portfolio-private' ? 'translateX(0)' : 'translateX(-100%)' }}
        >
          <PrivateResidencesPortfolioPage onNavigate={navigate} />
        </div>
      )}

      {visible === 'portfolio-hospitality-detail' && (
        <div
          className="absolute inset-0 transition-transform duration-500 ease-in-out"
          style={{ transform: page === 'portfolio-hospitality-detail' ? 'translateX(0)' : 'translateX(-100%)' }}
        >
          <HospitalityProjectPage onNavigate={navigate} projectId={detailId} />
        </div>
      )}
    </div>
  );
}

export default App;
