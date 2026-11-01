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
