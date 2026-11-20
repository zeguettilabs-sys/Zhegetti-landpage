import { useEffect, useId, useRef, useState } from 'react';
import { drawWear } from '../three/vhsTextures';
import { brandName, services } from '../data/services';
import { siteConfig } from '../config/site';

/** Funda de VHS del perfil (misma proporcion que la de Arc: 572 x 863). */
export const SLEEVE_W = 571.83;
export const SLEEVE_H = 863;
const COVER_PX_W = Math.round(SLEEVE_W * 2);
const COVER_PX_H = SLEEVE_H * 2;

const SPIN_WHEEL = 0.75; // grados por pixel de rueda
const SPIN_DRAG = 0.6; // grados por pixel arrastrado
const DRAG_THRESHOLD = 5;
const SPIN_SPRING = 12;
const SPIN_SPRING_TOUCH = 26;
const TOUCH_GAIN = 1.2;
const TOUCH_FLING = 0.3;
const SETTLE_MS = 160;
const TILT_X = 6;
const TILT_Y = 4;

function springTo(x: number, v: number, target: number, dt: number, k: number) {
  const o = x - target;
  const decay = Math.exp(-k * dt);
  const s = v + k * o;
  return { x: target + (o + s * dt) * decay, v: (v - s * k * dt) * decay };
}

