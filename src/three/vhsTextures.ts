import { createElement } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import vt323Url from '@fontsource/vt323/files/vt323-latin-400-normal.woff2?url';
import bodoniUrl from '@fontsource/bodoni-moda/files/bodoni-moda-latin-700-normal.woff2?url';
import interUrl from '@fontsource/inter/files/inter-latin-700-normal.woff2?url';
import { VhsFrontSvg } from '../components/VhsCover';
import type { ServiceItem } from '../data/services';

/** Coordenadas del frente de la caratula (mismo viewBox que el SVG del DOM). */
export const COVER_VIEWBOX = { w: 340, h: 500 } as const;

/**
 * Un SVG dibujado como <img> no ve las fuentes del documento, asi que se le
 * incrustan las tres que usa la caratula como data URLs.
 */
let embeddedFontCss: Promise<string> | null = null;

async function toDataUrl(url: string): Promise<string> {
  const blob = await (await fetch(url)).blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function getEmbeddedFontCss(): Promise<string> {
  if (!embeddedFontCss) {
    embeddedFontCss = Promise.all([toDataUrl(vt323Url), toDataUrl(bodoniUrl), toDataUrl(interUrl)])
      .then(([vt323, bodoni, inter]) =>
        [
          `@font-face{font-family:'VT323';font-weight:400;src:url(${vt323}) format('woff2');}`,
          `@font-face{font-family:'Bodoni Moda';font-weight:700;src:url(${bodoni}) format('woff2');}`,
          `@font-face{font-family:'Inter';font-weight:700;src:url(${inter}) format('woff2');}`,
        ].join('')
      )
      .catch((err) => {
        embeddedFontCss = null;
        throw err;
      });
  }
  return embeddedFontCss;
}

function serializeCoverSvg(service: ServiceItem, fontCss: string): string {
  const host = document.createElement('div');
  const root = createRoot(host);
  flushSync(() => {
    root.render(createElement(VhsFrontSvg, { service, isActive: true, className: '' }));
  });
  const svg = host.querySelector('svg');
  if (!svg) {
    root.unmount();
    throw new Error('No se pudo generar el SVG de la caratula');
  }
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('width', String(COVER_VIEWBOX.w));
  svg.setAttribute('height', String(COVER_VIEWBOX.h));
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.textContent = fontCss;
  svg.insertBefore(style, svg.firstChild);
  const markup = new XMLSerializer().serializeToString(svg);
  root.unmount();
  return markup;
}

async function loadSvgImage(markup: string): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    await img.decode();
    return img;
  } finally {
    // La imagen decodificada ya no necesita la URL
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

/** Generador pseudoaleatorio con semilla: el desgaste es estable entre recargas. */
function seeded(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Rayones, polvo y bordes gastados de una caja de VHS que paso por muchas manos.
 * Se dibuja encima de la caratula para que la luz no la vea como un plastico nuevo.
 */
export function drawWear(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number) {
  const rand = seeded(seed);
  const unit = w / COVER_VIEWBOX.w;

  // Grano fino de impresion
  const grain = ctx.createImageData(w, h);
  for (let i = 0; i < grain.data.length; i += 4) {
    const v = rand() * 255;
    grain.data[i] = v;
    grain.data[i + 1] = v;
    grain.data[i + 2] = v;
    grain.data[i + 3] = rand() < 0.5 ? 9 : 0;
  }
  const grainCanvas = document.createElement('canvas');
  grainCanvas.width = w;
  grainCanvas.height = h;
  grainCanvas.getContext('2d')!.putImageData(grain, 0, 0);
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.drawImage(grainCanvas, 0, 0);
  ctx.restore();

  // Rayones finos en diagonal
  ctx.save();
  ctx.lineCap = 'round';
  for (let i = 0; i < 46; i += 1) {
    const x = rand() * w;
    const y = rand() * h;
    const len = (10 + rand() * 70) * unit;
    const ang = -0.5 + rand() * 1.0 + (rand() < 0.5 ? 0 : Math.PI / 2);
    ctx.strokeStyle = `rgba(238, 232, 218, ${0.025 + rand() * 0.06})`;
    ctx.lineWidth = (0.35 + rand() * 0.6) * unit;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    ctx.stroke();
  }
  ctx.restore();

  // Desgaste en esquinas y cantos: el carton se aclara donde se roza
  ctx.save();
  const corners: Array<[number, number]> = [
    [0, 0],
    [w, 0],
    [0, h],
    [w, h],
  ];
  for (const [cx, cy] of corners) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 34 * unit);
    g.addColorStop(0, 'rgba(225, 215, 196, 0.16)');
    g.addColorStop(1, 'rgba(225, 215, 196, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(cx - 40 * unit, cy - 40 * unit, 80 * unit, 80 * unit);
  }
  for (let i = 0; i < 22; i += 1) {
    const onVertical = rand() < 0.5;
    const along = rand();
    const len = (6 + rand() * 26) * unit;
    const thick = (0.8 + rand() * 1.6) * unit;
    ctx.fillStyle = `rgba(232, 224, 208, ${0.06 + rand() * 0.12})`;
    if (onVertical) {
      const x = rand() < 0.5 ? 1.5 * unit : w - 1.5 * unit - thick;
      ctx.fillRect(x, along * h, thick, len);
    } else {
      const y = rand() < 0.5 ? 1.5 * unit : h - 1.5 * unit - thick;
      ctx.fillRect(along * w, y, len, thick);
    }
  }
  ctx.restore();

  // Halo suave de luz impresa arriba, sombra abajo
  ctx.save();
  const v = ctx.createLinearGradient(0, 0, 0, h);
  v.addColorStop(0, 'rgba(255, 245, 230, 0.035)');
  v.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
  v.addColorStop(1, 'rgba(0, 0, 0, 0.18)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

export interface CoverCanvasOptions {
  scale: number;
}

/** Rasteriza la caratula de un servicio: SVG del DOM + desgaste + borde del estuche. */
export async function renderCoverCanvas(
  service: ServiceItem,
  { scale }: CoverCanvasOptions
): Promise<HTMLCanvasElement> {
  const fontCss = await getEmbeddedFontCss();
  const markup = serializeCoverSvg(service, fontCss);
  const img = await loadSvgImage(markup);

  const w = Math.round(COVER_VIEWBOX.w * scale);
  const h = Math.round(COVER_VIEWBOX.h * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#121212';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  drawWear(ctx, w, h, 20260 + service.order * 977);

  return canvas;
}

/** Frente del caset que asoma por arriba del estuche (equivale a .cover-cassette). */
export async function renderCassetteCanvas(code: string, scale = 3): Promise<HTMLCanvasElement> {
  try {
    await document.fonts.load('16px VT323');
  } catch {
    // Si la fuente no carga se usa la monoespaciada del sistema
  }

  const W = 280;
  const H = 76;
  const canvas = document.createElement('canvas');
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);

  const body = ctx.createLinearGradient(0, 0, 0, H);
  body.addColorStop(0, '#2d2d2d');
  body.addColorStop(0.52, '#181818');
  body.addColorStop(1, '#0d0d0d');
  ctx.fillStyle = body;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.fillRect(0, 0, W, 1);

  const pad = 9;
  const gripW = 30;
  const drawGrips = (x: number) => {
    roundedRectPath(ctx, x, pad, gripW, H - pad * 2, 3);
    ctx.fillStyle = '#121212';
    ctx.fill();
    ctx.save();
    ctx.clip();
    for (let gx = x; gx < x + gripW; gx += 5) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.09)';
      ctx.fillRect(gx, pad, 2, H - pad * 2);
    }
    ctx.restore();
    ctx.strokeStyle = '#363636';
    ctx.lineWidth = 1;
    roundedRectPath(ctx, x, pad, gripW, H - pad * 2, 3);
    ctx.stroke();
  };
  drawGrips(12);
  drawGrips(W - 12 - gripW);

  const winX = 12 + gripW + 10;
  const winW = W - winX * 2;
  roundedRectPath(ctx, winX, pad, winW, H - pad * 2, 5);
  const win = ctx.createRadialGradient(W / 2, H * 0.62, 2, W / 2, H * 0.62, winW * 0.6);
  win.addColorStop(0, '#1d1d1d');
  win.addColorStop(1, '#080808');
  ctx.fillStyle = win;
  ctx.fill();
  ctx.save();
  ctx.clip();

  // Bobina con cinta enrollada
  const cx = W / 2;
  const cy = H * 0.62;
  for (let r = 30; r > 9; r -= 2.5) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = Math.round(r) % 5 === 0 ? '#262626' : '#151515';
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, 30, 0, Math.PI * 2);
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 9, 0, Math.PI * 2);
  ctx.fillStyle = '#0e0e0e';
  ctx.fill();
  ctx.strokeStyle = '#cb343b';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Reflejo del vidrio de la ventana
  const glass = ctx.createLinearGradient(winX, 0, winX + winW, H);
  glass.addColorStop(0, 'rgba(255,255,255,0.07)');
  glass.addColorStop(0.35, 'rgba(255,255,255,0)');
  ctx.fillStyle = glass;
  ctx.fillRect(winX, 0, winW, H);
  ctx.restore();

  roundedRectPath(ctx, winX, pad, winW, H - pad * 2, 5);
  ctx.strokeStyle = '#3d3d3d';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.font = '14px VT323, ui-monospace, monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillStyle = '#e4dfd9';
  ctx.fillText(code, winX + winW - 7, pad + 3);

  return canvas;
}

/** Sombra de contacto suave bajo cada estuche. */
export function renderContactShadowCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.translate(128, 32);
  ctx.scale(1, 0.25);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 128);
  g.addColorStop(0, 'rgba(0,0,0,0.85)');
  g.addColorStop(0.55, 'rgba(0,0,0,0.35)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 128, 0, Math.PI * 2);
  ctx.fill();
  return canvas;
}
