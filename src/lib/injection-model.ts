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
  injectionParts,
  initialInjectionState,
  type InjectionState,
  injectionCycle,
} from "./injection-parts";
export function buildInjectionModel() {
  const group = new T.Group(),
    parts = injectionParts.map((p) => {
      const g = new T.Group();
      g.name = `injection-part-${p.id}`;
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
  const silver = mat(0xb0bec8),
    dark = mat(0x1c2d38, 0.15, 0.4),
    copper = mat(0xb88648),
    fuel = mat(0xe9b83e, 0.25),
    air = mat(0x4da8e3, 0.1),
    vapor = mat(0x55b788, 0.1),
    signal = mat(0xe46d51, 0.1);
  function mesh(
    id: number,
    g: T.BufferGeometry,
    m = silver,
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
    m = silver,
    parent: T.Object3D = parts[id - 1],
  ) {
    const o = mesh(
      id,
      new RoundedBoxGeometry(w, h, d, 3, Math.min(0.06, w / 4, h / 4, d / 4)),
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
    m = silver,
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
    m = silver,
    parent: T.Object3D = parts[id - 1],
  ) {
    const o = mesh(id, precisionTorus(r, t, 10, 48), m, parent);
    o.position.set(x, y, z);
    return o;
  }
  function pipe(
    id: number,
    points: T.Vector3[],
    radius: number,
    m = silver,
    parent: T.Object3D = parts[id - 1],
  ) {
    const curve = new T.CatmullRomCurve3(points);
    return {
      curve,
      line: mesh(id, precisionTube(curve, 48, radius, 10, false), m, parent),
    };
  }
  const offsets = [
    [-0.4, 0, 0],
    [-0.4, 0.3, 0],
    [-0.3, 0.4, 0],
    [0, 0.65, 0],
    [0, 0.4, 0],
    [0.5, 0.1, 0],
    [0.3, 0.1, 0.3],
    [0, 0.2, 0.3],
    [0.3, 0.35, 0.2],
    [0, -0.15, -0.3],
    [0.45, 0.25, -0.2],
    [0.4, 0.2, 0],
    [0.3, 0.3, -0.1],
    [0, 0.75, -0.15],
    [0, 0.4, -0.15],
    [0.5, -0.15, -0.2],
    [0, -0.15, 0.1],
    [0, -0.35, -0.1],
    [0, -0.1, -0.2],
  ].map((p) => new T.Vector3(...(p as [number, number, number])));
  // Bomba e pescador em módulo aberto, em lugar de representar um tanque fechado.
  cylinder(1, 0.2, 0.55, -3.1, 0.3, 0);
  ring(1, 0.3, 0.035, -3.1, 0.62, 0, fuel).rotation.x = Math.PI / 2;
  for (const a of [0, Math.PI])
    cylinder(1, 0.022, 0.65, -3.1 + Math.cos(a) * 0.25, 0.28, 0, fuel);
  box(1, 0.45, 0.08, 0.3, -3.1, -0.07, 0, dark);
  cylinder(1, 0.05, 0.1, -3.1, 0.69, 0, fuel);
  cylinder(2, 0.13, 0.4, -2.6, 1.0, 0, dark).rotation.z = Math.PI / 2;
  for (const x of [-2.84, -2.36])
    cylinder(2, 0.035, 0.1, x, 1, 0).rotation.z = Math.PI / 2;
  cylinder(3, 0.14, 0.3, -1.8, 1.55, 0.25);
  cylinder(3, 0.18, 0.05, -1.8, 1.72, 0.25);
  cylinder(3, 0.035, 0.1, -1.8, 1.79, 0.25, dark);
  cylinder(4, 0.075, 3.15, 0, 1.45, 0.25).rotation.z = Math.PI / 2;
  for (const x of [-1.4, 1.4]) box(4, 0.12, 0.2, 0.12, x, 1.4, 0.25);
  cylinder(4, 0.035, 0.14, -1.65, 1.45, 0.25).rotation.z = Math.PI / 2;
  const injectors: T.Group[] = [],
    sparks: T.Mesh[] = [],
    pistons: T.Mesh[] = [],
    sprays: T.Group[] = [];
  for (let i = 0; i < 4; i++) {
    const x = -1.2 + i * 0.8;
    const injector = new T.Group();
    injector.name = `mpi-injector-${i}`;
    parts[4].add(injector);
    injector.position.set(x, 1.16, 0.25);
    cylinder(5, 0.06, 0.32, 0, 0, 0, dark, injector);
    cylinder(5, 0.025, 0.14, 0, -0.22, 0, copper, injector);
    box(5, 0.1, 0.1, 0.12, 0.04, 0.06, 0.02, dark, injector);
    for (const y of [-0.13, 0.13])
      ring(5, 0.061, 0.012, 0, y, 0, dark, injector).rotation.x = Math.PI / 2;
    injectors.push(injector);
    const spray = new T.Group();
    spray.name = `mpi-spray-${i}`;
    parts[4].add(spray);
    for (let j = 0; j < 7; j++) {
      const dot = mesh(5, new T.SphereGeometry(0.014, 6, 5), fuel, spray);
      dot.position.set(
        ((j % 3) - 1) * 0.025,
        -0.02 - j * 0.025,
        (j % 2 ? 1 : -1) * 0.015,
      );
    }
    sprays.push(spray);
    cylinder(14, 0.1, 0.22, x, 0.88, -0.65, dark);
    cylinder(14, 0.045, 0.2, x, 0.68, -0.65, dark);
    box(14, 0.16, 0.12, 0.16, x, 0.98, -0.65, dark);
    cylinder(15, 0.04, 0.2, x, 0.48, -0.65);
    cylinder(15, 0.055, 0.07, x, 0.4, -0.65, copper);
    const sparkMaterial = mat(0xffc975, 0.1);
    sparkMaterial.emissive.setHex(0xffb84a);
    sparkMaterial.emissiveIntensity = 2;
    const spark = mesh(15, new T.SphereGeometry(0.045, 10, 8), sparkMaterial);
    spark.position.set(x, 0.33, -0.65);
    spark.name = `mpi-spark-${i}`;
    sparks.push(spark);
    const shell = mesh(
      18,
      precisionCylinder(
        0.18,
        0.18,
        0.45,
        40,
        1,
        true,
        Math.PI * 0.2,
        Math.PI * 1.4,
      ),
    );
    shell.position.set(x, 0.02, -0.65);
    const piston = cylinder(18, 0.16, 0.09, x, 0, -0.65);
    piston.name = `mpi-piston-${i}`;
    pistons.push(piston);
    pipe(
      17,
      [
        new T.Vector3(x, 0.63, 0.95),
        new T.Vector3(x, 0.9, 0.65),
        new T.Vector3(x, 0.67, 0.25),
        new T.Vector3(x, 0.38, -0.25),
      ],
      0.13,
      dark,
    );
  }
  cylinder(17, 0.22, 3.1, 0, 0.63, 0.95, dark).rotation.z = Math.PI / 2;
  for (let i = 0; i < 4; i++)
    box(17, 0.1, 0.11, 0.3, -1.2 + i * 0.8, 0.45, 0.95, dark);
  cylinder(6, 0.18, 0.45, 2.85, 0.63, 0.95, dark).rotation.z = Math.PI / 2;
  box(6, 0.12, 0.12, 0.12, 2.85, 0.83, 0.95, dark);
  box(6, 0.6, 0.65, 0.65, 3.45, 0.63, 0.95, dark);
  for (let i = 0; i < 7; i++)
    box(6, 0.025, 0.55, 0.68, 3.2 + i * 0.08, 0.63, 0.95, dark);
  const tbi = mesh(7, precisionCylinder(0.21, 0.21, 0.3, 48, 1, true));
  tbi.rotation.z = Math.PI / 2;
  tbi.position.set(2.12, 0.63, 0.95);
  for (const x of [1.96, 2.28])
    ring(7, 0.21, 0.025, x, 0.63, 0.95).rotation.y = Math.PI / 2;
  const butterfly = new T.Group();
  butterfly.name = "mpi-butterfly";
  parts[6].add(butterfly);
  butterfly.position.set(2.12, 0.63, 0.95);
  cylinder(7, 0.19, 0.012, 0, 0, 0, copper, butterfly).rotation.z = Math.PI / 2;
  cylinder(7, 0.015, 0.42, 0, 0, 0, silver, butterfly);
  cylinder(8, 0.035, 0.15, -0.7, 0.86, 0.95, copper);
  box(8, 0.1, 0.08, 0.1, -0.7, 0.97, 0.95, dark);
  cylinder(9, 0.07, 0.22, 2.12, 0.98, 0.95, dark);
  pipe(
    9,
    [
      new T.Vector3(2.4, 0.7, 0.95),
      new T.Vector3(2.12, 1.03, 0.95),
      new T.Vector3(1.83, 0.7, 0.95),
    ],
    0.035,
    dark,
  );
  pipe(
    10,
    [
      new T.Vector3(-1.5, 0.25, -1.35),
      new T.Vector3(-0.3, 0.15, -1.5),
      new T.Vector3(0.7, 0.2, -1.5),
      new T.Vector3(1.3, 0.05, -1.55),
    ],
    0.09,
  );
  cylinder(10, 0.16, 0.45, 1.1, 0.08, -1.55).rotation.z = Math.PI / 2;
  cylinder(10, 0.045, 0.2, 0.2, 0.35, -1.5, copper);
  box(10, 0.08, 0.09, 0.08, 0.2, 0.48, -1.5, dark);
  box(11, 0.13, 0.8, 0.65, 2.75, 0.85, -0.75);
  for (let i = 0; i < 9; i++)
    box(11, 0.04, 0.7, 0.02, 2.85, 0.85, -1.02 + i * 0.067);
  box(11, 0.18, 0.2, 0.55, 2.7, 0.36, -0.75, dark);
  cylinder(12, 0.055, 0.18, 2.2, 0.4, 0.45, dark);
  box(12, 0.1, 0.1, 0.1, 2.2, 0.53, 0.45, dark);
  box(13, 0.19, 0.3, 0.2, 2.25, 0.75, -0.75, dark);
  for (const x of [2.2, 2.3]) cylinder(13, 0.015, 0.12, x, 0.55, -0.75, copper);
  cylinder(16, 0.18, 0.6, 2.9, 0.1, -1.65, dark);
  cylinder(16, 0.2, 0.05, 2.9, 0.43, -1.65, dark);
  cylinder(16, 0.035, 0.08, 2.9, 0.49, -1.65, vapor);
  box(18, 3.05, 0.1, 0.55, 0, -0.24, -0.65);
  cylinder(19, 0.05, 0.15, -1.55, 0.15, -0.7, dark).rotation.z = Math.PI / 2;
  const crankReference = new T.Group();
  crankReference.name = "mpi-crank-reference";
  parts[18].add(crankReference);
  crankReference.position.set(-1.5, -0.05, -0.7);
  const referenceRing = ring(19, 0.19, 0.02, 0, 0, 0, silver, crankReference);
  referenceRing.rotation.y = Math.PI / 2;
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8;
    const tooth = box(
      19,
      0.035,
      0.025,
      0.025,
      0,
      Math.cos(a) * 0.2,
      Math.sin(a) * 0.2,
      dark,
      crankReference,
    );
    tooth.rotation.x = a;
  }
  // Static details grouped; individual injectors, pistons, butterfly and sparks stay movable.
  const protectedObjects = new Set<T.Object3D>([...pistons, ...sparks]);
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
    kind: "fuel" | "air" | "signal" | "vapor";
    from: number;
    to: number;
    cylinder?: number;
  };
  const routes: Route[] = [];
  const colors = { fuel, air, signal, vapor };
  let lastExplosion = -1,
    lastTime = 0,
    angle = 0;
  function update(time: number, state: InjectionState) {
    const e = T.MathUtils.clamp(state.explosion, 0, 1),
      throttle = T.MathUtils.clamp(state.throttle, 0, 1);
    if (state.running)
      angle += T.MathUtils.clamp(time - lastTime, 0, 0.1) * Math.PI * 0.8;
    lastTime = time;
    parts.forEach((p, i) => p.position.copy(offsets[i]).multiplyScalar(e));
    butterfly.rotation.z = throttle * 1.38;
    crankReference.rotation.x = angle;
    const cycle = injectionCycle(angle, throttle, state.running);
    cycle.forEach((c, i) => {
      sprays[i].visible = c.injecting;
      sprays[i].position.set(-1.2 + i * 0.8, 0.87, 0.25);
      sprays[i].scale.y = 1 + throttle * 0.5;
      sparks[i].visible = c.spark;
      pistons[i].position.y = ((286 - c.motion.wristY) / 52) * 0.16 - 0.13;
      injectors[i].userData.active = c.injecting;
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
      function route(
        from: number,
        to: number,
        a: T.Vector3,
        b: T.Vector3,
        kind: Route["kind"],
        cylinder?: number,
      ) {
        a.add(parts[from - 1].position);
        b.add(parts[to - 1].position);
        const mid = a.clone().lerp(b, 0.5);
        mid.y += kind === "signal" ? 0.25 : 0.1;
        mid.z += kind === "signal" ? -0.15 : 0.15;
        const curve = new T.CatmullRomCurve3([a, mid, b]);
        const line = mesh(
          kind === "signal"
            ? 11
            : kind === "fuel"
              ? 4
              : kind === "air"
                ? 17
                : 12,
          precisionTube(
            curve,
            40,
            kind === "air" ? 0.1 : kind === "signal" ? 0.012 : 0.025,
            8,
            false,
          ),
          kind === "air" ? dark : colors[kind],
          group,
        );
        line.name = `mpi-route-${routes.length}`;
        line.userData.route = [from, to];
        line.userData.kind = kind;
        line.userData.cylinder = cylinder;
        const dots = Array.from({ length: 5 }, () =>
          mesh(
            11,
            new T.SphereGeometry(kind === "air" ? 0.025 : 0.018, 8, 6),
            colors[kind],
            group,
          ),
        );
        routes.push({ line, curve, dots, kind, from, to, cylinder });
      }
      route(
        1,
        2,
        new T.Vector3(-3.1, 0.69, 0),
        new T.Vector3(-2.84, 1, 0),
        "fuel",
      );
      route(
        2,
        4,
        new T.Vector3(-2.36, 1, 0),
        new T.Vector3(-1.55, 1.45, 0.25),
        "fuel",
      );
      route(
        4,
        3,
        new T.Vector3(-1.55, 1.45, 0.25),
        new T.Vector3(-1.8, 1.55, 0.25),
        "fuel",
      );
      route(
        3,
        1,
        new T.Vector3(-1.8, 1.42, 0.25),
        new T.Vector3(-3.25, 0.55, 0),
        "fuel",
      );
      route(
        6,
        7,
        new T.Vector3(2.62, 0.63, 0.95),
        new T.Vector3(2.28, 0.63, 0.95),
        "air",
      );
      route(
        7,
        17,
        new T.Vector3(1.96, 0.63, 0.95),
        new T.Vector3(1.55, 0.63, 0.95),
        "air",
      );
      route(
        16,
        12,
        new T.Vector3(2.9, 0.49, -1.65),
        new T.Vector3(2.2, 0.3, 0.45),
        "vapor",
      );
      route(
        12,
        17,
        new T.Vector3(2.2, 0.5, 0.45),
        new T.Vector3(1.3, 0.65, 0.95),
        "vapor",
      );
      route(
        6,
        9,
        new T.Vector3(2.4, 0.63, 0.95),
        new T.Vector3(2.12, 1.03, 0.95),
        "air",
      );
      route(
        9,
        17,
        new T.Vector3(1.83, 0.7, 0.95),
        new T.Vector3(1.55, 0.63, 0.95),
        "air",
      );
      for (let i = 0; i < 4; i++)
        route(
          4,
          5,
          new T.Vector3(-1.2 + i * 0.8, 1.45, 0.25),
          new T.Vector3(-1.2 + i * 0.8, 1.32, 0.25),
          "fuel",
          i + 1,
        );
      for (const [from, a] of [
        [6, [2.85, 0.83, 0.95]],
        [8, [-0.7, 0.97, 0.95]],
        [10, [0.2, 0.48, -1.5]],
        [19, [-1.55, 0.15, -0.7]],
      ] as [number, number[]][]) {
        route(
          from,
          11,
          new T.Vector3(...(a as [number, number, number])),
          new T.Vector3(2.7, 0.4, -0.75),
          "signal",
        );
      }
      for (const [to, b] of [
        [5, [0, 1.25, 0.25]],
        [14, [0, 0.95, -0.65]],
        [12, [2.2, 0.53, 0.45]],
        [13, [2.25, 0.75, -0.75]],
      ] as [number, number[]][]) {
        route(
          11,
          to,
          new T.Vector3(2.7, 0.4, -0.75),
          new T.Vector3(...(b as [number, number, number])),
          "signal",
        );
      }
      route(
        13,
        1,
        new T.Vector3(2.25, 0.6, -0.75),
        new T.Vector3(-3.1, 0.6, 0),
        "signal",
      );
      lastExplosion = e;
    }
    routes.forEach((r) =>
      r.dots.forEach((d, i) => {
        const airAllowed =
          r.kind !== "air" ||
          (r.from === 9 || r.to === 9 ? throttle < 0.2 : throttle > 0.02);
        d.visible =
          state.running &&
          airAllowed &&
          (r.cylinder === undefined || cycle[r.cylinder - 1].injecting);
        d.position.copy(
          r.curve.getPointAt(
            (time * (r.kind === "air" ? 0.12 + throttle * 0.2 : 0.2) + i / 5) %
              1,
          ),
        );
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
    group.userData.injector = cycle.findIndex((c) => c.injecting) + 1;
    group.userData.spark = cycle.findIndex((c) => c.spark) + 1;
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
  update(0, initialInjectionState);
  const surfaceFinish = applyAutomotiveFinish(group);
  return { group, update, dispose };
}
