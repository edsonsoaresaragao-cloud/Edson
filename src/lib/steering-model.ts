import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { buildSuspensionModel } from "./suspension-model";
import {
  steeringParts,
  initialSteeringState,
  type SteeringState,
  steeringPose,
  hydraulicDirection,
} from "./steering-parts";
export function buildSteeringModel() {
  const base = buildSuspensionModel(),
    group = new T.Group(),
    parts = steeringParts.map((p) => {
      const g = new T.Group();
      g.name = `steering-part-${p.id}`;
      g.userData.part = p.id;
      group.add(g);
      return g;
    });
  const old = Array.from({ length: 20 }, (_, i) =>
    base.group.getObjectByName(`suspension-part-${i + 1}`)!,
  );
  const tieRods = [...old[15].children];
  const mapping: Record<number, number> = {
    1: 18,
    4: 11,
    5: 11,
    6: 11,
    7: 19,
    8: 16,
    9: 17,
    10: 17,
    11: 14,
    12: 13,
    13: 13,
    14: 12,
    15: 15,
    16: 10,
    18: 20,
    19: 20,
    20: 18,
  };
  for (const [source, destination] of Object.entries(mapping)) {
    const object = old[Number(source) - 1];
    delete object.userData.part;
    parts[destination - 1].add(object);
  }
  const materials = new Set<T.MeshStandardMaterial>();
  old.forEach((p) => {
    for (const m of p.userData.materials as T.MeshStandardMaterial[])
      materials.add(m);
  });
  function mat(color: number, metalness = 0.8, roughness = 0.32) {
    const m = new T.MeshStandardMaterial({ color, metalness, roughness });
    materials.add(m);
    return m;
  }
  const silver = mat(0xa8bac8),
    dark = mat(0x1c2c37, 0.2, 0.5),
    rubber = mat(0x151f27, 0.1, 0.7),
    brass = mat(0xd0ac59);
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
    m = silver,
    parent: T.Object3D = parts[id - 1],
  ) {
    const o = mesh(id, new T.CylinderGeometry(r, r, h, 36), m, parent);
    o.position.set(x, y, z);
    return o;
  }
  function between(o: T.Object3D, a: T.Vector3, b: T.Vector3) {
    const d = b.clone().sub(a);
    o.position.copy(a).add(b).multiplyScalar(0.5);
    o.scale.y = d.length();
    o.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize());
  }
  const lower = new T.Vector3(0.35, 0.48, -0.82),
    top = new T.Vector3(-0.35, 3.35, -1.15),
    axis = top.clone().sub(lower).normalize();
  const wheel = new T.Group();
  wheel.name = "steering-wheel";
  parts[0].add(wheel);
  const rim = mesh(1, new T.TorusGeometry(0.48, 0.045, 14, 64), rubber, wheel);
  rim.name = "wheel-rim";
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    const spoke = box(
      1,
      0.06,
      0.35,
      0.035,
      Math.sin(a) * 0.2,
      Math.cos(a) * 0.2,
      0,
      dark,
      wheel,
    );
    spoke.rotation.z = -a;
  }
  box(1, 0.28, 0.17, 0.09, 0, 0, 0, dark, wheel);
  parts[0].position.copy(top);
  parts[0].quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), axis);
  const column = cylinder(2, 0.065, 1, 0, 0, 0);
  column.name = "steering-column";
  between(column, lower, top);
  const columnOrientation = column.quaternion.clone();
  const sleeve = cylinder(2, 0.12, 1, 0, 0, 0);
  between(sleeve, lower.clone().lerp(top, 0.42), lower.clone().lerp(top, 0.8));
  for (const t of [0.1, 0.38]) {
    const joint = mesh(2, new T.TorusGeometry(0.09, 0.025, 8, 24));
    joint.position.copy(lower).lerp(top, t);
    joint.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), axis);
  }
  cylinder(3, 0.27, 0.38, 0, 0, 0).rotation.x = Math.PI / 2;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    box(3, 0.055, 0.13, 0.28, Math.cos(a) * 0.26, Math.sin(a) * 0.26, 0);
  }
  const pulley = new T.Group();
  pulley.name = "steering-pump-pulley";
  parts[2].add(pulley);
  cylinder(3, 0.32, 0.08, 0, 0, 0.26, dark, pulley).rotation.x = Math.PI / 2;
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const bolt = cylinder(
      3,
      0.03,
      0.1,
      Math.cos(a) * 0.2,
      Math.sin(a) * 0.2,
      0.29,
      silver,
      pulley,
    );
    bolt.rotation.x = Math.PI / 2;
  }
  const tank = mat(0xe4e5bd, 0.1);
  tank.transparent = true;
  tank.opacity = 0.4;
  tank.depthWrite = false;
  box(4, 0.42, 0.5, 0.38, 0, 0, 0, tank);
  box(4, 0.35, 0.22, 0.31, 0, -0.09, 0, mat(0xb7a34c, 0.1));
  cylinder(4, 0.13, 0.1, 0, 0.3, 0, dark);
  parts[2].position.set(1.1, 2.2, -0.6);
  parts[3].position.set(1.4, 3.1, -0.5);
  // Caixa aberta em corte para tornar cremalheira e pistão visíveis.
  const rackHousing = mesh(
    7,
    new T.CylinderGeometry(
      0.14,
      0.14,
      2.85,
      48,
      1,
      true,
      Math.PI * 0.3,
      Math.PI * 1.35,
    ),
  );
  rackHousing.rotation.z = Math.PI / 2;
  rackHousing.position.set(0, 0.25, -0.82);
  for (const x of [-1.4, 1.4]) {
    const collar = mesh(7, new T.TorusGeometry(0.15, 0.03, 10, 32));
    collar.rotation.y = Math.PI / 2;
    collar.position.set(x, 0.25, -0.82);
  }
  const rack = new T.Group();
  rack.name = "hydraulic-rack";
  parts[6].add(rack);
  cylinder(7, 0.065, 3, 0, 0.25, -0.82, silver, rack).rotation.z = Math.PI / 2;
  for (let i = 0; i < 18; i++)
    box(7, 0.035, 0.05, 0.06, -0.5 + i * 0.06, 0.32, -0.82, silver, rack);
  const piston = cylinder(7, 0.125, 0.08, 0, 0.25, -0.82, brass, rack);
  piston.rotation.z = Math.PI / 2;
  const pinion = new T.Group();
  pinion.name = "steering-pinion";
  parts[7].add(pinion);
  cylinder(8, 0.1, 0.3, 0.35, 0.44, -0.82, silver, pinion);
  // Rotate around the pinion's own centre, not around the scene origin.
  pinion.position.set(0.35, 0.44, -0.82);
  pinion.children[0].position.set(0, 0, 0);
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    const tooth = box(
      8,
      0.035,
      0.12,
      0.04,
      Math.cos(a) * 0.1,
      -0.1,
      Math.sin(a) * 0.1,
      silver,
      pinion,
    );
    tooth.rotation.y = -a;
  }
  const axialMeshes = [
    cylinder(9, 0.045, 1, 0, 0, 0),
    cylinder(9, 0.045, 1, 0, 0, 0),
  ];
  const boots = [-1, 1].map((side) => {
    const boot = new T.Group();
    boot.name = `rack-boot-${side}`;
    parts[6].add(boot);
    for (let i = 0; i < 7; i++) {
      const rib = cylinder(
        7,
        0.12 + Math.sin((i * Math.PI) / 6) * 0.025,
        0.035,
        -0.15 + i * 0.05,
        0,
        0,
        rubber,
        boot,
      );
      rib.rotation.z = Math.PI / 2;
    }
    return boot;
  });
  const chamberMaterials = [mat(0x3b8fcb, 0.1), mat(0xe89139, 0.1)];
  const chambers = chamberMaterials.map((m, i) => {
    m.transparent = true;
    m.opacity = 0.3;
    const chamber = cylinder(
      7,
      0.13,
      1.3,
      i === 0 ? -0.7 : 0.7,
      0.25,
      -0.82,
      m,
    );
    chamber.rotation.z = Math.PI / 2;
    chamber.name = i ? "assist-chamber-right" : "assist-chamber-left";
    return chamber;
  });
  // Hydraulic lines rebuilt only on separation; high pressure, return and suction.
  const hoseMaterials = [
    mat(0x263340, 0.1),
    mat(0x364451, 0.1),
    mat(0x1a2a36, 0.1),
  ];
  const routes: {
    curve: T.CatmullRomCurve3;
    line: T.Mesh;
    dots: T.Mesh[];
    from: number;
    to: number;
  }[] = [];
  const bead = mat(0x7dcaff, 0.15);
  bead.emissive.setHex(0x438fbd);
  bead.emissiveIntensity = 0.5;
  let previousExplosion = -1,
    pumpAngle = 0,
    lastTime = 0;
  // Agrupa detalhes fixos dentro dos grupos que permanecem móveis.
  function batch(parent: T.Object3D) {
    const buckets = new Map<T.Material, T.Mesh[]>();
    for (const c of parent.children)
      if (c instanceof T.Mesh && !Array.isArray(c.material)) {
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
  for (const id of [1, 20]) batch(old[id - 1]);
  for (const id of [5, 6, 7, 8, 9, 10])
    for (const child of old[id - 1].children)
      if (child instanceof T.Group) batch(child);
  boots.forEach(batch);
  batch(wheel);
  batch(pulley);
  batch(pinion);
  batch(parts[2]);
  // Distinct ownership for highlights, including reused suspension geometry.
  parts.forEach((p) =>
    p.traverse((o) => {
      if (o instanceof T.Mesh && !Array.isArray(o.material)) {
        const m = o.material.clone() as T.MeshStandardMaterial;
        materials.add(m);
        o.material = m;
      }
    }),
  );
  function update(time: number, state: SteeringState) {
    const e = T.MathUtils.clamp(state.explosion, 0, 1),
      input = state.automatic ? Math.sin(time * 0.65) * 300 : state.steering,
      pose = steeringPose(input);
    base.update(0, {
      explosion: e,
      steering: pose.roadDegrees,
      amplitude: 0,
      selected: 0,
    });
    // Stop wheel/disc spin from the suspension demo; keep the commanded yaw.
    for (const side of [-1, 1])
      for (const name of [`disc-${side}`, `hub-${side}`]) {
        const object = group.getObjectByName(name)!;
        object.rotation.set(0, T.MathUtils.degToRad(pose.roadDegrees), 0);
      }
    parts[0].position.copy(top).add(new T.Vector3(-e * 0.5, e * 0.5, 0));
    parts[1].position.set(-e * 0.25, e * 0.25, 0);
    parts[2].position.set(1.1 + e * 0.3, 2.2 + e * 0.35, -0.6);
    parts[3].position.set(1.4 + e * 0.4, 3.1 + e * 0.5, -0.5);
    parts[6].position.set(0, e * 0.6, -e * 0.35);
    parts[7].position.copy(parts[6].position);
    parts[8].position.copy(parts[6].position);
    wheel.rotation.z = T.MathUtils.degToRad(pose.wheel);
    column.userData.inputAngle = pose.wheel;
    column.quaternion
      .copy(columnOrientation)
      .multiply(
        new T.Quaternion().setFromAxisAngle(
          new T.Vector3(0, 1, 0),
          T.MathUtils.degToRad(pose.wheel),
        ),
      );
    pinion.rotation.y = T.MathUtils.degToRad(pose.wheel);
    rack.position.x = pose.rack;
    for (const [i, side] of [-1, 1].entries()) {
      const start = new T.Vector3(side * 1.45 + pose.rack, 0.25, -0.82),
        end = new T.Vector3(
          side * (2.55 + e * 0.75) -
            0.25 * Math.sin(T.MathUtils.degToRad(pose.roadDegrees)),
          0.65,
          -0.25 * Math.cos(T.MathUtils.degToRad(pose.roadDegrees)),
        );
      const joint = start.clone().lerp(end, 0.8);
      between(axialMeshes[i], start, joint);
      between(tieRods[i], joint, end);
      boots[i].position.set(side * 1.25 + pose.rack * 0.5, 0.25, -0.82);
      boots[i].scale.x = 1 + (side * pose.rack) / 0.6;
    }
    const dt = T.MathUtils.clamp(time - lastTime, 0, 0.1);
    lastTime = time;
    if (state.assist) pumpAngle += dt * 3;
    pulley.rotation.z = pumpAngle;
    if (e !== previousExplosion) {
      for (const r of routes) {
        r.line.geometry.dispose();
        r.line.removeFromParent();
        for (const d of r.dots) {
          d.geometry.dispose();
          d.removeFromParent();
        }
      }
      routes.length = 0;
      const specs = [
        { id: 5, from: 2, to: 7 },
        { id: 6, from: 7, to: 3 },
        { id: 4, from: 3, to: 2 },
      ];
      for (const [i, s] of specs.entries()) {
        const parent = parts[s.id - 1];
        parent.updateMatrixWorld(true);
        const a = parts[s.from].position
            .clone()
            .add(
              s.from === 7
                ? new T.Vector3(0.35, 0.58, -0.82)
                : new T.Vector3(0, -0.15, 0),
            ),
          b = parts[s.to].position
            .clone()
            .add(
              s.to === 7
                ? new T.Vector3(0.35, 0.58, -0.82)
                : new T.Vector3(0, -0.2, 0),
            );
        const localA = parent.worldToLocal(a),
          localB = parent.worldToLocal(b),
          mid = localA.clone().lerp(localB, 0.5);
        mid.x += i === 0 ? -0.35 : 0.4;
        mid.z += 0.2;
        const curve = new T.CatmullRomCurve3([localA, mid, localB]);
        const line = mesh(
          s.id,
          new T.TubeGeometry(curve, 48, 0.035, 10, false),
          hoseMaterials[i],
          parent,
        );
        line.name = `steering-hose-${i}`;
        line.userData.route = [s.from + 1, s.to + 1];
        const dots = Array.from({ length: 7 }, () =>
          mesh(s.id, new T.SphereGeometry(0.035, 8, 6), bead, parent),
        );
        routes.push({ curve, line, dots, from: s.from, to: s.to });
      }
      previousExplosion = e;
    }
    routes.forEach((r, j) =>
      r.dots.forEach((d, i) => {
        d.visible = state.assist;
        d.position.copy(
          r.curve.getPointAt((time * 0.14 + i / 7 + j * 0.06) % 1),
        );
      }),
    );
    const direction = hydraulicDirection(pose.wheel, state.assist);
    chambers.forEach((c, i) => {
      c.visible = state.assist && direction !== "neutral";
      const m = c.material as T.MeshStandardMaterial;
      m.color.setHex(
        (direction === "left") === (i === 0) ? 0xf19538 : 0x3c9cdb,
      );
    });
    parts.forEach((p, i) =>
      p.traverse((o) => {
        if (
          o instanceof T.Mesh &&
          !Array.isArray(o.material) &&
          o.material !== bead
        ) {
          const m = o.material as T.MeshStandardMaterial;
          m.emissive.setHex(state.selected === i + 1 ? 0x285978 : 0);
          m.emissiveIntensity = 0.65;
        }
      }),
    );
    group.userData.direction = direction;
    group.userData.wheel = pose.wheel;
    group.updateMatrixWorld(true);
  }
  function dispose() {
    const geometries = new Set<T.BufferGeometry>(),
      allMaterials = new Set<T.Material>(materials);
    group.traverse((o) => {
      if (o instanceof T.Mesh) {
        geometries.add(o.geometry);
        for (const m of Array.isArray(o.material) ? o.material : [o.material])
          allMaterials.add(m);
      }
    });
    geometries.forEach((g) => g.dispose());
    allMaterials.forEach((m) => m.dispose());
    base.dispose();
  }
  update(0, initialSteeringState);
  return { group, update, dispose };
}
