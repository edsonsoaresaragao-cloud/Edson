import * as T from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import type { OrbitControls } from "three/addons/controls/OrbitControls.js";

export function studioQuality(
  width: number,
  height: number,
  dpr = 1,
  coarse = false,
) {
  const mobile = coarse || width < 600;
  return {
    pixelRatio: Math.min(
      mobile ? 1.5 : 2,
      Math.max(1.25, dpr),
      Math.sqrt((mobile ? 1_000_000 : 2_000_000) / Math.max(1, width * height)),
    ),
    shadowSize: mobile ? 512 : 1024,
  };
}
export function resizeStudio(
  renderer: T.WebGLRenderer,
  width: number,
  height: number,
) {
  const quality = studioQuality(
    width,
    height,
    window.devicePixelRatio,
    window.matchMedia("(pointer: coarse)").matches,
  );
  renderer.setPixelRatio(quality.pixelRatio);
  renderer.setSize(width, height, false);
}
/** Bounds visíveis: ignora carcaças ocultas e partículas luminosas no enquadramento. */
export function visibleModelBounds(group: T.Object3D) {
  const bounds = new T.Box3();
  group.updateWorldMatrix(true, true);
  const visit = (object: T.Object3D) => {
    if (!object.visible) return;
    if (object instanceof T.Mesh && !object.userData.visualDecoration) {
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];
      if (
        !materials.every(
          (m) =>
            m instanceof T.MeshStandardMaterial &&
            m.emissiveIntensity > 0.75 &&
            m.emissive.getHex() !== 0,
        )
      ) {
        object.geometry.computeBoundingBox();
        if (object.geometry.boundingBox)
          bounds.union(
            object.geometry.boundingBox
              .clone()
              .applyMatrix4(object.matrixWorld),
          );
      }
    }
    object.children.forEach(visit);
  };
  visit(group);
  return bounds;
}
/** Ajusta os oito cantos ao retângulo livre, preservando direção de observação. */
export function fitStudioCamera(
  camera: T.PerspectiveCamera,
  bounds: T.Box3,
  aspect: number,
  direction = new T.Vector3(0.25, 0.2, 1),
  padding = 0.82,
) {
  if (bounds.isEmpty()) return new T.Vector3();
  const center = bounds.getCenter(new T.Vector3()),
    normal = direction.clone().normalize();
  if (Math.abs(normal.y) > 0.98) normal.z += 0.1;
  normal.normalize();
  const right = new T.Vector3(0, 1, 0).cross(normal).normalize(),
    up = normal.clone().cross(right).normalize();
  const tangent = Math.tan(T.MathUtils.degToRad(camera.fov / 2));
  let distance = 0.5;
  for (const x of [bounds.min.x, bounds.max.x])
    for (const y of [bounds.min.y, bounds.max.y])
      for (const z of [bounds.min.z, bounds.max.z]) {
        const corner = new T.Vector3(x, y, z).sub(center);
        distance = Math.max(
          distance,
          corner.dot(normal) +
            Math.max(
              Math.abs(corner.dot(right)) /
                (tangent * Math.max(aspect, 0.15) * padding),
              Math.abs(corner.dot(up)) / (tangent * padding),
            ),
        );
      }
  camera.aspect = aspect;
  camera.position.copy(center).addScaledVector(normal, distance * 1.04);
  camera.near = Math.max(0.01, distance / 150);
  camera.far = Math.max(60, distance * 8);
  camera.lookAt(center);
  camera.userData.studioFitDistance = distance * 1.04;
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  return center;
}
/** Zoom por botão: mantém a roda do mouse e o gesto vertical livres para rolar a página. */
export function zoomStudioCamera(
  camera: T.PerspectiveCamera,
  target: T.Vector3,
  factor: number,
) {
  if (!Number.isFinite(factor) || factor <= 0) return;
  const offset = camera.position.clone().sub(target),
    distance = offset.length();
  const baseline = Number(camera.userData.studioFitDistance) || distance;
  camera.position
    .copy(target)
    .add(
      offset.setLength(
        T.MathUtils.clamp(distance / factor, baseline * 0.42, baseline * 1.9),
      ),
    );
  camera.updateMatrixWorld();
}
export function createStudioFraming(
  host: HTMLElement,
  camera: T.PerspectiveCamera,
  controls: OrbitControls,
  group: T.Object3D,
) {
  const defaultDirection = camera.position
    .clone()
    .sub(controls.target)
    .normalize();
  let signature = "",
    width = 0,
    height = 0;
  function fit(reset = false) {
    const direction = reset
      ? defaultDirection
      : camera.position.clone().sub(controls.target).normalize();
    const bounds = visibleModelBounds(group);
    const target = fitStudioCamera(
      camera,
      bounds,
      (host.clientWidth || 700) / (host.clientHeight || 500),
      direction,
      0.8,
    );
    controls.target.copy(target);
    controls.update();
    return bounds;
  }
  return {
    reset: () => {
      signature = "";
      return fit(true);
    },
    update(key: string) {
      if (
        key === signature &&
        width === host.clientWidth &&
        height === host.clientHeight
      )
        return null;
      signature = key;
      width = host.clientWidth;
      height = host.clientHeight;
      return fit();
    },
  };
}

