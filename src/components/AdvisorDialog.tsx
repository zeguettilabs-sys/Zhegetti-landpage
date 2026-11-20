import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { AdvisorPanel } from './AdvisorPanel';

interface AdvisorApi {
  /** Abre el panel de asesores; `serviceId` llega preseleccionado. */
  open: (serviceId?: string) => void;
}

const AdvisorContext = createContext<AdvisorApi>({ open: () => undefined });

export function useAdvisors(): AdvisorApi {
  return useContext(AdvisorContext);
}

const FOCUSABLE = 'a[href], button:not([disabled]), input, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Da acceso al panel de asesores desde cualquier parte (pie, fichas de servicio...).
 * El panel se pinta dentro de la pantalla del televisor y se cierra al cambiar de pagina.
 */
export function AdvisorProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [state, setState] = useState<{ serviceId?: string } | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const open = useCallback((serviceId?: string) => {
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setState({ serviceId });
  }, []);

  const close = useCallback(() => {
    setState(null);
    openerRef.current?.focus?.();
  }, []);

  // Cambiar de pagina cierra el panel
  useEffect(() => {
    setState(null);
  }, [location.key]);

  const api = useMemo(() => ({ open }), [open]);
  const host = state ? document.querySelector('.crt-content') : null;

  return (
    <AdvisorContext.Provider value={api}>
      {children}
      {state && host && createPortal(<AdvisorDialog serviceId={state.serviceId} onClose={close} />, host)}
    </AdvisorContext.Provider>
  );
}

function AdvisorDialog({ serviceId, onClose }: { serviceId?: string; onClose: () => void }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closingRef = useRef(false);

  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    const root = rootRef.current;
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onClose();
      return;
    }
    root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'ease-in', fill: 'forwards' }).onfinish = onClose;
  }, [onClose]);

  useEffect(() => {
    const root = rootRef.current;
    if (root && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      root.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
      panelRef.current?.animate(
        [
          { opacity: 0, transform: 'translateY(14px) scale(0.985)' },
          { opacity: 1, transform: 'none' },
        ],
        { duration: 420, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
      );
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
        return;
      }
      // El foco se queda dentro del panel
      if (e.key === 'Tab' && panelRef.current) {
        const items = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  return (
    <div ref={rootRef} className="adv-dialog" data-crt-warp="off" onClick={close}>
      <div
        ref={panelRef}
        className="adv-dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="adv-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="adv-dialog__bar">
          <span id="adv-dialog-title" className="adv-dialog__title">
            [ CONTACTAR CON ASESOR ]
          </span>
          <button type="button" className="adv-dialog__close" onClick={close}>
            CERRAR[X]
          </button>
        </div>
        <AdvisorPanel
          serviceId={serviceId}
          autoFocus
          onSent={() => window.setTimeout(close, 250)}
          intro={
            <p className="adv__lead">
              Elige qué quieres cotizar y con qué asesor hablar: te llevamos a WhatsApp con el mensaje ya escrito.
            </p>
          }
        />
      </div>
    </div>
  );
}
