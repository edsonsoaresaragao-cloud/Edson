import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  epsReferenceParts as parts,
  epsReferenceAssemblies as assemblies,
  epsReferenceSystems as systems,
  epsVisualCatalog as catalog,
} from "../src/lib/eps-reference-catalog";
import { epsParts } from "../src/lib/eps-parts";
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

test("EPS preserva os 17 nomes e números da referência e do interativo", () => {
  assert.deepEqual(
    parts.map((item) => item.number),
    epsParts.slice(0, 17).map((item) => item.id),
  );
  assert.deepEqual(
    parts.map((item) => item.name),
    epsParts.slice(0, 17).map((item) => item.name),
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

test("a busca EPS encontra conjuntos por número, alias, sistema e nome", () => {
  const numbers = (query: string) =>
    filterVisualParts(catalog, query).map((item) => item.number);
  assert.deepEqual(numbers("1"), [1]);
  assert.deepEqual(numbers("17"), [17]);
  assert.deepEqual(numbers("18"), []);
  assert.deepEqual(numbers("universal joint"), [3]);
  assert.deepEqual(numbers("inner tie rod"), [9]);
  assert.deepEqual(numbers("CV axle"), [11]);
  assert.deepEqual(numbers("steering wheel"), [1]);
  assert.deepEqual(numbers("barra de torção"), [4]);
  assert.deepEqual(numbers("torque sensor"), [4, 5, 6]);
  assert.deepEqual(numbers("inexistente987"), []);
  assert.equal(numbers("EPS").length, 17);
  assert.deepEqual(
    filterVisualParts(catalog, "", "assistencia").map((item) => item.number),
    [4, 5, 6],
  );
  assert.deepEqual(
    filterVisualParts(catalog, "", "suspensao").map((item) => item.number),
    [12, 13, 14, 15],
  );
  assert.deepEqual(
    filterVisualParts(catalog, "", "freios").map((item) => item.number),
    [16, 17],
  );
  assert.deepEqual(
    filterVisualParts(catalog, "", "all", "name").map((item) => item.name),
    [...parts]
      .map((item) => item.name)
      .sort((a, b) => a.localeCompare(b, "pt-BR")),
  );
  assert.deepEqual(
    filterVisualAssemblies(catalog, "11").map((item) => item.id),
    ["modulo-dianteiro", "estrutura-transmissao"],
  );
  assert.deepEqual(
    parts.map((item) => item.number),
    Array.from({ length: 17 }, (_, i) => i + 1),
  );
});

test("o atlas EPS local associa 24 imagens próprias às peças e vistas", () => {
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
          1024 / 4 / (1536 / 6),
      ) < 1e-10,
    );
  const data = readFileSync(`public${catalog.partArtwork.src}`);
  assert.equal(data.toString("ascii", 0, 4), "RIFF");
  assert.equal(data.toString("ascii", 8, 12), "WEBP");
});

test("o conteúdo EPS diferencia assistência, propulsão, freios e calibração", () => {
  assert.match(parts[3].note, /Torque e ângulo são grandezas diferentes/);
  assert.match(parts[5].note, /motor junto à caixa.*coluna ou no pinhão/);
  assert.match(parts[10].description, /torque de propulsão do diferencial/);
  assert.match(parts[10].note, /não ao acionamento do motor EPS/);
  assert.match(parts[14].note, /amortecedor e mola no item 15/);
  assert.match(
    parts[16].note,
    /não elimina o circuito hidráulico próprio dos freios/,
  );
  assert.match(
    assemblies.find((item) => item.id === "estrutura-transmissao")!.description,
    /não são acionados pelo motor EPS/,
  );
  const attention = catalog.sections!.find(
    (section) => section.title === "Pontos de atenção",
  )!;
  assert.equal(attention.groups!.length, 5);
  assert.match(
    attention.groups![4].text,
    /calibrações somente quando previstas pelo fabricante/,
  );
  const benefits = catalog.sections!.find(
    (section) => section.title === "Vantagens e recursos possíveis",
  )!;
  assert.equal(benefits.items!.length, 6);
  assert.match(benefits.description!, /não garante todos os recursos/);
  assert.match(
    catalog.sections!.find((section) => section.title === "Aplicações comuns")!
      .description!,
    /não confirmam compatibilidade/,
  );
  assert.match(catalog.notes.join(" "), /Não são fotografias de fabricante/);
});

test("artigos entrega EPS com 17 fichas, voz e link para o modelo existente", () => {
  const html = renderToStaticMarkup(
    createElement(TechnicalCatalogLibrary, {
      initialCatalog: "direcao-eletrica-eps",
    }),
  );
  assert.equal(
    (html.match(/class="reference-catalog-card"/g) || []).length,
    17,
  );
  assert.match(html, /Módulo dianteiro EPS, peça por peça/);
  assert.match(html, /Narração das peças/);
  assert.match(html, /href="\/categorias\/direcao-hidraulica-e-eletrica\/eps"/);
  assert.match(html, /Alinhamento e calibração/);
  assert.equal(
    resolveTechnicalCatalogId("direcao-eletrica-eps"),
    "direcao-eletrica-eps",
  );
  assert.equal(resolveTechnicalCatalogId("__proto__"), "hvac");
  for (const item of Object.values(technicalCatalogs))
    assert.ok(html.includes(`Abrir catálogo ${item.name}`));
});
