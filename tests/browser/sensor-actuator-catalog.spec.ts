import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const path =
  process.env.SENSOR_CATALOG_PREVIEW_PATH || "/categorias/sensores-e-atuadores";

test.beforeEach(async ({ page }) => {
  // A failed external reference must still leave a useful, labelled visual.
  await page.route("https://images.openai.com/**", (route) => route.abort());
});

test("busca, tipos, adicionais, sistemas e links de compra", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(path);
  const root = page.locator(".sensor-actuator-catalog");
  await expect(root.locator("article")).toHaveCount(24);
  await root.getByRole("button", { name: "Sensores 12", exact: true }).click();
  await expect(root.locator("article")).toHaveCount(12);
  await root.getByLabel("Buscar componente").fill("pressao coletor");
  await expect(root.locator("article")).toHaveCount(1);
  await expect(
    root.getByRole("heading", { name: "Sensor MAP", exact: true }),
  ).toBeVisible();
  const card = root.locator("#sensor-map");
  await card.locator(".component-reference-visual").scrollIntoViewIfNeeded();
  await expect(card.locator("img")).toHaveCount(0);
  await expect(card.getByRole("img")).toHaveAccessibleName(
    /Ilustração didática gerada: Sensor MAP/,
  );
  await expect(card.locator("figcaption")).toHaveText(
    "Ilustração didática gerada",
  );
  await expect(
    card.getByRole("link", {
      name: "Pesquisar ofertas: Sensor MAP",
      exact: true,
    }),
  ).toHaveAttribute("href", "/pecas?buy=Sensor%20MAP");
  await card.locator("summary").click();
  await expect(
    card.getByRole("link", { name: "Abrir imagem enviada" }),
  ).toHaveAttribute("href", /https:\/\/images.openai.com\//);
  await root
    .getByRole("button", { name: "Limpar filtros do catálogo" })
    .click();
  await root.getByLabel("Conteúdo do catálogo").selectOption("additional");
  await expect(root.locator("article")).toHaveCount(16);
  await root.getByRole("button", { name: "Atuadores 8", exact: true }).click();
  await expect(root.locator("article")).toHaveCount(8);
  await root.getByLabel("Sistema do componente").selectOption("Direção");
  await expect(root.locator("article")).toHaveCount(1);
  await expect(
    root.getByRole("heading", {
      name: "Motor elétrico da direção EPS",
      exact: true,
    }),
  ).toBeVisible();
  await root.getByLabel("Buscar componente").fill("inexistente987");
  await expect(
    root.getByRole("heading", { name: "Nenhum componente encontrado" }),
  ).toBeVisible();
  await root.getByRole("button", { name: "Restaurar catálogo" }).click();
  await root.getByLabel("Conteúdo do catálogo").selectOption("all");
  await expect(root.locator("article")).toHaveCount(40);
  await root.getByRole("button", { name: "Sensores 20", exact: true }).click();
  await expect(root.locator("article")).toHaveCount(20);
  await expect(root.getByRole("status")).toContainText(
    "20 componentes encontrados",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("foto carregada tem legenda própria e falha posterior recupera a ilustração", async ({
  page,
}) => {
  await page.route("https://images.openai.com/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "image/png",
      body: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aXioAAAAASUVORK5CYII=",
        "base64",
      ),
    }),
  );
  await page.goto(path);
  const root = page.locator(".sensor-actuator-catalog");
  await root.getByLabel("Buscar componente").fill("CKP");
  const card = root.locator("#sensor-ckp");
  await card.locator(".component-reference-visual").scrollIntoViewIfNeeded();
  await expect(card.locator("figcaption")).toHaveText(
    "Foto de referência fornecida",
  );
  await expect(card.getByRole("img")).toHaveAccessibleName(
    /Foto de referência: Sensor de rotação/,
  );
  await expect(card.locator(".component-reference-illustration")).toHaveCount(
    0,
  );
  await card
    .locator("img")
    .evaluate((element) => element.dispatchEvent(new Event("error")));
  await expect(card.locator("figcaption")).toHaveText(
    "Ilustração didática gerada",
  );
  await expect(card.locator("img")).toHaveCount(0);
});

test("catálogo acessível em temas claro e escuro, com visual responsivo", async ({
  page,
}, info) => {
  await page.goto(path);
  const root = page.locator(".sensor-actuator-catalog");
  // Keep every photo in this smaller result visible so all failure handlers run.
  await root.getByLabel("Buscar componente").fill("CKP");
  await root
    .locator("#sensor-ckp .component-reference-visual")
    .scrollIntoViewIfNeeded();
  await expect(root.locator("#sensor-ckp img")).toHaveCount(0);
  for (const theme of ["light", "dark"]) {
    const result = await new AxeBuilder({ page })
      .include(".sensor-actuator-catalog")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      result.violations.map((violation) => ({
        id: violation.id,
        nodes: violation.nodes.map((node) => node.target),
      })),
    ).toEqual([]);
    await page.screenshot({
      path: `test-results/sensors-${info.project.name}-${theme}.png`,
      fullPage: true,
    });
    if (theme === "light") {
      await page
        .getByRole("button", { name: "Alternar tema claro e escuro" })
        .click();
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    }
  }
  await root
    .getByRole("button", { name: "Limpar filtros do catálogo" })
    .click();
  await page.screenshot({
    path: `test-results/sensors-${info.project.name}-catalog.png`,
    fullPage: true,
  });
});
