import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import type { ShowcaseCard } from '../three/showcaseCards';

interface ShowcaseLightboxProps {
  cards: ShowcaseCard[];
  index: number;
  /** Rectangulo de la tarjeta de donde se abre (px de la ventana). */
  from: DOMRect | null;
  onIndex: (index: number) => void;
  onClose: () => void;
}

const urlCache = new WeakMap<HTMLCanvasElement, string>();
function cardUrl(card: ShowcaseCard): string {
  let url = urlCache.get(card.canvas);
  if (!url) {
    url = card.canvas.toDataURL('image/png');
    urlCache.set(card.canvas, url);
  }
  return url;
}

/** Visor a pantalla del tubo: la imagen crece desde la tarjeta que se pulso. */
export function ShowcaseLightbox({ cards, index, from, onIndex, onClose }: ShowcaseLightboxProps) {
  const figureRef = useRef<HTMLElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const closingRef = useRef(false);
  const card = cards[index];
  const src = useMemo(() => cardUrl(card), [card]);

  // Zoom de entrada desde la tarjeta
  useLayoutEffect(() => {
    const el = figureRef.current;
    const root = rootRef.current;
    if (!el || !root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    root.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: 'ease-out' });
    if (!from) {
      el.animate([{ opacity: 0, transform: 'scale(0.94)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
      return;
    }
    const to = el.getBoundingClientRect();
    if (!to.width || !to.height) return;
    const dx = from.left + from.width / 2 - (to.left + to.width / 2);
    const dy = from.top + from.height / 2 - (to.top + to.height / 2);
    el.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(${from.width / to.width}, ${from.height / to.height})`, opacity: 0.5 },
        { transform: 'none', opacity: 1 },
      ],
      { duration: 520, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
    );
    // Solo al abrir
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    const root = rootRef.current;
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onClose();
      return;
    }
    root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: 'ease-in', fill: 'forwards' }).onfinish = onClose;
  }, [onClose]);

  const step = useCallback(
    (delta: number) => onIndex((index + delta + cards.length) % cards.length),
    [cards.length, index, onIndex]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close, step]);

  return (
    <div ref={rootRef} className="nw-lightbox" role="dialog" aria-modal="true" aria-label={`${card.title} — vista ampliada`} onClick={close}>
      <button type="button" className="nw-lightbox__close" onClick={close}>
        CERRAR[X]
      </button>
      <button
        type="button"
        className="nw-lightbox__arrow nw-lightbox__arrow--prev"
        aria-label="Imagen anterior"
        onClick={(e) => {
          e.stopPropagation();
          step(-1);
        }}
      >
        ◀
      </button>
      <figure ref={figureRef} className="nw-lightbox__figure" onClick={(e) => e.stopPropagation()}>
        <img key={card.id} src={src} alt={`${card.title}: ${card.caption}`} draggable={false} />
        <figcaption>
          <span>{card.title.toUpperCase()}</span>
          <span>
            [{card.tag}] · {String(index + 1).padStart(2, '0')} / {String(cards.length).padStart(2, '0')}
          </span>
        </figcaption>
      </figure>
      <button
        type="button"
        className="nw-lightbox__arrow nw-lightbox__arrow--next"
        aria-label="Imagen siguiente"
        onClick={(e) => {
          e.stopPropagation();
          step(1);
        }}
      >
        ▶
      </button>
    </div>
  );
}
