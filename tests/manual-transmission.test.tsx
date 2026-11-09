import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Mesh, Box3, Vector3, PerspectiveCamera } from "three";
import { buildManualTransmissionModel } from "../src/lib/manual-transmission-model";
import { helicalGearGeometry } from "../src/lib/transmission-geometry";
import {
  transmissionParts,
  transmissionGearPairs,
  transmissionGears,
  initialTransmissionState,
  transmissionKinematics,
  transmissionRatio,
  transmissionSliderTargets,
  transmissionModule,
  transmissionAxisDistance,
} from "../src/lib/manual-transmission-parts";
import { manualTransmissionParts } from "../src/lib/manual-transmission-reference-catalog";
import { fitTransmissionCamera } from "../src/lib/manual-transmission-renderer";
import { ManualTransmissionExplorer } from "../src/components/manual-transmission-explorer";

test("a caixa preserva 13 identificações e três contextos com geometria finita", () => {
  assert.deepEqual(
    transmissionParts
      .slice(0, 13)
      .map((part) => [part.id, part.name, part.imageCell]),
    manualTransmissionParts.map((part) => [
      part.number,
      part.name,
      part.imageCell,
    ]),
  );
  assert.deepEqual(
    transmissionParts
      .slice(13)
      .map((part) => [part.id, part.kind, part.imageCell]),
    [
      [14, "context", 16],
      [15, "context", 17],
      [16, "context", 18],
    ],
  );
  const model = buildManualTransmissionModel();
  for (const part of transmissionParts) {
    const object = model.group.getObjectByName(`transmission-part-${part.id}`)!;
    let count = 0;
    object.traverse((child) => {
      if (child instanceof Mesh) {
        count++;
        assert.ok(
          Array.from(child.geometry.getAttribute("position").array).every(
            Number.isFinite,
          ),
        );
      }
    });
    assert.ok(count > 0, part.name);
  }
  for (const explosion of [-1, 0, 0.5, 1, 2])
    for (const gear of transmissionGears) {
      model.update(1, { ...initialTransmissionState, explosion, gear }, false);
      model.group.traverse((object) =>
        assert.ok(object.matrixWorld.elements.every(Number.isFinite)),
      );
    }
  model.dispose();
});

test("engrenagens possuem dentes involutos helicoidais e furo real sem cruzar o cubo", () => {
  for (const [teeth, module, width, bore] of [
    [18, transmissionModule, 0.23, 0.14],
    [42, transmissionModule, 0.23, 0.155],
    [90, 0.023, 0.1, 1],
  ]) {
    const geometry = helicalGearGeometry(teeth, module, width, bore);
    const points = geometry.getAttribute("position");
    const radii = Array.from({ length: teeth * 10 }, (_, i) =>
      Math.hypot(points.getY(i), points.getZ(i)),
    );
    assert.ok(Math.max(...radii) - Math.min(...radii) > module);
    assert.ok(Math.min(...radii) > bore);
    assert.ok(Math.max(...radii) <= (teeth * module) / 2 + module + 1e-6);
    assert.ok(
      Array.from(geometry.getAttribute("normal").array).every(Number.isFinite),
    );
    const left = Math.atan2(points.getZ(4), points.getY(4));
    const right = Math.atan2(
      points.getZ(3 * teeth * 20 + 4),
      points.getY(3 * teeth * 20 + 4),
    );
    assert.notEqual(left, right);
    assert.equal(geometry.userData.teeth, teeth);
    geometry.dispose();
  }
});

test("dentes, distância entre eixos e relações concordam, com 4ª direta e ré inversa", () => {
  for (const pair of transmissionGearPairs) {
    assert.equal(pair.counterTeeth + pair.outputTeeth, 60);
    assert.ok(
      Math.abs(
        ((pair.counterTeeth + pair.outputTeeth) * transmissionModule) / 2 -
          transmissionAxisDistance,
      ) < 1e-10,
    );
  }
  assert.equal(transmissionRatio("N"), null);
  assert.equal(transmissionRatio("1"), 3.5);
  assert.ok(Math.abs(transmissionRatio("2")! - 2.1) < 1e-10);
  assert.equal(transmissionRatio("4"), 1);
  assert.ok(transmissionRatio("5")! < 1);
  assert.equal(transmissionRatio("R"), -3);
  for (const gear of transmissionGears) {
    const motion = transmissionKinematics({
      ...initialTransmissionState,
      gear,
    });
    assert.equal(motion.counter, (-motion.input * 24) / 36);
    if (gear === "N") assert.equal(motion.output, 0);
    else
      assert.ok(
        Math.abs(motion.input / motion.output - transmissionRatio(gear)!) <
          1e-10,
      );
  }
});

