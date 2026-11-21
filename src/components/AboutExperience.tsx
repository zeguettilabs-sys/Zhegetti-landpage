import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { siteConfig } from '../config/site';
import { brandName, brandTagline, commonCopy, formatOrderFraction, services } from '../data/services';
import { ProfileSleeve, SLEEVE_H, SLEEVE_W } from './ProfileSleeve';

/**
 * /nosotros como el perfil de Arc: una funda de VHS en 3D y, debajo, un carrete de
 * texto sin fin. Con la rueda (o el dedo) el carrete corre en bucle, la funda crece
 * y gira, y las lineas que pasan por su altura se abren hacia los lados para rodearla.
 */

const SMALL = 0.4; // tamaño de la funda en reposo, respecto al completo
const COPIES = 3;
const SPRING = 7;

interface Metrics {
  W: number;
  H: number;
  u: number;
  narrow: boolean;
  fullH: number;
  s: number;
  restTop: number;
  padTop: number;
  contentW: number;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const smooth = (e: number) => e * e * (3 - 2 * e);

function springTo(x: number, v: number, target: number, dt: number, k = SPRING) {
  const o = x - target;
  const decay = Math.exp(-k * dt);
  const s = v + k * o;
  return { x: target + (o + s * dt) * decay, v: (v - s * k * dt) * decay };
}

function computeMetrics(W: number, H: number): Metrics {
  const narrow = W < 700;
  const u = narrow ? clamp(W / 820, 0.45, 1) : clamp(Math.min(W / 1728, (H + 250) / 1117), 0.5, 1);
  const fullH = narrow ? Math.min(H * 0.55, 863 * u * 0.5) : Math.min(H * 0.8, 863 * u * 0.72);
  const padTop = 10;
  return {
    W,
    H,
    u,
    narrow,
    fullH,
    s: fullH / SLEEVE_H,
    restTop: (H - fullH) / 2,
    padTop,
    contentW: narrow ? W - 32 : 967 * u,
  };
}

function Line({ children, shove = true }: { children: ReactNode; shove?: boolean }) {
  return <li className={shove ? 'prof-line' : undefined}>{children}</li>;
}

function Col({
  label,
  side,
  className,
  children,
}: {
  label: string;
  side: 'left' | 'right';
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`prof-col${className ? ` ${className}` : ''}`} data-side={side}>
      <h2 className="prof-line">[ {label} ]</h2>
      <ul>{children}</ul>
    </section>
  );
}

function Role({ label, value }: { label: string; value: string }) {
  return (
    <span className="prof-role">
      <span>{label}</span>
      <span className="prof-leader" aria-hidden="true" />
      <span>{value}</span>
    </span>
  );
}

function Arrow() {
  return <span className="prof-arrow">[↗]</span>;
}

