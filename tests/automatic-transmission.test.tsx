import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Mesh, Box3, PerspectiveCamera, Vector3 } from "three";
import {
  automaticParts,
  automaticRatio,
  automaticModes,
  automaticKinematics,
  planetaryRates,
  planetaryTeeth,
  initialAutomaticState,
  type AutomaticGear,
  type AutomaticRange,
  type PlanetaryMode,
} from "../src/lib/automatic-transmission-parts";
import {
  automaticTransmissionParts as parts,
  automaticTransmissionVisualCatalog as catalog,
} from "../src/lib/automatic-transmission-reference-catalog";
import {
  filterVisualParts,
  filterVisualAssemblies,
  visualArtworkStyle,
} from "../src/lib/visual-reference-catalog";
import {
  technicalCatalogs,
  resolveTechnicalCatalogId,
} from "../src/lib/technical-catalogs";
import {
  buildAutomaticTransmissionModel,
  internalGearGeometry,
} from "../src/lib/automatic-transmission-model";
import { fitAutomaticCamera } from "../src/lib/automatic-transmission-renderer";
import { AutomaticTransmissionExplorer } from "../src/components/automatic-transmission-explorer";
import { TechnicalCatalogLibrary } from "../src/components/technical-catalog-library";

const close = (a: number, b: number) =>
  assert.ok(Math.abs(a - b) < 1e-8, `${a} ≈ ${b}`);
test("a automática mantém os 12 conjuntos, funções e regiões individuais da referência", () => {
  assert.deepEqual(
    parts.map((p) => p.number),
    Array.from({ length: 12 }, (_, i) => i + 1),
  );
  assert.deepEqual(
    parts.map((p) => p.name),
    [
      "Conversor de torque",
      "Bomba de óleo",
      "Conjunto planetário (1)",
      "Conjunto de embreagens e discos (1)",
      "Conjunto planetário (2)",
      "Conjunto de embreagens e discos (2)",
      "Conjunto planetário (3)",
      "Freios (bandas/discos)",
      "Eixo de saída",
      "Corpo de válvulas (unidade hidráulica)",
      "Atuadores / solenoides",
      "Carcaça da transmissão",
    ],
  );
  assert.deepEqual(
    automaticParts.map((p) => p.imageCell),
    Array.from({ length: 12 }, (_, i) => i),
  );
  for (const p of parts) {
    assert.ok(p.description.length > 80);
    assert.ok(p.note.length > 100);
    assert.ok(catalog.systems.some((s) => s.id === p.system));
  }
  assert.deepEqual(
    filterVisualParts(catalog, "gerotor").map((p) => p.number),
    [2],
  );
  assert.deepEqual(
    filterVisualParts(catalog, "11").map((p) => p.number),
    [11],
  );
  assert.deepEqual(
    filterVisualParts(catalog, "porta satelites", "planetarios").map(
      (p) => p.number,
    ),
    [3, 5, 7],
  );
  assert.equal(filterVisualParts(catalog, "cambio automatico").length, 12);
  assert.deepEqual(
    filterVisualAssemblies(catalog, "1").map((p) => p.id),
    ["montado", "explodida", "conversor"],
  );
  const cells = [...parts, ...catalog.assemblies].map((p) => p.imageCell);
  assert.deepEqual(
    cells,
    Array.from({ length: 16 }, (_, i) => i),
  );
  assert.equal(
    new Set(
      cells.map((c) =>
        JSON.stringify(visualArtworkStyle(catalog.partArtwork, c)),
      ),
    ).size,
    16,
  );
  assert.equal(
    readFileSync(`public${catalog.partArtwork.src}`).subarray(8, 12).toString(),
    "WEBP",
  );
  assert.equal(resolveTechnicalCatalogId("transmissao-automatica"), catalog.id);
  assert.equal(technicalCatalogs["transmissao-automatica"], catalog);
  assert.match(parts[0].note, /diferente da bomba de óleo/);
  assert.match(parts[7].note, /diferentes dos freios das rodas/);
});

