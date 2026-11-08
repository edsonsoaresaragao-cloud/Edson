import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { installSpeech } from "./support/part-narration";
import { technicalCatalogs } from "../../src/lib/technical-catalogs";

const path =
  process.env.IMMOBILIZER_CATALOG_PREVIEW_PATH ||
  "/artigos?catalog=chave-e-imobilizador";
test.beforeEach(async ({ page }) => {
  await installSpeech(page);
  await page.goto(`${path}${path.includes("?") ? "&" : "?"}brand=Fiat`);
  await expect(
    page
      .locator(".immobilizer-reference-catalog")
      .getByRole("button", { name: "Falar ao selecionar" }),
  ).toBeEnabled();
});

test("imobilizador: nove imagens, busca, sistemas, ordem e estado vazio", async ({
  page,
}) => {
  const root = page.locator(".immobilizer-reference-catalog");
  await expect(root.locator(".reference-catalog-card")).toHaveCount(9);
  await expect(
    root.locator(".reference-catalog-card .reference-catalog-art").first(),
  ).toHaveCSS("background-image", /immobilizer-reference\/catalog.webp/);
  await root.getByLabel("Buscar no catálogo").fill("9");
  await expect(root.locator(".reference-catalog-card h3")).toHaveText(
    "Bobinas / injetores",
  );
  await root.getByLabel("Buscar no catálogo").fill("capsula");
  await expect(root.locator(".reference-catalog-card h3")).toHaveText(
    "Chip transponder",
  );
  await root
    .getByRole("button", { name: "Limpar filtros do catálogo" })
    .click();
  await root.getByLabel("Sistema da partida").selectOption("chave");
  await expect(root.locator(".reference-catalog-card")).toHaveCount(3);
  await root.getByLabel("Organizar componentes").selectOption("name");
  await expect(root.locator(".reference-catalog-card h3").first()).toHaveText(
    "Antena leitora do imobilizador",
  );
  await root.getByLabel("Buscar no catálogo").fill("inexistente987");
  await expect(
    root.getByRole("heading", {
      name: "Nenhuma imagem corresponde aos filtros",
    }),
  ).toBeVisible();
  await root.getByRole("button", { name: "Restaurar filtros" }).click();
  await expect(root.locator(".reference-catalog-card")).toHaveCount(9);
});

test("imobilizador: fichas, voz, reconhecimento e não reconhecimento", async ({
  page,
}) => {
  const root = page.locator(".immobilizer-reference-catalog");
  const opener = root.getByRole("button", {
    name: "Ver ficha: Chip transponder",
    exact: true,
  });
  await opener.click();
  const dialog = root.getByRole("dialog");
  await expect(dialog.getByRole("img")).toHaveAccessibleName(
    "Ilustração didática gerada: Chip transponder",
  );
  await expect(dialog).toContainText("não depende da pilha do controle remoto");
  await expect(
    dialog.getByRole("link", { name: "Pesquisar esta peça nas lojas" }),
  ).toHaveAttribute("href", "/pecas?buy=Chip%20transponder");
  expect(
    await page.evaluate(() => window.__speechRecorder.calls.at(-1)!.text),
  ).toMatch(/^Chip transponder\. Função:/);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
  await root
    .getByRole("button", { name: "Conjuntos e funcionamento 6", exact: true })
    .click();
  await expect(root.locator(".reference-catalog-card")).toHaveCount(6);
  await root
    .getByRole("button", {
      name: "Ver conjunto: Chave não reconhecida",
      exact: true,
    })
    .click();
  await expect(dialog).toContainText(
    "motor gira, mas não entra em funcionamento",
  );
  await expect(dialog).toContainText("5. Módulo imobilizador / BCM");
  await dialog.getByRole("button", { name: "Fechar ficha ampliada" }).click();
  await root
    .getByRole("button", {
      name: "Ver conjunto: Chave reconhecida",
      exact: true,
    })
    .click();
  await expect(dialog).toContainText("demais condições");
  await dialog.getByRole("button", { name: "Fechar ficha ampliada" }).click();
  await expect(
    root.getByRole("button", { name: "Interromper fala" }),
  ).toBeDisabled();
  await expect(
    root.getByRole("link", {
      name: "Explorar partida e imobilizador interativos",
    }),
  ).toHaveAttribute("href", "/categorias/ignicao");
});

test("imobilizador: catálogos, URL, imagens e acessibilidade nos dois temas", async ({
  page,
}, info) => {
  const root = page.locator(".immobilizer-reference-catalog"),
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
      path: `test-results/immobilizer-catalog-${info.project.name}-${theme}.png`,
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
      name: "Ver ficha: Antena leitora do imobilizador",
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
      name: "Abrir catálogo Ignição atual / COP",
      exact: true,
    })
    .click();
  await expect(
    page.locator(".current-ignition-reference-catalog .reference-catalog-card"),
  ).toHaveCount(14);
  await library
    .getByRole("button", {
      name: "Abrir catálogo Chave e imobilizador",
      exact: true,
    })
    .click();
  expect(new URL(page.url()).searchParams.get("catalog")).toBe(
    "chave-e-imobilizador",
  );
  expect(new URL(page.url()).searchParams.get("brand")).toBe("Fiat");
  await page.reload();
  await expect(root.locator(".reference-catalog-card")).toHaveCount(9);
});
