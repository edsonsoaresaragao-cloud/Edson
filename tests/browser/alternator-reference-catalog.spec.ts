import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { technicalCatalogs } from "../../src/lib/technical-catalogs";

const path =
  process.env.ALTERNATOR_CATALOG_PREVIEW_PATH || "/artigos?catalog=alternador";

test("alternador mostra 16 imagens e pesquisa por número, nome, sistema e ordem", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(path);
  const root = page.locator(".alternator-reference-catalog");
  await expect(root.locator(".reference-catalog-card")).toHaveCount(16);
  await root.getByLabel("Buscar no catálogo").fill("1");
  await expect(root.locator(".reference-catalog-card h3")).toHaveText("Polia");
  await root
    .getByRole("button", { name: "Limpar filtros do catálogo" })
    .click();
  await root.getByLabel("Sistema do alternador").selectOption("geracao");
  await expect(root.locator(".reference-catalog-card")).toHaveCount(2);
  await root.getByLabel("Organizar componentes").selectOption("name");
  await expect(root.locator(".reference-catalog-card h3").first()).toHaveText(
    "Estator",
  );
  await root
    .getByRole("button", { name: "Limpar filtros do catálogo" })
    .click();
  await root.getByLabel("Buscar no catálogo").fill("carvoes");
  await expect(root.locator(".reference-catalog-card h3")).toHaveText(
    "Porta-escovas",
  );
  await expect(root.locator(".reference-catalog-result")).toContainText(
    "1 componente encontrado",
  );
  await root.getByLabel("Buscar no catálogo").fill("inexistente987");
  await expect(
    root.getByRole("heading", {
      name: "Nenhuma imagem corresponde aos filtros",
    }),
  ).toBeVisible();
  await root.getByRole("button", { name: "Restaurar filtros" }).click();
  await expect(root.locator(".reference-catalog-card")).toHaveCount(16);
  expect(errors).toEqual([]);
});

test("fichas ampliam imagens, contextualizam a tensão e relacionam conjuntos", async ({
  page,
}) => {
  await page.goto(path);
  const root = page.locator(".alternator-reference-catalog");
  await expect(
    root.getByRole("link", { name: "Explorar alternador interativo" }),
  ).toHaveAttribute("href", "/categorias/alternador");
  await root.getByLabel("Buscar no catálogo").fill("7");
  const opener = root.getByRole("button", {
    name: "Ver ficha: Regulador de tensão",
    exact: true,
  });
  await opener.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("img")).toHaveAccessibleName(
    "Ilustração didática gerada: Regulador de tensão",
  );
  await expect(dialog).toContainText("Não é uma faixa universal");
  await expect(
    dialog.getByRole("link", { name: "Pesquisar esta peça nas lojas" }),
  ).toHaveAttribute("href", "/pecas?buy=Regulador%20de%20tens%C3%A3o");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
  await root
    .getByRole("button", { name: "Limpar filtros do catálogo" })
    .click();
  await root
    .getByRole("button", { name: "Conjuntos e funcionamento 5", exact: true })
    .click();
  await expect(root.locator(".reference-catalog-card")).toHaveCount(5);
  await root
    .getByRole("button", {
      name: "Ver conjunto: Regulação e contato das escovas",
      exact: true,
    })
    .click();
  await expect(dialog).toContainText("Anéis coletores (parte do rotor)");
  await expect(dialog).toContainText("8. Porta-escovas");
  await dialog.getByRole("button", { name: "Fechar ficha ampliada" }).click();
  await root
    .getByRole("button", {
      name: "Ver conjunto: Geração e retificação em corte",
      exact: true,
    })
    .click();
  await expect(dialog).toContainText("Seta dourada: saída CC");
});

test("catálogos, URL, imagens locais, responsividade e acessibilidade", async ({
  page,
}, info) => {
  const failures: string[] = [];
  page.on("response", (response) => {
    if (response.url().includes("/images/") && response.status() >= 400)
      failures.push(response.url());
  });
  await page.goto(`${path}${path.includes("?") ? "&" : "?"}brand=Fiat`);
  const library = page.locator(".technical-catalog-library");
  const root = page.locator(".alternator-reference-catalog");
  await expect(
    library
      .getByRole("group", { name: "Escolher catálogo técnico" })
      .getByRole("button"),
  ).toHaveCount(Object.keys(technicalCatalogs).length);
  await expect(root.locator(".reference-catalog-card")).toHaveCount(16);
  await page.screenshot({
    path: `test-results/alternator-catalog-${info.project.name}-overview.png`,
    fullPage: true,
  });
  for (const theme of ["light", "dark"]) {
    const result = await new AxeBuilder({ page })
      .include(".technical-catalog-library")
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
  await root.getByLabel("Buscar no catálogo").fill("5");
  await expect(
    root.locator(".reference-catalog-grid .reference-catalog-art"),
  ).toHaveCSS("background-image", /alternator-reference\/components.webp/);
  await root
    .getByRole("button", { name: "Ver ficha: Rotor", exact: true })
    .click();
  const modal = await new AxeBuilder({ page })
    .include(".reference-catalog-dialog")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(modal.violations.map((item) => item.id)).toEqual([]);
  await page.getByRole("dialog").screenshot({
    path: `test-results/alternator-catalog-${info.project.name}-rotor.png`,
  });
  await page.keyboard.press("Escape");
  for (const [name, selector, count, id] of [
    [
      "Compressor de ar-condicionado",
      ".compressor-reference-catalog",
      16,
      "compressor",
    ],
    [
      "Módulo Dianteiro",
      ".front-module-reference-catalog",
      20,
      "modulo-dianteiro",
    ],
    ["Mercedes-Benz", ".mercedes-reference-catalog", 24, "mercedes"],
    [
      "Alternador automotivo",
      ".alternator-reference-catalog",
      16,
      "alternador",
    ],
  ] as const) {
    await library
      .getByRole("button", { name: `Abrir catálogo ${name}`, exact: true })
      .click();
    await expect(
      page.locator(`${selector} .reference-catalog-card`),
    ).toHaveCount(count);
    expect(new URL(page.url()).searchParams.get("catalog")).toBe(id);
    expect(new URL(page.url()).searchParams.get("brand")).toBe("Fiat");
  }
  await page.reload();
  await expect(root.locator(".reference-catalog-card")).toHaveCount(16);
  await expect(root.getByLabel("Buscar no catálogo")).toHaveValue("");
  await root
    .getByRole("button", { name: "Conjuntos e funcionamento 5", exact: true })
    .click();
  await expect(root.locator(".reference-catalog-card")).toHaveCount(5);
  const assemblies = await new AxeBuilder({ page })
    .include(".technical-catalog-library")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(assemblies.violations.map((item) => item.id)).toEqual([]);
  await page.screenshot({
    path: `test-results/alternator-catalog-${info.project.name}-assemblies.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(failures).toEqual([]);
});
