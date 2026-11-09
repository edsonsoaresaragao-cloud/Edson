import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { installSpeech } from "./support/part-narration";
import { transmissionParts } from "../../src/lib/manual-transmission-parts";

const path =
  process.env.TRANSMISSION_PREVIEW_PATH || "/categorias/transmissao-manual";
test.setTimeout(120000);
const rootFor = (page: Page) => page.locator(".manual-transmission-explorer");
async function ready(page: Page, reduced = false) {
  await page.emulateMedia({
    reducedMotion: reduced ? "reduce" : "no-preference",
  });
  await installSpeech(page, true);
  await page.goto(path);
  await expect(rootFor(page)).toHaveAttribute("data-renderer", "ready", {
    timeout: 45000,
  });
  await expect(
    rootFor(page).getByRole("button", {
      name: "Falar ao selecionar",
      exact: true,
    }),
  ).toBeEnabled();
  await visibleStage(page);
}
async function angles(page: Page) {
  return rootFor(page)
    .locator(".transmission-canvas")
    .evaluate((host) => ({
      input: Number((host as HTMLElement).dataset.inputAngle),
      output: Number((host as HTMLElement).dataset.outputAngle),
    }));
}
async function visibleStage(page: Page) {
  await rootFor(page).locator(".transmission-stage").scrollIntoViewIfNeeded();
}

test("transmissão: neutro, ré, marcha direta, embreagem e pausa controlam o movimento real", async ({
  page,
}) => {
  await ready(page);
  const root = rootFor(page),
    host = root.locator(".transmission-canvas");
  const initial = await angles(page);
  await expect
    .poll(async () => (await angles(page)).input)
    .toBeGreaterThan(initial.input + 0.02);
  await root
    .getByRole("button", { name: "Selecionar Neutro", exact: true })
    .click();
  await expect(host).toHaveAttribute("data-gear", "N");
  await visibleStage(page);
  const neutral = await angles(page);
  await expect
    .poll(async () => (await angles(page)).input)
    .toBeGreaterThan(neutral.input + 0.03);
  expect((await angles(page)).output).toBeCloseTo(neutral.output, 8);
  await root
    .getByRole("button", { name: "Selecionar Ré", exact: true })
    .click();
  await expect(
    root.getByRole("checkbox", { name: "Embreagem acoplada" }),
  ).not.toBeChecked();
  await root.getByRole("checkbox", { name: "Embreagem acoplada" }).check();
  await expect(host).toHaveAttribute("data-gear", "R");
  await visibleStage(page);
  const reverse = await angles(page);
  await expect
    .poll(async () => (await angles(page)).output)
    .toBeLessThan(reverse.output - 0.02);
  await root
    .getByRole("button", { name: "Selecionar 4ª marcha", exact: true })
    .click();
  await root.getByRole("checkbox", { name: "Embreagem acoplada" }).check();
  await expect(host).toHaveAttribute("data-gear", "4");
  await visibleStage(page);
  const direct = await angles(page);
  await expect
    .poll(async () => (await angles(page)).input)
    .toBeGreaterThan(direct.input + 0.03);
  const after = await angles(page);
  expect(after.input - direct.input).toBeCloseTo(
    after.output - direct.output,
    7,
  );
  await root.getByRole("checkbox", { name: "Embreagem acoplada" }).uncheck();
  await visibleStage(page);
  const off = await angles(page);
  await page.waitForTimeout(180);
  expect(await angles(page)).toEqual(off);
  await root.getByRole("checkbox", { name: "Embreagem acoplada" }).check();
  await root.getByRole("button", { name: "Ⅱ Pausar", exact: true }).click();
  const stopped = await angles(page);
  await page.waitForTimeout(180);
  expect(await angles(page)).toEqual(stopped);
  await expect(root.locator(".transmission-status")).toContainText(
    "Animação pausada",
  );
});

