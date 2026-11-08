import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { installSpeech } from "./support/part-narration";
import { technicalCatalogs } from "../../src/lib/technical-catalogs";

const path =
  process.env.CURRENT_IGNITION_CATALOG_PREVIEW_PATH ||
  "/artigos?catalog=ignicao-atual";
test.beforeEach(async ({ page }) => {
  await installSpeech(page);
  await page.goto(`${path}${path.includes("?") ? "&" : "?"}brand=Fiat`);
  await expect(
    page
      .locator(".current-ignition-reference-catalog")
      .getByRole("button", { name: "Falar ao selecionar" }),
  ).toBeEnabled();
});

test("ignição atual: imagens, números, aliases, filtros, ordem e estado vazio", async ({
  page,
}) => {
  const root = page.locator(".current-ignition-reference-catalog");
  await expect(root.locator(".reference-catalog-card")).toHaveCount(14);
  await expect(
    root.locator(".reference-catalog-card .reference-catalog-art").first(),
  ).toHaveCSS("background-image", /current-ignition-reference\/catalog.webp/);
  await root.getByLabel("Buscar no catálogo").fill("14");
  await expect(root.locator(".reference-catalog-card h3")).toHaveText(
    "Motor e referência de rotação (contexto)",
  );
  await root.getByLabel("Buscar no catálogo").fill("igniter");
  await expect(root.locator(".reference-catalog-card h3")).toHaveText(
    "Driver eletrônico",
  );
  await root
    .getByRole("button", { name: "Limpar filtros do catálogo" })
    .click();
  await root.getByLabel("Sistema da ignição").selectOption("bobina");
  await expect(root.locator(".reference-catalog-card")).toHaveCount(5);
  await root.getByLabel("Organizar componentes").selectOption("name");
  await expect(root.locator(".reference-catalog-card h3").first()).toHaveText(
    "Carcaça da bobina",
  );
  await root.getByLabel("Buscar no catálogo").fill("inexistente987");
  await expect(
    root.getByRole("heading", {
      name: "Nenhuma imagem corresponde aos filtros",
    }),
  ).toBeVisible();
  await root.getByRole("button", { name: "Restaurar filtros" }).click();
  await expect(root.locator(".reference-catalog-card")).toHaveCount(14);
});

test("ignição atual: fichas, voz, contexto e esquema funcional ampliado", async ({
  page,
}) => {
  const root = page.locator(".current-ignition-reference-catalog");
  const opener = root.getByRole("button", {
    name: "Ver ficha: Driver eletrônico",
    exact: true,
  });
  await opener.click();
  const dialog = root.getByRole("dialog");
  await expect(dialog.getByRole("img")).toHaveAccessibleName(
    "Ilustração didática gerada: Driver eletrônico",
  );
  await expect(dialog).toContainText("não gera diretamente a alta tensão");
  await expect(
    dialog.getByRole("link", { name: "Pesquisar esta peça nas lojas" }),
  ).toHaveAttribute("href", "/pecas?buy=Driver%20eletr%C3%B4nico");
  expect(
    await page.evaluate(() => window.__speechRecorder.calls.at(-1)!.text),
  ).toMatch(/^Driver eletrônico\. Função:/);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
  await root
    .getByRole("button", {
      name: "Ver ficha: Motor e referência de rotação (contexto)",
      exact: true,
    })
    .click();
  await expect(dialog).toContainText("não uma peça de reposição");
  await expect(
    dialog.getByRole("link", { name: "Pesquisar esta peça nas lojas" }),
  ).toHaveCount(0);
  await dialog.getByRole("button", { name: "Fechar ficha ampliada" }).click();
  await root
    .getByRole("button", { name: "Conjuntos e funcionamento 6", exact: true })
    .click();
  await expect(root.locator(".reference-catalog-card")).toHaveCount(6);
  await root
    .getByRole("button", {
      name: "Ver conjunto: Bobina em régua / conjunto",
      exact: true,
    })
    .click();
  await expect(dialog).toContainText("Não é automaticamente uma única bobina");
  await dialog.getByRole("button", { name: "Fechar ficha ampliada" }).click();
  await root
    .getByRole("button", {
      name: "Ver conjunto: Sinais, alimentação e alta tensão",
      exact: true,
    })
    .click();
  await expect(dialog.getByRole("img")).toHaveAccessibleName(
    /Esquema funcional didático/,
  );
  await expect(dialog.locator(".reference-catalog-art")).toHaveCSS(
    "background-image",
    /signal-flow.svg/,
  );
  await expect(dialog).toContainText("Azul: comando eletrônico das bobinas");
  await expect(dialog).toContainText("9. Driver eletrônico");
  await dialog.getByRole("button", { name: "Fechar ficha ampliada" }).click();
  await expect(
    root.getByRole("link", { name: "Explorar ignição atual interativa" }),
  ).toHaveAttribute("href", "/categorias/ignicao/atual");
});

test("ignição atual: catálogos, URL, imagens e acessibilidade nos dois temas", async ({
  page,
}, info) => {
  const root = page.locator(".current-ignition-reference-catalog");
  const library = page.locator(".technical-catalog-library");
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
      path: `test-results/current-ignition-catalog-${info.project.name}-${theme}.png`,
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
    .getByRole("button", { name: "Conjuntos e funcionamento 6", exact: true })
    .click();
  await root
    .getByRole("button", {
      name: "Ver conjunto: Sinais, alimentação e alta tensão",
      exact: true,
    })
    .click();
  const modal = await new AxeBuilder({ page })
    .include(".reference-catalog-dialog")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(modal.violations.map((item) => item.id)).toEqual([]);
  await page.keyboard.press("Escape");
  await library
    .getByRole("button", {
      name: "Abrir catálogo Transmissão manual",
      exact: true,
    })
    .click();
  await expect(
    page.locator(
      ".manual-transmission-reference-catalog .reference-catalog-card",
    ),
  ).toHaveCount(13);
  await library
    .getByRole("button", {
      name: "Abrir catálogo Ignição atual / COP",
      exact: true,
    })
    .click();
  expect(new URL(page.url()).searchParams.get("catalog")).toBe("ignicao-atual");
  expect(new URL(page.url()).searchParams.get("brand")).toBe("Fiat");
  await page.reload();
  await expect(root.locator(".reference-catalog-card")).toHaveCount(14);
});
