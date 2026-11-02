import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import {
  absParts,
  initialAbsState,
  type AbsState,
  absCycle,
} from "./abs-parts";
export function buildAbsModel() {
  const group = new T.Group(),
    parts = absParts.map((p) => {
      const g = new T.Group();
      g.name = `abs-part-${p.id}`;
      g.userData.part = p.id;
      group.add(g);
      return g;
    });
  const materials = new Set<T.MeshStandardMaterial>();
  function mat(color: number, metalness = 0.8, roughness = 0.32) {
    const m = new T.MeshStandardMaterial({ color, metalness, roughness });
    materials.add(m);
    return m;
  }
  const metal = mat(0xaabac6),
    dark = mat(0x182a37, 0.2, 0.45),
    copper = mat(0xbf8946),
    amber = mat(0xf3a53d, 0.3),
    sensorAccent = mat(0x52ba8d, 0.1);
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
  const positions = [
    new T.Vector3(),
    new T.Vector3(-0.7, 1.2, 0),
    new T.Vector3(0, 1.2, 0),
    new T.Vector3(0, 1.2, 0.4),
    new T.Vector3(0, 2.13, 0),
    new T.Vector3(-1.35, 2.2, -0.6),
    new T.Vector3(-1.3, 1.7, -0.6),
    new T.Vector3(),
    new T.Vector3(),
    new T.Vector3(-1.7, 1.2, -0.6),
    new T.Vector3(0.65, 0.9, 0),
  ];
  const offsets = [
    new T.Vector3(),
    new T.Vector3(-0.75, 0, -0.15),
    new T.Vector3(),
    new T.Vector3(0, 0, 1),
    new T.Vector3(0, 0.65, 0),
    new T.Vector3(-0.4, 0.45, 0),
    new T.Vector3(-0.3, 0.2, 0),
    new T.Vector3(),
    new T.Vector3(),
    new T.Vector3(-0.5, 0.1, 0),
    new T.Vector3(0.4, -0.1, 0.2),
  ];
  box(2, 0.13, 1.24, 0.62, 0, 0, 0, dark);
  box(2, 0.04, 0.85, 0.5, 0.1, 0, 0, mat(0x1f6346, 0.15));
  box(2, 0.14, 0.28, 0.32, -0.08, 0, 0, dark);
  for (let i = 0; i < 8; i++)
    box(
      2,
      0.03,
      0.08,
      0.07,
      0.135,
      -0.32 + i * 0.09,
      (i % 2 ? 1 : -1) * 0.14,
      dark,
    );
  // Machined valve bores are actual holes through the extruded manifold face.
  const outline = new T.Shape();
  outline.moveTo(-0.5, -0.58);
  outline.lineTo(0.5, -0.58);
  outline.quadraticCurveTo(0.55, -0.58, 0.55, -0.53);
  outline.lineTo(0.55, 0.53);
  outline.quadraticCurveTo(0.55, 0.58, 0.5, 0.58);
  outline.lineTo(-0.5, 0.58);
  outline.quadraticCurveTo(-0.55, 0.58, -0.55, 0.53);
  outline.lineTo(-0.55, -0.53);
  outline.quadraticCurveTo(-0.55, -0.58, -0.5, -0.58);
  for (let row = 0; row < 4; row++)
    for (const x of [-0.25, 0.25]) {
      const hole = new T.Path();
      hole.absarc(x, -0.39 + row * 0.26, 0.068, 0, Math.PI * 2, true);
      outline.holes.push(hole);
    }
  const block = mesh(
    3,
    new T.ExtrudeGeometry(outline, {
      depth: 0.45,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.015,
      bevelThickness: 0.015,
    }),
  );
  block.position.z = -0.225;
  for (let i = 0; i < 6; i++) {
    const port = cylinder(3, 0.055, 0.12, -0.4 + i * 0.16, 0.65, 0);
    ring(3, 0.057, 0.012, -0.4 + i * 0.16, 0.7, 0, dark).rotation.x =
      Math.PI / 2;
    port.name = "hydraulic-port";
  }
  const valves: T.Group[] = [];
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < 2; col++) {
      const valve = new T.Group();
      valve.name = `abs-valve-${row * 2 + col}`;
      parts[3].add(valve);
      valve.position.set(col ? 0.25 : -0.25, -0.39 + row * 0.26, 0);
      cylinder(4, 0.067, 0.26, 0, 0, 0, dark, valve).rotation.x = Math.PI / 2;
      const plunger = cylinder(4, 0.035, 0.18, 0, 0, 0.15, metal, valve);
      plunger.rotation.x = Math.PI / 2;
      plunger.name = "valve-plunger";
      const springPoints = Array.from(
        { length: 100 },
        (_, i) =>
          new T.Vector3(
            Math.cos((i * Math.PI) / 12) * 0.045,
            Math.sin((i * Math.PI) / 12) * 0.045,
            0.2 + i * 0.0013,
          ),
      );
      mesh(
        4,
        new T.TubeGeometry(
          new T.CatmullRomCurve3(springPoints),
          100,
          0.007,
          6,
          false,
        ),
        metal,
        valve,
      );
      valves.push(valve);
    }
  cylinder(5, 0.29, 0.58, 0, 0, 0);
  cylinder(5, 0.31, 0.045, 0, 0.3, 0, dark);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    cylinder(5, 0.025, 0.06, Math.cos(a) * 0.23, 0.34, Math.sin(a) * 0.23);
  }
  const pumpRotor = new T.Group();
  pumpRotor.name = "abs-pump-rotor";
  parts[4].add(pumpRotor);
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const fin = box(
      5,
      0.04,
      0.03,
      0.18,
      Math.cos(a) * 0.11,
      0.34,
      Math.sin(a) * 0.11,
      dark,
      pumpRotor,
    );
    fin.rotation.y = -a;
  }
  const tankMaterial = mat(0xe1e7d6, 0.1);
  tankMaterial.transparent = true;
  tankMaterial.opacity = 0.45;
  tankMaterial.depthWrite = false;
  box(6, 0.55, 0.35, 0.4, 0, 0, 0, tankMaterial);
  box(6, 0.48, 0.13, 0.34, 0, -0.06, 0, mat(0xc7b561, 0.1));
  cylinder(6, 0.1, 0.075, 0, 0.22, 0, dark);
  for (const x of [-0.1, 0.1]) cylinder(6, 0.03, 0.25, x, -0.275, 0);
  cylinder(7, 0.1, 0.85, 0, 0, 0).rotation.z = Math.PI / 2;
  const masterPiston = cylinder(7, 0.04, 0.2, -0.48, 0, 0, copper);
  masterPiston.rotation.z = Math.PI / 2;
  masterPiston.name = "master-piston";
  cylinder(10, 0.33, 0.18, 0, 0, 0, dark).rotation.x = Math.PI / 2;
  const pedal = new T.Group();
  pedal.name = "brake-pedal";
  parts[9].add(pedal);
  box(10, 0.07, 0.6, 0.05, -0.2, -0.3, -0.1, metal, pedal);
  box(10, 0.22, 0.1, 0.12, -0.2, -0.6, -0.1, dark, pedal);
  for (const x of [-0.1, 0.1]) {
    cylinder(11, 0.08, 0.3, x, 0, 0);
    cylinder(11, 0.085, 0.035, x, 0.16, 0, dark);
  }
  const wheels: {
    position: T.Vector3;
    rotor: T.Group;
    caliper: T.Group;
    sensor: T.Group;
    encoder: T.Group;
  }[] = [];
  for (let i = 0; i < 4; i++) {
    const side = i % 2 ? 1 : -1,
      z = i < 2 ? 1.7 : -1.7;
    const rotor = new T.Group();
    rotor.name = `abs-disc-${i}`;
    parts[8].add(rotor);
    for (const x of [-0.035, 0.035])
      cylinder(9, 0.45, 0.03, x, 0, 0, metal, rotor).rotation.z = Math.PI / 2;
    for (let j = 0; j < 24; j++) {
      const a = (j * Math.PI) / 12;
      const vane = box(
        9,
        0.06,
        0.1,
        0.015,
        0,
        Math.cos(a) * 0.35,
        Math.sin(a) * 0.35,
        dark,
        rotor,
      );
      vane.rotation.x = a;
    }
    cylinder(9, 0.16, 0.15, 0, 0, 0, metal, rotor).rotation.z = Math.PI / 2;
    for (let j = 0; j < 5; j++) {
      const a = (j * Math.PI * 2) / 5;
      const bolt = cylinder(
        9,
        0.025,
        0.17,
        0,
        Math.cos(a) * 0.12,
        Math.sin(a) * 0.12,
        metal,
        rotor,
      );
      bolt.rotation.z = Math.PI / 2;
    }
    const caliper = new T.Group();
    caliper.name = `abs-caliper-${i}`;
    parts[8].add(caliper);
    box(9, 0.22, 0.34, 0.22, 0, 0, 0.34, amber, caliper);
    const sensor = new T.Group();
    sensor.name = `abs-sensor-${i}`;
    parts[0].add(sensor);
    cylinder(1, 0.035, 0.13, 0, 0.25, 0.21, dark, sensor);
    box(1, 0.06, 0.06, 0.07, 0, 0.31, 0.21, sensorAccent, sensor);
    const encoder = new T.Group();
    encoder.name = `abs-encoder-${i}`;
    sensor.add(encoder);
    const toneRing = ring(1, 0.19, 0.015, 0, 0, 0, dark, encoder);
    toneRing.rotation.y = Math.PI / 2;
    for (let j = 0; j < 24; j++) {
      const a = (j * Math.PI) / 12;
      const tooth = box(
        1,
        0.03,
        0.02,
        0.02,
        0,
        Math.cos(a) * 0.2,
        Math.sin(a) * 0.2,
        metal,
        encoder,
      );
      tooth.rotation.x = a;
    }
    wheels.push({
      position: new T.Vector3(side * 2.5, 0.45, z),
      rotor,
      caliper,
      sensor,
      encoder,
    });
  }
  // Batch static details while preserving moving pistons, rotors and valve plungers.
  const protectedNames = new Set(["valve-plunger", "master-piston"]);
  function batch(parent: T.Object3D) {
    for (const c of [...parent.children]) if (c instanceof T.Group) batch(c);
    const buckets = new Map<T.Material, T.Mesh[]>();
    for (const c of parent.children)
      if (
        c instanceof T.Mesh &&
        !Array.isArray(c.material) &&
        !protectedNames.has(c.name)
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
        const m = o.material.clone() as T.MeshStandardMaterial;
        materials.add(m);
        o.material = m;
      }
    }),
  );
  type Route = {
    line: T.Mesh;
    curve: T.CatmullRomCurve3;
    dots: T.Mesh[];
    kind: "master" | "wheel" | "release" | "recirculate" | "sensor";
    wheel?: number;
  };
  const routes: Route[] = [];
  const flowMaterial = mat(0x81c6f1, 0.1);
  flowMaterial.emissive.setHex(0x3788b3);
  flowMaterial.emissiveIntensity = 0.5;
  const signalMaterial = mat(0x64d2a2, 0.1);
  signalMaterial.emissive.setHex(0x26835a);
  signalMaterial.emissiveIntensity = 0.5;
  const angles = [0, 0, 0, 0];
  let lastExplosion = -1,
    lastTime = 0,
    pumpAngle = 0;
  function update(time: number, state: AbsState) {
    const explosion = T.MathUtils.clamp(state.explosion, 0, 1),
      cycle = absCycle(time, state.pedal, state.mode),
      dt = T.MathUtils.clamp(time - lastTime, 0, 0.1);
    lastTime = time;
    parts.forEach((p, i) =>
      p.position.copy(positions[i]).addScaledVector(offsets[i], explosion),
    );
    wheels.forEach((w, i) => {
      const side = i % 2 ? 1 : -1;
      const p = w.position.clone();
      p.x += side * 0.5 * explosion;
      w.rotor.position.copy(p);
      w.caliper.position
        .copy(p)
        .add(new T.Vector3(side * 0.25 * explosion, 0, 0.2 * explosion));
      w.sensor.position.copy(p).add(new T.Vector3(-side * 0.12, 0, 0));
      angles[i] += dt * cycle.referenceRate * (i === 0 ? cycle.wheelRatio : 1);
      w.rotor.rotation.x = angles[i];
      w.encoder.rotation.x = angles[i];
      w.sensor.userData.reading =
        cycle.referenceRate * (i === 0 ? cycle.wheelRatio : 1);
    });
    valves.forEach((v, i) => {
      const open =
        i < 2 ? (i === 0 ? cycle.inletOpen : cycle.outletOpen) : i % 2 === 0;
      v.userData.open = open;
      const plunger = v.getObjectByName("valve-plunger")!;
      plunger.position.z = 0.15 + (open ? 0.035 : 0);
    });
    if (cycle.pumpActive) pumpAngle += dt * 6;
    pumpRotor.rotation.y = pumpAngle;
    masterPiston.position.x =
      -0.48 + T.MathUtils.clamp(state.pedal, 0, 1) * 0.08;
    pedal.rotation.x = -T.MathUtils.clamp(state.pedal, 0, 1) * 0.2;
    if (explosion !== lastExplosion) {
      routes.forEach((r) => {
        r.line.geometry.dispose();
        r.line.removeFromParent();
        r.dots.forEach((d) => {
          d.geometry.dispose();
          d.removeFromParent();
        });
      });
      routes.length = 0;
      function route(
        a: T.Vector3,
        b: T.Vector3,
        kind: Route["kind"],
        wheel?: number,
      ) {
        const mid = a.clone().lerp(b, 0.5);
        mid.y += kind === "sensor" ? 0.25 : -0.15;
        mid.z += kind === "sensor" ? -0.18 : 0.2;
        const curve = new T.CatmullRomCurve3([a, mid, b]);
        const line = mesh(
          kind === "sensor" ? 1 : 8,
          new T.TubeGeometry(
            curve,
            32,
            kind === "sensor" ? 0.012 : 0.022,
            8,
            false,
          ),
          kind === "sensor" ? dark : copper,
          parts[kind === "sensor" ? 0 : 7],
        );
        line.name = `abs-route-${routes.length}`;
        line.userData.kind = kind;
        line.userData.wheel = wheel;
        const dots = Array.from({ length: 5 }, () =>
          mesh(
            kind === "sensor" ? 1 : 8,
            new T.SphereGeometry(0.025, 8, 6),
            kind === "sensor" ? signalMaterial : flowMaterial,
            parts[kind === "sensor" ? 0 : 7],
          ),
        );
        routes.push({ line, curve, dots, kind, wheel });
      }
      const inlet = parts[2].position.clone().add(new T.Vector3(-0.4, 0.6, 0));
      route(
        parts[6].position.clone().add(new T.Vector3(-0.15, 0, 0)),
        inlet,
        "master",
      );
      route(
        parts[6].position.clone().add(new T.Vector3(0.15, 0, 0)),
        parts[2].position.clone().add(new T.Vector3(0.4, 0.6, 0)),
        "master",
      );
      wheels.forEach((w, i) => {
        const a = parts[2].position
          .clone()
          .add(new T.Vector3(-0.24 + i * 0.16, 0.6, 0));
        route(
          a,
          w.caliper.position.clone().add(new T.Vector3(0, 0, 0.34)),
          "wheel",
          i,
        );
        route(
          w.sensor.position.clone().add(new T.Vector3(0, 0.31, 0.21)),
          parts[1].position.clone(),
          "sensor",
          i,
        );
      });
      route(
        parts[2].position.clone().add(new T.Vector3(-0.24, 0.6, 0)),
        parts[10].position.clone(),
        "release",
        0,
      );
      route(parts[10].position.clone(), inlet, "recirculate");
      lastExplosion = explosion;
    }
    routes.forEach((r) =>
      r.dots.forEach((d, i) => {
        const supplied = cycle.phase === "apply" || cycle.phase === "increase";
        d.visible =
          r.kind === "sensor"
            ? true
            : state.pedal > 0 &&
              (r.kind === "master"
                ? supplied
                : r.kind === "wheel"
                  ? r.wheel === 0
                    ? supplied || cycle.phase === "reduce"
                    : supplied
                  : cycle.phase === "reduce");
        const progress = (time * 0.25 + i / 5) % 1;
        d.position.copy(
          r.curve.getPointAt(
            r.kind === "wheel" && r.wheel === 0 && cycle.phase === "reduce"
              ? 1 - progress
              : progress,
          ),
        );
      }),
    );
    parts.forEach((p, i) =>
      p.traverse((o) => {
        if (
          o instanceof T.Mesh &&
          !Array.isArray(o.material) &&
          o.material !== flowMaterial &&
          o.material !== signalMaterial
        ) {
          const m = o.material as T.MeshStandardMaterial;
          m.emissive.setHex(state.selected === i + 1 ? 0x285978 : 0);
          m.emissiveIntensity = 0.6;
        }
      }),
    );
    group.userData.phase = cycle.phase;
    group.userData.pressure = cycle.pressure;
    group.userData.pumpActive = cycle.pumpActive;
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
  update(0, initialAbsState);
  return { group, update, dispose };
}
