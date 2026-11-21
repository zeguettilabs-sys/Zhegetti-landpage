import { useCallback, useEffect, useState } from 'react';

/**
 * Modo ahorro ("lite") para equipos con poca potencia o poca bateria.
 * Apaga el 3D (WebGL), la curvatura del texto, el grano, el temblor de cinta
 * y las animaciones largas; deja la web igual de usable pero mucho mas liviana.
 *
 * - Preferencia manual: se guarda como "1" (activo) o "0" (apagado) y manda siempre.
 * - Sin preferencia: se activa solo en equipos de gama baja (ver `detectLowEnd`)
 *   o si la web va a tirones (ver `useAutoLite`).
 *
 * El index.html aplica la clase `lite` en <html> antes de pintar (misma regla).
 */
export const LITE_KEY = 'zeguetti-lite';
const LITE_EVENT = 'zeguetti:lite';

interface NavigatorHints extends Navigator {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
}

export function isLite(): boolean {
  return typeof document !== 'undefined' && document.documentElement.classList.contains('lite');
}

export function readLitePreference(): '1' | '0' | null {
  try {
    const value = localStorage.getItem(LITE_KEY);
    return value === '1' || value === '0' ? value : null;
  } catch {
    return null;
  }
}

/** Equipos que casi seguro van mejor sin efectos: poca RAM, pocos nucleos o "ahorro de datos". */
export function detectLowEnd(): boolean {
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as NavigatorHints;
  const cores = nav.hardwareConcurrency ?? 8;
  const memory = nav.deviceMemory ?? 8;
  const net = nav.connection;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  return (
    Boolean(net?.saveData) ||
    /2g$/.test(net?.effectiveType ?? '') ||
    memory <= 2 ||
    cores <= 2 ||
    (coarse && cores <= 4 && memory <= 4)
  );
}

/** Cambia el modo. `persist` guarda la eleccion del visitante; el modo automatico no la guarda. */
export function setLite(on: boolean, persist: boolean) {
  document.documentElement.classList.toggle('lite', on);
  if (persist) {
    try {
      localStorage.setItem(LITE_KEY, on ? '1' : '0');
    } catch {
      // Sin almacenamiento: dura hasta recargar
    }
  }
  window.dispatchEvent(new Event(LITE_EVENT));
}

/** Estado del modo ahorro y un interruptor; se mantiene al dia entre componentes. */
export function useLiteMode(): [boolean, () => void] {
  const [on, setOn] = useState<boolean>(isLite);

  useEffect(() => {
    const sync = () => setOn(isLite());
    window.addEventListener(LITE_EVENT, sync);
    sync();
    return () => window.removeEventListener(LITE_EVENT, sync);
  }, []);

  const toggle = useCallback(() => setLite(!isLite(), true), []);
  return [on, toggle];
}

/**
 * Si el visitante no eligio nada y la web va a menos de ~30 cuadros por segundo,
 * pasa sola al modo ahorro. Mide unos 2 s, ya con la web en marcha.
 */
export function useAutoLite(active: boolean) {
  useEffect(() => {
    if (!active || readLitePreference() !== null || isLite()) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    let timer = 0;
    let stopped = false;

    const start = () => {
      const deltas: number[] = [];
      let last = 0;
      const begin = performance.now();
      const frame = (now: number) => {
        if (stopped) return;
        if (document.hidden) {
          // Con la pestaña oculta la medida no vale: se vuelve a intentar mas tarde
          timer = window.setTimeout(start, 4000);
          return;
        }
        if (last) deltas.push(now - last);
        last = now;
        if (now - begin < 2200) {
          raf = requestAnimationFrame(frame);
          return;
        }
        const sample = deltas.slice(6).sort((a, b) => a - b);
        if (sample.length < 20) return;
        const median = sample[Math.floor(sample.length / 2)];
        if (median > 34 && readLitePreference() === null) setLite(true, false);
      };
      raf = requestAnimationFrame(frame);
    };

    // Espera a que termine la entrada (carga + 3D listos) antes de medir
    timer = window.setTimeout(start, 3200);
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [active]);
}
