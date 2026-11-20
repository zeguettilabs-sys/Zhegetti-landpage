import type { ServiceItem, ServiceMockupType } from '../data/services';

interface VhsCoverProps {
  service: ServiceItem;
  isActive: boolean;
  shadeOpacity?: number;
  sheenOffset?: number;
  showHoverPrompt?: boolean;
  showCassette?: boolean;
  rotationYDeg?: number;
  className?: string;
}

const COVER_TITLE_LINES: Record<string, string[]> = {
  'sistemas-a-medida': ['SISTEMAS', 'A MEDIDA'],
  'aplicaciones-web': ['APLICACIONES', 'WEB'],
  automatizacion: ['AUTOMA', 'TIZACIÓN'],
  'integraciones-apis': ['INTEGRA', 'CIONES'],
  'landing-pages': ['LANDING', 'PAGES'],
};

const COVER_TAGLINE: Record<string, string> = {
  'sistemas-a-medida': 'EMPRESAS CONECTADAS',
  'aplicaciones-web': 'TU NEGOCIO, EN LÍNEA',
  automatizacion: 'MENOS TAREAS. MÁS TIEMPO.',
  'integraciones-apis': 'TODO TRABAJA EN EQUIPO',
  'landing-pages': 'TU MARCA EN INTERNET',
};

const WEAR_MARKS = [
  { x: 10, y: 12, w: 14, h: 1.5, o: 0.25 },
  { x: 306, y: 10, w: 22, h: 1.4, o: 0.22 },
  { x: 8, y: 140, w: 2, h: 16, o: 0.18 },
  { x: 330, y: 260, w: 2, h: 18, o: 0.18 },
  { x: 14, y: 487, w: 18, h: 1.5, o: 0.22 },
  { x: 304, y: 488, w: 24, h: 1.5, o: 0.25 },
  { x: 256, y: 38, w: 36, h: 1.2, o: 0.14 },
];

