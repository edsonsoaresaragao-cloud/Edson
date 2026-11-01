import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { buildSuspensionModel } from "./suspension-model";
import { epsParts, initialEpsState, type EpsState } from "./eps-parts";
import { steeringPose } from "./steering-parts";
export function buildEpsModel() {
  const base = buildSuspensionModel(),
    group = new T.Group(),
    parts = epsParts.map((p) => {
      const g = new T.Group();
      g.name = `eps-part-${p.id}`;
      g.userData.part = p.id;
      group.add(g);
      return g;
    });
  const old = Array.from({ length: 20 }, (_, i) =>
    base.group.getObjectByName(`suspension-part-${i + 1}`)!,
  );
  const tieRods = [...old[15].children];
  const mapping: Record<number, number> = {
    1: 14,
    4: 11,
    5: 11,
    6: 11,
    7: 18,
    8: 16,
    9: 17,
    10: 17,
    11: 15,
    12: 15,
    13: 15,
    14: 12,
    15: 13,
    16: 10,
    18: 19,
    19: 19,
    20: 14,
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
    rubber = mat(0x151f27, 0.1, 0.7);
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
  const joint = mesh(3, new T.TorusGeometry(0.1, 0.025, 10, 32));
  joint.position.copy(lower).lerp(top, 0.2);
  joint.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), axis);
  for (const side of [-1, 1])
    box(
      3,
      0.12,
      0.12,
      0.12,
      joint.position.x + side * 0.08,
      joint.position.y,
      joint.position.z,
    );
  const sensor = cylinder(4, 0.15, 0.18, 0.35, 0.65, -0.82);
  sensor.name = "eps-torque-sensor";
  box(4, 0.14, 0.1, 0.14, 0.45, 0.68, -0.82, dark);
  box(5, 0.5, 0.2, 0.36, -0.65, 0.72, -0.85);
  for (let i = 0; i < 8; i++)
    box(5, 0.035, 0.045, 0.32, -0.85 + i * 0.055, 0.84, -0.85);
  box(5, 0.2, 0.13, 0.18, -0.75, 0.67, -0.6, dark);
  const motor = new T.Group();
  motor.name = "eps-motor-rotor";
  parts[5].add(motor);
  const motorShell = mesh(
    6,
    new T.CylinderGeometry(0.22, 0.22, 0.65, 48, 1, true),
  );
  motorShell.rotation.z = Math.PI / 2;
  motorShell.name = "eps-motor-shell";
  const cutShell = mesh(
    6,
    new T.CylinderGeometry(
      0.22,
      0.22,
      0.65,
      48,
      1,
      true,
      Math.PI * 0.25,
      Math.PI * 1.25,
    ),
  );
  cutShell.rotation.z = Math.PI / 2;
  cutShell.name = "eps-motor-cut";
  for (const x of [-0.33, 0.33]) {
    const ring = mesh(6, new T.TorusGeometry(0.22, 0.022, 10, 40));
    ring.rotation.y = Math.PI / 2;
    ring.position.x = x;
  }
  const copper = mat(0xb97b39);
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    const coil = new T.Group();
    coil.name = "eps-winding";
    coil.userData.front = Math.sin(a) > 0.35;
    parts[5].add(coil);
    for (let wire = 0; wire < 3; wire++) {
      const points = [
        [-0.25, a - 0.08],
        [-0.32, a],
        [-0.25, a + 0.08],
        [0.25, a + 0.08],
        [0.32, a],
        [0.25, a - 0.08],
      ].map(
        ([x, angle]) =>
          new T.Vector3(
            x,
            Math.cos(angle) * (0.17 + wire * 0.008),
            Math.sin(angle) * (0.17 + wire * 0.008),
          ),
      );
      mesh(
        6,
        new T.TubeGeometry(
          new T.CatmullRomCurve3(points, true),
          28,
          0.01,
          6,
          true,
        ),
        copper,
        coil,
      );
    }
  }
  cylinder(6, 0.11, 0.55, 0, 0, 0, silver, motor).rotation.z = Math.PI / 2;
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const pole = box(
      6,
      0.5,
      0.04,
      0.04,
      0,
      Math.cos(a) * 0.11,
      Math.sin(a) * 0.11,
      dark,
      motor,
    );
    pole.rotation.x = a;
  }
  const reduction = mesh(6, new T.SphereGeometry(0.2, 24, 16));
  reduction.position.x = -0.43;
  reduction.scale.set(1, 0.8, 1);
  const driveHousing = cylinder(6, 0.12, 1, 0, 0, 0);
  between(
    driveHousing,
    new T.Vector3(-0.43, 0, 0),
    new T.Vector3(-0.15, 0.3, -0.34),
  );
  // Caixa mecânica EPS sem circuito de fluido.
  // Janela da caixa torna a cremalheira visível no corte.
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
  rack.name = "eps-rack";
  parts[6].add(rack);
  cylinder(7, 0.065, 3, 0, 0.25, -0.82, silver, rack).rotation.z = Math.PI / 2;
  for (let i = 0; i < 18; i++)
    box(7, 0.035, 0.05, 0.06, -0.5 + i * 0.06, 0.32, -0.82, silver, rack);
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
  const signalMaterial = mat(0x65bbf3, 0.1);
  signalMaterial.emissive.setHex(0x2c80b7);
  signalMaterial.emissiveIntensity = 0.6;
  const signalRoutes: {
    curve: T.CatmullRomCurve3;
    line: T.Mesh;
    dots: T.Mesh[];
  }[] = [];
  let previousExplosion = -1,
    lastWheel = 0,
    motorAngle = 0,
    commandAt = -10,
    command = 0;
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
  batch(motor);
  batch(pinion);
  batch(parts[4]);
  // Distinct ownership for highlights, including reused suspension geometry.
  parts.forEach((p) =>
    p.traverse((o) => {
      if (o instanceof T.Mesh && !Array.isArray(o.material)) {
        const m = o.material.clone() as T.MeshStandardMaterial;
        materials.add(m);
        o.material = m;
        if (p === parts[16]) m.color.setHex(0x286e9e);
      }
    }),
  );
  function update(time: number, state: EpsState) {
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
    parts[2].position.set(-e * 0.1, e * 0.2, 0);
    parts[3].position.set(0, e * 0.65, -e * 0.35);
    parts[4].position.set(-e * 0.35, e * 0.85, -e * 0.4);
    parts[5].position.set(0.5, e * 0.6 - 0.05, -0.48 + e * 0.5);
    motorShell.visible = !state.cutaway;
    cutShell.visible = state.cutaway;
    parts[5].children.forEach((c) => {
      if (c.name === "eps-winding")
        c.visible = !state.cutaway || !c.userData.front;
    });
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
    const delta = pose.wheel - lastWheel;
    if (state.assist && Math.abs(delta) > 0.0001) {
      motorAngle += T.MathUtils.degToRad(delta) * 3;
      command = Math.sign(delta);
      commandAt = time;
    }
    lastWheel = pose.wheel;
    motor.rotation.x = motorAngle;
    if (!state.assist || time - commandAt > 0.45) command = 0;
    if (e !== previousExplosion) {
      for (const route of signalRoutes) {
        route.line.geometry.dispose();
        route.line.removeFromParent();
        route.dots.forEach((d) => {
          d.geometry.dispose();
          d.removeFromParent();
        });
      }
      signalRoutes.length = 0;
      group.updateMatrixWorld(true);
      const points = [
        new T.Vector3(0.45, 0.68, -0.82).add(parts[3].position),
        new T.Vector3(-0.75, 0.67, -0.6).add(parts[4].position),
        parts[5].position.clone(),
      ];
      for (let i = 0; i < 2; i++) {
        const a = points[i],
          b = points[i + 1],
          mid = a.clone().lerp(b, 0.5);
        mid.z += 0.3;
        const curve = new T.CatmullRomCurve3([a, mid, b]);
        const line = mesh(
          5,
          new T.TubeGeometry(curve, 32, 0.018, 8, false),
          dark,
          group,
        );
        line.name = `eps-signal-wire-${i}`;
        line.userData.connection = i === 0 ? "sensor-ecu" : "ecu-motor";
        const dots = Array.from({ length: 5 }, () =>
          mesh(5, new T.SphereGeometry(0.027, 8, 6), signalMaterial, group),
        );
        signalRoutes.push({ curve, line, dots });
      }
      previousExplosion = e;
    }
    signalRoutes.forEach((r) =>
      r.dots.forEach((d, i) => {
        d.visible = state.assist && command !== 0;
        d.position.copy(r.curve.getPointAt((time * 0.5 + i / 5) % 1));
      }),
    );
    parts.forEach((p, i) =>
      p.traverse((o) => {
        if (
          o instanceof T.Mesh &&
          !Array.isArray(o.material) &&
          o.material !== signalMaterial
        ) {
          const m = o.material as T.MeshStandardMaterial;
          m.emissive.setHex(state.selected === i + 1 ? 0x285978 : 0);
          m.emissiveIntensity = 0.65;
        }
      }),
    );
    group.userData.command = command;
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
  update(0, initialEpsState);
  return { group, update, dispose };
}
