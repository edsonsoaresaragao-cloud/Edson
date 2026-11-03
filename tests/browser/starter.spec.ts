import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { starterParts, starterStages } from "../../src/lib/starter-parts";
const path = process.env.STARTER_PREVIEW_PATH || "/categorias/motor-de-partida";
test.setTimeout(120000);

test("WebGL real: vistas, 11 imagens, isolamento, sequência e acessibilidade", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(path);
  const root = page.locator(".starter-explorer"),
    aside = root.getByRole("complementary", {
      name: "Componentes do motor de partida",
    });
  await expect(root).toHaveAttribute("data-renderer", "ready", {
    timeout: 45000,
  });
  await root.getByRole("button", { name: "Ⅱ Pausar", exact: true }).click();
  await expect(root.locator(".starter-stage canvas")).toHaveCount(1);
  await expect(aside.getByRole("button")).toHaveCount(11);
  await root.getByRole("button", { name: "Montado", exact: true }).click();
  await expect(
    root.getByRole("button", { name: "Montado", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await root
    .getByRole("button", { name: "Corte em funcionamento", exact: true })
    .click();
  await root.locator(".starter-stage").screenshot({
    path: `test-results/starter-${info.project.name}-cutaway.png`,
  });
  await root
    .getByRole("button", { name: "Vista explodida", exact: true })
    .click();
  await root.locator(".starter-stage").screenshot({
    path: `test-results/starter-${info.project.name}-exploded.png`,
  });
  for (const part of starterParts) {
    await aside
      .getByRole("button")
      .nth(part.id - 1)
      .click();
    await expect(root.locator(".starter-selected-detail h3")).toHaveText(
      part.name,
    );
    await expect(
      root.locator(".starter-selected-detail").getByRole("img"),
    ).toHaveAccessibleName(`Ilustração didática gerada: ${part.name}`);
  }
  await root.getByLabel("Isolar peça selecionada").check();
  await expect(root.locator(".starter-annotations button:visible")).toHaveCount(
    1,
  );
  await root.locator(".starter-stage").screenshot({
    path: `test-results/starter-${info.project.name}-isolated.png`,
  });
  for (let index = 0; index < starterStages.length; index++) {
    await root.locator(".starter-steps button").nth(index).click();
    await expect(root.locator(".starter-phase h3")).toHaveText(
      starterStages[index].name,
    );
  }
  await root.locator(".starter-steps button").nth(2).click();
  await expect(root.locator(".starter-signals")).toContainText(
    "Contato de potência fechado",
  );
  await root.locator(".starter-steps button").nth(3).click();
  await expect(root.locator(".starter-signals")).toContainText(
    "Roda livre em sobrevelocidade",
  );
  await expect(root.locator(".starter-signals")).toContainText(
    "Contato de potência aberto",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  for (const theme of ["light", "dark"]) {
    const result = await new AxeBuilder({ page })
      .include(".starter-explorer")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      result.violations.map((item) => ({
        id: item.id,
        nodes: item.nodes.map((node) => node.target),
      })),
    ).toEqual([]);
    if (theme === "light")
      await page
        .getByRole("button", { name: "Alternar tema claro e escuro" })
        .click();
  }
  expect(errors).toEqual([]);
  // Exercise the cleanup/fallback event route while retaining the accessible UI.
  await root
    .locator("canvas")
    .evaluate((canvas) =>
      canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true })),
    );
  await expect(root).toHaveAttribute("data-renderer", "fallback");
  await expect(root.locator("canvas")).toHaveCount(0);
});

test("movimento real altera a imagem e a pausa mantém o quadro", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(path);
  const root = page.locator(".starter-explorer");
  await expect(root).toHaveAttribute("data-renderer", "ready", {
    timeout: 45000,
  });
  await root
    .getByRole("button", { name: "Corte em funcionamento", exact: true })
    .click();
  await root.locator(".starter-steps button").nth(2).click();
  await root.getByRole("slider", { name: /Velocidade didática/ }).press("End");
  const stage = root.locator(".starter-stage");
  const before = await stage.screenshot();
  await root.getByRole("button", { name: "▶ Reproduzir", exact: true }).click();
  await stage.scrollIntoViewIfNeeded();
  // Let real frames run between captures; repeated screenshots can throttle
  // software WebGL on CI. The step callback comes from the animated model.
  await expect(root.locator(".starter-phase h3")).not.toHaveText(
    "Motor em partida",
    { timeout: 45000 },
  );
  await root.getByRole("button", { name: "Ⅱ Pausar", exact: true }).click();
  const still = await stage.screenshot();
  expect(still.equals(before)).toBe(false);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
  expect((await stage.screenshot()).equals(still)).toBe(true);
});

test("sem WebGL mantém desenho, imagens, seleção e etapas manuais", async ({
  page,
}, info) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      value: function (
        this: HTMLCanvasElement,
        type: string,
        ...args: unknown[]
      ) {
        if (["webgl", "webgl2", "experimental-webgl"].includes(type))
          return null;
        return Reflect.apply(original, this, [type, ...args]);
      },
    });
  });
  await page.goto(path);
  const root = page.locator(".starter-explorer");
  await expect(root).toHaveAttribute("data-renderer", "fallback", {
    timeout: 45000,
  });
  await expect(
    root.getByText("Vista 2D interativa:", { exact: false }),
  ).toBeVisible();
  const aside = root.getByRole("complementary", {
    name: "Componentes do motor de partida",
  });
  await aside.getByRole("button").nth(9).click();
  await expect(root.locator(".starter-selected-detail h3")).toHaveText(
    "Escovas de carvão",
  );
  await root.getByRole("button", { name: "Montado", exact: true }).click();
  await root.getByRole("slider", { name: /Separação das peças/ }).press("Home");
  await root
    .getByRole("slider", { name: /Separação das peças/ })
    .press("ArrowRight");
  await expect(
    root.getByRole("slider", { name: /Separação das peças/ }),
  ).toHaveValue("1");
  await root.locator(".starter-steps button").nth(2).click();
  await expect(root.locator(".starter-phase h3")).toHaveText(
    "Motor em partida",
  );
  await root
    .getByRole("button", { name: "Avançar etapa", exact: true })
    .click();
  await expect(root.locator(".starter-phase h3")).toHaveText(
    "Motor pega / roda livre",
  );
  await root.locator(".starter-stage").screenshot({
    path: `test-results/starter-${info.project.name}-fallback.png`,
  });
});
