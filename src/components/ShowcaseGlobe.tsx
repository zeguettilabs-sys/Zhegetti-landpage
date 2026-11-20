import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { ShowcaseCard } from '../three/showcaseCards';
import { hasHardwareWebGL2, postFragment, postVertex } from './VhsStage3D';

export type GlobeStatus = 'loading' | 'ready' | 'off';

interface ShowcaseGlobeProps {
  cards: ShowcaseCard[];
  /** Con el visor abierto el globo se congela. */
  paused: boolean;
  title: string;
  captionText: string;
  onOpen: (index: number, from: DOMRect) => void;
  onStatus: (status: GlobeStatus) => void;
}

const FOV = 24;
const ROWS = [
  { lat: -58, count: 6, phase: 0.1 },
  { lat: -20, count: 7, phase: 0.55 },
  { lat: 18, count: 7, phase: 0.0 },
  { lat: 56, count: 5, phase: 0.4 },
];
/** Velocidad angular de la deriva de fondo (rad/s) y de la rueda / arrastre. */
const REST_SPIN = 0.08;
const WHEEL_GAIN = 0.004;
const DRAG_GAIN = 0.18 * 0.08;

const bend = (u: number, v: number, k: number) => {
  const px = u * 2 - 1;
  const py = v * 2 - 1;
  return [(px * (1 + k * py * py)) * 0.5 + 0.5, (py * (1 + k * px * px)) * 0.5 + 0.5] as const;
};

/** Cuantas veces se repite el titulo alrededor del anillo (cada copia abarca ~102 grados). */
const RING_COPIES = 3;
const RING_RADIUS = 1.08;
const RING_HEIGHT = 1.0;

/**
 * Titulo del anillo: una textura nitida (crema) y otra con halo calido. Cada
 * textura es una "baldosa" que se repite RING_COPIES veces alrededor del globo.
 */
function ringTextures(title: string): { crisp: THREE.CanvasTexture; glow: THREE.CanvasTexture } {
  const serif = getComputedStyle(document.documentElement).getPropertyValue('--font-editorial').trim() || 'Georgia, serif';
  const label = title.toUpperCase();
  const W = 1536;
  // La baldosa mide 2*PI*radio/copias de ancho y RING_HEIGHT de alto (en radios de globo)
  const tileAspect = ((2 * Math.PI * RING_RADIUS) / RING_COPIES) / RING_HEIGHT;
  const H = Math.round(W / tileAspect);
  const make = (glow: boolean) => {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '6px';
    ctx.font = '500 200px ' + serif;
    const measured = ctx.measureText(label).width || 1;
    // El texto ocupa ~85% de la baldosa: 1.92 radios de ancho
    const size = (200 * W * 0.85) / measured;
    ctx.font = '500 ' + size + 'px ' + serif;
    ctx.fillStyle = '#f6f5ee';
    const y = H / 2 + size * 0.03;
    if (glow) {
      ctx.shadowColor = 'rgba(255, 250, 238, 0.95)';
      ctx.shadowBlur = 60;
      ctx.fillText(label, W / 2, y);
      ctx.shadowBlur = 24;
    }
    ctx.fillText(label, W / 2, y);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    tex.wrapS = THREE.RepeatWrapping;
    tex.repeat.set(RING_COPIES, 1);
    return tex;
  };
  return { crisp: make(false), glow: make(true) };
}

