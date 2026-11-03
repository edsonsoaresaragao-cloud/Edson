import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  mercedesReferenceParts,
  mercedesReferenceAssemblies,
  referenceSystems,
  filterReferenceParts,
  filterReferenceAssemblies,
} from "../src/lib/mercedes-reference-catalog";
import { MercedesReferenceCatalog } from "../src/components/mercedes-reference-catalog";

test("24 componentes preservam numeração e imagem correspondente do cartaz", () => {
  assert.equal(mercedesReferenceParts.length, 24);
  assert.deepEqual(
    mercedesReferenceParts.map((item) => item.number),
    Array.from({ length: 24 }, (_, i) => i + 1),
  );
  assert.deepEqual(
    mercedesReferenceParts.map((item) => item.imageCell),
    Array.from({ length: 24 }, (_, i) => i),
  );
  for (const item of mercedesReferenceParts) {
    assert.ok(item.description.length > 30);
    assert.ok(item.note.length > 30);
    assert.ok(referenceSystems.some((system) => system.id === item.system));
  }
  assert.equal(filterReferenceParts("", "lubrificacao").length, 4);
  assert.equal(filterReferenceParts("", "admissao").length, 4);
});
test("busca por número é exata, lida com acentos e aliases e ordena sem alterar a referência", () => {
  assert.deepEqual(
    filterReferenceParts("20").map((item) => item.number),
    [20],
  );
  assert.deepEqual(
    filterReferenceParts("21!").map((item) => item.number),
    [21],
  );
  assert.deepEqual(
    filterReferenceParts("poly-v").map((item) => item.number),
    [21],
  );
  assert.deepEqual(
    filterReferenceParts("bomba dagua").map((item) => item.number),
    [24],
  );
  assert.equal(filterReferenceParts("Mercedes-Benz M264").length, 24);
  assert.equal(filterReferenceParts("peça-inexistente987").length, 0);
  const sorted = filterReferenceParts("", "all", "name");
  assert.deepEqual(
    sorted.map((item) => item.name),
    [...sorted]
      .map((item) => item.name)
      .sort((a, b) => a.localeCompare(b, "pt-BR")),
  );
  assert.equal(mercedesReferenceParts[0].number, 1);
});
test("5 subconjuntos têm imagens e correspondência válidas e mantêm radiador/termostato como contexto", () => {
  assert.equal(mercedesReferenceAssemblies.length, 5);
  assert.deepEqual(
    mercedesReferenceAssemblies.map((item) => item.imageCell),
    [0, 1, 2, 4, 5],
  );
  for (const item of mercedesReferenceAssemblies) {
    assert.ok(item.details.length >= 3);
    assert.ok(
      item.partNumbers.every((number) =>
        mercedesReferenceParts.some((part) => part.number === number),
      ),
    );
  }
  assert.deepEqual(
    filterReferenceAssemblies("corrente").map((item) => item.id),
    ["distribuicao"],
  );
  assert.equal(filterReferenceAssemblies("M260").length, 5);
  assert.match(
    mercedesReferenceAssemblies
      .find((item) => item.id === "arrefecimento")!
      .details.join(" "),
    /termostática \(contexto\)/,
  );
});
test("aplicações variáveis e distinção corrente/acessórios não viram especificações universais", () => {
  const item = (number: number) =>
    mercedesReferenceParts.find((part) => part.number === number)!;
  assert.match(item(1).note, /componentes diferentes/);
  assert.match(item(18).note, /não confirma a presença de GPF/);
  assert.match(item(20).note, /item 21/);
  assert.match(item(21).note, /não uma correia dentada/);
  assert.match(item(24).note, /não é confirmado/);
});
test("HTML inicial contém todas as imagens, filtros e aviso de ilustração gerada", () => {
  const markup = renderToStaticMarkup(createElement(MercedesReferenceCatalog));
  assert.equal(
    (markup.match(/class="reference-catalog-card"/g) || []).length,
    24,
  );
  for (const item of mercedesReferenceParts)
    assert.ok(markup.includes(item.name), item.name);
  assert.match(markup, /Ilustração didática gerada/);
  assert.match(markup, /peças intercambiáveis/);
  assert.match(markup, /Pesquisar no catálogo Mercedes-Benz/);
  assert.match(markup, /Abrir atlas de motores/);
  assert.match(markup, /<dialog/);
  assert.match(markup, /Fechar ficha ampliada/);
  for (const path of [
    "public/images/mercedes-reference/components.webp",
    "public/images/engines/subassemblies.webp",
    "public/images/engines/mercedes-benz-m264.webp",
  ])
    assert.equal(readFileSync(path).toString("ascii", 8, 12), "WEBP");
});
