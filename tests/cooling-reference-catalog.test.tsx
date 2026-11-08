import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  coolingReferenceParts as parts,
  coolingReferenceAssemblies as assemblies,
  coolingReferenceSystems as systems,
  coolingVisualCatalog as catalog,
} from "../src/lib/cooling-reference-catalog";
import {
  filterVisualParts,
  filterVisualAssemblies,
  visualArtworkStyle,
} from "../src/lib/visual-reference-catalog";
import { coolingParts } from "../src/lib/cooling-parts";
import {
  technicalCatalogs,
  resolveTechnicalCatalogId,
  defaultTechnicalCatalog,
} from "../src/lib/technical-catalogs";
import { TechnicalCatalogLibrary } from "../src/components/technical-catalog-library";

test("15 componentes mantêm os números do interativo sem transformar motor/bypass em peça extra", () => {
  assert.deepEqual(
    parts.map((item) => item.number),
    coolingParts.slice(0, 15).map((item) => item.id),
  );
  assert.deepEqual(
    parts.map((item) => item.imageCell),
    Array.from({ length: 15 }, (_, i) => i),
  );
  assert.equal(parts.filter((item) => item.kind === "context").length, 0);
  assert.match(coolingParts[15].name, /contexto/);
  assert.equal(parts[3].name, coolingParts[3].name);
  assert.equal(parts[5].name, coolingParts[5].name);
  assert.equal(parts[12].name, coolingParts[12].name);
  for (const item of parts) {
    assert.ok(item.description.length > 40);
    assert.ok(item.note.length > 60);
    assert.ok(systems.some((system) => system.id === item.system));
  }
});
test("busca exata, sinônimos, acentos, sistema e ordenação", () => {
  const numbers = (query: string) =>
    filterVisualParts(catalog, query).map((item) => item.number);
  assert.deepEqual(numbers("1"), [1]);
  assert.deepEqual(numbers("15!"), [15]);
  assert.deepEqual(numbers("bomba dagua"), [4]);
  assert.deepEqual(numbers("petcock"), [14]);
  assert.deepEqual(numbers("coolant sensor"), [15]);
  assert.equal(
    filterVisualParts(catalog, "sistema arrefecimento motor").length,
    15,
  );
  assert.equal(filterVisualParts(catalog, "", "circulacao").length, 3);
  assert.equal(filterVisualParts(catalog, "", "ventilacao").length, 5);
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
test("vistas, fluxo e valores do cartaz conservam contexto e aplicação variável", () => {
  assert.deepEqual(
    assemblies.map((item) => item.imageCell),
    [0, 1, 2, 3, 4],
  );
  assert.equal(
    new Set(assemblies.flatMap((item) => [...item.partNumbers])).size,
    15,
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
    filterVisualAssemblies(catalog, "13").map((item) => item.id),
    ["aquecedor"],
  );
  assert.match(parts[2].note, /Não abra o sistema quente/);
  assert.match(parts[7].note, /não líquido gelado/);
  assert.match(parts[8].note, /sem ser colocado em série/);
  assert.match(parts[9].note, /diferente do evaporador/);
  assert.match(parts[12].note, /não se mistura ao líquido/);
  assert.match(
    catalog.sections![0].description!,
    /não significa parada da bomba/,
  );
  assert.equal(catalog.sections![0].items!.length, 5);
  assert.equal(catalog.sections![1].items!.length, 7);
  assert.equal(catalog.sections![2].items!.length, 4);
  const values = catalog.sections!.at(-1)!;
  assert.match(values.description!, /Não confirmam aplicação/);
  assert.equal(values.groups!.length, 5);
  assert.match(
    values.groups!.at(-1)!.text,
    /intervalo aplicável é o do manual/,
  );
});
test("cada peça recebe uma região local única com proporções corretas", () => {
  const positions = parts.map(
    (item) =>
      visualArtworkStyle(catalog.partArtwork, item.imageCell)
        .backgroundPosition,
  );
  assert.equal(new Set(positions).size, 15);
  assert.equal(positions[14], "100% 100%");
  const heights = [340, 297, 295, 286, 318];
  for (const part of parts) {
    const style = visualArtworkStyle(catalog.partArtwork, part.imageCell);
    assert.ok(
      Math.abs(
        style.aspectRatio - 1024 / 3 / heights[Math.floor(part.imageCell / 3)],
      ) < 1e-10,
    );
  }
  for (const path of [catalog.partArtwork.src, catalog.assemblyArtwork.src])
    assert.equal(
      readFileSync(`public${path}`).toString("ascii", 8, 12),
      "WEBP",
    );
});
test("HTML preserva arrefecimento e os catálogos anteriores", () => {
  const markup = renderToStaticMarkup(
    createElement(TechnicalCatalogLibrary, { initialCatalog: "arrefecimento" }),
  );
  assert.equal(
    (markup.match(/class="reference-catalog-card"/g) || []).length,
    15,
  );
  assert.match(markup, /Explorar arrefecimento interativo/);
  assert.match(markup, /Ilustração didática gerada/);
  assert.match(markup, /exemplos, não especificações universais/);
  assert.match(markup, /Possíveis falhas e sintomas/);
  assert.ok(Object.hasOwn(technicalCatalogs, "arrefecimento"));
  for (const id of [
    "arrefecimento",
    "alternador",
    "compressor",
    "modulo-dianteiro",
    "mercedes",
  ] as const) {
    assert.equal(resolveTechnicalCatalogId(id), id);
    assert.equal(technicalCatalogs[id].id, id);
    assert.ok(markup.includes(`Abrir catálogo ${technicalCatalogs[id].name}`));
  }
  for (const value of [undefined, "", "inexistente", "__proto__", "toString"])
    assert.equal(resolveTechnicalCatalogId(value), defaultTechnicalCatalog);
});
