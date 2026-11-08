import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SuspensionExplorer } from "../src/components/suspension-explorer";
import { HvacExplorer } from "../src/components/hvac-explorer";
import { CompressorExplorer } from "../src/components/compressor-explorer";
import { AlternatorExplorer } from "../src/components/alternator-explorer";
import { CoolingExplorer } from "../src/components/cooling-explorer";
import { AbsExplorer } from "../src/components/abs-explorer";
import { InjectionExplorer } from "../src/components/injection-explorer";
import { IgnitionExplorer } from "../src/components/ignition-explorer";
import { SteeringExplorer } from "../src/components/steering-explorer";
import { EpsExplorer } from "../src/components/eps-explorer";
import { CopExplorer } from "../src/components/cop-explorer";
import { StarterExplorer } from "../src/components/starter-explorer";
import { engines } from "../src/lib/engines";
import { getEngineComponents } from "../src/lib/engine-specs";

test("os 12 módulos entregam controles de voz e funções em texto antes da hidratação", () => {
  for (const Component of [
    SuspensionExplorer,
    HvacExplorer,
    CompressorExplorer,
    AlternatorExplorer,
    CoolingExplorer,
    AbsExplorer,
    InjectionExplorer,
    IgnitionExplorer,
    SteeringExplorer,
    EpsExplorer,
    CopExplorer,
    StarterExplorer,
  ]) {
    const html = renderToStaticMarkup(createElement(Component));
    assert.match(html, /Narração das peças/, Component.name);
    assert.match(html, /Falar ao selecionar/, Component.name);
    assert.match(html, /Ouvir peça novamente/, Component.name);
    assert.match(html, /Interromper fala/, Component.name);
    assert.match(html, /Verificando voz do navegador/, Component.name);
    assert.match(html, /data-renderer="loading"/, Component.name);
    assert.match(html, /aria-live="polite"/, Component.name);
  }
});

test("todas as famílias do atlas têm 24 funções completas, distintas e associadas ao componente", () => {
  for (const engine of engines) {
    const components = getEngineComponents(engine);
    assert.equal(components.length, 24);
    assert.equal(new Set(components.map((part) => part.description)).size, 24);
    for (const part of components) {
      assert.equal(
        typeof part.description,
        "string",
        `${engine.family}: ${part.label}`,
      );
      assert.ok(
        part.description.length > 30,
        `${engine.family}: ${part.label}`,
      );
    }
    assert.match(components[8].description, /anéis vedam/);
    assert.match(components[9].description, /Ligam os pistões ao virabrequim/);
  }
});
