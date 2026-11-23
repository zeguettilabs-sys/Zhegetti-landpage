import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AboutExperience } from '../components/AboutExperience';
import { CrtShell } from '../components/CrtShell';
import { Header } from '../components/Header';
import { VcrFooter } from '../components/VcrStatus';
import { aboutSeo } from '../seo/metadata';
import { useSeo } from '../seo/useSeo';

interface RouteState {
  activeServiceId?: string;
}

export function AboutPage() {
  const location = useLocation();
  const state = (location.state as RouteState | null) ?? null;

  useSeo(aboutSeo);

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
