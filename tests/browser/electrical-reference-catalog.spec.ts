import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { installSpeech } from "./support/part-narration";
import { technicalCatalogs } from "../../src/lib/technical-catalogs";

const path =
  process.env.ELECTRICAL_CATALOG_PREVIEW_PATH ||
  "/artigos?catalog=sistema-eletrico-eletronico";
test.beforeEach(async ({ page }) => {
  await installSpeech(page);
  await page.goto(`${path}${path.includes("?") ? "&" : "?"}brand=Fiat`);
  await expect(
    page
      .locator(".electrical-reference-catalog")
      .getByRole("button", { name: "Falar ao selecionar" }),
  ).toBeEnabled();
});

test("Elétrica: 11 imagens, busca, filtros e restauração", async ({ page }) => {
  const root = page.locator(".electrical-reference-catalog");
  await expect(root.locator(".reference-catalog-card")).toHaveCount(11);
  await expect(
    root.locator(".reference-catalog-card .reference-catalog-art").first(),
  ).toHaveCSS("background-image", /electrical-reference\/catalog.webp/);
  await root.getByLabel("Buscar no catálogo").fill("11");
  await expect(root.locator(".reference-catalog-card h3")).toHaveText(
    "Barramentos de distribuição",
  );
  await root.getByLabel("Buscar no catálogo").fill("ground strap");
  await expect(root.locator(".reference-catalog-card h3")).toHaveText(
    "Pontos de aterramento",
  );
  await root
    .getByRole("button", { name: "Limpar filtros do catálogo" })
    .click();
  await root
    .getByRole("combobox", { name: /^Sistema elétrico/ })
    .selectOption("energia");
  await expect(root.locator(".reference-catalog-card")).toHaveCount(3);
  await root.getByLabel("Organizar componentes").selectOption("name");
  await expect(root.locator(".reference-catalog-card h3").first()).toHaveText(
    "Alternador",
  );
  await root.getByLabel("Buscar no catálogo").fill("inexistente987");
  await expect(
    root.getByRole("heading", {
      name: "Nenhuma imagem corresponde aos filtros",
    }),
  ).toBeVisible();
  await root.getByRole("button", { name: "Restaurar filtros" }).click();
  await expect(root.locator(".reference-catalog-card")).toHaveCount(11);
});

test("Elétrica: fichas com voz, cinco chicotes e exemplos de módulos", async ({
  page,
}) => {
  const root = page.locator(".electrical-reference-catalog");
  const opener = root.getByRole("button", {
    name: "Ver ficha: Conectores",
    exact: true,
  });
  await opener.click();
  const dialog = root.getByRole("dialog");
  await expect(dialog.getByRole("img")).toHaveAccessibleName(
    "Ilustração didática gerada: Conectores",
  );
  await expect(dialog).toContainText(
    "selado, multipolar e possuir trava ao mesmo tempo",
  );
  await expect(
    dialog.getByRole("link", { name: "Pesquisar esta peça nas lojas" }),
  ).toHaveAttribute("href", "/pecas?buy=Conectores");
  expect(
    await page.evaluate(() => window.__speechRecorder.calls.at(-1)!.text),
  ).toMatch(/^Conectores\. Função:/);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
  await root
    .getByRole("button", { name: "Conjuntos e funcionamento 9", exact: true })
    .click();
  await expect(root.locator(".reference-catalog-card")).toHaveCount(9);
  for (const name of [
    "Chicote do motor",
    "Chicote da cabine",
    "Chicote das portas",
    "Chicote traseiro",
    "Chicote do teto",
  ])
    await expect(
      root.getByRole("heading", { name, exact: true }),
    ).toBeVisible();
  await root
    .getByRole("button", {
      name: "Ver conjunto: Chicote das portas",
      exact: true,
    })
    .click();
  await expect(dialog).toContainText(
    "Passagem flexível entre porta e carroceria",
  );
  await expect(dialog).toContainText("6. Chicotes elétricos");
  await dialog.getByRole("button", { name: "Fechar ficha ampliada" }).click();
  await root
    .getByRole("button", {
      name: "Ver conjunto: ECUs: motor, ABS, BCM e SRS",
      exact: true,
    })
    .click();
  await expect(dialog).toContainText(
    "SRS: gerenciamento do sistema de retenção suplementar",
  );
  await expect(dialog).toContainText("5. Unidades de comando / ECUs");
  await dialog.getByRole("button", { name: "Fechar ficha ampliada" }).click();
  await expect(
    root.getByRole("button", { name: "Interromper fala" }),
  ).toBeDisabled();
  await expect(
    root.getByRole("link", { name: "Ver conteúdos de elétrica automotiva" }),
  ).toHaveAttribute("href", "/categorias/eletrica-automotiva");
});

test("Elétrica: biblioteca, URL, imagens e acessibilidade nos dois temas", async ({
  page,
}, info) => {
  const root = page.locator(".electrical-reference-catalog"),
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
      path: `test-results/electrical-catalog-${info.project.name}-${theme}.png`,
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
    .getByRole("button", { name: "Ver ficha: Conectores", exact: true })
    .click();
  const modal = await new AxeBuilder({ page })
    .include(".reference-catalog-dialog")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(modal.violations.map((item) => item.id)).toEqual([]);
  await page.keyboard.press("Escape");
  await library
    .getByRole("button", {
      name: "Abrir catálogo Direção elétrica / EPS",
      exact: true,
    })
    .click();
  await expect(
    page.locator(".eps-reference-catalog .reference-catalog-card"),
  ).toHaveCount(17);
  await library
    .getByRole("button", {
      name: "Abrir catálogo Sistema elétrico e eletrônico",
      exact: true,
    })
    .click();
  expect(new URL(page.url()).searchParams.get("catalog")).toBe(
    "sistema-eletrico-eletronico",
  );
  expect(new URL(page.url()).searchParams.get("brand")).toBe("Fiat");
  await page.reload();
  await expect(root.locator(".reference-catalog-card")).toHaveCount(11);
});
