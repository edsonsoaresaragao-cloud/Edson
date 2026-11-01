import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { engines, engineParts } from "../src/lib/engines";
import { EngineCatalog } from "../src/components/engine-catalog";
import { EngineDiagram } from "../src/components/engine-diagram";

test("o catálogo inclui os nove fabricantes e as famílias solicitadas sem IDs repetidos", () => {
  assert.equal(new Set(engines.map((e) => e.maker)).size, 9);
  assert.equal(new Set(engines.map((e) => e.id)).size, engines.length);
  for (const family of [
    "AP 1.6",
    "AP 1.8",
    "AP 2.0",
    "EA111",
    "EA888",
    "Família I",
    "Família II",
    "CSS Prime",
    "E.torQ",
    "GSE T200",
    "GSE T270",
    "K4M",
    "H4M",
    "HR10",
    "CHT",
    "Zetec Rocam",
    "EcoBoost",
    "1NZ-FE",
    "2ZR-FE",
    "2GR-FE",
    "Gamma",
    "Kappa",
    "Smartstream",
    "M264",
    "M274",
    "OM651",
    "OM654",
    "N20",
    "B48",
    "B58",
    "N57",
  ])
    assert.ok(
      engines.some((e) => e.family === family),
      family,
    );
});

test("cada arquitetura renderiza sua identificação e todos os componentes", () => {
  for (const cylinders of [3, 4, 6]) {
    const html = renderToStaticMarkup(
      createElement(EngineDiagram, { cylinders, selected: 3 }),
    );
    assert.ok(html.includes(`${cylinders} cilindros em linha`));
    for (const part of engineParts)
      assert.ok(html.includes(part.name), part.name);
  }
  const v6 = renderToStaticMarkup(
    createElement(EngineDiagram, { cylinders: 6, v: true }),
  );
  assert.ok(v6.includes("6 cilindros em V"));
});

test("a página inicial identifica a natureza ilustrativa e oferece filtros e seleção acessível", () => {
  const html = renderToStaticMarkup(createElement(EngineCatalog));
  assert.ok(
    html.includes("Não é um desenho específico de peças desta família."),
  );
  assert.ok(html.includes('type="search"'));
  assert.ok(html.includes('aria-pressed="true"'));
  for (const engine of engines)
    assert.ok(html.includes(engine.family), engine.family);
});

test("cada família tem fonte rastreável e uma vista própria", async () => {
  const { default: visuals } = await import("../src/lib/engine-visuals.json");
  assert.equal(visuals.length, engines.length);
  assert.equal(new Set(visuals.map((v) => v.image)).size, engines.length);
  for (const engine of engines) {
    const visual = visuals.find((v) => v.id === engine.id);
    assert.ok(visual, engine.family);
    assert.equal(new URL(visual.sourceUrl).protocol, "https:");
    assert.equal(new URL(visual.photoUrl).protocol, "https:");
    assert.ok(visual.referenceVersion);
    assert.ok([3, 4, 6].includes(visual.cylinders));
    assert.ok(visual.sourceTitle);
    assert.ok(visual.image.endsWith(`${engine.id}.webp`));
  }
});

test("a vista gerada e a referência externa ficam identificadas na interface", () => {
  const html = renderToStaticMarkup(createElement(EngineCatalog));
  assert.ok(html.includes("ILUSTRAÇÃO GERADA POR IA"));
  assert.ok(html.includes("NÃO É FOTOGRAFIA"));
  assert.ok(html.includes('role="tablist"'));
  assert.ok(html.includes("Referência visual:"));
  assert.ok(html.includes("mercedes-benz-m264.webp"));
});

test("os 31 arquivos de vistas explodidas existem e não repetem a mesma imagem", async () => {
  const { default: visuals } = await import("../src/lib/engine-visuals.json");
  const { readFile } = await import("node:fs/promises");
  const { createHash } = await import("node:crypto");
  const hashes = new Set<string>();
  for (const visual of visuals) {
    const data = await readFile(
      new URL(`../public${visual.image}`, import.meta.url),
    );
    assert.equal(data.subarray(0, 4).toString(), "RIFF", visual.id);
    assert.equal(data.subarray(8, 12).toString(), "WEBP", visual.id);
    const hash = createHash("sha256").update(data).digest("hex");
    assert.ok(!hashes.has(hash), `Imagem repetida: ${visual.id}`);
    hashes.add(hash);
  }
  assert.equal(hashes.size, engines.length);
});