test("transmissão: montagem, explosão, foco, imagem, atalhos e câmera", async ({
  page,
}, info) => {
  await ready(page, true);
  const root = rootFor(page),
    detail = root.locator(".transmission-selected-detail");
  expect(await page.evaluate(() => window.__speechRecorder.calls)).toEqual([]);
  await root.getByRole("button", { name: "Montado", exact: true }).click();
  await expect(
    root.getByRole("button", { name: "Montado", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await root
    .getByRole("button", { name: "Vista explodida", exact: true })
    .click();
  await expect(
    root.getByRole("slider", { name: /Separação das peças/ }),
  ).toHaveValue("100");
  await root.locator(".suspension-parts>ol>li>button").nth(7).click();
  await expect(
    detail.getByRole("heading", { name: "Garfo seletor", exact: true }),
  ).toBeVisible();
  await expect(detail.getByRole("img")).toHaveAccessibleName(
    "Ilustração didática gerada: Garfo seletor",
  );
  const before = await page.evaluate(
    () => window.__speechRecorder.calls.length,
  );
  await detail
    .getByRole("button", {
      name: "Selecionar imagem: Garfo seletor",
      exact: true,
    })
    .click();
  expect(await page.evaluate(() => window.__speechRecorder.calls.length)).toBe(
    before + 1,
  );
  await root.getByRole("button", { name: "Focar peça", exact: true }).click();
  await expect(
    root.locator(".transmission-annotations button:visible"),
  ).toHaveCount(1);
  await root.locator(".transmission-annotations button:visible").click();
  expect(
    await page.evaluate(() => window.__speechRecorder.calls.at(-1)!.text),
  ).toBe(`Garfo seletor. Função: ${transmissionParts[7].description}`);
  await root
    .getByRole("button", { name: "Mostrar conjunto", exact: true })
    .click();
  await root
    .getByRole("button", { name: "Corte em funcionamento", exact: true })
    .click();
  await visibleStage(page);
  const point = root.locator(".transmission-annotations line").first();
  const initial = await point.getAttribute("x2");
  await root
    .getByRole("button", { name: "Aproximar modelo", exact: true })
    .click();
  await expect(point).not.toHaveAttribute("x2", initial!);
  await root
    .getByRole("button", { name: "Girar modelo à direita", exact: true })
    .click();
  await root
    .getByRole("button", { name: "Restaurar câmera", exact: true })
    .click();
  for (const button of await root
    .locator(".transmission-power-path button")
    .all()) {
    const count = await page.evaluate(
      () => window.__speechRecorder.calls.length,
    );
    await button.click();
    expect(
      await page.evaluate(() => window.__speechRecorder.calls.length),
    ).toBe(count + 1);
  }
  await visibleStage(page);
  await root.locator(".transmission-stage").screenshot({
    path: `test-results/manual-transmission-${info.project.name}.png`,
    style: "header{visibility:hidden!important}",
  });
  await expect(
    root.getByRole("link", {
      name: "Ver catálogo completo de transmissão manual ↗",
      exact: true,
    }),
  ).toHaveAttribute("href", "/artigos?catalog=transmissao-manual");
});

test("transmissão: modo sem WebGL conserva fotos, funções, voz e acessibilidade", async ({
  page,
}) => {
  await installSpeech(page);
  await page.goto(path);
  const root = rootFor(page);
  await expect(root).toHaveAttribute("data-renderer", "fallback");
  await expect(root.locator("canvas")).toHaveCount(0);
  await expect(root.locator(".suspension-parts>ol>li>button")).toHaveCount(16);
  await root
    .getByRole("button", { name: "Vista explodida", exact: true })
    .click();
  await expect(root.locator(".transmission-fallback")).toContainText(
    "Referência estática",
  );
  await root.locator(".suspension-parts>ol>li>button").last().click();
  await expect(root.locator(".transmission-selected-detail h3")).toHaveText(
    "Pedais do veículo (contexto)",
  );
  expect(
    await page.evaluate(() => window.__speechRecorder.calls.at(-1)!.text),
  ).toMatch(/^Pedais do veículo \(contexto\)\. Função:/);
  await expect(
    root.getByRole("button", { name: "▶ Reproduzir", exact: true }),
  ).toBeDisabled();
  for (const theme of ["light", "dark"]) {
    const result = await new AxeBuilder({ page })
      .include(".manual-transmission-explorer")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      result.violations.map((violation) => ({
        id: violation.id,
        targets: violation.nodes.map((node) => node.target),
      })),
    ).toEqual([]);
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
});

test("transmissão: movimento reduzido permite reprodução explícita e perda do contexto mantém seleção", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await ready(page, true);
  const root = rootFor(page);
  const still = await angles(page);
  await page.waitForTimeout(160);
  expect(await angles(page)).toEqual(still);
  await root.getByRole("button", { name: "▶ Reproduzir", exact: true }).click();
  await visibleStage(page);
  await expect
    .poll(async () => (await angles(page)).input)
    .toBeGreaterThan(still.input + 0.02);
  await root
    .locator("canvas")
    .evaluate((canvas) =>
      canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true })),
    );
  await expect(root).toHaveAttribute("data-renderer", "fallback");
  await expect(root.locator("canvas")).toHaveCount(0);
  await root.locator(".suspension-parts>ol>li>button").first().click();
  await expect(root.locator(".transmission-selected-detail h3")).toHaveText(
    "Carcaça (caixa)",
  );
  await installSpeech(page, false, true);
  await page.goto(path);
  await expect(root).toHaveAttribute("data-renderer", "fallback");
  await expect(
    root.getByRole("button", { name: "Falar ao selecionar", exact: true }),
  ).toBeDisabled();
  await root.locator(".suspension-parts>ol>li>button").nth(1).click();
  await expect(root.locator(".transmission-selected-detail h3")).toHaveText(
    "Eixo primário (entrada)",
  );
  expect(errors).toEqual([]);
});
