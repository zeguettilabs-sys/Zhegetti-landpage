import { services, type ServiceItem } from '../data/services';
import { renderCoverCanvas } from './vhsTextures';

/**
 * Tarjetas de la vitrina. Todavia no hay proyectos reales publicados, asi que las
 * pantallas son ilustraciones dibujadas aqui y van marcadas como "ILUSTRATIVO".
 * Para mostrar trabajos reales basta reemplazar `canvas` por una captura.
 */
export interface ShowcaseCard {
  id: string;
  title: string;
  caption: string;
  tag: string;
  canvas: HTMLCanvasElement;
  /** ancho / alto */
  aspect: number;
}

type Kind = 'dashboard' | 'portal' | 'workflow' | 'integrations' | 'table' | 'form' | 'phone' | 'kanban' | 'logs';

interface Theme {
  ink: string;
  soft: string;
  paper: string;
}

const THEMES: Record<string, Theme> = {
  'sistemas-a-medida': { ink: '#C8323A', soft: '#E25359', paper: '#1A1111' },
  'aplicaciones-web': { ink: '#C49A2E', soft: '#D9B451', paper: '#17140C' },
  automatizacion: { ink: '#5B4FD1', soft: '#8378E8', paper: '#110F1C' },
  'integraciones-apis': { ink: '#8E9C38', soft: '#AEBB57', paper: '#12140B' },
  'landing-pages': { ink: '#2F9C98', soft: '#4FC2BD', paper: '#0C1716' },
};

function seeded(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 0x7fffffff) / 0x7fffffff;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

interface Palette {
  bg: string;
  panel: string;
  line: string;
  text: string;
  mute: string;
  ink: string;
}

function palette(theme: Theme, light: boolean): Palette {
  return light
    ? { bg: '#eef0f3', panel: '#ffffff', line: '#d6dae0', text: '#16181c', mute: '#8b919b', ink: theme.ink }
    : { bg: '#1c1c1e', panel: '#262628', line: '#3a3a3d', text: '#f1ede6', mute: '#9a968f', ink: theme.soft };
}