let noiseTile: HTMLCanvasElement | null = null;
function getNoiseTile(): HTMLCanvasElement {
  if (noiseTile) return noiseTile;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d')!;
  const data = ctx.createImageData(256, 256);
  for (let i = 0; i < data.data.length; i += 4) {
    const v = Math.random() * 255;
    data.data[i] = data.data[i + 1] = data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  ctx.putImageData(data, 0, 0);
  noiseTile = c;
  return c;
}

/** Arte de la caratula: el monograma sobre la franja RGB, grano de cinta y el nombre en rojo. */
function paintCover(canvas: HTMLCanvasElement, logo: HTMLImageElement, serif: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const k = canvas.width / SLEEVE_W;
  ctx.setTransform(k, 0, 0, k, 0, 0);
  const W = SLEEVE_W;
  const H = SLEEVE_H;

  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = '#050505';
  ctx.fillRect(0, 0, W, H);

  // Luz de fondo detras del monograma
  const glow = ctx.createRadialGradient(W / 2, 500, 20, W / 2, 500, 470);
  glow.addColorStop(0, '#4a4a4a');
  glow.addColorStop(0.55, '#202020');
  glow.addColorStop(1, '#070707');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Franja RGB detras del monograma, como la etiqueta de color de una cinta
  const stripes = ["#e23b3b", "#f0902c", "#f0d43a", "#47b968", "#2f9cd8", "#6b53c9"];
  const sh = 24;
  stripes.forEach((c, n) => {
    const y0 = 470 + n * sh;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(26, y0 + 96);
    ctx.lineTo(300, y0);
    ctx.lineTo(300, y0 + sh);
    ctx.lineTo(26, y0 + 96 + sh);
    ctx.closePath();
    ctx.fill();
  });

  // Monograma con su franja de colores
  const lw = 540;
  const lh = (lw * logo.height) / logo.width;
  ctx.drawImage(logo, (W - lw) / 2, 505 - lh / 2, lw, lh);

  // Tono de cinta: lavado, contraste y grano
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = 'rgb(236,236,236)';
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = ctx.createPattern(getNoiseTile(), 'repeat') ?? '#808080';
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;

  // Nombre en rojo, sumado a la luz de abajo
  const label = brandName.toUpperCase();
  ctx.globalCompositeOperation = 'color-dodge';
  ctx.fillStyle = '#ff1414';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `400 200px ${serif}`;
  const measured = ctx.measureText(label).width || 1;
  const size = Math.min(230, (200 * 486) / measured);
  ctx.font = `400 ${size}px ${serif}`;
  ctx.fillText(label, W / 2, 250);
  ctx.globalCompositeOperation = 'source-over';
}

function Mark() {
  return (
    <>
      <span className="sleeve-rule is-top" />
      <span className="sleeve-rule is-bottom" />
      <span className="sleeve-mark">{brandName.toUpperCase()} · LABS</span>
      <span className="sleeve-home">Home Video</span>
    </>
  );
}

function VhsBadge({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 71 38" aria-hidden="true">
      <rect x="1.5" y="1.5" width="68" height="35" rx="2" fill="none" stroke="#fff" strokeWidth="2.4" />
      <text
        x="35.5"
        y="28.5"
        textAnchor="middle"
        fontSize="25"
        fontWeight="700"
        fill="#fff"
        fontFamily="var(--font-editorial), Georgia, serif"
        letterSpacing="1"
      >
        VHS
      </text>
    </svg>
  );
}

function Emblem({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 139 99" aria-hidden="true">
      <ellipse cx="69.5" cy="49.5" rx="64" ry="44" fill="none" stroke="#fff" strokeWidth="3" />
      <ellipse cx="69.5" cy="49.5" rx="44" ry="44" fill="none" stroke="#fff" strokeWidth="2" />
      <ellipse cx="69.5" cy="49.5" rx="22" ry="44" fill="none" stroke="#fff" strokeWidth="2" />
      <path d="M5.5 49.5h128M17 24h105M17 75h105" stroke="#fff" strokeWidth="2" fill="none" />
      <circle cx="69.5" cy="49.5" r="9" fill="#fff" />
    </svg>
  );
}

/** Cassette vertical que sale de la funda. */
function Tape() {
  return (
    <svg className="sleeve-tape-art" viewBox="0 0 492 854" aria-hidden="true">
      <rect x="1" y="1" width="490" height="852" rx="22" fill="#121212" stroke="#2c2c2c" strokeWidth="2" />
      <rect x="30" y="34" width="432" height="318" rx="8" fill="#e8e3d6" />
      {['#cc2b2f', '#e8822c', '#e9c53a', '#4cae56', '#2f9bd6', '#5a4bc4'].map((c, n) => (
        <rect key={c} x="30" y={34 + n * 13} width="432" height="13" fill={c} />
      ))}
      <text
        x="246"
        y="170"
        textAnchor="middle"
        fontSize="62"
        fill="#161616"
        fontFamily="var(--font-editorial), Georgia, serif"
      >
        {brandName}
      </text>
      <text
        x="246"
        y="212"
        textAnchor="middle"
        fontSize="22"
        letterSpacing="4"
        fill="#3a3a3a"
        fontFamily="var(--font-interface), monospace"
      >
        HOME VIDEO · T-120
      </text>
      <path d="M62 262h368M62 296h368M62 330h260" stroke="#8d8778" strokeWidth="1.6" />
      <rect x="30" y="376" width="432" height="222" rx="14" fill="#070707" stroke="#303030" strokeWidth="3" />
      <rect x="64" y="430" width="364" height="110" fill="#1f130d" />
      {[148, 344].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="487" r="70" fill="#0d0d0d" stroke="#454545" strokeWidth="3" />
          <circle cx={cx} cy="487" r="30" fill="#c9c9c9" />
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <rect key={a} x={cx - 4} y="466" width="8" height="12" fill="#0d0d0d" transform={`rotate(${a} ${cx} 487)`} />
          ))}
        </g>
      ))}
      <path d="M88 630h316l34 160H54z" fill="#0b0b0b" stroke="#2a2a2a" strokeWidth="2" />
      <circle cx="148" cy="758" r="14" fill="#050505" stroke="#303030" strokeWidth="2" />
      <circle cx="344" cy="758" r="14" fill="#050505" stroke="#303030" strokeWidth="2" />
    </svg>
  );
}

const BARCODE = (() => {
  let seed = 2026;
  const rand = () => (seed = (seed * 16807) % 0x7fffffff) / 0x7fffffff;
  const bars: { x: number; w: number }[] = [];
  for (let x = 2; x < 96; ) {
    const w = 0.6 + 0.6 * Math.floor(rand() * 3);
    bars.push({ x, w });
    x += w + 0.6 + 0.6 * Math.floor(rand() * 2);
  }
  return bars;
})();

/**
 * Funda de VHS en 3D real (CSS preserve-3d): frente, reverso, lomos y el cassette
 * por dentro. Gira con la rueda, el arrastre y el tacto, y vuelve de frente al soltar.
 */
