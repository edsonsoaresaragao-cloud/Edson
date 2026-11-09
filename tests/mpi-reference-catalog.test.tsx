import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  mpiReferenceParts as parts,
  mpiReferenceAssemblies as assemblies,
  mpiReferenceSystems as systems,
  mpiVisualCatalog as catalog,
} from "../src/lib/mpi-reference-catalog";
import { injectionParts } from "../src/lib/injection-parts";
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

test("as 16 fichas MPI preservam a identificação da referência e do interativo", () => {
  assert.deepEqual(
    parts.map((item) => item.number),
    injectionParts.slice(0, 16).map((item) => item.id),
  );
  assert.deepEqual(
    parts.map((item) => item.name),
    [
      "Bomba de combustível",
      "Filtro de combustível",
      "Regulador de pressão",
      "Flauta / tubo distribuidor",
      "Injetores MPI",
      "Medidor de fluxo de ar / MAF",
      "Corpo de borboleta / TBI",
      "Sensor de temperatura do ar / IAT",
      "Atuador de marcha lenta / IAC",
      "Sonda lambda",
      "Unidade de comando / ECU",
      "Válvula de purga / EVAP",
      "Relé de comando",
      "Bobinas de ignição",
      "Velas de ignição",
      "Cânister",
    ],
  );
  for (const item of parts) {
    assert.equal(item.imageCell, item.number - 1);
    assert.ok(item.description.length > 60);
    assert.ok(item.note.length > 100);
    assert.ok(systems.some((system) => system.id === item.system));
    assert.notEqual(item.kind, "context");
  }
});

test("a busca MPI combina números, aliases, sistemas e ordenação sem alterar os dados", () => {
  const numbers = (query: string) =>
    filterVisualParts(catalog, query).map((item) => item.number);
  assert.deepEqual(numbers("1"), [1]);
  assert.deepEqual(numbers("16"), [16]);
  assert.deepEqual(numbers("17"), []);
  assert.deepEqual(numbers("fuel rail"), [4]);
  assert.deepEqual(numbers("pintle"), [9]);
  assert.deepEqual(numbers("charcoal"), [16]);
  assert.deepEqual(numbers("intake air temperature sensor"), [8]);
  assert.deepEqual(numbers("inexistente987"), []);
  assert.equal(numbers("MPI").length, 16);
  assert.deepEqual(
    filterVisualParts(catalog, "", "combustivel").map((item) => item.number),
    [1, 2, 3, 4, 5],
  );
  assert.deepEqual(
    filterVisualParts(catalog, "", "admissao").map((item) => item.number),
    [6, 7, 8, 9],
  );
  assert.deepEqual(
    filterVisualParts(catalog, "", "all", "name").map((item) => item.name),
    [...parts]
      .map((item) => item.name)
      .sort((a, b) => a.localeCompare(b, "pt-BR")),
  );
  assert.deepEqual(
    parts.map((item) => item.number),
    Array.from({ length: 16 }, (_, i) => i + 1),
  );
});

test("o atlas MPI local contém 16 peças e oito vistas com proporções corretas", () => {
  const cells = [
    ...parts.map((item) => item.imageCell),
    ...assemblies.map((item) => item.imageCell),
  ];
  assert.deepEqual(
    cells,
    Array.from({ length: 24 }, (_, i) => i),
  );
  assert.equal(
    new Set(
      cells.map(
        (cell) =>
          visualArtworkStyle(catalog.partArtwork, cell).backgroundPosition,
      ),
    ).size,
    24,
  );
  assert.equal(catalog.partArtwork.columns, 4);
  assert.equal(catalog.partArtwork.rows, 6);
  for (const cell of cells)
    assert.ok(
      Math.abs(
        visualArtworkStyle(catalog.partArtwork, cell).aspectRatio -
          1145 / 4 / (1374 / 6),
      ) < 1e-10,
    );
  const data = readFileSync(`public${catalog.partArtwork.src}`);
  assert.equal(data.toString("ascii", 0, 4), "RIFF");
  assert.equal(data.toString("ascii", 8, 12), "WEBP");
});

test("as oito vistas MPI relacionam os 16 componentes e diferenciam líquido de vapores", () => {
  assert.equal(assemblies.length, 8);
  assert.deepEqual(
    [...new Set(assemblies.flatMap((item) => [...item.partNumbers]))].sort(
      (a, b) => a - b,
    ),
    parts.map((item) => item.number),
  );
  for (const item of assemblies)
    assert.ok(
      item.partNumbers.every((number) =>
        parts.some((part) => part.number === number),
      ),
    );
  assert.deepEqual(
    filterVisualAssemblies(catalog, "6").map((item) => item.id),
    ["admissao", "ecu"],
  );
  assert.deepEqual(
    filterVisualAssemblies(catalog, "16").map((item) => item.id),
    ["evap"],
  );
  assert.match(
    assemblies.find((item) => item.id === "injecao-nos-dutos")!.description,
    /antes da válvula.*injeção direta/,
  );
  assert.match(
    assemblies.find((item) => item.id === "evap")!.details.join(" "),
    /Sem passagem de combustível líquido/,
  );
});

test("a documentação MPI distingue injeção na admissão, sensores e arquitetura", () => {
  assert.match(parts[4].note, /não injeção direta na câmara/);
  assert.match(parts[5].note, /Nem todo MPI usa MAF/);
  assert.match(
    parts[6].note,
    /borboleta mecânica.*eletrônicas.*dispensar o IAC/,
  );
  assert.match(parts[2].note, /incluindo o tanque/);
  assert.match(parts[9].description, /oxigênio/);
  assert.match(parts[9].note, /Não mede diretamente a qualidade da queima/);
  assert.match(parts[11].note, /não deve ser confundida.*ventilação/);
  assert.match(
    parts[15].note,
    /não armazenar ou distribuir combustível líquido/,
  );
  assert.equal(catalog.sections![0].items!.length, 5);
  assert.equal(catalog.sections![1].groups!.length, 6);
  assert.equal(catalog.sections![2].groups!.length, 5);
  assert.equal(catalog.sections![4].groups!.length, 5);
  assert.match(
    catalog.sections![0].items![4],
    /condições previstas para malha fechada/,
  );
  assert.match(catalog.notes.join(" "), /Não são fotografias de fabricante/);
});

test("artigos renderiza o catálogo MPI com voz, 16 imagens e acesso ao interativo", () => {
  const html = renderToStaticMarkup(
    createElement(TechnicalCatalogLibrary, { initialCatalog: "injecao-mpi" }),
  );
  assert.equal(
    (html.match(/class="reference-catalog-card"/g) || []).length,
    16,
  );
  assert.match(html, /Injeção multiponto, peça por peça/);
  assert.match(html, /Narração das peças/);
  assert.match(html, /Explorar injeção MPI interativa/);
  assert.match(html, /href="\/categorias\/injecao-eletronica"/);
  assert.equal(resolveTechnicalCatalogId("injecao-mpi"), "injecao-mpi");
  assert.equal(resolveTechnicalCatalogId("__proto__"), "hvac");
  for (const item of Object.values(technicalCatalogs))
    assert.ok(html.includes(`Abrir catálogo ${item.name}`));
});
