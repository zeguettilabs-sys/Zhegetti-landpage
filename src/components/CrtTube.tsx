/**
 * Tubo de TV: la pantalla tiene los bordes abombados y las esquinas redondeadas
 * como un CRT real. La forma se define una sola vez en unidades relativas
 * (0..1) para que se adapte a cualquier tamaño de pantalla.
 */

interface TubeShape {
  /** Radio de las esquinas (fraccion del ancho / alto). */
  rx: number;
  ry: number;
  /** Cuanto se abomban los bordes hacia afuera. */
  bx: number;
  by: number;
}

const LANDSCAPE: TubeShape = { rx: 0.046, ry: 0.078, bx: 0.0065, by: 0.012 };
const PORTRAIT: TubeShape = { rx: 0.1, ry: 0.044, bx: 0.012, by: 0.0055 };

function tubePath({ rx, ry, bx, by }: TubeShape): string {
  const n = (v: number) => Number(v.toFixed(4));
  return [
    `M ${n(rx + bx)} ${n(by)}`,
    `Q 0.5 ${n(-by)} ${n(1 - rx - bx)} ${n(by)}`,
    `Q ${n(1 - bx)} ${n(by)} ${n(1 - bx)} ${n(by + ry)}`,
    `Q ${n(1 + bx)} 0.5 ${n(1 - bx)} ${n(1 - by - ry)}`,
    `Q ${n(1 - bx)} ${n(1 - by)} ${n(1 - rx - bx)} ${n(1 - by)}`,
    `Q 0.5 ${n(1 + by)} ${n(rx + bx)} ${n(1 - by)}`,
    `Q ${n(bx)} ${n(1 - by)} ${n(bx)} ${n(1 - by - ry)}`,
    `Q ${n(-bx)} 0.5 ${n(bx)} ${n(by + ry)}`,
    `Q ${n(bx)} ${n(by)} ${n(rx + bx)} ${n(by)}`,
    'Z',
  ].join(' ');
}

const LANDSCAPE_PATH = tubePath(LANDSCAPE);
const PORTRAIT_PATH = tubePath(PORTRAIT);

/** Recortes del tubo. Se monta una sola vez en la app (ids globales). */
export function CrtTubeDefs() {
  return (
    <svg className="crt-tube-defs" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id="crt-tube-landscape" clipPathUnits="objectBoundingBox">
          <path d={LANDSCAPE_PATH} />
        </clipPath>
        <clipPath id="crt-tube-portrait" clipPathUnits="objectBoundingBox">
          <path d={PORTRAIT_PATH} />
        </clipPath>
        {/* Temblor de cinta: cada linea de barrido se corre un poco en horizontal */}
        <filter id="vhs-text" x="-3%" y="-12%" width="106%" height="124%" colorInterpolationFilters="sRGB">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.0009 0.42"
            numOctaves="1"
            seed="11"
            result="noise"
          />
          <feColorMatrix
            in="noise"
            type="matrix"
            values="1 0 0 0 0  0 0 0 0 0.5  0 0 0 0 0  0 0 0 0 1"
            result="rows"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="rows"
            scale="2.4"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}

/**
 * Capas que van encima del contenido de la pantalla:
 * señal viva (grano, franja que recorre la pantalla), vidrio con reflejo
 * de ventana y el canto iluminado del tubo.
 */
export function CrtTubeLayers() {
  return (
    <>
      <div className="crt-signal" aria-hidden="true">
        <div className="crt-signal__grain" />
        <div className="crt-signal__roll" />
      </div>
      <div className="crt-glass" aria-hidden="true">
        <div className="crt-glass__window" />
      </div>
      <svg
        className="crt-rim"
        viewBox="0 0 1 1"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <path className="crt-rim__landscape crt-rim__glow" d={LANDSCAPE_PATH} />
        <path className="crt-rim__landscape crt-rim__edge" d={LANDSCAPE_PATH} />
        <path className="crt-rim__portrait crt-rim__glow" d={PORTRAIT_PATH} />
        <path className="crt-rim__portrait crt-rim__edge" d={PORTRAIT_PATH} />
      </svg>
    </>
  );
}
