import {
  AmbientLight,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  DirectionalLight,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  HemisphereLight,
  LatheGeometry,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PointLight,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  TubeGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";

/** Mızrak biçimli, orta damarından hafifçe katlanmış ve uzunlamasına kavisli yaprak. */
function leafGeometry(): BufferGeometry {
  const segU = 14;
  const segV = 4;
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const top = new Color("#5f7a43");
  const tipColor = new Color("#8ea66a");
  for (let i = 0; i <= segU; i++) {
    const u = i / segU;
    const half = 0.13 * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.8)), 0.9);
    for (let j = 0; j <= segV; j++) {
      const v = (j / segV) * 2 - 1;
      const x = u;
      const y = v * half;
      const z = -0.16 * u * u + Math.abs(v) * half * 0.55;
      positions.push(x, y, z);
      const c = top.clone().lerp(tipColor, u * 0.6 + Math.abs(v) * 0.25);
      colors.push(c.r, c.g, c.b);
    }
  }
  const row = segV + 1;
  for (let i = 0; i < segU; i++) {
    for (let j = 0; j < segV; j++) {
      const a = i * row + j;
      const b = a + row;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function dropGeometry() {
  const profile: Vector2[] = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const angle = t * Math.PI;
    // damla profili: üstte sivri, altta dolgun
    const r = 0.5 * Math.sin(angle) * Math.pow(Math.sin(angle / 2), 1.6);
    profile.push(new Vector2(Math.max(r, 0), 0.5 - t));
  }
  return new LatheGeometry(profile, 28);
}

/**
 * Prosedürel zeytin dalı sahnesini kurar. Dönen fonksiyon her şeyi temizler.
 * WebGL kullanılamıyorsa hiçbir şey yapmaz (SVG yedek görünüm kalır).
 */
export function mountBranchScene(container: HTMLElement, onReady: () => void): () => void {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch {
    return () => {};
  }
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  container.appendChild(renderer.domElement);

  const scene = new Scene();
  const camera = new PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 0, 10.8);

  scene.add(new HemisphereLight("#dbe7ff", "#3a2c12", 1.1));
  scene.add(new AmbientLight("#ffffff", 0.25));
  const key = new DirectionalLight("#ffe6b0", 2.6);
  key.position.set(3, 5, 6);
  scene.add(key);
  const rim = new PointLight("#e0a526", 40, 20);
  rim.position.set(-4, -2, -2);
  scene.add(rim);

  const branch = new Group();
  branch.scale.setScalar(0.98);
  scene.add(branch);
  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(item: T) => {
    disposables.push(item);
    return item;
  };

  const curve = new CatmullRomCurve3([
    new Vector3(-3.3, 1.75, 0),
    new Vector3(-1.6, 1.85, 0.25),
    new Vector3(0.1, 1.2, 0.1),
    new Vector3(1.6, 0.15, -0.15),
    new Vector3(2.9, -1.35, 0.2),
  ]);
  const wood = track(new MeshStandardMaterial({ color: "#6b5637", roughness: 0.85 }));
  branch.add(new Mesh(track(new TubeGeometry(curve, 60, 0.045, 8, false)), wood));

  const leafGeo = track(leafGeometry());
  const leafFront = track(new MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.05, side: DoubleSide }));
  const leaves: { mesh: Mesh; phase: number; base: number }[] = [];
  const up = new Vector3(0, 0, 1);
  for (let i = 0; i < 26; i++) {
    const t = 0.05 + (i / 26) * 0.93;
    const pos = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    const side = i % 2 === 0 ? 1 : -1;
    const mesh = new Mesh(leafGeo, leafFront);
    mesh.position.copy(pos);
    const heading = Math.atan2(tangent.y, tangent.x) + side * (0.75 + ((i * 37) % 20) / 60);
    mesh.rotation.set(side * 0.5 + ((i * 13) % 10) / 14 - 0.35, ((i * 29) % 12) / 20 - 0.3, heading, "ZYX");
    const scale = 1.25 - t * 0.5 + ((i * 7) % 5) / 25;
    mesh.scale.setScalar(scale);
    mesh.translateOnAxis(up, 0.02);
    branch.add(mesh);
    leaves.push({ mesh, phase: i * 1.7, base: mesh.rotation.x });
  }

  const oliveGeo = track(new SphereGeometry(0.2, 28, 20));
  const stemGeo = track(new TubeGeometry(new CatmullRomCurve3([new Vector3(0, 0, 0), new Vector3(0.02, -0.18, 0), new Vector3(0, -0.34, 0)]), 6, 0.014, 6));
  const oliveColors = ["#74832f", "#3b2b40", "#5a662a", "#2f2436", "#66752e"];
  const olivePoints = [0.26, 0.4, 0.52, 0.66, 0.8];
  let dropAnchor = new Vector3();
  olivePoints.forEach((t, i) => {
    const pos = curve.getPointAt(t);
    const group = new Group();
    group.position.copy(pos);
    group.rotation.z = (i % 2 ? 1 : -1) * 0.12;
    group.add(new Mesh(stemGeo, wood));
    const olive = new Mesh(oliveGeo, track(new MeshPhysicalMaterial({ color: oliveColors[i], roughness: 0.28, clearcoat: 0.6, clearcoatRoughness: 0.25 })));
    olive.scale.set(1, 1.32, 1);
    olive.position.set(0, -0.58, 0);
    group.add(olive);
    branch.add(group);
    if (i === 2) dropAnchor = pos.clone().add(new Vector3(0, -0.86, 0));
  });

  const oil = track(
    new MeshPhysicalMaterial({
      color: "#e9ad2c",
      emissive: "#8a5600",
      emissiveIntensity: 0.45,
      roughness: 0.06,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      transparent: true,
    }),
  );
  const drop = new Mesh(track(dropGeometry()), oil);
  drop.scale.setScalar(0.42);
  branch.add(drop);

  const pointer = { x: 0, y: 0 };
  const onPointer = (e: PointerEvent) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  };
  window.addEventListener("pointermove", onPointer, { passive: true });

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = container;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  let visible = true;
  let raf = 0;
  let first = true;
  let rotY = 0;
  let rotX = 0;
  const start = performance.now();

  const frame = (now: number) => {
    raf = 0;
    if (!visible || document.hidden) return;
    const t = (now - start) / 1000;
    const scroll = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1);

    // imleç ve kaydırma ile yumuşak dönüş
    rotY += (pointer.x * 0.28 + scroll * 0.7 - rotY) * 0.06;
    rotX += (pointer.y * 0.12 - rotX) * 0.06;
    branch.rotation.y = -0.25 + rotY + Math.sin(t * 0.35) * 0.05;
    branch.rotation.x = 0.08 + rotX;
    branch.rotation.z = Math.sin(t * 0.5) * 0.02;
    branch.position.set(-0.25, 0.15 - scroll * 0.6, 0);

    for (const leaf of leaves) leaf.mesh.rotation.x = leaf.base + Math.sin(t * 0.9 + leaf.phase) * 0.06;

    // damla: büyür, uzar, düşer, yeniden oluşur
    const cycle = (t % 6) / 6;
    const grow = Math.min(cycle / 0.55, 1);
    const fall = Math.max((cycle - 0.62) / 0.38, 0);
    drop.position.set(dropAnchor.x, dropAnchor.y - grow * 0.12 - fall * fall * 2.6, dropAnchor.z);
    drop.scale.set(0.42 * (0.35 + grow * 0.65), 0.42 * (0.35 + grow * 0.65) * (1 + fall * 0.5), 0.42 * (0.35 + grow * 0.65));
    oil.opacity = 1 - Math.max((fall - 0.6) / 0.4, 0);

    renderer.render(scene, camera);
    if (first) {
      first = false;
      onReady();
    }
    raf = requestAnimationFrame(frame);
  };
  const kick = () => {
    if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
  };

  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    kick();
  });
  intersection.observe(container);
  document.addEventListener("visibilitychange", kick);
  kick();

  return () => {
    if (raf) cancelAnimationFrame(raf);
    window.removeEventListener("pointermove", onPointer);
    document.removeEventListener("visibilitychange", kick);
    resizeObserver.disconnect();
    intersection.disconnect();
    for (const item of disposables) item.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };
}
