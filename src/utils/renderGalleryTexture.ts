import { commonCopy, formatOrderFraction, type ServiceItem } from '../data/services';

function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (let i = 0; i < words.length; i += 1) {
    const testLine = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = words[i];
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, currentY);
    currentY += lineHeight;
  }
  return currentY;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number | number[]
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function drawMockupChrome(ctx: CanvasRenderingContext2D, title: string, W: number) {
  drawRoundedRect(ctx, 0, 0, W, 62, [16, 16, 0, 0]);
  ctx.fillStyle = '#D9D3CC';
  ctx.fill();

  ['#77716A', '#8D867E', '#8D867E'].forEach((c, idx) => {
    ctx.beginPath();
    ctx.arc(34 + idx * 22, 31, 6, 0, Math.PI * 2);
    ctx.fillStyle = c;
    ctx.fill();
  });

  ctx.fillStyle = '#48443F';
  ctx.font = '500 20px Inter, system-ui, sans-serif';
  ctx.fillText(title, 118, 38);
}

function drawOverviewCanvas(ctx: CanvasRenderingContext2D, service: ServiceItem, W: number, H: number) {
  ctx.fillStyle = '#E7E2DC';
  ctx.fillRect(0, 0, W, H);

  const titleMap: Record<ServiceItem['mockup'], string> = {
    dashboard: 'zeguetti / gestión empresarial',
    portal: 'zeguetti / portal de clientes',
    workflow: 'zeguetti / automatización de procesos',
    integrations: 'zeguetti / integraciones y APIs',
    landing: 'tumarca.com / landing page',
  };
  drawMockupChrome(ctx, titleMap[service.mockup], W);

  if (service.mockup === 'dashboard') {
    ctx.fillStyle = '#1B1B1B';
    ctx.fillRect(0, 62, 230, H - 62);

    ctx.fillStyle = '#E4DFD9';
    ctx.font = '400 26px VT323, monospace';
    ctx.fillText('Z / WORKSPACE', 28, 122);

    ['Resumen', 'Ventas', 'Inventario', 'Clientes', 'Reportes'].forEach((nav, idx) => {
      if (idx === 0) {
        drawRoundedRect(ctx, 20, 152, 190, 48, 8);
        ctx.fillStyle = '#CB343B';
        ctx.fill();
        ctx.fillStyle = '#FCF8EF';
      } else {
        ctx.fillStyle = '#AAA49C';
      }
      ctx.font = `${idx === 0 ? 600 : 400} 20px Inter, sans-serif`;
      ctx.fillText(nav, 36, 183 + idx * 64);
    });

    ctx.fillStyle = '#1D1C1A';
    ctx.font = '600 38px Inter, sans-serif';
    ctx.fillText('Toda tu operación, conectada.', 268, 128);
    ctx.fillStyle = '#6F6860';
    ctx.font = '400 20px Inter, sans-serif';
    ctx.fillText('Una vista clara para tomar decisiones.', 268, 162);

    [
      { label: 'VENTAS', val: '128' },
      { label: 'INVENTARIO', val: 'Actualizado' },
      { label: 'EQUIPO', val: 'Conectado' },
    ].forEach((kpi, idx) => {
      const kx = 268 + idx * 298;
      drawRoundedRect(ctx, kx, 184, 276, 108, 12);
      ctx.fillStyle = '#F4F0E9';
      ctx.fill();
      ctx.strokeStyle = '#C9C2B8';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#777067';
      ctx.font = '400 22px VT323, monospace';
      ctx.fillText(kpi.label, kx + 22, 220);
      ctx.fillStyle = '#27241F';
      ctx.font = '600 32px Inter, sans-serif';
      ctx.fillText(kpi.val, kx + 22, 268);
    });

    drawRoundedRect(ctx, 268, 310, 872, 184, 12);
    ctx.fillStyle = '#F4F0E9';
    ctx.fill();
    ctx.strokeStyle = '#CCC5BA';
    ctx.stroke();

    ctx.fillStyle = '#5F574E';
    ctx.font = '400 24px VT323, monospace';
    ctx.fillText('ACTIVIDAD DE TU NEGOCIO', 296, 348);

    const bars = [40, 60, 48, 74, 54, 88, 70, 100, 84, 114, 104, 122];
    bars.forEach((bh, idx) => {
      ctx.fillStyle = idx >= 8 ? '#CB343B' : '#B5AEA3';
      drawRoundedRect(ctx, 304 + idx * 68, 476 - bh, 40, bh, 4);
      ctx.fill();
    });

    ctx.fillStyle = '#302C27';
    ctx.font = '600 22px Inter, sans-serif';
    ctx.fillText('Pedidos recientes', 268, 534);
    [
      ['Pedido registrado', 'En proceso'],
      ['Stock actualizado', 'Listo'],
      ['Reporte de ventas', 'Disponible'],
    ].forEach(([left, right], idx) => {
      const ry = 574 + idx * 38;
      ctx.strokeStyle = '#C9C1B7';
      ctx.beginPath();
      ctx.moveTo(268, ry - 24);
      ctx.lineTo(1140, ry - 24);
      ctx.stroke();
      ctx.fillStyle = '#514A42';
      ctx.font = '400 18px Inter, sans-serif';
      ctx.fillText(left, 274, ry);
      ctx.fillStyle = '#7C302F';
      ctx.font = '600 18px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(right, 1134, ry);
      ctx.textAlign = 'left';
    });
  } else if (service.mockup === 'portal') {
    ctx.fillStyle = '#26211C';
    ctx.font = '700 26px Inter, sans-serif';
    ctx.fillText('TU EMPRESA', 54, 128);
    ctx.fillStyle = '#6F675F';
    ctx.font = '400 20px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Mi cuenta', W - 54, 126);
    ctx.textAlign = 'left';

    ctx.strokeStyle = '#C6BEB3';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(54, 152);
    ctx.lineTo(W - 54, 152);
    ctx.stroke();

    ctx.fillStyle = '#26211C';
    ctx.font = '600 44px Inter, sans-serif';
    ctx.fillText('Todo lo que necesitas, en un solo lugar.', 54, 218);
    ctx.fillStyle = '#7A7167';
    ctx.font = '400 22px Inter, sans-serif';
    ctx.fillText('Gestiona tus solicitudes desde cualquier dispositivo.', 54, 256);

    [
      ['Mis pedidos', 'Consulta estados y entregas'],
      ['Documentos', 'Tus archivos, organizados'],
      ['Soporte', 'Habla con nuestro equipo'],
    ].forEach(([t, s], idx) => {
      const cx = 54 + idx * 374;
      drawRoundedRect(ctx, cx, 300, 344, 210, 14);
      ctx.fillStyle = '#F5F0E8';
      ctx.fill();
      ctx.strokeStyle = '#C8C0B4';
      ctx.stroke();

      drawRoundedRect(ctx, cx + 28, 328, 48, 48, 10);
      ctx.fillStyle = '#CB343B';
      ctx.fill();

      ctx.fillStyle = '#26211C';
      ctx.font = '600 28px Inter, sans-serif';
      ctx.fillText(t, cx + 28, 422);
      ctx.fillStyle = '#7A7167';
      ctx.font = '400 18px Inter, sans-serif';
      ctx.fillText(s, cx + 28, 462);
    });

    drawRoundedRect(ctx, 54, 548, W - 108, 146, 14);
    ctx.fillStyle = '#252322';
    ctx.fill();
    ctx.fillStyle = '#E4DFD9';
    ctx.font = '600 30px Inter, sans-serif';
    ctx.fillText('Tu próxima solicitud empieza aquí.', 86, 608);
    drawRoundedRect(ctx, 86, 628, 224, 44, 22);
    ctx.fillStyle = '#CB343B';
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '600 18px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Nueva solicitud', 198, 656);
    ctx.textAlign = 'left';
  } else if (service.mockup === 'landing') {
    ctx.fillStyle = '#26211C';
    ctx.font = '700 28px Georgia, serif';
    ctx.fillText('Tu Marca', 54, 128);
    ctx.fillStyle = '#6F675F';
    ctx.font = '400 20px Inter, sans-serif';
    ['Servicios', 'Experiencia', 'Contacto'].forEach((t, i) => ctx.fillText(t, 560 + i * 150, 126));
    drawRoundedRect(ctx, W - 230, 98, 176, 42, 21);
    ctx.fillStyle = '#2F9C98';
    ctx.fill();
    ctx.fillStyle = '#FCF8EF';
    ctx.font = '600 20px Inter, sans-serif';
    ctx.fillText('Consulta gratis', W - 210, 126);

    ctx.strokeStyle = '#C6BEB3';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(54, 160);
    ctx.lineTo(W - 54, 160);
    ctx.stroke();

    ctx.fillStyle = '#26211C';
    ctx.font = '700 52px Georgia, serif';
    ctx.fillText('Tu servicio, explicado', 54, 236);
    ctx.fillText('en una sola página.', 54, 298);
    ctx.fillStyle = '#7A7167';
    ctx.font = '400 22px Inter, sans-serif';
    ctx.fillText('Quién eres, qué ofreces y por qué confiar en ti.', 54, 342);

    drawRoundedRect(ctx, 54, 372, 240, 50, 25);
    ctx.fillStyle = '#2F9C98';
    ctx.fill();
    ctx.fillStyle = '#FCF8EF';
    ctx.font = '600 22px Inter, sans-serif';
    ctx.fillText('Agendar consulta →', 80, 405);
    drawRoundedRect(ctx, 310, 372, 190, 50, 25);
    ctx.strokeStyle = '#B9B0A4';
    ctx.stroke();
    ctx.fillStyle = '#26211C';
    ctx.fillText('Ver servicios', 340, 405);

    [
      ['01', 'Servicio principal', 'Lo que más te piden'],
      ['02', 'Experiencia', 'Casos y resultados'],
      ['03', 'Contacto', 'WhatsApp y formulario'],
    ].forEach(([n, t, sub], idx) => {
      const cx = 54 + idx * 374;
      drawRoundedRect(ctx, cx, 460, 344, 200, 14);
      ctx.fillStyle = '#F5F0E8';
      ctx.fill();
      ctx.strokeStyle = '#C8C0B4';
      ctx.stroke();
      ctx.fillStyle = '#2F9C98';
      ctx.font = '400 30px VT323, monospace';
      ctx.fillText(n, cx + 28, 506);
      ctx.fillStyle = '#26211C';
      ctx.font = '600 28px Inter, sans-serif';
      ctx.fillText(t, cx + 28, 566);
      ctx.fillStyle = '#7A7167';
      ctx.font = '400 18px Inter, sans-serif';
      ctx.fillText(sub, cx + 28, 604);
    });

    ctx.fillStyle = '#25D366';
    ctx.beginPath();
    ctx.arc(W - 90, H - 90, 36, 0, Math.PI * 2);
    ctx.fill();
  } else if (service.mockup === 'workflow') {
    ctx.fillStyle = '#29231E';
    ctx.font = '600 40px Inter, sans-serif';
    ctx.fillText('De una solicitud a un resultado.', 56, 134);
    ctx.fillStyle = '#776E64';
    ctx.font = '400 21px Inter, sans-serif';
    ctx.fillText('Un flujo claro, sin repetir el mismo trabajo.', 56, 172);

    const steps = [
      ['01', 'Solicitud recibida', 'Formulario / correo'],
      ['02', 'Validar información', 'Reglas de tu negocio'],
      ['03', 'Actualizar sistema', 'Datos conectados'],
      ['04', 'Notificar al equipo', 'Acción completada'],
    ];

    steps.forEach(([num, title, sub], idx) => {
      const sy = 216 + idx * 124;
      if (idx < 3) {
        ctx.strokeStyle = '#91867B';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(W / 2, sy + 94);
        ctx.lineTo(W / 2, sy + 124);
        ctx.stroke();
      }

      drawRoundedRect(ctx, 210, sy, 780, 96, 14);
      ctx.fillStyle = '#F7F2EA';
      ctx.fill();
      ctx.strokeStyle = '#BFB5A9';
      ctx.lineWidth = 2;
      ctx.stroke();

      drawRoundedRect(ctx, 236, sy + 20, 56, 56, 10);
      ctx.fillStyle = '#CB343B';
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '400 30px VT323, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(num, 264, sy + 57);
      ctx.textAlign = 'left';

      ctx.fillStyle = '#352D25';
      ctx.font = '600 26px Inter, sans-serif';
      ctx.fillText(title, 316, sy + 48);
      ctx.fillStyle = '#827569';
      ctx.font = '400 18px Inter, sans-serif';
      ctx.fillText(sub, 316, sy + 76);

      ctx.beginPath();
      ctx.arc(946, sy + 48, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#7E776F';
      ctx.fill();
    });
  } else {
    ctx.fillStyle = '#2E2721';
    ctx.font = '600 40px Inter, sans-serif';
    ctx.fillText('Tus herramientas se entienden.', 56, 134);
    ctx.fillStyle = '#7B7066';
    ctx.font = '400 21px Inter, sans-serif';
    ctx.fillText('La información fluye entre los sistemas que ya utilizas.', 56, 172);

    const center = { x: W / 2, y: 430 };
    const nodes = [
      { x: 240, y: 270, t: 'TIENDA', s: 'Pedidos' },
      { x: W - 240, y: 270, t: 'CRM', s: 'Clientes' },
      { x: 240, y: 590, t: 'PAGOS', s: 'Transacciones' },
      { x: W - 240, y: 590, t: 'SISTEMA', s: 'Operación' },
    ];

    nodes.forEach((n) => {
      ctx.strokeStyle = '#A59586';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(n.x, n.y);
      ctx.lineTo(center.x, center.y);
      ctx.stroke();

      drawRoundedRect(ctx, n.x - 120, n.y - 54, 240, 108, 14);
      ctx.fillStyle = '#F4EEE5';
      ctx.fill();
      ctx.strokeStyle = '#B9AB9C';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#403329';
      ctx.font = '400 30px VT323, monospace';
      ctx.fillText(n.t, n.x, n.y - 6);
      ctx.fillStyle = '#8A7868';
      ctx.font = '400 18px Inter, sans-serif';
      ctx.fillText(n.s, n.x, n.y + 26);
    });

    drawRoundedRect(ctx, center.x - 140, center.y - 76, 280, 152, 24);
    ctx.fillStyle = '#CB343B';
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '400 38px VT323, monospace';
    ctx.fillText('ZEGUETTI', center.x, center.y - 4);
    ctx.fillStyle = '#F4D8D9';
    ctx.font = '400 19px VT323, monospace';
    ctx.fillText('CONECTA / SINCRONIZA', center.x, center.y + 34);
    ctx.textAlign = 'left';
  }

  ctx.fillStyle = '#6F6860';
  ctx.font = '400 18px VT323, monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`${service.mockupLabel.toUpperCase()} · DATOS DE DEMOSTRACIÓN`, W - 36, H - 20);
  ctx.textAlign = 'left';
}

