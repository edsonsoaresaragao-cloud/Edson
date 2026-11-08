import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const path = process.env.HVAC_CATALOG_PREVIEW_PATH || "/artigos?catalog=hvac";

test("HVAC mostra 12 imagens e pesquisa por número, nome, sistema e ordem", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(path);
  const root = page.locator(".hvac-reference-catalog");
  await expect(root.locator(".reference-catalog-card")).toHaveCount(12);
  await root.getByLabel("Buscar no catálogo").fill("1");
  await expect(root.locator(".reference-catalog-card h3")).toHaveText(
    "Compressor",
  );
  await root
    .getByRole("button", { name: "Limpar filtros do catálogo" })
    .click();
  await root
    .getByRole("combobox", { name: /Sistema de climatização/ })
    .selectOption("ventilacao");
  await expect(root.locator(".reference-catalog-card")).toHaveCount(4);
  await root.getByLabel("Organizar componentes").selectOption("name");
  await expect(root.locator(".reference-catalog-card h3").first()).toHaveText(
    "Blower / ventilador da cabine",
  );
  await root
    .getByRole("button", { name: "Limpar filtros do catálogo" })
    .click();
  await root.getByLabel("Buscar no catálogo").fill("TXV");
  await expect(root.locator(".reference-catalog-card h3")).toHaveText(
    "Válvula de expansão",
  );
  await expect(root.getByRole("status")).toContainText(
    "1 componente encontrado",
  );
  await root.getByLabel("Buscar no catálogo").fill("inexistente987");
  await expect(
    root.getByRole("heading", {
      name: "Nenhuma imagem corresponde aos filtros",
    }),
  ).toBeVisible();
  await root.getByRole("button", { name: "Restaurar filtros" }).click();
  await expect(root.locator(".reference-catalog-card")).toHaveCount(12);
  expect(errors).toEqual([]);
});

test("fichas distinguem secador/acumulador, mostram esquema e preservam foco", async ({
  page,
}) => {
  await page.goto(path);
  const root = page.locator(".hvac-reference-catalog");
  await expect(
    root.getByRole("link", { name: "Explorar ar-condicionado interativo" }),
  ).toHaveAttribute("href", "/categorias/ar-condicionado");
  await root.getByLabel("Buscar no catálogo").fill("4");
  const opener = root.getByRole("button", {
    name: "Ver ficha: Filtro secador",
    exact: true,
  });
  await opener.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("img")).toHaveAccessibleName(
    "Ilustração didática gerada: Filtro secador",
  );
  await expect(dialog).toContainText("não é equivalente ao receiver-drier");
  await expect(
    dialog.getByRole("link", { name: "Pesquisar esta peça nas lojas" }),
  ).toHaveAttribute("href", "/pecas?buy=Filtro%20secador");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
  await root
    .getByRole("button", { name: "Limpar filtros do catálogo" })
    .click();
  await root
    .getByRole("button", { name: "Conjuntos e fluxos 5", exact: true })
    .click();
  await expect(root.locator(".reference-catalog-card")).toHaveCount(5);
  await root
    .getByRole("button", {
      name: "Ver conjunto: Circuito do refrigerante",
      exact: true,
    })
    .click();
  await expect(dialog.getByRole("img")).toHaveAccessibleName(
    "Esquema didático do circuito: Circuito do refrigerante",
  );
  await expect(dialog.locator(".reference-catalog-art")).toHaveCSS(
    "background-image",
    /refrigerant-cycle.svg/,
  );
  await expect(dialog).toContainText(
    "Evaporador → retorno de vapor ao compressor",
  );
  await dialog.getByRole("button", { name: "Fechar ficha ampliada" }).click();
  await root
    .getByRole("button", {
      name: "Ver conjunto: Caixa HVAC e componentes internos",
      exact: true,
    })
    .click();
  await expect(dialog).toContainText(
    "Aquecedor opcional (contexto, ligado ao arrefecimento)",
  );
});

test("seis catálogos, URL, imagens locais, responsividade e acessibilidade", async ({
  page,
}, info) => {
  const failures: string[] = [];
  page.on("response", (response) => {
    if (response.url().includes("/images/") && response.status() >= 400)
      failures.push(response.url());
  });
  await page.goto(`${path}${path.includes("?") ? "&" : "?"}brand=Fiat`);
  const library = page.locator(".technical-catalog-library");
  const root = page.locator(".hvac-reference-catalog");
  await expect(
    library
      .getByRole("group", { name: "Escolher catálogo técnico" })
      .getByRole("button"),
  ).toHaveCount(6);
  await expect(root.locator(".reference-catalog-card")).toHaveCount(12);
  await page.screenshot({
    path: `test-results/hvac-catalog-${info.project.name}-overview.png`,
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
  await root.getByLabel("Buscar no catálogo").fill("12");
  await expect(
    root.locator(".reference-catalog-grid .reference-catalog-art"),
  ).toHaveCSS("background-image", /hvac-reference\/components.webp/);
  await root
    .getByRole("button", {
      name: "Ver ficha: Portas de serviço / sensores",
      exact: true,
    })
    .click();
  const modal = await new AxeBuilder({ page })
    .include(".reference-catalog-dialog")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(modal.violations.map((item) => item.id)).toEqual([]);
  await page.getByRole("dialog").screenshot({
    path: `test-results/hvac-catalog-${info.project.name}-service.png`,
  });
  await page.keyboard.press("Escape");
  for (const [name, selector, count, id] of [
    [
      "Arrefecimento do motor",
      ".cooling-reference-catalog",
      15,
      "arrefecimento",
    ],
    [
      "Alternador automotivo",
      ".alternator-reference-catalog",
      16,
      "alternador",
    ],
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
    ["Ar-condicionado / HVAC", ".hvac-reference-catalog", 12, "hvac"],
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
  await expect(root.locator(".reference-catalog-card")).toHaveCount(12);
  await expect(root.getByLabel("Buscar no catálogo")).toHaveValue("");
  await root
    .getByRole("button", { name: "Conjuntos e fluxos 5", exact: true })
    .click();
  await expect(root.locator(".reference-catalog-card")).toHaveCount(5);
  const assemblies = await new AxeBuilder({ page })
    .include(".technical-catalog-library")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(assemblies.violations.map((item) => item.id)).toEqual([]);
  await root
    .getByRole("button", {
      name: "Ver conjunto: Circuito do refrigerante",
      exact: true,
    })
    .click();
  await page.getByRole("dialog").screenshot({
    path: `test-results/hvac-catalog-${info.project.name}-circuit.png`,
  });
  await page.keyboard.press("Escape");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(failures).toEqual([]);
});
