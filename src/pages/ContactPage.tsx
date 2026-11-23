import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ContactSection } from '../components/ContactSection';
import { CrtShell } from '../components/CrtShell';
import { Header } from '../components/Header';
import { VcrFooter } from '../components/VcrStatus';
import { contactSeo } from '../seo/metadata';
import { useSeo } from '../seo/useSeo';

interface RouteState {
  activeServiceId?: string;
}

export function ContactPage() {
  const location = useLocation();
  const state = (location.state as RouteState | null) ?? null;

  useSeo(contactSeo);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  return (
    <CrtShell variant="tv-home">
      <Header activeServiceId={state?.activeServiceId} />

      <main id="main-content" className="subpage-shell subpage-shell--tv">
        <ContactSection />

        <div className="subpage-actions">
          <Link to="/" state={state ?? undefined} className="crt-btn">
            [ VOLVER AL INICIO ]
          </Link>
          <Link to="/nosotros" state={state ?? undefined} className="crt-btn">
            [ VER NOSOTROS ]
          </Link>
        </div>
      </main>

      <footer className="site-footer site-footer--tv">
        <VcrFooter />
      </footer>
    </CrtShell>
  );
}
