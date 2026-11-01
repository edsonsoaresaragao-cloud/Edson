import { test } from "node:test";
import assert from "node:assert/strict";
import { engineMotion } from "../src/lib/engine-motion";

test("a biela mantém comprimento constante e os pistões 1/4 e 2/3 trabalham em pares", () => {
  for (let step = 0; step < 360; step++) {
    const angle = (step * Math.PI) / 90;
    const positions = [0, 1, 2, 3].map((i) => engineMotion(angle, i));
    for (const m of positions)
      assert.ok(
        Math.abs(Math.hypot(m.pinX - m.centerX, m.pinY - m.wristY) - 100) <
          1e-8,
      );
    assert.ok(Math.abs(positions[0].wristY - positions[3].wristY) < 1e-8);
    assert.ok(Math.abs(positions[1].wristY - positions[2].wristY) < 1e-8);
  }
});
test("o ciclo de quatro tempos respeita a ordem de ignição 1–3–4–2", () => {
  const firing = [0, Math.PI, 2 * Math.PI, 3 * Math.PI].map((angle) =>
    [0, 1, 2, 3].find((i) => {
      const m = engineMotion(angle, i);
      return m.stroke === 0 && m.progress < 1e-8;
    }),
  );
  assert.deepEqual(firing, [0, 2, 3, 1]);
  assert.equal(engineMotion(0, 0).wristY, 234);
  assert.equal(engineMotion(Math.PI, 0).wristY, 286);
});

test("as bielas 3D permanecem ligadas ao pino e ao pistão em toda a rotação", async () => {
  const THREE = await import("three");
  const { buildEngineModel } = await import("../src/lib/engine-model");
  const model = buildEngineModel();
  try {
    for (let step = 0; step < 32; step++) {
      const angle = (step * Math.PI) / 8;
      model.update(angle);
      for (let i = 0; i < 4; i++) {
        const rod = model.group.getObjectByName(`connecting-rod-${i + 1}`)!;
        const piston = model.group.getObjectByName(`piston-${i + 1}`)!;
        const upper = rod.localToWorld(new THREE.Vector3(0, 0.5, 0));
        const lower = rod.localToWorld(new THREE.Vector3(0, -0.5, 0));
        assert.ok(upper.distanceTo(piston.position) < 1e-8);
        assert.ok(Math.abs(upper.distanceTo(lower) - (100 * 0.32) / 26) < 1e-8);
        const m = engineMotion(angle, i);
        const expected = new THREE.Vector3(
          -1.8 + i * 1.2,
          ((360 - m.pinY) * 0.32) / 26,
          ((m.pinX - m.centerX) * 0.32) / 26,
        );
        assert.ok(lower.distanceTo(expected) < 1e-8);
      }
    }
    let meshes = 0;
    model.group.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        meshes++;
        for (const value of object.geometry.attributes.position.array)
          assert.ok(Number.isFinite(value));
      }
    });
    assert.ok(meshes > 50);
  } finally {
    model.dispose();
  }
});

test("o motor 3D cabe na câmera sem cortar os extremos do modelo", async () => {
  const THREE = await import("three");
  const { buildEngineModel } = await import("../src/lib/engine-model");
  const { createEngineCamera } = await import("../src/lib/engine-renderer");
  const model = buildEngineModel(),
    camera = createEngineCamera();
  try {
    const bounds = new THREE.Box3().setFromObject(model.group);
    for (const x of [bounds.min.x, bounds.max.x])
      for (const y of [bounds.min.y, bounds.max.y])
        for (const z of [bounds.min.z, bounds.max.z]) {
          const point = new THREE.Vector3(x, y, z).project(camera);
          assert.ok(Math.abs(point.x) < 0.98 && Math.abs(point.y) < 0.98);
          assert.ok(point.z > -1 && point.z < 1);
        }
  } finally {
    model.dispose();
  }
});