function textBars(ctx: CanvasRenderingContext2D, p: Palette, x: number, y: number, w: number, rows: number, rand: () => number) {
  for (let i = 0; i < rows; i += 1) {
    ctx.fillStyle = i === 0 ? p.text : p.mute;
    ctx.globalAlpha = i === 0 ? 0.9 : 0.45;
    roundRect(ctx, x, y + i * 16, w * (i === 0 ? 0.62 : 0.5 + rand() * 0.45), i === 0 ? 9 : 6, 3);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function chrome(ctx: CanvasRenderingContext2D, p: Palette, w: number, label: string) {
  ctx.fillStyle = p.panel;
  ctx.fillRect(0, 0, w, 44);
  ctx.fillStyle = p.line;
  ctx.fillRect(0, 44, w, 1);
  ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(24 + i * 20, 22, 6, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = p.bg;
  roundRect(ctx, 120, 11, w - 240, 22, 11);
  ctx.fill();
  ctx.fillStyle = p.mute;
  ctx.font = '13px "VT323", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(label, w / 2, 27);
  ctx.textAlign = 'left';
}

function drawScreen(kind: Kind, theme: Theme, light: boolean, label: string, seed: number): HTMLCanvasElement {
  const phone = kind === 'phone';
  const w = phone ? 420 : 800;
  const h = phone ? 760 : kind === 'form' || kind === 'logs' ? 560 : 500;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const rand = seeded(seed);
  const p = palette(theme, light);

  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, w, h);
  const top = phone ? 56 : 45;
  if (phone) {
    ctx.fillStyle = p.panel;
    ctx.fillRect(0, 0, w, top);
    ctx.fillStyle = p.text;
    ctx.font = '22px "Bodoni Moda", Georgia, serif';
    ctx.fillText('Zeguetti', 24, 36);
    ctx.fillStyle = theme.ink;
    ctx.fillRect(w - 56, 20, 32, 4);
    ctx.fillRect(w - 56, 28, 32, 4);
  } else {
    chrome(ctx, p, w, label);
  }

  const gap = 18;
  const panel = (x: number, y: number, pw: number, ph: number) => {
    ctx.fillStyle = p.panel;
    roundRect(ctx, x, y, pw, ph, 10);
    ctx.fill();
    ctx.strokeStyle = p.line;
    ctx.lineWidth = 1;
    ctx.stroke();
  };
  const heading = (text: string, x: number, y: number) => {
    ctx.fillStyle = p.text;
    ctx.font = '36px "Bodoni Moda", Georgia, serif';
    ctx.fillText(text, x, y);
  };
  const bars = (x: number, y: number, bw: number, bh: number, n: number) => {
    const col = (bw - (n - 1) * 8) / n;
    for (let i = 0; i < n; i += 1) {
      const v = 0.25 + rand() * 0.75;
      ctx.fillStyle = i === n - 2 ? theme.ink : p.line;
      roundRect(ctx, x + i * (col + 8), y + bh * (1 - v), col, bh * v, 4);
      ctx.fill();
    }
  };
  const line = (x: number, y: number, lw: number, lh: number) => {
    ctx.strokeStyle = theme.ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i <= 12; i += 1) {
      const px = x + (lw / 12) * i;
      const py = y + lh * (0.2 + rand() * 0.7);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  };

  if (kind === 'dashboard' || kind === 'table') {
    heading(kind === 'dashboard' ? 'Operación' : 'Pedidos', 28, top + 56);
    const kw = (w - 56 - 2 * gap) / 3;
    [0, 1, 2].forEach((i) => {
      panel(28 + i * (kw + gap), top + 78, kw, 78);
      ctx.fillStyle = p.mute;
      roundRect(ctx, 44 + i * (kw + gap), top + 96, 56, 6, 3);
      ctx.fill();
      ctx.fillStyle = i === 1 ? theme.ink : p.text;
      ctx.font = '34px "VT323", monospace';
      ctx.fillText(['128', '96%', '24'][i], 44 + i * (kw + gap), top + 140);
    });
    if (kind === 'dashboard') {
      panel(28, top + 174, w * 0.58, h - top - 202);
      bars(48, top + 196, w * 0.58 - 40, h - top - 250, 9);
      panel(28 + w * 0.58 + gap, top + 174, w - 56 - w * 0.58 - gap, h - top - 202);
      line(28 + w * 0.58 + gap + 16, top + 196, w - 56 - w * 0.58 - gap - 32, h - top - 250);
    } else {
      panel(28, top + 174, w - 56, h - top - 202);
      for (let i = 0; i < 6; i += 1) {
        const y = top + 196 + i * 40;
        ctx.fillStyle = i === 2 ? theme.ink : p.line;
        ctx.globalAlpha = i === 2 ? 0.22 : 0.5;
        ctx.fillRect(40, y, w - 80, 30);
        ctx.globalAlpha = 1;
        textBars(ctx, p, 52, y + 9, 220, 1, rand);
        ctx.fillStyle = p.mute;
        roundRect(ctx, w * 0.55, y + 12, 90, 6, 3);
        ctx.fill();
        ctx.fillStyle = theme.ink;
        roundRect(ctx, w - 130, y + 8, 70, 14, 7);
        ctx.fill();
      }
    }
  } else if (kind === 'portal' || kind === 'phone') {
    const px = 28;
    const pw = w - 56;
    ctx.fillStyle = theme.ink;
    ctx.globalAlpha = light ? 0.14 : 0.2;
    roundRect(ctx, px, top + 20, pw, phone ? 240 : 170, 12);
    ctx.fill();
    ctx.globalAlpha = 1;
    heading(phone ? 'Tu portal' : 'Tu negocio, en línea', px + 20, top + (phone ? 90 : 84));
    textBars(ctx, p, px + 20, top + (phone ? 116 : 104), pw * 0.6, 3, rand);
    ctx.fillStyle = theme.ink;
    roundRect(ctx, px + 20, top + (phone ? 190 : 146), 120, 30, 15);
    ctx.fill();
    const cols = phone ? 2 : 3;
    const cw = (pw - (cols - 1) * gap) / cols;
    const ch = phone ? 150 : 150;
    const rows = phone ? 3 : 1;
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const x = px + c * (cw + gap);
        const y = top + (phone ? 276 : 214) + r * (ch + gap);
        panel(x, y, cw, ch);
        ctx.fillStyle = theme.ink;
        ctx.globalAlpha = 0.5;
        roundRect(ctx, x + 14, y + 14, cw - 28, ch * 0.42, 8);
        ctx.fill();
        ctx.globalAlpha = 1;
        textBars(ctx, p, x + 14, y + ch * 0.42 + 30, cw - 28, 2, rand);
      }
    }
  } else if (kind === 'workflow' || kind === 'kanban') {
    heading(kind === 'workflow' ? 'Flujo automático' : 'Tareas', 28, top + 56);
    if (kind === 'workflow') {
      const nodes = [
        [90, 250],
        [290, 170],
        [290, 340],
        [510, 250],
        [700, 250],
      ];
      ctx.strokeStyle = theme.ink;
      ctx.lineWidth = 3;
      [
        [0, 1],
        [0, 2],
        [1, 3],
        [2, 3],
        [3, 4],
      ].forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(nodes[a][0] + 40, nodes[a][1]);
        ctx.bezierCurveTo(nodes[a][0] + 120, nodes[a][1], nodes[b][0] - 120, nodes[b][1], nodes[b][0] - 40, nodes[b][1]);
        ctx.stroke();
      });
      nodes.forEach(([x, y], i) => {
        panel(x - 40, y - 28, 80, 56);
        ctx.fillStyle = i === 3 ? theme.ink : p.line;
        ctx.beginPath();
        ctx.arc(x - 18, y, 8, 0, Math.PI * 2);
        ctx.fill();
        textBars(ctx, p, x - 4, y - 8, 36, 2, rand);
      });
    } else {
      const cw = (w - 56 - 2 * gap) / 3;
      [0, 1, 2].forEach((c) => {
        panel(28 + c * (cw + gap), top + 78, cw, h - top - 106);
        for (let r = 0; r < 3 - (c === 2 ? 1 : 0); r += 1) {
          const y = top + 100 + r * 96;
          ctx.fillStyle = p.bg;
          roundRect(ctx, 40 + c * (cw + gap), y, cw - 24, 80, 8);
          ctx.fill();
          ctx.fillStyle = theme.ink;
          ctx.globalAlpha = c === 1 ? 1 : 0.5;
          ctx.fillRect(40 + c * (cw + gap), y, 4, 80);
          ctx.globalAlpha = 1;
          textBars(ctx, p, 56 + c * (cw + gap), y + 16, cw - 70, 3, rand);
        }
      });
    }
  } else if (kind === 'integrations') {
    heading('Conexiones', 28, top + 56);
    const cx = w / 2;
    const cy = top + (h - top) / 2 + 24;
    ctx.strokeStyle = p.line;
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(a) * 250;
      const y = cy + Math.sin(a) * 140;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x, y);
      ctx.stroke();
      panel(x - 56, y - 26, 112, 52);
      ctx.fillStyle = i % 2 ? theme.ink : p.line;
      ctx.beginPath();
      ctx.arc(x - 32, y, 8, 0, Math.PI * 2);
      ctx.fill();
      textBars(ctx, p, x - 14, y - 8, 54, 2, rand);
    }
    ctx.fillStyle = theme.ink;
    ctx.beginPath();
    ctx.arc(cx, cy, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = light ? '#fff' : '#111';
    ctx.font = '40px "VT323", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('API', cx, cy + 12);
    ctx.textAlign = 'left';
  } else if (kind === 'form') {
    heading('Nueva solicitud', 28, top + 56);
    panel(28, top + 80, w - 56, h - top - 108);
    for (let i = 0; i < 4; i += 1) {
      const y = top + 108 + i * 72;
      ctx.fillStyle = p.mute;
      ctx.globalAlpha = 0.6;
      roundRect(ctx, 52, y, 90, 6, 3);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = p.line;
      ctx.lineWidth = 1.5;
      roundRect(ctx, 52, y + 14, w - 104, 34, 6);
      ctx.stroke();
    }
    ctx.fillStyle = theme.ink;
    roundRect(ctx, 52, h - 84, 150, 38, 19);
    ctx.fill();
  } else {
    heading('Registro', 28, top + 56);
    panel(28, top + 80, w - 56, h - top - 108);
    for (let i = 0; i < 10; i += 1) {
      const y = top + 104 + i * 38;
      ctx.fillStyle = i === 4 ? theme.ink : p.mute;
      ctx.globalAlpha = i === 4 ? 1 : 0.55;
      ctx.font = '18px "VT323", monospace';
      ctx.fillText(`${String(10 + i).padStart(2, '0')}:${String(Math.floor(rand() * 60)).padStart(2, '0')}  OK  ${['sync', 'pedido', 'factura', 'stock', 'aviso'][i % 5]}`, 50, y + 14);
      ctx.globalAlpha = 1;
    }
  }

  // Borde claro para que ninguna pantalla se pierda contra el fondo
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, w - 4, h - 4);

  // Desgaste de pantalla: lineas de barrido muy suaves
  ctx.fillStyle = 'rgba(0,0,0,0.05)';
  for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 1);
  return canvas;
}