function drawCapabilitiesCanvas(ctx: CanvasRenderingContext2D, service: ServiceItem, W: number, H: number) {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#1F1E1E');
  grad.addColorStop(1, '#121212');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = '#383838';
  ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, W - 4, H - 4);

  ctx.fillStyle = '#E25359';
  ctx.font = '400 28px VT323, monospace';
  ctx.fillText(`[ ${commonCopy.capabilitiesLabel.toUpperCase()} ]`, 64, 92);

  ctx.fillStyle = '#FCF8EF';
  ctx.font = '500 50px "Bodoni Moda", Georgia, serif';
  ctx.fillText(commonCopy.capabilitiesTitle, 64, 162);

  ctx.fillStyle = '#9E9993';
  ctx.font = '400 24px VT323, monospace';
  ctx.fillText(`${formatOrderFraction(service.order)} · ${service.name.toUpperCase()}`, W - 64 - ctx.measureText(`${formatOrderFraction(service.order)} · ${service.name.toUpperCase()}`).width, 92);

  service.features.forEach((feat, idx) => {
    const cx = 64 + idx * 366;
    const cy = 224;
    const cw = 338;
    const ch = 410;

    drawRoundedRect(ctx, cx, cy, cw, ch, 14);
    ctx.fillStyle = '#1B1B1B';
    ctx.fill();
    ctx.strokeStyle = '#343434';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#CB343B';
    ctx.fillRect(cx, cy, cw, 5);

    ctx.fillStyle = '#E25359';
    ctx.font = '400 32px VT323, monospace';
    ctx.fillText(String(idx + 1).padStart(2, '0'), cx + 28, cy + 56);

    ctx.fillStyle = '#FCF8EF';
    ctx.font = '600 28px Inter, sans-serif';
    const nextY = wrapCanvasText(ctx, feat.title, cx + 28, cy + 114, cw - 56, 36);

    ctx.fillStyle = '#B8B2AB';
    ctx.font = '400 26px VT323, monospace';
    wrapCanvasText(ctx, feat.description, cx + 28, nextY + 26, cw - 56, 32);
  });

  ctx.fillStyle = '#9E9993';
  ctx.font = '400 20px VT323, monospace';
  ctx.fillText(`ZEGUETTI // SOLUCIONES: ${service.tags.join(' · ')}`, 64, H - 36);
}

