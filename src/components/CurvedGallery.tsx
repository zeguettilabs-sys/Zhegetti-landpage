import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { commonCopy, type ServiceItem } from '../data/services';
import { createServiceGalleryCanvases } from '../utils/renderGalleryTexture';
import { ServiceMockup } from './ServiceMockup';

export interface CurvedGallerySlideMeta {
  index: number;
  label: string;
  title: string;
  subtitle: string;
}

export const GALLERY_SLIDE_META: CurvedGallerySlideMeta[] = [
  {
    index: 0,
    label: '01 / 03',
    title: 'Vista ilustrativa',
    subtitle: 'Interfaz orientativa de la solución',
  },
  {
    index: 1,
    label: '02 / 03',
    title: commonCopy.capabilitiesLabel,
    subtitle: commonCopy.capabilitiesTitle,
  },
  {
    index: 2,
    label: '03 / 03',
    title: commonCopy.processLabel,
    subtitle: commonCopy.processTitle,
  },
];

interface CurvedGalleryProps {
  service: ServiceItem;
  continuousSlide: number;
  activeSlideIndex: number;
  isFocusMode: boolean;
  onSelectSlide: (index: number) => void;
  onToggleFocus: () => void;
  onOpenZoom: (index: number) => void;
}

function applyCylindricalCurve(
  geometry: THREE.PlaneGeometry,
  basePositions: Float32Array,
  meshOffsetX: number
) {
  const posAttr = geometry.attributes.position as THREE.BufferAttribute;
  const radius = 5.4;

  for (let i = 0; i < posAttr.count; i += 1) {
    const localX = basePositions[i * 3];
    const localY = basePositions[i * 3 + 1];
    const worldX = meshOffsetX + localX;
    const clampedTheta = Math.max(-1.15, Math.min(1.15, worldX / radius));
    const curvedX = radius * Math.sin(clampedTheta);
    const curvedZ = -radius * (1 - Math.cos(clampedTheta));
    posAttr.setXYZ(i, curvedX - meshOffsetX, localY, curvedZ);
  }
  posAttr.needsUpdate = true;
}

