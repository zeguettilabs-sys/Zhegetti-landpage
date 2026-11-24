import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AdvisorProvider } from './components/AdvisorDialog';
import { CookieConsent } from './components/CookieConsent';
import { CrtLoader } from './components/CrtLoader';
import { useAutoLite } from './hooks/useLite';
import { CrtTubeDefs } from './components/CrtTube';
import { PageTransition } from './components/PageTransition';
import { promoLanding } from './config/legal';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { ComplaintsPage } from './pages/ComplaintsPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { ServicePage } from './pages/ServicePage';
import { ShowcasePage } from './pages/ShowcasePage';
import { libroSeo, privacidadSeo, terminosSeo } from './seo/metadata';

export function App() {
  const [showLoader, setShowLoader] = useState<boolean>(true);
  const [bootReady, setBootReady] = useState<boolean>(false);
  const [, setPromoExpired] = useState(false);

  useAutoLite(bootReady);

  useEffect(() => {
    const cutoff = Date.parse(`${promoLanding.vigencia}T23:59:59.999-05:00`) + 1;
    if (!Number.isFinite(cutoff) || cutoff <= Date.now()) return;

    let timer: number;
    function scheduleExpiry() {
      window.clearTimeout(timer);
      const remaining = cutoff - Date.now();
      if (remaining <= 0) {
        // Las rutas y el diálogo vuelven a consultar activePromo sin recargar.
        setPromoExpired(true);
      } else {
        timer = window.setTimeout(scheduleExpiry, Math.min(remaining, 2_147_483_647));
      }
    }

    scheduleExpiry();
    document.addEventListener('visibilitychange', scheduleExpiry);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', scheduleExpiry);
    };
  }, []);

  const handleBootComplete = useCallback(() => {
    setShowLoader(false);
    setBootReady(true);
  }, []);

  return (
    <BrowserRouter>
      <CrtTubeDefs />
      <div className="bw-filter" aria-hidden="true" />
      {showLoader && <CrtLoader onComplete={handleBootComplete} />}
      <AdvisorProvider>
        <PageTransition />
        <Routes>
          <Route path="/" element={<HomePage bootReady={bootReady} />} />
          <Route path="/nosotros" element={<AboutPage />} />
          <Route path="/vitrina" element={<ShowcasePage />} />
          <Route path="/contacto" element={<ContactPage />} />
          <Route path={privacidadSeo.path} element={<PrivacyPage />} />
          <Route path={terminosSeo.path} element={<TermsPage />} />
          <Route path={libroSeo.path} element={<ComplaintsPage />} />
          <Route path="/servicios/:serviceId" element={<ServicePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <CookieConsent />
      </AdvisorProvider>
    </BrowserRouter>
  );
}

export default App;
