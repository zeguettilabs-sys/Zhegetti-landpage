import { useEffect, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { services } from '../data/services';
import {
  renderCassetteCanvas,
  renderContactShadowCanvas,
  renderCoverCanvas,
} from '../three/vhsTextures';

/** Pose CSS de una ranura del carrusel (px y grados, eje Y hacia abajo). */
export interface CarouselPose {
  tx: number;
  ty: number;
  tz: number;
  scale: number;
  rz: number;
  ry: number;
}

export interface Stage3DSlot {
  slotId: number;
  /** Posicion fija en el rango -3..3; define el escalonado de entrada. */
  offset: number;
  serviceIndex: number;
  pose: CarouselPose;
  opacity: number;
  shade: number;
  active: boolean;
}

export interface Stage3DFrame {
  slots: Stage3DSlot[];
  cardW: number;
  cardH: number;
  isMobile: boolean;
  /** Mientras se arrastra, toda la estanteria baja la luz. */
  dragging: boolean;
  /** Posicion continua del carrusel (en ranuras) y px entre ranuras. */
  position: number;
  spacing: number;
}

export interface Stage3DHover {
  slotId: number | null;
  tiltX: number;
  tiltY: number;
}

export type Stage3DStatus = 'loading' | 'ready' | 'off';

interface VhsStage3DProps {
  frameRef: MutableRefObject<Stage3DFrame | null>;
  hoverRef: MutableRefObject<Stage3DHover>;
  onStatusChange: (status: Stage3DStatus) => void;
}

const DEG = Math.PI / 180;
const RIG_COUNT = 7;
const CASSETTE_H = 76;
const MAX_TARGET_PIXELS = 3_686_400;

export const postVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/**
 * Curvatura de tubo CRT: la escena 3D se dibuja primero en una textura y
 * aqui se dobla como un vidrio abombado. Los bordes se desvanecen para que
 * los estuches de las puntas se fundan con la pantalla en vez de cortarse.
 */
export const postFragment = /* glsl */ `
  uniform sampler2D map;
  uniform float k;
  uniform float aberration;
  uniform vec2 fade;
  varying vec2 vUv;

  vec2 bend(vec2 uv, float kk) {
    vec2 p = uv * 2.0 - 1.0;
    vec2 st = vec2(p.x * (1.0 + kk * p.y * p.y), p.y * (1.0 + kk * p.x * p.x));
    return st * 0.5 + 0.5;
  }

  void main() {
    vec2 st = bend(vUv, k);
    if (st.x < 0.0 || st.x > 1.0 || st.y < 0.0 || st.y > 1.0) {
      gl_FragColor = vec4(0.0);
      return;
    }

    vec4 base = texture2D(map, st);
    float r = texture2D(map, bend(vUv, k * (1.0 + aberration))).r;
    float b = texture2D(map, bend(vUv, k * (1.0 - aberration))).b;
    vec4 c = vec4(r, base.g, b, base.a);

    vec2 edge = smoothstep(vec2(0.0), fade, st) * smoothstep(vec2(0.0), fade, 1.0 - st);
    float a = c.a * edge.x * edge.y;

    // La textura viene premultiplicada: se separa el alfa para el tonemapping
    vec3 col = c.a > 0.0005 ? min(c.rgb / c.a, vec3(4.0)) : vec3(0.0);
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    gl_FragColor = vec4(gl_FragColor.rgb * a, a);
  }
`;

function roundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const x = -w / 2;
  const y = -h / 2;
  const s = new THREE.Shape();
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** ShapeGeometry usa las coordenadas como UV; se normalizan al rectangulo. */
function normalizeShapeUv(geo: THREE.BufferGeometry, w: number, h: number) {
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i += 1) {
    uv.setXY(i, (pos.getX(i) + w / 2) / w, (pos.getY(i) + h / 2) / h);
  }
  uv.needsUpdate = true;
}

interface CaseGeometries {
  key: string;
  w: number;
  h: number;
  depth: number;
  body: THREE.ExtrudeGeometry;
  cover: THREE.ShapeGeometry;
  cassette: THREE.BoxGeometry;
  shadow: THREE.PlaneGeometry;
}

