import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { compressorParts } from "../../src/lib/compressor-parts";
import { installSpeech } from "./support/part-narration";
const path =
  process.env.COMPRESSOR_VOICE_PATH || "/categorias/ar-condicionado/compressor";
test.setTimeout(120000);

test("controles de voz, cancelamento, etapas e acessibilidade do compressor", async ({
  page,
}, info) => {
  await installSpeech(page);
  await page.goto(path);
  const root = page.locator(".compressor-explorer");
  const controls = root.getByRole("group", { name: "Narração das peças" });
  const list = root.getByRole("complementary", {
    name: "Componentes do compressor",
  });
  await expect(root).toHaveAttribute("data-renderer", "fallback");
  expect(await page.evaluate(() => window.__speechRecorder.calls)).toEqual([]);
  await list.getByRole("button").nth(7).click();
  await list.getByRole("button").nth(10).click();
  expect(
    await page.evaluate(() => window.__speechRecorder.calls.at(-1)!.text),
  ).toBe(
    `${compressorParts[10].name}. Função: ${compressorParts[10].description}`,
  );
  await page.evaluate(() => window.__speechRecorder.endPrevious());
  await expect(
    controls.getByRole("button", { name: "Interromper fala" }),
  ).toBeEnabled();
  await controls.getByRole("button", { name: "Interromper fala" }).click();
  await expect(
    controls.getByRole("button", { name: "Interromper fala" }),
  ).toBeDisabled();
  await controls.getByRole("button", { name: "Ouvir peça novamente" }).click();
  await controls.getByRole("button", { name: "Falar ao selecionar" }).click();
  const count = await page.evaluate(() => window.__speechRecorder.calls.length);
  await list.getByRole("button").nth(13).click();
  await expect(root.locator(".suspension-detail h3")).toHaveText(
    "Conexões de sucção e descarga",
  );
  expect(await page.evaluate(() => window.__speechRecorder.calls.length)).toBe(
    count,
  );
  await expect(
    controls.getByRole("button", { name: "Ouvir peça novamente" }),
  ).toBeDisabled();
  await controls.getByRole("button", { name: "Falar ao selecionar" }).click();
  expect(await page.evaluate(() => window.__speechRecorder.calls.length)).toBe(
    count,
  );
  await root
    .locator(".hvac-cycle")
    .getByRole("button", { name: "Válvulas", exact: false })
    .click();
  expect(
    await page.evaluate(() => window.__speechRecorder.calls.at(-1)!.text),
  ).toBe(
    `${compressorParts[8].name}. Função: ${compressorParts[8].description}`,
  );
  await page.evaluate(() => window.__speechRecorder.fail());
  await expect(controls.getByRole("status")).toContainText(
    "Não foi possível reproduzir",
  );
  await controls.getByRole("button", { name: "Ouvir peça novamente" }).click();
  const before = await page.evaluate(
    () => window.__speechRecorder.cancellations,
  );
  await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
  expect(await page.evaluate(() => window.__speechRecorder.cancellations)).toBe(
    before + 1,
  );
  await expect(
    controls.getByRole("button", { name: "Interromper fala" }),
  ).toBeDisabled();
  for (const theme of ["light", "dark"]) {
    const result = await new AxeBuilder({ page })
      .include(".compressor-narration")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(result.violations.map((item) => item.id)).toEqual([]);
    await controls.screenshot({
      path: `test-results/compressor-voice-${info.project.name}-${theme}.png`,
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
});

test("compressor sem voz ou WebGL mantém as 16 funções em texto", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await installSpeech(page, false, true);
  await page.goto(path);
  const root = page.locator(".compressor-explorer"),
    controls = root.getByRole("group", { name: "Narração das peças" });
  await expect(root).toHaveAttribute("data-renderer", "fallback");
  await expect(controls.getByRole("status")).toContainText(
    "A voz não está disponível",
  );
  await expect(
    controls.getByRole("button", { name: "Falar ao selecionar" }),
  ).toHaveAttribute("aria-pressed", "false");
  await expect(
    controls.getByRole("button", { name: "Ouvir peça novamente" }),
  ).toBeDisabled();
  const list = root.getByRole("complementary", {
    name: "Componentes do compressor",
  });
  for (const part of compressorParts) {
    await list
      .getByRole("button")
      .nth(part.id - 1)
      .click();
    await expect(root.locator(".suspension-detail h3")).toHaveText(part.name);
    await expect(root.locator(".suspension-detail p")).toHaveText(
      part.description,
    );
  }
  expect(errors).toEqual([]);
});

test("WebGL real: lista, etiquetas e malhas falam nome e função sem reprodução automática", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await installSpeech(page, true);
  await page.goto(path);
  const root = page.locator(".compressor-explorer");
  await expect(root).toHaveAttribute("data-renderer", "ready", {
    timeout: 45000,
  });
  await expect(root.locator(".suspension-annotations button")).toHaveCount(16);
  for (const name of ["Montado", "Corte em funcionamento", "Vista explodida"]) {
    await root.getByRole("button", { name, exact: true }).click();
  }
  await root
    .getByRole("button", { name: "Corte em funcionamento", exact: true })
    .click();
  expect(await page.evaluate(() => window.__speechRecorder.calls)).toEqual([]);
  const list = root.getByRole("complementary", {
    name: "Componentes do compressor",
  });
  for (const part of compressorParts) {
    await list
      .getByRole("button")
      .nth(part.id - 1)
      .click();
    await expect(root.locator(".suspension-detail h3")).toHaveText(part.name);
    expect(
      await page.evaluate(() => window.__speechRecorder.calls.at(-1)),
    ).toMatchObject({
      text: `${part.name}. Função: ${part.description}`,
      lang: "pt-BR",
      voice: "Brasil local",
      rate: 0.95,
    });
  }
  await root.locator(".suspension-annotations button").nth(1).click();
  await expect(root.locator(".suspension-detail h3")).toHaveText(
    "Rolamento da polia",
  );
  const count = await page.evaluate(() => window.__speechRecorder.calls.length);
  await root.locator(".suspension-annotations button").nth(1).click();
  expect(await page.evaluate(() => window.__speechRecorder.calls.length)).toBe(
    count + 1,
  );
  // Projected leader-line anchors locate a visible mesh without bypassing raycasting.
  const point = await root.locator(".suspension-canvas").evaluate((host) => {
    const line = host.querySelector(".suspension-annotations line")!;
    const box = host.getBoundingClientRect();
    host
      .querySelector("canvas")!
      .addEventListener(
        "pointerup",
        () => window.__speechRecorder.pointerUps++,
      );
    return {
      x: box.left + Number(line.getAttribute("x2")),
      y: box.top + Number(line.getAttribute("y2")),
    };
  });
  await root.locator(".suspension-stage").scrollIntoViewIfNeeded();
  // Re-read the anchor after scrolling changes the stage's position.
  const box = await root.locator(".suspension-canvas").boundingBox();
  const offset = await root
    .locator(".suspension-annotations line")
    .first()
    .evaluate((line) => ({
      x: Number(line.getAttribute("x2")),
      y: Number(line.getAttribute("y2")),
    }));
  expect(Number.isFinite(point.x + point.y)).toBe(true);
  await page.mouse.click(box!.x + offset.x, box!.y + offset.y);
  await expect
    .poll(() => page.evaluate(() => window.__speechRecorder.pointerUps))
    .toBe(1);
  await expect
    .poll(() => page.evaluate(() => window.__speechRecorder.calls.length))
    .toBe(count + 2);
  const name = await root.locator(".suspension-detail h3").textContent();
  const part = compressorParts.find((item) => item.name === name)!;
  expect(
    await page.evaluate(() => window.__speechRecorder.calls.at(-1)!.text),
  ).toBe(`${part.name}. Função: ${part.description}`);
});