const SCREEN_VARIANTS: { kind: Kind; light: boolean; label: string }[][] = [
  [
    { kind: 'dashboard', light: false, label: 'panel.zeguetti.app' },
    { kind: 'table', light: true, label: 'pedidos.zeguetti.app' },
    { kind: 'logs', light: false, label: 'registro.zeguetti.app' },
    { kind: 'kanban', light: true, label: 'equipo.zeguetti.app' },
    { kind: 'phone', light: false, label: 'm.zeguetti.app' },
  ],
  [
    { kind: 'portal', light: true, label: 'tuempresa.com' },
    { kind: 'phone', light: false, label: 'm.tuempresa.com' },
    { kind: 'form', light: true, label: 'solicitudes.tuempresa.com' },
    { kind: 'dashboard', light: true, label: 'cuenta.tuempresa.com' },
    { kind: 'table', light: false, label: 'catalogo.tuempresa.com' },
  ],
  [
    { kind: 'workflow', light: false, label: 'flujos.zeguetti.app' },
    { kind: 'kanban', light: true, label: 'tareas.zeguetti.app' },
    { kind: 'form', light: false, label: 'alta.zeguetti.app' },
    { kind: 'logs', light: true, label: 'ejecuciones.zeguetti.app' },
  ],
  [
    { kind: 'integrations', light: true, label: 'conexiones.zeguetti.app' },
    { kind: 'workflow', light: true, label: 'sincronizacion.zeguetti.app' },
    { kind: 'portal', light: false, label: 'api.zeguetti.app' },
    { kind: 'phone', light: true, label: 'm.conexiones.app' },
  ],
  [
    { kind: 'portal', light: true, label: 'tumarca.com' },
    { kind: 'phone', light: true, label: 'm.tumarca.com' },
  ],
];