function buildCaseGeometries(w: number, h: number, isMobile: boolean): CaseGeometries {
  // Un estuche VHS real es grueso: se nota el canto en los laterales.
  const depth = Math.round(Math.max(30, w * (isMobile ? 0.16 : 0.2)));
  const radius = 5;
  const bevel = 1.6;

  const body = new THREE.ExtrudeGeometry(
    roundedRectShape(w - bevel * 2, h - bevel * 2, radius - bevel),
    {
      depth: depth - bevel * 2,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 3,
      curveSegments: 6,
    }
  );
  body.translate(0, 0, -(depth - bevel * 2) / 2);
  body.computeVertexNormals();

  const cover = new THREE.ShapeGeometry(roundedRectShape(w, h, radius), 8);
  normalizeShapeUv(cover, w, h);

  const cassette = new THREE.BoxGeometry(w * 0.82, CASSETTE_H, depth * 0.6);
  const shadow = new THREE.PlaneGeometry(w * 1.08, 46);

  return {
    key: '',
    w,
    h,
    depth,
    body,
    cover,
    cassette,
    shadow,
  };
}

function disposeGeometries(g: CaseGeometries | null) {
  if (!g) return;
  g.body.dispose();
  g.cover.dispose();
  g.cassette.dispose();
  g.shadow.dispose();
}

interface CaseRig {
  slotId: number | null;
  root: THREE.Group;
  entry: THREE.Group;
  lift: THREE.Group;
  body: THREE.Mesh;
  cover: THREE.Mesh;
  cassette: THREE.Mesh;
  shadow: THREE.Mesh;
  bodyMat: THREE.MeshPhysicalMaterial;
  coverMat: THREE.MeshPhysicalMaterial;
  cassetteFrontMat: THREE.MeshPhysicalMaterial;
  cassetteShellMat: THREE.MeshPhysicalMaterial;
  shadowMat: THREE.MeshBasicMaterial;
  hover: number;
  active: number;
  rise: number;
}

function createRig(shadowTex: THREE.Texture): CaseRig {
  const root = new THREE.Group();
  root.rotation.order = 'ZYX';
  const entry = new THREE.Group();
  const lift = new THREE.Group();
  lift.rotation.order = 'XYZ';
  root.add(entry);
  entry.add(lift);

  // Plastico negro algo gastado: los cantos atrapan el reflejo del entorno
  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: '#161515',
    roughness: 0.55,
    metalness: 0,
    clearcoat: 0.3,
    clearcoatRoughness: 0.4,
    transparent: true,
  });
  // Funda plastica sobre la caratula impresa: brillo nitido encima del papel mate
  const coverMat = new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    roughness: 0.86,
    metalness: 0,
    clearcoat: 0.32,
    clearcoatRoughness: 0.42,
    specularIntensity: 0.25,
    transparent: true,
  });
  const cassetteFrontMat = new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    roughness: 0.7,
    clearcoat: 0.2,
    clearcoatRoughness: 0.45,
    specularIntensity: 0.3,
    transparent: true,
  });
  const cassetteShellMat = new THREE.MeshPhysicalMaterial({
    color: '#1b1b1b',
    roughness: 0.4,
    clearcoat: 0.4,
    transparent: true,
  });
  const shadowMat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    color: '#000000',
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });

  const placeholder = new THREE.BufferGeometry();
  const shadow = new THREE.Mesh(placeholder, shadowMat);
  shadow.renderOrder = -1;
  const body = new THREE.Mesh(placeholder, bodyMat);
  body.renderOrder = 0;
  const cassette = new THREE.Mesh(placeholder, [
    cassetteShellMat,
    cassetteShellMat,
    cassetteShellMat,
    cassetteShellMat,
    cassetteFrontMat,
    cassetteShellMat,
  ]);
  cassette.renderOrder = 0;
  const cover = new THREE.Mesh(placeholder, coverMat);
  cover.renderOrder = 1;

  lift.add(shadow, cassette, body, cover);

  return {
    slotId: null,
    root,
    entry,
    lift,
    body,
    cover,
    cassette,
    shadow,
    bodyMat,
    coverMat,
    cassetteFrontMat,
    cassetteShellMat,
    shadowMat,
    hover: 0,
    active: 0,
    rise: -22,
  };
}

