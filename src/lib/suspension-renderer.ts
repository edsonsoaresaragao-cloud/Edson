import * as T from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { buildSuspensionModel } from "./suspension-model";
import { suspensionParts, type SuspensionState } from "./suspension-parts";

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
    camera.position.set(6.5, 4.7, 9.5);
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
  const overlay = document.createElement("div");
  overlay.className = "suspension-annotations";
  const lines = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  overlay.append(lines);
  const labels = suspensionParts.map((part) => {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    lines.append(line);
    const button = document.createElement("button");
    button.type = "button";
    button.title = part.name;
    button.innerText = `${part.id} · ${part.name}`;
    button.onclick = () => onSelect(part.id);
    overlay.append(button);
    return { line, button, part };
  });
  host.append(overlay);
  const anchor = new T.Vector3(),
    bounds = new T.Box3();
  function annotate() {
    const width = host.clientWidth,
      height = host.clientHeight;
    labels.forEach(({ line, button, part }, i) => {
      const object = model.group.children[i].children[0];
      bounds.setFromObject(object);
      bounds.getCenter(anchor);
      anchor.project(camera);
      const labelWidth = width < 550 ? 80 : 140;
      const left = i < 10,
        x = left ? 8 : width - labelWidth - 8,
        y = 48 + ((i % 10) * (height - 90)) / 10;
      button.style.left = `${x}px`;
      button.style.top = `${y}px`;
      button.dataset.selected = String(state.selected === part.id);
      line.setAttribute(
        "x1",
        String(left ? labelWidth + 8 : width - labelWidth - 8),
      );
      line.setAttribute("y1", String(y + 12));
      line.setAttribute("x2", String(((anchor.x + 1) * width) / 2));
      line.setAttribute("y2", String(((1 - anchor.y) * height) / 2));
      line.setAttribute("opacity", state.selected === part.id ? "1" : ".22");
    });
  }
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
    annotate();
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
    overlay.remove();
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
