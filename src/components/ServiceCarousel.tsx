import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  activePromo,
  designConfig,
  formatOrderFraction,
  services,
  wrapIndex,
  type ServiceItem,
} from '../data/services';
import { useLiteMode } from '../hooks/useLite';
import { PromoConditions } from './PromoConditions';
import { SwapText } from './SwapText';
import { VhsCover } from './VhsCover';
import {
  VhsStage3D,
  type CarouselPose,
  type Stage3DFrame,
  type Stage3DHover,
  type Stage3DSlot,
  type Stage3DStatus,
} from './VhsStage3D';

interface ServiceCarouselProps {
  initialActiveId?: string;
  onActiveChange?: (service: ServiceItem) => void;
}

const SLOTS_RANGE = [-3, -2, -1, 0, 1, 2, 3] as const;

/** Proporcion de una caja VHS (ancho : alto), igual que la caratula 340 x 500. */
export const CASE_ASPECT = 500 / 340;

/** Franja vertical libre para los estuches (debajo del logo y encima de la leyenda). */
export interface StageBand {
  top: number;
  bottom: number;
}

interface StageMetrics {
  width: number;
  height: number;
  isMobile: boolean;
  cardW: number;
  cardH: number;
  /** Distancia entre centros de estuches a lo largo de la rueda. */
  spacing: number;
  /** Radio de la rueda sobre la que se apoyan los estuches. */
  radius: number;
  /** Altura del centro del estuche activo respecto del centro del escenario. */
  yBase: number;
}

/**
 * Medidas al estilo de una estanteria de cintas en rueda:
 * - el estuche llena la franja entre el logo y la leyenda (el caset asoma arriba),
 * - entre centros hay 1.3 anchos de estuche,
 * - la rueda tiene un radio de 4 separaciones.
 */
function computeStageMetrics(width: number, height: number, band: StageBand | null): StageMetrics {
  const safeWidth = Math.max(width, 320);
  const safeHeight = Math.max(height, 300);
  const isMobile = safeWidth < 740;

  // Parte del caset que asoma por encima de la caja
  const peek = 0.11;

  let cardH: number;
  let centerY: number;
  if (band && band.bottom - band.top > 160) {
    const avail = band.bottom - band.top;
    cardH = Math.min(avail / (1 + peek), safeWidth * (isMobile ? 0.72 : 0.3) * CASE_ASPECT);
    // La caja se apoya en el borde inferior de la franja; el caset ocupa el hueco de arriba
    centerY = band.bottom - cardH / 2;
  } else {
    cardH = Math.min(safeHeight * 0.78, safeWidth * (isMobile ? 0.68 : 0.3) * CASE_ASPECT);
    centerY = safeHeight / 2 + (cardH * peek) / 2;
  }
  cardH = Math.round(cardH);
  const cardW = Math.round(cardH / CASE_ASPECT);
  const spacing = cardW * (isMobile ? 1.24 : 1.3);

  return {
    width: safeWidth,
    height: safeHeight,
    isMobile,
    cardW,
    cardH,
    spacing,
    radius: spacing * 4,
    yBase: centerY - safeHeight / 2,
  };
}

/**
 * Solo el estuche del centro esta iluminado: la luz cae con suavidad
 * en poco mas de media ranura (los vecinos quedan en penumbra).
 */
function shadeFor(absDist: number): number {
  const t = Math.min(1, Math.max(0, 1 - absDist / 0.55));
  const lit = t * t * (3 - 2 * t);
  return 0.62 * (1 - lit);
}

/** Posicion sobre la rueda para un estuche a `d` ranuras del centro. */
function onWheel(d: number, metrics: StageMetrics) {
  const along = d * metrics.spacing;
  const angle = along / metrics.radius;
  return {
    x: metrics.radius * Math.sin(angle),
    drop: metrics.radius * (1 - Math.cos(angle)),
    angle,
  };
}

/**
 * Pose CSS de cada estuche: todos del mismo tamaño, inclinados siguiendo
 * la curva de la rueda (sin girar hacia la camara). El giro 3D por velocidad
 * y hacia el mouse lo agrega la capa WebGL.
 */
