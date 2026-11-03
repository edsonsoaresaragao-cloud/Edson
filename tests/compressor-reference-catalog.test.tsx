import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  compressorReferenceParts as parts,
  compressorReferenceAssemblies as assemblies,
  compressorReferenceSystems as systems,
  compressorVisualCatalog as catalog,
} from "../src/lib/compressor-reference-catalog";
import {
  filterVisualParts,
  filterVisualAssemblies,
  visualArtworkStyle,
} from "../src/lib/visual-reference-catalog";
import { compressorParts } from "../src/lib/compressor-parts";
import {
  technicalCatalogs,
  resolveTechnicalCatalogId,
  defaultTechnicalCatalog,
} from "../src/lib/technical-catalogs";
import { TechnicalCatalogLibrary } from "../src/components/technical-catalog-library";

test("16 identificações mantêm os números do interativo, sem inventar uma peça no fluxo", () => {
  assert.deepEqual(
    parts.map((item) => item.number),
    compressorParts.map((item) => item.id),
  );
  assert.deepEqual(
    parts.map((item) => item.imageCell),
    Array.from({ length: 16 }, (_, i) => i),
  );
  assert.equal(parts.filter((item) => item.kind !== "context").length, 15);
  assert.deepEqual(
    parts.filter((item) => item.kind === "context").map((item) => item.number),
    [11],
  );
  assert.equal(parts[10].name, compressorParts[10].name);
  assert.equal(parts[13].name, compressorParts[13].name);
  assert.match(parts[10].note, /não uma peça de reposição/);
  assert.match(parts[13].note, /sem duplicar este componente/);
  for (const item of parts) {
    assert.ok(item.description.length > 40);
    assert.ok(item.note.length > 60);
    assert.ok(systems.some((system) => system.id === item.system));
  }
});
test("busca exata por número, sinônimo, acento, sistema e ordenação", () => {
  const numbers = (query: string) =>
    filterVisualParts(catalog, query).map((item) => item.number);
  assert.deepEqual(numbers("1"), [1]);
  assert.deepEqual(numbers("12!"), [12]);
  assert.deepEqual(numbers("shaft seal"), [12]);
  assert.deepEqual(numbers("eletroima"), [7]);
  assert.deepEqual(numbers("oring"), [16]);
  assert.equal(
    filterVisualParts(catalog, "compressor ar condicionado").length,
    16,
  );
  assert.equal(filterVisualParts(catalog, "", "embreagem").length, 4);
  assert.equal(filterVisualParts(catalog, "", "vedacao").length, 2);
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
test("cinco conjuntos relacionam números válidos, fluxo e construção variável", () => {
  assert.deepEqual(
    assemblies.map((item) => item.imageCell),
    [0, 1, 2, 3, 4],
  );
  for (const item of assemblies) {
    assert.ok(
      item.partNumbers.every((number) =>
        parts.some((part) => part.number === number),
      ),
    );
    assert.ok(item.details.length >= 3);
  }
  assert.deepEqual(
    filterVisualAssemblies(catalog, "12").map((item) => item.id),
    ["frente"],
  );
  assert.deepEqual(
    filterVisualAssemblies(catalog, "11").map((item) => item.id),
    ["funcionamento"],
  );
  assert.match(parts[6].note, /permanece fixa/);
  assert.match(parts[6].note, /devem ser confirmadas/);
  assert.match(parts[7].note, /dependem da arquitetura/);
  assert.match(catalog.sections![0].description!, /etapa de evaporação/);
  assert.match(catalog.notes.join(" "), /Compressores sem embreagem/);
  assert.match(catalog.notes.join(" "), /não determina sequência/);
});
test("atlas locais têm posição única e cada identificação recebe imagem própria", () => {
  const positions = parts.map(
    (item) =>
      visualArtworkStyle(catalog.partArtwork, item.imageCell)
        .backgroundPosition,
  );
  assert.equal(new Set(positions).size, 16);
  assert.equal(positions[15], "100% 100%");
  assert.equal(catalog.partArtwork.aspectRatio, 4 / 3);
  for (const path of [catalog.partArtwork.src, catalog.assemblyArtwork.src])
    assert.equal(
      readFileSync(`public${path}`).toString("ascii", 8, 12),
      "WEBP",
    );
});
test("biblioteca preserva o compressor e valida a seleção entre catálogos", () => {
  const markup = renderToStaticMarkup(
    createElement(TechnicalCatalogLibrary, { initialCatalog: "compressor" }),
  );
  assert.equal(
    (markup.match(/class="reference-catalog-card"/g) || []).length,
    16,
  );
  assert.match(markup, /Identificações/);
  assert.match(markup, /15 componentes e uma identificação de fluxo/);
  assert.match(markup, /Explorar compressor interativo/);
  assert.match(markup, /Ilustração didática gerada/);
  assert.match(markup, /Pontos de atenção/);
  assert.ok(Object.hasOwn(technicalCatalogs, "compressor"));
  for (const id of ["compressor", "modulo-dianteiro", "mercedes"] as const) {
    assert.equal(resolveTechnicalCatalogId(id), id);
    assert.equal(technicalCatalogs[id].id, id);
    assert.ok(markup.includes(`Abrir catálogo ${technicalCatalogs[id].name}`));
  }
  for (const value of [undefined, "", "inexistente", "__proto__", "toString"])
    assert.equal(resolveTechnicalCatalogId(value), defaultTechnicalCatalog);
});
