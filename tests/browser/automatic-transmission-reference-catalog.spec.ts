import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { installSpeech } from "./support/part-narration";
const path =
  process.env.AUTOMATIC_CATALOG_PREVIEW_PATH ||
  "/artigos?catalog=transmissao-automatica";
test.beforeEach(async ({ page }) => {
  await installSpeech(page);
  await page.goto(path);
  await expect(
    page
      .locator(".automatic-transmission-reference-catalog")
      .getByRole("button", { name: "Falar ao selecionar", exact: true }),
  ).toBeEnabled();
});
test("catálogo automático: imagens, busca, sistemas, fichas com voz e vistas detalhadas", async ({
  page,
}) => {
  const root = page.locator(".automatic-transmission-reference-catalog");
  await expect(root.locator(".reference-catalog-card")).toHaveCount(12);
  await expect(
    root.locator(".reference-catalog-card .reference-catalog-art").first(),
  ).toHaveCSS(
    "background-image",
    /automatic-transmission-reference\/catalog.webp/,
  );
  await root.getByLabel("Buscar no catálogo").fill("gerotor");
  await expect(root.locator(".reference-catalog-card h3")).toHaveText(
    "Bomba de óleo",
  );
  await root
    .getByRole("button", { name: "Ver ficha: Bomba de óleo", exact: true })
    .click();
  const dialog = root.getByRole("dialog");
  await expect(dialog).toContainText("continua girando em P e N");
  expect(
    await page.evaluate(() => window.__speechRecorder.calls.at(-1)!.text),
  ).toMatch(/^Bomba de óleo\. Função:/);
  await page.keyboard.press("Escape");
  await root
    .getByRole("button", { name: "Limpar filtros do catálogo" })
    .click();
  await root.getByLabel("Sistema da transmissão").selectOption("planetarios");
  await expect(root.locator(".reference-catalog-card")).toHaveCount(3);
  await root
    .getByRole("button", { name: "Limpar filtros do catálogo" })
    .click();
  await root
    .getByRole("button", { name: "Conjuntos e detalhes 4", exact: true })
    .click();
  await expect(root.locator(".reference-catalog-card")).toHaveCount(4);
  await root
    .getByRole("button", {
      name: "Ver conjunto: Conjunto planetário em detalhe",
      exact: true,
    })
    .click();
  await expect(dialog).toContainText("8. Freios (bandas/discos)");
  await dialog.getByRole("button", { name: "Fechar ficha ampliada" }).click();
  await expect(
    root.getByRole("link", {
      name: "Explorar transmissão automática interativa",
    }),
  ).toHaveAttribute("href", "/categorias/transmissao-automatica");
});
test("catálogo automático: acessibilidade e imagens locais nos dois temas", async ({
  page,
}) => {
  const root = page.locator(".automatic-transmission-reference-catalog");
  const image = await page.request.get(
    "/images/automatic-transmission-reference/catalog.webp",
  );
  expect(image.ok()).toBe(true);
  for (const theme of ["light", "dark"]) {
    await page.evaluate(
      (theme) => (document.documentElement.dataset.theme = theme),
      theme,
    );
    expect(
      (
        await new AxeBuilder({ page })
          .include(".automatic-transmission-reference-catalog")
          .analyze()
      ).violations,
    ).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      ),
    ).toBe(false);
  }
  await root
    .getByRole("button", { name: "Conjuntos e detalhes 4", exact: true })
    .click();
  expect(
    (
      await new AxeBuilder({ page })
        .include(".automatic-transmission-reference-catalog")
        .analyze()
    ).violations,
  ).toEqual([]);
  await expect(root).toContainText(
    "não são especificações de uma caixa comercial",
  );
});
