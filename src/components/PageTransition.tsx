import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { services } from '../data/services';

/** Cada seccion es un canal de la tele. */
function channelFor(pathname: string): { number: string; label: string } {
  if (pathname === '/') return { number: '01', label: 'INICIO' };
  if (pathname === '/nosotros') return { number: '02', label: 'NOSOTROS' };
  if (pathname === '/contacto') return { number: '03', label: 'CONTACTO' };
  if (pathname === '/vitrina') return { number: String(4 + services.length).padStart(2, '0'), label: 'VITRINA' };
  const service = services.find((s) => s.path === pathname);
  if (service) {
    return { number: String(3 + service.order).padStart(2, '0'), label: service.name.toUpperCase() };
  }
  return { number: '--', label: 'SIN SEÑAL' };
}

/** Duracion total del canal (debe coincidir con las animaciones .crt-channel en CSS). */
const CHANNEL_MS = 700;
/** La pagina nueva empieza a aparecer cuando el canal ya se esta yendo. */
const REVEAL_AT_MS = 520;

/**
 * Cambio de pagina como cambio de canal. El orden es:
 *   1. nieve de sintonizacion,
 *   2. error de TV con barras de color y el numero de canal,
 *   3. la pagina nueva.
 *
 * La capa se monta con useLayoutEffect: React la pinta en el mismo cuadro en
 * que cambia la pagina, asi nunca se ve la pagina nueva antes del canal.
 * Mientras dura el canal, las animaciones de entrada de la pagina nueva quedan
 * en pausa (clase `channel-on` en <html>) y arrancan al descubrirse.
 * Nunca bloquea clics (pointer-events: none).
 */
export function PageTransition() {
  const location = useLocation();
  const prevKeyRef = useRef<string>(location.key);
  const [zap, setZap] = useState<{ id: number; number: string; label: string } | null>(null);

  useLayoutEffect(() => {
    if (prevKeyRef.current === location.key) return;
    prevKeyRef.current = location.key;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const root = document.documentElement;
    root.classList.add('channel-on');
    setZap({ id: Date.now(), ...channelFor(location.pathname) });

    const revealTimer = window.setTimeout(() => root.classList.remove('channel-on'), REVEAL_AT_MS);
    const endTimer = window.setTimeout(() => setZap(null), CHANNEL_MS);
    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(endTimer);
      root.classList.remove('channel-on');
    };
  }, [location.key, location.pathname]);

  // Si el componente se desmonta a mitad de canal, no dejar la pagina en pausa
  useEffect(() => () => document.documentElement.classList.remove('channel-on'), []);

  if (!zap) return null;

  return (
    <div key={zap.id} className="crt-channel" aria-hidden="true">
      <div className="crt-channel__bars">
        <div className="crt-channel__bars-top" />
        <div className="crt-channel__bars-mid" />
        <div className="crt-channel__bars-bottom" />
      </div>
      <div className="crt-channel__tear" />
      <div className="crt-channel__snow" />
      <div className="crt-channel__osd">
        <span className="crt-channel__number">CANAL {zap.number}</span>
        <span className="crt-channel__label">{zap.label}</span>
      </div>
    </div>
  );
}
