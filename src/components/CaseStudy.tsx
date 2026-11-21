import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { clients, type CaseImage, type CaseStudy as CaseStudyData } from '../data/services';
import { useAdvisors } from './AdvisorDialog';

/**
 * Caso de estudio dentro de la ficha (como la pagina de proyecto de la referencia):
 * datos del cliente, titular, resumen y enlace al sitio en vivo; despues capturas
 * de pantalla alternadas con textos cortos. Se recorre de lado en escritorio y hacia
 * abajo en el celular. Al pulsar una captura se ve ampliada.
 */
export function CaseStudy({ data, serviceId }: { data: CaseStudyData; serviceId: string }) {
  const [zoom, setZoom] = useState<CaseImage | null>(null);

  return (
    <>
      <section className="detail-panel detail-panel--case" aria-labelledby="case-heading">
        <div className="case-row">
          <div className="case-intro">
            <dl className="case-meta">
              <div>
                <dt>[ CLIENTE ]</dt>
                <dd>{data.client}</dd>
                <dd className="case-meta__soft">{data.person}</dd>
              </div>
              <div>
                <dt>[ AÑO ]</dt>
                <dd>{data.year}</dd>
              </div>
              <div>
                <dt>[ SERVICIOS ]</dt>
                {data.services.map((item) => (
                  <dd key={item}>{item.toUpperCase()}</dd>
                ))}
              </div>
              <div>
                <dt>[ SECTOR ]</dt>
                {data.sector.map((item) => (
                  <dd key={item}>{item.toUpperCase()}</dd>
                ))}
              </div>
            </dl>
            <div className="case-story">
              <p className="section-label">[ CASO REAL ]</p>
              <h2 id="case-heading" className="case-headline">
                {data.headline}
              </h2>
              <p className="case-summary">{data.summary}</p>
              <a className="case-live" href={data.url} target="_blank" rel="noopener noreferrer">
                VER SITIO EN VIVO <span aria-hidden="true">[↗]</span>
                <span className="sr-only"> (se abre en otra pestaña)</span>
              </a>
            </div>
          </div>

          {data.blocks.map((block, index) => {
            if (block.type === 'copy') {
              return (
                <div key={index} className={`case-copy${block.low ? ' is-low' : ''}`}>
                  <p className="case-copy__label">[ {block.label.toUpperCase()} ]</p>
                  <div className="case-copy__text">
                    <h3 className="case-copy__lead">{block.lead}</h3>
                    <p className="case-copy__body">{block.body}</p>
                  </div>
                </div>
              );
            }
            if (block.type === 'pair') {
              return (
                <div key={index} className="case-pair">
                  {block.images.map((shot) => (
                    <CaseShot key={shot.image} shot={shot} onOpen={setZoom} />
                  ))}
                </div>
              );
            }
            return <CaseShot key={index} shot={block} onOpen={setZoom} />;
          })}

          <ClientsBox serviceId={serviceId} />
        </div>
      </section>
      {zoom && <CaseZoom shot={zoom} onClose={() => setZoom(null)} />}
    </>
  );
}

function CaseShot({ shot, onOpen }: { shot: CaseImage; onOpen: (shot: CaseImage) => void }) {
  return (
    <figure className={`case-shot${shot.phone ? ' is-phone' : ''}`} style={{ aspectRatio: `${shot.width} / ${shot.height}` }}>
      <button type="button" className="case-shot__button" onClick={() => onOpen(shot)} aria-label={`Ampliar: ${shot.alt}`}>
        <img src={shot.image} alt={shot.alt} width={shot.width} height={shot.height} loading="lazy" decoding="async" draggable={false} />
        <span className="case-shot__hint" aria-hidden="true">
          [ ENFOCAR ]
        </span>
      </button>
    </figure>
  );
}

/**
 * Monitor de escritorio con la web del cliente en pantalla (como la foto de proyecto
 * de la referencia): fondo gris de estudio, pantalla, pie y mesa. Al pulsarlo se amplia.
 */
export function MonitorShot({ shot, client, url, domain }: { shot: CaseImage; client: string; url: string; domain: string }) {
  const [zoom, setZoom] = useState(false);
  return (
    <div className="detail-hero__visual monitor-visual">
      <figure className="monitor-stage">
        <button type="button" className="monitor" onClick={() => setZoom(true)} aria-label={`Ampliar: ${shot.alt}`}>
          <span className="monitor__screen">
            <img src={shot.image} alt={shot.alt} width={shot.width} height={shot.height} decoding="async" draggable={false} />
            <span className="monitor__glare" aria-hidden="true" />
          </span>
        </button>
        <span className="monitor__neck" aria-hidden="true" />
        <span className="monitor__foot" aria-hidden="true" />
        <span className="monitor__desk" aria-hidden="true" />
      </figure>
      <a className="mockup-caption monitor-caption" href={url} target="_blank" rel="noopener noreferrer">
        CASO REAL / {client.toUpperCase()} · {domain} [↗]
        <span className="sr-only"> (se abre en otra pestaña)</span>
      </a>
      {zoom && <CaseZoom shot={shot} onClose={() => setZoom(false)} />}
    </div>
  );
}

/** Captura ampliada a pantalla del televisor. */
function CaseZoom({ shot, onClose }: { shot: CaseImage; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const close = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      opener?.focus?.();
    };
  }, [close]);

  const host = document.querySelector('.crt-content') ?? document.body;
  return createPortal(
    <div className="case-zoom" role="dialog" aria-modal="true" aria-label={shot.alt} onClick={close} data-crt-warp="off">
      <button ref={closeRef} type="button" className="case-zoom__close" onClick={close}>
        CERRAR[X]
      </button>
      <img
        className={shot.phone ? 'is-phone' : undefined}
        src={shot.image}
        alt={shot.alt}
        width={shot.width}
        height={shot.height}
        onClick={(e) => e.stopPropagation()}
      />
    </div>,
    host
  );
}

/**
 * Cuadro con los logos de los clientes. Mientras crecemos, los espacios libres
 * invitan a cotizar (abren el panel de asesores).
 */
export function ClientsBox({ serviceId, slots = 6 }: { serviceId?: string; slots?: number }) {
  const { open } = useAdvisors();
  const empty = Math.max(0, slots - clients.length);

  return (
    <aside className="clients-box" aria-labelledby="clients-heading">
      <p id="clients-heading" className="clients-box__label">
        [ CONFÍAN EN ZEGUETTI ]
      </p>
      <ul className="clients-box__grid">
        {clients.map((client) => (
          <li key={client.id}>
            <a className="clients-box__tile" href={client.url} target="_blank" rel="noopener noreferrer" title={client.person}>
              <img src={client.logo} alt={`Logo de ${client.name}`} width={512} height={512} loading="lazy" />
              <span className="clients-box__name">{client.name}</span>
            </a>
          </li>
        ))}
        {Array.from({ length: empty }, (_, i) => (
          <li key={`libre-${i}`}>
            <button type="button" className="clients-box__tile is-empty" onClick={() => open(serviceId)}>
              <span aria-hidden="true">+</span>
              <span className="clients-box__name">{i === 0 ? '¿TU MARCA AQUÍ?' : 'ESPACIO LIBRE'}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="clients-box__note">Cada proyecto publicado suma su logo a este cuadro.</p>
    </aside>
  );
}
