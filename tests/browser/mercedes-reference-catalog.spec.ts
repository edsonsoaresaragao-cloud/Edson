import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const path =
  process.env.MERCEDES_CATALOG_PREVIEW_PATH || "/artigos?catalog=mercedes";

test("catálogo pesquisa, filtra e ordena as 24 peças, preservando números", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(path);
  const root = page.locator(".mercedes-reference-catalog");
  await expect(root.locator(".reference-catalog-card")).toHaveCount(24);
  await root.getByLabel("Buscar no catálogo").fill("20");
  await expect(root.locator(".reference-catalog-card")).toHaveCount(1);
  await expect(
    root.getByRole("heading", {
      name: "Sistema de distribuição por corrente",
      exact: true,
    }),
  ).toBeVisible();
  await root
    .getByRole("button", { name: "Limpar filtros do catálogo" })
    .click();
  await root.getByLabel("Sistema do motor").selectOption("lubrificacao");
  await expect(root.locator(".reference-catalog-card")).toHaveCount(4);
  await root.getByLabel("Organizar componentes").selectOption("name");
  await expect(root.locator(".reference-catalog-card h3").first()).toHaveText(
    "Bomba de óleo",
  );
  await root.getByLabel("Buscar no catálogo").fill("inexistente987");
  await expect(
    root.getByRole("heading", {
      name: "Nenhuma imagem corresponde aos filtros",
    }),
  ).toBeVisible();
  await root.getByRole("button", { name: "Restaurar filtros" }).click();
  await root.getByLabel("Buscar no catálogo").fill("bomba dagua");
  await expect(root.getByRole("status")).toContainText(
    "1 componente encontrado",
  );
  await expect(root.locator(".reference-catalog-card h3")).toHaveText(
    "Bomba d’água",
  );
  expect(errors).toEqual([]);
});

test("ficha amplia a imagem, informa aplicação e devolve o foco ao fechar", async ({
  page,
}) => {
  await page.goto(path);
  const root = page.locator(".mercedes-reference-catalog");
  await root.getByLabel("Buscar no catálogo").fill("21");
  const opener = root.getByRole("button", {
    name: "Ver ficha: Polias e correia de acessórios",
    exact: true,
  });
  await opener.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("heading", {
      name: "Polias e correia de acessórios",
      exact: true,
    }),
  ).toBeVisible();
  await expect(dialog.getByRole("img")).toHaveAccessibleName(
    "Ilustração didática gerada: Polias e correia de acessórios",
  );
  await expect(dialog).toContainText("não uma correia dentada");
  await expect(
    dialog.getByRole("link", { name: "Pesquisar esta peça nas lojas" }),
  ).toHaveAttribute(
    "href",
    "/pecas?buy=Polias%20e%20correia%20de%20acess%C3%B3rios",
  );
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
  await opener.click();
  await dialog.getByRole("button", { name: "Fechar ficha ampliada" }).click();
  await expect(dialog).not.toBeVisible();
  await root
    .getByRole("button", { name: "Limpar filtros do catálogo" })
    .click();
  await root
    .getByRole("button", { name: "Subconjuntos 5", exact: true })
    .click();
  await expect(root.locator(".reference-catalog-card")).toHaveCount(5);
  await root
    .getByRole("button", {
      name: "Ver conjunto: Sistema de arrefecimento",
      exact: true,
    })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Válvula termostática (contexto)",
  );
  await expect(page.getByRole("dialog")).toContainText("24. Bomba d’água");
});

test("imagens locais, layout responsivo e acessibilidade nos dois temas e na ficha", async ({
  page,
}, info) => {
  const failures: string[] = [];
  page.on("response", (response) => {
    if (response.url().includes("/images/") && response.status() >= 400)
      failures.push(response.url());
  });
  await page.goto(path);
  const root = page.locator(".mercedes-reference-catalog");
  await root.getByLabel("Buscar no catálogo").fill("16");
  await expect(root.locator(".reference-catalog-art")).toHaveCSS(
    "background-image",
    /mercedes-reference\/components.webp/,
  );
  for (const theme of ["light", "dark"]) {
    const result = await new AxeBuilder({ page })
      .include(".mercedes-reference-catalog")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      result.violations.map((item) => ({
        id: item.id,
        nodes: item.nodes.map((node) => node.target),
      })),
    ).toEqual([]);
    await page.screenshot({
      path: `test-results/mercedes-catalog-${info.project.name}-${theme}.png`,
      fullPage: true,
    });
    if (theme === "light")
      await page
        .getByRole("button", { name: "Alternar tema claro e escuro" })
        .click();
  }
  await root
    .getByRole("button", { name: "Ver ficha: Turbocompressor", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const modal = await new AxeBuilder({ page })
    .include(".reference-catalog-dialog")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    modal.violations.map((item) => ({
      id: item.id,
      nodes: item.nodes.map((node) => node.target),
    })),
  ).toEqual([]);
  await dialog.screenshot({
    path: `test-results/mercedes-catalog-${info.project.name}-dialog.png`,
  });
  await page.keyboard.press("Escape");
  await root
    .getByRole("button", { name: "Limpar filtros do catálogo" })
    .click();
  await root
    .getByRole("button", { name: "Subconjuntos 5", exact: true })
    .click();
  const assemblies = await new AxeBuilder({ page })
    .include(".mercedes-reference-catalog")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    assemblies.violations.map((item) => ({
      id: item.id,
      nodes: item.nodes.map((node) => node.target),
    })),
  ).toEqual([]);
  await page.screenshot({
    path: `test-results/mercedes-catalog-${info.project.name}-assemblies.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(failures).toEqual([]);
});