/** Estúdio PBR comum: reflexos de ambiente, fonte ampla, luz de contorno e sombra de contato. */
export function createAutomotiveStudio(
  renderer: T.WebGLRenderer,
  scene: T.Scene,
) {
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.AgXToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  let shadowDirty = true,
    shadowTime = 0;
  const room = new RoomEnvironment(),
    pmrem = new T.PMREMGenerator(renderer);
  let reflection: T.WebGLRenderTarget;
  try {
    reflection = pmrem.fromScene(room, 0.035);
  } finally {
    room.dispose();
    pmrem.dispose();
  }
  scene.environment = reflection.texture;
  scene.environmentIntensity = 0.85;
  const lights = new T.Group();
  lights.name = "automotive-studio-lights";
  lights.add(new T.HemisphereLight(0xe7f0ff, 0x292d32, 0.55));
  const key = new T.DirectionalLight(0xfff2de, 3.1);
  key.castShadow = true;
  key.shadow.mapSize.set(
    window.matchMedia("(pointer: coarse)").matches ? 512 : 1024,
    window.matchMedia("(pointer: coarse)").matches ? 512 : 1024,
  );
  key.shadow.normalBias = 0.008;
  key.shadow.bias = -0.0001;
  key.shadow.radius = 3;
  const rim = new T.DirectionalLight(0xb4d3ff, 2),
    fill = new T.DirectionalLight(0xffffff, 0.75);
  lights.add(key, key.target, rim, rim.target, fill, fill.target);
  scene.add(lights);
  const floorGeometry = new T.PlaneGeometry(1, 1),
    floorMaterial = new T.ShadowMaterial({ opacity: 0.13, depthWrite: false });
  const floor = new T.Mesh(floorGeometry, floorMaterial);
  floor.name = "studio-contact-shadow";
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  floor.userData.visualDecoration = true;
  scene.add(floor);
  function fit(bounds: T.Box3) {
    if (bounds.isEmpty()) return;
    shadowDirty = true;
    const center = bounds.getCenter(new T.Vector3()),
      size = bounds.getSize(new T.Vector3()),
      span = Math.max(size.x, size.y, size.z, 1);
    for (const light of [key, rim, fill]) light.target.position.copy(center);
    key.position
      .copy(center)
      .add(new T.Vector3(-0.65, 1.4, 1.2).multiplyScalar(span));
    rim.position
      .copy(center)
      .add(new T.Vector3(1.1, 0.65, -1.1).multiplyScalar(span));
    fill.position
      .copy(center)
      .add(new T.Vector3(1.3, 0.3, 1.1).multiplyScalar(span));
    Object.assign(key.shadow.camera, {
      left: -span,
      right: span,
      top: span,
      bottom: -span,
      near: span * 0.05,
      far: span * 5,
    });
    key.shadow.camera.updateProjectionMatrix();
    key.shadow.normalBias = span * 0.0008;
    floor.position.set(center.x, bounds.min.y - span * 0.012, center.z);
    floor.scale.set(span * 3, span * 3, 1);
  }
  let disposed = false;
  return {
    fit,
    invalidateShadows() {
      shadowDirty = true;
    },
    render(camera: T.Camera, moving = false) {
      const now = performance.now();
      if (shadowDirty || (moving && now - shadowTime > 90)) {
        renderer.shadowMap.needsUpdate = true;
        shadowTime = now;
        shadowDirty = false;
      }
      renderer.render(scene, camera);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      scene.remove(floor, lights);
      scene.environment = null;
      floorGeometry.dispose();
      floorMaterial.dispose();
      key.shadow.dispose();
      reflection.dispose();
    },
  };
}
