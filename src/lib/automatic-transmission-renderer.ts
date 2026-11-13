import {
  createAutomotiveStudio,
  resizeStudio,
  zoomStudioCamera,
} from "./automotive-studio";
import * as T from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { buildAutomaticTransmissionModel } from "./automatic-transmission-model";
import {
  automaticParts,
  type AutomaticState,
} from "./automatic-transmission-parts";

export function fitAutomaticCamera(
  camera: T.PerspectiveCamera,
  bounds: T.Box3,
  aspect: number,
  viewDirection = new T.Vector3(-0.32, 0.28, 1),
) {
  const centre = bounds.getCenter(new T.Vector3());
  const direction = viewDirection.clone().normalize();
  const right = new T.Vector3(0, 1, 0).cross(direction).normalize();
  const up = direction.clone().cross(right).normalize();
  const tangent = Math.tan((camera.fov * Math.PI) / 360);
  const safeAspect = Math.max(0.2, aspect);
  let distance = 3;
  for (const x of [bounds.min.x, bounds.max.x])
    for (const y of [bounds.min.y, bounds.max.y])
      for (const z of [bounds.min.z, bounds.max.z]) {
        const corner = new T.Vector3(x, y, z).sub(centre);
        distance = Math.max(
          distance,
          corner.dot(direction) +
            Math.max(
              Math.abs(corner.dot(right)) / (tangent * safeAspect * 0.79),
              Math.abs(corner.dot(up)) / (tangent * 0.82),
            ),
        );
      }
  camera.aspect = safeAspect;
  camera.position.copy(centre).addScaledVector(direction, distance * 1.08);
  camera.lookAt(centre);
  camera.userData.studioFitDistance = distance * 1.08;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  return centre;
}

