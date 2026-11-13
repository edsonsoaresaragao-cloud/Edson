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
  copParts,
  initialCopState,
  type CopState,
  copCycle,
} from "./cop-parts";
export function buildCopModel() {
  const group = new T.Group(),
    parts = copParts.map((p) => {
      const g = new T.Group();
      g.name = `cop-part-${p.id}`;
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
  const metal = mat(0xaebeca),
    dark = mat(0x192b36, 0.15, 0.4),
    copper = mat(0xbb7735),
    green = mat(0x285d45, 0.2),
    blue = mat(0x59afe1, 0.1),
    red = mat(0xd65749, 0.2),
    gold = mat(0xffc567, 0.1);
  gold.emissive.setHex(0xffbb55);
  gold.emissiveIntensity = 1.5;
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
      new RoundedBoxGeometry(w, h, d, 3, Math.min(0.045, w / 4, h / 4, d / 4)),
      m,
      parent,
    );
    o.position.set(x, y, z);
    return o;
  }
  function cyl(
    id: number,
    r: number,
    h: number,
    x: number,
    y: number,
    z: number,
    m = metal,
    parent: T.Object3D = parts[id - 1],
  ) {
    const o = mesh(id, precisionCylinder(r, r, h, 36), m, parent);
    o.position.set(x, y, z);
    return o;
  }
  const offsets = [
    [-0.2, 0, 0],
    [0, 0.3, 0],
    [0, 0.15, 0],
    [0.2, 0, 0.2],
    [0, 0, 0],
    [-0.2, -0.1, 0],
    [-0.8, 0.2, 0],
    [-0.4, 0.2, -0.4],
    [-0.6, 0.2, 0.2],
    [-0.2, 0.2, 0.2],
    [0.2, 0.2, 0.35],
    [0.7, 0.2, 0.35],
    [1.2, 0.2, 0],
    [0, -0.15, 0],
  ].map((p) => new T.Vector3(...(p as [number, number, number])));
  box(1, 0.12, 0.72, 0.6, -2, 0.85, -0.5);
  for (let i = 0; i < 8; i++)
    box(1, 0.035, 0.6, 0.02, -1.92, 0.85, -0.75 + i * 0.07);
  box(1, 0.2, 0.12, 0.48, -2, 0.42, -0.5, dark);
  const coils: T.Group[] = [],
    sparks: T.Mesh[] = [],
    pistons: T.Mesh[] = [];
  for (let i = 0; i < 4; i++) {
    const x = -1.2 + i * 0.8;
    const coil = new T.Group();
    coil.name = `cop-coil-${i}`;
    parts[1].add(coil);
    box(2, 0.25, 0.2, 0.24, x, 1.1, 0.2, dark, coil);
    cyl(2, 0.065, 0.55, x, 0.74, 0.2, dark, coil);
    box(2, 0.12, 0.1, 0.1, x + 0.15, 1.12, 0.2, dark, coil);
    coils.push(coil);
    cyl(3, 0.045, 0.22, x, 0.33, 0.2);
    for (let j = 0; j < 4; j++) cyl(3, 0.055, 0.018, x, 0.38 + j * 0.025, 0.2);
    cyl(3, 0.06, 0.065, x, 0.22, 0.2, copper);
    const spark = mesh(3, new T.SphereGeometry(0.035, 10, 8), gold);
    spark.position.set(x, 0.12, 0.2);
    spark.name = `cop-spark-${i}`;
    sparks.push(spark);
    const shell = mesh(
      14,
      precisionCylinder(
        0.18,
        0.18,
        0.4,
        36,
        1,
        true,
        Math.PI * 0.2,
        Math.PI * 1.4,
      ),
    );
    shell.position.set(x, -0.12, 0.2);
    const piston = cyl(14, 0.16, 0.08, x, -0.1, 0.2);
    piston.name = `cop-piston-${i}`;
    pistons.push(piston);
  }
  box(6, 0.55, 0.5, 0.4, -2.75, 0.1, 0.1, dark);
  for (const x of [-2.9, -2.6]) cyl(6, 0.04, 0.07, x, 0.4, 0.1, metal);
  box(6, 0.1, 0.13, 0.08, -2.45, 0.35, 0.1, red);
  for (let i = 0; i < 4; i++) {
    cyl(4, 0.04, 0.16, 2.25, 0.3 + i * 0.28, -0.6, copper);
    box(4, 0.12, 0.12, 0.12, 2.25, 0.42 + i * 0.28, -0.6, dark);
  }
  // Enlarged duplicate COP, coaxial along X, with separable internal members.
  box(7, 0.25, 0.3, 0.28, -1.73, 2.25, -0.2, dark);
  for (let i = 0; i < 3; i++)
    box(7, 0.07, 0.025, 0.025, -1.85, 2.17 + i * 0.07, -0.2, copper);
  const full = mesh(8, precisionCylinder(0.22, 0.22, 1.2, 48, 1, true));
  full.rotation.z = Math.PI / 2;
  full.position.set(-1.05, 2.25, -0.2);
  full.name = "cop-full-shell";
  const cut = mesh(
    8,
    precisionCylinder(
      0.22,
      0.22,
      1.2,
      48,
      1,
      true,
      Math.PI * 0.3,
      Math.PI * 1.25,
    ),
  );
  cut.rotation.z = Math.PI / 2;
  cut.position.copy(full.position);
  cut.name = "cop-cut-shell";
  box(9, 0.08, 0.24, 0.22, -1.5, 2.25, -0.2, green);
  box(9, 0.035, 0.1, 0.1, -1.45, 2.25, -0.2, dark);
  cyl(10, 0.075, 0.7, -0.95, 2.25, -0.2, metal).rotation.z = Math.PI / 2;
  for (const [id, r, length, turns] of [
    [11, 0.11, 0.48, 22],
    [12, 0.155, 0.68, 38],
  ]) {
    const points = Array.from(
      { length: 241 },
      (_, i) =>
        new T.Vector3(
          -0.95 - length / 2 + (length * i) / 240,
          2.25 + Math.cos((i / 240) * Math.PI * 2 * turns) * r,
          -0.2 + Math.sin((i / 240) * Math.PI * 2 * turns) * r,
        ),
    );
    mesh(
      id,
      precisionTube(new T.CatmullRomCurve3(points), 240, 0.008, 6, false),
      copper,
    );
  }
  cyl(13, 0.135, 0.9, 0, 2.25, -0.2, dark).rotation.z = Math.PI / 2;
  for (const x of [-0.45, -0.35]) {
    const r = mesh(13, precisionTorus(0.15, 0.025, 10, 36), dark);
    r.rotation.y = Math.PI / 2;
    r.position.set(x, 2.25, -0.2);
  }
  cyl(13, 0.035, 0.23, 0.42, 2.25, -0.2, copper).rotation.z = Math.PI / 2;
  const crank = new T.Group();
  crank.name = "cop-crank-reference";
  parts[13].add(crank);
  crank.position.set(-1.55, -0.12, 0.2);
  const ring = mesh(14, precisionTorus(0.19, 0.02, 10, 40));
  parts[13].remove(ring);
  crank.add(ring);
  ring.rotation.y = Math.PI / 2;
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8;
    box(
      14,
      0.035,
      0.025,
      0.025,
      0,
      Math.cos(a) * 0.2,
      Math.sin(a) * 0.2,
      dark,
      crank,
    );
  }
  const protectedObjects = new Set<T.Object3D>([
    full,
    cut,
    ...sparks,
    ...pistons,
  ]);
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
  const routes: {
    line: T.Mesh;
    curve: T.CatmullRomCurve3;
    dots: T.Mesh[];
    kind: "power" | "sensor" | "command";
    cylinder?: number;
  }[] = [];
  let lastExplosion = -1,
    lastTime = 0,
    angle = 0;
  function update(time: number, state: CopState) {
    const e = T.MathUtils.clamp(state.explosion, 0, 1);
    if (state.running)
      angle += T.MathUtils.clamp(time - lastTime, 0, 0.1) * Math.PI * 0.8;
    lastTime = time;
    parts.forEach((p, i) => p.position.copy(offsets[i]).multiplyScalar(e));
    full.visible = !state.cutaway;
    cut.visible = state.cutaway;
    const cycle = copCycle(angle, state.running);
    cycle.forEach((c, i) => {
      sparks[i].visible = c.spark;
      pistons[i].position.y = ((286 - c.motion.wristY) / 52) * 0.15 - 0.23;
      coils[i].userData.charging = c.charging;
      coils[i].userData.spark = c.spark;
    });
    crank.rotation.x = angle;
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
      function route(
        from: number,
        to: number,
        a: T.Vector3,
        b: T.Vector3,
        kind: "power" | "sensor" | "command",
        cylinder?: number,
      ) {
        a.add(parts[from - 1].position);
        b.add(parts[to - 1].position);
        const mid = a.clone().lerp(b, 0.5);
        mid.z -= 0.2;
        const curve = new T.CatmullRomCurve3([a, mid, b]);
        const material =
          kind === "power" ? red : kind === "sensor" ? green : blue;
        const line = mesh(
          5,
          precisionTube(curve, 32, 0.014, 8, false),
          material,
          parts[4],
        );
        line.name = `cop-wire-${routes.length}`;
        line.userData.kind = kind;
        line.userData.cylinder = cylinder;
        const dots = Array.from({ length: 4 }, () =>
          mesh(5, new T.SphereGeometry(0.022, 8, 6), material, parts[4]),
        );
        routes.push({ line, curve, dots, kind, cylinder });
      }
      route(
        6,
        1,
        new T.Vector3(-2.6, 0.4, 0.1),
        new T.Vector3(-2, 0.5, -0.5),
        "power",
      );
      route(
        4,
        1,
        new T.Vector3(2.25, 0.7, -0.6),
        new T.Vector3(-2, 0.5, -0.5),
        "sensor",
      );
      for (let i = 0; i < 4; i++) {
        const endpoint = new T.Vector3(-1.2 + i * 0.8, 1.15, 0.2);
        route(
          6,
          2,
          new T.Vector3(-2.6, 0.4, 0.1),
          endpoint.clone(),
          "power",
          i,
        );
        route(
          1,
          2,
          new T.Vector3(-2, 0.5, -0.5),
          endpoint.clone(),
          "command",
          i,
        );
      }
      lastExplosion = e;
    }
    routes.forEach((r) =>
      r.dots.forEach((d, i) => {
        d.visible =
          state.running &&
          (r.kind !== "command" ||
            cycle[r.cylinder!].charging ||
            cycle[r.cylinder!].spark);
        d.position.copy(r.curve.getPointAt((time * 0.3 + i / 4) % 1));
      }),
    );
    parts.forEach((p, i) =>
      p.traverse((o) => {
        if (
          o instanceof T.Mesh &&
          !Array.isArray(o.material) &&
          !sparks.includes(o)
        ) {
          const m = o.material as T.MeshStandardMaterial;
          m.emissive.setHex(state.selected === i + 1 ? 0x285978 : 0);
          m.emissiveIntensity = 0.6;
        }
      }),
    );
    const event = cycle.findIndex((c) => c.spark),
      charging = cycle.findIndex((c) => c.charging);
    group.userData.cylinder = (event >= 0 ? event : charging) + 1;
    group.userData.phase = !state.running
      ? "off"
      : event >= 0
        ? "spark"
        : charging >= 0
          ? "charge"
          : "wait";
    group.userData.angle = angle;
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
  update(0, initialCopState);
  const surfaceFinish = applyAutomotiveFinish(group);
  return { group, update, dispose };
}
