import { test, expect } from "@playwright/test";
import { installSpeech } from "./support/part-narration";
import AxeBuilder from "@axe-core/playwright";
import { hvacParts } from "../../src/lib/hvac-parts";
const path =
  process.env.HVAC_VOICE_PREVIEW_PATH || "/categorias/ar-condicionado";
test.setTimeout(120000);

test("WebGL real: lista, etiquetas e malhas falam nome e função sem reprodução automática", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await installSpeech(page, true);
  await page.goto(path);
  const root = page.locator(".hvac-explorer");
  await expect(root).toHaveAttribute("data-renderer", "ready", {
    timeout: 45000,
  });
  await expect(root.locator(".suspension-annotations button")).toHaveCount(13);
  expect(await page.evaluate(() => window.__speechRecorder.calls)).toEqual([]);
  const list = root.getByRole("complementary", {
    name: "Componentes do ar-condicionado",
  });
  for (const part of hvacParts) {
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
  await expect(root.locator(".suspension-detail h3")).toHaveText("Condensador");
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
  const part = hvacParts.find((item) => item.name === name)!;
  expect(
    await page.evaluate(() => window.__speechRecorder.calls.at(-1)!.text),
  ).toBe(`${part.name}. Função: ${part.description}`);
});

test("repetir, interromper, silenciar, erros e cancelamento de falas anteriores", async ({
  page,
}, info) => {
  await installSpeech(page);
  await page.goto(path);
  const root = page.locator(".hvac-explorer"),
    controls = root.getByRole("group", { name: "Narração das peças" });
  const list = root.getByRole("complementary", {
    name: "Componentes do ar-condicionado",
  });
  await expect(root).toHaveAttribute("data-renderer", "fallback");
  await list.getByRole("button").nth(0).click();
  await list.getByRole("button").nth(5).click();
  expect(await page.evaluate(() => window.__speechRecorder.cancellations)).toBe(
    1,
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
  expect(
    await page.evaluate(() => window.__speechRecorder.calls.at(-1)!.text),
  ).toContain("Evaporador. Função:");
  await controls.getByRole("button", { name: "Falar ao selecionar" }).click();
  const count = await page.evaluate(() => window.__speechRecorder.calls.length);
  await list.getByRole("button").nth(1).click();
  await expect(root.locator(".suspension-detail h3")).toHaveText("Condensador");
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
  await controls.getByRole("button", { name: "Ouvir peça novamente" }).click();
  await page.evaluate(() => window.__speechRecorder.fail());
  await expect(controls.getByRole("status")).toContainText(
    "Não foi possível reproduzir",
  );
  await controls.getByRole("button", { name: "Ouvir peça novamente" }).click();
  await page.evaluate(() => window.__speechRecorder.finish());
  await expect(
    controls.getByRole("button", { name: "Interromper fala" }),
  ).toBeDisabled();
  for (const theme of ["light", "dark"]) {
    const result = await new AxeBuilder({ page })
      .include(".hvac-narration")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(result.violations.map((item) => item.id)).toEqual([]);
    await controls.screenshot({
      path: `test-results/hvac-voice-${info.project.name}-${theme}.png`,
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

test("vozes tardias, preferência por português e limpeza ao sair", async ({
  page,
}) => {
  await installSpeech(page);
  await page.goto(path);
  const root = page.locator(".hvac-explorer"),
    controls = root.getByRole("group", { name: "Narração das peças" });
  await page.evaluate(() => {
    window.__speechRecorder.mode = "empty";
  });
  await controls.getByRole("button", { name: "Ouvir peça novamente" }).click();
  expect(
    await page.evaluate(() => window.__speechRecorder.calls.at(-1)),
  ).toMatchObject({ lang: "pt-BR", voice: null });
  await page.evaluate(() => {
    window.__speechRecorder.mode = "pt";
  });
  await controls.getByRole("button", { name: "Ouvir peça novamente" }).click();
  expect(
    await page.evaluate(() => window.__speechRecorder.calls.at(-1)!.voice),
  ).toBe("Portugal");
  await page.evaluate(() => {
    window.__speechRecorder.mode = "br";
  });
  await controls.getByRole("button", { name: "Ouvir peça novamente" }).click();
  expect(
    await page.evaluate(() => window.__speechRecorder.calls.at(-1)!.voice),
  ).toBe("Brasil local");
  const before = await page.evaluate(
    () => window.__speechRecorder.cancellations,
  );
  await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
  expect(await page.evaluate(() => window.__speechRecorder.cancellations)).toBe(
    before + 1,
  );
  await controls.getByRole("button", { name: "Ouvir peça novamente" }).click();
  const beforeNavigation = await page.evaluate(
    () => window.__speechRecorder.cancellations,
  );
  await root.getByRole("link", { name: "Explorar compressor" }).click();
  await expect(page).toHaveURL(/\/categorias\/ar-condicionado\/compressor$/);
  await expect(root).toHaveCount(0);
  expect(await page.evaluate(() => window.__speechRecorder.cancellations)).toBe(
    beforeNavigation + 1,
  );
});

test("sem voz ou WebGL, nomes e funções continuam selecionáveis", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await installSpeech(page, false, true);
  await page.goto(path);
  const root = page.locator(".hvac-explorer"),
    controls = root.getByRole("group", { name: "Narração das peças" });
  await expect(controls.getByRole("status")).toContainText(
    "A voz não está disponível",
  );
  await expect(
    controls.getByRole("button", { name: "Falar ao selecionar" }),
  ).toBeDisabled();
  await expect(root).toHaveAttribute("data-renderer", "fallback");
  await root
    .getByRole("complementary", { name: "Componentes do ar-condicionado" })
    .getByRole("button")
    .nth(12)
    .click();
  await expect(root.locator(".suspension-detail h3")).toHaveText(
    hvacParts[12].name,
  );
  await expect(root.locator(".suspension-detail p")).toHaveText(
    hvacParts[12].description,
  );
  expect(errors).toEqual([]);
});

test("API nativa: clique solicita voz ou informa indisponibilidade sem quebrar seleção", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(path);
  const root = page.locator(".hvac-explorer"),
    controls = root.getByRole("group", { name: "Narração das peças" });
  await root
    .getByRole("complementary", { name: "Componentes do ar-condicionado" })
    .getByRole("button")
    .nth(1)
    .click();
  await expect(root.locator(".suspension-detail h3")).toHaveText("Condensador");
  await expect(controls.getByRole("status")).not.toContainText("Verificando");
  if (
    await controls.getByRole("button", { name: "Interromper fala" }).isEnabled()
  )
    await controls.getByRole("button", { name: "Interromper fala" }).click();
  expect(errors).toEqual([]);
});
