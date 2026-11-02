import { test } from "node:test";
import assert from "node:assert/strict";
import { Mesh, Box3, Vector3, PerspectiveCamera } from "three";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { buildCopModel } from "../src/lib/cop-model";
import { copParts, copCycle, initialCopState } from "../src/lib/cop-parts";
import { CopExplorer } from "../src/components/cop-explorer";
import { IgnitionExplorer } from "../src/components/ignition-explorer";
test("14 grupos COP têm geometria finita em todas as separações", () => {
  const m = buildCopModel();
  assert.equal(copParts.length, 14);
  for (const p of copParts) {
    const g = m.group.getObjectByName(`cop-part-${p.id}`)!;
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
    assert.ok(n);
  }
  for (const explosion of [0, 0.5, 1]) {
    m.update(0.1, { ...initialCopState, explosion });
    m.group.traverse((o) =>
      assert.ok(o.matrixWorld.elements.every(Number.isFinite)),
    );
  }
  m.dispose();
});
test("carga precede centelha e ignição segue ordem 1–3–4–2", () => {
  const order: number[] = [];
  for (let step = 0; step < 4; step++) {
    const angle = step * Math.PI;
    const spark = copCycle(angle + 0.02, true).findIndex((c) => c.spark);
    order.push(spark + 1);
    assert.equal(copCycle(angle - 0.1, true)[spark].charging, true);
  }
  assert.deepEqual(order, [1, 3, 4, 2]);
  for (let a = 0; a < Math.PI * 4; a += 0.03)
    for (const c of copCycle(a, true))
      assert.equal(c.charging && c.spark, false);
});
test("corte alterna cobertura e desligamento interrompe carga e centelha", () => {
  const m = buildCopModel();
  m.update(0.1, initialCopState);
  assert.equal(m.group.getObjectByName("cop-full-shell")!.visible, false);
  assert.equal(m.group.getObjectByName("cop-cut-shell")!.visible, true);
  const angle = m.group.userData.angle;
  m.update(0.2, { ...initialCopState, running: false, cutaway: false });
  assert.equal(m.group.userData.angle, angle);
  assert.equal(m.group.userData.phase, "off");
  for (let i = 0; i < 4; i++)
    assert.equal(m.group.getObjectByName(`cop-spark-${i}`)!.visible, false);
  assert.equal(m.group.getObjectByName("cop-full-shell")!.visible, true);
  m.dispose();
});
test("botão abre módulo atual e HTML apresenta componentes e controles acessíveis", () => {
  const old = renderToStaticMarkup(createElement(IgnitionExplorer));
  assert.ok(old.includes('href="/categorias/ignicao/atual"'));
  assert.ok(
    old.indexOf("Explorar ignição atual") > old.indexOf("Restaurar câmera"),
  );
  const html = renderToStaticMarkup(createElement(CopExplorer));
  for (const p of copParts) assert.ok(html.includes(p.name));
  assert.ok(html.includes("Bobina em corte"));
  assert.ok(html.includes('aria-live="polite"'));
});
test("enquadramento comporta COP montado e explodido no celular e desktop", async () => {
  const { fitCopCamera } = await import("../src/lib/cop-renderer");
  const m = buildCopModel();
  for (const aspect of [350 / 540, 850 / 650]) {
    const c = new PerspectiveCamera(40, aspect, 0.1, 60);
    c.position.set(3, 4, 13);
    c.lookAt(0, 1.1, 0);
    fitCopCamera(c, aspect);
    c.updateMatrixWorld();
    for (const explosion of [0, 1]) {
      m.update(0, { ...initialCopState, explosion });
      const b = new Box3().setFromObject(m.group);
      for (const x of [b.min.x, b.max.x])
        for (const y of [b.min.y, b.max.y])
          for (const z of [b.min.z, b.max.z]) {
            const p = new Vector3(x, y, z).project(c);
            assert.ok(Math.abs(p.x) <= 1 && Math.abs(p.y) <= 1);
          }
    }
  }
  m.dispose();
});
