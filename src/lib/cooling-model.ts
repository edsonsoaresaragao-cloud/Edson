import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import {
  coolingParts,
  initialCoolingState,
  type CoolingState,
  coolingFlow,
} from "./cooling-parts";
export function buildCoolingModel() {
  const group = new T.Group(),
    parts = coolingParts.map((p) => {
      const g = new T.Group();
      g.name = `cooling-part-${p.id}`;
      g.userData.part = p.id;
      group.add(g);
      return g;
    });
  const materials = new Set<T.MeshStandardMaterial>();
  function mat(color: number, metalness = 0.7, roughness = 0.32) {
    const m = new T.MeshStandardMaterial({ color, metalness, roughness });
    materials.add(m);
    return m;
  }
  const metal = mat(0xb0bec8),
    dark = mat(0x22323d, 0.2),
    brass = mat(0xb49750),
    hot = mat(0xd8362b, 0.3),
    cold = mat(0x2879cb, 0.3),
    pink = mat(0xc95379, 0.1),
    white = mat(0xc5d4dc, 0.1);
  function mesh(
    id: number,
    g: T.BufferGeometry,
    m = metal,
    parent: T.Object3D = parts[id - 1],
  ) {
    const o = new T.Mesh(g, m);
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
      new RoundedBoxGeometry(w, h, d, 3, Math.min(0.07, w / 4, h / 4, d / 4)),
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
    const o = mesh(id, new T.CylinderGeometry(r, r, h, 40), m, parent);
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
    const o = mesh(id, new T.TorusGeometry(r, t, 10, 48), m, parent);
    o.position.set(x, y, z);
    return o;
  }
  function tube(
    id: number,
    points: T.Vector3[],
    r: number,
    m = metal,
    parent: T.Object3D = parts[id - 1],
  ) {
    const curve = new T.CatmullRomCurve3(points);
    return {
      curve,
      object: mesh(id, new T.TubeGeometry(curve, 56, r, 10, false), m, parent),
    };
  }
  const bases = [
    [-2.7, 0.65, 0],
    [-2.7, 0.65, 0.38],
    [-3.25, 1.5, 0],
    [-0.75, 0.35, 0.1],
    [0, 1.4, 0.1],
    [0, 1.4, 0.25],
    [0, 0, 0],
    [0, 0, 0],
    [2.25, 0.15, 0],
    [2.6, 1.7, 0],
    [0, 0, 0],
    [0, 0, 0],
    [3.45, 1.7, 0.4],
    [-3.35, -0.15, 0.05],
    [0.55, 1.25, 0.1],
    [0.3, 0.55, -0.1],
  ].map((p) => new T.Vector3(...(p as [number, number, number])));
  const offsets = [
    [-0.35, 0, 0],
    [-0.35, 0, 0.75],
    [-0.35, 0.6, 0],
    [-0.15, -0.4, 0.5],
    [0, 0.4, 0],
    [0, 0.6, 0.7],
    [0, 0, 0],
    [0, 0, 0],
    [0.4, -0.25, 0],
    [0.35, 0.45, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0.7, 0.45, 0.65],
    [-0.35, -0.3, 0.2],
    [0.25, 0.3, 0.3],
    [0, -0.2, -0.4],
  ].map((p) => new T.Vector3(...(p as [number, number, number])));
  function radiator(id: number, w: number, h: number) {
    for (const x of [-w / 2, w / 2]) box(id, 0.12, h, 0.22, x, 0, 0, dark);
    for (let i = 0; i < 28; i++)
      box(id, w, 0.018, 0.16, 0, -h / 2 + (i * h) / 27, 0);
    for (let i = 0; i < 22; i++)
      box(id, 0.012, h, 0.14, -w / 2 + (i * w) / 21, 0, 0);
  }
  radiator(1, 1.5, 1.4);
  radiator(10, 0.85, 0.6);
  const radiatorFan = new T.Group();
  radiatorFan.name = "radiator-fan";
  parts[1].add(radiatorFan);
  const blower = new T.Group();
  blower.name = "heater-blower";
  parts[12].add(blower);
  for (const [id, rotor, r, n] of [
    [2, radiatorFan, 0.6, 7],
    [13, blower, 0.34, 24],
  ] as const) {
    ring(id, r, 0.04, 0, 0, 0, dark);
    cylinder(id, r * 0.18, 0.16, 0, 0, 0.05, dark, rotor).rotation.x =
      Math.PI / 2;
    for (let i = 0; i < n; i++) {
      const a = (i * Math.PI * 2) / n;
      const blade = box(
        id,
        id === 2 ? 0.23 : 0.035,
        id === 2 ? 0.4 : 0.12,
        id === 2 ? 0.045 : 0.2,
        Math.cos(a) * r * 0.6,
        Math.sin(a) * r * 0.6,
        0.04,
        id === 2 ? dark : white,
        rotor,
      );
      blade.rotation.set(id === 2 ? 0.3 : 0, 0, a - 0.35);
    }
  }
  cylinder(3, 0.18, 0.1, 0, 0, 0, dark);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    box(3, 0.05, 0.08, 0.05, Math.cos(a) * 0.17, 0.02, Math.sin(a) * 0.17);
  }
  cylinder(3, 0.1, 0.025, 0, 0.065, 0, brass);
  // Bomba em corte, com rotor e junta destacados na explosão.
  const casing = mesh(
    4,
    new T.CylinderGeometry(
      0.3,
      0.3,
      0.22,
      48,
      1,
      true,
      Math.PI * 0.3,
      Math.PI * 1.4,
    ),
  );
  casing.rotation.x = Math.PI / 2;
  const impeller = new T.Group();
  impeller.name = "water-pump-impeller";
  parts[3].add(impeller);
  cylinder(4, 0.075, 0.28, 0, 0, 0, metal, impeller).rotation.x = Math.PI / 2;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const blade = box(
      4,
      0.1,
      0.18,
      0.05,
      Math.cos(a) * 0.16,
      Math.sin(a) * 0.16,
      0.1,
      dark,
      impeller,
    );
    blade.rotation.z = a + 0.5;
  }
  ring(4, 0.29, 0.022, 0, 0, 0.16, brass);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    box(4, 0.1, 0.1, 0.08, Math.cos(a) * 0.31, Math.sin(a) * 0.31, 0);
  }
  const housing = mesh(5, new T.SphereGeometry(0.25, 32, 20), metal);
  housing.scale.set(1.2, 1, 0.8);
  cylinder(5, 0.1, 0.5, -0.28, 0, 0).rotation.z = Math.PI / 2;
  // Termostato com mola helicoidal e prato móvel; curso ampliado.
  cylinder(6, 0.085, 0.2, 0, -0.1, 0, brass);
  const helix = Array.from(
    { length: 100 },
    (_, i) =>
      new T.Vector3(
        Math.cos((i * Math.PI) / 9) * 0.08,
        -0.22 + i * 0.002,
        Math.sin((i * Math.PI) / 9) * 0.08,
      ),
  );
  tube(6, helix, 0.012, metal);
  ring(6, 0.16, 0.015, 0, 0, 0, dark).rotation.x = Math.PI / 2;
  const valve = cylinder(6, 0.15, 0.025, 0, 0.035, 0);
  valve.name = "thermostat-valve";
  const stem = cylinder(6, 0.025, 0.14, 0, 0.07, 0, brass);
  stem.name = "thermostat-stem";
  const tank = mat(0xd8e6ed, 0.1);
  tank.transparent = true;
  tank.opacity = 0.38;
  tank.depthWrite = false;
  box(9, 0.62, 0.7, 0.42, 0, 0, 0, tank);
  box(9, 0.53, 0.25, 0.37, 0, -0.17, 0.03, pink);
  cylinder(9, 0.11, 0.1, 0, 0.4, 0, dark);
  for (const y of [-0.03, 0.16]) box(9, 0.19, 0.012, 0.015, 0.1, y, 0.22, dark);
  cylinder(14, 0.045, 0.12, 0, 0, 0, brass).rotation.x = Math.PI / 2;
  box(14, 0.14, 0.035, 0.05, 0, 0, 0.07, dark);
  cylinder(15, 0.055, 0.15, 0, 0, 0, brass);
  box(15, 0.11, 0.13, 0.1, 0, 0.13, 0, dark);
  // Motor contextual com galerias externas para não confundir mangueiras com bloco.
  box(16, 0.9, 0.65, 0.65, 0, 0, 0, metal);
  for (let i = 0; i < 4; i++)
    cylinder(16, 0.09, 0.12, -0.3 + i * 0.2, 0.38, 0, dark);
  box(16, 0.95, 0.12, 0.65, 0, 0.36, 0, hot);
  const pipeSpecs = [
    {
      id: 7,
      from: 4,
      to: 0,
      a: [-0.25, 0, 0],
      b: [0.5, 0.6, 0],
      flow: "radiator",
      color: hot,
    },
    {
      id: 8,
      from: 0,
      to: 3,
      a: [0.6, -0.6, 0],
      b: [-0.22, 0, 0],
      flow: "radiator",
      color: cold,
    },
    {
      id: 11,
      from: 15,
      to: 9,
      a: [0.4, 0.2, 0],
      b: [-0.4, 0.16, 0],
      flow: "heater",
      color: hot,
    },
    {
      id: 12,
      from: 9,
      to: 3,
      a: [-0.4, -0.16, 0],
      b: [0.1, -0.1, 0],
      flow: "heater",
      color: cold,
    },
    {
      id: 16,
      from: 3,
      to: 15,
      a: [0.12, 0, 0],
      b: [-0.4, -0.1, 0],
      flow: "engine",
      color: cold,
    },
    {
      id: 16,
      from: 15,
      to: 4,
      a: [0, 0.3, 0],
      b: [0, -0.1, 0],
      flow: "engine",
      color: hot,
    },
    {
      id: 16,
      from: 4,
      to: 3,
      a: [0.1, 0, -0.08],
      b: [0.1, 0.15, -0.08],
      flow: "bypass",
      color: hot,
    },
    {
      id: 9,
      from: 0,
      to: 8,
      a: [0.7, 0.5, -0.1],
      b: [-0.25, 0, 0],
      flow: "none",
      color: dark,
    },
  ] as const;
  type Route = {
    object: T.Mesh;
    curve: T.CatmullRomCurve3;
    dots: T.Mesh[];
    collars: T.Mesh[];
    spec: (typeof pipeSpecs)[number];
  };
  const routes: Route[] = [];
  const routeMaterials = new Map<string, T.MeshStandardMaterial>();
  function routeMaterial(id: number, source: T.MeshStandardMaterial) {
    const key = `${id}:${source.uuid}`;
    let value = routeMaterials.get(key);
    if (!value) {
      value = source.clone();
      materials.add(value);
      routeMaterials.set(key, value);
    }
    return value;
  }
  const bead = mat(0xd7f6ff, 0.15);
  bead.emissive.setHex(0x75b4cf);
  bead.emissiveIntensity = 0.5;
  let previousExplosion = -1,
    timeAngle = 0,
    fanAngle = 0,
    lastTime = 0;
  // Group fixed fins by material while keeping animated valve and pump separate.
  const protectedObjects = new Set<T.Object3D>([valve, stem]);
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
      parent.add(new T.Mesh(g, m));
    }
  }
  parts.forEach(batch);
  parts.forEach((p) =>
    p.traverse((o) => {
      if (o instanceof T.Mesh && !Array.isArray(o.material)) {
        const clone = o.material.clone() as T.MeshStandardMaterial;
        materials.add(clone);
        o.material = clone;
      }
    }),
  );
  function update(time: number, state: CoolingState) {
    const e = T.MathUtils.clamp(state.explosion, 0, 1),
      speed = T.MathUtils.clamp(state.speed, 0, 1),
      opening = T.MathUtils.clamp(state.opening, 0, 1);
    const delta = T.MathUtils.clamp(time - lastTime, 0, 0.1) * speed * 5;
    timeAngle += delta;
    if (state.fan) fanAngle += delta;
    lastTime = time;
    parts.forEach((p, i) =>
      p.position.copy(bases[i]).addScaledVector(offsets[i], e),
    );
    impeller.rotation.z = timeAngle;
    valve.position.y = 0.035 + opening * 0.1;
    stem.position.y = 0.07 + opening * 0.1;
    radiatorFan.rotation.z = fanAngle;
    blower.rotation.z = timeAngle * 0.65;
    if (e !== previousExplosion) {
      for (const r of routes) {
        r.object.geometry.dispose();
        r.object.removeFromParent();
        for (const collar of r.collars) {
          collar.geometry.dispose();
          collar.removeFromParent();
        }
        for (const d of r.dots) {
          d.geometry.dispose();
          d.removeFromParent();
        }
      }
      routes.length = 0;
      for (const spec of pipeSpecs) {
        const a = parts[spec.from].position
            .clone()
            .add(new T.Vector3(...spec.a)),
          b = parts[spec.to].position.clone().add(new T.Vector3(...spec.b));
        const parent = parts[spec.id - 1];
        parent.updateMatrixWorld(true);
        const localA = parent.worldToLocal(a.clone()),
          localB = parent.worldToLocal(b.clone());
        const midpoint = localA.clone().lerp(localB, 0.5);
        midpoint.z += spec.flow === "bypass" ? -0.55 : 0.45;
        if (spec.id === 7) midpoint.y += 0.3;
        if (spec.id === 8) midpoint.y -= 0.3;
        const { curve, object } = tube(
          spec.id,
          [localA, midpoint, localB],
          spec.flow === "none" ? 0.025 : 0.065,
          routeMaterial(spec.id, spec.color),
          parent,
        );
        object.name = `coolant-route-${routes.length}`;
        object.userData.flow = spec.flow;
        const dots =
          spec.flow === "none"
            ? []
            : Array.from({ length: 9 }, () =>
                mesh(spec.id, new T.SphereGeometry(0.035, 8, 6), bead, parent),
              );
        const collars =
          spec.flow === "none"
            ? []
            : [0, 1].map((t) => {
                const collar = mesh(
                  spec.id,
                  new T.TorusGeometry(0.071, 0.012, 8, 24),
                  routeMaterial(spec.id, metal),
                  parent,
                );
                collar.position.copy(curve.getPointAt(t));
                collar.quaternion.setFromUnitVectors(
                  new T.Vector3(0, 0, 1),
                  curve.getTangentAt(t),
                );
                return collar;
              });
        routes.push({ object, curve, dots, collars, spec });
      }
      previousExplosion = e;
    }
    const flow = coolingFlow(opening, speed);
    for (const r of routes) {
      const amount = r.spec.flow === "none" ? 0 : flow[r.spec.flow];
      r.object.userData.flowAmount = amount;
      r.dots.forEach((d, i) => {
        d.visible = amount > 0;
        d.position.copy(r.curve.getPointAt((time * amount * 0.2 + i / 9) % 1));
      });
    }
    parts.forEach((p, i) =>
      p.traverse((o) => {
        if (
          o instanceof T.Mesh &&
          !Array.isArray(o.material) &&
          o.material !== bead
        ) {
          const m = o.material as T.MeshStandardMaterial;
          m.emissive.setHex(state.selected === i + 1 ? 0x285978 : 0);
          m.emissiveIntensity = 0.55;
        }
      }),
    );
    group.updateMatrixWorld(true);
  }
  function dispose() {
    const geometries = new Set<T.BufferGeometry>();
    group.traverse((o) => {
      if (o instanceof T.Mesh) geometries.add(o.geometry);
    });
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
  }
  update(0, initialCoolingState);
  return { group, update, dispose };
}