function SvgArtwork({
  type,
  accent,
  accentSoft,
}: {
  type: ServiceMockupType;
  accent: string;
  accentSoft: string;
}) {
  if (type === 'dashboard') {
    return (
      <g>
        <rect
          x="22"
          y="162"
          width="296"
          height="196"
          rx="10"
          fill="#131313"
          stroke="#2E2E2E"
          strokeWidth="1.2"
        />
        <text
          x="36"
          y="186"
          fill={accentSoft}
          fontFamily="VT323, monospace"
          fontSize="15"
          letterSpacing="1"
        >
          OPERACIÓN / EN LÍNEA
        </text>
        <line x1="36" y1="196" x2="304" y2="196" stroke="#252525" strokeWidth="1" />

        {/* 3 KPI tiles */}
        {[
          { x: 36, label: 'VENTAS', val: '128' },
          { x: 128, label: 'STOCK', val: '96%' },
          { x: 220, label: 'EQUIPO', val: '24' },
        ].map((kpi) => (
          <g key={kpi.label}>
            <rect
              x={kpi.x}
              y="208"
              width="84"
              height="68"
              rx="7"
              fill="#1B1B1B"
              stroke="#2D2D2D"
              strokeWidth="1"
            />
            <text
              x={kpi.x + 10}
              y="229"
              fill="#9E9993"
              fontFamily="VT323, monospace"
              fontSize="13"
            >
              {kpi.label}
            </text>
            <text
              x={kpi.x + 10}
              y="258"
              fill={accent}
              fontFamily="Inter, sans-serif"
              fontWeight="700"
              fontSize="20"
            >
              {kpi.val}
            </text>
          </g>
        ))}

        {/* Activity bars & summary */}
        <rect x="36" y="294" width="164" height="7" rx="3.5" fill="#3A3835" />
        <rect x="236" y="294" width="68" height="7" rx="3.5" fill={accent} />

        <rect x="36" y="314" width="132" height="7" rx="3.5" fill="#32302D" />
        <rect x="218" y="314" width="86" height="7" rx="3.5" fill={accent} />

        <rect x="36" y="334" width="150" height="7" rx="3.5" fill="#3A3835" />
        <rect x="246" y="334" width="58" height="7" rx="3.5" fill={accent} />
      </g>
    );
  }

  if (type === 'portal') {
    return (
      <g>
        <rect
          x="22"
          y="162"
          width="296"
          height="196"
          rx="10"
          fill="#141414"
          stroke="#2E2E2E"
          strokeWidth="1.2"
        />
        <rect x="22" y="162" width="296" height="28" rx="10" fill="#1C1C1C" />
        <rect x="22" y="180" width="296" height="10" fill="#1C1C1C" />
        <circle cx="38" cy="176" r="3.5" fill={accent} />
        <circle cx="50" cy="176" r="3.5" fill="#57534E" />
        <circle cx="62" cy="176" r="3.5" fill="#57534E" />
        <text
          x="80"
          y="180"
          fill="#9E9993"
          fontFamily="VT323, monospace"
          fontSize="13"
        >
          PORTAL / CLIENTES
        </text>

        {/* Left app wireframe */}
        <rect x="38" y="212" width="132" height="14" rx="5" fill={accent} />
        <rect x="38" y="238" width="118" height="8" rx="4" fill="#4A4642" />
        <rect x="38" y="254" width="96" height="8" rx="4" fill="#383532" />
        <rect x="38" y="270" width="110" height="8" rx="4" fill="#383532" />
        <rect x="38" y="298" width="102" height="28" rx="14" fill={accent} />
        <text
          x="89"
          y="316"
          textAnchor="middle"
          fill="#FCF8EF"
          fontFamily="VT323, monospace"
          fontSize="14"
        >
          NUEVA SOLICITUD
        </text>

        {/* Right trend card */}
        <rect
          x="184"
          y="212"
          width="116"
          height="116"
          rx="10"
          fill="#1B1B1B"
          stroke="#313131"
          strokeWidth="1.2"
        />
        <polyline
          fill="none"
          stroke={accent}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          points="198,298 224,274 246,284 282,240"
        />
        <circle cx="282" cy="240" r="4.5" fill="#FCF8EF" />
      </g>
    );
  }

  if (type === 'landing') {
    return (
      <g>
        <rect x="22" y="162" width="296" height="196" rx="10" fill="#141414" stroke="#2E2E2E" strokeWidth="1.2" />
        <rect x="22" y="162" width="296" height="26" rx="10" fill="#1C1C1C" />
        <rect x="22" y="178" width="296" height="10" fill="#1C1C1C" />
        <circle cx="38" cy="175" r="3.5" fill={accent} />
        <circle cx="50" cy="175" r="3.5" fill="#57534E" />
        <circle cx="62" cy="175" r="3.5" fill="#57534E" />
        <text x="80" y="179" fill="#9E9993" fontFamily="VT323, monospace" fontSize="13">
          TUMARCA.COM
        </text>

        {/* Menu de la pagina */}
        <rect x="38" y="200" width="54" height="7" rx="3.5" fill="#E4DFD9" />
        <rect x="170" y="201" width="26" height="5" rx="2.5" fill="#57534E" />
        <rect x="204" y="201" width="26" height="5" rx="2.5" fill="#57534E" />
        <rect x="246" y="197" width="56" height="13" rx="6.5" fill={accent} />

        {/* Titular grande y llamada a la accion */}
        <rect x="38" y="226" width="190" height="14" rx="5" fill="#E4DFD9" />
        <rect x="38" y="246" width="150" height="14" rx="5" fill="#E4DFD9" />
        <rect x="38" y="270" width="170" height="6" rx="3" fill="#4A4642" />
        <rect x="38" y="282" width="130" height="6" rx="3" fill="#383532" />
        <rect x="38" y="300" width="96" height="24" rx="12" fill={accent} />
        <text x="86" y="316" textAnchor="middle" fill="#FCF8EF" fontFamily="VT323, monospace" fontSize="14">
          WHATSAPP
        </text>
        <rect x="142" y="300" width="80" height="24" rx="12" fill="none" stroke="#57534E" strokeWidth="1.4" />

        {/* Tres servicios */}
        {[0, 1, 2].map((i) => (
          <rect key={i} x={38 + i * 92} y="336" width="80" height="14" rx="4" fill="#232323" stroke="#313131" />
        ))}

        {/* Burbuja de WhatsApp */}
        <circle cx="290" cy="300" r="15" fill={accent} />
        <path d="M283 306 l3 -7 a8 8 0 1 1 4 4 z" fill="#FCF8EF" />
      </g>
    );
  }

  if (type === 'workflow') {
    return (
      <g>
        <ellipse
          cx="170"
          cy="256"
          rx="116"
          ry="44"
          fill="none"
          stroke="rgba(228, 223, 217, 0.25)"
          strokeWidth="1.6"
          transform="rotate(-24 170 256)"
        />
        <ellipse
          cx="170"
          cy="256"
          rx="116"
          ry="44"
          fill="none"
          stroke="rgba(228, 223, 217, 0.2)"
          strokeWidth="1.6"
          transform="rotate(24 170 256)"
        />
        {/* Workflow micro nodes */}
        {[
          { x: 52, y: 204, txt: '01' },
          { x: 262, y: 204, txt: '02' },
          { x: 52, y: 294, txt: '03' },
          { x: 262, y: 294, txt: '04' },
        ].map((n) => (
          <g key={n.txt}>
            <rect
              x={n.x}
              y={n.y}
              width="28"
              height="22"
              rx="4"
              fill="#191919"
              stroke="#484440"
              strokeWidth="1"
            />
            <text
              x={n.x + 14}
              y={n.y + 15}
              textAnchor="middle"
              fill="#E4DFD9"
              fontFamily="VT323, monospace"
              fontSize="13"
            >
              {n.txt}
            </text>
          </g>
        ))}

        <circle cx="258" cy="202" r="4" fill="#E4DFD9" opacity="0.8" />
        <circle cx="80" cy="312" r="4" fill={accent} />

        {/* Central lightning bolt */}
        <polygon
          points="186,184 134,264 168,264 152,328 212,244 174,244"
          fill={accent}
        />
      </g>
    );
  }

  // integrations
  return (
    <g>
      <line x1="82" y1="210" x2="170" y2="260" stroke="#5A5550" strokeWidth="2.2" />
      <line x1="258" y1="210" x2="170" y2="260" stroke="#5A5550" strokeWidth="2.2" />
      <line x1="82" y1="312" x2="170" y2="260" stroke="#5A5550" strokeWidth="2.2" />
      <line x1="258" y1="312" x2="170" y2="260" stroke="#5A5550" strokeWidth="2.2" />

      {[
        { x: 42, y: 184, label: 'TIENDA' },
        { x: 218, y: 184, label: 'CRM' },
        { x: 42, y: 294, label: 'PAGOS' },
        { x: 218, y: 294, label: 'ERP' },
      ].map((node) => (
        <g key={node.label}>
          <rect
            x={node.x}
            y={node.y}
            width="80"
            height="44"
            rx="8"
            fill="#181818"
            stroke="#59544E"
            strokeWidth="1.4"
          />
          <text
            x={node.x + 40}
            y={node.y + 27}
            textAnchor="middle"
            fill="#E4DFD9"
            fontFamily="VT323, monospace"
            fontSize="16"
          >
            {node.label}
          </text>
        </g>
      ))}

      <rect x="134" y="224" width="72" height="72" rx="14" fill={accent} />
      <text
        x="170"
        y="270"
        textAnchor="middle"
        fill="#FCF8EF"
        fontFamily="Inter, sans-serif"
        fontWeight="700"
        fontSize="32"
      >
        Z
      </text>
    </g>
  );
}

