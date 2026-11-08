import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { load } from "cheerio";
import {
  currentIgnitionParts as parts,
  currentIgnitionAssemblies as assemblies,
  currentIgnitionSystems as systems,
  currentIgnitionVisualCatalog as catalog,
} from "../src/lib/current-ignition-reference-catalog";
import { copParts } from "../src/lib/cop-parts";
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

test("as 14 identificações preservam grupos do cartaz, detalhes COP e contexto do motor", () => {
  assert.deepEqual(
    parts.map((item) => item.number),
    copParts.map((item) => item.id),
  );
  assert.deepEqual(
    parts.slice(0, 6).map((item) => item.name),
    [
      "ECU do motor",
      "Bobinas de ignição",
      "Velas de ignição",
      "Sensores do motor",
      "Chicote e conectores",
      "Alimentação elétrica (12 V nominal)",
    ],
  );
  assert.deepEqual(
    parts.slice(6, 13).map((item) => item.name),
    copParts.slice(6, 13).map((item) => item.name),
  );
  assert.deepEqual(
    parts.filter((item) => item.kind === "context").map((item) => item.number),
    [14],
  );
  for (const item of parts) {
    assert.equal(item.imageCell, item.number - 1);
    assert.ok(item.description.length > 60);
    assert.ok(item.note.length > 100);
    assert.ok(systems.some((system) => system.id === item.system));
  }
});

test("busca exata, aliases e filtros distinguem eletrônica, bobina e motor", () => {
  const numbers = (query: string) =>
    filterVisualParts(catalog, query).map((item) => item.number);
  assert.deepEqual(numbers("1"), [1]);
  assert.deepEqual(numbers("11!"), [11]);
  assert.deepEqual(numbers("14"), [14]);
  assert.deepEqual(numbers("15"), []);
  assert.deepEqual(numbers("igniter"), [9]);
  assert.deepEqual(numbers("primary winding"), [11]);
  assert.deepEqual(numbers("coil boot"), [13]);
  assert.deepEqual(numbers("inexistente987"), []);
  assert.equal(numbers("ignicao atual").length, 14);
  assert.deepEqual(
    filterVisualParts(catalog, "", "bobina").map((item) => item.number),
    [8, 10, 11, 12, 13],
  );
  assert.deepEqual(
    filterVisualParts(catalog, "", "controle").map((item) => item.number),
    [1, 9],
  );
  assert.deepEqual(
    filterVisualParts(catalog, "", "all", "name").map((item) => item.name),
    [...parts]
      .map((item) => item.name)
      .sort((a, b) => a.localeCompare(b, "pt-BR")),
  );
});

test("peças e vistas têm 20 referências visuais próprias, com esquema funcional local", () => {
  assert.equal(assemblies.length, 6);
  const media = [
    ...parts.map((item) => ({
      artwork: catalog.partArtwork,
      cell: item.imageCell,
    })),
    ...assemblies.map((item) => ({
      artwork: item.artwork ?? catalog.assemblyArtwork,
      cell: item.imageCell,
    })),
  ];
  assert.equal(
    new Set(media.map((item) => `${item.artwork.src}#${item.cell}`)).size,
    20,
  );
  assert.equal(
    new Set(
      media.map(
        (item) =>
          `${item.artwork.src}#${visualArtworkStyle(item.artwork, item.cell).backgroundPosition}`,
      ),
    ).size,
    20,
  );
  assert.equal(catalog.partArtwork.columns, 5);
  assert.equal(catalog.partArtwork.rows, 4);
  for (const item of parts)
    assert.ok(
      Math.abs(
        visualArtworkStyle(catalog.partArtwork, item.imageCell).aspectRatio -
          1402 / 5 / (1122 / 4),
      ) < 1e-10,
    );
  const image = readFileSync(`public${catalog.partArtwork.src}`);
  assert.equal(image.toString("ascii", 0, 4), "RIFF");
  assert.equal(image.toString("ascii", 8, 12), "WEBP");
  assert.match(
    assemblies.find((item) => item.id === "sinais")!.artwork!.src,
    /signal-flow\.svg$/,
  );
});

test("o esquema envia comando às bobinas e alta tensão somente às velas", () => {
  const svg = readFileSync(
    `public${assemblies.find((item) => item.id === "sinais")!.artwork!.src}`,
    "utf8",
  );
  const $ = load(svg, { xmlMode: true });
  assert.equal($("path[data-from='ecu']").length, 4);
  for (let i = 1; i <= 4; i++) {
    assert.equal(
      $(`path[data-from='ecu'][data-to='coil-${i}']`).attr("marker-end"),
      "url(#blue)",
    );
    assert.equal(
      $(`path[data-from='coil-${i}'][data-to='spark-${i}']`).attr("marker-end"),
      "url(#gold)",
    );
    assert.equal(
      $(`path[data-from='supply'][data-to='coil-${i}']`).attr("marker-end"),
      "url(#red)",
    );
  }
  assert.equal($("path[data-from='ecu'][data-to^='spark']").length, 0);
  assert.equal(
    $("path[data-from='sensors'][data-to='ecu']").attr("marker-end"),
    "url(#green)",
  );
  assert.equal(
    $("path[data-from='supply'][data-to='ecu']").attr("marker-end"),
    "url(#red)",
  );
  assert.match(svg, /Não representa pinagem/);
});

test("as seis vistas relacionam os itens e mantêm as distinções técnicas do sistema", () => {
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
    filterVisualAssemblies(catalog, "11").map((item) => item.id),
    ["bobina-explodida"],
  );
  assert.match(parts[8].description, /corrente do enrolamento primário/);
  assert.match(parts[8].note, /não gera diretamente a alta tensão/);
  assert.match(parts[11].note, /20–40 kV.*ilustrativa/);
  assert.match(parts[11].note, /não é uma leitura fixa/);
  assert.match(parts[3].note, /não é um disparador direto/);
  assert.match(
    assemblies.find((item) => item.id === "regua")!.details.join(" "),
    /Não é automaticamente uma única bobina/,
  );
  assert.equal(catalog.sections![0].items!.length, 6);
  assert.equal(catalog.sections![1].groups!.length, 6);
  assert.equal(catalog.sections![3].groups!.length, 5);
  assert.match(
    catalog.sections![5].groups![0].text,
    /diesel convencional utiliza ignição por compressão/,
  );
});

test("artigos entrega as identificações, narração e acesso ao interativo COP no servidor", () => {
  const html = renderToStaticMarkup(
    createElement(TechnicalCatalogLibrary, { initialCatalog: "ignicao-atual" }),
  );
  assert.equal(
    (html.match(/class="reference-catalog-card"/g) || []).length,
    14,
  );
  assert.match(html, /Ignição atual, peça por peça/);
  assert.match(html, /Narração das peças/);
  assert.match(html, /Explorar ignição atual interativa/);
  assert.match(html, /href="\/categorias\/ignicao\/atual"/);
  assert.match(html, /Evolução da ignição/);
  assert.match(html, /Fluxo \/ contexto/);
  assert.equal(resolveTechnicalCatalogId("ignicao-atual"), "ignicao-atual");
  assert.equal(resolveTechnicalCatalogId("__proto__"), "hvac");
  for (const item of Object.values(technicalCatalogs))
    assert.ok(html.includes(`Abrir catálogo ${item.name}`));
});
