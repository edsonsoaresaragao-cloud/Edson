import {
  createAutomotiveStudio,
  zoomStudioCamera,
  resizeStudio,
  visibleModelBounds,
  fitStudioCamera,
} from "./automotive-studio";
import * as THREE from "three";
import { buildEngineModel } from "./engine-model";

export type EngineRenderer = {
  setPaused(value: boolean): void;
  zoomView(factor: number): void;
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
    powerPreference: window.matchMedia("(pointer: coarse)").matches
      ? "low-power"
      : "high-performance",
  });
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = createEngineCamera();
  let studio: ReturnType<typeof createAutomotiveStudio>;
  try {
    studio = createAutomotiveStudio(renderer, scene);
  } catch (error) {
    renderer.dispose();
    renderer.domElement.remove();
    throw error;
  }
  const model = buildEngineModel();
  scene.add(model.group);
  studio.fit(visibleModelBounds(model.group));
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  let frame = 0,
    last = 0,
    angle = 0,
    visible = true,
    disposed = false;
  function render() {
    model.update(angle);
    studio.render(
      camera,
      !paused && !preference.matches && visible && !document.hidden,
    );
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
    resizeStudio(renderer, width, height);
    const bounds = visibleModelBounds(model.group);
    fitStudioCamera(
      camera,
      bounds,
      width / height,
      new THREE.Vector3(5.8, 3.15, 8.4),
      0.86,
    );
    studio.fit(bounds);
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
    studio.dispose();
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
    zoomView(factor) {
      zoomStudioCamera(
        camera,
        visibleModelBounds(model.group).getCenter(new THREE.Vector3()),
        factor,
      );
      render();
    },
    setPaused(value) {
      paused = value;
      sync();
    },
    dispose,
  };
}