test("as coroas têm dentes internos, vazado central e geometrias finitas em corte e completas", () => {
  for (const cut of [true, false]) {
    const geometry = internalGearGeometry(cut),
      points = geometry.getAttribute("position");
    assert.ok(Array.from(points.array).every(Number.isFinite));
    assert.ok(
      Array.from(geometry.getAttribute("normal").array).every(Number.isFinite),
    );
    const radii = Array.from({ length: points.count }, (_, i) =>
      Math.hypot(points.getY(i), points.getZ(i)),
    );
    assert.ok(Math.min(...radii) > 0.8);
    assert.ok(Math.max(...radii) < 0.97);
    assert.equal(geometry.userData.internalTeeth, 60);
    const inner = new Set(
      radii.filter((r) => r < 0.9).map((r) => r.toFixed(3)),
    );
    assert.ok(inner.size >= 2);
    geometry.dispose();
  }
});

test("planetários obedecem à equação de Willis, rotação dos planetas e cinco relações mais ré", () => {
  const { sun: s, planet: p, ring: r } = planetaryTeeth;
  assert.equal(s + 2 * p, r);
  assert.equal((s + r) % 3, 0);
  for (const mode of [
    "reduction",
    "ring-drive",
    "direct",
    "overdrive",
    "reverse",
    "neutral",
  ] as PlanetaryMode[]) {
    const rate = planetaryRates(2, mode);
    close(s * rate.sun + r * rate.ring, (s + r) * rate.carrier);
    close(p * (rate.planet - rate.carrier), -s * (rate.sun - rate.carrier));
    if (mode === "reverse") assert.ok(rate.output < 0);
  }
  [3.5, 1.96, 1.4, 1, 5 / 7].forEach((ratio, i) =>
    close(automaticRatio("D", (i + 1) as AutomaticGear)!, ratio),
  );
  close(automaticRatio("R", 1)!, -2.5);
  assert.equal(automaticRatio("P", 1), null);
  assert.equal(automaticRatio("N", 1), null);
  for (const range of ["P", "R", "N", "D"] as AutomaticRange[])
    for (const gear of [1, 2, 3, 4, 5] as AutomaticGear[]) {
      const motion = automaticKinematics({
        ...initialAutomaticState,
        range,
        gear,
      });
      assert.equal(motion.stages.length, 3);
      assert.equal(automaticModes(range, gear).length, 3);
      if (motion.ratio === null) assert.equal(motion.output, 0);
      else close(motion.input / motion.output, motion.ratio);
      close(motion.pump, motion.engine);
    }
  const free = automaticKinematics(initialAutomaticState),
    locked = automaticKinematics({ ...initialAutomaticState, lockup: true });
  assert.ok(free.turbine < free.impeller);
  close(locked.turbine, locked.impeller);
  close(free.ratio!, locked.ratio!);
  assert.equal(
    automaticKinematics({ ...initialAutomaticState, speed: NaN }).engine,
    0,
  );
});

test("os 12 grupos possuem geometria própria; P e N desacoplam e a ré move a saída inversa", () => {
  const model = buildAutomaticTransmissionModel();
  for (const part of model.parts) {
    let meshes = 0;
    part.traverse((node) => {
      if (node instanceof Mesh) {
        meshes++;
        assert.ok(
          Array.from(node.geometry.getAttribute("position").array).every(
            Number.isFinite,
          ),
        );
      }
    });
    assert.ok(meshes > 0);
  }
  model.update(0.2, initialAutomaticState);
  const forward = { ...model.group.userData.motion };
  assert.ok(forward.outputAngle > 0);
  for (const range of ["P", "N"] as const) {
    model.update(0.2, { ...initialAutomaticState, range });
    close(model.group.userData.motion.outputAngle, forward.outputAngle);
    assert.ok(model.group.userData.motion.engineAngle > forward.engineAngle);
  }
  model.update(0.2, { ...initialAutomaticState, range: "R" });
  assert.ok(model.group.userData.motion.outputAngle < forward.outputAngle);
  const before = { ...model.group.userData.motion };
  model.update(0, { ...initialAutomaticState, gear: 5 });
  close(model.group.userData.motion.outputAngle, before.outputAngle);
  model.update(0.5, initialAutomaticState, false);
  close(model.group.userData.motion.outputAngle, before.outputAngle);
  close(model.group.userData.motion.turbineAngle, before.turbineAngle);
  for (const stage of model.stages)
    for (const key of ["sun", "carrier", "ring"] as const)
      close(stage[key].rotation.x, stage.angles[key]);
  model.update(0.5, { ...initialAutomaticState, speed: 0 });
  close(model.group.userData.motion.outputAngle, before.outputAngle);
  model.dispose();
});

