import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  electricalReferenceParts as parts,
  electricalReferenceAssemblies as assemblies,
  electricalReferenceSystems as systems,
  electricalVisualCatalog as catalog,
} from "../src/lib/electrical-reference-catalog";
import { categoryNames, slugify } from "../src/lib/catalog";
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

test("a elétrica preserva os 11 componentes e os cinco chicotes regionais da referência", () => {
  assert.deepEqual(
    parts.map((item) => item.number),
    Array.from({ length: 11 }, (_, i) => i + 1),
  );
  assert.deepEqual(
    parts.map((item) => item.name),
    [
      "Bateria",
      "Alternador",
      "Motor de partida",
      "Caixa de fusíveis e relés",
      "Unidades de comando / ECUs",
      "Chicotes elétricos",
      "Conectores",
      "Sensores",
      "Atuadores",
      "Pontos de aterramento",
      "Barramentos de distribuição",
    ],
  );
  assert.equal(assemblies.length, 9);
  assert.deepEqual(
    assemblies
      .filter((item) => item.id.startsWith("chicote-"))
      .map((item) => item.id),
    [
      "chicote-motor",
      "chicote-cabine",
      "chicote-portas",
      "chicote-traseiro",
      "chicote-teto",
    ],
  );
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

test("a busca elétrica combina números exatos, aliases, grupos e ordenação", () => {
  const numbers = (query: string) =>
    filterVisualParts(catalog, query).map((item) => item.number);
  assert.deepEqual(numbers("1"), [1]);
  assert.deepEqual(numbers("11"), [11]);
  assert.deepEqual(numbers("12"), []);
  assert.deepEqual(numbers("starter battery"), [1]);
  assert.deepEqual(numbers("alternator"), [2]);
  assert.deepEqual(numbers("ground strap"), [10]);
  assert.deepEqual(numbers("power busbar"), [11]);
  assert.deepEqual(numbers("fuse box"), [4]);
  assert.deepEqual(numbers("wiring harness"), [6]);
  assert.deepEqual(numbers("inexistente987"), []);
  assert.equal(numbers("electrical electronics").length, 11);
  assert.deepEqual(
    filterVisualParts(catalog, "", "energia").map((item) => item.number),
    [1, 2, 3],
  );
  assert.deepEqual(
    filterVisualParts(catalog, "", "sinais").map((item) => item.number),
    [8, 9],
  );
  assert.deepEqual(
    filterVisualParts(catalog, "", "all", "name").map((item) => item.name),
    [...parts]
      .map((item) => item.name)
      .sort((a, b) => a.localeCompare(b, "pt-BR")),
  );
  assert.deepEqual(
    filterVisualAssemblies(catalog, "11").map((item) => item.id),
    ["visao-geral", "chicote-cabine", "fusivel-rele"],
  );
  assert.deepEqual(
    parts.map((item) => item.number),
    Array.from({ length: 11 }, (_, i) => i + 1),
  );
});

test("o atlas elétrico associa 20 imagens locais com proporções próprias de cada linha", () => {
  const cells = [
    ...parts.map((item) => item.imageCell),
    ...assemblies.map((item) => item.imageCell),
  ];
  assert.deepEqual(
    cells,
    Array.from({ length: 20 }, (_, i) => i),
  );
  assert.equal(
    new Set(
      cells.map(
        (cell) =>
          visualArtworkStyle(catalog.partArtwork, cell).backgroundPosition,
      ),
    ).size,
    20,
  );
  assert.equal(catalog.partArtwork.columns, 4);
  assert.equal(catalog.partArtwork.rows, 5);
  const rowHeights = [281, 280, 280, 281, 280];
  for (const cell of cells)
    assert.ok(
      Math.abs(
        visualArtworkStyle(catalog.partArtwork, cell).aspectRatio -
          1122 / 4 / rowHeights[Math.floor(cell / 4)],
      ) < 1e-10,
    );
  const data = readFileSync(`public${catalog.partArtwork.src}`);
  assert.equal(data.toString("ascii", 0, 4), "RIFF");
  assert.equal(data.toString("ascii", 8, 12), "WEBP");
});

test("o conteúdo distingue energia, CAN, proteção e características sobrepostas dos conectores", () => {
  assert.match(parts[0].note, /sistema nominal de 12 V/);
  assert.match(parts[3].note, /Fusível e relé possuem funções diferentes/);
  assert.match(parts[5].note, /não um padrão universal de fios/);
  assert.match(
    parts[6].note,
    /selado, multipolar e possuir trava ao mesmo tempo/,
  );
  assert.match(parts[10].note, /distribui energia e não equivale à rede CAN/);
  const circuits = catalog.sections!.find(
    (section) => section.title === "Funções dos circuitos na referência",
  )!;
  assert.equal(circuits.groups!.length, 8);
  assert.match(circuits.groups![5].text, /não a função exclusiva da rede CAN/);
  const inspection = catalog.sections!.find(
    (section) => section.title === "Manutenção e inspeção",
  )!;
  assert.equal(inspection.items!.length, 6);
  assert.match(inspection.items![4], /13,8–14,8 V.*não é um limite universal/);
  assert.equal(
    catalog.sections!.find(
      (section) => section.title === "Principais falhas e sintomas",
    )!.groups!.length,
    6,
  );
  assert.match(
    assemblies.find((item) => item.id === "conectores")!.description,
    /podem coexistir/,
  );
  assert.match(catalog.notes.join(" "), /Não são fotografias de fabricante/);
});

test("artigos renderiza a elétrica com 11 fichas, voz e categoria existente de conteúdos", () => {
  const html = renderToStaticMarkup(
    createElement(TechnicalCatalogLibrary, {
      initialCatalog: "sistema-eletrico-eletronico",
    }),
  );
  assert.equal(
    (html.match(/class="reference-catalog-card"/g) || []).length,
    11,
  );
  assert.match(html, /Elétrica e eletrônica, componente por componente/);
  assert.match(html, /Narração das peças/);
  assert.match(html, /href="\/categorias\/eletrica-automotiva"/);
  assert.ok(
    categoryNames.some((name) => slugify(name) === "eletrica-automotiva"),
  );
  assert.equal(
    resolveTechnicalCatalogId("sistema-eletrico-eletronico"),
    "sistema-eletrico-eletronico",
  );
  assert.equal(resolveTechnicalCatalogId("__proto__"), "hvac");
  for (const item of Object.values(technicalCatalogs))
    assert.ok(html.includes(`Abrir catálogo ${item.name}`));
});
