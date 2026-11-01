import * as T from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { buildSuspensionModel } from "./suspension-model";
import type { SuspensionState } from "./suspension-parts";

export function createSuspensionRenderer(
  host: HTMLDivElement,
  initial: SuspensionState,
  onSelect: (id: number) => void,
  onUnavailable: () => void,
) {
  const renderer = new T.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  host.append(renderer.domElement);
  const scene = new T.Scene(),
    camera = new T.PerspectiveCamera(40, 1, 0.1, 60);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableDamping = false;
  controls.minPolarAngle = 0.25;
  controls.maxPolarAngle = Math.PI * 0.78;
  // One-finger vertical gestures remain available for page scrolling.
  controls.touches.ONE = T.TOUCH.ROTATE;
  renderer.domElement.style.touchAction = "pan-y";
  function resetView() {
    camera.position.set(7, 5, 10);
    controls.target.set(0, 1.4, 0);
    controls.update();
  }
  resetView();
  const room = new RoomEnvironment(),
    pmrem = new T.PMREMGenerator(renderer);
  let reflection: T.WebGLRenderTarget;
  try {
    reflection = pmrem.fromScene(room, 0.04);
  } catch (error) {
    room.dispose();
    pmrem.dispose();
    controls.dispose();
    renderer.dispose();
    renderer.domElement.remove();
    throw error;
  }
  room.dispose();
  pmrem.dispose();
  scene.environment = reflection.texture;
  scene.add(new T.HemisphereLight(0xc8e5ff, 0x25303b, 2.5));
  for (const [x, y, z, color, power] of [
    [2, 7, 6, 0xffedda, 4],
    [-5, 3, -4, 0x80b7ff, 3],
    [6, 1, 1, 0xffffff, 2],
  ]) {
    const l = new T.DirectionalLight(color, power);
    l.position.set(x, y, z);
    scene.add(l);
  }
  const model = buildSuspensionModel();
  scene.add(model.group);
  let state = { ...initial },
    paused = false,
    disposed = false,
    visible = true,
    time = 0,
    last = 0,
    frame = 0;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  function render() {
    if (disposed) return;
    model.update(time, state);
    renderer.render(scene, camera);
  }
  function tick(now: number) {
    if (disposed) return;
    frame = requestAnimationFrame(tick);
    if (last && now - last < 32) return;
    if (last) time += Math.min(now - last, 100) / 1000;
    last = now;
    render();
  }
  function sync() {
    cancelAnimationFrame(frame);
    last = 0;
    render();
    if (!disposed && !paused && !reduced.matches && visible && !document.hidden)
      frame = requestAnimationFrame(tick);
  }
  function resize() {
    const w = host.clientWidth || 700,
      h = host.clientHeight || 500;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    render();
  }
  const size = new ResizeObserver(resize);
  size.observe(host);
  const visibility = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    sync();
  });
  visibility.observe(host);
  controls.addEventListener("change", render);
  reduced.addEventListener("change", sync);
  document.addEventListener("visibilitychange", sync);
  const ray = new T.Raycaster(),
    pointer = new T.Vector2();
  let downX = 0,
    downY = 0;
  function down(e: PointerEvent) {
    downX = e.clientX;
    downY = e.clientY;
  }
  function pick(e: PointerEvent) {
    if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      (-(e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    ray.setFromCamera(pointer, camera);
    let object: T.Object3D | null =
      ray.intersectObject(model.group, true)[0]?.object ?? null;
    while (object) {
      if (object.userData.part) {
        onSelect(object.userData.part);
        break;
      }
      object = object.parent;
    }
  }
  function lost(e: Event) {
    e.preventDefault();
    dispose();
    onUnavailable();
  }
  renderer.domElement.addEventListener("pointerdown", down);
  renderer.domElement.addEventListener("pointerup", pick);
  renderer.domElement.addEventListener("webglcontextlost", lost);
  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    size.disconnect();
    visibility.disconnect();
    controls.removeEventListener("change", render);
    controls.dispose();
    reduced.removeEventListener("change", sync);
    document.removeEventListener("visibilitychange", sync);
    renderer.domElement.removeEventListener("pointerdown", down);
    renderer.domElement.removeEventListener("pointerup", pick);
    renderer.domElement.removeEventListener("webglcontextlost", lost);
    model.dispose();
    reflection.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  }
  try {
    resize();
    sync();
  } catch (error) {
    dispose();
    throw error;
  }
  return {
    setState(value: SuspensionState) {
      state = { ...value };
      render();
    },
    setPaused(value: boolean) {
      paused = value;
      sync();
    },
    resetView,
    dispose,
  };
}
export type SuspensionRenderer = ReturnType<typeof createSuspensionRenderer>;
