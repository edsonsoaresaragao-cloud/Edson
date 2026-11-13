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
  helicalGearGeometry,
  transmissionForkGeometry,
  transmissionSleeveGeometry,
} from "./transmission-geometry";
import {
  initialTransmissionState,
  transmissionParts,
  transmissionGearPairs,
  transmissionModule as module,
  transmissionAxisDistance as distance,
  transmissionKinematics,
  transmissionSliderTargets,
  type TransmissionState,
} from "./manual-transmission-parts";

export function buildManualTransmissionModel() {
  const group = new T.Group();
  group.name = "manual-transmission";
  const parts = transmissionParts.map((part) => {
    const node = new T.Group();
    node.name = `transmission-part-${part.id}`;
    node.userData.part = part.id;
    node.userData.partName = part.name;
    group.add(node);
    return node;
  });
  const geometries = new Set<T.BufferGeometry>();
  const materials = new Map<
    string,
    { material: T.MeshStandardMaterial; id: number }
  >();
  const palette = {
    steel: 0x7b8790,
    iron: 0x3d4955,
    alloy: 0x79848c,
    brass: 0xc69a4b,
    rubber: 0x222a31,
    friction: 0x544238,
  };
  function material(id: number, kind: keyof typeof palette = "steel") {
    const key = `${id}-${kind}`;
    if (!materials.has(key))
      materials.set(key, {
        id,
        material: new T.MeshPhysicalMaterial({
          color: palette[kind],
          metalness:
            kind === "rubber" || kind === "friction"
              ? 0.05
              : kind === "alloy"
                ? 0.65
                : 0.88,
          roughness:
            kind === "rubber" || kind === "friction"
              ? 0.8
              : kind === "alloy"
                ? 0.53
                : 0.27,
          side: kind === "alloy" ? T.DoubleSide : T.FrontSide,
        }),
      });
    return materials.get(key)!.material;
  }
  function mesh(
    id: number,
    geometry: T.BufferGeometry,
    kind: keyof typeof palette = "steel",
    parent: T.Object3D = parts[id - 1],
  ) {
    geometries.add(geometry);
    const object = automotiveMesh(geometry, material(id, kind));
    parent.add(object);
    return object;
  }
  function cylinder(
    id: number,
    radius: number,
    length: number,
    x: number,
    parent: T.Object3D = parts[id - 1],
    kind: keyof typeof palette = "steel",
    segments = 48,
  ) {
    const object = mesh(
      id,
      precisionCylinder(radius, radius, length, segments),
      kind,
      parent,
    );
    object.rotation.z = Math.PI / 2;
    object.position.x = x;
    return object;
  }
  function ring(
    id: number,
    radius: number,
    tube: number,
    x: number,
    parent: T.Object3D = parts[id - 1],
    kind: keyof typeof palette = "steel",
  ) {
    const object = mesh(id, precisionTorus(radius, tube, 8, 48), kind, parent);
    object.rotation.y = Math.PI / 2;
    object.position.x = x;
    return object;
  }
  function annulus(
    id: number,
    inner: number,
    outer: number,
    width: number,
    x: number,
    parent: T.Object3D = parts[id - 1],
    kind: keyof typeof palette = "steel",
  ) {
    const profile = [
      [inner, -width / 2],
      [outer - 0.012, -width / 2],
      [outer, -width / 2 + 0.012],
      [outer, width / 2 - 0.012],
      [outer - 0.012, width / 2],
      [inner, width / 2],
      [inner, -width / 2],
    ];
    const geometry = new T.LatheGeometry(
      profile.map(([r, y]) => new T.Vector2(r, y)),
      56,
    );
    geometry.rotateZ(-Math.PI / 2);
    const object = mesh(id, geometry, kind, parent);
    object.position.x = x;
    return object;
  }
  function rounded(
    id: number,
    size: [number, number, number],
    position: [number, number, number],
    parent: T.Object3D,
    kind: keyof typeof palette = "steel",
  ) {
    const geometry = new RoundedBoxGeometry(
      ...size,
      2,
      Math.min(0.035, ...size.map((v) => v / 4)),
    );
    const object = mesh(id, geometry, kind, parent);
    object.position.set(...position);
    return object;
  }
  function node(id: number, name: string, position: [number, number, number]) {
    const object = new T.Group();
    object.name = name;
    object.position.set(...position);
    parts[id - 1].add(object);
    return object;
  }
  function curve(
    id: number,
    points: T.Vector3[],
    radius: number,
    parent: T.Object3D,
    kind: keyof typeof palette = "steel",
  ) {
    return mesh(
      id,
      precisionTube(
        new T.CatmullRomCurve3(points),
        Math.max(12, points.length * 3),
        radius,
        6,
        false,
      ),
      kind,
      parent,
    );
  }
  const frontHousing = node(1, "transmission-bellhousing", [0, -0.4, 0]);
  const bodyHousing = node(1, "transmission-case-body", [0, -0.5, 0]);
  const cutMembers: T.Object3D[] = [];
  function casting(parent: T.Object3D, profile: number[][], ribs: number[]) {
    for (let sector = 0; sector < 12; sector++) {
      const start = (sector * Math.PI) / 6;
      const centre = start + Math.PI / 12;
      const section = new T.Group();
      parent.add(section);
      const points = [
        ...profile.map(([x, r]) => new T.Vector2(r, x)),
        ...[...profile].reverse().map(([x, r]) => new T.Vector2(r - 0.075, x)),
        new T.Vector2(profile[0][1], profile[0][0]),
      ];
      const geometry = new T.LatheGeometry(
        points,
        6,
        start,
        Math.PI / 6 - 0.007,
      );
      geometry.rotateZ(-Math.PI / 2);
      mesh(1, geometry, "alloy", section);
      for (const x of ribs) {
        const r = profile.reduce((best, point) =>
          Math.abs(point[0] - x) < Math.abs(best[0] - x) ? point : best,
        )[1];
        const rib = new T.LatheGeometry(
          [
            new T.Vector2(r, x - 0.04),
            new T.Vector2(r + 0.065, x - 0.025),
            new T.Vector2(r + 0.065, x + 0.025),
            new T.Vector2(r, x + 0.04),
          ],
          6,
          start,
          Math.PI / 6 - 0.007,
        );
        rib.rotateZ(-Math.PI / 2);
        mesh(1, rib, "alloy", section);
      }
      const radius = profile[0][1] + 0.02;
      const bolt = cylinder(1, 0.055, 0.09, profile[0][0], section, "iron", 6);
      bolt.position.y = -Math.sin(centre) * radius;
      bolt.position.z = Math.cos(centre) * radius;
      const lengthRib = profile.map(
        ([x, r]) =>
          new T.Vector3(
            x,
            -Math.sin(centre) * (r + 0.025),
            Math.cos(centre) * (r + 0.025),
          ),
      );
      curve(1, lengthRib, 0.034, section, "alloy");
      if (Math.cos(centre) > -0.05) cutMembers.push(section);
    }
  }
  casting(
    frontHousing,
    [
      [-3.48, 1.75],
      [-3.3, 1.72],
      [-2.85, 1.58],
      [-2.2, 1.42],
      [-1.95, 1.57],
    ],
    [-3.42, -2.2],
  );
  casting(
    bodyHousing,
    [
      [-1.95, 1.57],
      [-1.8, 1.58],
      [2.75, 1.58],
      [3.05, 1.18],
    ],
    [-1.92, -0.8, 0.3, 1.5, 2.72],
  );
  // Cast mounting ears, selector boss and a recessed filler plug distinguish the casing.
  for (const x of [-0.2, 2.1])
    for (const z of [-0.72, 0.72]) {
      const ear = new T.Group();
      bodyHousing.add(ear);
      annulus(1, 0.075, 0.16, 0.18, x, ear, "alloy").position.set(x, -1.48, z);
      if (z > 0) cutMembers.push(ear);
    }
  rounded(1, [0.72, 0.18, 0.65], [1.3, 1.58, -0.3], bodyHousing, "alloy");
  const plugs = new T.Group();
  bodyHousing.add(plugs);
  const plugBoss = mesh(
    1,
    precisionCylinder(0.18, 0.18, 0.1, 32),
    "alloy",
    plugs,
  );
  plugBoss.rotation.x = Math.PI / 2;
  plugBoss.position.set(0.25, 0.1, 1.58);
  const plugHead = mesh(
    1,
    precisionCylinder(0.105, 0.105, 0.06, 6),
    "iron",
    plugs,
  );
  plugHead.rotation.x = Math.PI / 2;
  plugHead.position.set(0.25, 0.1, 1.66);
  cutMembers.push(plugs);

  const input = node(2, "transmission-input-shaft", [0, 0, 0]);
  cylinder(2, 0.13, 2.5, -2.6, input);
  for (const x of [-3.45, -2.05, -1.58]) cylinder(2, 0.18, 0.12, x, input);
  mesh(
    2,
    helicalGearGeometry(16, 0.023, 0.6, 0.09, 0),
    "steel",
    input,
  ).position.x = -3.3;
  const driveIn = mesh(
    2,
    helicalGearGeometry(24, module, 0.24, 0.12),
    "steel",
    input,
  );
  driveIn.position.x = -1.85;
  driveIn.rotation.x = Math.PI - (Math.PI * 2) / 24;
  const inputDog = mesh(
    2,
    helicalGearGeometry(20, 0.028, 0.12, 0.11, 0),
    "iron",
    input,
  );
  inputDog.position.x = -1.32;
  const output = node(3, "transmission-output-shaft", [0, 0, 0]);
  cylinder(3, 0.125, 5.3, 1.2, output);
  for (const x of [-1.2, 0.65, 2.3, 3.3]) cylinder(3, 0.17, 0.18, x, output);
  mesh(
    3,
    helicalGearGeometry(20, 0.018, 0.5, 0.075, 0),
    "steel",
    output,
  ).position.x = 3.6;
  const counter = node(4, "transmission-countershaft", [0, -distance, 0]);
  cylinder(4, 0.14, 4.9, 0.4, counter);
  const driveCounter = mesh(
    4,
    helicalGearGeometry(36, module, 0.24, 0.12, -0.32),
    "iron",
    counter,
  );
  driveCounter.position.x = -1.85;
  driveCounter.rotation.x = (-0.5 * Math.PI * 2) / 36;
  const gearNodes: Array<{
    gear: string;
    upper: T.Group;
    lower: T.Group;
    ratio: number;
  }> = [];
  for (const pair of transmissionGearPairs) {
    const upper = node(5, `transmission-free-gear-${pair.gear}`, [
      pair.x,
      0,
      0,
    ]);
    const lower = node(5, `transmission-counter-gear-${pair.gear}`, [
      pair.x,
      -distance,
      0,
    ]);
    const up = mesh(
      5,
      helicalGearGeometry(pair.outputTeeth, module, 0.23, 0.155),
      "steel",
      upper,
    );
    up.rotation.x = Math.PI - (Math.PI * 2) / pair.outputTeeth;
    const low = mesh(
      5,
      helicalGearGeometry(pair.counterTeeth, module, 0.23, 0.145, -0.32),
      "iron",
      lower,
    );
    low.rotation.x = (-0.5 * Math.PI * 2) / pair.counterTeeth;
    annulus(5, 0.155, 0.23, 0.28, 0, upper);
    const dog = mesh(
      5,
      helicalGearGeometry(24, 0.022, 0.07, 0.15, 0),
      "steel",
      upper,
    );
    dog.position.x = pair.gear === "1" || pair.gear === "3" ? -0.16 : 0.16;
    gearNodes.push({
      gear: pair.gear,
      upper,
      lower,
      ratio: ((36 / 24) * pair.outputTeeth) / pair.counterTeeth,
    });
  }

  // Reverse uses an axially sliding idler; its gears do not mesh directly.
  const reverseCounter = node(5, "transmission-reverse-counter", [
    2.65,
    -distance,
    0,
  ]);
  mesh(
    5,
    helicalGearGeometry(18, module, 0.18, 0.14, 0),
    "iron",
    reverseCounter,
  );
  const reverseOutput = node(5, "transmission-reverse-output", [2.65, 0, 0]);
  mesh(
    5,
    helicalGearGeometry(36, module, 0.18, 0.13, 0),
    "steel",
    reverseOutput,
  );
  const rc = ((18 + 16) * module) / 2,
    ro = ((36 + 16) * module) / 2;
  const idlerY = (rc * rc - ro * ro - distance * distance) / (2 * distance);
  const idlerZ = Math.sqrt(ro * ro - idlerY * idlerY);
  const reverseIdler = node(5, "transmission-reverse-idler", [
    3.05,
    idlerY,
    idlerZ,
  ]);
  mesh(
    5,
    helicalGearGeometry(16, module, 0.18, 0.09, 0),
    "steel",
    reverseIdler,
  );
  cylinder(5, 0.085, 0.34, 0, reverseIdler, "iron");

  const syncXs = [-1.02, 0.65, 2.28];
  const hubs: T.Group[] = [],
    sleeves: T.Group[] = [],
    forks: T.Group[] = [],
    selectorRails: T.Group[] = [];
  for (let i = 0; i < 3; i++) {
    const x = syncXs[i];
    const hub = node(6, `transmission-sync-${i}`, [x, 0, 0]);
    hubs.push(hub);
    mesh(6, helicalGearGeometry(24, 0.025, 0.18, 0.13, 0), "iron", hub);
    for (const side of i === 2 ? [-1] : [-1, 1]) {
      annulus(6, 0.2, 0.33, 0.06, side * 0.22, hub, "brass");
      const cone = mesh(
        6,
        precisionCylinder(0.3, 0.25, 0.1, 48, 1, true),
        "brass",
        hub,
      );
      cone.rotation.z = (side * Math.PI) / 2;
      cone.position.x = side * 0.26;
      for (let groove = 0; groove < 3; groove++)
        ring(
          6,
          0.305 - groove * 0.015,
          0.004,
          side * (0.22 + groove * 0.022),
          hub,
          "iron",
        );
    }
    const sleeve = node(7, `transmission-sleeve-${i}`, [x, 0, 0]);
    sleeves.push(sleeve);
    mesh(7, transmissionSleeveGeometry(), "steel", sleeve);
    for (const side of [-1, 1]) ring(7, 0.39, 0.018, side * 0.105, sleeve);
    ring(7, 0.395, 0.008, 0, sleeve, "iron");
    const fork = node(8, `transmission-fork-${i}`, [x, 0, 0]);
    forks.push(fork);
    mesh(8, transmissionForkGeometry(), "brass", fork);
    const railZ = (i - 1) * 0.3;
    curve(
      8,
      [
        new T.Vector3(0, 0.38, 0),
        new T.Vector3(0, 0.65, railZ * 0.6),
        new T.Vector3(0, 0.92, railZ),
      ],
      0.06,
      fork,
      "brass",
    );
    annulus(8, 0.067, 0.12, 0.18, 0, fork, "brass").position.set(
      0,
      0.92,
      railZ,
    );
    const rail = node(9, `transmission-selector-rail-${i}`, [
      0.35,
      0.92,
      railZ,
    ]);
    selectorRails.push(rail);
    cylinder(9, 0.06, 4.6, 0, rail);
    for (const dx of [-0.8, -0.65, -0.5]) {
      ring(9, 0.061, 0.005, dx, rail, "iron");
    }
  }
  const drum = node(10, "transmission-alternative-drum", [-2.25, 1.65, -0.2]);
  cylinder(10, 0.27, 0.78, 0, drum, "iron");
  for (const side of [-1, 1]) cylinder(10, 0.105, 0.22, side * 0.43, drum);
  for (let groove = 0; groove < 3; groove++) {
    const points = Array.from({ length: 49 }, (_, i) => {
      const angle = (i * Math.PI * 2) / 48;
      return new T.Vector3(
        (groove - 1) * 0.21 + Math.sin(angle * 2 + groove) * 0.05,
        Math.cos(angle) * 0.271,
        Math.sin(angle) * 0.271,
      );
    });
    curve(10, points, 0.012, drum, "rubber");
  }
  const rearCover = node(11, "transmission-rear-cover", [0, 0, 0]);
  const coverShape = new T.Shape();
  coverShape.absarc(0, -0.38, 1.23, 0, Math.PI * 2, false);
  for (const [y, radius] of [
    [0, 0.22],
    [-distance, 0.17],
  ]) {
    const hole = new T.Path();
    hole.absarc(0, y, radius, 0, Math.PI * 2, true);
    coverShape.holes.push(hole);
  }
  const coverGeometry = new T.ExtrudeGeometry(coverShape, {
    depth: 0.16,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: 0.025,
    bevelThickness: 0.025,
    curveSegments: 56,
  });
  coverGeometry.rotateY(Math.PI / 2);
  coverGeometry.translate(3.08, 0, 0);
  mesh(11, coverGeometry, "alloy", rearCover);
  annulus(11, 0.14, 0.31, 0.23, 3.36, rearCover, "alloy");
  for (let i = 0; i < 12; i++) {
    const phi = (i * Math.PI) / 6;
    const bolt = cylinder(11, 0.045, 0.08, 3.17, rearCover, "iron", 6);
    bolt.position.y = -0.38 - Math.sin(phi) * 1.1;
    bolt.position.z = Math.cos(phi) * 1.1;
  }
  for (const [x, y] of [
    [-2.18, 0],
    [3.43, 0],
  ]) {
    const seal = node(12, `transmission-seal-${x}`, [x, y, 0]);
    annulus(12, 0.13, 0.25, 0.08, 0, seal, "rubber");
    ring(12, 0.15, 0.012, -0.03, seal, "iron");
    ring(12, 0.23, 0.01, 0.04, seal, "friction");
  }
  const bearings: T.Group[] = [];
  for (const [x, y] of [
    [-1.57, 0],
    [2.97, 0],
    [-2.02, -distance],
    [2.89, -distance],
  ]) {
    const bearing = node(13, `transmission-bearing-${x}-${y}`, [x, y, 0]);
    bearings.push(bearing);
    annulus(13, 0.14, 0.19, 0.14, 0, bearing);
    annulus(13, 0.27, 0.315, 0.14, 0, bearing);
    for (let i = 0; i < 12; i++) {
      const phi = (i * Math.PI) / 6;
      const ball = mesh(
        13,
        new T.SphereGeometry(0.042, 8, 6),
        "steel",
        bearing,
      );
      ball.position.set(0, Math.cos(phi) * 0.233, Math.sin(phi) * 0.233);
    }
  }
  const flywheel = node(14, "transmission-flywheel", [-3.11, 0, 0]);
  annulus(14, 0.16, 1.05, 0.14, 0, flywheel, "iron");
  mesh(14, helicalGearGeometry(90, 0.023, 0.1, 1.0, 0), "steel", flywheel);
  const clutchDisc = node(14, "transmission-clutch-disc", [-3.0025, 0, 0]);
  annulus(14, 0.18, 0.86, 0.065, 0, clutchDisc, "friction");
  annulus(14, 0.13, 0.37, 0.09, 0, clutchDisc, "iron");
  for (let i = 0; i < 6; i++) {
    const phi = (i * Math.PI) / 3;
    const spring = ring(14, 0.075, 0.018, 0, clutchDisc, "brass");
    spring.position.set(0.04, Math.cos(phi) * 0.44, Math.sin(phi) * 0.44);
  }
  const pressurePlate = node(14, "transmission-pressure-plate", [-2.79, 0, 0]);
  annulus(14, 0.43, 0.98, 0.13, 0, pressurePlate, "steel");
  annulus(14, 0.18, 0.87, 0.04, -0.15, pressurePlate, "iron");
  const releaseBearing = node(
    14,
    "transmission-release-bearing",
    [-2.59, 0, 0],
  );
  annulus(14, 0.14, 0.28, 0.11, 0, releaseBearing, "steel");
  ring(14, 0.21, 0.025, 0.05, releaseBearing, "iron");
  for (let i = 0; i < 18; i++) {
    const phi = (i * Math.PI) / 9;
    const finger = rounded(
      14,
      [0.045, 0.35, 0.057],
      [0.04, Math.cos(phi) * 0.4, Math.sin(phi) * 0.4],
      pressurePlate,
      "iron",
    );
    finger.rotation.x = phi;
  }
  const lever = node(15, "transmission-gear-lever", [1.3, 1.05, -0.3]);
  const boot = mesh(
    15,
    new T.LatheGeometry(
      [
        new T.Vector2(0.3, 0),
        new T.Vector2(0.26, 0.1),
        new T.Vector2(0.21, 0.16),
        new T.Vector2(0.17, 0.24),
        new T.Vector2(0.08, 0.3),
      ],
      48,
    ),
    "rubber",
    lever,
  );
  boot.position.y = 0.05;
  const stalk = mesh(
    15,
    precisionCylinder(0.035, 0.045, 0.65, 24),
    "steel",
    lever,
  );
  stalk.position.y = 0.56;
  const knob = mesh(15, new T.SphereGeometry(0.14, 24, 16), "rubber", lever);
  knob.scale.y = 1.25;
  knob.position.y = 0.94;
  for (let i = 0; i < 3; i++) {
    const pedal = node(16, `transmission-pedal-${i}`, [(i - 1) * 0.55, 0, 0]);
    curve(
      16,
      [
        new T.Vector3(0, 0.8, -0.2),
        new T.Vector3(0, 0.3, 0),
        new T.Vector3(0, -0.3, 0.2),
      ],
      0.055,
      pedal,
      "iron",
    );
    rounded(16, [0.34, 0.48, 0.12], [0, -0.38, 0.25], pedal, "rubber");
    for (let j = 0; j < 5; j++)
      rounded(
        16,
        [0.28, 0.018, 0.02],
        [0, -0.55 + j * 0.08, 0.32],
        pedal,
        "iron",
      );
  }

  const anchors = [
    [-2.8, 0.9, 0.6],
    [-2.7, 0, 0],
    [3.5, 0, 0],
    [0, -distance, 0],
    [1.05, 0.45, 0.5],
    [0.65, 0.28, 0.1],
    [0.65, 0.04, 0.4],
    [0.65, 0.55, 0.15],
    [0.3, 0.92, 0.3],
    [-2.25, 1.65, -0.2],
    [3.25, 0.15, 0.5],
    [-2.18, 0.22, 0],
    [2.97, 0.24, 0],
    [-3, 0.7, 0],
    [1.3, 1.99, -0.3],
    [0, 0, 0],
  ].map((position, i) => {
    const anchor = new T.Object3D();
    anchor.position.set(...(position as [number, number, number]));
    anchor.name = `transmission-anchor-${i + 1}`;
    parts[i].add(anchor);
    return anchor;
  });

  // Merge only static children of each moving group; preserve the individual pivots.
  function batch(parent: T.Object3D) {
    const batches = new Map<T.Material, T.Mesh[]>();
    for (const child of [...parent.children]) {
      if (child instanceof T.Mesh && !Array.isArray(child.material)) {
        const list = batches.get(child.material) || [];
        list.push(child);
        batches.set(child.material, list);
      } else batch(child);
    }
    for (const [mat, members] of batches) {
      if (
        members.length < 2 ||
        members.some((member) => cutMembers.includes(member))
      )
        continue;
      const buffers = members.map((member) => {
        member.updateMatrix();
        const geometry = member.geometry.index
          ? member.geometry.toNonIndexed()
          : member.geometry.clone();
        if (!geometry.getAttribute("uv"))
          geometry.setAttribute(
            "uv",
            new T.Float32BufferAttribute(
              new Float32Array(geometry.getAttribute("position").count * 2),
              2,
            ),
          );
        geometry.applyMatrix4(member.matrix);
        return geometry;
      });
      const merged = mergeGeometries(buffers, false);
      buffers.forEach((buffer) => buffer.dispose());
      if (!merged) continue;
      geometries.add(merged);
      const object = automotiveMesh(merged, mat);
      parent.add(object);
      for (const member of members) {
        parent.remove(member);
        geometries.delete(member.geometry);
        member.geometry.dispose();
      }
    }
  }
  parts.forEach(batch);
  let inputAngle = 0,
    outputAngle = 0,
    engineAngle = 0,
    explosion = 0;
  let initialized = false;
  const shifts = [0, 0, 0];
  let reverseX = 3.05;
  let transitioning = false;
  let disposed = false;
  const offsets = [
    [0, 0, 0],
    [-0.75, 0, 0],
    [0.45, 0, 0],
    [0, -1.1, 0],
    [0, 0, 0],
    [0, 0.55, -0.65],
    [0, 0.5, 0.8],
    [0, 1.0, 0],
    [0, 1.25, 0],
    [-0.3, 0.75, 0],
    [1.5, 0.25, -0.5],
    [0, -0.9, 0.2],
    [0, 0.65, -0.5],
    [-1.2, 0, 0],
    [0, 0.65, 0],
    [0, 0, 0],
  ];
  function update(delta: number, state: TransmissionState, running = true) {
    const dt = Number.isFinite(delta) ? Math.max(0, Math.min(1, delta)) : 0;
    const motion = transmissionKinematics(state);
    const targetE = Number.isFinite(state.explosion)
      ? Math.max(0, Math.min(1, state.explosion))
      : 0;
    const targets = transmissionSliderTargets(state.gear);
    const easing = initialized ? 1 - Math.exp(-dt * 12) : 1;
    explosion += (targetE - explosion) * easing;
    shifts.forEach((value, i) => {
      shifts[i] = value + (targets[i] - value) * easing;
    });
    const targetReverse = state.gear === "R" ? 2.65 : 3.05;
    reverseX += (targetReverse - reverseX) * easing;
    transitioning =
      Math.abs(targetE - explosion) > 0.001 ||
      Math.abs(reverseX - targetReverse) > 0.001 ||
      shifts.some((value, i) => Math.abs(value - targets[i]) > 0.001);
    initialized = true;
    if (running) {
      inputAngle += motion.input * dt;
      outputAngle += motion.output * dt;
      engineAngle += motion.engine * dt;
    }
    const counterAngle = (-inputAngle * 24) / 36;
    parts.forEach((part, i) => {
      part.position.set(
        offsets[i][0] * explosion,
        offsets[i][1] * explosion,
        offsets[i][2] * explosion,
      );
      part.visible = state.isolate ? state.selected === i + 1 : i !== 15;
    });
    frontHousing.position.set(-1.6 * explosion, -0.4, 0);
    bodyHousing.position.set(0, -0.5 + explosion * 0.8, -2.0 * explosion);
    cutMembers.forEach((member) => {
      member.visible = !state.cutaway;
    });
    input.rotation.x = inputAngle;
    output.rotation.x = outputAngle;
    counter.rotation.x = counterAngle;
    gearNodes.forEach((entry) => {
      entry.upper.position.y = 0.55 * explosion;
      entry.lower.position.y = -distance - 1.1 * explosion;
      entry.upper.rotation.x = inputAngle / entry.ratio;
      entry.lower.rotation.x = counterAngle;
      entry.upper.userData.angularSpeed = motion.input / entry.ratio;
      entry.lower.userData.angularSpeed = motion.counter;
    });
    reverseCounter.position.y = -distance - 1.1 * explosion;
    reverseCounter.rotation.x = counterAngle;
    reverseOutput.position.y = 0.55 * explosion;
    reverseOutput.rotation.x = outputAngle;
    reverseIdler.position.set(
      reverseX,
      idlerY - 0.5 * explosion,
      idlerZ + 0.6 * explosion,
    );
    reverseIdler.rotation.x =
      state.gear === "R" ? (-counterAngle * 18) / 16 : reverseIdler.rotation.x;
    for (let i = 0; i < 3; i++) {
      hubs[i].rotation.x = outputAngle;
      sleeves[i].rotation.x = outputAngle;
      sleeves[i].position.x = syncXs[i] + shifts[i];
      forks[i].position.x = syncXs[i] + shifts[i];
      selectorRails[i].position.x = 0.35 + shifts[i];
    }
    anchors[4].position.y = 0.45 + explosion * 0.55;
    anchors[6].position.x = 0.65 + shifts[1];
    anchors[7].position.x = 0.65 + shifts[1];
    anchors[0].position.x = -2.8 - 1.6 * explosion;
    flywheel.rotation.x = engineAngle;
    pressurePlate.rotation.x = engineAngle;
    clutchDisc.rotation.x = inputAngle;
    clutchDisc.position.x = -3.0025 + (state.clutchEngaged ? 0 : 0.025);
    pressurePlate.position.x = -2.79 + (state.clutchEngaged ? 0 : 0.065);
    releaseBearing.position.x = state.clutchEngaged ? -2.59 : -2.71;
    lever.rotation.z =
      state.gear === "N"
        ? 0
        : state.gear === "R"
          ? -0.18
          : Number(state.gear) % 2
            ? 0.15
            : -0.15;
    const clutchPedal = parts[15].getObjectByName("transmission-pedal-0");
    if (clutchPedal) clutchPedal.rotation.x = state.clutchEngaged ? 0 : -0.32;
    for (const { id, material: mat } of materials.values()) {
      const selected = id === state.selected;
      const powered =
        (motion.coupled && [2, 3, 5, 7].includes(id)) ||
        (motion.input !== 0 && id === 4);
      mat.emissive.setHex(selected ? 0x80431b : powered ? 0x092d35 : 0x000000);
      mat.emissiveIntensity = selected ? 0.55 : 0.35;
    }
    group.userData.motion = {
      ...motion,
      inputAngle,
      outputAngle,
      engineAngle,
      running,
    };
    group.userData.explosion = explosion;
    group.userData.gear = state.gear;
    group.updateMatrixWorld(true);
  }
  update(0, initialTransmissionState, false);
  const surfaceFinish = applyAutomotiveFinish(group);
  return {
    group,
    parts,
    anchors,
    gearNodes,
    reverseIdler,
    idlerY,
    idlerZ,
    update,
    isTransitioning: () => transitioning,
    dispose() {
      if (disposed) return;
      disposed = true;
      surfaceFinish.dispose();
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach(({ material: mat }) => mat.dispose());
    },
  };
}