/** Paleta de cada caja: como una estanteria de videos, cada titulo tiene su tinta. */
interface CoverTheme {
  ink: string;
  inkSoft: string;
  paper: string;
}

const COVER_THEME: Record<string, CoverTheme> = {
  'sistemas-a-medida': { ink: '#C8323A', inkSoft: '#E25359', paper: '#1A1111' },
  'aplicaciones-web': { ink: '#C49A2E', inkSoft: '#D9B451', paper: '#17140C' },
  automatizacion: { ink: '#5B4FD1', inkSoft: '#8378E8', paper: '#110F1C' },
  'integraciones-apis': { ink: '#8E9C38', inkSoft: '#AEBB57', paper: '#12140B' },
  'landing-pages': { ink: '#2F9C98', inkSoft: '#4FC2BD', paper: '#0C1716' },
};

const DEFAULT_THEME: CoverTheme = COVER_THEME['sistemas-a-medida'];

export function getCoverTheme(service: ServiceItem): CoverTheme {
  return COVER_THEME[service.id] ?? DEFAULT_THEME;
}

const COVER_W = 340;
const COVER_H = 500;

/** Generador con semilla: el borde rasgado es igual en cada recarga. */
function seededRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Borde de papel rasgado: anillo entre el contorno de la caja y una linea
 * interior irregular. Hay tramos casi sin papel, como una etiqueta gastada.
 */
