import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CrtShell } from '../components/CrtShell';
import { Header } from '../components/Header';
import { ShowcaseGlobe, type GlobeStatus } from '../components/ShowcaseGlobe';
import { ShowcaseLightbox } from '../components/ShowcaseLightbox';
import { VcrFooter } from '../components/VcrStatus';
import { brandName } from '../data/services';
import { showcaseSeo } from '../seo/metadata';
import { buildShowcaseCards, tickerHeadlines, type ShowcaseCard } from '../three/showcaseCards';
import { useLiteMode } from '../hooks/useLite';
import { useSeo } from '../seo/useSeo';

interface RouteState {
  activeServiceId?: string;
}

/**
 * /vitrina: un globo de alambre con el titulo en anillo y tarjetas alrededor,
 * que gira con la rueda y el arrastre. Debajo corre un teletipo.
 * Todo el contenido es ilustrativo hasta que haya proyectos y novedades reales.
 * En pantallas chicas se vuelve al inicio, como hace la referencia.
 */
export function ShowcasePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state as RouteState | null) ?? null;
  const [cards, setCards] = useState<ShowcaseCard[]>([]);
  const [status, setStatus] = useState<GlobeStatus>('loading');
  const [open, setOpen] = useState<{ index: number; from: DOMRect | null } | null>(null);
  const [lite] = useLiteMode();
  // Modo ahorro: tarjetas en rejilla plana. Al salir del modo, el globo vuelve a intentarse.
  useEffect(() => {
    setStatus(lite ? 'off' : 'loading');
  }, [lite]);

  // Mientras la vitrina sea ilustrativa, no se indexa
  useSeo(showcaseSeo);

  // Solo escritorio
  useEffect(() => {
    const query = window.matchMedia('(max-width: 700px)');
    const check = () => {
      if (query.matches) navigate('/', { replace: true });
    };
    check();
    query.addEventListener('change', check);
    return () => query.removeEventListener('change', check);
  }, [navigate]);

  useEffect(() => {
    let alive = true;
    buildShowcaseCards()
      .then((list) => alive && setCards(list))
      .catch(() => alive && setStatus('off'));
    return () => {
      alive = false;
    };
  }, []);

  const headlines = useMemo(() => tickerHeadlines(), []);
  const tickerSeconds = Math.max(40, Math.round(headlines.join('').length * 0.2));
  const handleOpen = useCallback((index: number, from: DOMRect | null) => setOpen({ index, from }), []);
  const handleStatus = useCallback((s: GlobeStatus) => setStatus(s), []);

  return (
    <CrtShell variant="tv-home">
      <Header activeServiceId={state?.activeServiceId} />

      <div className="nw-screen" data-status={status} data-over="false">
        {cards.length > 0 && status !== 'off' && (
          <ShowcaseGlobe
            cards={cards}
            paused={open !== null}
            title="Vitrina"
            captionText="[ ENFOCAR ]"
            onOpen={handleOpen}
            onStatus={handleStatus}
          />
        )}
        {status === 'off' && cards.length > 0 && (
          <ul className="nw-flat" aria-label="Tarjetas de la vitrina">
            {cards.map((card, index) => (
              <li key={card.id}>
                <button type="button" onClick={(e) => handleOpen(index, e.currentTarget.getBoundingClientRect())}>
                  <canvas
                    width={card.canvas.width}
                    height={card.canvas.height}
                    ref={(node) => {
                      node?.getContext('2d')?.drawImage(card.canvas, 0, 0);
                    }}
                    aria-hidden="true"
                  />
                  <span>{card.title.toUpperCase()}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <main id="main-content" className="nw-main">
        <section className="nw" aria-label={`Vitrina — ${brandName}`}>
          <h1 className="sr-only">Vitrina — {brandName}</h1>
          <div className="nw-ticker" role="marquee" aria-label="Novedades (ilustrativas)">
            <div className="nw-ticker-track" style={{ animationDuration: `${tickerSeconds}s` }}>
              {[0, 1].map((run) => (
                <span key={run} className="nw-ticker-run" aria-hidden={run ? true : undefined}>
                  {headlines.map((text) => (
                    <span key={text}>{text} •</span>
                  ))}
                </span>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer site-footer--tv">
        <VcrFooter />
      </footer>

      {open && cards.length > 0 && (
        <ShowcaseLightbox
          cards={cards}
          index={open.index}
          from={open.from}
          onIndex={(index) => setOpen({ index, from: null })}
          onClose={() => setOpen(null)}
        />
      )}
    </CrtShell>
  );
}
