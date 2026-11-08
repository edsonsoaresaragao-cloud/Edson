import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const path =
  process.env.FRONT_CATALOG_PREVIEW_PATH || "/artigos?catalog=modulo-dianteiro";

test("módulo dianteiro mostra 20 imagens e busca por número, nome e sistema", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(path);
  const root = page.locator(".front-module-reference-catalog");
  await expect(root.locator(".reference-catalog-card")).toHaveCount(20);
  await root.getByLabel("Buscar no catálogo").fill("1");
  await expect(root.locator(".reference-catalog-card h3")).toHaveText(
    "Subchassi / agregado",
  );
  await root
    .getByRole("button", { name: "Limpar filtros do catálogo" })
    .click();
  await root.getByLabel("Sistema do módulo").selectOption("direcao");
  await expect(root.locator(".reference-catalog-card")).toHaveCount(2);
  await root.getByLabel("Organizar componentes").selectOption("name");
  await expect(root.locator(".reference-catalog-card h3").first()).toHaveText(
    "Caixa de direção",
  );
  await root
    .getByRole("button", { name: "Limpar filtros do catálogo" })
    .click();
  await root.getByLabel("Buscar no catálogo").fill("trizeta");
  await expect(root.locator(".reference-catalog-card h3")).toHaveText(
    "Junta homocinética interna",
  );
  await root.getByLabel("Buscar no catálogo").fill("inexistente987");
  await expect(
    root.getByRole("heading", {
      name: "Nenhuma imagem corresponde aos filtros",
    }),
  ).toBeVisible();
  await root.getByRole("button", { name: "Restaurar filtros" }).click();
  await expect(root.locator(".reference-catalog-result")).toContainText(
    "20 componentes encontrados",
  );
  expect(errors).toEqual([]);
});

test("fichas ampliadas relacionam peças aos conjuntos e oferecem acesso à suspensão", async ({
  page,
}) => {
  await page.goto(path);
  const root = page.locator(".front-module-reference-catalog");
  await expect(
    root.getByRole("link", { name: "Explorar suspensão interativa" }),
  ).toHaveAttribute("href", "/categorias/suspensao");
  await root.getByLabel("Buscar no catálogo").fill("15");
  const opener = root.getByRole("button", {
    name: "Ver ficha: Pivô da bandeja",
    exact: true,
  });
  await opener.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("img")).toHaveAccessibleName(
    "Ilustração didática gerada: Pivô da bandeja",
  );
  await expect(dialog).toContainText("diferente do cubo de roda do item 7");
  await expect(
    dialog.getByRole("link", { name: "Pesquisar esta peça nas lojas" }),
  ).toHaveAttribute("href", "/pecas?buy=Piv%C3%B4%20da%20bandeja");
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
  await root
    .getByRole("button", { name: "Limpar filtros do catálogo" })
    .click();
  await root
    .getByRole("button", { name: "Conjuntos e localização 5", exact: true })
    .click();
  await expect(root.locator(".reference-catalog-card")).toHaveCount(5);
  await root
    .getByRole("button", {
      name: "Ver conjunto: Sistema de suspensão McPherson",
      exact: true,
    })
    .click();
  await expect(dialog).toContainText("13. Coxim superior do amortecedor");
  await dialog.getByRole("button", { name: "Fechar ficha ampliada" }).click();
  await root
    .getByRole("button", {
      name: "Ver conjunto: Posição do módulo no veículo",
      exact: true,
    })
    .click();
  await expect(dialog).toContainText("Região frontal destacada em laranja");
  await expect(
    dialog.getByRole("heading", { name: "Correspondência no catálogo" }),
  ).toHaveCount(0);
});

test("troca de catálogo preserva parâmetros, carrega imagens e mantém acessibilidade", async ({
  page,
}, info) => {
  const failures: string[] = [];
  page.on("response", (response) => {
    if (response.url().includes("/images/") && response.status() >= 400)
      failures.push(response.url());
  });
  await page.goto(`${path}${path.includes("?") ? "&" : "?"}brand=Fiat`);
  const library = page.locator(".technical-catalog-library");
  const root = page.locator(".front-module-reference-catalog");
  await expect(root.locator(".reference-catalog-card")).toHaveCount(20);
  await page.screenshot({
    path: `test-results/front-catalog-${info.project.name}-overview.png`,
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
  await root.getByLabel("Buscar no catálogo").fill("20");
  await expect(
    root.locator(".reference-catalog-grid .reference-catalog-art"),
  ).toHaveCSS("background-image", /front-module-reference\/components.webp/);
  await root
    .getByRole("button", {
      name: "Ver ficha: Buchas da bandeja e da estabilizadora",
      exact: true,
    })
    .click();
  const modal = await new AxeBuilder({ page })
    .include(".reference-catalog-dialog")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(modal.violations.map((item) => item.id)).toEqual([]);
  await page.getByRole("dialog").screenshot({
    path: `test-results/front-catalog-${info.project.name}-detail.png`,
  });
  await page.keyboard.press("Escape");
  await library
    .getByRole("button", { name: "Abrir catálogo Mercedes-Benz", exact: true })
    .click();
  await expect(
    page.locator(".mercedes-reference-catalog .reference-catalog-card"),
  ).toHaveCount(24);
  expect(new URL(page.url()).searchParams.get("catalog")).toBe("mercedes");
  expect(new URL(page.url()).searchParams.get("brand")).toBe("Fiat");
  await page.reload();
  await expect(
    page.locator(".mercedes-reference-catalog .reference-catalog-card"),
  ).toHaveCount(24);
  await library
    .getByRole("button", {
      name: "Abrir catálogo Módulo Dianteiro",
      exact: true,
    })
    .click();
  await expect(root.locator(".reference-catalog-card")).toHaveCount(20);
  await expect(root.getByLabel("Buscar no catálogo")).toHaveValue("");
  await root
    .getByRole("button", { name: "Conjuntos e localização 5", exact: true })
    .click();
  await expect(root.locator(".reference-catalog-card")).toHaveCount(5);
  const assemblies = await new AxeBuilder({ page })
    .include(".technical-catalog-library")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(assemblies.violations.map((item) => item.id)).toEqual([]);
  await page.screenshot({
    path: `test-results/front-catalog-${info.project.name}-assemblies.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(failures).toEqual([]);
});
