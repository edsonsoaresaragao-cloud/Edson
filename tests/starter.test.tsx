import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Mesh, MeshStandardMaterial, BufferGeometry, Material } from "three";
import { buildStarterModel } from "../src/lib/starter-model";
import {
  starterParts,
  initialStarterState,
  starterSequence,
} from "../src/lib/starter-parts";
import { StarterExplorer } from "../src/components/starter-explorer";
const assembled = { ...initialStarterState, explosion: 0 };

test("as 11 peças da referência têm geometria própria, finita e selecionável", () => {
  const model = buildStarterModel();
  assert.deepEqual(
    starterParts.map((part) => part.id),
    Array.from({ length: 11 }, (_, i) => i + 1),
  );
  for (const part of starterParts) {
    const node = model.group.getObjectByName(`starter-part-${part.id}`)!;
    assert.equal(node.userData.part, part.id);
    let meshes = 0;
    node.traverse((object) => {
      if (object instanceof Mesh) {
        meshes++;
        assert.ok(
          Array.from(object.geometry.attributes.position.array).every(
            Number.isFinite,
          ),
        );
      }
    });
    assert.ok(meshes > 0, part.name);
  }
  for (const explosion of [-1, 0, 0.5, 1, 2]) {
    model.update(1, { ...assembled, explosion });
    model.group.traverse((object) =>
      assert.ok(object.matrixWorld.elements.every(Number.isFinite)),
    );
  }
  model.dispose();
});

test("contato de potência e torque só aparecem após o avanço completo do pinhão", () => {
  for (let time = 0; time < 13; time += 0.025) {
    const sequence = starterSequence(time);
    if (sequence.motor) {
      assert.equal(sequence.contact, true);
      assert.ok(sequence.travel > 0.99);
      assert.equal(sequence.engaged, true);
    }
    if (sequence.overrun) {
      assert.equal(sequence.motor, false);
      assert.equal(sequence.engine, true);
      assert.equal(sequence.command, false);
    }
    assert.ok(sequence.travel >= 0 && sequence.travel <= 1);
  }
});

test("pinhão avança, êmbolo recolhe no solenoide e garfo articula, depois retornam", () => {
  const model = buildStarterModel();
  model.update(0, assembled);
  const rest = model.parts[1].position.x;
  model.update(6, assembled);
  assert.ok(model.parts[1].position.x < rest - 0.3);
  assert.ok(
    model.group.getObjectByName("starter-solenoid-plunger")!.position.x > 0.15,
  );
  assert.ok(model.parts[3].rotation.z < -0.2);
  model.update(12.9, assembled);
  assert.ok(Math.abs(model.parts[1].position.x - rest) < 0.001);
  assert.ok(Math.abs(model.parts[3].rotation.z) < 0.001);
  model.dispose();
});

test("acionamento direto mantém pinhão e induzido na mesma velocidade; campo e escovas ficam fixos", () => {
  const model = buildStarterModel();
  model.update(5.3, assembled);
  const before = { ...model.group.userData.sequence };
  model.update(5.35, assembled);
  const after = model.group.userData.sequence;
  const rotor = after.rotorAngle - before.rotorAngle,
    pinion = after.pinionAngle - before.pinionAngle,
    wheel = after.wheelAngle - before.wheelAngle;
  assert.ok(rotor > 0);
  assert.ok(Math.abs(pinion - rotor) < 1e-9);
  assert.ok(Math.abs(wheel + pinion / 9) < 1e-9);
  for (const id of [6, 8, 9, 10, 11])
    assert.equal(model.parts[id - 1].rotation.x, 0);
  model.dispose();
});

test("roda livre permite sobrevelocidade sem arrastar o induzido e a coroa continua após o retorno", () => {
  const model = buildStarterModel();
  model.update(8, assembled);
  const before = { ...model.group.userData.sequence };
  model.update(8.05, assembled);
  const after = { ...model.group.userData.sequence };
  assert.ok(
    after.pinionAngle - before.pinionAngle >
      (after.rotorAngle - before.rotorAngle) * 5,
  );
  assert.equal(after.contact, false);
  model.update(12, assembled);
  const wheel = model.group.userData.sequence.wheelAngle;
  model.update(12.05, assembled);
  assert.ok(model.group.userData.sequence.wheelAngle < wheel);
  assert.equal(model.group.userData.sequence.engaged, false);
  model.dispose();
});

test("corte e isolamento revelam somente a peça escolhida sem alterar materiais vizinhos", () => {
  const model = buildStarterModel();
  model.update(0, { ...assembled, cutaway: false });
  assert.equal(
    model.group.getObjectByName("starter-housing-cut-panel")!.visible,
    true,
  );
  model.update(0, { ...assembled, cutaway: true, isolate: true, selected: 7 });
  assert.equal(
    model.group.getObjectByName("starter-housing-cut-panel")!.visible,
    false,
  );
  assert.deepEqual(
    model.parts
      .filter((part) => part.visible)
      .map((part) => part.userData.part),
    [7],
  );
  assert.equal(
    model.group.getObjectByName("starter-flywheel-context")!.visible,
    false,
  );
  for (const id of [6, 7])
    model.parts[id - 1].traverse((object) => {
      if (object instanceof Mesh)
        assert.equal(
          (object.material as MeshStandardMaterial).emissive.getHex() !== 0,
          id === 7,
        );
    });
  model.dispose();
});

test("pausa por tempo constante e velocidade zero não criam giro adicional", () => {
  const model = buildStarterModel();
  model.update(6, assembled);
  const angle = model.parts[6].rotation.x;
  model.update(6, assembled);
  assert.equal(model.parts[6].rotation.x, angle);
  model.update(6.1, { ...assembled, speed: 0 });
  assert.equal(model.parts[6].rotation.x, angle);
  model.dispose();
});

test("desmontagem libera geometrias e materiais usados pelo modelo", () => {
  const model = buildStarterModel(),
    geometries = new Set<BufferGeometry>(),
    materials = new Set<Material>();
  model.group.traverse((object) => {
    if (object instanceof Mesh) {
      geometries.add(object.geometry);
      for (const material of Array.isArray(object.material)
        ? object.material
        : [object.material])
        materials.add(material);
    }
  });
  let disposedGeometry = 0,
    disposedMaterial = 0;
  geometries.forEach((geometry) =>
    geometry.addEventListener("dispose", () => disposedGeometry++),
  );
  materials.forEach((material) =>
    material.addEventListener("dispose", () => disposedMaterial++),
  );
  model.dispose();
  assert.equal(disposedGeometry, geometries.size);
  assert.equal(disposedMaterial, materials.size);
});

test("HTML inicial entrega 11 nomes com imagens, controles, sequência e valores contextualizados", () => {
  const markup = renderToStaticMarkup(createElement(StarterExplorer));
  for (const part of starterParts)
    assert.ok(markup.includes(part.name), part.name);
  assert.equal(
    (markup.match(/class="starter-list-picture"/g) || []).length,
    11,
  );
  assert.match(markup, /Vista explodida/);
  assert.match(markup, /Isolar peça selecionada/);
  assert.match(markup, /Ilustração didática gerada/);
  assert.match(markup, /não é um limite universal/i);
  assert.match(markup, /não uma especificação/);
  assert.match(markup, /Embreagem de roda livre/);
  assert.match(markup, /Principais falhas e sintomas/);
});
