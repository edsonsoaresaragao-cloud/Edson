import { test } from "node:test";
import assert from "node:assert/strict";
import { Mesh, MeshStandardMaterial } from "three";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { buildAlternatorModel } from "../src/lib/alternator-model";
import {
  alternatorParts,
  initialAlternatorState,
} from "../src/lib/alternator-parts";
import { AlternatorExplorer } from "../src/components/alternator-explorer";
test("16 itens da referência possuem malhas finitas e distintas", () => {
  const m = buildAlternatorModel();
  assert.deepEqual(
    alternatorParts.map((p) => p.id),
    Array.from({ length: 16 }, (_, i) => i + 1),
  );
  for (const p of alternatorParts) {
    const g = m.group.getObjectByName(`alternator-part-${p.id}`)!;
    assert.ok(g);
    let n = 0;
    g.traverse((o) => {
      if (o instanceof Mesh) {
        n++;
        assert.ok(
          Array.from(o.geometry.attributes.position.array).every(
            Number.isFinite,
          ),
        );
      }
    });
    assert.ok(n > 0, p.name);
  }
  for (const explosion of [-1, 0, 0.5, 1, 2]) {
    m.update(0.02, { ...initialAlternatorState, explosion });
    m.group.traverse((o) =>
      assert.ok(o.matrixWorld.elements.every(Number.isFinite)),
    );
  }
  m.dispose();
});
test("rotor, polia e ventoinha giram juntos; estator, escovas e carcaças ficam fixos", () => {
  const m = buildAlternatorModel();
  for (let t = 0.02; t < 1; t += 0.02) m.update(t, initialAlternatorState);
  const angle = m.group.getObjectByName("alternator-part-5")!.rotation.x;
  assert.ok(angle > 0);
  for (const id of [1, 2, 15])
    assert.equal(
      m.group.getObjectByName(`alternator-part-${id}`)!.rotation.x,
      angle,
    );
  for (const id of [4, 6, 7, 8, 9, 11])
    assert.equal(
      m.group.getObjectByName(`alternator-part-${id}`)!.rotation.x,
      0,
    );
  m.update(1, { ...initialAlternatorState, speed: 0 });
  assert.equal(m.group.getObjectByName("alternator-part-5")!.rotation.x, angle);
  m.dispose();
});
test("excitação controla a indicação elétrica sem parar a rotação mecânica", () => {
  const m = buildAlternatorModel();
  m.update(0.05, initialAlternatorState);
  const rotor = m.group.getObjectByName("alternator-part-5")!,
    angle = rotor.rotation.x;
  const flow = m.group.getObjectByName("electrical-flow")!;
  assert.ok(flow.children.every((p) => p.visible));
  m.update(0.1, { ...initialAlternatorState, excited: false });
  assert.ok(rotor.rotation.x > angle);
  assert.ok(flow.children.every((p) => !p.visible));
  m.update(0.15, { ...initialAlternatorState, speed: 0 });
  assert.ok(flow.children.every((p) => !p.visible));
  m.dispose();
});
test("corte revela interior e destaque não altera material de outros itens", () => {
  const m = buildAlternatorModel();
  m.update(0, { ...initialAlternatorState, cutaway: false });
  let visible = 0;
  m.group.traverse((o) => {
    if (o instanceof Mesh && o.visible) visible++;
  });
  m.update(0, { ...initialAlternatorState, cutaway: true, selected: 6 });
  let hidden = 0;
  m.group.traverse((o) => {
    if (!o.visible) hidden++;
  });
  assert.ok(hidden > 0);
  assert.ok(visible > hidden);
  const colors = (id: number) => {
    const values: number[] = [];
    m.group.getObjectByName(`alternator-part-${id}`)!.traverse((o) => {
      if (o instanceof Mesh)
        values.push((o.material as MeshStandardMaterial).emissive.getHex());
    });
    return values;
  };
  assert.ok(colors(6).every((c) => c !== 0));
  assert.ok(colors(5).every((c) => c === 0));
  m.dispose();
});
test("HTML oferece as 16 peças e interação acessível antes do WebGL", () => {
  const html = renderToStaticMarkup(createElement(AlternatorExplorer));
  for (const p of alternatorParts) assert.ok(html.includes(p.name), p.name);
  assert.ok(html.includes("Corte em funcionamento"));
  assert.ok(html.includes("Vista explodida"));
  assert.ok(html.includes('aria-live="polite"'));
  assert.ok(html.includes("Campo de excitação"));
  assert.equal((html.match(/type="range"/g) || []).length, 2);
});
