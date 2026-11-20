import { useCallback, useEffect, useState } from 'react';

/** Momento en que "se encendio la casetera": el contador sigue entre paginas. */
const BOOT_AT = typeof performance !== 'undefined' ? performance.now() : 0;
const BW_STORAGE_KEY = 'zeguetti-bw';

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function formatTimecode(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

/** Contador de cinta: tiempo desde que se abrio la web (00:00:05). */
export function useTimecode(): string {
  const [value, setValue] = useState(() => formatTimecode(performance.now() - BOOT_AT));
  useEffect(() => {
    const tick = () => setValue(formatTimecode(performance.now() - BOOT_AT));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  return value;
}

const limaFormatter = (() => {
  try {
    return new Intl.DateTimeFormat('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Lima',
    });
  } catch {
    return null;
  }
})();

/** Hora de Lima, como el reloj de la casetera del estudio. */
export function useLimaClock(): string {
  const read = () => (limaFormatter ? limaFormatter.format(new Date()) : '--:--');
  const [value, setValue] = useState(read);
  useEffect(() => {
    const id = window.setInterval(() => setValue(read()), 15_000);
    return () => window.clearInterval(id);
  }, []);
  return value;
}

export type VcrSource = 'PC' | 'TABLET' | 'MÓVIL';

function detectSource(): VcrSource {
  if (typeof window === 'undefined') return 'PC';
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  if (!coarse) return 'PC';
  return Math.min(window.innerWidth, window.innerHeight) >= 600 ? 'TABLET' : 'MÓVIL';
}

/** De donde llega la señal: el dispositivo de quien mira. */
export function useVcrSource(): VcrSource {
  const [source, setSource] = useState<VcrSource>(detectSource);
  useEffect(() => {
    const update = () => setSource(detectSource());
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return source;
}

function readBw(): boolean {
  try {
    return localStorage.getItem(BW_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

/** Modo blanco y negro: se guarda en el navegador de cada visitante. */
export function useBwMode(): [boolean, () => void] {
  const [on, setOn] = useState<boolean>(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('bw')
      ? true
      : readBw()
  );

  useEffect(() => {
    document.documentElement.classList.toggle('bw', on);
  }, [on]);

  // Si se cambia en otra pagina (otro componente), mantenerse al dia
  useEffect(() => {
    const sync = () => setOn(document.documentElement.classList.contains('bw'));
    window.addEventListener('zeguetti:bw', sync);
    return () => window.removeEventListener('zeguetti:bw', sync);
  }, []);

  const toggle = useCallback(() => {
    const next = !document.documentElement.classList.contains('bw');
    document.documentElement.classList.toggle('bw', next);
    try {
      localStorage.setItem(BW_STORAGE_KEY, next ? '1' : '0');
    } catch {
      // Sin almacenamiento: el modo dura hasta recargar
    }
    setOn(next);
    window.dispatchEvent(new Event('zeguetti:bw'));
  }, []);

  return [on, toggle];
}
