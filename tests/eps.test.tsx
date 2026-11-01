import { test } from "node:test";
import assert from "node:assert/strict";
import { Mesh, Box3, Vector3, PerspectiveCamera } from "three";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { buildEpsModel } from "../src/lib/eps-model";
import { epsParts, initialEpsState } from "../src/lib/eps-parts";
import { steeringPose } from "../src/lib/steering-parts";
import { EpsExplorer } from "../src/components/eps-explorer";
import { SteeringExplorer } from "../src/components/steering-explorer";
test("EPS contém os 17 itens da referência e 2 contextuais, com geometria finita", () => {
  const m = buildEpsModel();
  assert.equal(epsParts.length, 19);
  for (const p of epsParts) {
    const root = m.group.getObjectByName(`eps-part-${p.id}`)!;
    assert.ok(root);
    let count = 0;
    root.traverse((o) => {
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
    for (const steering of [-500, 0, 500]) {
      m.update(0.1, {
        ...initialEpsState,
        explosion,
        automatic: false,
        steering,
      });
      m.group.traverse((o) =>
        assert.ok(o.matrixWorld.elements.every(Number.isFinite)),
      );
    }
  assert.equal(m.group.getObjectByName("steering-pump-pulley"), undefined);
  assert.equal(m.group.getObjectByName("assist-chamber-left"), undefined);
  m.dispose();
});
test("motor acompanha comando com assistência e vínculo mecânico permanece ao desativar", () => {
  const m = buildEpsModel();
  m.update(0.05, { ...initialEpsState, automatic: false, steering: 90 });
  const motor = m.group.getObjectByName("eps-motor-rotor")!,
    angle = motor.rotation.x;
  assert.ok(angle > 0);
  assert.equal(
    m.group.getObjectByName("eps-rack")!.position.x,
    steeringPose(90).rack,
  );
  m.update(0.1, {
    ...initialEpsState,
    automatic: false,
    steering: -90,
    assist: false,
  });
  assert.equal(motor.rotation.x, angle);
  assert.equal(
    m.group.getObjectByName("eps-rack")!.position.x,
    steeringPose(-90).rack,
  );
  assert.equal(m.group.userData.command, 0);
  for (const side of [-1, 1])
    assert.ok(m.group.getObjectByName(`disc-${side}`)!.rotation.y < 0);
  m.dispose();
});
test("sinais ligam sensor à ECU e ECU ao motor; cessam sem demanda", () => {
  const m = buildEpsModel();
  m.update(0.1, { ...initialEpsState, automatic: false, steering: 90 });
  assert.equal(
    m.group.getObjectByName("eps-signal-wire-0")!.userData.connection,
    "sensor-ecu",
  );
  assert.equal(
    m.group.getObjectByName("eps-signal-wire-1")!.userData.connection,
    "ecu-motor",
  );
  assert.equal(m.group.userData.command, 1);
  m.update(1, { ...initialEpsState, automatic: false, steering: 90 });
  assert.equal(m.group.userData.command, 0);
  m.dispose();
});
test("corte alterna cobertura do motor e abre janela nos enrolamentos", () => {
  const m = buildEpsModel();
  m.update(0, { ...initialEpsState, cutaway: false });
  assert.equal(m.group.getObjectByName("eps-motor-shell")!.visible, true);
  assert.equal(m.group.getObjectByName("eps-motor-cut")!.visible, false);
  m.update(0, initialEpsState);
  assert.equal(m.group.getObjectByName("eps-motor-shell")!.visible, false);
  let hidden = 0;
  m.group.traverse((o) => {
    if (o.name === "eps-winding" && !o.visible) hidden++;
  });
  assert.ok(hidden > 0);
  m.dispose();
});
test("acesso fica ao lado de Centralizar direção e página tem nomes e controles acessíveis", () => {
  const html = renderToStaticMarkup(createElement(SteeringExplorer));
  assert.ok(
    html.includes('href="/categorias/direcao-hidraulica-e-eletrica/eps"'),
  );
  assert.ok(
    html.indexOf("Explorar direção elétrica") >
      html.indexOf("Centralizar direção"),
  );
  const eps = renderToStaticMarkup(createElement(EpsExplorer));
  for (const p of epsParts) assert.ok(eps.includes(p.name), p.name);
  assert.ok(eps.includes("Corte do motor EPS"));
  assert.ok(eps.includes('aria-live="polite"'));
  assert.ok(!eps.includes("descubra o circuito\n            hidráulico"));
});
test("enquadramento inicial comporta EPS montado e explodido no celular e desktop", async () => {
  const { fitEpsCamera } = await import("../src/lib/eps-renderer");
  const m = buildEpsModel();
  for (const aspect of [350 / 540, 850 / 650]) {
    const c = new PerspectiveCamera(40, aspect, 0.1, 60);
    c.position.set(3, 4, 13);
    c.lookAt(0, 1.4, 0);
    fitEpsCamera(c, aspect);
    c.updateMatrixWorld();
    for (const explosion of [0, 1]) {
      m.update(0, { ...initialEpsState, automatic: false, explosion });
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