function applyGeometries(rig: CaseRig, g: CaseGeometries) {
  rig.body.geometry = g.body;
  rig.cover.geometry = g.cover;
  rig.cover.position.z = g.depth / 2 + 0.35;
  rig.cassette.geometry = g.cassette;
  rig.shadow.geometry = g.shadow;
  rig.shadow.position.set(0, -g.h / 2 - 16, -g.depth / 2);
}

const easeOut = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 4);
const approach = (current: number, target: number, speed: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-speed * dt));

/**
 * Sin GPU (render por software) la escena va a tirones: mejor el carrusel plano.
 * Se prueba en un lienzo aparte para no ensuciar la consola con errores de Three.
 */
export function hasHardwareWebGL2(): boolean {
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2', { failIfMajorPerformanceCaveat: true });
    if (!gl) return false;
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const name = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return !/swiftshader|llvmpipe|software|basic render/i.test(name);
  } catch {
    return false;
  }
}

function readStageCamera(stage: HTMLElement, w: number, h: number) {
  const cs = getComputedStyle(stage);
  const perspective = parseFloat(cs.perspective) || 1800;
  const [oxRaw, oyRaw] = cs.perspectiveOrigin.split(' ');
  const ox = Number.isFinite(parseFloat(oxRaw)) ? parseFloat(oxRaw) : w / 2;
  const oy = Number.isFinite(parseFloat(oyRaw)) ? parseFloat(oyRaw) : h * 0.48;
  return { perspective, ox, oy };
}

