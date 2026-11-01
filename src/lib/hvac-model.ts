import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { hvacParts, type HvacState, initialHvacState } from "./hvac-parts";
export function buildHvacModel() {
  const group = new T.Group(),
    parts = hvacParts.map((p) => {
      const g = new T.Group();
      g.name = `hvac-part-${p.id}`;
      g.userData.part = p.id;
      group.add(g);
      return g;
    });
  const mats = hvacParts.map(
    (p) =>
      new T.MeshStandardMaterial({
        color: [3, 7, 9, 10].includes(p.id)
          ? 0x26333d
          : p.id === 13
            ? 0xb47843
            : 0xaab8c1,
        metalness: [3, 7, 9, 10].includes(p.id) ? 0.2 : 0.85,
        roughness: 0.33,
      }),
  );
  function mesh(
    id: number,
    g: T.BufferGeometry,
    parent: T.Object3D = parts[id - 1],
    mat: T.Material = mats[id - 1],
  ) {
    const m = new T.Mesh(g, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  function box(
    id: number,
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    parent: T.Object3D = parts[id - 1],
  ) {
    const m = mesh(
      id,
      new RoundedBoxGeometry(w, h, d, 3, Math.min(0.08, w / 4, h / 4, d / 4)),
      parent,
    );
    m.position.set(x, y, z);
    return m;
  }
  function cyl(
    id: number,
    r: number,
    h: number,
    x: number,
    y: number,
    z: number,
    parent: T.Object3D = parts[id - 1],
  ) {
    const m = mesh(id, new T.CylinderGeometry(r, r, h, 40), parent);
    m.position.set(x, y, z);
    return m;
  }
  function pipe(
    id: number,
    points: number[][],
    r: number,
    parent: T.Object3D = parts[id - 1],
    mat: T.Material = mats[id - 1],
  ) {
    const curve = new T.CatmullRomCurve3(
      points.map((p) => new T.Vector3(p[0], p[1], p[2])),
    );
    return {
      curve,
      object: mesh(
        id,
        new T.TubeGeometry(curve, 64, r, 10, false),
        parent,
        mat,
      ),
    };
  }
  const bases = [
    [-3, 1.8, 0],
    [-3, -0.1, 0],
    [-3, -0.1, 0.28],
    [-1.65, -0.15, 0],
    [-0.8, 1.65, 0],
    [1.55, 1, 0],
    [2.9, 1, 0],
    [2, 1, 0],
    [1.35, 0.85, -0.15],
    [1.4, 2.5, 0],
    [0, 0, 0],
    [-1.3, 1.8, 0],
    [0.75, 1, 0],
  ].map((p) => new T.Vector3(...(p as [number, number, number])));
  const offsets = [
    [-0.6, 0.5, 0],
    [-0.6, -0.3, 0],
    [-0.6, -0.3, 1],
    [-0.3, -0.35, 0],
    [0, 0.7, 0],
    [-0.4, 0, 0.4],
    [1, 0, 0],
    [0.65, 0, 0.35],
    [0, 0, -0.75],
    [0.2, 0.65, 0],
    [0, 0, 0],
    [0, 0.5, 0],
    [0.25, 0, 0.35],
  ].map((p) => new T.Vector3(...(p as [number, number, number])));
  // Compressor: corpo cilíndrico, tampas, tirantes e polia com canais.
  cyl(1, 0.37, 0.85, 0, 0, 0).rotation.x = Math.PI / 2;
  for (const z of [-0.43, 0.43]) {
    cyl(1, 0.41, 0.09, 0, 0, z).rotation.x = Math.PI / 2;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const bolt = cyl(
        1,
        0.035,
        0.12,
        Math.cos(a) * 0.32,
        Math.sin(a) * 0.32,
        z,
      );
      bolt.rotation.x = Math.PI / 2;
    }
  }
  const pulley = new T.Group();
  pulley.name = "compressor-pulley";
  parts[0].add(pulley);
  for (let i = 0; i < 4; i++) {
    const ring = mesh(
      1,
      new T.TorusGeometry(0.35, 0.025, 10, 48),
      pulley,
      new T.MeshStandardMaterial({
        color: 0x222a30,
        metalness: 0.6,
        roughness: 0.4,
      }),
    );
    ring.position.z = 0.5 + i * 0.035;
  }
  for (let i = 0; i < 6; i++) {
    const spoke = box(1, 0.035, 0.53, 0.025, 0, 0, 0.57, pulley);
    spoke.rotation.z = (i * Math.PI) / 3;
  }
  box(1, 0.35, 0.18, 0.35, 0, 0.38, 0);
  function radiator(id: number, w: number, h: number) {
    for (const x of [-w / 2, w / 2]) cyl(id, 0.07, h, x, 0, 0);
    for (let i = 0; i < 26; i++)
      box(id, w, 0.018, 0.14, 0, -h / 2 + (i * h) / 25, 0);
    for (let i = 0; i < 20; i++)
      box(id, 0.012, h, 0.12, -w / 2 + (i * w) / 19, 0, 0);
  }
  radiator(2, 1.5, 1.25);
  radiator(6, 1.05, 1.25);
  radiator(13, 0.55, 1.1);
  parts[5].rotation.y = Math.PI / 2;
  parts[12].rotation.y = Math.PI / 2;
  parts[6].rotation.y = Math.PI / 2;
  function fan(id: number, r: number, count: number, centrifugal = false) {
    const rotor = new T.Group();
    rotor.name = id === 7 ? "cabin-blower" : "condenser-fan";
    parts[id - 1].add(rotor);
    cyl(id, r * 0.2, 0.22, 0, 0, 0.15, rotor).rotation.x = Math.PI / 2;
    for (let i = 0; i < count; i++) {
      const a = (i * Math.PI * 2) / count;
      const blade = box(
        id,
        centrifugal ? 0.035 : r * 0.35,
        centrifugal ? r * 0.25 : r * 0.75,
        centrifugal ? 0.35 : 0.055,
        Math.cos(a) * r * 0.65,
        Math.sin(a) * r * 0.65,
        0.12,
        rotor,
      );
      blade.rotation.set(centrifugal ? 0 : 0.35, 0, a - 0.4);
    }
    const shroud = mesh(id, new T.TorusGeometry(r, 0.055, 12, 64));
    shroud.position.z = 0.08;
    return rotor;
  }
  const outsideFan = fan(3, 0.56, 7),
    blower = fan(7, 0.47, 32, true);
  cyl(4, 0.18, 0.85, 0, 0, 0);
  for (const y of [-0.43, 0.43])
    mesh(4, new T.SphereGeometry(0.18, 24, 12)).position.y = y;
  box(5, 0.23, 0.35, 0.23, 0, 0, 0);
  for (const y of [-0.1, 0.1])
    cyl(5, 0.055, 0.35, 0, y, 0).rotation.x = Math.PI / 2;
  box(8, 0.12, 1.25, 0.95, 0, 0, 0);
  for (let i = 0; i < 24; i++)
    box(8, 0.14, 1.18, 0.013, 0.02, 0, -0.43 + i * 0.037);
  // Corte da caixa mantém o evaporador e aquecedor visíveis.
  box(9, 2.55, 0.14, 1.2, 0, -0.72, 0);
  box(9, 2.55, 1.45, 0.1, 0, 0, -0.6);
  for (const x of [-1.23, 1.23]) box(9, 0.13, 1.5, 0.3, x, 0, -0.4);
  for (let i = 0; i < 9; i++)
    box(9, 0.06, 1.5, 0.12, -1.1 + i * 0.28, 0, -0.67);
  for (const x of [-1.2, 1.2])
    for (const y of [-0.66, 0.66]) {
      const bolt = cyl(9, 0.035, 0.16, x, y, -0.48);
      bolt.rotation.x = Math.PI / 2;
    }
  for (const side of [-1, 1]) {
    pipe(
      10,
      [
        [side * 0.3, -0.15, 0],
        [side * 0.45, 0.2, 0],
        [side * 0.95, 0.35, 0.05],
      ],
      0.17,
    );
    box(10, 0.7, 0.32, 0.25, side * 0.95, 0.35, 0.05);
    for (let i = 0; i < 5; i++)
      box(10, 0.6, 0.025, 0.08, side * 0.95, 0.24 + i * 0.05, 0.2);
  }
  for (const x of [-0.15, 0.15]) {
    cyl(12, 0.05, 0.2, x, 0, 0);
    cyl(12, 0.08, 0.07, x, 0.12, 0);
  }
  const flowMaterials = [0xf04c3b, 0xffa22c, 0xf3ce3c, 0x42bfff, 0x258dff].map(
    (color) =>
      new T.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.3,
        metalness: 0.3,
        roughness: 0.3,
      }),
  );
  const paths = [
    { from: 0, to: 1, color: 0 },
    { from: 1, to: 3, color: 1 },
    { from: 3, to: 4, color: 2 },
    { from: 4, to: 5, color: 3 },
    { from: 5, to: 0, color: 4 },
  ];
  let previousExplosion = -1;
  const routes: {
    curve: T.CatmullRomCurve3;
    object: T.Mesh;
    dots: T.Mesh[];
  }[] = [];
  const air = Array.from({ length: 14 }, () => {
    const cone = mesh(
      10,
      new T.ConeGeometry(0.06, 0.18, 8),
      group,
      new T.MeshStandardMaterial({
        color: 0x7edcff,
        emissive: 0x2385bf,
        emissiveIntensity: 0.5,
      }),
    );
    cone.name = "airflow";
    return cone;
  });
  function update(time: number, state: HvacState) {
    const e = T.MathUtils.clamp(state.explosion, 0, 1),
      speed = T.MathUtils.clamp(state.speed, 0, 1);
    parts.forEach((p, i) => {
      p.position.copy(bases[i]).addScaledVector(offsets[i], e);
      mats[i].emissive.setHex(state.selected === i + 1 ? 0x285269 : 0);
    });
    pulley.rotation.z = state.cooling ? time * 3 : 0;
    outsideFan.rotation.z = state.cooling ? time * 4 : 0;
    blower.rotation.z = time * speed * 8;
    if (e !== previousExplosion) {
      for (const r of routes) {
        r.object.geometry.dispose();
        parts[10].remove(r.object);
        for (const d of r.dots) {
          d.geometry.dispose();
          parts[10].remove(d);
        }
      }
      routes.length = 0;
      paths.forEach(({ from, to, color }, i) => {
        const a = parts[from].position,
          b = parts[to].position;
        const z = i === 4 ? -1 : 0.55;
        const { curve, object } = pipe(
          11,
          [
            [a.x, a.y, a.z],
            [a.x + (i === 4 ? -0.35 : 0.3), a.y, z],
            [b.x - 0.25, b.y, z],
            [b.x, b.y, b.z],
          ],
          0.035,
          parts[10],
          flowMaterials[color],
        );
        object.name = `refrigerant-line-${i}`;
        object.userData.route = [from + 1, to + 1];
        const dots = Array.from({ length: 8 }, () =>
          mesh(
            11,
            new T.SphereGeometry(0.06, 8, 6),
            parts[10],
            flowMaterials[color],
          ),
        );
        routes.push({ curve, object, dots });
      });
      previousExplosion = e;
    }
    flowMaterials.forEach((m) => {
      m.emissiveIntensity = state.selected === 11 ? 0.85 : 0.3;
    });
    routes.forEach((r, i) =>
      r.dots.forEach((dot, j) => {
        dot.visible = state.cooling;
        dot.position.copy(
          r.curve.getPointAt((time * 0.13 + j / 8 + i * 0.09) % 1),
        );
      }),
    );
    const airRoute = new T.CatmullRomCurve3([
      parts[6].position.clone(),
      parts[7].position.clone(),
      parts[5].position.clone(),
      parts[12].position.clone(),
      parts[9].position.clone().add(new T.Vector3(0, 0.3, 0.2)),
    ]);
    air.forEach((cone, i) => {
      cone.visible = speed > 0;
      const t = (time * speed * 0.25 + i / air.length) % 1;
      cone.position.copy(airRoute.getPointAt(t));
      cone.position.z += 0.3 + ((i % 3) - 1) * 0.14;
      cone.quaternion.setFromUnitVectors(
        new T.Vector3(0, 1, 0),
        airRoute.getTangentAt(t),
      );
    });
    group.updateMatrixWorld(true);
  }
  function dispose() {
    const geometries = new Set<T.BufferGeometry>(),
      materials = new Set<T.Material>();
    group.traverse((o) => {
      if (o instanceof T.Mesh) {
        geometries.add(o.geometry);
        for (const m of Array.isArray(o.material) ? o.material : [o.material])
          materials.add(m);
      }
    });
    geometries.forEach((g) => g.dispose());
    mats.forEach((m) => materials.add(m));
    flowMaterials.forEach((m) => materials.add(m));
    materials.forEach((m) => m.dispose());
  }
  // Agrupa aletas e fixações por material, mantendo rotores e peças selecionáveis.
  function batch(parent: T.Object3D) {
    for (const child of [...parent.children])
      if (child instanceof T.Group) batch(child);
    const buckets = new Map<T.Material, T.Mesh[]>();
    for (const child of parent.children)
      if (child instanceof T.Mesh && !Array.isArray(child.material)) {
        const list = buckets.get(child.material) || [];
        list.push(child);
        buckets.set(child.material, list);
      }
    for (const [material, objects] of buckets) {
      if (objects.length < 2) continue;
      const copies = objects.map((o) => {
        o.updateMatrix();
        const geometry = o.geometry.index
          ? o.geometry.toNonIndexed()
          : o.geometry.clone();
        return geometry.applyMatrix4(o.matrix);
      });
      const geometry = mergeGeometries(copies);
      copies.forEach((g) => g.dispose());
      if (!geometry) continue;
      objects.forEach((o) => {
        parent.remove(o);
        o.geometry.dispose();
      });
      const combined = new T.Mesh(geometry, material);
      combined.castShadow = true;
      combined.receiveShadow = true;
      parent.add(combined);
    }
  }
  parts.forEach(batch);
  update(0, initialHvacState);
  return { group, update, dispose };
}