function drawProcessCanvas(ctx: CanvasRenderingContext2D, service: ServiceItem, W: number, H: number) {
  ctx.fillStyle = '#191919';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#383838';
  ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, W - 4, H - 4);

  ctx.fillStyle = '#E25359';
  ctx.font = '400 28px VT323, monospace';
  ctx.fillText(`[ ${commonCopy.processLabel.toUpperCase()} ]`, 64, 92);

  ctx.fillStyle = '#FCF8EF';
  ctx.font = '500 50px "Bodoni Moda", Georgia, serif';
  ctx.fillText(commonCopy.processTitle, 64, 162);

  commonCopy.process.forEach((step, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const sx = 64 + col * 548;
    const sy = 218 + row * 196;
    const sw = 524;
    const sh = 170;

    drawRoundedRect(ctx, sx, sy, sw, sh, 14);
    ctx.fillStyle = '#222120';
    ctx.fill();
    ctx.strokeStyle = '#3A3836';
    ctx.lineWidth = 2;
    ctx.stroke();

    drawRoundedRect(ctx, sx + 26, sy + 28, 54, 44, 8);
    ctx.fillStyle = '#CB343B';
    ctx.fill();

    ctx.fillStyle = '#FCF8EF';
    ctx.font = '400 28px VT323, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(String(idx + 1).padStart(2, '0'), sx + 53, sy + 59);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#FCF8EF';
    ctx.font = '400 30px VT323, monospace';
    ctx.fillText(step.title.toUpperCase(), sx + 100, sy + 60);

    ctx.fillStyle = '#B8B2AB';
    ctx.font = '400 22px Inter, sans-serif';
    wrapCanvasText(ctx, step.description, sx + 26, sy + 114, sw - 52, 30);
  });

  drawRoundedRect(ctx, 64, H - 102, W - 128, 62, 10);
  ctx.fillStyle = '#121212';
  ctx.fill();
  ctx.strokeStyle = '#343434';
  ctx.stroke();
  ctx.fillStyle = '#E4DFD9';
  ctx.font = '400 24px VT323, monospace';
  ctx.fillText(`RESUMEN ${service.name.toUpperCase()}: ${service.caption}`, 88, H - 64);
}

export function createServiceGalleryCanvases(service: ServiceItem): HTMLCanvasElement[] {
  const W = 1200;
  const H = 740;

  const c1 = document.createElement('canvas');
  c1.width = W;
  c1.height = H;
  const ctx1 = c1.getContext('2d');
  if (ctx1) drawOverviewCanvas(ctx1, service, W, H);

  const c2 = document.createElement('canvas');
  c2.width = W;
  c2.height = H;
  const ctx2 = c2.getContext('2d');
  if (ctx2) drawCapabilitiesCanvas(ctx2, service, W, H);

  const c3 = document.createElement('canvas');
  c3.width = W;
  c3.height = H;
  const ctx3 = c3.getContext('2d');
  if (ctx3) drawProcessCanvas(ctx3, service, W, H);

  return [c1, c2, c3];
}
