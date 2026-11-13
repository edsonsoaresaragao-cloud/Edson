import {
  createAutomotiveStudio,
  zoomStudioCamera,
  resizeStudio,
  visibleModelBounds,
  createStudioFraming,
} from "./automotive-studio";
import * as T from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { buildCoolingModel } from "./cooling-model";
import { coolingParts, type CoolingState } from "./cooling-parts";

export function createCoolingRenderer(
  host: HTMLDivElement,
  initial: CoolingState,
  onSelect: (id: number) => void,
  onUnavailable: () => void,
) {
  const renderer = new T.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: window.matchMedia("(pointer: coarse)").matches
      ? "low-power"
      : "high-performance",
  });
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
    camera.position.set(3, 4, 13);
    controls.target.set(0, 0.8, 0);
    controls.update();
  }
  resetView();
  let studio: ReturnType<typeof createAutomotiveStudio>;
  try {
    studio = createAutomotiveStudio(renderer, scene);
  } catch (error) {
    controls.dispose();
    renderer.dispose();
    renderer.domElement.remove();
    throw error;
  }
  const model = buildCoolingModel();
  scene.add(model.group);
  const framing = createStudioFraming(host, camera, controls, model.group);
  const overlay = document.createElement("div");
  overlay.className = "suspension-annotations studio-annotations";
  const lines = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  overlay.append(lines);
  const labels = coolingParts.map((part) => {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    lines.append(line);
    const button = document.createElement("button");
    button.type = "button";
    button.title = part.name;
    button.setAttribute("aria-label", `${part.id} · ${part.name}`);
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
      const expanded = state.selected === part.id && width >= 650;
      const labelWidth = expanded ? 160 : 32;
      button.textContent = expanded
        ? `${part.id} · ${part.name}`
        : String(part.id);
      button.style.width = `${labelWidth}px`;
      button.setAttribute("aria-pressed", String(state.selected === part.id));
      const left = i < 8,
        x = left ? 8 : width - labelWidth - 8,
        y = 48 + ((i < 8 ? i : i - 8) * (height - 90)) / 8;
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
  let drawing = false;
  function render() {
    if (disposed || drawing) return;
    drawing = true;
    model.update(time, state);
    const fitted = framing.update(
      JSON.stringify([
        state.explosion,
        "cutaway" in state ? state.cutaway : false,
      ]),
    );
    if (fitted) studio.fit(fitted);
    studio.render(
      camera,
      !paused && !reduced.matches && visible && !document.hidden,
    );
    annotate();
    drawing = false;
  }
  function tick(now: number) {
    if (disposed) return;
    frame = requestAnimationFrame(tick);
    if (last && now - last < 32) return;
    if (last) time += Math.min(now - last, 100) / 800;
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
    resizeStudio(renderer, w, h);
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
    studio.dispose();
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
    zoomView(factor: number) {
      zoomStudioCamera(camera, controls.target, factor);
      render();
    },
    setState(value: CoolingState) {
      studio.invalidateShadows();
      state = { ...value };
      render();
    },
    setPaused(value: boolean) {
      paused = value;
      sync();
    },
    resetView() {
      framing.reset();
      studio.fit(visibleModelBounds(model.group));
      render();
    },
    dispose,
  };
}
export type CoolingRenderer = ReturnType<typeof createCoolingRenderer>;
