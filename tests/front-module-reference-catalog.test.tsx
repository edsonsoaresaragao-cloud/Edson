import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  frontModuleParts,
  frontModuleAssemblies,
  frontModuleSystems,
  frontModuleVisualCatalog as catalog,
} from "../src/lib/front-module-reference-catalog";
import {
  filterVisualParts,
  filterVisualAssemblies,
  visualArtworkStyle,
} from "../src/lib/visual-reference-catalog";
import { mercedesVisualCatalog } from "../src/lib/mercedes-visual-catalog";
import { suspensionParts } from "../src/lib/suspension-parts";
import { TechnicalCatalogLibrary } from "../src/components/technical-catalog-library";

test("20 componentes usam os mesmos números da suspensão interativa e imagens distintas", () => {
  assert.deepEqual(
    frontModuleParts.map((part) => part.number),
    suspensionParts.map((part) => part.id),
  );
  assert.deepEqual(
    frontModuleParts.map((part) => part.imageCell),
    Array.from({ length: 20 }, (_, i) => i),
  );
  for (const part of frontModuleParts) {
    assert.ok(part.description.length > 50);
    assert.ok(part.note.length > 50);
    assert.ok(frontModuleSystems.some((system) => system.id === part.system));
  }
  assert.equal(frontModuleParts[4].name, suspensionParts[4].name);
  assert.equal(frontModuleParts[5].name, suspensionParts[5].name);
  assert.equal(frontModuleParts[14].name, suspensionParts[14].name);
});
test("busca exata por número, aliases, acentos, sistema e ordenação", () => {
  const numbers = (query: string) =>
    filterVisualParts(catalog, query).map((part) => part.number);
  assert.deepEqual(numbers("1"), [1]);
  assert.deepEqual(numbers("15!"), [15]);
  assert.deepEqual(numbers("trizeta"), [6]);
  assert.deepEqual(numbers("amortecedor coluna"), [11, 13]);
  assert.equal(filterVisualParts(catalog, "modulo dianteiro").length, 20);
  assert.equal(filterVisualParts(catalog, "", "suspensao").length, 8);
  assert.equal(filterVisualParts(catalog, "", "direcao").length, 2);
  assert.equal(filterVisualParts(catalog, "inexistente987").length, 0);
  const sorted = filterVisualParts(catalog, "", "all", "name");
  assert.deepEqual(
    sorted.map((part) => part.name),
    [...sorted]
      .map((part) => part.name)
      .sort((a, b) => a.localeCompare(b, "pt-BR")),
  );
  assert.equal(frontModuleParts[0].number, 1);
});
test("conjuntos vinculam números válidos e posição do veículo permanece contexto", () => {
  assert.deepEqual(
    frontModuleAssemblies.map((item) => item.imageCell),
    [0, 1, 2, 3, 4],
  );
  for (const item of frontModuleAssemblies) {
    assert.ok(
      item.partNumbers.every((number) =>
        frontModuleParts.some((part) => part.number === number),
      ),
    );
    assert.ok(item.details.length >= 3);
  }
  assert.deepEqual(
    filterVisualAssemblies(catalog, "3").map((item) => item.id),
    ["transmissao"],
  );
  assert.deepEqual(
    filterVisualAssemblies(catalog, "McPherson").map((item) => item.id),
    ["mcpherson"],
  );
  assert.deepEqual(
    frontModuleAssemblies.find((item) => item.id === "posicao")!.partNumbers,
    [],
  );
  assert.match(frontModuleParts[2].note, /integrado à transmissão/);
  assert.match(frontModuleParts[8].note, /não gira com o disco/);
  assert.match(
    frontModuleParts[12].note,
    /torre estrutural pertence à carroceria/,
  );
  assert.match(frontModuleParts[14].note, /diferente do cubo/);
  assert.match(
    catalog.sections!.at(-1)!.description!,
    /sem confirmação de compatibilidade/,
  );
});
test("cada região do atlas se limita à sua linha, inclusive nas linhas desiguais", () => {
  for (const item of frontModuleParts) {
    const style = visualArtworkStyle(catalog.partArtwork, item.imageCell);
    const [x, y] = style.backgroundPosition.split(" ").map(parseFloat);
    const [width, height] = style.backgroundSize.split(" ").map(parseFloat);
    assert.ok(x >= 0 && x <= 100 && y >= 0 && y <= 100);
    assert.equal(width, 400);
    assert.ok(height > 400 && height < 600);
  }
  assert.equal(
    visualArtworkStyle(catalog.partArtwork, 19).backgroundPosition,
    "100% 100%",
  );
  assert.notEqual(
    visualArtworkStyle(catalog.partArtwork, 4).backgroundSize,
    visualArtworkStyle(catalog.partArtwork, 16).backgroundSize,
  );
  for (const path of [catalog.partArtwork.src, catalog.assemblyArtwork.src])
    assert.equal(
      readFileSync(`public${path}`).toString("ascii", 8, 12),
      "WEBP",
    );
});
test("biblioteca entrega o módulo sem JavaScript e preserva o catálogo Mercedes", () => {
  const markup = renderToStaticMarkup(createElement(TechnicalCatalogLibrary));
  assert.equal(
    (markup.match(/class="reference-catalog-card"/g) || []).length,
    20,
  );
  assert.match(markup, /Abrir catálogo Módulo Dianteiro/);
  assert.match(markup, /Abrir catálogo Mercedes-Benz/);
  assert.match(markup, /Explorar suspensão interativa/);
  assert.match(markup, /Ilustração didática gerada/);
  assert.match(markup, /Exemplos citados no cartaz/);
  assert.match(markup, /Manutenção: pontos de atenção/);
  const mercedes = renderToStaticMarkup(
    createElement(TechnicalCatalogLibrary, { initialCatalog: "mercedes" }),
  );
  assert.equal(
    (mercedes.match(/class="reference-catalog-card"/g) || []).length,
    24,
  );
  assert.equal(
    filterVisualParts(mercedesVisualCatalog, "bomba dagua")[0].number,
    24,
  );
  assert.equal(
    filterVisualAssemblies(mercedesVisualCatalog, "corrente")[0].id,
    "distribuicao",
  );
});
