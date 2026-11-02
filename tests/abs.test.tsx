import { test } from "node:test";
import assert from "node:assert/strict";
import { Mesh, Box3, Vector3, PerspectiveCamera } from "three";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { buildAbsModel } from "../src/lib/abs-model";
import { absParts, absCycle, initialAbsState } from "../src/lib/abs-parts";
import { AbsExplorer } from "../src/components/abs-explorer";
test("ABS identifica oito itens e três conjuntos contextuais com geometria finita", () => {
  const m = buildAbsModel();
  assert.equal(absParts.length, 11);
  for (const p of absParts) {
    const g = m.group.getObjectByName(`abs-part-${p.id}`)!;
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
  for (const explosion of [-1, 0, 0.5, 1, 2]) {
    m.update(0.1, { ...initialAbsState, explosion });
    m.group.traverse((o) =>
      assert.ok(o.matrixWorld.elements.every(Number.isFinite)),
    );
  }
  m.dispose();
});
test("válvulas de entrada e saída respeitam as três fases e nunca abrem juntas", () => {
  for (const time of [0.5, 1.5, 2.5]) {
    const c = absCycle(time, 1, "abs");
    assert.equal(c.inletOpen && c.outletOpen, false);
  }
  assert.equal(absCycle(0.5, 1, "abs").phase, "increase");
  assert.deepEqual(
    [absCycle(1.5, 1, "abs").inletOpen, absCycle(1.5, 1, "abs").outletOpen],
    [false, false],
  );
  assert.equal(absCycle(2.5, 1, "abs").outletOpen, true);
  assert.equal(absCycle(2.5, 1, "abs").pumpActive, true);
  assert.equal(absCycle(2.5, 0, "abs").phase, "idle");
  assert.equal(absCycle(2.5, 1, "normal").phase, "apply");
  assert.equal(absCycle(2.5, 1, "normal").pumpActive, false);
  const m = buildAbsModel();
  for (const time of [0.5, 1.5, 2.5]) {
    m.update(time, initialAbsState);
    const c = absCycle(time, 0.65, "abs");
    assert.equal(
      m.group.getObjectByName("abs-valve-0")!.userData.open,
      c.inletOpen,
    );
    assert.equal(
      m.group.getObjectByName("abs-valve-1")!.userData.open,
      c.outletOpen,
    );
    assert.equal(m.group.userData.pumpActive, c.pumpActive);
  }
  m.dispose();
});
test("quatro discos e anéis giram; sensores e pinças ficam sem rotação de roda", () => {
  const m = buildAbsModel();
  for (let time = 0.02; time < 1; time += 0.02) m.update(time, initialAbsState);
  for (let i = 0; i < 4; i++) {
    const rotor = m.group.getObjectByName(`abs-disc-${i}`)!,
      encoder = m.group.getObjectByName(`abs-encoder-${i}`)!;
    assert.ok(rotor.rotation.x > 0);
    assert.equal(encoder.rotation.x, rotor.rotation.x);
    assert.equal(m.group.getObjectByName(`abs-sensor-${i}`)!.rotation.x, 0);
    assert.equal(m.group.getObjectByName(`abs-caliper-${i}`)!.rotation.x, 0);
  }
  m.dispose();
});
test("canal da roda tem uma tubulação externa; redução e recirculação passam pelo modulador", () => {
  const m = buildAbsModel();
  for (const explosion of [0, 1]) {
    m.update(2.5, { ...initialAbsState, explosion });
    const routes: Mesh[] = [];
    m.group.traverse((o) => {
      if (o instanceof Mesh && o.name.startsWith("abs-route-")) routes.push(o);
    });
    assert.equal(routes.filter((r) => r.userData.kind === "wheel").length, 4);
    assert.equal(routes.filter((r) => r.userData.kind === "master").length, 2);
    assert.equal(routes.filter((r) => r.userData.kind === "release").length, 1);
    assert.equal(
      routes.filter((r) => r.userData.kind === "recirculate").length,
      1,
    );
    assert.equal(routes.filter((r) => r.userData.kind === "sensor").length, 4);
    const internal = routes.find((r) => r.userData.kind === "release")!;
    const first = new Vector3().fromBufferAttribute(
      internal.geometry.attributes.position,
      0,
    );
    assert.ok(
      first.distanceTo(m.group.getObjectByName("abs-part-3")!.position) < 1,
    );
  }
  m.dispose();
});
test("HTML oferece nomes, seleção e fases acessíveis antes de carregar WebGL", () => {
  const html = renderToStaticMarkup(createElement(AbsExplorer));
  for (const p of absParts) assert.ok(html.includes(p.name), p.name);
  for (const name of [
    "Aumentar pressão",
    "Manter pressão",
    "Reduzir pressão",
    "Frenagem convencional",
    "Soltar pedal",
  ])
    assert.ok(html.includes(name));
  assert.ok(html.includes('aria-live="polite"'));
  assert.equal((html.match(/type="range"/g) || []).length, 2);
});
test("enquadramento inicial contém cena montada e explodida em telas estreitas e largas", async () => {
  const { fitAbsCamera } = await import("../src/lib/abs-renderer");
  const m = buildAbsModel();
  for (const aspect of [350 / 510, 850 / 610]) {
    const c = new PerspectiveCamera(40, aspect, 0.1, 60);
    c.position.set(3, 4, 13);
    c.lookAt(0, 1, 0);
    fitAbsCamera(c, aspect);
    c.updateMatrixWorld();
    for (const explosion of [0, 1]) {
      m.update(0, { ...initialAbsState, explosion });
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
