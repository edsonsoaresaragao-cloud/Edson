import { test } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SuspensionExplorer } from "../src/components/suspension-explorer";
import { suspensionParts } from "../src/lib/suspension-parts";
test("página renderiza todos os componentes e controles sem WebGL no servidor", () => {
  const html = renderToStaticMarkup(createElement(SuspensionExplorer));
  for (const part of suspensionParts)
    assert.ok(html.includes(part.name), part.name);
  assert.ok(html.includes("Vista explodida"));
  assert.equal((html.match(/type="range"/g) || []).length, 3);
  assert.ok(html.includes('aria-live="polite"'));
  assert.ok(html.includes("Modelo didático genérico"));
});
