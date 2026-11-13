import {
  createAutomotiveStudio,
  zoomStudioCamera,
  resizeStudio,
  visibleModelBounds,
  fitStudioCamera,
} from "./automotive-studio";
import * as T from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { buildStarterModel } from "./starter-model";
import { starterParts, type StarterState } from "./starter-parts";

export function createStarterRenderer(
  host: HTMLDivElement,
  initial: StarterState,
  onSelect: (id: number) => void,
  onUnavailable: () => void,
  onStep?: (step: number, contact: boolean) => void,
) {
  const renderer = new T.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: window.matchMedia("(pointer: coarse)").matches
      ? "low-power"
      : "high-performance",
  });
  renderer.localClippingEnabled = true;
  host.append(renderer.domElement);
  renderer.domElement.setAttribute("role", "img");
  renderer.domElement.setAttribute(
    "aria-label",
    "Modelo 3D didático do motor de partida",
  );
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
    const bounds = visibleModelBounds(model.group);
    if (bounds.isEmpty()) return;
    const center = fitStudioCamera(
      camera,
      bounds,
      (host.clientWidth || 700) / (host.clientHeight || 500),
      new T.Vector3(-0.38, 0.25, 1),
      0.8,
    );
    studio.fit(bounds);
    controls.target.copy(center);
    controls.update();
  }
  let studio: ReturnType<typeof createAutomotiveStudio>;
  try {
    studio = createAutomotiveStudio(renderer, scene);
  } catch (error) {
    controls.dispose();
    renderer.dispose();
    renderer.domElement.remove();
    throw error;
  }
  const model = buildStarterModel();
  model.update(0, initial);
  scene.add(model.group);
  const overlay = document.createElement("div");
  overlay.className =
    "suspension-annotations starter-annotations studio-annotations";
  const lines = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  overlay.append(lines);
  const labels = starterParts.map((part) => {
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
      const object = model.parts[i];
      bounds.setFromObject(object);
      bounds.getCenter(anchor);
      anchor.project(camera);
      const expanded = state.selected === part.id && width >= 650;
      const labelWidth = expanded ? 160 : 32;
      button.style.width = `${labelWidth}px`;
      button.setAttribute("aria-pressed", String(state.selected === part.id));
      const left = i < 6,
        row = left ? i : i - 6;
      const x = left ? 8 : width - labelWidth - 8;
      const y = 54 + (row * (height - 100)) / 6;
      button.innerText = expanded
        ? `${part.id} · ${part.name}`
        : String(part.id);
      button.style.display =
        state.isolate && state.selected !== part.id ? "none" : "block";
      line.style.display = button.style.display;
      button.style.left = `${x}px`;
      button.style.width = `${labelWidth}px`;
      button.style.top = `${y}px`;
      button.dataset.selected = String(state.selected === part.id);
      button.setAttribute("aria-pressed", String(state.selected === part.id));
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
  let lastStep = -1;
  let lastContact = false;
  let drawing = false;
  function render() {
    if (disposed || drawing) return;
    drawing = true;
    model.update(time, state);
    if (
      model.group.userData.sequence.stage !== lastStep ||
      model.group.userData.sequence.contact !== lastContact
    ) {
      lastStep = model.group.userData.sequence.stage;
      lastContact = model.group.userData.sequence.contact;
      onStep?.(lastStep, lastContact);
    }
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
    if (last) time += (Math.min(now - last, 100) / 1000) * state.speed;
    last = now;
    render();
  }
  function sync() {
    cancelAnimationFrame(frame);
    last = 0;
    render();
    if (
      !disposed &&
      !paused &&
      state.speed > 0 &&
      !reduced.matches &&
      visible &&
      !document.hidden
    )
      frame = requestAnimationFrame(tick);
  }
  function resize() {
    const w = host.clientWidth || 700,
      h = host.clientHeight || 500;
    resizeStudio(renderer, w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    resetView();
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
    const hit = ray.intersectObject(model.group, true).find((candidate) => {
      let ancestor: T.Object3D | null = candidate.object;
      while (ancestor) {
        if (!ancestor.visible) return false;
        ancestor = ancestor.parent;
      }
      return true;
    });
    let object: T.Object3D | null = hit?.object ?? null;
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
    setState(value: StarterState) {
      studio.invalidateShadows();
      const speedChanged = value.speed !== state.speed;
      const refit =
        value.isolate !== state.isolate ||
        (value.isolate && value.selected !== state.selected) ||
        value.explosion !== state.explosion;
      state = { ...value };
      model.update(time, state);
      if (refit) resetView();
      if (speedChanged) sync();
      else render();
    },
    setPaused(value: boolean) {
      paused = value;
      sync();
    },
    advance() {
      const step = (Math.floor((time % 13) / 2.6) + 1) % 5;
      time = step * 2.6 + 0.02;
      sync();
    },
    setStep(step: number) {
      time = Math.max(0, Math.min(4, step)) * 2.6 + 0.02;
      sync();
    },
    restart() {
      time = 0;
      sync();
    },
    resetView,
    dispose,
  };
}
export type StarterRenderer = ReturnType<typeof createStarterRenderer>;