export function ShowcaseGlobe({ cards, paused, title, captionText, onOpen, onStatus }: ShowcaseGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const captionRef = useRef<HTMLParagraphElement | null>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const openRef = useRef(onOpen);
  openRef.current = onOpen;
  const statusRef = useRef(onStatus);
  statusRef.current = onStatus;

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = canvas?.parentElement;
    if (!canvas || !stage || !cards.length) return;
    if (!hasHardwareWebGL2()) {
      statusRef.current('off');
      return;
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: false,
        alpha: true,
        premultipliedAlpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      statusRef.current('off');
      return;
    }
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, 1, 10, 20000);
    const orbit = new THREE.Group();
    scene.add(orbit);

    const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
    const postMat = new THREE.ShaderMaterial({
      vertexShader: postVertex,
      fragmentShader: postFragment,
      uniforms: {
        map: { value: target.texture },
        k: { value: 0.09 },
        aberration: { value: 0.03 },
        fade: { value: new THREE.Vector2(0.1, 0.1) },
      },
      depthTest: false,
      depthWrite: false,
      blending: THREE.NoBlending,
    });
    const postScene = new THREE.Scene();
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat);
    quad.frustumCulled = false;
    postScene.add(quad);
    const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // ---- Globo de alambre ----
    const disposables: { dispose: () => void }[] = [target, postMat, quad.geometry];
    const lineMats: THREE.LineBasicMaterial[] = [];
    const lineMat = (opacity: number) => {
      const m = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
      m.userData.base = opacity;
      lineMats.push(m);
      disposables.push(m);
      return m;
    };
    const globe = new THREE.Group();
    orbit.add(globe);
    const circle = (segments: number) => {
      const pts: number[] = [];
      for (let i = 0; i < segments; i += 1) {
        const a = (i / segments) * Math.PI * 2;
        pts.push(Math.cos(a), Math.sin(a), 0);
      }
      const g = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      disposables.push(g);
      return g;
    };
    const unit = circle(160);
    const meridianMat = lineMat(0.5);
    for (let i = 0; i < 12; i += 1) {
      const m = new THREE.LineLoop(unit, meridianMat);
      m.rotation.y = (i / 12) * Math.PI;
      globe.add(m);
    }
    const parallelMat = lineMat(0.5);
    for (let lat = -75; lat <= 75; lat += 15) {
      const r = Math.cos((lat * Math.PI) / 180);
      const m = new THREE.LineLoop(unit, parallelMat);
      m.rotation.x = Math.PI / 2;
      m.scale.set(r, r, 1);
      m.position.y = Math.sin((lat * Math.PI) / 180);
      globe.add(m);
    }
    const axisGeo = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0, -1.08, 0, 0, 1.08, 0], 3));
    disposables.push(axisGeo);
    globe.add(new THREE.Line(axisGeo, lineMat(0.6)));

    // ---- Titulo en anillo: gira solo, siempre nivelado, y se repite alrededor ----
    const ringTex = ringTextures(title);
    disposables.push(ringTex.crisp, ringTex.glow);
    const ringGeo = new THREE.CylinderGeometry(RING_RADIUS, RING_RADIUS, RING_HEIGHT, 160, 1, true);
    disposables.push(ringGeo);
    const ringMat = (map: THREE.Texture, side: THREE.Side, additive = false) => {
      const m = new THREE.MeshBasicMaterial({
        map,
        transparent: true,
        opacity: 0,
        side,
        depthWrite: false,
        toneMapped: false,
        blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      });
      // alfa segun cuanto mira la pared del anillo hacia la camara
      m.onBeforeCompile = (shader) => {
        shader.vertexShader = shader.vertexShader
          .replace('#include <common>', `#include <common>
varying float vFacing;`)
          .replace(
            '#include <begin_vertex>',
            `#include <begin_vertex>
vec4 mvp = modelViewMatrix * vec4(position, 1.0);
vFacing = abs(dot(normalize(normalMatrix * normal), normalize(-mvp.xyz)));`
          );
        shader.fragmentShader = shader.fragmentShader
          .replace('#include <common>', `#include <common>
varying float vFacing;`)
          .replace(
            '#include <color_fragment>',
            `#include <color_fragment>
diffuseColor.a *= smoothstep(0.12, 0.62, vFacing);`
          );
      };
      disposables.push(m);
      return m;
    };
    const ringBack = ringMat(ringTex.crisp, THREE.BackSide);
    const ringFront = ringMat(ringTex.crisp, THREE.FrontSide);
    const ringGlow = ringMat(ringTex.glow, THREE.FrontSide, true);
    const ringGroup = new THREE.Group();
    const ringMeshes = [
      new THREE.Mesh(ringGeo, ringBack),
      new THREE.Mesh(ringGeo, ringFront),
      new THREE.Mesh(ringGeo, ringGlow),
    ];
    ringMeshes[0].renderOrder = 1;
    ringMeshes[1].renderOrder = 8;
    ringMeshes[2].renderOrder = 9;
    ringGroup.add(...ringMeshes);
    scene.add(ringGroup);
    let ringYaw = 0;

    // ---- Tarjetas sobre la esfera ----
    const cardGroup = new THREE.Group();
    orbit.add(cardGroup);
    const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const meshes: THREE.Mesh[] = [];
    const cardData: { mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; dir: THREE.Vector3; w: number; h: number }[] = [];
    const total = ROWS.reduce((n, r) => n + r.count, 0);
    let ci = 0;
    ROWS.forEach((row, ri) => {
      for (let k = 0; k < row.count; k += 1) {
        const card = cards[ci % cards.length];
        ci += 1;
        const tex = new THREE.CanvasTexture(card.canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = anisotropy;
        disposables.push(tex);
        const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, transparent: true, opacity: 0, toneMapped: false });
        disposables.push(mat);
        // Tamaño en unidades de globo (R = 1): el lado largo mide ~0.74
        const long = 0.92;
        const w = card.aspect >= 1 ? long : long * 1.08 * card.aspect;
        const h = card.aspect >= 1 ? long / card.aspect : long * 1.08;
        const geo = new THREE.PlaneGeometry(w, h, 14, 10);
        const pos = geo.attributes.position;
        const Rs = 1.75;
        for (let v = 0; v < pos.count; v += 1) {
          const x = pos.getX(v);
          const y = pos.getY(v);
          pos.setZ(v, -(Rs - Math.sqrt(Math.max(0.01, Rs * Rs - x * x - y * y))));
        }
        geo.computeVertexNormals();
        disposables.push(geo);
        const mesh = new THREE.Mesh(geo, mat);
        const lat = (row.lat * Math.PI) / 180;
        const lon = ((k + row.phase + ri * 0.17) / row.count) * Math.PI * 2;
        const dir = new THREE.Vector3(Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon));
        mesh.position.copy(dir).multiplyScalar(Rs);
        mesh.lookAt(dir.clone().multiplyScalar(Rs * 2));
        mesh.rotateZ(((ci % 5) - 2) * 0.025);
        mesh.userData.index = cards.indexOf(card);
        cardGroup.add(mesh);
        meshes.push(mesh);
        cardData.push({ mesh, mat, dir, w, h });
      }
    });
    void total;

    // ---- Tamaño ----
    let W = 1;
    let H = 1;
    let R = 1;
    const size = new THREE.Vector2();
    const resize = () => {
      W = Math.max(1, stage.clientWidth);
      H = Math.max(1, stage.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(W, H, false);
      renderer.getDrawingBufferSize(size);
      const cap = Math.min(1, Math.sqrt(3_686_400 / Math.max(1, size.x * size.y)));
      target.setSize(Math.max(1, Math.round(size.x * cap)), Math.max(1, Math.round(size.y * cap)));
      camera.aspect = W / H;
      camera.fov = FOV;
      // 1 unidad de mundo = 1 px a la distancia del origen
      const dist = H / 2 / Math.tan((FOV * Math.PI) / 360);
      camera.position.set(0, 0, dist);
      camera.near = dist * 0.3;
      camera.far = dist * 3;
      camera.updateProjectionMatrix();
      R = Math.min(0.319 * H, 0.2 * W);
      orbit.scale.setScalar(R);
      ringGroup.scale.setScalar(R);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(stage);

    // ---- Movimiento ----
    const st = { yaw: 0.4, pitch: 0.12, vYaw: 0, vPitch: 0, slow: 1, dir: 1, settled: 0, hover: -1, dragging: false };
    let intro = 0;
    let pointer: { x: number; y: number; cx: number; cy: number } | null = null;
    let down: { x: number; y: number } | null = null;
    let clickCandidate = false;

    const onWheel = (e: WheelEvent) => {
      if (pausedRef.current || e.ctrlKey || e.metaKey) return;
      e.preventDefault();
      const d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (!d) return;
      st.dir = Math.sign(d);
      st.vYaw += (e.deltaMode === 1 ? 16 * d : d) * WHEEL_GAIN;
    };
    const onDown = (e: PointerEvent) => {
      if (pausedRef.current || e.button > 0) return;
      if (e.target instanceof Element && e.target.closest('a, button, [role="dialog"]')) return;
      down = { x: e.clientX, y: e.clientY };
      clickCandidate = true;
      st.dragging = true;
    };
    const onMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      pointer = { x: (e.clientX - r.left) / r.width, y: 1 - (e.clientY - r.top) / r.height, cx: e.clientX, cy: e.clientY };
      if (!down) return;
      const dx = e.clientX - down.x;
      const dy = e.clientY - down.y;
      if (Math.hypot(dx, dy) > 5) clickCandidate = false;
      st.vYaw += dx * DRAG_GAIN * 0.5;
      st.vPitch += dy * DRAG_GAIN * 0.5;
      down = { x: e.clientX, y: e.clientY };
    };
    const onUp = () => {
      if (down && clickCandidate && st.hover >= 0 && !pausedRef.current) {
        const hit = cardData[st.hover];
        if (hit) {
          const rect = projectRect(hit.mesh);
          openRef.current(hit.mesh.userData.index as number, rect);
        }
      }
      down = null;
      clickCandidate = false;
      st.dragging = false;
    };
    const onLeave = () => {
      pointer = null;
    };
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    document.documentElement.addEventListener('pointerleave', onLeave);

    const v3 = new THREE.Vector3();
    const projectRect = (mesh: THREE.Mesh): DOMRect => {
      const r = stage.getBoundingClientRect();
      const half = [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ];
      const data = cardData.find((c) => c.mesh === mesh)!;
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const [sx, sy] of half) {
        v3.set((sx * data.w) / 2, (sy * data.h) / 2, 0);
        mesh.localToWorld(v3);
        v3.project(camera);
        const x = r.left + ((v3.x + 1) / 2) * r.width;
        const y = r.top + ((1 - v3.y) / 2) * r.height;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
      return new DOMRect(minX, minY, maxX - minX, maxY - minY);
    };

    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const wp = new THREE.Vector3();
    const caption = captionRef.current;
    let lastHover = -2;

    let raf = 0;
    let last = performance.now();
    let announced = false;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (document.hidden) return;

      if (!announced) {
        announced = true;
        statusRef.current('ready');
      }
      intro = Math.min(1, intro + dt / (reduced ? 0.01 : 1.3));
      const ease = 1 - Math.pow(1 - intro, 3);

      if (!pausedRef.current) {
        const damp = Math.pow(0.92, 60 * dt);
        const speed = st.dragging ? 1 : st.slow;
        st.vYaw = Math.max(-3, Math.min(3, st.vYaw * damp));
        st.vPitch *= damp;
        st.slow += ((st.hover >= 0 ? 0.35 : 1) - st.slow) * (1 - Math.pow(0.88, 60 * dt));
        const flip = Math.cos(st.pitch) < 0 ? -1 : 1;
        st.yaw += (st.vYaw + REST_SPIN * st.dir * (reduced ? 0 : 1)) * dt * speed * flip;
        st.pitch += st.vPitch * dt * speed;
        if (st.pitch > Math.PI) st.pitch -= Math.PI * 2;
        else if (st.pitch < -Math.PI) st.pitch += Math.PI * 2;
        const calm = !st.dragging && Math.abs(st.vPitch) < 0.05;
        st.settled = calm ? st.settled + dt : 0;
        if (st.settled > 0.8) st.pitch += (0.12 - st.pitch) * (1 - Math.exp(-3 * dt));
      }
      orbit.rotation.set(st.pitch, st.yaw, 0, 'YXZ');
      orbit.updateMatrixWorld(true);

      // Aparicion: lineas y tarjetas entran desde el centro
      lineMats.forEach((m) => {
        m.opacity = (m.userData.base as number) * Math.min(1, ease * 1.4);
      });
      ringFront.opacity = ease;
      ringGlow.opacity = ease * 0.55;
      ringBack.opacity = ease * 0.3;
      if (!pausedRef.current) ringYaw += 0.22 * st.dir * (reduced ? 0 : 1) * dt * st.slow;
      ringGroup.rotation.y = ringYaw + Math.PI;
      cardData.forEach((c, i) => {
        c.mesh.position.copy(c.dir).multiplyScalar(1.75 * (0.55 + 0.45 * ease));
        c.mesh.getWorldPosition(wp);
        const back = wp.z < 0;
        const a = Math.min(1, Math.max(0, ease * 1.6 - i * 0.03));
        c.mat.opacity = a * (back ? 0.5 : 1);
        c.mat.color.setScalar(back ? 0.7 : 1);
      });

      // Cual tarjeta esta bajo el cursor (se deshace la curvatura del tubo)
      let hover = -1;
      if (pointer && !pausedRef.current && !reduced) {
        const k = postMat.uniforms.k.value as number;
        const [sx, sy] = bend(pointer.x, pointer.y, k);
        ndc.set(sx * 2 - 1, sy * 2 - 1);
        raycaster.setFromCamera(ndc, camera);
        const hits = raycaster.intersectObjects(meshes, false);
        const front = hits.find((h) => {
          h.object.getWorldPosition(wp);
          return wp.z > 0;
        });
        if (front) hover = cardData.findIndex((c) => c.mesh === front.object);
      } else if (pointer && !pausedRef.current) {
        hover = -1;
      }
      st.hover = hover;
      if (hover !== lastHover) {
        lastHover = hover;
        stage.dataset.over = hover >= 0 ? 'true' : 'false';
        if (caption) caption.dataset.visible = hover >= 0 ? 'true' : 'false';
      }
      if (caption && pointer) {
        const r = stage.getBoundingClientRect();
        caption.style.transform = `translate3d(${(pointer.cx - r.left + 18).toFixed(0)}px, ${(pointer.cy - r.top + 14).toFixed(0)}px, 0)`;
      }

      // Escena -> textura -> vidrio abombado
      renderer.setRenderTarget(target);
      renderer.setClearColor(0x000000, 0);
      renderer.clear();
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      renderer.clear();
      renderer.render(postScene, postCamera);
    };
    raf = requestAnimationFrame(frame);

    const onLost = (e: Event) => {
      e.preventDefault();
      statusRef.current('off');
    };
    canvas.addEventListener('webglcontextlost', onLost);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('webglcontextlost', onLost);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
    };
  }, [cards, title]);

  return (
    <>
      <canvas ref={canvasRef} className="nw-canvas" aria-hidden="true" />
      <p ref={captionRef} className="cursor-caption" data-visible="false" aria-hidden="true">
        <span className="cursor-caption__i">{captionText}</span>
      </p>
    </>
  );
}
