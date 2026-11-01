import { test } from "node:test";
import assert from "node:assert/strict";
import { Mesh } from "three";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { buildHvacModel } from "../src/lib/hvac-model";
import { hvacParts, initialHvacState } from "../src/lib/hvac-parts";
import { HvacExplorer } from "../src/components/hvac-explorer";
test("13 componentes nomeados e geometria finita em todos os estados", () => {
  const model = buildHvacModel();
  assert.equal(hvacParts.length, 13);
  for (const p of hvacParts) {
    const g = model.group.getObjectByName(`hvac-part-${p.id}`)!;
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
    assert.ok(count, p.name);
  }
  for (const explosion of [-1, 0, 0.5, 1, 2]) {
    model.update(3, { ...initialHvacState, explosion });
    model.group.traverse((o) =>
      assert.ok(o.matrixWorld.elements.every(Number.isFinite)),
    );
  }
  model.dispose();
});
test("circuito forma ciclo fechado e mangueiras acompanham explosão", () => {
  const model = buildHvacModel();
  const expected = [
    [1, 2],
    [2, 4],
    [4, 5],
    [5, 6],
    [6, 1],
  ];
  for (const explosion of [0, 1]) {
    model.update(1, { ...initialHvacState, explosion });
    expected.forEach(([from, to], i) => {
      const line = model.group.getObjectByName(`refrigerant-line-${i}`) as Mesh;
      assert.deepEqual(line.userData.route, [from, to]);
      const pos = line.geometry.attributes.position;
      assert.ok(pos.count > 10);
      const a = model.group.getObjectByName(`hvac-part-${from}`)!.position,
        b = model.group.getObjectByName(`hvac-part-${to}`)!.position;
      line.geometry.computeBoundingBox();
      assert.ok(line.geometry.boundingBox!.distanceToPoint(a) < 0.1);
      assert.ok(line.geometry.boundingBox!.distanceToPoint(b) < 0.1);
    });
  }
  model.dispose();
});
test("desligar A/C interrompe indicação do refrigerante e ventilação zero oculta ar", () => {
  const model = buildHvacModel();
  model.update(2, { ...initialHvacState, cooling: false, speed: 0 });
  assert.equal(model.group.getObjectByName("compressor-pulley")!.rotation.z, 0);
  assert.equal(model.group.getObjectByName("condenser-fan")!.rotation.z, 0);
  assert.equal(model.group.getObjectByName("cabin-blower")!.rotation.z, 0);
  model.group.traverse((o) => {
    if (o.name === "airflow") assert.equal(o.visible, false);
  });
  model.update(2, initialHvacState);
  assert.notEqual(model.group.getObjectByName("cabin-blower")!.rotation.z, 0);
  model.dispose();
});
test("HTML oferece descrições e controles sem depender de WebGL", () => {
  const html = renderToStaticMarkup(createElement(HvacExplorer));
  for (const p of hvacParts) assert.ok(html.includes(p.name), p.name);
  assert.ok(html.includes("Vista explodida"));
  assert.ok(html.includes('aria-live="polite"'));
  assert.ok(html.includes("os dois fluxos não se misturam"));
  assert.equal((html.match(/type="range"/g) || []).length, 2);
});