function tornEdgePath(seed: number): string {
  const rand = seededRandom(seed);
  const step = 2.6;
  let depth = 3;
  const inset = () => {
    // Paseo aleatorio con tramos sin papel y algun desgarro mas profundo
    depth += (rand() - 0.52) * 2.2;
    if (rand() < 0.1) depth = 0.3 + rand() * 0.8;
    if (rand() < 0.035) depth = 6 + rand() * 3;
    depth = Math.max(0.3, Math.min(8.5, depth));
    return depth;
  };

  const pts: string[] = [];
  for (let x = 0; x <= COVER_W; x += step) pts.push(`${x.toFixed(1)} ${inset().toFixed(1)}`);
  for (let y = 0; y <= COVER_H; y += step) pts.push(`${(COVER_W - inset()).toFixed(1)} ${y.toFixed(1)}`);
  for (let x = COVER_W; x >= 0; x -= step) pts.push(`${x.toFixed(1)} ${(COVER_H - inset()).toFixed(1)}`);
  for (let y = COVER_H; y >= 0; y -= step) pts.push(`${inset().toFixed(1)} ${y.toFixed(1)}`);

  const outer = `M0 0 H${COVER_W} V${COVER_H} H0 Z`;
  const inner = `M${pts.join(' L')} Z`;
  return `${outer} ${inner}`;
}

/** Motas de papel sueltas cerca del borde. */
function edgeSpecks(seed: number) {
  const rand = seededRandom(seed * 7 + 3);
  return Array.from({ length: 38 }, () => {
    const side = Math.floor(rand() * 4);
    const along = rand();
    const off = 9 + rand() * 12;
    const x = side === 0 || side === 2 ? along * COVER_W : side === 1 ? COVER_W - off : off;
    const y = side === 1 || side === 3 ? along * COVER_H : side === 2 ? COVER_H - off : off;
    return { x, y, r: 0.5 + rand() * 1.3, o: 0.25 + rand() * 0.5 };
  });
}

/** Titulo en dos lineas: tamaño y ancho calculados para que entre condensado. */
function fitTitleLine(text: string) {
  const maxW = 286;
  const condense = 0.62;
  const size = Math.min(66, maxW / (text.length * condense));
  const width = Math.min(maxW, text.length * condense * size);
  return { size, width };
}

const ART_FRAME = { x: 30, y: 64, w: 280, h: 192 };
// La ilustracion original ocupa x 22..318, y 162..358
const ART_SRC = { x: 22, y: 162, w: 296, h: 196 };

export function getCoverTagline(service: ServiceItem): string {
  return COVER_TAGLINE[service.id] ?? service.category;
}

/**
 * Frente de la caratula en un solo sistema de coordenadas (340 x 500).
 * Se usa tal cual en el DOM y tambien se rasteriza como textura del estuche 3D.
 */
