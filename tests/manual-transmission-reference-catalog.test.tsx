import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  manualTransmissionParts as parts,
  manualTransmissionAssemblies as assemblies,
  manualTransmissionRatios as ratios,
  manualTransmissionSystems as systems,
  manualTransmissionVisualCatalog as catalog,
} from "../src/lib/manual-transmission-reference-catalog";
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

test("a transmissão preserva os 13 números e componentes da lista enviada", () => {
  assert.deepEqual(
    parts.map((item) => item.number),
    Array.from({ length: 13 }, (_, i) => i + 1),
  );
  assert.deepEqual(
    parts.map((item) => item.name),
    [
      "Carcaça (caixa)",
      "Eixo primário (entrada)",
      "Eixo secundário (saída)",
      "Eixo intermediário (contraeixo)",
      "Conjunto de engrenagens",
      "Sincronizador",
      "Luva de engate",
      "Garfo seletor",
      "Haste / eixo seletor",
      "Tambor seletor",
      "Tampa traseira",
      "Retentores",
      "Rolamentos",
    ],
  );
  for (const item of parts) {
    assert.ok(item.description.length > 60);
    assert.ok(item.note.length > 100);
    assert.ok(systems.some((system) => system.id === item.system));
    assert.equal(item.imageCell, item.number - 1);
  }
  assert.equal(
    parts.some((item) => item.kind === "context"),
    false,
  );
});

test("busca exata, acentos, sinônimos e ordenação identificam as peças corretas", () => {
  const numbers = (query: string) =>
    filterVisualParts(catalog, query).map((item) => item.number);
  assert.deepEqual(numbers("1"), [1]);
  assert.deepEqual(numbers("10!"), [10]);
  assert.deepEqual(numbers("13"), [13]);
  assert.deepEqual(numbers("14"), []);
  assert.deepEqual(numbers("layshaft"), [4]);
  assert.deepEqual(numbers("synchronizer"), [6]);
  assert.deepEqual(numbers("manga de engate"), [7]);
  assert.deepEqual(numbers("selo oleo"), [12]);
  assert.deepEqual(numbers("inexistente987"), []);
  assert.equal(numbers("cambio mecanico").length, 13);
  assert.deepEqual(
    filterVisualParts(catalog, "", "estrutura").map((item) => item.number),
    [1, 11],
  );
  assert.deepEqual(
    filterVisualParts(catalog, "", "eixos").map((item) => item.number),
    [2, 3, 4, 5],
  );
  assert.deepEqual(
    filterVisualParts(catalog, "", "all", "name").map((item) => item.name),
    [...parts]
      .map((item) => item.name)
      .sort((a, b) => a.localeCompare(b, "pt-BR")),
  );
  assert.equal(parts[0].number, 1);
});

test("o atlas entrega 20 imagens locais distintas para peças, caixa montada e seis vistas", () => {
  const artwork = catalog.partArtwork;
  assert.equal(artwork.columns, 4);
  assert.equal(artwork.rows, 5);
  const cells = [
    ...parts.map((item) => item.imageCell),
    13,
    ...assemblies.map((item) => item.imageCell),
  ];
  assert.deepEqual(
    cells,
    Array.from({ length: 20 }, (_, i) => i),
  );
  const positions = cells.map(
    (cell) => visualArtworkStyle(artwork, cell).backgroundPosition,
  );
  assert.equal(new Set(positions).size, 20);
  assert.equal(positions[0], "0% 0%");
  assert.equal(positions[19], "100% 100%");
  for (const cell of cells)
    assert.ok(
      Math.abs(
        visualArtworkStyle(artwork, cell).aspectRatio - 1122 / 4 / (1402 / 5),
      ) < 1e-10,
    );
  const data = readFileSync(`public${artwork.src}`);
  assert.equal(data.toString("ascii", 0, 4), "RIFF");
  assert.equal(data.toString("ascii", 8, 12), "WEBP");
});

test("as vistas relacionam as 13 peças e mantêm embreagem e pedais como contexto", () => {
  assert.equal(assemblies.length, 6);
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
    assemblies.find((item) => item.id === "embreagem")!.partNumbers,
    [],
  );
  assert.deepEqual(
    assemblies.find((item) => item.id === "pedais")!.partNumbers,
    [],
  );
  assert.deepEqual(
    filterVisualAssemblies(catalog, "13").map((item) => item.id),
    ["vista-explodida"],
  );
  assert.deepEqual(
    filterVisualAssemblies(catalog, "6").map((item) => item.id),
    ["vista-explodida", "sincronizador"],
  );
  assert.deepEqual(
    filterVisualAssemblies(catalog, "", "contexto").map((item) => item.id),
    ["embreagem", "pedais", "fluxo"],
  );
  assert.match(
    assemblies.find((item) => item.id === "alavanca")!.description,
    /tambor só se aplica/,
  );
});

test("relações de marcha e construção têm contexto, sem universalizar o tambor ou a ré", () => {
  assert.equal(ratios.length, 6);
  assert.equal(ratios[0].ratio, "3,50–3,90:1");
  assert.equal(ratios[4].ratio, "0,70–0,85:1");
  assert.match(ratios[5].ratio, /em módulo/);
  assert.match(parts[9].description, /Nos mecanismos que o utilizam/);
  assert.match(
    parts[9].note,
    /não está presente em toda caixa manual com padrão H/,
  );
  assert.match(parts[3].note, /não representa toda transmissão/);
  assert.match(
    catalog.sections![1].description!,
    /não são especificações universais/,
  );
  assert.match(
    catalog.sections![2].items!.join(" "),
    /especificação e a viscosidade/,
  );
  assert.match(
    catalog.sections![4].groups![2].text,
    /sincronização da ré variam/,
  );
  assert.match(catalog.notes.join(" "), /Não são fotografias de fabricante/);
});

test("o catálogo aparece em artigos e entrega imagens, voz e conteúdos no servidor", () => {
  const html = renderToStaticMarkup(
    createElement(TechnicalCatalogLibrary, {
      initialCatalog: "transmissao-manual",
    }),
  );
  assert.equal(
    (html.match(/class="reference-catalog-card"/g) || []).length,
    13,
  );
  assert.match(html, /Transmissão manual, peça por peça/);
  assert.match(html, /Narração das peças/);
  assert.match(html, /Relações de marcha: exemplos do cartaz/);
  assert.match(html, /Ver conteúdos de transmissão manual/);
  assert.match(html, /href="\/categorias\/transmissao-manual"/);
  assert.equal(
    resolveTechnicalCatalogId("transmissao-manual"),
    "transmissao-manual",
  );
  assert.equal(resolveTechnicalCatalogId("__proto__"), "hvac");
  for (const item of Object.values(technicalCatalogs))
    assert.ok(html.includes(`Abrir catálogo ${item.name}`));
});
