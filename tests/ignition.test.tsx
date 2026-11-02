import { test } from "node:test";
import assert from "node:assert/strict";
import { Mesh, PerspectiveCamera, Box3, Vector3 } from "three";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { buildIgnitionModel } from "../src/lib/ignition-model";
import {
  ignitionParts,
  initialIgnitionState,
  ignitionSequence,
} from "../src/lib/ignition-parts";
import { IgnitionExplorer } from "../src/components/ignition-explorer";
test("9 componentes da referência e 2 contextuais têm geometria finita", () => {
  const m = buildIgnitionModel();
  assert.equal(ignitionParts.length, 11);
  for (const p of ignitionParts) {
    const g = m.group.getObjectByName(`ignition-part-${p.id}`)!;
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
  for (const explosion of [-1, 0, 0.5, 1, 2])
    for (const time of [0, 1.5, 3.5, 4.5, 6, 9.5]) {
      m.update(time, { ...initialIgnitionState, explosion });
      m.group.traverse((o) =>
        assert.ok(o.matrixWorld.elements.every(Number.isFinite)),
      );
    }
  m.dispose();
});
test("partida requer autorização e desliga após o motor entrar em funcionamento", () => {
  const steps = [0.5, 1.5, 2.5, 3.5, 4.5, 6, 9.5].map((t) =>
    ignitionSequence(t, true),
  );
  assert.deepEqual(
    steps.map((s) => s.step),
    ["insert", "read", "validate", "authorize", "crank", "run", "off"],
  );
  assert.ok(steps.every((s) => !s.starter || s.authorized));
  assert.equal(steps[4].starter, true);
  assert.equal(steps[5].starter, false);
  assert.equal(steps[5].engine, true);
  assert.equal(steps[4].keyAngle, 0.8);
  assert.equal(steps[5].keyAngle, 0.42);
  assert.equal(steps[6].power, false);
});
test("chave não reconhecida não recebe autorização, mesmo com giro para START", () => {
  for (let t = 0; t < 10; t += 0.05) {
    const s = ignitionSequence(t, false);
    assert.equal(s.authorized, false);
    assert.equal(s.starter, false);
    assert.equal(s.engine, false);
    assert.equal(s.outputs, false);
  }
  assert.equal(ignitionSequence(4.5, false).keyAngle, 0.8);
  assert.equal(ignitionSequence(4.5, false).step, "blocked");
  const m = buildIgnitionModel();
  m.update(6, { ...initialIgnitionState, recognized: false });
  assert.equal(m.group.userData.engine, false);
  for (let i = 0; i < 4; i++)
    assert.equal(
      m.group.getObjectByName(`authorized-output-${i}`)!.visible,
      false,
    );
  m.dispose();
});
test("pinhão recua e partida para enquanto volante do motor continua", () => {
  const m = buildIgnitionModel();
  m.update(4.1, initialIgnitionState);
  m.update(4.15, initialIgnitionState);
  const starter = m.group.getObjectByName("ignition-starter-rotor")!,
    flywheel = m.group.getObjectByName("ignition-engine-flywheel")!,
    angle = starter.rotation.x;
  assert.equal(starter.position.x, 0.1);
  m.update(6, initialIgnitionState);
  assert.equal(starter.position.x, 0);
  assert.equal(starter.rotation.x, angle);
  const runningAngle = flywheel.rotation.x;
  m.update(6.05, initialIgnitionState);
  assert.ok(flywheel.rotation.x > runningAngle);
  m.dispose();
});
test("HTML mantém nomes, comparação de cenários e controle manual acessível", () => {
  const html = renderToStaticMarkup(createElement(IgnitionExplorer));
  for (const p of ignitionParts) assert.ok(html.includes(p.name), p.name);
  for (const label of [
    "Chave reconhecida",
    "Chave não reconhecida",
    "Recomeçar sequência",
    "Avançar etapa",
  ])
    assert.ok(html.includes(label));
  assert.ok(html.includes('aria-live="polite"'));
  assert.ok(html.includes("Em alguns veículos"));
});
test("enquadramento inicial contém montado e explodido no celular e desktop", async () => {
  const { fitIgnitionCamera } = await import("../src/lib/ignition-renderer");
  const m = buildIgnitionModel();
  for (const aspect of [350 / 510, 850 / 610]) {
    const c = new PerspectiveCamera(40, aspect, 0.1, 60);
    c.position.set(3, 4, 13);
    c.lookAt(0, 0.8, 0);
    fitIgnitionCamera(c, aspect);
    c.updateMatrixWorld();
    for (const explosion of [0, 1]) {
      m.update(4.5, { ...initialIgnitionState, explosion });
      const b = new Box3().setFromObject(m.group);
      for (const x of [b.min.x, b.max.x])
        for (const y of [b.min.y, b.max.y])
          for (const z of [b.min.z, b.max.z]) {
            const p = new Vector3(x, y, z).project(c);
            assert.ok(
              Math.abs(p.x) <= 1 && Math.abs(p.y) <= 1,
              JSON.stringify({ aspect, explosion, p }),
            );
          }
    }
  }
  m.dispose();
});
