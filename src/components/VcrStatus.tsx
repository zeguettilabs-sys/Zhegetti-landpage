import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAdvisors } from './AdvisorDialog';
import { useLiteMode } from '../hooks/useLite';
import { useBwMode, useLimaClock, useTimecode, useVcrSource } from '../hooks/useVcr';

/** Contador de cinta del encabezado. */
export function VcrTimecode({ className = '' }: { className?: string }) {
  const value = useTimecode();
  return (
    <span className={`vcr-timecode ${className}`.trim()} aria-hidden="true">
      {value}
    </span>
  );
}

/**
 * Pie de pantalla de casetera: reloj, blanco y negro, fuente y contacto.
 * `center` permite poner algo en medio (por ejemplo, la leyenda del carrusel).
 */
export function VcrFooter({
  className = '',
  center,
}: {
  className?: string;
  center?: ReactNode;
}) {
  const clock = useLimaClock();
  const source = useVcrSource();
  const [bw, toggleBw] = useBwMode();
  const [lite, toggleLite] = useLiteMode();
  const location = useLocation();
  const onContact = location.pathname === '/contacto';
  const { open } = useAdvisors();

  return (
    <div className={`vcr-footer ${className}`.trim()}>
      <div className="vcr-footer__group">
        <span className="vcr-footer__item">{clock} LIMA</span>
        <span className="vcr-footer__pair">
          <button
            type="button"
            className="vcr-footer__item vcr-footer__toggle"
            aria-pressed={bw}
            onClick={toggleBw}
          >
            B/N <span className="vcr-footer__state">[{bw ? 'ON' : 'OFF'}]</span>
          </button>
          <button
            type="button"
            className="vcr-footer__item vcr-footer__toggle"
            aria-pressed={lite}
            aria-label="Modo ahorro: apaga el 3D y los efectos para equipos de poca potencia"
            title="Modo ahorro: apaga el 3D y los efectos para equipos de poca potencia"
            data-testid="lite-toggle"
            onClick={toggleLite}
          >
            AHORRO <span className="vcr-footer__state">[{lite ? 'ON' : 'OFF'}]</span>
          </button>
        </span>
      </div>
      {center && <div className="vcr-footer__center">{center}</div>}
      <div className="vcr-footer__group vcr-footer__group--end">
        <span className="vcr-footer__item">FUENTE: {source}</span>
        {onContact ? (
          <span className="vcr-footer__item" aria-current="page">
            ESCRÍBENOS
          </span>
        ) : (
          <button type="button" className="vcr-footer__item vcr-footer__link" onClick={() => open()}>
            ESCRÍBENOS
          </button>
        )}
      </div>
    </div>
  );
}
