import { test } from "node:test";
import assert from "node:assert/strict";
import { Mesh, Vector3 } from "three";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { buildCoolingModel } from "../src/lib/cooling-model";
import {
  coolingParts,
  initialCoolingState,
  coolingFlow,
} from "../src/lib/cooling-parts";
import { CoolingExplorer } from "../src/components/cooling-explorer";
test("15 componentes e contexto possuem geometria finita em todas as separações", () => {
  const m = buildCoolingModel();
  assert.equal(coolingParts.length, 16);
  for (const part of coolingParts) {
    const g = m.group.getObjectByName(`cooling-part-${part.id}`)!;
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
    assert.ok(count > 0, part.name);
  }
  for (const explosion of [-1, 0, 0.5, 1, 2]) {
    m.update(0.1, { ...initialCoolingState, explosion });
    m.group.traverse((o) =>
      assert.ok(o.matrixWorld.elements.every(Number.isFinite)),
    );
  }
  m.dispose();
});
test("termostato divide fluxo sem interromper o circuito interno e aquecedor", () => {
  assert.deepEqual(coolingFlow(0, 1), {
    radiator: 0,
    bypass: 1,
    heater: 1,
    engine: 1,
  });
  assert.deepEqual(coolingFlow(1, 1), {
    radiator: 1,
    bypass: 0,
    heater: 1,
    engine: 1,
  });
  for (const opening of [0, 0.3, 0.7, 1]) {
    const f = coolingFlow(opening, 0.6);
    assert.ok(Math.abs(f.radiator + f.bypass - 0.6) < 1e-10);
  }
  assert.deepEqual(coolingFlow(2, -1), {
    radiator: 0,
    bypass: 0,
    heater: 0,
    engine: 0,
  });
  const m = buildCoolingModel();
  for (const opening of [0, 1]) {
    m.update(0.1, { ...initialCoolingState, opening });
    assert.equal(
      m.group.getObjectByName("coolant-route-0")!.userData.flowAmount,
      opening * 0.6,
    );
    assert.equal(
      m.group.getObjectByName("coolant-route-6")!.userData.flowAmount,
      (1 - opening) * 0.6,
    );
  }
  m.dispose();
});
test("mangueira superior acompanha as conexões na explosão", () => {
  const m = buildCoolingModel();
  for (const explosion of [0, 0.4, 1]) {
    m.update(0.1, { ...initialCoolingState, explosion });
    const hose = m.group.getObjectByName("coolant-route-0") as Mesh;
    const position = hose.geometry.attributes.position;
    const average = (offset: number) => {
      const v = new Vector3();
      for (let i = 0; i < 10; i++)
        v.add(new Vector3().fromBufferAttribute(position, offset + i));
      return hose.localToWorld(v.divideScalar(10));
    };
    const a = m.group
        .getObjectByName("cooling-part-5")!
        .position.clone()
        .add(new Vector3(-0.25, 0, 0)),
      b = m.group
        .getObjectByName("cooling-part-1")!
        .position.clone()
        .add(new Vector3(0.5, 0.6, 0));
    assert.ok(average(0).distanceTo(a) < 0.02);
    assert.ok(average(56 * 11).distanceTo(b) < 0.02);
  }
  m.dispose();
});
test("válvula abre e bomba gira mesmo com ventoinha desligada", () => {
  const m = buildCoolingModel();
  m.update(0.02, { ...initialCoolingState, opening: 0 });
  const valve = m.group.getObjectByName("thermostat-valve")!,
    y = valve.position.y,
    pump = m.group.getObjectByName("water-pump-impeller")!,
    fan = m.group.getObjectByName("radiator-fan")!;
  const p = pump.rotation.z,
    f = fan.rotation.z;
  m.update(0.04, { ...initialCoolingState, opening: 1, fan: false });
  assert.ok(valve.position.y > y);
  assert.ok(pump.rotation.z > p);
  assert.equal(fan.rotation.z, f);
  m.dispose();
});
test("HTML disponibiliza nomes, estados frio/aquecido e detalhes sem WebGL", () => {
  const html = renderToStaticMarkup(createElement(CoolingExplorer));
  for (const part of coolingParts)
    assert.ok(html.includes(part.name), part.name);
  assert.ok(html.includes("Motor frio"));
  assert.ok(html.includes("Motor aquecido"));
  assert.ok(html.includes("Bomba e impulsor"));
  assert.ok(html.includes("Termostato e mola"));
  assert.ok(html.includes('aria-live="polite"'));
  assert.equal((html.match(/type="range"/g) || []).length, 3);
});