test("neutro mantém engrenagens livres, embreagem interrompe acionamento e pausa conserva ângulos", () => {
  const model = buildManualTransmissionModel();
  const state = { ...initialTransmissionState, gear: "N" as const };
  model.update(0.2, state);
  assert.ok(model.group.userData.motion.inputAngle > 0);
  assert.equal(model.group.userData.motion.outputAngle, 0);
  assert.ok(
    model.gearNodes.every(
      (entry) => entry.upper.rotation.x > 0 && entry.lower.rotation.x < 0,
    ),
  );
  model.update(0.2, { ...state, gear: "1" });
  assert.ok(model.group.userData.motion.outputAngle > 0);
  const before = { ...model.group.userData.motion };
  model.update(0.2, { ...state, gear: "R", clutchEngaged: false });
  assert.equal(model.group.userData.motion.inputAngle, before.inputAngle);
  assert.equal(model.group.userData.motion.outputAngle, before.outputAngle);
  assert.ok(model.group.userData.motion.engineAngle > before.engineAngle);
  model.update(0, { ...state, gear: "R" });
  assert.equal(model.group.userData.motion.outputAngle, before.outputAngle);
  model.update(0.2, { ...state, gear: "R" });
  assert.ok(model.group.userData.motion.outputAngle < before.outputAngle);
  const paused = { ...model.group.userData.motion };
  model.update(0.2, { ...state, gear: "4" }, false);
  assert.equal(model.group.userData.motion.inputAngle, paused.inputAngle);
  assert.equal(model.group.userData.motion.outputAngle, paused.outputAngle);
  assert.equal(model.group.userData.motion.engineAngle, paused.engineAngle);
  model.dispose();
});

test("garfo, luva e haste se deslocam juntos e a ré usa intermediária sem ligar o tambor alternativo", () => {
  const model = buildManualTransmissionModel();
  const drum = model.group.getObjectByName("transmission-alternative-drum")!;
  const drumAngle = drum.rotation.x;
  for (const gear of transmissionGears) {
    model.update(1, { ...initialTransmissionState, gear }, false);
    const targets = transmissionSliderTargets(gear);
    assert.ok(targets.filter((v) => v !== 0).length <= 1);
    for (let i = 0; i < 3; i++) {
      const sleeve = model.group.getObjectByName(`transmission-sleeve-${i}`)!;
      const fork = model.group.getObjectByName(`transmission-fork-${i}`)!;
      const rail = model.group.getObjectByName(
        `transmission-selector-rail-${i}`,
      )!;
      assert.equal(sleeve.position.x, fork.position.x);
      assert.ok(Math.abs(rail.position.x - 0.35 - targets[i]) < 2e-5);
    }
    assert.equal(drum.rotation.x, drumAngle);
  }
  model.update(1, { ...initialTransmissionState, gear: "R" }, false);
  assert.ok(Math.abs(model.reverseIdler.position.x - 2.65) < 1e-5);
  assert.ok(
    Math.abs(
      Math.hypot(model.idlerY + transmissionAxisDistance, model.idlerZ) -
        ((18 + 16) * transmissionModule) / 2,
    ) < 1e-10,
  );
  assert.ok(
    Math.abs(
      Math.hypot(model.idlerY, model.idlerZ) -
        ((36 + 16) * transmissionModule) / 2,
    ) < 1e-10,
  );
  assert.ok(
    ((18 + 36) * transmissionModule) / 2 + transmissionModule * 2 <
      transmissionAxisDistance,
  );
  model.dispose();
});

test("câmera enquadra montagem, explosão e peça isolada no computador e celular", () => {
  const model = buildManualTransmissionModel();
  for (const aspect of [350 / 510, 900 / 620])
    for (const explosion of [0, 1])
      for (const selected of [1, 6, 10, 16]) {
        const isolate = selected === 10 || selected === 16;
        model.update(
          1,
          { ...initialTransmissionState, explosion, selected, isolate },
          false,
        );
        const bounds = new Box3();
        for (const part of model.parts)
          if (part.visible) bounds.union(new Box3().setFromObject(part));
        const camera = new PerspectiveCamera(38, aspect, 0.1, 120);
        fitTransmissionCamera(camera, bounds, aspect);
        for (const x of [bounds.min.x, bounds.max.x])
          for (const y of [bounds.min.y, bounds.max.y])
            for (const z of [bounds.min.z, bounds.max.z]) {
              const point = new Vector3(x, y, z).project(camera);
              assert.ok(
                Math.abs(point.x) <= 1 && Math.abs(point.y) <= 1 && point.z < 1,
              );
            }
        if (isolate)
          assert.equal(model.parts.filter((part) => part.visible).length, 1);
      }
  model.dispose();
});

test("HTML fornece fotos individuais, controles, texto técnico e voz antes do 3D", () => {
  const html = renderToStaticMarkup(createElement(ManualTransmissionExplorer));
  assert.equal(
    (html.match(/class="transmission-part-thumbnail"/g) || []).length,
    16,
  );
  for (const part of transmissionParts) assert.ok(html.includes(part.name));
  for (const text of [
    "Corte em funcionamento",
    "Vista explodida",
    "Embreagem acoplada",
    "Selecionar Neutro",
    "Selecionar Ré",
    "Narração das peças",
    "Verificando voz do navegador",
    "Tambor seletor",
    "alternativa sequencial",
    "Sem cálculo de torque",
  ]) {
    assert.ok(html.includes(text), text);
  }
  assert.match(html, /images\/manual-transmission-reference\/catalog.webp/);
  assert.match(html, /href="\/artigos\?catalog=transmissao-manual"/);
  assert.match(html, /data-renderer="loading"/);
});

test("geometrias e materiais do modelo são liberados uma vez", () => {
  const model = buildManualTransmissionModel();
  const resources = new Set<{
    addEventListener(type: "dispose", callback: () => void): void;
  }>();
  model.group.traverse((object) => {
    if (object instanceof Mesh) {
      resources.add(object.geometry);
      for (const material of Array.isArray(object.material)
        ? object.material
        : [object.material])
        resources.add(material);
    }
  });
  let disposed = 0;
  for (const resource of resources)
    resource.addEventListener("dispose", () => {
      disposed++;
    });
  model.dispose();
  model.dispose();
  assert.equal(disposed, resources.size);
});
