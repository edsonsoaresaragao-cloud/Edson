import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { helicalGearGeometry } from "./transmission-geometry";
import {
  automaticParts,
  automaticKinematics,
  initialAutomaticState,
  planetaryTeeth,
  type AutomaticState,
} from "./automatic-transmission-parts";

/** Annular gear with teeth on its inner circumference, axis X. */
export function internalGearGeometry(cut = false) {
  const { ring: teeth, module: m } = planetaryTeeth;
  const pitch = (teeth * m) / 2,
    outer = pitch + 0.12;
  const start = cut ? Math.PI / 2 : 0,
    end = Math.PI * 2;
  const segments = Math.round((teeth * 6 * (end - start)) / (Math.PI * 2));
  const positions: number[] = [],
    indices: number[] = [],
    uv: number[] = [];
  for (let side = 0; side < 2; side++)
    for (let inside = 0; inside < 2; inside++)
      for (let i = 0; i <= segments; i++) {
        const angle = start + ((end - start) * i) / segments;
        const sample = Math.round((angle / (Math.PI * 2)) * teeth * 6) % 6;
        const radius = inside
          ? pitch + (sample === 2 || sample === 3 ? -0.95 : 0.95) * m
          : outer;
        positions.push(
          side ? 0.17 : -0.17,
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
        );
        uv.push(i / segments, inside);
      }
  const stride = segments + 1;
  const quad = (a: number, b: number, c: number, d: number) =>
    indices.push(a, b, c, b, d, c);
  for (let i = 0; i < segments; i++) {
    quad(i, i + 1, 2 * stride + i, 2 * stride + i + 1);
    quad(stride + i, 3 * stride + i, stride + i + 1, 3 * stride + i + 1);
    quad(i, stride + i, i + 1, stride + i + 1);
    quad(
      2 * stride + i,
      2 * stride + i + 1,
      3 * stride + i,
      3 * stride + i + 1,
    );
  }
  if (cut) {
    quad(0, 2 * stride, stride, 3 * stride);
    quad(
      segments,
      stride + segments,
      2 * stride + segments,
      3 * stride + segments,
    );
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.userData = { internalTeeth: teeth, pitchRadius: pitch, cut };
  return geometry;
}

export function buildAutomaticTransmissionModel() {
  const group = new T.Group();
  group.name = "automatic-transmission";
  const parts = automaticParts.map((part) => {
    const node = new T.Group();
    node.name = `automatic-part-${part.id}`;
    node.userData.part = part.id;
    group.add(node);
    return node;
  });
  const geometries = new Set<T.BufferGeometry>();
  const materials = new Map<
    string,
    { id: number; material: T.MeshStandardMaterial }
  >();
  const palette = {
    steel: 0x88959f,
    iron: 0x3e4b55,
    alloy: 0x859098,
    brass: 0xb68d45,
    friction: 0x795337,
    rubber: 0x202b32,
    fluid: 0x26a5d0,
    pressure: 0xe76c37,
    signal: 0x4bebac,
  };
  type Finish = keyof typeof palette;
  function material(id: number, kind: Finish) {
    const key = `${id}-${kind}`;
    if (!materials.has(key))
      materials.set(key, {
        id,
        material: new T.MeshStandardMaterial({
          color: palette[kind],
          metalness: [
            "rubber",
            "fluid",
            "pressure",
            "signal",
            "friction",
          ].includes(kind)
            ? 0.08
            : 0.82,
          roughness:
            kind === "alloy"
              ? 0.53
              : kind === "rubber" || kind === "friction"
                ? 0.8
                : 0.3,
          side: T.DoubleSide,
        }),
      });
    return materials.get(key)!.material;
  }
  function mesh(
    id: number,
    geometry: T.BufferGeometry,
    kind: Finish = "steel",
    parent: T.Object3D = parts[id - 1],
  ) {
    geometries.add(geometry);
    const object = new T.Mesh(geometry, material(id, kind));
    parent.add(object);
    return object;
  }
  function cylinder(
    id: number,
    radius: number,
    length: number,
    x = 0,
    parent: T.Object3D = parts[id - 1],
    kind: Finish = "steel",
    segments = 40,
  ) {
    const object = mesh(
      id,
      new T.CylinderGeometry(radius, radius, length, segments),
      kind,
      parent,
    );
    object.rotation.z = Math.PI / 2;
    object.position.x = x;
    return object;
  }
  function torus(
    id: number,
    radius: number,
    tube: number,
    x = 0,
    parent: T.Object3D = parts[id - 1],
    kind: Finish = "steel",
  ) {
    const object = mesh(
      id,
      new T.TorusGeometry(radius, tube, 8, 48),
      kind,
      parent,
    );
    object.rotation.y = Math.PI / 2;
    object.position.x = x;
    return object;
  }
  function lathe(
    id: number,
    profile: number[][],
    parent: T.Object3D,
    kind: Finish = "alloy",
    start = 0,
    length = Math.PI * 2,
  ) {
    const geometry = new T.LatheGeometry(
      profile.map(([r, x]) => new T.Vector2(r, x)),
      56,
      start,
      length,
    );
    geometry.rotateZ(-Math.PI / 2);
    return mesh(id, geometry, kind, parent);
  }
  function annulus(
    id: number,
    inner: number,
    outer: number,
    width: number,
    x: number,
    parent: T.Object3D = parts[id - 1],
    kind: Finish = "steel",
  ) {
    return lathe(
      id,
      [
        [inner, x - width / 2],
        [outer - 0.006, x - width / 2],
        [outer, x - width / 2 + 0.006],
        [outer, x + width / 2 - 0.006],
        [outer - 0.006, x + width / 2],
        [inner, x + width / 2],
        [inner, x - width / 2],
      ],
      parent,
      kind,
    );
  }
  function rounded(
    id: number,
    size: [number, number, number],
    position: [number, number, number],
    parent: T.Object3D = parts[id - 1],
    kind: Finish = "steel",
    radius = 0.025,
  ) {
    const object = mesh(
      id,
      new RoundedBoxGeometry(...size, 2, radius),
      kind,
      parent,
    );
    object.position.set(...position);
    return object;
  }
  function tube(
    id: number,
    points: T.Vector3[],
    radius: number,
    parent: T.Object3D = parts[id - 1],
    kind: Finish = "steel",
  ) {
    const curve = new T.CatmullRomCurve3(points);
    mesh(
      id,
      new T.TubeGeometry(curve, points.length * 8, radius, 6, false),
      kind,
      parent,
    );
    return curve;
  }
  function boltCircle(
    id: number,
    radius: number,
    x: number,
    count: number,
    parent: T.Object3D,
  ) {
    for (let i = 0; i < count; i++) {
      const angle = (i * Math.PI * 2) / count;
      const bolt = cylinder(id, 0.048, 0.055, x, parent, "steel", 6);
      bolt.position.y = Math.cos(angle) * radius;
      bolt.position.z = Math.sin(angle) * radius;
    }
  }
  const cutMembers: T.Object3D[] = [],
    fullRings: T.Object3D[] = [],
    cutRings: T.Object3D[] = [];

  // Converter: impeller, turbine, stator and lock-up have separate pivots.
  const converter = parts[0];
  converter.position.x = -3.55;
  const impeller = new T.Group(),
    turbine = new T.Group(),
    stator = new T.Group();
  impeller.name = "automatic-impeller";
  turbine.name = "automatic-turbine";
  stator.name = "automatic-stator";
  converter.add(impeller, turbine, stator);
  lathe(
    1,
    [
      [0.22, -0.3],
      [0.8, -0.38],
      [1.2, -0.22],
      [1.35, 0.02],
      [1.35, 0.12],
      [1.29, 0.12],
      [1.18, -0.14],
      [0.8, -0.29],
      [0.22, -0.22],
      [0.22, -0.3],
    ],
    impeller,
    "steel",
  );
  const cover = lathe(
    1,
    [
      [0.2, 0.37],
      [0.85, 0.4],
      [1.27, 0.28],
      [1.35, 0.12],
      [1.29, 0.12],
      [1.2, 0.22],
      [0.85, 0.33],
      [0.2, 0.3],
      [0.2, 0.37],
    ],
    impeller,
    "steel",
  );
  cutMembers.push(cover);
  torus(1, 1.32, 0.035, 0.12, impeller);
  cylinder(1, 0.2, 0.5, -0.5, impeller);
  boltCircle(1, 1.12, -0.28, 12, impeller);
  function vanes(
    parent: T.Object3D,
    count: number,
    inner: number,
    outer: number,
    x: number,
    bend: number,
    kind: Finish,
  ) {
    for (let blade = 0; blade < count; blade++) {
      const vertices: number[] = [],
        indices: number[] = [];
      for (let edge = 0; edge < 2; edge++)
        for (let step = 0; step <= 9; step++) {
          const f = step / 9,
            angle = (blade * Math.PI * 2) / count + bend * f * f;
          const radius = inner + (outer - inner) * f;
          vertices.push(
            x + Math.sin(f * Math.PI) * 0.14 + edge * 0.16,
            Math.cos(angle) * radius,
            Math.sin(angle) * radius,
          );
        }
      for (let j = 0; j < 9; j++)
        indices.push(j, j + 1, j + 10, j + 1, j + 11, j + 10);
      const geometry = new T.BufferGeometry();
      geometry.setAttribute(
        "position",
        new T.Float32BufferAttribute(vertices, 3),
      );
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      mesh(1, geometry, kind, parent);
    }
  }
  vanes(impeller, 28, 0.4, 1.25, -0.18, 0.35, "steel");
  vanes(turbine, 26, 0.4, 1.2, 0.02, -0.4, "iron");
  annulus(1, 0.23, 0.42, 0.12, 0.04, turbine);
  torus(1, 1.2, 0.035, 0.1, turbine, "steel");
  vanes(stator, 14, 0.23, 0.56, -0.02, 0.58, "brass");
  annulus(1, 0.15, 0.25, 0.18, 0.05, stator, "brass");
  const lockup = new T.Group();
  lockup.name = "automatic-lockup";
  converter.add(lockup);
  annulus(1, 0.55, 1.12, 0.035, 0.26, lockup, "friction");
  // Pump: annular casting with a driven gerotor and a central passage.
  parts[1].position.x = -2.55;
  annulus(2, 0.22, 0.96, 0.19, 0, parts[1], "alloy");
  annulus(2, 0.55, 0.87, 0.06, -0.13, parts[1], "iron");
  boltCircle(2, 0.8, -0.15, 8, parts[1]);
  const pump = new T.Group();
  pump.name = "automatic-oil-pump";
  parts[1].add(pump);
  mesh(2, helicalGearGeometry(12, 0.075, 0.15, 0.16, 0), "steel", pump);
  torus(2, 0.48, 0.024, -0.12, parts[1], "brass");

  const stages = [3, 5, 7].map((id, index) => {
    const parent = parts[id - 1];
    parent.position.x = -1.65 + index * 1.65;
    const sun = new T.Group(),
      ring = new T.Group(),
      carrier = new T.Group();
    sun.name = `automatic-sun-${index + 1}`;
    ring.name = `automatic-ring-${index + 1}`;
    carrier.name = `automatic-carrier-${index + 1}`;
    parent.add(sun, ring, carrier);
    mesh(id, helicalGearGeometry(24, 0.028, 0.32, 0.11, 0), "steel", sun);
    cylinder(id, 0.14, 0.65, 0, sun);
    const full = mesh(id, internalGearGeometry(false), "iron", ring),
      cut = mesh(id, internalGearGeometry(true), "iron", ring);
    fullRings.push(full);
    cutRings.push(cut);
    const planetNodes: T.Group[] = [];
    annulus(id, 0.16, 0.25, 0.08, -0.25, carrier);
    torus(id, 0.59, 0.038, -0.25, carrier, "alloy");
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const node = new T.Group();
      node.name = `automatic-planet-${index + 1}-${i + 1}`;
      node.position.set(0, Math.cos(angle) * 0.588, Math.sin(angle) * 0.588);
      carrier.add(node);
      planetNodes.push(node);
      const gear = mesh(
        id,
        helicalGearGeometry(18, 0.028, 0.29, 0.065, 0),
        "steel",
        node,
      );
      gear.rotation.x = (-angle * 24) / 18 + Math.PI / 18;
      const pin = cylinder(id, 0.055, 0.55, -0.02, carrier);
      pin.position.y = node.position.y;
      pin.position.z = node.position.z;
      tube(
        id,
        [
          new T.Vector3(-0.25, Math.cos(angle) * 0.2, Math.sin(angle) * 0.2),
          new T.Vector3(
            -0.25,
            Math.cos(angle + 0.1) * 0.4,
            Math.sin(angle + 0.1) * 0.4,
          ),
          new T.Vector3(-0.25, node.position.y, node.position.z),
        ],
        0.047,
        carrier,
        "alloy",
      );
    }
    return {
      sun,
      ring,
      carrier,
      planets: planetNodes,
      angles: { sun: 0, ring: 0, carrier: 0, planet: 0 },
    };
  });

  const packs = [4, 6, 8].map((id, index) => {
    const parent = parts[id - 1];
    parent.position.x = index === 0 ? -0.85 : index === 1 ? 0.8 : 2.6;
    const drum = new T.Group();
    drum.name = `automatic-drum-${id}`;
    parent.add(drum);
    annulus(id, 0.26, 0.77, 0.08, 0.28, drum, "iron");
    annulus(id, 0.71, 0.79, 0.04, -0.29, drum, "iron");
    for (let i = 0; i < 24; i++) {
      const angle = (i * Math.PI * 2) / 24;
      if (angle > 0 && angle < Math.PI / 2) continue;
      const rib = rounded(
        id,
        [0.52, 0.035, 0.045],
        [0, Math.cos(angle) * 0.78, Math.sin(angle) * 0.78],
        drum,
        "iron",
        0.01,
      );
      rib.rotation.x = angle;
    }
    const discs: T.Group[] = [];
    for (let i = 0; i < 8; i++) {
      const node = new T.Group();
      node.name = `automatic-disc-${id}-${i}`;
      node.position.x = (i - 3.5) * 0.058;
      parent.add(node);
      discs.push(node);
      annulus(
        id,
        0.28,
        i % 2 ? 0.74 : 0.7,
        0.025,
        0,
        node,
        i % 2 ? "friction" : "steel",
      );
      for (let t = 0; t < 8; t++) {
        const angle = (t * Math.PI) / 4;
        const tab = rounded(
          id,
          [0.025, 0.06, 0.07],
          [0, Math.cos(angle) * 0.73, Math.sin(angle) * 0.73],
          node,
          i % 2 ? "friction" : "steel",
          0.006,
        );
        tab.rotation.x = angle;
      }
      if (i % 2)
        for (let t = 0; t < 20; t++) {
          const angle = (t * Math.PI) / 10;
          tube(
            id,
            [
              new T.Vector3(
                -0.013,
                Math.cos(angle) * 0.34,
                Math.sin(angle) * 0.34,
              ),
              new T.Vector3(
                -0.013,
                Math.cos(angle + 0.04) * 0.67,
                Math.sin(angle + 0.04) * 0.67,
              ),
            ],
            0.006,
            node,
            "iron",
          );
        }
    }
    const piston = new T.Group();
    piston.name = `automatic-piston-${id}`;
    parent.add(piston);
    annulus(id, 0.27, 0.73, 0.045, -0.29, piston, "brass");
    torus(id, 0.66, 0.012, -0.32, piston, "rubber");
    return { drum, discs, piston, application: 0 };
  });
  // Stepped output shaft and parking pawl; the pawl belongs to the output context.
  const output = new T.Group();
  output.name = "automatic-output";
  parts[8].add(output);
  cylinder(9, 0.13, 5.9, 0.35, output);
  cylinder(9, 0.19, 0.7, 2.9, output);
  cylinder(9, 0.17, 0.75, 3.65, output);
  for (const x of [-2.45, 3.65])
    mesh(
      9,
      helicalGearGeometry(22, 0.018, 0.5, 0.1, 0),
      "steel",
      output,
    ).position.x = x;
  mesh(
    9,
    helicalGearGeometry(20, 0.028, 0.16, 0.17, 0),
    "iron",
    output,
  ).position.x = 3.13;
  torus(9, 0.18, 0.035, 3.35, output, "steel");
  const pawl = new T.Group();
  pawl.name = "automatic-parking-pawl";
  pawl.position.set(3.13, 0.48, 0);
  parts[8].add(pawl);
  rounded(9, [0.18, 0.32, 0.1], [0, -0.12, 0], pawl, "brass");
  cylinder(9, 0.08, 0.28, 0, pawl, "iron");

  // Hydraulic unit with real curved galleries, plugs, fasteners and moving flow markers.
  const hydraulic = parts[9];
  hydraulic.position.set(0.05, -1.5, 0.04);
  rounded(10, [2.95, 0.25, 1.35], [0, 0, 0], hydraulic, "alloy", 0.11);
  const flowNodes: {
    curve: T.CatmullRomCurve3;
    marker: T.Mesh;
    phase: number;
    driveOnly: boolean;
  }[] = [];
  for (let line = 0; line < 5; line++) {
    const z = -0.49 + line * 0.24;
    const points = [
      new T.Vector3(-1.25, 0.14, z),
      new T.Vector3(-0.95, 0.14, z),
      new T.Vector3(-0.8, 0.14, z + 0.07),
      new T.Vector3(-0.55, 0.14, z + 0.07),
      new T.Vector3(-0.4, 0.14, z - 0.06),
      new T.Vector3(0.05, 0.14, z - 0.06),
      new T.Vector3(0.3, 0.14, z + 0.06),
      new T.Vector3(0.7, 0.14, z + 0.06),
      new T.Vector3(0.88, 0.14, z),
      new T.Vector3(1.22, 0.14, z),
    ];
    const curve = tube(10, points, 0.025, hydraulic, "iron");
    for (let p = 0; p < 3; p++) {
      const marker = mesh(
        10,
        new T.SphereGeometry(0.035, 8, 6),
        line % 2 ? "pressure" : "fluid",
        hydraulic,
      );
      flowNodes.push({
        curve,
        marker,
        phase: p / 3 + line * 0.07,
        driveOnly: line % 2 === 1,
      });
    }
  }
  for (let i = 0; i < 8; i++) {
    const bolt = cylinder(10, 0.038, 0.07, 0, hydraulic, "steel", 6);
    bolt.rotation.z = 0;
    bolt.position.set(-1.3 + (i % 4) * 0.86, 0.15, i < 4 ? -0.59 : 0.59);
  }
  for (let i = 0; i < 7; i++) {
    const plug = cylinder(10, 0.065, 0.12, 0, hydraulic, "steel", 24);
    plug.rotation.y = Math.PI / 2;
    plug.position.set(-1.2 + i * 0.4, -0.02, 0.7);
  }
  const pressureCurves: T.Object3D[] = [];
  for (const x of [-0.85, 0.8, 2.4]) {
    const curve = tube(
      10,
      [
        new T.Vector3(Math.min(x, 1.15), 0.14, 0.56),
        new T.Vector3(Math.min(x + 0.12, 1.3), 0.3, 0.72),
        new T.Vector3(x + 0.1, 0.7, 0.63),
        new T.Vector3(x, 0.98, 0.48),
      ],
      0.019,
      hydraulic,
      "pressure",
    );
    const node = hydraulic.children.at(-1)!;
    pressureCurves.push(node);
    const marker = mesh(
      10,
      new T.SphereGeometry(0.037, 8, 6),
      "pressure",
      hydraulic,
    );
    flowNodes.push({ curve, marker, phase: x * 0.1, driveOnly: true });
  }
  const solenoids = parts[10];
  solenoids.position.set(0.1, -1.2, 0.95);
  const solenoidNodes = Array.from({ length: 6 }, (_, i) => {
    const node = new T.Group();
    node.name = `automatic-solenoid-${i}`;
    node.position.x = -1.05 + i * 0.42;
    solenoids.add(node);
    const body = cylinder(11, 0.14, 0.32, 0, node, "brass");
    body.rotation.z = 0;
    const foot = cylinder(11, 0.1, 0.16, 0, node);
    foot.rotation.z = 0;
    foot.position.y = -0.23;
    rounded(11, [0.21, 0.17, 0.2], [0, 0.23, 0], node, "rubber");
    const pin = cylinder(11, 0.035, 0.19, 0, node);
    pin.rotation.z = 0;
    pin.position.y = -0.36;
    const signal = mesh(11, new T.SphereGeometry(0.033, 8, 6), "signal", node);
    signal.position.set(0, 0.25, 0.12);
    signal.visible = false;
    return { node, pin, signal };
  });

  const housing = parts[11],
    shell = new T.Group();
  shell.name = "automatic-housing";
  housing.add(shell);
  const bodyProfile = [
    [1.43, -2.95],
    [1.42, -2.7],
    [1.18, -2.25],
    [1.14, 2.5],
    [0.62, 3.1],
    [0.47, 4],
    [0.4, 4],
    [0.55, 3.08],
    [1.06, 2.48],
    [1.1, -2.2],
    [1.34, -2.68],
    [1.35, -2.95],
    [1.43, -2.95],
  ];
  lathe(12, bodyProfile, shell, "alloy", 0, Math.PI * 1.5);
  cutMembers.push(
    lathe(12, bodyProfile, shell, "alloy", Math.PI * 1.5, Math.PI / 2),
  );
  annulus(12, 1.35, 1.49, 0.1, -2.94, shell, "alloy");
  boltCircle(12, 1.43, -3, 12, shell);
  for (const x of [-2.6, -2.1, -1.4, -0.65, 0.1, 0.85, 1.6, 2.3]) {
    const profile = [
      [1.13, x - 0.035],
      [1.22, x - 0.035],
      [1.22, x + 0.035],
      [1.13, x + 0.035],
      [1.13, x - 0.035],
    ];
    lathe(12, profile, shell, "alloy", 0, Math.PI * 1.5);
    cutMembers.push(
      lathe(12, profile, shell, "alloy", Math.PI * 1.5, Math.PI / 2),
    );
  }
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5,
      y = -Math.sin(a),
      z = Math.cos(a);
    const rib = tube(
      12,
      [
        new T.Vector3(-2.25, 1.2 * y, 1.2 * z),
        new T.Vector3(0.2, 1.21 * y, 1.21 * z),
        new T.Vector3(2.5, 1.18 * y, 1.18 * z),
        new T.Vector3(3.9, 0.5 * y, 0.5 * z),
      ],
      0.037,
      shell,
      "alloy",
    );
    void rib;
    if (i >= 8) cutMembers.push(shell.children.at(-1)!);
  }
  for (const x of [-1.95, 2.15])
    for (const z of [-0.87, 0.87]) {
      const ear = annulus(12, 0.08, 0.2, 0.2, 0, shell, "alloy");
      ear.position.set(x, -0.92, z);
      rounded(12, [0.28, 0.3, 0.16], [x, -0.76, z], shell, "alloy", 0.05);
    }
  const sump = new T.Group();
  sump.name = "automatic-sump";
  housing.add(sump);
  sump.position.set(0.05, -1.85, 0);
  const tray = rounded(
    12,
    [3.3, 0.16, 1.62],
    [0, -0.13, 0],
    sump,
    "alloy",
    0.12,
  );
  void tray;
  for (const z of [-0.79, 0.79])
    rounded(12, [3.22, 0.22, 0.08], [0, 0, z], sump, "alloy", 0.025);
  for (const x of [-1.6, 1.6])
    rounded(12, [0.08, 0.22, 1.5], [x, 0, 0], sump, "alloy", 0.025);
  for (let i = 0; i < 10; i++) {
    const bolt = cylinder(12, 0.038, 0.07, 0, sump, "steel", 6);
    bolt.rotation.z = 0;
    bolt.position.set(-1.4 + (i % 5) * 0.7, 0.13, i < 5 ? -0.78 : 0.78);
  }

  const anchors = parts.map((parent, i) => {
    const anchor = new T.Object3D();
    anchor.name = `automatic-anchor-${i + 1}`;
    parent.add(anchor);
    return anchor;
  });
  anchors[0].position.set(0, 0.8, 0.65);
  anchors[1].position.set(0, 0.75, 0.35);
  for (const i of [2, 4, 6]) anchors[i].position.set(0, 0.55, 0.5);
  for (const i of [3, 5, 7]) anchors[i].position.set(0, 0.6, 0.5);
  anchors[8].position.set(3.7, 0.16, 0);
  anchors[9].position.set(0.2, 0.14, 0.45);
  anchors[10].position.set(0.2, 0.2, 0);
  anchors[11].position.set(0.1, -1.87, 0.55);

  // Batch static children only; retain pivots, cut surfaces and animated markers.
  const unbatched = new Set<T.Object3D>([
    ...cutMembers,
    ...fullRings,
    ...cutRings,
    ...pressureCurves,
    ...flowNodes.map((n) => n.marker),
    ...solenoidNodes.flatMap((n) => [n.pin, n.signal]),
  ]);
  function batch(parent: T.Object3D) {
    const batches = new Map<T.Material, T.Mesh[]>();
    for (const child of [...parent.children]) {
      if (
        child instanceof T.Mesh &&
        !Array.isArray(child.material) &&
        !unbatched.has(child)
      ) {
        const members = batches.get(child.material) || [];
        members.push(child);
        batches.set(child.material, members);
      } else if (!(child instanceof T.Mesh)) batch(child);
    }
    for (const [mat, members] of batches) {
      if (members.length < 2) continue;
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
      parent.add(new T.Mesh(merged, mat));
      members.forEach((member) => {
        parent.remove(member);
        geometries.delete(member.geometry);
        member.geometry.dispose();
      });
    }
  }
  parts.forEach(batch);
  const bases = parts.map((part) => part.position.clone());
  const offsets = [
    [-2.4, 0, 0],
    [-1.7, 0, 0],
    [-1.15, 0.1, 0],
    [-0.65, 0.05, 0],
    [0.1, 0.1, 0],
    [0.85, 0.05, 0],
    [1.5, 0.1, 0],
    [2.2, 0.05, 0],
    [2.75, 0, 0],
    [0, -0.8, 0.5],
    [0, -0.35, 1.25],
    [0, -1.15, -1.5],
  ];
  let explosion = 0,
    initialized = false,
    transitioning = false,
    disposed = false,
    inputAngle = 0,
    outputAngle = 0,
    engineAngle = 0,
    turbineAngle = 0,
    flowAngle = 0;
  function update(delta: number, state: AutomaticState, running = true) {
    const dt = Number.isFinite(delta) ? Math.max(0, Math.min(1, delta)) : 0;
    const motion = automaticKinematics(state),
      targetE = Number.isFinite(state.explosion)
        ? T.MathUtils.clamp(state.explosion, 0, 1)
        : 0;
    const ease = initialized ? 1 - Math.exp(-dt * 12) : 1;
    explosion += (targetE - explosion) * ease;
    initialized = true;
    transitioning = Math.abs(targetE - explosion) > 0.001;
    if (running) {
      engineAngle += motion.engine * dt;
      turbineAngle += motion.turbine * dt;
      inputAngle += motion.input * dt;
      outputAngle += motion.output * dt;
      flowAngle += dt * motion.engine * 0.225;
    }
    parts.forEach((part, i) => {
      part.position
        .copy(bases[i])
        .addScaledVector(new T.Vector3().fromArray(offsets[i]), explosion);
      part.visible = !state.isolate || state.selected === i + 1;
    });
    impeller.rotation.x = engineAngle;
    turbine.rotation.x = turbineAngle;
    stator.rotation.x = motion.locked ? turbineAngle : 0;
    lockup.rotation.x = motion.locked ? engineAngle : turbineAngle;
    impeller.position.x = -0.4 * explosion;
    turbine.position.x = 0.35 * explosion;
    stator.position.x = 0.8 * explosion;
    lockup.position.x = (motion.locked ? -0.04 : 0) + 1.1 * explosion;
    pump.rotation.x = engineAngle;
    stages.forEach((stage, i) => {
      const rates = motion.stages[i];
      if (running) {
        stage.angles.sun += rates.sun * dt;
        stage.angles.ring += rates.ring * dt;
        stage.angles.carrier += rates.carrier * dt;
        stage.angles.planet += (rates.planet - rates.carrier) * dt;
      }
      stage.sun.rotation.x = stage.angles.sun;
      stage.ring.rotation.x = stage.angles.ring;
      stage.carrier.rotation.x = stage.angles.carrier;
      stage.planets.forEach((node) => {
        node.rotation.x = stage.angles.planet;
      });
      stage.sun.position.x = 0.32 * explosion;
      stage.carrier.position.x = -0.45 * explosion;
      stage.ring.position.x = -0.05 * explosion;
      stage.sun.userData.angularSpeed = rates.sun;
      stage.carrier.userData.angularSpeed = rates.carrier;
      stage.ring.userData.angularSpeed = rates.ring;
    });
    packs.forEach((pack, i) => {
      const applied =
        motion.driving &&
        (i === 0 ||
          (i === 1 && (state.range === "R" || state.gear >= 2)) ||
          (i === 2 && motion.stages.some((stage) => stage.mode !== "direct")));
      const application = applied ? 1 : 0;
      pack.application += (application - pack.application) * ease;
      transitioning ||= Math.abs(application - pack.application) > 0.001;
      const angle = i === 2 ? 0 : stages[i].angles.carrier;
      pack.drum.rotation.x = angle;
      pack.discs.forEach((node, j) => {
        node.position.x =
          (j - 3.5) *
          (0.058 + (1 - pack.application) * 0.018 + explosion * 0.075);
        node.rotation.x = i === 2 ? 0 : angle;
      });
      pack.piston.position.x = pack.application * 0.045 - 0.09 * explosion;
    });
    output.rotation.x = outputAngle;
    pawl.rotation.z = state.range === "P" ? 0 : -0.72;
    shell.position.set(0, explosion * 0.15, -explosion * 0.55);
    sump.position.y = -1.85 - explosion * 0.7;
    cutMembers.forEach((node) => {
      node.visible = !state.cutaway;
    });
    fullRings.forEach((node) => {
      node.visible = !state.cutaway;
    });
    cutRings.forEach((node) => {
      node.visible = state.cutaway;
    });
    flowNodes.forEach((node) => {
      node.marker.visible =
        (!node.driveOnly || motion.driving) && explosion < 0.1;
      node.marker.position.copy(
        node.curve.getPointAt((((flowAngle + node.phase) % 1) + 1) % 1),
      );
    });
    pressureCurves.forEach((node) => {
      node.visible = explosion < 0.1;
    });
    solenoidNodes.forEach(({ pin, signal }, i) => {
      const active =
        motion.driving &&
        (i + state.gear + (state.range === "R" ? 1 : 0)) % 3 !== 0;
      signal.visible = active;
      pin.position.y = -0.36 + (active ? 0.035 : 0);
    });
    for (const { id, material: mat } of materials.values()) {
      const selected = id === state.selected;
      mat.emissive.setHex(
        selected ? 0x6b3814 : id === 10 || id === 11 ? 0x072630 : 0x000000,
      );
      mat.emissiveIntensity = selected ? 0.5 : 0.32;
    }
    group.userData.motion = {
      ...motion,
      inputAngle,
      outputAngle,
      engineAngle,
      turbineAngle,
      flowAngle,
      running,
    };
    group.userData.explosion = explosion;
    group.userData.gear = state.range === "D" ? `D${state.gear}` : state.range;
    group.updateMatrixWorld(true);
  }
  update(0, initialAutomaticState, false);
  return {
    group,
    parts,
    anchors,
    stages,
    packs,
    impeller,
    turbine,
    stator,
    pump,
    output,
    pawl,
    flowNodes,
    update,
    isTransitioning: () => transitioning,
    dispose() {
      if (disposed) return;
      disposed = true;
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach(({ material: mat }) => mat.dispose());
    },
  };
}
