import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { siteConfig } from '../config/site';
import {
  commonCopy,
  formatOrderFraction,
  getServiceById,
  type ServiceItem,
} from '../data/services';
import { ContactActions } from './ContactSection';
import { CurvedGallery, GALLERY_SLIDE_META } from './CurvedGallery';
import { ServiceMockup } from './ServiceMockup';
import { VcrFooter } from './VcrStatus';
import { VhsCover } from './VhsCover';

interface ServiceDetailProps {
  service: ServiceItem;
}

const TOTAL_PROGRESS_TICKS = 92;

export function ServiceDetail({ service }: ServiceDetailProps) {
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const galleryPanelRef = useRef<HTMLElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const lastFocusTriggerRef = useRef<HTMLElement | null>(null);
  const targetScrollRef = useRef<number>(0);
  const wheelAnimatingRef = useRef<boolean>(false);
  const rafRef = useRef<number>(0);

  const [progress, setProgress] = useState<number>(0);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [continuousSlide, setContinuousSlide] = useState<number>(0);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [zoomSlideIndex, setZoomSlideIndex] = useState<number | null>(null);

  const nextService = getServiceById(service.nextService);

  const updateProgress = useCallback(() => {
    const isDesktopTv = window.innerWidth >= 768 && window.innerHeight >= 680;
    if (isDesktopTv && trackRef.current) {
      const el = trackRef.current;
      const maxScroll = Math.max(1, el.scrollWidth - el.clientWidth);
      const ratio = Math.min(1, Math.max(0, el.scrollLeft / maxScroll));
      setProgress(ratio);

      // Mapear rango de la galeria (~16% a ~68% del scroll) al slide 0..2
      const galleryStart = 0.16;
      const galleryEnd = 0.66;
      const normalizedGallery = Math.min(
        1,
        Math.max(0, (ratio - galleryStart) / (galleryEnd - galleryStart))
      );
      const slideFloat = normalizedGallery * 2;
      setContinuousSlide(slideFloat);
      setActiveSlideIndex(Math.round(slideFloat));

      if (!wheelAnimatingRef.current) {
        targetScrollRef.current = el.scrollLeft;
      }
      return;
    }

    const maxDocScroll = Math.max(
      1,
      document.documentElement.scrollHeight - window.innerHeight
    );
    const ratio = Math.min(1, Math.max(0, window.scrollY / maxDocScroll));
    setProgress(ratio);
  }, []);

  useEffect(() => {
    wheelAnimatingRef.current = false;
    window.cancelAnimationFrame(rafRef.current);
    targetScrollRef.current = 0;
    if (trackRef.current) {
      trackRef.current.scrollLeft = 0;
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
    setProgress(0);
    setActiveSlideIndex(0);
    setContinuousSlide(0);
    setIsFocusMode(false);
    setZoomSlideIndex(null);
    titleRef.current?.focus({ preventScroll: true });
  }, [service.id]);

  useEffect(() => {
    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    return () => {
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
      window.cancelAnimationFrame(rafRef.current);
    };
  }, [updateProgress]);

  const animateTrackTo = useCallback(
    (nextTarget: number) => {
      const el = trackRef.current;
      if (!el) return;

      const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);
      const clamped = Math.min(maxScroll, Math.max(0, nextTarget));
      targetScrollRef.current = clamped;

      const prefersReduced = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;
      if (prefersReduced) {
        el.scrollLeft = clamped;
        updateProgress();
        return;
      }

      if (wheelAnimatingRef.current) return;
      wheelAnimatingRef.current = true;
      let lastTime = performance.now();

      const step = (now: number) => {
        const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
        lastTime = now;
        const current = el.scrollLeft;
        const diff = targetScrollRef.current - current;

        if (Math.abs(diff) < 0.75) {
          el.scrollLeft = targetScrollRef.current;
          wheelAnimatingRef.current = false;
          updateProgress();
          return;
        }

        const factor = 1 - Math.exp(-dt * 14);
        el.scrollLeft = current + diff * factor;
        updateProgress();
        rafRef.current = window.requestAnimationFrame(step);
      };

      rafRef.current = window.requestAnimationFrame(step);
    },
    [updateProgress]
  );

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const onNativeWheel = (event: WheelEvent) => {
      if (zoomSlideIndex !== null) return;
      const isDesktopTv = window.innerWidth >= 768 && window.innerHeight >= 680;
      if (!isDesktopTv) return;

      const delta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;
      if (Math.abs(delta) < 1) return;

      event.preventDefault();
      const base = wheelAnimatingRef.current
        ? targetScrollRef.current
        : el.scrollLeft;
      animateTrackTo(base + delta * 1.15);
    };

    el.addEventListener('wheel', onNativeWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onNativeWheel);
    };
  }, [animateTrackTo, zoomSlideIndex]);

  useEffect(() => {
    if (zoomSlideIndex === null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setZoomSlideIndex(null);
        lastFocusTriggerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [zoomSlideIndex]);

  const handleTrackPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const isDesktopTv = window.innerWidth >= 768 && window.innerHeight >= 680;
    if (!isDesktopTv || !trackRef.current) return;
    if (event.button !== 0 && event.pointerType === 'mouse') return;

    const targetEl = event.target as HTMLElement | null;
    if (targetEl?.closest('a, button, input, textarea, select')) return;

    const el = trackRef.current;
    const startX = event.clientX;
    const startScroll = el.scrollLeft;
    let dragging = false;

    const onMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      if (!dragging && Math.abs(dx) >= 8) {
        dragging = true;
        wheelAnimatingRef.current = false;
        window.cancelAnimationFrame(rafRef.current);
      }
      if (dragging) {
        el.scrollLeft = startScroll - dx;
        targetScrollRef.current = el.scrollLeft;
        updateProgress();
      }
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  const handleTrackKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const isDesktopTv = window.innerWidth >= 768 && window.innerHeight >= 680;
    if (!isDesktopTv || !trackRef.current) return;

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      const base = wheelAnimatingRef.current
        ? targetScrollRef.current
        : trackRef.current.scrollLeft;
      animateTrackTo(base + 380);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      const base = wheelAnimatingRef.current
        ? targetScrollRef.current
        : trackRef.current.scrollLeft;
      animateTrackTo(base - 380);
    }
  };

  const handleSelectGallerySlide = (slideIdx: number) => {
    setActiveSlideIndex(slideIdx);
    setContinuousSlide(slideIdx);

    const isDesktopTv = window.innerWidth >= 768 && window.innerHeight >= 680;
    if (isDesktopTv && trackRef.current && galleryPanelRef.current) {
      const panelLeft = galleryPanelRef.current.offsetLeft;
      const offsetCentered = Math.max(
        0,
        panelLeft -
          (trackRef.current.clientWidth - galleryPanelRef.current.clientWidth) / 2
      );
      animateTrackTo(offsetCentered);
    }
  };

  const handleToggleFocus = () => {
    setIsFocusMode((prev) => {
      const next = !prev;
      if (next && trackRef.current && galleryPanelRef.current) {
        const panelLeft = galleryPanelRef.current.offsetLeft;
        const offsetCentered = Math.max(
          0,
          panelLeft -
            (trackRef.current.clientWidth - galleryPanelRef.current.clientWidth) /
              2
        );
        animateTrackTo(offsetCentered);
      }
      return next;
    });
  };

  const handleOpenZoom = (slideIdx: number) => {
    lastFocusTriggerRef.current = document.activeElement as HTMLElement | null;
    setZoomSlideIndex(slideIdx);
  };

  const handleCloseZoom = () => {
    setZoomSlideIndex(null);
    lastFocusTriggerRef.current?.focus();
  };

  const scrubToClientX = (clientX: number) => {
    const bar = barRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(
      1,
      Math.max(0, (clientX - rect.left) / Math.max(1, rect.width))
    );

    const isDesktopTv = window.innerWidth >= 768 && window.innerHeight >= 680;
    if (isDesktopTv && trackRef.current) {
      const maxScroll = Math.max(
        0,
        trackRef.current.scrollWidth - trackRef.current.clientWidth
      );
      animateTrackTo(ratio * maxScroll);
    } else {
      const maxDoc = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight
      );
      window.scrollTo({ top: ratio * maxDoc, behavior: 'auto' });
    }
  };

  const handleBarPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    scrubToClientX(event.clientX);
    const onMove = (moveEvent: PointerEvent) => scrubToClientX(moveEvent.clientX);
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  const litTicks = Math.max(1, Math.round(progress * TOTAL_PROGRESS_TICKS));
  const progressPercent = Math.round(progress * 100);

  return (
    <main id="main-content" className="detail-shell">
      <div
        ref={trackRef}
        className="detail-track"
        tabIndex={0}
        aria-label={`Contenido horizontal de ${service.name}`}
        onScroll={updateProgress}
        onPointerDown={handleTrackPointerDown}
        onKeyDown={handleTrackKeyDown}
      >
        {/* Panel 1: Portada editorial + Vista ilustrativa inicial (ref. 00:58) */}
        <section
          className="detail-panel detail-panel--hero"
          aria-labelledby="service-detail-title"
        >
          <p className="crt-eyebrow">
            [ DESLIZA HORIZONTALMENTE PARA DESCUBRIR → ]
          </p>

          <div className="detail-hero">
            <div>
              <div className="detail-meta-grid">
                <div>
                  <span className="detail-meta-label">[ SERVICIO ]</span>
                  <span className="detail-meta-value">
                    {service.name.toUpperCase()}
                  </span>
                </div>
                <div>
                  <span className="detail-meta-label">[ EDICIÓN ]</span>
                  <span className="detail-meta-value">{siteConfig.edition}</span>
                </div>
              </div>

              <div className="detail-solutions">
                <span className="detail-meta-label">[ SOLUCIONES ]</span>
                <ul className="detail-solutions__list">
                  {service.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
              </div>

              <h1
                id="service-detail-title"
                ref={titleRef}
                tabIndex={-1}
                className="detail-title"
              >
                {service.titleLines.map((line, index) => (
                  <span key={index} className="detail-title-line">
                    {line}
                  </span>
                ))}
              </h1>

              <p className="detail-description">
                {service.descriptionDisplayLines.join(' ')}
              </p>

              {service.example && (
                <a
                  className="detail-example"
                  href={service.example.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Ver ejemplo publicado: ${service.example.label}, ${service.example.domain} (se abre en otra pestaña)`}
                >
                  <span className="detail-example__tag">[ EJEMPLO PUBLICADO ]</span>
                  <span className="detail-example__name">{service.example.label}</span>
                  <span className="detail-example__desc">{service.example.description}</span>
                  <span className="detail-example__url">{service.example.domain} [↗]</span>
                </a>
              )}

              <Link
                to="/"
                state={{ activeServiceId: service.id }}
                className="crt-btn"
              >
                [ VOLVER A SERVICIOS ]
              </Link>
            </div>

            <ServiceMockup service={service} />
          </div>
        </section>

        {/* Panel 2: Galeria curva cilindrica WebGL (ref. 00:62) */}
        <section
          ref={galleryPanelRef}
          className="detail-panel detail-panel--gallery"
          aria-label="Galería visual curva de la solución"
        >
          <CurvedGallery
            service={service}
            continuousSlide={continuousSlide}
            activeSlideIndex={activeSlideIndex}
            isFocusMode={isFocusMode}
            onSelectSlide={handleSelectGallerySlide}
            onToggleFocus={handleToggleFocus}
            onOpenZoom={handleOpenZoom}
          />
        </section>

        {/* Panel 3: Capacidades y Proceso accesibles en DOM */}
        <section
          className="detail-panel detail-panel--editorial"
          aria-labelledby="capabilities-heading"
        >
          <div className="detail-editorial-grid">
            <div>
              <p className="section-label">
                [ {commonCopy.capabilitiesLabel.toUpperCase()} ]
              </p>
              <h2 id="capabilities-heading" className="section-heading">
                {commonCopy.capabilitiesTitle}
              </h2>

              <div className="capabilities-grid">
                {service.features.map((feature, index) => (
                  <article key={feature.title} className="capability-card">
                    <span className="capability-card__num">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <h3 className="capability-card__title">{feature.title}</h3>
                    <p className="capability-card__desc">{feature.description}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="process-panel">
              <p className="section-label">
                [ {commonCopy.processLabel.toUpperCase()} ]
              </p>
              <h2 className="section-heading" style={{ fontSize: 'clamp(26px, 2.4vw, 34px)' }}>
                {commonCopy.processTitle}
              </h2>

              <div className="process-grid">
                {commonCopy.process.map((step, index) => (
                  <article key={step.title}>
                    <h3 className="process-step__title">
                      {String(index + 1).padStart(2, '0')} /{' '}
                      {step.title.toUpperCase()}
                    </h3>
                    <p className="process-step__desc">{step.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Panel 4: Cierre + Siguiente servicio con caratula VHS fisica (ref. 00:66) */}
        <section
          className="detail-panel detail-panel--closing"
          aria-labelledby="closing-heading"
        >
          <div className="detail-next-stage">
            <div className="detail-closing-box">
              <p className="section-label">[ HABLEMOS ]</p>
              <h2 id="closing-heading" className="section-heading">
                {commonCopy.contactTitle}
              </h2>
              <p className="detail-closing__desc">
                {commonCopy.contactDescription}
              </p>

              <ContactActions serviceId={service.id} />

              <div className="detail-nav-actions">
                <Link
                  to="/"
                  state={{ activeServiceId: service.id }}
                  className="crt-btn"
                >
                  [ VOLVER AL INICIO ]
                </Link>

                {nextService && (
                  <Link
                    to={nextService.path}
                    className="crt-btn crt-btn--primary"
                  >
                    [ SIGUIENTE SERVICIO ]
                  </Link>
                )}
              </div>
            </div>

            {nextService && (
              <Link
                to={nextService.path}
                className="detail-next-vhs-link"
                aria-label={`Siguiente servicio: ${nextService.name}`}
              >
                <div className="detail-next-vhs-frame">
                  <VhsCover
                    service={nextService}
                    isActive
                    showHoverPrompt
                    showCassette={false}
                  />
                </div>
                <span className="detail-next-tape">
                  <span className="detail-next-tape__label">
                    [ SIGUIENTE CINTA · {formatOrderFraction(nextService.order)} ]
                  </span>
                  <span className="detail-next-tape__name">{nextService.name}</span>
                </span>
              </Link>
            )}
          </div>
        </section>
      </div>

      {/* Barra inferior de progreso CRT */}
      <div className="detail-bottom-hud">
        <div
          ref={barRef}
          className="detail-progress-bar"
          role="progressbar"
          aria-label="Progreso de recorrido del servicio"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPercent}
          onPointerDown={handleBarPointerDown}
        >
          {Array.from({ length: TOTAL_PROGRESS_TICKS }, (_, idx) => {
            const isLit = idx < litTicks;
            const isCursor = idx === litTicks - 1;
            return (
              <span
                key={idx}
                className={`detail-progress-tick${isLit ? ' is-lit' : ''}${isCursor ? ' is-cursor' : ''}`}
                aria-hidden="true"
              />
            );
          })}
        </div>

        <VcrFooter
          className="detail-vcr-footer"
          center={
            <span className="detail-divider-bar__center">
              {formatOrderFraction(service.order)} · {progressPercent}%
            </span>
          }
        />
      </div>

      {/* Modal [AMPLIAR] accesible */}
      {zoomSlideIndex !== null && (
        <div
          className="zoom-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="zoom-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseZoom();
          }}
        >
          <div className="zoom-modal-card">
            <div className="zoom-modal-head">
              <div>
                <span className="section-label" style={{ marginBottom: 4 }}>
                  [ {GALLERY_SLIDE_META[zoomSlideIndex]?.label} ·{' '}
                  {service.name.toUpperCase()} ]
                </span>
                <h2 id="zoom-modal-title" className="zoom-modal-title">
                  {GALLERY_SLIDE_META[zoomSlideIndex]?.title}
                </h2>
              </div>
              <button
                type="button"
                className="crt-btn"
                autoFocus
                onClick={handleCloseZoom}
              >
                [ CERRAR ]
              </button>
            </div>

            <div className="zoom-modal-body">
              {zoomSlideIndex === 0 && <ServiceMockup service={service} />}

              {zoomSlideIndex === 1 && (
                <div className="capabilities-grid" style={{ marginTop: 0 }}>
                  {service.features.map((feat, idx) => (
                    <article key={feat.title} className="capability-card">
                      <span className="capability-card__num">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <h3 className="capability-card__title">{feat.title}</h3>
                      <p className="capability-card__desc">{feat.description}</p>
                    </article>
                  ))}
                </div>
              )}

              {zoomSlideIndex === 2 && (
                <div className="process-panel">
                  <div className="process-grid" style={{ marginTop: 0 }}>
                    {commonCopy.process.map((step, idx) => (
                      <article key={step.title}>
                        <h3 className="process-step__title">
                          {String(idx + 1).padStart(2, '0')} /{' '}
                          {step.title.toUpperCase()}
                        </h3>
                        <p className="process-step__desc">{step.description}</p>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
