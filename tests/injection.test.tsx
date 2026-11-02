import { test } from "node:test";
import assert from "node:assert/strict";
import { Mesh, PerspectiveCamera, Box3, Vector3 } from "three";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { buildInjectionModel } from "../src/lib/injection-model";
import {
  injectionParts,
  initialInjectionState,
  injectionCycle,
} from "../src/lib/injection-parts";
import { InjectionExplorer } from "../src/components/injection-explorer";
test("16 itens MPI e três contextuais possuem geometria finita", () => {
  const m = buildInjectionModel();
  assert.equal(injectionParts.length, 19);
  for (const p of injectionParts) {
    const g = m.group.getObjectByName(`injection-part-${p.id}`)!;
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
    for (const throttle of [-1, 0, 0.5, 1, 2]) {
      m.update(0.1, { ...initialInjectionState, explosion, throttle });
      m.group.traverse((o) =>
        assert.ok(o.matrixWorld.elements.every(Number.isFinite)),
      );
    }
  m.dispose();
});
test("injeção ocorre na admissão e centelha na sequência de ignição 1–3–4–2", () => {
  const order: number[] = [];
  for (let step = 0; step < 4; step++) {
    const states = injectionCycle(step * Math.PI + 0.02, 0.5, true);
    order.push(states.findIndex((s) => s.spark) + 1);
  }
  assert.deepEqual(order, [1, 3, 4, 2]);
  for (let angle = 0; angle < Math.PI * 4; angle += 0.03) {
    const states = injectionCycle(angle, 0.5, true);
    assert.ok(states.filter((s) => s.injecting).length <= 1);
    for (const s of states) {
      if (s.injecting) assert.equal(s.motion.stroke, 2);
      if (s.spark) assert.equal(s.motion.stroke, 0);
    }
  }
  assert.ok(
    injectionCycle(0.4 * Math.PI, 0.5, false).every(
      (s) => !s.injecting && !s.spark,
    ),
  );
});
test("borboleta abre, pistões se movem e desligamento conserva posição e apaga pulsos", () => {
  const m = buildInjectionModel();
  m.update(0.05, { ...initialInjectionState, throttle: 0 });
  const butterfly = m.group.getObjectByName("mpi-butterfly")!,
    piston = m.group.getObjectByName("mpi-piston-0")!,
    start = piston.position.y;
  assert.equal(butterfly.rotation.z, 0);
  m.update(0.1, { ...initialInjectionState, throttle: 1 });
  assert.ok(butterfly.rotation.z > 1);
  assert.notEqual(piston.position.y, start);
  const angle = m.group.userData.angle;
  m.update(0.2, { ...initialInjectionState, running: false });
  assert.equal(m.group.userData.angle, angle);
  assert.equal(m.group.userData.injector, 0);
  assert.equal(m.group.userData.spark, 0);
  for (let i = 0; i < 4; i++)
    assert.equal(m.group.getObjectByName(`mpi-spray-${i}`)!.visible, false);
  m.dispose();
});
test("combustível alimenta flauta, regulador retorna à bomba e EVAP tem caminho separado", () => {
  const m = buildInjectionModel();
  for (const explosion of [0, 1]) {
    m.update(0.1, { ...initialInjectionState, explosion });
    const routes: Mesh[] = [];
    m.group.traverse((o) => {
      if (o instanceof Mesh && o.name.startsWith("mpi-route-")) routes.push(o);
    });
    const find = (from: number, to: number, kind: string) =>
      routes.find(
        (r) =>
          r.userData.kind === kind &&
          r.userData.route[0] === from &&
          r.userData.route[1] === to,
      );
    assert.ok(find(1, 2, "fuel"));
    assert.ok(find(2, 4, "fuel"));
    assert.ok(find(4, 3, "fuel"));
    assert.ok(find(3, 1, "fuel"));
    assert.ok(find(16, 12, "vapor"));
    assert.ok(find(12, 17, "vapor"));
    assert.ok(find(6, 9, "air"));
    assert.ok(find(9, 17, "air"));
    assert.equal(
      routes.filter((r) => r.userData.cylinder !== undefined).length,
      4,
    );
    assert.ok(find(19, 11, "signal"));
    assert.ok(find(11, 14, "signal"));
  }
  m.dispose();
});
test("painel HTML mantém peças, pulsos acessíveis e distinção MPI e ignição", () => {
  const html = renderToStaticMarkup(createElement(InjectionExplorer));
  for (const p of injectionParts) assert.ok(html.includes(p.name), p.name);
  assert.ok(html.includes("INJEÇÃO MULTIPONTO"));
  assert.ok(html.includes("borboleta mecânica"));
  assert.ok(html.includes("Injetor aguardando"));
  assert.ok(html.includes('aria-live="polite"'));
  assert.equal((html.match(/type="range"/g) || []).length, 2);
});
test("enquadramento inicial contém conjunto montado e explodido em celular e desktop", async () => {
  const { fitInjectionCamera } = await import("../src/lib/injection-renderer");
  const m = buildInjectionModel();
  for (const aspect of [350 / 540, 850 / 650]) {
    const c = new PerspectiveCamera(40, aspect, 0.1, 60);
    c.position.set(3, 4, 13);
    c.lookAt(0, 0.8, 0);
    fitInjectionCamera(c, aspect);
    c.updateMatrixWorld();
    for (const explosion of [0, 1]) {
      m.update(0, { ...initialInjectionState, explosion });
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
