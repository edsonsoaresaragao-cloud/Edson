import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  alternatorReferenceParts as parts,
  alternatorReferenceAssemblies as assemblies,
  alternatorReferenceSystems as systems,
  alternatorVisualCatalog as catalog,
} from "../src/lib/alternator-reference-catalog";
import {
  filterVisualParts,
  filterVisualAssemblies,
  visualArtworkStyle,
} from "../src/lib/visual-reference-catalog";
import { alternatorParts } from "../src/lib/alternator-parts";
import {
  technicalCatalogs,
  resolveTechnicalCatalogId,
  defaultTechnicalCatalog,
} from "../src/lib/technical-catalogs";
import { TechnicalCatalogLibrary } from "../src/components/technical-catalog-library";

test("16 peças e imagens preservam os números do alternador interativo", () => {
  assert.deepEqual(
    parts.map((item) => item.number),
    alternatorParts.map((item) => item.id),
  );
  assert.deepEqual(
    parts.map((item) => item.imageCell),
    Array.from({ length: 16 }, (_, i) => i),
  );
  assert.equal(parts.filter((item) => item.kind === "context").length, 0);
  assert.equal(parts[4].name, alternatorParts[4].name);
  assert.equal(parts[5].name, alternatorParts[5].name);
  assert.equal(parts[7].name, alternatorParts[7].name);
  for (const item of parts) {
    assert.ok(item.description.length > 40);
    assert.ok(item.note.length > 60);
    assert.ok(systems.some((system) => system.id === item.system));
  }
});
test("busca exata, aliases, acentos, filtro e ordenação sem modificar os dados", () => {
  const numbers = (query: string) =>
    filterVisualParts(catalog, query).map((item) => item.number);
  assert.deepEqual(numbers("1"), [1]);
  assert.deepEqual(numbers("10!"), [10]);
  assert.deepEqual(numbers("front bearing"), [3]);
  assert.deepEqual(numbers("voltage regulator"), [7]);
  assert.deepEqual(numbers("DFM"), [12]);
  assert.deepEqual(numbers("carvoes"), [8]);
  assert.equal(filterVisualParts(catalog, "alternador automotivo").length, 16);
  assert.equal(filterVisualParts(catalog, "", "geracao").length, 2);
  assert.equal(filterVisualParts(catalog, "", "controle").length, 2);
  assert.equal(filterVisualParts(catalog, "inexistente987").length, 0);
  const sorted = filterVisualParts(catalog, "", "all", "name");
  assert.deepEqual(
    sorted.map((item) => item.name),
    [...sorted]
      .map((item) => item.name)
      .sort((a, b) => a.localeCompare(b, "pt-BR")),
  );
  assert.equal(parts[0].number, 1);
});
test("cinco vistas cobrem todos os componentes e explicam as distinções técnicas", () => {
  assert.deepEqual(
    assemblies.map((item) => item.imageCell),
    [0, 1, 2, 3, 4],
  );
  const references = new Set(
    assemblies.flatMap((item) => [...item.partNumbers]),
  );
  assert.equal(references.size, 16);
  for (const item of assemblies) {
    assert.ok(
      item.partNumbers.every((number) =>
        parts.some((part) => part.number === number),
      ),
    );
    assert.ok(item.details.length >= 3);
  }
  assert.deepEqual(
    filterVisualAssemblies(catalog, "10").map((item) => item.id),
    ["traseira"],
  );
  assert.deepEqual(
    filterVisualAssemblies(catalog, "fases").map((item) => item.id),
    ["funcionamento"],
  );
  assert.match(parts[1].note, /funções diferentes/);
  assert.match(parts[4].note, /Não são um comutador segmentado/);
  assert.match(parts[6].note, /Não é uma faixa universal/);
  assert.match(parts[7].note, /podem formar uma unidade/);
  assert.match(
    parts[11].note,
    /não estabelecem pinagem ou protocolo universal/,
  );
  assert.match(parts[15].note, /funções distintas/);
  assert.equal(catalog.sections![0].items!.length, 6);
  assert.equal(catalog.sections![1].items!.length, 7);
});
test("atlas locais usam regiões únicas sem deformar as linhas de alturas diferentes", () => {
  const positions = parts.map(
    (item) =>
      visualArtworkStyle(catalog.partArtwork, item.imageCell)
        .backgroundPosition,
  );
  assert.equal(new Set(positions).size, 16);
  assert.equal(positions[15], "100% 100%");
  const heights = [301, 268, 247, 270];
  for (const part of parts) {
    const style = visualArtworkStyle(catalog.partArtwork, part.imageCell);
    assert.ok(
      Math.abs(
        style.aspectRatio - 362 / heights[Math.floor(part.imageCell / 4)],
      ) < 1e-10,
    );
  }
  for (const path of [catalog.partArtwork.src, catalog.assemblyArtwork.src])
    assert.equal(
      readFileSync(`public${path}`).toString("ascii", 8, 12),
      "WEBP",
    );
});
test("HTML preserva o alternador e os catálogos anteriores", () => {
  const markup = renderToStaticMarkup(
    createElement(TechnicalCatalogLibrary, { initialCatalog: "alternador" }),
  );
  assert.equal(
    (markup.match(/class="reference-catalog-card"/g) || []).length,
    16,
  );
  assert.match(markup, /Explorar alternador interativo/);
  assert.match(markup, /Ilustração didática gerada/);
  assert.match(markup, /Tensão de referência e aplicação/);
  assert.match(markup, /Pontos de atenção/);
  assert.ok(Object.hasOwn(technicalCatalogs, "alternador"));
  for (const id of [
    "alternador",
    "compressor",
    "modulo-dianteiro",
    "mercedes",
  ] as const) {
    assert.equal(resolveTechnicalCatalogId(id), id);
    assert.equal(technicalCatalogs[id].id, id);
    assert.ok(markup.includes(`Abrir catálogo ${technicalCatalogs[id].name}`));
  }
  for (const value of [undefined, "", "inexistente", "__proto__", "toString"])
    assert.equal(resolveTechnicalCatalogId(value), defaultTechnicalCatalog);
});
