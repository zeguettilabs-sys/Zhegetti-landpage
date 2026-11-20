import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AboutExperience } from '../components/AboutExperience';
import { CrtShell } from '../components/CrtShell';
import { Header } from '../components/Header';
import { VcrFooter } from '../components/VcrStatus';
import { brandName, brandTagline } from '../data/services';
import { useSeo } from '../seo/useSeo';

interface RouteState {
  activeServiceId?: string;
}

export function AboutPage() {
  const location = useLocation();
  const state = (location.state as RouteState | null) ?? null;

  useSeo({
    title: `Nosotros — ${brandName} | Desarrollo de software en Perú`,
    description: `${brandTagline} Así trabajamos: descubrimos, diseñamos, desarrollamos y te acompañamos.`,
    path: '/nosotros',
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  return (
    <CrtShell variant="tv-home">
      <Header activeServiceId={state?.activeServiceId} />

      <main id="main-content" className="prof-main">
        <AboutExperience />
      </main>

      <footer className="site-footer site-footer--tv">
        <VcrFooter />
      </footer>
    </CrtShell>
  );
}
