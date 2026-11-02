import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import {
  componentOffersUrl,
  filterTechnicalComponents,
  technicalComponents,
} from "../src/lib/sensor-actuator-catalog";
import { SensorActuatorCatalog } from "../src/components/sensor-actuator-catalog";

test("catálogo reúne os 24 componentes principais e os 16 adicionais solicitados", () => {
  assert.equal(technicalComponents.length, 40);
  for (const [scope, count] of [
    ["main", 12],
    ["additional", 8],
  ] as const) {
    for (const kind of ["sensor", "actuator"] as const) {
      const items = filterTechnicalComponents({ scope, kind });
      assert.equal(items.length, count);
      assert.deepEqual(
        items.map((item) => item.number),
        Array.from({ length: count }, (_, i) => i + 1),
      );
    }
  }
  assert.equal(new Set(technicalComponents.map((item) => item.id)).size, 40);
  assert.equal(
    new Set(technicalComponents.map((item) => item.illustrationIndex)).size,
    40,
  );
  assert.ok(
    technicalComponents.every(
      (item) => item.function.length > 30 && item.inspection.length > 20,
    ),
  );
});

test("busca combina sigla, função, acentos e sistema, sem confundir essenciais com adicionais", () => {
  assert.equal(
    filterTechnicalComponents({ query: "CRANKSHAFT" })[0]?.id,
    "sensor-ckp",
  );
  assert.equal(
    filterTechnicalComponents({ query: "pressao coletor" })[0]?.id,
    "sensor-map",
  );
  assert.equal(
    filterTechnicalComponents({
      query: "óleo",
      scope: "all",
      kind: "actuator",
      system: "Controle do motor",
    })[0]?.id,
    "solenoide-vvt",
  );
  assert.deepEqual(filterTechnicalComponents({ query: "TPMS" }), []);
  assert.equal(
    filterTechnicalComponents({ query: "TPMS", scope: "additional" })[0]?.id,
    "sensor-tpms",
  );
  assert.equal(
    filterTechnicalComponents({ query: "VALVULA   DE PURGA" })[0]?.id,
    "valvula-canister",
  );
  assert.deepEqual(
    filterTechnicalComponents({ query: "peça que não existe" }),
    [],
  );
});

test("notas distinguem arquiteturas para não induzir inspeção ou aplicação incorreta", () => {
  const note = (id: string) =>
    technicalComponents.find((item) => item.id === id)?.note || "";
  assert.match(
    note("sonda-lambda"),
    /posterior monitora a eficiência do catalisador/,
  );
  assert.match(note("atuador-wastegate"), /mecanismos diferentes/);
  assert.match(note("atuador-vgt"), /wastegate abre um desvio/);
  assert.match(note("sensor-tpms"), /indireto/);
  assert.match(note("atuador-iac"), /dispensam um IAC separado/);
});

test("referências fornecidas são preservadas e tela de verificação não é usada como foto", () => {
  const supplied = technicalComponents.filter((item) => item.photo);
  assert.equal(supplied.length, 23);
  assert.equal(supplied.filter((item) => !item.photo!.unavailable).length, 22);
  for (const item of supplied) {
    const url = new URL(item.photo!.url);
    assert.equal(url.origin, "https://images.openai.com");
    assert.equal(url.searchParams.get("purpose"), "inline");
  }
  assert.equal(
    technicalComponents.find((item) => item.id === "solenoide-cambio")?.photo
      ?.unavailable,
    true,
  );
  assert.equal(
    technicalComponents.find((item) => item.id === "sensor-abs")?.photo,
    undefined,
  );
  const asset = readFileSync(
    "public/images/components/sensors-actuators-atlas.webp",
  );
  assert.equal(asset.toString("ascii", 8, 12), "WEBP");
});

test("cada ficha abre a busca de ofertas com o nome íntegro, sem inventar anúncio ou compatibilidade", () => {
  for (const item of technicalComponents) {
    const url = new URL(componentOffersUrl(item), "https://edson.example");
    assert.equal(url.pathname, "/pecas");
    assert.equal(url.searchParams.get("buy"), item.name);
    assert.equal([...url.searchParams].length, 1);
  }
});

test("renderização inicial entrega as 24 fichas e identifica explicitamente as ilustrações", () => {
  const html = renderToStaticMarkup(createElement(SensorActuatorCatalog));
  assert.equal((html.match(/class="technical-component"/g) || []).length, 24);
  assert.equal((html.match(/loading="lazy"/g) || []).length, 22);
  assert.match(html, /Ilustração didática gerada/);
  assert.match(html, /não confirma aplicação/);
  assert.match(html, /Referência enviada pelo usuário/);
  assert.match(html, /Inspeção básica/);
  assert.match(html, /Sensores → ECU/);
  assert.match(html, /ECU → Atuadores/);
  assert.doesNotMatch(html, /src="[^"]*rrg_2gLi/);
  assert.doesNotMatch(html, /Bosch Auto Parts\+2/);
});
