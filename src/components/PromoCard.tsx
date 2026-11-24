import { useRef, type PointerEvent } from 'react';
import { advisors } from '../config/advisors';
import { promoLanding } from '../config/legal';
import type { ServicePromo } from '../data/services';

/**
 * Afiche de la promocion como tarjeta 3D: se inclina siguiendo el puntero (como las
 * carátulas del carrusel), con un brillo que recorre la superficie y una leve flotacion.
 * Con `onQuote` es un boton (abre la ventana de la promo); sin el, solo se mueve.
 */
export function PromoCard({ promo, onQuote, hint = true }: { promo: ServicePromo; onQuote?: () => void; hint?: boolean }) {
  const cardRef = useRef<HTMLElement | null>(null);

  const tilt = (event: PointerEvent<HTMLElement>) => {
    const el = cardRef.current;
    if (!el || event.pointerType === 'touch') return;
    if (document.documentElement.classList.contains('lite')) return;
    const r = el.getBoundingClientRect();
    const x = (event.clientX - r.left) / r.width - 0.5;
    const y = (event.clientY - r.top) / r.height - 0.5;
    el.style.setProperty('--rx', `${(-y * 16).toFixed(2)}deg`);
    el.style.setProperty('--ry', `${(x * 20).toFixed(2)}deg`);
    el.style.setProperty('--gx', `${((x + 0.5) * 100).toFixed(1)}%`);
    el.style.setProperty('--gy', `${((y + 0.5) * 100).toFixed(1)}%`);
    el.dataset.active = 'true';
  };

  const reset = () => {
    const el = cardRef.current;
    if (!el) return;
    el.style.removeProperty('--rx');
    el.style.removeProperty('--ry');
    el.dataset.active = 'false';
  };

  const label = `${promo.headline}. ${promo.includes.join(', ')}. ${promo.validUntilLabel ?? ''}`;
  const inner = (
    <>
      <img src={promo.poster} alt={onQuote ? '' : label} width={900} height={1125} decoding="async" draggable={false} />
      {/* El arte original conserva su marco y gráfica. Estas líneas usan los datos vigentes. */}
      <span className="promo-card__seo" aria-hidden="true">{promoLanding.incluye.seo}</span>
      <span className="promo-card__date" aria-hidden="true">{promo.validUntilLabel}</span>
      <span className="promo-card__phone" aria-hidden="true">WHATSAPP {advisors[0].display}</span>
      <span className="promo-card__glare" aria-hidden="true" />
      <span className="promo-card__edge" aria-hidden="true" />
    </>
  );

  return (
    <div className="promo-card-wrap">
      {onQuote ? (
        <button
          ref={(node) => {
            cardRef.current = node;
          }}
          type="button"
          className="promo-card"
          data-active="false"
          onPointerMove={tilt}
          onPointerLeave={reset}
          onBlur={reset}
          onClick={onQuote}
          aria-label={`${label}. Ver la promoción y cotizar`}
        >
          {inner}
        </button>
      ) : (
        <div
          ref={(node) => {
            cardRef.current = node;
          }}
          className="promo-card"
          data-active="false"
          onPointerMove={tilt}
          onPointerLeave={reset}
        >
          {inner}
        </div>
      )}
      {hint && onQuote && <span className="promo-card__hint">[ {promo.cta} → ]</span>}
    </div>
  );
}
