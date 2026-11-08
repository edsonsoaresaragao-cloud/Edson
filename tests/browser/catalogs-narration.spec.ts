import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { installSpeech } from "./support/part-narration";
import { technicalCatalogs } from "../../src/lib/technical-catalogs";
import { technicalComponents } from "../../src/lib/sensor-actuator-catalog";
import { engines, engineParts } from "../../src/lib/engines";
import { getEngineComponents } from "../../src/lib/engine-specs";

const prefix = process.env.ALL_VOICE_PREVIEW_PREFIX;
const catalogPath = (id: string) =>
  prefix ? `${prefix}/catalog-${id}` : `/artigos?catalog=${id}`;
const sensorPath = prefix
  ? `${prefix}/sensors`
  : "/categorias/sensores-e-atuadores";
const enginePath = "/explodedview";
test.setTimeout(120000);
test.beforeEach(async ({ page }) => {
  await page.route("https://images.openai.com/**", (route) => route.abort());
});

for (const [id, catalog] of Object.entries(technicalCatalogs)) {
  test(`${id}: fotos, nomes e fichas narram todos os componentes e conjuntos`, async ({
    page,
  }) => {
    await installSpeech(page);
    await page.goto(catalogPath(id));
    const root = page.locator(".visual-reference-catalog");
    expect(await page.evaluate(() => window.__speechRecorder.calls)).toEqual(
      [],
    );
    const dialog = root.getByRole("dialog");
    for (const item of catalog.parts) {
      await root
        .getByRole("button", { name: `Ver ficha: ${item.name}`, exact: true })
        .click();
      await expect(dialog).toBeVisible();
      expect(
        await page.evaluate(() => window.__speechRecorder.calls.at(-1)!.text),
      ).toBe(`${item.name}. Função: ${item.description}`);
      await dialog
        .getByRole("button", { name: "Fechar ficha ampliada" })
        .click();
      await expect(
        root.getByRole("button", { name: "Interromper fala" }),
      ).toBeDisabled();
    }
    const item = catalog.parts[0];
    for (const name of [`Selecionar imagem: ${item.name}`, item.name]) {
      await root.getByRole("button", { name, exact: true }).click();
      expect(
        await page.evaluate(() => window.__speechRecorder.calls.at(-1)!.text),
      ).toBe(`${item.name}. Função: ${item.description}`);
      await page.keyboard.press("Escape");
      await expect(dialog).not.toBeVisible();
    }
    await root
      .getByRole("button", {
        name: `${catalog.assemblyLabel} ${catalog.assemblies.length}`,
        exact: true,
      })
      .click();
    for (const item of catalog.assemblies) {
      await root
        .getByRole("button", {
          name: `Ver conjunto: ${item.name}`,
          exact: true,
        })
        .click();
      expect(
        await page.evaluate(() => window.__speechRecorder.calls.at(-1)!.text),
      ).toBe(`${item.name}. Função: ${item.description}`);
      await dialog
        .getByRole("button", { name: "Fechar ficha ampliada" })
        .click();
      await expect(dialog).not.toBeVisible();
    }
    // Muting remains in effect when the controls move into and out of the dialog.
    await root.getByRole("button", { name: "Falar ao selecionar" }).click();
    const count = await page.evaluate(
      () => window.__speechRecorder.calls.length,
    );
    await root
      .getByRole("button", {
        name: `Selecionar imagem: ${catalog.assemblies[0].name}`,
        exact: true,
      })
      .click();
    await expect(dialog).toBeVisible();
    expect(
      await page.evaluate(() => window.__speechRecorder.calls.length),
    ).toBe(count);
    await expect(
      dialog.getByRole("button", { name: "Ouvir peça novamente" }),
    ).toBeDisabled();
    await dialog.getByRole("button", { name: "Falar ao selecionar" }).click();
    await dialog.getByRole("button", { name: "Ouvir peça novamente" }).click();
    expect(
      await page.evaluate(() => window.__speechRecorder.calls.length),
    ).toBe(count + 1);
  });
}

test("sensores e atuadores: os 40 nomes e fotos falam a função; filtros param a voz", async ({
  page,
}) => {
  await installSpeech(page);
  await page.goto(sensorPath);
  const root = page.locator(".sensor-actuator-catalog");
  const controls = root.getByRole("group", { name: "Narração das peças" });
  // A select changed before hydration is not replayed by React. Wait for the
  // browser-backed controls before changing the server-rendered filter.
  await expect(
    controls.getByRole("button", { name: "Falar ao selecionar" }),
  ).toBeEnabled();
  expect(await page.evaluate(() => window.__speechRecorder.calls)).toEqual([]);
  await expect(
    controls.getByRole("button", { name: "Ouvir peça novamente" }),
  ).toBeDisabled();
  await root.getByLabel("Conteúdo do catálogo").selectOption("all");
  for (const item of technicalComponents) {
    const card = root.locator(`#${item.id}`);
    await card.getByRole("button", { name: item.name, exact: true }).click();
    await expect(card).toHaveAttribute("data-selected", "true");
    expect(
      await page.evaluate(() => window.__speechRecorder.calls.at(-1)!.text),
    ).toBe(`${item.name}. Função: ${item.function}`);
    await card
      .getByRole("button", {
        name: `Selecionar imagem: ${item.name}`,
        exact: true,
      })
      .click();
    expect(
      await page.evaluate(() => window.__speechRecorder.calls.at(-1)!.text),
    ).toBe(`${item.name}. Função: ${item.function}`);
  }
  await root.getByLabel("Buscar componente").fill("MAP");
  await expect(
    controls.getByRole("button", { name: "Interromper fala" }),
  ).toBeDisabled();
  await expect(
    controls.getByRole("button", { name: "Ouvir peça novamente" }),
  ).toBeDisabled();
  await controls.getByRole("button", { name: "Falar ao selecionar" }).click();
  const count = await page.evaluate(() => window.__speechRecorder.calls.length);
  await root.getByRole("button", { name: "Sensor MAP", exact: true }).click();
  await expect(root.locator("#sensor-map")).toHaveAttribute(
    "data-selected",
    "true",
  );
  expect(await page.evaluate(() => window.__speechRecorder.calls.length)).toBe(
    count,
  );
});

