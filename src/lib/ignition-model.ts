import {
  applyAutomotiveFinish,
  automotiveMesh,
  precisionCylinder,
  precisionTorus,
  precisionTube,
} from "./automotive-finish";
import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import {
  ignitionParts,
  initialIgnitionState,
  type IgnitionState,
  ignitionSequence,
} from "./ignition-parts";
export function buildIgnitionModel() {
  const group = new T.Group(),
    parts = ignitionParts.map((p) => {
      const g = new T.Group();
      g.name = `ignition-part-${p.id}`;
      g.userData.part = p.id;
      g.userData.partName = p.name;
      group.add(g);
      return g;
    });
  const materials = new Set<T.MeshStandardMaterial>();
  function mat(color: number, metalness = 0.8, roughness = 0.32) {
    const m = new T.MeshPhysicalMaterial({ color, metalness, roughness });
    materials.add(m);
    return m;
  }
  const metal = mat(0xb0bfca),
    dark = mat(0x1a2a37, 0.2, 0.4),
    copper = mat(0xbd7d39),
    green = mat(0x265c48, 0.15),
    blue = mat(0x49a8df, 0.1),
    red = mat(0xde5a4b, 0.1);
  function mesh(
    id: number,
    g: T.BufferGeometry,
    m = metal,
    parent: T.Object3D = parts[id - 1],
  ) {
    const o = automotiveMesh(g, m);
    parent.add(o);
    return o;
  }
  function box(
    id: number,
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    m = metal,
    parent: T.Object3D = parts[id - 1],
  ) {
    const o = mesh(
      id,
      new RoundedBoxGeometry(w, h, d, 3, Math.min(0.05, w / 4, h / 4, d / 4)),
      m,
      parent,
    );
    o.position.set(x, y, z);
    return o;
  }
  function cylinder(
    id: number,
    r: number,
    h: number,
    x: number,
    y: number,
    z: number,
    m = metal,
    parent: T.Object3D = parts[id - 1],
  ) {
    const o = mesh(id, precisionCylinder(r, r, h, 40), m, parent);
    o.position.set(x, y, z);
    return o;
  }
  function ring(
    id: number,
    r: number,
    t: number,
    x: number,
    y: number,
    z: number,
    m = metal,
    parent: T.Object3D = parts[id - 1],
  ) {
    const o = mesh(id, precisionTorus(r, t, 10, 48), m, parent);
    o.position.set(x, y, z);
    return o;
  }
  const positions = [
    new T.Vector3(),
    new T.Vector3(),
    new T.Vector3(-0.1, 1.75, 0),
    new T.Vector3(-0.53, 1.75, 0),
    new T.Vector3(-1.45, 0.7, 0.1),
    new T.Vector3(0.35, 0.75, 0.1),
    new T.Vector3(-1.6, -0.1, -0.05),
    new T.Vector3(-0.6, 0.25, -0.8),
    new T.Vector3(2, 0.7, 0.1),
    new T.Vector3(-2.75, -0.15, 0.1),
    new T.Vector3(0, -0.25, -0.8),
  ];
  const offsets = [
    new T.Vector3(),
    new T.Vector3(),
    new T.Vector3(0, 0.2, 0),
    new T.Vector3(-0.3, 0.2, 0),
    new T.Vector3(-0.3, 0, 0.25),
    new T.Vector3(0.2, 0, 0.25),
    new T.Vector3(-0.3, -0.1, 0.1),
    new T.Vector3(-0.2, -0.2, -0.2),
    new T.Vector3(0.5, 0.1, 0),
    new T.Vector3(-0.3, -0.15, 0),
    new T.Vector3(0.4, -0.2, -0.2),
  ];
  // Chave aberta para mostrar placa e chip, com lâmina sem segredo real.
  box(1, 0.5, 0.36, 0.09, 0, 0, 0, dark);
  box(1, 0.35, 0.23, 0.015, -0.025, 0, 0.055, green);
  for (const y of [-0.105, 0.105])
    box(1, 0.38, 0.025, 0.045, 0, y, -0.065, dark);
  const bladeShape = new T.Shape();
  bladeShape.moveTo(0.2, -0.04);
  bladeShape.lineTo(0.76, -0.04);
  bladeShape.lineTo(0.76, 0.04);
  for (let i = 4; i >= 0; i--) {
    const x = 0.25 + i * 0.09;
    bladeShape.lineTo(x + 0.035, 0.04);
    bladeShape.lineTo(x + 0.015, 0.018);
    bladeShape.lineTo(x, 0.04);
  }
  bladeShape.closePath();
  mesh(
    1,
    new T.ExtrudeGeometry(bladeShape, {
      depth: 0.035,
      bevelEnabled: true,
      bevelSize: 0.003,
      bevelThickness: 0.003,
      bevelSegments: 1,
    }),
  ).position.z = -0.0175;
  box(2, 0.1, 0.065, 0.025, -0.02, 0, 0.08, dark);
  for (let i = 0; i < 4; i++) {
    box(2, 0.018, 0.02, 0.01, -0.06 + i * 0.025, 0.05, 0.08, copper);
    box(2, 0.018, 0.02, 0.01, -0.06 + i * 0.025, -0.05, 0.08, copper);
  }
  cylinder(3, 0.19, 0.75, 0, 0, 0).rotation.z = Math.PI / 2;
  for (const x of [-0.38, 0.38])
    ring(3, 0.19, 0.025, x, 0, 0).rotation.y = Math.PI / 2;
  box(3, 0.025, 0.1, 0.025, -0.39, 0, 0, dark);
  for (const y of [-0.16, 0.16]) box(3, 0.2, 0.1, 0.17, 0.15, y, 0);
  box(3, 0.18, 0.23, 0.2, 0.45, 0, 0, dark);
  for (let i = 0; i < 10; i++)
    ring(
      4,
      0.22 + i * 0.002,
      0.007,
      -0.045 + i * 0.009,
      0,
      0,
      copper,
    ).rotation.y = Math.PI / 2;
  box(4, 0.12, 0.1, 0.1, 0, -0.26, 0, dark);
  const waves = Array.from({ length: 3 }, (_, i) => {
    const m = mat(0x65c6ef, 0.05);
    m.transparent = true;
    m.opacity = 0.3;
    const wave = ring(4, 0.25 + i * 0.07, 0.005, 0, 0, 0, m);
    wave.rotation.y = Math.PI / 2;
    wave.name = "reader-field";
    return wave;
  });
  box(5, 0.55, 0.7, 0.2, 0, 0, 0, dark);
  box(5, 0.35, 0.13, 0.16, 0, -0.39, 0, dark);
  for (let i = 0; i < 4; i++)
    cylinder(
      5,
      0.025,
      0.06,
      (i % 2 ? 1 : -1) * 0.24,
      (i < 2 ? 1 : -1) * 0.3,
      0.13,
    ).rotation.x = Math.PI / 2;
  box(6, 0.6, 0.65, 0.2, 0, 0, 0);
  for (let i = 0; i < 8; i++)
    box(6, 0.035, 0.5, 0.04, -0.24 + i * 0.068, 0, 0.12);
  box(6, 0.45, 0.13, 0.17, 0, -0.37, 0, dark);
  box(7, 0.22, 0.3, 0.2, 0.15, 0, 0, dark);
  box(7, 0.13, 0.18, 0.1, -0.15, 0, 0, mat(0xe2b943, 0.2));
  for (const x of [-0.18, -0.12]) cylinder(7, 0.018, 0.11, x, -0.12, 0, copper);
  // Motor de partida cilíndrico e pinhão retrátil no eixo longitudinal X.
  cylinder(8, 0.21, 0.7, 0, 0, 0).rotation.z = Math.PI / 2;
  for (const x of [-0.35, 0.35])
    ring(8, 0.21, 0.02, x, 0, 0).rotation.y = Math.PI / 2;
  cylinder(8, 0.1, 0.38, -0.1, 0.28, 0, dark).rotation.z = Math.PI / 2;
  const starterRotor = new T.Group();
  starterRotor.name = "ignition-starter-rotor";
  parts[7].add(starterRotor);
  const pinion = cylinder(8, 0.09, 0.15, 0.5, 0, 0, metal, starterRotor);
  pinion.rotation.z = Math.PI / 2;
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    const tooth = box(
      8,
      0.15,
      0.025,
      0.025,
      0.5,
      Math.cos(a) * 0.095,
      Math.sin(a) * 0.095,
      dark,
      starterRotor,
    );
    tooth.rotation.x = a;
  }
  const outputVisuals: T.Mesh[] = [];
  for (let i = 0; i < 4; i++) {
    const x = -0.6 + i * 0.4;
    cylinder(9, 0.075, 0.21, x, 0.3, 0, dark);
    cylinder(9, 0.03, 0.2, x, 0.11, 0, dark);
    cylinder(9, 0.045, 0.2, x, -0.2, 0, copper);
    box(9, 0.08, 0.08, 0.08, x, -0.15, 0, dark);
    const m = mat(0xffbe6a, 0.1);
    m.emissive.setHex(0xffa54f);
    m.emissiveIntensity = 1.5;
    const pulse = mesh(9, new T.SphereGeometry(0.035, 8, 6), m);
    pulse.position.set(x, -0.32, 0);
    pulse.name = `authorized-output-${i}`;
    outputVisuals.push(pulse);
  }
  box(10, 0.65, 0.6, 0.43, 0, 0, 0, dark);
  for (const x of [-0.2, 0.2])
    cylinder(10, 0.05, 0.08, x, 0.34, 0, x < 0 ? red : metal);
  box(10, 0.3, 0.025, 0.02, -0.15, 0.13, 0.23, red);
  const flywheel = new T.Group();
  flywheel.name = "ignition-engine-flywheel";
  parts[10].add(flywheel);
  const disk = cylinder(11, 0.4, 0.06, 0, 0, 0);
  parts[10].remove(disk);
  flywheel.add(disk);
  disk.rotation.z = Math.PI / 2;
  for (let i = 0; i < 40; i++) {
    const a = (i * Math.PI) / 20;
    const tooth = box(
      11,
      0.07,
      0.025,
      0.025,
      0,
      Math.cos(a) * 0.4,
      Math.sin(a) * 0.4,
      metal,
      flywheel,
    );
    tooth.rotation.x = a;
  }
  box(11, 0.5, 0.5, 0.5, 0.35, 0, 0, dark);
  // Static details are batched without swallowing the moving pinion or state indicators.
  const protectedObjects = new Set<T.Object3D>([...waves, ...outputVisuals]);
  function batch(parent: T.Object3D) {
    for (const c of [...parent.children]) if (c instanceof T.Group) batch(c);
    const buckets = new Map<T.Material, T.Mesh[]>();
    for (const c of parent.children)
      if (
        c instanceof T.Mesh &&
        !Array.isArray(c.material) &&
        !protectedObjects.has(c)
      ) {
        const list = buckets.get(c.material) || [];
        list.push(c);
        buckets.set(c.material, list);
      }
    for (const [m, objects] of buckets) {
      if (objects.length < 2) continue;
      const copies = objects.map((o) => {
        o.updateMatrix();
        return (
          o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()
        ).applyMatrix4(o.matrix);
      });
      const g = mergeGeometries(copies);
      copies.forEach((g) => g.dispose());
      if (!g) continue;
      objects.forEach((o) => {
        parent.remove(o);
        o.geometry.dispose();
      });
      parent.add(automotiveMesh(g, m));
    }
  }
  parts.forEach(batch);
  parts.forEach((p) =>
    p.traverse((o) => {
      if (o instanceof T.Mesh && !Array.isArray(o.material)) {
        const m = o.material.clone() as T.MeshStandardMaterial;
        materials.add(m);
        o.material = m;
      }
    }),
  );
  type Route = {
    curve: T.CatmullRomCurve3;
    line: T.Mesh;
    dots: T.Mesh[];
    kind: "reader" | "auth" | "power" | "start" | "outputs";
    from: number;
    to: number;
  };
  const routes: Route[] = [];
  const authDot = mat(0x69c69a, 0.1);
  authDot.emissive.setHex(0x2f9767);
  authDot.emissiveIntensity = 0.5;
  const powerDot = mat(0xef8661, 0.1);
  powerDot.emissive.setHex(0xb85633);
  powerDot.emissiveIntensity = 0.5;
  let lastExplosion = -1,
    lastTime = 0,
    starterAngle = 0,
    engineAngle = 0;
  function update(time: number, state: IgnitionState) {
    const e = T.MathUtils.clamp(state.explosion, 0, 1),
      s = ignitionSequence(time, state.recognized),
      dt = T.MathUtils.clamp(time - lastTime, 0, 0.1);
    lastTime = time;
    parts.forEach((p, i) =>
      p.position.copy(positions[i]).addScaledVector(offsets[i], e),
    );
    parts[0].position.set(
      -1.7 + s.insertion * 0.75 - e * 0.45,
      1.75 + e * 0.25,
      0,
    );
    parts[0].rotation.x = s.keyAngle;
    parts[1].position
      .copy(parts[0].position)
      .add(new T.Vector3(0, e * 0.25, e * 0.35));
    parts[1].rotation.x = s.keyAngle;
    waves.forEach((w, i) => {
      w.visible = s.step === "read" || s.step === "validate";
      w.scale.setScalar(1 + ((time + i * 0.2) % 0.7) * 0.3);
    });
    if (s.starter) starterAngle += dt * 7;
    if (s.starter || s.engine) engineAngle += dt * (s.engine ? 4 : 1.5);
    starterRotor.rotation.x = starterAngle;
    starterRotor.position.x = s.starter ? 0.1 : 0;
    flywheel.rotation.x = engineAngle;
    outputVisuals.forEach((p, i) => {
      p.visible = s.outputs && Math.floor(time * 5) % 4 === i;
    });
    if (e !== lastExplosion) {
      routes.forEach((r) => {
        r.line.geometry.dispose();
        r.line.removeFromParent();
        r.dots.forEach((d) => {
          d.geometry.dispose();
          d.removeFromParent();
        });
      });
      routes.length = 0;
      function route(from: number, to: number, kind: Route["kind"]) {
        const a = parts[from - 1].position.clone(),
          b = parts[to - 1].position.clone(),
          mid = a.clone().lerp(b, 0.5);
        mid.z += 0.35;
        mid.y -= 0.1;
        const curve = new T.CatmullRomCurve3([a, mid, b]);
        const line = mesh(
          kind === "start" ? 7 : 6,
          precisionTube(
            curve,
            36,
            kind === "power" || kind === "start" ? 0.022 : 0.012,
            8,
            false,
          ),
          kind === "power" || kind === "start" ? red : blue,
          group,
        );
        line.name = `ignition-route-${routes.length}`;
        line.userData.connection = [from, to];
        const dots = Array.from({ length: 5 }, () =>
          mesh(
            6,
            new T.SphereGeometry(0.024, 8, 6),
            kind === "power" || kind === "start" ? powerDot : authDot,
            group,
          ),
        );
        routes.push({ curve, line, dots, kind, from, to });
      }
      route(4, 5, "reader");
      route(5, 6, "auth");
      route(10, 7, "power");
      route(7, 8, "start");
      route(6, 9, "outputs");
      route(10, 5, "power");
      route(10, 6, "power");
      lastExplosion = e;
    }
    routes.forEach((r) =>
      r.dots.forEach((d, i) => {
        d.visible =
          r.kind === "reader"
            ? s.step === "read" || s.step === "validate"
            : r.kind === "auth"
              ? s.authorized
              : r.kind === "power"
                ? s.power
                : r.kind === "start"
                  ? s.starter
                  : s.outputs;
        d.position.copy(r.curve.getPointAt((time * 0.3 + i / 5) % 1));
      }),
    );
    parts.forEach((p, i) =>
      p.traverse((o) => {
        if (
          o instanceof T.Mesh &&
          !Array.isArray(o.material) &&
          !protectedObjects.has(o)
        ) {
          const m = o.material as T.MeshStandardMaterial;
          m.emissive.setHex(state.selected === i + 1 ? 0x285978 : 0);
          m.emissiveIntensity = 0.6;
        }
      }),
    );
    group.userData.step = s.step;
    group.userData.authorized = s.authorized;
    group.userData.starter = s.starter;
    group.userData.engine = s.engine;
    group.userData.outputs = s.outputs;
    group.updateMatrixWorld(true);
  }
  function dispose() {
    surfaceFinish.dispose();
    const geometries = new Set<T.BufferGeometry>();
    group.traverse((o) => {
      if (o instanceof T.Mesh) geometries.add(o.geometry);
    });
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
  }
  update(0, initialIgnitionState);
  const surfaceFinish = applyAutomotiveFinish(group);
  return { group, update, dispose };
}
