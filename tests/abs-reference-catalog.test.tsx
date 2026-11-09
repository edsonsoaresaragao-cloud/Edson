import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  absReferenceParts as parts,
  absReferenceAssemblies as assemblies,
  absReferenceSystems as systems,
  absVisualCatalog as catalog,
} from "../src/lib/abs-reference-catalog";
import { absParts, absCycle } from "../src/lib/abs-parts";
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

test("o catálogo ABS preserva os oito números da referência e relaciona as sete vistas", () => {
  assert.deepEqual(
    parts.map((item) => item.number),
    absParts.slice(0, 8).map((item) => item.id),
  );
  assert.equal(assemblies.length, 7);
  assert.deepEqual(
    [...new Set(assemblies.flatMap((item) => [...item.partNumbers]))].sort(
      (a, b) => a - b,
    ),
    parts.map((item) => item.number),
  );
  for (const item of parts) {
    assert.equal(item.imageCell, item.number - 1);
    assert.ok(item.description.length > 60);
    assert.ok(item.note.length > 100);
    assert.ok(systems.some((system) => system.id === item.system));
    assert.notEqual(item.kind, "context");
  }
  for (const item of assemblies)
    assert.ok(
      item.partNumbers.every((number) =>
        parts.some((part) => part.number === number),
      ),
    );
});

test("a busca ABS distingue peça, número, alias e sistema sem alterar a ordem original", () => {
  const numbers = (query: string) =>
    filterVisualParts(catalog, query).map((item) => item.number);
  assert.deepEqual(numbers("1"), [1]);
  assert.deepEqual(numbers("8"), [8]);
  assert.deepEqual(numbers("9"), []);
  assert.deepEqual(numbers("wheel speed sensor"), [1]);
  assert.deepEqual(numbers("hydraulic control unit"), [3]);
  assert.deepEqual(numbers("master cylinder"), [7]);
  assert.deepEqual(numbers("brake pipes"), [8]);
  assert.deepEqual(numbers("inexistente987"), []);
  assert.equal(numbers("ABS").length, 8);
  assert.deepEqual(
    filterVisualParts(catalog, "", "modulacao").map((item) => item.number),
    [3, 4, 5],
  );
  assert.deepEqual(
    filterVisualParts(catalog, "", "acionamento").map((item) => item.number),
    [6, 7],
  );
  assert.deepEqual(
    filterVisualParts(catalog, "", "all", "name").map((item) => item.name),
    [...parts]
      .map((item) => item.name)
      .sort((a, b) => a.localeCompare(b, "pt-BR")),
  );
  assert.deepEqual(
    filterVisualAssemblies(catalog, "8").map((item) => item.id),
    ["veiculo"],
  );
  assert.deepEqual(
    parts.map((item) => item.number),
    Array.from({ length: 8 }, (_, i) => i + 1),
  );
});

test("o atlas ABS local distribui oito componentes e sete vistas em células próprias", () => {
  const cells = [
    ...parts.map((item) => item.imageCell),
    ...assemblies.map((item) => item.imageCell),
  ];
  assert.deepEqual(
    cells,
    Array.from({ length: 15 }, (_, i) => i),
  );
  assert.equal(
    new Set(
      cells.map(
        (cell) =>
          visualArtworkStyle(catalog.partArtwork, cell).backgroundPosition,
      ),
    ).size,
    15,
  );
  assert.equal(catalog.partArtwork.columns, 3);
  assert.equal(catalog.partArtwork.rows, 5);
  const rowHeights = [253, 254, 251, 254, 242];
  for (const cell of cells)
    assert.ok(
      Math.abs(
        visualArtworkStyle(catalog.partArtwork, cell).aspectRatio -
          1254 / 3 / rowHeights[Math.floor(cell / 3)],
      ) < 1e-10,
    );
  const data = readFileSync(`public${catalog.partArtwork.src}`);
  assert.equal(data.toString("ascii", 0, 4), "RIFF");
  assert.equal(data.toString("ascii", 8, 12), "WEBP");
});

test("as fases e a recirculação concordam com o interativo sem prometer frenagem universal", () => {
  assert.deepEqual(
    [0.5, 1.5, 2.5].map((time) => {
      const cycle = absCycle(time, 1, "abs");
      return [cycle.phase, cycle.inletOpen, cycle.outletOpen];
    }),
    [
      ["increase", true, false],
      ["hold", false, false],
      ["reduce", false, true],
    ],
  );
  const phases = catalog.sections!.find(
    (section) => section.title === "Três fases da modulação de pressão",
  )!;
  assert.match(phases.groups![0].text, /entrada aberta e a saída fechada/);
  assert.match(phases.groups![1].text, /Entrada e saída fechadas/);
  assert.match(phases.groups![2].text, /Entrada fechada e saída aberta/);
  assert.match(
    assemblies.find((item) => item.id === "recirculacao")!.description,
    /acumulador de baixa pressão.*montante das válvulas de entrada/,
  );
  assert.match(parts[4].note, /ausência de ruído isolada não confirma defeito/);
  assert.match(parts[3].note, /oito válvulas.*variam por arquitetura/);
  assert.match(parts[0].note, /não aplique um teste de resistência universal/);
  const limits = catalog.sections!.find(
    (section) => section.title === "Recursos e limites do ABS",
  )!;
  assert.match(limits.description!, /não garante menor distância/);
  assert.match(limits.items!.join(" "), /cascalho.*pode aumentar/);
  assert.match(catalog.notes.join(" "), /Não são fotografias de fabricante/);
});

test("artigos registra ABS com oito fichas, voz e acesso ao modelo existente", () => {
  const html = renderToStaticMarkup(
    createElement(TechnicalCatalogLibrary, { initialCatalog: "freios-abs" }),
  );
  assert.equal((html.match(/class="reference-catalog-card"/g) || []).length, 8);
  assert.match(html, /Sistema ABS, peça por peça/);
  assert.match(html, /Narração das peças/);
  assert.match(html, /href="\/categorias\/freios-e-abs"/);
  assert.match(html, /Três fases da modulação de pressão/);
  assert.equal(resolveTechnicalCatalogId("freios-abs"), "freios-abs");
  assert.equal(resolveTechnicalCatalogId("__proto__"), "hvac");
  for (const item of Object.values(technicalCatalogs))
    assert.ok(html.includes(`Abrir catálogo ${item.name}`));
});
