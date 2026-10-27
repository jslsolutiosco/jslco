// Logo 3D de JSL: "S" dorada dentro de corchetes cromados sobre una plataforma de luz.
(function () {
  const canvas = document.getElementById('logo3d');
  const holder = document.getElementById('hero3d');
  if (!canvas || !holder) return;

  if (typeof THREE === 'undefined' || !webglAvailable()) {
    holder.classList.add('no-webgl');
    canvas.style.display = 'none';
    return;
  }

  const isMobile = window.matchMedia('(max-width: 900px)').matches;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 1.6, 14);
  camera.lookAt(0, -0.2, 0);

  // Mapa de entorno pintado en canvas: da los reflejos al oro y al cromo sin cargar imágenes
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = new THREE.CanvasTexture(makeEnvCanvas());
  envTex.mapping = THREE.EquirectangularReflectionMapping;
  envTex.encoding = THREE.sRGBEncoding;
  scene.environment = pmrem.fromEquirectangular(envTex).texture;
  envTex.dispose();

  scene.add(new THREE.AmbientLight(0x2a3a70, 0.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(4, 6, 6);
  scene.add(key);
  const goldLight = new THREE.PointLight(0xffb347, 2.2, 14, 2);
  goldLight.position.set(-2.5, -1, 3);
  scene.add(goldLight);
  const rim = new THREE.PointLight(0x4d7dff, 2.5, 16, 2);
  rim.position.set(3, 2, -4);
  scene.add(rim);
  const under = new THREE.PointLight(0xffc266, 1.6, 8, 2);
  under.position.set(0, -1, 2);
  scene.add(under);

  const world = new THREE.Group();
  scene.add(world);

  // ---------- Logo ----------
  const logo = new THREE.Group();
  logo.position.y = 0.55;
  world.add(logo);

  const goldMat = new THREE.MeshPhysicalMaterial({
    color: 0xffb340, metalness: 1, roughness: 0.2, clearcoat: 0.6, clearcoatRoughness: 0.15,
    emissive: 0x3d2200, emissiveIntensity: 0.35, envMapIntensity: 1.6
  });
  // L y J en blanco perlado metálico, como en la tarjeta
  const whiteMat = new THREE.MeshPhysicalMaterial({
    color: 0xf4f6fb, metalness: 0.75, roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.5
  });

  const DEPTH = 0.55;
  const extrude = { depth: DEPTH, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.08, bevelSegments: 8, curveSegments: 24 };
  const HW = 0.21; // mitad del grosor del trazo

  const sGeo = new THREE.ExtrudeGeometry(strokeShape(sCenterline(0.5), HW), extrude);
  sGeo.center();
  const sMesh = new THREE.Mesh(sGeo, goldMat);
  const sPivot = new THREE.Group();
  sPivot.position.y = -0.12;
  sPivot.add(sMesh);
  logo.add(sPivot);

  const lShape = strokeShape(lCenterline(), HW);
  const jShape = strokeShape(jCenterline(), HW);
  [lShape, jShape].forEach(shape => {
    const geo = new THREE.ExtrudeGeometry(shape, extrude);
    geo.translate(0, 0, -DEPTH / 2);
    logo.add(new THREE.Mesh(geo, whiteMat));

    // Filo dorado luminoso sobre la cara frontal
    const pts = shape.getPoints().map(p => new THREE.Vector3(p.x, p.y, DEPTH / 2 + 0.125));
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts.concat([pts[0]])),
      new THREE.LineBasicMaterial({ color: 0xffc35a, transparent: true, opacity: 0.45 }));
    logo.add(line);
  });

  // Halo detrás del logo
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({
    map: radialTexture('rgba(255,190,90,0.55)', 'rgba(255,150,40,0.12)'),
    blending: THREE.AdditiveBlending, depthWrite: false, transparent: true
  }));
  halo.scale.set(9, 9, 1);
  halo.position.set(0, 0.5, -1.5);
  world.add(halo);

  // ---------- Plataforma ----------
  const platform = new THREE.Group();
  platform.position.y = -2.45;
  world.add(platform);

  const baseMat = new THREE.MeshPhysicalMaterial({ color: 0x0b1530, metalness: 0.85, roughness: 0.45, envMapIntensity: 0.35 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.55, 0.32, 96), baseMat);
  platform.add(base);
  const discTex = new THREE.CanvasTexture(makeDiscCanvas());
  discTex.encoding = THREE.sRGBEncoding;
  const top = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 2.8, 0.14, 96), [
    new THREE.MeshStandardMaterial({ color: 0x1a2a55, metalness: 0.9, roughness: 0.3, envMapIntensity: 0.6 }),
    new THREE.MeshStandardMaterial({ color: 0x0a1430, map: discTex, emissive: 0xffffff, emissiveMap: discTex, emissiveIntensity: 0.9, metalness: 0.6, roughness: 0.5, envMapIntensity: 0.15 }),
    new THREE.MeshStandardMaterial({ color: 0x0a1430 })
  ]);
  top.position.y = 0.22;
  platform.add(top);

  const glowDisc = new THREE.Mesh(
    new THREE.CircleGeometry(2.6, 64),
    new THREE.MeshBasicMaterial({ map: radialTexture('rgba(255,170,70,0.35)', 'rgba(255,140,30,0.06)'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  glowDisc.rotation.x = -Math.PI / 2;
  glowDisc.position.y = 0.3;
  platform.add(glowDisc);

  const rings = [];
  [[2.75, 0.03, 0.29, 1], [3.45, 0.025, 0.12, 0.8], [4.3, 0.012, 0.0, 0.45], [5.2, 0.008, -0.05, 0.25]].forEach(([r, tube, y, op]) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(r, tube, 12, 160),
      new THREE.MeshBasicMaterial({ color: 0xffbf55, transparent: true, opacity: op, blending: THREE.AdditiveBlending })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    platform.add(ring);
    rings.push(ring);
  });

  // Arco de luz que recorre el anillo
  const arc = new THREE.Mesh(
    new THREE.TorusGeometry(3.45, 0.06, 12, 80, Math.PI * 0.45),
    new THREE.MeshBasicMaterial({ color: 0xffe2a0, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending })
  );
  arc.rotation.x = Math.PI / 2;
  arc.position.y = 0.12;
  platform.add(arc);

  // Haz de luz vertical
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 2.6, 5, 64, 1, true),
    new THREE.MeshBasicMaterial({ map: beamTexture(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
  );
  beam.position.y = 2.7;
  platform.add(beam);

  // ---------- Paneles de código flotantes ----------
  const panels = [];
  const panelDefs = [
    { x: -4.0, y: 2.0, z: -1.4, w: 2.4, h: 1.75, ry: 0.45, kind: 0 },
    { x: -4.2, y: -0.5, z: 0.2, w: 1.9, h: 1.25, ry: 0.55, kind: 1 },
    { x: 4.1, y: 2.2, z: -1.6, w: 2.3, h: 1.6, ry: -0.45, kind: 2 },
    { x: 4.2, y: -0.3, z: 0, w: 2.0, h: 1.4, ry: -0.55, kind: 3 },
    { x: -2.4, y: 3.7, z: -3.2, w: 1.6, h: 1.05, ry: 0.2, kind: 4 }
  ];
  panelDefs.forEach((d, i) => {
    if (isMobile && i === 4) return;
    const tex = new THREE.CanvasTexture(makeCodeCanvas(d.kind));
    tex.encoding = THREE.sRGBEncoding;
    tex.anisotropy = 4;
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(d.w, d.h),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.92, side: THREE.DoubleSide, depthWrite: false })
    );
    m.position.set(d.x, d.y, d.z);
    m.rotation.y = d.ry;
    m.userData = { base: m.position.clone(), ry: d.ry, phase: i * 1.3 };
    world.add(m);
    panels.push(m);
  });

  // ---------- Partículas ----------
  const count = isMobile ? 220 : 520;
  const pGeo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const speed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const r = 1.5 + Math.random() * 6.5;
    const a = Math.random() * Math.PI * 2;
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = -2.6 + Math.random() * 8;
    pos[i * 3 + 2] = Math.sin(a) * r * 0.6 - 1;
    speed[i] = 0.15 + Math.random() * 0.5;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({
    size: 0.09, map: radialTexture('rgba(255,225,160,1)', 'rgba(255,170,60,0)'), color: 0xffc66b,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
  }));
  world.add(particles);

  // ---------- Interacción ----------
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  let dragging = false, lastX = 0, spinVel = 0, spinAngle = 0, scrollK = 0;

  window.addEventListener('pointermove', e => {
    mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = (e.clientY / window.innerHeight) * 2 - 1;
    if (dragging) {
      spinVel = (e.clientX - lastX) * 0.012;
      spinAngle += spinVel;
      lastX = e.clientX;
    }
  });
  canvas.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; canvas.setPointerCapture(e.pointerId); });
  window.addEventListener('pointerup', () => { dragging = false; });
  window.addEventListener('scroll', () => {
    scrollK = Math.min(1, window.scrollY / window.innerHeight);
  }, { passive: true });

  let visible = true;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }, { threshold: 0 }).observe(holder);

  function resize() {
    const w = holder.clientWidth, h = holder.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // alejamos la cámara lo justo para que quepan los paneles laterales
    const fitWidth = isMobile ? 10.5 : 10.8;
    camera.position.z = Math.max(13, fitWidth / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect));
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  const clock = new THREE.Clock();
  const easeInOut = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  function tick() {
    requestAnimationFrame(tick);
    if (!visible) return;
    const t = reduceMotion ? 0 : clock.getElapsedTime();

    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;

    if (!dragging) {
      spinVel *= 0.94;
      spinAngle += spinVel;
      spinAngle *= 0.97; // vuelve suavemente al frente
    }

    // Toda la escena se inclina hacia el mouse
    world.rotation.y = mouse.x * 0.28;
    world.rotation.x = mouse.y * 0.1 + scrollK * 0.25;
    world.position.y = -scrollK * 1.2;

    // Logo: flota, se balancea y sigue el cursor
    logo.position.y = 0.55 + Math.sin(t * 1.2) * 0.16;
    logo.rotation.y = Math.sin(t * 0.55) * 0.32 + mouse.x * 0.45 + spinAngle;
    logo.rotation.x = Math.sin(t * 0.8) * 0.05 + mouse.y * 0.18;

    // La S da una vuelta completa cada 8 segundos
    const cycle = (t % 8) / 1.8;
    sPivot.rotation.y = cycle < 1 ? easeInOut(cycle) * Math.PI * 2 : 0;

    goldMat.emissiveIntensity = 0.3 + Math.sin(t * 2.2) * 0.15;
    goldLight.position.x = Math.cos(t * 0.7) * 3.5;
    goldLight.position.z = 2.5 + Math.sin(t * 0.7) * 1.5;
    rim.position.x = Math.sin(t * 0.4) * 4;

    halo.material.opacity = 0.75 + Math.sin(t * 1.5) * 0.2;
    glowDisc.material.opacity = 0.7 + Math.sin(t * 2) * 0.25;
    arc.rotation.z = t * 0.9;
    rings[2].rotation.z = -t * 0.15;
    beam.material.opacity = 0.55 + Math.sin(t * 1.3) * 0.15;

    panels.forEach(p => {
      const u = p.userData;
      p.position.y = u.base.y + Math.sin(t * 0.9 + u.phase) * 0.18;
      p.position.x = u.base.x + Math.cos(t * 0.6 + u.phase) * 0.06;
      p.rotation.y = u.ry + Math.sin(t * 0.5 + u.phase) * 0.06 - mouse.x * 0.12;
    });

    const arr = pGeo.attributes.position.array;
    const dt = reduceMotion ? 0 : 0.016;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += speed[i] * dt;
      arr[i * 3] += Math.sin(t + i) * 0.0015;
      if (arr[i * 3 + 1] > 5.5) arr[i * 3 + 1] = -2.6;
    }
    pGeo.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
  }
  tick();

  // ---------- Helpers ----------
  function webglAvailable() {
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  }

  // Las letras se definen por su línea central (rectas + arcos) y luego se engrosan con puntas redondas
  function path() {
    const pts = [];
    const push = (x, y) => {
      const last = pts[pts.length - 1];
      if (!last || Math.hypot(last.x - x, last.y - y) > 1e-4) pts.push(new THREE.Vector2(x, y));
    };
    const api = {
      line(x0, y0, x1, y1, n = 12) {
        for (let i = 0; i <= n; i++) push(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n);
        return api;
      },
      arc(cx, cy, r, a0, a1, n = 24) {
        for (let i = 0; i <= n; i++) {
          const a = THREE.MathUtils.degToRad(a0 + (a1 - a0) * i / n);
          push(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        }
        return api;
      },
      points: pts
    };
    return api;
  }

  function lCenterline() {
    return path()
      .line(-1.6, 1.75, -1.6, -1.5, 20)
      .arc(-1.35, -1.5, 0.25, 180, 270, 10)
      .line(-1.35, -1.75, -0.55, -1.75, 10).points;
  }

  function jCenterline() {
    return path()
      .line(0.55, 1.75, 1.35, 1.75, 10)
      .arc(1.35, 1.5, 0.25, 90, 0, 10)
      .line(1.6, 1.5, 1.6, -0.95, 20)
      .arc(0.8, -0.95, 0.8, 0, -90, 28)
      .line(0.8, -1.75, 0.5, -1.75, 4).points;
  }

  // S: dos arcos de ~235° unidos en el centro
  function sCenterline(r) {
    return path()
      .arc(0, r, r, 35, 270, 60)
      .arc(0, -r, r, 90, -145, 60).points;
  }

  function strokeShape(center, hw) {
    const left = [], right = [], normals = [];
    center.forEach((p, i) => {
      const a = center[Math.max(0, i - 1)], b = center[Math.min(center.length - 1, i + 1)];
      const tx = b.x - a.x, ty = b.y - a.y, len = Math.hypot(tx, ty) || 1;
      const n = new THREE.Vector2(-ty / len, tx / len);
      normals.push(n);
      left.push(new THREE.Vector2(p.x + n.x * hw, p.y + n.y * hw));
      right.push(new THREE.Vector2(p.x - n.x * hw, p.y - n.y * hw));
    });
    const cap = (p, n, from) => {
      const out = [], base = Math.atan2(n.y, n.x) + from;
      for (let k = 1; k < 12; k++) {
        const a = base - Math.PI * k / 12;
        out.push(new THREE.Vector2(p.x + Math.cos(a) * hw, p.y + Math.sin(a) * hw));
      }
      return out;
    };
    const last = center.length - 1;
    return new THREE.Shape([
      ...left,
      ...cap(center[last], normals[last], 0),
      ...right.reverse(),
      ...cap(center[0], normals[0], Math.PI)
    ]);
  }

  function radialTexture(inner, outer) {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grd.addColorStop(0, inner);
    grd.addColorStop(0.4, outer);
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }

  function beamTexture() {
    const c = document.createElement('canvas');
    c.width = 4; c.height = 256;
    const g = c.getContext('2d');
    const grd = g.createLinearGradient(0, 256, 0, 0);
    grd.addColorStop(0, 'rgba(255,190,90,0.35)');
    grd.addColorStop(0.5, 'rgba(255,170,60,0.08)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 4, 256);
    return new THREE.CanvasTexture(c);
  }

  function makeEnvCanvas() {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 512;
    const g = c.getContext('2d');
    const bg = g.createLinearGradient(0, 0, 0, 512);
    bg.addColorStop(0, '#1a2c5c');
    bg.addColorStop(0.5, '#0a1430');
    bg.addColorStop(1, '#03070f');
    g.fillStyle = bg;
    g.fillRect(0, 0, 1024, 512);
    const box = (x, y, w, h, color, blur) => { g.filter = `blur(${blur}px)`; g.fillStyle = color; g.fillRect(x, y, w, h); };
    box(120, 90, 180, 120, '#ffffff', 10);
    box(600, 60, 260, 70, '#fff4e0', 12);
    box(420, 160, 60, 220, '#ffd18a', 16);
    box(860, 170, 90, 200, '#ffb84d', 20);
    box(20, 230, 70, 160, '#6f9bff', 20);
    box(300, 330, 300, 60, '#ffae3d', 26);
    g.filter = 'none';
    return c;
  }

  // Cara superior de la plataforma: anillos tipo circuito sobre azul oscuro
  function makeDiscCanvas() {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const g = c.getContext('2d');
    const bg = g.createRadialGradient(256, 256, 0, 256, 256, 256);
    bg.addColorStop(0, '#3a2a10');
    bg.addColorStop(0.5, '#0d1838');
    bg.addColorStop(1, '#070e24');
    g.fillStyle = bg;
    g.fillRect(0, 0, 512, 512);
    g.strokeStyle = 'rgba(255,190,90,0.7)';
    [60, 120, 175, 232].forEach((r, i) => {
      g.lineWidth = i === 3 ? 4 : 1.5;
      g.beginPath(); g.arc(256, 256, r, 0, Math.PI * 2); g.stroke();
    });
    g.lineWidth = 1.2;
    g.strokeStyle = 'rgba(255,190,90,0.35)';
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      g.beginPath();
      g.moveTo(256 + Math.cos(a) * 120, 256 + Math.sin(a) * 120);
      g.lineTo(256 + Math.cos(a) * 175, 256 + Math.sin(a) * 175);
      g.stroke();
    }
    return c;
  }

  function makeCodeCanvas(kind) {
    const W = 512, H = 360;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    roundRect(g, 4, 4, W - 8, H - 8, 22);
    const bg = g.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, 'rgba(30,55,115,0.75)');
    bg.addColorStop(1, 'rgba(8,18,45,0.75)');
    g.fillStyle = bg; g.fill();
    g.lineWidth = 3; g.strokeStyle = 'rgba(140,175,255,0.55)'; g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(4, 4, W - 8, 44);
    ['#ff6b6b', '#ffc35a', '#4ade80'].forEach((col, i) => { g.fillStyle = col; g.beginPath(); g.arc(30 + i * 24, 26, 7, 0, Math.PI * 2); g.fill(); });

    const snippets = [
      ['const app = createApp({', '  name: "JSL",', '  build() {', '    return ideas', '      .map(solve)', '      .filter(useful);', '  }', '});'],
      ['<template>', '  <Dashboard', '    :data="ventas"', '  />', '</template>'],
      ['class Proyecto {', '  public function', '    lanzar(): void', '  {', '    $this->deploy();', '  }', '}'],
      ['SELECT cliente,', '  SUM(total)', 'FROM ordenes', 'GROUP BY cliente;'],
      ['$ npm run build', '✓ listo en 1.2s']
    ][kind];
    const palette = ['#7dd3fc', '#ffc35a', '#c4b5fd', '#e2e8f0', '#86efac'];
    g.font = '600 26px Consolas, "Courier New", monospace';
    snippets.forEach((line, i) => {
      g.fillStyle = palette[(i + kind) % palette.length];
      g.fillText(line, 28, 88 + i * 36);
    });
    return c;
  }

  function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }
})();
