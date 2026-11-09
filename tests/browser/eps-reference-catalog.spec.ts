import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { installSpeech } from "./support/part-narration";
import { technicalCatalogs } from "../../src/lib/technical-catalogs";

const path =
  process.env.EPS_CATALOG_PREVIEW_PATH ||
  "/artigos?catalog=direcao-eletrica-eps";
test.beforeEach(async ({ page }) => {
  await installSpeech(page);
  await page.goto(`${path}${path.includes("?") ? "&" : "?"}brand=Fiat`);
  await expect(
    page
      .locator(".eps-reference-catalog")
      .getByRole("button", { name: "Falar ao selecionar" }),
  ).toBeEnabled();
});

test("EPS: 17 imagens, busca por conjunto, filtros e restauração", async ({
  page,
}) => {
  const root = page.locator(".eps-reference-catalog");
  await expect(root.locator(".reference-catalog-card")).toHaveCount(17);
  await expect(
    root.locator(".reference-catalog-card .reference-catalog-art").first(),
  ).toHaveCSS("background-image", /eps-reference\/catalog.webp/);
  await root.getByLabel("Buscar no catálogo").fill("15");
  await expect(root.locator(".reference-catalog-card h3")).toHaveText(
    "Amortecedor e mola McPherson",
  );
  await root.getByLabel("Buscar no catálogo").fill("CV axle");
  await expect(root.locator(".reference-catalog-card h3")).toHaveText(
    "Semieixo",
  );
  await root
    .getByRole("button", { name: "Limpar filtros do catálogo" })
    .click();
  await root.getByLabel("Sistema do módulo EPS").selectOption("assistencia");
  await expect(root.locator(".reference-catalog-card")).toHaveCount(3);
  await root.getByLabel("Organizar componentes").selectOption("name");
  await expect(root.locator(".reference-catalog-card h3").first()).toHaveText(
    "ECU da direção",
  );
  await root.getByLabel("Buscar no catálogo").fill("inexistente987");
  await expect(
    root.getByRole("heading", {
      name: "Nenhuma imagem corresponde aos filtros",
    }),
  ).toBeVisible();
  await root.getByRole("button", { name: "Restaurar filtros" }).click();
  await expect(root.locator(".reference-catalog-card")).toHaveCount(17);
});

test("EPS: fichas com voz, corte da caixa e função dos semieixos", async ({
  page,
}) => {
  const root = page.locator(".eps-reference-catalog");
  const opener = root.getByRole("button", {
    name: "Ver ficha: Sensor de torque",
    exact: true,
  });
  await opener.click();
  const dialog = root.getByRole("dialog");
  await expect(dialog.getByRole("img")).toHaveAccessibleName(
    "Ilustração didática gerada: Sensor de torque",
  );
  await expect(dialog).toContainText(
    "Torque e ângulo são grandezas diferentes",
  );
  await expect(
    dialog.getByRole("link", { name: "Pesquisar esta peça nas lojas" }),
  ).toHaveAttribute("href", "/pecas?buy=Sensor%20de%20torque");
  expect(
    await page.evaluate(() => window.__speechRecorder.calls.at(-1)!.text),
  ).toMatch(/^Sensor de torque\. Função:/);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
  await root
    .getByRole("button", { name: "Conjuntos e funcionamento 7", exact: true })
    .click();
  await expect(root.locator(".reference-catalog-card")).toHaveCount(7);
  await root
    .getByRole("button", {
      name: "Ver conjunto: Subchassi, bandejas e semieixos",
      exact: true,
    })
    .click();
  await expect(dialog).toContainText("não são acionados pelo motor EPS");
  await expect(dialog).toContainText("11. Semieixo");
  await dialog.getByRole("button", { name: "Fechar ficha ampliada" }).click();
  await root
    .getByRole("button", {
      name: "Ver conjunto: Caixa EPS em corte parcial",
      exact: true,
    })
    .click();
  await expect(dialog).toContainText(
    "Outras arquiteturas EPS podem atuar na coluna ou no pinhão",
  );
  await expect(dialog).toContainText("8. Pinhão");
  await dialog.getByRole("button", { name: "Fechar ficha ampliada" }).click();
  await expect(
    root.getByRole("button", { name: "Interromper fala" }),
  ).toBeDisabled();
  await expect(
    root.getByRole("link", { name: "Explorar direção EPS interativa" }),
  ).toHaveAttribute("href", "/categorias/direcao-hidraulica-e-eletrica/eps");
});

test("EPS: biblioteca, URL, imagens e acessibilidade nos dois temas", async ({
  page,
}, info) => {
  const root = page.locator(".eps-reference-catalog"),
    library = page.locator(".technical-catalog-library");
  await expect(
    library
      .getByRole("group", { name: "Escolher catálogo técnico" })
      .getByRole("button"),
  ).toHaveCount(Object.keys(technicalCatalogs).length);
  for (const theme of ["light", "dark"]) {
    const result = await new AxeBuilder({ page })
      .include(".technical-catalog-library")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      result.violations.map((item) => ({
        id: item.id,
        targets: item.nodes.map((node) => node.target),
      })),
    ).toEqual([]);
    await root.screenshot({
      path: `test-results/eps-catalog-${info.project.name}-${theme}.png`,
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
  await root
    .getByRole("button", { name: "Ver ficha: Sensor de torque", exact: true })
    .click();
  const modal = await new AxeBuilder({ page })
    .include(".reference-catalog-dialog")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(modal.violations.map((item) => item.id)).toEqual([]);
  await page.keyboard.press("Escape");
  await library
    .getByRole("button", {
      name: "Abrir catálogo Sistema de freio ABS",
      exact: true,
    })
    .click();
  await expect(
    page.locator(".abs-reference-catalog .reference-catalog-card"),
  ).toHaveCount(8);
  await library
    .getByRole("button", {
      name: "Abrir catálogo Direção elétrica / EPS",
      exact: true,
    })
    .click();
  expect(new URL(page.url()).searchParams.get("catalog")).toBe(
    "direcao-eletrica-eps",
  );
  expect(new URL(page.url()).searchParams.get("brand")).toBe("Fiat");
  await page.reload();
  await expect(root.locator(".reference-catalog-card")).toHaveCount(17);
});
