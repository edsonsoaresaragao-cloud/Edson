import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { installSpeech } from "./support/part-narration";
import { automaticParts } from "../../src/lib/automatic-transmission-parts";

const path =
  process.env.AUTOMATIC_PREVIEW_PATH || "/categorias/transmissao-automatica";
test.setTimeout(120000);
const rootFor = (page: Page) =>
  page.locator(".automatic-transmission-explorer");
async function visibleStage(page: Page) {
  await rootFor(page).locator(".transmission-stage").scrollIntoViewIfNeeded();
}
async function ready(page: Page, reduced = false) {
  await page.emulateMedia({
    reducedMotion: reduced ? "reduce" : "no-preference",
  });
  await installSpeech(page, true);
  await page.goto(path);
  await expect(rootFor(page)).toHaveAttribute("data-renderer", "ready", {
    timeout: 45000,
  });
  await visibleStage(page);
}
async function angles(page: Page) {
  return rootFor(page)
    .locator(".transmission-canvas")
    .evaluate((host) => {
      const data = (host as HTMLElement).dataset;
      return {
        input: Number(data.inputAngle),
        output: Number(data.outputAngle),
        engine: Number(data.engineAngle),
        turbine: Number(data.turbineAngle),
      };
    });
}

test("automática: P, N, ré, cinco marchas, lock-up e pausa comandam o movimento", async ({
  page,
}) => {
  await ready(page);
  const root = rootFor(page),
    host = root.locator(".transmission-canvas");
  const first = await angles(page);
  await expect
    .poll(async () => (await angles(page)).output)
    .toBeGreaterThan(first.output + 0.015);
  for (const range of ["P", "N"]) {
    await root
      .getByRole("button", { name: new RegExp(`^Selecionar ${range}:`) })
      .click();
    await visibleStage(page);
    await expect(host).toHaveAttribute("data-gear", range);
    const off = await angles(page);
    await expect
      .poll(async () => (await angles(page)).engine)
      .toBeGreaterThan(off.engine + 0.025);
    expect((await angles(page)).output).toBeCloseTo(off.output, 7);
  }
  await root
    .getByRole("button", { name: "Selecionar R: Ré", exact: true })
    .click();
  await visibleStage(page);
  const reverse = await angles(page);
  await expect
    .poll(async () => (await angles(page)).output)
    .toBeLessThan(reverse.output - 0.02);
  await expect(root.locator(".transmission-status")).toContainText(
    "sentido inverso",
  );
  for (const [gear, ratio] of [
    [1, 3.5],
    [2, 1.96],
    [3, 1.4],
    [4, 1],
    [5, 5 / 7],
  ]) {
    await root
      .getByRole("button", {
        name: `Demonstrar ${gear}ª marcha em D`,
        exact: true,
      })
      .click();
    await visibleStage(page);
    await expect(host).toHaveAttribute("data-gear", `D${gear}`);
    const before = await angles(page);
    await expect
      .poll(async () => (await angles(page)).input)
      .toBeGreaterThan(before.input + 0.04);
    const after = await angles(page);
    expect(
      (after.input - before.input) / (after.output - before.output),
    ).toBeCloseTo(ratio, 6);
  }
  await root
    .getByRole("checkbox", { name: "Travamento do conversor (lock-up)" })
    .check();
  await visibleStage(page);
  const lock = await angles(page);
  await expect
    .poll(async () => (await angles(page)).engine)
    .toBeGreaterThan(lock.engine + 0.04);
  const locked = await angles(page);
  expect(locked.turbine - lock.turbine).toBeCloseTo(
    locked.engine - lock.engine,
    7,
  );
  await root.getByRole("button", { name: "Ⅱ Pausar", exact: true }).click();
  const stopped = await angles(page);
  await page.waitForTimeout(180);
  expect(await angles(page)).toEqual(stopped);
  await root.getByRole("slider", { name: /Velocidade da animação/ }).fill("0");
  await root.getByRole("button", { name: "▶ Reproduzir", exact: true }).click();
  await visibleStage(page);
  const zero = await angles(page);
  await page.waitForTimeout(150);
  expect(await angles(page)).toEqual(zero);
});

