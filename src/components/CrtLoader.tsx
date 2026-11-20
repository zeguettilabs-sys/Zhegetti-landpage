import { useEffect, useState } from 'react';
import { CrtTubeLayers } from './CrtTube';

interface CrtLoaderProps {
  onComplete: () => void;
}

const TOTAL_TICKS = 96;
const BOOT_DURATION_MS = 1350;

export function CrtLoader({ onComplete }: CrtLoaderProps) {
  const [progress, setProgress] = useState<number>(0);
  const [exiting, setExiting] = useState<boolean>(false);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      setProgress(100);
      setExiting(true);
      const timer = window.setTimeout(onComplete, 120);
      return () => window.clearTimeout(timer);
    }

    let rafId = 0;
    let finishTimer = 0;
    let assetsReady = false;
    const start = performance.now();

    const waitAssets = async () => {
      try {
        if ('fonts' in document) {
          await document.fonts.ready;
        }
      } catch {
        // Ignorar si document.fonts falla
      }
      assetsReady = true;
    };
    void waitAssets();

    const tick = (now: number) => {
      const elapsed = now - start;
      const rawRatio = Math.min(1, elapsed / BOOT_DURATION_MS);
      // Curva suave con ligera desaceleracion hacia el final hasta que las fuentes esten listas
      const eased = 1 - Math.pow(1 - rawRatio, 2.1);
      const capped = assetsReady ? eased : Math.min(0.94, eased);
      const pct = Math.min(100, Math.round(capped * 100));

      setProgress(pct);

      if (rawRatio < 1 || !assetsReady) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        setProgress(100);
        setExiting(true);
        finishTimer = window.setTimeout(onComplete, 340);
      }
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(finishTimer);
    };
  }, [onComplete]);

  const activeTicks = Math.round((progress / 100) * TOTAL_TICKS);
  const displayPercent = String(Math.min(99, progress)).padStart(2, '0');

  return (
    <div
      className={`crt-loader${exiting ? ' crt-loader--exiting' : ''}`}
      role="progressbar"
      aria-label="Cargando Zeguetti"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
    >
      <div className="crt-loader__outer">
        <div className="crt-loader__screen">
          <div className="crt-screen__glare" aria-hidden="true" />
          <div className="crt-screen__scanlines" aria-hidden="true" />

          <div className="crt-loader__bottom">
            <div className="crt-loader__meta">
              <span className="crt-loader__label">
                LOADING
                <span className="crt-loader__cursor" aria-hidden="true">
                  _
                </span>
              </span>
              <span className="crt-loader__percent">
                {progress === 100 ? '100' : displayPercent}
              </span>
            </div>

            <div className="crt-loader__ticks" aria-hidden="true">
              {Array.from({ length: TOTAL_TICKS }, (_, idx) => {
                const isLit = idx < activeTicks;
                const isHead = idx === activeTicks - 1 && progress < 100;
                return (
                  <span
                    key={idx}
                    className={`crt-loader__tick${isLit ? ' is-lit' : ''}${isHead ? ' is-head' : ''}`}
                  />
                );
              })}
            </div>
          </div>

          <CrtTubeLayers />
        </div>
      </div>
    </div>
  );
}
