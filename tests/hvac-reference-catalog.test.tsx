import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  hvacReferenceParts as parts,
  hvacReferenceAssemblies as assemblies,
  hvacReferenceSystems as systems,
  hvacVisualCatalog as catalog,
} from "../src/lib/hvac-reference-catalog";
import {
  filterVisualParts,
  filterVisualAssemblies,
  visualArtworkStyle,
} from "../src/lib/visual-reference-catalog";
import { hvacParts } from "../src/lib/hvac-parts";
import {
  technicalCatalogs,
  resolveTechnicalCatalogId,
} from "../src/lib/technical-catalogs";
import { TechnicalCatalogLibrary } from "../src/components/technical-catalog-library";

test("12 componentes preservam a numeração principal e o aquecedor permanece opcional", () => {
  assert.deepEqual(
    parts.map((item) => item.number),
    hvacParts.slice(0, 12).map((item) => item.id),
  );
  assert.deepEqual(
    parts.map((item) => item.imageCell),
    Array.from({ length: 12 }, (_, i) => i),
  );
  assert.equal(parts.filter((item) => item.kind === "context").length, 0);
  assert.match(hvacParts[12].name, /opcional/);
  assert.equal(parts[0].name, hvacParts[0].name);
  assert.equal(parts[3].name, hvacParts[3].name);
  assert.equal(parts[5].name, hvacParts[5].name);
  for (const item of parts) {
    assert.ok(item.description.length > 40);
    assert.ok(item.note.length > 60);
    assert.ok(systems.some((system) => system.id === item.system));
  }
});
test("busca exata, sinônimos, acentos, filtro e ordenação", () => {
  const numbers = (query: string) =>
    filterVisualParts(catalog, query).map((item) => item.number);
  assert.deepEqual(numbers("1"), [1]);
  assert.deepEqual(numbers("12!"), [12]);
  assert.deepEqual(numbers("TXV"), [5]);
  assert.deepEqual(numbers("receiver drier"), [4]);
  assert.deepEqual(numbers("filtro antipolen"), [8]);
  assert.equal(filterVisualParts(catalog, "ar condicionado HVAC").length, 12);
  assert.equal(filterVisualParts(catalog, "", "refrigeracao").length, 5);
  assert.equal(filterVisualParts(catalog, "", "ventilacao").length, 4);
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
test("cinco vistas conservam as distinções entre arquiteturas e fluidos", () => {
  assert.deepEqual(
    assemblies.map((item) => item.imageCell),
    [0, 1, 2, 3, 4],
  );
  assert.equal(
    new Set(assemblies.flatMap((item) => [...item.partNumbers])).size,
    12,
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
    filterVisualAssemblies(catalog, "7").map((item) => item.id),
    ["caixa", "instalado"],
  );
  assert.match(parts[3].note, /não é equivalente/);
  assert.match(parts[4].description, /mistura fria de líquido e vapor/);
  assert.match(parts[5].note, /fenômenos diferentes/);
  assert.match(parts[6].note, /não bombeia refrigerante/);
  assert.match(parts[11].note, /elementos distintos/);
  assert.equal(catalog.sections![0].items!.length, 6);
  assert.match(catalog.sections![1].description!, /por um circuito separado/);
  assert.equal(catalog.sections!.at(-1)!.groups!.length, 5);
});
test("imagens locais preservam proporções e o esquema define um único ciclo fechado correto", () => {
  const positions = parts.map(
    (item) =>
      visualArtworkStyle(catalog.partArtwork, item.imageCell)
        .backgroundPosition,
  );
  assert.equal(new Set(positions).size, 12);
  assert.equal(positions[11], "100% 100%");
  for (const part of parts) {
    const style = visualArtworkStyle(catalog.partArtwork, part.imageCell);
    assert.ok(
      Math.abs(
        style.aspectRatio -
          362 / [365, 357, 364][Math.floor(part.imageCell / 4)],
      ) < 1e-10,
    );
  }
  for (const path of [catalog.partArtwork.src, catalog.assemblyArtwork.src])
    assert.equal(
      readFileSync(`public${path}`).toString("ascii", 8, 12),
      "WEBP",
    );
  const artwork = assemblies[0].artwork!;
  assert.equal(artwork.caption, "Esquema didático do circuito");
  assert.equal(visualArtworkStyle(artwork, 0).backgroundSize, "100% 100%");
  const svg = readFileSync(`public${artwork.src}`, "utf8");
  assert.deepEqual(
    [...svg.matchAll(/data-from="([^"]+)" data-to="([^"]+)"/g)].map((match) => [
      match[1],
      match[2],
    ]),
    [
      ["compressor", "condensador"],
      ["condensador", "secador"],
      ["secador", "expansao"],
      ["expansao", "evaporador"],
      ["evaporador", "compressor"],
    ],
  );
  assert.match(
    svg,
    /ar da cabine e o líquido do aquecedor não integram este circuito/,
  );
  assert.doesNotMatch(svg, /<script|<foreignObject|href=/);
});
test("HTML inicial mostra HVAC e mantém os catálogos disponíveis", () => {
  const markup = renderToStaticMarkup(createElement(TechnicalCatalogLibrary));
  assert.equal(
    (markup.match(/class="reference-catalog-card"/g) || []).length,
    12,
  );
  assert.match(markup, /Explorar ar-condicionado interativo/);
  assert.match(markup, /Ilustração didática gerada/);
  assert.match(markup, /não são equivalentes/);
  assert.match(markup, /Como ler as cores do cartaz/);
  assert.equal(Object.keys(technicalCatalogs).length, 9);
  for (const id of [
    "hvac",
    "arrefecimento",
    "alternador",
    "ignicao-atual",
    "motor-de-partida",
    "transmissao-manual",
    "compressor",
    "modulo-dianteiro",
    "mercedes",
  ] as const) {
    assert.equal(resolveTechnicalCatalogId(id), id);
    assert.equal(technicalCatalogs[id].id, id);
    assert.ok(markup.includes(`Abrir catálogo ${technicalCatalogs[id].name}`));
  }
  for (const value of [undefined, "", "inexistente", "__proto__", "toString"])
    assert.equal(resolveTechnicalCatalogId(value), "hvac");
});