let cached: Promise<ShowcaseCard[]> | null = null;

/** Genera (una sola vez) las tarjetas: una caratula por servicio y pantallas ilustrativas. */
export function buildShowcaseCards(): Promise<ShowcaseCard[]> {
  if (cached) return cached;
  cached = (async () => {
    await document.fonts?.ready;
    const covers = await Promise.all(
      services.map(async (service: ServiceItem) => {
        const canvas = await renderCoverCanvas(service, { scale: 1.6 });
        return {
          id: `cover-${service.id}`,
          title: service.name,
          caption: `${String(service.order).padStart(2, '0')} / ${String(services.length).padStart(2, '0')} · ${service.category}`,
          tag: 'CARÁTULA',
          canvas,
          aspect: canvas.width / canvas.height,
        } satisfies ShowcaseCard;
      })
    );

    const screens: ShowcaseCard[] = [];
    services.forEach((service, si) => {
      const theme = THEMES[service.id] ?? THEMES['sistemas-a-medida'];
      (SCREEN_VARIANTS[si] ?? []).forEach((variant, vi) => {
        const canvas = drawScreen(variant.kind, theme, variant.light, variant.label, 7919 * (si + 1) + vi * 131);
        screens.push({
          id: `screen-${service.id}-${vi}`,
          title: service.name,
          caption: variant.label,
          tag: 'ILUSTRATIVO',
          canvas,
          aspect: canvas.width / canvas.height,
        });
      });
    });

    // Intercala caratulas y pantallas para que no se agrupen en el globo
    const out: ShowcaseCard[] = [];
    let s = 0;
    const count = screens.length + covers.length;
    for (let i = 0; i < count; i += 1) {
      if (i % 3 === 1 && covers.length) out.push(covers.shift()!);
      else out.push(screens[s++] ?? covers.shift()!);
    }
    return out.filter(Boolean);
  })().catch((err) => {
    cached = null;
    throw err;
  });
  return cached;
}

/** Titulares del teletipo: salen de los datos reales de la marca y van marcados como demo. */
export function tickerHeadlines(): string[] {
  return [
    ...services.map((s) => `[DEMO] ${s.name}: ${s.caption}`),
    '[DEMO] Zeguetti · Perú · Edición 2026',
    '[DEMO] Esta vitrina es ilustrativa: aquí irán los proyectos y novedades reales',
  ];
}