test("automática: explosão, imagens, etiquetas, foco e câmera com voz", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
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
  await visibleStage(page);
  await root
    .locator(".transmission-stage")
    .screenshot({
      path: `test-results/automatic-exploded-${info.project.name}.png`,
    });
  await root.locator(".suspension-parts>ol>li>button").nth(9).click();
  await expect(detail.locator("h3")).toHaveText(automaticParts[9].name);
  await expect(detail.getByRole("img")).toHaveAccessibleName(
    `Ilustração didática gerada: ${automaticParts[9].name}`,
  );
  const count = await page.evaluate(() => window.__speechRecorder.calls.length);
  await detail
    .getByRole("button", {
      name: `Selecionar imagem: ${automaticParts[9].name}`,
      exact: true,
    })
    .click();
  expect(await page.evaluate(() => window.__speechRecorder.calls.length)).toBe(
    count + 1,
  );
  await root.getByRole("button", { name: "Focar peça", exact: true }).click();
  await expect(
    root.locator(".transmission-annotations button:visible"),
  ).toHaveCount(1);
  await root.locator(".transmission-annotations button:visible").click();
  expect(
    await page.evaluate(() => window.__speechRecorder.calls.at(-1)!.text),
  ).toBe(`${automaticParts[9].name}. Função: ${automaticParts[9].description}`);
  await root
    .getByRole("button", { name: "Mostrar conjunto", exact: true })
    .click();
  await root
    .getByRole("button", { name: "Corte em funcionamento", exact: true })
    .click();
  await visibleStage(page);
  const line = root.locator(".transmission-annotations line").first(),
    x = await line.getAttribute("x2");
  await root
    .getByRole("button", { name: "Aproximar modelo", exact: true })
    .click();
  await expect(line).not.toHaveAttribute("x2", x!);
  await root
    .getByRole("button", { name: "Afastar modelo", exact: true })
    .click();
  await root
    .getByRole("button", { name: "Girar modelo à direita", exact: true })
    .click();
  await root
    .getByRole("button", { name: "Restaurar câmera", exact: true })
    .click();
  for (const button of await root
    .locator(".transmission-power-path button")
    .all()) {
    const before = await page.evaluate(
      () => window.__speechRecorder.calls.length,
    );
    await button.click();
    expect(
      await page.evaluate(() => window.__speechRecorder.calls.length),
    ).toBe(before + 1);
  }
  await root
    .getByRole("button", {
      name: "Conversor de torque em detalhe",
      exact: true,
    })
    .click();
  await expect(
    root.getByRole("button", { name: "Mostrar conjunto", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(detail.locator("h3")).toHaveText("Conversor de torque");
  await visibleStage(page);
  await root
    .locator(".transmission-stage")
    .screenshot({
      path: `test-results/automatic-converter-${info.project.name}.png`,
    });
  await root
    .getByRole("button", {
      name: "Conjunto planetário em detalhe",
      exact: true,
    })
    .click();
  await expect(detail.locator("h3")).toHaveText("Conjunto planetário (1)");
  await visibleStage(page);
  await root
    .locator(".transmission-stage")
    .screenshot({
      path: `test-results/automatic-planetary-${info.project.name}.png`,
    });
  await root
    .getByRole("button", { name: "Corte em funcionamento", exact: true })
    .click();
  await visibleStage(page);
  await root
    .locator(".transmission-stage")
    .screenshot({ path: `test-results/automatic-${info.project.name}.png` });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
  ).toBe(false);
  expect(errors).toEqual([]);
});

test("automática: sem WebGL mantém as 12 fotos, funções e voz, com acessibilidade nos dois temas", async ({
  page,
}) => {
  await installSpeech(page);
  await page.goto(path);
  const root = rootFor(page);
  await expect(root).toHaveAttribute("data-renderer", "fallback");
  await expect(root.locator(".transmission-part-thumbnail")).toHaveCount(12);
  await root
    .getByRole("button", { name: "Vista explodida", exact: true })
    .click();
  await expect(
    root.locator(".transmission-fallback [role=img]"),
  ).toHaveAccessibleName(
    "Ilustração didática gerada: Vista explodida da transmissão automática",
  );
  await root.locator(".suspension-parts>ol>li>button").nth(10).click();
  await expect(root.locator(".transmission-selected-detail h3")).toHaveText(
    "Atuadores / solenoides",
  );
  await root.getByRole("button", { name: "Focar peça", exact: true }).click();
  await expect(
    root.locator(".transmission-fallback [role=img]"),
  ).toHaveAccessibleName("Ilustração didática gerada: Atuadores / solenoides");
  expect(
    await page.evaluate(() => window.__speechRecorder.calls.at(-1)!.text),
  ).toMatch(/^Atuadores \/ solenoides\. Função:/);
  for (const theme of ["light", "dark"]) {
    await page.evaluate(
      (theme) => (document.documentElement.dataset.theme = theme),
      theme,
    );
    expect(
      (
        await new AxeBuilder({ page })
          .include(".automatic-transmission-explorer")
          .analyze()
      ).violations,
    ).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      ),
    ).toBe(false);
  }
});

test("automática: movimento reduzido, reprodução explícita e perda de contexto preservam seleção", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await ready(page, true);
  const root = rootFor(page);
  await expect(
    root.getByRole("button", { name: "▶ Reproduzir", exact: true }),
  ).toBeVisible();
  const before = await angles(page);
  await page.waitForTimeout(150);
  expect(await angles(page)).toEqual(before);
  await root.getByRole("button", { name: "▶ Reproduzir", exact: true }).click();
  await visibleStage(page);
  await expect
    .poll(async () => (await angles(page)).engine)
    .toBeGreaterThan(before.engine + 0.02);
  await root.locator("canvas").evaluate((canvas) => {
    canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
  });
  await expect(root).toHaveAttribute("data-renderer", "fallback");
  await expect(root.locator("canvas")).toHaveCount(0);
  await root.locator(".suspension-parts>ol>li>button").nth(11).click();
  await expect(root.locator(".transmission-selected-detail h3")).toHaveText(
    "Carcaça da transmissão",
  );
  expect(errors).toEqual([]);
  await installSpeech(page, false, true);
  await page.reload();
  await expect(root).toHaveAttribute("data-renderer", "fallback");
  await root.locator(".suspension-parts>ol>li>button").nth(2).click();
  await expect(root.locator(".transmission-selected-detail h3")).toHaveText(
    "Conjunto planetário (1)",
  );
  await expect(root).toContainText("A voz não está disponível neste navegador");
});
