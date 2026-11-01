import { test } from "node:test";
import assert from "node:assert/strict";
import { Mesh } from "three";
import { buildSuspensionModel } from "../src/lib/suspension-model";
import {
  initialSuspensionState,
  suspensionParts,
} from "../src/lib/suspension-parts";

test("20 componentes possuem geometria selecionável e finita", () => {
  const model = buildSuspensionModel();
  assert.deepEqual(
    suspensionParts.map((p) => p.id),
    Array.from({ length: 20 }, (_, i) => i + 1),
  );
  for (const part of suspensionParts) {
    let count = 0;
    model.group.getObjectByName(`suspension-part-${part.id}`)!.traverse((o) => {
      if (o instanceof Mesh) {
        count++;
        assert.ok(
          Array.from(o.geometry.attributes.position.array).every(
            Number.isFinite,
          ),
        );
      }
    });
    assert.ok(count > 0, part.name);
  }
  model.dispose();
});
test("disco gira, pinça permanece sem rotação de roda e ambos esterçam", () => {
  const model = buildSuspensionModel();
  model.update(1, { ...initialSuspensionState, steering: 20 });
  const disc = model.group.getObjectByName("disc-1")!,
    caliper = model.group.getObjectByName("caliper-1")!;
  assert.ok(disc.quaternion.angleTo(caliper.quaternion) > 1);
  assert.ok(Math.abs(caliper.rotation.y - (20 * Math.PI) / 180) < 1e-6);
  assert.equal(caliper.rotation.x, 0);
  model.dispose();
});
test("mola encurta na compressão e explosão separa disco do cubo", () => {
  const model = buildSuspensionModel(),
    spring = model.group.getObjectByName("spring--1")!;
  model.update(0, { ...initialSuspensionState, amplitude: 1 });
  const resting = spring.scale.y;
  model.update(Math.PI / 3, { ...initialSuspensionState, amplitude: 1 });
  assert.ok(spring.scale.y < resting);
  assert.ok(spring.scale.y > 0);
  model.update(1, { ...initialSuspensionState, explosion: 1 });
  assert.ok(
    model.group.getObjectByName("disc-1")!.position.x >
      model.group.getObjectByName("hub-1")!.position.x,
  );
  assert.equal(
    model.group.getObjectByName("suspension-part-1")!.position.y,
    -1,
  );
  model.dispose();
});
test("limites dos controles mantêm transformações válidas", () => {
  const model = buildSuspensionModel();
  for (const explosion of [-5, 0, 0.5, 1, 5])
    for (const time of [0, 1, 20]) {
      model.update(time, {
        explosion,
        steering: 100,
        amplitude: 100,
        selected: 12,
      });
      model.group.traverse((o) =>
        assert.ok(o.matrixWorld.elements.every(Number.isFinite)),
      );
    }
  model.dispose();
});
