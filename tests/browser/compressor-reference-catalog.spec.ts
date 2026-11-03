import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const path =
  process.env.COMPRESSOR_CATALOG_PREVIEW_PATH || "/artigos?catalog=compressor";

test("compressor mostra as 16 identificações e pesquisa por número, nome e sistema", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(path);
  const root = page.locator(".compressor-reference-catalog");
  await expect(root.locator(".reference-catalog-card")).toHaveCount(16);
  await expect(root.getByRole("status")).toContainText(
    "16 identificações encontradas",
  );
  await root.getByLabel("Buscar no catálogo").fill("1");
  await expect(root.locator(".reference-catalog-card h3")).toHaveText("Polia");
  await root
    .getByRole("button", { name: "Limpar filtros do catálogo" })
    .click();
  await root.getByLabel("Sistema do compressor").selectOption("embreagem");
  await expect(root.locator(".reference-catalog-card")).toHaveCount(4);
  await root.getByLabel("Organizar componentes").selectOption("name");
  await expect(root.locator(".reference-catalog-card h3").first()).toHaveText(
    "Bobina magnética",
  );
  await root
    .getByRole("button", { name: "Limpar filtros do catálogo" })
    .click();
  await root.getByLabel("Buscar no catálogo").fill("eletroima");
  await expect(root.locator(".reference-catalog-card h3")).toHaveText(
    "Bobina magnética",
  );
  await expect(root.getByRole("status")).toContainText(
    "1 identificação encontrada",
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

test("fichas distinguem fluxo de peça física, ampliam imagens e relacionam conjuntos", async ({
  page,
}) => {
  await page.goto(path);
  const root = page.locator(".compressor-reference-catalog");
  await expect(
    root.getByRole("link", { name: "Explorar compressor interativo" }),
  ).toHaveAttribute("href", "/categorias/ar-condicionado/compressor");
  await root.getByLabel("Buscar no catálogo").fill("11");
  const opener = root.getByRole("button", {
    name: "Ver ficha: Fluxo de sucção e descarga",
    exact: true,
  });
  await opener.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("img")).toHaveAccessibleName(
    "Ilustração didática gerada: Fluxo de sucção e descarga",
  );
  await expect(dialog).toContainText("não uma peça de reposição");
  await expect(
    dialog.getByRole("heading", { name: "Leitura da ilustração" }),
  ).toBeVisible();
  await expect(
    dialog.getByRole("link", { name: "Pesquisar esta peça nas lojas" }),
  ).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
  await root.getByLabel("Buscar no catálogo").fill("14");
  await root
    .getByRole("button", {
      name: "Ver ficha: Conexões de sucção e descarga",
      exact: true,
    })
    .click();
  await expect(
    dialog.getByRole("link", { name: "Pesquisar esta peça nas lojas" }),
  ).toHaveAttribute(
    "href",
    "/pecas?buy=Conex%C3%B5es%20de%20suc%C3%A7%C3%A3o%20e%20descarga",
  );
  await dialog.getByRole("button", { name: "Fechar ficha ampliada" }).click();
  await root
    .getByRole("button", { name: "Limpar filtros do catálogo" })
    .click();
  await root
    .getByRole("button", { name: "Conjuntos e funcionamento 5", exact: true })
    .click();
  await expect(root.locator(".reference-catalog-card")).toHaveCount(5);
  await root
    .getByRole("button", {
      name: "Ver conjunto: Funcionamento em corte",
      exact: true,
    })
    .click();
  await expect(dialog).toContainText("Azul: entrada de vapor na sucção");
  await expect(dialog).toContainText("11. Fluxo de sucção e descarga");
  await expect(dialog).toContainText("14. Conexões de sucção e descarga");
});

test("catálogos, imagens locais, URL, responsividade e acessibilidade", async ({
  page,
}, info) => {
  const failures: string[] = [];
  page.on("response", (response) => {
    if (response.url().includes("/images/") && response.status() >= 400)
      failures.push(response.url());
  });
  await page.goto(`${path}${path.includes("?") ? "&" : "?"}brand=Fiat`);
  const library = page.locator(".technical-catalog-library");
  const root = page.locator(".compressor-reference-catalog");
  await expect(
    library
      .getByRole("group", { name: "Escolher catálogo técnico" })
      .getByRole("button"),
  ).toHaveCount(4);
  await expect(root.locator(".reference-catalog-card")).toHaveCount(16);
  await page.screenshot({
    path: `test-results/compressor-catalog-${info.project.name}-overview.png`,
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
  await root.getByLabel("Buscar no catálogo").fill("11");
  await expect(
    root.locator(".reference-catalog-grid .reference-catalog-art"),
  ).toHaveCSS("background-image", /compressor-reference\/components.webp/);
  await root
    .getByRole("button", {
      name: "Ver ficha: Fluxo de sucção e descarga",
      exact: true,
    })
    .click();
  const modal = await new AxeBuilder({ page })
    .include(".reference-catalog-dialog")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(modal.violations.map((item) => item.id)).toEqual([]);
  await page.getByRole("dialog").screenshot({
    path: `test-results/compressor-catalog-${info.project.name}-flow.png`,
  });
  await page.keyboard.press("Escape");
  for (const [name, selector, count, id] of [
    [
      "Módulo Dianteiro",
      ".front-module-reference-catalog",
      20,
      "modulo-dianteiro",
    ],
    ["Mercedes-Benz", ".mercedes-reference-catalog", 24, "mercedes"],
    [
      "Compressor de ar-condicionado",
      ".compressor-reference-catalog",
      16,
      "compressor",
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
    path: `test-results/compressor-catalog-${info.project.name}-assemblies.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(failures).toEqual([]);
});
