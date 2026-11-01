import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import {
  alternatorParts,
  initialAlternatorState,
  type AlternatorState,
} from "./alternator-parts";
export function buildAlternatorModel() {
  const group = new T.Group(),
    parts = alternatorParts.map((p) => {
      const g = new T.Group();
      g.name = `alternator-part-${p.id}`;
      g.userData.part = p.id;
      group.add(g);
      return g;
    });
  const materials = new Set<T.MeshStandardMaterial>();
  function mat(color: number, metalness = 0.85, roughness = 0.3) {
    const m = new T.MeshStandardMaterial({ color, metalness, roughness });
    materials.add(m);
    return m;
  }
  const silver = mat(0xb1bec8),
    iron = mat(0x48545d),
    copper = mat(0xb76b2c),
    black = mat(0x1a2732, 0.15, 0.5),
    brass = mat(0xd3ad5f);
  function mesh(
    id: number,
    g: T.BufferGeometry,
    m = silver,
    parent: T.Object3D = parts[id - 1],
  ) {
    const o = new T.Mesh(g, m);
    parent.add(o);
    return o;
  }
  function cyl(
    id: number,
    r: number,
    h: number,
    x: number,
    m = silver,
    parent: T.Object3D = parts[id - 1],
    segments = 48,
  ) {
    const o = mesh(id, new T.CylinderGeometry(r, r, h, segments), m, parent);
    o.rotation.z = Math.PI / 2;
    o.position.x = x;
    return o;
  }
  function ring(
    id: number,
    r: number,
    t: number,
    x: number,
    m = silver,
    parent: T.Object3D = parts[id - 1],
  ) {
    const o = mesh(id, new T.TorusGeometry(r, t, 10, 64), m, parent);
    o.rotation.y = Math.PI / 2;
    o.position.x = x;
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
      new RoundedBoxGeometry(w, h, d, 3, Math.min(0.025, w / 4, h / 4, d / 4)),
      m,
      parent,
    );
    o.position.set(x, y, z);
    return o;
  }
  const base = [
    -0.94, -0.75, -0.61, -0.52, 0, 0, 0.65, 0.63, 0.72, 0.57, 0.57, 0.83, 0,
    0.93, -1.15, 0,
  ];
  const offsets = [
    -2.5, -2.05, -1.75, -1.2, 0, 0.75, 1.7, 1.4, 2.1, 1.3, 2.5, 2.8, 1.2, 3.2,
    -2.9, 0,
  ];
  // Polia estriada, ventoinha estampada e rolamentos anelares.
  cyl(1, 0.34, 0.24, 0, iron);
  for (let i = 0; i < 6; i++) ring(1, 0.36, 0.017, -0.11 + i * 0.044);
  cyl(2, 0.17, 0.045, 0);
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    const blade = box(
      2,
      0.06,
      0.24,
      0.11,
      0,
      Math.cos(a) * 0.33,
      Math.sin(a) * 0.33,
    );
    blade.rotation.x = a + 0.25;
  }
  for (const id of [3, 10]) {
    ring(id, 0.16, 0.035, 0);
    ring(id, 0.23, 0.025, 0);
    for (let i = 0; i < 16; i++) {
      const a = (i * Math.PI) / 8;
      const ball = mesh(id, new T.SphereGeometry(0.022, 8, 6));
      ball.position.set(0, Math.cos(a) * 0.197, Math.sin(a) * 0.197);
    }
  }
  // Carcaças vazadas: as lacunas entre as nervuras são aberturas reais.
  const cutMembers: T.Object3D[] = [];
  for (const id of [4, 11]) {
    ring(id, 0.62, 0.055, 0);
    ring(id, 0.25, 0.035, id === 4 ? -0.12 : 0.12);
    for (let i = 0; i < 18; i++) {
      const a = (i * Math.PI) / 9;
      const web = box(
        id,
        0.23,
        0.37,
        0.055,
        0,
        Math.cos(a) * 0.43,
        Math.sin(a) * 0.43,
      );
      web.rotation.x = a;
      const rib = box(
        id,
        0.4,
        0.055,
        0.08,
        id === 4 ? 0.08 : -0.08,
        Math.cos(a) * 0.62,
        Math.sin(a) * 0.62,
      );
      rib.rotation.x = a;
      if (Math.sin(a) > 0.2) cutMembers.push(web, rib);
    }
    for (const a of [Math.PI * 0.5, Math.PI * 1.15, Math.PI * 1.85]) {
      const lug = ring(id, 0.09, 0.055, 0);
      lug.position.y = Math.cos(a) * 0.78;
      lug.position.z = Math.sin(a) * 0.78;
    }
  }
  // Rotor em garra, enrolamento de campo e anéis coletores no mesmo eixo.
  cyl(5, 0.075, 1.65, 0);
  cyl(5, 0.28, 0.53, 0, iron);
  for (let i = 0; i < 12; i++) ring(5, 0.29, 0.012, -0.24 + i * 0.044, copper);
  for (const side of [-1, 1]) {
    cyl(5, 0.4, 0.07, side * 0.29, iron);
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 + (side === 1 ? Math.PI / 6 : 0);
      const claw = mesh(5, new T.ConeGeometry(0.145, 0.47, 4), iron);
      claw.rotation.set(a, 0, (side * Math.PI) / 2);
      claw.position.set(side * 0.07, Math.cos(a) * 0.36, Math.sin(a) * 0.36);
    }
  }
  for (const x of [0.64, 0.71]) ring(5, 0.12, 0.026, x, copper);
  // Estator fixo com dentes laminados e laços de cobre em cada ranhura.
  for (let i = 0; i < 24; i++) {
    const a = (i * Math.PI) / 12;
    const tooth = box(
      6,
      0.68,
      0.12,
      0.11,
      0,
      Math.cos(a) * 0.53,
      Math.sin(a) * 0.53,
      iron,
    );
    tooth.rotation.x = a;
    const windingGroup = new T.Group();
    parts[5].add(windingGroup);
    for (let wire = 0; wire < 3; wire++) {
      const r = 0.61 + wire * 0.014;
      const points = [
        [-0.33, a - 0.065],
        [-0.46, a],
        [-0.33, a + 0.065],
        [0.33, a + 0.065],
        [0.46, a],
        [0.33, a - 0.065],
      ].map(
        ([x, phi]) => new T.Vector3(x, Math.cos(phi) * r, Math.sin(phi) * r),
      );
      mesh(
        6,
        new T.TubeGeometry(
          new T.CatmullRomCurve3(points, true),
          36,
          0.013,
          6,
          true,
        ),
        copper,
        windingGroup,
      );
    }
    if (Math.sin(a) > 0.35) cutMembers.push(tooth, windingGroup);
  }
  box(7, 0.14, 0.32, 0.35, 0, 0.35, 0, black);
  for (let i = 0; i < 8; i++)
    box(7, 0.04, 0.27, 0.02, -0.09, 0.35, -0.14 + i * 0.04);
  box(8, 0.13, 0.22, 0.24, 0, 0.26, 0, black);
  for (const x of [-0.035, 0.035])
    box(8, 0.035, 0.15, 0.07, x, 0.12, 0, copper);
  ring(9, 0.4, 0.06, 0, iron);
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const diode = cyl(9, 0.07, 0.08, 0.045, black);
    diode.position.y = Math.cos(a) * 0.4;
    diode.position.z = Math.sin(a) * 0.4;
    const pin = cyl(9, 0.025, 0.12, 0.12, brass);
    pin.position.y = diode.position.y;
    pin.position.z = diode.position.z;
  }
  const terminal = cyl(12, 0.045, 0.2, 0, brass);
  terminal.rotation.z = 0;
  terminal.position.set(0, 0.65, 0);
  box(12, 0.2, 0.2, 0.26, 0, 0.4, 0, black);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    const bolt = cyl(13, 0.025, 1.5, 0.1);
    bolt.position.y = Math.cos(a) * 0.56;
    bolt.position.z = Math.sin(a) * 0.56;
    const head = cyl(13, 0.045, 0.05, 0.87, silver, parts[12], 6);
    head.position.y = bolt.position.y;
    head.position.z = bolt.position.z;
  }
  ring(14, 0.57, 0.055, 0, black);
  for (let i = 0; i < 14; i++) {
    const a = (i * Math.PI) / 7;
    const rib = box(
      14,
      0.1,
      0.35,
      0.08,
      0.03,
      Math.cos(a) * 0.38,
      Math.sin(a) * 0.38,
      black,
    );
    rib.rotation.x = a;
    if (Math.sin(a) > 0.2) cutMembers.push(rib);
  }
  cyl(15, 0.095, 0.08, 0, brass, parts[14], 6);
  for (const x of [-0.57, 0.59]) ring(16, 0.13, 0.025, x, black);
  // Cortes preservam peças individuais; demais detalhes são agrupados por material.
  function batch(parent: T.Object3D) {
    for (const c of [...parent.children])
      if (c instanceof T.Group && !cutMembers.includes(c)) batch(c);
    const buckets = new Map<T.Material, T.Mesh[]>();
    for (const c of parent.children)
      if (
        c instanceof T.Mesh &&
        !Array.isArray(c.material) &&
        !cutMembers.includes(c)
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
      copies.forEach((c) => c.dispose());
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
        const copy = o.material.clone() as T.MeshStandardMaterial;
        materials.add(copy);
        o.material = copy;
      }
    }),
  );
  const flow = new T.Group();
  flow.name = "electrical-flow";
  group.add(flow);
  const flowColors = [0x70c6ff, 0xaf8eff, 0x6de1b0, 0xffc257];
  const particles = flowColors
    .map((color, phase) => {
      const m = mat(color, 0.2);
      m.emissive.setHex(color);
      m.emissiveIntensity = 0.8;
      return Array.from({ length: 4 }, (_, i) => {
        const p = mesh(9, new T.SphereGeometry(0.022, 8, 6), m, flow);
        p.userData.phase = phase;
        p.userData.offset = i / 4;
        return p;
      });
    })
    .flat();
  let angle = 0,
    lastTime = 0;
  function update(time: number, state: AlternatorState) {
    const dt = T.MathUtils.clamp(time - lastTime, 0, 0.1);
    lastTime = time;
    const speed = T.MathUtils.clamp(state.speed, 0, 1),
      explosion = T.MathUtils.clamp(state.explosion, 0, 1);
    angle += dt * speed * 5;
    parts.forEach((p, i) => {
      p.position.x = base[i] + offsets[i] * explosion;
      p.traverse((o) => {
        if (o instanceof T.Mesh && !Array.isArray(o.material)) {
          const m = o.material as T.MeshStandardMaterial;
          m.emissive.setHex(state.selected === i + 1 ? 0x285978 : 0);
          m.emissiveIntensity = 0.6;
        }
      });
    });
    for (const id of [1, 2, 5, 15]) parts[id - 1].rotation.x = angle;
    cutMembers.forEach((m) => {
      m.visible = !state.cutaway;
    });
    particles.forEach((p) => {
      p.visible = state.excited && speed > 0;
      const t = (time * speed * 0.5 + p.userData.offset) % 1,
        phase = p.userData.phase;
      const from = parts[phase === 3 ? 8 : 5].position.x,
        to = parts[phase === 3 ? 11 : 8].position.x;
      p.position.set(
        T.MathUtils.lerp(from, to, t),
        0.4 +
          (phase === 3
            ? 0.18
            : Math.sin(t * Math.PI * 4 + (phase * Math.PI * 2) / 3) * 0.08),
        0.4 + phase * 0.04,
      );
    });
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
  update(0, initialAlternatorState);
  return { group, update, dispose };
}