export function VhsStage3D({ frameRef, hoverRef, onStatusChange }: VhsStage3DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const statusRef = useRef(onStatusChange);
  statusRef.current = onStatusChange;

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = canvas?.parentElement;
    if (!canvas || !stage || !hasHardwareWebGL2()) {
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

    let disposed = false;
    let ready = false;
    const setStatus = (s: Stage3DStatus) => {
      if (!disposed) statusRef.current(s);
    };

    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmrem.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    scene.environmentIntensity = 0.16;
    roomEnv.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      mesh.geometry?.dispose();
      const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else mat?.dispose();
    });
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera();

    // Luz principal desde arriba y al frente: el estuche central queda iluminado
    const key = new THREE.SpotLight('#fff1e2', 1.55, 0, 0.5, 1, 0);
    scene.add(key, key.target);
    const fill = new THREE.DirectionalLight('#dfe6ff', 0.32);
    fill.position.set(-0.5, 0.25, 1);
    const rim = new THREE.DirectionalLight('#ffe2d2', 0.5);
    rim.position.set(0.55, 0.9, -0.45);
    const ambient = new THREE.AmbientLight('#ffffff', 0.22);
    scene.add(fill, rim, ambient);

    const target = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      samples: 4,
    });
    const postMat = new THREE.ShaderMaterial({
      vertexShader: postVertex,
      fragmentShader: postFragment,
      uniforms: {
        map: { value: target.texture },
        k: { value: 0.06 },
        aberration: { value: 0.035 },
        fade: { value: new THREE.Vector2(0.06, 0.012) },
      },
      depthTest: false,
      depthWrite: false,
      blending: THREE.NoBlending,
    });
    const postQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat);
    postQuad.frustumCulled = false;
    const postScene = new THREE.Scene();
    postScene.add(postQuad);
    const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const shadowTex = new THREE.CanvasTexture(renderContactShadowCanvas());
    const coverTextures: THREE.Texture[] = [];
    const cassetteTextures: THREE.Texture[] = [];

    const rigs: CaseRig[] = [];
    for (let i = 0; i < RIG_COUNT; i += 1) {
      const rig = createRig(shadowTex);
      rig.root.visible = false;
      scene.add(rig.root);
      rigs.push(rig);
    }

    let geos: CaseGeometries | null = null;
    let stageW = 0;
    let stageH = 0;
    /** Px que la escena sigue hacia abajo, por detras del pie de pantalla. */
    let extra = 0;
    let viewportH = window.innerHeight;
    const bufferSize = new THREE.Vector2();

    const resize = () => {
      stageW = Math.max(1, stage.clientWidth);
      stageH = Math.max(1, stage.clientHeight);
      viewportH = window.innerHeight;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      // El pie no debe cortar los estuches: el lienzo baja hasta el borde del tubo
      const content = stage.closest('.crt-content');
      extra =
        content && window.matchMedia('(min-width: 768px) and (min-height: 680px)').matches
          ? Math.max(0, Math.min(120, Math.round(content.getBoundingClientRect().bottom - stage.getBoundingClientRect().bottom)))
          : 0;
      canvas.style.height = extra ? `${stageH + extra}px` : '';
      renderer.setSize(stageW, stageH + extra, false);

      renderer.getDrawingBufferSize(bufferSize);
      const cap = Math.min(1, Math.sqrt(MAX_TARGET_PIXELS / Math.max(1, bufferSize.x * bufferSize.y)));
      target.setSize(
        Math.max(1, Math.round(bufferSize.x * cap)),
        Math.max(1, Math.round(bufferSize.y * cap))
      );

      // Camara equivalente a la perspectiva CSS del escenario: 1 unidad = 1px
      const { perspective, ox, oy } = readStageCamera(stage, stageW, stageH);
      const cx = ox - stageW / 2;
      const cy = stageH / 2 - oy;
      const near = perspective * 0.3;
      const far = perspective * 3;
      const s = near / perspective;
      camera.position.set(cx, cy, perspective);
      camera.near = near;
      camera.far = far;
      camera.updateMatrixWorld();
      camera.projectionMatrix.makePerspective(
        (-stageW / 2 - cx) * s,
        (stageW / 2 - cx) * s,
        (stageH / 2 - cy) * s,
        (-stageH / 2 - extra - cy) * s,
        near,
        far
      );
      camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();

      key.position.set(0, stageH * 0.75, perspective * 0.85);
      key.target.position.set(0, -stageH * 0.05, 0);

      const mobile = stageW < 740;
      postMat.uniforms.k.value = mobile ? 0.035 : 0.06;
      postMat.uniforms.fade.value.set(mobile ? 0.04 : 0.06, extra ? 0.035 : 0.012);
    };

    resize();
    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    resizeObserver?.observe(stage);
    window.addEventListener('resize', resize);

    const onContextLost = (event: Event) => {
      event.preventDefault();
      ready = false;
      setStatus('off');
    };
    canvas.addEventListener('webglcontextlost', onContextLost);

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const crtScreen = stage.closest('.crt-screen');
    const readIntroStep = () => {
      const raw = crtScreen?.getAttribute('data-intro-step');
      return raw == null ? 3 : Number(raw);
    };
    let introStart = readIntroStep() >= 3 ? -Infinity : Number.NaN;

    const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const makeTexture = (source: HTMLCanvasElement) => {
      const tex = new THREE.CanvasTexture(source);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = anisotropy;
      return tex;
    };

    const coverScale = window.innerWidth < 740 ? 1.8 : 2.4;
    Promise.all([
      Promise.all(services.map((s) => renderCoverCanvas(s, { scale: coverScale }))),
      Promise.all(
        services.map((s) => renderCassetteCanvas(`Z-${String(s.order).padStart(2, '0')}`))
      ),
    ])
      .then(([covers, cassettes]) => {
        if (disposed) return;
        covers.forEach((c) => coverTextures.push(makeTexture(c)));
        cassettes.forEach((c) => cassetteTextures.push(makeTexture(c)));
        ready = true;
      })
      .catch((err) => {
        console.warn('[vhs-3d] sin texturas, se usa el carrusel plano:', err);
        setStatus('off');
      });

    let raf = 0;
    let last = performance.now();
    let announced = false;
    let dragDim = 0;
    let lastPosition: number | null = null;
    let velocity = 0;
    let squash = 0;
    const mouse = { x: 0, y: 0 };
    const tilt = { x: 0, y: 0 };
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = (event.clientY / window.innerHeight) * 2 - 1;
    };
    const onPointerLeave = () => {
      mouse.x = 0;
      mouse.y = 0;
    };
    window.addEventListener('pointermove', onPointerMove);
    document.documentElement.addEventListener('pointerleave', onPointerLeave);

    const update = (now: number, dt: number) => {
      const frame = frameRef.current;
      if (!frame) return false;

      const needKey = `${frame.cardW}x${frame.cardH}x${frame.isMobile ? 'm' : 'd'}`;
      if (!geos || geos.key !== needKey) {
        const previous = geos;
        const next = buildCaseGeometries(frame.cardW, frame.cardH, frame.isMobile);
        next.key = needKey;
        rigs.forEach((rig) => applyGeometries(rig, next));
        disposeGeometries(previous);
        geos = next;
      }
      const g = geos;

      const step = readIntroStep();
      if (step < 3) introStart = Number.NaN;
      else if (Number.isNaN(introStart)) introStart = now;

      const still = reducedMotion.matches;
      const hover = hoverRef.current;
      const rise = Math.min(46, Math.max(32, viewportH * 0.047));
      const riseHover = Math.min(56, Math.max(40, viewportH * 0.057));
      dragDim = approach(dragDim, frame.dragging ? 1 : 0, 8, dt);

      // Velocidad del carrusel en px/s: al moverse, los estuches giran hacia donde van
      const rawVelocity =
        lastPosition === null ? 0 : ((frame.position - lastPosition) / dt) * frame.spacing;
      lastPosition = frame.position;
      velocity = approach(velocity, still ? 0 : rawVelocity, 10, dt);
      if (Math.abs(velocity) < 1 && !frame.dragging) velocity = 0;
      // Al ir rapido la rueda se hunde un poco hacia atras
      const squashTarget = still
        ? 0
        : Math.min(1, Math.abs(velocity) / 2600 + (frame.dragging ? 0.25 : 0));
      squash = approach(squash, squashTarget, squashTarget > squash ? 8 : 3, dt);
      // El estuche central sigue al mouse con calma
      tilt.x = approach(tilt.x, still ? 0 : mouse.x, 2.4, dt);
      tilt.y = approach(tilt.y, still ? 0 : mouse.y, 2.4, dt);
      const spinY = Math.max(-0.55, Math.min(0.55, -0.00011 * velocity));

      // Reasignar estuches por identidad de ranura para que el estado suave no salte
      const wanted = new Set(frame.slots.map((s) => s.slotId));
      rigs.forEach((rig) => {
        if (rig.slotId !== null && !wanted.has(rig.slotId)) rig.slotId = null;
      });

      for (const slot of frame.slots) {
        let rig = rigs.find((r) => r.slotId === slot.slotId);
        if (!rig) {
          rig = rigs.find((r) => r.slotId === null);
          if (!rig) continue;
          rig.slotId = slot.slotId;
          rig.hover = 0;
          rig.active = slot.active ? 1 : 0;
          rig.rise = slot.active ? rise : -22;
        }

        const { pose } = slot;
        const along = (slot.slotId - frame.position) * frame.spacing;
        rig.root.position.set(pose.tx, -pose.ty, pose.tz - Math.abs(along) * 0.45 * squash);
        rig.root.rotation.set(0, pose.ry * DEG, -pose.rz * DEG);
        rig.root.scale.setScalar(pose.scale);

        // Entrada escalonada (equivale a .carousel-slot__entry)
        let entryMove = 1;
        let entryFade = 1;
        if (Number.isNaN(introStart)) {
          entryMove = 0;
          entryFade = 0;
        } else if (Number.isFinite(introStart)) {
          const delay = Math.abs(slot.offset) * 75;
          entryMove = easeOut((now - introStart - delay) / 620);
          entryFade = easeOut((now - introStart - delay) / 540);
        }
        rig.entry.position.y = -84 * (1 - entryMove);
        rig.entry.scale.setScalar(0.9 + 0.1 * entryMove);

        const isHovered = hover.slotId === slot.slotId;
        rig.hover = approach(rig.hover, isHovered ? 1 : 0, 14, dt);
        rig.active = approach(rig.active, slot.active ? 1 : 0, 10, dt);
        const riseTarget = slot.active ? (isHovered ? riseHover : rise) : -22;
        rig.rise = approach(rig.rise, riseTarget, 9, dt);

        // Giro 3D: hacia el mouse (solo el central y sus vecinos cercanos),
        // hacia donde se mueve la rueda y hacia atras al ir rapido
        const nearCenter = Math.max(0, Math.min(1, 1 - Math.abs(slot.slotId - frame.position)));
        rig.lift.position.set(0, 0, 0);
        rig.lift.rotation.set(
          0.16 * tilt.y * nearCenter - 0.42 * squash,
          spinY + 0.22 * tilt.x * nearCenter,
          0
        );

        const opacity = slot.opacity * entryFade;
        rig.root.visible = opacity > 0.01;
        const light = (1 - slot.shade * 0.8) * (1 - 0.42 * dragDim);

        const coverTex = coverTextures[slot.serviceIndex] ?? null;
        if (rig.coverMat.map !== coverTex) {
          rig.coverMat.map = coverTex;
          rig.coverMat.needsUpdate = true;
        }
        const cassetteTex = cassetteTextures[slot.serviceIndex] ?? null;
        if (rig.cassetteFrontMat.map !== cassetteTex) {
          rig.cassetteFrontMat.map = cassetteTex;
          rig.cassetteFrontMat.needsUpdate = true;
        }

        rig.coverMat.color.setScalar(light);
        rig.coverMat.envMapIntensity = 0.35 + 0.65 * light;
        rig.coverMat.opacity = opacity;
        rig.bodyMat.color.set('#161515').multiplyScalar(0.6 + 0.4 * light);
        rig.bodyMat.opacity = opacity;
        rig.shadowMat.opacity = opacity * 0.85;

        const cassetteAlpha = opacity * Math.min(1, Math.max(0, (rig.rise + 22) / 30));
        rig.cassette.visible = cassetteAlpha > 0.01;
        rig.cassetteFrontMat.opacity = cassetteAlpha;
        rig.cassetteShellMat.opacity = cassetteAlpha;
        rig.cassetteFrontMat.color.setScalar(light);
        rig.cassette.position.set(0, g.h / 2 - 4 + rig.rise - CASSETTE_H / 2, -g.depth * 0.08);
      }

      rigs.forEach((rig) => {
        if (rig.slotId === null) rig.root.visible = false;
      });
      return true;
    };

    const loop = (now: number) => {
      raf = window.requestAnimationFrame(loop);
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
      last = now;
      if (!ready || disposed || document.hidden) return;
      if (!update(now, dt)) return;

      renderer.setRenderTarget(target);
      renderer.clear();
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      renderer.render(postScene, postCamera);

      if (!announced) {
        announced = true;
        setStatus('ready');
      }
    };
    raf = window.requestAnimationFrame(loop);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(raf);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      disposeGeometries(geos);
      rigs.forEach((rig) => {
        rig.bodyMat.dispose();
        rig.coverMat.dispose();
        rig.cassetteFrontMat.dispose();
        rig.cassetteShellMat.dispose();
        rig.shadowMat.dispose();
      });
      coverTextures.forEach((t) => t.dispose());
      cassetteTextures.forEach((t) => t.dispose());
      shadowTex.dispose();
      envTarget.dispose();
      target.dispose();
      postMat.dispose();
      postQuad.geometry.dispose();
      renderer.dispose();
    };
  }, [frameRef, hoverRef]);

  return <canvas ref={canvasRef} className="carousel-stage__webgl" aria-hidden="true" />;
}
