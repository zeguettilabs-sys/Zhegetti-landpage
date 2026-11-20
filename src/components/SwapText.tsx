import { useEffect, useRef, useState } from 'react';

/** Tiempo que tarda en irse el texto anterior (debe coincidir con .swap-out en CSS). */
const OUT_MS = 240;
/** El texto nuevo entra cuando el anterior ya casi desaparecio: nunca se cruzan. */
const IN_AFTER_MS = 200;

interface SwapTextProps {
  text: string;
  /** Retraso extra de entrada, para escalonar varias lineas (ms). */
  delay?: number;
}

/**
 * Cambio de texto como en un rotulo de casetera: primero el anterior cae y se
 * apaga, luego el nuevo sube desde abajo. Solo es visual: el texto real para
 * lectores de pantalla va aparte (sr-only) en quien lo usa.
 */
export function SwapText({ text, delay = 0 }: SwapTextProps) {
  const [items, setItems] = useState<Array<{ id: number; text: string; leaving: boolean }>>([
    { id: 0, text, leaving: false },
  ]);
  const nextId = useRef(1);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const id = nextId.current++;
    setItems((prev) => {
      // Si se cambia muy rapido, solo queda saliendo el ultimo texto visible
      const current = prev.filter((it) => !it.leaving).slice(-1);
      return [...current.map((it) => ({ ...it, leaving: true })), { id, text, leaving: false }];
    });
    const timer = window.setTimeout(() => {
      setItems((prev) => prev.filter((it) => !it.leaving));
    }, OUT_MS + 40);
    return () => window.clearTimeout(timer);
  }, [text]);

  return (
    <span className="swap" aria-hidden="true">
      {items.map((it) => (
        <span
          key={it.id}
          className={`swap-i${it.leaving ? ' swap-out' : ''}${it.id === 0 ? ' swap-i--static' : ''}`}
          style={it.leaving || it.id === 0 ? undefined : { animationDelay: `${IN_AFTER_MS + delay}ms` }}
        >
          {it.text}
        </span>
      ))}
    </span>
  );
}
