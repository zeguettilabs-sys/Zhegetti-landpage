import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { CrtShell } from '../components/CrtShell';
import { Header } from '../components/Header';
import { ServiceCarousel } from '../components/ServiceCarousel';
import { VcrFooter } from '../components/VcrStatus';
import { brandName, brandTagline, services, type ServiceItem } from '../data/services';
import { useSeo } from '../seo/useSeo';

interface HomeRouteState {
  activeServiceId?: string;
}

interface HomePageProps {
  bootReady?: boolean;
}

let hasCompletedHomeIntro = false;

function resolveInitialServiceId(state: HomeRouteState | null): string {
  if (state?.activeServiceId && services.some((s) => s.id === state.activeServiceId)) {
    return state.activeServiceId;
  }
  try {
    const saved = sessionStorage.getItem('zeguetti-active-service');
    if (saved && services.some((s) => s.id === saved)) {
      return saved;
    }
  } catch {
    // Ignorar si sessionStorage no esta disponible
  }
  return services[0]?.id ?? 'sistemas-a-medida';
}

export function HomePage({ bootReady = true }: HomePageProps) {
  const location = useLocation();
  const routeState = (location.state as HomeRouteState | null) ?? null;

  const [seedServiceId, setSeedServiceId] = useState<string>(() =>
    resolveInitialServiceId(routeState)
  );
  const [activeServiceId, setActiveServiceId] = useState<string>(seedServiceId);
  const [introStep, setIntroStep] = useState<0 | 1 | 2 | 3>(() => {
    if (!bootReady) return 0;
    return hasCompletedHomeIntro ? 3 : 0;
  });

  const timersRef = useRef<number[]>([]);

  useSeo({
    title: `${brandName} | Sistemas a medida, apps web y landing pages en Perú`,
    description:
      'Zeguetti desarrolla sistemas a medida, aplicaciones web, automatización, integraciones y landing pages para empresas en Perú. Cotiza con un asesor por WhatsApp.',
    path: '/',
  });

  useEffect(() => {
    if (!bootReady) {
      setIntroStep(0);
      return;
    }

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced || hasCompletedHomeIntro) {
      hasCompletedHomeIntro = true;
      setIntroStep(3);
      return;
    }

    // Secuencia escalonada JS: 1) Encabezados, 2) Pie de pagina, 3) Tarjetas en parabola
    const raf = window.requestAnimationFrame(() => {
      setIntroStep(1);
      const tFooter = window.setTimeout(() => setIntroStep(2), 230);
      const tCards = window.setTimeout(() => {
        setIntroStep(3);
        hasCompletedHomeIntro = true;
      }, 470);
      timersRef.current.push(tFooter, tCards);
    });

    return () => {
      window.cancelAnimationFrame(raf);
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };
  }, [bootReady]);

  useEffect(() => {
    if (routeState?.activeServiceId && services.some((s) => s.id === routeState.activeServiceId)) {
      setSeedServiceId(routeState.activeServiceId);
      setActiveServiceId(routeState.activeServiceId);
    }
  }, [routeState?.activeServiceId]);

  const handleActiveChange = useCallback((service: ServiceItem) => {
    setActiveServiceId(service.id);
  }, []);

  if (location.hash === '#nosotros') {
    return <Navigate to="/nosotros" replace state={{ activeServiceId }} />;
  }
  if (location.hash === '#contacto') {
    return <Navigate to="/contacto" replace state={{ activeServiceId }} />;
  }

  return (
    <CrtShell variant="tv-home" introStep={introStep}>
      <Header activeServiceId={activeServiceId} />

      <main id="main-content" className="home-main">
        <div className="home-hero">
          <h1 className="home-hero__sr-h1">
            {brandName}: {brandTagline}
          </h1>

          <div className="home-hero__hint-row">
            <span className="crt-eyebrow">[ ARRASTRA / EXPLORA ]</span>
          </div>

          <ServiceCarousel
            initialActiveId={seedServiceId}
            onActiveChange={handleActiveChange}
          />

          <VcrFooter className="home-status-bar" />
        </div>
      </main>
    </CrtShell>
  );
}
