import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { engineMotion } from "./engine-motion";

export function buildEngineModel() {
  const group = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({
    color: 0xb9c5ce,
    metalness: 0.88,
    roughness: 0.38,
  });
  const steel = new THREE.MeshStandardMaterial({
    color: 0x607383,
    metalness: 0.95,
    roughness: 0.2,
  });
  const bore = new THREE.MeshStandardMaterial({
    color: 0x718595,
    metalness: 0.9,
    roughness: 0.22,
    side: THREE.DoubleSide,
  });
  const black = new THREE.MeshStandardMaterial({
    color: 0x111c26,
    metalness: 0.35,
    roughness: 0.38,
  });
  const orange = new THREE.MeshStandardMaterial({
    color: 0xe87822,
    metalness: 0.4,
    roughness: 0.28,
  });
  const dark = new THREE.MeshStandardMaterial({
    color: 0x1d2a35,
    metalness: 0.8,
    roughness: 0.3,
  });
  const oil = new THREE.MeshStandardMaterial({
    color: 0x805b22,
    metalness: 0.35,
    roughness: 0.23,
  });
  function mesh(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    parent: THREE.Object3D = group,
  ) {
    const object = new THREE.Mesh(geometry, material);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  function box(
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    material: THREE.Material = metal,
    parent: THREE.Object3D = group,
  ) {
    const object = mesh(
      new RoundedBoxGeometry(w, h, d, 2, Math.min(0.045, w / 4, h / 4, d / 4)),
      material,
      parent,
    );
    object.position.set(x, y, z);
    return object;
  }
  function cylinder(
    radius: number,
    height: number,
    x: number,
    y: number,
    z: number,
    material: THREE.Material = metal,
    parent: THREE.Object3D = group,
  ) {
    const object = mesh(
      new THREE.CylinderGeometry(radius, radius, height, 32),
      material,
      parent,
    );
    object.position.set(x, y, z);
    return object;
  }
  // Cutaway casting: the front is open so the actual moving solids stay visible.
  box(5.1, 0.18, 1.3, 0, 0.7, 0);
  box(5.1, 0.16, 1.3, 0, 2.1, 0);
  box(5.05, 1.3, 0.15, 0, 1.4, -0.7);
  for (const x of [-2.53, 2.53]) box(0.16, 1.4, 1.4, x, 1.4, 0);
  for (const x of [-1.23, 0, 1.23]) box(0.12, 1.25, 0.12, x, 1.4, 0.61);
  // Crankcase rails, bearing caps and sump.
  box(5.15, 0.18, 0.2, 0, -0.44, -0.6, black);
  box(5.15, 0.18, 0.2, 0, -0.44, 0.6, black);
  box(5.0, 0.34, 1.35, 0, -0.77, 0, black);
  box(4.7, 0.07, 1.2, 0, -0.98, 0, metal);
  for (let i = 0; i < 9; i++)
    box(0.045, 0.24, 1.22, -2.05 + i * 0.51, -0.77, 0, dark);
  box(4.9, 0.05, 1.42, 0, -0.56, 0, metal);
  const shaft = cylinder(0.13, 5.8, 0, 0, 0, steel);
  shaft.rotation.z = Math.PI / 2;
  for (const x of [-2.45, -1.2, 0, 1.2, 2.45]) {
    const cap = cylinder(0.21, 0.13, x, 0, 0, metal);
    cap.rotation.z = Math.PI / 2;
    for (const z of [-0.25, 0.25]) cylinder(0.055, 0.16, x, -0.19, z, steel);
  }
  // Open cam carrier, machined head and a partial black cover.
  box(5.05, 0.16, 0.4, 0, 2.3, -0.52, black);
  box(5.0, 0.11, 0.2, 0, 2.44, -0.55, black);
  box(4.8, 0.035, 0.035, 0, 2.505, -0.55, orange);
  cylinder(0.17, 0.08, -1.9, 2.53, -0.55, orange);
  for (const z of [-0.3, 0.3]) {
    const camShaft = cylinder(0.065, 4.8, 0, 2.325, z, steel);
    camShaft.rotation.z = Math.PI / 2;
  }
  const pistons: THREE.Group[] = [],
    rods: THREE.Group[] = [],
    cranks: THREE.Group[] = [],
    valvePairs: THREE.Group[][] = [],
    cams: THREE.Mesh[] = [];
  const yAxis = new THREE.Vector3(0, 1, 0),
    direction = new THREE.Vector3();
  const glowMaterials: THREE.MeshBasicMaterial[] = [];
  const springs: THREE.Mesh[] = [];
  const pinScale = 0.32 / 26;
  for (let i = 0; i < 4; i++) {
    const x = -1.8 + i * 1.2;
    const shell = mesh(
      new THREE.CylinderGeometry(
        0.47,
        0.47,
        1.16,
        40,
        1,
        true,
        Math.PI / 2,
        Math.PI,
      ),
      bore,
    );
    shell.position.set(x, 1.47, 0);
    const rim = mesh(
      new THREE.TorusGeometry(0.47, 0.025, 8, 40, Math.PI),
      metal,
    );
    rim.rotation.x = Math.PI / 2;
    rim.rotation.z = Math.PI;
    rim.position.set(x, 2.06, 0);
    const piston = new THREE.Group();
    piston.name = `piston-${i + 1}`;
    piston.position.x = x;
    group.add(piston);
    pistons.push(piston);
    cylinder(0.435, 0.31, 0, 0.015, 0, metal, piston);
    cylinder(0.438, 0.035, 0, 0.18, 0, steel, piston);
    for (const y of [0.08, 0.115, 0.145]) {
      const ring = mesh(
        new THREE.TorusGeometry(0.436, 0.014, 7, 32),
        dark,
        piston,
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = y;
    }
    const wrist = cylinder(0.09, 0.94, 0, 0, 0, steel, piston);
    wrist.rotation.z = Math.PI / 2;
    const crown = mesh(
      new THREE.TorusGeometry(0.25, 0.015, 8, 28),
      steel,
      piston,
    );
    crown.rotation.x = Math.PI / 2;
    crown.position.y = 0.202;
    const rod = new THREE.Group();
    group.add(rod);
    box(0.09, 1, 0.09, 0, 0, 0, steel, rod);
    box(0.14, 1, 0.025, 0, 0, -0.055, metal, rod);
    box(0.14, 1, 0.025, 0, 0, 0.055, metal, rod);
    rod.name = `connecting-rod-${i + 1}`;
    rods.push(rod);
    const crank = new THREE.Group();
    crank.position.x = x;
    group.add(crank);
    cranks.push(crank);
    for (const offset of [-0.15, 0.15])
      box(0.12, 0.55, 0.26, offset, 0.12, 0, steel, crank);
    const journal = cylinder(0.14, 0.4, 0, 0.32, 0, metal, crank);
    journal.rotation.z = Math.PI / 2;
    const counterweight = box(0.42, 0.3, 0.48, 0, -0.22, 0, dark, crank);
    counterweight.rotation.x = 0.15;
    const pair: THREE.Group[] = [];
    for (let v = 0; v < 2; v++) {
      const z = v === 0 ? 0.23 : -0.23;
      const valve = new THREE.Group();
      valve.position.set(x, 0, z);
      group.add(valve);
      pair.push(valve);
      cylinder(0.027, 0.36, 0, 2.13, 0, steel, valve);
      cylinder(0.14, 0.025, 0, 1.957, 0, steel, valve);
      const coilPoints = Array.from(
        { length: 65 },
        (_, n) =>
          new THREE.Vector3(
            Math.cos((n * Math.PI) / 8) * 0.075,
            n / 64,
            Math.sin((n * Math.PI) / 8) * 0.075,
          ),
      );
      const spring = mesh(
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3(coilPoints),
          64,
          0.009,
          4,
          false,
        ),
        steel,
      );
      spring.position.set(x, 2.08, z);
      spring.scale.y = 0.17;
      springs.push(spring);
      cylinder(0.105, 0.025, 0, 2.25, 0, steel, valve);
      const camShape = new THREE.Shape();
      for (let step = 0; step <= 48; step++) {
        const a = (step * Math.PI * 2) / 48,
          r = 0.075 + 0.075 * Math.max(Math.cos(a), 0) ** 4;
        const x = r * Math.sin(a),
          y = r * Math.cos(a);
        if (!step) camShape.moveTo(x, y);
        else camShape.lineTo(x, y);
      }
      const camGeometry = new THREE.ExtrudeGeometry(camShape, {
        depth: 0.07,
        bevelEnabled: false,
      });
      camGeometry.translate(0, 0, -0.035);
      camGeometry.rotateY(Math.PI / 2);
      const cam = mesh(camGeometry, steel);
      cam.position.set(x, 2.325, z);
      cams.push(cam);
    }
    valvePairs.push(pair);
    const glow = new THREE.MeshBasicMaterial({
      color: 0xff9933,
      transparent: true,
      opacity: 0.08,
      depthWrite: false,
    });
    glowMaterials.push(glow);
    const chamber = mesh(
      new THREE.CylinderGeometry(
        0.415,
        0.415,
        0.25,
        24,
        1,
        true,
        Math.PI / 2,
        Math.PI,
      ),
      glow,
    );
    chamber.position.set(x, 1.88, 0);
    for (const z of [-0.56, 0.56]) {
      const bolt = cylinder(0.055, 0.09, x, 2.2, z, steel);
      bolt.geometry.dispose();
      bolt.geometry = new THREE.CylinderGeometry(0.055, 0.055, 0.09, 6);
    }
  }
  const flywheel = new THREE.Group();
  flywheel.position.x = 2.9;
  group.add(flywheel);
  const disc = cylinder(0.76, 0.13, 0, 0, 0, steel, flywheel);
  disc.rotation.z = Math.PI / 2;
  const hub = cylinder(0.24, 0.2, 0.08, 0, 0, orange, flywheel);
  hub.rotation.z = Math.PI / 2;
  for (let i = 0; i < 40; i++) {
    const a = (i * Math.PI) / 20;
    const tooth = box(
      0.15,
      0.06,
      0.08,
      0,
      Math.cos(a) * 0.77,
      Math.sin(a) * 0.77,
      metal,
      flywheel,
    );
    tooth.rotation.x = a;
  }
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const bolt = cylinder(
      0.065,
      0.16,
      0.09,
      Math.cos(a) * 0.52,
      Math.sin(a) * 0.52,
      dark,
      flywheel,
    );
    bolt.rotation.z = Math.PI / 2;
  }
  // Batch stationary pieces sharing a material, including parts inside moving groups.
  // This keeps reflections and shadows affordable on phones.
  const individual = new Set<THREE.Object3D>([...cams, ...springs]);
  function batch(parent: THREE.Group) {
    const byMaterial = new Map<THREE.Material, THREE.Mesh[]>();
    for (const child of [...parent.children]) {
      if (child instanceof THREE.Group) batch(child);
      if (
        !(child instanceof THREE.Mesh) ||
        individual.has(child) ||
        Array.isArray(child.material) ||
        child.material instanceof THREE.MeshBasicMaterial
      )
        continue;
      const items = byMaterial.get(child.material) ?? [];
      items.push(child);
      byMaterial.set(child.material, items);
    }
    for (const [material, items] of byMaterial) {
      if (items.length < 2) continue;
      const geometries = items.map((item) => {
        item.updateMatrix();
        const geometry = item.geometry.index
          ? item.geometry.toNonIndexed()
          : item.geometry.clone();
        return geometry.applyMatrix4(item.matrix);
      });
      const merged = mergeGeometries(geometries, false);
      geometries.forEach((g) => g.dispose());
      if (!merged) continue;
      for (const item of items) {
        parent.remove(item);
        item.geometry.dispose();
      }
      mesh(merged, material, parent);
    }
  }
  batch(group);
  function update(angle: number) {
    for (let i = 0; i < 4; i++) {
      const m = engineMotion(angle, i),
        x = -1.8 + i * 1.2;
      const wristY = (360 - m.wristY) * pinScale;
      const pinY = (360 - m.pinY) * pinScale,
        pinZ = (m.pinX - m.centerX) * pinScale;
      pistons[i].position.y = wristY;
      direction.set(0, wristY - pinY, -pinZ);
      rods[i].position.set(x, (wristY + pinY) / 2, pinZ / 2);
      rods[i].scale.y = direction.length();
      rods[i].quaternion.setFromUnitVectors(yAxis, direction.normalize());
      cranks[i].rotation.x = angle + [0, Math.PI, 3 * Math.PI, 2 * Math.PI][i];
      for (let v = 0; v < 2; v++) {
        const lift =
          m.stroke === (v === 0 ? 2 : 1)
            ? 0.075 * Math.sin(m.progress * Math.PI)
            : 0;
        valvePairs[i][v].position.y = -lift;
        springs[i * 2 + v].scale.y = 0.17 - lift;
      }
      for (let v = 0; v < 2; v++)
        cams[i * 2 + v].rotation.x =
          angle / 2 +
          [0, Math.PI, 3 * Math.PI, 2 * Math.PI][i] / 2 +
          (v === 0 ? -Math.PI / 4 : Math.PI / 4);
      glowMaterials[i].color.set(
        m.stroke === 0 ? 0xff9a35 : m.stroke === 2 ? 0x7bc4ec : 0xd7bb80,
      );
      glowMaterials[i].opacity =
        m.stroke === 0 ? 0.08 + 0.18 * Math.sin(m.progress * Math.PI) : 0.045;
    }
    flywheel.rotation.x = angle;
    group.updateMatrixWorld(true);
  }
  function dispose() {
    const geometries = new Set<THREE.BufferGeometry>(),
      materials = new Set<THREE.Material>();
    group.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        geometries.add(object.geometry);
        for (const material of Array.isArray(object.material)
          ? object.material
          : [object.material])
          materials.add(material);
      }
    });
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
  }
  update(0);
  return { group, update, dispose };
}
