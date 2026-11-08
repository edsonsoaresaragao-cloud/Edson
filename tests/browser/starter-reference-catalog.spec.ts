import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { installSpeech } from "./support/part-narration";
import { technicalCatalogs } from "../../src/lib/technical-catalogs";

const path =
  process.env.STARTER_CATALOG_PREVIEW_PATH ||
  "/artigos?catalog=motor-de-partida";
test.beforeEach(async ({ page }) => {
  await installSpeech(page);
  await page.goto(path);
  await expect(
    page
      .locator(".starter-reference-catalog")
      .getByRole("button", { name: "Falar ao selecionar" }),
  ).toBeEnabled();
});

test("arranque: 11 imagens com busca, número, sistema, ordem e estado vazio", async ({
  page,
}) => {
  const root = page.locator(".starter-reference-catalog");
  await expect(root.locator(".reference-catalog-card")).toHaveCount(11);
  await expect(
    root.locator(".reference-catalog-card .reference-catalog-art").first(),
  ).toHaveCSS("background-image", /starter\/starter-components.webp/);
  await root.getByLabel("Buscar no catálogo").fill("11");
  await expect(root.locator(".reference-catalog-card h3")).toHaveText(
    "Tampa traseira",
  );
  await root.getByLabel("Buscar no catálogo").fill("carvoes");
  await expect(root.locator(".reference-catalog-card h3")).toHaveText(
    "Escovas de carvão",
  );
  await root
    .getByRole("button", { name: "Limpar filtros do catálogo" })
    .click();
  await root.getByLabel("Sistema do arranque").selectOption("estrutura");
  await expect(root.locator(".reference-catalog-card")).toHaveCount(3);
  await root.getByLabel("Organizar componentes").selectOption("name");
  await expect(root.locator(".reference-catalog-card h3").first()).toHaveText(
    "Carcaça dianteira",
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

test("arranque: fichas ampliadas, voz, acesso às lojas e conjuntos de funcionamento", async ({
  page,
}) => {
  const root = page.locator(".starter-reference-catalog");
  const opener = root.getByRole("button", {
    name: "Ver ficha: Pinhão (Bendix)",
    exact: true,
  });
  await opener.click();
  const dialog = root.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("img")).toHaveAccessibleName(
    "Ilustração didática gerada: Pinhão (Bendix)",
  );
  await expect(dialog).toContainText("Inspeção básica:");
  await expect(
    dialog.getByRole("link", { name: "Pesquisar esta peça nas lojas" }),
  ).toHaveAttribute("href", "/pecas?buy=Pinh%C3%A3o%20(Bendix)");
  expect(
    await page.evaluate(() => window.__speechRecorder.calls.at(-1)!.text),
  ).toMatch(/^Pinhão \(Bendix\)\. Função:/);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
  await expect(
    root.getByRole("button", { name: "Interromper fala" }),
  ).toBeDisabled();
  await root
    .getByRole("button", { name: "Conjuntos e funcionamento 5", exact: true })
    .click();
  await expect(root.locator(".reference-catalog-card")).toHaveCount(5);
  await root
    .getByRole("button", {
      name: "Ver conjunto: Acionamento e engrenamento",
      exact: true,
    })
    .click();
  await expect(dialog).toContainText(
    "Coroa do volante: contexto externo ao arranque",
  );
  await expect(dialog).toContainText("2. Pinhão (Bendix)");
  await expect(dialog.locator("figcaption")).toContainText("destaque: pinhão");
  await dialog.getByRole("button", { name: "Fechar ficha ampliada" }).click();
  await root.getByLabel("Buscar no catálogo").fill("potencia");
  await expect(root.locator(".reference-catalog-card h3")).toHaveText(
    "Comando e circuito de potência",
  );
  await expect(
    root.getByRole("link", { name: "Explorar motor de partida interativo" }),
  ).toHaveAttribute("href", "/categorias/motor-de-partida");
});

test("arranque: sete catálogos, URL, imagens e acessibilidade nos dois temas e na ficha", async ({
  page,
}, info) => {
  const root = page.locator(".starter-reference-catalog");
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
      path: `test-results/starter-catalog-${info.project.name}-${theme}.png`,
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
    .getByRole("button", { name: "Ver ficha: Induzido (rotor)", exact: true })
    .click();
  const modal = await new AxeBuilder({ page })
    .include(".reference-catalog-dialog")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(modal.violations.map((item) => item.id)).toEqual([]);
  await page.keyboard.press("Escape");
  await library
    .getByRole("button", {
      name: "Abrir catálogo Ar-condicionado / HVAC",
      exact: true,
    })
    .click();
  await expect(
    page.locator(".hvac-reference-catalog .reference-catalog-card"),
  ).toHaveCount(12);
  await library
    .getByRole("button", {
      name: "Abrir catálogo Motor de partida",
      exact: true,
    })
    .click();
  expect(new URL(page.url()).searchParams.get("catalog")).toBe(
    "motor-de-partida",
  );
  await page.reload();
  await expect(root.locator(".reference-catalog-card")).toHaveCount(11);
});