export function ProfileSleeve() {
  const [out, setOut] = useState(false);
  const spinRef = useRef<HTMLDivElement | null>(null);
  const printRef = useRef<HTMLCanvasElement | null>(null);
  const wearFrontRef = useRef<HTMLCanvasElement | null>(null);
  const wearBackRef = useRef<HTMLCanvasElement | null>(null);
  const descId = useId();

  // Desgaste de la funda
  useEffect(() => {
    for (const [canvas, seed] of [
      [wearFrontRef.current, 20260],
      [wearBackRef.current, 70331],
    ] as const) {
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) drawWear(ctx, canvas.width, canvas.height, seed);
    }
  }, []);

  // Arte de la caratula
  useEffect(() => {
    let alive = true;
    const logo = new Image();
    logo.src = '/assets/logo-zeguetti-alpha.png';
    const serif =
      getComputedStyle(document.documentElement).getPropertyValue('--font-editorial').trim() || 'Georgia, serif';
    void Promise.all([logo.decode(), document.fonts?.load(`400 100px ${serif}`)])
      .then(() => {
        if (alive && printRef.current) paintCover(printRef.current, logo, serif);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  // Giro con rueda, arrastre, tacto y un leve cabeceo con el puntero
  useEffect(() => {
    const el = spinRef.current;
    const stage = el?.closest<HTMLElement>('.prof');
    if (!el || !stage) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let angle = 0;
    let vel = 0;
    let target = 0;
    let last = 0;
    let raf = 0;
    let settle = 0;
    let touchY: number | null = null;
    let touchV = 0;
    let touchT = 0;
    let touching = false;
    let tilt = { x: 0, y: 0 };
    let tiltTarget = { x: 0, y: 0 };
    let drag: { x: number; moved: number } | null = null;
    let dragged = false;

    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const c = 1 - Math.exp(-6 * dt);
      tilt = { x: tilt.x + (tiltTarget.x - tilt.x) * c, y: tilt.y + (tiltTarget.y - tilt.y) * c };
      const tilting = Math.abs(tiltTarget.x - tilt.x) > 0.02 || Math.abs(tiltTarget.y - tilt.y) > 0.02;
      const s = springTo(angle, vel, target, dt, touching ? SPIN_SPRING_TOUCH : SPIN_SPRING);
      angle = s.x;
      vel = s.v;
      if (Math.abs(target - angle) < 0.05 && Math.abs(vel) < 0.5) {
        angle = target;
        vel = 0;
      }
      el.style.transform = `rotateX(${tilt.y.toFixed(2)}deg) rotateY(${(angle + tilt.x).toFixed(2)}deg)`;
      raf = angle !== target || tilting ? requestAnimationFrame(frame) : 0;
    };
    const kick = () => {
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    const spin = (delta: number) => {
      if (!delta) return;
      setOut(false);
      target += delta;
      window.clearTimeout(settle);
      if (touchY !== null) return kick();
      settle = window.setTimeout(() => {
        touching = false;
        target = 360 * Math.round(target / 360);
        kick();
      }, SETTLE_MS);
      kick();
    };

    const onWheel = (e: WheelEvent) => {
      touching = false;
      spin((Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX) * SPIN_WHEEL);
    };
    const onDown = (e: PointerEvent) => {
      if (e.button > 0 || !(e.target instanceof Node) || !el.contains(e.target)) return;
      drag = { x: e.clientX, moved: 0 };
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && !drag) {
        const r = stage.getBoundingClientRect();
        tiltTarget = {
          x: ((e.clientX - r.left) / r.width - 0.5) * 2 * TILT_X,
          y: -((e.clientY - r.top) / r.height - 0.5) * 2 * TILT_Y,
        };
        kick();
      }
      if (!drag) return;
      const dx = e.clientX - drag.x;
      drag.x = e.clientX;
      drag.moved += Math.abs(dx);
      if (drag.moved > DRAG_THRESHOLD) spin(dx * SPIN_DRAG);
    };
    const onUp = () => {
      if (drag && drag.moved > DRAG_THRESHOLD) {
        dragged = true;
        window.setTimeout(() => (dragged = false), 0);
      }
      drag = null;
    };
    const onClickCapture = (e: MouseEvent) => {
      if (dragged) {
        dragged = false;
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0].clientY;
      touchV = 0;
      touchT = performance.now();
      touching = true;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (touchY === null) return;
      const y = e.touches[0].clientY;
      const dy = touchY - y;
      spin(dy * TOUCH_GAIN);
      const now = performance.now();
      touchV = 0.6 * touchV + (dy / Math.max(8, now - touchT)) * 400;
      touchT = now;
      touchY = y;
    };
    const onTouchEnd = () => {
      if (touchY === null) return;
      touchY = null;
      const fling = performance.now() - touchT < 80 ? touchV * TOUCH_FLING * TOUCH_GAIN : 0;
      if (fling) spin(fling);
      else {
        target = 360 * Math.round(target / 360);
        touching = false;
        kick();
      }
    };

    window.addEventListener('wheel', onWheel, { passive: true });
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    el.addEventListener('click', onClickCapture, true);
    stage.addEventListener('touchstart', onTouchStart, { passive: true });
    stage.addEventListener('touchmove', onTouchMove, { passive: true });
    stage.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('wheel', onWheel);
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      el.removeEventListener('click', onClickCapture, true);
      stage.removeEventListener('touchstart', onTouchStart);
      stage.removeEventListener('touchmove', onTouchMove);
      stage.removeEventListener('touchend', onTouchEnd);
      window.clearTimeout(settle);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="prof-sleeve" data-out={out || undefined}>
      <div ref={spinRef} className="sleeve-spin">
        <div className="sleeve-tape" aria-hidden="true">
          <Tape />
        </div>

        <button
          type="button"
          className="sleeve-cover"
          aria-pressed={out}
          aria-describedby={descId}
          onClick={() => setOut((v) => !v)}
        >
          <span id={descId} className="sr-only">
            {out ? 'Guarda la cinta' : 'Saca la cinta'}
          </span>
          <canvas ref={printRef} className="sleeve-print" width={COVER_PX_W} height={COVER_PX_H} />
          <Mark />
          <VhsBadge className="sleeve-vhs" />
          <span className="sleeve-date">{siteConfig.edition}</span>
          <Emblem className="sleeve-mpa" />
          <canvas ref={wearFrontRef} className="sleeve-wear" width={COVER_PX_W} height={COVER_PX_H} />
        </button>

        <div className="sleeve-back" aria-hidden="true">
          <Mark />
          <span className="back-title">En cartelera</span>
          <span className="back-stills">
            {services.slice(0, 3).map((item) => (
              <span key={item.id} className="back-still">
                <span>{String(item.order).padStart(2, '0')}</span>
                <span>{item.name.toUpperCase()}</span>
              </span>
            ))}
          </span>
          <span className="back-block is-starring">
            <span className="back-label">Servicios</span>
            {services.map((item) => item.name).join(' · ')}
          </span>
          <span className="back-block is-honours">
            <span className="back-label">Enfoque</span>
            Operación ordenada en un solo lugar · Herramientas propias adaptadas al equipo · Flujos automáticos sin
            reprocesos · Sistemas y datos conectados
          </span>
          <span className="back-sticker">Disponible para nuevos proyectos</span>
          <span className="back-credits">
            {brandName} Home Video presenta una producción {brandName} · {services.map((item) => item.name).join(', ')}{' '}
            · desarrollo y diseño {brandName} · © {siteConfig.edition} {brandName} Home Video · todos los derechos
            reservados · queda prohibida la copia, alquiler o emisión no autorizada de este catálogo
          </span>
          <span className="back-barcode">
            <svg viewBox="0 0 98 40" preserveAspectRatio="none" aria-hidden="true">
              <rect width="98" height="40" fill="#fff" />
              {BARCODE.map((bar) => (
                <rect key={bar.x} x={bar.x} y="3" width={bar.w} height="28" fill="#000" />
              ))}
            </svg>
            <span>0 26 2026 0308 4</span>
          </span>
          <span className="back-specs">
            <span>Color</span>
            <span>Hi-Fi Stereo</span>
            <span>NTSC</span>
          </span>
          <VhsBadge className="back-vhs" />
          <canvas ref={wearBackRef} className="sleeve-wear" width={COVER_PX_W} height={COVER_PX_H} />
        </div>

        <span className="sleeve-side is-left" aria-hidden="true">
          <span>{brandName} · Home Video</span>
        </span>
        <span className="sleeve-side is-right" aria-hidden="true">
          <span>{brandName} · Home Video</span>
        </span>
      </div>
    </div>
  );
}