export function CurvedGallery({
  service,
  continuousSlide,
  activeSlideIndex,
  isFocusMode,
  onSelectSlide,
  onToggleFocus,
  onOpenZoom,
}: CurvedGalleryProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const targetSlideRef = useRef<number>(continuousSlide);
  const [webglReady, setWebglReady] = useState<boolean>(true);
  const [fallbackCanvases, setFallbackCanvases] = useState<string[]>([]);

  targetSlideRef.current = continuousSlide;

  useEffect(() => {
    const canvases = createServiceGalleryCanvases(service);
    setFallbackCanvases(canvases.map((c) => c.toDataURL('image/png')));

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) {
      setWebglReady(false);
      return;
    }

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglReady(false);
      return;
    }

    if (!renderer || !renderer.getContext()) {
      setWebglReady(false);
      return;
    }

    setWebglReady(true);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.1, 40);
    camera.position.set(0, 0, 4.45);

    const textures: THREE.CanvasTexture[] = [];
    const geometries: THREE.PlaneGeometry[] = [];
    const materials: THREE.MeshBasicMaterial[] = [];
    const basePositionsList: Float32Array[] = [];
    const meshes: THREE.Mesh[] = [];

    const panelW = 3.32;
    const panelH = 2.04;
    const panelSpacing = 3.68;

    canvases.forEach((srcCanvas, idx) => {
      const texture = new THREE.CanvasTexture(srcCanvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;

      const geo = new THREE.PlaneGeometry(panelW, panelH, 48, 18);
      const basePos = new Float32Array(
        (geo.attributes.position as THREE.BufferAttribute).array
      );

      const mat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 1,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.x = (idx - targetSlideRef.current) * panelSpacing;
      applyCylindricalCurve(geo, basePos, mesh.position.x);

      scene.add(mesh);
      textures.push(texture);
      geometries.push(geo);
      materials.push(mat);
      basePositionsList.push(basePos);
      meshes.push(mesh);
    });

    const resize = () => {
      const w = Math.max(300, container.clientWidth);
      const h = Math.max(220, container.clientHeight);
      renderer!.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer!.setSize(w, h, false);
      camera.aspect = w / h;
      camera.position.z = w < 900 ? 4.95 : isFocusMode ? 4.1 : 4.5;
      camera.updateProjectionMatrix();
    };
    resize();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(container);
    }
    window.addEventListener('resize', resize);

    let raf = 0;
    let renderedSlide = targetSlideRef.current;

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      setWebglReady(false);
    };
    canvas.addEventListener('webglcontextlost', handleContextLost);

    const renderFrame = () => {
      if (!document.hidden && renderer) {
        const diff = targetSlideRef.current - renderedSlide;
        if (Math.abs(diff) > 0.0005) {
          renderedSlide += diff * 0.18;
        } else {
          renderedSlide = targetSlideRef.current;
        }

        meshes.forEach((mesh, idx) => {
          const offsetX = (idx - renderedSlide) * panelSpacing;
          mesh.position.x = offsetX;
          applyCylindricalCurve(geometries[idx], basePositionsList[idx], offsetX);

          const dist = Math.abs(idx - renderedSlide);
          const shade = Math.max(0.45, 1 - dist * 0.28);
          materials[idx].color.setRGB(shade, shade, shade);
          materials[idx].opacity = Math.max(0.35, 1 - dist * 0.24);
        });

        renderer.render(scene, camera);
      }
      raf = window.requestAnimationFrame(renderFrame);
    };

    raf = window.requestAnimationFrame(renderFrame);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      resizeObserver?.disconnect();
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      renderer?.dispose();
    };
  }, [service, isFocusMode]);

  const currentMeta = GALLERY_SLIDE_META[activeSlideIndex] ?? GALLERY_SLIDE_META[0];

  return (
    <div
      className={`curved-gallery${isFocusMode ? ' curved-gallery--focus' : ''}`}
      data-webgl={webglReady ? 'true' : 'false'}
    >
      <div className="curved-gallery__stage" ref={containerRef}>
        {webglReady ? (
          <canvas
            ref={canvasRef}
            className="curved-gallery__canvas"
            aria-label={`Galería curva ilustrativa de ${service.name}`}
          />
        ) : (
          <div className="curved-gallery__fallback" role="region" aria-label="Galería de visuales">
            {fallbackCanvases[activeSlideIndex] ? (
              <img
                src={fallbackCanvases[activeSlideIndex]}
                alt={`${service.name} — ${currentMeta.title}`}
                className="curved-gallery__fallback-img"
              />
            ) : (
              <ServiceMockup service={service} />
            )}
          </div>
        )}

        <button
          type="button"
          className="curved-gallery__zoom-btn"
          onClick={() => onOpenZoom(activeSlideIndex)}
        >
          [ AMPLIAR ]
        </button>
      </div>

      <div className="curved-gallery__toolbar">
        <div className="curved-gallery__tabs" role="tablist" aria-label="Visuales del servicio">
          {GALLERY_SLIDE_META.map((slide) => (
            <button
              key={slide.index}
              type="button"
              role="tab"
              aria-selected={activeSlideIndex === slide.index}
              className={`curved-gallery__tab${activeSlideIndex === slide.index ? ' is-active' : ''}`}
              onClick={() => onSelectSlide(slide.index)}
            >
              {slide.label} · {slide.title.toUpperCase()}
            </button>
          ))}
        </div>

        <button
          type="button"
          className={`curved-gallery__focus-btn${isFocusMode ? ' is-active' : ''}`}
          aria-pressed={isFocusMode}
          onClick={onToggleFocus}
        >
          [ FOCUS ]
        </button>
      </div>
    </div>
  );
}