export function createAutomaticTransmissionRenderer(
  host: HTMLDivElement,
  initial: AutomaticState,
  onSelect: (id: number) => void,
  onUnavailable: () => void,
  onPausedChange: (value: boolean) => void,
) {
  const renderer = new T.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: window.matchMedia("(pointer: coarse)").matches
      ? "low-power"
      : "high-performance",
  });
  host.append(renderer.domElement);
  renderer.domElement.setAttribute("role", "img");
  renderer.domElement.setAttribute(
    "aria-label",
    "Modelo tridimensional da transmissão automática",
  );
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(38, 1, 0.1, 120);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableDamping = false;
  controls.minPolarAngle = 0.18;
  controls.maxPolarAngle = Math.PI * 0.85;
  renderer.domElement.style.touchAction = "pan-y";
  let studio: ReturnType<typeof createAutomotiveStudio>;
  try {
    studio = createAutomotiveStudio(renderer, scene);
  } catch (error) {
    controls.dispose();
    renderer.dispose();
    renderer.domElement.remove();
    throw error;
  }
  const model = buildAutomaticTransmissionModel();
  scene.add(model.group);
  const overlay = document.createElement("div");
  overlay.className = "suspension-annotations transmission-annotations";
  const lines = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  overlay.append(lines);
  const labels = automaticParts.map((part) => {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    lines.append(line);
    const button = document.createElement("button");
    button.type = "button";
    const badge = String(part.id);
    button.setAttribute("aria-label", `${badge} · ${part.name}`);
    button.title = part.name;
    button.onclick = () => onSelect(part.id);
    overlay.append(button);
    return { part, badge, line, button };
  });
  host.append(overlay);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  let state = { ...initial },
    paused = reduced.matches,
    disposed = false,
    visible = true;
  let frame = 0,
    last = 0,
    frameCount = 0,
    needsFit = true,
    drawing = false;
  const box = new T.Box3();
  function resetView() {
    box.makeEmpty();
    for (const part of model.parts)
      if (part.visible) box.union(new T.Box3().setFromObject(part));
    if (box.isEmpty()) return;
    const centre = fitAutomaticCamera(
      camera,
      box,
      (host.clientWidth || 900) / (host.clientHeight || 610),
      state.isolate && state.selected <= 8
        ? new T.Vector3(1, 0.35, 0.8)
        : state.isolate && [10, 11].includes(state.selected)
          ? new T.Vector3(-0.3, 1, 0.8)
          : undefined,
    );
    studio.fit(box);
    controls.target.copy(centre);
    controls.update();
  }
  function annotate() {
    const width = host.clientWidth,
      height = host.clientHeight;
    labels.forEach(({ part, badge, line, button }, i) => {
      const shown = model.parts[i].visible;
      button.hidden = !shown;
      line.style.display = shown ? "" : "none";
      if (!shown) return;
      const anchor = model.anchors[i]
        .getWorldPosition(new T.Vector3())
        .project(camera);
      const left = i < 6;
      const row = i % 6;
      const selected = state.selected === part.id;
      const expanded = selected && width >= 650;
      const labelWidth = expanded ? 166 : 32;
      const x = left ? 8 : width - labelWidth - 8;
      const y = 48 + (row * (height - 94)) / 6;
      button.textContent = expanded ? `${badge} · ${part.name}` : badge;
      button.style.left = `${x}px`;
      button.style.top = `${y}px`;
      button.style.width = `${labelWidth}px`;
      button.dataset.selected = String(selected);
      button.setAttribute("aria-pressed", String(selected));
      line.setAttribute("x1", String(left ? x + labelWidth : x));
      line.setAttribute("y1", String(y + 16));
      line.setAttribute("x2", String(((anchor.x + 1) * width) / 2));
      line.setAttribute("y2", String(((1 - anchor.y) * height) / 2));
      line.setAttribute("opacity", selected ? "0.9" : "0.16");
    });
  }
  function render(delta = 0, running = false) {
    if (disposed || drawing) return;
    drawing = true;
    model.update(delta, state, running);
    if (needsFit && !model.isTransitioning()) {
      needsFit = false;
      resetView();
    }
    studio.render(camera, running || model.isTransitioning());
    annotate();
    const motion = model.group.userData.motion;
    host.dataset.inputAngle = String(motion.inputAngle);
    host.dataset.outputAngle = String(motion.outputAngle);
    host.dataset.gear = state.range === "D" ? `D${state.gear}` : state.range;
    host.dataset.engineAngle = String(motion.engineAngle);
    host.dataset.turbineAngle = String(motion.turbineAngle);
    host.dataset.frame = String(frameCount);
    drawing = false;
  }
  function canMove() {
    return !paused && state.speed > 0 && visible && !document.hidden;
  }
  function tick(now: number) {
    if (disposed) return;
    if (last && now - last < 32) {
      frame = requestAnimationFrame(tick);
      return;
    }
    const delta = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    frameCount++;
    render(delta, canMove());
    if (canMove() || (model.isTransitioning() && visible && !document.hidden))
      frame = requestAnimationFrame(tick);
    else {
      frame = 0;
      last = 0;
    }
  }
  function sync() {
    if (disposed) return;
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
    if (reduced.matches) render(1, false);
    else render();
    if (canMove() || (model.isTransitioning() && visible && !document.hidden))
      frame = requestAnimationFrame(tick);
  }
  function resize() {
    const width = host.clientWidth || 900,
      height = host.clientHeight || 610;
    resizeStudio(renderer, width, height);
    camera.aspect = width / height;
    needsFit = true;
    render();
  }
  function change() {
    render();
  }
  controls.addEventListener("change", change);
  const size = new ResizeObserver(resize);
  const visibility = new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    sync();
  });
  size.observe(host);
  visibility.observe(host);
  function preferenceChange() {
    if (reduced.matches) {
      paused = true;
      onPausedChange(true);
    }
    sync();
  }
  reduced.addEventListener("change", preferenceChange);
  document.addEventListener("visibilitychange", sync);
  const ray = new T.Raycaster(),
    pointer = new T.Vector2();
  let downX = 0,
    downY = 0;
  function down(event: PointerEvent) {
    downX = event.clientX;
    downY = event.clientY;
  }
  function pick(event: PointerEvent) {
    if (Math.hypot(event.clientX - downX, event.clientY - downY) > 6) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      (-(event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    ray.setFromCamera(pointer, camera);
    const hits = ray.intersectObject(model.group, true).filter((hit) => {
      let object: T.Object3D | null = hit.object;
      while (object && object !== model.group) {
        if (!object.visible) return false;
        object = object.parent;
      }
      return true;
    });
    let object: T.Object3D | null = hits[0]?.object || null;
    while (object) {
      if (typeof object.userData.part === "number") {
        onSelect(object.userData.part);
        break;
      }
      object = object.parent;
    }
  }
  function lost(event: Event) {
    event.preventDefault();
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
    controls.removeEventListener("change", change);
    controls.dispose();
    reduced.removeEventListener("change", preferenceChange);
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
    setState(next: AutomaticState) {
      studio.invalidateShadows();
      if (disposed) return;
      const changedView =
        next.explosion !== state.explosion ||
        next.isolate !== state.isolate ||
        (next.isolate && next.selected !== state.selected);
      if (next.explosion > state.explosion)
        camera.position
          .sub(controls.target)
          .multiplyScalar(1.25)
          .add(controls.target);
      state = { ...next };
      needsFit ||= changedView;
      sync();
    },
    setPaused(next: boolean) {
      paused = next;
      sync();
    },
    resetView() {
      if (disposed) return;
      resetView();
      render();
    },
    zoom(factor: number) {
      if (disposed) return;
      const vector = camera.position.clone().sub(controls.target);
      vector.setLength(T.MathUtils.clamp(vector.length() * factor, 1.8, 70));
      camera.position.copy(controls.target).add(vector);
      controls.update();
      render();
    },
    rotate(angle: number) {
      if (disposed) return;
      const vector = camera.position
        .clone()
        .sub(controls.target)
        .applyAxisAngle(new T.Vector3(0, 1, 0), angle);
      camera.position.copy(controls.target).add(vector);
      controls.update();
      render();
    },
    dispose,
  };
}
export type AutomaticTransmissionRenderer = ReturnType<
  typeof createAutomaticTransmissionRenderer
>;
