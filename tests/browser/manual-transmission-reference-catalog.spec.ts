import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { installSpeech } from "./support/part-narration";
import { technicalCatalogs } from "../../src/lib/technical-catalogs";

const path =
  process.env.MANUAL_TRANSMISSION_CATALOG_PREVIEW_PATH ||
  "/artigos?catalog=transmissao-manual";
test.beforeEach(async ({ page }) => {
  await installSpeech(page);
  await page.goto(`${path}${path.includes("?") ? "&" : "?"}brand=Fiat`);
  await expect(
    page
      .locator(".manual-transmission-reference-catalog")
      .getByRole("button", { name: "Falar ao selecionar" }),
  ).toBeEnabled();
});

test("manual: 13 imagens, busca por número e sinônimo, sistemas, ordem e estado vazio", async ({
  page,
}) => {
  const root = page.locator(".manual-transmission-reference-catalog");
  await expect(root.locator(".reference-catalog-card")).toHaveCount(13);
  await expect(
    root.locator(".reference-catalog-card .reference-catalog-art").first(),
  ).toHaveCSS(
    "background-image",
    /manual-transmission-reference\/catalog.webp/,
  );
  await root.getByLabel("Buscar no catálogo").fill("13");
  await expect(root.locator(".reference-catalog-card h3")).toHaveText(
    "Rolamentos",
  );
  await root.getByLabel("Buscar no catálogo").fill("layshaft");
  await expect(root.locator(".reference-catalog-card h3")).toHaveText(
    "Eixo intermediário (contraeixo)",
  );
  await root
    .getByRole("button", { name: "Limpar filtros do catálogo" })
    .click();
  await root.getByLabel("Sistema da transmissão").selectOption("estrutura");
  await expect(root.locator(".reference-catalog-card")).toHaveCount(2);
  await root.getByLabel("Organizar componentes").selectOption("name");
  await expect(root.locator(".reference-catalog-card h3").first()).toHaveText(
    "Carcaça (caixa)",
  );
  await root.getByLabel("Buscar no catálogo").fill("inexistente987");
  await expect(
    root.getByRole("heading", {
      name: "Nenhuma imagem corresponde aos filtros",
    }),
  ).toBeVisible();
  await root.getByRole("button", { name: "Restaurar filtros" }).click();
  await expect(root.locator(".reference-catalog-card")).toHaveCount(13);
});

test("manual: fichas ampliadas, voz, sincronizador, seleção e conjuntos externos", async ({
  page,
}) => {
  const root = page.locator(".manual-transmission-reference-catalog");
  const opener = root.getByRole("button", {
    name: "Ver ficha: Sincronizador",
    exact: true,
  });
  await opener.click();
  const dialog = root.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("img")).toHaveAccessibleName(
    "Ilustração didática gerada: Sincronizador",
  );
  await expect(dialog).toContainText(
    "não confunda o anel de atrito com a luva",
  );
  await expect(
    dialog.getByRole("link", { name: "Pesquisar esta peça nas lojas" }),
  ).toHaveAttribute("href", "/pecas?buy=Sincronizador");
  expect(
    await page.evaluate(() => window.__speechRecorder.calls.at(-1)!.text),
  ).toMatch(/^Sincronizador\. Função:/);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
  await root
    .getByRole("button", { name: "Ver ficha: Tambor seletor", exact: true })
    .click();
  await expect(dialog).toContainText(
    "não está presente em toda caixa manual com padrão H",
  );
  await dialog.getByRole("button", { name: "Fechar ficha ampliada" }).click();
  await root
    .getByRole("button", { name: "Conjuntos e funcionamento 6", exact: true })
    .click();
  await expect(root.locator(".reference-catalog-card")).toHaveCount(6);
  await root
    .getByRole("button", {
      name: "Ver conjunto: Detalhe do sincronizador",
      exact: true,
    })
    .click();
  await expect(dialog).toContainText("6. Sincronizador");
  await expect(dialog).toContainText("7. Luva de engate");
  await dialog.getByRole("button", { name: "Fechar ficha ampliada" }).click();
  await root
    .getByRole("button", {
      name: "Ver conjunto: Sistema de embreagem",
      exact: true,
    })
    .click();
  await expect(dialog).toContainText("Conjunto externo à lista das 13 peças");
  await expect(
    dialog.getByRole("link", { name: "Pesquisar esta peça nas lojas" }),
  ).toHaveCount(0);
  await dialog.getByRole("button", { name: "Fechar ficha ampliada" }).click();
  await root.getByLabel("Buscar no catálogo").fill("pedais");
  await expect(root.locator(".reference-catalog-card h3")).toHaveText(
    "Pedais do veículo",
  );
  await root.getByLabel("Buscar no catálogo").fill("");
  await root.getByLabel("Sistema da transmissão").selectOption("contexto");
  await expect(root.locator(".reference-catalog-card")).toHaveCount(3);
  await expect(
    root.getByRole("link", { name: "Ver conteúdos de transmissão manual" }),
  ).toHaveAttribute("href", "/categorias/transmissao-manual");
});

test("manual: oito catálogos, imagens locais, URL e acessibilidade nos dois temas", async ({
  page,
}, info) => {
  const failures: string[] = [];
  page.on("response", (response) => {
    if (response.url().includes("/images/") && response.status() >= 400)
      failures.push(response.url());
  });
  const root = page.locator(".manual-transmission-reference-catalog");
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
      path: `test-results/manual-transmission-catalog-${info.project.name}-${theme}.png`,
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
    .getByRole("button", {
      name: "Ver ficha: Eixo primário (entrada)",
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
      name: "Abrir catálogo Motor de partida",
      exact: true,
    })
    .click();
  await expect(
    page.locator(".starter-reference-catalog .reference-catalog-card"),
  ).toHaveCount(11);
  await library
    .getByRole("button", {
      name: "Abrir catálogo Transmissão manual",
      exact: true,
    })
    .click();
  expect(new URL(page.url()).searchParams.get("catalog")).toBe(
    "transmissao-manual",
  );
  expect(new URL(page.url()).searchParams.get("brand")).toBe("Fiat");
  await page.reload();
  await expect(root.locator(".reference-catalog-card")).toHaveCount(13);
  expect(failures).toEqual([]);
});