test("atlas: 24 funções distintas, marcadores, esquema e troca de família sem fala automática", async ({
  page,
}) => {
  await installSpeech(page);
  await page.goto(enginePath);
  const root = page.locator(".engine-drawing");
  expect(await page.evaluate(() => window.__speechRecorder.calls)).toEqual([]);
  const components = getEngineComponents(
    engines.find((engine) => engine.family === "M264")!,
  );
  const list = root.locator(".sheet-component-list button");
  await expect(list).toHaveCount(24);
  for (const part of components) {
    await list.nth(part.number - 1).click();
    await expect(root.locator(".sheet-selected strong")).toHaveText(part.label);
    expect(
      await page.evaluate(() => window.__speechRecorder.calls.at(-1)!.text),
    ).toBe(`${part.label}. Função: ${part.description}`);
  }
  const markers = root.locator(".sheet-marker");
  for (let i = 0; i < (await markers.count()); i++) {
    await markers.nth(i).click();
    const number = Number(await markers.nth(i).innerText());
    const part = components[number - 1];
    expect(
      await page.evaluate(() => window.__speechRecorder.calls.at(-1)!.text),
    ).toBe(`${part.label}. Função: ${part.description}`);
  }
  const beforeView = await page.evaluate(
    () => window.__speechRecorder.calls.length,
  );
  await root.getByRole("tab", { name: "Esquema", exact: true }).click();
  expect(await page.evaluate(() => window.__speechRecorder.calls.length)).toBe(
    beforeView,
  );
  await expect(
    root.getByRole("button", { name: "Interromper fala" }),
  ).toBeDisabled();
  for (const part of engineParts) {
    await root
      .getByRole("group", { name: "Peças do esquema" })
      .getByRole("button", { name: part.name, exact: true })
      .click();
    expect(
      await page.evaluate(() => window.__speechRecorder.calls.at(-1)!.text),
    ).toBe(`${part.name}. Função: ${part.text}`);
  }
  await root.locator('svg rect[aria-hidden="true"]').first().click();
  expect(
    await page.evaluate(() => window.__speechRecorder.calls.at(-1)!.text),
  ).toBe(`${engineParts[0].name}. Função: ${engineParts[0].text}`);
  const count = await page.evaluate(() => window.__speechRecorder.calls.length);
  await page.locator(".engine-family-card").first().click();
  expect(await page.evaluate(() => window.__speechRecorder.calls.length)).toBe(
    count,
  );
  await expect(
    root.getByRole("button", { name: "Interromper fala" }),
  ).toBeDisabled();
});

for (const [name, path, selector] of [
  ["sensores", sensorPath, ".sensor-actuator-catalog"],
  ["catálogo ilustrado", catalogPath("hvac"), ".visual-reference-catalog"],
  ["atlas", enginePath, ".engine-drawing"],
] as const) {
  test(`${name}: controles acessíveis nos dois temas e ausência de API mantém o texto`, async ({
    page,
  }, info) => {
    await installSpeech(page);
    await page.goto(path);
    const root = page.locator(selector);
    for (const theme of ["light", "dark"]) {
      const result = await new AxeBuilder({ page })
        .include(`${selector} .part-narration`)
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(
        result.violations.map((item) => ({
          id: item.id,
          targets: item.nodes.map((node) => node.target),
        })),
      ).toEqual([]);
      await root.locator(".part-narration").screenshot({
        path: `test-results/${name}-narration-${info.project.name}-${theme}.png`,
      });
      if (theme === "light")
        await page
          .getByRole("button", { name: "Alternar tema claro e escuro" })
          .click();
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await installSpeech(page, false, true);
    await page.reload();
    await expect(
      root
        .getByRole("group", { name: "Narração das peças" })
        .getByRole("status"),
    ).toContainText("A voz não está disponível");
    await expect(
      root.getByRole("button", { name: "Falar ao selecionar" }),
    ).toBeDisabled();
    if (name === "sensores") {
      await root
        .getByRole("button", { name: "Sensor MAP", exact: true })
        .click();
      await expect(root.locator("#sensor-map")).toHaveAttribute(
        "data-selected",
        "true",
      );
    } else if (name === "atlas") {
      await root.locator(".sheet-component-list button").nth(9).click();
      await expect(root.locator(".sheet-selected strong")).toHaveText("Bielas");
    } else {
      await root
        .getByRole("button", {
          name: `Ver ficha: ${technicalCatalogs.hvac.parts[0].name}`,
          exact: true,
        })
        .click();
      await expect(root.getByRole("dialog")).toBeVisible();
    }
  });
}
