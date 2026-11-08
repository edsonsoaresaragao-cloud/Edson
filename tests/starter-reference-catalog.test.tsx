import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  starterReferenceParts as parts,
  starterReferenceAssemblies as assemblies,
  starterReferenceSystems as systems,
  starterVisualCatalog as catalog,
} from "../src/lib/starter-reference-catalog";
import {
  starterParts,
  starterStages,
  starterFaults,
} from "../src/lib/starter-parts";
import {
  filterVisualParts,
  filterVisualAssemblies,
  visualArtworkStyle,
} from "../src/lib/visual-reference-catalog";
import {
  technicalCatalogs,
  resolveTechnicalCatalogId,
} from "../src/lib/technical-catalogs";
import { TechnicalCatalogLibrary } from "../src/components/technical-catalog-library";

test("as 11 fichas preservam números, funções, inspeções e imagens do arranque", () => {
  assert.deepEqual(
    parts.map((item) => item.number),
    starterParts.map((item) => item.id),
  );
  for (let index = 0; index < starterParts.length; index++) {
    assert.equal(parts[index].name, starterParts[index].name);
    assert.equal(parts[index].description, starterParts[index].description);
    assert.equal(
      parts[index].note,
      `Inspeção básica: ${starterParts[index].inspection}`,
    );
    assert.equal(parts[index].imageCell, index);
    assert.ok(systems.some((system) => system.id === parts[index].system));
  }
  assert.equal(parts.filter((item) => item.kind === "context").length, 0);
  assert.equal(new Set(parts.map((item) => item.name)).size, 11);
});

test("busca por número exato, sinônimos, sistema e nome preserva a numeração", () => {
  const numbers = (query: string) =>
    filterVisualParts(catalog, query).map((item) => item.number);
  assert.deepEqual(numbers("1"), [1]);
  assert.deepEqual(numbers("11!"), [11]);
  assert.deepEqual(numbers("12"), []);
  assert.deepEqual(numbers("carvoes"), [10]);
  assert.deepEqual(numbers("forquilha"), [4]);
  assert.deepEqual(numbers("armature"), [7]);
  assert.deepEqual(numbers("one inexistente987"), []);
  assert.equal(numbers("motor partida arranque").length, 11);
  assert.deepEqual(
    filterVisualParts(catalog, "", "estrutura").map((item) => item.number),
    [1, 6, 11],
  );
  assert.deepEqual(
    filterVisualParts(catalog, "", "motor").map((item) => item.number),
    [7, 8],
  );
  const sorted = filterVisualParts(catalog, "", "all", "name");
  assert.deepEqual(
    sorted.map((item) => item.name),
    [...parts]
      .map((item) => item.name)
      .sort((a, b) => a.localeCompare(b, "pt-BR")),
  );
  assert.equal(parts[0].number, 1);
});

test("cinco vistas relacionam todas as peças e identificam o destaque da imagem", () => {
  assert.equal(assemblies.length, 5);
  assert.deepEqual(
    [...new Set(assemblies.flatMap((item) => [...item.partNumbers]))].sort(
      (a, b) => a - b,
    ),
    parts.map((item) => item.number),
  );
  for (const item of assemblies) {
    assert.ok(
      item.partNumbers.every((number) =>
        parts.some((part) => part.number === number),
      ),
    );
    assert.ok(item.details.length >= 4);
    if (item.id !== "montado")
      assert.match(item.artwork!.caption!, /destaque:/);
  }
  assert.deepEqual(
    filterVisualAssemblies(catalog, "3").map((item) => item.id),
    ["engrenamento"],
  );
  assert.deepEqual(
    filterVisualAssemblies(catalog, "potencia").map((item) => item.id),
    ["circuito"],
  );
  assert.match(assemblies[1].details.join(" "), /contexto externo/);
  assert.match(assemblies[2].description, /coletor segmentado/);
});

test("as imagens locais têm regiões próprias e separam peças do conjunto montado", () => {
  const positions = parts.map(
    (item) =>
      visualArtworkStyle(catalog.partArtwork, item.imageCell)
        .backgroundPosition,
  );
  assert.equal(new Set(positions).size, 11);
  assert.equal(catalog.partArtwork.columns, 4);
  assert.equal(catalog.partArtwork.rows, 3);
  assert.equal(positions[0], "0% 0%");
  assert.ok(Math.abs(parseFloat(positions[10]) - 66.6666667) < 0.000001);
  assert.match(positions[10], / 100%$/);
  for (const item of parts)
    assert.equal(
      visualArtworkStyle(catalog.partArtwork, item.imageCell).aspectRatio,
      1,
    );
  const overview = catalog.overview;
  assert.equal(overview.kind, "sprite");
  if (overview.kind === "sprite") {
    assert.equal(overview.cell, 11);
    assert.ok(!parts.some((item) => item.imageCell === overview.cell));
  }
  const data = readFileSync(`public${catalog.partArtwork.src}`);
  assert.equal(data.toString("ascii", 0, 4), "RIFF");
  assert.equal(data.toString("ascii", 8, 12), "WEBP");
});

test("o conteúdo conserva funcionamento e diagnóstico com valores contextualizados", () => {
  const sections = catalog.sections!;
  assert.equal(sections[0].items!.length, starterStages.length);
  assert.equal(sections[2].groups!.length, starterFaults.length);
  const inspections = sections[3].items!.join(" ");
  assert.match(inspections, /12,4–12,8 V/);
  assert.match(inspections, /9,6 V.*Não é um limite universal/);
  assert.match(inspections, /80–250 A.*fora dela/);
  assert.match(inspections, /5 mm.*não uma especificação universal/);
  assert.match(sections[5].groups![0].text, /sistema de carga/);
  assert.match(sections[5].groups![1].text, /não é uma luz universal/);
  assert.match(catalog.notes.join(" "), /Não são fotografias/);
});

test("a biblioteca entrega as 11 fichas no servidor e preserva os demais catálogos", () => {
  const html = renderToStaticMarkup(
    createElement(TechnicalCatalogLibrary, {
      initialCatalog: "motor-de-partida",
    }),
  );
  assert.equal(
    (html.match(/class="reference-catalog-card"/g) || []).length,
    11,
  );
  assert.match(html, /Explorar motor de partida interativo/);
  assert.match(html, /Narração das peças/);
  assert.match(html, /Principais falhas e sintomas/);
  assert.match(html, /Sinais no painel e identificação da falha/);
  assert.equal(
    resolveTechnicalCatalogId("motor-de-partida"),
    "motor-de-partida",
  );
  assert.equal(resolveTechnicalCatalogId("__proto__"), "hvac");
  for (const item of Object.values(technicalCatalogs))
    assert.ok(html.includes(`Abrir catálogo ${item.name}`));
});