function getWheelTransform(
  d: number,
  metrics: StageMetrics
): {
  transform: string;
  pose: CarouselPose;
  opacity: number;
  zIndex: number;
  isInteractive: boolean;
} {
  const abs = Math.abs(d);
  const { x, drop, angle } = onWheel(d, metrics);
  const tx = x;
  const ty = metrics.yBase + drop;
  const rz = (angle * 180) / Math.PI;

  // Los extremos se apagan al salir de la rueda visible
  const opacity = abs <= 2.4 ? 1 : Math.max(0, 1 - (abs - 2.4) / 0.8);
  const zIndex = Math.max(1, 35 - Math.round(abs * 10));
  const isInteractive = abs <= 2.3 && !(metrics.isMobile && Math.round(abs) >= 2);

  return {
    transform: `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0px) rotateZ(${rz.toFixed(2)}deg)`,
    pose: { tx, ty, tz: 0, scale: 1, rz, ry: 0 },
    opacity,
    zIndex,
    isInteractive,
  };
}

export function ServiceCarousel({
  initialActiveId,
  onActiveChange,
}: ServiceCarouselProps) {
  // Con un solo servicio visible no hay nada que girar: una sola cinta, sin flechas ni arrastre
  const single = services.length < 2;
  const initialIndex = (() => {
    const idx = services.findIndex((item) => item.id === initialActiveId);
    return idx >= 0 ? idx : 0;
  })();

  const [virtualIndex, setVirtualIndex] = useState<number>(initialIndex);
  const [animatedPos, setAnimatedPos] = useState<number>(initialIndex);
  const [stageSize, setStageSize] = useState<{ w: number; h: number; band: StageBand | null }>(
    () => ({
      w: typeof window !== 'undefined' ? window.innerWidth : 1360,
      h: typeof window !== 'undefined' ? Math.round(window.innerHeight * 0.56) : 520,
      band: null,
    })
  );
  const [dragPx, setDragPx] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Alterna entre dos animaciones identicas para reiniciar la del boton en cada cambio
  const [ctaPhase, setCtaPhase] = useState<'a' | 'b' | null>(null);
  const captionMountedRef = useRef(false);
  const [webglStatus, setWebglStatus] = useState<Stage3DStatus>('loading');
  const [lite] = useLiteMode();
  // Modo ahorro: carrusel plano (sin WebGL). Al salir del modo, el 3D vuelve a intentarse.
  useEffect(() => {
    setWebglStatus(lite ? 'off' : 'loading');
  }, [lite]);
  const frame3DRef = useRef<Stage3DFrame | null>(null);
  const hover3DRef = useRef<Stage3DHover>({ slotId: null, tiltX: 0, tiltY: 0 });

  const stageRef = useRef<HTMLDivElement | null>(null);
  const cursorCaptionRef = useRef<HTMLParagraphElement | null>(null);
  const suppressClickRef = useRef<boolean>(false);
  const wheelCooldownRef = useRef<number>(0);
  const animatedPosRef = useRef<number>(initialIndex);
  const targetPosRef = useRef<number>(initialIndex);

  const activeIndex = wrapIndex(virtualIndex, services.length);
  const activeService = services[activeIndex];
  const metrics = computeStageMetrics(stageSize.w, stageSize.h, stageSize.band);

  const dragOffsetSlots = isDragging
    ? Math.max(-1.15, Math.min(1.15, -dragPx / Math.max(metrics.spacing, 180)))
    : 0;
  const targetPos = virtualIndex + dragOffsetSlots;
  targetPosRef.current = targetPos;

  useEffect(() => {
    const idx = services.findIndex((item) => item.id === initialActiveId);
    if (idx >= 0) {
      setVirtualIndex((prev) => {
        const currentWrapped = wrapIndex(prev, services.length);
        if (currentWrapped === idx) return prev;
        animatedPosRef.current = idx;
        setAnimatedPos(idx);
        return idx;
      });
    }
  }, [initialActiveId]);

  useEffect(() => {
    if (!captionMountedRef.current) {
      captionMountedRef.current = true;
      return;
    }
    setCtaPhase((prev) => (prev === 'a' ? 'b' : 'a'));
  }, [activeService.id]);

  useEffect(() => {
    onActiveChange?.(activeService);
    try {
      sessionStorage.setItem('zeguetti-active-service', activeService.id);
    } catch {
      // Ignorar si sessionStorage no esta disponible
    }
  }, [activeService, onActiveChange]);

  // Motor de interpolacion JS (requestAnimationFrame) para trayectoria parabolica fluida
  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      animatedPosRef.current = targetPos;
      setAnimatedPos(targetPos);
      return;
    }

    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      const current = animatedPosRef.current;
      const target = targetPosRef.current;
      const diff = target - current;

      if (Math.abs(diff) < 0.0015) {
        if (current !== target) {
          animatedPosRef.current = target;
          setAnimatedPos(target);
        }
        return;
      }

      const speed = isDragging ? 26 : 11.5;
      const factor = 1 - Math.exp(-dt * speed);
      const next = current + diff * factor;
      animatedPosRef.current = next;
      setAnimatedPos(next);
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [targetPos, isDragging]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;

    /**
     * Con la leyenda superpuesta (escritorio), los estuches ocupan la franja entre
     * el pie del logo y el borde superior de la leyenda.
     */
    const measureBand = (): StageBand | null => {
      const caption = el.parentElement?.querySelector<HTMLElement>('.carousel-bottom');
      const brand = document.querySelector<HTMLElement>('.header-brand');
      if (!caption || !brand || getComputedStyle(caption).position !== 'absolute') return null;
      const stageRect = el.getBoundingClientRect();
      const top = brand.getBoundingClientRect().bottom - stageRect.top + 12;
      // offsetTop ignora transformaciones: la leyenda entra animada y no debe mover la medida
      const bottom = caption.offsetTop - el.offsetTop - 16;
      return bottom - top > 160 ? { top, bottom } : null;
    };

    const update = () => {
      setStageSize({
        w: el.clientWidth || window.innerWidth,
        h: el.clientHeight || Math.round(window.innerHeight * 0.56),
        band: measureBand(),
      });
    };
    update();
    // Las fuentes cambian la altura de la leyenda y el encabezado entra animado:
    // se vuelve a medir cuando todo quedo en su sitio
    document.fonts?.ready.then(update).catch(() => {});
    const timers = [700, 1500, 2600].map((ms) => window.setTimeout(update, ms));

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(update);
      observer.observe(el);
    } else {
      window.addEventListener('resize', update);
    }
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      observer?.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  const step = useCallback(
    (delta: number) => {
      if (single) return;
      setVirtualIndex((prev) => prev + delta);
    },
    [single]
  );

  const handleStagePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (single) return;
    if (event.button !== 0 && event.pointerType === 'mouse') return;

    suppressClickRef.current = false;
    const startX = event.clientX;
    const startY = event.clientY;
    const startTime = performance.now();
    const startDragThreshold = designConfig.proposedImplementation.dragStartPx;
    const commitThreshold = designConfig.proposedImplementation.dragCommitPx;

    let dragging = false;
    let cancelledForVerticalScroll = false;

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (cancelledForVerticalScroll) return;
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      if (!dragging) {
        if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) >= startDragThreshold) {
          cancelledForVerticalScroll = true;
          return;
        }
        if (Math.abs(dx) >= startDragThreshold) {
          dragging = true;
          setIsDragging(true);
          hideCursorCaption();
        }
      }

      if (dragging) {
        setDragPx(dx);
      }
    };

    const finishPointer = (endEvent: PointerEvent) => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', finishPointer);
      window.removeEventListener('pointercancel', finishPointer);

      if (!dragging) {
        setDragPx(0);
        setIsDragging(false);
        return;
      }

      const finalDx = endEvent.clientX - startX;
      const elapsed = Math.max(1, performance.now() - startTime);
      const velocity = Math.abs(finalDx) / elapsed;
      const committed =
        Math.abs(finalDx) >= commitThreshold ||
        (velocity >= 0.35 && Math.abs(finalDx) >= 22);

      suppressClickRef.current = true;
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);

      if (committed) {
        step(finalDx > 0 ? -1 : 1);
      }

      setDragPx(0);
      setIsDragging(false);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', finishPointer);
    window.addEventListener('pointercancel', finishPointer);
  };

  const handleStageWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (single) return;
    const primaryDelta =
      Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY;
    if (Math.abs(primaryDelta) < 18) return;

    const pageFitsViewport =
      document.documentElement.scrollHeight <= window.innerHeight + 2;
    if (!pageFitsViewport && Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
      return;
    }

    const now = performance.now();
    if (now - wheelCooldownRef.current < 320) return;
    wheelCooldownRef.current = now;
    step(primaryDelta > 0 ? 1 : -1);
  };

  const handleStageClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (suppressClickRef.current) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const handleRegionKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    const target = event.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable)
    ) {
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      step(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      step(1);
    }
  };

  const handleCardPointerMove = (
    event: React.PointerEvent<HTMLAnchorElement>,
    slotId: number
  ) => {
    if (event.pointerType !== 'mouse') return;
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    const nx = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    const ny = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
    el.style.setProperty('--tilt-y', `${(nx * 2.8).toFixed(2)}deg`);
    el.style.setProperty('--tilt-x', `${(-ny * 2.8).toFixed(2)}deg`);
    // El estuche 3D se inclina un poco mas que la tarjeta plana: tiene volumen
    hover3DRef.current = { slotId, tiltX: -ny * 4.5, tiltY: nx * 6 };
    moveCursorCaption(event.clientX, event.clientY, !isDragging);
  };

  /** Etiqueta que acompaña al cursor sobre un estuche, como el [PLAY] de una casetera. */
  const moveCursorCaption = (clientX: number, clientY: number, visible: boolean) => {
    const caption = cursorCaptionRef.current;
    const stage = stageRef.current;
    if (!caption || !stage) return;
    const rect = stage.getBoundingClientRect();
    caption.style.transform = `translate3d(${(clientX - rect.left + 18).toFixed(0)}px, ${(clientY - rect.top + 14).toFixed(0)}px, 0)`;
    caption.dataset.visible = visible ? 'true' : 'false';
  };

  const hideCursorCaption = () => {
    if (cursorCaptionRef.current) cursorCaptionRef.current.dataset.visible = 'false';
  };

  const handleCardPointerLeave = (
    event: React.PointerEvent<HTMLAnchorElement>,
    slotId: number
  ) => {
    const el = event.currentTarget;
    el.style.removeProperty('--tilt-x');
    el.style.removeProperty('--tilt-y');
    if (hover3DRef.current.slotId === slotId) {
      hover3DRef.current = { slotId: null, tiltX: 0, tiltY: 0 };
    }
    hideCursorCaption();
  };

  const handleCardFocus = (event: React.FocusEvent<HTMLAnchorElement>, slotId: number) => {
    if (event.currentTarget.matches(':focus-visible')) {
      hover3DRef.current = { slotId, tiltX: 0, tiltY: 0 };
    }
  };

  const handleCardBlur = (slotId: number) => {
    if (hover3DRef.current.slotId === slotId) {
      hover3DRef.current = { slotId: null, tiltX: 0, tiltY: 0 };
    }
  };

  const centerSlot = Math.round(animatedPos);

  const activeServicePromo = activePromo(activeService);
  const captionIndex = `${formatOrderFraction(activeService.order)} · ${activeService.name.toUpperCase()}`;

  const slots3D: Stage3DSlot[] = (single ? [0] : SLOTS_RANGE).map((offset) => {
    const slotId = centerSlot + offset;
    const continuousOffset = slotId - animatedPos;
    const absDist = Math.abs(continuousOffset);
    const serviceIndex = wrapIndex(slotId, services.length);
    const { pose, opacity } = getWheelTransform(continuousOffset, metrics);
    return {
      slotId,
      offset,
      serviceIndex,
      pose,
      opacity,
      shade: shadeFor(absDist),
      active: serviceIndex === activeIndex && absDist < 0.35,
    };
  });

  // El lienzo 3D lee la ultima pose en su propio bucle de animacion
  useLayoutEffect(() => {
    frame3DRef.current = {
      slots: slots3D,
      cardW: metrics.cardW,
      cardH: metrics.cardH,
      isMobile: metrics.isMobile,
      dragging: isDragging,
      position: animatedPos,
      spacing: metrics.spacing,
    };
  });

  return (
    <section
      id="servicios"
      className="carousel-region"
      aria-roledescription="carrusel"
      aria-label="Catálogo de servicios de Zeguetti"
      tabIndex={-1}
      onKeyDown={handleRegionKeyDown}
    >
      <div
        ref={stageRef}
        className="carousel-stage"
        data-parabolic="true"
        data-single={single ? 'true' : 'false'}
        data-dragging={isDragging ? 'true' : 'false'}
        data-webgl={webglStatus}
        onPointerDown={handleStagePointerDown}
        onWheel={handleStageWheel}
        onClickCapture={handleStageClickCapture}
        style={
          {
            '--card-w': `${metrics.cardW}px`,
            '--card-h': `${metrics.cardH}px`,
          } as React.CSSProperties
        }
      >
        {webglStatus !== 'off' && (
          <VhsStage3D
            frameRef={frame3DRef}
            hoverRef={hover3DRef}
            onStatusChange={setWebglStatus}
          />
        )}

        <p ref={cursorCaptionRef} className="cursor-caption" data-visible="false" aria-hidden="true">
          <span className="cursor-caption__i">[ VER SERVICIO ]</span>
        </p>

        {(single ? [0] : SLOTS_RANGE).map((offset) => {
          const slotId = centerSlot + offset;
          const continuousOffset = slotId - animatedPos;
          const absDist = Math.abs(continuousOffset);
          const service = services[wrapIndex(slotId, services.length)];
          const isActive =
            wrapIndex(slotId, services.length) === activeIndex &&
            absDist < 0.35;
          const shadeOpacity = shadeFor(absDist);
          const { transform, opacity, zIndex, isInteractive } =
            getWheelTransform(continuousOffset, metrics);
          const staggerMs = Math.abs(offset) * 75;

          return (
            <div
              key={`slot-${slotId}`}
              className="carousel-slot"
              data-carousel-visible={isInteractive ? 'true' : 'false'}
              data-slot-offset={offset}
              style={{
                transform,
                opacity,
                zIndex,
                pointerEvents: isInteractive ? 'auto' : 'none',
              }}
              aria-hidden={!isInteractive}
            >
              <div
                className="carousel-slot__entry"
                style={
                  {
                    '--entry-delay': `${staggerMs}ms`,
                  } as React.CSSProperties
                }
              >
                <Link
                  to={service.path}
                  state={{ activeServiceId: service.id }}
                  className="carousel-card-link"
                  tabIndex={isInteractive ? 0 : -1}
                  draggable={false}
                  aria-label={`${formatOrderFraction(service.order)} ${service.name} — Abrir ficha de servicio`}
                  onPointerMove={
                    isInteractive ? (event) => handleCardPointerMove(event, slotId) : undefined
                  }
                  onPointerLeave={(event) => handleCardPointerLeave(event, slotId)}
                  onFocus={(event) => handleCardFocus(event, slotId)}
                  onBlur={() => handleCardBlur(slotId)}
                >
                  <VhsCover
                    service={service}
                    isActive={isActive}
                    shadeOpacity={shadeOpacity}
                    sheenOffset={continuousOffset}
                    showHoverPrompt={isInteractive}
                  />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="carousel-bottom">
        <button
          type="button"
          className="carousel-arrow carousel-arrow--prev"
          aria-label="Servicio anterior"
          onClick={() => step(-1)}
          tabIndex={single ? -1 : undefined}
          aria-hidden={single || undefined}
          style={single ? { visibility: 'hidden' } : undefined}
        >
          <span aria-hidden="true">←</span>
        </button>

        <div className="carousel-caption" aria-live="polite">
          {/* El texto real va oculto para lectores; el visible se "sintoniza" al cambiar */}
          <p className="carousel-caption__index">
            <span className="sr-only">{captionIndex}</span>
            <SwapText text={captionIndex} />
          </p>
          <p className="carousel-caption__summary">
            <span className="sr-only">{activeService.caption}</span>
            <SwapText text={activeService.caption} delay={90} />
          </p>
          <Link
            to={activeService.path}
            state={{ activeServiceId: activeService.id }}
            className={`carousel-caption__cta${ctaPhase ? ` cta-swap-${ctaPhase}` : ''}${activeServicePromo ? ' is-promo' : ''}`}
            aria-describedby={activeServicePromo ? 'home-promo-conditions' : undefined}
          >
            {activeServicePromo ? `[ ${activeServicePromo.tag} → ]` : '[ VER SOLUCIÓN ]'}
          </Link>
          {activeServicePromo && <PromoConditions id="home-promo-conditions" promo={activeServicePromo} />}
        </div>

        <button
          type="button"
          className="carousel-arrow carousel-arrow--next"
          aria-label="Siguiente servicio"
          onClick={() => step(1)}
          tabIndex={single ? -1 : undefined}
          aria-hidden={single || undefined}
          style={single ? { visibility: 'hidden' } : undefined}
        >
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
}
