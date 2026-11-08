import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  immobilizerReferenceParts as parts,
  immobilizerReferenceAssemblies as assemblies,
  immobilizerReferenceSystems as systems,
  immobilizerVisualCatalog as catalog,
} from "../src/lib/immobilizer-reference-catalog";
import { ignitionParts } from "../src/lib/ignition-parts";
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

test("as nove fichas preservam a numeração da referência e do interativo", () => {
  assert.deepEqual(
    parts.map((item) => item.number),
    ignitionParts.slice(0, 9).map((item) => item.id),
  );
  assert.deepEqual(
    parts.map((item) => item.name),
    [
      "Chave de ignição codificada",
      "Chip transponder",
      "Cilindro / comutador de ignição",
      "Antena leitora do imobilizador",
      "Módulo imobilizador / BCM",
      "ECU do motor",
      "Relé / fusível de partida",
      "Motor de partida",
      "Bobinas / injetores",
    ],
  );
  for (const item of parts) {
    assert.equal(item.imageCell, item.number - 1);
    assert.ok(item.description.length > 60);
    assert.ok(item.note.length > 100);
    assert.ok(systems.some((system) => system.id === item.system));
  }
  assert.equal(
    parts.some((item) => item.kind === "context"),
    false,
  );
});

test("busca exata, aliases, sistemas e ordem identificam as peças", () => {
  const numbers = (query: string) =>
    filterVisualParts(catalog, query).map((item) => item.number);
  assert.deepEqual(numbers("1"), [1]);
  assert.deepEqual(numbers("9!"), [9]);
  assert.deepEqual(numbers("10"), []);
  assert.deepEqual(numbers("capsula"), [2]);
  assert.deepEqual(numbers("lock cylinder"), [3]);
  assert.deepEqual(numbers("reader antenna"), [4]);
  assert.deepEqual(numbers("starter relay"), [7]);
  assert.deepEqual(numbers("inexistente987"), []);
  assert.equal(numbers("imobilizador eletronico").length, 9);
  assert.deepEqual(
    filterVisualParts(catalog, "", "chave").map((item) => item.number),
    [1, 2, 4],
  );
  assert.deepEqual(
    filterVisualParts(catalog, "", "autorizacao").map((item) => item.number),
    [5, 6],
  );
  assert.deepEqual(
    filterVisualParts(catalog, "", "all", "name").map((item) => item.name),
    [...parts]
      .map((item) => item.name)
      .sort((a, b) => a.localeCompare(b, "pt-BR")),
  );
});

test("o atlas local separa nove imagens de peças e seis vistas de funcionamento", () => {
  assert.equal(assemblies.length, 6);
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
  for (const cell of cells)
    assert.ok(
      Math.abs(
        visualArtworkStyle(catalog.partArtwork, cell).aspectRatio -
          972 / 3 / (1618 / 5),
      ) < 1e-10,
    );
  const data = readFileSync(`public${catalog.partArtwork.src}`);
  assert.equal(data.toString("ascii", 0, 4), "RIFF");
  assert.equal(data.toString("ascii", 8, 12), "WEBP");
});

test("as seis vistas cobrem as nove peças sem prometer partida só pelo reconhecimento", () => {
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
    filterVisualAssemblies(catalog, "3").map((item) => item.id),
    ["coluna"],
  );
  assert.match(
    assemblies.find((item) => item.id === "reconhecida")!.description,
    /demais condições/,
  );
  assert.match(
    assemblies.find((item) => item.id === "nao-reconhecida")!.description,
    /depende do projeto/,
  );
  assert.match(
    assemblies.find((item) => item.id === "nao-reconhecida")!.details.join(" "),
    /motor gira, mas não entra/,
  );
  assert.match(
    assemblies.find((item) => item.id === "painel")!.details.join(" "),
    /não identifica sozinha/,
  );
});

test("os textos distinguem transponder, controle remoto, relé, fusível e arquitetura", () => {
  assert.match(parts[1].description, /exemplo passivo/);
  assert.match(parts[1].note, /não depende da pilha do controle remoto/);
  assert.match(parts[6].description, /relé comuta.*fusível protege/);
  assert.match(parts[6].note, /Relé e fusível são peças diferentes/);
  assert.match(parts[5].note, /não garante sozinho/);
  assert.equal(catalog.sections![0].items!.length, 7);
  assert.equal(catalog.sections![2].groups!.length, 5);
  assert.equal(catalog.sections![3].items!.length, 5);
  assert.match(
    catalog.sections![4].groups![2].text,
    /não são uma exigência conjunta/,
  );
  assert.match(catalog.notes.join(" "), /Não são fotografias de fabricante/);
});

test("artigos entrega as nove fichas, a voz e o link do interativo no servidor", () => {
  const html = renderToStaticMarkup(
    createElement(TechnicalCatalogLibrary, {
      initialCatalog: "chave-e-imobilizador",
    }),
  );
  assert.equal((html.match(/class="reference-catalog-card"/g) || []).length, 9);
  assert.match(html, /Chave e imobilizador, peça por peça/);
  assert.match(html, /Narração das peças/);
  assert.match(html, /Explorar partida e imobilizador interativos/);
  assert.match(html, /href="\/categorias\/ignicao"/);
  assert.match(html, /Chave reconhecida e não reconhecida/);
  assert.equal(
    resolveTechnicalCatalogId("chave-e-imobilizador"),
    "chave-e-imobilizador",
  );
  assert.equal(resolveTechnicalCatalogId("__proto__"), "hvac");
  for (const item of Object.values(technicalCatalogs))
    assert.ok(html.includes(`Abrir catálogo ${item.name}`));
});
