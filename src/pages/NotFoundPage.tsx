import { Link } from 'react-router-dom';
import { CrtShell } from '../components/CrtShell';
import { brandName } from '../data/services';
import { useSeo } from '../seo/useSeo';

interface NotFoundPageProps {
  requestedSlug?: string;
}

/** Barras de prueba que aparecen un instante mientras entra la señal. */
const BARS = ['#c9c9c9', '#c9c437', '#38c4c4', '#36c43a', '#c436c1', '#c43636', '#3a37c4'];

/**
 * Canal sin señal: estatica, un "404" enorme con desfase de color y, en el
 * hueco del cero, el aviso y la salida.
 */
export function NotFoundPage({ requestedSlug }: NotFoundPageProps) {
  useSeo({
    title: `Página no encontrada — ${brandName}`,
    description: 'La dirección que buscas no existe. Vuelve al inicio para ver los servicios de Zeguetti.',
    path: typeof window !== 'undefined' ? window.location.pathname : '/',
    noindex: true,
  });

  return (
    <CrtShell variant="tv-home">
      <main id="main-content" className="nf-page">
        <div className="nf-static" aria-hidden="true" />
        <div className="nf-giant" aria-hidden="true">
          <span className="nf-giant__text">404</span>
          <span className="nf-giant__tear" />
        </div>
        <div className="nf-bars" aria-hidden="true">
          {BARS.map((color) => (
            <span key={color} style={{ backgroundColor: color }} />
          ))}
        </div>

        <div className="nf-center">
          <h1 className="nf-title">No encontramos ese destino en {brandName}.</h1>
          <p className="nf-desc">
            {requestedSlug
              ? `El servicio «${requestedSlug}» no corresponde a una ficha activa.`
              : 'La dirección no existe o fue movida.'}
          </p>
          <Link to="/" className="nf-back">
            [ VOLVER AL INICIO ]
          </Link>
        </div>
      </main>
    </CrtShell>
  );
}
