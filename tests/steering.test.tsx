import { test } from "node:test";
import assert from "node:assert/strict";
import { Mesh } from "three";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { buildSteeringModel } from "../src/lib/steering-model";
import {
  steeringParts,
  initialSteeringState,
  steeringPose,
  hydraulicDirection,
} from "../src/lib/steering-parts";
import { SteeringExplorer } from "../src/components/steering-explorer";
test("17 itens da referência e 3 de contexto têm malhas finitas e selecionáveis", () => {
  const m = buildSteeringModel();
  assert.equal(steeringParts.length, 20);
  for (const p of steeringParts) {
    const g = m.group.getObjectByName(`steering-part-${p.id}`)!;
    assert.ok(g);
    let count = 0;
    g.traverse((o) => {
      if (o instanceof Mesh) {
        count++;
        assert.ok(
          Array.from(o.geometry.attributes.position.array).every(
            Number.isFinite,
          ),
        );
      }
    });
    assert.ok(count > 0, p.name);
  }
  for (const explosion of [-1, 0, 0.5, 1, 2])
    for (const steering of [-500, -120, 0, 180, 500]) {
      m.update(0.1, {
        ...initialSteeringState,
        automatic: false,
        explosion,
        steering,
      });
      m.group.traverse((o) =>
        assert.ok(o.matrixWorld.elements.every(Number.isFinite)),
      );
    }
  m.dispose();
});
test("volante, pinhão, cremalheira e rodas respondem ao comando manual", () => {
  const m = buildSteeringModel();
  for (const steering of [-360, -90, 0, 90, 360]) {
    m.update(0.1, { ...initialSteeringState, automatic: false, steering });
    const p = steeringPose(steering);
    assert.equal(m.group.getObjectByName("hydraulic-rack")!.position.x, p.rack);
    assert.ok(
      Math.abs(
        m.group.getObjectByName("steering-wheel")!.rotation.z -
          (steering * Math.PI) / 180,
      ) < 1e-10,
    );
    assert.ok(
      Math.abs(
        m.group.getObjectByName("steering-pinion")!.rotation.y -
          (steering * Math.PI) / 180,
      ) < 1e-10,
    );
    for (const side of [-1, 1]) {
      assert.ok(
        Math.abs(
          m.group.getObjectByName(`disc-${side}`)!.rotation.y -
            (p.roadDegrees * Math.PI) / 180,
        ) < 1e-10,
      );
      assert.equal(m.group.getObjectByName(`disc-${side}`)!.rotation.x, 0);
    }
  }
  assert.equal(steeringPose(500).wheel, 360);
  assert.equal(steeringPose(-500).wheel, -360);
  m.dispose();
});
test("circuito hidráulico fecha pelo reservatório e assistência não elimina vínculo mecânico", () => {
  const m = buildSteeringModel();
  const expected = [
    [3, 8],
    [8, 4],
    [4, 3],
  ];
  for (const explosion of [0, 1]) {
    m.update(0.1, {
      ...initialSteeringState,
      explosion,
      automatic: false,
      steering: -180,
    });
    expected.forEach((r, i) =>
      assert.deepEqual(
        m.group.getObjectByName(`steering-hose-${i}`)!.userData.route,
        r,
      ),
    );
  }
  m.update(0.2, {
    ...initialSteeringState,
    automatic: false,
    steering: 180,
    assist: false,
  });
  assert.equal(m.group.userData.direction, "off");
  assert.ok(m.group.getObjectByName("hydraulic-rack")!.position.x > 0);
  assert.equal(m.group.getObjectByName("assist-chamber-left")!.visible, false);
  assert.equal(hydraulicDirection(0, true), "neutral");
  assert.equal(hydraulicDirection(-10, true), "left");
  assert.equal(hydraulicDirection(10, true), "right");
  m.dispose();
});
test("movimento automático esterça nos dois sentidos e parada manual centraliza", () => {
  const m = buildSteeringModel();
  m.update(2, initialSteeringState);
  assert.ok(m.group.userData.wheel > 0);
  m.update(7, initialSteeringState);
  assert.ok(m.group.userData.wheel < 0);
  m.update(7, { ...initialSteeringState, automatic: false, steering: 0 });
  assert.equal(m.group.getObjectByName("hydraulic-rack")!.position.x, 0);
  assert.equal(m.group.userData.direction, "neutral");
  m.dispose();
});
test("HTML preserva nomes, controles e descrições sem WebGL", () => {
  const html = renderToStaticMarkup(createElement(SteeringExplorer));
  for (const p of steeringParts) assert.ok(html.includes(p.name), p.name);
  assert.ok(html.includes("Centralizar direção"));
  assert.ok(html.includes("Volante manual"));
  assert.ok(html.includes("Movimento automático"));
  assert.ok(html.includes('aria-live="polite"'));
  assert.equal((html.match(/type="range"/g) || []).length, 2);
});

test("enquadramento inicial comporta conjunto montado e explodido no celular e desktop", async () => {
  const { PerspectiveCamera, Box3, Vector3 } = await import("three");
  const { fitSteeringCamera } = await import("../src/lib/steering-renderer");
  const model = buildSteeringModel();
  for (const aspect of [350 / 540, 850 / 650]) {
    const camera = new PerspectiveCamera(40, aspect, 0.1, 60);
    camera.position.set(3, 4, 13);
    camera.lookAt(0, 1.4, 0);
    fitSteeringCamera(camera, aspect);
    camera.updateMatrixWorld();
    for (const explosion of [0, 1]) {
      model.update(0, { ...initialSteeringState, automatic: false, explosion });
      const bounds = new Box3().setFromObject(model.group);
      for (const x of [bounds.min.x, bounds.max.x])
        for (const y of [bounds.min.y, bounds.max.y])
          for (const z of [bounds.min.z, bounds.max.z]) {
            const p = new Vector3(x, y, z).project(camera);
            assert.ok(
              Math.abs(p.x) <= 1 && Math.abs(p.y) <= 1,
              JSON.stringify({ aspect, explosion, p }),
            );
          }
    }
  }
  model.dispose();
});
