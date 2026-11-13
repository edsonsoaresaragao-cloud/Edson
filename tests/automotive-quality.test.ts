import test from "node:test";
import assert from "node:assert/strict";
import * as T from "three";
import {
  applyAutomotiveFinish,
  automotiveMesh,
  precisionCylinder,
  precisionTorus,
  precisionTube,
} from "../src/lib/automotive-finish";
import {
  fitStudioCamera,
  studioQuality,
  visibleModelBounds,
} from "../src/lib/automotive-studio";

test("resolução respeita orçamento de pixels e limita densidade no celular", () => {
  for (const [width, height, dpr, coarse] of [
    [900, 650, 1, false],
    [900, 650, 3, false],
    [390, 540, 3, true],
    [1440, 1000, 2, false],
  ] as const) {
    const q = studioQuality(width, height, dpr, coarse);
    assert.ok(q.pixelRatio > 0 && q.pixelRatio <= (coarse ? 1.5 : 2));
    assert.ok(
      width * height * q.pixelRatio ** 2 <=
        (coarse ? 1_000_000 : 2_000_000) + 1,
    );
  }
  assert.equal(studioQuality(390, 540, 3, true).shadowSize, 512);
});
test("câmera enquadra os oito cantos em telas estreitas e panorâmicas sem contar peças ocultas", () => {
  const group = new T.Group(),
    visible = automotiveMesh(
      new T.BoxGeometry(5, 2, 1),
      new T.MeshPhysicalMaterial(),
    ),
    hidden = visible.clone();
  group.add(visible, hidden);
  hidden.visible = false;
  hidden.position.x = 100;
  const bounds = visibleModelBounds(group);
  assert.equal(bounds.max.x, 2.5);
  for (const aspect of [0.4, 0.75, 1.5, 2.2]) {
    const camera = new T.PerspectiveCamera(40);
    fitStudioCamera(camera, bounds, aspect);
    for (const x of [bounds.min.x, bounds.max.x])
      for (const y of [bounds.min.y, bounds.max.y])
        for (const z of [bounds.min.z, bounds.max.z]) {
          const p = new T.Vector3(x, y, z).project(camera);
          assert.ok(Math.abs(p.x) < 0.85 && Math.abs(p.y) < 0.85);
          assert.ok(p.z > -1 && p.z < 1);
        }
  }
  visible.geometry.dispose();
  visible.material.dispose();
});
test("acabamentos distinguem carcaça fundida, metal usinado, cobre, borracha e plástico sem mudar seleção", () => {
  const group = new T.Group();
  const cases: [string, number, number, string][] = [
    ["Carcaça frontal", 0xaab8c5, 0.9, "cast"],
    ["Eixo", 0x8a9299, 0.9, "machined"],
    ["Bobina", 0xb9783d, 0.95, "copper"],
    ["Mangueira", 0x202b32, 0.15, "rubber"],
    ["Reservatório", 0xd1dce2, 0.05, "polymer"],
  ];
  for (const [name, color, metalness] of cases) {
    const part = new T.Group();
    part.userData.partName = name;
    part.userData.part = 1;
    part.add(
      automotiveMesh(
        new T.BoxGeometry(0.5, 0.5, 0.5),
        new T.MeshPhysicalMaterial({ color, metalness, roughness: 0.25 }),
      ),
    );
    group.add(part);
  }
  const finish = applyAutomotiveFinish(group),
    textures = new Set<T.Texture>();
  let disposed = 0;
  cases.forEach(([, color, , surface], i) => {
    const mesh = group.children[i].children[0] as T.Mesh<
      T.BoxGeometry,
      T.MeshPhysicalMaterial
    >;
    assert.equal(mesh.material.color.getHex(), color);
    assert.equal(mesh.castShadow, true);
    assert.equal(mesh.material.userData.automotiveSurface, surface);
    assert.equal(group.children[i].userData.part, 1);
    assert.equal(
      (mesh.material.roughnessMap as T.DataTexture)?.image.width,
      128,
    );
    textures.add(mesh.material.roughnessMap!);
  });
  textures.forEach((t) => t.addEventListener("dispose", () => disposed++));
  finish.dispose();
  finish.dispose();
  assert.equal(disposed, textures.size);
  group.traverse((o) => {
    if (o instanceof T.Mesh) {
      o.geometry.dispose();
      o.material.dispose();
    }
  });
});
test("curvas de precisão preservam porcas sextavadas, janelas e extremidades das mangueiras", () => {
  const hex = precisionCylinder(0.2, 0.2, 0.1, 6);
  assert.equal(hex.parameters.radialSegments, 6);
  const cut = precisionCylinder(1, 1, 2, 24, 1, true, 0.3, Math.PI);
  assert.equal(cut.parameters.radialSegments, 64);
  assert.equal(cut.parameters.openEnded, true);
  assert.equal(cut.parameters.thetaStart, 0.3);
  assert.equal(cut.parameters.thetaLength, Math.PI);
  const ring = precisionTorus(1, 0.1, 8, 24, Math.PI);
  assert.equal(ring.parameters.arc, Math.PI);
  assert.equal(ring.parameters.tubularSegments, 80);
  const curve = new T.CatmullRomCurve3([
      new T.Vector3(),
      new T.Vector3(1, 1, 0),
      new T.Vector3(2, 0, 0),
    ]),
    tube = precisionTube(curve, 32, 0.07, 8);
  const p = tube.attributes.position,
    { radialSegments, tubularSegments } = tube.parameters;
  for (const [offset, target] of [
    [0, curve.getPoint(0)],
    [tubularSegments * (radialSegments + 1), curve.getPoint(1)],
  ] as const) {
    const average = new T.Vector3();
    for (let i = 0; i < radialSegments; i++)
      average.add(new T.Vector3().fromBufferAttribute(p, offset + i));
    average.divideScalar(radialSegments);
    assert.ok(average.distanceTo(target) < 1e-7);
  }
  [hex, cut, ring, tube].forEach((g) => g.dispose());
});
for (const id of [
  "suspension",
  "alternator",
  "compressor",
  "hvac",
  "cooling",
  "abs",
  "injection",
  "ignition",
  "steering",
  "eps",
  "cop",
  "starter",
  "manual-transmission",
  "automatic-transmission",
  "engine",
]) {
  test(`${id}: modelo recebe acabamento físico e libera todas as microtexturas`, async () => {
    const modelModule = await import(`../src/lib/${id}-model`);
    const builder = Object.entries(modelModule).find(
      ([name, value]) =>
        name.startsWith("build") && typeof value === "function",
    )![1] as () => { group: T.Group; dispose: () => void };
    const model = builder(),
      textures = new Set<T.Texture>();
    let physical = 0,
      triangles = 0;
    model.group.traverse((o) => {
      if (o instanceof T.Mesh) {
        triangles +=
          (o.geometry.index?.count || o.geometry.attributes.position.count) / 3;
        for (const m of Array.isArray(o.material) ? o.material : [o.material])
          if (m instanceof T.MeshPhysicalMaterial) {
            physical++;
            if (m.roughnessMap) textures.add(m.roughnessMap);
          }
      }
    });
    assert.ok(physical > 5);
    assert.ok(textures.size > 0);
    assert.ok(triangles < 2_000_000, `${id}: ${triangles} triângulos`);
    const counts = new Map<T.Texture, number>();
    textures.forEach((t) =>
      t.addEventListener("dispose", () =>
        counts.set(t, (counts.get(t) || 0) + 1),
      ),
    );
    model.dispose();
    textures.forEach((t) =>
      assert.equal(counts.get(t), 1, `${id}: textura liberada uma vez`),
    );
  });
}
