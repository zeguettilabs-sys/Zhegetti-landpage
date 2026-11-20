import { useCallback, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AdvisorProvider } from './components/AdvisorDialog';
import { CrtLoader } from './components/CrtLoader';
import { CrtTubeDefs } from './components/CrtTube';
import { PageTransition } from './components/PageTransition';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ServicePage } from './pages/ServicePage';
import { ShowcasePage } from './pages/ShowcasePage';

export function App() {
  const [showLoader, setShowLoader] = useState<boolean>(true);
  const [bootReady, setBootReady] = useState<boolean>(false);

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
          <Route path="/servicios/:serviceId" element={<ServicePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AdvisorProvider>
    </BrowserRouter>
  );
}

export default App;
