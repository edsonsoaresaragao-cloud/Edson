import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import {
  initialStarterState,
  starterParts,
  starterSequence,
  type StarterState,
} from "./starter-parts";

const tau = Math.PI * 2;
export function buildStarterModel() {
  const group = new T.Group();
  const parts = starterParts.map((part) => {
    const item = new T.Group();
    item.name = `starter-part-${part.id}`;
    item.userData.part = part.id;
    group.add(item);
    return item;
  });
  const materials = new Set<T.MeshStandardMaterial>();
  function material(color: number, metalness = 0.85, roughness = 0.32) {
    const result = new T.MeshStandardMaterial({
      color,
      metalness,
      roughness,
      side: T.DoubleSide,
    });
    materials.add(result);
    return result;
  }
  const aluminum = material(0xb3bec6, 0.8, 0.38),
    steel = material(0x65717a, 0.95, 0.26),
    iron = material(0x65717b, 0.8, 0.4),
    paint = material(0x17222d, 0.45, 0.38),
    copper = material(0xc27a3e, 0.88, 0.26),
    brass = material(0xbba15d, 0.8, 0.34),
    carbon = material(0x20252a, 0.1, 0.75),
    insulator = material(0x17202a, 0.05, 0.5);
  function mesh(
    parent: T.Object3D,
    geometry: T.BufferGeometry,
    mat = aluminum,
  ) {
    const object = new T.Mesh(geometry, mat);
    parent.add(object);
    return object;
  }
  function cylinder(
    parent: T.Object3D,
    radius: number,
    length: number,
    x: number,
    mat = steel,
    segments = 48,
  ) {
    const object = mesh(
      parent,
      new T.CylinderGeometry(radius, radius, length, segments),
      mat,
    );
    object.rotation.z = Math.PI / 2;
    object.position.x = x;
    return object;
  }
  function torus(
    parent: T.Object3D,
    radius: number,
    thickness: number,
    x: number,
    mat = steel,
  ) {
    const object = mesh(
      parent,
      new T.TorusGeometry(radius, thickness, 5, 40),
      mat,
    );
    object.rotation.y = Math.PI / 2;
    object.position.x = x;
    return object;
  }
  function box(
    parent: T.Object3D,
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    mat = steel,
  ) {
    const object = mesh(
      parent,
      new RoundedBoxGeometry(w, h, d, 2, Math.min(0.018, w / 4, h / 4, d / 4)),
      mat,
    );
    object.position.set(x, y, z);
    return object;
  }
  function sleeve(
    parent: T.Object3D,
    outer: number,
    inner: number,
    length: number,
    x: number,
    mat = steel,
    start = 0,
    arc = tau,
  ) {
    const shape = new T.Shape(),
      a = start + Math.PI / 2;
    shape.absarc(0, 0, outer, a, a + arc, false);
    if (arc >= tau - 0.001) {
      const hole = new T.Path();
      hole.absarc(0, 0, inner, 0, tau, true);
      shape.holes.push(hole);
    } else {
      shape.lineTo(Math.cos(a + arc) * inner, Math.sin(a + arc) * inner);
      shape.absarc(0, 0, inner, a + arc, a, true);
      shape.closePath();
    }
    const geometry = new T.ExtrudeGeometry(shape, {
      depth: length,
      steps: 1,
      bevelEnabled: true,
      bevelSize: Math.min(0.003, (outer - inner) / 4),
      bevelThickness: 0.003,
      bevelSegments: 1,
      curveSegments: arc < 1 ? 4 : arc < 3 ? 10 : 32,
    });
    geometry.translate(0, 0, -length / 2);
    geometry.rotateY(Math.PI / 2);
    const object = mesh(parent, geometry, mat);
    object.position.x = x;
    return object;
  }
  function tube(
    parent: T.Object3D,
    points: number[][],
    radius: number,
    mat = copper,
    closed = false,
    segments = 28,
  ) {
    return mesh(
      parent,
      new T.TubeGeometry(
        new T.CatmullRomCurve3(
          points.map(([x, y, z]) => new T.Vector3(x, y, z)),
          closed,
        ),
        segments,
        radius,
        5,
        closed,
      ),
      mat,
    );
  }
  function gear(
    parent: T.Object3D,
    teeth: number,
    root: number,
    tip: number,
    bore: number,
    width: number,
    mat = steel,
  ) {
    const shape = new T.Shape();
    for (let i = 0; i < teeth * 4; i++) {
      const a = (i * tau) / (teeth * 4),
        r = i % 4 === 1 || i % 4 === 2 ? tip : root;
      if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    shape.closePath();
    const hole = new T.Path();
    hole.absarc(0, 0, bore, 0, tau, true);
    shape.holes.push(hole);
    const geometry = new T.ExtrudeGeometry(shape, {
      depth: width,
      steps: 1,
      bevelEnabled: true,
      bevelSegments: 1,
      bevelSize: 0.004,
      bevelThickness: 0.004,
      curveSegments: 24,
    });
    geometry.translate(0, 0, -width / 2);
    geometry.rotateY(Math.PI / 2);
    return mesh(parent, geometry, mat);
  }
  const cutPanels: T.Group[] = [];
  // A true hollow cast nose with a large window, lips, mounting ears and webs.
  sleeve(parts[0], 0.6, 0.52, 0.26, 0.18, aluminum);
  sleeve(parts[0], 0.23, 0.11, 0.22, -1.18, aluminum);
  const noseProfile = [
    new T.Vector2(0.23, -1.18),
    new T.Vector2(0.34, -0.72),
    new T.Vector2(0.56, 0.08),
    new T.Vector2(0.52, 0.1),
    new T.Vector2(0.29, -0.72),
    new T.Vector2(0.18, -1.18),
  ];
  const nose = mesh(
    parts[0],
    new T.LatheGeometry(noseProfile, 48, Math.PI * 0.55, Math.PI * 1.18),
    aluminum,
  );
  nose.rotation.z = -Math.PI / 2;
  for (const a of [Math.PI * 0.2, Math.PI, Math.PI * 1.8]) {
    const rib = box(
      parts[0],
      1.16,
      0.07,
      0.075,
      -0.48,
      Math.cos(a) * 0.34,
      Math.sin(a) * 0.34,
      aluminum,
    );
    rib.rotation.x = a;
  }
  for (const a of [Math.PI * 0.12, Math.PI * 1.12]) {
    const ear = sleeve(parts[0], 0.17, 0.085, 0.22, 0.2, aluminum);
    ear.position.y = Math.cos(a) * 0.66;
    ear.position.z = Math.sin(a) * 0.66;
  }
  // Pinion teeth, drive barrel and a separate inner/outer freewheel race.
  gear(parts[1], 10, 0.165, 0.224, 0.075, 0.23);
  sleeve(parts[1], 0.13, 0.075, 0.18, 0.17);
  sleeve(parts[2], 0.25, 0.09, 0.36, 0, steel);
  const outerRace = new T.Group();
  outerRace.name = "starter-clutch-outer-race";
  parts[2].add(outerRace);
  sleeve(outerRace, 0.27, 0.23, 0.25, 0, iron);
  for (let i = 0; i < 10; i++) {
    const a = (i * tau) / 10;
    const roller = cylinder(outerRace, 0.022, 0.26, 0, steel, 12);
    roller.position.y = Math.cos(a) * 0.22;
    roller.position.z = Math.sin(a) * 0.22;
  }
  for (const x of [-0.17, 0.17]) torus(parts[2], 0.245, 0.018, x, steel);
  // Two-prong cast/stamped fork with a pivot eye, not a solid cuboid.
  const fork = new T.Shape();
  fork.moveTo(-0.055, 0.28);
  fork.quadraticCurveTo(-0.12, 0.0, -0.16, -0.2);
  fork.lineTo(-0.3, -0.64);
  fork.lineTo(-0.17, -0.69);
  fork.lineTo(0.01, -0.2);
  fork.quadraticCurveTo(0.07, 0.02, 0.055, 0.28);
  fork.closePath();
  for (const z of [-0.16, 0.16]) {
    const geometry = new T.ExtrudeGeometry(fork, {
      depth: 0.065,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.012,
      bevelSegments: 2,
      steps: 1,
    });
    geometry.translate(0, 0, z - 0.03);
    mesh(parts[3], geometry, brass);
  }
  const pivot = torus(parts[3], 0.075, 0.025, 0, brass);
  pivot.rotation.set(0, 0, 0);
  pivot.position.y = 0.14;
  box(parts[3], 0.13, 0.1, 0.37, -0.01, 0.11, 0, brass);
  // Solenoid: separate steel can, insulated cap, studs, pull plunger and bridge.
  sleeve(parts[4], 0.29, 0.255, 0.9, 0, aluminum, Math.PI / 2, Math.PI * 1.5);
  const solenoidCut = new T.Group();
  parts[4].add(solenoidCut);
  cutPanels.push(solenoidCut);
  sleeve(solenoidCut, 0.29, 0.255, 0.9, 0, aluminum, 0, Math.PI / 2);
  // The outer solenoid can stays legible; its copper winding is visible at front.
  for (let i = 0; i < 17; i++)
    torus(parts[4], 0.19, 0.012, -0.36 + i * 0.042, copper);
  sleeve(
    parts[4],
    0.27,
    0.04,
    0.16,
    0.5,
    insulator,
    Math.PI / 2,
    Math.PI * 1.5,
  );
  sleeve(solenoidCut, 0.27, 0.04, 0.16, 0.5, insulator, 0, Math.PI / 2);
  const plunger = new T.Group();
  plunger.name = "starter-solenoid-plunger";
  parts[4].add(plunger);
  cylinder(plunger, 0.105, 0.57, -0.39);
  torus(plunger, 0.12, 0.015, -0.65);
  for (const y of [-0.14, 0.14]) {
    const stud = cylinder(parts[4], 0.038, 0.24, 0.65, copper, 24);
    stud.position.y = y;
    const nut = cylinder(parts[4], 0.062, 0.045, 0.64, brass, 6);
    nut.position.y = y;
    for (let i = 0; i < 5; i++) {
      const thread = torus(parts[4], 0.04, 0.006, 0.65 + i * 0.027, copper);
      thread.position.y = y;
    }
  }
  const terminal = cylinder(parts[4], 0.021, 0.14, 0.64, brass);
  terminal.position.z = 0.18;
  const bridge = box(parts[4], 0.04, 0.36, 0.075, 0.43, 0, 0, copper);
  bridge.name = "starter-power-contact";
  for (const x of [-0.3, 0.3])
    box(parts[4], 0.14, 0.23, 0.2, x, -0.31, 0, aluminum);
  // Steel motor yoke with a removable quarter-sector for the cutaway.
  sleeve(parts[5], 0.64, 0.585, 1.6, 0, paint, Math.PI / 2, Math.PI * 1.5);
  const bodyCut = new T.Group();
  bodyCut.name = "starter-housing-cut-panel";
  parts[5].add(bodyCut);
  cutPanels.push(bodyCut);
  sleeve(bodyCut, 0.64, 0.585, 1.6, 0, paint, 0, Math.PI / 2);
  for (const x of [-0.78, 0.78]) torus(parts[5], 0.616, 0.023, x, steel);
  for (const a of [Math.PI * 0.65, Math.PI * 1.65]) {
    const bolt = cylinder(parts[5], 0.023, 1.96, 0, steel, 12);
    bolt.position.y = Math.cos(a) * 0.56;
    bolt.position.z = Math.sin(a) * 0.56;
    const head = cylinder(parts[5], 0.046, 0.06, 1.0, aluminum, 6);
    head.position.y = bolt.position.y;
    head.position.z = bolt.position.z;
  }
  // Laminated, slotted armature, realistic end turns and segmented commutator.
  cylinder(parts[6], 0.073, 3.65, -0.55, steel);
  cylinder(parts[6], 0.332, 0.83, -0.15, iron);
  gear(parts[6], 18, 0.28, 0.365, 0.075, 0.83, iron).position.x = -0.15;
  for (let i = 0; i < 16; i++)
    torus(parts[6], 0.292, 0.004, -0.53 + i * 0.051, steel);
  for (let i = 0; i < 18; i++)
    for (let wire = 0; wire < 2; wire++) {
      const a = (i * tau) / 18,
        r = 0.344 + wire * 0.014,
        p = (x: number, phi: number, rad: number) => [
          x,
          Math.cos(phi) * rad,
          Math.sin(phi) * rad,
        ];
      tube(
        parts[6],
        [
          p(-0.53, a - 0.045, r),
          p(-0.66, a, 0.38),
          p(-0.53, a + 0.045, r),
          p(0.23, a + 0.045, r),
          p(0.36, a, 0.38),
          p(0.23, a - 0.045, r),
        ],
        0.011,
        copper,
        true,
        26,
      );
    }
  const commutator = new T.Group();
  commutator.name = "starter-commutator";
  parts[6].add(commutator);
  cylinder(commutator, 0.17, 0.29, 0.64, insulator);
  for (let i = 0; i < 24; i++)
    sleeve(
      commutator,
      0.232,
      0.17,
      0.28,
      0.64,
      copper,
      (i * tau) / 24 + 0.012,
      tau / 24 - 0.024,
    );
  for (const x of [-1.23, 1.22]) torus(parts[6], 0.084, 0.012, x, steel);
  // Four fixed, wound field poles around the armature (not permanent magnets).
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    sleeve(parts[7], 0.57, 0.445, 0.72, 0, iron, a - 0.35, 0.7);
    for (let wire = 0; wire < 7; wire++) {
      const r = 0.49 + wire * 0.007,
        p = (x: number, phi: number) => [
          x,
          Math.cos(phi) * r,
          Math.sin(phi) * r,
        ];
      tube(
        parts[7],
        [
          p(-0.4, a - 0.27),
          p(-0.55, a),
          p(-0.4, a + 0.27),
          p(0.4, a + 0.27),
          p(0.55, a),
          p(0.4, a - 0.27),
        ],
        0.009,
        copper,
        true,
        30,
      );
    }
  }
  // Brush holder and four carbon brushes are separate selectable components.
  sleeve(parts[8], 0.54, 0.35, 0.055, 0, brass);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + 0.12,
      y = Math.cos(a),
      z = Math.sin(a);
    const pocket = new T.Group();
    parts[8].add(pocket);
    pocket.rotation.x = a;
    for (const x of [-0.11, 0.11])
      box(pocket, 0.025, 0.24, 0.18, x, 0.37, 0, brass);
    for (const side of [-1, 1])
      box(pocket, 0.2, 0.24, 0.022, 0, 0.37, side * 0.083, brass);
    const brush = box(
      parts[9],
      0.19,
      0.14,
      0.12,
      0,
      y * 0.302,
      z * 0.302,
      carbon,
    );
    brush.rotation.x = a;
    tube(
      parts[9],
      [
        [0.02, y * 0.37, z * 0.37],
        [0.08, y * 0.44, z * 0.44],
        [0.04, y * 0.49, z * 0.49],
        [-0.025, y * 0.51, z * 0.51],
      ],
      0.015,
      copper,
      false,
      16,
    );
    for (let turn = 0; turn < 3; turn++) {
      const spring = torus(parts[8], 0.065, 0.005, 0.02 + turn * 0.025, steel);
      spring.rotation.set(Math.PI / 2, a, 0);
      spring.position.y = y * 0.47;
      spring.position.z = z * 0.47;
    }
  }
  // Rear cup with an actual central bushing, radial ribs and bolt heads.
  sleeve(parts[10], 0.64, 0.575, 0.18, 0, aluminum);
  sleeve(parts[10], 0.6, 0.09, 0.065, 0.1, aluminum);
  sleeve(parts[10], 0.125, 0.075, 0.19, 0.06, brass);
  for (let i = 0; i < 8; i++) {
    const a = (i * tau) / 8;
    const rib = box(
      parts[10],
      0.11,
      0.37,
      0.028,
      0.06,
      Math.cos(a) * 0.33,
      Math.sin(a) * 0.33,
      aluminum,
    );
    rib.rotation.x = a;
  }
  for (const a of [Math.PI * 0.65, Math.PI * 1.65]) {
    const bolt = cylinder(parts[10], 0.055, 0.04, 0.15, steel, 6);
    bolt.position.y = Math.cos(a) * 0.55;
    bolt.position.z = Math.sin(a) * 0.55;
  }

  // Batch static meshes within each moving group, preserving articulation.
  function batch(parent: T.Object3D) {
    for (const child of [...parent.children])
      if (child instanceof T.Group) batch(child);
    const buckets = new Map<T.Material, T.Mesh[]>();
    for (const child of parent.children)
      if (
        child instanceof T.Mesh &&
        !Array.isArray(child.material) &&
        child.name !== "starter-power-contact"
      ) {
        const bucket = buckets.get(child.material) || [];
        bucket.push(child);
        buckets.set(child.material, bucket);
      }
    for (const [mat, objects] of buckets) {
      if (objects.length < 2) continue;
      const copies = objects.map((object) => {
        object.updateMatrix();
        return (
          object.geometry.index
            ? object.geometry.toNonIndexed()
            : object.geometry.clone()
        ).applyMatrix4(object.matrix);
      });
      const geometry = mergeGeometries(copies);
      copies.forEach((copy) => copy.dispose());
      if (!geometry) continue;
      objects.forEach((object) => {
        parent.remove(object);
        object.geometry.dispose();
      });
      parent.add(new T.Mesh(geometry, mat));
    }
  }
  parts.forEach(batch);
  parts.forEach((part) => {
    const local = new Map<T.Material, T.MeshStandardMaterial>();
    part.traverse((object) => {
      if (object instanceof T.Mesh && !Array.isArray(object.material)) {
        let mat = local.get(object.material);
        if (!mat) {
          mat = (object.material as T.MeshStandardMaterial).clone();
          materials.add(mat);
          local.set(object.material, mat);
        }
        object.material = mat;
      }
    });
  });
  // Only an upper arc of the engine ring gear is visible; it is context, not part 12.
  const context = new T.Group();
  context.name = "starter-flywheel-context";
  group.add(context);
  const flywheel = gear(context, 90, 1.72, 1.78, 1.56, 0.13, iron);
  flywheel.position.set(-2.05, -1.95, 0);
  const crownMat = (flywheel.material as T.MeshStandardMaterial).clone();
  materials.add(crownMat);
  crownMat.clippingPlanes = [new T.Plane(new T.Vector3(0, 1, 0), 0.82)];
  flywheel.material = crownMat;
  const flow = new T.Group();
  flow.name = "starter-power-flow";
  group.add(flow);
  const flowMat = material(0xff9f42, 0.05, 0.35);
  flowMat.emissive.setHex(0xff7e25);
  flowMat.emissiveIntensity = 1;
  const particles = Array.from({ length: 8 }, (_, i) => {
    const particle = mesh(flow, new T.SphereGeometry(0.025, 8, 6), flowMat);
    particle.userData.offset = i / 8;
    return particle;
  });
  const base = [
    [-1.15, 0, 0],
    [-1.7, 0, 0],
    [-1.18, 0, 0],
    [-0.85, 0.55, 0],
    [-0.15, 1.02, 0],
    [0.05, 0, 0],
    [0, 0, 0],
    [0.05, 0, 0],
    [0.94, 0, 0],
    [0.64, 0, 0],
    [1.14, 0, 0],
  ];
  const exploded = [
    [-4.35, 0, 0],
    [-3.35, 0, 0],
    [-2.5, 0, 0],
    [-2.0, 0.8, 0],
    [-0.65, 1.65, 0],
    [2.75, 0, 0],
    [-0.45, 0, 0],
    [1.3, 0, 0],
    [4.05, 0, 0],
    [4.65, 0, 0],
    [5.2, 0, 0],
  ];
  let last = 0,
    rotorAngle = 0,
    pinionAngle = 0,
    wheelAngle = 0;
  function update(time: number, state: StarterState) {
    const dt = state.speed > 0 ? T.MathUtils.clamp(time - last, 0, 0.1) : 0;
    last = time;
    const sequence = starterSequence(time),
      e = T.MathUtils.clamp(state.explosion, 0, 1);
    const rotorSpeed = sequence.motor
      ? 7
      : sequence.stage === 3
        ? 1.5 * (1 - sequence.progress)
        : 0;
    rotorAngle += dt * rotorSpeed;
    pinionAngle +=
      dt *
      (sequence.motor
        ? 7
        : sequence.overrun
          ? 18
          : sequence.stage === 4 && sequence.engaged
            ? 18
            : 0);
    wheelAngle -= dt * (sequence.engine ? 2 : sequence.motor ? 7 / 9 : 0);
    parts.forEach((part, i) => {
      part.position
        .set(...(base[i] as [number, number, number]))
        .lerp(new T.Vector3(...(exploded[i] as [number, number, number])), e);
      part.visible = !state.isolate || state.selected === i + 1;
      part.traverse((object) => {
        if (object instanceof T.Mesh && !Array.isArray(object.material)) {
          const mat = object.material as T.MeshStandardMaterial;
          mat.emissive.setHex(state.selected === i + 1 ? 0x18364b : 0);
          mat.emissiveIntensity = 0.35;
        }
      });
    });
    for (const id of [2, 3]) parts[id - 1].position.x -= sequence.travel * 0.35;
    parts[1].rotation.x = pinionAngle;
    parts[2].rotation.x = rotorAngle;
    parts[6].rotation.x = rotorAngle;
    outerRace.rotation.x = pinionAngle - rotorAngle;
    parts[3].rotation.z = -sequence.travel * 0.24;
    plunger.position.x = sequence.travel * 0.16;
    bridge.position.x = sequence.contact ? 0.5 : 0.43;
    cutPanels.forEach((panel) => {
      panel.visible = !state.cutaway && e < 0.05;
    });
    context.visible = state.context && !state.isolate && e < 0.18;
    flywheel.rotation.x = wheelAngle;
    particles.forEach((particle) => {
      particle.visible = sequence.contact && e < 0.18 && !state.isolate;
      const t = (time * 0.6 + particle.userData.offset) % 1;
      particle.position.set(0.5 - t * 0.9, 0.82 - t * 0.52, 0.46);
    });
    group.userData.sequence = {
      ...sequence,
      rotorAngle,
      pinionAngle,
      wheelAngle,
    };
    group.updateMatrixWorld(true);
  }
  function dispose() {
    const geometries = new Set<T.BufferGeometry>();
    group.traverse((object) => {
      if (object instanceof T.Mesh) geometries.add(object.geometry);
    });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((mat) => mat.dispose());
  }
  update(0, initialStarterState);
  return { group, parts, update, dispose };
}