test("explosão, foco, discos e enquadramento preservam geometria e recursos", () => {
  const model = buildAutomaticTransmissionModel();
  const assembled = model.parts[0].position.x;
  model.update(1, { ...initialAutomaticState, explosion: 1 }, false);
  assert.ok(model.parts[0].position.x < assembled - 2);
  assert.ok(
    model.packs[0].discs[7].position.x - model.packs[0].discs[0].position.x >
      0.8,
  );
  for (const explosion of [0, 1])
    for (const selected of [0, ...automaticParts.map((p) => p.id)]) {
      const state = {
        ...initialAutomaticState,
        explosion,
        isolate: selected > 0,
        selected: selected || 1,
      };
      model.update(1, state, false);
      model.group.traverse((node) =>
        assert.ok(node.matrixWorld.elements.every(Number.isFinite)),
      );
      assert.equal(
        model.parts.filter((part) => part.visible).length,
        selected ? 1 : 12,
      );
      const box = new Box3();
      for (const part of model.parts)
        if (part.visible) box.union(new Box3().setFromObject(part));
      for (const aspect of [1.5, 0.65])
        for (const direction of [
          new Vector3(-0.32, 0.28, 1),
          new Vector3(1, 0.35, 0.8),
          new Vector3(-0.3, 1, 0.8),
        ]) {
          const camera = new PerspectiveCamera(38, aspect, 0.1, 120);
          fitAutomaticCamera(camera, box, aspect, direction);
          for (const x of [box.min.x, box.max.x])
            for (const y of [box.min.y, box.max.y])
              for (const z of [box.min.z, box.max.z]) {
                const projected = new Vector3(x, y, z).project(camera);
                assert.ok(Math.abs(projected.x) < 0.9);
                assert.ok(Math.abs(projected.y) < 0.9);
                assert.ok(projected.z > -1 && projected.z < 1);
              }
        }
    }
  let disposals = 0,
    expected = 0;
  const geometries = new Set(),
    materials = new Set();
  model.group.traverse((node) => {
    if (node instanceof Mesh) {
      geometries.add(node.geometry);
      for (const material of Array.isArray(node.material)
        ? node.material
        : [node.material])
        materials.add(material);
    }
  });
  for (const resource of [...geometries, ...materials] as Array<{
    addEventListener: (event: string, callback: () => void) => void;
  }>) {
    resource.addEventListener("dispose", () => disposals++);
    expected++;
  }
  model.dispose();
  model.dispose();
  assert.equal(disposals, expected);
});

test("o HTML entrega imagens, funções, voz, seletor, controles e catálogo antes da hidratação", () => {
  const html = renderToStaticMarkup(
    createElement(AutomaticTransmissionExplorer),
  );
  assert.equal(
    (html.match(/class="transmission-part-thumbnail"/g) || []).length,
    12,
  );
  for (const name of [
    "Narração das peças",
    "Falar ao selecionar",
    "Ouvir peça novamente",
    "Corte em funcionamento",
    "Vista explodida",
    "Travamento do conversor (lock-up)",
    "Selecionar P: Estacionamento",
    "Selecionar R: Ré",
    "Selecionar N: Neutro",
    "Selecionar D: Avanço",
  ])
    assert.ok(html.includes(name), name);
  assert.match(html, /catalog=transmissao-automatica/);
  assert.match(html, /Ilustração didática gerada/);
  const library = renderToStaticMarkup(
    createElement(TechnicalCatalogLibrary, {
      initialCatalog: "transmissao-automatica",
    }),
  );
  assert.match(library, /Explorar transmissão automática interativa/);
  assert.match(library, /Manutenção preventiva/);
  assert.match(library, /Relações: referência e demonstração/);
});
