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

/** Sin animaciones de entrada: movimiento reducido o modo ahorro. */
function skipsIntro(): boolean {
  if (typeof window === 'undefined') return true;
  return (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.classList.contains('lite')
  );
}

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
  const [introStep, setIntroStep] = useState<0 | 1 | 2 | 3>(() => (bootReady && skipsIntro() ? 3 : 0));

  const timersRef = useRef<number[]>([]);

  useSeo({
    title: `${brandName} | Sistemas a medida, apps web y landing pages en Perú`,
    description:
      'Zeguetti desarrolla sistemas a medida, aplicaciones web, automatización, integraciones y landing pages para empresas en Perú. Cotiza con un asesor por WhatsApp.',
    path: '/',
  });

  // La entrada (encabezado, pie y estuches subiendo) se repite cada vez que se llega al inicio:
  // al volver desde otra pagina y tambien al pulsar el logo o INICIO estando ya aqui.
  useEffect(() => {
    if (!bootReady) {
      setIntroStep(0);
      return;
    }

    if (skipsIntro()) {
      setIntroStep(3);
      return;
    }

    // Con cambio de canal encima, la entrada arranca cuando el canal empieza a irse
    const channelOn = document.documentElement.classList.contains('channel-on');
    const delay = channelOn ? 440 : 30;

    // Secuencia escalonada JS: 1) Encabezados, 2) Pie de pagina, 3) Tarjetas en parabola.
    // Va con temporizadores (no con requestAnimationFrame): en navegadores de celular que pausan
    // los cuadros, la web se quedaba a medio mostrar.
    setIntroStep(0);
    const finish = () => setIntroStep(3);
    // Cada paso se programa desde el anterior: si el navegador se traba un momento, los pasos
    // no se juntan en uno solo y la entrada se sigue viendo escalonada.
    const timers: number[] = [];
    timers.push(
      window.setTimeout(() => {
        setIntroStep(1);
        timers.push(
          window.setTimeout(() => {
            setIntroStep(2);
            timers.push(window.setTimeout(finish, 240));
          }, 230)
        );
      }, delay)
    );
    // Si la pestaña estaba oculta, al volver se completa de inmediato
    const onVisible = () => {
      if (!document.hidden) finish();
    };
    document.addEventListener('visibilitychange', onVisible);
    timersRef.current = timers;

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      timers.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };
  }, [bootReady, location.key]);

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
