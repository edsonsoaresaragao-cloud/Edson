import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { suspensionParts, type SuspensionState } from "./suspension-parts";

export function buildSuspensionModel() {
  const group = new T.Group();
  const groups = suspensionParts.map((part) => {
    const g = new T.Group();
    g.name = `suspension-part-${part.id}`;
    g.userData.part = part.id;
    group.add(g);
    return g;
  });
  function material(
    id: number,
    color: number = 0x9eacb8,
    metalness = 0.85,
    roughness = 0.3,
  ) {
    const m = new T.MeshStandardMaterial({
      color,
      metalness,
      roughness,
      emissive: 0x000000,
    });
    groups[id - 1].userData.materials ??= [];
    groups[id - 1].userData.materials.push(m);
    return m;
  }
  const mats = groups.map((_, i) =>
    material(
      i + 1,
      [9, 10].includes(i + 1)
        ? 0xf17a20
        : [5, 6, 12, 20].includes(i + 1)
          ? 0x202831
          : 0x9eacb8,
      [5, 6, 12, 20].includes(i + 1) ? 0.25 : 0.86,
    ),
  );
  function mesh(
    id: number,
    geo: T.BufferGeometry,
    mat = mats[id - 1],
    parent: T.Object3D = groups[id - 1],
  ) {
    const m = new T.Mesh(geo, mat);
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
  ) {
    const m = mesh(id, new RoundedBoxGeometry(w, h, d, 2, 0.035));
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
    parent: T.Object3D = groups[id - 1],
  ) {
    const m = mesh(
      id,
      new T.CylinderGeometry(r, r, h, 28),
      mats[id - 1],
      parent,
    );
    m.position.set(x, y, z);
    return m;
  }
  const up = new T.Vector3(0, 1, 0),
    delta = new T.Vector3();
  function segment(id: number, r: number) {
    return mesh(id, new T.CylinderGeometry(r, r, 1, 12));
  }
  function between(object: T.Object3D, a: T.Vector3, b: T.Vector3) {
    delta.subVectors(b, a);
    object.position.copy(a).add(b).multiplyScalar(0.5);
    object.scale.y = delta.length();
    object.quaternion.setFromUnitVectors(up, delta.normalize());
  }
  // Agregado e transmissão transversal, com abertura visual para o diferencial.
  box(1, 4.1, 0.22, 0.3, 0, 0, -0.65);
  box(1, 3.8, 0.22, 0.3, 0, 0, 0.65);
  for (const side of [-1, 1]) box(1, 0.25, 0.22, 1.5, side * 1.75, 0, 0);
  box(2, 1.25, 0.9, 1.05, 0, 0.75, -0.12);
  cyl(2, 0.61, 0.4, 0.5, 0.75, -0.12).rotation.z = Math.PI / 2;
  for (let i = 0; i < 6; i++)
    box(2, 0.04, 0.72, 1.07, -0.5 + i * 0.18, 0.75, -0.12);
  const differential = cyl(3, 0.3, 0.72, 0, 0.57, 0.3);
  differential.rotation.z = Math.PI / 2;
  for (let i = 0; i < 18; i++) {
    const a = (i * Math.PI) / 9;
    const tooth = box(
      3,
      0.12,
      0.09,
      0.1,
      0,
      0.57 + Math.cos(a) * 0.31,
      0.3 + Math.sin(a) * 0.31,
    );
    tooth.rotation.x = a;
  }
  // Caixa de direção e barra estabilizadora.
  const rack = cyl(17, 0.1, 3.1, 0, 0.25, -0.82);
  rack.rotation.z = Math.PI / 2;
  box(17, 0.55, 0.25, 0.28, 0.35, 0.27, -0.82);
  const barPoints = [
    [-2, 0.1, 0.25],
    [-1.8, 0.1, 0.85],
    [1.8, 0.1, 0.85],
    [2, 0.1, 0.25],
  ].map(([x, y, z]) => new T.Vector3(x, y, z));
  mesh(
    18,
    new T.TubeGeometry(new T.CatmullRomCurve3(barPoints), 48, 0.045, 10, false),
  );
  const sides: [
    number,
    {
      hub: T.Group;
      disc: T.Group;
      caliper: T.Group;
      support: T.Group;
      shaft: T.Mesh;
      outer: T.Group;
      inner: T.Group;
      damper: T.Mesh;
      rod: T.Mesh;
      spring: T.Mesh;
      mount: T.Mesh;
      arms: T.Mesh[];
      ball: T.Mesh;
      tie: T.Mesh;
      link: T.Mesh;
    },
  ][] = [];
  for (const side of [-1, 1]) {
    const hub = new T.Group();
    hub.name = `hub-${side}`;
    groups[6].add(hub);
    cyl(7, 0.24, 0.25, 0, 0, 0, hub).rotation.z = Math.PI / 2;
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5;
      const bolt = cyl(
        7,
        0.035,
        0.3,
        0,
        Math.cos(a) * 0.17,
        Math.sin(a) * 0.17,
        hub,
      );
      bolt.rotation.z = Math.PI / 2;
    }
    const disc = new T.Group();
    disc.name = `disc-${side}`;
    groups[7].add(disc);
    const rotor = cyl(8, 0.62, 0.095, 0, 0, 0, disc);
    rotor.rotation.z = Math.PI / 2;
    const holesMat = material(8, 0x263a49, 0.6, 0.35);
    for (let i = 0; i < 20; i++) {
      const a = (i * Math.PI) / 10;
      const hole = mesh(
        8,
        new T.CylinderGeometry(0.018, 0.018, 0.102, 6),
        holesMat,
        disc,
      );
      hole.rotation.z = Math.PI / 2;
      hole.position.set(0, Math.cos(a) * 0.49, Math.sin(a) * 0.49);
    }
    const caliper = new T.Group();
    caliper.name = `caliper-${side}`;
    groups[8].add(caliper);
    const cp = mesh(
      9,
      new RoundedBoxGeometry(0.28, 0.48, 0.29, 3, 0.06),
      mats[8],
      caliper,
    );
    cp.position.z = 0.48;
    const support = new T.Group();
    groups[9].add(support);
    const bracket = mesh(
      10,
      new T.BoxGeometry(0.2, 0.42, 0.16),
      mats[9],
      support,
    );
    bracket.position.z = 0.4;
    const outer = new T.Group(),
      inner = new T.Group();
    groups[4].add(outer);
    groups[5].add(inner);
    for (const [id, parent] of [
      [5, outer],
      [6, inner],
    ] as const)
      for (let i = 0; i < 6; i++) {
        const boot = cyl(
          id,
          0.11 + Math.sin(((i + 1) * Math.PI) / 7) * 0.06,
          0.035,
          side * (i - 2.5) * 0.04,
          0,
          0,
          parent,
        );
        boot.rotation.z = Math.PI / 2;
      }
    const shaft = segment(4, 0.055);
    const damper = segment(11, 0.1),
      rod = segment(11, 0.045);
    const springPoints = Array.from(
      { length: 161 },
      (_, i) =>
        new T.Vector3(
          Math.cos((i * Math.PI) / 10) * 0.25,
          i / 160,
          Math.sin((i * Math.PI) / 10) * 0.25,
        ),
    );
    const spring = mesh(
      12,
      new T.TubeGeometry(
        new T.CatmullRomCurve3(springPoints),
        160,
        0.033,
        7,
        false,
      ),
    );
    spring.name = `spring-${side}`;
    const mount = cyl(13, 0.31, 0.12, side * 2.05, 2.65, 0);
    const arms = [segment(14, 0.075), segment(14, 0.075)];
    const ball = mesh(15, new T.SphereGeometry(0.13, 16, 12));
    const tie = segment(16, 0.038),
      link = segment(19, 0.026);
    for (const z of [-0.55, 0.55]) {
      const b = cyl(20, 0.13, 0.24, side * 0.95, 0.08, z);
      b.rotation.x = Math.PI / 2;
    }
    sides.push([
      side,
      {
        hub,
        disc,
        caliper,
        support,
        shaft,
        outer,
        inner,
        damper,
        rod,
        spring,
        mount,
        arms,
        ball,
        tie,
        link,
      },
    ]);
  }
  const offsets = [
    new T.Vector3(0, -1.0, 0),
    new T.Vector3(0, 0.55, -0.45),
    new T.Vector3(0, -0.4, 0.9),
    new T.Vector3(0, 0, 0),
    new T.Vector3(0, 0, 0.4),
    new T.Vector3(0, 0, -0.45),
    new T.Vector3(0, 0, 0),
    new T.Vector3(0, 0, 0),
    new T.Vector3(0, 0, 0.6),
    new T.Vector3(0, 0, 0.3),
    new T.Vector3(0, 0.45, 0),
    new T.Vector3(0, 1.0, 0),
    new T.Vector3(0, 1.55, 0),
    new T.Vector3(0, -0.55, 0),
    new T.Vector3(0, -0.3, 0.3),
    new T.Vector3(0, 0, -0.45),
    new T.Vector3(0, 0.6, -1.1),
    new T.Vector3(0, -0.4, 1.0),
    new T.Vector3(0, 0.35, 0.5),
    new T.Vector3(0, -0.5, 0.65),
  ];
  function update(time: number, state: SuspensionState) {
    const e = T.MathUtils.clamp(state.explosion, 0, 1),
      amplitude = T.MathUtils.clamp(state.amplitude, 0, 1),
      steer = T.MathUtils.degToRad(T.MathUtils.clamp(state.steering, -25, 25));
    groups.forEach((g, i) => {
      g.position.copy(offsets[i]).multiplyScalar(e);
      for (const m of g.userData.materials as T.MeshStandardMaterial[]) {
        m.emissive.setHex(state.selected === i + 1 ? 0x21465b : 0x000000);
        m.emissiveIntensity = state.selected === i + 1 ? 0.6 : 0;
      }
    });
    for (const [side, p] of sides) {
      const travel =
        Math.sin(time * 1.5 + (side === 1 ? 0.55 : 0)) *
        0.22 *
        amplitude *
        (1 - e);
      const x = side * (2.55 + e * 0.75),
        y = 0.65 + travel;
      const center = new T.Vector3(x, y, 0),
        inner = new T.Vector3(side * 0.65, 0.58, 0.15),
        outer = new T.Vector3(x - side * 0.22, y, 0);
      for (const object of [p.hub, p.disc, p.caliper, p.support]) {
        object.position.copy(center);
        object.rotation.set(0, steer, 0);
      }
      p.disc.position.x += side * e * 0.45;
      p.caliper.position.x += side * e * 0.7;
      p.support.position.x += side * e * 0.55;
      p.disc.rotateX(time * 1.8 * (1 - e));
      p.hub.rotateX(time * 1.8 * (1 - e));
      between(p.shaft, inner, outer);
      p.inner.position.copy(inner);
      p.outer.position.copy(outer);
      const direction = outer.clone().sub(inner).normalize();
      const rotation = new T.Quaternion().setFromUnitVectors(
        new T.Vector3(1, 0, 0),
        direction,
      );
      p.inner.quaternion.copy(rotation);
      p.outer.quaternion.copy(rotation);
      const lower = new T.Vector3(x - side * 0.07, y + 0.08, 0),
        top = new T.Vector3(side * (2.05 + e * 0.75), 2.65, 0);
      const midpoint = lower.clone().lerp(top, 0.48);
      between(p.damper, lower, midpoint);
      between(p.rod, midpoint, top);
      const springBottom = lower.clone().lerp(top, 0.48),
        springTop = top.clone().lerp(lower, 0.08);
      const springDirection = springTop.clone().sub(springBottom);
      p.spring.position.copy(springBottom);
      p.spring.quaternion.setFromUnitVectors(
        up,
        springDirection.clone().normalize(),
      );
      p.spring.scale.y = springDirection.length();
      p.mount.position.copy(top);
      const pivot = new T.Vector3(x - side * 0.18, y - 0.14, 0);
      p.ball.position.copy(pivot);
      for (let i = 0; i < 2; i++)
        between(
          p.arms[i],
          new T.Vector3(side * 0.95, 0.08, i === 0 ? -0.55 : 0.55),
          pivot,
        );
      between(
        p.tie,
        new T.Vector3(side * 1.45 + Math.sin(steer) * 0.12, 0.25, -0.82),
        new T.Vector3(x - 0.25 * Math.sin(steer), y, -0.25 * Math.cos(steer)),
      );
      between(
        p.link,
        new T.Vector3(side * 1.9, 0.1, 0.3),
        new T.Vector3(x - side * 0.1, y + 0.36, 0.12),
      );
    }
    group.updateMatrixWorld(true);
  }
  function dispose() {
    const geo = new Set<T.BufferGeometry>(),
      mat = new Set<T.Material>();
    group.traverse((o) => {
      if (o instanceof T.Mesh) {
        geo.add(o.geometry);
        for (const m of Array.isArray(o.material) ? o.material : [o.material])
          mat.add(m);
      }
    });
    geo.forEach((g) => g.dispose());
    mat.forEach((m) => m.dispose());
  }
  update(0, { explosion: 0, steering: 0, amplitude: 0, selected: 11 });
  return { group, update, dispose };
}