export function VhsFrontSvg({
  service,
  className = 'vhs-front-svg',
}: {
  service: ServiceItem;
  isActive?: boolean;
  className?: string;
}) {
  const titleLines = COVER_TITLE_LINES[service.id] ?? [service.name.toUpperCase()];
  const theme = getCoverTheme(service);
  const orderText = String(service.order).padStart(2, '0');
  const uid = service.id;
  const seed = 1000 + service.order * 131;

  const artScale = Math.min(ART_FRAME.w / ART_SRC.w, ART_FRAME.h / ART_SRC.h) * 1.04;
  const artX = ART_FRAME.x + (ART_FRAME.w - ART_SRC.w * artScale) / 2 - ART_SRC.x * artScale;
  const artY = ART_FRAME.y + (ART_FRAME.h - ART_SRC.h * artScale) / 2 - ART_SRC.y * artScale;

  const line1 = fitTitleLine(titleLines[0] ?? '');
  const line2 = titleLines[1] ? fitTitleLine(titleLines[1]) : null;
  const titleTop = 270;
  const line1Base = titleTop + line1.size * 0.86;
  const line2Base = line2 ? line1Base + line2.size * 0.88 : line1Base;

  return (
    <svg
      className={className}
      viewBox={`0 0 ${COVER_W} ${COVER_H}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`cardBg-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={theme.paper} />
          <stop offset="60%" stopColor="#0E0D0C" />
          <stop offset="100%" stopColor="#090909" />
        </linearGradient>
        <clipPath id={`artClip-${uid}`}>
          <rect x={ART_FRAME.x} y={ART_FRAME.y} width={ART_FRAME.w} height={ART_FRAME.h} />
        </clipPath>
        <pattern id={`scan-${uid}`} width="4" height="3" patternUnits="userSpaceOnUse">
          <rect width="4" height="1" fill="#000" opacity="0.35" />
        </pattern>
        <radialGradient id={`artVignette-${uid}`} cx="50%" cy="45%" r="70%">
          <stop offset="55%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.75" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width={COVER_W} height={COVER_H} fill={`url(#cardBg-${uid})`} />

      {/* Franja superior: marca y sello del sello editorial */}
      <text
        x={COVER_W / 2}
        y="24"
        textAnchor="middle"
        fill={theme.inkSoft}
        fontFamily="VT323, monospace"
        fontSize="11"
        letterSpacing="3"
        opacity="0.85"
      >
        ZEGUETTI
      </text>
      <g transform={`translate(${COVER_W / 2} 46) skewX(-12)`}>
        <text
          x="0"
          y="0"
          textAnchor="middle"
          fill={theme.ink}
          fontFamily="'Bodoni Moda', Georgia, serif"
          fontWeight="700"
          fontSize="19"
        >
          Video Digital
        </text>
      </g>
      <line x1="30" y1="55" x2="310" y2="55" stroke={theme.ink} strokeWidth="1" opacity="0.7" />

      {/* Portada: la ilustracion del servicio como si fuera la foto de la caja */}
      <g clipPath={`url(#artClip-${uid})`}>
        <rect
          x={ART_FRAME.x}
          y={ART_FRAME.y}
          width={ART_FRAME.w}
          height={ART_FRAME.h}
          fill="#0B0B0B"
        />
        <g transform={`translate(${artX.toFixed(2)} ${artY.toFixed(2)}) scale(${artScale.toFixed(4)})`}>
          <SvgArtwork type={service.mockup} accent={theme.ink} accentSoft={theme.inkSoft} />
        </g>
        <rect
          x={ART_FRAME.x}
          y={ART_FRAME.y}
          width={ART_FRAME.w}
          height={ART_FRAME.h}
          fill={`url(#scan-${uid})`}
        />
        <rect
          x={ART_FRAME.x}
          y={ART_FRAME.y}
          width={ART_FRAME.w}
          height={ART_FRAME.h}
          fill={`url(#artVignette-${uid})`}
        />
      </g>
      <rect
        x={ART_FRAME.x}
        y={ART_FRAME.y}
        width={ART_FRAME.w}
        height={ART_FRAME.h}
        fill="none"
        stroke={theme.ink}
        strokeWidth="1.6"
      />

      {/* Titulo enorme: primera linea con tinta, segunda solo contorno */}
      <text
        x={COVER_W / 2}
        y={line1Base.toFixed(1)}
        textAnchor="middle"
        fill={theme.ink}
        fontFamily="'Bodoni Moda', Georgia, serif"
        fontWeight="700"
        fontSize={line1.size.toFixed(1)}
        textLength={line1.width.toFixed(1)}
        lengthAdjust="spacingAndGlyphs"
      >
        {titleLines[0]}
      </text>
      {line2 && (
        <text
          x={COVER_W / 2}
          y={line2Base.toFixed(1)}
          textAnchor="middle"
          fill="none"
          stroke={theme.ink}
          strokeWidth="1.3"
          fontFamily="'Bodoni Moda', Georgia, serif"
          fontWeight="700"
          fontSize={line2.size.toFixed(1)}
          textLength={line2.width.toFixed(1)}
          lengthAdjust="spacingAndGlyphs"
        >
          {titleLines[1]}
        </text>
      )}

      {/* Pie: sello de formato, año y emblema */}
      <g transform={`translate(30 ${COVER_H - 46})`}>
        <rect x="0" y="0" width="46" height="20" fill="none" stroke={theme.ink} strokeWidth="1.4" />
        <rect x="2.5" y="2.5" width="41" height="15" fill={theme.ink} opacity="0.18" />
        <text
          x="23"
          y="15"
          textAnchor="middle"
          fill={theme.inkSoft}
          fontFamily="VT323, monospace"
          fontSize="15"
          letterSpacing="1"
        >
          Z-{orderText}
        </text>
      </g>
      <text
        x={COVER_W / 2}
        y={COVER_H - 31}
        textAnchor="middle"
        fill={theme.inkSoft}
        fontFamily="VT323, monospace"
        fontSize="12"
        letterSpacing="1.5"
        opacity="0.8"
      >
        2026
      </text>
      <g transform={`translate(287 ${COVER_H - 36})`} fill="none" stroke={theme.ink} strokeWidth="1.2">
        <ellipse cx="0" cy="0" rx="23" ry="11" />
        <ellipse cx="0" cy="0" rx="11" ry="11" />
        <line x1="-23" y1="0" x2="23" y2="0" />
        <ellipse cx="0" cy="0" rx="23" ry="4.5" />
        <text
          x="0"
          y="3.5"
          textAnchor="middle"
          fill={theme.inkSoft}
          stroke="none"
          fontFamily="VT323, monospace"
          fontSize="10"
        >
          ZL
        </text>
      </g>

      {/* Desgaste: rayas claras y borde de papel rasgado */}
      {WEAR_MARKS.map((m, idx) => (
        <rect key={idx} x={m.x} y={m.y} width={m.w} height={m.h} fill="#E9E2D4" opacity={m.o} />
      ))}
      <path d={tornEdgePath(seed)} fill="#D9D1C2" fillRule="evenodd" opacity="0.82" />
      {edgeSpecks(seed).map((s, idx) => (
        <circle key={idx} cx={s.x.toFixed(1)} cy={s.y.toFixed(1)} r={s.r.toFixed(2)} fill="#D9D1C2" opacity={(s.o * 0.8).toFixed(2)} />
      ))}
    </svg>
  );
}

export function VhsCover({
  service,
  isActive,
  shadeOpacity = 0,
  sheenOffset = 0,
  showHoverPrompt = true,
  showCassette = true,
  rotationYDeg = 0,
  className = '',
}: VhsCoverProps) {
  const footerTagline = getCoverTagline(service);
  const orderText = String(service.order).padStart(2, '0');

  return (
    <div
      className={`cover-sleeve${className ? ` ${className}` : ''}`}
      data-active={isActive ? 'true' : 'false'}
    >
      {showCassette && (
        <div className="cover-cassette" aria-hidden="true">
          <div className="cover-cassette__grips" />
          <div className="cover-cassette__window">
            <div className="cover-cassette__reel">
              <span className="cover-cassette__hub" />
            </div>
            <span className="cover-cassette__code">Z-{orderText}</span>
          </div>
          <div className="cover-cassette__grips" />
        </div>
      )}

      <div
        className="vhs-box"
        style={
          rotationYDeg !== 0
            ? { transform: `rotateY(${rotationYDeg.toFixed(2)}deg)` }
            : undefined
        }
      >
        {/* Frente fisico con unico sistema de coordenadas SVG (340 x 500) */}
        <article
          className={`vhs-face vhs-face--front cover-card${isActive ? ' cover-card--active' : ''}`}
        >
          <VhsFrontSvg service={service} isActive={isActive} />

          {/* Texto accesible real oculto visualmente (el SVG ya pinta el frente exacto) */}
          <span className="sr-only">
            {service.name} — {footerTagline}
          </span>

          {showHoverPrompt && (
            <span className="vhs-hover-prompt" aria-hidden="true">
              [ VER SERVICIO ]
            </span>
          )}

          <div
            className="vhs-sheen"
            style={{
              backgroundPosition: `${50 + sheenOffset * 25}% 50%`,
            }}
            aria-hidden="true"
          />

          <div
            className="cover-card__shade"
            style={{ opacity: shadeOpacity }}
            aria-hidden="true"
          />
        </article>

        {/* Lomo izquierdo fisico */}
        <div className="vhs-face vhs-face--spine vhs-face--spine-left" aria-hidden="true">
          <span className="vhs-spine-label">
            ZEGUETTI · {orderText} // {service.name.toUpperCase()}
          </span>
        </div>

        {/* Lomo derecho fisico */}
        <div className="vhs-face vhs-face--spine vhs-face--spine-right" aria-hidden="true">
          <span className="vhs-spine-label">
            {service.category} // {orderText}
          </span>
        </div>

        {/* Cantos superior e inferior */}
        <div className="vhs-face vhs-face--cap vhs-face--top" aria-hidden="true" />
        <div className="vhs-face vhs-face--cap vhs-face--bottom" aria-hidden="true" />

        {/* Reverso para rotacion 360 en Nosotros */}
        <div className="vhs-face vhs-face--back" aria-hidden="true">
          <div className="vhs-back-inner">
            <span className="vhs-back-eyebrow">ZEGUETTI / EDICIÓN DIGITAL</span>
            <p className="vhs-back-title">{service.name}</p>
            <p className="vhs-back-desc">{service.caption}</p>
            <div className="vhs-back-tags">
              {service.tags.map((t) => (
                <span key={t}>· {t}</span>
              ))}
            </div>
            <span className="vhs-back-foot">PERÚ // EST. 2026</span>
          </div>
        </div>
      </div>

      <div className="vhs-contact-shadow" aria-hidden="true" />
    </div>
  );
}
