import { test } from "node:test";
import assert from "node:assert/strict";
import { Mesh, MeshStandardMaterial } from "three";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { buildCompressorModel } from "../src/lib/compressor-model";
import {
  initialCompressorState,
  compressorParts,
  pistonPosition,
  pistonRadius,
  plateTilt,
} from "../src/lib/compressor-parts";
import { CompressorExplorer } from "../src/components/compressor-explorer";
import { HvacExplorer } from "../src/components/hvac-explorer";
test("16 identificações possuem malhas finitas, inclusive no corte e na explosão", () => {
  const model = buildCompressorModel();
  assert.equal(compressorParts.length, 16);
  for (const p of compressorParts) {
    const group = model.group.getObjectByName(`compressor-part-${p.id}`)!;
    assert.ok(group);
    let meshes = 0;
    group.traverse((o) => {
      if (o instanceof Mesh) {
        meshes++;
        assert.ok(
          Array.from(o.geometry.attributes.position.array).every(
            Number.isFinite,
          ),
        );
      }
    });
    assert.ok(meshes > 0, p.name);
  }
  for (const explosion of [-1, 0, 0.5, 1, 2]) {
    model.update(0.02, { ...initialCompressorState, explosion });
    model.group.traverse((o) =>
      assert.ok(o.matrixWorld.elements.every(Number.isFinite)),
    );
  }
  model.dispose();
});
test("pistões seguem o plano inclinado e pistões opostos trabalham em oposição", () => {
  for (let angle = 0; angle < Math.PI * 2; angle += 0.07) {
    for (let i = 0; i < 6; i++) {
      const phase = (i * Math.PI) / 3;
      const x = pistonPosition(angle, phase) - 0.5;
      const y = pistonRadius * Math.cos(phase),
        z = pistonRadius * Math.sin(phase);
      assert.ok(
        Math.abs(
          x - Math.tan(plateTilt) * (y * Math.cos(angle) + z * Math.sin(angle)),
        ) < 1e-10,
      );
      assert.ok(
        Math.abs(
          pistonPosition(angle, phase) +
            pistonPosition(angle, phase + Math.PI) -
            1,
        ) < 1e-10,
      );
    }
  }
  const model = buildCompressorModel();
  for (let t = 0.02; t < 2; t += 0.02) {
    model.update(t, initialCompressorState);
    const angle = model.group.getObjectByName("swash-plate")!.rotation.x;
    for (let i = 0; i < 6; i++)
      assert.ok(
        Math.abs(
          model.group.getObjectByName(`piston-${i}`)!.position.x -
            pistonPosition(angle, (i * Math.PI) / 3),
        ) < 1e-10,
      );
  }
  model.dispose();
});
test("desacoplamento mantém polia livre e congela eixo, placa e pistões", () => {
  const model = buildCompressorModel();
  model.update(0.05, initialCompressorState);
  const shaft = model.group.getObjectByName("swash-plate")!,
    pulley = model.group.getObjectByName("compressor-pulley")!,
    piston = model.group.getObjectByName("piston-0")!;
  const angle = shaft.rotation.x,
    rotation = pulley.rotation.x,
    x = piston.position.x;
  model.update(0.1, { ...initialCompressorState, engaged: false });
  assert.equal(shaft.rotation.x, angle);
  assert.equal(piston.position.x, x);
  assert.ok(pulley.rotation.x > rotation);
  assert.equal(model.group.getObjectByName("suction-flow")!.visible, false);
  const stopped = pulley.rotation.x;
  model.update(0.15, { ...initialCompressorState, speed: 0 });
  assert.equal(pulley.rotation.x, stopped);
  model.dispose();
});
test("corte alterna carcaça e seleção destaca só a peça escolhida", () => {
  const model = buildCompressorModel();
  model.update(0, { ...initialCompressorState, selected: 7 });
  assert.equal(model.group.getObjectByName("full-shell")!.visible, false);
  assert.equal(model.group.getObjectByName("cut-shell")!.visible, true);
  const material = (id: number) => {
    let result: MeshStandardMaterial | undefined;
    model.group.getObjectByName(`compressor-part-${id}`)!.traverse((o) => {
      if (o instanceof Mesh) result = o.material as MeshStandardMaterial;
    });
    return result!;
  };
  assert.ok(material(7).emissiveIntensity > material(1).emissiveIntensity);
  model.update(0, { ...initialCompressorState, cutaway: false });
  assert.equal(model.group.getObjectByName("full-shell")!.visible, true);
  model.dispose();
});
test("acesso ao compressor fica no módulo HVAC e página oferece nomes sem WebGL", () => {
  const hvac = renderToStaticMarkup(createElement(HvacExplorer));
  assert.ok(hvac.includes('href="/categorias/ar-condicionado/compressor"'));
  assert.ok(
    hvac.indexOf("Restaurar câmera") < hvac.indexOf("Explorar compressor"),
  );
  const html = renderToStaticMarkup(createElement(CompressorExplorer));
  for (const p of compressorParts) assert.ok(html.includes(p.name), p.name);
  assert.ok(html.includes("Corte em funcionamento"));
  assert.ok(html.includes('aria-live="polite"'));
  assert.ok(html.includes("Embreagem acoplada"));
});
