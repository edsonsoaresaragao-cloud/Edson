import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { buildEngineModel } from "./engine-model";

export type EngineRenderer = {
  setPaused(value: boolean): void;
  dispose(): void;
};
export function createEngineCamera(aspect = 720 / 490) {
  const camera = new THREE.PerspectiveCamera(34, aspect, 0.1, 60);
  camera.position.set(5.8, 4.0, 8.4);
  camera.lookAt(0, 0.85, 0);
  camera.updateMatrixWorld();
  return camera;
}
export function createEngineRenderer(
  host: HTMLDivElement,
  paused: boolean,
  onUnavailable?: () => void,
): EngineRenderer {
  if (
    typeof ResizeObserver === "undefined" ||
    typeof IntersectionObserver === "undefined"
  )
    throw new Error("Observadores de visualização indisponíveis");
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, window.innerWidth < 700 ? 1.25 : 1.75),
  );
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = createEngineCamera();
  const room = new RoomEnvironment(),
    pmrem = new THREE.PMREMGenerator(renderer);
  const reflection = (() => {
    try {
      return pmrem.fromScene(room, 0.035);
    } catch (error) {
      room.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      throw error;
    }
  })();
  scene.environment = reflection.texture;
  scene.environmentIntensity = 0.85;
  room.dispose();
  pmrem.dispose();
  const hemisphere = new THREE.HemisphereLight(0xc8dff8, 0x28313c, 2);
  scene.add(hemisphere);
  const key = new THREE.DirectionalLight(0xfff1df, 4);
  key.position.set(1, 7, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -5;
  key.shadow.camera.right = 5;
  key.shadow.camera.top = 5;
  key.shadow.camera.bottom = -5;
  key.shadow.normalBias = 0.025;
  key.shadow.bias = -0.0003;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x8dbcf2, 3);
  rim.position.set(-5, 3, -5);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffffff, 1);
  fill.position.set(6, 1, 2);
  scene.add(fill);
  const model = buildEngineModel();
  scene.add(model.group);
  const floorGeometry = new THREE.PlaneGeometry(18, 12),
    floorMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.03;
  floor.receiveShadow = true;
  scene.add(floor);
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  let frame = 0,
    last = 0,
    angle = 0,
    visible = true,
    disposed = false;
  function render() {
    model.update(angle);
    renderer.render(scene, camera);
  }
  function animate(now: number) {
    if (disposed) return;
    frame = requestAnimationFrame(animate);
    const frameInterval = window.innerWidth < 700 ? 1000 / 30 : 1000 / 60;
    if (last && now - last < frameInterval - 1) return;
    if (last) angle += (Math.min(now - last, 100) * Math.PI * 2) / 2800;
    last = now;
    render();
  }
  function sync() {
    cancelAnimationFrame(frame);
    last = 0;
    if (disposed) return;
    render();
    if (!paused && !preference.matches && visible && !document.hidden)
      frame = requestAnimationFrame(animate);
  }
  function resize() {
    if (disposed) return;
    const width = host.clientWidth || 640,
      height = host.clientHeight || (width * 490) / 720;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    render();
  }
  const sizeObserver = new ResizeObserver(resize);
  sizeObserver.observe(host);
  const visibilityObserver = new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      sync();
    },
    { rootMargin: "80px" },
  );
  visibilityObserver.observe(host);
  preference.addEventListener("change", sync);
  document.addEventListener("visibilitychange", sync);
  try {
    resize();
    sync();
  } catch (error) {
    dispose();
    throw error;
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    sizeObserver.disconnect();
    visibilityObserver.disconnect();
    preference.removeEventListener("change", sync);
    document.removeEventListener("visibilitychange", sync);
    renderer.domElement.removeEventListener("webglcontextlost", contextLost);
    model.dispose();
    floorGeometry.dispose();
    floorMaterial.dispose();
    reflection.dispose();
    key.shadow.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  }
  function contextLost(event: Event) {
    event.preventDefault();
    dispose();
    onUnavailable?.();
  }
  renderer.domElement.addEventListener("webglcontextlost", contextLost);
  return {
    setPaused(value) {
      paused = value;
      sync();
    },
    dispose,
  };
}
