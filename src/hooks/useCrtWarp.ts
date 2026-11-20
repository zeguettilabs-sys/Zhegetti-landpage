import { useEffect, type RefObject } from 'react';

/**
 * Curvatura del tubo para el HTML.
 *
 * El navegador no puede doblar el DOM como un vidrio, asi que cada bloque de
 * texto o boton se desplaza, inclina y encoge segun donde cae en la pantalla,
 * con la misma formula de barril que usa el lienzo 3D. Como cada bloque es
 * pequeño, el conjunto se lee como una imagen curvada.
 *
 * Se usan las propiedades `translate`, `rotate` y `scale` (no `transform`)
 * para no pisar las animaciones que ya existen.
 */
const WARP_SELECTOR = [
  '.site-header .header-left > *',
  '.site-header .header-right > *',
  '.site-header .header-mobile-toggle',
  '.home-hero__hint-row > *',
  '.carousel-caption > *',
  '.carousel-arrow',
  '.vcr-footer__item',
  '[data-crt-warp]',
  '.crt-content h1',
  '.crt-content h2',
  '.crt-content h3',
  '.crt-content p',
  '.crt-content .crt-btn',
  '.crt-content .crt-eyebrow',
  '.site-footer > *',
].join(',');

/**
 * Zonas que ya se curvan solas (lienzo 3D) o que no deben moverse.
 * El logo usa mix-blend-mode: un transform lo aislaria y se veria su fondo negro.
 */
const SKIP_INSIDE =
  '.carousel-stage, .mobile-drawer, .header-brand, [role="dialog"], [data-crt-warp="off"]';

interface Applied {
  dx: number;
  dy: number;
}

export function useCrtWarp(screenRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const screen = screenRef.current;
    if (!screen) return;

    const applied = new WeakMap<HTMLElement, Applied>();
    const touched = new Set<HTMLElement>();
    let frame = 0;

    const run = () => {
      frame = 0;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const sr = screen.getBoundingClientRect();
      // Zona visible del tubo (en paginas largas, lo que hay en la ventana)
      const left = Math.max(0, sr.left);
      const top = Math.max(0, sr.top);
      const right = Math.min(vw, sr.right);
      const bottom = Math.min(vh, sr.bottom);
      const w = Math.max(1, right - left);
      const h = Math.max(1, bottom - top);
      const cx = left + w / 2;
      const cy = top + h / 2;
      const k = vw < 740 ? 0.025 : 0.04;

      const nodes = Array.from(screen.querySelectorAll<HTMLElement>(WARP_SELECTOR)).filter(
        (el) => !el.closest(SKIP_INSIDE)
      );
      const keep = new Set<HTMLElement>();

      // Primero se leen todas las posiciones y luego se escribe, para no forzar
      // un recalculo de diseño por cada elemento.
      const reads = nodes.map((el) => {
        const r = el.getBoundingClientRect();
        const prev = applied.get(el) ?? { dx: 0, dy: 0 };
        return { el, x: r.left + r.width / 2 - prev.dx, y: r.top + r.height / 2 - prev.dy, visible: r.width > 0 && r.height > 0 };
      });

      const nodeSet = new Set(nodes);
      const insideWarped = (el: HTMLElement) => {
        for (let p = el.parentElement; p && p !== screen; p = p.parentElement) {
          if (nodeSet.has(p)) return true;
        }
        return false;
      };

      for (const { el, x, y, visible } of reads) {
        // Elementos dentro de otro ya curvado heredan su movimiento
        if (!visible || insideWarped(el)) continue;
        const nx = Math.max(-1.1, Math.min(1.1, (x - cx) / (w / 2)));
        const ny = Math.max(-1.1, Math.min(1.1, (y - cy) / (h / 2)));
        const dx = -k * nx * ny * ny * (w / 2);
        const dy = -k * ny * nx * nx * (h / 2);
        const angle = Math.atan((-2 * k * nx * ny * (h / 2)) / (w / 2)) * (180 / Math.PI);
        const scale = 1 - k * 0.5 * (nx * nx + ny * ny);

        el.style.translate = `${dx.toFixed(2)}px ${dy.toFixed(2)}px`;
        el.style.rotate = `${angle.toFixed(3)}deg`;
        el.style.scale = scale.toFixed(4);
        applied.set(el, { dx, dy });
        touched.add(el);
        keep.add(el);
      }

      // Limpiar los que ya no aplican (por ejemplo, al cambiar de tamaño)
      for (const el of touched) {
        if (!keep.has(el)) {
          el.style.removeProperty('translate');
          el.style.removeProperty('rotate');
          el.style.removeProperty('scale');
          applied.delete(el);
          touched.delete(el);
        }
      }
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(run);
    };

    schedule();
    // Re-medir cuando terminan las animaciones de entrada y cargan fuentes
    const timers = [250, 700, 1400].map((ms) => window.setTimeout(schedule, ms));
    document.fonts?.ready.then(schedule).catch(() => {});

    window.addEventListener('resize', schedule);
    screen.addEventListener('scroll', schedule, { capture: true, passive: true });
    window.addEventListener('scroll', schedule, { passive: true });
    const mutations = new MutationObserver(schedule);
    mutations.observe(screen, { childList: true, subtree: true, characterData: true });

    return () => {
      window.cancelAnimationFrame(frame);
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener('resize', schedule);
      screen.removeEventListener('scroll', schedule, { capture: true });
      window.removeEventListener('scroll', schedule);
      mutations.disconnect();
      for (const el of touched) {
        el.style.removeProperty('translate');
        el.style.removeProperty('rotate');
        el.style.removeProperty('scale');
      }
    };
  }, [screenRef]);
}