/** Un ciclo del carrete; se repite 3 veces para que el bucle no tenga costura. */
function Loop() {
  const contacts: { label: string; href: string; external: boolean }[] = [];
  if (siteConfig.email) contacts.push({ label: 'CORREO', href: `mailto:${siteConfig.email}`, external: false });
  if (siteConfig.whatsappUrl) contacts.push({ label: 'WHATSAPP', href: siteConfig.whatsappUrl, external: true });

  return (
    <>
      <div className="prof-intro">
        <p className="prof-intro__text" data-crt-line>
          {brandTagline}
        </p>
      </div>

      <div className="prof-pair">
        <Col label="SOLUCIONES" side="left">
          {services.map((item) => (
            <Line key={item.id}>
              <Link to={item.path} className="prof-link">
                {formatOrderFraction(item.order)} {item.name.toUpperCase()}
                <Arrow />
              </Link>
            </Line>
          ))}
        </Col>
        <Col label="CÓMO LO HACEMOS" side="right">
          {commonCopy.process.map((step, idx) => (
            <Line key={step.title}>
              <span className="prof-step">{String(idx + 1).padStart(2, '0')} · {step.title.toUpperCase()}</span>
              <span className="prof-step-sub">{step.description}</span>
            </Line>
          ))}
        </Col>
      </div>

      <div className="prof-pair">
        <Col label="ENFOQUE" side="left">
          <Line>OPERACIÓN ORDENADA EN UN SOLO LUGAR</Line>
          <Line>HERRAMIENTAS PROPIAS ADAPTADAS AL EQUIPO</Line>
          <Line>FLUJOS AUTOMÁTICOS SIN REPROCESOS</Line>
          <Line>SISTEMAS Y DATOS CONECTADOS</Line>
        </Col>
        <Col label="DATOS" side="right" className="is-roles">
          <Line>
            <Role label="MARCA" value={brandName.toUpperCase()} />
          </Line>
          <Line>
            <Role label="UBICACIÓN" value={siteConfig.locationLabel.toUpperCase()} />
          </Line>
          <Line>
            <Role label="EDICIÓN" value={siteConfig.edition} />
          </Line>
          <Line>
            <Role label="ESTADO" value="DISPONIBLE" />
          </Line>
        </Col>
      </div>

      <div className="prof-pair">
        <Col label="CONTACTO" side="left">
          <Line>
            <Link to="/contacto" className="prof-link">
              ESCRÍBENOS
              <Arrow />
            </Link>
          </Line>
          {contacts.map((item) => (
            <Line key={item.label}>
              <a
                href={item.href}
                {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className="prof-link"
              >
                {item.label}
                <Arrow />
              </a>
            </Line>
          ))}
        </Col>
        <Col label="SIGUE EXPLORANDO" side="right">
          <Line>
            <Link to="/" className="prof-link">
              VER SERVICIOS
              <Arrow />
            </Link>
          </Line>
          <Line>
            <Link to="/" className="prof-link">
              VOLVER AL INICIO
              <Arrow />
            </Link>
          </Line>
        </Col>
      </div>
    </>
  );
}

interface LineBox {
  el: HTMLElement;
  x: number;
  y: number;
  w: number;
  h: number;
  left: boolean;
  shove: boolean;
}

export function AboutExperience() {
  const stageRef = useRef<HTMLElement | null>(null);
  const reelRef = useRef<HTMLDivElement | null>(null);
  const [m, setM] = useState<Metrics>(() => computeMetrics(1200, 600));
  const metricsRef = useRef(m);
  const relayoutRef = useRef<() => void>(() => undefined);

  // Tamaño del escenario
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const read = () => {
      const r = stage.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        const next = computeMetrics(r.width, r.height);
        metricsRef.current = next;
        setM(next);
      }
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  // Con medidas nuevas hay que volver a medir cada linea
  useLayoutEffect(() => {
    metricsRef.current = m;
    relayoutRef.current();
  }, [m]);

  // Carrete: desplazamiento con resorte, bucle y lineas que rodean la funda
  useEffect(() => {
    const stage = stageRef.current;
    const reel = reelRef.current;
    const sleeve = stage?.querySelector<HTMLElement>('.prof-sleeve');
    if (!stage || !reel || !sleeve) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let pos = 0;
    let vel = 0;
    let target = 0;
    let last = 0;
    let raf = 0;
    let loopH = 1;
    let boxes: LineBox[] = [];
    let intro: LineBox[] = [];
    let screen = { l: 0, t: 0, w: 1, h: 1, stageL: 0, stageT: 0 };
    let touchY: number | null = null;
    let touchV = 0;
    let touchT = 0;

    const clearStyles = (el: HTMLElement) => {
      el.style.transform = '';
      el.style.translate = '';
      el.style.rotate = '';
      el.style.scale = '';
    };

    const layout = () => {
      reel.style.transform = '';
      sleeve.style.translate = '';
      sleeve.style.scale = '';
      const lines = [...reel.querySelectorAll<HTMLElement>('.prof-line, [data-crt-line]')];
      lines.forEach(clearStyles);

      const sr = stage.getBoundingClientRect();
      const scr = (stage.closest('.crt-screen') ?? stage).getBoundingClientRect();
      const left = Math.max(0, scr.left);
      const top = Math.max(0, scr.top);
      const right = Math.min(window.innerWidth, scr.right);
      const bottom = Math.min(window.innerHeight, scr.bottom);
      screen = {
        l: left,
        t: top,
        w: Math.max(1, right - left),
        h: Math.max(1, bottom - top),
        stageL: sr.left,
        stageT: sr.top,
      };

      loopH = reel.firstElementChild instanceof HTMLElement ? reel.firstElementChild.offsetHeight || 1 : 1;
      const all = lines.map<LineBox>((el) => {
        const r = el.getBoundingClientRect();
        const shove = el.classList.contains('prof-line');
        return {
          el,
          x: r.left - sr.left,
          y: r.top - sr.top,
          w: r.width,
          h: r.height,
          left: el.closest('[data-side]')?.getAttribute('data-side') === 'left',
          shove,
        };
      });
      boxes = all.filter((b) => b.shove);
      intro = all.filter((b) => !b.shove);
      draw();
    };

    const draw = () => {
      const mt = metricsRef.current;
      const t = ((pos % loopH) + loopH) % loopH;
      reel.style.transform = `translate3d(0, ${-t}px, 0)`;

      const travel = Math.max(1, 0.55 * mt.H);
      const p = smooth(Math.min(1, Math.abs(pos) / travel));
      const n = SMALL + (1 - SMALL) * p;
      const r = (mt.padTop - mt.restTop) * (1 - p);
      sleeve.style.translate = p < 1 ? `0 ${r.toFixed(1)}px` : '';
      sleeve.style.scale = p < 1 ? n.toFixed(4) : '';

      const sw = SLEEVE_W * mt.s * n;
      const sh = mt.fullH * n;
      const cx = mt.W / 2;
      const sl = cx - sw / 2;
      const sRight = cx + sw / 2;
      const cy = mt.restTop + r + sh / 2;
      const half = sh / 2;
      const gap = 0.07 * sw;
      const feather = 0.22 * sh;

      // Curvatura del tubo, la misma formula que el resto del HTML
      const k = window.innerWidth < 740 ? 0.025 : 0.04;
      const lite = document.documentElement.classList.contains('lite');
      const bend = (b: LineBox, dx: number, y: number) => {
        if (lite) return;
        const vx = screen.stageL + b.x + dx + b.w / 2;
        const vy = screen.stageT + y + b.h / 2;
        const nx = clamp((vx - (screen.l + screen.w / 2)) / (screen.w / 2), -1.1, 1.1);
        const ny = clamp((vy - (screen.t + screen.h / 2)) / (screen.h / 2), -1.1, 1.1);
        const bx = -k * nx * ny * ny * (screen.w / 2);
        const by = -k * ny * nx * nx * (screen.h / 2);
        const angle = Math.atan((-2 * k * nx * ny * (screen.h / 2)) / (screen.w / 2)) * (180 / Math.PI);
        const sc = 1 - k * 0.5 * (nx * nx + ny * ny);
        b.el.style.translate = `${bx.toFixed(2)}px ${by.toFixed(2)}px`;
        b.el.style.rotate = `${angle.toFixed(3)}deg`;
        b.el.style.scale = sc.toFixed(4);
      };

      for (const b of boxes) {
        const y = b.y - t;
        if (y > mt.H + 80 || y + b.h < -80) {
          if (b.el.style.transform || b.el.style.translate) clearStyles(b.el);
          continue;
        }
        const f = smooth(clamp((half + feather - Math.abs(y + b.h / 2 - cy)) / feather, 0, 1));
        const dx = ((b.left ? sl - gap - b.w : sRight + gap) - b.x) * f;
        b.el.style.transform = f ? `translate3d(${dx.toFixed(1)}px, 0, 0)` : '';
        bend(b, f ? dx : 0, y);
      }
      for (const b of intro) {
        const y = b.y - t;
        if (y > mt.H + 80 || y + b.h < -80) {
          if (b.el.style.translate) clearStyles(b.el);
          continue;
        }
        bend(b, 0, y);
      }
    };

    const frame = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const s = springTo(pos, vel, target, dt);
      pos = s.x;
      vel = s.v;
      if (Math.abs(target - pos) < 0.1 && Math.abs(vel) < 1) {
        pos = target;
        vel = 0;
      }
      draw();
      raf = pos !== target ? requestAnimationFrame(frame) : 0;
    };

    const push = (delta: number) => {
      if (!delta) return;
      target += delta;
      if (reduced) {
        pos = target;
        draw();
      } else if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };

    const onWheel = (e: WheelEvent) => {
      const d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      push(e.deltaMode === 1 ? d * 16 : d);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const page = metricsRef.current.H * 0.8;
      const map: Record<string, number> = { ArrowDown: 140, ArrowUp: -140, PageDown: page, PageUp: -page };
      if (e.key in map) {
        e.preventDefault();
        push(map[e.key]);
      }
    };
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0].clientY;
      touchV = 0;
      touchT = performance.now();
    };
    const onTouchMove = (e: TouchEvent) => {
      if (touchY === null) return;
      const y = e.touches[0].clientY;
      const now = performance.now();
      touchV = 0.6 * touchV + ((touchY - y) / Math.max(8, now - touchT)) * 400;
      touchT = now;
      push(touchY - y);
      touchY = y;
    };
    const onTouchEnd = () => {
      if (touchY !== null && performance.now() - touchT < 80) push(0.325 * touchV);
      touchY = null;
    };

    relayoutRef.current = layout;
    layout();
    const late = window.setTimeout(layout, 1100);
    void document.fonts?.ready.then(layout).catch(() => undefined);

    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('keydown', onKey);
    stage.addEventListener('touchstart', onTouchStart, { passive: true });
    stage.addEventListener('touchmove', onTouchMove, { passive: true });
    stage.addEventListener('touchend', onTouchEnd);
    return () => {
      relayoutRef.current = () => undefined;
      window.clearTimeout(late);
      cancelAnimationFrame(raf);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      stage.removeEventListener('touchstart', onTouchStart);
      stage.removeEventListener('touchmove', onTouchMove);
      stage.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  const setStage = useCallback((node: HTMLElement | null) => {
    stageRef.current = node;
  }, []);

  const style = {
    '--u': `${m.u}px`,
    '--s': `${m.s}px`,
    '--content-w': `${m.contentW}px`,
    '--pad-top': `${m.padTop}px`,
    '--intro-top': `${SMALL * m.fullH + 14 * m.u}px`,
    '--type': `${Math.max(m.narrow ? 14 : 17, 21 * m.u)}px`,
    '--type-s': `${Math.max(m.narrow ? 13 : 15, 18.5 * m.u)}px`,
    '--sleeve-w': `${SLEEVE_W * m.s}px`,
    '--side': `${Math.max(72, (m.W - SLEEVE_W * m.s) / 2 - 8 - 0.07 * SLEEVE_W * m.s)}px`,
    '--sleeve-h': `${m.fullH}px`,
    '--sleeve-top': `${m.restTop}px`,
  } as CSSProperties;

  return (
    <section ref={setStage} id="nosotros" className="prof" aria-label={`Nosotros — ${brandName}`} style={style}>
      <h1 className="sr-only">Nosotros — {brandName}</h1>
      <div className="prof-text" data-crt-warp="off">
        <div ref={reelRef} className="prof-reel">
          {Array.from({ length: COPIES }, (_, i) => (
            <div key={i} className={`prof-loop${i ? ' is-copy' : ''}`} aria-hidden={i ? true : undefined} inert={i > 0}>
              <Loop />
            </div>
          ))}
        </div>
      </div>
      <ProfileSleeve />
    </section>
  );
}
