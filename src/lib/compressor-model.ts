import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import {
  compressorParts,
  initialCompressorState,
  type CompressorState,
  pistonPosition,
  pistonRadius,
  plateTilt,
} from "./compressor-parts";
export function buildCompressorModel() {
  const group = new T.Group(),
    parts = compressorParts.map((p) => {
      const g = new T.Group();
      g.name = `compressor-part-${p.id}`;
      g.userData.part = p.id;
      group.add(g);
      return g;
    });
  const materials: T.MeshStandardMaterial[] = [];
  function material(color: number, metalness = 0.85, roughness = 0.3) {
    const m = new T.MeshStandardMaterial({ color, metalness, roughness });
    materials.push(m);
    return m;
  }
  const metal = material(0xaebbc6),
    dark = material(0x222d35, 0.55, 0.36),
    copper = material(0xbc7a32),
    rubber = material(0x142027, 0.05, 0.7);
  function mesh(
    id: number,
    g: T.BufferGeometry,
    mat = metal,
    parent: T.Object3D = parts[id - 1],
  ) {
    const m = new T.Mesh(g, mat);
    parent.add(m);
    return m;
  }
  function cylinder(
    id: number,
    r: number,
    len: number,
    x: number,
    mat = metal,
    parent: T.Object3D = parts[id - 1],
  ) {
    const m = mesh(id, new T.CylinderGeometry(r, r, len, 48), mat, parent);
    m.rotation.z = Math.PI / 2;
    m.position.x = x;
    return m;
  }
  function ring(
    id: number,
    r: number,
    wire: number,
    x: number,
    mat = metal,
    parent: T.Object3D = parts[id - 1],
  ) {
    const m = mesh(id, new T.TorusGeometry(r, wire, 12, 64), mat, parent);
    m.rotation.y = Math.PI / 2;
    m.position.x = x;
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
    mat = metal,
    parent: T.Object3D = parts[id - 1],
  ) {
    const m = mesh(id, new RoundedBoxGeometry(w, h, d, 3, 0.025), mat, parent);
    m.position.set(x, y, z);
    return m;
  }
  const bases = [
    -1.05, -0.85, -1.24, -0.12, -0.63, 0, -0.82, 0.03, 0.79, 1.02, 0, -0.65,
    -0.6, 0.18, 0, 0,
  ];
  const offsets = [
    -2.15, -1.75, -2.7, -0.7, -0.95, 0, -1.4, 0.75, 1.3, 1.8, 0, -0.9, -0.5,
    0.2, 2.2, 0,
  ];
  const pulley = new T.Group();
  pulley.name = "compressor-pulley";
  parts[0].add(pulley);
  cylinder(1, 0.59, 0.22, 0, dark, pulley);
  for (let i = 0; i < 6; i++)
    ring(1, 0.6, 0.018, -0.11 + i * 0.043, dark, pulley);
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const spoke = box(
      1,
      0.035,
      0.3,
      0.07,
      -0.13,
      Math.cos(a) * 0.32,
      Math.sin(a) * 0.32,
      metal,
      pulley,
    );
    spoke.rotation.x = a;
  }
  ring(2, 0.26, 0.065, 0);
  ring(2, 0.34, 0.025, 0);
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8;
    const ball = mesh(2, new T.SphereGeometry(0.025, 8, 6));
    ball.position.set(0, Math.cos(a) * 0.3, Math.sin(a) * 0.3);
  }
  const clutch = new T.Group();
  clutch.name = "clutch-plate";
  parts[2].add(clutch);
  cylinder(3, 0.47, 0.06, 0, dark, clutch);
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const bolt = cylinder(3, 0.038, 0.07, -0.05, metal, clutch);
    bolt.position.y = Math.cos(a) * 0.32;
    bolt.position.z = Math.sin(a) * 0.32;
  }
  cylinder(4, 0.095, 1.65, 0);
  cylinder(4, 0.13, 0.18, -0.78);
  // Flanges, nervuras e bosses de fixação em torno das carcaças circulares.
  for (const id of [5, 10]) {
    cylinder(id, id === 5 ? 0.64 : 0.61, 0.16, 0);
    ring(id, 0.59, 0.035, 0.09);
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      box(id, 0.18, 0.13, 0.13, 0, Math.cos(a) * 0.61, Math.sin(a) * 0.61);
    }
  }
  const fullShell = mesh(
    6,
    new T.CylinderGeometry(0.61, 0.61, 1.22, 64, 1, true),
  );
  fullShell.rotation.z = Math.PI / 2;
  fullShell.name = "full-shell";
  const cutShell = mesh(
    6,
    new T.CylinderGeometry(
      0.61,
      0.61,
      1.22,
      64,
      1,
      true,
      Math.PI * 0.25,
      Math.PI * 1.15,
    ),
  );
  cutShell.rotation.z = Math.PI / 2;
  cutShell.name = "cut-shell";
  for (const x of [-0.58, 0.58]) ring(6, 0.6, 0.035, x);
  for (let i = 0; i < 8; i++) {
    const a = Math.PI * 0.7 + (i * Math.PI) / 8;
    box(6, 1.15, 0.045, 0.06, 0, Math.cos(a) * 0.62, Math.sin(a) * 0.62);
  }
  for (const x of [-0.35, 0.35]) box(6, 0.22, 0.2, 0.2, x, -0.64, 0);
  ring(7, 0.4, 0.085, 0, dark);
  for (let i = 0; i < 8; i++) ring(7, 0.36 + i * 0.009, 0.006, -0.07, copper);
  const plate = new T.Group();
  plate.name = "swash-plate";
  parts[7].add(plate);
  const disc = cylinder(8, 0.49, 0.045, 0, metal, plate);
  disc.rotation.z = Math.PI / 2 - plateTilt;
  const pistons: T.Group[] = [];
  for (let i = 0; i < 6; i++) {
    const phase = (i * Math.PI) / 3,
      p = new T.Group();
    p.name = `piston-${i}`;
    parts[7].add(p);
    p.position.set(
      0.5,
      Math.cos(phase) * pistonRadius,
      Math.sin(phase) * pistonRadius,
    );
    cylinder(8, 0.105, 0.28, 0, metal, p);
    for (const x of [-0.08, -0.05]) ring(8, 0.106, 0.007, x, dark, p);
    cylinder(8, 0.025, 0.35, -0.28, metal, p);
    mesh(8, new T.SphereGeometry(0.055, 12, 8), metal, p).position.x = -0.5;
    pistons.push(p);
  }
  cylinder(9, 0.52, 0.045, 0);
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    const port = cylinder(9, 0.055, 0.048, 0, dark);
    port.position.y = Math.cos(a) * 0.36;
    port.position.z = Math.sin(a) * 0.36;
  }
  cylinder(10, 0.37, 0.16, 0.09);
  ring(12, 0.14, 0.038, 0, rubber);
  const cablePoints = [
    [-0.15, 0.45, 0],
    [-0.25, 0.85, 0],
    [0.1, 1, 0.05],
    [0.5, 0.85, 0.1],
    [0.5, 0.55, 0.1],
  ].map((p) => new T.Vector3(p[0], p[1], p[2]));
  mesh(
    13,
    new T.TubeGeometry(
      new T.CatmullRomCurve3(cablePoints),
      40,
      0.032,
      10,
      false,
    ),
    rubber,
  );
  box(13, 0.18, 0.27, 0.15, 0.5, 0.5, 0.1, dark);
  for (const x of [-0.18, 0.18]) {
    const port = cylinder(14, 0.11, 0.24, x);
    port.rotation.z = 0;
    port.position.y = 0.72;
    box(14, 0.28, 0.14, 0.28, x, 0.6, 0);
  }
  const arrows = [0x3caeff, 0xf2493e].map((color, i) => {
    const m = material(color, 0.2);
    m.emissive.setHex(color);
    m.emissiveIntensity = 0.4;
    const arrow = mesh(11, new T.ConeGeometry(0.075, 0.22, 12), m);
    arrow.name = i ? "discharge-flow" : "suction-flow";
    return arrow;
  });
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const bolt = cylinder(15, 0.03, 1.7, 0.15);
    bolt.position.y = Math.cos(a) * 0.56;
    bolt.position.z = Math.sin(a) * 0.56;
    const head = cylinder(15, 0.05, 0.06, 1);
    head.position.y = bolt.position.y;
    head.position.z = bolt.position.z;
  }
  for (const x of [-0.56, 0.67]) ring(16, 0.56, 0.018, x, rubber);
  // Static batches preserve the separate moving members and cutaway shells.
  function batch(parent: T.Object3D) {
    for (const c of [...parent.children]) if (c instanceof T.Group) batch(c);
    const buckets = new Map<T.Material, T.Mesh[]>();
    for (const c of parent.children)
      if (
        c instanceof T.Mesh &&
        !Array.isArray(c.material) &&
        !["full-shell", "cut-shell"].includes(c.name)
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
      const geo = mergeGeometries(copies);
      copies.forEach((g) => g.dispose());
      if (!geo) continue;
      objects.forEach((o) => {
        parent.remove(o);
        o.geometry.dispose();
      });
      parent.add(new T.Mesh(geo, m));
    }
  }
  parts.forEach((p, i) => {
    if (i !== 10) batch(p);
  });
  let lastTime = 0,
    shaftAngle = 0,
    pulleyAngle = 0;
  function update(time: number, state: CompressorState) {
    const dt = T.MathUtils.clamp(time - lastTime, 0, 0.1),
      speed = T.MathUtils.clamp(state.speed, 0, 1);
    lastTime = time;
    pulleyAngle += dt * speed * 5;
    if (state.engaged) shaftAngle += dt * speed * 5;
    parts.forEach((p, i) => {
      p.position.x =
        bases[i] + offsets[i] * T.MathUtils.clamp(state.explosion, 0, 1);
      p.traverse((o) => {
        if (o instanceof T.Mesh) {
          o.userData.selected = state.selected === i + 1;
        }
      });
    });
    pulley.rotation.x = pulleyAngle;
    clutch.rotation.x = shaftAngle;
    clutch.position.x = state.engaged ? 0.02 : -0.045;
    parts[3].rotation.x = shaftAngle;
    plate.rotation.x = shaftAngle;
    pistons.forEach((p, i) => {
      p.position.x = pistonPosition(shaftAngle, (i * Math.PI) / 3);
    });
    fullShell.visible = !state.cutaway;
    cutShell.visible = state.cutaway;
    arrows.forEach((arrow, i) => {
      arrow.visible = state.engaged && speed > 0;
      arrow.position.set(
        parts[13].position.x + (i ? 0.18 : -0.18),
        0.9 +
          (i ? (time * speed * 0.5) % 0.4 : 0.4 - ((time * speed * 0.5) % 0.4)),
        0,
      );
      arrow.rotation.z = i ? 0 : Math.PI;
    });
    // Separate material per item for selection, without changing other components.
    group.updateMatrixWorld(true);
  }
  // Clone shared materials per selectable root; rotor subgroup structure stays intact.
  parts.forEach((p, i) =>
    p.traverse((o) => {
      if (o instanceof T.Mesh && !Array.isArray(o.material)) {
        const copy = o.material.clone() as T.MeshStandardMaterial;
        materials.push(copy);
        o.material = copy;
        o.userData.partIndex = i;
      }
    }),
  );
  function highlight(selected: number) {
    parts.forEach((p, i) =>
      p.traverse((o) => {
        if (o instanceof T.Mesh && !Array.isArray(o.material)) {
          const m = o.material as T.MeshStandardMaterial;
          m.emissive.setHex(
            i + 1 === selected ? 0x285978 : i === 10 ? 0x123f55 : 0,
          );
          m.emissiveIntensity = i + 1 === selected ? 0.65 : 0.25;
        }
      }),
    );
  }
  function dispose() {
    const geometries = new Set<T.BufferGeometry>();
    group.traverse((o) => {
      if (o instanceof T.Mesh) geometries.add(o.geometry);
    });
    geometries.forEach((g) => g.dispose());
    new Set(materials).forEach((m) => m.dispose());
  }
  update(0, initialCompressorState);
  return {
    group,
    update(time: number, state: CompressorState) {
      update(time, state);
      highlight(state.selected);
    },
    dispose,
  };
}
